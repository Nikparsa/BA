#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}ACA Grading Test & Diagnosis${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 1. Check if services are running
echo -e "${YELLOW}1. Checking if services are running...${NC}"
BACKEND_RUNNING=false
RUNNER_RUNNING=false

if pgrep -f "node src/index.js" > /dev/null; then
    BACKEND_PID=$(pgrep -f "node src/index.js")
    echo -e "${GREEN}✓ Backend is running (PID: $BACKEND_PID)${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}✗ Backend is NOT running${NC}"
fi

if pgrep -f "python run.py" > /dev/null; then
    RUNNER_PID=$(pgrep -f "python run.py")
    echo -e "${GREEN}✓ Runner is running (PID: $RUNNER_PID)${NC}"
    RUNNER_RUNNING=true
else
    echo -e "${RED}✗ Runner is NOT running${NC}"
fi

if [ "$BACKEND_RUNNING" = false ] || [ "$RUNNER_RUNNING" = false ]; then
    echo -e "${RED}ERROR: Services are not running. Start with: ./start-server.sh${NC}"
    exit 1
fi

echo ""

# 2. Test API endpoints
echo -e "${YELLOW}2. Testing API endpoints...${NC}"
BACKEND_OK=false
RUNNER_OK=false

if curl -s http://localhost:3000/api > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
    BACKEND_OK=true
else
    echo -e "${RED}✗ Backend API is NOT responding${NC}"
fi

if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Runner API is responding${NC}"
    RUNNER_OK=true
else
    echo -e "${RED}✗ Runner API is NOT responding${NC}"
fi

echo ""

# 3. Check recent submissions
echo -e "${YELLOW}3. Checking recent submissions in logs...${NC}"
if [ -f "logs/backend.log" ]; then
    RECENT_SUBS=$(tail -200 logs/backend.log | grep -E "SUBMISSION.*Sending" | tail -5)
    if [ -z "$RECENT_SUBS" ]; then
        echo -e "${YELLOW}⚠ No recent submissions found in backend.log${NC}"
    else
        echo -e "${CYAN}Recent submissions sent to runner:${NC}"
        echo "$RECENT_SUBS" | head -5
    fi
else
    echo -e "${YELLOW}⚠ backend.log not found${NC}"
fi

echo ""

# 4. Check recent callbacks
echo -e "${YELLOW}4. Checking recent callbacks in logs...${NC}"
if [ -f "logs/backend.log" ]; then
    RECENT_CALLBACKS=$(tail -200 logs/backend.log | grep -E "CALLBACK.*Received" | tail -5)
    if [ -z "$RECENT_CALLBACKS" ]; then
        echo -e "${RED}✗ No recent callbacks found in backend.log${NC}"
        echo -e "${YELLOW}This means the runner is not sending results back!${NC}"
    else
        echo -e "${GREEN}✓ Recent callbacks found:${NC}"
        echo "$RECENT_CALLBACKS" | head -5
    fi
else
    echo -e "${YELLOW}⚠ backend.log not found${NC}"
fi

echo ""

# 5. Check runner processing
echo -e "${YELLOW}5. Checking runner processing in logs...${NC}"
if [ -f "logs/runner.log" ]; then
    # Convert binary to text and check for recent activity
    RUNNER_ACTIVITY=$(strings logs/runner.log | tail -200 | grep -E "DEBUG.*/run endpoint|DEBUG.*Looking for file|DEBUG.*Sending callback" | tail -10)
    if [ -z "$RUNNER_ACTIVITY" ]; then
        echo -e "${YELLOW}⚠ No recent runner activity found${NC}"
    else
        echo -e "${CYAN}Recent runner activity:${NC}"
        echo "$RUNNER_ACTIVITY" | head -10
    fi
    
    # Check for errors
    RUNNER_ERRORS=$(strings logs/runner.log | tail -200 | grep -E "ERROR|Exception|Traceback" | tail -5)
    if [ ! -z "$RUNNER_ERRORS" ]; then
        echo -e "${RED}✗ Recent runner errors:${NC}"
        echo "$RUNNER_ERRORS"
    fi
else
    echo -e "${YELLOW}⚠ runner.log not found${NC}"
fi

echo ""

# 6. Check database for submissions with scores
echo -e "${YELLOW}6. Checking database for graded submissions...${NC}"
if [ -f "backend/src/data/database.json" ]; then
    # Count submissions with scores
    SUBS_WITH_SCORES=$(grep -o '"score":[0-9.]*' backend/src/data/database.json | grep -v '"score":0[^0-9]' | wc -l)
    TOTAL_SUBS=$(grep -c '"id":' backend/src/data/database.json | head -1 || echo "0")
    echo -e "${CYAN}Submissions with scores (non-zero): $SUBS_WITH_SCORES${NC}"
    
    # Show recent submissions from database
    echo -e "${CYAN}Recent submissions (last 3):${NC}"
    grep -A 10 '"submissions"' backend/src/data/database.json | tail -30 | grep -E '"id":|"status":|"score":' | head -9
else
    echo -e "${YELLOW}⚠ database.json not found${NC}"
fi

echo ""

# 7. Test runner-backend connection
echo -e "${YELLOW}7. Testing runner-backend connection...${NC}"
if [ "$BACKEND_OK" = true ] && [ "$RUNNER_OK" = true ]; then
    # Test if runner can reach backend
    BACKEND_URL_CHECK=$(strings logs/runner.log | tail -50 | grep -o "BACKEND_URL=http://[^ ]*" | tail -1)
    if [ ! -z "$BACKEND_URL_CHECK" ]; then
        echo -e "${CYAN}Runner BACKEND_URL: $BACKEND_URL_CHECK${NC}"
    fi
    
    # Test callback endpoint
    TEST_CALLBACK=$(curl -s -X POST http://localhost:3000/api/runner/callback \
        -H "Content-Type: application/json" \
        -d '{"submissionId":999999,"status":"test","score":0.5}' 2>&1)
    
    if echo "$TEST_CALLBACK" | grep -q "ok\|true"; then
        echo -e "${GREEN}✓ Callback endpoint is working${NC}"
    else
        echo -e "${YELLOW}⚠ Callback endpoint test returned: $TEST_CALLBACK${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping connection test (services not running)${NC}"
fi

echo ""

# 8. Summary
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Summary:${NC}"
echo -e "${CYAN}========================================${NC}"

if [ "$BACKEND_RUNNING" = true ] && [ "$RUNNER_RUNNING" = true ] && [ "$BACKEND_OK" = true ] && [ "$RUNNER_OK" = true ]; then
    echo -e "${GREEN}✓ All services are running and responding${NC}"
    
    if [ ! -z "$RECENT_CALLBACKS" ]; then
        echo -e "${GREEN}✓ Callbacks are being received${NC}"
        echo -e "${GREEN}✓ Grading should be working!${NC}"
    else
        echo -e "${RED}✗ No callbacks received - grading may not be working${NC}"
        echo -e "${YELLOW}Recommendation: Submit a new assignment and check logs${NC}"
    fi
else
    echo -e "${RED}✗ Services have issues - check above${NC}"
fi

echo ""
echo -e "${CYAN}To monitor live:${NC}"
echo -e "${CYAN}  tail -f logs/backend.log | grep -E 'SUBMISSION|CALLBACK'${NC}"
echo -e "${CYAN}  tail -f logs/runner.log | strings | grep -E 'DEBUG|ERROR'${NC}"
echo -e "${CYAN}========================================${NC}"
