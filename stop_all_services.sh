#!/bin/bash

echo "🛑 Stopping All Services"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Stop services by PID files
if [ -f "logs/browser.pid" ]; then
    PID=$(cat logs/browser.pid)
    echo -n "Stopping Browser Service (PID: $PID)... "
    kill $PID 2>/dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
    rm logs/browser.pid
fi

if [ -f "logs/frontend.pid" ]; then
    PID=$(cat logs/frontend.pid)
    echo -n "Stopping Frontend (PID: $PID)... "
    kill $PID 2>/dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
    rm logs/frontend.pid
fi

if [ -f "logs/orchestrator.pid" ]; then
    PID=$(cat logs/orchestrator.pid)
    echo -n "Stopping Orchestrator (PID: $PID)... "
    kill $PID 2>/dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
    rm logs/orchestrator.pid
fi

if [ -f "logs/backend.pid" ]; then
    PID=$(cat logs/backend.pid)
    echo -n "Stopping Backend (PID: $PID)... "
    kill $PID 2>/dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"
    rm logs/backend.pid
fi

# Force kill any remaining processes on our ports
echo ""
echo "Cleaning up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
