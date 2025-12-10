const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
    required: true // Format: "HH:mm"
  },
  endTime: {
    type: String,
    required: true // Format: "HH:mm"
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
  totalPrice: {
    type: Number,
    required: true
  },
  priceBreakdown: {
    courtBasePrice: Number,
    courtMultipliers: [{
      ruleName: String,
      multiplier: Number
    }],
    equipmentTotal: Number,
    coachFee: Number,
    finalPrice: Number
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  }
}, {
  timestamps: true
});

// Index for efficient availability queries
bookingSchema.index({ court: 1, date: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ coach: 1, date: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Booking', bookingSchema);

