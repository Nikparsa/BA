#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Stopping ACA services...${NC}"
echo ""

# Stop Backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}Backend process not found${NC}"
    fi
    rm -f logs/backend.pid
else
    echo -e "${YELLOW}Backend PID file not found${NC}"
fi

# Stop Runner
if [ -f "logs/runner.pid" ]; then
    RUNNER_PID=$(cat logs/runner.pid)
    if ps -p $RUNNER_PID > /dev/null 2>&1; then
        kill $RUNNER_PID
        echo -e "${GREEN}Runner stopped (PID: $RUNNER_PID)${NC}"
    else
        echo -e "${YELLOW}Runner process not found${NC}"
    fi
    rm -f logs/runner.pid
else
    echo -e "${YELLOW}Runner PID file not found${NC}"
fi

# Kill any remaining processes on ports
echo ""
echo -e "${CYAN}Checking for remaining processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}Cleaned up port 3000${NC}" || echo -e "${YELLOW}Port 3000 is free${NC}"
lsof -ti:5001 | xargs kill -9 2>/dev/null && echo -e "${GREEN}Cleaned up port 5001${NC}" || echo -e "${YELLOW}Port 5001 is free${NC}"

echo ""
echo -e "${GREEN}All services stopped!${NC}"

