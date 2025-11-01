// Convex functions for listing queries and scraped items
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Store a scraped item as an opportunity
export const storeScrapedItem = mutation({
  args: {
    externalId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    platform: v.string(),
    url: v.string(),
    listingPrice: v.number(),
    originalPrice: v.optional(v.number()),
    images: v.array(v.string()),
    primaryImage: v.optional(v.string()),
    location: v.optional(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zip: v.optional(v.string()),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number()
      }))
    })),
    seller: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      rating: v.optional(v.number()),
      responseTime: v.optional(v.string()),
      platform: v.string()
    }),
    profitScore: v.number(),
    source: v.optional(v.string()), // 'browser_scraping' | 'command' | 'manual'
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if opportunity already exists by externalId
    const existing = await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "discovered"))
      .filter((q) => q.eq(q.field("externalId"), args.externalId))
      .first();

    if (existing) {
      // Update existing opportunity
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        listingPrice: args.listingPrice,
        originalPrice: args.originalPrice,
        images: args.images,
        primaryImage: args.primaryImage,
        location: args.location,
        seller: args.seller,
        profitScore: args.profitScore,
        source: args.source || existing.source,
        lastUpdated: now
      });
      return existing._id;
    }

    // Create new opportunity
    const opportunityId = await ctx.db.insert("opportunities", {
      externalId: args.externalId,
      title: args.title,
      description: args.description,
      category: args.category,
      platform: args.platform,
      url: args.url,
      listingPrice: args.listingPrice,
      originalPrice: args.originalPrice,
      images: args.images,
      primaryImage: args.primaryImage || args.images[0],
      location: args.location,
      seller: args.seller,
      profitScore: args.profitScore,
      status: "discovered",
      source: args.source || "browser_scraping",
      discoveredAt: now,
      lastUpdated: now
    });

    return opportunityId;
  },
});

// Get all scraped listings (opportunities from browser scraping)
export const getScrapedListings = query({
  args: {
    category: v.optional(v.string()),
    platform: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "discovered"));

    const results: any[] = [];
    
    for (const opportunity of await query.collect()) {
      // Apply filters
      if (args.category && opportunity.category !== args.category) continue;
      if (args.platform && opportunity.platform !== args.platform) continue;
      if (args.minPrice && opportunity.listingPrice < args.minPrice) continue;
      if (args.maxPrice && opportunity.listingPrice > args.maxPrice) continue;
      
      results.push(opportunity);
      
      if (args.limit && results.length >= args.limit) break;
    }

    // Sort by profitScore descending
    results.sort((a, b) => (b.profitScore || 0) - (a.profitScore || 0));

    return results;
  },
});

// Get opportunities with filters
export const getOpportunities = query({
  args: {
    category: v.optional(v.string()),
    platform: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results: any[] = [];

    // Use status index if status is provided
    if (args.status) {
      const statusQuery = ctx.db
        .query("opportunities")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
      
      for (const opportunity of await statusQuery.collect()) {
        // Apply filters
        if (args.category && opportunity.category !== args.category) continue;
        if (args.platform && opportunity.platform !== args.platform) continue;
        if (args.minPrice && opportunity.listingPrice < args.minPrice) continue;
        if (args.maxPrice && opportunity.listingPrice > args.maxPrice) continue;
        
        results.push(opportunity);
        
        if (args.limit && results.length >= args.limit) break;
      }
    } else {
      // Otherwise query all opportunities (no index needed for full table scan)
      const allQuery = ctx.db.query("opportunities");
      
      for (const opportunity of await allQuery.collect()) {
        // Apply filters
        if (args.category && opportunity.category !== args.category) continue;
        if (args.platform && opportunity.platform !== args.platform) continue;
        if (args.minPrice && opportunity.listingPrice < args.minPrice) continue;
        if (args.maxPrice && opportunity.listingPrice > args.maxPrice) continue;
        
        results.push(opportunity);
        
        if (args.limit && results.length >= args.limit) break;
      }
    }

    // Sort by profitScore descending
    results.sort((a, b) => (b.profitScore || 0) - (a.profitScore || 0));

    return results;
  },
});

