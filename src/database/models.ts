// Convex database schemas and models

export interface TransactionSchema {
  _id: string;
  _creationTime: number;
  buyerEmail: string;
  product: string;
  productId: string;
  initialPrice: number;
  finalPrice: number;
  cost: number;
  profit: number;
  status: 'negotiating' | 'completed' | 'cancelled' | 'refunded';
  completedAt?: number;
  negotiationRounds: number;
  listingUrls: string[];
}

export interface ProductSchema {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  cost: number;
  targetPrice: number;
  category?: string;
  images?: string[];
  condition: 'new' | 'like-new' | 'used' | 'refurbished';
}

export interface BuyerProfileSchema {
  _id: string;
  _creationTime: number;
  email: string;
  priceSensitivity: 'low' | 'medium' | 'high';
  negotiationStyle: 'aggressive' | 'cooperative' | 'passive';
  communicationPreference: 'brief' | 'detailed' | 'friendly';
  totalSpent: number;
  averageDiscount: number;
  lastInteraction?: number;
}

export interface NegotiationStateSchema {
  _id: string;
  _creationTime: number;
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
    timestamp: number;
  }>;
  status: 'negotiating' | 'accepted' | 'rejected' | 'closed';
  listingUrls: string[];
  agreedPrice?: number;
}

export interface MetricsSchema {
  _id: string;
  _creationTime: number;
  dealsCompleted: number;
  totalProfit: number;
  totalRevenue: number;
  conversionRate: number;
  averageResponseTime: number;
  averageNegotiationRounds: number;
  activeListings: number;
  emailsProcessed: number;
  lastUpdated: number;
}
