# Testing Convex Tables

## Quick Test

Run this command to insert test data into all 12 tables:

```bash
npx convex run testData:insertAllTestData
```

## What This Does

The test script will:
1. Insert sample data into all 12 tables
2. Return a summary showing which tables succeeded/failed
3. Create relationships between tables (e.g., inventory linked to opportunities)

## Tables Being Tested

1. ✅ **opportunities** - Creates a test MacBook Pro opportunity
2. ✅ **negotiations** - Creates a negotiation thread
3. ✅ **inventory** - Creates inventory item
4. ✅ **listings** - Creates an eBay listing
5. ✅ **transactions** - Creates a sale transaction
6. ✅ **metrics** - Creates daily metrics entry
7. ✅ **config** - Creates test configuration
8. ✅ **memory** - Creates seller memory entry
9. ✅ **alerts** - Creates an alert notification
10. ✅ **products** (legacy) - Creates test product
11. ✅ **buyerProfiles** (legacy) - Creates buyer profile
12. ✅ **negotiationStates** (legacy) - Creates negotiation state

## Expected Output

You should see:
```json
{
  "summary": {
    "totalTables": 12,
    "successful": 12,
    "failed": 0
  },
  "details": {
    "opportunities": { "success": true, "id": "..." },
    "negotiations": { "success": true, "id": "..." },
    ...
  }
}
```

## Clean Up Test Data

After testing, clean up the test data:

```bash
npx convex run testData:cleanupTestData
```

## Verify in Dashboard

After running the test:
1. Go to https://dashboard.convex.dev
2. Navigate to your deployment
3. Check the Data tab
4. You should now see data in all 12 tables

## Troubleshooting

If a table fails:
- Check the error message in the output
- Verify the table exists in the schema
- Check that all required fields are provided
- Ensure Convex dev is running: `npx convex dev`

