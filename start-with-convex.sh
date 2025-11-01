#!/bin/bash

# Start AgentMail with all necessary environment variables
export CONVEX_URL=https://giddy-tiger-756.convex.cloud
export NEXT_PUBLIC_CONVEX_URL=https://giddy-tiger-756.convex.cloud
export OPENAI_MODEL=gpt-4o-mini

# Load other vars from .env
export AGENTMAIL_API_KEY=am_f1ede7ea9008edfef52713cc8021f06405e0ba07635431cee0dcc3ccb735e4ac
export AGENTMAIL_API_URL=https://api.agentmail.to/v0
export OPENAI_API_KEY=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

echo "Starting AgentMail with full environment..."
echo "Convex URL: $CONVEX_URL"
echo "OpenAI Model: $OPENAI_MODEL"
echo ""

npx tsx start-demo.ts
