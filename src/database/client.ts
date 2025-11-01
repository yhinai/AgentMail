// Convex database client for ProfitPilot
import { ConvexHttpClient } from 'convex/browser';
import {
  TransactionSchema,
  ProductSchema,
  BuyerProfileSchema,
  NegotiationStateSchema,
} from './models';
import type { Transaction, Product, BuyerProfile, NegotiationState, Metrics } from '../types';
// Import Convex API functions
import { api } from '../../convex/_generated/api';

export class DatabaseClient {
  private client: ConvexHttpClient | null;
  private convexUrl: string;

  constructor() {
    this.convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || '';
    if (!this.convexUrl) {
      console.warn('Convex URL not configured. Using mock mode.');
      this.client = null;
    } else {
      this.client = new ConvexHttpClient(this.convexUrl);
    }
  }

  // Transaction operations
  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    if (!this.convexUrl || !this.client) {
      // Mock implementation when Convex not configured
      const now = Date.now();
      const transaction: TransactionSchema = {
        _id: this.generateId(),
        _creationTime: now,
        buyerEmail: data.buyerEmail,
        product: data.product,
        productId: data.productId,
        initialPrice: data.initialPrice,
        finalPrice: data.finalPrice,
        cost: data.cost,
        profit: data.profit,
        status: data.status,
        negotiationRounds: data.negotiationRounds,
        listingUrls: data.listingUrls,
        completedAt: data.completedAt ? new Date(data.completedAt).getTime() : undefined,
      };
      return this.schemaToTransaction(transaction);
    }

    // Real Convex mutation
    const transactionId = await this.client.mutation(api.functions.createTransaction, {
      buyerEmail: data.buyerEmail,
      product: data.product,
      productId: data.productId,
      initialPrice: data.initialPrice,
      finalPrice: data.finalPrice,
      cost: data.cost,
      profit: data.profit,
      status: data.status,
      negotiationRounds: data.negotiationRounds,
      listingUrls: data.listingUrls,
      completedAt: data.completedAt ? new Date(data.completedAt).getTime() : undefined,
    });

