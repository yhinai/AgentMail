export declare const createProduct: import("convex/server").RegisteredMutation<"public", {
    category?: string;
    images?: string[];
    description: string;
    title: string;
    cost: number;
    targetPrice: number;
    condition: "new" | "like-new" | "used" | "refurbished";
}, Promise<import("convex/values").GenericId<"products">>>;
export declare const getProduct: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"products">;
}, Promise<{
    _id: import("convex/values").GenericId<"products">;
    _creationTime: number;
    category?: string;
    images?: string[];
    description: string;
    title: string;
    cost: number;
    targetPrice: number;
    condition: "new" | "like-new" | "used" | "refurbished";
}>>;
export declare const getAllProducts: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    _id: import("convex/values").GenericId<"products">;
    _creationTime: number;
    category?: string;
    images?: string[];
    description: string;
    title: string;
    cost: number;
    targetPrice: number;
    condition: "new" | "like-new" | "used" | "refurbished";
}[]>>;
export declare const createTransaction: import("convex/server").RegisteredMutation<"public", {
    completedAt?: number;
    status: "completed" | "refunded" | "negotiating" | "cancelled";
    product: string;
    buyerEmail: string;
    finalPrice: number;
    profit: number;
    initialPrice: number;
    listingUrls: string[];
    productId: string;
    cost: number;
    negotiationRounds: number;
}, Promise<import("convex/values").GenericId<"transactions">>>;
export declare const getTransaction: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"transactions">;
}, Promise<{
    _id: import("convex/values").GenericId<"transactions">;
    _creationTime: number;
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
}>>;
export declare const updateTransaction: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"transactions">;
    updates: {
        status?: "completed" | "refunded" | "negotiating" | "cancelled";
        finalPrice?: number;
        profit?: number;
        completedAt?: number;
    };
}, Promise<void>>;
export declare const getTransactionsByBuyer: import("convex/server").RegisteredQuery<"public", {
    email: string;
}, Promise<{
    _id: import("convex/values").GenericId<"transactions">;
    _creationTime: number;
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
}[]>>;
export declare const getBuyerProfile: import("convex/server").RegisteredQuery<"public", {
    email: string;
}, Promise<{
    _id: import("convex/values").GenericId<"buyerProfiles">;
    _creationTime: number;
    lastInteraction?: number;
    email: string;
    totalSpent: number;
    priceSensitivity: "high" | "low" | "medium";
    negotiationStyle: "aggressive" | "cooperative" | "passive";
    communicationPreference: "brief" | "detailed" | "friendly";
    averageDiscount: number;
}>>;
export declare const updateBuyerProfile: import("convex/server").RegisteredMutation<"public", {
    email: string;
    updates: {
        totalSpent?: number;
        priceSensitivity?: "high" | "low" | "medium";
        negotiationStyle?: "aggressive" | "cooperative" | "passive";
        communicationPreference?: "brief" | "detailed" | "friendly";
        averageDiscount?: number;
        lastInteraction?: number;
    };
}, Promise<void>>;
export declare const createNegotiationState: import("convex/server").RegisteredMutation<"public", {
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
}, Promise<import("convex/values").GenericId<"negotiationStates">>>;
export declare const getNegotiationState: import("convex/server").RegisteredQuery<"public", {
    threadId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"negotiationStates">;
    _creationTime: number;
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
}>>;
export declare const updateNegotiationState: import("convex/server").RegisteredMutation<"public", {
    threadId: string;
    updates: {
        status?: "accepted" | "rejected" | "closed" | "negotiating";
        currentPrice?: number;
        rounds?: number;
        offers?: {
            timestamp: number;
            price: number;
            from: "buyer" | "seller";
        }[];
        agreedPrice?: number;
    };
}, Promise<void>>;
export declare const getMetrics: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    _id: import("convex/values").GenericId<"metrics">;
    _creationTime: number;
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
} | {
    dealsCompleted: number;
    totalProfit: number;
    totalRevenue: number;
    conversionRate: number;
    averageResponseTime: number;
    averageNegotiationRounds: number;
    activeListings: number;
    emailsProcessed: number;
    lastUpdated: number;
}>>;
export declare const updateMetrics: import("convex/server").RegisteredMutation<"public", {
    dealsCompleted?: number;
    totalProfit?: number;
    totalRevenue?: number;
    conversionRate?: number;
    averageResponseTime?: number;
    averageNegotiationRounds?: number;
    activeListings?: number;
    emailsProcessed?: number;
}, Promise<void>>;
//# sourceMappingURL=functions.d.ts.map