const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/docs');
const User = require('./models/User');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Safe logging of environment variables without exposing sensitive credentials
console.log('MongoDB URI loaded:', !!process.env.MONGODB_URI);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

// Routes
app.use('/api/users', authRoutes);
app.use('/api/documents', docRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Process-level handlers to prevent unexpected process crashes
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collab-editor-mvp';

async function seedDefaultUsers() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create([
        { username: 'alice', name: 'Alice' },
        { username: 'bob', name: 'Bob' }
      ]);
      console.log('Default test users (Alice, Bob) seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding default users:', err.message);
  }
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    await seedDefaultUsers();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;

