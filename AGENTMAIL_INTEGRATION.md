# AgentMail + Convex Integration Guide

Complete documentation for the AgentMail email automation system integrated with Convex real-time database.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Email Processing Pipeline](#email-processing-pipeline)
4. [Convex Database Schema](#convex-database-schema)
5. [API Reference](#api-reference)
6. [Setup & Deployment](#setup--deployment)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      AgentMail API                            │
│                 (https://api.agentmail.to/v0)                 │
└───────────────────────────┬──────────────────────────────────┘
                            │
                ┌───────────▼──────────┐
                │  AgentMailClient     │  SDK Wrapper
                │  (Official SDK)      │
                └───────────┬──────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
│ EmailService │    │   Convex    │    │  Next.js    │
│              │◄──►│  Database   │◄──►│  Dashboard  │
│ • Queue Mgmt │    │             │    │             │
│ • Polling    │    │ • emailQueue│    │ • Activity  │
│ • Events     │    │ • Activity  │    │ • Stats     │
└───────┬──────┘    └─────────────┘    └─────────────┘
        │
┌───────▼──────┐
│EmailProcessor│
│              │
│ • Analysis   │
│ • AI Response│
│ • Context    │
└──────────────┘
```

### Key Design Principles

1. **Database as Source of Truth**: Email queue stored in Convex, accessible by all processes
2. **Event-Driven Architecture**: EmailService emits events for processing
3. **Singleton Pattern**: Single EmailService instance per process
4. **Async/Await**: All database operations are asynchronous
5. **Real-Time Sync**: Convex provides instant updates across all clients

---

## System Components

### 1. AgentMailClient (`src/services/AgentMailClient.ts`)

**Purpose**: Official AgentMail SDK wrapper

**Key Methods**:
```typescript
// Inbox management
getOrCreateDefaultInbox(name: string): Promise<Inbox>
listInboxes(): Promise<Inbox[]>

// Message operations
sendMessage(inboxId, to, subject, body, html): Promise<Message>
replyToMessage(inboxId, messageId, body, html): Promise<Message>
listMessages(inboxId, limit): Promise<Message[]>

// Thread management
getThread(inboxId, threadId): Promise<Thread>
getThreadMessages(inboxId, threadId): Promise<Message[]>

// Webhooks
setupWebhook(callbackUrl: string): Promise<Webhook>
```

**Configuration**:
```env
AGENTMAIL_API_KEY=am_your_api_key_here
```

---

### 2. EmailService (`src/services/EmailService.ts`)

**Purpose**: High-level email operations with Convex database integration

**Key Features**:
- Queue management (backed by Convex)
- Email polling from AgentMail
- Event emission for processing
- Activity logging
- Status tracking

**Key Methods**:
```typescript
// Initialization
initialize(inboxName: string): Promise<Inbox>
setupWebhook(callbackUrl: string): Promise<void>

// Queue management (all use Convex)
queueEmail(email: EmailQueueItem): Promise<string>
getPendingEmails(limit: number): Promise<EmailQueueItem[]>
updateEmailStatus(id, status, error?, metadata?): Promise<void>

// Email operations
sendEmail(to, subject, body, html?): Promise<Message>
replyToThread(threadId, body, html?): Promise<Message>

// Polling
startPolling(intervalMs: number): void
pollForNewEmails(): Promise<void>

// Statistics
getQueueStats(): Promise<QueueStats>
getRecentActivity(limit: number): EmailActivity[]
```

**Events Emitted**:
```typescript
'email:queued'   // Email added to queue
'email:process'  // Email ready for processing
'email:sent'     // Email sent successfully
'email:status'   // Status updated
'activity:logged' // Activity logged
```

---

### 3. EmailProcessor (`src/services/EmailProcessor.ts`)

**Purpose**: AI-powered email analysis and response generation

**Processing Pipeline**:
```typescript
async processEmail(email: EmailQueueItem): ProcessedEmail {
  // 1. Mark as processing
  await this.emailService.updateEmailStatus(email.id, 'processing');

  // 2. Analyze with AI (GPT-4o-mini)
  const analysis = await this.analyzeEmail(email);

  // 3. Build context (buyer profile, market data, product info)
  const context = await this.buildContext(email, analysis);

  // 4. Generate response
  const response = await this.generateResponse(analysis, context, email);

  // 5. Send if auto-respond enabled
  if (this.autoRespond && response.shouldSend) {
    await this.sendResponse(email, response);
  }

  // 6. Mark as completed
  await this.emailService.updateEmailStatus(email.id, 'completed');
}
```

**Analysis Output**:
```typescript
interface EmailAnalysis {
  intent: 'inquiry' | 'offer' | 'negotiation' | 'closing' | 'complaint';
  product?: string;
  priceOffer?: number;
  urgency: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keyPoints: string[];
}
```

---

### 4. DatabaseClient (`src/database/client.ts`)

**Purpose**: Convex database operations for email queue and activity

**Key Methods**:
```typescript
// Email queue operations
queueEmail(emailData): Promise<string>
getPendingEmails(limit: number): Promise<EmailQueueItem[]>
updateEmailStatus(emailId, status, error?, metadata?): Promise<void>
getEmailByMessageId(messageId: string): Promise<EmailQueueItem>
getQueueStats(): Promise<QueueStats>

// Activity logging
logActivity(activity): Promise<void>
getRecentActivity(limit: number): Promise<EmailActivity[]>
```

**Configuration**:
```env
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

---

## Email Processing Pipeline

### 1. Email Reception

**Via Polling** (default):
```typescript
// Every 30 seconds (configurable)
startPolling(30000)
  ├─> Fetch latest messages from AgentMail
  ├─> Filter out self-emails
  ├─> Skip already seen messages
  └─> Queue new emails in Convex
```

**Via Webhook** (requires public URL):
```typescript
POST /api/webhooks/email
  ├─> Validate webhook signature
  ├─> Extract message data
  └─> Queue email in Convex
```

### 2. Email Queue Processing

```typescript
// Every 30 seconds (configurable)
processPendingEmails(limit: 5)
  ├─> Fetch pending emails from Convex
  ├─> For each email:
  │   ├─> Update status to 'processing'
  │   ├─> Analyze with GPT-4o-mini
  │   ├─> Build context
  │   ├─> Generate response
  │   ├─> Send if AUTO_RESPOND=true
  │   └─> Update status to 'completed'
  └─> Log all activities to Convex
```

### 3. Status Lifecycle

```
pending → processing → completed
                    └→ failed (retry up to 3x)
```

---

## Convex Database Schema

### Table: `emailQueue`

Stores all incoming and outgoing emails with processing status.

```typescript
defineTable({
  messageId: v.string(),          // AgentMail message ID
  threadId: v.optional(v.string()),  // Conversation thread
  from: v.string(),               // Sender email
  to: v.string(),                 // Recipient email
  subject: v.string(),            // Email subject
  body: v.string(),               // Email body (plain text)
  receivedAt: v.number(),         // Timestamp (ms)
  status: v.union(                // Processing status
    v.literal('pending'),
    v.literal('processing'),
    v.literal('completed'),
    v.literal('failed')
  ),
  priority: v.union(              // Priority level
    v.literal('low'),
    v.literal('medium'),
    v.literal('high')
  ),
  retryCount: v.number(),         // Number of retry attempts
  processedAt: v.optional(v.number()),  // Completion timestamp
  error: v.optional(v.string()),  // Error message if failed
  metadata: v.optional(v.object({  // AI analysis results
    intent: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    urgency: v.optional(v.string()),
  })),
})
.index('by_status', ['status'])
.index('by_message_id', ['messageId'])
.index('by_thread_id', ['threadId'])
```

**Indexes**:
- `by_status`: Fast lookup of pending/processing/completed emails
- `by_message_id`: Check if message already queued
- `by_thread_id`: Retrieve conversation history

### Table: `emailActivity`

Logs all email-related activities for the dashboard.

```typescript
defineTable({
  emailId: v.string(),            // Activity ID
  type: v.union(                  // Activity type
    v.literal('received'),
    v.literal('sent'),
    v.literal('analyzed'),
    v.literal('error')
  ),
  from: v.string(),               // Sender
  to: v.string(),                 // Recipient
  subject: v.string(),            // Email subject
  summary: v.string(),            // Human-readable summary
  timestamp: v.number(),          // When it happened (ms)
  metadata: v.optional(v.any()),  // Additional context
})
.index('by_timestamp', ['timestamp'])
```

**Activity Types**:
- `received`: Email arrived from AgentMail
- `sent`: Email sent via AgentMail
- `analyzed`: AI processing completed
- `error`: Processing failed

---

## API Reference

### Convex Functions

Located in `convex/emails.ts`:

#### Mutations

**`queueEmail`**
```typescript
args: {
  messageId: string
  threadId?: string
  from: string
  to: string
  subject: string
  body: string
  priority?: 'low' | 'medium' | 'high'
}
returns: emailId (Convex ID)
```

**`updateEmailStatus`**
```typescript
args: {
  emailId: Id<"emailQueue">
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  metadata?: {
    intent?: string
    sentiment?: string
    urgency?: string
  }
}
```

**`logActivity`**
```typescript
args: {
  emailId: string
  type: 'received' | 'sent' | 'analyzed' | 'error'
  from: string
  to: string
  subject: string
  summary: string
  metadata?: any
}
```

#### Queries

**`getPendingEmails`**
```typescript
args: {
  limit?: number  // Default: 10
}
returns: EmailQueueItem[]
```

**`getQueueStats`**
```typescript
args: {}
returns: {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}
```

**`getRecentActivity`**
```typescript
args: {
  limit?: number  // Default: 50
}
returns: EmailActivity[]
```

**`getByMessageId`**
```typescript
args: {
  messageId: string
}
returns: EmailQueueItem | null
```

---

## Setup & Deployment

### Prerequisites

- Node.js 18+
- AgentMail API key
- OpenAI API key (for GPT-4o-mini)
- Convex account

### Installation

```bash
# Install dependencies
npm install

# Install Convex CLI
npx convex login
```

### Configuration

**1. Environment Variables (.env)**
```env
# AgentMail
AGENTMAIL_API_KEY=am_your_api_key_here

# OpenAI
OPENAI_API_KEY=sk-proj-your_key_here
OPENAI_MODEL=gpt-4o-mini

# Convex
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Configuration
AUTO_RESPOND=true
EMAIL_POLL_INTERVAL=30
EMAIL_RESPONSE_DELAY=5
```

**2. Deploy Convex Functions**
```bash
npx convex dev --once
```

This creates:
- `convex/_generated/api.ts` - Type-safe API
- Deploys all functions to Convex cloud
- Generates database schema

**3. Start the System**

**Terminal 1: Orchestrator** (email processing)
```bash
npx tsx start-demo.ts
```

**Terminal 2: Dashboard** (UI)
```bash
cd src/ui && npm run dev
```

Open: http://localhost:3000

---

## Troubleshooting

### Email Stats Show Zero

**Problem**: Dashboard shows `{total: 0, pending: 0, completed: 0}`

**Solution**:
1. Verify Convex functions are deployed:
   ```bash
   npx convex dev --once
   ```

2. Check `getQueueStats` query exists:
   ```bash
   npx convex run emails:getQueueStats {}
   ```

3. Restart both processes

---

### Emails Not Processing

**Problem**: Emails queue but status stays 'pending'

**Checklist**:
- [ ] Is `npx tsx start-demo.ts` running?
- [ ] Is `AUTO_RESPOND=true` in .env?
- [ ] Is `EMAIL_POLL_INTERVAL` set (default 30)?
- [ ] Does OpenAI API key have credits?

**Debug**:
```bash
# Check logs
tail -f /tmp/orchestrator.log

# Should see:
# "📬 Processing X pending emails..."
# "🔄 Processing email: [subject]"
```

---

### Database Connection Errors

**Problem**: "Convex database client initialized" not appearing

**Solution**:
1. Verify `CONVEX_URL` in .env:
   ```bash
   grep CONVEX_URL .env
   ```

2. Should NOT be placeholder:
   ```
   CONVEX_URL=https://giddy-tiger-756.convex.cloud  ✅
   CONVEX_URL=your_convex_url_here                  ❌
   ```

3. Redeploy if needed:
   ```bash
   npx convex dev --once
   ```

---

### Self-Email Loop

**Problem**: System processing emails it sent

**Built-in Prevention**:
```typescript
// EmailService automatically skips self-emails
if (messagePreview.from === this.inbox.email ||
    messagePreview.from.includes(this.inbox.inbox_id)) {
  console.log(`⏭️  Skipping email from self`);
  continue;
}
```

---

## Performance & Scaling

### Current Limits

- **Email Processing**: 5 emails per 30s = 10 emails/min
- **API Rate Limits**: Governed by AgentMail/OpenAI quotas
- **Convex**: Unlimited reads, 1000 writes/sec

### Optimization Tips

1. **Increase Batch Size**:
   ```typescript
   processPendingEmails(10)  // Process 10 at once
   ```

2. **Reduce Polling Interval**:
   ```env
   EMAIL_POLL_INTERVAL=10  # Check every 10s
   ```

3. **Use Webhooks**:
   ```env
   WEBHOOK_URL=https://your-domain.com/api/webhooks/email
   ```
   Eliminates polling delay

---

## Monitoring & Analytics

### Dashboard Metrics

**Queue Statistics** (real-time):
```typescript
{
  total: 147,      // Total emails processed
  pending: 3,      // Awaiting processing
  processing: 1,   // Currently being processed
  completed: 141,  // Successfully processed
  failed: 2        // Failed (will retry)
}
```

**Activity Feed**:
- Last 50 activities
- Auto-refreshes every 3 seconds
- Filterable by type
- Shows metadata (intent, sentiment, urgency)

### Convex Dashboard

Access: https://dashboard.convex.dev

**Real-time Views**:
- `emailQueue` table - All queued emails
- `emailActivity` table - All logged activities
- Function logs - Debugging
- Performance metrics

---

## Advanced Features

### Custom Email Templates

Edit `src/services/ResponseGenerator.ts`:

```typescript
private getInquiryTemplate(context: ResponseContext): GeneratedResponse {
  return {
    subject: `Re: ${context.product}`,
    body: `Your custom template here...`,
    tone: 'friendly',
    strategy: 'Your strategy',
    shouldSend: true,
    reasoning: 'Why this template'
  };
}
```

### Buyer Profiling

Enable Hyperspell integration:
```env
HYPERSPELL_API_KEY=your_key_here
HYPERSPELL_API_URL=https://api.hyperspell.com/v1
```

### Market Intelligence

Enable Perplexity for pricing:
```env
PERPLEXITY_API_KEY=your_key_here
```

---

## Security Best Practices

1. **Never commit .env** - Already in .gitignore
2. **Validate webhook signatures** - Use `WEBHOOK_SECRET`
3. **Rate limit API calls** - Built into EmailService
4. **Sanitize email content** - Prevent XSS in dashboard
5. **Encrypt sensitive data** - Use Convex field-level encryption

---

## Further Reading

- [AgentMail SDK Docs](https://docs.agentmail.to)
- [Convex Documentation](https://docs.convex.dev)
- [OpenAI API Reference](https://platform.openai.com/docs)

---

**Last Updated**: 2025-01-11
**Version**: 2.0.0 (Database-backed queue)
