#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}ACA Server Status Check${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}Checking running processes...${NC}"
echo ""

if pgrep -f "node src/index.js" > /dev/null; then
    BACKEND_PID=$(pgrep -f "node src/index.js")
    echo -e "${GREEN}✓ Backend is running (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend is NOT running${NC}"
fi

if pgrep -f "python run.py" > /dev/null; then
    RUNNER_PID=$(pgrep -f "python run.py")
    echo -e "${GREEN}✓ Runner is running (PID: $RUNNER_PID)${NC}"
else
    echo -e "${RED}✗ Runner is NOT running${NC}"
fi

echo ""
echo -e "${YELLOW}Checking ports...${NC}"
echo ""

if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo -e "${GREEN}✓ Port 3000 (Backend) is open${NC}"
else
    echo -e "${RED}✗ Port 3000 (Backend) is NOT open${NC}"
fi

if netstat -tuln 2>/dev/null | grep -q ":5001 " || ss -tuln 2>/dev/null | grep -q ":5001 "; then
    echo -e "${GREEN}✓ Port 5001 (Runner) is open${NC}"
else
    echo -e "${RED}✗ Port 5001 (Runner) is NOT open${NC}"
fi

echo ""
echo -e "${YELLOW}Testing Backend API...${NC}"
echo ""

BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api 2>/dev/null)
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Backend API is responding (HTTP $BACKEND_RESPONSE)${NC}"
else
    echo -e "${RED}✗ Backend API is NOT responding (HTTP $BACKEND_RESPONSE)${NC}"
fi

echo ""
echo -e "${YELLOW}Testing Runner API...${NC}"
echo ""

RUNNER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health 2>/dev/null)
if [ "$RUNNER_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Runner API is responding (HTTP $RUNNER_RESPONSE)${NC}"
else
    echo -e "${RED}✗ Runner API is NOT responding (HTTP $RUNNER_RESPONSE)${NC}"
fi

echo ""
echo -e "${YELLOW}Checking logs for errors...${NC}"
echo ""

if [ -f "logs/backend.log" ]; then
    BACKEND_ERRORS=$(tail -50 logs/backend.log | grep -i "error\|failed\|exception" | tail -5)
    if [ -z "$BACKEND_ERRORS" ]; then
        echo -e "${GREEN}✓ No recent errors in backend.log${NC}"
    else
        echo -e "${RED}✗ Recent errors in backend.log:${NC}"
        echo "$BACKEND_ERRORS"
    fi
else
    echo -e "${YELLOW}⚠ backend.log not found${NC}"
fi

if [ -f "logs/runner.log" ]; then
    RUNNER_ERRORS=$(tail -50 logs/runner.log | grep -i "error\|failed\|exception\|warning" | tail -5)
    if [ -z "$RUNNER_ERRORS" ]; then
        echo -e "${GREEN}✓ No recent errors in runner.log${NC}"
    else
        echo -e "${RED}✗ Recent errors in runner.log:${NC}"
        echo "$RUNNER_ERRORS"
    fi
else
    echo -e "${YELLOW}⚠ runner.log not found${NC}"
fi

echo ""
echo -e "${YELLOW}Checking recent callback attempts...${NC}"
echo ""

if [ -f "logs/backend.log" ]; then
    CALLBACKS=$(tail -100 logs/backend.log | grep -i "callback" | tail -3)
    if [ -z "$CALLBACKS" ]; then
        echo -e "${YELLOW}⚠ No callback logs found in last 100 lines${NC}"
    else
        echo -e "${CYAN}Recent callback logs:${NC}"
        echo "$CALLBACKS"
    fi
fi

if [ -f "logs/runner.log" ]; then
    RUNNER_CALLBACKS=$(tail -100 logs/runner.log | grep -i "callback\|sending" | tail -3)
    if [ -z "$RUNNER_CALLBACKS" ]; then
        echo -e "${YELLOW}⚠ No callback attempts found in runner.log${NC}"
    else
        echo -e "${CYAN}Recent callback attempts:${NC}"
        echo "$RUNNER_CALLBACKS"
    fi
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}To view full logs:${NC}"
echo -e "${CYAN}  tail -f logs/backend.log${NC}"
echo -e "${CYAN}  tail -f logs/runner.log${NC}"
echo -e "${CYAN}========================================${NC}"
