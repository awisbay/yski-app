#!/bin/bash

# YSKI Mobile APK Build Script
# Build APK using Expo Turtle CLI (self-hosted)

set -e

echo "🚀 YSKI Mobile APK Builder"
echo "=========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "mobile/package.json" ]; then
    echo -e "${RED}Error: Please run from project root directory${NC}"
    exit 1
fi

cd mobile

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Install expo-cli if not present
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Check if expo is installed
if [ ! -d "node_modules/expo" ]; then
    echo -e "${YELLOW}Installing Expo CLI...${NC}"
    npm install expo
fi

# Update API URL
echo -e "${YELLOW}🔧 Configuring API URL...${NC}"
API_URL="http://173.212.211.18:8080/api/v1"
echo "API URL: $API_URL"

# Option 1: Using EAS (recommended)
if command -v eas &> /dev/null; then
    echo -e "${GREEN}✅ EAS CLI found!${NC}"
    echo -e "${YELLOW}Starting EAS build...${NC}"
    echo ""
    echo "Select build profile:"
    echo "1. preview (APK for testing)"
    echo "2. production (AAB for Play Store)"
    read -p "Choice (1/2): " choice
    
    if [ "$choice" = "1" ]; then
        eas build --platform android --profile preview
    else
        eas build --platform android --profile production
    fi
else
    echo -e "${YELLOW}⚠️  EAS CLI not found. Installing...${NC}"
    npm install -g @expo/eas-cli
    
    echo ""
    echo -e "${GREEN}✅ EAS CLI installed!${NC}"
    echo -e "${YELLOW}Please login to Expo first:${NC}"
    echo "  eas login"
    echo ""
    echo "Then run this script again."
fi
