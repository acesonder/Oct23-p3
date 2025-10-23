# API Testing Guide

This guide provides quick examples for testing the Multi-Portal Outreach System API.

## Prerequisites

Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Outreach Staff | outreach1 | outreach123 |
| Service Provider | provider1 | provider123 |
| Client | client1 | client123 |

## Authentication

### Login as Client
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "client1",
    "password": "client123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "client1",
    "email": "client@example.com",
    "role": "client"
  }
}
```

Save the token for subsequent requests:
```bash
export TOKEN="your-token-here"
```

### Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newclient",
    "email": "newclient@example.com",
    "password": "password123",
    "role": "client"
  }'
```

## Client Portal Tests

### Submit a Need Request
```bash
curl -X POST http://localhost:3000/api/client/needs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "category": "shelter",
    "description": "Need emergency shelter tonight due to cold weather",
    "urgency": "high",
    "location": "Downtown area"
  }'
```

### Get My Needs
```bash
curl http://localhost:3000/api/client/needs \
  -H "Authorization: Bearer $TOKEN"
```

### Browse Available Services
```bash
curl http://localhost:3000/api/client/services
```

### Send a Message
```bash
curl -X POST http://localhost:3000/api/client/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "toId": "outreach-staff-id",
    "subject": "Question about housing",
    "body": "Can you help me find housing?"
  }'
```

### Create an Appointment
```bash
curl -X POST http://localhost:3000/api/client/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "outreachId": "outreach-staff-id",
    "type": "office",
    "scheduledAt": "2025-10-25T14:00:00Z",
    "notes": "Follow-up meeting"
  }'
```

## Outreach Staff Portal Tests

First, login as outreach staff:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "outreach1",
    "password": "outreach123"
  }'

export OUTREACH_TOKEN="token-from-response"
```

### View All Needs
```bash
curl http://localhost:3000/api/outreach/needs \
  -H "Authorization: Bearer $OUTREACH_TOKEN"
```

### Filter by Urgency
```bash
curl "http://localhost:3000/api/outreach/needs?urgency=high" \
  -H "Authorization: Bearer $OUTREACH_TOKEN"
```

### Assign Need to Self
```bash
curl -X POST http://localhost:3000/api/outreach/needs/{need-id}/assign \
  -H "Authorization: Bearer $OUTREACH_TOKEN"
```

### Add Note to Need
```bash
curl -X POST http://localhost:3000/api/outreach/needs/{need-id}/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OUTREACH_TOKEN" \
  -d '{
    "text": "Contacted client, will follow up tomorrow"
  }'
```

### Forward Need to Provider
```bash
curl -X POST http://localhost:3000/api/outreach/needs/{need-id}/forward \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OUTREACH_TOKEN" \
  -d '{
    "providerId": "provider-id",
    "message": "Please assist with this shelter request"
  }'
```

### Get All Clients
```bash
curl http://localhost:3000/api/outreach/clients \
  -H "Authorization: Bearer $OUTREACH_TOKEN"
```

### Generate Daily Report
```bash
curl http://localhost:3000/api/outreach/reports/daily \
  -H "Authorization: Bearer $OUTREACH_TOKEN"
```

## Service Provider Portal Tests

Login as provider:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "provider1",
    "password": "provider123"
  }'

export PROVIDER_TOKEN="token-from-response"
```

### Create a Service
```bash
curl -X POST http://localhost:3000/api/provider/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "name": "Emergency Shelter",
    "category": "shelter",
    "description": "24/7 emergency shelter with 50 beds",
    "availability": "available",
    "capacity": 50,
    "location": "123 Main St",
    "contactInfo": {
      "phone": "555-0100",
      "email": "shelter@example.com"
    }
  }'
```

### View Service Requests
```bash
curl http://localhost:3000/api/provider/requests \
  -H "Authorization: Bearer $PROVIDER_TOKEN"
```

### Accept a Request
```bash
curl -X POST http://localhost:3000/api/provider/requests/{need-id}/accept \
  -H "Authorization: Bearer $PROVIDER_TOKEN"
```

