# Deployment Guide

This guide provides instructions for deploying the Multi-Portal Outreach System to production environments.

## Table of Contents
1. [Production Readiness Checklist](#production-readiness-checklist)
2. [Environment Setup](#environment-setup)
3. [Security Hardening](#security-hardening)
4. [Database Integration](#database-integration)
5. [Deployment Options](#deployment-options)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Production Readiness Checklist

Before deploying to production, ensure you complete these tasks:

### Security
- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Enable HTTPS/TLS encryption
- [ ] Implement rate limiting (see Security Hardening section)
- [ ] Set up CORS with specific allowed origins
- [ ] Configure secure session timeouts
- [ ] Enable security headers (helmet middleware)
- [ ] Set up firewall rules
- [ ] Implement input validation middleware
- [ ] Set up SSL certificates

### Database
- [ ] Replace in-memory storage with PostgreSQL/MongoDB
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Implement database migrations
- [ ] Set up read replicas (optional)

### Infrastructure
- [ ] Set up load balancing
- [ ] Configure auto-scaling
- [ ] Set up CDN for static assets
- [ ] Implement caching (Redis)
- [ ] Configure logging aggregation
- [ ] Set up monitoring and alerts
- [ ] Configure health checks

### Code
- [ ] Run comprehensive tests
- [ ] Perform security audit
- [ ] Optimize database queries
- [ ] Implement API versioning
- [ ] Add request validation
- [ ] Set up error tracking (Sentry)

## Environment Setup

### 1. Environment Variables

Create a production `.env` file:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-very-strong-secret-key-min-32-characters
JWT_EXPIRES_IN=8h

# Database Configuration
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=outreach_portals_prod
DB_USER=prod_user
DB_PASSWORD=strong-database-password
DB_SSL=true

# Redis Configuration (for caching and sessions)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=strong-redis-password

# CORS Configuration
ALLOWED_ORIGINS=https://client.yourdomain.com,https://outreach.yourdomain.com,https://provider.yourdomain.com,https://admin.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/outreach-system/app.log

# Email Configuration (for notifications)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=email-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 2. Install Production Dependencies

```bash
npm install --production
```

### 3. Additional Production Dependencies

Add these to `package.json`:

```json
{
  "dependencies": {
    "express-rate-limit": "^6.7.0",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "winston": "^3.8.2",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "joi": "^17.9.0",
    "@sentry/node": "^7.57.0"
  }
}
```

## Security Hardening

### 1. Add Rate Limiting

Create `src/shared/middleware/rateLimiter.js`:

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit to 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.',
});

// Limiter for need submission (prevent spam)
const needLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 need submissions per hour
  message: 'Too many need submissions, please try again later.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  needLimiter
};
```

Update `src/server.js`:

```javascript
const { apiLimiter, authLimiter, needLimiter } = require('./shared/middleware/rateLimiter');
const helmet = require('helmet');
const compression = require('compression');

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/client/needs', needLimiter);
```

### 2. Add Helmet Security Headers

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. Configure CORS

```javascript
const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 4. Add Input Validation

Create `src/shared/middleware/validation.js`:

```javascript
const Joi = require('joi');

function validateNeedRequest(req, res, next) {
  const schema = Joi.object({
    category: Joi.string().valid('food', 'shelter', 'medical', 'mental-health', 'addiction', 'clothing', 'legal', 'employment').required(),
    description: Joi.string().min(10).max(500).required(),
    urgency: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    location: Joi.string().max(200).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}

module.exports = {
  validateNeedRequest
};
```

## Database Integration

### PostgreSQL Setup

1. **Install PostgreSQL adapter:**
```bash
npm install pg sequelize
```

2. **Create database models using Sequelize:**

Create `src/database/config.js`:
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    ssl: process.env.DB_SSL === 'true',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
```

3. **Create migration scripts** to convert in-memory models to database models

4. **Update model files** to use Sequelize instead of in-memory Map

### MongoDB Setup (Alternative)

1. **Install MongoDB adapter:**
```bash
npm install mongoose
```

2. **Create connection:**
```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

3. **Convert models to Mongoose schemas**

## Deployment Options

### Option 1: Docker Deployment

1. **Create `Dockerfile`:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Create `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: outreach_portals
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

3. **Deploy:**
```bash
docker-compose up -d
```

### Option 2: AWS Deployment

#### Using Elastic Beanstalk:

1. **Install EB CLI:**
```bash
pip install awsebcli
```

2. **Initialize:**
```bash
eb init outreach-system
```

3. **Create environment:**
```bash
eb create production-env
```

4. **Deploy:**
```bash
eb deploy
```

#### Using ECS (Elastic Container Service):

1. Build and push Docker image to ECR
2. Create ECS cluster
3. Define task definition
4. Create service with load balancer
5. Set up auto-scaling policies

### Option 3: Heroku Deployment

1. **Create `Procfile`:**
```
web: npm start
```

2. **Deploy:**
```bash
heroku create outreach-system
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

### Option 4: DigitalOcean App Platform

1. Connect GitHub repository
2. Configure environment variables
3. Add PostgreSQL and Redis databases
4. Deploy

### Option 5: Traditional VPS (Ubuntu)

1. **Set up server:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Clone and setup application:**
```bash
git clone <repository-url>
cd Oct23-p3
npm install --production
```

3. **Start with PM2:**
```bash
pm2 start src/server.js --name outreach-system
pm2 save
pm2 startup
```

4. **Configure Nginx as reverse proxy:**

Create `/etc/nginx/sites-available/outreach-system`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

5. **Enable site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/outreach-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Set up SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Monitoring and Maintenance

### 1. Set up Logging

Use Winston for structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

### 2. Set up Error Tracking

Use Sentry:

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 3. Health Checks

The `/health` endpoint is already implemented. Set up monitoring tools to check it regularly:

- **Uptime monitoring**: UptimeRobot, Pingdom, or StatusCake
- **Application monitoring**: New Relic, DataDog, or AppDynamics
- **Log aggregation**: ELK Stack, Splunk, or Loggly

### 4. Backup Strategy

Set up automated backups:

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

Add to crontab for daily execution:
```bash
0 2 * * * /path/to/backup-script.sh
```

### 5. Performance Monitoring

Key metrics to monitor:
- API response times
- Error rates
- Database query performance
- Memory and CPU usage
- Request rates per endpoint
- User authentication success/failure rates

### 6. Scaling Considerations

As your system grows:
- Implement horizontal scaling with load balancers
- Use database read replicas
- Implement caching strategies (Redis)
- Consider microservices architecture
- Set up CDN for static content
- Implement queue systems for async tasks

## Post-Deployment

### 1. Smoke Testing

Run these tests after deployment:

```bash
# Health check
curl https://yourdomain.com/health

# Login test
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Create need test (with token from login)
curl -X POST https://yourdomain.com/api/client/needs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"shelter","description":"Test","urgency":"low"}'
```

### 2. Monitoring Setup

Configure alerts for:
- Server downtime
- High error rates
- Slow response times
- Database connection issues
- High memory/CPU usage

### 3. Documentation

Update documentation with:
- Production URLs
- Deployment procedures
- Rollback procedures
- Incident response procedures
- On-call rotation

## Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

**2. Database connection issues:**
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall rules
- Verify database credentials

**3. High memory usage:**
- Check for memory leaks
- Implement connection pooling
- Add request size limits
- Enable compression

**4. Slow API responses:**
- Add database indexes
- Implement caching
- Optimize queries
- Use CDN for static assets

## Security Best Practices

1. Keep all dependencies updated
2. Use environment variables for secrets
3. Implement IP whitelisting for admin portal
4. Regular security audits
5. Implement WAF (Web Application Firewall)
6. Regular penetration testing
7. Implement data encryption at rest
8. Regular backup testing
9. Incident response plan
10. GDPR/HIPAA compliance (if applicable)

## Maintenance Schedule

**Daily:**
- Monitor error logs
- Check system health
- Review performance metrics

**Weekly:**
- Review security alerts
- Check backup integrity
- Update dependencies

**Monthly:**
- Security audit
- Performance optimization review
- Capacity planning review

**Quarterly:**
- Disaster recovery drill
- Full system audit
- Update documentation

---

For questions or issues, refer to the main README.md or open an issue on GitHub.