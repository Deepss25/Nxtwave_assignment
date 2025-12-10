const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const PricingRule = require('../../models/PricingRule');

// Get all pricing rules
router.get('/', async (req, res) => {
  try {
    const rules = await PricingRule.find().sort({ createdAt: -1 });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single pricing rule
router.get('/:id', async (req, res) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create pricing rule
router.post('/', [
  body('name').notEmpty(),
  body('ruleType').isIn(['time_range', 'day_of_week', 'court_type']),
  body('multiplier').isNumeric().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rule = new PricingRule(req.body);
    await rule.save();
    res.status(201).json(rule);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Pricing rule with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update pricing rule
router.put('/:id', async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete/Disable pricing rule
router.delete('/:id', async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!rule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

