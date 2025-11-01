// Core type definitions for ProfitPilot

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  timestamp: Date;
  attachments?: Array<{
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
}

export interface EmailAnalysis {
  intent: 'inquiry' | 'offer' | 'negotiation' | 'closing' | 'other';
  product?: string;
  price?: number;
  urgency: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

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

export interface Strategy {
  initialPrice: number;
  minAcceptable: number;
  negotiationRounds: number;
  tactics: string[];
  closingIncentives: string[];
  tone: 'friendly' | 'professional' | 'urgent';
  flexibility: number; // 0-1
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

export interface Listing {
  id: string;
  productId: string;
  platform: 'craigslist' | 'facebook' | 'ebay' | 'mercari' | 'offerup';
  url: string;
  price: number;
  status: 'active' | 'sold' | 'removed' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
}

export interface Transaction {
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

export interface MarketData {
  productName: string;
  average: number;
  median: number;
  optimal: number;
  min: number;
  max: number;
  demand: 'low' | 'medium' | 'high';
  trend: 'rising' | 'stable' | 'falling';
  competitorCount: number;
  timestamp: Date;
}

export interface Metrics {
  dealsCompleted: number;
  totalProfit: number;
  totalRevenue: number;
  conversionRate: number;
  averageResponseTime: number; // milliseconds
  averageNegotiationRounds: number;
  activeListings: number;
  emailsProcessed: number;
  lastUpdated: Date;
}

export interface ListingResults {
  success: string[];
  failed: string[];
  urls: Record<string, string>;
}

export interface ResponseStrategy {
  tone: 'friendly' | 'professional' | 'urgent';
  pricePoint: number;
  flexibility: number;
  incentives: string[];
  closeAttempt: boolean;
}

export interface InteractionRecord {
  buyer: string;
  intent: string;
  product: string;
  timestamp: Date;
  outcome?: 'closed' | 'abandoned' | 'ongoing';
  finalPrice?: number;
}
