import { defineStore } from 'pinia'

export const useBookingStore = defineStore('booking', {
    state: () => ({
        searchParams: {
            checkIn: null,
            checkOut: null,
            guestCount: 1
          },
        availabilityResult: [],
        selectedHotel: null,
        selectedRoomType: null,
        customerInfo: null  
    }),
    actions: {
        setSearchParams(params) {
            this.searchParams = params;
        },
        setAvalability(result) {
            this.availabilityResult = result;
        },
        setSelectedHotel(hotel) {
            this.selectedHotel = hotel;
        },
        setSelectedRoomType(roomType) {
            this.selectedRoomType = roomType;
        },
        setCustomerInfo(info) {
            this.customerInfo = info;
        },
        resetBooking() {
            this.searchParams = {};
            this.availabilityResult = [];
            this.selectedHotel = null;
            this.selectedRoomType = null;
            this.customerInfo = null;
        }
    },
    getters: {
        availableHotels: (state) => state.availabilityResult ?? [],
        availableRoomTypes: (state) => state.selectedHotel?.roomTypes ?? []
    }
})