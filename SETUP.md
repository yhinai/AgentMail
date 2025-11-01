# ProfitPilot Setup Guide

## Quick Start

### 1. Prerequisites

Ensure you have the following installed:
- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git

### 2. Installation Steps

```bash
# Clone or navigate to the project directory
cd profitpilot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
# At minimum, you need:
# - AGENTMAIL_API_KEY (required)
# - OPENAI_API_KEY (required)
# Others are optional for demo mode
```

### 3. Configuration

Edit `.env` file with your API keys:

```env
# Required
AGENTMAIL_API_KEY=your_agentmail_key
OPENAI_API_KEY=your_openai_key

# Optional (for full functionality)
BROWSER_USE_API_KEY=your_browser_use_key
HYPERSPELL_API_KEY=your_hyperspell_key
PERPLEXITY_API_KEY=your_perplexity_key

# Server configuration
PORT=3001
NODE_ENV=development
DEMO_MODE=false
```

### 4. Running the Application

#### Development Mode

**Terminal 1 - API Server:**
```bash
npm run dev
```

**Terminal 2 - UI Dashboard:**
```bash
npm run ui:dev
```

Open http://localhost:3000 in your browser.

#### Demo Mode

Run the complete demo scenario:

```bash
npm run demo
```

Or run a specific scenario:
```bash
npm run demo full_demo
npm run demo quick_demo
```

#### Production Build

```bash
# Build everything
npm run build
npm run ui:build

# Start server
npm start
```

## Verification

### Check API Server

Visit: http://localhost:3001/api/status

You should see:
```json
{
  "running": true,
  "metrics": { ... }
}
```

### Check Dashboard

Visit: http://localhost:3000

You should see the ProfitPilot dashboard with:
- Metrics panel
- Activity feed
- Transaction list
- Product list

## Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
npm install
```

### Issue: API server won't start

**Solutions:**
1. Check if port 3001 is already in use
2. Verify API keys in `.env`
3. Check logs for specific errors

### Issue: Dashboard shows "Disconnected"

**Solutions:**
1. Ensure API server is running on port 3001
2. Check browser console for WebSocket errors
3. Verify CORS settings (if needed)

### Issue: Demo mode not working

**Solutions:**
1. Set `DEMO_MODE=true` in `.env`
2. Ensure you have at least OpenAI API key set
3. Check demo logs in terminal

## Next Steps

1. **Test Email Processing**
   - Send a test email to your configured inbox
   - Watch the dashboard for email activity

2. **Add Products**
   - Use the API or demo to add products
   - Products will be automatically listed

3. **Monitor Activity**
   - Watch the real-time dashboard
   - Check metrics and activity logs

4. **Customize**
   - Edit email templates in `src/agents/emailTemplates.ts`
   - Adjust negotiation strategies in `src/memory/contextStore.ts`
   - Add new platforms in `src/agents/browserAgent.ts`

## Support

For help:
- Check README.md for detailed documentation
- Review API.md for API endpoints
- Check logs for error messages

