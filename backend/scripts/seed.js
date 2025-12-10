const mongoose = require('mongoose');
require('dotenv').config();

const Court = require('../models/Court');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');
const PricingRule = require('../models/PricingRule');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/court_booking';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Court.deleteMany({});
    await Equipment.deleteMany({});
    await Coach.deleteMany({});
    await PricingRule.deleteMany({});

    // Seed Courts
    const courts = await Court.insertMany([
      {
        name: 'Indoor Court 1',
        type: 'indoor',
        basePrice: 50,
        isActive: true
      },
      {
        name: 'Indoor Court 2',
        type: 'indoor',
        basePrice: 50,
        isActive: true
      },
      {
        name: 'Outdoor Court 1',
        type: 'outdoor',
        basePrice: 40,
        isActive: true
      },
      {
        name: 'Outdoor Court 2',
        type: 'outdoor',
        basePrice: 40,
        isActive: true
      }
    ]);

    console.log('✓ Seeded courts');

    // Seed Equipment
    const equipment = await Equipment.insertMany([
      {
        name: 'Badminton Racket',
        type: 'racket',
        quantity: 20,
        rentalPrice: 5,
        isActive: true
      },
      {
        name: 'Sports Shoes',
        type: 'shoes',
        quantity: 15,
        rentalPrice: 3,
        isActive: true
      }
    ]);

    console.log('✓ Seeded equipment');

    // Seed Coaches
    const coaches = await Coach.insertMany([
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        hourlyRate: 30,
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }, // Friday
        ],
        isActive: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        hourlyRate: 35,
        availability: [
          { dayOfWeek: 0, startTime: '10:00', endTime: '18:00' }, // Sunday
          { dayOfWeek: 6, startTime: '10:00', endTime: '18:00' }, // Saturday
          { dayOfWeek: 1, startTime: '18:00', endTime: '21:00' }, // Monday evening
          { dayOfWeek: 3, startTime: '18:00', endTime: '21:00' }, // Wednesday evening
        ],
        isActive: true
      },
      {
        name: 'Mike Davis',
        email: 'mike.davis@example.com',
        hourlyRate: 25,
        availability: [
          { dayOfWeek: 1, startTime: '14:00', endTime: '20:00' }, // Monday
          { dayOfWeek: 2, startTime: '14:00', endTime: '20:00' }, // Tuesday
          { dayOfWeek: 4, startTime: '14:00', endTime: '20:00' }, // Thursday
          { dayOfWeek: 5, startTime: '14:00', endTime: '20:00' }, // Friday
          { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' }, // Saturday
        ],
        isActive: true
      }
    ]);

    console.log('✓ Seeded coaches');

    // Seed Pricing Rules
    await PricingRule.insertMany([
      {
        name: 'Peak Hours',
        description: 'Higher rate for peak hours (6-9 PM)',
        ruleType: 'time_range',
        timeRange: {
          start: '18:00',
          end: '21:00'
        },
        multiplier: 1.5,
        isActive: true
      },
      {
        name: 'Weekend Premium',
        description: 'Higher rate for weekends',
        ruleType: 'day_of_week',
        daysOfWeek: [0, 6], // Sunday and Saturday
        multiplier: 1.3,
        isActive: true
      },
      {
        name: 'Indoor Premium',
        description: 'Premium pricing for indoor courts',
        ruleType: 'court_type',
        courtType: 'indoor',
        multiplier: 1.2,
        isActive: true
      }
    ]);

    console.log('✓ Seeded pricing rules');
    console.log('\n✅ Seed data created successfully!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();

