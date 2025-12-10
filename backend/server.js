const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/court_booking';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/admin/courts', require('./routes/admin/courts'));
app.use('/api/admin/equipment', require('./routes/admin/equipment'));
app.use('/api/admin/coaches', require('./routes/admin/coaches'));
app.use('/api/admin/pricing-rules', require('./routes/admin/pricingRules'));
app.use('/api/waitlist', require('./routes/waitlist'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all resources (for frontend)
app.get('/api/courts', async (req, res) => {
  try {
    const Court = require('./models/Court');
    const courts = await Court.find({ isActive: true });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/equipment', async (req, res) => {
  try {
    const Equipment = require('./models/Equipment');
    const equipment = await Equipment.find({ isActive: true });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coaches', async (req, res) => {
  try {
    const Coach = require('./models/Coach');
    const coaches = await Coach.find({ isActive: true });
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

