const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');

// Join waitlist
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

    // Get current position
    const existingEntries = await Waitlist.countDocuments({
      court: courtId,
      date: new Date(date),
      startTime,
      endTime
    });

    const waitlistEntry = new Waitlist({
      userId,
      userName,
      userEmail,
      court: courtId,
      date: new Date(date),
      startTime,
      endTime,
      equipment: equipmentIds,
      coach: coachId,
      position: existingEntries + 1
    });

    await waitlistEntry.save();
    await waitlistEntry.populate('court equipment.equipmentId coach');

    res.status(201).json(waitlistEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user waitlist entries
router.get('/user/:userId', async (req, res) => {
  try {
    const entries = await Waitlist.find({ userId: req.params.userId })
      .populate('court equipment.equipmentId coach')
      .sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from waitlist
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Waitlist.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    // Update positions for remaining entries
    await Waitlist.updateMany(
      {
        court: entry.court,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        position: { $gt: entry.position }
      },
      { $inc: { position: -1 } }
    );

    res.json({ message: 'Removed from waitlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

