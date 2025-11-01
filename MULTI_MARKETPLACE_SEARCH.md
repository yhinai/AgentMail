# Multi-Marketplace Search - Complete ✅

## Overview
The system now automatically searches **both eBay and Craigslist** when you don't specify a specific marketplace!

## How It Works

### Automatic Multi-Search
When you enter a command like:
```
"I need to buy a macbook M3 pro"
```

The system will:
1. 🔍 Detect that no specific marketplace was mentioned
2. 🛒 Search **eBay** for "macbook M3 pro" (2 results)
3. 📋 Search **Craigslist** for "macbook M3 pro" (2 results)
4. 📸 Capture screenshots of all items
5. 💰 Extract prices and details
6. ✅ Display all results together in Scraped Listings

### Single Marketplace Search
If you specify a marketplace:
```
"I need to buy a macbook M3 pro on ebay"
```

The system will:
- 🎯 Search **only eBay**
- Return 3 results from eBay

## Commands That Trigger Multi-Search

### ✅ These search BOTH eBay and Craigslist:
```
"I need to buy a macbook M3 pro"
"Find iPhone 15 Pro"
"Search for iPad Air"
"I want to buy a camera"
```

### ✅ These search ONLY the specified marketplace:
```
"I need to buy a macbook M3 pro on ebay"
"Find iPhone 15 Pro on craigslist"
"Search amazon for iPad"
"Buy camera from ebay.com"
```

## Progress Updates

When searching multiple marketplaces, you'll see:

```
1. 🌐 Starting web domain scraper...
2. 🔍 Searching eBay and Craigslist for "macbook M3 pro"...
3. ✅ Found 2 on eBay, searching Craigslist...
4. ✅ Found 4 items with prices!
5. 🎉 Successfully scraped 4 items from eBay and Craigslist!
```

## Results Display

### In Scraped Listings
Items will show with their respective platform badges:

```
┌─────────────────────────────────────────┐
│ [Screenshot from eBay]                  │
│                                         │
│ MacBook Pro 14" M3 Pro                  │
│                      [📸 SCREENSHOT] [eBay]
│ $1,095.00                 Score: 78     │
│ Used - Seller: tech-seller              │
│ View Listing →                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Screenshot from Craigslist]            │
│                                         │
│ MacBook Pro M3 - Like New               │
│                   [🌐 WEB] [Craigslist] │
│ $1,200.00                 Score: 85     │
│ Local pickup available                  │
│ View Listing →                          │
└─────────────────────────────────────────┘
```

## Badges

- **📸 SCREENSHOT** (Purple) - eBay items with screenshots
- **🌐 WEB** (Indigo) - Craigslist and other web items
- **Platform Badge** - Shows eBay, Craigslist, or domain name

## Technical Details

### Search Logic
```typescript
// Detects if no specific domain mentioned
const shouldSearchMultiple = !domain && (
  commandLower.includes('buy') || 
  commandLower.includes('find') ||
  commandLower.includes('search')
);

if (shouldSearchMultiple) {
  // Search eBay (2 items)
  // Search Craigslist (2 items)
  // Combine results (4 total)
}
```

### Results Per Marketplace
- **eBay**: 2 items
- **Craigslist**: 2 items
- **Total**: 4 items per search

### API Calls
When you search for "macbook M3 pro":
1. `POST /api/scrape-ebay-screenshots` with query "macbook M3 pro"
2. `POST /api/scrape-web-domain` with domain "craigslist.org" and query "macbook M3 pro"

## Examples

### Example 1: Multi-Marketplace Search
**Command:** `"I need to buy a macbook M3 pro"`

**Results:**
- 2 items from eBay ($1,095 - $1,119)
- 2 items from Craigslist ($1,000 - $1,300)
- Total: 4 items with screenshots

### Example 2: eBay Only
**Command:** `"I need to buy a macbook M3 pro on ebay"`

**Results:**
- 3 items from eBay only
- No Craigslist search

### Example 3: Craigslist Only
**Command:** `"Find macbook on craigslist"`

**Results:**
- Items from Craigslist only
- No eBay search

## Benefits

### 1. Better Price Comparison
See prices from multiple sources in one search

### 2. More Options
Get 4 results instead of 2-3 from a single marketplace

### 3. Time Saving
No need to search each marketplace separately

### 4. Smart Detection
Automatically knows when to search multiple vs single marketplace

## Configuration

### Adjust Number of Results
In `/src/ui/pages/api/command.ts`:

```typescript
// eBay results
maxProducts: 2  // Change to get more/less from eBay

// Craigslist results  
maxResults: 2   // Change to get more/less from Craigslist
```

### Add More Marketplaces
To add Amazon, Facebook Marketplace, etc.:

```typescript
// Add after Craigslist search
try {
  const amazonResponse = await fetch('http://localhost:3000/api/scrape-web-domain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: 'amazon.com',
      searchQuery,
      maxResults: 2
    })
  });
  
  if (amazonResponse.ok) {
    const amazonResult = await amazonResponse.json();
    if (amazonResult.results) {
      allResults.push(...amazonResult.results.map((r: any) => ({...r, source: 'amazon'})));
    }
  }
} catch (e) {
  console.error('Amazon search failed:', e);
}
```

## Error Handling

### If eBay Fails
- Craigslist search continues
- Returns whatever results are available
- Shows error in console

### If Craigslist Fails
- eBay results still returned
- Continues gracefully
- Shows error in console

### If Both Fail
- Falls back to simulation mode
- Shows error message to user

## Performance

### Timing
- eBay search: ~30 seconds
- Craigslist search: ~20 seconds
- **Total**: ~50 seconds for both

### Parallel vs Sequential
Currently searches **sequentially** (one after another):
1. eBay first
2. Then Craigslist

**Future improvement**: Search in parallel to reduce total time to ~30 seconds

## Testing

### Test Multi-Search
```bash
# Via UI
Open http://localhost:3000
Enter: "I need to buy a macbook M3 pro"
Wait ~50 seconds
Check Scraped Listings for 4 items

# Via API (not available as single endpoint)
# Must use UI or command API
```

### Test Single Marketplace
```bash
# eBay only
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "I need to buy a macbook M3 pro on ebay"}'

# Craigslist only  
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "Find macbook on craigslist"}'
```

## Troubleshooting

### Issue: Only getting eBay results
**Cause:** Craigslist search may have failed
**Solution:** Check console logs for errors

### Issue: No results at all
**Cause:** Both searches failed
**Solution:** 
- Check browser service is running
- Check network connectivity
- Try single marketplace search

### Issue: Slow performance
**Cause:** Searching 2 marketplaces takes time
**Solution:**
- Reduce results per marketplace
- Or specify single marketplace in command

## Future Enhancements

- [ ] Parallel marketplace searches (faster)
- [ ] Add Amazon, Facebook Marketplace
- [ ] Price comparison view
- [ ] Filter by marketplace in UI
- [ ] Sort by price across all marketplaces
- [ ] Save favorite searches
- [ ] Price alerts

## Status: COMPLETE ✅

Multi-marketplace search is fully implemented and ready to use!

**Try it now:**
```
"I need to buy a macbook M3 pro"
```

You'll get results from both eBay and Craigslist automatically! 🎉
