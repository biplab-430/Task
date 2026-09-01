const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users
// Return the list of users for our auth switcher
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (err) {
    console.error('GET /api/users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper endpoint: Create a new user or return existing for testing purposes
router.post('/login', async (req, res) => {
  const { username, name } = req.body;

  // Validate required input: username
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    let user = await User.findOne({ username });

    if (!user) {
      // If user does not exist, create a new one
      // 'name' is required only for new users as per original logic
      if (!name) {
        return res.status(400).json({ error: 'Name is required for new users.' });
      }
      user = new User({ username, name });
      await user.save();
    }
    // If user exists or was just created, return it
    res.json(user);
  } catch (err) {
    console.error('POST /api/users/login error:', err.message);
    // Handle Mongoose validation errors specifically
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
