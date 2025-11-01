# Universal Web Domain Scraper - Complete ✅

## Overview
The system now supports scraping **ANY website domain** with automatic price extraction and screenshot capture. This is a universal solution that works for eBay, Amazon, Craigslist, or any custom domain.

## Features
✅ **Universal Domain Support** - Works with any website  
✅ **Automatic Price Detection** - Finds prices on any page  
✅ **Smart Product Extraction** - Identifies items/listings automatically  
✅ **Screenshot Capture** - Takes screenshots of each item  
✅ **Domain Auto-Detection** - Extracts domain from natural language  
✅ **Search Query Parsing** - Understands what you're looking for  

## Example Commands

### Domain-Specific Searches
```
✅ "Search for agentmail.to and list all prices"
✅ "Find prices on example.com"
✅ "Search shopify.com for pricing"
✅ "List all prices from stripe.com"
```

### Marketplace Searches
```
✅ "I need to buy a macbook M3 pro on ebay"
✅ "Find iPhone 15 Pro on Amazon"
✅ "Search craigslist for furniture"
✅ "Buy Nintendo Switch from walmart.com"
```

### General Searches
```
✅ "Search for macbook prices"
✅ "Find best deals on cameras"
✅ "List iPad prices"
```

## How It Works

### 1. Domain Detection
The system automatically detects domains from your command:
- **Pattern matching**: Looks for `domain.com`, `site.to`, etc.
- **Keyword detection**: Recognizes "ebay", "amazon", "craigslist"
- **Fallback**: Uses context clues if no domain specified

### 2. Search Query Extraction
Removes common words to extract the actual search:
```
Input:  "I need to buy a macbook M3 pro on ebay"
Domain: "ebay.com"
Query:  "macbook M3 pro"
```

### 3. Price Extraction
Uses intelligent selectors to find prices:
- `[class*="price"]` - Price classes
- `[data-price]` - Price data attributes
- `[itemprop="price"]` - Schema.org markup
- `.amount`, `.cost`, `.value` - Common price classes

### 4. Item Detection
Finds products/listings using:
- Product links (`/itm/`, `/dp/`, `/product`)
- Result containers (`.result`, `.item`, `.listing`)
- Product classes (`[class*="product"]`)

### 5. Screenshot Capture
- Takes screenshot of main page
- Navigates to each item
- Captures individual screenshots
- Returns as base64 data URLs

## API Endpoint

### POST `/api/scrape-web-domain`

**Request:**
```json
{
  "domain": "agentmail.to",
  "searchQuery": "",
  "maxResults": 5
}
```

**Response:**
```json
{
  "success": true,
  "domain": "agentmail.to",
  "searchQuery": "",
  "targetUrl": "https://agentmail.to",
  "mainScreenshot": "data:image/jpeg;base64,...",
  "results": [
    {
      "url": "https://agentmail.to/pricing",
      "title": "AgentMail Pricing",
      "price": 29.99,
      "priceText": "$29.99/month",
      "screenshot": "data:image/jpeg;base64,...",
      "description": "Professional email automation",
      "availability": "Available"
    }
  ],
  "totalFound": 3
}
```

## Supported Domains

### E-commerce
- ✅ eBay (`ebay.com`)
- ✅ Amazon (`amazon.com`)
- ✅ Walmart (`walmart.com`)
- ✅ Target (`target.com`)
- ✅ Best Buy (`bestbuy.com`)

### Marketplaces
- ✅ Craigslist (`craigslist.org`)
- ✅ Facebook Marketplace
- ✅ OfferUp
- ✅ Mercari

### Custom Domains
- ✅ Any `.com`, `.to`, `.org`, `.net`, etc.
- ✅ Shopify stores
- ✅ WooCommerce sites
- ✅ Custom e-commerce platforms

## Price Detection

The scraper looks for prices in multiple formats:
- `$29.99`
- `$1,299.00`
- `€49.99`
- `£99.99`
- `29.99 USD`
- `Price: $49`

## UI Display

### Scraped Listings Card
```
┌─────────────────────────────────────────┐
│ [Screenshot Image]                      │
│                                         │
│ Product Title          [🌐 WEB] [Domain]│
│ $29.99                    Score: 75     │
│ Description text here                   │
│ Location                                │
│ View Listing →                          │
└─────────────────────────────────────────┘
```

### Badges
- 🌐 **WEB** - Indigo badge for web-scraped items
- 📸 **SCREENSHOT** - Purple badge for screenshot items
- **REAL** - Green badge for browser-use items

## Command Detection

The system triggers web scraping when command contains:
- `search` keyword
- `buy` keyword
- `find` keyword
- `price` or `list` keyword
- Domain pattern (`.com`, `.to`, `.org`, etc.)

## Data Flow

