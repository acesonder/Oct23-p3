/**
 * Main Server Application
 * Multi-Portal System for Outreach Services
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { User } = require('./shared/models');
const { hashPassword } = require('./shared/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const authRoutes = require('./shared/auth/routes');
const clientRoutes = require('./portals/client/routes');
const outreachRoutes = require('./portals/outreach/routes');
const providerRoutes = require('./portals/provider/routes');
const adminRoutes = require('./portals/admin/routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Multi-Portal Outreach System API',
    version: '1.0.0',
    portals: {
      client: '/api/client',
      outreach: '/api/outreach',
      provider: '/api/provider',
      admin: '/api/admin'
    },
    auth: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize demo data
async function initializeDemoData() {
  console.log('Initializing demo data...');
  
  try {
    // Create demo users for each role
    const demoUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        profile: { name: 'System Administrator' }
      },
      {
        username: 'outreach1',
        email: 'outreach@example.com',
        password: 'outreach123',
        role: 'outreach',
        profile: { name: 'Jane Smith', department: 'Street Outreach' }
      },
      {
        username: 'provider1',
        email: 'provider@example.com',
        password: 'provider123',
        role: 'provider',
        profile: { name: 'Community Health Center', organization: 'Health Services Inc' }
      },
      {
        username: 'client1',
        email: 'client@example.com',
        password: 'client123',
        role: 'client',
        profile: { name: 'John Doe' }
      }
    ];

    for (const userData of demoUsers) {
      if (!User.findByUsername(userData.username)) {
        const passwordHash = await hashPassword(userData.password);
        User.create({
          username: userData.username,
          email: userData.email,
          passwordHash,
          role: userData.role,
          profile: userData.profile
        });
        console.log(`Created demo user: ${userData.username} (${userData.role})`);
      }
    }

    console.log('Demo data initialized successfully');
    console.log('\nDemo credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Outreach: username=outreach1, password=outreach123');
    console.log('Provider: username=provider1, password=provider123');
    console.log('Client: username=client1, password=client123');
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
}

// Start server
async function startServer() {
  try {
    await initializeDemoData();
    
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log('Multi-Portal Outreach System API Server');
      console.log(`${'='.repeat(60)}`);
      console.log(`Server running on port ${PORT}`);
      console.log(`API Base URL: http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`\nPortals:`);
      console.log(`  Client Portal:   http://localhost:${PORT}/api/client`);
      console.log(`  Outreach Portal: http://localhost:${PORT}/api/outreach`);
      console.log(`  Provider Portal: http://localhost:${PORT}/api/provider`);
      console.log(`  Admin Portal:    http://localhost:${PORT}/api/admin`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
