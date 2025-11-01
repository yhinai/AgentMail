# AgentMail Email Automation System

An autonomous AI-powered email processing system that handles customer inquiries, negotiations, and responses 24/7 using AgentMail, OpenAI GPT-4o-mini, and Convex real-time database.

## 🎯 Key Features

- **Automated Email Communication** - Handles buyer inquiries and negotiations 24/7 using AgentMail
- **AI-Powered Analysis** - GPT-4o-mini analyzes intent, sentiment, and urgency
- **Intelligent Responses** - Context-aware response generation with negotiation strategies
- **Real-Time Database** - Convex serverless database for cross-process synchronization
- **Live Dashboard** - Monitor email activity, queue stats, and metrics in real-time
- **Webhook Support** - Instant email processing (polling available as fallback)

## 🏗️ Architecture

```
┌─────────────────┐
│  AgentMail API  │  Email infrastructure
└────────┬────────┘
         │
    ┌────▼────┐
    │EmailSvc │  Queue management & polling
    └────┬────┘
         │
    ┌────▼────────┐
    │EmailProc    │  AI analysis & response generation
    └────┬────────┘
         │
    ┌────▼────┐       ┌──────────┐
    │ Convex  │◄─────►│Dashboard │  Real-time sync
    │Database │       │(Next.js) │
    └─────────┘       └──────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (v20 recommended)
- **npm 9+**
- **API Keys**:
  - AgentMail (required)
  - OpenAI (required for GPT-4o-mini)
  - Convex (required for database)

### Installation (5 minutes)

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd AgentMail
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys:
   # - AGENTMAIL_API_KEY
   # - OPENAI_API_KEY
   # - CONVEX_URL (get from next step)
   ```

3. **Setup Convex**
   ```bash
   npx convex login
   npx convex dev --once
   # Copy the deployment URL to .env as CONVEX_URL
   ```

4. **Start the system**

   **Terminal 1**: Email processor
   ```bash
   npx tsx start-demo.ts
   ```

   **Terminal 2**: Dashboard
   ```bash
   cd src/ui && npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📧 How It Works

1. **Email Arrives** → AgentMail receives it
2. **Queue** → Stored in Convex `emailQueue` table
3. **Analyze** → GPT-4o-mini extracts intent, sentiment, urgency
4. **Generate Response** → AI creates contextual reply
5. **Send** → Reply sent via AgentMail (if AUTO_RESPOND=true)
6. **Log Activity** → Dashboard updates in real-time

**Email Processing Flow**:
```
📬 Received → 🔄 Processing → 🔍 Analyzed → 📤 Sent → ✅ Completed
```

## 📋 Project Structure

```
AgentMail/
├── convex/                    # Convex serverless functions
│   ├── schema.ts              # Database schema
│   ├── emails.ts              # Email queue operations
│   └── _generated/            # Auto-generated types
│
├── src/
│   ├── services/              # Core services
│   │   ├── AgentMailClient.ts # AgentMail SDK wrapper
│   │   ├── EmailService.ts    # Queue & polling
│   │   ├── EmailProcessor.ts  # AI processing
│   │   └── ResponseGenerator.ts # GPT-4o-mini
│   │
│   ├── database/              # Database layer
│   │   └── client.ts          # Convex client
│   │
│   ├── workflows/             # Orchestration
│   │   └── NewEmailOrchestrator.ts
│   │
│   └── ui/                    # Next.js dashboard
│       ├── pages/
│       └── components/
│
├── start-demo.ts              # Entry point
├── AGENTMAIL_INTEGRATION.md   # 📚 Integration docs
├── DEVELOPMENT.md             # 📚 Dev guide
└── README.md
```

## 🔧 Configuration

### Required Environment Variables

```env
# AgentMail (email automation)
AGENTMAIL_API_KEY=am_your_api_key_here

# OpenAI (AI analysis)
OPENAI_API_KEY=sk-proj-your_key_here
OPENAI_MODEL=gpt-4o-mini

