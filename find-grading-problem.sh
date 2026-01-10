#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}FINDING GRADING PROBLEM${NC}"
echo -e "${RED}========================================${NC}"
echo ""

# Get the most recent submission ID
RECENT_SUB_ID=$(grep -o '"id":[0-9]*' backend/src/data/database.json | tail -1 | grep -o '[0-9]*' 2>/dev/null)

if [ -z "$RECENT_SUB_ID" ]; then
    echo -e "${RED}No submissions found!${NC}"
    exit 1
fi

echo -e "${CYAN}Analyzing submission ID: $RECENT_SUB_ID${NC}"
echo ""

# 1. Check backend logs for submission
echo -e "${YELLOW}=== BACKEND LOGS (Submission $RECENT_SUB_ID) ===${NC}"
if [ -f "logs/backend.log" ]; then
    echo -e "${CYAN}1. Submission sent to runner:${NC}"
    grep "SUBMISSION.*$RECENT_SUB_ID" logs/backend.log | tail -3
    echo ""
    
    echo -e "${CYAN}2. Callback received:${NC}"
    grep "CALLBACK.*$RECENT_SUB_ID" logs/backend.log | tail -5
    echo ""
    
    echo -e "${CYAN}3. Any errors for submission $RECENT_SUB_ID:${NC}"
    grep -i "error\|exception" logs/backend.log | grep "$RECENT_SUB_ID" | tail -5
    echo ""
else
    echo -e "${RED}backend.log not found!${NC}"
fi

# 2. Check runner logs
echo -e "${YELLOW}=== RUNNER LOGS (Submission $RECENT_SUB_ID) ===${NC}"
if [ -f "logs/runner.log" ]; then
    echo -e "${CYAN}1. Runner received submission:${NC}"
    strings logs/runner.log | grep -E "DEBUG.*/run endpoint|submission.*$RECENT_SUB_ID" | tail -5
    echo ""
    
    echo -e "${CYAN}2. File lookup:${NC}"
    strings logs/runner.log | grep -E "Looking for file|File exists|$RECENT_SUB_ID" | tail -5
    echo ""
    
    echo -e "${CYAN}3. Assignment fetch:${NC}"
    strings logs/runner.log | grep -E "Got assignments|Assignment not found|$RECENT_SUB_ID" | tail -3
    echo ""
    
    echo -e "${CYAN}4. Test directory:${NC}"
    strings logs/runner.log | grep -E "Test directory|tests_dir|Copied tests|$RECENT_SUB_ID" | tail -5
    echo ""
    
    echo -e "${CYAN}5. Pytest execution:${NC}"
    strings logs/runner.log | grep -E "About to run pytest|Pytest command|Test result|pytest_executed|$RECENT_SUB_ID" | tail -10
    echo ""
    
    echo -e "${CYAN}6. Callback sent:${NC}"
    strings logs/runner.log | grep -E "Sending callback|Callback response|callback.*$RECENT_SUB_ID" | tail -5
    echo ""
    
    echo -e "${RED}7. ERRORS AND EXCEPTIONS:${NC}"
    strings logs/runner.log | grep -iE "ERROR|Exception|Traceback|Failed" | tail -20
    echo ""
else
    echo -e "${RED}runner.log not found!${NC}"
fi

# 3. Check database status
echo -e "${YELLOW}=== DATABASE STATUS ===${NC}"
SUB_STATUS=$(grep -A 10 "\"id\":$RECENT_SUB_ID" backend/src/data/database.json 2>/dev/null | grep '"status"' | head -1 | sed 's/.*"status":"\([^"]*\)".*/\1/')
SUB_SCORE=$(grep -A 10 "\"id\":$RECENT_SUB_ID" backend/src/data/database.json 2>/dev/null | grep '"score"' | head -1 | sed 's/.*"score":\([0-9.]*\).*/\1/')

echo -e "${CYAN}Current status: ${SUB_STATUS:-'unknown'}${NC}"
echo -e "${CYAN}Current score: ${SUB_SCORE:-'none'}${NC}"
echo ""

# 4. Check if result exists
echo -e "${CYAN}Result in database:${NC}"
grep -A 15 "\"submissionId\":$RECENT_SUB_ID" backend/src/data/database.json | grep -E "submissionId|score|totalTests|passedTests" | head -5
echo ""

# 5. Diagnosis
echo -e "${RED}========================================${NC}"
echo -e "${RED}DIAGNOSIS:${NC}"
echo -e "${RED}========================================${NC}"

if [ "$SUB_STATUS" = "failed" ]; then
    echo -e "${RED}✗ Status is 'failed'${NC}"
    echo ""
    echo -e "${CYAN}Checking why...${NC}"
    
    # Check if runner received it
    if strings logs/runner.log 2>/dev/null | grep -q "submission.*$RECENT_SUB_ID\|/run endpoint"; then
        echo -e "${GREEN}✓ Runner received the submission${NC}"
    else
        echo -e "${RED}✗ Runner did NOT receive the submission!${NC}"
        echo -e "${YELLOW}Problem: Backend is not sending to runner${NC}"
    fi
    
    # Check if callback was sent
    if strings logs/runner.log 2>/dev/null | grep -q "Sending callback.*$RECENT_SUB_ID"; then
        echo -e "${GREEN}✓ Runner tried to send callback${NC}"
    else
        echo -e "${RED}✗ Runner did NOT send callback${NC}"
        echo -e "${YELLOW}Problem: Exception in runner before callback${NC}"
    fi
    
    # Check if callback was received
    if grep -q "CALLBACK.*$RECENT_SUB_ID" logs/backend.log 2>/dev/null; then
        echo -e "${GREEN}✓ Backend received callback${NC}"
    else
        echo -e "${RED}✗ Backend did NOT receive callback${NC}"
        echo -e "${YELLOW}Problem: Callback not reaching backend${NC}"
    fi
    
    # Check for specific errors
    echo ""
    echo -e "${CYAN}Common error patterns:${NC}"
    if strings logs/runner.log 2>/dev/null | grep -qi "file not found"; then
        echo -e "${RED}✗ File not found error${NC}"
    fi
    if strings logs/runner.log 2>/dev/null | grep -qi "Test directory not found"; then
        echo -e "${RED}✗ Test directory not found${NC}"
    fi
    if strings logs/runner.log 2>/dev/null | grep -qi "Assignment not found"; then
        echo -e "${RED}✗ Assignment not found${NC}"
    fi
    if strings logs/runner.log 2>/dev/null | grep -qi "pytest.*not found\|python.*not found"; then
        echo -e "${RED}✗ Pytest or Python not found${NC}"
    fi
    if strings logs/runner.log 2>/dev/null | grep -qi "Connection.*refused\|Could not connect"; then
        echo -e "${RED}✗ Cannot connect to backend${NC}"
    fi
fi

echo ""
echo -e "${CYAN}Full error details:${NC}"
strings logs/runner.log 2>/dev/null | tail -100 | grep -B 2 -A 5 -iE "error|exception" | tail -30
