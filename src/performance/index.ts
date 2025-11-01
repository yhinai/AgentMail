// @ts-nocheck - TODO: Fix AutoBazaaar types after merge
// Performance Manager - Caching, connection pooling, batch processing
import Redis from 'ioredis';
import config from '../config';

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

interface BatchOptions {
  batchSize?: number;
  concurrency?: number;
}

class CacheManager {
  private redis: Redis;
  private localCache: Map<string, { value: any; expiresAt: number }>;
  private maxSize: number;
  
  constructor(redisConfig: { host: string; port: number; password?: string }, options?: CacheOptions) {
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      maxRetriesPerRequest: 3
    });
    
    this.localCache = new Map();
    this.maxSize = options?.maxSize || 1000;
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Check local cache first
    const local = this.localCache.get(key);
    if (local && Date.now() < local.expiresAt) {
      return local.value as T;
    }
    
    // Check Redis
    try {
      const value = await this.redis.get(key);
      if (value) {
        const parsed = JSON.parse(value);
        // Update local cache
        this.localCache.set(key, {
          value: parsed,
          expiresAt: Date.now() + 3600000 // 1 hour default
        });
        return parsed as T;
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    
    // Set in local cache
    if (this.localCache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) {
        this.localCache.delete(firstKey);
      }
    }
    
    this.localCache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000)
    });
    
    // Set in Redis
    try {
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async delete(key: string): Promise<void> {
    this.localCache.delete(key);
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.localCache.entries()) {
      if (now >= entry.expiresAt) {
        this.localCache.delete(key);
      }
    }
  }
}

class ConnectionPool {
  private pool: any[]; // Simplified pool representation
  private min: number;
  private max: number;
  private idleTimeout: number;
  
  constructor(config: { min: number; max: number; idleTimeoutMillis: number }) {
    this.min = config.min;
    this.max = config.max;
    this.idleTimeout = config.idleTimeoutMillis;
    this.pool = [];
  }
  
  async acquire(): Promise<any> {
    // In production, this would manage actual database connections
    return { id: Date.now() };
  }
  
  async release(conn: any): Promise<void> {
    // Release connection back to pool
  }
  
  async drain(): Promise<void> {
    // Drain all connections
    this.pool = [];
  }
}

class MetricsCollector {
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private memoryUsage: NodeJS.MemoryUsage | null = null;
  
  recordCacheHit(key: string): void {
    this.cacheHits++;
  }
  
  recordCacheMiss(key: string): void {
    this.cacheMisses++;
  }
  
  recordMemoryUsage(usage: NodeJS.MemoryUsage): void {
    this.memoryUsage = usage;
  }
  
  getMetrics(): { cacheHits: number; cacheMisses: number; memoryUsage: NodeJS.MemoryUsage | null } {
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      memoryUsage: this.memoryUsage
    };
  }
}

export class PerformanceManager {
  private cache: CacheManager;
  private connectionPool: ConnectionPool;
  private metrics: MetricsCollector;
  
  constructor() {
    this.cache = new CacheManager(config.redis);
    this.connectionPool = new ConnectionPool({
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000
    });
    this.metrics = new MetricsCollector();
    
    // Periodic cleanup
    setInterval(() => this.cache.cleanup(), 300000); // Every 5 minutes
  }
  
  async getCached<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached) {
      this.metrics.recordCacheHit(key);
      return cached;
    }
    
    const fresh = await fetcher();
    await this.cache.set(key, fresh, ttl);
    this.metrics.recordCacheMiss(key);
    
    return fresh;
  }
  
  async executeWithConnection<T>(operation: (conn: any) => Promise<T>): Promise<T> {
    const conn = await this.connectionPool.acquire();
    
    try {
      return await operation(conn);
    } finally {
      await this.connectionPool.release(conn);
    }
  }
  
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions = {}
  ): Promise<R[]> {
    const batchSize = options.batchSize || 10;
    const concurrency = options.concurrency || 5;
    
    const results: R[] = [];
    const queue = [...items];
    const inProgress = new Set<Promise<R>>();
    
    while (queue.length > 0 || inProgress.size > 0) {
      while (inProgress.size < concurrency && queue.length > 0) {
        const batch = queue.splice(0, batchSize);
        
        const promise = Promise.all(batch.map(processor)).then(batchResults => {
          results.push(...batchResults);
          inProgress.delete(promise as Promise<R>);
          return batchResults;
        }) as Promise<R>;
        
        inProgress.add(promise);
      }
      
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }
    
    return results;
  }
  
  optimizeQuery(query: string): string {
    // Add index hints and optimizations
    if (query.includes('WHERE platform =')) {
      query = query.replace(/FROM opportunities/i, 'FROM opportunities USE INDEX (by_platform)');
    }
    
    if (!query.includes('LIMIT') && !query.includes('limit')) {
      query += ' LIMIT 100';
    }
    
    return query;
  }
  
  async cleanupMemory(): Promise<void> {
    if (global.gc) {
      global.gc();
    }
    
    await this.cache.cleanup();
    await this.connectionPool.drain();
    
    this.metrics.recordMemoryUsage(process.memoryUsage());
  }
  
  getMetrics() {
    return this.metrics.getMetrics();
  }
}

