#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   ACA - Automated Code Assessment${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}Node.js found: $NODE_VERSION${NC}"

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python3 not found. Please install Python3 first.${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}Python found: $PYTHON_VERSION${NC}"

echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"

# Install backend dependencies
echo -e "${CYAN}Installing backend dependencies...${NC}"
cd backend
if ! npm install; then
    echo -e "${RED}ERROR: Failed to install backend dependencies${NC}"
    exit 1
fi

# Install frontend dependencies
echo -e "${CYAN}Installing frontend dependencies...${NC}"
cd ../frontend
if ! npm install; then
    echo -e "${RED}ERROR: Failed to install frontend dependencies${NC}"
    exit 1
fi

# Build frontend
echo -e "${CYAN}Building frontend...${NC}"
# Fix permissions for node_modules binaries
if [ -d "node_modules/.bin" ]; then
    chmod +x node_modules/.bin/* 2>/dev/null || true
fi
# Get server IP for API URL
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP="localhost"
fi

export VITE_API_BASE_URL="http://${SERVER_IP}:3000/api"
if ! npm run build; then
    echo -e "${RED}ERROR: Failed to build frontend${NC}"
    exit 1
fi

# Setup Python virtual environment
echo -e "${CYAN}Setting up Python virtual environment...${NC}"
cd ../runner
if [ ! -d ".venv" ]; then
    if ! python3 -m venv .venv; then
        echo -e "${RED}ERROR: Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Install Python dependencies
echo -e "${CYAN}Installing Python dependencies...${NC}"
source .venv/bin/activate
if ! pip install --upgrade pip --quiet; then
    echo -e "${YELLOW}Warning: Failed to upgrade pip, continuing...${NC}"
fi
if ! pip install -r requirements.txt; then
    echo -e "${RED}ERROR: Failed to install Python dependencies${NC}"
    exit 1
fi
deactivate

cd ..

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All dependencies installed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Starting services...${NC}"
echo ""

# Get environment variables or use defaults
PORT=${PORT:-3000}
JWT_SECRET=${JWT_SECRET:-"production_secret_key_change_me"}
RUNNER_URL=${RUNNER_URL:-"http://localhost:5001"}
BACKEND_URL=${BACKEND_URL:-"http://localhost:3000/api"}
RUNNER_PORT=${RUNNER_PORT:-5001}

# Create logs directory
mkdir -p logs

# Start Backend
echo -e "${CYAN}Starting Backend on port $PORT...${NC}"
cd backend
nohup node src/index.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
sleep 3

# Start Runner
echo -e "${CYAN}Starting Runner on port $RUNNER_PORT...${NC}"
cd runner
source .venv/bin/activate
nohup python run.py > ../logs/runner.log 2>&1 &
RUNNER_PID=$!
echo $RUNNER_PID > ../logs/runner.pid
deactivate
cd ..
sleep 2

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Services Started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Service Status:${NC}"
echo -e "  Backend PID: $BACKEND_PID"
echo -e "  Runner PID: $RUNNER_PID"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo -e "  Frontend: ${CYAN}http://${SERVER_IP}:${PORT}${NC}"
echo -e "  Backend API: ${CYAN}http://${SERVER_IP}:${PORT}/api${NC}"
echo -e "  Runner API: ${CYAN}http://${SERVER_IP}:${RUNNER_PORT}/health${NC}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend: ${CYAN}./logs/backend.log${NC}"
echo -e "  Runner: ${CYAN}./logs/runner.log${NC}"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo -e "  ${CYAN}./stop-server.sh${NC} or ${CYAN}kill \$(cat logs/backend.pid) \$(cat logs/runner.pid)${NC}"
echo ""
echo -e "${GREEN}Services are running in background!${NC}"
echo ""

