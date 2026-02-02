# WordPress Integration Module

This module integrates WordPress sites with the WhatsApp Bot, allowing automatic synchronization of product data and making it available as context for AI responses.

## Features

- 🔗 **Connect Multiple WordPress Sites**: Each tenant can connect to multiple WordPress instances
- 🔄 **Automatic Data Sync**: Fetch products, posts, and pages from WordPress
- ⚙️ **Configurable Fields**: Select which product fields to synchronize (name, price, description, images, etc.)
- 🤖 **AI Context Integration**: WordPress products available as context for AI responses
- 🔐 **Secure Authentication**: Basic Auth support for WordPress REST API
- 📅 **Scheduled Sync**: Configurable sync frequency (default: 3600 seconds)

## API Endpoints

### Connect WordPress Site
```http
POST /wordpress/connect
Content-Type: application/json
```

**Request:**
```json
{
  "siteUrl": "https://example.com",
  "username": "wp_user",
  "appPassword": "xxxx xxxx xxxx xxxx xxxx xxxx",
  "syncProducts": true,
  "syncPosts": false,
  "syncPages": false,
  "productFields": ["name", "price", "description", "images", "categories"],
  "syncFrequency": 3600
}
```

**Response:**
```json
{
  "id": "uuid",
  "tenantId": "tenant-id",
  "siteUrl": "https://example.com",
  "status": "connected",
  "syncProducts": true,
  "lastSyncedAt": "2024-01-15T10:30:00Z"
}
```

### Configure Sync Fields
```http
POST /wordpress/:integrationId/configure
Content-Type: application/json
```

**Request:**
```json
{
  "integrationId": "uuid",
  "productFields": ["name", "price", "description", "images", "stock", "status"],
  "syncFrequency": 7200
}
```

### Manual Sync
```http
POST /wordpress/:integrationId/sync
Content-Type: application/json
```

**Request:**
```json
{
  "integrationId": "uuid",
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "productsSync": 45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### List Integrations
```http
GET /wordpress/integrations?tenantId=xxx
```

**Response:**
```json
[
  {
    "id": "uuid",
    "siteUrl": "https://example.com",
    "syncProducts": true,
    "lastSyncedAt": "2024-01-15T10:30:00Z",
    "productCount": 45
  }
]
```

### Get Integration Details
```http
GET /wordpress/:integrationId?tenantId=xxx
```

### Disable Integration
```http
DELETE /wordpress/:integrationId?tenantId=xxx
```

## Data Models

### WordPressIntegration
Stores WordPress site configuration and connection details.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Integration ID |
| tenantId | UUID | Multi-tenant isolation |
| siteUrl | String | WordPress site URL (e.g., https://example.com) |
| apiUrl | String | WordPress REST API URL |
| username | String | WordPress API user |
| appPassword | String | Application-specific password (encrypted in DB) |
| syncProducts | Boolean | Enable product sync |
| syncPosts | Boolean | Enable post sync |
| syncPages | Boolean | Enable page sync |
| productFields | JSON Array | Selected fields to sync |
| lastSyncedAt | DateTime | Last successful sync timestamp |
| syncFrequency | Int | Sync interval in seconds (default: 3600) |
| createdAt | DateTime | Integration creation date |
| updatedAt | DateTime | Last modification date |

### WordPressProduct
Cached product data from connected WordPress sites.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Product ID |
| tenantId | UUID | Multi-tenant isolation |
| wpProductId | Int | WordPress product ID |
| name | String | Product name |
| slug | String | URL slug |
| description | String | Product description (HTML) |
| price | Decimal | Current price |
| regularPrice | Decimal | Regular price |
| salePrice | Decimal | Sale price (if applicable) |
| image | String | Featured image URL |
| images | JSON Array | All product images |
| categories | JSON Array | Product categories |
| tags | JSON Array | Product tags |
| attributes | JSON Object | Product attributes |
| stock | Int | Stock quantity |
| status | String | Product status (publish/draft/etc) |
| syncedAt | DateTime | Last sync timestamp |

## Usage in AI Context

When processing messages with AI, the IAModule automatically:

1. Fetches connected WordPress integrations for the tenant
2. Retrieves relevant products based on user query
3. Includes product information in the system prompt
4. Makes products available for AI to reference in responses

Example AI context:
```
Available WordPress Products:
- Product Name: "High Performance Laptop"
  Price: $1299.99
  Stock: 15 units
  Categories: Electronics, Computers
  Description: A powerful laptop perfect for professionals...
```

## Architecture

```
WordPressModule
├── wordpress.service.ts      (Core logic: API calls, data sync, queries)
├── wordpress.controller.ts   (REST endpoints)
├── wordpress.module.ts       (NestJS module setup)
└── dto/
    └── wordpress.dto.ts      (Data transfer objects with validation)
```

## Integration Flow

```
1. User connects WordPress site
   ↓
2. Service validates API credentials
   ↓
3. Integration saved to database
   ↓
4. (Optional) Trigger manual sync
   ↓
5. Service fetches products from WordPress REST API
   ↓
6. Products cached in local database
   ↓
7. When IA processes messages, products available as context
```

## Security Considerations

- **App Passwords**: Use WordPress application-specific passwords (not main user password)
- **HTTPS Only**: Always use HTTPS for WordPress API URLs
- **Tenant Isolation**: Each query scoped to specific tenant
- **Field Whitelisting**: Only configured fields are synced
- **Rate Limiting**: Implement rate limiting on sync endpoints

## Configuration

Environment variables (optional):
```
WORDPRESS_SYNC_BATCH_SIZE=100    # Products per sync request
WORDPRESS_TIMEOUT=30000           # API timeout in milliseconds
WORDPRESS_RETRY_ATTEMPTS=3        # Retry failed syncs
```

## Troubleshooting

### Connection Failed
- Verify WordPress site URL is correct
- Ensure REST API is enabled on WordPress
- Check application password has correct permissions

### Products Not Syncing
- Verify products exist on WordPress
- Check field names match WordPress REST API
- Review sync frequency (default 3600 seconds = 1 hour)

### Missing Images
- Ensure WordPress images are publicly accessible
- Check image URLs are valid HTTP(S) URLs
- Verify WordPress REST API returns image data

## Future Enhancements

- [ ] Webhook support for real-time sync
- [ ] Category filtering
- [ ] Product search/filtering API
- [ ] Inventory level alerts
- [ ] Price change notifications
- [ ] Multi-language support
