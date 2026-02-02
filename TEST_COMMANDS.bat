@echo off
REM Quick test commands for WordPress + Ollama integration (Windows)

setlocal enabledelayedexpansion

set API_URL=http://localhost:3000
set TENANT_ID=test-tenant-123

echo === WordPress + Ollama Integration Tests ===
echo.

echo 1. Testing WordPress Connection...
curl -X POST "%API_URL%/wordpress/connect" ^
  -H "Content-Type: application/json" ^
  -H "X-Tenant-ID: %TENANT_ID%" ^
  -d "{\"siteUrl\": \"https://demo.woocommerce.com\", \"username\": \"demo_user\", \"appPassword\": \"demo_pass_here\", \"syncProducts\": true, \"syncPosts\": false, \"syncPages\": false, \"productFields\": [\"name\", \"price\", \"description\", \"images\", \"categories\"], \"syncFrequency\": 3600}"
echo.
echo.

echo 2. List WordPress Integrations...
curl -X GET "%API_URL%/wordpress/integrations?tenantId=%TENANT_ID%" ^
  -H "X-Tenant-ID: %TENANT_ID%"
echo.
echo.

echo NOTE: Replace INTEGRATION_ID with the actual ID from the above response
set INTEGRATION_ID=integration-id-from-above

echo 3. Configure Sync Fields...
curl -X POST "%API_URL%/wordpress/%INTEGRATION_ID%/configure" ^
  -H "Content-Type: application/json" ^
  -H "X-Tenant-ID: %TENANT_ID%" ^
  -d "{\"integrationId\": \"%INTEGRATION_ID%\", \"productFields\": [\"name\", \"price\", \"description\", \"images\", \"categories\", \"stock\"], \"syncFrequency\": 7200}"
echo.
echo.

echo 4. Sync Products Manually...
curl -X POST "%API_URL%/wordpress/%INTEGRATION_ID%/sync" ^
  -H "Content-Type: application/json" ^
  -H "X-Tenant-ID: %TENANT_ID%" ^
  -d "{\"integrationId\": \"%INTEGRATION_ID%\", \"limit\": 50}"
echo.
echo.

echo 5. Get Integration Details...
curl -X GET "%API_URL%/wordpress/%INTEGRATION_ID%?tenantId=%TENANT_ID%" ^
  -H "X-Tenant-ID: %TENANT_ID%"
echo.
echo.

echo 6. Test Ollama AI (with WordPress Context)...
curl -X POST "%API_URL%/ia/process-message" ^
  -H "Content-Type: application/json" ^
  -H "X-Tenant-ID: %TENANT_ID%" ^
  -d "{\"tenantId\": \"%TENANT_ID%\", \"message\": \"What products do we have in stock?\", \"provider\": \"ollama\", \"context\": {\"chatId\": \"chat-123\", \"conversationHistory\": []}}"
echo.
echo.

echo 7. Test OpenAI (for comparison)...
curl -X POST "%API_URL%/ia/process-message" ^
  -H "Content-Type: application/json" ^
  -H "X-Tenant-ID: %TENANT_ID%" ^
  -d "{\"tenantId\": \"%TENANT_ID%\", \"message\": \"What products do we have in stock?\", \"provider\": \"openai\", \"context\": {\"chatId\": \"chat-123\", \"conversationHistory\": []}}"
echo.
echo.

echo 8. Disable WordPress Integration...
curl -X DELETE "%API_URL%/wordpress/%INTEGRATION_ID%?tenantId=%TENANT_ID%" ^
  -H "X-Tenant-ID: %TENANT_ID%"
echo.
echo.

echo === Tests Complete ===
echo Note: Install jq for Windows (https://stedolan.github.io/jq/) for better JSON formatting
echo Or use: curl ... ^| python -m json.tool
