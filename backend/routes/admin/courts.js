const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Court = require('../../models/Court');


// Get all courts
router.get('/', async (req, res) => {
  try {
    const courts = await Court.find().sort({ createdAt: -1 });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single court
router.get('/:id', async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    res.json(court);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create court
router.post('/', [
  body('name').notEmpty(),
  body('type').isIn(['indoor', 'outdoor']),
  body('basePrice').isNumeric().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const court = new Court(req.body);
    await court.save();
    res.status(201).json(court);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Court with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update court
router.put('/:id', async (req, res) => {
  try {
    const court = await Court.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    res.json(court);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete/Disable court
router.delete('/:id', async (req, res) => {
  try {
    const court = await Court.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    res.json(court);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

