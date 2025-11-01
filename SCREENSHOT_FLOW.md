# eBay Screenshot Scraper - User Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  User enters: "I need to buy a macbook M3 pro on ebay"        │
│                                                                 │
│  [Command Input Box]  →  [Submit Button]                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMMAND HANDLER                              │
│                  /api/command.ts                                │
│                                                                 │
│  1. Parse command                                               │
│  2. Detect "ebay" keyword                                       │
│  3. Extract search query: "macbook M3 pro"                      │
│  4. Call executeEbayScreenshotScraper()                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              SCREENSHOT SCRAPER API                             │
│          /api/scrape-ebay-screenshots.ts                        │
│                                                                 │
│  1. Create browser session                                      │
│  2. Navigate to eBay search                                     │
│  3. Take screenshot of search results                           │
│  4. Extract product URLs                                        │
│  5. For each product:                                           │
│     • Navigate to product page                                  │
│     • Wait for page load                                        │
│     • Extract details (title, price, condition)                 │
│     • Take screenshot                                           │
│  6. Return products with screenshots                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BROWSER SERVICE                               │
│              python_bridge/browser_service.py                   │
│                                                                 │
│  • POST /sessions - Create browser                              │
│  • POST /sessions/{id}/navigate - Go to URL                     │
│  • GET /sessions/{id}/screenshot - Capture screenshot           │
│  • POST /sessions/{id}/evaluate - Run JavaScript               │
│  • DELETE /sessions/{id} - Close browser                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER-USE                                 │
│                   (Playwright + AI)                             │
│                                                                 │
│  • Real Chrome/Firefox browser                                  │
│  • Navigate to eBay.com                                         │
│  • Interact with page                                           │
│  • Capture screenshots                                          │
│  • Extract data                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCRAPED LISTINGS                             │
│              /api/listings/scraped.ts                           │
│                                                                 │
│  • Store products with screenshots                              │
│  • Add to realScrapedListings array                             │
│  • Mark source as 'ebay-screenshot-scraper'                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UI DISPLAY                                   │
│          components/ScrapedListings.tsx                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Screenshot Image]                                      │  │
│  │                                                          │  │
│  │  Apple MacBook Pro 14" M3 Pro    [📸 SCREENSHOT] [eBay] │  │
│  │  $1,095.00                              Score: 75        │  │
│  │  Used - Seller: tech-seller                              │  │
│  │  Various, US                                             │  │
│  │  View Listing →                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  • Auto-refreshes every 10 seconds                              │
│  • Shows real screenshots from eBay                             │
│  • Purple badge indicates screenshot source                     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Command
    ↓
"I need to buy a macbook M3 pro on ebay"
    ↓
Command Parser
    ↓
{
  action: 'search',
  category: 'electronics',
  searchQuery: 'macbook M3 pro'
}
    ↓
Screenshot Scraper API
    ↓
Browser Service (Port 8001)
    ↓
eBay.com
    ↓
Screenshots (base64)
    ↓
Product Data + Screenshots
    ↓
[
  {
    title: "Apple MacBook Pro 14\" M3 Pro",
    price: 1095.00,
    screenshot: "data:image/jpeg;base64,/9j/4AAQ...",
    url: "https://www.ebay.com/itm/123456"
  },
  ...
]
    ↓
Scraped Listings Store
    ↓
UI Component
    ↓
User sees products with screenshots!
```

## Progress Updates Timeline

```
Time    Status          Message
────────────────────────────────────────────────────────────
0s      pending         Command queued for execution
1s      analyzing       📸 Starting eBay screenshot scraper...
2s      searching       🔍 Searching eBay for "macbook M3 pro"...
10s     processing      ✅ Found 3 products with screenshots!
30s     completed       🎉 Successfully scraped 3 eBay products!
```

## Component Architecture

```
Dashboard (index.tsx)
    │
    ├─ CommandInput
    │   └─ Submits to /api/command
    │
    ├─ CommandHistory
    │   └─ Shows command status
    │
    └─ ScrapedListings
        │
        ├─ Fetches from /api/listings/scraped
        │
        └─ Displays products
            │
            ├─ Screenshot Image (base64 data URL)
            ├─ Product Title
            ├─ Price
            ├─ Badges (📸 SCREENSHOT, eBay)
            ├─ Details (condition, seller, location)
            └─ Link to eBay listing
```

## Example Command Variations

All of these will trigger the screenshot scraper:

```
✅ "I need to buy a macbook M3 pro on ebay"
✅ "I want to buy iPhone 15 Pro from ebay"
✅ "Find iPad Air M2 on eBay"
✅ "Search for Sony A7IV camera"
✅ "Buy Nintendo Switch on ebay"
✅ "Find deals on AirPods Pro"
✅ "I need MacBook Air M2"
```

## Screenshot Examples

### Search Results Screenshot
- Full eBay search results page
- Shows multiple products
- Captured at 1920x1080 resolution

### Product Page Screenshots
- Individual product pages
- Shows product image, title, price
- Includes seller info, condition
- Scrolled to show key details

## Technical Stack

```
Frontend:
  ├─ Next.js (React framework)
  ├─ TypeScript
  ├─ TailwindCSS (styling)
  └─ Fetch API (HTTP requests)

Backend:
  ├─ Next.js API Routes
  ├─ Python FastAPI (browser service)
  └─ Browser-Use (Playwright wrapper)

Browser Automation:
  ├─ Playwright
  ├─ Chromium/Firefox
  └─ Screenshot capture
```

## Success Indicators

When working correctly, you'll see:

1. ✅ Command accepted message
2. ✅ Progress updates in real-time
3. ✅ "Found X products" message
4. ✅ Products appear in Scraped Listings
5. ✅ Screenshots visible as images
6. ✅ Purple "📸 SCREENSHOT" badge
7. ✅ Product details extracted correctly
8. ✅ Links work to eBay listings

## Quick Test

```bash
# 1. Start browser service
python python_bridge/browser_service.py

# 2. Start Next.js (in another terminal)
npm run dev

# 3. Open browser
open http://localhost:3000

# 4. Enter command
"I need to buy a macbook M3 pro on ebay"

# 5. Wait ~30 seconds

# 6. Check Scraped Listings section
# Should see 3 products with screenshots!
```
