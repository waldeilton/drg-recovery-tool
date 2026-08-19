#!/bin/bash

# DRG Recovery Tool — Development Environment Setup
# Run this script to set up your local development environment

set -e  # Exit on error

echo "🚀 DRG Recovery Tool — Development Setup"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}1. Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm not found. Please install npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}2. Installing dependencies...${NC}"
npm ci  # Use ci instead of install for reproducible builds
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Setup environment
echo -e "${BLUE}3. Setting up environment variables...${NC}"
if [ ! -f .env.development ]; then
    cp config/development.env.example .env.development
    echo -e "${GREEN}✓ Created .env.development (customize as needed)${NC}"
else
    echo -e "${GREEN}✓ .env.development already exists${NC}"
fi
echo ""

# Create necessary directories
echo -e "${BLUE}4. Creating project directories...${NC}"
mkdir -p build dist coverage .git
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Run initial tests
echo -e "${BLUE}5. Running initial tests...${NC}"
npm run test:unit 2>/dev/null || echo -e "${YELLOW}⚠️  Tests not available yet${NC}"
echo ""

# Display next steps
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Start development: npm run dev"
echo "2. Run tests: npm run test"
echo "3. Build for production: npm run build:prod"
echo "4. Check available commands: npm run (list all scripts)"
echo ""
echo -e "${YELLOW}📝 Documentation: See README.md and docs/${NC}"
