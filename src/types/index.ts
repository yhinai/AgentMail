// Core type definitions for AutoBazaaar

// ============================================
// Email & Communication Types
// ============================================

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  threadId?: string;
  messageId?: string;
  timestamp: Date;
  attachments?: Array<{
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
  preview?: string;
}

export interface IncomingEmail extends EmailMessage {
  inReplyTo?: string;
  references?: string[];
}

export interface EmailAnalysis {
  intent: 'inquiry' | 'offer' | 'negotiation' | 'closing' | 'other' | 'ACCEPT' | 'COUNTER' | 'REJECT' | 'QUESTION' | 'NEGOTIATE' | 'UNCLEAR';
  product?: string;
  price?: number;
  urgency: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  extractedPrice?: number;
  extractedConcerns?: string[];
  messageExcerpt?: string;
}

export interface ResponseAnalysis extends EmailAnalysis {
  urgencyLevel?: string;
  decisionFactors?: string[];
  negotiationStyle?: string;
}

// ============================================
// Opportunity & Market Research Types
// ============================================

export interface SearchParams {
  platforms?: string[];
  categories?: string[];
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  itemsPerPlatform?: number;
  minProfit?: number;
  minProfitMargin?: number;
  maxRisk?: number;
  minDemand?: number;
}

export interface ScrapedItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  description?: string;
  url: string;
  images: string[];
  location?: string;
  seller: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    rating?: number;
    responseTime?: string;
    platform?: string;
  };
  condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  category: string;
  platform: string;
  listingDate: Date;
  views?: number;
  watchers?: number;
  shipping?: string;
}

export interface MarketData {
  averagePrice: number;
  pricePoints: number[];
  volatility: number;
  demandScore: number;
  competitorCount: number;
  insights: string[];
}

export interface ProfitAnalysis {
  purchasePrice: number;
  estimatedSalePrice: number;
  profitPotential: number;
  profitMargin: number;
  roi: number;
  platformFees: number;
  netProfit: number;
}

export interface RiskAssessment {
  score: number;
  factors: string[];
  recommendation: string;
}

export interface EnrichedOpportunity extends ScrapedItem {
  marketData?: MarketData;
  profitAnalysis?: ProfitAnalysis;
  riskAssessment?: RiskAssessment;
  profitScore: number;
  enrichedAt: Date;
}

export interface DealAnalysis {
  opportunity: EnrichedOpportunity;
  recommendation: {
    action: 'BUY' | 'NEGOTIATE' | 'PASS';
    confidence: number;
    maxPrice: number;
    reasoning: string[];
  };
  profitMargin: number;
  sellerProfile?: SellerProfile;
}

export interface SellerProfile {
  type: 'business' | 'individual';
  responseRate?: number;
  averageDiscount?: number;
  preferredCommunicationStyle?: string;
}

// ============================================
// Negotiation Types
// ============================================

export interface NegotiationStrategy {
  name: string;
  buyerPersona: string;
  communicationTone: string;
  approachStyle: string;
  tactics: string[];
  openingOffer: number; // Multiplier (0-1)
  maxOffer: number; // Multiplier (0-1)
  incrementSize: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  maxRounds: number;
  followUpDelay: number;
  maxFollowUps: number;
  creativity?: number;
  templateName: string;
}

export type StrategyType = 'FRIENDLY_LOCAL' | 'PROFESSIONAL_BUYER' | 'URGENT_CASH' | 'COLLECTOR';

export interface NegotiationRound {
  number: number;
  timestamp: Date;
  type: 'initial_offer' | 'counter' | 'counter_response' | 'accept' | 'reject' | 'follow_up';
  ourOffer?: number;
  theirOffer?: number;
  message?: string;
  response?: string;
  messageId?: string;
  status: string;
  responseTime?: number;
  sentiment?: string;
  intent?: string;
  concerns?: string[];
}

export interface NegotiationThread {
  id: string;
  opportunityId: string;
  strategy: string;
  sellerContact: {
    email: string;
    name?: string;
    phone?: string;
    platform: string;
  };
  rounds: NegotiationRound[];
  status: 'active' | 'accepted' | 'rejected' | 'expired' | 'abandoned';
  currentOffer: number;
  maxAcceptable: number;
  finalPrice?: number;
  savingsAchieved?: number;
  metrics: {
    responseTime: number | null;
    openTime: number | null;
    clickCount: number;
  };
  followUpCount?: number;
  lastResponseTime?: Date;
}

export interface NegotiationResult {
  success: boolean;
  threadId: string;
  initialOffer: number;
  strategy: string;
}

