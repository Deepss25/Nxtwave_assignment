const express = require('express');
const router = express.Router();
const availabilityService = require('../services/availabilityService');
const Court = require('../models/Court');

// Get available slots for a court on a date
router.get('/court/:courtId', async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const slots = await availabilityService.getAvailableSlots(courtId, new Date(date));
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all courts with availability for a date
router.get('/courts', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const courts = await Court.find({ isActive: true });
    const courtsWithAvailability = await Promise.all(
      courts.map(async (court) => {
        const slots = await availabilityService.getAvailableSlots(court._id, new Date(date));
        return {
          ...court.toObject(),
          availableSlots: slots
        };
      })
    );

    res.json(courtsWithAvailability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

