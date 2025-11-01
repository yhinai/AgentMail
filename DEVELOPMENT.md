# Development Guide

Complete setup and development guide for the AgentMail email automation system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Contributing](#contributing)

---

## Quick Start

### Prerequisites

- **Node.js 18+** (v20 recommended)
- **npm 9+**
- **Git**
- **VS Code** (recommended)

### API Keys Required

| Service | Required | Purpose |
|---------|----------|---------|
| AgentMail | ✅ Yes | Email automation |
| OpenAI | ✅ Yes | AI analysis (GPT-4o-mini) |
| Convex | ✅ Yes | Real-time database |
| Perplexity | ⚪ Optional | Market intelligence |
| Hyperspell | ⚪ Optional | Buyer memory |
| Browser-Use | ⚪ Optional | Listing automation |

### Installation (5 minutes)

```bash
# 1. Clone the repository
git clone <repository-url>
cd AgentMail

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env with your API keys
nano .env  # or use your editor

# 5. Login to Convex
npx convex login

# 6. Deploy Convex functions
npx convex dev --once

# 7. Start the system
npm run orchestrator  # Terminal 1
npm run dev           # Terminal 2

# 8. Open dashboard
open http://localhost:3000
```

---

## Project Structure

```
AgentMail/
├── convex/                    # Convex serverless functions
│   ├── schema.ts              # Database schema
│   ├── emails.ts              # Email queue functions
│   ├── clearOldActivity.ts    # Cleanup cron job
│   └── _generated/            # Auto-generated API types
│
├── src/
│   ├── agents/                # AI agents
│   │   ├── browserAgent.ts    # Browser automation
│   │   └── marketAgent.ts     # Market analysis
│   │
│   ├── database/              # Database layer
│   │   ├── client.ts          # Convex client wrapper
│   │   └── models.ts          # Type definitions
│   │
│   ├── memory/                # Context management
│   │   └── contextStore.ts    # Hyperspell integration
│   │
│   ├── services/              # Core services
│   │   ├── AgentMailClient.ts # AgentMail SDK wrapper
│   │   ├── EmailService.ts    # Email queue management
│   │   ├── EmailProcessor.ts  # AI processing pipeline
│   │   └── ResponseGenerator.ts # AI response generation
│   │
│   ├── workflows/             # Orchestration
│   │   └── NewEmailOrchestrator.ts # Main coordinator
│   │
│   ├── ui/                    # Next.js dashboard
│   │   ├── pages/
│   │   │   ├── index.tsx      # Main dashboard
│   │   │   └── api/
│   │   │       ├── email/activity.ts  # Activity API
│   │   │       └── webhooks/email.ts  # Webhook handler
│   │   └── components/
│   │       └── EmailActivityPanel.tsx # Activity display
│   │
│   └── types/
│       └── index.ts           # TypeScript types
│
├── start-demo.ts              # Entry point
├── package.json
├── tsconfig.json
├── .env                       # Environment config (git-ignored)
└── README.md
```

### Key Files Explained

**Entry Points**:
- `start-demo.ts` - Starts orchestrator (email processing)
- `src/ui/pages/index.tsx` - Dashboard UI

**Core Logic**:
- `EmailService` - Queue, polling, sending
- `EmailProcessor` - AI analysis & response
- `ResponseGenerator` - GPT-4o-mini integration
- `NewEmailOrchestrator` - Coordinates everything

**Database**:
- `convex/schema.ts` - Database structure
- `convex/emails.ts` - CRUD operations
- `src/database/client.ts` - TypeScript wrapper

---

## Development Workflow

### Running Locally

#### Terminal 1: Convex Dev Server (optional)

For schema changes and live updates:

```bash
npx convex dev
```

Keep running. Any changes to `convex/*.ts` auto-deploy.

#### Terminal 2: Orchestrator

Email processing service:

```bash
npm run orchestrator
```

Or directly:

```bash
npx tsx start-demo.ts
```

Logs:
- `📧 Inbox ready: [email]` - Service initialized
- `📬 Email queued: [subject]` - New email received
- `🔄 Processing email: [subject]` - AI processing
- `✅ Email completed` - Finished

#### Terminal 3: Dashboard

UI server:

```bash
npm run dev
```

Or:

```bash
cd src/ui && npm run dev
```

Open: http://localhost:3000

### Making Changes

#### 1. Modify Email Processing

**File**: `src/services/EmailProcessor.ts`

Example - Add new email intent:

```typescript
// 1. Update EmailAnalysis interface
interface EmailAnalysis {
  intent: 'inquiry' | 'offer' | 'negotiation' | 'closing' | 'complaint' | 'spam';  // Added 'spam'
  // ...
}

// 2. Update analysis prompt
const prompt = `Analyze this email and extract structured information:
...
Intent: inquiry, offer, negotiation, closing, complaint, or spam  // Added spam
...`;

// 3. Add handler
if (analysis.intent === 'spam') {
  // Auto-delete or mark as spam
}
```

#### 2. Add Custom Email Template

**File**: `src/services/ResponseGenerator.ts`

```typescript
// Add new template method
private getCustomTemplate(context: ResponseContext): GeneratedResponse {
  return {
    subject: `Custom Subject`,
    body: `Your template body...`,
    tone: 'professional',
    strategy: 'Your strategy',
    shouldSend: true,
    reasoning: 'Why this template'
  };
}

// Use it in generateTemplateResponse
generateTemplateResponse(analysis: EmailAnalysis, context: ResponseContext) {
  const templates = {
    // ...
    custom: this.getCustomTemplate(context),
  };
  return templates[analysis.intent] || templates.other;
}
```

#### 3. Update Database Schema

**File**: `convex/schema.ts`

Example - Add field to emailQueue:

```typescript
emailQueue: defineTable({
  // ... existing fields
  aiModel: v.optional(v.string()),  // NEW: Track which AI model used
})
```

**Deploy schema change**:
```bash
npx convex dev --once
```

**Update TypeScript types**:
Types auto-regenerate in `convex/_generated/`

#### 4. Add New Convex Function

**File**: `convex/emails.ts`

```typescript
export const getEmailsByIntent = query({
  args: {
    intent: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query('emailQueue')
      .filter((q) => q.eq(q.field('metadata.intent'), args.intent))
      .take(args.limit || 10);

    return emails;
  },
});
```

**Use in TypeScript**:
```typescript
const inquiries = await db.getEmailsByIntent('inquiry', 20);
```

---

## Testing

### Manual Testing

#### 1. Send Test Email

Get your inbox from logs:
```bash
grep "Inbox ready" /tmp/orchestrator.log
```

Send email to that address.

#### 2. Verify in Dashboard

Open http://localhost:3000

Check:
- ✅ Email appears in activity feed
- ✅ Status changes: received → analyzed → sent
- ✅ Metadata shows intent/sentiment
- ✅ Queue stats update

#### 3. Check Convex Dashboard

https://dashboard.convex.dev

Verify:
- `emailQueue` table has new entry
- `emailActivity` table has 3 entries (received, analyzed, sent)
- Status updated to 'completed'

### Integration Testing

**Test Script**: Create `test-integration.ts`

```typescript
import { EmailService } from './src/services/EmailService';
import { EmailProcessor } from './src/services/EmailProcessor';

async function test() {
  const emailService = new EmailService();
  await emailService.initialize('Test Inbox');

  const processor = new EmailProcessor(emailService);

  // Queue test email
  const emailId = await emailService.queueEmail({
    messageId: 'test-123',
    from: 'test@example.com',
    to: 'inbox@agentmail.to',
    subject: 'Test Email',
    body: 'Is the iPhone still available?',
    receivedAt: new Date(),
    priority: 'medium',
  });

  console.log('✅ Queued:', emailId);

  // Process it
  const emails = await emailService.getPendingEmails(1);
  if (emails.length > 0) {
    const result = await processor.processEmail(emails[0]);
    console.log('✅ Processed:', result.analysis.intent);
  }
}

test();
```

Run:
```bash
npx tsx test-integration.ts
```

### Type Checking

```bash
npm run type-check
```

Checks all TypeScript files for type errors.

---

## Deployment

### Environment Setup

**Production .env**:
```env
# AgentMail
AGENTMAIL_API_KEY=am_production_key_here

# OpenAI
OPENAI_API_KEY=sk-production_key_here
OPENAI_MODEL=gpt-4o-mini

# Convex (production deployment)
CONVEX_URL=https://production-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://production-deployment.convex.cloud

# Configuration
AUTO_RESPOND=true
EMAIL_POLL_INTERVAL=30
WEBHOOK_URL=https://your-domain.com/api/webhooks/email
WEBHOOK_SECRET=your_webhook_secret_here
```

### Convex Production Deployment

```bash
# Deploy to production
npx convex deploy --prod

# Get production URL
npx convex deployment info --prod
```

Update .env with production URL.

### Hosting Options

#### Option 1: Docker

**Dockerfile**:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t agentmail .
docker run -p 3000:3000 --env-file .env agentmail
```

#### Option 2: PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start orchestrator
pm2 start npx --name "orchestrator" -- tsx start-demo.ts

# Start dashboard
pm2 start npm --name "dashboard" -- run dev

# Save process list
pm2 save

# Auto-restart on system reboot
pm2 startup
```

#### Option 3: Railway/Render/Vercel

**Railway.app**:
1. Connect GitHub repo
2. Add environment variables
3. Deploy
4. Get public URL for webhooks

**Vercel** (dashboard only):
```bash
cd src/ui
vercel deploy
```

### Webhook Setup

1. Deploy to server with public URL
2. Set webhook URL in .env:
   ```env
   WEBHOOK_URL=https://your-domain.com/api/webhooks/email
   ```

3. Webhook auto-registers on startup

4. Verify in logs:
   ```
   ✅ Webhook configured: https://your-domain.com/api/webhooks/email
   ```

---

## Contributing

### Code Style

- **Formatting**: Prettier (auto-format on save)
- **Linting**: ESLint
- **Types**: Strict TypeScript

### Commit Messages

Follow conventional commits:

```
feat: Add spam detection to email processor
fix: Prevent duplicate email queuing
docs: Update API documentation
refactor: Migrate queue to Convex database
```

### Pull Request Process

1. Create feature branch:
   ```bash
   git checkout -b feature/spam-detection
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: Add spam detection"
   ```

3. Push and create PR:
   ```bash
   git push origin feature/spam-detection
   ```

4. Wait for review

### Development Guidelines

1. **Always await async functions**:
   ```typescript
   ✅ await emailService.queueEmail(email);
   ❌ emailService.queueEmail(email);  // Missing await!
   ```

2. **Use database as source of truth**:
   ```typescript
   ✅ const emails = await db.getPendingEmails(10);
   ❌ const emails = this.inMemoryQueue.get();  // Don't use in-memory
   ```

3. **Emit events for side effects**:
   ```typescript
   this.emailService.updateEmailStatus(id, 'completed');
   this.emit('email:completed', email);  // Other modules can react
   ```

4. **Log important actions**:
   ```typescript
   console.log(`📬 Email queued: ${email.subject}`);
   console.log(`✅ Processing completed`);
   console.error(`❌ Failed:`, error.message);
   ```

5. **Handle errors gracefully**:
   ```typescript
   try {
     await processEmail(email);
   } catch (error) {
     await emailService.updateEmailStatus(id, 'failed', error.message);
     // Don't let one email crash the system
   }
   ```

---

## Debugging

### Enable Debug Logs

```env
LOG_LEVEL=debug
```

### Common Issues

**"Convex database client initialized" not appearing**:
```bash
# Check CONVEX_URL
grep CONVEX_URL .env

# Should be real URL, not placeholder
# Redeploy if needed
npx convex dev --once
```

**Emails not processing**:
```bash
# Check orchestrator is running
ps aux | grep tsx

# Check pending count
curl http://localhost:3000/api/email/activity | jq '.stats.pending'

# Should be 0 or decrease over time
```

**Dashboard not updating**:
```bash
# Check Convex URL in UI
cd src/ui && cat .env.local

# Should have NEXT_PUBLIC_CONVEX_URL

# Restart dashboard
pkill -f "next dev"
npm run dev
```

### Log Files

- Orchestrator: `/tmp/orchestrator.log` (if using background mode)
- Dashboard: Terminal output
- Convex: https://dashboard.convex.dev (Functions > Logs)

---

## FAQ

**Q: Can I use a different AI model?**

A: Yes, edit `src/services/ResponseGenerator.ts`:
```typescript
this.model = 'gpt-4-turbo'  // Or any OpenAI model
```

**Q: How do I change email processing speed?**

A: Edit .env:
```env
EMAIL_POLL_INTERVAL=10  # Check for emails every 10s
```

And in `NewEmailOrchestrator.ts`:
```typescript
this.startEmailProcessing();  // Line 74
// Change intervalMs in line 158
```

**Q: Can I process emails from multiple inboxes?**

A: Yes, create multiple EmailService instances with different inbox IDs.

**Q: How do I backup my data?**

A: Convex handles backups automatically. Export via dashboard if needed.

---

## Resources

- [AgentMail Integration Guide](./AGENTMAIL_INTEGRATION.md)
- [Convex Documentation](https://docs.convex.dev)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Happy coding!** 🚀
