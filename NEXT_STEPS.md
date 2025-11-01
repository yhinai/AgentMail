# Next Steps: Complete Convex Setup

## What You Need to Do

You need to complete the Convex setup in your **own terminal** (not Claude Code's terminal) because it requires interactive authentication.

---

## Quick Setup (3 steps)

### 1. Open a new terminal and navigate to the project

```bash
cd ~/YC-hackathon/AgentMail
```

### 2. Run the setup script

```bash
./quick-convex-setup.sh
```

This will:
- Open your browser to log in to Convex
- Initialize your Convex project
- Give you instructions for the dev server

### 3. In a SEPARATE terminal, start Convex dev server

```bash
cd ~/YC-hackathon/AgentMail
npx convex dev
```

**IMPORTANT:** Keep this terminal open! You'll see output like:

```
┌─────────────────────────────────────────────────┐
│  Convex Dev Server                               │
│                                                  │
│  Deployment: https://grateful-turtle-123.convex.cloud │
│  Dashboard:  https://dashboard.convex.dev/...   │
└─────────────────────────────────────────────────┘

✔ Deployed!
```

**Copy the deployment URL** (the `https://...convex.cloud` part)

---

## 4. Update your .env file

Open `.env` and replace:

```bash
CONVEX_URL=your_convex_url_here
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```

With your actual URL (example):

```bash
CONVEX_URL=https://grateful-turtle-123.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://grateful-turtle-123.convex.cloud
```

---

## 5. Restart your application

Stop the current services (Ctrl+C if running) and restart:

**Terminal 1:** (Keep Convex dev running!)
```bash
npx convex dev
```

**Terminal 2:** Email service
```bash
npx tsx start-demo.ts
```

**Terminal 3:** UI Dashboard
```bash
cd src/ui && npm run dev
```

---

## 6. Verify it works

Open http://localhost:3000

You should now see:
- ✅ Real-time email activity in the dashboard
- ✅ Queue statistics updating
- ✅ Data persisting across restarts

---

## Why This Is Needed

Currently, your system is running in **mock/in-memory mode**:
- Email service stores data in memory
- UI dashboard can't see the email service's data
- No persistence across restarts

With Convex:
- ✅ Real database for persistence
- ✅ Real-time sync between services
- ✅ Dashboard shows live email activity
- ✅ Data survives restarts

---

## Troubleshooting

### If login fails:
```bash
rm -rf ~/.convex
npx convex login
```

### If you see "convex.json already exists":
Just skip to step 3 (start dev server)

### If Node version error:
Make sure you're using Node v20:
```bash
node --version  # Should show v20.19.5
```

If not:
```bash
nvm use 20
```

---

## Current Status

✅ Node.js v20 installed and set as default
✅ AgentMail integration working
✅ Email processing pipeline complete
✅ UI dashboard running at http://localhost:3000
⏳ **Next:** Complete Convex setup to enable real-time database

---

## Questions?

- Full details: See `CONVEX_SETUP.md`
- Quick help: Run `./quick-convex-setup.sh`
