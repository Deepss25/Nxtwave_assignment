# Court Booking Platform

A full-stack court booking system for a sports facility with multi-resource booking, dynamic pricing, and admin management capabilities.

## Features

- **Multi-Resource Booking**: Book courts, equipment, and coaches in a single atomic transaction
- **Dynamic Pricing**: Configurable pricing rules that stack (peak hours, weekends, court type)
- **Admin Panel**: Manage courts, equipment, coaches, and pricing rules
- **Waitlist System**: Join waitlist when slots are full, get notified on cancellation
- **Concurrency Handling**: MongoDB transactions prevent double bookings
- **Real-time Price Calculation**: See price breakdown as you select options

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: React, Vite, React Router, Axios
- **Database**: MongoDB

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher) - running locally or MongoDB Atlas connection string
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd assignment
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb://localhost:27017/court_booking
PORT=5000
```

Or use MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/court_booking
PORT=5000
```

### 3. Seed the Database

```bash
npm run seed
```

This will create:
- 4 courts (2 indoor, 2 outdoor)
- Equipment (rackets, shoes)
- 3 coaches with availability schedules
- Pricing rules (peak hours, weekends, indoor premium)

### 4. Start the Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

### 6. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### User Flow

1. **Home Page**: Overview of the platform
2. **Book Court**: 
   - Select a date
   - Choose a court
   - Pick a time slot
   - Add optional equipment and coach
   - See real-time price breakdown
   - Confirm booking
3. **My Bookings**: View and cancel your bookings
4. **Admin Panel**: Manage all resources and pricing rules

### Admin Features

- **Courts**: Add, edit, disable courts
- **Equipment**: Manage inventory and rental prices
- **Coaches**: Manage coach profiles and availability schedules
- **Pricing Rules**: Create and configure dynamic pricing rules

## API Endpoints

### Bookings
- `POST /api/bookings` - Create a booking
- `GET /api/bookings/user/:userId` - Get user bookings
- `PATCH /api/bookings/:id/cancel` - Cancel a booking
- `POST /api/bookings/calculate-price` - Calculate price preview

### Availability
- `GET /api/availability/courts?date=YYYY-MM-DD` - Get all courts with availability
- `GET /api/availability/court/:courtId?date=YYYY-MM-DD` - Get available slots for a court

### Resources
- `GET /api/courts` - Get all active courts
- `GET /api/equipment` - Get all active equipment
- `GET /api/coaches` - Get all active coaches

### Waitlist
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist/user/:userId` - Get user waitlist entries
- `DELETE /api/waitlist/:id` - Remove from waitlist

### Admin Endpoints
- `GET/POST/PUT/DELETE /api/admin/courts` - Manage courts
- `GET/POST/PUT/DELETE /api/admin/equipment` - Manage equipment
- `GET/POST/PUT/DELETE /api/admin/coaches` - Manage coaches
- `GET/POST/PUT/DELETE /api/admin/pricing-rules` - Manage pricing rules

## Assumptions Made

1. **User Authentication**: For simplicity, user identification is done via a generated userId. In production, implement proper authentication (JWT, OAuth, etc.)

2. **Time Slots**: Bookings are made in 1-hour slots from 6 AM to 10 PM

3. **Pricing Multipliers**: Pricing rules stack multiplicatively (e.g., peak hours × weekend × indoor = basePrice × 1.5 × 1.3 × 1.2)

4. **Waitlist Notifications**: Currently logs to console. In production, implement email/SMS notifications

5. **Concurrency**: Uses MongoDB transactions to prevent double bookings. For high-traffic scenarios, consider implementing optimistic locking or distributed locks

6. **Date Handling**: All dates are stored in UTC. Frontend handles timezone conversion

7. **Equipment Availability**: Equipment is checked at booking time. Real-time inventory tracking would require additional complexity

## Project Structure

```
assignment/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (pricing, availability)
│   ├── scripts/         # Seed script
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   └── App.jsx      # Main app component
│   └── vite.config.js   # Vite configuration
└── README.md
```

## Testing

To test the application:

1. Start MongoDB
2. Run seed script to populate data
3. Start backend server
4. Start frontend server
5. Navigate to `http://localhost:3000`
6. Try booking a court with different combinations
7. Check admin panel to manage resources

## Future Enhancements

- User authentication and authorization
- Payment integration
- Email/SMS notifications
- Calendar view for bookings
- Recurring bookings
- Rating and review system
- Advanced analytics dashboard

## License

ISC

