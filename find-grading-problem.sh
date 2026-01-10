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

# Get the most recent submission ID - try multiple methods
RECENT_SUB_ID=$(grep -o '"id":[0-9]*' backend/src/data/database.json 2>/dev/null | tail -1 | grep -o '[0-9]*' 2>/dev/null)

# Alternative method: look for submission entries
if [ -z "$RECENT_SUB_ID" ]; then
    RECENT_SUB_ID=$(grep -A 5 '"submissions"' backend/src/data/database.json 2>/dev/null | grep '"id"' | tail -1 | grep -o '[0-9]*' 2>/dev/null)
fi

# If still not found, check all submissions
if [ -z "$RECENT_SUB_ID" ]; then
    echo -e "${YELLOW}Could not find submission ID from database.json${NC}"
    echo -e "${CYAN}Checking database.json structure...${NC}"
    head -100 backend/src/data/database.json | grep -E '"id"|"submissions"|"status"' | head -20
    echo ""
    echo -e "${CYAN}Will analyze logs without specific submission ID...${NC}"
    RECENT_SUB_ID="unknown"
else
    echo -e "${CYAN}Analyzing submission ID: $RECENT_SUB_ID${NC}"
fi
echo ""

# 1. Check backend logs for submission
echo -e "${YELLOW}=== BACKEND LOGS ===${NC}"
if [ -f "logs/backend.log" ]; then
    echo -e "${CYAN}1. Recent submissions sent to runner (last 5):${NC}"
    tail -200 logs/backend.log 2>/dev/null | grep "SUBMISSION.*Sending" 2>/dev/null | tail -5 || echo "No matches found"
    echo ""
    
    echo -e "${CYAN}2. Recent callbacks received (last 5):${NC}"
    tail -200 logs/backend.log 2>/dev/null | grep "CALLBACK.*Received" 2>/dev/null | tail -5 || echo "No matches found"
    echo ""
    
    if [ "$RECENT_SUB_ID" != "unknown" ]; then
        echo -e "${CYAN}3. Specific submission $RECENT_SUB_ID:${NC}"
        grep "SUBMISSION.*$RECENT_SUB_ID\|CALLBACK.*$RECENT_SUB_ID" logs/backend.log 2>/dev/null | tail -5 || echo "No matches found"
        echo ""
    fi
    
    echo -e "${CYAN}4. Recent errors:${NC}"
    tail -100 logs/backend.log 2>/dev/null | grep -i "error\|exception" 2>/dev/null | tail -5 || echo "No errors found"
    echo ""
    
    echo -e "${CYAN}5. Last 50 lines of backend.log:${NC}"
    tail -50 logs/backend.log 2>/dev/null
    echo ""
else
    echo -e "${RED}backend.log not found!${NC}"
fi

# 2. Check runner logs
echo -e "${YELLOW}=== RUNNER LOGS ===${NC}"
if [ -f "logs/runner.log" ]; then
    echo -e "${CYAN}1. Recent /run endpoint calls (last 5):${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -300 | grep "DEBUG.*/run endpoint" 2>/dev/null | tail -5 || echo "No matches found"
    else
        tail -300 logs/runner.log 2>/dev/null | grep "DEBUG.*/run endpoint" 2>/dev/null | tail -5 || echo "No matches found"
    fi
    echo ""
    
    echo -e "${CYAN}2. Recent file lookups:${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -300 | grep -E "Looking for file|File exists" 2>/dev/null | tail -5 || echo "No matches found"
    else
        tail -300 logs/runner.log 2>/dev/null | grep -E "Looking for file|File exists" 2>/dev/null | tail -5 || echo "No matches found"
    fi
    echo ""
    
    echo -e "${CYAN}3. Recent assignment fetches:${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -300 | grep -E "Got assignments|Assignment not found" 2>/dev/null | tail -3 || echo "No matches found"
    else
        tail -300 logs/runner.log 2>/dev/null | grep -E "Got assignments|Assignment not found" 2>/dev/null | tail -3 || echo "No matches found"
    fi
    echo ""
    
    echo -e "${CYAN}4. Recent test directory operations:${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -300 | grep -E "Test directory|Copied tests|tests_dir" 2>/dev/null | tail -5 || echo "No matches found"
    else
        tail -300 logs/runner.log 2>/dev/null | grep -E "Test directory|Copied tests|tests_dir" 2>/dev/null | tail -5 || echo "No matches found"
    fi
    echo ""
    
    echo -e "${CYAN}5. Recent pytest executions:${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -300 | grep -E "About to run pytest|Pytest command|Test result|pytest_executed" 2>/dev/null | tail -10 || echo "No matches found"
    else
        tail -300 logs/runner.log 2>/dev/null | grep -E "About to run pytest|Pytest command|Test result|pytest_executed" 2>/dev/null | tail -10 || echo "No matches found"
    fi
    echo ""
    
    echo -e "${CYAN}6. Recent callbacks sent:${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -300 | grep -E "Sending callback|Callback response|Callback status" 2>/dev/null | tail -5 || echo "No matches found"
    else
        tail -300 logs/runner.log 2>/dev/null | grep -E "Sending callback|Callback response|Callback status" 2>/dev/null | tail -5 || echo "No matches found"
    fi
    echo ""
    
    echo -e "${RED}7. ALL ERRORS AND EXCEPTIONS (last 30):${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -500 | grep -iE "ERROR|Exception|Traceback|Failed" 2>/dev/null | tail -30 || echo "No errors found"
    else
        tail -500 logs/runner.log 2>/dev/null | grep -iE "ERROR|Exception|Traceback|Failed" 2>/dev/null | tail -30 || echo "No errors found"
    fi
    echo ""
    
    echo -e "${CYAN}8. Full recent runner activity (last 50 lines):${NC}"
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -50
    else
        tail -50 logs/runner.log 2>/dev/null
    fi
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
    if [ -f "logs/runner.log" ]; then
        if command -v strings >/dev/null 2>&1; then
            RUNNER_CONTENT=$(strings logs/runner.log 2>/dev/null)
        else
            RUNNER_CONTENT=$(tail -1000 logs/runner.log 2>/dev/null)
        fi
        
        if echo "$RUNNER_CONTENT" | grep -qi "file not found"; then
            echo -e "${RED}✗ File not found error${NC}"
        fi
        if echo "$RUNNER_CONTENT" | grep -qi "Test directory not found"; then
            echo -e "${RED}✗ Test directory not found${NC}"
        fi
        if echo "$RUNNER_CONTENT" | grep -qi "Assignment not found"; then
            echo -e "${RED}✗ Assignment not found${NC}"
        fi
        if echo "$RUNNER_CONTENT" | grep -qi "pytest.*not found\|python.*not found"; then
            echo -e "${RED}✗ Pytest or Python not found${NC}"
        fi
        if echo "$RUNNER_CONTENT" | grep -qi "Connection.*refused\|Could not connect"; then
            echo -e "${RED}✗ Cannot connect to backend${NC}"
        fi
    fi
fi

echo ""
echo -e "${CYAN}Full error details:${NC}"
if [ -f "logs/runner.log" ]; then
    if command -v strings >/dev/null 2>&1; then
        strings logs/runner.log 2>/dev/null | tail -100 | grep -B 2 -A 5 -iE "error|exception" 2>/dev/null | tail -30 || echo "No errors found"
    else
        tail -100 logs/runner.log 2>/dev/null | grep -B 2 -A 5 -iE "error|exception" 2>/dev/null | tail -30 || echo "No errors found"
    fi
fi
