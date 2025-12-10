import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getUserBookings, cancelBooking } from '../services/api';
import './BookingHistory.css';

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get MongoDB _id of the logged-in user from localStorage
const [userId] = useState(() => localStorage.getItem('userId'));
 // use an actual userId from your DB
 // replace with real userId
// replace with real userId

  // Make sure this is set at login as the actual MongoDB _id

  useEffect(() => {
    if (userId) loadBookings();
  }, [userId]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await getUserBookings(userId); // API should filter by MongoDB _id
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await cancelBooking(bookingId);
      loadBookings();
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  if (loading) {
    return <div className="booking-history">Loading...</div>;
  }

  return (
    <div className="booking-history">
      <div className="container">
        <h1>My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>You have no bookings yet.</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className={`booking-card ${booking.status === 'cancelled' ? 'cancelled' : ''}`}
              >
                <div className="booking-header">
                  <h3>{booking.court?.name}</h3>
                  <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span>{format(new Date(booking.date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span>{booking.startTime} - {booking.endTime}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Court Type:</span>
                    <span className="capitalize">{booking.court?.type}</span>
                  </div>

                  {booking.equipment?.length > 0 && (
                    <div className="detail-row">
                      <span className="label">Equipment:</span>
                      <span>
                        {booking.equipment
                          .map((eq) => `${eq.equipmentId?.name} (x${eq.quantity})`)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  {booking.coach && (
                    <div className="detail-row">
                      <span className="label">Coach:</span>
                      <span>{booking.coach.name}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="label">Total Price:</span>
                    <span className="price">${booking.totalPrice.toFixed(2)}</span>
                  </div>

                  {booking.priceBreakdown && (
                    <details className="price-breakdown-details">
                      <summary>Price Breakdown</summary>
                      <div className="breakdown-content">
                        <div>Base: ${booking.priceBreakdown.courtBasePrice?.toFixed(2)}</div>
                        {booking.priceBreakdown.courtMultipliers?.map((mult, idx) => (
                          <div key={idx} className="multiplier">
                            {mult.ruleName} (x{mult.multiplier})
                          </div>
                        ))}
                        {booking.priceBreakdown.equipmentTotal > 0 && (
                          <div>Equipment: ${booking.priceBreakdown.equipmentTotal.toFixed(2)}</div>
                        )}
                        {booking.priceBreakdown.coachFee > 0 && (
                          <div>Coach: ${booking.priceBreakdown.coachFee.toFixed(2)}</div>
                        )}
                      </div>
                    </details>
                  )}
                </div>

                {booking.status === 'confirmed' && (
                  <button
                    className="cancel-button"
                    onClick={() => handleCancel(booking._id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingHistory;
