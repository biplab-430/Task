const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Document = require('../models/Document'); // Assuming a Document model exists and is created by the upload endpoint

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

  // Clear documents collection before each test to ensure isolation
  beforeEach(async () => {
    await Document.deleteMany({}); // Assuming Document model exists
  });

  it('should parse a .txt file and create a document', async () => {
    const fileContent = 'Hello\nWorld';
    const buffer = Buffer.from(fileContent, 'utf-8');

    const response = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', user._id.toString())
      .attach('file', buffer, 'test.txt');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe('test.txt');
    expect(response.body.content).toBe('<p>Hello</p><p>World</p>');
    expect(response.body.ownerId.toString()).toBe(user._id.toString());

    // Verify document is saved in DB
    const savedDoc = await Document.findById(response.body._id);
    expect(savedDoc).not.toBeNull();
    expect(savedDoc.title).toBe('test.txt');
    expect(savedDoc.content).toBe('<p>Hello</p><p>World</p>');
    expect(savedDoc.ownerId.toString()).toBe(user._id.toString());
  });

  it('should handle an empty .txt file', async () => {
    const fileContent = '';
    const buffer = Buffer.from(fileContent, 'utf-8');

    const response = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', user._id.toString())
      .attach('file', buffer, 'empty.txt');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe('empty.txt');
    expect(response.body.content).toBe(''); // Expect empty content or perhaps a single <p></p> depending on backend parser
    expect(response.body.ownerId.toString()).toBe(user._id.toString());

    const savedDoc = await Document.findById(response.body._id);
    expect(savedDoc).not.toBeNull();
    expect(savedDoc.content).toBe('');
  });

  it('should return 400 if no file is attached', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', user._id.toString()); // No .attach()

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined(); // Expect an error message
  });

  it('should return 401 if x-user-id header is missing', async () => {
    const fileContent = 'Some content';
    const buffer = Buffer.from(fileContent, 'utf-8');

    const response = await request(app)
      .post('/api/documents/upload')
      .attach('file', buffer, 'missing-user.txt'); // No .set('x-user-id')

    expect(response.status).toBe(401); // Assuming 401 for missing auth
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 if x-user-id is valid but user does not exist', async () => {
    const fileContent = 'Some content';
    const buffer = Buffer.from(fileContent, 'utf-8');
    const nonExistentUserId = new mongoose.Types.ObjectId(); // A valid-looking but non-existent ID

    const response = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', nonExistentUserId.toString())
      .attach('file', buffer, 'non-existent-user.txt');

    expect(response.status).toBe(404); // Assuming 404 for user not found
    expect(response.body.message).toBeDefined();
  });

  it('should return 400 if x-user-id is malformed', async () => {
    const fileContent = 'Some content';
    const buffer = Buffer.from(fileContent, 'utf-8');

    const response = await request(app)
      .post('/api/documents/upload')
      .set('x-user-id', 'invalid-id-format') // Malformed ID
      .attach('file', buffer, 'malformed-user.txt');

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});