// src/store/bookingStore.js
import { defineStore } from 'pinia';
import { format, parseISO, differenceInDays } from 'date-fns';
import axios from 'axios';
import defaultRoomImagePlaceholder from '@/assets/mountain.jpg'; // Ảnh placeholder cho phòng

export const useBookingStore = defineStore('booking', {
  state: () => ({
    currentStep: 1,
    maxCompletedStep: 0,

    searchCriteria: null,        // { startDate, endDate, numberOfGuests } từ Step1
    
    availableHotelsAndRooms: [], // Danh sách từ API cho Step2
    isLoadingRooms: false,
    roomsError: null,

    selectedHotelDetails: null,   // Thông tin KS đã tinh gọn từ Step2
    selectedRoomTypeDetails: null,// Thông tin loại phòng đã chọn từ Step2

    guestAndPaymentInput: null,   // Dữ liệu form đầy đủ từ Step3
    
    finalBookingReference: null,  // Mã đặt phòng cho Step4
    // finalBookingDetails sẽ được tạo bởi getter dataForStep4Display
  }),

  getters: {
    // Getter cho Step3: Tổng hợp thông tin đã chọn và tính toán sơ bộ
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
          nights = nights < 0 ? 0 : nights; // Đảm bảo không âm
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
        bookingDetail: { // Giữ nguyên cấu trúc này nếu Step3 của bạn đang dùng
          hotelInfo: hotel,
          roomInfo: room
        },
        searchInfo: {
          startDate: search.startDate, // Gửi lại ngày gốc
          endDate: search.endDate,
          numberOfGuests: search.numberOfGuests,
          checkInDateFormatted: checkInFmt,
          checkOutDateFormatted: checkOutFmt,
          durationText: durationFmt,
          numberOfNights: nights
        },
        paymentSummaryPreview: { // Dùng cho tóm tắt giá ở Step3
            roomPricePerNight: roomPricePerNight,
            subtotal: subtotalCalc,
            taxesAndFees: taxesAndFeesCalc,
            totalAmount: totalAmountCalc,
        }
      };
    },

    // Getter cho Step4: Tạo object cuối cùng cho trang xác nhận
    dataForStep4Display: (state) => {
        console.log("[STORE Getter] dataForStep4Display is being accessed.");
  console.log("[STORE Getter] state.selectedHotelDetails:", state.selectedHotelDetails);
  console.log("[STORE Getter] state.selectedRoomTypeDetails:", state.selectedRoomTypeDetails);
  console.log("[STORE Getter] state.searchCriteria:", state.searchCriteria);
  console.log("[STORE Getter] state.guestAndPaymentInput:", state.guestAndPaymentInput);
  console.log("[STORE Getter] state.finalBookingReference:", state.finalBookingReference);


      // Cần tất cả dữ liệu thô trước đó và mã đặt phòng
      console.log("Generating booking summary for Step4...");
      if (!state.selectedHotelDetails || !state.selectedRoomTypeDetails || !state.searchCriteria || !state.guestAndPaymentInput || !state.finalBookingReference) {
        console.warn("Step4 data is incomplete, cannot generate booking summary.");
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
      const depositPaidCalc = 0; // Giả định
      const amountDueCalc = totalRoomPriceCalc + vatAmountCalc - depositPaidCalc;
      console.log("Booking Reference:", state.finalBookingReference);

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
          numberOfChildren: search.numberOfChildren || 0 // Giả sử searchCriteria có thể có
        },
        roomInfo: {
          TenLoaiPhong: room.TenLoaiPhong,
          TienNghiChinh: room.TienNghi ? room.TienNghi.split(',').map(s => s.trim()).slice(0, 3) : [],
          HinhAnhPhong: room.HinhAnhPhong || defaultRoomImagePlaceholder // Ảnh phòng hoặc default
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
    async setSearchCriteriaAndFetchRooms(searchDataFromStep1) {
      this.searchCriteria = searchDataFromStep1;
      this.currentStep = 1;
      this.isLoadingRooms = true;
      this.roomsError = null;
      this.availableHotelsAndRooms = [];

      try {
        const res = await axios.get('http://localhost:5000/api/bookings/search', {
          params: {
            startDate: this.searchCriteria.startDate,
            endDate: this.searchCriteria.endDate,
            numberOfGuests: this.searchCriteria.numberOfGuests
          }
        });
        this.availableHotelsAndRooms = res.data.data || [];
        this.currentStep = 2;
        if (this.maxCompletedStep < 1) this.maxCompletedStep = 1;
      } catch (error) {
        console.error('Pinia store: Error fetching rooms:', error);
        this.roomsError = error.response?.data?.message || error.message || 'Failed to fetch rooms.';
      } finally {
        this.isLoadingRooms = false;
      }
    },

    selectRoomAndHotel(payloadFromStep2) { // payload: { hotelInfo (tinh gọn), roomInfo }
      this.selectedHotelDetails = payloadFromStep2.hotelInfo;
      this.selectedRoomTypeDetails = payloadFromStep2.roomInfo;
      this.currentStep = 3;
      if (this.maxCompletedStep < 2) this.maxCompletedStep = 2;
    },

    submitGuestAndPaymentInfo(payloadFromStep3) { // payloadFromStep3 là { bookingSummary, guestAndPaymentInfo }
    console.log("[STORE Action] submitGuestAndPaymentInfo received:", JSON.parse(JSON.stringify(payloadFromStep3)));
    console.log("Submitting guest and payment info:", payloadFromStep3);
      this.guestAndPaymentInput = payloadFromStep3;
        console.log('[STORE SUBMIT] searchCriteria:', JSON.parse(JSON.stringify(this.searchCriteria)));
  console.log('[STORE SUBMIT] selectedHotelDetails:', JSON.parse(JSON.stringify(this.selectedHotelDetails)));
  console.log('[STORE SUBMIT] selectedRoomTypeDetails:', JSON.parse(JSON.stringify(this.selectedRoomTypeDetails)));
//   console.log('[STORE SUBMIT] guestAndPaymentInput:', JSON.parse(JSON.stringify(this.guestAndPaymentInput)));
  console.log('[STORE SUBMIT] finalBookingReference:', this.finalBookingReference);
  const checkGetterResult = this.dataForStep4Display;
//   console.log('[STORE SUBMIT] Getter dataForStep4Display returns:', JSON.parse(JSON.stringify(checkGetterResult)));
      this.finalBookingReference = `STORE-${String(Date.now()).slice(-6)}`; // Tạo và lưu mã tham chiếu
      // Getter dataForStep4Display sẽ tự động tạo finalBookingDetails hoàn chỉnh
      this.currentStep = 4;
      if (this.maxCompletedStep < 3) this.maxCompletedStep = 3;
    },

    navigateToStep(stepId) {
      if (stepId <= this.currentStep || stepId <= this.maxCompletedStep + 1) {
        if (stepId < this.currentStep) {
          if (stepId < 2) {
            this.searchCriteria = null; this.availableHotelsAndRooms = []; this.roomsError = null;
            this.selectedHotelDetails = null; this.selectedRoomTypeDetails = null;
            this.guestAndPaymentInput = null; this.finalBookingReference = null;
            this.maxCompletedStep = 0;
          } else if (stepId < 3) {
            this.selectedHotelDetails = null; this.selectedRoomTypeDetails = null;
            this.guestAndPaymentInput = null; this.finalBookingReference = null;
            this.maxCompletedStep = Math.min(this.maxCompletedStep, 1);
          } else if (stepId < 4) {
            this.guestAndPaymentInput = null; this.finalBookingReference = null;
            this.maxCompletedStep = Math.min(this.maxCompletedStep, 2);
          }
        }
        this.currentStep = stepId;
      }
    },

    resetBookingProcess() {
        this.$reset(); // Pinia cung cấp $reset() để đưa state về trạng thái ban đầu
        // Hoặc bạn có thể gán lại từng state nếu muốn kiểm soát kỹ hơn
        // this.currentStep = 1;
        // this.maxCompletedStep = 0;
        // ... (reset các state khác về null hoặc giá trị mặc định)
    }
  }
});
