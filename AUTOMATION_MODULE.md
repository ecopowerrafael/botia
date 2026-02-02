# AutomationModule - Drip & Mass Campaigns

## Overview
The AutomationModule provides messaging automation capabilities with two main campaign types:

### 1. **Drip Campaigns** (Gotejamento)
Sequential messaging to a single contact with configurable delays between messages.

**Key Features:**
- Multiple steps with customizable delays (in seconds)
- Optional media URL support for each step
- Scheduling with optional start date
- Repeat functionality for recurring campaigns
- Real-time status tracking

**Use Case:** Progressive customer onboarding, educational sequences, follow-up campaigns

**Example Flow:**
```
Day 1 - 09:00 → Step 1: Welcome message
Day 2 - 10:00 → Step 2: Product introduction
Day 3 - 15:00 → Step 3: Special offer
```

### 2. **Mass Campaigns** (Envio em Massa)
Bulk messaging to multiple contacts with variable personalization and random delays.

**Key Features:**
- Send to unlimited contacts simultaneously
- Configurable delays between messages (milliseconds)
- Random delay variance to avoid spam detection
- Template variable substitution: `{name}`, `{email}`, etc.
- Automatic failure tracking and retry capability
- Success rate calculation

**Use Case:** Promotional announcements, mass notifications, targeted customer segments

**Example Flow:**
```
Contact 1 (05:000ms) → "Hi {name}, special offer for you!"
Contact 2 (15:234ms) → "Hi {name}, special offer for you!"
Contact 3 (22:891ms) → "Hi {name}, special offer for you!"
```

## API Endpoints

### Create Drip Campaign
```http
POST /automation/drip
Content-Type: application/json

{
  "tenantId": "tenant-uuid",
  "name": "Welcome Sequence",
  "description": "3-step onboarding sequence",
  "instanceKey": "instance-key",
  "contactId": "contact-uuid",     // OR contactPhones array
  "steps": [
    {
      "delay": 0,                   // seconds
      "message": "Welcome!",
      "mediaUrl": "https://..."     // optional
    },
    {
      "delay": 86400,               // 24 hours
      "message": "Check out our products",
      "mediaUrl": "https://..."
    },
    {
      "delay": 172800,              // 48 hours
      "message": "Special 20% off!"
    }
  ],
  "startDate": "2024-01-15T09:00:00Z",  // optional
  "repeat": false                        // optional, default: false
}

Response:
{
  "success": true,
  "schedule": {
    "id": "schedule-uuid",
    "tenantId": "tenant-uuid",
    "name": "Welcome Sequence",
    "type": "DRIP",
    "status": "PENDING",
    "createdAt": "2024-01-14T10:00:00Z"
  }
}
```

### Create Mass Campaign
```http
POST /automation/mass
Content-Type: application/json

{
  "tenantId": "tenant-uuid",
  "name": "New Year Promo",
  "description": "Send 20% off offer to all customers",
  "instanceKey": "instance-key",
  "message": "Hi {name}! 🎉 Get 20% off with code: NEWYEAR20. Valid until {expiryDate}",
  "contactPhones": [
    "5511987654321",
    "5511987654322",
    "5511987654323"
  ],
  "delayBetweenMessages": 5000,        // milliseconds
  "randomDelayMax": 10000,             // adds 0-10s random delay to each message
  "variables": {
    "name": "Valued Customer",
    "expiryDate": "2024-12-31"
  }
}

Response:
{
  "success": true,
  "schedule": {
    "id": "schedule-uuid",
    "type": "MASS",
    "status": "PENDING"
  },
  "totalContacts": 3
}
```

### List Campaigns
```http
GET /automation/campaigns?tenantId=tenant-uuid&type=DRIP&status=ACTIVE

Response:
[
  {
    "id": "schedule-uuid",
    "tenantId": "tenant-uuid",
    "name": "Welcome Sequence",
    "type": "DRIP",
    "status": "ACTIVE",
    "createdAt": "2024-01-14T10:00:00Z"
  },
  ...
]
```

### Get Campaign Details
```http
GET /automation/campaigns/schedule-uuid?tenantId=tenant-uuid

Response:
{
  "id": "schedule-uuid",
  "tenantId": "tenant-uuid",
  "name": "Welcome Sequence",
  "type": "DRIP",
  "status": "RUNNING",
  "target": "[\"contact-uuid\"]",
  "payload": {
    "instanceKey": "instance-key",
    "steps": [...],
    "description": "3-step onboarding"
  },
  "runAt": "2024-01-15T09:00:00Z",
  "createdAt": "2024-01-14T10:00:00Z"
}
```

### Get Campaign Statistics
```http
GET /automation/campaigns/schedule-uuid/stats?tenantId=tenant-uuid

Response:
{
  "campaignId": "schedule-uuid",
  "type": "MASS",
  "name": "New Year Promo",
  "status": "COMPLETED",
  "totalContacts": 1000,
  "sentCount": 987,
  "failedCount": 13,
  "successRate": "98.70",
  "createdAt": "2024-01-14T10:00:00Z"
}
```

