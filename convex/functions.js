"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMetrics = exports.getMetrics = exports.updateNegotiationState = exports.getNegotiationState = exports.createNegotiationState = exports.updateBuyerProfile = exports.getBuyerProfile = exports.getTransactionsByBuyer = exports.updateTransaction = exports.getTransaction = exports.createTransaction = exports.getAllProducts = exports.getProduct = exports.createProduct = void 0;
// Convex functions for ProfitPilot
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
// Product mutations and queries
exports.createProduct = (0, server_1.mutation)({
    args: {
        title: values_1.v.string(),
        description: values_1.v.string(),
        cost: values_1.v.number(),
        targetPrice: values_1.v.number(),
        category: values_1.v.optional(values_1.v.string()),
        images: values_1.v.optional(values_1.v.array(values_1.v.string())),
        condition: values_1.v.union(values_1.v.literal("new"), values_1.v.literal("like-new"), values_1.v.literal("used"), values_1.v.literal("refurbished")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("products", args);
    },
});
exports.getProduct = (0, server_1.query)({
    args: { id: values_1.v.id("products") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
exports.getAllProducts = (0, server_1.query)({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("products").collect();
    },
});
// Transaction mutations and queries
exports.createTransaction = (0, server_1.mutation)({
    args: {
        buyerEmail: values_1.v.string(),
        product: values_1.v.string(),
        productId: values_1.v.string(),
        initialPrice: values_1.v.number(),
        finalPrice: values_1.v.number(),
        cost: values_1.v.number(),
        profit: values_1.v.number(),
        status: values_1.v.union(values_1.v.literal("negotiating"), values_1.v.literal("completed"), values_1.v.literal("cancelled"), values_1.v.literal("refunded")),
        negotiationRounds: values_1.v.number(),
        listingUrls: values_1.v.array(values_1.v.string()),
        completedAt: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("transactions", args);
    },
});
exports.getTransaction = (0, server_1.query)({
    args: { id: values_1.v.id("transactions") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
exports.updateTransaction = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("transactions"),
        updates: values_1.v.object({
            status: values_1.v.optional(values_1.v.union(values_1.v.literal("negotiating"), values_1.v.literal("completed"), values_1.v.literal("cancelled"), values_1.v.literal("refunded"))),
            finalPrice: values_1.v.optional(values_1.v.number()),
            profit: values_1.v.optional(values_1.v.number()),
            completedAt: values_1.v.optional(values_1.v.number()),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, args.updates);
    },
});
exports.getTransactionsByBuyer = (0, server_1.query)({
    args: { email: values_1.v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("transactions")
            .filter((q) => q.eq(q.field("buyerEmail"), args.email))
            .collect();
    },
});
// Buyer Profile mutations and queries
exports.getBuyerProfile = (0, server_1.query)({
    args: { email: values_1.v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("buyerProfiles")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
    },
});
exports.updateBuyerProfile = (0, server_1.mutation)({
    args: {
        email: values_1.v.string(),
        updates: values_1.v.object({
            priceSensitivity: values_1.v.optional(values_1.v.union(values_1.v.literal("low"), values_1.v.literal("medium"), values_1.v.literal("high"))),
            negotiationStyle: values_1.v.optional(values_1.v.union(values_1.v.literal("aggressive"), values_1.v.literal("cooperative"), values_1.v.literal("passive"))),
            communicationPreference: values_1.v.optional(values_1.v.union(values_1.v.literal("brief"), values_1.v.literal("detailed"), values_1.v.literal("friendly"))),
            totalSpent: values_1.v.optional(values_1.v.number()),
            averageDiscount: values_1.v.optional(values_1.v.number()),
            lastInteraction: values_1.v.optional(values_1.v.number()),
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
exports.createNegotiationState = (0, server_1.mutation)({
    args: {
        buyerEmail: values_1.v.string(),
        product: values_1.v.string(),
        threadId: values_1.v.string(),
        currentPrice: values_1.v.number(),
        initialPrice: values_1.v.number(),
        minPrice: values_1.v.number(),
        rounds: values_1.v.number(),
        offers: values_1.v.array(values_1.v.object({
            price: values_1.v.number(),
            from: values_1.v.union(values_1.v.literal("buyer"), values_1.v.literal("seller")),
            timestamp: values_1.v.number(),
        })),
        status: values_1.v.union(values_1.v.literal("negotiating"), values_1.v.literal("accepted"), values_1.v.literal("rejected"), values_1.v.literal("closed")),
        listingUrls: values_1.v.array(values_1.v.string()),
        agreedPrice: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("negotiationStates", args);
    },
});
exports.getNegotiationState = (0, server_1.query)({
    args: { threadId: values_1.v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("negotiationStates")
            .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
            .first();
    },
});
exports.updateNegotiationState = (0, server_1.mutation)({
    args: {
        threadId: values_1.v.string(),
        updates: values_1.v.object({
            currentPrice: values_1.v.optional(values_1.v.number()),
            rounds: values_1.v.optional(values_1.v.number()),
            offers: values_1.v.optional(values_1.v.array(values_1.v.object({
                price: values_1.v.number(),
                from: values_1.v.union(values_1.v.literal("buyer"), values_1.v.literal("seller")),
                timestamp: values_1.v.number(),
            }))),
            status: values_1.v.optional(values_1.v.union(values_1.v.literal("negotiating"), values_1.v.literal("accepted"), values_1.v.literal("rejected"), values_1.v.literal("closed"))),
            agreedPrice: values_1.v.optional(values_1.v.number()),
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
exports.getMetrics = (0, server_1.query)({
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
exports.updateMetrics = (0, server_1.mutation)({
    args: {
        dealsCompleted: values_1.v.optional(values_1.v.number()),
        totalProfit: values_1.v.optional(values_1.v.number()),
        totalRevenue: values_1.v.optional(values_1.v.number()),
        conversionRate: values_1.v.optional(values_1.v.number()),
        averageResponseTime: values_1.v.optional(values_1.v.number()),
        averageNegotiationRounds: values_1.v.optional(values_1.v.number()),
        activeListings: values_1.v.optional(values_1.v.number()),
        emailsProcessed: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, args) => {
        const metrics = await ctx.db.query("metrics").first();
        if (metrics) {
            await ctx.db.patch(metrics._id, {
                ...args,
                lastUpdated: Date.now(),
            });
        }
        else {
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
//# sourceMappingURL=functions.js.map