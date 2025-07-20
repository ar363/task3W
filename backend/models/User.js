const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: null // For future use - profile pictures
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for better query performance
userSchema.index({ totalPoints: -1 });
userSchema.index({ name: 1 });

module.exports = mongoose.model('User', userSchema);