```
User Command
    ↓
"Search for agentmail.to and list all prices"
    ↓
Domain Detection
    ↓
domain: "agentmail.to"
searchQuery: ""
    ↓
Web Domain Scraper API
    ↓
Browser Service
    ↓
Navigate to https://agentmail.to
    ↓
Extract Prices & Items
    ↓
[
  { title: "Basic Plan", price: 29.99, ... },
  { title: "Pro Plan", price: 99.99, ... },
  { title: "Enterprise", price: 299.99, ... }
]
    ↓
Take Screenshots
    ↓
Return Results
    ↓
Display in UI
```

## Configuration

**Default Settings:**
```typescript
{
  maxResults: 5,           // Max items to scrape
  headless: true,          // Run browser in background
  viewport: {
    width: 1920,
    height: 1080
  },
  pageLoadWait: 5000,      // Wait 5s for page load
  scrollWait: 2000,        // Wait 2s after scroll
  itemLoadWait: 4000       // Wait 4s for item page
}
```

## Error Handling

**Graceful Degradation:**
1. If domain not found → Uses fallback detection
2. If prices not found → Returns items without prices
3. If screenshots fail → Uses main page screenshot
4. If scraping fails → Falls back to simulation mode

**Error Messages:**
- "Failed to create browser session"
- "Failed to scrape web domain"
- "Could not parse extracted items"

## Performance

**Timing Estimates:**
- Main page load: ~5 seconds
- Per item: ~6 seconds (navigate + screenshot)
- Total for 5 items: ~35 seconds

**Optimization:**
- Parallel item scraping (future)
- Cached results (future)
- Faster selectors (future)

## Testing

### Quick Test
```bash
# 1. Ensure browser service is running
curl http://localhost:8001/health

# 2. Open dashboard
open http://localhost:3000

# 3. Enter command
"Search for agentmail.to and list all prices"

# 4. Wait ~30 seconds

# 5. Check Scraped Listings
# Should see items with 🌐 WEB badge
```

### Test Commands
```
1. "Search for agentmail.to and list all prices"
2. "Find prices on stripe.com"
3. "I need to buy a macbook M3 pro on ebay"
4. "Search amazon.com for iPhone 15"
5. "List all prices from shopify.com"
```

## Comparison: Old vs New

### Before (eBay-Only)
```
❌ Only worked with eBay
❌ Hardcoded for eBay selectors
❌ Limited to product searches
```

### After (Universal)
```
✅ Works with ANY domain
✅ Smart price detection
✅ Flexible item extraction
✅ Domain auto-detection
✅ Natural language parsing
```

## Use Cases

### 1. Price Comparison
```
"Search for iPhone 15 prices"
→ Finds prices across multiple sites
```

### 2. Domain Analysis
```
"Search for agentmail.to and list all prices"
→ Extracts all pricing from a specific domain
```

### 3. Marketplace Search
```
"Find furniture on craigslist"
→ Searches Craigslist for furniture listings
```

### 4. Product Research
```
"Buy Sony A7IV camera from amazon"
→ Finds Sony cameras on Amazon with prices
```

## Future Enhancements

### Planned Features
- [ ] Multi-domain comparison
- [ ] Price history tracking
- [ ] Alert on price drops
- [ ] Bulk scraping (10+ items)
- [ ] Export to CSV/PDF
- [ ] Scheduled scraping
- [ ] API rate limiting
- [ ] Caching layer

### Advanced Features
- [ ] AI-powered price prediction
- [ ] Sentiment analysis from reviews
- [ ] Competitor analysis
- [ ] Market trend detection
- [ ] Automated bidding (eBay)

## Troubleshooting

### Issue: No prices found
**Solution:**
- Check if page has prices
- Try with different domain
- Verify page loads correctly

### Issue: Blank screenshots
**Solution:**
- Increase page load wait time
- Check if site blocks automation
- Try with headless: false

### Issue: Wrong items extracted
**Solution:**
- Refine search query
- Check domain-specific selectors
- Verify page structure

### Issue: Domain not detected
**Solution:**
- Include full domain in command
- Use format: "search for example.com"
- Check domain pattern matching

## Success Metrics

✅ Universal domain support  
✅ Automatic price extraction  
✅ Smart item detection  
✅ Screenshot capture  
✅ Natural language parsing  
✅ UI integration  
✅ Error handling  
✅ Badge display  

## Status: COMPLETE ✅

The universal web domain scraper is fully functional and ready to scrape any website!

## Quick Reference

**Syntax:**
```
"Search for [domain] and list all prices"
"Find [product] on [domain]"
"Buy [product] from [domain]"
"List prices from [domain]"
```

**Examples:**
```
✅ "Search for agentmail.to and list all prices"
✅ "Find macbook on ebay.com"
✅ "Buy iPhone from amazon.com"
✅ "List prices from stripe.com"
```

**Output:**
- Screenshots of items
- Extracted prices
- Product titles
- Links to items
- Displayed in Scraped Listings with 🌐 WEB badge