export interface SellerHistory {
  email: string;
  interactions: any[];
  responseRate: number;
  averageDiscount: number;
  preferredCommunicationStyle?: string;
}

export interface SellerContact {
  email: string;
  name?: string;
  phone?: string;
  platform: string;
}

// ============================================
// Inventory & Listing Types
// ============================================

export interface Product {
  id: string;
  title: string;
  description: string;
  cost: number;
  targetPrice: number;
  category?: string;
  images?: string[];
  condition: 'new' | 'like-new' | 'used' | 'refurbished';
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  opportunityId?: string;
  negotiationId?: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  sku?: string;
  images: string[];
  processedImages?: Array<{
    url: string;
    size: 'thumbnail' | 'medium' | 'large';
    width: number;
    height: number;
  }>;
  purchasePrice: number;
  purchasePlatform: string;
  purchaseDate: number;
  seller: {
    id: string;
    name?: string;
    contact?: string;
  };
  location: 'in_transit' | 'warehouse' | 'listed' | 'sold';
  storageLocation?: string;
  status: 'pending_delivery' | 'in_stock' | 'listed' | 'sold' | 'returned';
  acquiredAt: number;
  listedAt?: number;
  soldAt?: number;
}

export interface Listing {
  id: string;
  inventoryId: string;
  platform: string;
  platformListingId: string;
  url: string;
  title: string;
  description: string;
  price: number;
  shippingPrice?: number;
  images: string[];
  status: 'draft' | 'active' | 'paused' | 'sold' | 'expired' | 'removed';
  visibility: 'public' | 'private' | 'scheduled';
  metrics: {
    views: number;
    watchers: number;
    saves: number;
    inquiries: number;
    clicks: number;
  };
  lastOptimized?: number;
  optimizationScore?: number;
  suggestedPrice?: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface ListingResults {
  success: string[];
  failed: string[];
  urls: Record<string, string>;
}

// ============================================
// Transaction Types
// ============================================

export interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'fee' | 'refund' | 'adjustment';
  category: 'inventory' | 'platform_fee' | 'shipping' | 'return';
  inventoryId?: string;
  listingId?: string;
  negotiationId?: string;
  amount: number;
  currency: string;
  fees?: {
    platform: number;
    payment: number;
    shipping: number;
    other: number;
    total: number;
  };
  netAmount: number;
  counterparty?: {
    type: 'buyer' | 'seller' | 'platform';
    id: string;
    name?: string;
    email?: string;
  };
  paymentMethod?: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  platform: string;
  platformTransactionId?: string;
  status: string;
  createdAt: number;
  completedAt?: number;
  taxAmount?: number;
  notes?: string;
}

// ============================================
// Event System Types
// ============================================

export enum SystemEvents {
  // Discovery Events
  OPPORTUNITY_FOUND = 'opportunity.found',
  OPPORTUNITY_ANALYZED = 'opportunity.analyzed',
  OPPORTUNITY_EXPIRED = 'opportunity.expired',
  
  // Negotiation Events
  NEGOTIATION_STARTED = 'negotiation.started',
  NEGOTIATION_RESPONSE = 'negotiation.response',
  NEGOTIATION_ACCEPTED = 'negotiation.accepted',
  NEGOTIATION_REJECTED = 'negotiation.rejected',
  NEGOTIATION_COUNTER = 'negotiation.counter',
  
  // Transaction Events
  PURCHASE_INITIATED = 'purchase.initiated',
  PURCHASE_COMPLETED = 'purchase.completed',
  PURCHASE_FAILED = 'purchase.failed',
  
  // Listing Events
  LISTING_CREATED = 'listing.created',
  LISTING_UPDATED = 'listing.updated',
  LISTING_SOLD = 'listing.sold',
  
  // System Events
  AGENT_ERROR = 'agent.error',
  RATE_LIMIT_HIT = 'system.rateLimit',
  MEMORY_UPDATE = 'memory.update'
}

export interface EventPayload<T = any> {
  eventId: string;
  eventType: SystemEvents;
  timestamp: number;
  source: string;
  data: T;
  metadata?: Record<string, any>;
}

// ============================================
// Queue & Job Types
// ============================================

export interface JobOptions {
  priority?: 'high' | 'normal' | 'low';
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export interface JobContext {
  jobId: string;
  attemptNumber: number;
  maxAttempts: number;
  queue: string;
  timestamp: number;
  updateProgress: (progress: number) => void;
  log: (message: string) => void;
}

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  metrics?: any;
}

// ============================================
// Orchestrator Types
// ============================================