### Complete a Request
```bash
curl -X POST http://localhost:3000/api/provider/requests/{need-id}/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "notes": "Client successfully placed in shelter"
  }'
```

### Get Service Metrics
```bash
curl http://localhost:3000/api/provider/reports/metrics \
  -H "Authorization: Bearer $PROVIDER_TOKEN"
```

## Admin Portal Tests

Login as admin:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

export ADMIN_TOKEN="token-from-response"
```

### Get All Users
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Filter Users by Role
```bash
curl "http://localhost:3000/api/admin/users?role=client" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Create New User
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "username": "newoutreach",
    "email": "newoutreach@example.com",
    "password": "password123",
    "role": "outreach",
    "profile": {
      "name": "Jane Smith",
      "department": "Street Outreach"
    }
  }'
```

### Get System Analytics
```bash
curl http://localhost:3000/api/admin/reports/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Export Data
```bash
curl http://localhost:3000/api/admin/export/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### System Health Check
```bash
curl http://localhost:3000/api/admin/health \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### View Portal Configuration
```bash
curl http://localhost:3000/api/admin/config \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Testing Complete Workflow

### Scenario: Client Requests Shelter, Outreach Forwards to Provider

1. **Client submits need:**
```bash
# Login as client
CLIENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client1","password":"client123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Submit shelter need
NEED_RESPONSE=$(curl -s -X POST http://localhost:3000/api/client/needs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{
    "category": "shelter",
    "description": "Urgent shelter needed",
    "urgency": "high"
  }')

NEED_ID=$(echo $NEED_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Need ID: $NEED_ID"
```

2. **Outreach staff assigns and forwards:**
```bash
# Login as outreach
OUTREACH_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"outreach1","password":"outreach123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Assign to self
curl -X POST http://localhost:3000/api/outreach/needs/$NEED_ID/assign \
  -H "Authorization: Bearer $OUTREACH_TOKEN"

# Get provider ID
PROVIDER_ID=$(curl -s http://localhost:3000/api/outreach/providers \
  -H "Authorization: Bearer $OUTREACH_TOKEN" | \
  grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Forward to provider
curl -X POST http://localhost:3000/api/outreach/needs/$NEED_ID/forward \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OUTREACH_TOKEN" \
  -d "{
    \"providerId\": \"$PROVIDER_ID\",
    \"message\": \"Urgent shelter request\"
  }"
```

3. **Provider accepts and completes:**
```bash
# Login as provider
PROVIDER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"provider1","password":"provider123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Accept request
curl -X POST http://localhost:3000/api/provider/requests/$NEED_ID/accept \
  -H "Authorization: Bearer $PROVIDER_TOKEN"

# Complete request
curl -X POST http://localhost:3000/api/provider/requests/$NEED_ID/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "notes": "Client placed in shelter bed #23"
  }'
```

4. **Admin views analytics:**
```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# View analytics
curl http://localhost:3000/api/admin/reports/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

## Using Postman

Import these as a Postman collection:

1. Set base URL: `http://localhost:3000`
2. Create environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `clientToken`: (set after login)
   - `outreachToken`: (set after login)
   - `providerToken`: (set after login)
   - `adminToken`: (set after login)

3. Add Authorization header to requests:
   - Type: Bearer Token
   - Token: `{{clientToken}}` (or appropriate role token)

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

## Tips

1. **Save tokens**: After login, save the token in an environment variable
2. **Use jq for formatting**: Pipe responses through `jq` for better formatting
3. **Check status**: Use `-i` flag with curl to see HTTP status codes
4. **Verbose output**: Use `-v` flag for debugging
5. **Pretty print JSON**: Use `python3 -m json.tool` to format JSON responses

## Next Steps

- Explore the full API documentation in README.md
- Check FUTURE_ADDONS.md for upcoming features
- Review src/config/portals.config.js for customization options
- Integrate with your frontend application