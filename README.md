# ProfitPilot - Autonomous AI Agent for E-Commerce

An AI agent that autonomously sources, lists, negotiates, and sells products across multiple platforms while maximizing profit margins through intelligent market analysis and customer engagement.

## 🎯 Key Features

- **Automated Email Communication** - Handles buyer inquiries and negotiations 24/7 using AgentMail
- **Multi-Platform Listings** - Creates listings on Craigslist, Facebook Marketplace, and eBay using Browser-Use
- **Intelligent Negotiation** - Context-aware negotiation using Hyperspell memory system
- **Market Intelligence** - Real-time pricing analysis using Perplexity API
- **Real-Time Dashboard** - Monitor metrics and activity with Next.js dashboard
- **Full Autonomy** - Runs without human intervention

## 🏗️ Architecture

```
ProfitPilot
├── EmailAgent (AgentMail) - Buyer communication
├── BrowserAgent (Browser-Use) - Listing automation
├── MarketAgent (Perplexity) - Market analysis
├── ContextStore (Hyperspell) - Buyer memory
└── Database (Convex) - Real-time data storage
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for:
  - AgentMail
  - OpenAI
  - Browser-Use
  - Hyperspell
  - Perplexity
  - Convex

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
   # Edit .env and add your API keys
   ```

4. **Start the dashboard**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

5. **Start the orchestrator** (in a separate terminal)
   ```bash
   npm run orchestrator
   ```

## 📋 Project Structure

```
/profitpilot-ts
├── /src
│   ├── /agents
│   │   ├── emailAgent.ts       # AgentMail handler
│   │   ├── browserAgent.ts     # Browser automation
│   │   └── marketAgent.ts      # Market analysis
│   ├── /memory
│   │   └── contextStore.ts     # Hyperspell integration
│   ├── /database
│   │   ├── models.ts           # Convex schemas
│   │   └── client.ts           # Database client
│   ├── /workflows
│   │   └── orchestrator.ts     # Main logic
│   ├── /demo
│   │   ├── runner.ts           # Demo execution
│   │   └── scenarios.ts        # Test scenarios
│   ├── /ui
│   │   ├── /pages              # Next.js pages
│   │   ├── /components         # React components
│   │   └── /styles             # Tailwind CSS
│   └── /types
│       └── index.ts            # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## 🎬 Running the Demo

Run the full demo scenario:

```bash
npm run demo
```

This will execute all demo scenarios:
1. Load Inventory - Show 3 products ready to sell
2. Create Listings - Live browser automation
3. Process Inquiry - Email arrives, AI responds
4. Handle Negotiation - Multi-round back-and-forth
5. Close Deal - Complete transaction
6. Show Metrics - Real-time dashboard

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following:

```env
# AgentMail API Configuration
AGENTMAIL_API_KEY=your_agentmail_api_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Browser-Use Configuration
BROWSER_USE_API_KEY=your_browser_use_api_key_here

# Hyperspell Configuration
HYPERSPELL_API_KEY=your_hyperspell_api_key_here
HYPERSPELL_API_URL=https://api.hyperspell.com

# Perplexity Configuration
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Convex Configuration
CONVEX_DEPLOYMENT=dev
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here

# Application Configuration
NODE_ENV=development
PORT=3000
```

## 📊 Dashboard

The dashboard provides:
- **Real-time Metrics** - Profit, deals, conversion rate, response time
- **Activity Feed** - Live updates on all system actions
- **Transaction History** - Complete record of all sales
- **Control Panel** - Start/stop system, run demos

## 🔄 How It Works

1. **Product Listing**: BrowserAgent creates listings on multiple platforms
2. **Email Monitoring**: EmailAgent continuously monitors for buyer inquiries
3. **Analysis**: Incoming emails are analyzed for intent, product, and price
4. **Market Research**: MarketAgent researches optimal pricing
5. **Buyer Profiling**: ContextStore retrieves buyer history and preferences
6. **Strategy Calculation**: Optimal negotiation strategy is calculated
7. **Response Generation**: AI generates personalized response
8. **Negotiation**: Multi-round negotiation handled automatically
9. **Deal Closing**: Transaction completed and confirmed
10. **Metrics Update**: Dashboard updated in real-time

## 🛠️ Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## 📈 Success Metrics

- **Deals Completed**: Number of successful transactions
- **Total Profit**: Cumulative profit from all sales
- **Conversion Rate**: Percentage of inquiries that result in sales
- **Response Time**: Average time to respond to buyer emails
- **Email Processing**: Number of emails handled automatically

## 🔒 Security

- API keys stored in environment variables (never commit `.env`)
- Rate limiting on browser automation
- Error handling with retry logic
- Graceful shutdown handling

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built for the AI Agent Hackathon using:
- **AgentMail** - Email automation
- **Hyperspell** - Memory system
- **Browser-Use** - Web automation
- **Perplexity** - Market intelligence
- **Convex** - Real-time database
- **OpenAI** - AI responses

---

*Built with ❤️ for the AI Agent Hackathon*
