const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  equipment: [{
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment'
    },
    quantity: {
      type: Number,
      min: 1
    }
  }],
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach'
  },
  position: {
    type: Number,
    required: true
  },
  notified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

waitlistSchema.index({ court: 1, date: 1, startTime: 1, endTime: 1, position: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);

