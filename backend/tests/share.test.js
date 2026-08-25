const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Document = require('../models/Document');

describe('Share Document API', () => {
  let mongoServer;
  let owner;
  let targetUser;
  let doc;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    
    // Seed test users
    owner = new User({ username: 'alice', name: 'Alice' });
    targetUser = new User({ username: 'bob', name: 'Bob' });
    await Promise.all([owner.save(), targetUser.save()]);

    // Create a document owned by Alice
    doc = new Document({
      title: 'Top Secret Plan',
      ownerId: owner._id,
      content: '<p>Initial content</p>'
    });
    await doc.save();
  }, 60000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }, 10000);

  it('should successfully share a document with another user', async () => {
    const response = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .set('x-user-id', owner._id.toString())
      .send({
        targetUserId: targetUser._id.toString(),
        permission: 'edit'
      });

    expect(response.status).toBe(200);
    expect(response.body.sharedWith).toHaveLength(1);
    // The API populates sharedWith.user, so .user is now an object — read ._id
    expect(response.body.sharedWith[0].user._id.toString()).toBe(targetUser._id.toString());
    expect(response.body.sharedWith[0].permission).toBe('edit');

    // Verify it persists in database
    const updatedDoc = await Document.findById(doc._id);
    expect(updatedDoc.sharedWith[0].permission).toBe('edit');
  });

  it('should deny sharing if the requester is not the owner', async () => {
    const response = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .set('x-user-id', targetUser._id.toString()) // Bob tries to share Alice's doc
      .send({
        targetUserId: owner._id.toString(),
        permission: 'edit'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only the document owner can share it');
  });
});
