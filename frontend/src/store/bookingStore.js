// src/store/bookingStore.js
import { defineStore } from 'pinia';
import { format, parseISO, differenceInDays } from 'date-fns';
import axios from 'axios';
import defaultRoomImagePlaceholder from '@/assets/mountain.jpg';

export const useBookingStore = defineStore('booking', {
  state: () => ({
    currentStep: 1,
    maxCompletedStep: 0,
    searchCriteria: null,
    availableHotelsAndRooms: [],
    isLoadingRooms: false,
    roomsError: null,
    selectedHotelDetails: null,
    selectedRoomTypeDetails: null,
    guestAndPaymentInput: null,
    finalBookingReference: null,
  }),

  getters: {
    dataForStep3Display: (state) => {
      if (!state.selectedHotelDetails || !state.selectedRoomTypeDetails || !state.searchCriteria) {
        return null;
      }
      const search = state.searchCriteria;
      const hotel = state.selectedHotelDetails;
      const room = state.selectedRoomTypeDetails;
      let nights = 0;
      let checkInFmt = '–';
      let checkOutFmt = '–';
      let durationFmt = '–';
      if (search.startDate && search.endDate) {
        try {
          const start = parseISO(search.startDate);
          const end = parseISO(search.endDate);
          nights = differenceInDays(end, start);
          nights = nights < 0 ? 0 : nights;
          checkInFmt = format(start, 'EEE, d MMM yyyy');
          checkOutFmt = format(end, 'EEE, d MMM yyyy');
          durationFmt = `${nights + 1}D, ${nights}N`;
        } catch (e) { console.error("Error in getter dataForStep3 (date calc):", e); }
      }
      const roomPricePerNight = room.GiaCoSo || 0;
      const subtotalCalc = roomPricePerNight * nights;
      const taxesAndFeesCalc = subtotalCalc * 0.1; // Ví dụ 10%
      const totalAmountCalc = subtotalCalc + taxesAndFeesCalc;
      return {
        bookingDetail: { hotelInfo: hotel, roomInfo: room },
        searchInfo: {
          startDate: search.startDate,
          endDate: search.endDate,
          numberOfGuests: search.numberOfGuests,
          checkInDateFormatted: checkInFmt,
          checkOutDateFormatted: checkOutFmt,
          durationText: durationFmt,
          numberOfNights: nights
        },
        paymentSummaryPreview: {
            roomPricePerNight: roomPricePerNight,
            subtotal: subtotalCalc,
            taxesAndFees: taxesAndFeesCalc,
            totalAmount: totalAmountCalc,
        }
      };
    },
    dataForStep4Display: (state) => {
      if (!state.selectedHotelDetails || !state.selectedRoomTypeDetails || !state.searchCriteria || !state.guestAndPaymentInput || !state.finalBookingReference) {
        return null;
      }
      const hotel = state.selectedHotelDetails;
      const room = state.selectedRoomTypeDetails;
      const search = state.searchCriteria;
      const guestInput = state.guestAndPaymentInput.guestInfo;
      const billingInputAddr = state.guestAndPaymentInput.billingAddress;
      const isBillingSame = state.guestAndPaymentInput.billingAddressSameAsContact;
      let nights = 0;
      if (search.startDate && search.endDate) {
        try {
          nights = differenceInDays(parseISO(search.endDate), parseISO(search.startDate));
          nights = nights < 0 ? 0 : nights;
        } catch (e) { console.error("Error calculating nights for Step4 display", e); }
      }
      const totalRoomPriceCalc = (room.GiaCoSo || 0) * nights;
      const vatAmountCalc = totalRoomPriceCalc * 0.1;
      const depositPaidCalc = 0;
      const amountDueCalc = totalRoomPriceCalc + vatAmountCalc - depositPaidCalc;
      return {
        bookingReference: state.finalBookingReference,
        hotelInfo: {
          TenKS: hotel.TenKS, DiaChi: hotel.DiaChi,
          SoDienThoaiKS: hotel.SoDienThoaiKS || 'N/A', EmailKS: hotel.EmailKS || 'N/A',
          UrlBanDoKS: hotel.UrlBanDoKS || null
        },
        stayInfo: {
          checkInDateFormatted: search.startDate ? format(parseISO(search.startDate), 'EEE, d MMM yyyy') : '–',
          checkOutDateFormatted: search.endDate ? format(parseISO(search.endDate), 'EEE, d MMM yyyy') : '–',
          numberOfNights: nights,
          durationText: search.startDate && search.endDate ? `${nights + 1}D, ${nights}N` : '–',
          numberOfAdults: search.numberOfGuests,
          numberOfChildren: search.numberOfChildren || 0
        },
        roomInfo: {
          TenLoaiPhong: room.TenLoaiPhong,
          TienNghiChinh: room.TienNghi ? room.TienNghi.split(',').map(s => s.trim()).slice(0, 3) : [],
          HinhAnhPhong: room.HinhAnhPhong || defaultRoomImagePlaceholder
        },
        paymentSummary: {
          totalRoomPrice: totalRoomPriceCalc, vatAmount: vatAmountCalc,
          depositPaid: depositPaidCalc, totalAlreadyPaid: depositPaidCalc, amountDue: amountDueCalc
        },
        customerDetails: {
          fullName: `${guestInput.title || ''} ${guestInput.firstName} ${guestInput.lastName}`.trim(),
          address: !isBillingSame ? `${billingInputAddr.street || ''}` : 'N/A',
          city: !isBillingSame ? billingInputAddr.city : '',
          postalCode: !isBillingSame ? billingInputAddr.postalCode : '',
          country: !isBillingSame ? billingInputAddr.country : '',
          phone: guestInput.phone, email: guestInput.email
        },
        contactSupport: {
          phone: hotel.SoDienThoaiKS || '+84 DEMO-PHONE',
          email: hotel.EmailKS || 'support@example.com'
        }
      };
    }
  },

  actions: {
    async setSearchCriteriaAndFetchRooms(searchData) {
      this.searchCriteria = searchData; // Gán searchCriteria ngay
      // Đánh dấu Step 1 (là bước tìm kiếm) đã được "hoàn thành" hoặc "vượt qua" khi có searchCriteria
      if (this.maxCompletedStep < 0 && searchData) { // Sửa thành < 0 hoặc một logic khác nếu muốn chỉ set 1 lần
          this.maxCompletedStep = 0; // Step 1 tương ứng maxCompletedStep = 0
      }


      this.isLoadingRooms = true;
      this.roomsError = null;
      this.availableHotelsAndRooms = [];

      try {
        const res = await axios.get('http://localhost:5000/api/bookings/search', {
          params: {
            startDate: this.searchCriteria.startDate,
            endDate: this.searchCriteria.endDate,
            numberOfGuests: this.searchCriteria.numberOfGuests
            // Thêm các params khác nếu API của bạn cần, ví dụ: location: this.searchCriteria.location
          }
         
          
        });
        console.log("res", res.data);
        this.availableHotelsAndRooms = res.data.data || [];
        this.currentStep = 2; // Chỉ chuyển sang Step 2 khi API thành công
        if (this.maxCompletedStep < 1) this.maxCompletedStep = 1; // Step 2 tương ứng maxCompletedStep = 1
      } catch (error) {
        console.error('Pinia store: Error fetching rooms:', error);
        this.roomsError = error.response?.data?.message || error.message || 'Failed to fetch rooms.';
        // Không thay đổi currentStep nếu có lỗi API, để component gọi quyết định
      } finally {
        this.isLoadingRooms = false;
      }
    },

    selectRoomAndHotel(payloadFromStep2) {
      this.selectedHotelDetails = payloadFromStep2.hotelInfo;
      this.selectedRoomTypeDetails = payloadFromStep2.roomInfo;
      this.currentStep = 3;
      if (this.maxCompletedStep < 2) this.maxCompletedStep = 2;
    },

    submitGuestAndPaymentInfo(payloadFromStep3) {
      this.guestAndPaymentInput = payloadFromStep3;
      this.finalBookingReference = `STORE-${String(Date.now()).slice(-6)}`;
      this.currentStep = 4;
      if (this.maxCompletedStep < 3) this.maxCompletedStep = 3;
    },

    navigateToStep(stepId) {
      // Chỉ cho phép điều hướng đến các bước đã hoàn thành hoặc bước tiếp theo ngay sau bước hoàn thành cao nhất
      if (stepId <= this.maxCompletedStep + 1) {
        // Logic reset state khi quay lại các bước trước đó
        if (stepId < this.currentStep) {
          if (stepId < 2) { // Quay lại Step 1 (Search)
            // Không reset searchCriteria ở đây nữa nếu muốn Step1_SearchForm hiển thị lại giá trị cũ
            // this.searchCriteria = null;
            this.availableHotelsAndRooms = [];
            this.roomsError = null;
            this.selectedHotelDetails = null;
            this.selectedRoomTypeDetails = null;
            this.guestAndPaymentInput = null;
            this.finalBookingReference = null;
            this.maxCompletedStep = 0; // Vì đang ở Step 1
          } else if (stepId < 3) { // Quay lại Step 2 (Room Selection)
            this.selectedHotelDetails = null;
            this.selectedRoomTypeDetails = null;
            this.guestAndPaymentInput = null;
            this.finalBookingReference = null;
            this.maxCompletedStep = Math.min(this.maxCompletedStep, 1); // Max là Step 1 đã xong
          } else if (stepId < 4) { // Quay lại Step 3 (Guest Info)
            this.guestAndPaymentInput = null;
            this.finalBookingReference = null;
            this.maxCompletedStep = Math.min(this.maxCompletedStep, 2); // Max là Step 2 đã xong
          }
        }
        this.currentStep = stepId;
      } else {
        console.warn(`Cannot navigate to uncompleted step ${stepId}. Max completed: ${this.maxCompletedStep}`);
      }
    },

    // Action mới để bắt đầu từ nút "Reserve" (hiển thị Step 1)
    startBookingFromScratch() {
        this.$reset(); // Reset toàn bộ store về trạng thái ban đầu
        this.currentStep = 1; // Đảm bảo bắt đầu từ Step 1
        // maxCompletedStep đã được $reset() về 0
    },

    resetBookingProcess() {
        this.$reset();
        // Bạn có thể muốn set currentStep về 1 nếu $reset không làm vậy
        // this.currentStep = 1; 
    }
  }
});