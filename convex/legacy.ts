// Legacy Convex functions for backward compatibility
// These functions work with the legacy tables (products, buyerProfiles, negotiationStates, transactions)
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Transaction mutations and queries
export const createTransaction = mutation({
  args: {
    buyerEmail: v.string(),
    product: v.string(),
    productId: v.string(),
    initialPrice: v.number(),
    finalPrice: v.number(),
    cost: v.number(),
    profit: v.number(),
    status: v.union(v.literal('negotiating'), v.literal('completed'), v.literal('cancelled'), v.literal('refunded')),
    negotiationRounds: v.number(),
    listingUrls: v.array(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use the new transactions table structure
    const transactionId = await ctx.db.insert('transactions', {
      type: 'sale',
      category: 'inventory',
      amount: args.finalPrice,
      currency: 'USD',
      netAmount: args.profit,
      paymentStatus: args.status === 'completed' ? 'completed' : 'pending',
      platform: 'unknown',
      status: args.status,
      createdAt: Date.now(),
      completedAt: args.completedAt,
      counterparty: {
        type: 'buyer',
        id: args.buyerEmail,
        email: args.buyerEmail,
      },
    });
    return transactionId;
  },
});

export const getTransaction = query({
  args: { id: v.id('transactions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateTransaction = mutation({
  args: {
    id: v.id('transactions'),
    updates: v.object({
      status: v.optional(v.union(v.literal('negotiating'), v.literal('completed'), v.literal('cancelled'), v.literal('refunded'))),
      finalPrice: v.optional(v.number()),
      profit: v.optional(v.number()),
      completedAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.id);
    if (!transaction) return;
    
    const patchUpdates: any = {};
    if (args.updates.status) {
      patchUpdates.status = args.updates.status;
      patchUpdates.paymentStatus = args.updates.status === 'completed' ? 'completed' : 'pending';
    }
    if (args.updates.finalPrice !== undefined) patchUpdates.amount = args.updates.finalPrice;
    if (args.updates.profit !== undefined) patchUpdates.netAmount = args.updates.profit;
    if (args.updates.completedAt !== undefined) patchUpdates.completedAt = args.updates.completedAt;
    
    await ctx.db.patch(args.id, patchUpdates);
  },
});

export const getTransactionsByBuyer = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const allTransactions = await ctx.db.query('transactions').collect();
    // Filter by counterparty email (counterparty is an object in new schema)
    return allTransactions.filter((t: any) => 
      t.counterparty?.email === args.email && t.type === 'sale'
    );
  },
});

// Product mutations and queries
export const createProduct = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    cost: v.number(),
    targetPrice: v.number(),
    category: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    condition: v.union(v.literal('new'), v.literal('like-new'), v.literal('used'), v.literal('refurbished')),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert('products', {
      title: args.title,
      description: args.description,
      cost: args.cost,
      targetPrice: args.targetPrice,
      category: args.category,
      images: args.images,
      condition: args.condition,
    });
    return productId;
  },
});

