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
    },
    getAllHotels: async () => {
        try {
            const response = await axios.get(`${API_URL}/hotels`);
            return response.data;
        } catch (error) {
            console.error('Error fetching all hotels:', error);
            throw error;
        }
    },
    
    suggestLocations: async (keyword) => {
        try {
            const response = await axios.get(`${API_URL}/hotels/suggest-locations?keyword=${keyword}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching suggest locations:', error);
            throw error;
        }
    }
};

export default hotelService; 