// Convex functions for ProfitPilot
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Product mutations and queries
export const createProduct = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    cost: v.number(),
    targetPrice: v.number(),
    category: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    condition: v.union(
      v.literal("new"),
      v.literal("like-new"),
      v.literal("used"),
      v.literal("refurbished")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

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
    status: v.union(
      v.literal("negotiating"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    negotiationRounds: v.number(),
    listingUrls: v.array(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", args);
  },
});

export const getTransaction = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateTransaction = mutation({
  args: {
    id: v.id("transactions"),
    updates: v.object({
      status: v.optional(
        v.union(
          v.literal("negotiating"),
          v.literal("completed"),
          v.literal("cancelled"),
          v.literal("refunded")
        )
      ),
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
      .query("transactions")
      .filter((q) => q.eq(q.field("buyerEmail"), args.email))
      .collect();
  },
});

// Buyer Profile mutations and queries
export const getBuyerProfile = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("buyerProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const updateBuyerProfile = mutation({
  args: {
    email: v.string(),
    updates: v.object({
      priceSensitivity: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
      ),
      negotiationStyle: v.optional(
        v.union(
          v.literal("aggressive"),
          v.literal("cooperative"),
          v.literal("passive")
        )
      ),
      communicationPreference: v.optional(
        v.union(
          v.literal("brief"),
          v.literal("detailed"),
          v.literal("friendly")
        )
      ),
      totalSpent: v.optional(v.number()),
      averageDiscount: v.optional(v.number()),
      lastInteraction: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("buyerProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (profile) {
      await ctx.db.patch(profile._id, args.updates);
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
    offers: v.array(
      v.object({
        price: v.number(),
        from: v.union(v.literal("buyer"), v.literal("seller")),
        timestamp: v.number(),
      })
    ),
    status: v.union(
      v.literal("negotiating"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("closed")
    ),
    listingUrls: v.array(v.string()),
    agreedPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("negotiationStates", args);
  },
});

export const getNegotiationState = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("negotiationStates")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .first();
  },
});

export const updateNegotiationState = mutation({
  args: {
    threadId: v.string(),
    updates: v.object({
      currentPrice: v.optional(v.number()),
      rounds: v.optional(v.number()),
      offers: v.optional(
        v.array(
          v.object({
            price: v.number(),
            from: v.union(v.literal("buyer"), v.literal("seller")),
            timestamp: v.number(),
          })
        )
      ),
      status: v.optional(
        v.union(
          v.literal("negotiating"),
          v.literal("accepted"),
          v.literal("rejected"),
          v.literal("closed")
        )
      ),
      agreedPrice: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const negotiation = await ctx.db
      .query("negotiationStates")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .first();
    
    if (negotiation) {
      await ctx.db.patch(negotiation._id, args.updates);
    }
  },
});

// Metrics mutations and queries
export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    const metrics = await ctx.db.query("metrics").first();
    if (!metrics) {
      // Return default metrics if none exist
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
    const metrics = await ctx.db.query("metrics").first();
    
    if (metrics) {
      await ctx.db.patch(metrics._id, {
        ...args,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("metrics", {
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
