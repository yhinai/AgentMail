#!/bin/bash

# Simple run script - kills existing processes and starts everything
echo "🚀 Starting AgentMail..."

# Kill processes on our ports
echo "🧹 Cleaning up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
sleep 1

# Start browser service
echo "📸 Starting browser service (port 8001)..."
cd python_bridge
python3 browser_service.py &
BROWSER_PID=$!
cd ..

# Start orchestrator
echo "📧 Starting orchestrator..."
npx ts-node start-demo.ts &
ORCHESTRATOR_PID=$!

# Start frontend
echo "🌐 Starting frontend (port 3000)..."
cd src/ui
npm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for services to start
sleep 5

echo ""
echo "✅ All services started!"
echo "   Frontend:        http://localhost:3000"
echo "   Browser Service: http://localhost:8001"
echo ""
echo "📋 Showing logs (Ctrl+C to stop)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap Ctrl+C to kill all processes
trap "echo ''; echo '🛑 Stopping...'; kill $BROWSER_PID $ORCHESTRATOR_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Show logs in real-time
tail -f src/ui/.next/trace 2>/dev/null &
wait
