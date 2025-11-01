# AutoBazaaar - Autonomous Commerce Agent with Email Automation

A comprehensive AI-powered system combining **autonomous e-commerce arbitrage** (AutoBazaaar) with **intelligent email automation** (AgentMail) to discover deals, negotiate purchases, manage listings, and handle customer communications 24/7.

## 🎯 Overview

**AutoBazaaar** discovers profitable opportunities across marketplaces, negotiates deals, manages inventory, and lists products across platforms - all automated with AI agents.

**AgentMail Integration** handles all email communications: buyer inquiries, negotiation threads, and customer support using GPT-4o-mini analysis and response generation.

### Key Capabilities

**E-Commerce Automation:**
- 🔍 Multi-platform opportunity discovery (Craigslist, Facebook Marketplace, eBay)
- 💰 AI-powered deal analysis and profit calculation
- 🤝 Autonomous negotiation with multiple strategies
- 📦 Inventory management and tracking
- 📋 Multi-platform listing creation
- 📊 Real-time metrics and analytics

**Email Automation:**
- 📧 24/7 email monitoring via AgentMail
- 🤖 GPT-4o-mini analysis (intent, sentiment, urgency)
- 💬 Context-aware automated responses
- 🔄 Real-time activity tracking
- 📈 Queue management with Convex database

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **npm 9+**
- **API Keys**:
  - Required: OpenAI, Convex, AgentMail
  - Optional: Browser-Use, Hyperspell, Perplexity, Composio, Redis

### Installation (10 minutes)

```bash
# 1. Clone and install
git clone <repository-url>
cd AgentMail
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Setup Convex database
npx convex login
npx convex dev --once
# Copy deployment URL to .env

# 4. Start the system
# Terminal 1: Email orchestrator
npm run orchestrator

# Terminal 2: Backend server (optional - for AutoBazaaar features)
npm run server

# Terminal 3: Dashboard UI
npm run dev
```

Open http://localhost:3000

## 📋 Architecture

```
┌──────────────────────────────────────────────────────┐
│                   AutoBazaaar System                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Agents    │  │ Integrations │  │  Services  │ │
│  ├─────────────┤  ├──────────────┤  ├────────────┤ │
│  │• Market     │  │• Browser-Use │  │• EventBus  │ │
│  │  Research   │  │• Hyperspell  │  │• Queue Mgr │ │
│  │• Deal       │  │• Perplexity  │  │• Metrics   │ │
│  │  Analyzer   │  │• Composio    │  │• Security  │ │
│  │• Negotiator │  │• OpenAI      │  │            │ │
│  │• Listing    │  │              │  │            │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│              AgentMail Email Automation               │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────┐    ┌─────────────┐   ┌────────────┐  │
│  │AgentMail │───►│EmailService │──►│EmailProc   │  │
│  │   SDK    │    │ (Queue)     │   │(AI Analyze)│  │
│  └──────────┘    └──────┬──────┘   └────────────┘  │
│                         │                            │
│                         ▼                            │
│                  ┌─────────────┐                     │
│                  │   Convex    │                     │
│                  │  Database   │                     │
│                  └──────┬──────┘                     │
│                         │                            │
│                         ▼                            │
│                  ┌─────────────┐                     │
│                  │  Dashboard  │                     │
│                  │  (Next.js)  │                     │
│                  └─────────────┘                     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Required Environment Variables

```env
# Core Services
OPENAI_API_KEY=sk-proj-your_key_here
OPENAI_MODEL=gpt-4o-mini

# Database
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# AgentMail Email Automation
AGENTMAIL_API_KEY=am_your_key_here
AUTO_RESPOND=true
EMAIL_POLL_INTERVAL=30
```

### Optional Features

```env
# AutoBazaaar Integrations
BROWSER_USE_API_KEY=your_key_here     # Web scraping
HYPERSPELL_API_KEY=your_key_here      # Memory system
PERPLEXITY_API_KEY=your_key_here      # Market research
COMPOSIO_API_KEY=your_key_here        # Marketplace APIs

