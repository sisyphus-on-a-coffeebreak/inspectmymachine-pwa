#!/bin/bash

# Start Development Servers for VOMS
# This script starts both the frontend (Vite) and backend (Laravel) servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paths
FRONTEND_DIR="/Users/narnolia/code/voms-pwa"
BACKEND_DIR="/Users/narnolia/code/vosm"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  VOMS Development Server Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if directories exist
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Check if ports are already in use
if check_port 5173; then
    echo -e "${YELLOW}Warning: Port 5173 (frontend) is already in use${NC}"
fi

if check_port 8000; then
    echo -e "${YELLOW}Warning: Port 8000 (backend) is already in use${NC}"
fi

echo -e "${GREEN}Starting backend server...${NC}"
cd "$BACKEND_DIR"

# Check if vendor directory exists (composer dependencies)
if [ ! -d "vendor" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    composer install
fi

# Start backend in background
php artisan serve > /tmp/vosm-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend server started (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}Backend logs: tail -f /tmp/vosm-backend.log${NC}"
echo ""

# Wait a moment for backend to start
sleep 2

echo -e "${GREEN}Starting frontend server...${NC}"
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Servers are starting!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173"
echo -e "${GREEN}Backend API:${NC} http://localhost:8000"
echo -e "${GREEN}Backend API (via proxy):${NC} http://localhost:5173/api"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    echo -e "${GREEN}Servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start frontend (this will block)
npm run dev




