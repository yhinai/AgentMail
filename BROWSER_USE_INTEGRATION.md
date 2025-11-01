# Browser-Use Agent API Integration with Convex

## Overview

This integration connects browser-use Agent API with the Convex database for intelligent web scraping. The system uses AI-driven browser automation to extract structured data from marketplace platforms and stores it in Convex.

## Architecture

```
TypeScript (MarketResearchAgent)
    ↓ HTTP API
Python Bridge (FastAPI on :8001)
    ↓ Python SDK
Browser-Use Agent API
    ↓ LLM + Browser Automation
Marketplace Websites
    ↓ Extracted Data
Convex Database
```

## Components

### 1. BrowserUseIntegration (`src/integrations/BrowserUseIntegration.ts`)
- **runAgent()**: Execute browser-use Agent tasks with structured output
- **extractContent()**: Convenience method for content extraction
- **newSession()**: Manual browser session control (for backward compatibility)
- **healthCheck()**: Check bridge service availability

### 2. Python Bridge Service (`python_bridge/browser_service.py`)
- FastAPI REST API service
- `/agent/run`: Execute browser-use Agent tasks
- `/health`: Health check endpoint
- Handles schema conversion from TypeScript to Pydantic
- Uses browser-use Agent API with OpenAI/Anthropic LLMs

### 3. MarketResearchAgent (`src/agents/MarketResearchAgent.ts`)
- Updated all scraping methods to use browser-use Agent API:
  - `scrapeFacebookMarketplace()`: AI-driven Facebook Marketplace extraction
  - `scrapeCraigslist()`: AI-driven Craigslist extraction
  - `scrapeEbay()`: AI-driven eBay extraction
  - `scrapeMercari()`: AI-driven Mercari extraction
  - `scrapeOfferUp()`: AI-driven OfferUp extraction
- Maintains existing enrichment and Convex saving logic

### 4. Convex Integration (`convex/listings.ts`)
- `storeScrapedItem`: Mutation to save scraped items
- Supports `source: 'browser_use_agent'` tracking
- All fields compatible with browser-use extracted data

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
# Required: Either BROWSER_USE_API_KEY or OPENAI_API_KEY
export BROWSER_USE_API_KEY="your-key-here"  # Recommended
# OR
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o-mini"  # Optional

# Optional: Bridge service configuration
export BROWSER_BRIDGE_URL="http://localhost:8001"  # Default
export BROWSER_BRIDGE_PORT=8001  # Default
```

### 3. Start Python Bridge Service

```bash
cd python_bridge
python browser_service.py
```

Or using uvicorn:
```bash
uvicorn browser_service:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Verify Connection

The TypeScript app will automatically connect to the bridge service at `http://localhost:8001`. Health checks verify the service is running.

## Usage

### Basic Scraping Example

```typescript
import { BrowserUseIntegration } from './src/integrations/BrowserUseIntegration';
import { MarketResearchAgent } from './src/agents/MarketResearchAgent';
import { PerplexityIntegration } from './src/integrations/PerplexityIntegration';

const browserUse = new BrowserUseIntegration(process.env.BROWSER_USE_API_KEY || '');
const perplexity = new PerplexityIntegration(process.env.PERPLEXITY_API_KEY || '');

const agent = new MarketResearchAgent({
  browserUse,
  perplexity,
  maxConcurrent: 5,
  headless: true
});

// Find opportunities
const opportunities = await agent.findOpportunities({
  platforms: ['facebook', 'craigslist', 'ebay'],
  categories: ['electronics'],
  minPrice: 50,
  maxPrice: 500,
  itemsPerPlatform: 20
});

// Opportunities are automatically saved to Convex
```

### Direct Agent API Usage

```typescript
const result = await browserUse.runAgent({
  task: "Go to example.com and extract the page title",
  maxSteps: 30,
  extractSchema: {
    title: { type: "string" },
    price: { type: "number" }
  },
  headless: true
});

console.log(result.extracted_content);
```

## Data Flow

1. **MarketResearchAgent** creates search tasks for each platform
2. Each task calls **BrowserUseIntegration.runAgent()** with platform-specific extraction prompts
3. **Python Bridge** receives request and executes browser-use Agent
4. **Browser-Use Agent** navigates, interacts, and extracts structured data
5. Extracted data returns to **MarketResearchAgent**
6. Data is enriched with market analysis (via Perplexity)
7. Opportunities are saved to **Convex** via `storeScrapedItem` mutation

## Schema Mapping

Browser-use Agent extracts data according to platform-specific schemas:

- **Facebook Marketplace**: id, title, price, url, images, location, seller, description
- **Craigslist**: id, title, price, url, images, location, listingDate, description
- **eBay**: id, title, price, url, images, shipping, seller, watchers, listingDate
- **Mercari**: id, title, price, url, images, location, seller, condition, listingDate
- **OfferUp**: id, title, price, url, images, location, seller, listingDate, views

All extracted items are validated against `ScrapedItemSchema` and converted to `EnrichedOpportunity` format before saving to Convex.

## Error Handling

- Failed scraping attempts return empty arrays (no exceptions thrown)
- Python bridge errors are caught and returned as error responses
- Convex save failures are logged but don't block agent execution
- Health checks verify bridge availability before use

## Performance

- Concurrent scraping: 5 platforms in parallel (configurable)
- Agent timeout: 5 minutes per task
- Max steps: 30 per scraping task (configurable)
- Rate limiting: Per-platform delays via proxies

## Troubleshooting

### Bridge Service Not Available
- Verify Python service is running on port 8001
- Check `BROWSER_BRIDGE_URL` environment variable
- Test: `curl http://localhost:8001/health`

### Agent Tasks Failing
- Check OpenAI/Browser-Use API keys are set
- Verify internet connection
- Check browser-use installation: `pip show browser-use`
- Review Python bridge logs for detailed errors

### No Data in Convex
- Verify Convex URL is set: `NEXT_PUBLIC_CONVEX_URL` or `CONVEX_URL`
- Check Convex mutation logs
- Verify `storeScrapedItem` mutation exists in `convex/listings.ts`

## Future Enhancements

- Add retry logic for failed Agent API calls
- Implement caching for frequently scraped platforms
- Add webhook notifications for high-profit opportunities
- Support custom extraction schemas per platform
- Add browser-use Agent session pooling for faster execution

