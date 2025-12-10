const PricingRule = require('../models/PricingRule');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');
const Court = require('../models/Court');

class PricingEngine {
  /**
   * Calculate total price for a booking
   * @param {Object} params - Booking parameters
   * @param {String} params.courtId - Court ID
   * @param {Date} params.date - Booking date
   * @param {String} params.startTime - Start time (HH:mm)
   * @param {String} params.endTime - End time (HH:mm)
   * @param {Array} params.equipmentIds - Array of equipment IDs with quantities
   * @param {String} params.coachId - Optional coach ID
   * @returns {Promise<Object>} Price breakdown
   */
  async calculatePrice({ courtId, date, startTime, endTime, equipmentIds = [], coachId = null }) {
    // Get court details
    const court = await Court.findById(courtId);
    if (!court) {
      throw new Error('Court not found');
    }

    let basePrice = court.basePrice;
    const multipliers = [];
    const priceBreakdown = {
      courtBasePrice: basePrice,
      courtMultipliers: [],
      equipmentTotal: 0,
      coachFee: 0,
      finalPrice: 0
    };

    // Get all active pricing rules
    const rules = await PricingRule.find({ isActive: true });

    // Calculate duration in hours
    const duration = this._calculateDuration(startTime, endTime);
    const dayOfWeek = date.getDay();

    // Apply pricing rules
    for (const rule of rules) {
      let applies = false;

      switch (rule.ruleType) {
        case 'time_range':
          if (rule.timeRange) {
            applies = this._isTimeInRange(startTime, rule.timeRange.start, rule.timeRange.end);
          }
          break;

        case 'day_of_week':
          if (rule.daysOfWeek && rule.daysOfWeek.includes(dayOfWeek)) {
            applies = true;
          }
          break;

        case 'court_type':
          if (rule.courtType === court.type) {
            applies = true;
          }
          break;
      }

      if (applies) {
        multipliers.push(rule.multiplier);
        priceBreakdown.courtMultipliers.push({
          ruleName: rule.name,
          multiplier: rule.multiplier
        });
      }
    }

    // Apply multipliers (stack multiplicatively)
    let courtPrice = basePrice;
    for (const multiplier of multipliers) {
      courtPrice *= multiplier;
    }
    courtPrice *= duration;

    // Calculate equipment costs
    if (equipmentIds.length > 0) {
      for (const item of equipmentIds) {
        const equipment = await Equipment.findById(item.equipmentId);
        if (equipment && equipment.isActive) {
          const itemTotal = equipment.rentalPrice * item.quantity * duration;
          priceBreakdown.equipmentTotal += itemTotal;
        }
      }
    }

    // Calculate coach fee
    if (coachId) {
      const coach = await Coach.findById(coachId);
      if (coach && coach.isActive) {
        priceBreakdown.coachFee = coach.hourlyRate * duration;
      }
    }

    // Calculate final price
    priceBreakdown.finalPrice = courtPrice + priceBreakdown.equipmentTotal + priceBreakdown.coachFee;

    return priceBreakdown;
  }

  /**
   * Calculate duration in hours between two times
   */
  _calculateDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return (endMinutes - startMinutes) / 60;
  }

  /**
   * Check if a time falls within a range
   */
  _isTimeInRange(time, rangeStart, rangeEnd) {
    const [timeHour, timeMin] = time.split(':').map(Number);
    const [startHour, startMin] = rangeStart.split(':').map(Number);
    const [endHour, endMin] = rangeEnd.split(':').map(Number);
    
    const timeMinutes = timeHour * 60 + timeMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }
}

module.exports = new PricingEngine();