    const transaction = await this.client.query(api.functions.getTransaction, { id: transactionId });
    if (!transaction) {
      throw new Error('Failed to create transaction');
    }
    return this.schemaToTransaction(transaction as TransactionSchema);
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    if (!this.convexUrl || !this.client) {
      return null;
    }
    const transaction = await this.client.query(api.functions.getTransaction, { id: id as any });
    return transaction ? this.schemaToTransaction(transaction as TransactionSchema) : null;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    if (!this.convexUrl || !this.client) {
      throw new Error('Convex not configured');
    }
    await this.client.mutation(api.functions.updateTransaction, {
      id: id as any,
      updates: {
        status: updates.status,
        finalPrice: updates.finalPrice,
        profit: updates.profit,
        completedAt: updates.completedAt ? new Date(updates.completedAt).getTime() : undefined,
      },
    });
    const updated = await this.getTransaction(id);
    if (!updated) {
      throw new Error('Transaction not found');
    }
    return updated;
  }

  async getTransactionsByBuyer(email: string): Promise<Transaction[]> {
    if (!this.convexUrl || !this.client) {
      return [];
    }
    const transactions = await this.client.query(api.functions.getTransactionsByBuyer, { email });
    return transactions.map((t: any) => this.schemaToTransaction(t as TransactionSchema));
  }

  // Product operations
  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    if (!this.convexUrl || !this.client) {
      // Mock implementation
      const product: ProductSchema = {
        _id: this.generateId(),
        _creationTime: Date.now(),
        title: data.title,
        description: data.description,
        cost: data.cost,
        targetPrice: data.targetPrice,
        category: data.category,
        images: data.images,
        condition: data.condition,
      };
      return this.schemaToProduct(product);
    }

    const productId = await this.client.mutation(api.functions.createProduct, {
      title: data.title,
      description: data.description,
      cost: data.cost,
      targetPrice: data.targetPrice,
      category: data.category,
      images: data.images,
      condition: data.condition,
    });

    const product = await this.client.query(api.functions.getProduct, { id: productId });
    if (!product) {
      throw new Error('Failed to create product');
    }
    return this.schemaToProduct(product as ProductSchema);
  }

  async getProduct(id: string): Promise<Product | null> {
    if (!this.convexUrl || !this.client) {
      return null;
    }
    const product = await this.client.query(api.functions.getProduct, { id: id as any });
    return product ? this.schemaToProduct(product as ProductSchema) : null;
  }

  async getAllProducts(): Promise<Product[]> {
    if (!this.convexUrl || !this.client) {
      return [];
    }
    const products = await this.client.query(api.functions.getAllProducts, {});
    return products.map((p: any) => this.schemaToProduct(p as ProductSchema));
  }

  // Buyer Profile operations
  async getBuyerProfile(email: string): Promise<BuyerProfile | null> {
    if (!this.convexUrl || !this.client) {
      return null;
    }
    const profile = await this.client.query(api.functions.getBuyerProfile, { email });
    return profile ? this.schemaToBuyerProfile(profile as BuyerProfileSchema) : null;
  }

  async updateBuyerProfile(email: string, updates: Partial<BuyerProfileSchema>): Promise<void> {
    if (!this.convexUrl || !this.client) {
      return;
    }
    await this.client.mutation(api.functions.updateBuyerProfile, { email, updates });
  }

  private schemaToBuyerProfile(schema: BuyerProfileSchema): BuyerProfile {
    return {
      email: schema.email,
      purchaseHistory: [],
      priceSensitivity: schema.priceSensitivity,
      negotiationStyle: schema.negotiationStyle,
      communicationPreference: schema.communicationPreference,
      conversionProbability: 0.5,
      lastInteraction: schema.lastInteraction ? new Date(schema.lastInteraction) : undefined,
      totalSpent: schema.totalSpent,
      averageDiscount: schema.averageDiscount,
    };
  }

  // Negotiation State operations
  async createNegotiationState(data: Omit<NegotiationState, 'id'>): Promise<NegotiationState> {
    if (!this.convexUrl || !this.client) {
      // Mock implementation
      const negotiation: NegotiationStateSchema = {
        _id: this.generateId(),
        _creationTime: Date.now(),
        buyerEmail: data.buyerEmail,
        product: data.product,
        threadId: data.threadId,
        currentPrice: data.currentPrice,
        initialPrice: data.initialPrice,
        minPrice: data.minPrice,
        rounds: data.rounds,
        offers: data.offers.map(offer => ({
          price: offer.price,
          from: offer.from,
          timestamp: offer.timestamp.getTime(),
        })),
        status: data.status,
        listingUrls: data.listingUrls,
        agreedPrice: data.agreedPrice,
      };
      return this.schemaToNegotiation(negotiation);
    }

    await this.client.mutation(api.functions.createNegotiationState, {
      buyerEmail: data.buyerEmail,
      product: data.product,
      threadId: data.threadId,
      currentPrice: data.currentPrice,
      initialPrice: data.initialPrice,
      minPrice: data.minPrice,
      rounds: data.rounds,
      offers: data.offers.map(offer => ({
        price: offer.price,
        from: offer.from,
        timestamp: offer.timestamp.getTime(),
      })),
      status: data.status,
      listingUrls: data.listingUrls,
      agreedPrice: data.agreedPrice,
    });

    const negotiation = await this.client.query(api.functions.getNegotiationState, { threadId: data.threadId });
    if (!negotiation) {
      throw new Error('Failed to create negotiation state');
    }
    return this.schemaToNegotiation(negotiation as NegotiationStateSchema);
  }

  async getNegotiationState(threadId: string): Promise<NegotiationState | null> {
    if (!this.convexUrl || !this.client) {
      return null;
    }
    const negotiation = await this.client.query(api.functions.getNegotiationState, { threadId });
    return negotiation ? this.schemaToNegotiation(negotiation as NegotiationStateSchema) : null;
  }

  async updateNegotiationState(threadId: string, updates: Partial<NegotiationState>): Promise<void> {
    if (!this.convexUrl || !this.client) {
      return;
    }
    await this.client.mutation(api.functions.updateNegotiationState, {
      threadId,
      updates: {
        currentPrice: updates.currentPrice,
        rounds: updates.rounds,
        offers: updates.offers?.map(offer => ({
          price: offer.price,
          from: offer.from,
          timestamp: offer.timestamp.getTime(),
        })),
        status: updates.status,
        agreedPrice: updates.agreedPrice,
      },
    });
  }

  // Metrics operations
  async getMetrics(): Promise<Metrics> {
    if (!this.convexUrl || !this.client) {
      // Return default metrics if not found
      return {
        dealsCompleted: 0,
        totalProfit: 0,
        totalRevenue: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        averageNegotiationRounds: 0,
        activeListings: 0,
        emailsProcessed: 0,
        lastUpdated: new Date(),
      };
    }

    const metrics = await this.client.query(api.functions.getMetrics, {});
    if (!metrics) {
      return {
        dealsCompleted: 0,
        totalProfit: 0,
        totalRevenue: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        averageNegotiationRounds: 0,
        activeListings: 0,
        emailsProcessed: 0,
        lastUpdated: new Date(),
      };
    }

    return {
      dealsCompleted: metrics.dealsCompleted,
      totalProfit: metrics.totalProfit,
      totalRevenue: metrics.totalRevenue,
      conversionRate: metrics.conversionRate,
      averageResponseTime: metrics.averageResponseTime,
      averageNegotiationRounds: metrics.averageNegotiationRounds,
      activeListings: metrics.activeListings,
      emailsProcessed: metrics.emailsProcessed,
      lastUpdated: new Date(metrics.lastUpdated),
    };
  }

  async updateMetrics(updates: Partial<Metrics>): Promise<void> {
    if (!this.convexUrl || !this.client) {
      return;
    }
    await this.client.mutation(api.functions.updateMetrics, {
      dealsCompleted: updates.dealsCompleted,
      totalProfit: updates.totalProfit,
      totalRevenue: updates.totalRevenue,
      conversionRate: updates.conversionRate,
      averageResponseTime: updates.averageResponseTime,
      averageNegotiationRounds: updates.averageNegotiationRounds,
      activeListings: updates.activeListings,
      emailsProcessed: updates.emailsProcessed,
    });
  }

  // Helper methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private schemaToTransaction(schema: TransactionSchema): Transaction {
    return {
      id: schema._id,
      buyerEmail: schema.buyerEmail,
      product: schema.product,
      productId: schema.productId,
      initialPrice: schema.initialPrice,
      finalPrice: schema.finalPrice,
      cost: schema.cost,
      profit: schema.profit,
      status: schema.status,
      createdAt: new Date(schema._creationTime),
      completedAt: schema.completedAt ? new Date(schema.completedAt) : undefined,
      negotiationRounds: schema.negotiationRounds,
      listingUrls: schema.listingUrls,
    };
  }

  private schemaToProduct(schema: ProductSchema): Product {
    return {
      id: schema._id,
      title: schema.title,
      description: schema.description,
      cost: schema.cost,
      targetPrice: schema.targetPrice,
      category: schema.category,
      images: schema.images,
      condition: schema.condition,
      createdAt: new Date(schema._creationTime),
    };
  }

  private schemaToNegotiation(schema: NegotiationStateSchema): NegotiationState {
    return {
      id: schema._id,
      buyerEmail: schema.buyerEmail,
      product: schema.product,
      threadId: schema.threadId,
      currentPrice: schema.currentPrice,
      initialPrice: schema.initialPrice,
      minPrice: schema.minPrice,
      rounds: schema.rounds,
      offers: schema.offers.map(offer => ({
        price: offer.price,
        from: offer.from,
        timestamp: new Date(offer.timestamp),
      })),
      status: schema.status,
      listingUrls: schema.listingUrls,
      agreedPrice: schema.agreedPrice,
    };
  }
}
