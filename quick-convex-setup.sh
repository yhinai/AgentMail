#!/bin/bash

echo "══════════════════════════════════════════════════════════"
echo "🚀 Quick Convex Setup for AgentMail"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "This will:"
echo "  1. Login to Convex (opens browser)"
echo "  2. Initialize your Convex project"
echo "  3. Start the dev server to get your CONVEX_URL"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Step 1: Login
echo ""
echo "Step 1: Logging in to Convex..."
echo "────────────────────────────────────────────────────────"
npx convex login

if [ $? -ne 0 ]; then
  echo "❌ Login failed. Please try again."
  exit 1
fi

echo ""
echo "✅ Login successful!"
echo ""

# Step 2: Initialize
echo "Step 2: Initializing Convex project..."
echo "────────────────────────────────────────────────────────"

if [ -f "convex.json" ]; then
  echo "⚠️  convex.json already exists. Skipping init."
else
  npx convex init

  if [ $? -ne 0 ]; then
    echo "❌ Init failed. Please try again."
    exit 1
  fi
fi

echo ""
echo "✅ Project initialized!"
echo ""

# Step 3: Instructions for dev server
echo "Step 3: Start Convex dev server"
echo "────────────────────────────────────────────────────────"
echo ""
echo "⚠️  IMPORTANT: You need to run this command in a SEPARATE terminal:"
echo ""
echo "    npx convex dev"
echo ""
echo "This command will:"
echo "  - Generate your API functions"
echo "  - Give you a CONVEX_URL (looks like: https://xxx.convex.cloud)"
echo "  - Must stay running!"
echo ""
echo "After you get the CONVEX_URL, update your .env file:"
echo ""
echo "  1. Copy the deployment URL from the convex dev output"
echo "  2. Edit .env and replace both CONVEX_URL values with it"
echo "  3. Restart your application"
echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅ Setup complete! Follow the instructions above."
echo "══════════════════════════════════════════════════════════"
