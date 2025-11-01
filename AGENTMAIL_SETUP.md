# AgentMail Integration Setup Guide

## 🎉 Quick Start Guide

This guide will help you set up and run the AgentMail integration for ProfitPilot's autonomous email handling system.

---

## 📋 Prerequisites

- **Node.js 18+** installed
- **AgentMail API key** (you have one!)
- **OpenAI API key** for GPT-4
- **Terminal/Command line** access

---

## 🚀 Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install UI dependencies
cd src/ui && npm install && cd ../..
```

---

## 🔑 Step 2: Configure Environment Variables

Your `.env` file is already configured with the AgentMail API credentials! The key settings are:

```bash
# AgentMail Configuration
AGENTMAIL_API_KEY=am_f1ede7ea9008edfef52713cc8021f06405e0ba07635431cee0dcc3ccb735e4ac
AGENTMAIL_API_URL=https://api.agentmail.to/v0  # ✅ Corrected!

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4

# Email Processing
AUTO_RESPOND=true  # Set to false for manual approval mode
EMAIL_POLL_INTERVAL=10  # Seconds between processing cycles
```

### ⚠️ Important URLs Fixed!

The correct AgentMail API base URL is:
- ✅ **`https://api.agentmail.to/v0`** (NOT `.com`, and version `v0` NOT `v1`)

---

## 🧪 Step 3: Test AgentMail Connection

Verify your API credentials are working:

```bash
npx tsx test-agentmail-final.ts
```

**Expected Output:**
```
🎉 AgentMail API is working correctly!
✅ Your API key is valid and the connection is established.

Found 1 Default Pod
Found 0 inboxes (will be created automatically)
```

---

## 🎬 Step 4: Run the Integration Demo

### Option A: Full Integration Demo (Recommended)

```bash
npx tsx demo-email-integration.ts
```

This will:
1. ✅ Initialize the email service
2. ✅ Create an inbox automatically
3. ✅ Simulate 3 test emails
4. ✅ Process them with AI
5. ✅ Generate and display responses
6. ✅ Keep running to receive real emails

**Expected Output:**
```
═══════════════════════════════════════════════════════════
🚀 AGENTMAIL INTEGRATION DEMO
═══════════════════════════════════════════════════════════

📧 Inbox ready: [your-generated-email]@agentmail.to

🧪 Simulating 3 incoming emails...
✅ Queued: Interested in your iPhone 13
✅ Queued: Offer for MacBook Pro
✅ Queued: Quick question about the headphones

🤖 Starting AI-powered email processing...
...
✅ Demo completed successfully!
```

### Option B: Start the UI Dashboard

```bash
# Terminal 1: Start the orchestrator
npx tsx demo-email-integration.ts

# Terminal 2: Start the UI
npm run dev
```

Then open: **http://localhost:3000**

You'll see:
- 📊 Real-time email activity
- 📬 Queue statistics
- 🔄 Processing status
- ✅ Completed emails

---

## 📧 Step 5: Send a Real Email

Once the demo is running, you'll get an inbox email like:

```
📧 Inbox ready: abc123@agentmail.to
```

**Send a test email to this address!**

Example email to send:
```
To: abc123@agentmail.to
Subject: Interested in your product
Body: Hi! I'm interested in the iPhone you have listed. Is it still available? What's your best price?
```

The system will:
1. 📬 Receive the email via webhook/polling
2. 🔍 Analyze it with GPT-4
3. 💡 Generate an intelligent response
4. 📤 Send the reply automatically

