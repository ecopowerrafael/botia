#!/usr/bin/env bash
# Quick test commands for WordPress + Ollama integration

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"
TENANT_ID="test-tenant-123"

echo -e "${BLUE}=== WordPress + Ollama Integration Tests ===${NC}\n"

# Test 1: Connect WordPress Site
echo -e "${BLUE}1. Testing WordPress Connection...${NC}"
curl -X POST "$API_URL/wordpress/connect" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "siteUrl": "https://demo.woocommerce.com",
    "username": "demo_user",
    "appPassword": "demo_pass_here",
    "syncProducts": true,
    "syncPosts": false,
    "syncPages": false,
    "productFields": ["name", "price", "description", "images", "categories"],
    "syncFrequency": 3600
  }' | jq '.'

echo -e "\n${BLUE}2. List WordPress Integrations...${NC}"
curl -X GET "$API_URL/wordpress/integrations?tenantId=$TENANT_ID" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.'

# Store the integration ID from response (you'll need to update this)
INTEGRATION_ID="integration-id-from-above"

echo -e "\n${BLUE}3. Configure Sync Fields...${NC}"
curl -X POST "$API_URL/wordpress/$INTEGRATION_ID/configure" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "integrationId": "'$INTEGRATION_ID'",
    "productFields": ["name", "price", "description", "images", "categories", "stock"],
    "syncFrequency": 7200
  }' | jq '.'

echo -e "\n${BLUE}4. Sync Products Manually...${NC}"
curl -X POST "$API_URL/wordpress/$INTEGRATION_ID/sync" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "integrationId": "'$INTEGRATION_ID'",
    "limit": 50
  }' | jq '.'

echo -e "\n${BLUE}5. Get Integration Details...${NC}"
curl -X GET "$API_URL/wordpress/$INTEGRATION_ID?tenantId=$TENANT_ID" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.'

# Test 6: Test Ollama IA with WordPress Context
echo -e "\n${BLUE}6. Test Ollama AI (with WordPress Context)...${NC}"
curl -X POST "$API_URL/ia/process-message" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "message": "What products do we have in stock?",
    "provider": "ollama",
    "context": {
      "chatId": "chat-123",
      "conversationHistory": []
    }
  }' | jq '.'

# Test 7: Compare with Cloud AI
echo -e "\n${BLUE}7. Test OpenAI (for comparison)...${NC}"
curl -X POST "$API_URL/ia/process-message" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "tenantId": "'$TENANT_ID'",
    "message": "What products do we have in stock?",
    "provider": "openai",
    "context": {
      "chatId": "chat-123",
      "conversationHistory": []
    }
  }' | jq '.'

# Test 8: Disable Integration
echo -e "\n${BLUE}8. Disable WordPress Integration...${NC}"
curl -X DELETE "$API_URL/wordpress/$INTEGRATION_ID?tenantId=$TENANT_ID" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.'

echo -e "\n${GREEN}=== Tests Complete ===${NC}"
echo -e "${BLUE}Note: Replace INTEGRATION_ID with actual ID from response of test #2${NC}\n"
