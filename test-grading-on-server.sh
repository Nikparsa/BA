#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}ACA Grading Test on Server${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 1. Check if services are running
echo -e "${YELLOW}1. Checking services...${NC}"
if ! pgrep -f "node src/index.js" > /dev/null; then
    echo -e "${RED}✗ Backend is NOT running${NC}"
    echo -e "${YELLOW}Run: ./start-server.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"

if ! pgrep -f "python run.py" > /dev/null; then
    echo -e "${RED}✗ Runner is NOT running${NC}"
    echo -e "${YELLOW}Run: ./start-server.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Runner is running${NC}"

# 2. Test API endpoints
echo ""
echo -e "${YELLOW}2. Testing API endpoints...${NC}"
if ! curl -s http://localhost:3000/api > /dev/null; then
    echo -e "${RED}✗ Backend API not responding${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend API responding${NC}"

if ! curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${RED}✗ Runner API not responding${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Runner API responding${NC}"

# 3. Check recent submissions
echo ""
echo -e "${YELLOW}3. Checking recent submissions...${NC}"
RECENT_SUB_ID=$(grep -o '"id":[0-9]*' backend/src/data/database.json | tail -1 | grep -o '[0-9]*')
if [ -z "$RECENT_SUB_ID" ]; then
    echo -e "${YELLOW}⚠ No submissions found in database${NC}"
    echo -e "${CYAN}Please submit an assignment first, then run this script again${NC}"
    exit 0
fi
echo -e "${CYAN}Recent submission ID: $RECENT_SUB_ID${NC}"

# 4. Check if submission has a result
echo ""
echo -e "${YELLOW}4. Checking if submission has results...${NC}"
if grep -q "\"submissionId\":$RECENT_SUB_ID" backend/src/data/database.json; then
    RESULT_SCORE=$(grep -A 10 "\"submissionId\":$RECENT_SUB_ID" backend/src/data/database.json | grep -o '"score":[0-9.]*' | head -1 | cut -d: -f2)
    if [ ! -z "$RESULT_SCORE" ] && [ "$RESULT_SCORE" != "0" ]; then
        echo -e "${GREEN}✓ Submission $RECENT_SUB_ID has score: $RESULT_SCORE${NC}"
    else
        echo -e "${YELLOW}⚠ Submission $RECENT_SUB_ID has score: ${RESULT_SCORE:-0}${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Submission $RECENT_SUB_ID has no result yet${NC}"
fi

# 5. Check submission status
echo ""
echo -e "${YELLOW}5. Checking submission status...${NC}"
SUB_STATUS=$(grep -A 5 "\"id\":$RECENT_SUB_ID" backend/src/data/database.json | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
SUB_SCORE=$(grep -A 5 "\"id\":$RECENT_SUB_ID" backend/src/data/database.json | grep -o '"score":[0-9.]*' | head -1 | cut -d: -f2)
echo -e "${CYAN}Status: ${SUB_STATUS:-'unknown'}${NC}"
echo -e "${CYAN}Score: ${SUB_SCORE:-'none'}${NC}"

if [ "$SUB_STATUS" = "completed" ] && [ ! -z "$SUB_SCORE" ] && [ "$SUB_SCORE" != "0" ]; then
    echo -e "${GREEN}✓ Grading is working! Submission has completed status and score${NC}"
elif [ "$SUB_STATUS" = "completed" ]; then
    echo -e "${YELLOW}⚠ Submission is completed but score is 0 or missing${NC}"
elif [ "$SUB_STATUS" = "failed" ]; then
    echo -e "${RED}✗ Submission failed - check logs${NC}"
elif [ "$SUB_STATUS" = "processing" ] || [ "$SUB_STATUS" = "queued" ]; then
    echo -e "${YELLOW}⚠ Submission is still processing...${NC}"
    echo -e "${CYAN}Wait a few seconds and check again${NC}"
fi

# 6. Check logs for callbacks
echo ""
echo -e "${YELLOW}6. Checking logs for recent callbacks...${NC}"
if [ -f "logs/backend.log" ]; then
    CALLBACKS=$(tail -100 logs/backend.log | grep -E "CALLBACK.*Received.*submission.*$RECENT_SUB_ID" | tail -3)
    if [ ! -z "$CALLBACKS" ]; then
        echo -e "${GREEN}✓ Callbacks found for submission $RECENT_SUB_ID:${NC}"
        echo "$CALLBACKS"
    else
        echo -e "${YELLOW}⚠ No callbacks found for submission $RECENT_SUB_ID${NC}"
        echo -e "${CYAN}This means the runner might not have sent results back${NC}"
    fi
else
    echo -e "${YELLOW}⚠ backend.log not found${NC}"
fi

# 7. Check runner logs
echo ""
echo -e "${YELLOW}7. Checking runner logs...${NC}"
if [ -f "logs/runner.log" ]; then
    RUNNER_ACTIVITY=$(strings logs/runner.log | tail -100 | grep -E "DEBUG.*submission.*$RECENT_SUB_ID|callback.*submission.*$RECENT_SUB_ID" | tail -5)
    if [ ! -z "$RUNNER_ACTIVITY" ]; then
        echo -e "${CYAN}Recent runner activity for submission $RECENT_SUB_ID:${NC}"
        echo "$RUNNER_ACTIVITY"
    else
        echo -e "${YELLOW}⚠ No runner activity found for submission $RECENT_SUB_ID${NC}"
    fi
    
    # Check for errors
    RUNNER_ERRORS=$(strings logs/runner.log | tail -200 | grep -i "error\|exception\|traceback" | tail -3)
    if [ ! -z "$RUNNER_ERRORS" ]; then
        echo -e "${RED}✗ Recent runner errors:${NC}"
        echo "$RUNNER_ERRORS"
    fi
else
    echo -e "${YELLOW}⚠ runner.log not found${NC}"
fi

# 8. Summary
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Summary:${NC}"
echo -e "${CYAN}========================================${NC}"

if [ "$SUB_STATUS" = "completed" ] && [ ! -z "$SUB_SCORE" ] && [ "$SUB_SCORE" != "0" ]; then
    echo -e "${GREEN}✓✓✓ GRADING IS WORKING! ✓✓✓${NC}"
    echo -e "${GREEN}Submission $RECENT_SUB_ID has status '$SUB_STATUS' and score $SUB_SCORE${NC}"
elif [ "$SUB_STATUS" = "completed" ] && [ ! -z "$SUB_SCORE" ]; then
    echo -e "${YELLOW}⚠ Grading runs but score is 0${NC}"
    echo -e "${CYAN}This might mean all tests failed or no tests were executed${NC}"
elif [ "$SUB_STATUS" = "processing" ] || [ "$SUB_STATUS" = "queued" ]; then
    echo -e "${YELLOW}⚠ Submission is still being processed${NC}"
    echo -e "${CYAN}Wait and check again with: ./test-grading-on-server.sh${NC}"
elif [ "$SUB_STATUS" = "failed" ]; then
    echo -e "${RED}✗ Submission failed${NC}"
    echo -e "${CYAN}Check logs: tail -50 logs/backend.log && tail -50 logs/runner.log${NC}"
else
    echo -e "${RED}✗ Could not determine grading status${NC}"
    echo -e "${CYAN}Check manually:${NC}"
    echo -e "${CYAN}  1. Submit a new assignment${NC}"
    echo -e "${CYAN}  2. Wait 10 seconds${NC}"
    echo -e "${CYAN}  3. Run this script again${NC}"
fi

echo ""
echo -e "${CYAN}To monitor in real-time:${NC}"
echo -e "${CYAN}  tail -f logs/backend.log | grep -E 'SUBMISSION|CALLBACK'${NC}"
echo -e "${CYAN}  tail -f logs/runner.log | strings | grep -E 'DEBUG|ERROR'${NC}"
echo -e "${CYAN}========================================${NC}"
