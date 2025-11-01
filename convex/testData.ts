// @ts-nocheck - TODO: Fix metrics schema type mismatches
// Test script to insert sample data into all tables
// Run this using: npx convex run testData:insertAllTestData
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Insert test data into all tables
export const insertAllTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const results: any = {};

    // 1. Insert into opportunities table
    try {
      const opportunityId = await ctx.db.insert("opportunities", {
        externalId: "test-opp-001",
        title: "Test Opportunity - MacBook Pro",
        description: "A test opportunity for a MacBook Pro laptop",
        category: "Electronics",
        platform: "Craigslist",
        url: "https://example.com/listings/123",
        listingPrice: 1200,
        originalPrice: 1500,
        marketPrice: 1300,
        images: ["https://example.com/image1.jpg"],
        primaryImage: "https://example.com/image1.jpg",
        location: {
          city: "San Francisco",
          state: "CA",
          zip: "94102",
          coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        seller: {
          id: "seller-001",
          name: "Test Seller",
          email: "seller@example.com",
          phone: "+1-555-0100",
          rating: 4.5,
          responseTime: "within 1 hour",
          platform: "Craigslist"
        },
        profitScore: 85,
        status: "discovered",
        source: "browser_scraping",
        discoveredAt: Date.now(),
        lastUpdated: Date.now()
      });
      results.opportunities = { success: true, id: opportunityId };
    } catch (error: any) {
      results.opportunities = { success: false, error: error.message };
    }

    // 2. Insert into negotiations table
    try {
      const negotiationId = await ctx.db.insert("negotiations", {
        opportunityId: results.opportunities?.id || (await ctx.db.query("opportunities").first())?._id!,
        threadId: "thread-test-001",
        strategy: "aggressive",
        seller: {
          email: "seller@example.com",
          name: "Test Seller",
          platform: "Craigslist"
        },
        rounds: [{
          number: 1,
          timestamp: Date.now(),
          type: "initial",
          ourOffer: 1100,
          theirOffer: 1200,
          message: "Would you consider $1100?",
          status: "pending"
        }],
        currentOffer: 1200,
        maxAcceptable: 1150,
        status: "active",
        metrics: {
          responseTime: 3600000,
          openTime: Date.now(),
          clickCount: 5,
          roundCount: 1
        },
        startedAt: Date.now(),
        lastActivityAt: Date.now()
      });
      results.negotiations = { success: true, id: negotiationId };
    } catch (error: any) {
      results.negotiations = { success: false, error: error.message };
    }

    // 3. Insert into inventory table
    try {
      const inventoryId = await ctx.db.insert("inventory", {
        opportunityId: results.opportunities?.id || (await ctx.db.query("opportunities").first())?._id!,
        negotiationId: results.negotiations?.id,
        title: "MacBook Pro 13-inch",
        description: "Test inventory item - MacBook Pro",
        category: "Electronics",
        condition: "like-new",
        sku: "MBP-TEST-001",
        images: ["https://example.com/inventory1.jpg"],
        purchasePrice: 1150,
        purchasePlatform: "Craigslist",
        purchaseDate: Date.now(),
        seller: {
          id: "seller-001",
          name: "Test Seller",
          contact: "seller@example.com"
        },
        location: "warehouse",
        status: "in_stock",
        acquiredAt: Date.now()
      });
      results.inventory = { success: true, id: inventoryId };
    } catch (error: any) {
      results.inventory = { success: false, error: error.message };
    }

    // 4. Insert into listings table
    try {
      const listingId = await ctx.db.insert("listings", {
        inventoryId: results.inventory?.id || (await ctx.db.query("inventory").first())?._id!,
        platform: "eBay",
        platformListingId: "ebay-listing-001",
        url: "https://ebay.com/listing/123",
        title: "MacBook Pro 13-inch - Like New",
        description: "Selling MacBook Pro in excellent condition",
        price: 1400,
        shippingPrice: 25,
        images: ["https://example.com/listing1.jpg"],
        status: "active",
        visibility: "public",
        metrics: {
          views: 42,
          watchers: 5,
          saves: 3,
          inquiries: 2,
          clicks: 15
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      results.listings = { success: true, id: listingId };
    } catch (error: any) {
      results.listings = { success: false, error: error.message };
    }

    // 5. Insert into transactions table
    try {
      const transactionId = await ctx.db.insert("transactions", {
        type: "sale",
        category: "inventory",
        inventoryId: results.inventory?.id,
        listingId: results.listings?.id,
        amount: 1400,
        currency: "USD",
        fees: {
          platform: 70,
          payment: 10,
          shipping: 25,
          other: 0,
          total: 105
        },
        netAmount: 1295,
        counterparty: {
          type: "buyer",
          id: "buyer-001",
          name: "Test Buyer",
          email: "buyer@example.com"
        },
        paymentMethod: "PayPal",
        paymentStatus: "completed",
        platform: "eBay",
        platformTransactionId: "txn-001",
        status: "completed",
        createdAt: Date.now(),
        completedAt: Date.now()
      });
      results.transactions = { success: true, id: transactionId };
    } catch (error: any) {
      results.transactions = { success: false, error: error.message };
    }

    // 6. Insert into metrics table
    try {
      const today = new Date().toISOString().split('T')[0];
      const metricsId = await ctx.db.insert("metrics", {
        period: "day",
        timestamp: Date.now(),
        date: today,
        discovery: {
          opportunitiesFound: 1,
          opportunitiesAnalyzed: 1,
          opportunitiesApproved: 1,
          avgProfitScore: 85
        },
        negotiation: {
          started: 1,
          completed: 1,
          successful: 1,
          avgRounds: 1,
          avgResponseTime: 3600000,
          avgDiscount: 50
        },
        sales: {
          listed: 1,
          sold: 1,
          avgTimeToSell: 86400000,
          avgSalePrice: 1400
        },
        financial: {
          totalSpent: 1150,
          totalRevenue: 1400,
          totalProfit: 250,
          totalFees: 105,
          roi: 21.7,
          profitMargin: 17.9
        },
        efficiency: {
          automationRate: 95,
          errorRate: 2,
          avgProcessingTime: 1800000
        }
      });
      results.metrics = { success: true, id: metricsId };
    } catch (error: any) {
      results.metrics = { success: false, error: error.message };
    }

    // 7. Insert into config table
    try {
      const configId = await ctx.db.insert("config", {
        key: "test_config_key",
        value: { setting: "test_value", enabled: true },
        category: "test",
        description: "Test configuration entry",
        updatedAt: Date.now(),
        updatedBy: "test-script"
      });
      results.config = { success: true, id: configId };
    } catch (error: any) {
      results.config = { success: false, error: error.message };
    }

    // 8. Insert into memory table
    try {
      const memoryId = await ctx.db.insert("memory", {
        type: "seller",
        category: "behavior",
        key: "seller-seller-001-pattern",
        data: {
          negotiationStyle: "cooperative",
          typicalResponseTime: "within 1 hour",
          preferredCommunication: "brief"
        },
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        accessCount: 1,
        lastAccessed: Date.now(),
        source: "negotiation_analysis",
        confidence: 0.85,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      results.memory = { success: true, id: memoryId };
    } catch (error: any) {
      results.memory = { success: false, error: error.message };
    }

    // 9. Insert into alerts table
    try {
      const alertId = await ctx.db.insert("alerts", {
        type: "opportunity",
        severity: "info",
        title: "New High-Value Opportunity Found",
        message: "A new opportunity with profit score of 85 has been discovered",
        context: { opportunityId: results.opportunities?.id },
        relatedId: results.opportunities?.id || "test-id",
        relatedType: "opportunity",
        status: "new",
        createdAt: Date.now()
      });
      results.alerts = { success: true, id: alertId };
    } catch (error: any) {
      results.alerts = { success: false, error: error.message };
    }

    // 10. Insert into products table (legacy)
    try {
      const productId = await ctx.db.insert("products", {
        title: "Test Product - iPhone 13",
        description: "A test product entry for iPhone 13",
        cost: 800,
        targetPrice: 950,
        category: "Electronics",
        images: ["https://example.com/product1.jpg"],
        condition: "used"
      });
      results.products = { success: true, id: productId };
    } catch (error: any) {
      results.products = { success: false, error: error.message };
    }

    // 11. Insert into buyerProfiles table (legacy)
    try {
      const buyerProfileId = await ctx.db.insert("buyerProfiles", {
        email: "testbuyer@example.com",
        priceSensitivity: "medium",
        negotiationStyle: "cooperative",
        communicationPreference: "detailed",
        totalSpent: 2500,
        averageDiscount: 10,
        lastInteraction: Date.now()
      });
      results.buyerProfiles = { success: true, id: buyerProfileId };
    } catch (error: any) {
      results.buyerProfiles = { success: false, error: error.message };
    }

    // 12. Insert into negotiationStates table (legacy)
    try {
      const negotiationStateId = await ctx.db.insert("negotiationStates", {
        buyerEmail: "testbuyer@example.com",
        product: "MacBook Pro",
        threadId: "legacy-thread-001",
        currentPrice: 1200,
        initialPrice: 1400,
        minPrice: 1100,
        rounds: 2,
        offers: [
          {
            price: 1400,
            from: "seller",
            timestamp: Date.now() - 86400000
          },
          {
            price: 1200,
            from: "buyer",
            timestamp: Date.now()
          }
        ],
        status: "negotiating",
        listingUrls: ["https://example.com/listing/123"]
      });
      results.negotiationStates = { success: true, id: negotiationStateId };
    } catch (error: any) {
      results.negotiationStates = { success: false, error: error.message };
    }

    return {
      summary: {
        totalTables: 12,
        successful: Object.values(results).filter((r: any) => r.success).length,
        failed: Object.values(results).filter((r: any) => !r.success).length
      },
      details: results
    };
  }
});

// Clean up test data
export const cleanupTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const deleted: any = {};

    // Delete test data from all tables
    const tables = [
      "opportunities",
      "negotiations",
      "inventory",
      "listings",
      "transactions",
      "metrics",
      "config",
      "memory",
      "alerts",
      "products",
      "buyerProfiles",
      "negotiationStates"
    ];

    for (const table of tables) {
      try {
        // Delete items that match test patterns
        let deletedCount = 0;
        
        if (table === "opportunities") {
          const items = await ctx.db
            .query(table)
            .filter((q: any) => q.eq(q.field("externalId"), "test-opp-001"))
            .collect();
          for (const item of items) {
            await ctx.db.delete(item._id);
            deletedCount++;
          }
        } else if (table === "config") {
          const items = await ctx.db
            .query(table)
            .withIndex("by_key", (q: any) => q.eq("key", "test_config_key"))
            .collect();
          for (const item of items) {
            await ctx.db.delete(item._id);
            deletedCount++;
          }
        } else if (table === "buyerProfiles") {
          const items = await ctx.db
            .query(table)
            .withIndex("by_email", (q: any) => q.eq("email", "testbuyer@example.com"))
            .collect();
          for (const item of items) {
            await ctx.db.delete(item._id);
            deletedCount++;
          }
        } else {
          // For other tables, try to find test data
          // Use type assertion for table name
          const tableName = table as any;
          const items = await ctx.db.query(tableName).collect();
          // Delete items created in last hour (likely test data)
          const oneHourAgo = Date.now() - 3600000;
          for (const item of items) {
            if (item._creationTime > oneHourAgo) {
              await ctx.db.delete(item._id);
              deletedCount++;
            }
          }
        }
        
        deleted[table] = { success: true, count: deletedCount };
      } catch (error: any) {
        deleted[table] = { success: false, error: error.message };
      }
    }

    return {
      summary: {
        totalTables: 12,
        deleted: Object.values(deleted).reduce((sum: number, r: any) => sum + (r.count || 0), 0)
      },
      details: deleted
    };
  }
});

