const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  },
  startTime: {
    type: String,
    required: true // Format: "HH:mm"
  },
  endTime: {
    type: String,
    required: true // Format: "HH:mm"
  }
});

const coachSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  availability: [availabilitySlotSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coach', coachSchema);

