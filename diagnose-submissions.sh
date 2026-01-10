#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Submission Diagnosis${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

echo -e "${YELLOW}1. Checking recent backend logs for submissions...${NC}"
tail -100 logs/backend.log | grep -E "SUBMISSION|submission" | tail -10
echo ""

echo -e "${YELLOW}2. Checking recent backend logs for callbacks...${NC}"
tail -100 logs/backend.log | grep -E "CALLBACK|callback" | tail -10
echo ""

echo -e "${YELLOW}3. Checking runner logs for errors...${NC}"
strings logs/runner.log | tail -200 | grep -E "ERROR|Error|error|Exception|Traceback" | tail -20
echo ""

echo -e "${YELLOW}4. Checking runner logs for submission processing...${NC}"
strings logs/runner.log | tail -200 | grep -E "DEBUG.*submission|/run endpoint|Looking for file" | tail -10
echo ""

echo -e "${YELLOW}5. Checking if submission files exist...${NC}"
ls -lh backend/src/data/submissions/ | tail -5
echo ""

echo -e "${YELLOW}6. Full recent runner log (last 50 lines)...${NC}"
strings logs/runner.log | tail -50
echo ""

echo -e "${CYAN}========================================${NC}"
