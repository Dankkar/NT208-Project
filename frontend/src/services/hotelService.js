import axios from 'axios';

import { API_BASE_URL } from '../config/api.js'

const API_URL = `${API_BASE_URL}/api`;

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
    getAllHotels: async (params = {}) => {
        try {
            const response = await axios.get(`${API_URL}/hotels`, { params });
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
    },
    getActivePromotions: async () => {
        try {
            const response = await axios.get(`${API_URL}/promotions/active`);
            return response.data;
        } catch (error) {
            console.error('Error fetching active promotions:', error);
            throw error;
        }
    }
};

export default hotelService; 