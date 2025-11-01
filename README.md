# ProfitPilot - Autonomous E-Commerce AI Agent

An AI agent that autonomously sources, lists, negotiates, and sells products across multiple platforms while maximizing profit margins through intelligent market analysis and customer engagement.

## Overview

ProfitPilot is built for the AI Agent Hackathon and demonstrates a fully autonomous e-commerce selling agent that:

- **Monitors emails** 24/7 using AgentMail
- **Creates listings** across multiple platforms (Craigslist, Facebook Marketplace, eBay) using Browser-Use
- **Negotiates** intelligently using buyer profiling and history via Hyperspell
- **Analyzes markets** in real-time using Perplexity
- **Tracks everything** in a beautiful real-time dashboard

## Key Features

- 🤖 **Fully Autonomous** - Runs without human intervention
- 📧 **Email Intelligence** - AI-powered email analysis and response generation
- 🌐 **Multi-Platform** - Automated listing creation across major marketplaces
- 🧠 **Context-Aware** - Remembers buyer preferences and negotiation history
- 📊 **Real-Time Dashboard** - Live metrics and activity monitoring
- 💰 **Profit Maximization** - Intelligent pricing based on market analysis

## Tech Stack

- **TypeScript** - Type-safe codebase
- **React** - Dashboard UI
- **Express** - API server
- **WebSocket** - Real-time updates
- **OpenAI** - Email analysis and response generation
- **AgentMail** - Email automation
- **Browser-Use** - Browser automation
- **Hyperspell** - Memory and context management
- **Perplexity** - Market intelligence
- **Convex** - Database (mock implementation included)

## Project Structure

```
profitpilot/
├── src/
│   ├── agents/          # Core agent implementations
│   │   ├── emailAgent.ts       # Email handling with AgentMail
│   │   ├── browserAgent.ts     # Multi-platform listing automation
│   │   └── marketAgent.ts      # Market analysis with Perplexity
│   ├── memory/          # Memory system
│   │   ├── contextStore.ts     # Buyer profiling and strategy
│   │   └── hyperspellClient.ts # Hyperspell integration
│   ├── database/        # Database layer
│   │   ├── models.ts           # Data models
│   │   └── client.ts            # Database client
│   ├── workflows/       # Orchestration
│   │   └── orchestrator.ts     # Main coordination logic
│   ├── demo/           # Demo system
│   │   ├── runner.ts           # Demo execution
│   │   └── scenarios.ts        # Demo scenarios
│   ├── ui/             # React dashboard
│   │   ├── components/         # UI components
│   │   └── App.tsx             # Main app
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- API keys for:
  - AgentMail
  - OpenAI
  - Browser-Use (optional for demo)
  - Hyperspell (optional for demo)
  - Perplexity (optional for demo)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd profitpilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   AGENTMAIL_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   BROWSER_USE_API_KEY=your_key_here
   HYPERSPELL_API_KEY=your_key_here
   PERPLEXITY_API_KEY=your_key_here
   PORT=3001
   DEMO_MODE=false
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode

1. **Start the API server** (in one terminal)
   ```bash
   npm run dev
   ```

2. **Start the UI** (in another terminal)
   ```bash
   npm run ui:dev
   ```

3. **Open the dashboard**
   - Navigate to `http://localhost:3000`
   - The API server runs on `http://localhost:3001`

### Production Mode

1. **Build everything**
   ```bash
   npm run build
   npm run ui:build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

### Demo Mode

Run the complete demo scenario:

```bash
npm run demo
```

This will:
- Load demo products
- Perform market analysis
- Create listings
- Process buyer inquiries
- Handle negotiations
- Close deals
- Display final metrics

## API Endpoints

### GET `/api/status`
Get system status and metrics

**Response:**
```json
{
  "running": true,
  "metrics": { ... },
  "recentActivity": [ ... ]
}
```

### GET `/api/metrics`
Get current metrics

**Response:**
```json
{
  "totalProfit": 2500.50,
  "dealsCompleted": 15,
  "dealsPending": 3,
  "conversionRate": 0.65,
  "averageProfitMargin": 28.5,
  "emailsProcessed": 45,
  "listingsActive": 8,
  "totalRevenue": 12500.00
}
```

### GET `/api/transactions`
Get transaction list

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 50)

**Response:**
```json
[
  {
    "id": "txn_1",
    "buyerEmail": "buyer@example.com",
    "product": "MacBook Pro",
    "status": "completed",
    "finalPrice": 1500,
    "profit": 300,
    ...
  }
]
```

### GET `/api/activity`
Get activity logs

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)

### GET `/api/products`
Get all products in inventory

## Architecture

### Email Agent
- Monitors inbox every 30 seconds
- Analyzes emails using OpenAI GPT-4
- Generates context-aware responses
- Tracks buyer interactions

### Browser Agent
- Creates listings on Craigslist, Facebook Marketplace, eBay
- Updates prices automatically
- Marks items as sold
- Monitors listing status

### Market Agent
- Analyzes product values using Perplexity
- Calculates optimal pricing
- Identifies market trends
- Monitors competitor prices

### Context Store
- Builds buyer profiles from history
- Calculates negotiation strategies
- Tracks interaction patterns
- Learns optimal pricing

### Orchestrator
- Coordinates all agents
- Handles workflow logic
- Manages deal lifecycle
- Updates metrics

## Demo Scenarios

### Full Demo (`full_demo`)
Complete end-to-end demonstration (5 minutes):
1. Load inventory
2. Market analysis
3. Create listings
4. Receive inquiries
5. Process emails
6. Negotiate deals
7. Close transactions
8. Show metrics

### Quick Demo (`quick_demo`)
Shortened demonstration (2 minutes):
1. Load products
2. Create listings
3. Process inquiry
4. Close deal

## Development

### Adding a New Platform

1. Add platform to `ListingPlatform` type
2. Implement platform handler in `BrowserAgent`
3. Update `platforms` array

### Customizing Email Templates

Edit `src/agents/emailTemplates.ts` to modify response templates.

### Adding Metrics

1. Update `Metrics` type in `src/types/index.ts`
2. Add calculation in `DatabaseClient.updateMetrics()`
3. Display in dashboard component

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AGENTMAIL_API_KEY` | AgentMail API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `BROWSER_USE_API_KEY` | Browser-Use API key | Optional |
| `HYPERSPELL_API_KEY` | Hyperspell API key | Optional |
| `PERPLEXITY_API_KEY` | Perplexity API key | Optional |
| `PORT` | API server port | No (default: 3001) |
| `DEMO_MODE` | Enable demo mode | No (default: false) |

## Troubleshooting

### API Connection Issues
- Verify API keys are set correctly in `.env`
- Check network connectivity
- Review API rate limits

### Demo Mode Not Working
- Set `DEMO_MODE=true` in `.env`
- Ensure no real API calls are being made

### Dashboard Not Loading
- Verify API server is running on port 3001
- Check browser console for errors
- Verify WebSocket connection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Review the demo scenarios

## Acknowledgments

Built for the AI Agent Hackathon using:
- AgentMail
- Browser-Use
- Hyperspell
- Perplexity
- OpenAI
- Convex

---

**ProfitPilot** - Making money while you sleep 💰

