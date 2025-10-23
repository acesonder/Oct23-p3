/**
 * Client Portal Routes
 * Portal for homeless, addicts, and mental health users to communicate needs
 */

const express = require('express');
const router = express.Router();
const { authenticate, portalAccess, optionalAuth } = require('../../shared/middleware/auth');
const { NeedRequest, Service, Communication, Appointment, User } = require('../../shared/models');
const portalConfig = require('../../config/portals.config');

// Get portal configuration
router.get('/config', (req, res) => {
  const config = portalConfig.client;
  res.json({
    modules: config.modules,
    permissions: config.permissions
  });
});

// Submit a need request
router.post('/needs', optionalAuth, (req, res) => {
  try {
    const { category, description, urgency, location } = req.body;
    
    // Validate required fields
    if (!category || !description || !urgency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if anonymous requests are allowed
    if (!req.user && !portalConfig.client.modules.needsRequest.allowAnonymous) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const need = NeedRequest.create({
      clientId: req.user ? req.user.id : 'anonymous',
      category,
      description,
      urgency,
      location
    });

    res.status(201).json({
      message: 'Need request submitted successfully',
      need: {
        id: need.id,
        category: need.category,
        urgency: need.urgency,
        status: need.status,
        createdAt: need.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit need request' });
  }
});

// Get user's need requests
router.get('/needs', authenticate, portalAccess('client'), (req, res) => {
  try {
    const needs = NeedRequest.findByClient(req.user.id);
    res.json({ needs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch needs' });
  }
});

// Get specific need request
router.get('/needs/:id', authenticate, portalAccess('client'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Need not found' });
    }

    // Check ownership
    if (need.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ need });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch need' });
  }
});

// Browse available services
router.get('/services', optionalAuth, (req, res) => {
  try {
    const { category } = req.query;
    let services;
    
    if (category) {
      services = Service.findByCategory(category);
    } else {
      services = Service.getAll().filter(s => s.active);
    }

    // Remove sensitive information
    const publicServices = services.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      availability: s.availability,
      location: s.location
    }));

    res.json({ services: publicServices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Send message
router.post('/messages', authenticate, portalAccess('client'), (req, res) => {
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
router.get('/messages', authenticate, portalAccess('client'), (req, res) => {
  try {
    const messages = Communication.findByUser(req.user.id);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversation with specific user
router.get('/messages/:userId', authenticate, portalAccess('client'), (req, res) => {
  try {
    const messages = Communication.findBetweenUsers(req.user.id, req.params.userId);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create appointment
router.post('/appointments', authenticate, portalAccess('client'), (req, res) => {
  try {
    const { providerId, outreachId, type, scheduledAt, location, notes } = req.body;

    if (!scheduledAt || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appointment = Appointment.create({
      clientId: req.user.id,
      providerId,
      outreachId,
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

// Get appointments
router.get('/appointments', authenticate, portalAccess('client'), (req, res) => {
  try {
    const appointments = Appointment.findByClient(req.user.id);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment
router.put('/appointments/:id', authenticate, portalAccess('client'), (req, res) => {
  try {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = appointment.update(req.body);
    res.json({
      message: 'Appointment updated successfully',
      appointment: updated
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Get user profile
router.get('/profile', authenticate, portalAccess('client'), (req, res) => {
  try {
    const user = User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, portalAccess('client'), (req, res) => {
  try {
    const user = User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow updating profile fields
    const { profile } = req.body;
    if (profile) {
      user.update({ profile: { ...user.profile, ...profile } });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: user.profile
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
