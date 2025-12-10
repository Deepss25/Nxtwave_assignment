import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  getAllCourtsAvailability,
  getEquipment,
  getCoaches,
  calculatePrice,
  createBooking,
  joinWaitlist,
} from '../services/api';
import './BookCourt.css';

function BookCourt() {
  const [courts, setCourts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userInfo, setUserInfo] = useState({
    userId: 'user_' + Math.random().toString(36).substr(2, 9),
    userName: '',
    userEmail: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAvailability();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedCourt && selectedSlot) {
      calculatePricePreview();
    }
  }, [selectedCourt, selectedSlot, selectedEquipment, selectedCoach, selectedDate]);

  const loadData = async () => {
    try {
      const [equipmentRes, coachesRes] = await Promise.all([
        getEquipment(),
        getCoaches(),
      ]);
      setEquipment(equipmentRes.data);
      setCoaches(coachesRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const res = await getAllCourtsAvailability(selectedDate);
      setCourts(res.data);
    } catch (err) {
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const calculatePricePreview = async () => {
    if (!selectedCourt || !selectedSlot) return;

    try {
      const equipmentIds = selectedEquipment.map((eq) => ({
        equipmentId: eq.id,
        quantity: eq.quantity,
      }));

      const res = await calculatePrice({
        courtId: selectedCourt._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        equipmentIds,
        coachId: selectedCoach?._id || null,
      });

      setPriceBreakdown(res.data);
    } catch (err) {
      console.error('Price calculation error:', err);
    }
  };

  const handleEquipmentToggle = (eq) => {
    setSelectedEquipment((prev) => {
      const existing = prev.find((e) => e.id === eq._id);
      if (existing) {
        return prev.filter((e) => e.id !== eq._id);
      } else {
        return [...prev, { id: eq._id, name: eq.name, quantity: 1 }];
      }
    });
  };

  const updateEquipmentQuantity = (eqId, quantity) => {
    if (quantity < 1) return;
    setSelectedEquipment((prev) =>
      prev.map((eq) => (eq.id === eqId ? { ...eq, quantity } : eq))
    );
  };

  const handleBooking = async () => {
    if (!selectedCourt || !selectedSlot) {
      setError('Please select a court and time slot');
      return;
    }

    if (!userInfo.userName || !userInfo.userEmail) {
      setError('Please enter your name and email');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const equipmentIds = selectedEquipment.map((eq) => ({
        equipmentId: eq.id,
        quantity: eq.quantity,
      }));

      const bookingData = {
        userId: userInfo.userId,
        userName: userInfo.userName,
        userEmail: userInfo.userEmail,
        courtId: selectedCourt._id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        equipmentIds,
        coachId: selectedCoach?._id || null,
      };

      try {
        const res = await createBooking(bookingData);
        setSuccess('Booking confirmed!');
        resetForm();
      } catch (bookingError) {
        if (bookingError.response?.status === 409) {
          // Slot not available, offer waitlist
          const joinWaitlistConfirm = window.confirm(
            'This slot is no longer available. Would you like to join the waitlist?'
          );
          if (joinWaitlistConfirm) {
            await joinWaitlist(bookingData);
            setSuccess('Added to waitlist! You will be notified when a slot becomes available.');
            resetForm();
          } else {
            setError(bookingError.response?.data?.error || 'Slot not available');
          }
        } else {
          setError(bookingError.response?.data?.error || 'Booking failed');
        }
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCourt(null);
    setSelectedSlot(null);
    setSelectedEquipment([]);
    setSelectedCoach(null);
    setPriceBreakdown(null);
  };

  return (
    <div className="book-court">
      <div className="container">
        <h1>Book a Court</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="booking-form">
          {/* User Info */}
          <div className="form-section">
            <h2>Your Information</h2>
            <div className="form-row">
              <input
                type="text"
                placeholder="Your Name"
                value={userInfo.userName}
                onChange={(e) => setUserInfo({ ...userInfo, userName: e.target.value })}
                className="form-input"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={userInfo.userEmail}
                onChange={(e) => setUserInfo({ ...userInfo, userEmail: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Date Selection */}
          <div className="form-section">
            <h2>Select Date</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="form-input"
            />
          </div>

          {/* Court Selection */}
          <div className="form-section">
            <h2>Select Court</h2>
            {loading ? (
              <div>Loading availability...</div>
            ) : (
              <div className="courts-grid">
                {courts.map((court) => (
                  <div
                    key={court._id}
                    className={`court-card ${selectedCourt?._id === court._id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCourt(court);
                      setSelectedSlot(null);
                    }}
                  >
                    <h3>{court.name}</h3>
                    <p className="court-type">{court.type}</p>
                    <p className="court-price">Base: ${court.basePrice}/hr</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Slot Selection */}
          {selectedCourt && (
            <div className="form-section">
              <h2>Select Time Slot</h2>
              <div className="slots-grid">
                {selectedCourt.availableSlots?.map((slot, idx) => (
                  <button
                    key={idx}
                    className={`slot-button ${slot.available ? '' : 'unavailable'} ${
                      selectedSlot?.startTime === slot.startTime ? 'selected' : ''
                    }`}
                    onClick={() => slot.available && setSelectedSlot(slot)}
                    disabled={!slot.available}
                  >
                    {slot.startTime} - {slot.endTime}
                    {!slot.available && <span className="badge">Booked</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Selection */}
          <div className="form-section">
            <h2>Add Equipment (Optional)</h2>
            <div className="equipment-list">
              {equipment.map((eq) => {
                const selected = selectedEquipment.find((e) => e.id === eq._id);
                return (
                  <div key={eq._id} className="equipment-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => handleEquipmentToggle(eq)}
                      />
                      <span>{eq.name}</span>
                      <span className="equipment-price">${eq.rentalPrice}/hr</span>
                    </label>
                    {selected && (
                      <div className="quantity-control">
                        <button
                          onClick={() => updateEquipmentQuantity(eq._id, selected.quantity - 1)}
                        >
                          -
                        </button>
                        <span>{selected.quantity}</span>
                        <button
                          onClick={() => updateEquipmentQuantity(eq._id, selected.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coach Selection */}
          <div className="form-section">
            <h2>Add Coach (Optional)</h2>
            <select
              value={selectedCoach?._id || ''}
              onChange={(e) => {
                const coach = coaches.find((c) => c._id === e.target.value);
                setSelectedCoach(coach || null);
              }}
              className="form-input"
            >
              <option value="">No Coach</option>
              {coaches.map((coach) => (
                <option key={coach._id} value={coach._id}>
                  {coach.name} - ${coach.hourlyRate}/hr
                </option>
              ))}
            </select>
          </div>

          {/* Price Breakdown */}
          {priceBreakdown && (
            <div className="form-section price-breakdown">
              <h2>Price Breakdown</h2>
              <div className="price-details">
                <div className="price-row">
                  <span>Court Base Price:</span>
                  <span>${priceBreakdown.courtBasePrice.toFixed(2)}</span>
                </div>
                {priceBreakdown.courtMultipliers?.map((mult, idx) => (
                  <div key={idx} className="price-row multiplier">
                    <span>{mult.ruleName} (x{mult.multiplier}):</span>
                    <span>Applied</span>
                  </div>
                ))}
                {priceBreakdown.equipmentTotal > 0 && (
                  <div className="price-row">
                    <span>Equipment:</span>
                    <span>${priceBreakdown.equipmentTotal.toFixed(2)}</span>
                  </div>
                )}
                {priceBreakdown.coachFee > 0 && (
                  <div className="price-row">
                    <span>Coach Fee:</span>
                    <span>${priceBreakdown.coachFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="price-row total">
                  <span>Total:</span>
                  <span>${priceBreakdown.finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            className="submit-button"
            onClick={handleBooking}
            disabled={loading || !selectedCourt || !selectedSlot}
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookCourt;