# Infrastructure
REDIS_HOST=localhost                   # For queues
REDIS_PORT=6379
```

See `.env.example` for complete configuration.

## 📚 System Components

### AutoBazaaar Agents

Located in `src/agents/`:

1. **MarketResearchAgent** - Discovers opportunities across platforms
2. **DealAnalyzerAgent** - Analyzes profit potential and risk
3. **NegotiationAgent** - Handles buyer/seller negotiations
4. **ListingAgent** - Creates and manages multi-platform listings
5. **EmailTemplateEngine** - Generates contextual email content
6. **ResponseAnalyzer** - Analyzes buyer responses

### AgentMail Email System

Located in `src/services/`:

1. **AgentMailClient** - Official AgentMail SDK wrapper
2. **EmailService** - Queue management, polling, sending
3. **EmailProcessor** - AI analysis pipeline
4. **ResponseGenerator** - GPT-4o-mini response generation
5. **NewEmailOrchestrator** - System coordinator

### Convex Database Schema

**AutoBazaaar Tables** (11 tables):
- `opportunities` - Discovered deals with analysis
- `negotiations` - Negotiation threads and rounds
- `inventory` - Purchased items
- `listings` - Active platform listings
- `transactions` - Financial records
- `config`, `memory`, `alerts`, `products`, `buyerProfiles`, `negotiationStates`

**AgentMail Tables** (2 tables):
- `emailQueue` - Email processing queue with status
- `emailActivity` - Activity log for dashboard

See `convex/schema.ts` for complete schema.

## 🎬 Usage

### Running the Email Automation System

```bash
# Start orchestrator (processes emails)
npm run orchestrator

# Or directly
npx tsx start-demo.ts
```

This starts:
- ✅ Email polling from AgentMail
- ✅ AI analysis of incoming emails
- ✅ Automated response generation
- ✅ Real-time dashboard updates

### Running the Full AutoBazaaar System

```bash
# Terminal 1: Backend services
npm run server

# Terminal 2: Email orchestrator
npm run orchestrator

