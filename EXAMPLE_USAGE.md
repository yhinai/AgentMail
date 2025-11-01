# Web Domain Scraper - Example Usage

## Example 1: Search Specific Domain for Prices

### Command
```
"Search for agentmail.to and list all prices"
```

### What Happens
1. 🌐 System detects domain: `agentmail.to`
2. 🔍 Navigates to `https://agentmail.to`
3. 📸 Takes screenshot of main page
4. 💰 Extracts all prices from the page
5. 🖼️ Captures screenshots of pricing pages
6. ✅ Displays results in UI

### Expected Output
```
Found 3 items from agentmail.to:

┌─────────────────────────────────────────┐
│ [Screenshot of pricing page]            │
│                                         │
│ Basic Plan          [🌐 WEB] [agentmail.to]
│ $29.99/month              Score: 75     │
│ Perfect for individuals                 │
│ View Listing →                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Screenshot of pricing page]            │
│                                         │
│ Pro Plan            [🌐 WEB] [agentmail.to]
│ $99.99/month              Score: 82     │
│ For growing teams                       │
│ View Listing →                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Screenshot of pricing page]            │
│                                         │
│ Enterprise          [🌐 WEB] [agentmail.to]
│ $299.99/month             Score: 68     │
│ Custom solutions                        │
│ View Listing →                          │
└─────────────────────────────────────────┘
```

---

## Example 2: Search eBay for Products

### Command
```
"I need to buy a macbook M3 pro on ebay"
```

### What Happens
1. 🌐 System detects domain: `ebay.com`
2. 🔍 Extracts search query: `macbook M3 pro`
3. 🔗 Navigates to eBay search results
4. 📸 Takes screenshot of search page
5. 🔗 Extracts product URLs
6. 📸 Visits each product and takes screenshot
7. 💰 Extracts price, title, condition, seller
8. ✅ Displays in UI

### Expected Output
```
Found 3 products from ebay.com:

┌─────────────────────────────────────────┐
│ [Screenshot of eBay product page]       │
│                                         │
│ Apple MacBook Pro 14" M3 Pro            │
│                         [🌐 WEB] [eBay] │
│ $1,095.00                 Score: 78     │
│ Used - Seller: tech-seller              │
│ Various, US                             │
│ View Listing →                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Screenshot of eBay product page]       │
│                                         │
│ MacBook Pro M3 Pro 16GB RAM             │
│                         [🌐 WEB] [eBay] │
│ $1,294.99                 Score: 85     │
│ Excellent - Seller: best-buy            │
│ Various, US                             │
│ View Listing →                          │
└─────────────────────────────────────────┘
```

---

## Example 3: Search Amazon

### Command
```
"Find iPhone 15 Pro on Amazon"
```

### What Happens
1. 🌐 System detects domain: `amazon.com`
2. 🔍 Extracts search query: `iPhone 15 Pro`
3. 🔗 Constructs Amazon search URL
4. 📸 Scrapes search results
5. 💰 Extracts prices and product info
6. ✅ Displays in UI

---

## Example 4: General Price Search

### Command
```
"Search for iPad prices"
```

### What Happens
1. 🔍 No specific domain → searches web
2. 📸 Finds pages with iPad prices
3. 💰 Extracts all prices found
4. ✅ Displays results

---

## Example 5: Custom Domain

### Command
```
"Find prices on stripe.com"
```

### What Happens
1. 🌐 System detects domain: `stripe.com`
2. 🔗 Navigates to `https://stripe.com`
3. 📸 Takes screenshot
4. 💰 Extracts all prices from page
5. ✅ Displays in UI

---

## Progress Updates

### Timeline
```
0s   → Command queued for execution
1s   → 🌐 Starting web domain scraper...
2s   → 🔍 Searching agentmail.to...
10s  → ✅ Found 3 items with prices!
30s  → 🎉 Successfully scraped 3 items from agentmail.to!
```

### Status Messages
```
1. "🌐 Starting web domain scraper..."
2. "🔍 Searching agentmail.to..."
3. "✅ Found 3 items with prices!"
4. "🎉 Successfully scraped 3 items from agentmail.to!"
```

---

## UI Elements

### Command Input
```
┌─────────────────────────────────────────────────┐
│ Enter Command                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Search for agentmail.to and list all prices │ │
│ └─────────────────────────────────────────────┘ │
│                                    [Submit] ✓   │
└─────────────────────────────────────────────────┘
```

### Command History
```
┌─────────────────────────────────────────────────┐
│ Command History                                 │
│ ─────────────────────────────────────────────── │
│ ✅ Search for agentmail.to... (completed)       │
│    🎉 Successfully scraped 3 items!             │
│                                                 │
│ ⏳ Find iPhone 15 Pro... (searching)            │
│    🔍 Searching amazon.com...                   │
└─────────────────────────────────────────────────┘
```

