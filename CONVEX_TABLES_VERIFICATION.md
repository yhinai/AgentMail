# Convex Tables Verification

## All Tables in Schema (12 Total)

### Main Tables (8)
1. **opportunities** - Discovered product opportunities
2. **negotiations** - Negotiation threads and rounds  
3. **inventory** - Purchased inventory items
4. **listings** - Active listings across platforms
5. **transactions** - Financial transactions
6. **metrics** - Performance metrics and analytics
7. **config** - System configuration
8. **memory** - Agent memory (Hyperspell integration)
9. **alerts** - Alerts and notifications

### Legacy Tables (3)
10. **products** - Legacy product data
11. **buyerProfiles** - Buyer profile data  
12. **negotiationStates** - Legacy negotiation state

## Deployment Status

According to Convex MCP tools, all 12 tables exist in the deployment:
- ✅ alerts
- ✅ buyerProfiles
- ✅ config
- ✅ inventory
- ✅ listings
- ✅ memory
- ✅ metrics
- ✅ negotiationStates
- ✅ negotiations
- ✅ opportunities
- ✅ products
- ✅ transactions

## If You Only See 7 Tables

This might be because:
1. **Dashboard Display**: Some tables might be collapsed or hidden if empty
2. **Permissions**: Some tables might not be visible due to access settings
3. **Deployment Mismatch**: You might be looking at a different deployment

## How to Verify

Run this to check all tables:
```bash
npx convex data ls
```

Or check the Convex dashboard at: https://dashboard.convex.dev

## Schema Location

All tables are defined in: `convex/schema.ts`

