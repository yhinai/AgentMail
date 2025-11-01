// Convex schema definitions and types
// Replace with actual Convex schema when setting up Convex

import {
  Transaction,
  Product,
  Buyer,
  Metrics,
  ActivityLog,
  TransactionStatus,
} from '../types';

// Convex document types
export interface TransactionDocument extends Transaction {
  _id?: string;
  _creationTime?: number;
}

export interface ProductDocument extends Product {
  _id?: string;
  _creationTime?: number;
}

export interface BuyerDocument extends Buyer {
  _id?: string;
  _creationTime?: number;
}

export interface MetricsDocument extends Metrics {
  _id?: string;
  _creationTime?: number;
}

export interface ActivityLogDocument extends ActivityLog {
  _id?: string;
  _creationTime?: number;
}

// Schema definition (for Convex schema.ts file)
export const schema = {
  transactions: {
    buyerEmail: 'string',
    buyerId: 'optional<string>',
    product: 'string',
    productId: 'optional<string>',
    status: 'string',
    initialPrice: 'number',
    finalPrice: 'optional<number>',
    cost: 'number',
    profit: 'optional<number>',
    negotiationRounds: 'number',
    createdAt: 'number',
    updatedAt: 'number',
    completedAt: 'optional<number>',
    listingUrls: 'optional<object>',
  },
  products: {
    title: 'string',
    description: 'string',
    price: 'number',
    cost: 'number',
    category: 'string',
    images: 'optional<array<string>>',
    condition: 'string',
    createdAt: 'number',
  },
  buyers: {
    email: 'string',
    name: 'optional<string>',
    phone: 'optional<string>',
    preferences: 'optional<object>',
    negotiationStyle: 'optional<string>',
    averageResponseTime: 'optional<number>',
    lastContact: 'optional<number>',
  },
  metrics: {
    totalProfit: 'number',
    dealsCompleted: 'number',
    dealsPending: 'number',
    averageProfitMargin: 'number',
    conversionRate: 'number',
    averageResponseTime: 'number',
    emailsProcessed: 'number',
    listingsActive: 'number',
    totalRevenue: 'number',
    lastUpdated: 'number',
  },
  activityLogs: {
    type: 'string',
    description: 'string',
    timestamp: 'number',
    metadata: 'optional<object>',
  },
};

