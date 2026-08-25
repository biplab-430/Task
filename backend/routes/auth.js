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

// Helper endpoint: Create a new user for testing purposes
router.post('/login', async (req, res) => {
  const { username, name } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      if (!name) return res.status(400).json({ error: 'Name is required for new users' });
      user = new User({ username, name });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    console.error('POST /api/users/login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