export interface OrchestratorConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  browserUse: any;
  perplexity: any;
  mlModel?: any;
  historicalData?: any;
  agentMail: any;
  openai: any;
  hyperspell: any;
  composio: any;
  imageOptimizer?: any;
  queueConcurrency?: Record<string, number>;
  scanInterval?: number;
  priceUpdateInterval?: number;
  negotiationCheckInterval?: number;
  listingOptimizeInterval?: number;
  targetCategories?: string[];
  targetPlatforms?: string[];
  maxBudget?: number;
  minProfitMargin?: number;
}

export interface OrchestratorState {
  status: 'initializing' | 'running' | 'paused' | 'stopped' | 'error';
  activeAgents: Map<string, any>;
  runningTasks: Map<string, any>;
  performance: {
    tasksCompleted: number;
    tasksFailure: number;
    avgResponseTime: number;
    uptime: number;
  };
}

export interface AgentError {
  agent: string;
  message: string;
  retryable: boolean;
  attempts: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  jobType?: string;
  jobData?: any;
}

// ============================================
// Metrics & Analytics Types
// ============================================

export interface Metrics {
  dealsCompleted: number;
  totalProfit: number;
  totalRevenue: number;
  conversionRate: number;
  averageResponseTime: number;
  averageNegotiationRounds: number;
  activeListings: number;
  emailsProcessed: number;
  lastUpdated: Date;
}

export interface PeriodMetrics {
  period: 'hour' | 'day' | 'week' | 'month';
  timestamp: number;
  date: string;
  discovery: {
    opportunitiesFound: number;
    opportunitiesAnalyzed: number;
    opportunitiesApproved: number;
    avgProfitScore: number;
  };
  negotiation: {
    started: number;
    completed: number;
    successful: number;
    avgRounds: number;
    avgResponseTime: number;
    avgDiscount: number;
  };
  sales: {
    listed: number;
    sold: number;
    avgTimeToSell: number;
    avgSalePrice: number;
  };
  financial: {
    totalSpent: number;
    totalRevenue: number;
    totalProfit: number;
    totalFees: number;
    roi: number;
    profitMargin: number;
  };
  efficiency: {
    automationRate: number;
    errorRate: number;
    avgProcessingTime: number;
  };
}

// ============================================
// Buyer Profile Types
// ============================================

export interface BuyerProfile {
  email: string;
  purchaseHistory: Transaction[];
  priceSensitivity: 'low' | 'medium' | 'high';
  negotiationStyle: 'aggressive' | 'cooperative' | 'passive';
  communicationPreference: 'brief' | 'detailed' | 'friendly';
  conversionProbability: number;
  lastInteraction?: Date;
  totalSpent: number;
  averageDiscount: number;
}

export interface InteractionRecord {
  buyer: string;
  intent: string;
  product: string;
  timestamp: Date;
  outcome?: 'closed' | 'abandoned' | 'ongoing';
  finalPrice?: number;
}

// ============================================
// Legacy Types (keeping for compatibility)
// ============================================

// Legacy Transaction type matching TransactionSchema
export interface LegacyTransaction {
  id: string;
  buyerEmail: string;
  product: string;
  productId: string;
  initialPrice: number;
  finalPrice: number;
  cost: number;
  profit: number;
  status: 'negotiating' | 'completed' | 'cancelled' | 'refunded';
  createdAt: Date;
  completedAt?: Date;
  negotiationRounds: number;
  listingUrls: string[];
}

export interface Strategy {
  initialPrice: number;
  minAcceptable: number;
  negotiationRounds: number;
  tactics: string[];
  closingIncentives: string[];
  tone: 'friendly' | 'professional' | 'urgent';
  flexibility: number;
  closeAttempt: boolean;
  pricePoint: number;
}

export interface NegotiationState {
  id: string;
  buyerEmail: string;
  product: string;
  threadId: string;
  currentPrice: number;
  initialPrice: number;
  minPrice: number;
  rounds: number;
  offers: Array<{
    price: number;
    from: 'buyer' | 'seller';
    timestamp: Date;
  }>;
  status: 'negotiating' | 'accepted' | 'rejected' | 'closed';
  listingUrls: string[];
  agreedPrice?: number;
}

export interface ResponseStrategy {
  tone: 'friendly' | 'professional' | 'urgent';
  pricePoint: number;
  flexibility: number;
  incentives: string[];
  closeAttempt: boolean;
}

// ============================================
// Search & Task Types
// ============================================

export interface SearchTask {
  platform: string;
  category: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  limit: number;
}

export interface CachedResult {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface RiskFactors {
  volatility: number;
  demandScore: number;
  profitMargin: number;
  platform: string;
  sellerRating?: number;
}
