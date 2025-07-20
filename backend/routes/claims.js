const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ClaimHistory = require('../models/ClaimHistory');

/**
 * POST /api/claims/claim-points
 * Claim random points for a user
 */
router.post('/claim-points', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate random points between 1 and 10
    const pointsAwarded = Math.floor(Math.random() * 10) + 1;
    
    // Store previous values for history
    const previousPoints = user.totalPoints;
    const previousRank = user.rank;

    // Update user's total points
    user.totalPoints += pointsAwarded;
    await user.save();

    // Recalculate all user rankings
    const allUsers = await User.find({}).sort({ totalPoints: -1, createdAt: 1 });
    const updatedUsers = [];
    
    for (let i = 0; i < allUsers.length; i++) {
      allUsers[i].rank = i + 1;
      await allUsers[i].save();
      updatedUsers.push(allUsers[i]);
    }

    // Find the updated user to get new rank
    const updatedUser = updatedUsers.find(u => u._id.toString() === userId);
    const newRank = updatedUser.rank;

    // Create claim history entry
    const claimHistory = new ClaimHistory({
      userId: user._id,
      userName: user.name,
      pointsAwarded,
      previousPoints,
      newPoints: user.totalPoints,
      previousRank,
      newRank,
      claimTimestamp: new Date()
    });

    await claimHistory.save();

    // Emit real-time updates via Socket.IO
    const io = req.app.get('socketio');
    io.emit('pointsClaimed', {
      user: updatedUser,
      pointsAwarded,
      previousPoints,
      newPoints: user.totalPoints,
      previousRank,
      newRank,
      allUsers: updatedUsers
    });

    io.emit('rankingsUpdated', updatedUsers);

    res.json({
      success: true,
      data: {
        user: updatedUser,
        pointsAwarded,
        previousPoints,
        newPoints: user.totalPoints,
        previousRank,
        newRank,
        claimHistory: claimHistory._id
      },
      message: `🎉 ${user.name} earned ${pointsAwarded} points!`
    });

  } catch (error) {
    console.error('Error claiming points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim points',
      error: error.message
    });
  }
});

/**
 * GET /api/claims/history
 * Get claim history with pagination
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.query.userId;

    const skip = (page - 1) * limit;
    
    // Build query
    const query = userId ? { userId } : {};
    
    // Get claim history with pagination
    const history = await ClaimHistory.find(query)
      .populate('userId', 'name avatar')
      .sort({ claimTimestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await ClaimHistory.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching claim history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch claim history',
      error: error.message
    });
  }
});

/**
 * GET /api/claims/history/:userId
 * Get claim history for a specific user
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's claim history
    const history = await ClaimHistory.find({ userId })
      .sort({ claimTimestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ClaimHistory.countDocuments({ userId });
    const totalPages = Math.ceil(total / limit);

    // Calculate user statistics
    const stats = await ClaimHistory.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalPointsEarned: { $sum: '$pointsAwarded' },
          averagePoints: { $avg: '$pointsAwarded' },
          maxPoints: { $max: '$pointsAwarded' },
          minPoints: { $min: '$pointsAwarded' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          totalPoints: user.totalPoints,
          rank: user.rank
        },
        history,
        stats: stats[0] || {
          totalClaims: 0,
          totalPointsEarned: 0,
          averagePoints: 0,
          maxPoints: 0,
          minPoints: 0
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user claim history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user claim history',
      error: error.message
    });
  }
});

/**
 * GET /api/claims/stats
 * Get overall claim statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await ClaimHistory.aggregate([
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalPointsDistributed: { $sum: '$pointsAwarded' },
          averagePointsPerClaim: { $avg: '$pointsAwarded' },
          maxPointsInSingleClaim: { $max: '$pointsAwarded' },
          minPointsInSingleClaim: { $min: '$pointsAwarded' }
        }
      }
    ]);

    // Get most active user
    const mostActiveUser = await ClaimHistory.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          totalClaims: { $sum: 1 },
          totalPointsEarned: { $sum: '$pointsAwarded' }
        }
      },
      { $sort: { totalClaims: -1 } },
      { $limit: 1 }
    ]);

    // Get recent claims
    const recentClaims = await ClaimHistory.find({})
      .populate('userId', 'name')
      .sort({ claimTimestamp: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        overallStats: stats[0] || {
          totalClaims: 0,
          totalPointsDistributed: 0,
          averagePointsPerClaim: 0,
          maxPointsInSingleClaim: 0,
          minPointsInSingleClaim: 0
        },
        mostActiveUser: mostActiveUser[0] || null,
        recentClaims
      }
    });

  } catch (error) {
    console.error('Error fetching claim stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch claim statistics',
      error: error.message
    });
  }
});

module.exports = router;
