/**
 * Database Models - In-Memory Implementation
 * For production, these should be replaced with actual database models
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage
const storage = {
  users: new Map(),
  needs: new Map(),
  services: new Map(),
  communications: new Map(),
  appointments: new Map()
};

// User Model
class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.role = data.role; // 'client', 'outreach', 'provider', 'admin'
    this.profile = data.profile || {};
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  static create(data) {
    const user = new User(data);
    storage.users.set(user.id, user);
    return user;
  }

  static findById(id) {
    return storage.users.get(id);
  }

  static findByUsername(username) {
    for (let user of storage.users.values()) {
      if (user.username === username) return user;
    }
    return null;
  }

  static findByEmail(email) {
    for (let user of storage.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  static findByRole(role) {
    return Array.from(storage.users.values()).filter(user => user.role === role);
  }

  static getAll() {
    return Array.from(storage.users.values());
  }

  update(data) {
    Object.assign(this, data);
    this.updatedAt = new Date().toISOString();
    storage.users.set(this.id, this);
    return this;
  }

  delete() {
    return storage.users.delete(this.id);
  }
}

// Need Request Model
class NeedRequest {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.clientId = data.clientId;
    this.category = data.category;
    this.description = data.description;
    this.urgency = data.urgency;
    this.status = data.status || 'pending'; // pending, assigned, in-progress, completed, declined
    this.assignedTo = data.assignedTo || null; // outreach staff ID
    this.forwardedTo = data.forwardedTo || null; // service provider ID
    this.location = data.location || null;
    this.notes = data.notes || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  static create(data) {
    const need = new NeedRequest(data);
    storage.needs.set(need.id, need);
    return need;
  }

  static findById(id) {
    return storage.needs.get(id);
  }

  static findByClient(clientId) {
    return Array.from(storage.needs.values()).filter(need => need.clientId === clientId);
  }

  static findByStatus(status) {
    return Array.from(storage.needs.values()).filter(need => need.status === status);
  }

  static findByAssignee(assignedTo) {
    return Array.from(storage.needs.values()).filter(need => need.assignedTo === assignedTo);
  }

  static getAll() {
    return Array.from(storage.needs.values());
  }

  update(data) {
    Object.assign(this, data);
    this.updatedAt = new Date().toISOString();
    storage.needs.set(this.id, this);
    return this;
  }

  addNote(note) {
    this.notes.push({
      id: uuidv4(),
      text: note.text,
      authorId: note.authorId,
      createdAt: new Date().toISOString()
    });
    this.updatedAt = new Date().toISOString();
    storage.needs.set(this.id, this);
    return this;
  }
}

// Service Model
class Service {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.providerId = data.providerId;
    this.name = data.name;
    this.category = data.category;
    this.description = data.description;
    this.availability = data.availability || 'available'; // available, limited, unavailable
    this.capacity = data.capacity || null;
    this.currentLoad = data.currentLoad || 0;
    this.location = data.location || null;
    this.contactInfo = data.contactInfo || {};
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  static create(data) {
    const service = new Service(data);
    storage.services.set(service.id, service);
    return service;
  }

  static findById(id) {
    return storage.services.get(id);
  }

  static findByProvider(providerId) {
    return Array.from(storage.services.values()).filter(s => s.providerId === providerId);
  }

  static findByCategory(category) {
    return Array.from(storage.services.values()).filter(s => s.category === category && s.active);
  }

  static getAll() {
    return Array.from(storage.services.values());
  }

  update(data) {
    Object.assign(this, data);
    this.updatedAt = new Date().toISOString();
    storage.services.set(this.id, this);
    return this;
  }
}

// Communication Model
class Communication {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.fromId = data.fromId;
    this.toId = data.toId;
    this.type = data.type; // 'message', 'chat', 'note'
    this.subject = data.subject || null;
    this.body = data.body;
    this.read = data.read || false;
    this.relatedNeedId = data.relatedNeedId || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static create(data) {
    const comm = new Communication(data);
    storage.communications.set(comm.id, comm);
    return comm;
  }

  static findById(id) {
    return storage.communications.get(id);
  }

  static findByUser(userId) {
    return Array.from(storage.communications.values())
      .filter(c => c.fromId === userId || c.toId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static findBetweenUsers(user1Id, user2Id) {
    return Array.from(storage.communications.values())
      .filter(c => 
        (c.fromId === user1Id && c.toId === user2Id) ||
        (c.fromId === user2Id && c.toId === user1Id)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  markAsRead() {
    this.read = true;
    storage.communications.set(this.id, this);
    return this;
  }
}

// Appointment Model
class Appointment {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.clientId = data.clientId;
    this.providerId = data.providerId || null;
    this.outreachId = data.outreachId || null;
    this.type = data.type; // 'office', 'field', 'virtual'
    this.scheduledAt = data.scheduledAt;
    this.duration = data.duration || 60; // minutes
    this.location = data.location || null;
    this.status = data.status || 'scheduled'; // scheduled, confirmed, cancelled, completed
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  static create(data) {
    const appt = new Appointment(data);
    storage.appointments.set(appt.id, appt);
    return appt;
  }

  static findById(id) {
    return storage.appointments.get(id);
  }

  static findByClient(clientId) {
    return Array.from(storage.appointments.values())
      .filter(a => a.clientId === clientId)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }

  static findByProvider(providerId) {
    return Array.from(storage.appointments.values())
      .filter(a => a.providerId === providerId)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }

  static findByOutreach(outreachId) {
    return Array.from(storage.appointments.values())
      .filter(a => a.outreachId === outreachId)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }

  update(data) {
    Object.assign(this, data);
    this.updatedAt = new Date().toISOString();
    storage.appointments.set(this.id, this);
    return this;
  }
}

module.exports = {
  User,
  NeedRequest,
  Service,
  Communication,
  Appointment,
  storage
};