---

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    AgentMail API                         │
│              (https://api.agentmail.to/v0)              │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  AgentMailClient    │  Low-level API wrapper
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │   EmailService      │  Queue management
          │   - Queue emails    │  Event emitter
          │   - Send/Reply      │  Activity logging
          │   - Webhooks        │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │  EmailProcessor     │  AI orchestration
          │   - Analyze         │
          │   - Context         │
          │   - Generate        │
          │   - Send            │
          └──────────┬──────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐    ┌────▼─────┐   ┌────▼────┐
│Response │    │  Market  │   │ Context │
│Generator│    │  Agent   │   │  Store  │
│(GPT-4)  │    │(Market   │   │(Buyer   │
│         │    │ Data)    │   │Profiles)│
└─────────┘    └──────────┘   └─────────┘
```

### File Structure

```
src/
├── services/
│   ├── AgentMailClient.ts          # API wrapper
│   ├── EmailService.ts             # Queue & operations
│   ├── EmailServiceSingleton.ts    # Singleton pattern
│   ├── ResponseGenerator.ts        # AI responses
│   └── EmailProcessor.ts           # Main pipeline
├── workflows/
│   └── NewEmailOrchestrator.ts     # System coordinator
├── ui/
│   ├── pages/
│   │   └── api/
│   │       ├── webhooks/email.ts   # Webhook endpoint
│   │       └── email/activity.ts   # Activity API
│   └── components/
│       └── EmailActivityPanel.tsx  # UI component
└── agents/
    ├── marketAgent.ts              # Market intelligence
    └── ...
```

---

## 🎯 Features Implemented

### ✅ Core Email Integration
- [x] AgentMail API client with full CRUD operations
- [x] Inbox creation and management
- [x] Message sending and replying
- [x] Thread management
- [x] Webhook support for real-time notifications

### ✅ AI-Powered Processing
- [x] GPT-4 email analysis (intent, sentiment, urgency)
- [x] Intelligent response generation
- [x] Template-based fallbacks
- [x] Context-aware pricing negotiations

### ✅ Queue Management
- [x] In-memory email queue with priorities
- [x] Automatic retry logic (3 attempts)
- [x] Status tracking (pending/processing/completed/failed)
- [x] Error handling and logging

### ✅ Integration
- [x] Market intelligence (Perplexity)
- [x] Buyer profiling (Hyperspell)
- [x] Existing orchestrator integration
- [x] Real-time UI dashboard

### ✅ Production Features
- [x] Event-driven architecture
- [x] Configurable auto-respond mode
- [x] Activity logging
- [x] Queue statistics
- [x] Graceful shutdown

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AGENTMAIL_API_KEY` | Your AgentMail API key | - | Yes |
| `AGENTMAIL_API_URL` | API base URL | `https://api.agentmail.to/v0` | No |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | - | Yes |
| `OPENAI_MODEL` | Model to use | `gpt-4` | No |
| `AUTO_RESPOND` | Auto-send responses | `true` | No |
| `EMAIL_POLL_INTERVAL` | Polling interval (seconds) | `10` | No |
| `EMAIL_RESPONSE_DELAY` | Delay before sending (seconds) | `5` | No |
| `WEBHOOK_URL` | Public URL for webhooks | - | No |
| `WEBHOOK_SECRET` | Webhook validation secret | - | No |

### Auto-Respond Mode

```typescript
// Enable automatic responses (default)
AUTO_RESPOND=true

// Require manual approval for all responses
AUTO_RESPOND=false
```

When `AUTO_RESPOND=false`, responses are generated but not sent automatically. You can review and approve them via the UI.

---

## 🔍 Troubleshooting

### Issue: API Connection Fails

**Error:** `timeout of 5000ms exceeded`

**Solution:**
1. Check your API URL: Must be `https://api.agentmail.to/v0` (not `.com`)
2. Verify your API key is correct
3. Check your internet connection

### Issue: No Inbox Created

**Error:** `No default pod found`

**Solution:**
1. Your AgentMail account should have a default pod
2. Run `npx tsx test-agentmail-final.ts` to verify
3. Check the AgentMail dashboard

### Issue: OpenAI Errors

**Error:** `OpenAI API key not configured`

**Solution:**
1. Add `OPENAI_API_KEY` to your `.env` file
2. Ensure you have GPT-4 API access
3. Check your OpenAI account has credits

### Issue: Emails Not Processing

**Symptoms:** Emails queue but don't process

**Solution:**
1. Check `EMAIL_POLL_INTERVAL` is set (default: 10 seconds)
2. Look for errors in console output
3. Verify `AUTO_RESPOND` setting
4. Check OpenAI API is accessible

---

## 📊 Monitoring & Debugging

### View Queue Status

```typescript
const stats = orchestrator.getQueueStats();
console.log(stats);
// { total: 5, pending: 2, processing: 1, completed: 2, failed: 0 }
```

### View Activity Log

```typescript
const activities = orchestrator.getRecentActivity(10);
activities.forEach(activity => {
  console.log(`${activity.type}: ${activity.summary}`);
});
```

### Enable Debug Logging

```bash
LOG_LEVEL=debug npx tsx demo-email-integration.ts
```

---

## 🚀 Next Steps

### 1. Set Up Webhooks (Optional but Recommended)

For real-time email processing without polling:

1. Deploy to a server with a public URL
2. Set `WEBHOOK_URL=https://your-domain.com/api/webhooks/email`
3. The system will automatically register the webhook with AgentMail

### 2. Connect to Production Database

Replace the in-memory queue with Convex:

```bash
# Install Convex CLI
npm install -g convex

# Login and init
npx convex login
npx convex dev
```

### 3. Add More Email Templates

Edit `src/services/ResponseGenerator.ts` to add custom templates for your use case.

### 4. Customize AI Prompts

Modify the system prompt in `ResponseGenerator.ts` to match your brand voice and negotiation strategy.

---

## 📝 API Endpoints

### Webhook Endpoint
```
POST /api/webhooks/email
```
Receives AgentMail webhook events

### Activity Feed
```
GET /api/email/activity?limit=50
```
Returns recent email activity and queue stats

---

## 🎓 Example Use Cases

### 1. E-commerce Negotiation
```
Buyer: "I'll offer $50 for the headphones"
AI: Analyzes offer → Checks market data → Counters with $65
```

### 2. Product Inquiry
```
Buyer: "Is the iPhone still available?"
AI: Confirms availability → Provides details → Encourages offer
```

### 3. Closing Deal
```
Buyer: "I'll take it at your asking price"
AI: Accepts → Requests payment info → Marks listing as sold
```

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for errors
3. Test API connection with `test-agentmail-final.ts`
4. Check AgentMail documentation: https://docs.agentmail.to

---

## ✅ What's Working

- ✅ AgentMail API integration (tested and working!)
- ✅ Inbox creation and management
- ✅ Email sending and receiving
- ✅ AI-powered analysis and response generation
- ✅ Queue management with retry logic
- ✅ Real-time UI dashboard
- ✅ Webhook support (needs public URL)
- ✅ Market intelligence integration
- ✅ Buyer profiling system

---

## 🎉 You're All Set!

Run the demo and start receiving emails:

```bash
npx tsx demo-email-integration.ts
```

Happy selling! 🚀
