#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}ACA Server Fix Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Kill all backend processes
echo -e "${YELLOW}Killing all Backend processes...${NC}"
pkill -f "node src/index.js" 2>/dev/null
sleep 1
if pgrep -f "node src/index.js" > /dev/null; then
    echo -e "${RED}Force killing backend...${NC}"
    pkill -9 -f "node src/index.js" 2>/dev/null
    sleep 1
fi

# Kill all runner processes
echo -e "${YELLOW}Killing all Runner processes...${NC}"
pkill -f "python run.py" 2>/dev/null
sleep 1
if pgrep -f "python run.py" > /dev/null; then
    echo -e "${RED}Force killing runner...${NC}"
    pkill -9 -f "python run.py" 2>/dev/null
    sleep 1
fi

# Free ports using fuser if available
echo -e "${YELLOW}Freeing ports 3000 and 5001...${NC}"
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 5001/tcp 2>/dev/null || true
sleep 2

# Verify ports are free
echo -e "${YELLOW}Verifying ports are free...${NC}"
if lsof -i:3000 2>/dev/null | grep -q LISTEN; then
    echo -e "${RED}✗ Port 3000 is still in use${NC}"
    lsof -i:3000
    echo -e "${YELLOW}Try: kill -9 PID${NC}"
else
    echo -e "${GREEN}✓ Port 3000 is free${NC}"
fi

if lsof -i:5001 2>/dev/null | grep -q LISTEN; then
    echo -e "${RED}✗ Port 5001 is still in use${NC}"
    lsof -i:5001
    echo -e "${YELLOW}Try: kill -9 PID${NC}"
else
    echo -e "${GREEN}✓ Port 5001 is free${NC}"
fi

echo ""
echo -e "${GREEN}Ports cleared. Now run: ./start-server.sh${NC}"
echo ""
