/**
 * Admin Portal Routes
 * Portal for administrators to manage all portals, users, and configurations
 */

const express = require('express');
const router = express.Router();
const { authenticate, portalAccess } = require('../../shared/middleware/auth');
const { User, NeedRequest, Service, Communication, Appointment, storage } = require('../../shared/models');
const portalConfig = require('../../config/portals.config');
const { hashPassword } = require('../../shared/auth');

// Get all portal configurations
router.get('/config', authenticate, portalAccess('admin'), (req, res) => {
  res.json({
    portals: portalConfig,
    message: 'Portal configurations retrieved successfully'
  });
});

// Update portal configuration (simulated - in production this would write to config file)
router.put('/config/:portal', authenticate, portalAccess('admin'), (req, res) => {
  const { portal } = req.params;
  const updates = req.body;

  if (!portalConfig[portal]) {
    return res.status(404).json({ error: 'Portal not found' });
  }

  // In production, this would update the configuration file
  // For now, we'll just validate and return success
  res.json({
    message: `Configuration for ${portal} portal would be updated`,
    currentConfig: portalConfig[portal],
    requestedUpdates: updates,
    note: 'In production, this would persist changes to configuration file'
  });
});

// User Management - Get all users
router.get('/users', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const { role, active } = req.query;
    let users = User.getAll();

    if (role) {
      users = users.filter(u => u.role === role);
    }
    if (active !== undefined) {
      users = users.filter(u => u.active === (active === 'true'));
    }

    // Remove password hashes
    const userList = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      profile: u.profile,
      active: u.active,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    res.json({ users: userList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user
router.get('/users/:id', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const user = User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's related data
    let relatedData = {};
    
    if (user.role === 'client') {
      relatedData.needs = NeedRequest.findByClient(user.id);
      relatedData.appointments = Appointment.findByClient(user.id);
    } else if (user.role === 'outreach') {
      relatedData.assignedNeeds = NeedRequest.findByAssignee(user.id);
      relatedData.appointments = Appointment.findByOutreach(user.id);
    } else if (user.role === 'provider') {
      relatedData.services = Service.findByProvider(user.id);
      relatedData.forwardedNeeds = NeedRequest.getAll().filter(n => n.forwardedTo === user.id);
      relatedData.appointments = Appointment.findByProvider(user.id);
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      relatedData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/users', authenticate, portalAccess('admin'), async (req, res) => {
  try {
    const { username, email, password, role, profile } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    if (User.findByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    if (User.findByEmail(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Validate role
    const validRoles = ['client', 'outreach', 'provider', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const passwordHash = await hashPassword(password);
    
    const user = User.create({
      username,
      email,
      passwordHash,
      role,
      profile: profile || {}
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', authenticate, portalAccess('admin'), async (req, res) => {
  try {
    const user = User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, email, password, role, profile, active } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (profile) updates.profile = { ...user.profile, ...profile };
    if (active !== undefined) updates.active = active;
    if (password) {
      updates.passwordHash = await hashPassword(password);
    }

    user.update(updates);

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate user
router.post('/users/:id/deactivate', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const user = User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.update({ active: false });

    res.json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        username: user.username,
        active: user.active
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Get all needs (system-wide view)
router.get('/needs', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const { status, category, urgency } = req.query;
    let needs = NeedRequest.getAll();

    if (status) {
      needs = needs.filter(n => n.status === status);
    }
    if (category) {
      needs = needs.filter(n => n.category === category);
    }
    if (urgency) {
      needs = needs.filter(n => n.urgency === urgency);
    }

    res.json({ needs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch needs' });
  }
});

// Get all services (system-wide view)
router.get('/services', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const { category, availability } = req.query;
    let services = Service.getAll();

    if (category) {
      services = services.filter(s => s.category === category);
    }
    if (availability) {
      services = services.filter(s => s.availability === availability);
    }

    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get all communications (for monitoring)
router.get('/communications', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const { fromId, toId, type } = req.query;
    let communications = Array.from(storage.communications.values());

    if (fromId) {
      communications = communications.filter(c => c.fromId === fromId);
    }
    if (toId) {
      communications = communications.filter(c => c.toId === toId);
    }
    if (type) {
      communications = communications.filter(c => c.type === type);
    }

    res.json({ communications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Get all appointments (system-wide view)
router.get('/appointments', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const { status, type } = req.query;
    let appointments = Array.from(storage.appointments.values());

    if (status) {
      appointments = appointments.filter(a => a.status === status);
    }
    if (type) {
      appointments = appointments.filter(a => a.type === type);
    }

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// System analytics and reporting
router.get('/reports/analytics', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const users = User.getAll();
    const needs = NeedRequest.getAll();
    const services = Service.getAll();
    const communications = Array.from(storage.communications.values());
    const appointments = Array.from(storage.appointments.values());

    const report = {
      timestamp: new Date().toISOString(),
      users: {
        total: users.length,
        byRole: {
          client: users.filter(u => u.role === 'client').length,
          outreach: users.filter(u => u.role === 'outreach').length,
          provider: users.filter(u => u.role === 'provider').length,
          admin: users.filter(u => u.role === 'admin').length
        },
        active: users.filter(u => u.active).length,
        inactive: users.filter(u => !u.active).length
      },
      needs: {
        total: needs.length,
        byStatus: {
          pending: needs.filter(n => n.status === 'pending').length,
          assigned: needs.filter(n => n.status === 'assigned').length,
          inProgress: needs.filter(n => n.status === 'in-progress').length,
          completed: needs.filter(n => n.status === 'completed').length,
          declined: needs.filter(n => n.status === 'declined').length
        },
        byUrgency: {
          critical: needs.filter(n => n.urgency === 'critical').length,
          high: needs.filter(n => n.urgency === 'high').length,
          medium: needs.filter(n => n.urgency === 'medium').length,
          low: needs.filter(n => n.urgency === 'low').length
        },
        byCategory: {}
      },
      services: {
        total: services.length,
        active: services.filter(s => s.active).length,
        byCategory: {},
        byAvailability: {
          available: services.filter(s => s.availability === 'available').length,
          limited: services.filter(s => s.availability === 'limited').length,
          unavailable: services.filter(s => s.availability === 'unavailable').length
        }
      },
      communications: {
        total: communications.length,
        unread: communications.filter(c => !c.read).length
      },
      appointments: {
        total: appointments.length,
        byStatus: {
          scheduled: appointments.filter(a => a.status === 'scheduled').length,
          confirmed: appointments.filter(a => a.status === 'confirmed').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
          completed: appointments.filter(a => a.status === 'completed').length
        }
      }
    };

    // Count by category
    needs.forEach(need => {
      report.needs.byCategory[need.category] = (report.needs.byCategory[need.category] || 0) + 1;
    });

    services.forEach(service => {
      report.services.byCategory[service.category] = (report.services.byCategory[service.category] || 0) + 1;
    });

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Data export
router.get('/export/:type', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const { type } = req.params;
    let data;

    switch (type) {
      case 'users':
        data = User.getAll().map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          active: u.active,
          createdAt: u.createdAt
        }));
        break;
      case 'needs':
        data = NeedRequest.getAll();
        break;
      case 'services':
        data = Service.getAll();
        break;
      case 'communications':
        data = Array.from(storage.communications.values());
        break;
      case 'appointments':
        data = Array.from(storage.appointments.values());
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    res.json({
      type,
      count: data.length,
      exportedAt: new Date().toISOString(),
      data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// System health check
router.get('/health', authenticate, portalAccess('admin'), (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      storage: {
        users: storage.users.size,
        needs: storage.needs.size,
        services: storage.services.size,
        communications: storage.communications.size,
        appointments: storage.appointments.size
      },
      portals: {
        client: portalConfig.client.enabled,
        outreach: portalConfig.outreach.enabled,
        provider: portalConfig.provider.enabled,
        admin: portalConfig.admin.enabled
      }
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

module.exports = router;
