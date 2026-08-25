const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Document = require('../models/Document');

let mongoServer;
let owner;
let otherUser;

// Shared setup for all suites (one in-memory DB for the whole file)
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  owner = await new User({ username: 'alice', name: 'Alice' }).save();
  otherUser = await new User({ username: 'bob', name: 'Bob' }).save();
}, 60000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}, 10000);

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/documents/upload – file parsing', () => {
  it('parses a .txt file and wraps lines in <p> tags', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', owner._id.toString())
      .attach('file', Buffer.from('Hello\nWorld', 'utf-8'), 'test.txt');

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('test.txt');
    expect(res.body.content).toBe('<p>Hello</p><p>World</p>');
    expect(res.body.ownerId.toString()).toBe(owner._id.toString());
  });

  it('rejects non-.txt/.md files with 400', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', owner._id.toString())
      .attach('file', Buffer.from('<html/>', 'utf-8'), 'page.html');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/\.txt.*\.md/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/documents/:id/share – sharing logic', () => {
  let doc;
  beforeAll(async () => {
    doc = await new Document({ title: 'Shared Doc', ownerId: owner._id, content: '' }).save();
  });

  it('owner can share document with another user', async () => {
    const res = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .set('x-user-id', owner._id.toString())
      .send({ targetUserId: otherUser._id.toString(), permission: 'edit' });

    expect(res.status).toBe(200);
    expect(res.body.sharedWith).toHaveLength(1);
    expect(res.body.sharedWith[0].permission).toBe('edit');
  });

  it('non-owner receives 403 when attempting to share', async () => {
    const res = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .set('x-user-id', otherUser._id.toString())
      .send({ targetUserId: owner._id.toString(), permission: 'read' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/owner/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/documents/:id/rename', () => {
  let doc;
  beforeAll(async () => {
    doc = await new Document({ title: 'Old Title', ownerId: owner._id, content: '' }).save();
  });

  it('renames the document when owner requests it', async () => {
    const res = await request(app)
      .patch(`/api/documents/${doc._id}/rename`)
      .set('x-user-id', owner._id.toString())
      .send({ title: 'New Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
  });

  it('rejects an empty title with 400', async () => {
    const res = await request(app)
      .patch(`/api/documents/${doc._id}/rename`)
      .set('x-user-id', owner._id.toString())
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  it('returns 403 when non-owner tries to rename', async () => {
    const res = await request(app)
      .patch(`/api/documents/${doc._id}/rename`)
      .set('x-user-id', otherUser._id.toString())
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/documents/:id', () => {
  it('owner can delete their own document', async () => {
    const doc = await new Document({ title: 'To Delete', ownerId: owner._id, content: '' }).save();

    const res = await request(app)
      .delete(`/api/documents/${doc._id}`)
      .set('x-user-id', owner._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
    const gone = await Document.findById(doc._id);
    expect(gone).toBeNull();
  });

  it('non-owner receives 403', async () => {
    const doc = await new Document({ title: 'Protected', ownerId: owner._id, content: '' }).save();

    const res = await request(app)
      .delete(`/api/documents/${doc._id}`)
      .set('x-user-id', otherUser._id.toString());

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/documents/:id/share/:targetUserId – revoke access', () => {
  let doc;
  beforeAll(async () => {
    doc = await new Document({
      title: 'Shared',
      ownerId: owner._id,
      content: '',
      sharedWith: [{ user: otherUser._id, permission: 'read' }],
    }).save();
  });

  it('owner can revoke access for a shared user', async () => {
    const res = await request(app)
      .delete(`/api/documents/${doc._id}/share/${otherUser._id}`)
      .set('x-user-id', owner._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.sharedWith).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('HTML Sanitization on PUT /api/documents/:id', () => {
  let doc;
  beforeAll(async () => {
    doc = await new Document({ title: 'Sanitize Test', ownerId: owner._id, content: '' }).save();
  });

  it('strips <script> tags from saved content', async () => {
    const malicious = '<p>Hello</p><script>alert(1)</script>';
    const res = await request(app)
      .put(`/api/documents/${doc._id}`)
      .set('x-user-id', owner._id.toString())
      .send({ content: malicious });

    expect(res.status).toBe(200);
    expect(res.body.content).not.toContain('<script>');
    expect(res.body.content).toContain('<p>Hello</p>');
  });

  it('strips event handler attributes', async () => {
    const malicious = '<p onclick="alert(1)">Click me</p>';
    const res = await request(app)
      .put(`/api/documents/${doc._id}`)
      .set('x-user-id', owner._id.toString())
      .send({ content: malicious });

    expect(res.status).toBe(200);
    expect(res.body.content).not.toContain('onclick');
    expect(res.body.content).toContain('<p>Click me</p>');
  });

  it('strips iframes', async () => {
    const malicious = '<p>Safe</p><iframe src="https://evil.com"></iframe>';
    const res = await request(app)
      .put(`/api/documents/${doc._id}`)
      .set('x-user-id', owner._id.toString())
      .send({ content: malicious });

    expect(res.status).toBe(200);
    expect(res.body.content).not.toContain('<iframe');
    expect(res.body.content).toContain('<p>Safe</p>');
  });
});
