// Centralized API configuration
const API_CONFIG = {
  development: 'http://localhost:5000',
  production: import.meta.env.VITE_API_BASE_URL || 'https://your-domain.com'
}

// Get the base URL based on environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  API_CONFIG[import.meta.env.MODE] || 
  'http://localhost:5000'

// Export API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  GOOGLE_LOGIN: `${API_BASE_URL}/api/auth/google`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  CHECK_EMAIL: `${API_BASE_URL}/api/auth/check-email`,
  
  // User endpoints
  USER_ME: `${API_BASE_URL}/api/users/me`,
  USER_SEARCH: `${API_BASE_URL}/api/users/search`,
  
  // Hotel endpoints
  HOTELS: `${API_BASE_URL}/api/hotels`,
  HOTELS_LIST_BASIC: `${API_BASE_URL}/api/hotels/list-basic`,
  
  // Booking endpoints
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  BOOKINGS_ADMIN: `${API_BASE_URL}/api/bookings/admin`,
  BOOKINGS_MY: `${API_BASE_URL}/api/bookings/my-bookings`,
  BOOKINGS_HOLD: `${API_BASE_URL}/api/bookings/hold`,
  
  // Room endpoints
  ROOMS: `${API_BASE_URL}/api/rooms`,
  ROOM_TYPES: `${API_BASE_URL}/api/roomTypes`,
  BED_CONFIGS: `${API_BASE_URL}/api/bed-configs`,
  
  // Service endpoints
  SERVICES: `${API_BASE_URL}/api/services`,
  
  // Promotion endpoints
  PROMOTIONS: `${API_BASE_URL}/api/promotions`,
  
  // Review endpoints
  REVIEWS: `${API_BASE_URL}/api/reviews`,
  
  // Admin endpoints
  ADMIN_REVENUE: `${API_BASE_URL}/api/admin/revenue`
}

export default {
  API_BASE_URL,
  API_ENDPOINTS
} 