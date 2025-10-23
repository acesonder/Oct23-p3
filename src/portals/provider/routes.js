/**
 * Service Provider Portal Routes
 * Portal for service providers to manage services and respond to requests
 */

const express = require('express');
const router = express.Router();
const { authenticate, portalAccess } = require('../../shared/middleware/auth');
const { NeedRequest, Service, Communication, Appointment, User } = require('../../shared/models');
const portalConfig = require('../../config/portals.config');

// Get portal configuration
router.get('/config', authenticate, portalAccess('provider'), (req, res) => {
  const config = portalConfig.provider;
  res.json({
    modules: config.modules,
    permissions: config.permissions
  });
});

// Get provider's services
router.get('/services', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const services = Service.findByProvider(req.user.id);
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create new service
router.post('/services', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const { name, category, description, availability, capacity, location, contactInfo } = req.body;

    if (!name || !category || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = Service.create({
      providerId: req.user.id,
      name,
      category,
      description,
      availability,
      capacity,
      location,
      contactInfo
    });

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
router.put('/services/:id', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const service = Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (service.providerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = service.update(req.body);
    res.json({
      message: 'Service updated successfully',
      service: updated
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Get needs forwarded to provider
router.get('/requests', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const { status } = req.query;
    let needs = NeedRequest.getAll().filter(n => n.forwardedTo === req.user.id);

    if (status) {
      needs = needs.filter(n => n.status === status);
    }

    // Sort by urgency and date
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    needs.sort((a, b) => {
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ requests: needs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get specific request
router.get('/requests/:id', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (need.forwardedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ request: need });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Accept request
router.post('/requests/:id/accept', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (need.forwardedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    need.update({ status: 'in-progress' });

    // Notify outreach staff and client
    if (need.assignedTo) {
      Communication.create({
        fromId: req.user.id,
        toId: need.assignedTo,
        type: 'message',
        subject: `Request Accepted`,
        body: `The service provider has accepted the ${need.category} request.`,
        relatedNeedId: need.id
      });
    }

    res.json({
      message: 'Request accepted successfully',
      request: need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Decline request
router.post('/requests/:id/decline', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (need.forwardedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { reason } = req.body;
    
    need.update({ 
      status: 'declined',
      forwardedTo: null
    });

    need.addNote({
      text: `Declined by provider. Reason: ${reason || 'Not specified'}`,
      authorId: req.user.id
    });

    // Notify outreach staff
    if (need.assignedTo) {
      Communication.create({
        fromId: req.user.id,
        toId: need.assignedTo,
        type: 'message',
        subject: `Request Declined`,
        body: `The service provider has declined the ${need.category} request. Reason: ${reason || 'Not specified'}`,
        relatedNeedId: need.id
      });
    }

    res.json({
      message: 'Request declined successfully',
      request: need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to decline request' });
  }
});

// Complete request
router.post('/requests/:id/complete', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (need.forwardedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { notes } = req.body;
    
    need.update({ status: 'completed' });

    if (notes) {
      need.addNote({
        text: `Completed. Notes: ${notes}`,
        authorId: req.user.id
      });
    }

    // Notify outreach staff and client
    if (need.assignedTo) {
      Communication.create({
        fromId: req.user.id,
        toId: need.assignedTo,
        type: 'message',
        subject: `Request Completed`,
        body: `The ${need.category} request has been completed by the service provider.`,
        relatedNeedId: need.id
      });
    }

    res.json({
      message: 'Request marked as completed',
      request: need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete request' });
  }
});

// Add note to request
router.post('/requests/:id/notes', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const need = NeedRequest.findById(req.params.id);
    
    if (!need) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (need.forwardedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
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
      request: need
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get client information (limited to assigned clients)
router.get('/clients/:id', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const client = User.findById(req.params.id);
    
    if (!client || client.role !== 'client') {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if provider has any requests from this client
    const needs = NeedRequest.getAll().filter(n => 
      n.clientId === client.id && n.forwardedTo === req.user.id
    );

    if (needs.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      client: {
        id: client.id,
        username: client.username,
        profile: client.profile
      },
      requests: needs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client information' });
  }
});

// Send message
router.post('/messages', authenticate, portalAccess('provider'), (req, res) => {
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
router.get('/messages', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const messages = Communication.findByUser(req.user.id);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get appointments
router.get('/appointments', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const appointments = Appointment.findByProvider(req.user.id);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment
router.put('/appointments/:id', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.providerId !== req.user.id) {
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

// Generate service metrics report
router.get('/reports/metrics', authenticate, portalAccess('provider'), (req, res) => {
  try {
    const services = Service.findByProvider(req.user.id);
    const requests = NeedRequest.getAll().filter(n => n.forwardedTo === req.user.id);
    
    const report = {
      totalServices: services.length,
      activeServices: services.filter(s => s.active).length,
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending' || r.status === 'assigned').length,
      inProgressRequests: requests.filter(r => r.status === 'in-progress').length,
      completedRequests: requests.filter(r => r.status === 'completed').length,
      declinedRequests: requests.filter(r => r.status === 'declined').length,
      requestsByCategory: {},
      requestsByUrgency: {}
    };

    requests.forEach(req => {
      report.requestsByCategory[req.category] = (report.requestsByCategory[req.category] || 0) + 1;
      report.requestsByUrgency[req.urgency] = (report.requestsByUrgency[req.urgency] || 0) + 1;
    });

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

module.exports = router;
