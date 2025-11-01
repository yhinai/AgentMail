"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Complete AutoBazaaar Convex schema
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    // Discovered opportunities
    opportunities: (0, server_1.defineTable)({
        // Basic info
        externalId: values_1.v.string(),
        title: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        category: values_1.v.string(),
        platform: values_1.v.string(),
        url: values_1.v.string(),
        // Pricing
        listingPrice: values_1.v.number(),
        originalPrice: values_1.v.optional(values_1.v.number()),
        marketPrice: values_1.v.optional(values_1.v.number()),
        // Images and media
        images: values_1.v.array(values_1.v.string()),
        primaryImage: values_1.v.optional(values_1.v.string()),
        // Location
        location: values_1.v.optional(values_1.v.object({
            city: values_1.v.optional(values_1.v.string()),
            state: values_1.v.optional(values_1.v.string()),
            zip: values_1.v.optional(values_1.v.string()),
            coordinates: values_1.v.optional(values_1.v.object({
                lat: values_1.v.number(),
                lng: values_1.v.number()
            }))
        })),
        // Seller info
        seller: values_1.v.object({
            id: values_1.v.string(),
            name: values_1.v.optional(values_1.v.string()),
            email: values_1.v.optional(values_1.v.string()),
            phone: values_1.v.optional(values_1.v.string()),
            rating: values_1.v.optional(values_1.v.number()),
            responseTime: values_1.v.optional(values_1.v.string()),
            platform: values_1.v.string()
        }),
        // Analysis
        profitAnalysis: values_1.v.optional(values_1.v.object({
            purchasePrice: values_1.v.number(),
            estimatedSalePrice: values_1.v.number(),
            profitPotential: values_1.v.number(),
            profitMargin: values_1.v.number(),
            roi: values_1.v.number(),
            platformFees: values_1.v.number(),
            netProfit: values_1.v.number()
        })),
        marketData: values_1.v.optional(values_1.v.object({
            averagePrice: values_1.v.number(),
            pricePoints: values_1.v.array(values_1.v.number()),
            volatility: values_1.v.number(),
            demandScore: values_1.v.number(),
            competitorCount: values_1.v.number(),
            insights: values_1.v.array(values_1.v.string())
        })),
        riskAssessment: values_1.v.optional(values_1.v.object({
            score: values_1.v.number(),
            factors: values_1.v.array(values_1.v.string()),
            recommendation: values_1.v.string()
        })),
        // Scoring
        profitScore: values_1.v.number(),
        priorityScore: values_1.v.optional(values_1.v.number()),
        // Status
        status: values_1.v.string(), // 'discovered', 'analyzing', 'approved', 'negotiating', 'purchased', 'passed', 'expired'
        statusReason: values_1.v.optional(values_1.v.string()),
        // Timestamps
        discoveredAt: values_1.v.number(),
        analyzedAt: values_1.v.optional(values_1.v.number()),
        expiresAt: values_1.v.optional(values_1.v.number()),
        lastUpdated: values_1.v.number()
    })
        .index("by_status", ["status"])
        .index("by_platform", ["platform"])
        .index("by_score", ["profitScore"])
        .index("by_category", ["category"])
        .index("by_discovered", ["discoveredAt"]),
    // Negotiation threads
    negotiations: (0, server_1.defineTable)({
        opportunityId: values_1.v.id("opportunities"),
        threadId: values_1.v.string(),
        // Strategy
        strategy: values_1.v.string(),
        strategyParams: values_1.v.optional(values_1.v.any()),
        // Participants
        seller: values_1.v.object({
            email: values_1.v.string(),
            name: values_1.v.optional(values_1.v.string()),
            platform: values_1.v.string()
        }),
        // Negotiation rounds
        rounds: values_1.v.array(values_1.v.object({
            number: values_1.v.number(),
            timestamp: values_1.v.number(),
            type: values_1.v.string(), // 'initial', 'counter', 'accept', 'reject', 'follow_up'
            // Offers
            ourOffer: values_1.v.optional(values_1.v.number()),
            theirOffer: values_1.v.optional(values_1.v.number()),
            // Communication
            messageId: values_1.v.optional(values_1.v.string()),
            message: values_1.v.string(),
            response: values_1.v.optional(values_1.v.string()),
            responseTime: values_1.v.optional(values_1.v.number()),
            // Analysis
            sentiment: values_1.v.optional(values_1.v.string()),
            intent: values_1.v.optional(values_1.v.string()),
            concerns: values_1.v.optional(values_1.v.array(values_1.v.string())),
            // Status
            status: values_1.v.string()
        })),
        // Current state
        currentOffer: values_1.v.number(),
        maxAcceptable: values_1.v.number(),
        status: values_1.v.string(), // 'active', 'accepted', 'rejected', 'expired', 'abandoned'
        // Outcome
        finalPrice: values_1.v.optional(values_1.v.number()),
        savingsAchieved: values_1.v.optional(values_1.v.number()),
        // Metrics
        metrics: values_1.v.object({
            responseTime: values_1.v.optional(values_1.v.number()),
            openTime: values_1.v.optional(values_1.v.number()),
            clickCount: values_1.v.number(),
            roundCount: values_1.v.number()
        }),
        // Timestamps
        startedAt: values_1.v.number(),
        lastActivityAt: values_1.v.number(),
        completedAt: values_1.v.optional(values_1.v.number())
    })
        .index("by_status", ["status"])
        .index("by_opportunity", ["opportunityId"])
        .index("by_thread", ["threadId"]),
    // Purchased inventory
    inventory: (0, server_1.defineTable)({
        // References
        opportunityId: values_1.v.id("opportunities"),
        negotiationId: values_1.v.optional(values_1.v.id("negotiations")),
        // Item details
        title: values_1.v.string(),
        description: values_1.v.string(),
        category: values_1.v.string(),
        condition: values_1.v.string(),
        sku: values_1.v.optional(values_1.v.string()),
        // Images
        images: values_1.v.array(values_1.v.string()),
        processedImages: values_1.v.optional(values_1.v.array(values_1.v.object({
            url: values_1.v.string(),
            size: values_1.v.string(), // 'thumbnail', 'medium', 'large'
            width: values_1.v.number(),
            height: values_1.v.number()
        }))),
        // Purchase details
        purchasePrice: values_1.v.number(),
        purchasePlatform: values_1.v.string(),
        purchaseDate: values_1.v.number(),
        // Seller
        seller: values_1.v.object({
            id: values_1.v.string(),
            name: values_1.v.optional(values_1.v.string()),
            contact: values_1.v.optional(values_1.v.string())
        }),
        // Location/Storage
        location: values_1.v.string(), // 'in_transit', 'warehouse', 'listed', 'sold'
        storageLocation: values_1.v.optional(values_1.v.string()),
        // Status
        status: values_1.v.string(), // 'pending_delivery', 'in_stock', 'listed', 'sold', 'returned'
        // Timestamps
        acquiredAt: values_1.v.number(),
        listedAt: values_1.v.optional(values_1.v.number()),
        soldAt: values_1.v.optional(values_1.v.number())
    })
        .index("by_status", ["status"])
        .index("by_category", ["category"]),
    // Active listings across platforms
    listings: (0, server_1.defineTable)({
        inventoryId: values_1.v.id("inventory"),
        // Platform details
        platform: values_1.v.string(),
        platformListingId: values_1.v.string(),
        url: values_1.v.string(),
        // Listing content
        title: values_1.v.string(),
        description: values_1.v.string(),
        price: values_1.v.number(),
        shippingPrice: values_1.v.optional(values_1.v.number()),
        // Images
        images: values_1.v.array(values_1.v.string()),
        // Status
        status: values_1.v.string(), // 'draft', 'active', 'paused', 'sold', 'expired', 'removed'
        visibility: values_1.v.string(), // 'public', 'private', 'scheduled'
        // Performance metrics
        metrics: values_1.v.object({
            views: values_1.v.number(),
            watchers: values_1.v.number(),
            saves: values_1.v.number(),
            inquiries: values_1.v.number(),
            clicks: values_1.v.number()
        }),
        // Optimization
        lastOptimized: values_1.v.optional(values_1.v.number()),
        optimizationScore: values_1.v.optional(values_1.v.number()),
        suggestedPrice: values_1.v.optional(values_1.v.number()),
        // Timestamps
        createdAt: values_1.v.number(),
        updatedAt: values_1.v.number(),
        expiresAt: values_1.v.optional(values_1.v.number())
    })
        .index("by_inventory", ["inventoryId"])
        .index("by_platform", ["platform"])
        .index("by_status", ["status"]),
    // Financial transactions
    transactions: (0, server_1.defineTable)({
        // Type and references
        type: values_1.v.string(), // 'purchase', 'sale', 'fee', 'refund', 'adjustment'
        category: values_1.v.string(), // 'inventory', 'platform_fee', 'shipping', 'return'
        // References
        inventoryId: values_1.v.optional(values_1.v.id("inventory")),
        listingId: values_1.v.optional(values_1.v.id("listings")),
        negotiationId: values_1.v.optional(values_1.v.id("negotiations")),
        // Financial details
        amount: values_1.v.number(),
        currency: values_1.v.string(),
        // Fee breakdown
        fees: values_1.v.optional(values_1.v.object({
            platform: values_1.v.number(),
            payment: values_1.v.number(),
            shipping: values_1.v.number(),
            other: values_1.v.number(),
            total: values_1.v.number()
        })),
        netAmount: values_1.v.number(),
        // Parties
        counterparty: values_1.v.optional(values_1.v.object({
            type: values_1.v.string(), // 'buyer', 'seller', 'platform'
            id: values_1.v.string(),
            name: values_1.v.optional(values_1.v.string()),
            email: values_1.v.optional(values_1.v.string())
        })),
        // Payment details
        paymentMethod: values_1.v.optional(values_1.v.string()),
        paymentStatus: values_1.v.string(), // 'pending', 'processing', 'completed', 'failed', 'refunded'
        // Platform specifics
        platform: values_1.v.string(),
        platformTransactionId: values_1.v.optional(values_1.v.string()),
        // Status and timestamps
        status: values_1.v.string(),
        createdAt: values_1.v.number(),
        completedAt: values_1.v.optional(values_1.v.number()),
        // Accounting
        taxAmount: values_1.v.optional(values_1.v.number()),
        notes: values_1.v.optional(values_1.v.string())
    })
        .index("by_type", ["type"])
        .index("by_status", ["status"])
        .index("by_date", ["createdAt"])
        .index("by_inventory", ["inventoryId"]),
    // Performance metrics and analytics
    metrics: (0, server_1.defineTable)({
        // Time period
        period: values_1.v.string(), // 'hour', 'day', 'week', 'month'
        timestamp: values_1.v.number(),
        date: values_1.v.string(), // YYYY-MM-DD
        // Discovery metrics
        discovery: values_1.v.object({
            opportunitiesFound: values_1.v.number(),
            opportunitiesAnalyzed: values_1.v.number(),
            opportunitiesApproved: values_1.v.number(),
            avgProfitScore: values_1.v.number()
        }),
        // Negotiation metrics
        negotiation: values_1.v.object({
            started: values_1.v.number(),
            completed: values_1.v.number(),
            successful: values_1.v.number(),
            avgRounds: values_1.v.number(),
            avgResponseTime: values_1.v.number(),
            avgDiscount: values_1.v.number()
        }),
        // Sales metrics
        sales: values_1.v.object({
            listed: values_1.v.number(),
            sold: values_1.v.number(),
            avgTimeToSell: values_1.v.number(),
            avgSalePrice: values_1.v.number()
        }),
        // Financial metrics
        financial: values_1.v.object({
            totalSpent: values_1.v.number(),
            totalRevenue: values_1.v.number(),
            totalProfit: values_1.v.number(),
            totalFees: values_1.v.number(),
            roi: values_1.v.number(),
            profitMargin: values_1.v.number()
        }),
        // Efficiency metrics
        efficiency: values_1.v.object({
            automationRate: values_1.v.number(),
            errorRate: values_1.v.number(),
            avgProcessingTime: values_1.v.number()
        })
    })
        .index("by_period", ["period"])
        .index("by_date", ["date"])
        .index("by_timestamp", ["timestamp"]),
    // System configuration
    config: (0, server_1.defineTable)({
        key: values_1.v.string(),
        value: values_1.v.any(),
        category: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        updatedAt: values_1.v.number(),
        updatedBy: values_1.v.optional(values_1.v.string())
    })
        .index("by_key", ["key"])
        .index("by_category", ["category"]),
    // Agent memory (Hyperspell integration)
    memory: (0, server_1.defineTable)({
        // Categorization
        type: values_1.v.string(), // 'seller', 'product', 'strategy', 'pattern'
        category: values_1.v.string(),
        // Key for retrieval
        key: values_1.v.string(),
        // Memory content
        data: values_1.v.any(),
        // Embeddings for similarity search
        embedding: values_1.v.optional(values_1.v.array(values_1.v.number())),
        // Usage tracking
        accessCount: values_1.v.number(),
        lastAccessed: values_1.v.number(),
        // Metadata
        source: values_1.v.string(),
        confidence: values_1.v.number(),
        // Timestamps
        createdAt: values_1.v.number(),
        updatedAt: values_1.v.number(),
        expiresAt: values_1.v.optional(values_1.v.number())
    })
        .index("by_type", ["type"])
        .index("by_key", ["key"])
        .index("by_access", ["lastAccessed"]),
    // Alerts and notifications
    alerts: (0, server_1.defineTable)({
        type: values_1.v.string(), // 'opportunity', 'negotiation', 'sale', 'error', 'metric'
        severity: values_1.v.string(), // 'info', 'warning', 'error', 'critical'
        title: values_1.v.string(),
        message: values_1.v.string(),
        // Context
        context: values_1.v.optional(values_1.v.any()),
        relatedId: values_1.v.optional(values_1.v.string()),
        relatedType: values_1.v.optional(values_1.v.string()),
        // Status
        status: values_1.v.string(), // 'new', 'acknowledged', 'resolved', 'ignored'
        acknowledgedAt: values_1.v.optional(values_1.v.number()),
        acknowledgedBy: values_1.v.optional(values_1.v.string()),
        // Actions
        suggestedAction: values_1.v.optional(values_1.v.string()),
        actionTaken: values_1.v.optional(values_1.v.string()),
        // Timestamps
        createdAt: values_1.v.number(),
        resolvedAt: values_1.v.optional(values_1.v.number())
    })
        .index("by_status", ["status"])
        .index("by_severity", ["severity"])
        .index("by_type", ["type"])
        .index("by_created", ["createdAt"]),
    // Legacy tables (keeping for backward compatibility)
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
    }).index('by_thread', ['threadId'])
});
//# sourceMappingURL=schema.js.map