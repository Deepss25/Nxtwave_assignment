const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');

class AvailabilityService {
  /**
   * Check if a court is available for a given time slot
   */
  async isCourtAvailable(courtId, date, startTime, endTime, excludeBookingId = null) {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    const query = {
      court: courtId,
      date: {
        $gte: dateStart,
        $lt: dateEnd
      },
      status: 'confirmed',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query);
    return !conflictingBooking;
  }

  /**
   * Check if equipment is available in required quantities
   */
  async isEquipmentAvailable(equipmentItems, date, startTime, endTime, excludeBookingId = null) {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    for (const item of equipmentItems) {
      const equipment = await Equipment.findById(item.equipmentId);
      if (!equipment || !equipment.isActive) {
        return { available: false, reason: `Equipment ${item.equipmentId} not found or inactive` };
      }

      // Get all bookings that use this equipment in the time slot
      const query = {
        date: {
          $gte: dateStart,
          $lt: dateEnd
        },
        status: 'confirmed',
        'equipment.equipmentId': item.equipmentId,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      };

      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }

      const bookings = await Booking.find(query);
      let bookedQuantity = 0;
      bookings.forEach(booking => {
        const equipmentItem = booking.equipment.find(eq => eq.equipmentId.toString() === item.equipmentId.toString());
        if (equipmentItem) {
          bookedQuantity += equipmentItem.quantity;
        }
      });

      const availableQuantity = equipment.quantity - bookedQuantity;
      if (availableQuantity < item.quantity) {
        return {
          available: false,
          reason: `Insufficient ${equipment.name}. Available: ${availableQuantity}, Required: ${item.quantity}`
        };
      }
    }

    return { available: true };
  }

  /**
   * Check if coach is available
   */
  async isCoachAvailable(coachId, date, startTime, endTime, excludeBookingId = null) {
    if (!coachId) {
      return { available: true };
    }

    const coach = await Coach.findById(coachId);
    if (!coach || !coach.isActive) {
      return { available: false, reason: 'Coach not found or inactive' };
    }

    // Check coach's weekly availability
    const dayOfWeek = date.getDay();
    const coachAvailable = coach.availability.some(slot => {
      if (slot.dayOfWeek !== dayOfWeek) return false;
      return this._isTimeInRange(startTime, slot.startTime, slot.endTime) &&
             this._isTimeInRange(endTime, slot.startTime, slot.endTime);
    });

    if (!coachAvailable) {
      return { available: false, reason: 'Coach not available at this time' };
    }

    // Check for existing bookings
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    const query = {
      coach: coachId,
      date: {
        $gte: dateStart,
        $lt: dateEnd
      },
      status: 'confirmed',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query);
    if (conflictingBooking) {
      return { available: false, reason: 'Coach already booked at this time' };
    }

    return { available: true };
  }

  /**
   * Check if time falls within range
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

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(courtId, date) {
    const slots = [];
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

      const isAvailable = await this.isCourtAvailable(courtId, new Date(date), startTime, endTime);
      slots.push({
        startTime,
        endTime,
        available: isAvailable
      });
    }

    return slots;
  }
}

module.exports = new AvailabilityService();

