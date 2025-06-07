// src/store/bookingStore.js
import { defineStore } from 'pinia';
import { format, parseISO, differenceInDays } from 'date-fns';
import axios from 'axios';
import defaultRoomImagePlaceholder from '@/assets/mountain.jpg';

export const useBookingStore = defineStore('booking', {
  state: () => ({
    currentStep: 1,
    maxCompletedStep: 0,

    // --- Step 1 Data (Search) ---
    searchCriteria: null,        // { startDate, endDate, numberOfGuests, numberOfChildren (optional) }
    availableHotelsAndRooms: [], // Danh sách từ API cho Step 2
    isLoadingRooms: false,       // Loading khi search rooms
    roomsError: null,            // Lỗi khi search rooms

    // --- Intentions (for skipping Step 2) ---
    preselectedIntent: null,     // { hotelId, hotelName, roomTypeId, roomDetails (optional)}

    // --- Step 2 Data (Room Selection & Hold) ---
    selectedHotelDetails: null,   // Thông tin KS đã chọn (sau khi hold)
                                  // Cần chứa: MaKS, TenKS, DiaChi, HangSao, LoaiHinh, MoTaChung, SoDienThoaiKS, EmailKS, UrlBanDoKS, HinhAnhKS
    selectedRoomTypeDetails: null,// Thông tin loại phòng đã chọn (sau khi hold)
                                  // Cần chứa: MaLoaiPhong, TenLoaiPhong, GiaCoSo, TienNghi, HinhAnhPhong
    heldBookingMaDat: null,       // MaDat trả về từ API holdBooking
    heldBookingExpiresAt: null,   // Thời điểm hết hạn giữ chỗ (timestamp)
    isHoldingRoom: false,         // Loading khi đang gọi API holdBooking
    holdError: null,              // Lỗi khi gọi API holdBooking

    // --- Step 3 Data (Guest Info & Finalize) ---
    guestAndPaymentInput: null,   // Dữ liệu form đầy đủ từ Step 3 (sau khi API confirm)
                                  // Cấu trúc: { guestInfo: {...}, paymentInfo: {...}, services: [], promotionCode: '', agreedToTerms: true, billingAddress: {...} }
    isCreatingBooking: false,     // Loading khi đang gọi API createBooking
    createBookingError: null,

    // --- Step 4 Data (Confirmation) ---
    finalBookingReference: null,  // Object chứa response từ API createBooking { MaDat, MaHD, priceDetails, guestInfo (optional), ... }
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
      const taxesAndFeesCalc = subtotalCalc * 0.1;
      const totalAmountCalc = subtotalCalc + taxesAndFeesCalc;
      return {
        bookingDetail: { hotelInfo: hotel, roomInfo: room },
        searchInfo: {
          startDate: search.startDate, endDate: search.endDate,
          numberOfGuests: search.numberOfGuests, checkInDateFormatted: checkInFmt,
          checkOutDateFormatted: checkOutFmt, durationText: durationFmt,
          numberOfNights: nights
        },
        paymentSummaryPreview: {
            roomPricePerNight: roomPricePerNight, subtotal: subtotalCalc,
            taxesAndFees: taxesAndFeesCalc, totalAmount: totalAmountCalc,
        }
      };
    },
    dataForStep4Display: (state) => {
      if (!state.selectedHotelDetails || !state.selectedRoomTypeDetails || !state.searchCriteria || !state.guestAndPaymentInput || !state.finalBookingReference) {
        return null;
      }
      const hotel = state.selectedHotelDetails; // Object đầy đủ
      const room = state.selectedRoomTypeDetails;   // Object đầy đủ
      const search = state.searchCriteria;
      const guestInput = state.guestAndPaymentInput.guestInfo; // Từ formData Step 3
      const billingAddress = state.guestAndPaymentInput.billingAddress; // Từ formData Step 3

      let nights = 0;
      if (search.startDate && search.endDate) {
        try { nights = differenceInDays(parseISO(search.endDate), parseISO(search.startDate)); nights = nights < 0 ? 0 : nights; }
        catch (e) { console.error("Error calculating nights for Step4 display", e); }
      }

      const apiResponseData = state.finalBookingReference || {}; // Là data từ response của createBooking API
      const finalPaymentDetails = apiResponseData.priceDetails || {};

      const defaultRoomPrice = (room.GiaCoSo || 0) * nights;
      const totalRoomPriceCalc = finalPaymentDetails.roomPrice !== undefined ? finalPaymentDetails.roomPrice : defaultRoomPrice;
      const vatAmountCalc = finalPaymentDetails.vatAmount !== undefined ? finalPaymentDetails.vatAmount : totalRoomPriceCalc * 0.1;
      const totalServicePriceCalc = finalPaymentDetails.servicesPrice || 0;
      // Map promotion discount correctly from backend response
      const promotionDiscountCalc = finalPaymentDetails.promotion?.discountAmount || 0;
      const finalPriceCalc = finalPaymentDetails.finalPrice !== undefined
            ? finalPaymentDetails.finalPrice
            : apiResponseData.TongTienDuKien !== undefined
                ? apiResponseData.TongTienDuKien
            : (totalRoomPriceCalc + vatAmountCalc + totalServicePriceCalc - promotionDiscountCalc);

      return {
        bookingReference: apiResponseData.MaDat || 'N/A',
        invoiceReference: apiResponseData.MaHD || 'N/A',
        hotelInfo: {
          TenKS: hotel.TenKS, DiaChi: hotel.DiaChi,
          SoDienThoaiKS: hotel.SoDienThoaiKS || 'N/A', EmailKS: hotel.EmailKS || 'N/A',
          UrlBanDoKS: hotel.UrlBanDoKS || null, HinhAnhKS: hotel.HinhAnhKS || defaultRoomImagePlaceholder
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
          totalRoomPrice: totalRoomPriceCalc, 
          vatAmount: vatAmountCalc,
          totalServicePrice: totalServicePriceCalc, 
          promotionDiscount: promotionDiscountCalc,
          finalPrice: finalPriceCalc, 
          depositPaid: 0,
          totalAlreadyPaid: finalPriceCalc, 
          amountDue: finalPriceCalc // Show actual amount due instead of 0
        },
        customerDetails: {
          fullName: `${guestInput.title || ''} ${guestInput.firstName} ${guestInput.lastName}`.trim(),
          address: billingAddress.street || 'N/A',
          city: billingAddress.city || '',
          postalCode: billingAddress.postalCode || '',
          country: billingAddress.country || '',
          phone: guestInput.phone, email: guestInput.email
        },
        contactSupport: {
          phone: hotel.SoDienThoaiKS || '+84 DEMO-PHONE',
          email: hotel.EmailKS || 'support@example.com'
        }
      };
    },
    isTimerActive: (state) => {
        return !!state.heldBookingExpiresAt && state.currentStep === 3 && (state.heldBookingExpiresAt > Date.now());
    },
  },

  actions: {
    async setSearchCriteriaAndFetchRooms(searchData) {
      const oldSearchCriteria = this.searchCriteria ? JSON.parse(JSON.stringify(this.searchCriteria)) : null;
      const newSearchIsDifferent = !oldSearchCriteria ||
                                  searchData.startDate !== oldSearchCriteria.startDate ||
                                  searchData.endDate !== oldSearchCriteria.endDate ||
                                  searchData.numberOfGuests !== oldSearchCriteria.numberOfGuests;

      this.searchCriteria = searchData; // Luôn cập nhật searchCriteria mới
      if (this.maxCompletedStep < 0 && searchData) this.maxCompletedStep = 0;

      this.isLoadingRooms = true;
      this.roomsError = null;
      this.availableHotelsAndRooms = [];

      // QUAN TRỌNG: Logic xử lý lượt giữ hiện tại
      const isCurrentlyHolding = !!this.heldBookingMaDat && !!this.heldBookingExpiresAt && this.heldBookingExpiresAt > Date.now();

      if (isCurrentlyHolding && newSearchIsDifferent) {
        // Có lượt giữ còn hạn VÀ người dùng thực hiện một tìm kiếm MỚI KHÁC HẲN
        // Lúc này, không reset ngay thông tin giữ chỗ.
        // Step2 sẽ hiển thị thông báo "Action Required" và cho phép người dùng quyết định.
        console.log("[Store setSearch] New search criteria while a hold is active. Hold data will be kept for now.");
        this.preselectedIntent = null;
      } else if (!isCurrentlyHolding || newSearchIsDifferent) {
        // Không có lượt giữ còn hạn, HOẶC có nhưng tìm kiếm mới khác hẳn VÀ người dùng đã xử lý ở Step 2 (ví dụ Discard)
        // HOẶC đây là lần tìm kiếm đầu tiên.
        // Reset các thông tin liên quan đến lựa chọn và giữ phòng cũ.
        console.log("[Store setSearch] No active hold OR new search. Resetting hold/selection states.");
        this.heldBookingMaDat = null;
        this.heldBookingExpiresAt = null;
        this.holdError = null;
        this.selectedHotelDetails = null;
        this.selectedRoomTypeDetails = null;
      }
      // Nếu isCurrentlyHolding và newSearchIsSame, không làm gì cả với các state giữ chỗ.

      // Reset các state của bước sau nếu đây là một tìm kiếm mới thực sự khác
      if (newSearchIsDifferent) {
        this.guestAndPaymentInput = null;
        this.finalBookingReference = null;
        this.isCreatingBooking = false;
        this.createBookingError = null;
      }


      try {
        const res = await axios.get(`/api/bookings/search`, { params: this.searchCriteria }); // Dùng this.searchCriteria
        if (res.data && res.data.success) {
            this.availableHotelsAndRooms = res.data.data || [];
            this.currentStep = 2; // Luôn chuyển đến Step 2 để hiển thị kết quả mới hoặc thông báo "Action Required"
            this.maxCompletedStep = Math.max(this.maxCompletedStep, 1);
        } else {
            throw new Error(res.data.message || 'Search request did not return success.');
        }
      } catch (error) {
        console.error('Pinia store: Error fetching rooms:', error);
        this.roomsError = error.response?.data?.message || error.message || 'Failed to fetch rooms.';
      } finally {
        this.isLoadingRooms = false;
      }
    },

    async setPreselectedBookingIntent(intent) { this.preselectedIntent = intent; },
    clearPreselectedBookingIntent() { this.preselectedIntent = null; },

    async holdRoomAndProceed(payload) {
      this.isHoldingRoom = true; this.holdError = null;
      const { hotelInfo, roomInfo, searchCriteria } = payload;

      // Kiểm tra có MaLoaiPhong không
      if (!roomInfo.MaLoaiPhong) {
        this.holdError = 'Cannot hold room: Missing Room Type ID (MaLoaiPhong).';
        this.isHoldingRoom = false;
        return;
      }

      const nights = differenceInDays(parseISO(searchCriteria.endDate), parseISO(searchCriteria.startDate)) || 1;
      
      // Chỉ gửi MaLoaiPhong, để backend tự động tìm và assign phòng trống
      const holdData = {
        MaKS: hotelInfo.MaKS, 
        MaLoaiPhong: roomInfo.MaLoaiPhong, // Luôn gửi MaLoaiPhong thay vì MaPhong
        NgayNhanPhong: searchCriteria.startDate, 
        NgayTraPhong: searchCriteria.endDate,
        SoLuongKhach: searchCriteria.numberOfGuests,
        TongTienDuKien: (roomInfo.GiaCoSo || 0) * (nights > 0 ? nights : 1), // Đảm bảo nights > 0
      };

      console.log('Holding room with room type only - backend will auto-assign specific room:', holdData);

      try {
        const response = await axios.post(`/api/bookings/hold`, holdData);
        if (response.data && response.data.success) {
          this.heldBookingMaDat = response.data.MaDat;
          const HOLD_DURATION_MINUTES = 15;
          this.heldBookingExpiresAt = Date.now() + HOLD_DURATION_MINUTES * 60 * 1000;
          this.selectedHotelDetails = { ...hotelInfo }; // Lưu bản sao
          this.selectedRoomTypeDetails = { 
            ...roomInfo, 
            assignedRoomId: response.data.assignedRoomId // Lưu ID phòng được assign
          }; 
          
          console.log(`Successfully held room type ${roomInfo.MaLoaiPhong}, assigned room ID: ${response.data.assignedRoomId}`);
          
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

     handleTimerExpiration() {
      // Chỉ thực hiện nếu thực sự đang có lượt giữ và nó có thể đã hết hạn
      // và this.heldBookingMaDat chưa bị clear (tức là chưa xử lý hết hạn trước đó)
      if (this.heldBookingMaDat && this.heldBookingExpiresAt) {
        // Kiểm tra thời gian hiện tại so với heldBookingExpiresAt
        if (Date.now() >= this.heldBookingExpiresAt) {
            console.log("[Store] Timer has explicitly expired via handleTimerExpiration. Clearing hold.");
            // Set lỗi này để Step3_GuestInfo có thể hiển thị một thông báo cụ thể và chính xác
            this.holdError = "Your booking hold has expired. Please go back to room selection and try again.";
            this.heldBookingMaDat = null;
            this.heldBookingExpiresAt = null; 
            this.isHoldingRoom = false; 
        } else {
            console.log("[Store] handleTimerExpiration called, but time still remaining based on Date.now(). No action.");
        }
      } else {
        console.log("[Store] handleTimerExpiration called, but no active hold (MaDat or ExpiresAt is null).");
      }
    },

    async finalizeBooking(formDataFromStep3) {
      this.isCreatingBooking = true;
      this.createBookingError = null;

      if (!this.heldBookingMaDat) {
        this.createBookingError = 'Cannot finalize booking: No held booking found. Please hold a room first.';
        this.isCreatingBooking = false;
        this.startBookingFromScratch(); // Reset booking state
        return;
         }
      if (this.heldBookingExpiresAt && Date.now() > this.heldBookingExpiresAt) { 
        this.isTimerActive = false; // Dừng timer nếu booking đã hết hạn
        this.heldBookingMaDat = null; 
        this.heldBookingExpiresAt = null; 
        this.holdError = null;
        this.isCreatingBooking = false;
        this.createBookingError = 'Cannot finalize booking: Held booking has expired. Please hold a room again.';        
        return; }

      const payloadForCreateBooking = {
        guestInfo: {
            HoTen: `${formDataFromStep3.guestInfo.firstName || ''} ${formDataFromStep3.guestInfo.lastName || ''}`.trim(),
            Email: formDataFromStep3.guestInfo.email,
            SDT: formDataFromStep3.guestInfo.phone,
            CCCD: formDataFromStep3.guestInfo.nationalId || null,
            NgaySinh: formDataFromStep3.guestInfo.birthDate ? format(parseISO(formDataFromStep3.guestInfo.birthDate), 'yyyy-MM-dd') : null,
            GioiTinh: formDataFromStep3.guestInfo.gender || null
        },
        paymentInfo: { ...formDataFromStep3.paymentInfo }, // API createBooking sẽ lấy HinhThucTT từ đây
        services: formDataFromStep3.services || [],
        promotionCode: formDataFromStep3.promotionCode || null
      };
      // API createBooking ở backend sẽ sử dụng req.session.bookingInfo (do holdBooking tạo) để lấy MaDat và chi tiết phòng/KS đã giữ.

      try {
        console.log('Calling API POST /api/bookings (createBooking) with payload:', payloadForCreateBooking);
        const response = await axios.post(`/api/bookings`, payloadForCreateBooking);

        if (response.data && response.data.success) {
          this.finalBookingReference = response.data.data; // { MaDat, MaHD, priceDetails, etc. }
          this.guestAndPaymentInput = { ...formDataFromStep3 }; 
          this.currentStep = 4;
          this.maxCompletedStep = Math.max(this.maxCompletedStep, 3);
          this.heldBookingMaDat = null;
          this.heldBookingExpiresAt = null;
          this.holdError = null;
        } else {
          throw new Error(response.data.message || response.data.error || 'Failed to create booking.');
        }
      } catch (error) {
        console.error('Pinia store: Error calling createBooking API:', error);
        this.createBookingError = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create booking.';
      } finally {
        this.isCreatingBooking = false;
      }
    },
    async startBookingFromScratch() {
      this.$reset();
      this.currentStep = 1; 
      this.maxCompletedStep = 0; 
      this.preselectedIntent = null
      this.roomsError = null; 
      this.isLoadingRooms = false; 
      this.holdError = null;
      this.isHoldingRoom = false; 
      this.createBookingError = null; 
      this.isCreatingBooking = false;
      this.heldBookingMaDat = null; 
      this.heldBookingExpiresAt = null;

    },



    RefreshState() { 
      this.preselectedIntent = null;
      this.roomsError = null; 
      this.isLoadingRooms = false; 
      this.holdError = null;
    },

    async startBookingFromScratchForHotelDetails() {
      // const intent = this.preselectedIntent;
      this.$reset();
      this.currentStep = 1; 
      this.maxCompletedStep = 0; 
      // this.preselectedIntent = intent;
      this.roomsError = null; 
      this.isLoadingRooms = false; 
      this.holdError = null;
      this.isHoldingRoom = false; 
      this.createBookingError = null; 
      this.isCreatingBooking = false;
      this.heldBookingMaDat = null; 
      this.heldBookingExpiresAt = null;
    },

    navigateToStep(stepId) {
      console.log(`[Store] navigateToStep called with stepId: ${stepId}, current step: ${this.currentStep}, maxCompletedStep: ${this.maxCompletedStep}`);
      
      // Special case: Allow navigation to Step 3 if user has active hold booking
      const hasActiveHoldBooking = this.heldBookingMaDat && 
                                   this.heldBookingExpiresAt && 
                                   this.heldBookingExpiresAt > Date.now() &&
                                   this.selectedHotelDetails &&
                                   this.selectedRoomTypeDetails;
      
      const maxAllowedStep = hasActiveHoldBooking ? Math.max(this.maxCompletedStep + 1, 3) : this.maxCompletedStep + 1;
      console.log(`[Store] hasActiveHoldBooking: ${hasActiveHoldBooking}, maxAllowedStep: ${maxAllowedStep}`);
      
      if (stepId <= maxAllowedStep) {
        if (stepId < this.currentStep) {
          if (stepId < 2) { // Về Step 1
            this.availableHotelsAndRooms = [];
            this.roomsError = null;
            this.guestAndPaymentInput = null;
            this.finalBookingReference = null;
            this.createBookingError = null;
            this.clearPreselectedBookingIntent();
            this.maxCompletedStep = 0;
          } else if (stepId < 3) { // Về Step 2
            console.log('[Store] Navigating back to Step 2, keeping hold booking data');
            // this.selectedHotelDetails = null; 
            // this.selectedRoomTypeDetails = null;
            this.guestAndPaymentInput = null; 
            this.finalBookingReference = null;
            // this.heldBookingMaDat = null; 
            // this.heldBookingExpiresAt = null;
            // this.holdError = null;
            this.createBookingError = null; 
            this.clearPreselectedBookingIntent();
            this.maxCompletedStep = Math.max(this.maxCompletedStep, 1);
          } else if (stepId < 4) { // Về Step 3
            console.log('[Store] Navigating back to Step 3, keeping hold and guest data');
            this.finalBookingReference = null; this.createBookingError = null;
            // Khi về Step 3, guestAndPaymentInput VẪN NÊN ĐƯỢC GIỮ NGUYÊN để người dùng sửa
            // Thông tin hold (heldBookingMaDat, selectedDetails) cũng nên được giữ.
            this.maxCompletedStep = Math.max(this.maxCompletedStep, 2);
          }
        } else if (stepId > this.currentStep) {
          console.log(`[Store] Navigating forward to Step ${stepId}`);
          // When moving forward, just update maxCompletedStep if needed
          this.maxCompletedStep = Math.max(this.maxCompletedStep, stepId - 1);
        }
        
        this.currentStep = stepId;
        console.log(`[Store] Navigation completed. New current step: ${this.currentStep}, maxCompletedStep: ${this.maxCompletedStep}`);
      } else { 
        console.warn(`[Store] Cannot navigate to uncompleted step ${stepId}. Max allowed: ${maxAllowedStep}, maxCompleted: ${this.maxCompletedStep}`); 
      }
    },

    resetBookingProcess() {
      this.startBookingFromScratch();
    }
  },
  persist: {
  storage: localStorage,
  paths: [ 
    'currentStep', 'maxCompletedStep', 'searchCriteria',
    'preselectedIntent', 'selectedHotelDetails', 'selectedRoomTypeDetails',
    'heldBookingMaDat', 'heldBookingExpiresAt',
    'guestAndPaymentInput', 'finalBookingReference' // QUAN TRỌNG: finalBookingReference cũng cần persist để logic này hoạt động
  ],
  afterRestore: (context) => {
    console.log('[PiniaPersist] After restoring booking store. Current Step:', context.store.currentStep);

    // Reset cờ loading
    context.store.isLoadingRooms = false;
    context.store.isHoldingRoom = false;
    context.store.isCreatingBooking = false; // Đổi tên cho khớp

    // 1. Xử lý lượt giữ hết hạn
    if (context.store.heldBookingMaDat && context.store.heldBookingExpiresAt && Date.now() > context.store.heldBookingExpiresAt) {
      console.warn('[PiniaPersist] Held booking expired after restore. Clearing hold data.');
      context.store.heldBookingMaDat = null;
      context.store.heldBookingExpiresAt = null;
      context.store.holdError = "Your previous room hold has expired. Please select a room again.";
      if (context.store.currentStep === 3) {
         context.store.currentStep = 2; // Buộc người dùng hold lại
         context.store.maxCompletedStep = Math.min(context.store.maxCompletedStep, 1);
      }
    }

    // 2. XỬ LÝ KHI KHÔI PHỤC STATE Ở STEP 4
    // Nếu người dùng đã ở Step 4 (tức là booking đã hoàn tất), và họ refresh trang hoặc mở lại tab,
    // có thể bạn muốn họ thấy trang xác nhận đó MỘT LẦN, nhưng sau đó nếu họ điều hướng đi đâu đó
    // hoặc cố gắng bắt đầu một booking mới, store nên được reset.
    // Cách đơn giản là nếu họ đã ở Step 4, lần truy cập sau nên bắt đầu lại từ đầu.
    if (context.store.currentStep === 4 && context.store.finalBookingReference) {
      console.log('[PiniaPersist] Restored to Step 4. This booking is considered complete.');
      // Không reset ngay ở đây, vì người dùng có thể muốn xem lại trang xác nhận nếu họ F5.
      // Việc reset sẽ do onBeforeUnmount của Step4 hoặc onBeforeRouteLeave của BookingProcess đảm nhận khi họ rời đi.
      // HOẶC, bạn có thể đặt một cờ "seenConfirmation" và reset ở lần tải sau nếu cờ này true.

      // MỘT CÁCH KHÁC: Reset NGAY LẬP TỨC sau khi họ đã ở Step 4 và refresh/mở lại.
      // Điều này có nghĩa là trang xác nhận chỉ thực sự "sống" cho đến khi họ rời đi hoặc refresh.
      // bookingStore.resetBookingProcess(); // Sẽ đưa currentStep về 1
      // return; // Dừng các xử lý khác nếu đã reset.
      // => Cách này sẽ khiến người dùng không xem lại được trang xác nhận sau khi F5.
    }

    // 3. Kiểm tra tính toàn vẹn dữ liệu cho các bước khác (tương tự onMounted của BookingProcess)
    if (context.store.currentStep === 2 && !context.store.searchCriteria) {
        console.warn("[PiniaPersist] On Step 2 without searchCriteria. Resetting.");
        context.store.$reset(); // Gọi $reset để quay về state ban đầu của store định nghĩa
        context.store.currentStep = 1; // Đảm bảo là step 1
    } else if (context.store.currentStep === 3 && (!context.store.selectedHotelDetails || !context.store.heldBookingMaDat)) {
        console.warn("[PiniaPersist] On Step 3 with incomplete pre-requisites. Resetting.");
        context.store.$reset();
        context.store.currentStep = 1;
    }
    // Không cần fetch lại availableHotelsAndRooms ở đây vì nó không được persist
  }
}
});