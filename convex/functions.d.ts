export declare const createProduct: import("convex/server").RegisteredMutation<"public", {
    category?: string;
    images?: string[];
    cost: number;
    title: string;
    description: string;
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
    cost: number;
    title: string;
    description: string;
    targetPrice: number;
    condition: "new" | "like-new" | "used" | "refurbished";
}>>;
export declare const getAllProducts: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    _id: import("convex/values").GenericId<"products">;
    _creationTime: number;
    category?: string;
    images?: string[];
    cost: number;
    title: string;
    description: string;
    targetPrice: number;
    condition: "new" | "like-new" | "used" | "refurbished";
}[]>>;
export declare const createTransaction: import("convex/server").RegisteredMutation<"public", {
    completedAt?: number;
    buyerEmail: string;
    product: string;
    productId: string;
    initialPrice: number;
    finalPrice: number;
    cost: number;
    profit: number;
    status: "negotiating" | "completed" | "cancelled" | "refunded";
    negotiationRounds: number;
    listingUrls: string[];
}, Promise<import("convex/values").GenericId<"transactions">>>;
export declare const getTransaction: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"transactions">;
}, Promise<{
    _id: import("convex/values").GenericId<"transactions">;
    _creationTime: number;
    completedAt?: number;
    buyerEmail: string;
    product: string;
    productId: string;
    initialPrice: number;
    finalPrice: number;
    cost: number;
    profit: number;
    status: "negotiating" | "completed" | "cancelled" | "refunded";
    negotiationRounds: number;
    listingUrls: string[];
}>>;
export declare const updateTransaction: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"transactions">;
    updates: {
        finalPrice?: number;
        profit?: number;
        status?: "negotiating" | "completed" | "cancelled" | "refunded";
        completedAt?: number;
    };
}, Promise<void>>;
export declare const getTransactionsByBuyer: import("convex/server").RegisteredQuery<"public", {
    email: string;
}, Promise<{
    _id: import("convex/values").GenericId<"transactions">;
    _creationTime: number;
    completedAt?: number;
    buyerEmail: string;
    product: string;
    productId: string;
    initialPrice: number;
    finalPrice: number;
    cost: number;
    profit: number;
    status: "negotiating" | "completed" | "cancelled" | "refunded";
    negotiationRounds: number;
    listingUrls: string[];
}[]>>;
export declare const getBuyerProfile: import("convex/server").RegisteredQuery<"public", {
    email: string;
}, Promise<{
    _id: import("convex/values").GenericId<"buyerProfiles">;
    _creationTime: number;
    lastInteraction?: number;
    email: string;
    priceSensitivity: "low" | "medium" | "high";
    negotiationStyle: "aggressive" | "cooperative" | "passive";
    communicationPreference: "brief" | "detailed" | "friendly";
    totalSpent: number;
    averageDiscount: number;
}>>;
export declare const updateBuyerProfile: import("convex/server").RegisteredMutation<"public", {
    email: string;
    updates: {
        priceSensitivity?: "low" | "medium" | "high";
        negotiationStyle?: "aggressive" | "cooperative" | "passive";
        communicationPreference?: "brief" | "detailed" | "friendly";
        totalSpent?: number;
        averageDiscount?: number;
        lastInteraction?: number;
    };
}, Promise<void>>;
export declare const createNegotiationState: import("convex/server").RegisteredMutation<"public", {
    agreedPrice?: number;
    buyerEmail: string;
    product: string;
    initialPrice: number;
    status: "negotiating" | "accepted" | "rejected" | "closed";
    listingUrls: string[];
    threadId: string;
    currentPrice: number;
    minPrice: number;
    rounds: number;
    offers: {
        price: number;
        from: "buyer" | "seller";
        timestamp: number;
    }[];
}, Promise<import("convex/values").GenericId<"negotiationStates">>>;
export declare const getNegotiationState: import("convex/server").RegisteredQuery<"public", {
    threadId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"negotiationStates">;
    _creationTime: number;
    agreedPrice?: number;
    buyerEmail: string;
    product: string;
    initialPrice: number;
    status: "negotiating" | "accepted" | "rejected" | "closed";
    listingUrls: string[];
    threadId: string;
    currentPrice: number;
    minPrice: number;
    rounds: number;
    offers: {
        price: number;
        from: "buyer" | "seller";
        timestamp: number;
    }[];
}>>;
export declare const updateNegotiationState: import("convex/server").RegisteredMutation<"public", {
    threadId: string;
    updates: {
        status?: "negotiating" | "accepted" | "rejected" | "closed";
        currentPrice?: number;
        rounds?: number;
        offers?: {
            price: number;
            from: "buyer" | "seller";
            timestamp: number;
        }[];
        agreedPrice?: number;
    };
}, Promise<void>>;
export declare const getMetrics: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    _id: import("convex/values").GenericId<"metrics">;
    _creationTime: number;
    dealsCompleted: number;
    totalProfit: number;
    totalRevenue: number;
    conversionRate: number;
    averageResponseTime: number;
    averageNegotiationRounds: number;
    activeListings: number;
    emailsProcessed: number;
    lastUpdated: number;
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