declare const _default: import("convex/server").SchemaDefinition<{
    transactions: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        buyerEmail: import("convex/values").VString<string, "required">;
        product: import("convex/values").VString<string, "required">;
        productId: import("convex/values").VString<string, "required">;
        initialPrice: import("convex/values").VFloat64<number, "required">;
        finalPrice: import("convex/values").VFloat64<number, "required">;
        cost: import("convex/values").VFloat64<number, "required">;
        profit: import("convex/values").VFloat64<number, "required">;
        status: import("convex/values").VUnion<"negotiating" | "completed" | "cancelled" | "refunded", [import("convex/values").VLiteral<"negotiating", "required">, import("convex/values").VLiteral<"completed", "required">, import("convex/values").VLiteral<"cancelled", "required">, import("convex/values").VLiteral<"refunded", "required">], "required", never>;
        negotiationRounds: import("convex/values").VFloat64<number, "required">;
        listingUrls: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        completedAt: import("convex/values").VFloat64<number, "optional">;
    }, "required", "buyerEmail" | "product" | "productId" | "initialPrice" | "finalPrice" | "cost" | "profit" | "status" | "negotiationRounds" | "listingUrls" | "completedAt">, {}, {}, {}>;
    products: import("convex/server").TableDefinition<import("convex/values").VObject<{
        category?: string;
        images?: string[];
        cost: number;
        title: string;
        description: string;
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
    }, "required", "cost" | "title" | "description" | "targetPrice" | "category" | "images" | "condition">, {}, {}, {}>;
    buyerProfiles: import("convex/server").TableDefinition<import("convex/values").VObject<{
        lastInteraction?: number;
        email: string;
        priceSensitivity: "low" | "medium" | "high";
        negotiationStyle: "aggressive" | "cooperative" | "passive";
        communicationPreference: "brief" | "detailed" | "friendly";
        totalSpent: number;
        averageDiscount: number;
    }, {
        email: import("convex/values").VString<string, "required">;
        priceSensitivity: import("convex/values").VUnion<"low" | "medium" | "high", [import("convex/values").VLiteral<"low", "required">, import("convex/values").VLiteral<"medium", "required">, import("convex/values").VLiteral<"high", "required">], "required", never>;
        negotiationStyle: import("convex/values").VUnion<"aggressive" | "cooperative" | "passive", [import("convex/values").VLiteral<"aggressive", "required">, import("convex/values").VLiteral<"cooperative", "required">, import("convex/values").VLiteral<"passive", "required">], "required", never>;
        communicationPreference: import("convex/values").VUnion<"brief" | "detailed" | "friendly", [import("convex/values").VLiteral<"brief", "required">, import("convex/values").VLiteral<"detailed", "required">, import("convex/values").VLiteral<"friendly", "required">], "required", never>;
        totalSpent: import("convex/values").VFloat64<number, "required">;
        averageDiscount: import("convex/values").VFloat64<number, "required">;
        lastInteraction: import("convex/values").VFloat64<number, "optional">;
    }, "required", "email" | "priceSensitivity" | "negotiationStyle" | "communicationPreference" | "totalSpent" | "averageDiscount" | "lastInteraction">, {
        by_email: ["email", "_creationTime"];
    }, {}, {}>;
    negotiationStates: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        buyerEmail: import("convex/values").VString<string, "required">;
        product: import("convex/values").VString<string, "required">;
        threadId: import("convex/values").VString<string, "required">;
        currentPrice: import("convex/values").VFloat64<number, "required">;
        initialPrice: import("convex/values").VFloat64<number, "required">;
        minPrice: import("convex/values").VFloat64<number, "required">;
        rounds: import("convex/values").VFloat64<number, "required">;
        offers: import("convex/values").VArray<{
            price: number;
            from: "buyer" | "seller";
            timestamp: number;
        }[], import("convex/values").VObject<{
            price: number;
            from: "buyer" | "seller";
            timestamp: number;
        }, {
            price: import("convex/values").VFloat64<number, "required">;
            from: import("convex/values").VUnion<"buyer" | "seller", [import("convex/values").VLiteral<"buyer", "required">, import("convex/values").VLiteral<"seller", "required">], "required", never>;
            timestamp: import("convex/values").VFloat64<number, "required">;
        }, "required", "price" | "from" | "timestamp">, "required">;
        status: import("convex/values").VUnion<"negotiating" | "accepted" | "rejected" | "closed", [import("convex/values").VLiteral<"negotiating", "required">, import("convex/values").VLiteral<"accepted", "required">, import("convex/values").VLiteral<"rejected", "required">, import("convex/values").VLiteral<"closed", "required">], "required", never>;
        listingUrls: import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">;
        agreedPrice: import("convex/values").VFloat64<number, "optional">;
    }, "required", "buyerEmail" | "product" | "initialPrice" | "status" | "listingUrls" | "threadId" | "currentPrice" | "minPrice" | "rounds" | "offers" | "agreedPrice">, {
        by_thread: ["threadId", "_creationTime"];
    }, {}, {}>;
    metrics: import("convex/server").TableDefinition<import("convex/values").VObject<{
        dealsCompleted: number;
        totalProfit: number;
        totalRevenue: number;
        conversionRate: number;
        averageResponseTime: number;
        averageNegotiationRounds: number;
        activeListings: number;
        emailsProcessed: number;
        lastUpdated: number;
    }, {
        dealsCompleted: import("convex/values").VFloat64<number, "required">;
        totalProfit: import("convex/values").VFloat64<number, "required">;
        totalRevenue: import("convex/values").VFloat64<number, "required">;
        conversionRate: import("convex/values").VFloat64<number, "required">;
        averageResponseTime: import("convex/values").VFloat64<number, "required">;
        averageNegotiationRounds: import("convex/values").VFloat64<number, "required">;
        activeListings: import("convex/values").VFloat64<number, "required">;
        emailsProcessed: import("convex/values").VFloat64<number, "required">;
        lastUpdated: import("convex/values").VFloat64<number, "required">;
    }, "required", "dealsCompleted" | "totalProfit" | "totalRevenue" | "conversionRate" | "averageResponseTime" | "averageNegotiationRounds" | "activeListings" | "emailsProcessed" | "lastUpdated">, {}, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map