export const getProduct = query({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAllProducts = query({
  handler: async (ctx) => {
    return await ctx.db.query('products').collect();
  },
});

// Buyer Profile mutations and queries
export const getBuyerProfile = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('buyerProfiles')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

export const updateBuyerProfile = mutation({
  args: {
    email: v.string(),
    updates: v.object({
      priceSensitivity: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
      negotiationStyle: v.optional(v.union(v.literal('aggressive'), v.literal('cooperative'), v.literal('passive'))),
      communicationPreference: v.optional(v.union(v.literal('brief'), v.literal('detailed'), v.literal('friendly'))),
      totalSpent: v.optional(v.number()),
      averageDiscount: v.optional(v.number()),
      lastInteraction: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('buyerProfiles')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
    
    if (profile) {
      await ctx.db.patch(profile._id, args.updates);
    } else {
      await ctx.db.insert('buyerProfiles', {
        email: args.email,
        priceSensitivity: args.updates.priceSensitivity || 'medium',
        negotiationStyle: args.updates.negotiationStyle || 'cooperative',
        communicationPreference: args.updates.communicationPreference || 'brief',
        totalSpent: args.updates.totalSpent || 0,
        averageDiscount: args.updates.averageDiscount || 0,
        ...args.updates,
      });
    }
  },
});

// Negotiation State mutations and queries
export const createNegotiationState = mutation({
  args: {
    buyerEmail: v.string(),
    product: v.string(),
    threadId: v.string(),
    currentPrice: v.number(),
    initialPrice: v.number(),
    minPrice: v.number(),
    rounds: v.number(),
    offers: v.array(v.object({
      price: v.number(),
      from: v.union(v.literal('buyer'), v.literal('seller')),
      timestamp: v.number(),
    })),
    status: v.union(v.literal('negotiating'), v.literal('accepted'), v.literal('rejected'), v.literal('closed')),
    listingUrls: v.array(v.string()),
    agreedPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const negotiationId = await ctx.db.insert('negotiationStates', {
      buyerEmail: args.buyerEmail,
      product: args.product,
      threadId: args.threadId,
      currentPrice: args.currentPrice,
      initialPrice: args.initialPrice,
      minPrice: args.minPrice,
      rounds: args.rounds,
      offers: args.offers,
      status: args.status,
      listingUrls: args.listingUrls,
      agreedPrice: args.agreedPrice,
    });
    return negotiationId;
  },
});

export const getNegotiationState = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('negotiationStates')
      .withIndex('by_thread', (q) => q.eq('threadId', args.threadId))
      .first();
  },
});

export const updateNegotiationState = mutation({
  args: {
    threadId: v.string(),
    updates: v.object({
      currentPrice: v.optional(v.number()),
      rounds: v.optional(v.number()),
      offers: v.optional(v.array(v.object({
        price: v.number(),
        from: v.union(v.literal('buyer'), v.literal('seller')),
        timestamp: v.number(),
      }))),
      status: v.optional(v.union(v.literal('negotiating'), v.literal('accepted'), v.literal('rejected'), v.literal('closed'))),
      agreedPrice: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const negotiation = await ctx.db
      .query('negotiationStates')
      .withIndex('by_thread', (q) => q.eq('threadId', args.threadId))
      .first();
    
    if (negotiation) {
      await ctx.db.patch(negotiation._id, args.updates);
    }
  },
});

// Metrics queries and mutations - using simplified approach for legacy compatibility
export const getMetrics = query({
  handler: async (ctx) => {
    // Get the most recent metrics entry or create default
    const allMetrics = await ctx.db
      .query('metrics')
      .collect();
    
    // Sort by timestamp descending and take the latest
    allMetrics.sort((a: any, b: any) => b.timestamp - a.timestamp);
    
    if (allMetrics.length > 0) {
      const latest = allMetrics[0];
      // Convert new schema to legacy format
      return {
        dealsCompleted: latest.negotiation?.successful || 0,
        totalProfit: latest.financial?.totalProfit || 0,
        totalRevenue: latest.financial?.totalRevenue || 0,
        conversionRate: (latest.negotiation?.successful || 0) / Math.max(latest.negotiation?.started || 1, 1),
        averageResponseTime: latest.negotiation?.avgResponseTime || 0,
        averageNegotiationRounds: latest.negotiation?.avgRounds || 0,
        activeListings: latest.sales?.listed || 0,
        emailsProcessed: 0, // Not tracked in new schema
        lastUpdated: latest.timestamp,
      };
    }
    
    // Return default if none found
    return {
      dealsCompleted: 0,
      totalProfit: 0,
      totalRevenue: 0,
      conversionRate: 0,
      averageResponseTime: 0,
      averageNegotiationRounds: 0,
      activeListings: 0,
      emailsProcessed: 0,
      lastUpdated: Date.now(),
    };
  },
});

export const updateMetrics = mutation({
  args: {
    dealsCompleted: v.optional(v.number()),
    totalProfit: v.optional(v.number()),
    totalRevenue: v.optional(v.number()),
    conversionRate: v.optional(v.number()),
    averageResponseTime: v.optional(v.number()),
    averageNegotiationRounds: v.optional(v.number()),
    activeListings: v.optional(v.number()),
    emailsProcessed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];
    
    // Get or create today's metrics entry
    const existing = await ctx.db
      .query('metrics')
      .withIndex('by_date', (q) => q.eq('date', today))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        financial: {
          totalProfit: args.totalProfit ?? existing.financial.totalProfit,
          totalRevenue: args.totalRevenue ?? existing.financial.totalRevenue,
          totalSpent: existing.financial.totalSpent,
          totalFees: existing.financial.totalFees,
          roi: existing.financial.roi,
          profitMargin: existing.financial.profitMargin,
        },
        negotiation: {
          ...existing.negotiation,
          successful: args.dealsCompleted ?? existing.negotiation.successful,
          avgResponseTime: args.averageResponseTime ?? existing.negotiation.avgResponseTime,
          avgRounds: args.averageNegotiationRounds ?? existing.negotiation.avgRounds,
        },
        sales: {
          ...existing.sales,
          listed: args.activeListings ?? existing.sales.listed,
        },
        timestamp: now,
      });
    } else {
      await ctx.db.insert('metrics', {
        period: 'day',
        timestamp: now,
        date: today,
        discovery: {
          opportunitiesFound: 0,
          opportunitiesAnalyzed: 0,
          opportunitiesApproved: 0,
          avgProfitScore: 0,
        },
        negotiation: {
          started: 0,
          completed: 0,
          successful: args.dealsCompleted || 0,
          avgRounds: args.averageNegotiationRounds || 0,
          avgResponseTime: args.averageResponseTime || 0,
          avgDiscount: 0,
        },
        sales: {
          listed: args.activeListings || 0,
          sold: 0,
          avgTimeToSell: 0,
          avgSalePrice: 0,
        },
        financial: {
          totalSpent: 0,
          totalRevenue: args.totalRevenue || 0,
          totalProfit: args.totalProfit || 0,
          totalFees: 0,
          roi: 0,
          profitMargin: 0,
        },
        efficiency: {
          automationRate: 0,
          errorRate: 0,
          avgProcessingTime: 0,
        },
      });
    }
  },
});

