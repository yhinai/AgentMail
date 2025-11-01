// Core Entity Types

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  images?: string[];
  condition: 'new' | 'like-new' | 'used' | 'refurbished';
  createdAt: Date;
}

export interface Buyer {
  id?: string;
  email: string;
  name?: string;
  phone?: string;
  preferences?: BuyerPreferences;
  negotiationStyle?: 'aggressive' | 'cooperative' | 'price-sensitive' | 'unknown';
  purchaseHistory?: Transaction[];
  averageResponseTime?: number;
  lastContact?: Date;
}

export interface BuyerPreferences {
  priceSensitivity: number; // 0-1 scale
  communicationStyle: 'formal' | 'casual' | 'brief';
  preferredContactTime?: string[];
  previousInteractions: number;
}

export interface Transaction {
  id: string;
  buyerEmail: string;
  buyerId?: string;
  product: string;
  productId?: string;
  status: TransactionStatus;
  initialPrice: number;
  finalPrice?: number;
  cost: number;
  profit?: number;
  negotiationRounds: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  listingUrls?: Record<string, string>;
}

export type TransactionStatus = 
  | 'negotiating' 
  | 'pending' 
  | 'completed' 
  | 'cancelled' 
  | 'expired';

// Email Types

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  threadId?: string;
  receivedAt: Date;
  isRead: boolean;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  url?: string;
}

export interface EmailAnalysis {
  intent: EmailIntent;
  product?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  priceMentioned?: number;
  urgency: number; // 0-1 scale
  closingSignals: string[];
  keywords: string[];
}

export type EmailIntent = 
  | 'inquiry' 
  | 'negotiation' 
  | 'offer' 
  | 'acceptance' 
  | 'rejection' 
  | 'question' 
  | 'complaint' 
  | 'other';

export interface ResponseStrategy {
  tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  pricePoint: number;
  minAcceptable: number;
  flexibility: number; // 0-1 scale (how flexible on price)
  incentives: string[];
  closeAttempt: boolean;
  negotiationRounds: number;
  tactics: NegotiationTactic[];
}

export type NegotiationTactic = 
  | 'scarcity' 
  | 'social-proof' 
  | 'urgency' 
  | 'value-add' 
  | 'bundle' 
  | 'free-shipping';

// Market Intelligence Types

export interface MarketData {
  average: number;
  median: number;
  optimal: number;
  demand: number; // 0-1 scale
  competitorPrices: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-1 scale
}

// Listing Types

export interface Listing {
  id: string;
  productId: string;
  platform: ListingPlatform;
  url?: string;
  status: ListingStatus;
  views?: number;
  inquiries?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ListingPlatform = 
  | 'craigslist' 
  | 'facebook' 
  | 'ebay' 
  | 'mercari' 
  | 'offerup';

export type ListingStatus = 
  | 'draft' 
  | 'active' 
  | 'pending' 
  | 'sold' 
  | 'expired' 
  | 'removed';

export interface ListingResults {
  success: ListingPlatform[];
  failed: ListingPlatform[];
  urls: Record<ListingPlatform, string>;
  errors?: Record<ListingPlatform, string>;
}

// Memory/Context Types

export interface BuyerProfile {
  email: string;
  negotiationHistory: NegotiationHistory[];
  preferredPriceRange?: { min: number; max: number };
  negotiationStyle: 'aggressive' | 'cooperative' | 'price-sensitive' | 'unknown';
  conversionProbability: number; // 0-1 scale
  averageResponseTime?: number;
  lastInteraction?: Date;
  totalInteractions: number;
  successfulDeals: number;
}

export interface NegotiationHistory {
  product: string;
  initialAsk: number;
  finalPrice?: number;
  rounds: number;
  tactics: NegotiationTactic[];
  outcome: 'closed' | 'abandoned' | 'expired';
  timestamp: Date;
}

export interface Interaction {
  buyer: string;
  intent: EmailIntent;
  product?: string;
  timestamp: Date;
  responseTime?: number;
  outcome?: 'positive' | 'neutral' | 'negative';
}

// Metrics Types

export interface Metrics {
  totalProfit: number;
  dealsCompleted: number;
  dealsPending: number;
  averageProfitMargin: number;
  conversionRate: number;
  averageResponseTime: number; // in seconds
  emailsProcessed: number;
  listingsActive: number;
  totalRevenue: number;
  lastUpdated: Date;
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type ActivityType = 
  | 'email_received' 
  | 'email_sent' 
  | 'listing_created' 
  | 'negotiation_started' 
  | 'deal_closed' 
  | 'price_updated' 
  | 'error';

// Demo Types

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
  duration: number; // in seconds
}

export interface DemoStep {
  id: string;
  action: string;
  description: string;
  delay: number; // milliseconds before next step
  data?: any;
}

// Negotiation Types

export interface NegotiationState {
  buyerEmail: string;
  product: string;
  initialPrice: number;
  agreedPrice: number;
  cost: number;
  rounds: number;
  tactics?: NegotiationTactic[];
  listingUrls?: Record<string, string>;
}

// Configuration Types

export interface AgentConfig {
  emailCheckInterval: number; // milliseconds
  marketAnalysisInterval: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  maxNegotiationRounds: number;
  minProfitMargin: number; // 0-1 scale
}

// Error Types

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

