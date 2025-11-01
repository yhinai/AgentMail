// Database client wrapper
// Mock implementation - replace with actual Convex client

import {
  Transaction,
  Product,
  Buyer,
  Metrics,
  ActivityLog,
  TransactionStatus,
} from '../types';
import {
  TransactionDocument,
  ProductDocument,
  BuyerDocument,
  MetricsDocument,
  ActivityLogDocument,
} from './models';
import { Logger } from '../utils/logger';

export class DatabaseClient {
  private transactions: TransactionDocument[] = [];
  private products: ProductDocument[] = [];
  private buyers: BuyerDocument[] = [];
  private metrics: MetricsDocument | null = null;
  private activityLogs: ActivityLogDocument[] = [];
  private nextId: number = 1;

  // Transaction operations
  async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    Logger.debug('Creating transaction');

    const transaction: TransactionDocument = {
      ...data,
      id: `txn_${this.nextId++}`,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };

    this.transactions.push(transaction);

    // Update metrics
    await this.updateMetrics();

    Logger.info(`Transaction created: ${transaction.id}`);
    return transaction as Transaction;
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const doc = this.transactions.find((t) => t.id === id);
    return doc ? (doc as Transaction) : null;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      return null;
    }

    this.transactions[index] = {
      ...this.transactions[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.updateMetrics();
    return this.transactions[index] as Transaction;
  }

  async getTransactions(filters?: {
    status?: TransactionStatus;
    buyerEmail?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    let filtered = [...this.transactions];

    if (filters?.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters?.buyerEmail) {
      filtered = filtered.filter((t) => t.buyerEmail === filters.buyerEmail);
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered as Transaction[];
  }

  // Product operations
  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    Logger.debug('Creating product');

    const product: ProductDocument = {
      ...data,
      id: `prod_${this.nextId++}`,
      createdAt: data.createdAt || new Date(),
    };

    this.products.push(product);
    Logger.info(`Product created: ${product.id}`);
    return product as Product;
  }

  async getProduct(id: string): Promise<Product | null> {
    const doc = this.products.find((p) => p.id === id);
    return doc ? (doc as Product) : null;
  }

  async getProducts(): Promise<Product[]> {
    return [...this.products] as Product[];
  }

  // Buyer operations
  async getOrCreateBuyer(email: string): Promise<Buyer> {
    let buyer = this.buyers.find((b) => b.email === email);

    if (!buyer) {
      buyer = {
        id: `buyer_${this.nextId++}`,
        email,
      };
      this.buyers.push(buyer);
    }

    return buyer as Buyer;
  }

  async updateBuyer(
    email: string,
    updates: Partial<Buyer>
  ): Promise<Buyer | null> {
    const index = this.buyers.findIndex((b) => b.email === email);
    if (index === -1) {
      return null;
    }

    this.buyers[index] = {
      ...this.buyers[index],
      ...updates,
    };

    return this.buyers[index] as Buyer;
  }

  // Metrics operations
  async getMetrics(): Promise<Metrics> {
    if (!this.metrics) {
      await this.initializeMetrics();
    }
    return this.metrics! as Metrics;
  }

  private async initializeMetrics(): Promise<void> {
    this.metrics = {
      totalProfit: 0,
      dealsCompleted: 0,
      dealsPending: 0,
      averageProfitMargin: 0,
      conversionRate: 0,
      averageResponseTime: 0,
      emailsProcessed: 0,
      listingsActive: 0,
      totalRevenue: 0,
      lastUpdated: new Date(),
    };
  }

  private async updateMetrics(): Promise<void> {
    if (!this.metrics) {
      await this.initializeMetrics();
    }

    const completed = this.transactions.filter(
      (t) => t.status === 'completed'
    );
    const pending = this.transactions.filter(
      (t) => t.status === 'negotiating' || t.status === 'pending'
    );

    const totalProfit = completed.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalRevenue = completed.reduce(
      (sum, t) => sum + (t.finalPrice || t.initialPrice),
      0
    );

    const profits = completed
      .filter((t) => t.profit !== undefined && t.cost > 0)
      .map((t) => (t.profit! / t.cost) * 100);
    const averageProfitMargin =
      profits.length > 0
        ? profits.reduce((sum, p) => sum + p, 0) / profits.length
        : 0;

    const totalTransactions = this.transactions.length;
    const conversionRate =
      totalTransactions > 0
        ? completed.length / totalTransactions
        : 0;

    // Calculate average response time from activity logs
    const responseLogs = this.activityLogs.filter(
      (log) => log.type === 'email_sent'
    );
    const responseTimes = responseLogs
      .map((log) => log.metadata?.responseTime as number | undefined)
      .filter((t) => t !== undefined) as number[];
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    // Count active listings (transactions with listing URLs)
    const listingsActive = this.transactions.filter(
      (t) => t.listingUrls && Object.keys(t.listingUrls).length > 0
    ).length;

    this.metrics = {
      totalProfit,
      dealsCompleted: completed.length,
      dealsPending: pending.length,
      averageProfitMargin,
      conversionRate,
      averageResponseTime,
      emailsProcessed: this.activityLogs.filter(
        (log) => log.type === 'email_received' || log.type === 'email_sent'
      ).length,
      listingsActive,
      totalRevenue,
      lastUpdated: new Date(),
    };
  }

  // Activity log operations
  async logActivity(activity: Omit<ActivityLog, 'id'>): Promise<ActivityLog> {
    const log: ActivityLogDocument = {
      ...activity,
      id: `log_${this.nextId++}`,
      timestamp: activity.timestamp || new Date(),
    };

    this.activityLogs.push(log);
    
    // Keep only last 1000 logs
    if (this.activityLogs.length > 1000) {
      this.activityLogs = this.activityLogs.slice(-1000);
    }

    return log as ActivityLog;
  }

  async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    return this.activityLogs
      .slice(-limit)
      .reverse()
      .map((log) => log as ActivityLog);
  }

  // Utility methods
  async clearAll(): Promise<void> {
    this.transactions = [];
    this.products = [];
    this.buyers = [];
    this.activityLogs = [];
    this.metrics = null;
    Logger.info('Database cleared');
  }
}

// Export singleton instance
export const db = new DatabaseClient();

