#!/bin/bash

echo "🚀 Starting All Services"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Start Browser Service (Python Bridge)
echo "1️⃣  Starting Browser Service (Port 8001)..."
cd python_bridge
python3 browser_service.py > ../logs/browser_service.log 2>&1 &
BROWSER_PID=$!
cd ..
echo -e "${GREEN}✓ Browser Service started (PID: $BROWSER_PID)${NC}"
sleep 2

# Check if browser service is healthy
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Browser Service is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Browser Service may still be starting...${NC}"
fi
echo ""

# Start Backend/Orchestrator
echo "2️⃣  Starting Backend/Orchestrator..."
if [ -f "start-demo.ts" ]; then
    npx ts-node start-demo.ts > logs/orchestrator.log 2>&1 &
    ORCHESTRATOR_PID=$!
    echo -e "${GREEN}✓ Orchestrator started (PID: $ORCHESTRATOR_PID)${NC}"
elif [ -f "src/server/index.ts" ]; then
    npx ts-node src/server/index.ts > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ No backend/orchestrator file found, skipping...${NC}"
fi
sleep 2
echo ""

# Start Frontend (Next.js)
echo "3️⃣  Starting Frontend (Port 3000)..."
cd src/ui
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status"
echo "================="

# Check Browser Service
echo -n "Browser Service (8001): "
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not responding${NC}"
fi

# Check Frontend
echo -n "Frontend (3000):        "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not responding${NC}"
fi

echo ""
echo "🎉 All services started!"
echo ""
echo "📝 Access Points:"
echo "  - Frontend:        http://localhost:3000"
echo "  - Browser Service: http://localhost:8001"
echo ""
echo "📋 Logs:"
echo "  - Browser Service: logs/browser_service.log"
echo "  - Frontend:        logs/frontend.log"
if [ ! -z "$ORCHESTRATOR_PID" ]; then
    echo "  - Orchestrator:    logs/orchestrator.log"
fi
if [ ! -z "$BACKEND_PID" ]; then
    echo "  - Backend:         logs/backend.log"
fi
echo ""
echo "🛑 To stop all services, run: ./stop_all_services.sh"
echo ""

# Save PIDs for later cleanup
echo "$BROWSER_PID" > logs/browser.pid
echo "$FRONTEND_PID" > logs/frontend.pid
[ ! -z "$ORCHESTRATOR_PID" ] && echo "$ORCHESTRATOR_PID" > logs/orchestrator.pid
[ ! -z "$BACKEND_PID" ] && echo "$BACKEND_PID" > logs/backend.pid

# Keep script running and show logs
echo "📡 Monitoring services (Ctrl+C to stop)..."
echo ""
tail -f logs/*.log
