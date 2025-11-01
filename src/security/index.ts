// Security Manager - Rate limiting, encryption, validation, XSS prevention
import rateLimit from 'express-rate-limit';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import jwt from 'jsonwebtoken';

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

class RateLimiter {
  private limits: Map<string, { count: number; resetAt: number }>;
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: any) => string;
  
  constructor(config: RateLimiterConfig) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
    this.keyGenerator = config.keyGenerator || ((req) => req.ip || 'unknown');
    this.limits = new Map();
    
    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), 60000);
  }
  
  async check(identifier: string): Promise<boolean> {
    const now = Date.now();
    const limit = this.limits.get(identifier);
    
    if (!limit || now > limit.resetAt) {
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs
      });
      return true;
    }
    
    if (limit.count >= this.maxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.limits.entries()) {
      if (now > value.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor(key?: string) {
    this.key = key 
      ? Buffer.from(key, 'hex')
      : Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-that-should-be-changed-in-production-32chars!', 'utf8').subarray(0, 32);
  }
  
  async encrypt(data: string): Promise<string> {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    });
  }
  
  async decrypt(encryptedData: string): Promise<string> {
    const data = JSON.parse(encryptedData);
    const iv = Buffer.from(data.iv, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  async hash(data: string): Promise<string> {
    return createHash('sha256').update(data).digest('hex');
  }
}

class AuthenticationService {
  private jwtSecret: string;
  private tokenExpiry: string;
  
  constructor(config: { jwtSecret: string; tokenExpiry: string }) {
    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET || 'default-secret';
    this.tokenExpiry = config.tokenExpiry;
  }
  
  /**
   * Generate a JWT token for a user
   * @param payload - The data to include in the token
   * @returns The signed JWT token
   */
  generateToken(payload: { userId?: string; email?: string; [key: string]: any }): string {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpiry,
      algorithm: 'HS256'
    });
  }
  
  /**
   * Validate and decode a JWT token
   * @param token - The JWT token to validate
   * @returns The decoded token payload or null if invalid
   */
  async validateToken(token: string): Promise<any | null> {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256']
      });
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Decode a token without verification (for debugging)
   * @param token - The JWT token to decode
   * @returns The decoded token payload
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}

class AuditLogger {
  private logs: Array<{ action: string; data: any; timestamp: Date }>;
  
  constructor() {
    this.logs = [];
  }
  
  log(entry: { action: string; service?: string; success?: boolean; error?: string; input?: any; timestamp?: Date }): void {
    this.logs.push({
      action: entry.action,
      data: entry,
      timestamp: entry.timestamp || new Date()
    });
    
    // Keep last 10000 logs
    if (this.logs.length > 10000) {
      this.logs.shift();
    }
    
    // In production, this would write to database
    console.log(`[AUDIT] ${entry.action}`, entry);
  }
}

export class SecurityManager {
  private rateLimit: RateLimiter;
  private encryption: EncryptionService;
  private auth: AuthenticationService;
  private audit: AuditLogger;
  
  constructor() {
    this.rateLimit = new RateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      keyGenerator: (req) => req.ip || 'unknown'
    });
    
    this.encryption = new EncryptionService();
    
    this.auth = new AuthenticationService({
      jwtSecret: process.env.JWT_SECRET || 'default-secret',
      tokenExpiry: '24h'
    });
    
    this.audit = new AuditLogger();
  }
  
  async validateAPIKey(key: string, service: string): Promise<boolean> {
    const hashedKey = await this.encryption.hash(key);
    // In production, compare with stored keys in database
    const isValid = key.length > 0; // Simplified validation
    
    await this.audit.log({
      action: 'api_key_validation',
      service,
      success: isValid,
      timestamp: new Date()
    });
    
    return isValid;
  }
  
  /**
   * Generate a JWT token for authentication
   * @param payload - User data to include in token
   * @returns JWT token string
   */
  generateToken(payload: { userId?: string; email?: string; [key: string]: any }): string {
    return this.auth.generateToken(payload);
  }
  
  /**
   * Validate a JWT token from request
   * @param token - JWT token string
   * @returns Decoded token payload
   */
  async validateToken(token: string): Promise<any> {
    return await this.auth.validateToken(token);
  }
  
  /**
   * Express middleware to verify JWT token from Authorization header
   */
  jwtMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = await this.validateToken(token);
        
        // Attach user info to request object
        req.user = decoded;
        next();
      } catch (error: any) {
        return res.status(401).json({ error: error.message || 'Invalid token' });
      }
    };
  }
  
  async checkRateLimit(identifier: string): Promise<boolean> {
    return await this.rateLimit.check(identifier);
  }
  
  async encryptSensitiveData(data: any): Promise<string> {
    return await this.encryption.encrypt(JSON.stringify(data));
  }
  
  async decryptSensitiveData(encrypted: string): Promise<any> {
    const decrypted = await this.encryption.decrypt(encrypted);
    return JSON.parse(decrypted);
  }
  
  validateInput<T>(input: any, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(input);
    } catch (error: any) {
      this.audit.log({
        action: 'input_validation_failed',
        error: error.message,
        input: this.sanitizeForLog(input)
      });
      throw new Error(`Invalid input: ${error.message}`);
    }
  }
  
  sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target']
    });
  }
  
  private sanitizeForLog(input: any): any {
    // Remove sensitive fields from logs
    if (typeof input === 'object' && input !== null) {
      const sanitized = { ...input };
      const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'creditCard'];
      
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '***REDACTED***';
        }
      }
      
      return sanitized;
    }
    
    return input;
  }
  
  getExpressRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
  }
}

