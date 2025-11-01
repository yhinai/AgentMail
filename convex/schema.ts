// Complete AutoBazaaar Convex schema
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Discovered opportunities
  opportunities: defineTable({
    // Basic info
    externalId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    platform: v.string(),
    url: v.string(),
    
    // Pricing
    listingPrice: v.number(),
    originalPrice: v.optional(v.number()),
    marketPrice: v.optional(v.number()),
    
    // Images and media
    images: v.array(v.string()),
    primaryImage: v.optional(v.string()),
    
    // Location
    location: v.optional(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zip: v.optional(v.string()),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number()
      }))
    })),
    
    // Seller info
    seller: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      rating: v.optional(v.number()),
      responseTime: v.optional(v.string()),
      platform: v.string()
    }),
    
    // Analysis
    profitAnalysis: v.optional(v.object({
      purchasePrice: v.number(),
      estimatedSalePrice: v.number(),
      profitPotential: v.number(),
      profitMargin: v.number(),
      roi: v.number(),
      platformFees: v.number(),
      netProfit: v.number()
    })),
    
    marketData: v.optional(v.object({
      averagePrice: v.number(),
      pricePoints: v.array(v.number()),
      volatility: v.number(),
      demandScore: v.number(),
      competitorCount: v.number(),
      insights: v.array(v.string())
    })),
    
    riskAssessment: v.optional(v.object({
      score: v.number(),
      factors: v.array(v.string()),
      recommendation: v.string()
    })),
    
    // Scoring
    profitScore: v.number(),
    priorityScore: v.optional(v.number()),
    
    // Status
    status: v.string(), // 'discovered', 'analyzing', 'approved', 'negotiating', 'purchased', 'passed', 'expired'
    statusReason: v.optional(v.string()),
    
    // Timestamps
    discoveredAt: v.number(),
    analyzedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    lastUpdated: v.number()
  })
    .index("by_status", ["status"])
    .index("by_platform", ["platform"])
    .index("by_score", ["profitScore"])
    .index("by_category", ["category"])
    .index("by_discovered", ["discoveredAt"]),
  
  // Negotiation threads
  negotiations: defineTable({
    opportunityId: v.id("opportunities"),
    threadId: v.string(),
    
    // Strategy
    strategy: v.string(),
    strategyParams: v.optional(v.any()),
    
    // Participants
    seller: v.object({
      email: v.string(),
      name: v.optional(v.string()),
      platform: v.string()
    }),
    
    // Negotiation rounds
    rounds: v.array(v.object({
      number: v.number(),
      timestamp: v.number(),
      type: v.string(), // 'initial', 'counter', 'accept', 'reject', 'follow_up'
      
      // Offers
      ourOffer: v.optional(v.number()),
      theirOffer: v.optional(v.number()),
      
      // Communication
      messageId: v.optional(v.string()),
      message: v.string(),
      response: v.optional(v.string()),
      responseTime: v.optional(v.number()),
      
      // Analysis
      sentiment: v.optional(v.string()),
      intent: v.optional(v.string()),
      concerns: v.optional(v.array(v.string())),
      
      // Status
      status: v.string()
    })),
    
    // Current state
    currentOffer: v.number(),
    maxAcceptable: v.number(),
    status: v.string(), // 'active', 'accepted', 'rejected', 'expired', 'abandoned'
    
    // Outcome
    finalPrice: v.optional(v.number()),
    savingsAchieved: v.optional(v.number()),
    
    // Metrics
    metrics: v.object({
      responseTime: v.optional(v.number()),
      openTime: v.optional(v.number()),
      clickCount: v.number(),
      roundCount: v.number()
    }),
    
    // Timestamps
    startedAt: v.number(),
    lastActivityAt: v.number(),
    completedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_thread", ["threadId"]),
  
  // Purchased inventory
  inventory: defineTable({
    // References
    opportunityId: v.id("opportunities"),
    negotiationId: v.optional(v.id("negotiations")),
    
    // Item details
    title: v.string(),
    description: v.string(),
    category: v.string(),
    condition: v.string(),
    sku: v.optional(v.string()),
    
    // Images
    images: v.array(v.string()),
    processedImages: v.optional(v.array(v.object({
      url: v.string(),
      size: v.string(), // 'thumbnail', 'medium', 'large'
      width: v.number(),
      height: v.number()
    }))),
    
    // Purchase details
    purchasePrice: v.number(),
    purchasePlatform: v.string(),
    purchaseDate: v.number(),
    
    // Seller
    seller: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      contact: v.optional(v.string())
    }),
    
    // Location/Storage
    location: v.string(), // 'in_transit', 'warehouse', 'listed', 'sold'
    storageLocation: v.optional(v.string()),
    
    // Status
    status: v.string(), // 'pending_delivery', 'in_stock', 'listed', 'sold', 'returned'
    
    // Timestamps
    acquiredAt: v.number(),
    listedAt: v.optional(v.number()),
    soldAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"]),
  
  // Active listings across platforms
  listings: defineTable({
    inventoryId: v.id("inventory"),
    
    // Platform details
    platform: v.string(),
    platformListingId: v.string(),
    url: v.string(),
    
    // Listing content
    title: v.string(),
    description: v.string(),
    price: v.number(),
    shippingPrice: v.optional(v.number()),
    
    // Images
    images: v.array(v.string()),
    
    // Status
    status: v.string(), // 'draft', 'active', 'paused', 'sold', 'expired', 'removed'
    visibility: v.string(), // 'public', 'private', 'scheduled'
    
    // Performance metrics
    metrics: v.object({
      views: v.number(),
      watchers: v.number(),
      saves: v.number(),
      inquiries: v.number(),
      clicks: v.number()
    }),
    
    // Optimization
    lastOptimized: v.optional(v.number()),
    optimizationScore: v.optional(v.number()),
    suggestedPrice: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number())
  })
    .index("by_inventory", ["inventoryId"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"]),
  
  // Financial transactions
  transactions: defineTable({
    // Type and references
    type: v.string(), // 'purchase', 'sale', 'fee', 'refund', 'adjustment'
    category: v.string(), // 'inventory', 'platform_fee', 'shipping', 'return'
    
    // References
    inventoryId: v.optional(v.id("inventory")),
    listingId: v.optional(v.id("listings")),
    negotiationId: v.optional(v.id("negotiations")),
    
    // Financial details
    amount: v.number(),
    currency: v.string(),
    
    // Fee breakdown
    fees: v.optional(v.object({
      platform: v.number(),
      payment: v.number(),
      shipping: v.number(),
      other: v.number(),
      total: v.number()
    })),
    
    netAmount: v.number(),
    
    // Parties
    counterparty: v.optional(v.object({
      type: v.string(), // 'buyer', 'seller', 'platform'
      id: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string())
    })),
    
    // Payment details
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.string(), // 'pending', 'processing', 'completed', 'failed', 'refunded'
    
    // Platform specifics
    platform: v.string(),
    platformTransactionId: v.optional(v.string()),
    
    // Status and timestamps
    status: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    
    // Accounting
    taxAmount: v.optional(v.number()),
    notes: v.optional(v.string())
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_date", ["createdAt"])
    .index("by_inventory", ["inventoryId"]),
  
  // Performance metrics and analytics
  metrics: defineTable({
    // Time period
    period: v.string(), // 'hour', 'day', 'week', 'month'
    timestamp: v.number(),
    date: v.string(), // YYYY-MM-DD
    
    // Discovery metrics
    discovery: v.object({
      opportunitiesFound: v.number(),
      opportunitiesAnalyzed: v.number(),
      opportunitiesApproved: v.number(),
      avgProfitScore: v.number()
    }),
    
    // Negotiation metrics
    negotiation: v.object({
      started: v.number(),
      completed: v.number(),
      successful: v.number(),
      avgRounds: v.number(),
      avgResponseTime: v.number(),
      avgDiscount: v.number()
    }),
    
    // Sales metrics
    sales: v.object({
      listed: v.number(),
      sold: v.number(),
      avgTimeToSell: v.number(),
      avgSalePrice: v.number()
    }),
    
    // Financial metrics
    financial: v.object({
      totalSpent: v.number(),
      totalRevenue: v.number(),
      totalProfit: v.number(),
      totalFees: v.number(),
      roi: v.number(),
      profitMargin: v.number()
    }),
    
    // Efficiency metrics
    efficiency: v.object({
      automationRate: v.number(),
      errorRate: v.number(),
      avgProcessingTime: v.number()
    })
  })
    .index("by_period", ["period"])
    .index("by_date", ["date"])
    .index("by_timestamp", ["timestamp"]),
  
  // System configuration
  config: defineTable({
    key: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string())
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),
  
  // Agent memory (Hyperspell integration)
  memory: defineTable({
    // Categorization
    type: v.string(), // 'seller', 'product', 'strategy', 'pattern'
    category: v.string(),
    
    // Key for retrieval
    key: v.string(),
    
    // Memory content
    data: v.any(),
    
    // Embeddings for similarity search
    embedding: v.optional(v.array(v.number())),
    
    // Usage tracking
    accessCount: v.number(),
    lastAccessed: v.number(),
    
    // Metadata
    source: v.string(),
    confidence: v.number(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number())
  })
    .index("by_type", ["type"])
    .index("by_key", ["key"])
    .index("by_access", ["lastAccessed"]),
  
  // Alerts and notifications
  alerts: defineTable({
    type: v.string(), // 'opportunity', 'negotiation', 'sale', 'error', 'metric'
    severity: v.string(), // 'info', 'warning', 'error', 'critical'
    
    title: v.string(),
    message: v.string(),
    
    // Context
    context: v.optional(v.any()),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    
    // Status
    status: v.string(), // 'new', 'acknowledged', 'resolved', 'ignored'
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),
    
    // Actions
    suggestedAction: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    resolvedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"]),
  
  // Legacy tables (keeping for backward compatibility)
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
  
  // Budget management for flip commands
  budgets: defineTable({
    commandId: v.id("commands"),
    totalBudget: v.number(),
    spent: v.number(),
    reserved: v.number(), // pending transactions
    remaining: v.number(),
    status: v.string(), // 'active' | 'exhausted' | 'completed'
    createdAt: v.number(),
    expiresAt: v.number()
  })
    .index("by_command", ["commandId"])
    .index("by_status", ["status"]),
  
  // Flip commands for autonomous execution
  commands: defineTable({
    naturalLanguage: v.string(),
    parsed: v.object({
      budget: v.number(),
      quantity: v.number(),
      category: v.string(),
      constraints: v.any()
    }),
    status: v.string(), // 'parsing' | 'finding' | 'negotiating' | 'purchasing' | 'listing' | 'completed' | 'failed'
    currentStep: v.string(),
    budgetId: v.id("budgets"),
    itemsFound: v.number(),
    itemsPurchased: v.number(),
    itemsListed: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_budget", ["budgetId"]),
  
  // Approval workflow for command steps
  approvals: defineTable({
    commandId: v.id("commands"),
    type: v.string(), // 'find_item' | 'negotiate' | 'purchase' | 'list'
    context: v.any(), // item details, analysis, etc.
    status: v.string(), // 'pending' | 'approved' | 'rejected' | 'expired'
    requestedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
    reason: v.optional(v.string())
  })
    .index("by_command", ["commandId"])
    .index("by_status", ["status"])
});
