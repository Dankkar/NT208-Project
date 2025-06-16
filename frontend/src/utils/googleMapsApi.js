/**
 * Google Maps API utilities
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Get coordinates from address using Google Maps Geocoding API
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number}>} - Coordinates
 */
export async function getCoordinatesFromAddress(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API Key is not configured');
  }

  if (!address || address.trim() === '') {
    throw new Error('Address is required');
  }

  try {
    // Format address for Vietnamese locations
    const formattedAddress = address.includes('Việt Nam') || address.includes('Vietnam') 
      ? address 
      : `${address}, Việt Nam`;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedAddress)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address
      };
    } else if (data.status === 'ZERO_RESULTS') {
      throw new Error('Không tìm thấy địa chỉ này trên Google Maps');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Đã vượt quá giới hạn truy vấn Google Maps API');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error('API Key không hợp lệ hoặc bị từ chối');
    } else {
      throw new Error(`Lỗi Google Maps API: ${data.status}`);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Generate Google Maps embed URL for displaying map
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} placeName - Name of the place for marker
 * @param {number} zoom - Zoom level (default: 15)
 * @returns {string} - Google Maps embed URL
 */
export function generateGoogleMapsEmbedUrl(latitude, longitude, placeName = '', zoom = 15) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API Key is not configured');
    return '';
  }

  if (!latitude || !longitude) {
    console.error('Latitude and longitude are required');
    return '';
  }

  const params = new URLSearchParams({
    key: GOOGLE_MAPS_API_KEY,
    q: `${latitude},${longitude}`,
    zoom: zoom.toString(),
    maptype: 'roadmap'
  });

  // Add place name if provided
  if (placeName) {
    params.set('q', `${placeName}@${latitude},${longitude}`);
  }

  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

/**
 * Generate Google Maps link for opening in new tab
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} placeName - Name of the place
 * @returns {string} - Google Maps URL
 */
export function generateGoogleMapsLink(latitude, longitude, placeName = '') {
  if (!latitude || !longitude) {
    return '';
  }

  const params = new URLSearchParams({
    q: placeName ? `${placeName}@${latitude},${longitude}` : `${latitude},${longitude}`,
    ll: `${latitude},${longitude}`,
    z: '15'
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

/**
 * Validate coordinates
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {boolean} - Whether coordinates are valid
 */
export function validateCoordinates(latitude, longitude) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Check if Google Maps API key is configured
 * @returns {boolean} - Whether API key is available
 */
export function isGoogleMapsApiKeyConfigured() {
  return Boolean(GOOGLE_MAPS_API_KEY);
} 