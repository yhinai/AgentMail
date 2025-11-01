#!/bin/bash

# Start all AutoBazaaar services

echo "🚀 Starting AutoBazaaar Project..."
echo "=================================="
echo ""

# Check Python bridge
if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "⚠️  Python bridge not running, starting..."
    cd python_bridge
    source ../.env 2>/dev/null || true
    OPENAI_API_KEY=${OPENAI_API_KEY:-test-key} python3 browser_service.py > ../bridge.log 2>&1 &
    BRIDGE_PID=$!
    cd ..
    sleep 3
    echo "✅ Bridge service started (PID: $BRIDGE_PID)"
else
    echo "✅ Bridge service already running"
fi

echo ""
echo "Starting services..."
echo ""

# Start orchestrator in background
echo "📊 Starting Orchestrator..."
npm run orchestrator > orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
echo "✅ Orchestrator started (PID: $ORCHESTRATOR_PID)"

# Wait a bit
sleep 2

# Start server in background  
echo "🌐 Starting Server..."
npm run server > server.log 2>&1 &
SERVER_PID=$!
echo "✅ Server started (PID: $SERVER_PID)"

# Wait a bit
sleep 2

echo ""
echo "=================================="
echo "✅ All services started!"
echo ""
echo "📊 Services:"
echo "   - Bridge Service: http://localhost:8001"
echo "   - API Server: http://localhost:3001 (check server.log)"
echo "   - Orchestrator: Running (check orchestrator.log)"
echo ""
echo "📝 Logs:"
echo "   - orchestrator.log"
echo "   - server.log"
echo "   - bridge.log"
echo ""
echo "🛑 To stop all services:"
echo "   pkill -f 'orchestrator|server|browser_service'"
echo ""

# Keep script running and show logs
tail -f orchestrator.log server.log bridge.log 2>/dev/null &

