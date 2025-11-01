declare const _default: import("convex/server").SchemaDefinition<{
    opportunities: import("convex/server").TableDefinition<import("convex/values").VObject<{
        profitAnalysis?: {
            purchasePrice: number;
            estimatedSalePrice: number;
            profitPotential: number;
            profitMargin: number;
            roi: number;
            platformFees: number;
            netProfit: number;
        };
        description?: string;
        originalPrice?: number;
        marketPrice?: number;
        primaryImage?: string;
        location?: {
            city?: string;
            state?: string;
            zip?: string;
            coordinates?: {
                lat: number;
                lng: number;
            };
        };
        marketData?: {
            averagePrice: number;
            pricePoints: number[];
            volatility: number;
            demandScore: number;
            competitorCount: number;
            insights: string[];
        };
        riskAssessment?: {
            score: number;
            factors: string[];
            recommendation: string;
        };
        priorityScore?: number;
        statusReason?: string;
        analyzedAt?: number;
        expiresAt?: number;
        url: string;
        seller: {
            name?: string;
            email?: string;
            phone?: string;
            rating?: number;
            responseTime?: string;
            id: string;
            platform: string;
        };
        platform: string;
        lastUpdated: number;
        title: string;
        status: string;
        category: string;
        images: string[];
        externalId: string;
        listingPrice: number;
        profitScore: number;
        discoveredAt: number;
    }, {
        externalId: import("convex/values").VString<string, "required">;
        title: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string, "optional">;
        category: import("convex/values").VString<string, "required">;
        platform: import("convex/values").VString<string, "required">;
        url: import("convex/values").VString<string, "required">;
        listingPrice: import("convex/values").VFloat64<number, "required">;
        originalPrice: import("convex/values").VFloat64<number, "optional">;
        marketPrice: import("convex/values").VFloat64<number, "optional">;
        images: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        primaryImage: import("convex/values").VString<string, "optional">;
        location: import("convex/values").VObject<{
            city?: string;
            state?: string;
            zip?: string;
            coordinates?: {
                lat: number;
                lng: number;
            };
        }, {
            city: import("convex/values").VString<string, "optional">;
            state: import("convex/values").VString<string, "optional">;
            zip: import("convex/values").VString<string, "optional">;
            coordinates: import("convex/values").VObject<{
                lat: number;
                lng: number;
            }, {
                lat: import("convex/values").VFloat64<number, "required">;
                lng: import("convex/values").VFloat64<number, "required">;
            }, "optional", "lat" | "lng">;
        }, "optional", "city" | "state" | "zip" | "coordinates" | "coordinates.lat" | "coordinates.lng">;
        seller: import("convex/values").VObject<{
            name?: string;
            email?: string;
            phone?: string;
            rating?: number;
            responseTime?: string;
            id: string;
            platform: string;
        }, {
            id: import("convex/values").VString<string, "required">;
            name: import("convex/values").VString<string, "optional">;
            email: import("convex/values").VString<string, "optional">;
            phone: import("convex/values").VString<string, "optional">;
            rating: import("convex/values").VFloat64<number, "optional">;
            responseTime: import("convex/values").VString<string, "optional">;
            platform: import("convex/values").VString<string, "required">;
        }, "required", "id" | "name" | "platform" | "email" | "phone" | "rating" | "responseTime">;
        profitAnalysis: import("convex/values").VObject<{
            purchasePrice: number;
            estimatedSalePrice: number;
            profitPotential: number;
            profitMargin: number;
            roi: number;
            platformFees: number;
            netProfit: number;
        }, {
            purchasePrice: import("convex/values").VFloat64<number, "required">;
            estimatedSalePrice: import("convex/values").VFloat64<number, "required">;
            profitPotential: import("convex/values").VFloat64<number, "required">;
            profitMargin: import("convex/values").VFloat64<number, "required">;
            roi: import("convex/values").VFloat64<number, "required">;
            platformFees: import("convex/values").VFloat64<number, "required">;
            netProfit: import("convex/values").VFloat64<number, "required">;
        }, "optional", "purchasePrice" | "estimatedSalePrice" | "profitPotential" | "profitMargin" | "roi" | "platformFees" | "netProfit">;
        marketData: import("convex/values").VObject<{
            averagePrice: number;
            pricePoints: number[];
            volatility: number;
            demandScore: number;
            competitorCount: number;
            insights: string[];
        }, {
            averagePrice: import("convex/values").VFloat64<number, "required">;
            pricePoints: import("convex/values").VArray<number[], import("convex/values").VFloat64<number, "required">, "required">;
            volatility: import("convex/values").VFloat64<number, "required">;
            demandScore: import("convex/values").VFloat64<number, "required">;
            competitorCount: import("convex/values").VFloat64<number, "required">;
            insights: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        }, "optional", "averagePrice" | "pricePoints" | "volatility" | "demandScore" | "competitorCount" | "insights">;
        riskAssessment: import("convex/values").VObject<{
            score: number;
            factors: string[];
            recommendation: string;
        }, {
            score: import("convex/values").VFloat64<number, "required">;
            factors: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
            recommendation: import("convex/values").VString<string, "required">;
        }, "optional", "score" | "factors" | "recommendation">;
        profitScore: import("convex/values").VFloat64<number, "required">;
        priorityScore: import("convex/values").VFloat64<number, "optional">;
        status: import("convex/values").VString<string, "required">;
        statusReason: import("convex/values").VString<string, "optional">;
        discoveredAt: import("convex/values").VFloat64<number, "required">;
        analyzedAt: import("convex/values").VFloat64<number, "optional">;
        expiresAt: import("convex/values").VFloat64<number, "optional">;
        lastUpdated: import("convex/values").VFloat64<number, "required">;
    }, "required", "url" | "profitAnalysis" | "description" | "seller" | "platform" | "lastUpdated" | "title" | "status" | "category" | "images" | "externalId" | "listingPrice" | "originalPrice" | "marketPrice" | "primaryImage" | "location" | "marketData" | "riskAssessment" | "profitScore" | "priorityScore" | "statusReason" | "discoveredAt" | "analyzedAt" | "expiresAt" | "profitAnalysis.purchasePrice" | "profitAnalysis.estimatedSalePrice" | "profitAnalysis.profitPotential" | "profitAnalysis.profitMargin" | "profitAnalysis.roi" | "profitAnalysis.platformFees" | "profitAnalysis.netProfit" | "seller.id" | "seller.name" | "seller.platform" | "seller.email" | "seller.phone" | "seller.rating" | "seller.responseTime" | "location.city" | "location.state" | "location.zip" | "location.coordinates" | "location.coordinates.lat" | "location.coordinates.lng" | "marketData.averagePrice" | "marketData.pricePoints" | "marketData.volatility" | "marketData.demandScore" | "marketData.competitorCount" | "marketData.insights" | "riskAssessment.score" | "riskAssessment.factors" | "riskAssessment.recommendation">, {
        by_status: ["status", "_creationTime"];
        by_platform: ["platform", "_creationTime"];
        by_score: ["profitScore", "_creationTime"];
        by_category: ["category", "_creationTime"];
        by_discovered: ["discoveredAt", "_creationTime"];
    }, {}, {}>;
    negotiations: import("convex/server").TableDefinition<import("convex/values").VObject<{
        finalPrice?: number;
        completedAt?: number;
        strategyParams?: any;
        savingsAchieved?: number;
        metrics: {
            responseTime?: number;
            openTime?: number;
            clickCount: number;
            roundCount: number;
        };
        strategy: string;
        seller: {
            name?: string;
            platform: string;
            email: string;
        };
        status: string;
        threadId: string;
        rounds: {
            responseTime?: number;
            ourOffer?: number;
            theirOffer?: number;
            messageId?: string;
            response?: string;
            sentiment?: string;
            intent?: string;
            concerns?: string[];
            number: number;
            type: string;
            message: string;
            status: string;
            timestamp: number;
        }[];
        opportunityId: import("convex/values").GenericId<"opportunities">;
        currentOffer: number;
        maxAcceptable: number;
        startedAt: number;
        lastActivityAt: number;
    }, {
        opportunityId: import("convex/values").VId<import("convex/values").GenericId<"opportunities">, "required">;
        threadId: import("convex/values").VString<string, "required">;
        strategy: import("convex/values").VString<string, "required">;
        strategyParams: import("convex/values").VAny<any, "optional", string>;
        seller: import("convex/values").VObject<{
            name?: string;
            platform: string;
            email: string;
        }, {
            email: import("convex/values").VString<string, "required">;
            name: import("convex/values").VString<string, "optional">;
            platform: import("convex/values").VString<string, "required">;
        }, "required", "name" | "platform" | "email">;
        rounds: import("convex/values").VArray<{
            responseTime?: number;
            ourOffer?: number;
            theirOffer?: number;
            messageId?: string;
            response?: string;
            sentiment?: string;
            intent?: string;
            concerns?: string[];
            number: number;
            type: string;
            message: string;
            status: string;
            timestamp: number;
        }[], import("convex/values").VObject<{
            responseTime?: number;
            ourOffer?: number;
            theirOffer?: number;
            messageId?: string;
            response?: string;
            sentiment?: string;
            intent?: string;
            concerns?: string[];
            number: number;
            type: string;
            message: string;
            status: string;
            timestamp: number;
        }, {
            number: import("convex/values").VFloat64<number, "required">;
            timestamp: import("convex/values").VFloat64<number, "required">;
            type: import("convex/values").VString<string, "required">;
            ourOffer: import("convex/values").VFloat64<number, "optional">;
            theirOffer: import("convex/values").VFloat64<number, "optional">;
            messageId: import("convex/values").VString<string, "optional">;
            message: import("convex/values").VString<string, "required">;
            response: import("convex/values").VString<string, "optional">;
            responseTime: import("convex/values").VFloat64<number, "optional">;
            sentiment: import("convex/values").VString<string, "optional">;
            intent: import("convex/values").VString<string, "optional">;
            concerns: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "optional">;
            status: import("convex/values").VString<string, "required">;
        }, "required", "number" | "type" | "message" | "status" | "responseTime" | "timestamp" | "ourOffer" | "theirOffer" | "messageId" | "response" | "sentiment" | "intent" | "concerns">, "required">;
        currentOffer: import("convex/values").VFloat64<number, "required">;
        maxAcceptable: import("convex/values").VFloat64<number, "required">;
        status: import("convex/values").VString<string, "required">;
        finalPrice: import("convex/values").VFloat64<number, "optional">;
        savingsAchieved: import("convex/values").VFloat64<number, "optional">;
        metrics: import("convex/values").VObject<{
            responseTime?: number;
            openTime?: number;
            clickCount: number;
            roundCount: number;
        }, {
            responseTime: import("convex/values").VFloat64<number, "optional">;
            openTime: import("convex/values").VFloat64<number, "optional">;
            clickCount: import("convex/values").VFloat64<number, "required">;
            roundCount: import("convex/values").VFloat64<number, "required">;
        }, "required", "responseTime" | "openTime" | "clickCount" | "roundCount">;
        startedAt: import("convex/values").VFloat64<number, "required">;
        lastActivityAt: import("convex/values").VFloat64<number, "required">;
        completedAt: import("convex/values").VFloat64<number, "optional">;
    }, "required", "metrics" | "strategy" | "seller" | "status" | "finalPrice" | "threadId" | "rounds" | "completedAt" | "seller.name" | "seller.platform" | "seller.email" | "opportunityId" | "strategyParams" | "currentOffer" | "maxAcceptable" | "savingsAchieved" | "startedAt" | "lastActivityAt" | "metrics.responseTime" | "metrics.openTime" | "metrics.clickCount" | "metrics.roundCount" | `strategyParams.${string}`>, {
        by_status: ["status", "_creationTime"];
        by_opportunity: ["opportunityId", "_creationTime"];
        by_thread: ["threadId", "_creationTime"];
    }, {}, {}>;
    inventory: import("convex/server").TableDefinition<import("convex/values").VObject<{
        negotiationId?: import("convex/values").GenericId<"negotiations">;
        sku?: string;
        processedImages?: {
            size: string;
            url: string;
            width: number;
            height: number;
        }[];
        storageLocation?: string;
        listedAt?: number;
        soldAt?: number;
        description: string;
        seller: {
            name?: string;
            contact?: string;
            id: string;
        };
        title: string;
        status: string;
        category: string;
        images: string[];
        condition: string;
        location: string;
        purchasePrice: number;
        opportunityId: import("convex/values").GenericId<"opportunities">;
        purchasePlatform: string;
        purchaseDate: number;
        acquiredAt: number;
    }, {
        opportunityId: import("convex/values").VId<import("convex/values").GenericId<"opportunities">, "required">;
        negotiationId: import("convex/values").VId<import("convex/values").GenericId<"negotiations">, "optional">;
        title: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string, "required">;
        category: import("convex/values").VString<string, "required">;
        condition: import("convex/values").VString<string, "required">;
        sku: import("convex/values").VString<string, "optional">;
        images: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        processedImages: import("convex/values").VArray<{
            size: string;
            url: string;
            width: number;
            height: number;
        }[], import("convex/values").VObject<{
            size: string;
            url: string;
            width: number;
            height: number;
        }, {
            url: import("convex/values").VString<string, "required">;
            size: import("convex/values").VString<string, "required">;
            width: import("convex/values").VFloat64<number, "required">;
            height: import("convex/values").VFloat64<number, "required">;
        }, "required", "size" | "url" | "width" | "height">, "optional">;
        purchasePrice: import("convex/values").VFloat64<number, "required">;
        purchasePlatform: import("convex/values").VString<string, "required">;
        purchaseDate: import("convex/values").VFloat64<number, "required">;
        seller: import("convex/values").VObject<{
            name?: string;
            contact?: string;
            id: string;
        }, {
            id: import("convex/values").VString<string, "required">;
            name: import("convex/values").VString<string, "optional">;
            contact: import("convex/values").VString<string, "optional">;
        }, "required", "id" | "name" | "contact">;
        location: import("convex/values").VString<string, "required">;
        storageLocation: import("convex/values").VString<string, "optional">;
        status: import("convex/values").VString<string, "required">;
        acquiredAt: import("convex/values").VFloat64<number, "required">;
        listedAt: import("convex/values").VFloat64<number, "optional">;
        soldAt: import("convex/values").VFloat64<number, "optional">;
    }, "required", "description" | "seller" | "title" | "status" | "category" | "negotiationId" | "images" | "condition" | "location" | "purchasePrice" | "seller.id" | "seller.name" | "opportunityId" | "sku" | "processedImages" | "purchasePlatform" | "purchaseDate" | "storageLocation" | "acquiredAt" | "listedAt" | "soldAt" | "seller.contact">, {
        by_status: ["status", "_creationTime"];
        by_category: ["category", "_creationTime"];
    }, {}, {}>;
    listings: import("convex/server").TableDefinition<import("convex/values").VObject<{
        expiresAt?: number;
        shippingPrice?: number;
        lastOptimized?: number;
        optimizationScore?: number;
        suggestedPrice?: number;
        url: string;
        metrics: {
            views: number;
            watchers: number;
            saves: number;
            inquiries: number;
            clicks: number;
        };
        description: string;
        platform: string;
        title: string;
        status: string;
        createdAt: number;
        inventoryId: import("convex/values").GenericId<"inventory">;
        images: string[];
        platformListingId: string;
        price: number;
        visibility: string;
        updatedAt: number;
    }, {
        inventoryId: import("convex/values").VId<import("convex/values").GenericId<"inventory">, "required">;
        platform: import("convex/values").VString<string, "required">;
        platformListingId: import("convex/values").VString<string, "required">;
        url: import("convex/values").VString<string, "required">;
        title: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string, "required">;
        price: import("convex/values").VFloat64<number, "required">;
        shippingPrice: import("convex/values").VFloat64<number, "optional">;
        images: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        status: import("convex/values").VString<string, "required">;
        visibility: import("convex/values").VString<string, "required">;
        metrics: import("convex/values").VObject<{
            views: number;
            watchers: number;
            saves: number;
            inquiries: number;
            clicks: number;
        }, {
            views: import("convex/values").VFloat64<number, "required">;
            watchers: import("convex/values").VFloat64<number, "required">;
            saves: import("convex/values").VFloat64<number, "required">;
            inquiries: import("convex/values").VFloat64<number, "required">;
            clicks: import("convex/values").VFloat64<number, "required">;
        }, "required", "views" | "watchers" | "saves" | "inquiries" | "clicks">;
        lastOptimized: import("convex/values").VFloat64<number, "optional">;
        optimizationScore: import("convex/values").VFloat64<number, "optional">;
        suggestedPrice: import("convex/values").VFloat64<number, "optional">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
        expiresAt: import("convex/values").VFloat64<number, "optional">;
    }, "required", "url" | "metrics" | "description" | "platform" | "title" | "status" | "createdAt" | "inventoryId" | "images" | "expiresAt" | "platformListingId" | "price" | "shippingPrice" | "visibility" | "lastOptimized" | "optimizationScore" | "suggestedPrice" | "updatedAt" | "metrics.views" | "metrics.watchers" | "metrics.saves" | "metrics.inquiries" | "metrics.clicks">, {
        by_inventory: ["inventoryId", "_creationTime"];
        by_platform: ["platform", "_creationTime"];
        by_status: ["status", "_creationTime"];
    }, {}, {}>;
    transactions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        inventoryId?: import("convex/values").GenericId<"inventory">;
        listingId?: import("convex/values").GenericId<"listings">;
        negotiationId?: import("convex/values").GenericId<"negotiations">;
        fees?: {
            other: number;
            shipping: number;
            platform: number;
            payment: number;
            total: number;
        };
        counterparty?: {
            name?: string;
            email?: string;
            type: string;
            id: string;
        };
        paymentMethod?: string;
        platformTransactionId?: string;
        completedAt?: number;
        taxAmount?: number;
        notes?: string;
        type: string;
        platform: string;
        status: string;
        createdAt: number;
        category: string;
        amount: number;
        currency: string;
        netAmount: number;
        paymentStatus: string;
    }, {
        type: import("convex/values").VString<string, "required">;
        category: import("convex/values").VString<string, "required">;
        inventoryId: import("convex/values").VId<import("convex/values").GenericId<"inventory">, "optional">;
        listingId: import("convex/values").VId<import("convex/values").GenericId<"listings">, "optional">;
        negotiationId: import("convex/values").VId<import("convex/values").GenericId<"negotiations">, "optional">;
        amount: import("convex/values").VFloat64<number, "required">;
        currency: import("convex/values").VString<string, "required">;
        fees: import("convex/values").VObject<{
            other: number;
            shipping: number;
            platform: number;
            payment: number;
            total: number;
        }, {
            platform: import("convex/values").VFloat64<number, "required">;
            payment: import("convex/values").VFloat64<number, "required">;
            shipping: import("convex/values").VFloat64<number, "required">;
            other: import("convex/values").VFloat64<number, "required">;
            total: import("convex/values").VFloat64<number, "required">;
        }, "optional", "other" | "shipping" | "platform" | "payment" | "total">;
        netAmount: import("convex/values").VFloat64<number, "required">;
        counterparty: import("convex/values").VObject<{
            name?: string;
            email?: string;
            type: string;
            id: string;
        }, {
            type: import("convex/values").VString<string, "required">;
            id: import("convex/values").VString<string, "required">;
            name: import("convex/values").VString<string, "optional">;
            email: import("convex/values").VString<string, "optional">;
        }, "optional", "type" | "id" | "name" | "email">;
        paymentMethod: import("convex/values").VString<string, "optional">;
        paymentStatus: import("convex/values").VString<string, "required">;
        platform: import("convex/values").VString<string, "required">;
        platformTransactionId: import("convex/values").VString<string, "optional">;
        status: import("convex/values").VString<string, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        completedAt: import("convex/values").VFloat64<number, "optional">;
        taxAmount: import("convex/values").VFloat64<number, "optional">;
        notes: import("convex/values").VString<string, "optional">;
    }, "required", "type" | "platform" | "status" | "createdAt" | "category" | "inventoryId" | "listingId" | "negotiationId" | "amount" | "currency" | "fees" | "netAmount" | "counterparty" | "paymentMethod" | "paymentStatus" | "platformTransactionId" | "completedAt" | "taxAmount" | "notes" | "fees.other" | "fees.shipping" | "fees.platform" | "fees.payment" | "fees.total" | "counterparty.type" | "counterparty.id" | "counterparty.name" | "counterparty.email">, {
        by_type: ["type", "_creationTime"];
        by_status: ["status", "_creationTime"];
        by_date: ["createdAt", "_creationTime"];
        by_inventory: ["inventoryId", "_creationTime"];
    }, {}, {}>;
    metrics: import("convex/server").TableDefinition<import("convex/values").VObject<{
        negotiation: {
            completed: number;
            started: number;
            successful: number;
            avgRounds: number;
            avgResponseTime: number;
            avgDiscount: number;
        };
        timestamp: number;
        period: string;
        date: string;
        discovery: {
            opportunitiesFound: number;
            opportunitiesAnalyzed: number;
            opportunitiesApproved: number;
            avgProfitScore: number;
        };
        sales: {
            listed: number;
            sold: number;
            avgTimeToSell: number;
            avgSalePrice: number;
        };
        financial: {
            totalProfit: number;
            totalRevenue: number;
            profitMargin: number;
            roi: number;
            totalSpent: number;
            totalFees: number;
        };
        efficiency: {
            automationRate: number;
            errorRate: number;
            avgProcessingTime: number;
        };
    }, {
        period: import("convex/values").VString<string, "required">;
        timestamp: import("convex/values").VFloat64<number, "required">;
        date: import("convex/values").VString<string, "required">;
        discovery: import("convex/values").VObject<{
            opportunitiesFound: number;
            opportunitiesAnalyzed: number;
            opportunitiesApproved: number;
            avgProfitScore: number;
        }, {
            opportunitiesFound: import("convex/values").VFloat64<number, "required">;
            opportunitiesAnalyzed: import("convex/values").VFloat64<number, "required">;
            opportunitiesApproved: import("convex/values").VFloat64<number, "required">;
            avgProfitScore: import("convex/values").VFloat64<number, "required">;
        }, "required", "opportunitiesFound" | "opportunitiesAnalyzed" | "opportunitiesApproved" | "avgProfitScore">;
        negotiation: import("convex/values").VObject<{
            completed: number;
            started: number;
            successful: number;
            avgRounds: number;
            avgResponseTime: number;
            avgDiscount: number;
        }, {
            started: import("convex/values").VFloat64<number, "required">;
            completed: import("convex/values").VFloat64<number, "required">;
            successful: import("convex/values").VFloat64<number, "required">;
            avgRounds: import("convex/values").VFloat64<number, "required">;
            avgResponseTime: import("convex/values").VFloat64<number, "required">;
            avgDiscount: import("convex/values").VFloat64<number, "required">;
        }, "required", "completed" | "started" | "successful" | "avgRounds" | "avgResponseTime" | "avgDiscount">;
        sales: import("convex/values").VObject<{
            listed: number;
            sold: number;
            avgTimeToSell: number;
            avgSalePrice: number;
        }, {
            listed: import("convex/values").VFloat64<number, "required">;
            sold: import("convex/values").VFloat64<number, "required">;
            avgTimeToSell: import("convex/values").VFloat64<number, "required">;
            avgSalePrice: import("convex/values").VFloat64<number, "required">;
        }, "required", "listed" | "sold" | "avgTimeToSell" | "avgSalePrice">;
        financial: import("convex/values").VObject<{
            totalProfit: number;
            totalRevenue: number;
            profitMargin: number;
            roi: number;
            totalSpent: number;
            totalFees: number;
        }, {
            totalSpent: import("convex/values").VFloat64<number, "required">;
            totalRevenue: import("convex/values").VFloat64<number, "required">;
            totalProfit: import("convex/values").VFloat64<number, "required">;
            totalFees: import("convex/values").VFloat64<number, "required">;
            roi: import("convex/values").VFloat64<number, "required">;
            profitMargin: import("convex/values").VFloat64<number, "required">;
        }, "required", "totalProfit" | "totalRevenue" | "profitMargin" | "roi" | "totalSpent" | "totalFees">;
        efficiency: import("convex/values").VObject<{
            automationRate: number;
            errorRate: number;
            avgProcessingTime: number;
        }, {
            automationRate: import("convex/values").VFloat64<number, "required">;
            errorRate: import("convex/values").VFloat64<number, "required">;
            avgProcessingTime: import("convex/values").VFloat64<number, "required">;
        }, "required", "automationRate" | "errorRate" | "avgProcessingTime">;
    }, "required", "negotiation" | "negotiation.started" | "timestamp" | "period" | "date" | "discovery" | "sales" | "financial" | "efficiency" | "negotiation.completed" | "negotiation.successful" | "negotiation.avgRounds" | "negotiation.avgResponseTime" | "negotiation.avgDiscount" | "discovery.opportunitiesFound" | "discovery.opportunitiesAnalyzed" | "discovery.opportunitiesApproved" | "discovery.avgProfitScore" | "sales.listed" | "sales.sold" | "sales.avgTimeToSell" | "sales.avgSalePrice" | "financial.totalProfit" | "financial.totalRevenue" | "financial.profitMargin" | "financial.roi" | "financial.totalSpent" | "financial.totalFees" | "efficiency.automationRate" | "efficiency.errorRate" | "efficiency.avgProcessingTime">, {
        by_period: ["period", "_creationTime"];
        by_date: ["date", "_creationTime"];
        by_timestamp: ["timestamp", "_creationTime"];
    }, {}, {}>;
    config: import("convex/server").TableDefinition<import("convex/values").VObject<{
        description?: string;
        updatedBy?: string;
        key: string;
        category: string;
        updatedAt: number;
        value: any;
    }, {
        key: import("convex/values").VString<string, "required">;
        value: import("convex/values").VAny<any, "required", string>;
        category: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string, "optional">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
        updatedBy: import("convex/values").VString<string, "optional">;
    }, "required", "key" | "description" | "category" | "updatedAt" | "value" | "updatedBy" | `value.${string}`>, {
        by_key: ["key", "_creationTime"];
        by_category: ["category", "_creationTime"];
    }, {}, {}>;
    memory: import("convex/server").TableDefinition<import("convex/values").VObject<{
        expiresAt?: number;
        embedding?: number[];
        type: string;
        key: string;
        data: any;
        source: string;
        createdAt: number;
        category: string;
        updatedAt: number;
        accessCount: number;
        lastAccessed: number;
        confidence: number;
    }, {
        type: import("convex/values").VString<string, "required">;
        category: import("convex/values").VString<string, "required">;
        key: import("convex/values").VString<string, "required">;
        data: import("convex/values").VAny<any, "required", string>;
        embedding: import("convex/values").VArray<number[], import("convex/values").VFloat64<number, "required">, "optional">;
        accessCount: import("convex/values").VFloat64<number, "required">;
        lastAccessed: import("convex/values").VFloat64<number, "required">;
        source: import("convex/values").VString<string, "required">;
        confidence: import("convex/values").VFloat64<number, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
        expiresAt: import("convex/values").VFloat64<number, "optional">;
    }, "required", "type" | "key" | "data" | "source" | "createdAt" | "category" | "expiresAt" | "updatedAt" | "embedding" | "accessCount" | "lastAccessed" | "confidence" | `data.${string}`>, {
        by_type: ["type", "_creationTime"];
        by_key: ["key", "_creationTime"];
        by_access: ["lastAccessed", "_creationTime"];
    }, {}, {}>;
    alerts: import("convex/server").TableDefinition<import("convex/values").VObject<{
        context?: any;
        relatedId?: string;
        relatedType?: string;
        acknowledgedAt?: number;
        acknowledgedBy?: string;
        suggestedAction?: string;
        actionTaken?: string;
        resolvedAt?: number;
        type: string;
        message: string;
        title: string;
        status: string;
        createdAt: number;
        severity: string;
    }, {
        type: import("convex/values").VString<string, "required">;
        severity: import("convex/values").VString<string, "required">;
        title: import("convex/values").VString<string, "required">;
        message: import("convex/values").VString<string, "required">;
        context: import("convex/values").VAny<any, "optional", string>;
        relatedId: import("convex/values").VString<string, "optional">;
        relatedType: import("convex/values").VString<string, "optional">;
        status: import("convex/values").VString<string, "required">;
        acknowledgedAt: import("convex/values").VFloat64<number, "optional">;
        acknowledgedBy: import("convex/values").VString<string, "optional">;
        suggestedAction: import("convex/values").VString<string, "optional">;
        actionTaken: import("convex/values").VString<string, "optional">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        resolvedAt: import("convex/values").VFloat64<number, "optional">;
    }, "required", "type" | "message" | "title" | "status" | "createdAt" | "severity" | "context" | "relatedId" | "relatedType" | "acknowledgedAt" | "acknowledgedBy" | "suggestedAction" | "actionTaken" | "resolvedAt" | `context.${string}`>, {
        by_status: ["status", "_creationTime"];
        by_severity: ["severity", "_creationTime"];
        by_type: ["type", "_creationTime"];
        by_created: ["createdAt", "_creationTime"];
    }, {}, {}>;
    products: import("convex/server").TableDefinition<import("convex/values").VObject<{
        category?: string;
        images?: string[];
        description: string;
        title: string;
        cost: number;
        targetPrice: number;
        condition: "new" | "like-new" | "used" | "refurbished";
    }, {
        title: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string, "required">;
        cost: import("convex/values").VFloat64<number, "required">;
        targetPrice: import("convex/values").VFloat64<number, "required">;
        category: import("convex/values").VString<string, "optional">;
        images: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "optional">;
        condition: import("convex/values").VUnion<"new" | "like-new" | "used" | "refurbished", [import("convex/values").VLiteral<"new", "required">, import("convex/values").VLiteral<"like-new", "required">, import("convex/values").VLiteral<"used", "required">, import("convex/values").VLiteral<"refurbished", "required">], "required", never>;
    }, "required", "description" | "title" | "category" | "cost" | "targetPrice" | "images" | "condition">, {}, {}, {}>;
    buyerProfiles: import("convex/server").TableDefinition<import("convex/values").VObject<{
        lastInteraction?: number;
        email: string;
        totalSpent: number;
        priceSensitivity: "high" | "low" | "medium";
        negotiationStyle: "aggressive" | "cooperative" | "passive";
        communicationPreference: "brief" | "detailed" | "friendly";
        averageDiscount: number;
    }, {
        email: import("convex/values").VString<string, "required">;
        priceSensitivity: import("convex/values").VUnion<"high" | "low" | "medium", [import("convex/values").VLiteral<"low", "required">, import("convex/values").VLiteral<"medium", "required">, import("convex/values").VLiteral<"high", "required">], "required", never>;
        negotiationStyle: import("convex/values").VUnion<"aggressive" | "cooperative" | "passive", [import("convex/values").VLiteral<"aggressive", "required">, import("convex/values").VLiteral<"cooperative", "required">, import("convex/values").VLiteral<"passive", "required">], "required", never>;
        communicationPreference: import("convex/values").VUnion<"brief" | "detailed" | "friendly", [import("convex/values").VLiteral<"brief", "required">, import("convex/values").VLiteral<"detailed", "required">, import("convex/values").VLiteral<"friendly", "required">], "required", never>;
        totalSpent: import("convex/values").VFloat64<number, "required">;
        averageDiscount: import("convex/values").VFloat64<number, "required">;
        lastInteraction: import("convex/values").VFloat64<number, "optional">;
    }, "required", "email" | "totalSpent" | "priceSensitivity" | "negotiationStyle" | "communicationPreference" | "averageDiscount" | "lastInteraction">, {
        by_email: ["email", "_creationTime"];
    }, {}, {}>;
    negotiationStates: import("convex/server").TableDefinition<import("convex/values").VObject<{
        agreedPrice?: number;
        status: "accepted" | "rejected" | "closed" | "negotiating";
        product: string;
        buyerEmail: string;
        threadId: string;
        currentPrice: number;
        initialPrice: number;
        minPrice: number;
        rounds: number;
        offers: {
            timestamp: number;
            price: number;
            from: "buyer" | "seller";
        }[];
        listingUrls: string[];
    }, {
        buyerEmail: import("convex/values").VString<string, "required">;
        product: import("convex/values").VString<string, "required">;
        threadId: import("convex/values").VString<string, "required">;
        currentPrice: import("convex/values").VFloat64<number, "required">;
        initialPrice: import("convex/values").VFloat64<number, "required">;
        minPrice: import("convex/values").VFloat64<number, "required">;
        rounds: import("convex/values").VFloat64<number, "required">;
        offers: import("convex/values").VArray<{
            timestamp: number;
            price: number;
            from: "buyer" | "seller";
        }[], import("convex/values").VObject<{
            timestamp: number;
            price: number;
            from: "buyer" | "seller";
        }, {
            price: import("convex/values").VFloat64<number, "required">;
            from: import("convex/values").VUnion<"buyer" | "seller", [import("convex/values").VLiteral<"buyer", "required">, import("convex/values").VLiteral<"seller", "required">], "required", never>;
            timestamp: import("convex/values").VFloat64<number, "required">;
        }, "required", "timestamp" | "price" | "from">, "required">;
        status: import("convex/values").VUnion<"accepted" | "rejected" | "closed" | "negotiating", [import("convex/values").VLiteral<"negotiating", "required">, import("convex/values").VLiteral<"accepted", "required">, import("convex/values").VLiteral<"rejected", "required">, import("convex/values").VLiteral<"closed", "required">], "required", never>;
        listingUrls: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        agreedPrice: import("convex/values").VFloat64<number, "optional">;
    }, "required", "status" | "product" | "buyerEmail" | "threadId" | "currentPrice" | "initialPrice" | "minPrice" | "rounds" | "offers" | "listingUrls" | "agreedPrice">, {
        by_thread: ["threadId", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map