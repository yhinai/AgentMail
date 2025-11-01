#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "🔧 CONVEX SETUP SCRIPT"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Login to Convex
echo "Step 1: Login to Convex"
echo "───────────────────────────────────────────────────────────"
echo "This will open your browser to authenticate..."
echo ""
npx convex login

if [ $? -ne 0 ]; then
  echo "❌ Login failed. Please try again."
  exit 1
fi

echo ""
echo "✅ Login successful!"
echo ""

# Step 2: Initialize project
echo "Step 2: Initialize Convex project"
echo "───────────────────────────────────────────────────────────"
echo ""

# Check if already initialized
if [ -f "convex.json" ]; then
  echo "⚠️  convex.json already exists"
  read -p "Do you want to reinitialize? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping initialization..."
  else
    npx convex reinit
  fi
else
  npx convex init
fi

echo ""
echo "✅ Project initialized!"
echo ""

# Step 3: Start Convex dev server
echo "Step 3: Start Convex dev server"
echo "───────────────────────────────────────────────────────────"
echo "This will:"
echo "  - Generate the API functions"
echo "  - Give you a CONVEX_URL"
echo "  - Keep running to sync your schema"
echo ""
echo "⚠️  IMPORTANT: Keep this terminal open!"
echo "   Open a new terminal to continue working"
echo ""
echo "Starting in 3 seconds..."
sleep 3

npx convex dev
