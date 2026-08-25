const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

describe('File Upload API', () => {
  let user;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    
    user = new User({ username: 'testuser', name: 'Test User' });
    await user.save();
  }, 60000); // increase timeout for memory server setup

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }, 10000);

  it('should parse a .txt file and create a document', async () => {
    const fileContent = 'Hello\nWorld';
    const buffer = Buffer.from(fileContent, 'utf-8');

    const response = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', user._id.toString())
      .attach('file', buffer, 'test.txt');

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('test.txt');
    expect(response.body.content).toBe('<p>Hello</p><p>World</p>');
    expect(response.body.ownerId.toString()).toBe(user._id.toString());
  });
});
