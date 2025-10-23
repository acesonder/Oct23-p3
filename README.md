# Multi-Portal Outreach System

A comprehensive multi-portal system designed to facilitate communication and service coordination between homeless individuals, addiction recovery clients, mental health users, outreach staff, and service providers.

## Overview

This system provides **four distinct portals** that work together to streamline outreach services:

1. **Client Portal** - For homeless, addicts, and mental health users to communicate their needs
2. **Outreach Staff Portal** - For outreach workers to manage and respond to client needs
3. **Service Provider Portal** - For service organizations to offer and manage services
4. **Admin Portal** - For system administrators to configure and monitor all portals

## Features

### Client Portal
- Submit need requests (food, shelter, medical, mental health, addiction support, etc.)
- Browse available services
- Track request status
- Communicate with outreach staff and service providers
- Schedule appointments
- Manage personal profile
- Anonymous request submission (configurable)

### Outreach Staff Portal
- View and manage all client needs
- Assign needs to self or other staff
- Priority filtering (critical, high, medium, low)
- Forward needs to service providers
- Client management and case notes
- Activity logging
- Communication hub
- Daily reporting and analytics
- Field visit scheduling

### Service Provider Portal
- List and manage services offered
- Receive and respond to forwarded needs
- Accept/decline service requests
- Track service capacity and availability
- Communicate with clients and outreach staff
- Schedule appointments
- Service metrics and reporting

### Admin Portal
- Complete system oversight
- User management (create, edit, deactivate)
- Portal configuration management
- System-wide analytics and reporting
- Data export capabilities
- Health monitoring
- Cross-portal visibility

## Architecture

### Technology Stack
- **Backend**: Node.js with Express
- **Authentication**: JWT (JSON Web Tokens)
- **Data Storage**: In-memory (easily replaceable with database)
- **Security**: bcrypt for password hashing

### Project Structure
```
Oct23-p3/
├── src/
│   ├── server.js                 # Main application entry point
│   ├── config/
│   │   └── portals.config.js     # Configurable portal modules
│   ├── portals/
│   │   ├── client/
│   │   │   └── routes.js         # Client portal API routes
│   │   ├── outreach/
│   │   │   └── routes.js         # Outreach portal API routes
│   │   ├── provider/
│   │   │   └── routes.js         # Provider portal API routes
│   │   └── admin/
│   │       └── routes.js         # Admin portal API routes
│   └── shared/
│       ├── auth/
│       │   ├── index.js          # Authentication utilities
│       │   └── routes.js         # Auth API routes
│       ├── middleware/
│       │   └── auth.js           # Auth middleware
│       └── models/
│           └── index.js          # Data models
├── package.json
├── .env.example
├── README.md
└── FUTURE_ADDONS.md
```

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Oct23-p3
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Quick Start

### Demo Accounts

The system comes with pre-configured demo accounts:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Outreach Staff | outreach1 | outreach123 |
| Service Provider | provider1 | provider123 |
| Client | client1 | client123 |

### API Base URL
```
http://localhost:3000
```

### Authentication Flow

1. **Register a new user**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "client"
}
```

2. **Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "client1",
  "password": "client123"
}
```

Response:
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

3. **Use the token in subsequent requests**
```bash
Authorization: Bearer <token>
```

## API Endpoints

### Client Portal (`/api/client`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/config` | Get portal configuration | No |
| POST | `/needs` | Submit a need request | Optional |
| GET | `/needs` | Get user's needs | Yes |
| GET | `/needs/:id` | Get specific need | Yes |
| GET | `/services` | Browse services | Optional |
| POST | `/messages` | Send message | Yes |
| GET | `/messages` | Get messages | Yes |
| POST | `/appointments` | Create appointment | Yes |
| GET | `/appointments` | Get appointments | Yes |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update profile | Yes |

### Outreach Portal (`/api/outreach`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/config` | Get portal configuration |
| GET | `/needs` | Get all needs (with filters) |
| GET | `/needs/assigned` | Get assigned needs |
| POST | `/needs/:id/assign` | Assign need to self |
| PUT | `/needs/:id` | Update need |
| POST | `/needs/:id/notes` | Add note to need |
| POST | `/needs/:id/forward` | Forward to provider |
| GET | `/clients` | Get all clients |
| GET | `/clients/:id` | Get client details |
| POST | `/clients/:id/needs` | Create need for client |
| GET | `/reports/daily` | Generate daily report |

### Provider Portal (`/api/provider`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/config` | Get portal configuration |
| GET | `/services` | Get provider's services |
| POST | `/services` | Create new service |
| PUT | `/services/:id` | Update service |
| GET | `/requests` | Get forwarded needs |
| POST | `/requests/:id/accept` | Accept request |
| POST | `/requests/:id/decline` | Decline request |
| POST | `/requests/:id/complete` | Mark as completed |
| GET | `/reports/metrics` | Get service metrics |

### Admin Portal (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/config` | Get all portal configs |
| PUT | `/config/:portal` | Update portal config |
| GET | `/users` | Get all users |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| POST | `/users/:id/deactivate` | Deactivate user |
| GET | `/needs` | Get all needs |
| GET | `/services` | Get all services |
| GET | `/reports/analytics` | System analytics |
| GET | `/export/:type` | Export data |
| GET | `/health` | System health check |

## Configuration

The system uses a modular configuration approach defined in `src/config/portals.config.js`. Administrators can easily enable/disable features for each portal.

### Example Configuration

```javascript
client: {
  enabled: true,
  modules: {
    needsRequest: {
      enabled: true,
      categories: ['food', 'shelter', 'medical', 'mental-health', 'addiction'],
      urgencyLevels: ['low', 'medium', 'high', 'critical'],
      allowAnonymous: true
    },
    communication: {
      enabled: true,
      chat: true,
      messaging: true
    }
  }
}
```

## Data Models

### User
- id, username, email, passwordHash, role
- profile, active, createdAt, updatedAt

### Need Request
- id, clientId, category, description, urgency
- status, assignedTo, forwardedTo
- notes[], createdAt, updatedAt

### Service
- id, providerId, name, category, description
- availability, capacity, location
- active, createdAt, updatedAt

### Communication
- id, fromId, toId, type, subject, body
- read, relatedNeedId, createdAt

### Appointment
- id, clientId, providerId, outreachId
- type, scheduledAt, duration, location
- status, notes, createdAt, updatedAt

## Security

- **Authentication**: JWT-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access Control**: Middleware enforces portal access
- **Token Expiration**: Configurable session timeout
- **Data Privacy**: Users can only access their own data (except admins)

## Future Enhancements

See [FUTURE_ADDONS.md](FUTURE_ADDONS.md) for an extensive list of planned features and enhancements, including:
- Mobile applications
- Real-time chat and notifications
- AI-powered need matching
- Integration with external services
- Advanced analytics and reporting
- Multi-language support
- And much more...

## Development

### Running Tests
```bash
npm test
```

### Code Style
The project follows standard JavaScript conventions with consistent indentation and clear commenting.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

## License

ISC License

---

**Note**: This system uses in-memory storage for demonstration purposes. For production deployment, integrate with a persistent database system (PostgreSQL, MongoDB, etc.).