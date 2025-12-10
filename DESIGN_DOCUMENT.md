# Design Document: Court Booking Platform

## Database Design

### Schema Overview

The database is designed using MongoDB with Mongoose ODM. The schema follows a document-based approach optimized for the booking system's requirements.

#### 1. Court Schema
```javascript
{
  name: String (unique),
  type: Enum ['indoor', 'outdoor'],
  basePrice: Number,
  isActive: Boolean,
  timestamps
}
```

**Design Rationale**: Courts are the primary resource. The `basePrice` serves as the foundation for dynamic pricing calculations. The `isActive` flag allows soft deletion without losing historical booking data.

#### 2. Equipment Schema
```javascript
{
  name: String (unique),
  type: Enum ['racket', 'shoes'],
  quantity: Number (inventory count),
  rentalPrice: Number (per hour),
  isActive: Boolean,
  timestamps
}
```

**Design Rationale**: Equipment has limited inventory. The `quantity` field tracks available items. Equipment availability is calculated by subtracting booked quantities from total inventory during the booking time slot.

#### 3. Coach Schema
```javascript
{
  name: String,
  email: String (unique),
  hourlyRate: Number,
  availability: [{
    dayOfWeek: Number (0-6),
    startTime: String (HH:mm),
    endTime: String (HH:mm)
  }],
  isActive: Boolean,
  timestamps
}
```

**Design Rationale**: Coaches have weekly recurring availability patterns. The nested `availability` array allows flexible scheduling. Availability is checked against both the weekly pattern and existing bookings.

#### 4. Booking Schema
```javascript
{
  userId: String,
  userName: String,
  userEmail: String,
  court: ObjectId (ref: Court),
  date: Date,
  startTime: String (HH:mm),
  endTime: String (HH:mm),
  equipment: [{
    equipmentId: ObjectId (ref: Equipment),
    quantity: Number
  }],
  coach: ObjectId (ref: Coach),
  totalPrice: Number,
  priceBreakdown: {
    courtBasePrice: Number,
    courtMultipliers: [{ ruleName, multiplier }],
    equipmentTotal: Number,
    coachFee: Number,
    finalPrice: Number
  },
  status: Enum ['confirmed', 'cancelled'],
  timestamps
}
```

**Design Rationale**: 
- Stores complete booking information including price breakdown for transparency
- `status` field enables soft cancellation (preserves data for analytics)
- Indexes on `court + date + time` and `coach + date + time` optimize availability queries
- Embedded equipment array stores quantities per booking

#### 5. PricingRule Schema
```javascript
{
  name: String (unique),
  description: String,
  ruleType: Enum ['time_range', 'day_of_week', 'court_type'],
  timeRange: { start: String, end: String },
  daysOfWeek: [Number],
  courtType: String,
  multiplier: Number,
  isActive: Boolean,
  timestamps
}
```

**Design Rationale**: Flexible rule system supports multiple rule types. Rules can be enabled/disabled without deletion. The `multiplier` is applied multiplicatively when multiple rules match.

#### 6. Waitlist Schema
```javascript
{
  userId: String,
  userName: String,
  userEmail: String,
  court: ObjectId,
  date: Date,
  startTime: String,
  endTime: String,
  equipment: Array,
  coach: ObjectId,
  position: Number,
  notified: Boolean,
  timestamps
}
```

**Design Rationale**: Queue-based system with `position` for ordering. `notified` flag prevents duplicate notifications. Indexes optimize position-based queries.

### Indexes

- **Bookings**: 
  - `{ court: 1, date: 1, startTime: 1, endTime: 1 }` - Fast court availability checks
  - `{ coach: 1, date: 1, startTime: 1, endTime: 1 }` - Fast coach availability checks
  - `{ userId: 1, date: -1 }` - User booking history queries

- **Waitlist**:
  - `{ court: 1, date: 1, startTime: 1, endTime: 1, position: 1 }` - Efficient queue management

## Pricing Engine Design

### Architecture

The pricing engine is a modular service (`PricingEngine`) that calculates prices based on:
1. Court base price
2. Active pricing rules (applied multiplicatively)
3. Equipment rental fees (quantity × price × duration)
4. Coach hourly rate × duration

### Pricing Flow

```
1. Get court base price
2. Calculate duration (endTime - startTime in hours)
3. Fetch all active pricing rules
4. For each rule:
   - Check if rule applies (time range, day of week, court type)
   - If applies, add multiplier to stack
5. Apply multipliers multiplicatively: basePrice × multiplier1 × multiplier2 × ...
6. Multiply by duration: courtPrice = (basePrice × multipliers) × duration
7. Add equipment costs: sum(equipment.rentalPrice × quantity × duration)
8. Add coach fee: coach.hourlyRate × duration
9. Final price = courtPrice + equipmentTotal + coachFee
```

### Rule Application Logic

**Time Range Rules**: Check if booking startTime falls within rule's timeRange
```javascript
timeMinutes >= startMinutes && timeMinutes < endMinutes
```

