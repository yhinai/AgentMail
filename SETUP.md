# ProfitPilot Setup Guide

Complete setup instructions for ProfitPilot.

## Step 1: Prerequisites

Ensure you have:
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher (or yarn/pnpm)
- Git
- A code editor (VS Code recommended)

## Step 2: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd profitpilot

# Install dependencies
npm install
```

## Step 3: Get API Keys

You'll need API keys for:

1. **AgentMail**
   - Sign up at [AgentMail](https://agentmail.com)
   - Get your API key from the dashboard

2. **OpenAI**
   - Sign up at [OpenAI](https://platform.openai.com)
   - Create an API key in your account settings
   - Ensure you have credits for GPT-4

3. **Browser-Use**
   - Sign up at [Browser-Use](https://browser-use.com)
   - Get your API key

4. **Hyperspell**
   - Sign up at [Hyperspell](https://hyperspell.com)
   - Get your API key and URL

5. **Perplexity**
   - Sign up at [Perplexity](https://www.perplexity.ai/api)
   - Get your API key

6. **Convex**
   - Sign up at [Convex](https://www.convex.dev)
   - Create a new project
   - Get your deployment URL

## Step 4: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your preferred editor
```

Fill in all the required values in `.env`:

```env
AGENTMAIL_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
BROWSER_USE_API_KEY=your_key_here
HYPERSPELL_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```

## Step 5: Set Up Convex

1. Install Convex CLI (if not already installed):
   ```bash
   npm install -g convex
   ```

2. Login to Convex:
   ```bash
   npx convex login
   ```

3. Initialize Convex in your project:
   ```bash
   npx convex dev
   ```

4. Create the schema files (you'll need to create `convex/schema.ts`):
   ```typescript
   import { defineSchema, defineTable } from "convex/server";
   import { v } from "convex/values";

   export default defineSchema({
     transactions: defineTable({
       buyerEmail: v.string(),
       product: v.string(),
       // ... other fields
     }),
     // ... other tables
   });
   ```

## Step 6: Verify Installation

```bash
# Check TypeScript compilation
npm run type-check

# Should show no errors
```

## Step 7: Run the Application

### Option A: Development Mode

**Terminal 1 - Dashboard:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Terminal 2 - Orchestrator:**
```bash
npm run orchestrator
```

### Option B: Demo Mode

```bash
npm run demo
```

This runs a complete demo scenario showing all features.

## Step 8: Test the System

1. **Test Email Processing:**
   - Send a test email to your configured inbox
   - Check that the system responds automatically

2. **Test Listing Creation:**
   - Create a test product
   - Verify listings are created on platforms

3. **Test Dashboard:**
   - Open the dashboard
   - Verify metrics are updating
   - Check activity feed

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify all API keys are correct in `.env`
   - Check API key permissions
   - Ensure you have credits/quota

2. **Build Errors**
   - Run `npm install` again
   - Clear `node_modules` and reinstall
   - Check Node.js version (must be 18+)

3. **Convex Connection Issues**
   - Verify `NEXT_PUBLIC_CONVEX_URL` is set correctly
   - Check Convex dashboard for project status
   - Ensure you're logged in with `npx convex login`

4. **TypeScript Errors**
   - Run `npm run type-check` to see all errors
   - Ensure all types are properly imported
   - Check `tsconfig.json` configuration

5. **Dashboard Not Loading**
   - Check that `npm run dev` is running
   - Verify port 3000 is not in use
   - Check browser console for errors

## Next Steps

- Read the [README.md](./README.md) for usage instructions
- Review the [PRD](./profitpilot_prd.md) for architecture details
- Customize demo scenarios in `src/demo/scenarios.ts`
- Modify email templates in `src/agents/emailAgent.ts`

## Support

For issues or questions:
- Check the troubleshooting section above
- Review code comments in source files
- Open an issue on GitHub

---

Happy selling with ProfitPilot! 🚀
