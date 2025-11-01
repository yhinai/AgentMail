# Convex Setup Instructions

## Current Status

✅ **Configuration Complete**
- `convex.json` created with deployment URL
- Schema file (`convex/schema.ts`) validated and ready
- Functions (`convex/listings.ts`, `convex/commands.ts`) verified

## Required Steps to Complete Setup

### 1. Authentication

First, authenticate with Convex:

```bash
npx convex login
```

This will open a browser to authenticate with your Convex account.

### 2. Initialize Convex Development

Run the Convex development server to:
- Generate `convex/_generated` files
- Push schema to deployment
- Start development mode

```bash
npx convex dev
```

This command will:
- Connect to your deployment at `https://pastel-porcupine-488.convex.cloud`
- Generate TypeScript types in `convex/_generated/`
- Push your schema to the deployment
- Start watching for changes

### 3. Environment Variables

Make sure your `.env` file contains (if not already set):

```env
NEXT_PUBLIC_CONVEX_URL=https://pastel-porcupine-488.convex.cloud
CONVEX_DEPLOYMENT=dev
CONVEX_URL=https://pastel-porcupine-488.convex.cloud
```

**Note**: The `.env` file is gitignored for security. You'll need to set these values manually.

## Schema Overview

Your Convex schema includes the following tables:

### Main Tables
- **opportunities** - Discovered product opportunities
- **negotiations** - Negotiation threads and rounds
- **inventory** - Purchased inventory items
- **listings** - Active listings across platforms
- **transactions** - Financial transactions

### Supporting Tables
- **metrics** - Performance metrics and analytics
- **config** - System configuration
- **memory** - Agent memory (Hyperspell integration)
- **alerts** - Alerts and notifications

### Legacy Tables (for backward compatibility)
- **products** - Legacy product data
- **buyerProfiles** - Buyer profile data
- **negotiationStates** - Legacy negotiation state

## Functions Available

### `convex/listings.ts`
- `storeScrapedItem` - Store scraped items as opportunities
- `getScrapedListings` - Get scraped listings with filters
- `getOpportunities` - Get opportunities with filters

### `convex/commands.ts`
- `recordCommandExecution` - Record command execution
- `getCommandExecution` - Get command execution status
- `getAllCommandExecutions` - Get all command executions

## Verification

After running `npx convex dev`, you can verify the setup by:

1. Checking that `convex/_generated` directory exists
2. Verifying no errors in the terminal
3. Checking the Convex dashboard at https://dashboard.convex.dev

## Troubleshooting

### "Not Authorized" Error
- Run `npx convex login` first
- Ensure you're authenticated with the correct Convex account

### Schema Push Errors
- Check that all table names in functions match schema
- Verify index names match between schema and queries
- Ensure all field types are correct

### Missing _generated files
- Run `npx convex dev` - this generates the files
- Ensure the deployment URL is correct in `convex.json`

## Next Steps

Once Convex is set up:
1. Your application can use `ConvexHttpClient` to call functions
2. The `DatabaseClient` class in `src/database/client.ts` will work properly
3. All functions will be type-safe with generated types

