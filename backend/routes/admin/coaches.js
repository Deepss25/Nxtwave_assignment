const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Coach = require('../../models/Coach');

// Get all coaches
router.get('/', async (req, res) => {
  try {
    const coaches = await Coach.find().sort({ createdAt: -1 });
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single coach
router.get('/:id', async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    res.json(coach);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create coach
router.post('/', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('hourlyRate').isNumeric().isFloat({ min: 0 }),
  body('availability').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const coach = new Coach(req.body);
    await coach.save();
    res.status(201).json(coach);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Coach with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update coach
router.put('/:id', async (req, res) => {
  try {
    const coach = await Coach.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    res.json(coach);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete/Disable coach
router.delete('/:id', async (req, res) => {
  try {
    const coach = await Coach.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    res.json(coach);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

