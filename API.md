# ProfitPilot API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication for local development. In production, implement proper authentication.

## Endpoints

### Get System Status

**GET** `/api/status`

Returns the current system status including metrics and recent activity.

**Response:**
```json
{
  "running": true,
  "metrics": {
    "totalProfit": 2500.50,
    "dealsCompleted": 15,
    "dealsPending": 3,
    "averageProfitMargin": 28.5,
    "conversionRate": 0.65,
    "averageResponseTime": 45.2,
    "emailsProcessed": 45,
    "listingsActive": 8,
    "totalRevenue": 12500.00,
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "recentActivity": [
    {
      "id": "log_1",
      "type": "deal_closed",
      "description": "Deal closed: MacBook Pro sold to buyer@example.com for $1500",
      "timestamp": "2024-01-15T10:29:00Z",
      "metadata": {
        "buyer": "buyer@example.com",
        "product": "MacBook Pro",
        "finalPrice": 1500,
        "profit": 300
      }
    }
  ]
}
```

### Get Metrics

**GET** `/api/metrics`

Returns current performance metrics.

**Response:**
```json
{
  "totalProfit": 2500.50,
  "dealsCompleted": 15,
  "dealsPending": 3,
  "averageProfitMargin": 28.5,
  "conversionRate": 0.65,
  "averageResponseTime": 45.2,
  "emailsProcessed": 45,
  "listingsActive": 8,
  "totalRevenue": 12500.00,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Get Transactions

**GET** `/api/transactions`

Returns a list of transactions.

**Query Parameters:**
- `limit` (number, optional): Maximum number of transactions to return (default: 50)

**Response:**
```json
[
  {
    "id": "txn_1",
    "buyerEmail": "buyer@example.com",
    "buyerId": "buyer_1",
    "product": "MacBook Pro 14\" M2",
    "productId": "prod_1",
    "status": "completed",
    "initialPrice": 1600,
    "finalPrice": 1500,
    "cost": 1200,
    "profit": 300,
    "negotiationRounds": 2,
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T09:15:00Z",
    "completedAt": "2024-01-15T09:15:00Z",
    "listingUrls": {
      "craigslist": "https://craigslist.org/view/12345",
      "facebook": "https://facebook.com/marketplace/item/67890"
    }
  }
]
```

### Get Activity Logs

**GET** `/api/activity`

Returns activity log entries.

**Query Parameters:**
- `limit` (number, optional): Maximum number of logs to return (default: 50)

**Response:**
```json
[
  {
    "id": "log_1",
    "type": "deal_closed",
    "description": "Deal closed: MacBook Pro sold to buyer@example.com for $1500",
    "timestamp": "2024-01-15T10:29:00Z",
    "metadata": {
      "buyer": "buyer@example.com",
      "product": "MacBook Pro",
      "finalPrice": 1500,
      "profit": 300
    }
  }
]
```

**Activity Types:**
- `email_received` - Email received from buyer
- `email_sent` - Email sent to buyer
- `listing_created` - New listing created
- `negotiation_started` - Negotiation process started
- `deal_closed` - Deal successfully closed
- `price_updated` - Listing price updated
- `error` - Error occurred

### Get Products

**GET** `/api/products`

Returns all products in inventory.

**Response:**
```json
[
  {
    "id": "prod_1",
    "title": "MacBook Pro 14\" M2 - 16GB RAM, 512GB SSD",
    "description": "Excellent condition MacBook Pro...",
    "price": 1600,
    "cost": 1200,
    "category": "Electronics",
    "condition": "like-new",
    "images": [],
    "createdAt": "2024-01-15T08:00:00Z"
  }
]
```

## WebSocket API

### Connection

Connect to `ws://localhost:3001` for real-time updates.

### Message Types

#### Metrics Update
```json
{
  "type": "metrics",
  "data": {
    "totalProfit": 2500.50,
    "dealsCompleted": 15,
    ...
  }
}
```

#### General Update
```json
{
  "type": "update",
  "data": {
    "metrics": { ... },
    "recentActivity": [ ... ]
  }
}
```

### Update Frequency

Updates are sent every 5 seconds automatically.

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. In production, implement appropriate rate limiting.

## Data Models

### Transaction Status

- `negotiating` - Negotiation in progress
- `pending` - Waiting for response
- `completed` - Successfully completed
- `cancelled` - Cancelled by buyer or seller
- `expired` - Negotiation expired

### Product Condition

- `new` - Brand new
- `like-new` - Excellent condition
- `used` - Used but functional
- `refurbished` - Refurbished by manufacturer

### Activity Types

See the `/api/activity` endpoint documentation above.

## Examples

### Fetch Metrics

```javascript
const response = await fetch('http://localhost:3001/api/metrics');
const metrics = await response.json();
console.log(`Total Profit: $${metrics.totalProfit}`);
```

### Get Recent Transactions

```javascript
const response = await fetch('http://localhost:3001/api/transactions?limit=10');
const transactions = await response.json();
transactions.forEach(txn => {
  console.log(`${txn.product}: $${txn.finalPrice}`);
});
```

### Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'metrics') {
    console.log('Metrics updated:', data.data);
  }
};
```

