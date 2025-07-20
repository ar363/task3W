const mongoose = require('mongoose');

const claimHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  pointsAwarded: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  previousPoints: {
    type: Number,
    required: true,
    min: 0
  },
  newPoints: {
    type: Number,
    required: true,
    min: 0
  },
  previousRank: {
    type: Number,
    default: 0
  },
  newRank: {
    type: Number,
    default: 0
  },
  claimTimestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
claimHistorySchema.index({ userId: 1, claimTimestamp: -1 });
claimHistorySchema.index({ claimTimestamp: -1 });

module.exports = mongoose.model('ClaimHistory', claimHistorySchema);