# Terminal 3: Dashboard
npm run dev
```

This enables:
- ✅ Market opportunity discovery
- ✅ Deal analysis and negotiation
- ✅ Listing management
- ✅ Email automation
- ✅ Full dashboard with all features

### Using Commands (AutoBazaaar)

The dashboard includes a command interface for manual control:

```
scrape craigslist iphone
analyze deal <opportunity-id>
negotiate <thread-id> start
list product <inventory-id> ebay
```

## 📊 Dashboard Features

Access at **http://localhost:3000**

### Metrics Cards
- Total profit, revenue, deals completed
- Conversion rate, response time
- Active listings, emails processed

### Email Activity Panel
- Real-time email feed (received, analyzed, sent)
- Queue statistics (pending, processing, completed)
- AI analysis metadata (intent, sentiment, urgency)

### Command Interface (AutoBazaaar)
- Manual command submission
- Command history tracking
- Real-time feedback

### Scraped Listings (AutoBazaaar)
- Discovered opportunities
- Profit analysis
- Quick actions

### Activity Feed
- System-wide activity log
- Success/error tracking

### Transactions Table
- Financial history
- P&L tracking

## 🛠️ Development

### Project Structure

```
AgentMail/
├── convex/                          # Convex database
│   ├── schema.ts                    # All 13 tables
│   ├── emails.ts                    # Email queue functions
│   ├── listings.ts                  # Listing functions
│   └── commands.ts                  # Command functions
│
├── src/
│   ├── agents/                      # AutoBazaaar AI agents
│   │   ├── MarketResearchAgent.ts
│   │   ├── DealAnalyzerAgent.ts
│   │   ├── NegotiationAgent.ts
│   │   └── ListingAgent.ts
│   │
│   ├── services/                    # AgentMail services
│   │   ├── AgentMailClient.ts
│   │   ├── EmailService.ts
│   │   ├── EmailProcessor.ts
│   │   └── ResponseGenerator.ts
│   │
│   ├── integrations/                # External APIs
│   │   ├── BrowserUseIntegration.ts
│   │   ├── HyperspellIntegration.ts
│   │   ├── PerplexityIntegration.ts
│   │   └── ComposioIntegration.ts
│   │
│   ├── core/                        # Infrastructure
│   │   ├── events/EventBus.ts
│   │   ├── queue/QueueManager.ts
│   │   ├── agents/AgentRegistry.ts
│   │   └── command/CommandExecutor.ts
│   │
│   ├── workflows/
│   │   └── NewEmailOrchestrator.ts  # Email orchestration
│   │
│   ├── server/                      # Backend API
│   │   ├── index.ts
│   │   └── websocket.ts
│   │
│   └── ui/                          # Next.js dashboard
│       ├── pages/index.tsx
│       └── components/
│
├── start-demo.ts                    # Email orchestrator entry
├── AGENTMAIL_INTEGRATION.md         # Email system docs
├── DEVELOPMENT.md                   # Development guide
├── PROJECT_STATUS.md                # AutoBazaaar status
└── README.md
```

### Available Scripts

```bash
npm run dev           # Start dashboard (localhost:3000)
npm run orchestrator  # Start email processor
npm run server        # Start backend API (AutoBazaaar)
npm run demo          # Run demo scenario
npm run type-check    # TypeScript checking
npm run lint          # ESLint
npm run test          # Jest tests
```

### Key Features by Script

**`npm run orchestrator`** → AgentMail email automation only
**`npm run server`** → AutoBazaaar backend (EventBus, Redis, agents)
**`npm run dev`** → Dashboard UI (shows all features)

## 📖 Documentation

- **[AGENTMAIL_INTEGRATION.md](./AGENTMAIL_INTEGRATION.md)** - Complete AgentMail guide
  - Email processing pipeline
  - API reference
  - Troubleshooting
  - Performance tips

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow
  - Setup instructions
  - Code structure
  - Testing guide
  - Deployment

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - AutoBazaaar status
  - Implementation progress
  - Known issues
  - Configuration requirements

## 🔒 Security

- ✅ API keys in environment variables only
- ✅ Self-email loop prevention
- ✅ Input validation and sanitization
- ✅ Rate limiting support
- ✅ Error handling with retry logic
- ✅ Webhook signature validation (optional)

## 🚀 Deployment

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

Includes:
- AutoBazaaar backend
- Redis
- Dashboard UI

### Option 2: Manual Deployment

See [DEVELOPMENT.md](./DEVELOPMENT.md) for:
- PM2 process management
- Vercel deployment (UI only)
- Railway/Render deployment

### Production Checklist

- [ ] All API keys configured in .env
- [ ] Convex deployed (`npx convex deploy --prod`)
- [ ] Redis running (if using AutoBazaaar)
- [ ] Webhook URL configured (for instant email delivery)
- [ ] Environment set to production
- [ ] Monitoring configured (Sentry optional)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run `npm run type-check` and `npm run lint`
4. Test thoroughly
5. Create pull request

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guidelines.

## 📝 License

MIT License

## 🙏 Built With

**Core:**
- [AgentMail](https://agentmail.to) - Email infrastructure & SDK
- [Convex](https://convex.dev) - Real-time serverless database
- [OpenAI](https://openai.com) - GPT-4o-mini AI
- [Next.js](https://nextjs.org) - Dashboard framework

**Integrations (Optional):**
- [Browser-Use](https://browser-use.com) - Web automation
- [Hyperspell](https://hyperspell.com) - Memory system
- [Perplexity](https://perplexity.ai) - Market intelligence
- [Composio](https://composio.dev) - Marketplace APIs

## 🎯 What Makes This Special

### Unified System
Unlike separate tools, AutoBazaaar + AgentMail work together:
- Opportunities discovered → Email negotiations handled automatically
- Buyer inquiries → AI analyzes and responds with context
- Listings created → Customer emails managed 24/7

### Database as Source of Truth
- Convex database shared across all processes
- Real-time sync between backend, orchestrator, and dashboard
- Persistent state survives restarts
- Scalable to multiple instances

### Production Ready
- Error handling with retries
- Comprehensive logging
- Metrics and monitoring
- Docker support
- Complete documentation

---

**Version**: 3.0.0 (AutoBazaaar + AgentMail merged)
**Last Updated**: 2025-01-11

**Questions?** See [AGENTMAIL_INTEGRATION.md](./AGENTMAIL_INTEGRATION.md) or [DEVELOPMENT.md](./DEVELOPMENT.md)
