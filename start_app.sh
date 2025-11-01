#!/bin/bash

# Start AgentMail/AutoBazaaar Application with Browser-Use Integration

echo "🚀 Starting AgentMail/AutoBazaaar Application..."
echo ""

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Python virtual environment not found. Creating one..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

# Start Python bridge in background
echo "1️⃣  Starting Browser-Use Python Bridge..."
./start_browser_bridge.sh &
BRIDGE_PID=$!
sleep 3

# Check if bridge is running
if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "❌ Failed to start Python bridge"
    exit 1
fi
echo "✅ Python bridge running on http://localhost:8001"
echo ""

# Start the main Node.js application
echo "2️⃣  Starting Main Application..."
echo ""
echo "Choose an option:"
echo "  1) Run orchestrator (npm run orchestrator)"
echo "  2) Run server (npm run server)"
echo "  3) Run UI dev server (npm run dev)"
echo "  4) Run demo (npm run demo)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "Starting orchestrator..."
        npm run orchestrator
        ;;
    2)
        echo "Starting server..."
        npm run server
        ;;
    3)
        echo "Starting UI dev server..."
        npm run dev
        ;;
    4)
        echo "Starting demo..."
        npm run demo
        ;;
    *)
        echo "Invalid choice. Starting orchestrator by default..."
        npm run orchestrator
        ;;
esac

# Cleanup on exit
trap "echo 'Stopping services...'; kill $BRIDGE_PID 2>/dev/null; exit" INT TERM
