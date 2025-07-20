const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /api/users
 * Get all users with their rankings
 */
router.get('/', async (req, res) => {
  try {
    // Fetch all users sorted by total points (descending)
    const users = await User.find({}).sort({ totalPoints: -1, createdAt: 1 });
    
    // Update ranks based on current sorting
    const updatedUsers = users.map((user, index) => {
      user.rank = index + 1;
      return user;
    });

    // Save updated ranks to database
    await Promise.all(updatedUsers.map(user => user.save()));

    res.json({
      success: true,
      data: updatedUsers,
      count: updatedUsers.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters long'
      });
    }

    // Check if user with same name already exists
    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this name already exists'
      });
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      totalPoints: 0,
      rank: await User.countDocuments() + 1
    });

    await newUser.save();

    // Emit real-time update
    const io = req.app.get('socketio');
    io.emit('userAdded', newUser);

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user information
 */
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters long'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

module.exports = router;