**Day of Week Rules**: Check if booking date's dayOfWeek is in rule's daysOfWeek array
```javascript
daysOfWeek.includes(date.getDay())
```

**Court Type Rules**: Direct string comparison
```javascript
rule.courtType === court.type
```

### Multiplier Stacking

Rules stack multiplicatively:
- Example: Indoor court (1.2x) + Peak hours (1.5x) + Weekend (1.3x)
- Calculation: basePrice × 1.2 × 1.5 × 1.3 × duration

This allows flexible pricing combinations. Rules can be enabled/disabled dynamically without code changes.

### Price Breakdown Storage

Each booking stores a complete `priceBreakdown` object:
- Enables transparency and dispute resolution
- Allows recalculation verification
- Supports analytics and reporting

## Concurrency Handling

### Problem
Multiple users attempting to book the same slot simultaneously can cause double bookings.

### Solution: MongoDB Transactions

The booking endpoint uses MongoDB sessions with transactions:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Check availability
  // Create booking
  await booking.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
}
```

### Why This Works

1. **Atomicity**: All operations succeed or fail together
2. **Isolation**: Concurrent transactions see consistent state
3. **Conflict Detection**: MongoDB detects write conflicts and aborts one transaction

### Alternative Approaches Considered

1. **Optimistic Locking**: Add version field, check before update
   - Pros: Better performance
   - Cons: More complex retry logic

2. **Distributed Locks**: Redis-based locking
   - Pros: Works across multiple servers
   - Cons: Additional infrastructure, potential deadlocks

3. **Database Constraints**: Unique indexes on (court, date, startTime, endTime)
   - Pros: Simple
   - Cons: Doesn't handle equipment/coach conflicts

**Chosen Approach**: MongoDB transactions provide the best balance of simplicity and correctness for this use case.

## Availability Service Design

### Multi-Resource Availability Check

The `AvailabilityService` checks three resource types atomically:

1. **Court Availability**: Query bookings for overlapping time slots
2. **Equipment Availability**: 
   - Sum booked quantities for each equipment type
   - Check if (totalQuantity - bookedQuantity) >= requestedQuantity
3. **Coach Availability**:
   - Check weekly availability pattern
   - Check for conflicting bookings

### Time Overlap Detection

Uses interval overlap logic:
```javascript
booking1.startTime < booking2.endTime && 
booking1.endTime > booking2.startTime
```

### Efficiency Optimizations

- Indexes on frequently queried fields
- Single query per resource type
- Early exit on first conflict detection

## Waitlist System

### Design

When a booking fails due to unavailability, users can join a waitlist. On cancellation:

1. Find next person in waitlist for that slot
2. Mark as notified
3. (In production) Send email/SMS notification
4. User has limited time to claim the slot

### Position Management

- Position assigned on join: `max(existing positions) + 1`
- On removal: Decrement all positions > removed position
- Query by position ASC for FIFO ordering

## API Design Principles

1. **RESTful**: Standard HTTP methods and status codes
2. **Validation**: Input validation using express-validator
3. **Error Handling**: Consistent error response format
4. **Separation of Concerns**: Routes → Services → Models
5. **Modularity**: Each resource has dedicated routes and services

## Frontend Architecture

### Component Structure

- **Pages**: Top-level route components (Home, BookCourt, BookingHistory, AdminPanel)
- **Components**: Reusable UI elements (Navbar)
- **Services**: API communication layer (api.js)

### State Management

- React hooks (useState, useEffect) for local state
- No global state management (Redux/Context) needed for MVP
- API service layer abstracts backend communication

### User Experience

- Real-time price calculation as user selects options
- Clear error messages and success feedback
- Responsive design for mobile and desktop
- Loading states for async operations

## Scalability Considerations

### Current Limitations

1. Availability queries scan all bookings for a date
2. No caching layer
3. Single MongoDB instance

### Future Improvements

1. **Caching**: Redis cache for availability data
2. **Read Replicas**: Distribute read load
3. **Sharding**: Partition bookings by date range
4. **Message Queue**: Async waitlist notifications
5. **CDN**: Static asset delivery

## Security Considerations

### Current Implementation

- Input validation on all endpoints
- MongoDB injection prevention via Mongoose
- CORS configured for frontend origin

### Production Recommendations

1. **Authentication**: JWT tokens, password hashing
2. **Authorization**: Role-based access control (admin vs user)
3. **Rate Limiting**: Prevent abuse
4. **HTTPS**: Encrypt all traffic
5. **Input Sanitization**: Additional XSS prevention
6. **Audit Logging**: Track admin actions

## Conclusion

The system is designed for:
- **Correctness**: Atomic transactions prevent double bookings
- **Flexibility**: Configurable pricing rules without code changes
- **Scalability**: Indexed queries, modular architecture
- **Maintainability**: Clear separation of concerns, well-documented code

The pricing engine's rule-based approach allows business users to adjust pricing without developer intervention, while the transaction-based booking system ensures data consistency under concurrent load.

