import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Courts
export const getCourts = () => api.get('/courts');
export const getCourtAvailability = (courtId, date) => 
  api.get(`/availability/court/${courtId}`, { params: { date } });
export const getAllCourtsAvailability = (date) =>
  api.get('/availability/courts', { params: { date } });

// Equipment
export const getEquipment = () => api.get('/equipment');

// Coaches
export const getCoaches = () => api.get('/coaches');

// Bookings
export const createBooking = (bookingData) => api.post('/bookings', bookingData);
export const getUserBookings = (userId) => api.get(`/bookings/user/${userId}`);
export const cancelBooking = (bookingId) => api.patch(`/bookings/${bookingId}/cancel`);
export const calculatePrice = (priceData) => api.post('/bookings/calculate-price', priceData);

// Waitlist
export const joinWaitlist = (waitlistData) => api.post('/waitlist', waitlistData);
export const getUserWaitlist = (userId) => api.get(`/waitlist/user/${userId}`);
export const removeFromWaitlist = (waitlistId) => api.delete(`/waitlist/${waitlistId}`);

// Admin - Courts
export const adminGetCourts = () => api.get('/admin/courts');
export const adminCreateCourt = (courtData) => api.post('/admin/courts', courtData);
export const adminUpdateCourt = (id, courtData) => api.put(`/admin/courts/${id}`, courtData);
export const adminDeleteCourt = (id) => api.delete(`/admin/courts/${id}`);

// Admin - Equipment
export const adminGetEquipment = () => api.get('/admin/equipment');
export const adminCreateEquipment = (equipmentData) => api.post('/admin/equipment', equipmentData);
export const adminUpdateEquipment = (id, equipmentData) => api.put(`/admin/equipment/${id}`, equipmentData);
export const adminDeleteEquipment = (id) => api.delete(`/admin/equipment/${id}`);

// Admin - Coaches
export const adminGetCoaches = () => api.get('/admin/coaches');
export const adminCreateCoach = (coachData) => api.post('/admin/coaches', coachData);
export const adminUpdateCoach = (id, coachData) => api.put(`/admin/coaches/${id}`, coachData);
export const adminDeleteCoach = (id) => api.delete(`/admin/coaches/${id}`);

// Admin - Pricing Rules
export const adminGetPricingRules = () => api.get('/admin/pricing-rules');
export const adminCreatePricingRule = (ruleData) => api.post('/admin/pricing-rules', ruleData);
export const adminUpdatePricingRule = (id, ruleData) => api.put(`/admin/pricing-rules/${id}`, ruleData);
export const adminDeletePricingRule = (id) => api.delete(`/admin/pricing-rules/${id}`);

export default api;

