const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const pricingEngine = require('../services/pricingEngine');
const availabilityService = require('../services/availabilityService');
const Waitlist = require('../models/Waitlist');

// Create booking with atomic transaction
router.post('/', [
  body('userId').notEmpty(),
  body('userName').notEmpty(),
  body('userEmail').isEmail(),
  body('courtId').notEmpty(),
  body('date').isISO8601(),
  body('startTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, userName, userEmail, courtId, date, startTime, endTime, equipmentIds = [], coachId = null } = req.body;

    const bookingDate = new Date(date);

    // Use MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check availability for all resources atomically
      const courtAvailable = await availabilityService.isCourtAvailable(courtId, bookingDate, startTime, endTime);
      if (!courtAvailable) {
        await session.abortTransaction();
        return res.status(409).json({ error: 'Court not available at this time' });
      }

      const equipmentCheck = await availabilityService.isEquipmentAvailable(equipmentIds, bookingDate, startTime, endTime);
      if (!equipmentCheck.available) {
        await session.abortTransaction();
        return res.status(409).json({ error: equipmentCheck.reason });
      }

      const coachCheck = await availabilityService.isCoachAvailable(coachId, bookingDate, startTime, endTime);
      if (!coachCheck.available) {
        await session.abortTransaction();
        return res.status(409).json({ error: coachCheck.reason });
      }

      // Calculate price
      const priceBreakdown = await pricingEngine.calculatePrice({
        courtId,
        date: bookingDate,
        startTime,
        endTime,
        equipmentIds,
        coachId
      });

      // Create booking (atomic operation within transaction)
      const booking = new Booking({
        userId,
        userName,
        userEmail,
        court: courtId,
        date: bookingDate,
        startTime,
        endTime,
        equipment: equipmentIds,
        coach: coachId,
        totalPrice: priceBreakdown.finalPrice,
        priceBreakdown
      });

      await booking.save({ session });
      await session.commitTransaction();
      await booking.populate('court equipment.equipmentId coach');

      // Check waitlist and notify next person if applicable (outside transaction)
      await checkWaitlist(courtId, bookingDate, startTime, endTime);

      res.status(201).json(booking);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate('court equipment.equipmentId coach')
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings (admin)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('court equipment.equipmentId coach')
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Check waitlist and notify next person
    await checkWaitlist(booking.court, booking.date, booking.startTime, booking.endTime);

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate price (for frontend preview)
router.post('/calculate-price', [
  body('courtId').notEmpty(),
  body('date').isISO8601(),
  body('startTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courtId, date, startTime, endTime, equipmentIds = [], coachId = null } = req.body;
    const priceBreakdown = await pricingEngine.calculatePrice({
      courtId,
      date: new Date(date),
      startTime,
      endTime,
      equipmentIds,
      coachId
    });

    res.json(priceBreakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check waitlist
async function checkWaitlist(courtId, date, startTime, endTime) {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);
  
  const waitlistEntries = await Waitlist.find({
    court: courtId,
    date: {
      $gte: dateStart,
      $lt: dateEnd
    },
    startTime,
    endTime,
    notified: false
  })
    .sort({ position: 1 })
    .limit(1)
    .populate('court equipment.equipmentId coach');

  if (waitlistEntries.length > 0) {
    const entry = waitlistEntries[0];
    entry.notified = true;
    await entry.save();
    
    // In a real application, you would send an email/notification here
    console.log(`Waitlist notification: Slot available for ${entry.userEmail}`);
  }
}

module.exports = router;