### Scraped Listings
```
┌─────────────────────────────────────────────────┐
│ Scraped Listings                      3 items   │
│ ─────────────────────────────────────────────── │
│                                                 │
│ [Filter: Category] [Platform] [Min] [Max]      │
│                                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│ │ [Screenshot] │ │ [Screenshot] │ │ [Screen] │ │
│ │              │ │              │ │          │ │
│ │ Basic Plan   │ │ Pro Plan     │ │ Enter..  │ │
│ │ 🌐 WEB       │ │ 🌐 WEB       │ │ 🌐 WEB   │ │
│ │ $29.99       │ │ $99.99       │ │ $299.99  │ │
│ └──────────────┘ └──────────────┘ └──────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Real-World Examples

### E-commerce Research
```
Command: "Search for agentmail.to and list all prices"
Use Case: Analyze competitor pricing
Result: All pricing tiers with screenshots
```

### Product Shopping
```
Command: "I need to buy a macbook M3 pro on ebay"
Use Case: Find best deals on eBay
Result: Top 3 MacBook listings with prices
```

### Price Comparison
```
Command: "Find iPhone 15 Pro prices"
Use Case: Compare prices across sites
Result: Multiple listings from different sources
```

### Domain Analysis
```
Command: "List prices from shopify.com"
Use Case: Research Shopify pricing
Result: All Shopify plans with pricing
```

---

## Tips for Best Results

### 1. Be Specific with Domains
✅ Good: "Search for agentmail.to"
❌ Vague: "Search for email tool"

### 2. Include Search Terms
✅ Good: "Find macbook M3 pro on ebay"
❌ Vague: "Find laptop"

### 3. Use Natural Language
✅ Good: "I need to buy a camera from amazon"
✅ Good: "Search for prices on stripe.com"
✅ Good: "Find deals on craigslist"

### 4. Specify Quantity (Optional)
✅ "Find 5 items on ebay"
✅ "Search for 10 products"

---

## Common Patterns

### Pattern 1: Domain + Action
```
"Search for [domain]"
"Find prices on [domain]"
"List items from [domain]"
```

### Pattern 2: Product + Domain
```
"Buy [product] from [domain]"
"Find [product] on [domain]"
"Search [domain] for [product]"
```

### Pattern 3: General Search
```
"Search for [product]"
"Find [product] prices"
"List [product] deals"
```

---

## Expected Results

### What You'll See
1. ✅ Real screenshots from actual websites
2. ✅ Extracted prices in clean format
3. ✅ Product titles and descriptions
4. ✅ Links to original listings
5. ✅ 🌐 WEB badge on each item
6. ✅ Platform name (domain)
7. ✅ Profit scores
8. ✅ Auto-refresh every 10 seconds

### What You Won't See
❌ Fake/mock data
❌ Placeholder images
❌ Broken links
❌ Incorrect prices

---

## Troubleshooting Examples

### Problem: No results found
```
Command: "Search for xyz123.com"
Issue: Domain doesn't exist or has no prices
Solution: Try a different domain or add search query
```

### Problem: Wrong items extracted
```
Command: "Find laptop"
Issue: Too vague, finds random items
Solution: Be more specific: "Find macbook pro on ebay"
```

### Problem: Slow response
```
Command: "Find 10 items on amazon"
Issue: Too many items to scrape
Solution: Reduce to 3-5 items for faster results
```

---

## Success Indicators

When working correctly, you'll see:
1. ✅ Command accepted message
2. ✅ Progress updates in real-time
3. ✅ "Found X items" message
4. ✅ Items appear in Scraped Listings
5. ✅ Screenshots visible
6. ✅ 🌐 WEB badge displayed
7. ✅ Prices extracted correctly
8. ✅ Links work to original pages

---

## Quick Start Guide

### Step 1: Open Dashboard
```
http://localhost:3000
```

### Step 2: Enter Command
```
"Search for agentmail.to and list all prices"
```

### Step 3: Wait
```
~30 seconds for results
```

### Step 4: View Results
```
Check Scraped Listings section
See items with 🌐 WEB badge
```

### Step 5: Click Links
```
Click "View Listing →" to see original page
```

---

## Advanced Usage

### Combine with Filters
```
1. Search for products
2. Use filters to narrow results
3. Filter by price range
4. Filter by platform
```

### Track Multiple Domains
```
1. "Search for agentmail.to"
2. "Search for competitor.com"
3. Compare results side-by-side
```

### Regular Monitoring
```
1. Run same command daily
2. Track price changes
3. Identify trends
```

---

## Summary

The universal web domain scraper makes it easy to:
- 🌐 Scrape any website
- 💰 Extract prices automatically
- 📸 Capture screenshots
- 🔍 Search for products
- 📊 Compare prices
- 🎯 Track competitors

Just enter a natural language command and let the system do the work!
