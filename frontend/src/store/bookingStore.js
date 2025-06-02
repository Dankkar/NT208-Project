// src/store/bookingStore.js
import { defineStore } from 'pinia';
import { format, parseISO, differenceInDays } from 'date-fns';
import axios from 'axios'; // Đảm bảo bạn đã cài đặt và cấu hình axios (ví dụ, baseURL trong main.js hoặc file config axios riêng)
import defaultRoomImagePlaceholder from '@/assets/mountain.jpg';

// API base URL (Nếu chưa config global cho axios)
// const API_URL = 'http://localhost:5000/api';


export const useBookingStore = defineStore('booking', {
  state: () => ({
    currentStep: 1,
    maxCompletedStep: 0,

    // --- Step 1 Data (Search) ---
    searchCriteria: null,        // { startDate, endDate, numberOfGuests }
    availableHotelsAndRooms: [], // Danh sách từ API cho Step 2
    isLoadingRooms: false,       // Loading khi search rooms
    roomsError: null,            // Lỗi khi search rooms

    // --- Intentions (for skipping Step 2) ---
    preselectedIntent: null,     // { hotelId, hotelName, roomTypeId, roomDetails (optional)}

    // --- Step 2 Data (Room Selection & Hold) ---
    selectedHotelDetails: null,   // Thông tin KS đã chọn (sau khi hold)
    selectedRoomTypeDetails: null,// Thông tin loại phòng đã chọn (sau khi hold)
    heldBookingMaDat: null,       // MaDat trả về từ API holdBooking
    heldBookingExpiresAt: null,   // Thời điểm hết hạn giữ chỗ (timestamp)
    isHoldingRoom: false,         // Loading khi đang gọi API holdBooking
    holdError: null,              // Lỗi khi gọi API holdBooking

    // --- Step 3 Data (Guest Info & Finalize) ---
    guestAndPaymentInput: null,   // Dữ liệu form đầy đủ từ Step 3 (sau khi API confirm)
    isCreatingBooking: false,   // Loading khi đang gọi API updateDetails/confirmBooking
    createBookingError: null,          // Lỗi khi gọi API updateDetails/confirmBooking

    // --- Step 4 Data (Confirmation) ---
    finalBookingReference: null,  // Object chứa thông tin xác nhận cuối cùng { MaDat, MaHD, priceDetails, ... }
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
      // Giá phòng này được lấy từ lúc select/hold, nó có thể khác với giá trên card nếu có khuyến mãi theo ngày
      const roomPricePerNight = room.GiaCoSo || 0;
      const subtotalCalc = roomPricePerNight * nights;
      const taxesAndFeesCalc = subtotalCalc * 0.1; // Ví dụ 10% thuế & phí
      const totalAmountCalc = subtotalCalc + taxesAndFeesCalc;
      return {
        bookingDetail: { hotelInfo: hotel, roomInfo: room },
        searchInfo: {
          startDate: search.startDate, endDate: search.endDate,
          numberOfGuests: search.numberOfGuests, checkInDateFormatted: checkInFmt,
          checkOutDateFormatted: checkOutFmt, durationText: durationFmt,
          numberOfNights: nights
        },
        paymentSummaryPreview: { // Giá này là dự kiến, giá cuối cùng sẽ từ API confirm
            roomPricePerNight: roomPricePerNight,
            subtotal: subtotalCalc, taxesAndFees: taxesAndFeesCalc,
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
        try { nights = differenceInDays(parseISO(search.endDate), parseISO(search.startDate)); nights = nights < 0 ? 0 : nights; }
        catch (e) { console.error("Error calculating nights for Step4 display", e); }
      }

      // Lấy thông tin giá cuối cùng từ finalBookingReference nếu có
      const finalPaymentDetails = state.finalBookingReference?.priceDetails || {};
      const totalRoomPriceCalc = finalPaymentDetails.totalRoomPrice !== undefined ? finalPaymentDetails.totalRoomPrice : (room.GiaCoSo || 0) * nights;
      const vatAmountCalc = finalPaymentDetails.vatAmount !== undefined ? finalPaymentDetails.vatAmount : totalRoomPriceCalc * 0.1;
      const totalServicePriceCalc = finalPaymentDetails.totalServicePrice || 0;
      const promotionDiscountCalc = finalPaymentDetails.promotionDiscount || 0;
      const finalPriceCalc = finalPaymentDetails.finalPrice !== undefined ? finalPaymentDetails.finalPrice : (totalRoomPriceCalc + vatAmountCalc + totalServicePriceCalc - promotionDiscountCalc);

      return {
        bookingReference: state.finalBookingReference?.MaDat || 'N/A',
        invoiceReference: state.finalBookingReference?.MaHD || 'N/A',
        hotelInfo: { /* ... giữ nguyên ... */ },
        stayInfo: { /* ... giữ nguyên ... */ },
        roomInfo: { /* ... giữ nguyên ... */ },
        paymentSummary: {
          totalRoomPrice: totalRoomPriceCalc,
          vatAmount: vatAmountCalc,
          totalServicePrice: totalServicePriceCalc,
          promotionDiscount: promotionDiscountCalc,
          finalPrice: finalPriceCalc, // Giá cuối cùng đã thanh toán
          depositPaid: 0, // Cập nhật nếu có
          totalAlreadyPaid: finalPriceCalc, // Giả sử thanh toán toàn bộ
          amountDue: 0 // Giả sử thanh toán toàn bộ
        },
        customerDetails: { /* ... giữ nguyên ... */ },
        contactSupport: { /* ... giữ nguyên ... */ }
      };
    },
    isTimerActive: (state) => {
        return !!state.heldBookingExpiresAt && state.currentStep === 3 && (state.heldBookingExpiresAt > Date.now());
    }
  },

  actions: {
    async setSearchCriteriaAndFetchRooms(searchData) {
      this.searchCriteria = searchData;
      if (this.maxCompletedStep < 0 && searchData) this.maxCompletedStep = 0;

      this.isLoadingRooms = true;
      this.roomsError = null; this.availableHotelsAndRooms = [];
      this.preselectedIntent = null; this.heldBookingMaDat = null;
      this.heldBookingExpiresAt = null; this.holdError = null;

      try {
        const res = await axios.get(`/api/bookings/search`, { params: searchData });
        if (res.data && res.data.success) {
            this.availableHotelsAndRooms = res.data.data || [];
            this.currentStep = 2;
            this.maxCompletedStep = Math.max(this.maxCompletedStep, 1);
        } else {
            throw new Error(res.data.message || 'Search request returned with success:false.');
        }
      } catch (error) {
        console.error('Pinia store: Error fetching rooms:', error);
        this.roomsError = error.response?.data?.message || error.message || 'Failed to fetch rooms.';
      } finally {
        this.isLoadingRooms = false;
      }
    },

    setPreselectedBookingIntent(intent) {
      this.preselectedIntent = intent;
    },
    clearPreselectedBookingIntent() {
      this.preselectedIntent = null;
    },

    async holdRoomAndProceed(payload) {
      this.isHoldingRoom = true;
      this.holdError = null;
      const { hotelInfo, roomInfo, searchCriteria } = payload;

      // Logic xác định MaPhong (quan trọng!)
      // Giả sử roomInfo có trường MaPhong (ID của phòng cụ thể)
      // Hoặc roomInfo là MaLoaiPhong và API holdBooking xử lý
      let maPhongToHold = roomInfo.MaPhong;
      if (!maPhongToHold && roomInfo.MaLoaiPhong) {
           console.warn(`MaPhong not found in roomInfo, using MaLoaiPhong: ${roomInfo.MaLoaiPhong} for holdBooking. Backend must support this.`);
           maPhongToHold = roomInfo.MaLoaiPhong; // Hoặc một logic khác để chọn phòng cụ thể
           // Nếu backend holdBooking yêu cầu MaPhong thì đây sẽ là lỗi.
      } else if (!maPhongToHold && !(roomInfo.MaLoaiPhong) ) {
           this.holdError = 'Missing MaPhong or MaLoaiPhong to hold the room.';
           this.isHoldingRoom = false;
           return;
      }

      const nights = differenceInDays(parseISO(searchCriteria.endDate), parseISO(searchCriteria.startDate)) || 1;
      const holdData = {
        MaKS: hotelInfo.MaKS,
        MaPhong: maPhongToHold, // Hoặc MaLoaiPhong: maPhongToHold nếu backend chấp nhận
        NgayNhanPhong: searchCriteria.startDate,
        NgayTraPhong: searchCriteria.endDate,
        SoLuongKhach: searchCriteria.numberOfGuests,
        TongTienDuKien: (roomInfo.GiaCoSo || 0) * nights,
        // YeuCauDacBiet: ...
      };

      try {
        const response = await axios.post(`/api/bookings/hold`, holdData);
        if (response.data && response.data.success) {
          this.heldBookingMaDat = response.data.MaDat;
          const HOLD_DURATION_MINUTES = 15; // Hoặc lấy từ response API
          this.heldBookingExpiresAt = Date.now() + HOLD_DURATION_MINUTES * 60 * 1000;
          this.selectedHotelDetails = hotelInfo;
          this.selectedRoomTypeDetails = roomInfo;
          this.currentStep = 3;
          this.maxCompletedStep = Math.max(this.maxCompletedStep, 2);
          this.clearPreselectedBookingIntent();
        } else {
          throw new Error(response.data.message || response.data.error || 'Failed to hold room.');
        }
      } catch (error) {
        console.error('Pinia store: Error holding room:', error);
        this.holdError = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to hold room.';
      } finally {
        this.isHoldingRoom = false;
      }
    },

     async finalizeBooking(formDataFromStep3) {
      this.isCreatingBooking = true; // Sử dụng cờ state mới
      this.createBookingError = null;  // Sử dụng state lỗi mới

      if (!this.heldBookingMaDat) {
        this.createBookingError = "No active booking hold found. Please select a room first.";
        this.isCreatingBooking = false; this.currentStep = 2; return;
      }
      if (this.heldBookingExpiresAt && Date.now() > this.heldBookingExpiresAt) {
          this.createBookingError = "Your booking hold has expired. Please start over.";
          this.isCreatingBooking = false; this.heldBookingMaDat = null; this.heldBookingExpiresAt = null;
          this.selectedHotelDetails = null; this.selectedRoomTypeDetails = null; this.currentStep = 1; return;
      }

      // API createBooking lấy bookingInfo (bao gồm MaDat) từ session của backend.
      // Frontend chỉ cần gửi các thông tin mà createBooking cần trong req.body.
      const payloadForCreateBooking = {
        guestInfo: { // Chuyển đổi tên trường từ frontend formData sang backend guestInfo
            HoTen: `${formDataFromStep3.guestInfo.firstName} ${formDataFromStep3.guestInfo.lastName}`,
            Email: formDataFromStep3.guestInfo.email,
            SDT: formDataFromStep3.guestInfo.phone,
            CCCD: formDataFromStep3.guestInfo.nationalId,
            // Đảm bảo ngày sinh được gửi đúng định dạng yyyy-MM-dd nếu backend cần
            NgaySinh: formDataFromStep3.guestInfo.birthDate ? format(parseISO(formDataFromStep3.guestInfo.birthDate), 'yyyy-MM-dd') : null,
            GioiTinh: formDataFromStep3.guestInfo.gender || null
        },
        paymentInfo: { // Gửi toàn bộ object paymentInfo, backend sẽ lấy HinhThucTT từ đây
            ...formDataFromStep3.paymentInfo,
            // Ví dụ, nếu backend cần một trường cụ thể cho hình thức thanh toán
            // HinhThucTT: 'Credit Card', // Hoặc lấy từ một lựa chọn trong form
        },
        services: formDataFromStep3.services || [], // Lấy từ formData nếu có
        promotionCode: formDataFromStep3.promotionCode || null // Lấy từ formData nếu có
        // billingAddress sẽ được backend xử lý thông qua guestInfo nếu nó tạo User từ guestInfo
        // Hoặc API createBooking của bạn cần một cách khác để nhận billingAddress
      };
      // Backend sẽ sử dụng req.session.bookingInfo để lấy MaDat và các thông tin đã giữ

      try {
        // Gọi API createBooking (POST /api/bookings/)
        console.log('Calling API POST /bookings with payload:', payloadForCreateBooking);
        const response = await axios.post(`/bookings`, payloadForCreateBooking);

        if (response.data && response.data.success) {
          this.finalBookingReference = response.data.data; // Lưu response { MaDat, MaHD, priceDetails, guestInfo (optional), ... }
          this.guestAndPaymentInput = formDataFromStep3; // Lưu lại form cuối cùng đã submit thành công
          this.currentStep = 4;
          this.maxCompletedStep = Math.max(this.maxCompletedStep, 3);
          // Xóa thông tin giữ chỗ cục bộ (backend sẽ xóa session của nó)
          this.heldBookingMaDat = null;
          this.heldBookingExpiresAt = null;
          this.holdError = null; // Xóa lỗi giữ phòng cũ nếu có
        } else {
          throw new Error(response.data.message || response.data.error || 'Failed to create booking.');
        }
      } catch (error) {
        console.error('Pinia store: Error calling createBooking API:', error);
        this.createBookingError = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create booking.';
        // Không chuyển bước, giữ người dùng ở Step 3 để họ thấy lỗi
      } finally {
        this.isCreatingBooking = false;
      }
    },

    startBookingFromScratch() {
      const intent = this.preselectedIntent;
      this.$reset();
      this.currentStep = 1; this.maxCompletedStep = 0;
      this.preselectedIntent = intent;
      this.roomsError = null; this.isLoadingRooms = false;
      this.holdError = null; this.isHoldingRoom = false;
      this.finalizeError = null; this.isFinalizingBooking = false;
      this.heldBookingMaDat = null; this.heldBookingExpiresAt = null;
    },

    navigateToStep(stepId) {
      if (stepId <= this.maxCompletedStep + 1) {
        if (stepId < this.currentStep) {
          if (stepId < 2) { // Về Step 1
            this.availableHotelsAndRooms = []; this.roomsError = null;
            this.selectedHotelDetails = null; this.selectedRoomTypeDetails = null;
            this.guestAndPaymentInput = null; this.finalBookingReference = null;
            this.heldBookingMaDat = null; this.heldBookingExpiresAt = null; this.holdError = null;
            this.finalizeError = null; this.clearPreselectedBookingIntent();
            this.maxCompletedStep = 0;
          } else if (stepId < 3) { // Về Step 2
            this.selectedHotelDetails = null; this.selectedRoomTypeDetails = null;
            this.guestAndPaymentInput = null; this.finalBookingReference = null;
            this.heldBookingMaDat = null; this.heldBookingExpiresAt = null; this.holdError = null;
            this.finalizeError = null; this.clearPreselectedBookingIntent();
            this.maxCompletedStep = Math.min(this.maxCompletedStep, 1);
          } else if (stepId < 4) { // Về Step 3
            this.finalBookingReference = null; this.finalizeError = null;
            this.maxCompletedStep = Math.min(this.maxCompletedStep, 2);
          }
        }
        this.currentStep = stepId;
      } else { /* ... */ }
    },

    resetBookingProcess() {
      this.startBookingFromScratch(); // Gọi startBookingFromScratch để reset kỹ hơn
    }
  },
  persist: true, // Sử dụng Pinia Persist để lưu trữ trạng thái
});