/**
 * Outreach Staff Portal Routes
 * Portal for outreach workers to manage clients and respond to needs
 */

const express = require('express');
const router = express.Router();
const { authenticate, portalAccess } = require('../../shared/middleware/auth');
const { NeedRequest, Service, Communication, Appointment, User } = require('../../shared/models');
const portalConfig = require('../../config/portals.config');

// Get portal configuration
router.get('/config', authenticate, portalAccess('outreach'), (req, res) => {
  const config = portalConfig.outreach;
  res.json({
    modules: config.modules,
    permissions: config.permissions
  });
});

// Get all need requests (with filtering)
router.get('/needs', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const { status, urgency, category } = req.query;
    let needs = NeedRequest.getAll();

    // Apply filters
    if (status) {
      needs = needs.filter(n => n.status === status);
    }
    if (urgency) {
      needs = needs.filter(n => n.urgency === urgency);
    }
    if (category) {
      needs = needs.filter(n => n.category === category);
    }

    // Sort by urgency and date
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    needs.sort((a, b) => {
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ needs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch needs' });
  }
});

// Get assigned needs
router.get('/needs/assigned', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const needs = NeedRequest.findByAssignee(req.user.id);
    res.json({ needs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assigned needs' });
  }
});

// Get specific need
router.get('/needs/:id', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Need not found' });
    }

    res.json({ need });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch need' });
  }
});

// Assign need to self
router.post('/needs/:id/assign', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Need not found' });
    }

    need.update({
      assignedTo: req.user.id,
      status: 'assigned'
    });

    res.json({
      message: 'Need assigned successfully',
      need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign need' });
  }
});

// Update need status
router.put('/needs/:id', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Need not found' });
    }

    const updated = need.update(req.body);
    res.json({
      message: 'Need updated successfully',
      need: updated
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update need' });
  }
});

// Add note to need
router.post('/needs/:id/notes', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Need not found' });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Note text is required' });
    }

    need.addNote({
      text,
      authorId: req.user.id
    });

    res.json({
      message: 'Note added successfully',
      need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Forward need to service provider
router.post('/needs/:id/forward', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Need not found' });
    }

    const { providerId, message } = req.body;
    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }

    // Update need
    need.update({
      forwardedTo: providerId,
      status: 'in-progress'
    });

    // Send notification to provider
    Communication.create({
      fromId: req.user.id,
      toId: providerId,
      type: 'message',
      subject: `Need Request Forwarded: ${need.category}`,
      body: message || `A ${need.urgency} priority ${need.category} need has been forwarded to you.`,
      relatedNeedId: need.id
    });

    res.json({
      message: 'Need forwarded to provider successfully',
      need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to forward need' });
  }
});

// Get all clients
router.get('/clients', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const clients = User.findByRole('client');
    
    // Remove sensitive information
    const clientList = clients.map(c => ({
      id: c.id,
      username: c.username,
      email: c.email,
      profile: c.profile,
      active: c.active,
      createdAt: c.createdAt
    }));

    res.json({ clients: clientList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client details
router.get('/clients/:id', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const client = User.findById(req.params.id);
    
    if (!client || client.role !== 'client') {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get client's needs and appointments
    const needs = NeedRequest.findByClient(client.id);
    const appointments = Appointment.findByClient(client.id);

    res.json({
      client: {
        id: client.id,
        username: client.username,
        email: client.email,
        profile: client.profile,
        active: client.active,
        createdAt: client.createdAt
      },
      needs,
      appointments
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

// Create need on behalf of client
router.post('/clients/:id/needs', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const client = User.findById(req.params.id);
    
    if (!client || client.role !== 'client') {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { category, description, urgency, location } = req.body;
    
    if (!category || !description || !urgency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const need = NeedRequest.create({
      clientId: client.id,
      category,
      description,
      urgency,
      location,
      assignedTo: req.user.id,
      status: 'assigned'
    });

    need.addNote({
      text: 'Created by outreach staff on behalf of client',
      authorId: req.user.id
    });

    res.status(201).json({
      message: 'Need created successfully',
      need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create need' });
  }
});

// Send message
router.post('/messages', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const { toId, subject, body, relatedNeedId } = req.body;

    if (!toId || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = Communication.create({
      fromId: req.user.id,
      toId,
      type: 'message',
      subject,
      body,
      relatedNeedId
    });

    res.status(201).json({
      message: 'Message sent successfully',
      id: message.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages
router.get('/messages', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const messages = Communication.findByUser(req.user.id);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get appointments
router.get('/appointments', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const appointments = Appointment.findByOutreach(req.user.id);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Create appointment
router.post('/appointments', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const { clientId, providerId, type, scheduledAt, location, notes } = req.body;

    if (!clientId || !scheduledAt || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appointment = Appointment.create({
      clientId,
      providerId,
      outreachId: req.user.id,
      type,
      scheduledAt,
      location,
      notes
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Get service providers
router.get('/providers', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const providers = User.findByRole('provider');
    
    const providerList = providers.map(p => ({
      id: p.id,
      username: p.username,
      email: p.email,
      profile: p.profile,
      active: p.active
    }));

    res.json({ providers: providerList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get services
router.get('/services', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const { category } = req.query;
    let services;
    
    if (category) {
      services = Service.findByCategory(category);
    } else {
      services = Service.getAll();
    }

    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Generate daily report
router.get('/reports/daily', authenticate, portalAccess('outreach'), (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allNeeds = NeedRequest.getAll();
    const todaysNeeds = allNeeds.filter(n => new Date(n.createdAt) >= today);
    
    const myNeeds = NeedRequest.findByAssignee(req.user.id);
    const myAppointments = Appointment.findByOutreach(req.user.id);
    const todaysAppointments = myAppointments.filter(a => new Date(a.scheduledAt) >= today);

    const report = {
      date: today.toISOString(),
      summary: {
        totalNewNeeds: todaysNeeds.length,
        myAssignedNeeds: myNeeds.length,
        todaysAppointments: todaysAppointments.length,
        pendingNeeds: myNeeds.filter(n => n.status === 'assigned' || n.status === 'pending').length,
        completedNeeds: myNeeds.filter(n => n.status === 'completed').length
      },
      needsByCategory: {},
      needsByUrgency: {}
    };

    // Count by category and urgency
    todaysNeeds.forEach(need => {
      report.needsByCategory[need.category] = (report.needsByCategory[need.category] || 0) + 1;
      report.needsByUrgency[need.urgency] = (report.needsByUrgency[need.urgency] || 0) + 1;
    });

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