# Convex (database)
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Optional Configuration
AUTO_RESPOND=true              # Auto-send responses
EMAIL_POLL_INTERVAL=30         # Seconds between checks
WEBHOOK_URL=https://...        # For instant delivery (optional)
```

### Key Settings

- **AUTO_RESPOND=true**: Automatically sends AI-generated responses
- **AUTO_RESPOND=false**: Generates responses but requires manual approval
- **EMAIL_POLL_INTERVAL**: How often to check for new emails (default: 30s)
- **WEBHOOK_URL**: If set, uses webhooks instead of polling for instant delivery

## 📊 Dashboard Features

Access at **http://localhost:3000**

### Real-Time Monitoring

- **Email Activity Feed** - Live updates (received, analyzed, sent, errors)
- **Queue Statistics** - Pending, processing, completed, failed counts
- **Auto-Refresh** - Updates every 3 seconds
- **Metadata Display** - Intent, sentiment, urgency for each email

### What You'll See

```
📬 received  - "Interested in iPhone" from buyer@example.com
🔍 analyzed  - Intent: inquiry, Sentiment: neutral, Urgency: medium
📤 sent      - "Re: Interested in iPhone" to buyer@example.com
```

## 🏗️ Technical Architecture

### Core Components

1. **AgentMailClient** - Official SDK wrapper for AgentMail API
2. **EmailService** - Queue management, polling, sending (Convex-backed)
3. **EmailProcessor** - AI analysis pipeline with GPT-4o-mini
4. **ResponseGenerator** - Context-aware response generation
5. **DatabaseClient** - Convex operations wrapper
6. **NewEmailOrchestrator** - System coordinator

### Database Schema (Convex)

**emailQueue** - Stores all emails with processing status
```typescript
{
  messageId: string          // AgentMail ID
  from: string               // Sender
  to: string                 // Recipient
  subject: string            // Subject line
  body: string               // Email content
  status: 'pending' | 'processing' | 'completed' | 'failed'
  metadata: {                // AI analysis
    intent?: string
    sentiment?: string
    urgency?: string
  }
}
```

**emailActivity** - Activity log for dashboard
```typescript
{
  type: 'received' | 'sent' | 'analyzed' | 'error'
  from: string
  to: string
  subject: string
  summary: string
  timestamp: number
  metadata?: any
}
```

## 🛠️ Development

### Commands

```bash
npm run type-check     # TypeScript type checking
npm run orchestrator   # Start email processor
npm run dev           # Start dashboard (from src/ui)
```

### Development Workflow

See **[DEVELOPMENT.md](./DEVELOPMENT.md)** for:
- Project structure walkthrough
- How to modify email processing
- Adding custom templates
- Database schema updates
- Testing guide
- Deployment instructions

## 📈 Key Metrics

Dashboard displays:
- **Total Emails**: All emails processed
- **Pending**: Awaiting processing
- **Processing**: Currently being analyzed
- **Completed**: Successfully processed with responses
- **Failed**: Errors (with retry logic)

## 📚 Documentation

- **[AGENTMAIL_INTEGRATION.md](./AGENTMAIL_INTEGRATION.md)** - Complete integration guide
  - Architecture deep-dive
  - Email processing pipeline
  - Convex schema reference
  - API documentation
  - Troubleshooting

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow
  - Setup instructions
  - Code structure
  - Making changes
  - Testing guide
  - Deployment

## 🔒 Security

- ✅ API keys in environment variables (never committed)
- ✅ Self-email loop prevention
- ✅ Webhook signature validation support
- ✅ Error handling with retry logic (max 3 attempts)
- ✅ Graceful shutdown handling

## 🚀 What's Special

### Database as Source of Truth

Unlike typical in-memory queues, this system uses **Convex as the single source of truth**:

✅ **Cross-Process Sync** - Multiple processes (orchestrator + dashboard) access same queue
✅ **Real-Time Updates** - Dashboard shows live data without polling
✅ **Persistent State** - Survives restarts
✅ **Scalable** - Can run multiple orchestrators

### Migration Highlights

We recently migrated from in-memory queue to Convex-backed queue:
- **Before**: `Map<string, EmailQueueItem>` - each process had separate queue
- **After**: Convex `emailQueue` table - shared across all processes
- **Result**: Dashboard stats now accurate, real-time sync achieved

## 🤝 Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for contribution guidelines.

## 📝 License

MIT License

## 🙏 Built With

- **[AgentMail](https://agentmail.to)** - Email infrastructure & SDK
- **[Convex](https://convex.dev)** - Real-time serverless database
- **[OpenAI](https://openai.com)** - GPT-4o-mini for AI analysis
- **[Next.js](https://nextjs.org)** - Dashboard framework
- **[TypeScript](https://typescriptlang.org)** - Type safety

---

**Version**: 2.0.0 (Database-backed queue)
**Last Updated**: 2025-01-11
