// Convex mutations and queries
// Note: This file should be moved to convex/ directory after running `npx convex dev`
// For now, it uses the generated server helpers
// After Convex setup, move this to: convex/mutations.ts and convex/queries.ts

import { mutation, query } from '../convex/_generated/server';
import { v } from 'convex/values';
import type {
  TransactionSchema,
  ProductSchema,
  BuyerProfileSchema,
  NegotiationStateSchema,
  MetricsSchema,
} from './models';

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
    const transactionId = await ctx.db.insert('transactions', {
      buyerEmail: args.buyerEmail,
      product: args.product,
      productId: args.productId,
      initialPrice: args.initialPrice,
      finalPrice: args.finalPrice,
      cost: args.cost,
      profit: args.profit,
      status: args.status,
      negotiationRounds: args.negotiationRounds,
      listingUrls: args.listingUrls,
      completedAt: args.completedAt,
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
    await ctx.db.patch(args.id, args.updates);
  },
});

export const getTransactionsByBuyer = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('transactions')
      .filter((q) => q.eq(q.field('buyerEmail'), args.email))
      .collect();
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
      .filter((q) => q.eq(q.field('email'), args.email))
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
      .filter((q) => q.eq(q.field('email'), args.email))
      .first();
    
    if (profile) {
      await ctx.db.patch(profile._id, args.updates);
    } else {
      await ctx.db.insert('buyerProfiles', {
        email: args.email,
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
      .filter((q) => q.eq(q.field('threadId'), args.threadId))
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
      .filter((q) => q.eq(q.field('threadId'), args.threadId))
      .first();
    
    if (negotiation) {
      await ctx.db.patch(negotiation._id, args.updates);
    }
  },
});

// Metrics queries and mutations
export const getMetrics = query({
  handler: async (ctx) => {
    const metrics = await ctx.db.query('metrics').first();
    if (!metrics) {
      // Initialize default metrics
      const defaultMetricsId = await ctx.db.insert('metrics', {
        dealsCompleted: 0,
        totalProfit: 0,
        totalRevenue: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        averageNegotiationRounds: 0,
        activeListings: 0,
        emailsProcessed: 0,
        lastUpdated: Date.now(),
      });
      return await ctx.db.get(defaultMetricsId);
    }
    return metrics;
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
    const metrics = await ctx.db.query('metrics').first();
    if (metrics) {
      await ctx.db.patch(metrics._id, {
        ...args,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert('metrics', {
        dealsCompleted: args.dealsCompleted || 0,
        totalProfit: args.totalProfit || 0,
        totalRevenue: args.totalRevenue || 0,
        conversionRate: args.conversionRate || 0,
        averageResponseTime: args.averageResponseTime || 0,
        averageNegotiationRounds: args.averageNegotiationRounds || 0,
        activeListings: args.activeListings || 0,
        emailsProcessed: args.emailsProcessed || 0,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Budget mutations and queries
export const createBudget = mutation({
  args: {
    commandId: v.id('commands'),
    totalBudget: v.number(),
    spent: v.number(),
    reserved: v.number(),
    remaining: v.number(),
    status: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const budgetId = await ctx.db.insert('budgets', {
      commandId: args.commandId,
      totalBudget: args.totalBudget,
      spent: args.spent,
      reserved: args.reserved,
      remaining: args.remaining,
      status: args.status,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
    return budgetId;
  },
});

export const getBudget = query({
  args: { id: v.id('budgets') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateBudget = mutation({
  args: {
    id: v.id('budgets'),
    spent: v.optional(v.number()),
    reserved: v.optional(v.number()),
    remaining: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Command mutations and queries
export const createCommand = mutation({
  args: {
    naturalLanguage: v.string(),
    parsed: v.any(),
    status: v.string(),
    currentStep: v.string(),
    budgetId: v.id('budgets'),
    itemsFound: v.number(),
    itemsPurchased: v.number(),
    itemsListed: v.number(),
  },
  handler: async (ctx, args) => {
    const commandId = await ctx.db.insert('commands', {
      naturalLanguage: args.naturalLanguage,
      parsed: args.parsed,
      status: args.status,
      currentStep: args.currentStep,
      budgetId: args.budgetId,
      itemsFound: args.itemsFound,
      itemsPurchased: args.itemsPurchased,
      itemsListed: args.itemsListed,
      createdAt: Date.now(),
    });
    return commandId;
  },
});

export const getCommand = query({
  args: { id: v.id('commands') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateCommand = mutation({
  args: {
    id: v.id('commands'),
    status: v.optional(v.string()),
    currentStep: v.optional(v.string()),
    itemsFound: v.optional(v.number()),
    itemsPurchased: v.optional(v.number()),
    itemsListed: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Approval mutations and queries
export const createApproval = mutation({
  args: {
    commandId: v.id('commands'),
    type: v.string(),
    context: v.any(),
    status: v.string(),
    requestedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const approvalId = await ctx.db.insert('approvals', {
      commandId: args.commandId,
      type: args.type,
      context: args.context,
      status: args.status,
      requestedAt: args.requestedAt,
    });
    return approvalId;
  },
});

export const getApproval = query({
  args: { id: v.id('approvals') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateApproval = mutation({
  args: {
    id: v.id('approvals'),
    status: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getPendingApprovals = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('approvals')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();
  },
});
