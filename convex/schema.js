"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Convex schema definition
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    transactions: (0, server_1.defineTable)({
        buyerEmail: values_1.v.string(),
        product: values_1.v.string(),
        productId: values_1.v.string(),
        initialPrice: values_1.v.number(),
        finalPrice: values_1.v.number(),
        cost: values_1.v.number(),
        profit: values_1.v.number(),
        status: values_1.v.union(values_1.v.literal('negotiating'), values_1.v.literal('completed'), values_1.v.literal('cancelled'), values_1.v.literal('refunded')),
        negotiationRounds: values_1.v.number(),
        listingUrls: values_1.v.array(values_1.v.string()),
        completedAt: values_1.v.optional(values_1.v.number()),
    }),
    products: (0, server_1.defineTable)({
        title: values_1.v.string(),
        description: values_1.v.string(),
        cost: values_1.v.number(),
        targetPrice: values_1.v.number(),
        category: values_1.v.optional(values_1.v.string()),
        images: values_1.v.optional(values_1.v.array(values_1.v.string())),
        condition: values_1.v.union(values_1.v.literal('new'), values_1.v.literal('like-new'), values_1.v.literal('used'), values_1.v.literal('refurbished')),
    }),
    buyerProfiles: (0, server_1.defineTable)({
        email: values_1.v.string(),
        priceSensitivity: values_1.v.union(values_1.v.literal('low'), values_1.v.literal('medium'), values_1.v.literal('high')),
        negotiationStyle: values_1.v.union(values_1.v.literal('aggressive'), values_1.v.literal('cooperative'), values_1.v.literal('passive')),
        communicationPreference: values_1.v.union(values_1.v.literal('brief'), values_1.v.literal('detailed'), values_1.v.literal('friendly')),
        totalSpent: values_1.v.number(),
        averageDiscount: values_1.v.number(),
        lastInteraction: values_1.v.optional(values_1.v.number()),
    }).index('by_email', ['email']),
    negotiationStates: (0, server_1.defineTable)({
        buyerEmail: values_1.v.string(),
        product: values_1.v.string(),
        threadId: values_1.v.string(),
        currentPrice: values_1.v.number(),
        initialPrice: values_1.v.number(),
        minPrice: values_1.v.number(),
        rounds: values_1.v.number(),
        offers: values_1.v.array(values_1.v.object({
            price: values_1.v.number(),
            from: values_1.v.union(values_1.v.literal('buyer'), values_1.v.literal('seller')),
            timestamp: values_1.v.number(),
        })),
        status: values_1.v.union(values_1.v.literal('negotiating'), values_1.v.literal('accepted'), values_1.v.literal('rejected'), values_1.v.literal('closed')),
        listingUrls: values_1.v.array(values_1.v.string()),
        agreedPrice: values_1.v.optional(values_1.v.number()),
    }).index('by_thread', ['threadId']),
    metrics: (0, server_1.defineTable)({
        dealsCompleted: values_1.v.number(),
        totalProfit: values_1.v.number(),
        totalRevenue: values_1.v.number(),
        conversionRate: values_1.v.number(),
        averageResponseTime: values_1.v.number(),
        averageNegotiationRounds: values_1.v.number(),
        activeListings: values_1.v.number(),
        emailsProcessed: values_1.v.number(),
        lastUpdated: values_1.v.number(),
    }),
});
//# sourceMappingURL=schema.js.map