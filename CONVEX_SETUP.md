# Convex Database Setup Guide

## 🎯 Goal
Set up Convex so your dashboard can show real-time email data from the AgentMail integration.

---

## 🚀 Quick Setup (5 minutes)

### Option 1: Automated Script

Run the setup script:
```bash
./setup-convex.sh
```

### Option 2: Manual Setup (Recommended for understanding)

Follow these steps:

---

## 📋 Step-by-Step Manual Setup

### Step 1: Login to Convex (1 min)

```bash
npx convex login
```

**What happens:**
- Opens your browser
- Asks you to sign in (use GitHub, Google, or email)
- Authenticates your CLI

**Expected output:**
```
✔ Saved credentials to ~/.convex/config.json
```

---

### Step 2: Initialize Convex Project (1 min)

```bash
npx convex init
```

**What it does:**
- Creates `convex.json` config file
- Sets up your project
- Links to Convex cloud

**Prompts you'll see:**
```
? What would you like to name your Convex project?
> AgentMail

? Which team should own this project?
> [Your username]

✔ Created new project AgentMail
```

**Expected output:**
```
✔ Project configured in convex.json
```

---

### Step 3: Start Convex Dev Server (Ongoing)

```bash
npx convex dev
```

**What it does:**
- Starts the development server
- Generates API functions from your schema
- Gives you a CONVEX_URL
- Syncs schema changes in real-time

**Expected output:**
```
┌─────────────────────────────────────────────────┐
│  Convex Dev Server                               │
│                                                  │
│  Deployment: https://grateful-turtle-123.convex.cloud │
│  Dashboard:  https://dashboard.convex.dev/...   │
└─────────────────────────────────────────────────┘

✔ Deployed!
✔ Generated API: convex/_generated/api.ts
```

**⚠️ IMPORTANT:**
- **Keep this terminal open!**
- The dev server must stay running
- Open a **new terminal** for the next steps

---

### Step 4: Copy Your Convex URL (30 seconds)

From the `npx convex dev` output, copy the deployment URL.

It looks like:
```
https://grateful-turtle-123.convex.cloud
```

---

### Step 5: Update .env File (30 seconds)

Open `.env` and update these lines:

```bash
# Replace this:
CONVEX_URL=your_convex_url_here
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here

# With your actual URL:
CONVEX_URL=https://grateful-turtle-123.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://grateful-turtle-123.convex.cloud
```

**Save the file!**

---

### Step 6: Verify Schema Deployed (30 seconds)

Check that your schema was deployed:

```bash
# In a NEW terminal (keep convex dev running!)
ls convex/_generated/
```

**Expected files:**
```
api.d.ts
api.js
dataModel.d.ts
server.d.ts
server.js
```

If you see these files, ✅ schema is deployed!

---

### Step 7: Start Your Application (1 min)

**Terminal 2** (keep Convex dev running in Terminal 1):

```bash
# Start the email service + UI
npx tsx start-demo.ts &
cd src/ui && npm run dev
```

**OR** start them separately:

```bash
# Terminal 2: Email service
npx tsx start-demo.ts

# Terminal 3: UI Dashboard
cd src/ui && npm run dev
```

---

### Step 8: Open Dashboard (10 seconds)

Open your browser:
```
http://localhost:3000
```

You should now see:
- ✅ Email Activity Panel (real-time)
- ✅ Queue Statistics
- ✅ Metrics
- ✅ Live data updates every 3 seconds

---

## 🎉 Success Checklist

After setup, verify:

- [ ] `convex.json` file exists
- [ ] `convex/_generated/api.js` exists
- [ ] `.env` has real CONVEX_URL (not placeholder)
- [ ] `npx convex dev` is running (Terminal 1)
- [ ] Email service is running
- [ ] UI dashboard shows data at http://localhost:3000

---

## 🔧 Troubleshooting

### Issue: "convex login" fails

**Solution:**
```bash
# Clear cache and try again
rm -rf ~/.convex
npx convex login
```

---

### Issue: "Project already exists"

**Solution:**
```bash
# Reinitialize
npx convex reinit
```

---

### Issue: No _generated folder

**Solution:**
```bash
# Make sure dev server is running
npx convex dev

# Wait for "✔ Deployed!" message
# The _generated folder should appear
```

---

### Issue: Dashboard still shows "No emails"

**Checklist:**
1. ✅ Is `npx convex dev` running?
2. ✅ Is `.env` updated with real CONVEX_URL?
3. ✅ Did you restart the application after updating .env?
4. ✅ Are there actually emails in the system?

**Test:**
```bash
# Send a test email
npx tsx test-real-email.ts

# Then check dashboard
```

---

## 📊 What Data Will Show

Once Convex is set up, your dashboard will show:

### Email Activity Panel
- 📬 Received emails
- 📤 Sent emails
- 🔍 Analyzed emails
- ❌ Error emails

### Queue Statistics
- Pending count
- Processing count
- Completed count
- Failed count

### Metrics
- Total emails processed
- Conversion rate
- Average response time

---

## 🎯 Next Steps

After Convex is working:

1. **Send test emails** to `longweather398@agentmail.to`
2. **Watch them appear** in the dashboard
3. **See real-time processing**
4. **View generated responses**

---

## 💡 Tips

**Keep Convex Dev Running:**
- Don't close the `npx convex dev` terminal
- It watches for schema changes
- It keeps your data in sync

**View Convex Dashboard:**
- Go to https://dashboard.convex.dev
- See your tables, data, and logs
- Debug issues in real-time

**Schema Changes:**
- Edit `convex/schema.ts`
- Convex dev automatically redeploys
- No need to restart!

---

## ⚡ Quick Reference

```bash
# Login
npx convex login

# Initialize
npx convex init

# Start dev server (keep running!)
npx convex dev

# In another terminal - start app
npx tsx start-demo.ts
cd src/ui && npm run dev

# Open dashboard
open http://localhost:3000
```

---

## 🆘 Still Having Issues?

Check the Convex logs:
```bash
# Terminal with convex dev running will show:
# - Schema validation errors
# - Function errors
# - Deployment status
```

Check your app logs:
```bash
# Look for "Convex database client initialized"
# Should NOT see "Using mock/in-memory mode"
```

---

## ✅ You're Done!

Once you see data in the dashboard, Convex is working!

Your AgentMail integration now has:
- ✅ Real-time database
- ✅ Persistent storage
- ✅ Live dashboard updates
- ✅ Full email history

Happy building! 🚀