### Pause Campaign
```http
PUT /automation/campaigns/schedule-uuid/pause

Response:
{
  "success": true,
  "message": "Campaign paused"
}
```

### Resume Campaign
```http
PUT /automation/campaigns/schedule-uuid/resume

Response:
{
  "success": true,
  "message": "Campaign resumed"
}
```

### Delete Campaign
```http
DELETE /automation/campaigns/schedule-uuid

Response:
{
  "success": true,
  "message": "Campaign deleted"
}
```

## Architecture

### Service: `automation.service.ts`
Handles business logic for scheduling and campaign processing.

**Key Methods:**
- `createDripCampaign(dto)` - Create and start drip campaign
- `createMassCampaign(dto)` - Create and start mass campaign
- `processDripStep()` - Recursively process each step with delays
- `processMassCampaign()` - Parallel messaging with random delays
- `pauseCampaign()` - Stop active campaign
- `resumeCampaign()` - Restart paused campaign
- `listCampaigns()` - List all campaigns with filtering
- `getCampaignStats()` - Get detailed campaign statistics

### Integration Points

**WhatsAppService Integration:**
```typescript
await this.whatsappService.sendMessage({
  tenantId,
  instanceKey,
  phoneNumber: phone,
  message: personalizedMessage,
});
```

**PrismaService Integration:**
- Stores campaign definitions in `Schedule` model
- Logs execution in database
- Tracks contact send history

### Message Personalization
Variables are substituted in message templates using `{key}` syntax:

```typescript
const message = "Hi {name}! Your code: {code}";
const variables = { name: "João", code: "ABC123" };
// Result: "Hi João! Your code: ABC123"
```

## Database Schema

### Schedule Model
```prisma
model Schedule {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  name      String
  type      ScheduleType   // DRIP | MASS
  status    ScheduleStatus // PENDING | ACTIVE | PAUSED | COMPLETED | FAILED
  target    String         // JSON stringified contact IDs or phones
  payload   Json           // Campaign configuration and stats
  
  runAt     DateTime
  createdAt DateTime @default(now())
  
  @@index([tenantId])
  @@index([status])
}

enum ScheduleType {
  DRIP
  MASS
}

enum ScheduleStatus {
  PENDING
  ACTIVE
  RUNNING
  PAUSED
  COMPLETED
  FAILED
}
```

## Error Handling

All endpoints validate:
- ✅ Tenant exists in database
- ✅ WhatsApp instance is active
- ✅ Contact phones are valid format
- ✅ Campaign exists before modification

**HTTP Status Codes:**
- `200 OK` - Successful operation
- `400 Bad Request` - Missing/invalid parameters
- `404 Not Found` - Campaign or tenant doesn't exist
- `500 Internal Server Error` - Unexpected error

## Performance Considerations

**Drip Campaigns:**
- Uses Node.js `setTimeout()` for scheduling
- No database polling - completely event-driven
- Memory efficient: stores only active campaign timeouts

**Mass Campaigns:**
- Sequential sending with configurable delays
- Random delay variance (0-randomDelayMax ms) prevents WhatsApp rate limiting
- Non-blocking: returns immediately after scheduling

**Example Performance:**
- 1,000 contacts with 5s delay + 10s random = ~2-3 hours total send time
- No memory leaks: async/await cleanup on completion

## Security & Multi-Tenancy

✅ **Enforced per endpoint:**
- `tenantId` validation on all operations
- Contacts belong to correct tenant
- WhatsApp instances isolated by tenant
- Cross-tenant data access prevented

## Future Enhancements

- [ ] Cron-based scheduling for recurring campaigns (daily/weekly)
- [ ] A/B testing support with variant tracking
- [ ] Advanced analytics: open rates, click tracking
- [ ] Integration with IA module for dynamic content generation
- [ ] Webhook callbacks for campaign events
- [ ] Rate limiting per tenant/instance

## Testing

To test locally:

```bash
# Create drip campaign
curl -X POST http://localhost:3000/automation/drip \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "YOUR_TENANT_ID",
    "name": "Test Campaign",
    "instanceKey": "YOUR_INSTANCE_KEY",
    "contactPhones": ["551199999999"],
    "steps": [{
      "delay": 0,
      "message": "Test message"
    }]
  }'

# List campaigns
curl http://localhost:3000/automation/campaigns?tenantId=YOUR_TENANT_ID

# Get stats
curl http://localhost:3000/automation/campaigns/YOUR_CAMPAIGN_ID/stats?tenantId=YOUR_TENANT_ID
```

## Module Registration

The `AutomationModule` is already registered in [app.module.ts](../app.module.ts):

```typescript
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  PrismaModule,
  TenantModule,
  IAModule,
  WhatsAppModule,
  KnowledgeModule,
  AutomationModule,  // ✅ Registered here
]
```

No additional setup required. Ready for production deployment!
