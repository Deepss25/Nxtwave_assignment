const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  ruleType: {
    type: String,
    enum: ['time_range', 'day_of_week', 'court_type'],
    required: true
  },
  // For time_range: e.g., peak hours 18:00-21:00
  timeRange: {
    start: String, // Format: "HH:mm"
    end: String    // Format: "HH:mm"
  },
  // For day_of_week: [0, 6] for weekends
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  // For court_type: 'indoor' or 'outdoor'
  courtType: {
    type: String,
    enum: ['indoor', 'outdoor']
  },
  multiplier: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PricingRule', pricingRuleSchema);

