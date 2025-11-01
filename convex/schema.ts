// Convex schema definition
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  transactions: defineTable({
    buyerEmail: v.string(),
    product: v.string(),
    productId: v.string(),
    initialPrice: v.number(),
    finalPrice: v.number(),
    cost: v.number(),
    profit: v.number(),
    status: v.union(
      v.literal('negotiating'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('refunded')
    ),
    negotiationRounds: v.number(),
    listingUrls: v.array(v.string()),
    completedAt: v.optional(v.number()),
  }),
  
  products: defineTable({
    title: v.string(),
    description: v.string(),
    cost: v.number(),
    targetPrice: v.number(),
    category: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    condition: v.union(
      v.literal('new'),
      v.literal('like-new'),
      v.literal('used'),
      v.literal('refurbished')
    ),
  }),
  
  buyerProfiles: defineTable({
    email: v.string(),
    priceSensitivity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    negotiationStyle: v.union(
      v.literal('aggressive'),
      v.literal('cooperative'),
      v.literal('passive')
    ),
    communicationPreference: v.union(
      v.literal('brief'),
      v.literal('detailed'),
      v.literal('friendly')
    ),
    totalSpent: v.number(),
    averageDiscount: v.number(),
    lastInteraction: v.optional(v.number()),
  }).index('by_email', ['email']),
  
  negotiationStates: defineTable({
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
        from: v.union(v.literal('buyer'), v.literal('seller')),
        timestamp: v.number(),
      })
    ),
    status: v.union(
      v.literal('negotiating'),
      v.literal('accepted'),
      v.literal('rejected'),
      v.literal('closed')
    ),
    listingUrls: v.array(v.string()),
    agreedPrice: v.optional(v.number()),
  }).index('by_thread', ['threadId']),
  
  metrics: defineTable({
    dealsCompleted: v.number(),
    totalProfit: v.number(),
    totalRevenue: v.number(),
    conversionRate: v.number(),
    averageResponseTime: v.number(),
    averageNegotiationRounds: v.number(),
    activeListings: v.number(),
    emailsProcessed: v.number(),
    lastUpdated: v.number(),
  }),

  // Email queue for webhook-based email processing
  emailQueue: defineTable({
    messageId: v.string(),
    threadId: v.optional(v.string()),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    receivedAt: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    retryCount: v.number(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    metadata: v.optional(v.object({
      intent: v.optional(v.string()),
      sentiment: v.optional(v.string()),
      urgency: v.optional(v.string()),
    })),
  }).index('by_status', ['status'])
    .index('by_message_id', ['messageId'])
    .index('by_thread_id', ['threadId']),

  // Email activity log for UI display
  emailActivity: defineTable({
    emailId: v.string(),
    type: v.union(
      v.literal('received'),
      v.literal('sent'),
      v.literal('analyzed'),
      v.literal('error')
    ),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    summary: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  }).index('by_timestamp', ['timestamp']),
});
