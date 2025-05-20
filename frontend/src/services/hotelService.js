import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const hotelService = {
    getFeaturedHotels: async () => {
        try {
            const response = await axios.get(`${API_URL}/hotels/featured`);
            return response.data;
        } catch (error) {
            console.error('Error fetching featured hotels:', error);
            throw error;
        }
    }
};

export default hotelService; 