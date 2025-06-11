// src/store/bookingStore.js
// Pinia store quản lý toàn bộ quy trình đặt phòng từ tìm kiếm đến hoàn tất booking
import { defineStore } from 'pinia'; // Pinia store definition
import { format, parseISO, differenceInDays } from 'date-fns'; // Xử lý ngày tháng
import axios from 'axios'; // HTTP client để gọi API
import defaultRoomImagePlaceholder from '@/assets/mountain.jpg'; // Ảnh mặc định khi không có ảnh phòng

/**
 * Booking Store - Quản lý toàn bộ quy trình đặt phòng gồm 4 bước:
 * Step 1: Tìm kiếm phòng (search criteria)
 * Step 2: Chọn phòng và giữ chỗ (room selection & hold)
 * Step 3: Nhập thông tin khách và thanh toán (guest info & payment)
 * Step 4: Xác nhận hoàn tất booking (confirmation)
 */
export const useBookingStore = defineStore('booking', {
  // Định nghĩa state reactive của store
  state: () => ({
    // === NAVIGATION STATE ===
    currentStep: 1,          // Bước hiện tại trong quy trình đặt phòng (1-4)
    maxCompletedStep: 0,     // Bước cao nhất đã hoàn thành (để kiểm soát navigation)

    // === STEP 1: TÌM KIẾM PHÒNG ===
    searchCriteria: null,        // Tiêu chí tìm kiếm: { startDate, endDate, numberOfGuests, numberOfChildren }
    availableHotelsAndRooms: [], // Danh sách khách sạn và phòng trống từ API search
    isLoadingRooms: false,       // Trạng thái loading khi đang tìm kiếm phòng
    roomsError: null,            // Lỗi khi tìm kiếm phòng

    // === PRESELECTED BOOKING INTENT ===
    // Dùng để bỏ qua Step 2 khi user click booking từ hotel detail page
    preselectedIntent: null,     // { hotelId, hotelName, roomTypeId, roomDetails }

    // === STEP 2: CHỌN PHÒNG VÀ GIỮ CHỖ ===
    selectedHotelDetails: null,   // Thông tin chi tiết khách sạn đã chọn (sau khi hold)
                                  // Chứa: MaKS, TenKS, DiaChi, HangSao, LoaiHinh, MoTaChung, SoDienThoaiKS, EmailKS, UrlBanDoKS, HinhAnhKS
    selectedRoomTypeDetails: null,// Thông tin loại phòng đã chọn (sau khi hold)
                                  // Chứa: MaLoaiPhong, TenLoaiPhong, GiaCoSo, TienNghi, HinhAnhPhong
    heldBookingMaDat: null,       // Mã đặt phòng tạm thời từ API holdBooking
    heldBookingExpiresAt: null,   // Thời điểm hết hạn giữ chỗ (timestamp milliseconds)
    isHoldingRoom: false,         // Trạng thái loading khi đang gọi API hold phòng
    holdError: null,              // Lỗi khi gọi API hold phòng

    // === STEP 3: THÔNG TIN KHÁCH VÀ THANH TOÁN ===
    guestAndPaymentInput: null,   // Dữ liệu form từ Step 3 (sau khi API confirm)
                                  // Cấu trúc: { guestInfo: {...}, paymentInfo: {...}, services: [], promotionCode: '', agreedToTerms: true, billingAddress: {...} }
    isCreatingBooking: false,     // Trạng thái loading khi đang tạo booking
    createBookingError: null,     // Lỗi khi tạo booking

    // === STEP 4: XÁC NHẬN HOÀN TẤT ===
    finalBookingReference: null,  // Kết quả cuối cùng từ API createBooking
                                  // Chứa: { MaDat, MaHD, priceDetails, guestInfo, ... }
  }),

  // Các computed properties để xử lý và format dữ liệu hiển thị
  getters: {
    /**
     * Tính toán và format dữ liệu hiển thị cho Step 3
     * Bao gồm: thông tin booking, tóm tắt giá cả, thông tin lưu trú
     * @returns {Object|null} Dữ liệu đã format cho Step 3 display
     */
    dataForStep3Display: (state) => {
      // Kiểm tra có đủ dữ liệu cần thiết không
      if (!state.selectedHotelDetails || !state.selectedRoomTypeDetails || !state.searchCriteria) {
        return null;
      }
      
      const search = state.searchCriteria;
      const hotel = state.selectedHotelDetails;
      const room = state.selectedRoomTypeDetails;
      
      // Tính toán số đêm và format ngày tháng
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
          durationFmt = `${nights + 1}D, ${nights}N`; // Ví dụ: "3D, 2N"
        } catch (e) { 
          console.error("Lỗi tính toán ngày tháng trong dataForStep3Display:", e); 
        }
      }
      
      // Tính toán giá tạm thời (preview, chưa final)
      const roomPricePerNight = room.GiaCoSo || 0;
      const subtotalCalc = roomPricePerNight * nights;
      const taxesAndFeesCalc = subtotalCalc * 0.1; // VAT 10%
      const totalAmountCalc = subtotalCalc + taxesAndFeesCalc;
      
      return {
        bookingDetail: { 
          hotelInfo: hotel, 
          roomInfo: room 
        },
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

    /**
     * Tính toán và format dữ liệu hiển thị cho Step 4 (confirmation)
     * Bao gồm: chi tiết booking cuối cùng, thông tin thanh toán, thông tin khách hàng
     * @returns {Object|null} Dữ liệu đã format cho Step 4 display
     */
    dataForStep4Display: (state) => {
      // Kiểm tra có đủ dữ liệu để hiển thị Step 4 không
      if (!state.selectedHotelDetails || !state.selectedRoomTypeDetails || 
          !state.searchCriteria || !state.guestAndPaymentInput || !state.finalBookingReference) {
        return null;
      }
      
      const hotel = state.selectedHotelDetails;
      const room = state.selectedRoomTypeDetails;
      const search = state.searchCriteria;
      const guestInput = state.guestAndPaymentInput.guestInfo;
      const billingAddress = state.guestAndPaymentInput.billingAddress;

      // Tính số đêm lưu trú
      let nights = 0;
      if (search.startDate && search.endDate) {
        try { 
          nights = differenceInDays(parseISO(search.endDate), parseISO(search.startDate)); 
          nights = nights < 0 ? 0 : nights; 
        }
        catch (e) { 
          console.error("Lỗi tính toán số đêm cho Step 4:", e); 
        }
      }

      // Lấy thông tin giá cuối cùng từ API response
      const apiResponseData = state.finalBookingReference || {};
      const finalPaymentDetails = apiResponseData.priceDetails || {};

      // Tính toán các loại giá (ưu tiên dữ liệu từ API, fallback về tính toán local)
      const defaultRoomPrice = (room.GiaCoSo || 0) * nights;
      const totalRoomPriceCalc = finalPaymentDetails.roomPrice !== undefined ? finalPaymentDetails.roomPrice : defaultRoomPrice;
      const vatAmountCalc = finalPaymentDetails.vatAmount !== undefined ? finalPaymentDetails.vatAmount : totalRoomPriceCalc * 0.1;
      const totalServicePriceCalc = finalPaymentDetails.servicesPrice || 0;
      const promotionDiscountCalc = finalPaymentDetails.promotion?.discountAmount || 0;
      
      // Tính tổng tiền cuối cùng
      const finalPriceCalc = finalPaymentDetails.finalPrice !== undefined
            ? finalPaymentDetails.finalPrice
            : apiResponseData.TongTienDuKien !== undefined
                ? apiResponseData.TongTienDuKien
            : (totalRoomPriceCalc + vatAmountCalc + totalServicePriceCalc - promotionDiscountCalc);

      return {
        // Thông tin tham chiếu booking
        bookingReference: apiResponseData.MaDat || 'N/A',
        invoiceReference: apiResponseData.MaHD || 'N/A',
        
        // Thông tin khách sạn
        hotelInfo: {
          TenKS: hotel.TenKS, 
          DiaChi: hotel.DiaChi,
          SoDienThoaiKS: hotel.SoDienThoaiKS || 'N/A', 
          EmailKS: hotel.EmailKS || 'N/A',
          UrlBanDoKS: hotel.UrlBanDoKS || null, 
          HinhAnhKS: hotel.HinhAnhKS || defaultRoomImagePlaceholder
        },
        
        // Thông tin lưu trú
        stayInfo: {
          checkInDateFormatted: search.startDate ? format(parseISO(search.startDate), 'EEE, d MMM yyyy') : '–',
          checkOutDateFormatted: search.endDate ? format(parseISO(search.endDate), 'EEE, d MMM yyyy') : '–',
          numberOfNights: nights,
          durationText: search.startDate && search.endDate ? `${nights + 1}D, ${nights}N` : '–',
          numberOfAdults: search.numberOfGuests,
          numberOfChildren: search.numberOfChildren || 0
        },
        
        // Thông tin phòng
        roomInfo: {
          TenLoaiPhong: room.TenLoaiPhong,
          TienNghiChinh: room.TienNghi ? room.TienNghi.split(',').map(s => s.trim()).slice(0, 3) : [],
          HinhAnhPhong: room.HinhAnhPhong || defaultRoomImagePlaceholder
        },
        
        // Tóm tắt thanh toán cuối cùng
        paymentSummary: {
          totalRoomPrice: totalRoomPriceCalc, 
          vatAmount: vatAmountCalc,
          totalServicePrice: totalServicePriceCalc, 
          promotionDiscount: promotionDiscountCalc,
          finalPrice: finalPriceCalc, 
          depositPaid: 0,
          totalAlreadyPaid: finalPriceCalc, 
          amountDue: finalPriceCalc // Hiển thị số tiền thực tế cần thanh toán
        },
        
        // Thông tin khách hàng
        customerDetails: {
          fullName: `${guestInput.title || ''} ${guestInput.firstName} ${guestInput.lastName}`.trim(),
          address: billingAddress.street || 'N/A',
          city: billingAddress.city || '',
          postalCode: billingAddress.postalCode || '',
          country: billingAddress.country || '',
          phone: guestInput.phone, 
          email: guestInput.email
        },
        
        // Thông tin liên hệ hỗ trợ
        contactSupport: {
          phone: hotel.SoDienThoaiKS || '09069391759',
          email: hotel.EmailKS || 'ChillCHill@gmail.com'
        }
      };
    },

    /**
     * Kiểm tra xem timer giữ chỗ có đang hoạt động không
     * @returns {boolean} True nếu đang ở Step 3 và còn thời gian giữ chỗ
     */
    isTimerActive: (state) => {
      return !!state.heldBookingExpiresAt && 
             state.currentStep === 3 && 
             (state.heldBookingExpiresAt > Date.now());
    },
  },

  // Các actions để thay đổi state và gọi API
  actions: {
    /**
     * Đặt tiêu chí tìm kiếm và gọi API tìm phòng trống
     * @param {Object} searchData - Tiêu chí tìm kiếm
     * @param {string} searchData.startDate - Ngày nhận phòng (YYYY-MM-DD)
     * @param {string} searchData.endDate - Ngày trả phòng (YYYY-MM-DD)
     * @param {number} searchData.numberOfGuests - Số khách
     * @param {number} searchData.numberOfChildren - Số trẻ em (optional)
     */
    async setSearchCriteriaAndFetchRooms(searchData) {
      // So sánh với tiêu chí tìm kiếm cũ để xem có thay đổi không
      const oldSearchCriteria = this.searchCriteria ? JSON.parse(JSON.stringify(this.searchCriteria)) : null;
      const newSearchIsDifferent = !oldSearchCriteria ||
                                  searchData.startDate !== oldSearchCriteria.startDate ||
                                  searchData.endDate !== oldSearchCriteria.endDate ||
                                  searchData.numberOfGuests !== oldSearchCriteria.numberOfGuests;

      // Cập nhật tiêu chí tìm kiếm mới
      this.searchCriteria = searchData;
      if (this.maxCompletedStep < 0 && searchData) this.maxCompletedStep = 0;

      // Đặt trạng thái loading và clear lỗi
      this.isLoadingRooms = true;
      this.roomsError = null;
      this.availableHotelsAndRooms = [];

      // LOGIC QUAN TRỌNG: Xử lý trường hợp đang có booking hold
      const isCurrentlyHolding = !!this.heldBookingMaDat && 
                                 !!this.heldBookingExpiresAt && 
                                 this.heldBookingExpiresAt > Date.now();

      if (isCurrentlyHolding && newSearchIsDifferent) {
        // Có booking đang hold VÀ user tìm kiếm với tiêu chí mới khác
        // Không reset thông tin hold ngay, để Step 2 xử lý
        console.log("[Store] Tìm kiếm mới trong khi đang hold phòng. Giữ nguyên data hold để user quyết định.");
        this.preselectedIntent = null;
      } else if (!isCurrentlyHolding || newSearchIsDifferent) {
        // Không có hold hoặc tìm kiếm mới khác hẳn
        // Reset các thông tin liên quan đến hold và selection cũ
        console.log("[Store] Không có hold active hoặc tìm kiếm mới. Reset trạng thái hold/selection.");
        this.heldBookingMaDat = null;
        this.heldBookingExpiresAt = null;
        this.holdError = null;
        this.selectedHotelDetails = null;
        this.selectedRoomTypeDetails = null;
      }

      // Reset các state của bước sau nếu đây là tìm kiếm mới thực sự khác
      if (newSearchIsDifferent) {
        this.guestAndPaymentInput = null;
        this.finalBookingReference = null;
        this.isCreatingBooking = false;
        this.createBookingError = null;
      }

      try {
        // Gọi API tìm kiếm phòng trống với tiêu chí đã set
        const res = await axios.get(`/api/bookings/search`, { params: this.searchCriteria });
        
        if (res.data && res.data.success) {
          // Lưu kết quả tìm kiếm vào store
          this.availableHotelsAndRooms = res.data.data || [];
          // Luôn chuyển đến Step 2 để hiển thị kết quả hoặc thông báo "Action Required"
          this.currentStep = 2;
          this.maxCompletedStep = Math.max(this.maxCompletedStep, 1);
        } else {
          throw new Error(res.data.message || 'Yêu cầu tìm kiếm không thành công.');
        }
      } catch (error) {
        console.error('Lỗi khi tìm kiếm phòng:', error);
        this.roomsError = error.response?.data?.message || error.message || 'Tìm kiếm phòng thất bại.';
      } finally {
        this.isLoadingRooms = false;
      }
    },

    /**
     * Đặt booking intent được chọn sẵn (khi user click book từ hotel detail)
     * @param {Object} intent - Intent booking: { hotelId, hotelName, roomTypeId, roomDetails }
     */
    async setPreselectedBookingIntent(intent) { 
      this.preselectedIntent = intent; 
    },

    /**
     * Xóa preselected booking intent
     */
    clearPreselectedBookingIntent() { 
      this.preselectedIntent = null; 
    },

    /**
     * Giữ chỗ phòng và chuyển sang Step 3
     * @param {Object} payload - Dữ liệu để hold phòng
     * @param {Object} payload.hotelInfo - Thông tin khách sạn
     * @param {Object} payload.roomInfo - Thông tin loại phòng
     * @param {Object} payload.searchCriteria - Tiêu chí tìm kiếm
     */
    async holdRoomAndProceed(payload) {
      this.isHoldingRoom = true; 
      this.holdError = null;
      const { hotelInfo, roomInfo, searchCriteria } = payload;

      // Kiểm tra dữ liệu đầu vào
      if (!roomInfo.MaLoaiPhong) {
        this.holdError = 'Không thể giữ phòng: Thiếu mã loại phòng (MaLoaiPhong).';
        this.isHoldingRoom = false;
        return;
      }

      // Tính số đêm lưu trú
      const nights = differenceInDays(parseISO(searchCriteria.endDate), parseISO(searchCriteria.startDate)) || 1;
      
      // Chuẩn bị dữ liệu để gửi API hold
      // Chỉ gửi MaLoaiPhong, backend sẽ tự động tìm và assign phòng trống cụ thể
      const holdData = {
        MaKS: hotelInfo.MaKS, 
        MaLoaiPhong: roomInfo.MaLoaiPhong, // Gửi mã loại phòng thay vì mã phòng cụ thể
        NgayNhanPhong: searchCriteria.startDate, 
        NgayTraPhong: searchCriteria.endDate,
        SoLuongKhach: searchCriteria.numberOfGuests,
        TongTienDuKien: (roomInfo.GiaCoSo || 0) * (nights > 0 ? nights : 1), // Tổng tiền dự kiến
      };

      console.log('Giữ chỗ phòng với loại phòng - backend sẽ tự assign phòng cụ thể:', holdData);

      try {
        // Gọi API hold phòng
        const response = await axios.post(`/api/bookings/hold`, holdData);
        
        if (response.data && response.data.success) {
          // Lưu thông tin booking đã hold
          this.heldBookingMaDat = response.data.MaDat;
          const HOLD_DURATION_MINUTES = 15; // Thời gian giữ chỗ: 15 phút
          this.heldBookingExpiresAt = Date.now() + HOLD_DURATION_MINUTES * 60 * 1000;
          
          // Lưu thông tin khách sạn và phòng đã chọn
          this.selectedHotelDetails = { ...hotelInfo }; // Tạo bản sao để tránh mutation
          this.selectedRoomTypeDetails = { 
            ...roomInfo, 
            assignedRoomId: response.data.assignedRoomId // Lưu ID phòng được backend assign
          }; 
          
          console.log(`Giữ chỗ thành công loại phòng ${roomInfo.MaLoaiPhong}, phòng được assign: ${response.data.assignedRoomId}`);
          
          // Chuyển sang Step 3 và cập nhật progress
          this.currentStep = 3;
          this.maxCompletedStep = Math.max(this.maxCompletedStep, 2);
          this.clearPreselectedBookingIntent();
        } else {
          throw new Error(response.data.message || response.data.error || 'Giữ chỗ phòng thất bại.');
        }
      } catch (error) {
        console.error('Lỗi khi giữ chỗ phòng:', error);
        this.holdError = error.response?.data?.error || error.response?.data?.message || error.message || 'Giữ chỗ phòng thất bại.';
      } finally {
        this.isHoldingRoom = false;
      }
    },

    /**
     * Xử lý khi timer giữ chỗ hết hạn
     * Được gọi bởi countdown timer component
     */
    handleTimerExpiration() {
      // Kiểm tra có đang hold booking và có thể đã hết hạn không
      if (this.heldBookingMaDat && this.heldBookingExpiresAt) {
        // So sánh thời gian hiện tại với thời gian hết hạn
        if (Date.now() >= this.heldBookingExpiresAt) {
          console.log("[Store] Timer đã hết hạn, clearing hold booking.");
          // Đặt error message để Step 3 có thể hiển thị thông báo
          this.holdError = "Thời gian giữ chỗ đã hết hạn. Vui lòng quay lại chọn phòng và thử lại.";
          // Clear các thông tin hold
          this.heldBookingMaDat = null;
          this.heldBookingExpiresAt = null; 
          this.isHoldingRoom = false; 
        } else {
          console.log("[Store] handleTimerExpiration được gọi nhưng vẫn còn thời gian. Không thực hiện action.");
        }
      } else {
        console.log("[Store] handleTimerExpiration được gọi nhưng không có hold active.");
      }
    },

    /**
     * Hoàn tất booking với thông tin từ Step 3
     * @param {Object} formDataFromStep3 - Dữ liệu form từ Step 3
     * @param {Object} formDataFromStep3.guestInfo - Thông tin khách hàng
     * @param {Object} formDataFromStep3.paymentInfo - Thông tin thanh toán
     * @param {Array} formDataFromStep3.services - Danh sách dịch vụ
     * @param {string} formDataFromStep3.promotionCode - Mã khuyến mãi
     * @param {Object} formDataFromStep3.billingAddress - Địa chỉ thanh toán
     */
    async finalizeBooking(formDataFromStep3) {
      this.isCreatingBooking = true;
      this.createBookingError = null;

      // Kiểm tra có booking hold không
      if (!this.heldBookingMaDat) {
        this.createBookingError = 'Không thể hoàn tất booking: Không tìm thấy booking đã giữ chỗ. Vui lòng giữ chỗ phòng trước.';
        this.isCreatingBooking = false;
        this.startBookingFromScratch(); // Reset trạng thái booking
        return;
      }

      // Kiểm tra booking hold có hết hạn không
      if (this.heldBookingExpiresAt && Date.now() > this.heldBookingExpiresAt) { 
        this.isTimerActive = false; // Dừng timer
        // Clear thông tin hold đã hết hạn
        this.heldBookingMaDat = null; 
        this.heldBookingExpiresAt = null; 
        this.holdError = null;
        this.isCreatingBooking = false;
        this.createBookingError = 'Không thể hoàn tất booking: Booking đã hết hạn giữ chỗ. Vui lòng giữ chỗ phòng lại.';        
        return; 
      }

      // Chuẩn bị payload để gửi API create booking
      const payloadForCreateBooking = {
        guestInfo: {
          // Format lại tên đầy đủ
          HoTen: `${formDataFromStep3.guestInfo.firstName || ''} ${formDataFromStep3.guestInfo.lastName || ''}`.trim(),
          Email: formDataFromStep3.guestInfo.email,
          SDT: formDataFromStep3.guestInfo.phone,
          CCCD: formDataFromStep3.guestInfo.nationalId || null,
          // Format ngày sinh về YYYY-MM-DD
          NgaySinh: formDataFromStep3.guestInfo.birthDate ? format(parseISO(formDataFromStep3.guestInfo.birthDate), 'yyyy-MM-dd') : null,
          GioiTinh: formDataFromStep3.guestInfo.gender || null
        },
        paymentInfo: { ...formDataFromStep3.paymentInfo }, // API sẽ lấy HinhThucTT từ đây
        services: formDataFromStep3.services || [], // Danh sách dịch vụ đã chọn
        promotionCode: formDataFromStep3.promotionCode || null // Mã khuyến mãi
      };
      
      // Lưu ý: API createBooking sẽ sử dụng req.session.bookingInfo (được tạo bởi holdBooking) 
      // để lấy MaDat và chi tiết phòng/khách sạn đã giữ

      try {
        console.log('Gọi API POST /api/bookings (createBooking) với payload:', payloadForCreateBooking);
        const response = await axios.post(`/api/bookings`, payloadForCreateBooking);

        if (response.data && response.data.success) {
          // Lưu kết quả booking cuối cùng
          this.finalBookingReference = response.data.data; // { MaDat, MaHD, priceDetails, etc. }
          this.guestAndPaymentInput = { ...formDataFromStep3 }; // Lưu lại form data
          
          // Chuyển sang Step 4 (confirmation)
          this.currentStep = 4;
          this.maxCompletedStep = Math.max(this.maxCompletedStep, 3);
          
          // Clear thông tin hold vì đã tạo booking thành công
          this.heldBookingMaDat = null;
          this.heldBookingExpiresAt = null;
          this.holdError = null;
        } else {
          throw new Error(response.data.message || response.data.error || 'Tạo booking thất bại.');
        }
      } catch (error) {
        console.error('Lỗi khi gọi API createBooking:', error);
        this.createBookingError = error.response?.data?.error || error.response?.data?.message || error.message || 'Tạo booking thất bại.';
      } finally {
        this.isCreatingBooking = false;
      }
    },

    /**
     * Bắt đầu quy trình booking từ đầu (reset toàn bộ state)
     */
    async startBookingFromScratch() {
      this.$reset(); // Reset về state ban đầu
      this.currentStep = 1; 
      this.maxCompletedStep = 0; 
      this.preselectedIntent = null;
      this.roomsError = null; 
      this.isLoadingRooms = false; 
      this.holdError = null;
      this.isHoldingRoom = false; 
      this.createBookingError = null; 
      this.isCreatingBooking = false;
      this.heldBookingMaDat = null; 
      this.heldBookingExpiresAt = null;
    },

    /**
     * Làm mới một số state (ít reset hơn startBookingFromScratch)
     */
    RefreshState() { 
      this.preselectedIntent = null;
      this.roomsError = null; 
      this.isLoadingRooms = false; 
      this.holdError = null;
    },

    /**
     * Bắt đầu booking từ đầu cho hotel details (tương tự startBookingFromScratch)
     */
    async startBookingFromScratchForHotelDetails() {
      this.$reset();
      this.currentStep = 1; 
      this.maxCompletedStep = 0; 
      this.roomsError = null; 
      this.isLoadingRooms = false; 
      this.holdError = null;
      this.isHoldingRoom = false; 
      this.createBookingError = null; 
      this.isCreatingBooking = false;
      this.heldBookingMaDat = null; 
      this.heldBookingExpiresAt = null;
    },

    /**
     * Điều hướng đến bước cụ thể trong quy trình booking
     * @param {number} stepId - ID của bước cần điều hướng đến (1-4)
     */
    navigateToStep(stepId) {
      console.log(`[Store] navigateToStep được gọi với stepId: ${stepId}, bước hiện tại: ${this.currentStep}, maxCompletedStep: ${this.maxCompletedStep}`);
      
      // Trường hợp đặc biệt: Cho phép điều hướng đến Step 3 nếu user có active hold booking
      const hasActiveHoldBooking = this.heldBookingMaDat && 
                                   this.heldBookingExpiresAt && 
                                   this.heldBookingExpiresAt > Date.now() &&
                                   this.selectedHotelDetails &&
                                   this.selectedRoomTypeDetails;
      
      // Tính bước tối đa được phép điều hướng
      const maxAllowedStep = hasActiveHoldBooking ? Math.max(this.maxCompletedStep + 1, 3) : this.maxCompletedStep + 1;
      console.log(`[Store] hasActiveHoldBooking: ${hasActiveHoldBooking}, maxAllowedStep: ${maxAllowedStep}`);
      
      if (stepId <= maxAllowedStep) {
        if (stepId < this.currentStep) {
          // Điều hướng về phía sau - cần reset một số state tùy theo bước
          if (stepId < 2) { 
            // Quay về Step 1 - reset hầu hết state
            this.availableHotelsAndRooms = [];
            this.roomsError = null;
            this.guestAndPaymentInput = null;
            this.finalBookingReference = null;
            this.createBookingError = null;
            this.clearPreselectedBookingIntent();
            this.maxCompletedStep = 0;
          } else if (stepId < 3) { 
            // Quay về Step 2 - giữ hold booking data
            console.log('[Store] Điều hướng về Step 2, giữ nguyên hold booking data');
            this.guestAndPaymentInput = null; 
            this.finalBookingReference = null;
            this.createBookingError = null; 
            this.clearPreselectedBookingIntent();
            this.maxCompletedStep = Math.max(this.maxCompletedStep, 1);
          } else if (stepId < 4) { 
            // Quay về Step 3 - giữ hold và guest data
            console.log('[Store] Điều hướng về Step 3, giữ nguyên hold và guest data');
            this.finalBookingReference = null; 
            this.createBookingError = null;
            // Giữ nguyên guestAndPaymentInput để user có thể sửa
            this.maxCompletedStep = Math.max(this.maxCompletedStep, 2);
          }
        } else if (stepId > this.currentStep) {
          // Điều hướng về phía trước
          console.log(`[Store] Điều hướng tiến tới Step ${stepId}`);
          this.maxCompletedStep = Math.max(this.maxCompletedStep, stepId - 1);
        }
        
        // Cập nhật bước hiện tại
        this.currentStep = stepId;
        console.log(`[Store] Điều hướng hoàn tất. Bước hiện tại mới: ${this.currentStep}, maxCompletedStep: ${this.maxCompletedStep}`);
      } else { 
        console.warn(`[Store] Không thể điều hướng đến bước chưa hoàn thành ${stepId}. Bước tối đa cho phép: ${maxAllowedStep}, maxCompleted: ${this.maxCompletedStep}`); 
      }
    },

    /**
     * Reset toàn bộ quy trình booking (alias cho startBookingFromScratch)
     */
    resetBookingProcess() {
      this.startBookingFromScratch();
    }
  },

  // Cấu hình persistence - lưu trữ state vào localStorage
  persist: {
    storage: localStorage, // Sử dụng localStorage để persist data qua browser sessions
    
    // Chỉ persist những state cần thiết, không persist loading states hoặc errors
    paths: [ 
      'currentStep',           // Bước hiện tại trong quy trình booking
      'maxCompletedStep',      // Bước cao nhất đã hoàn thành
      'searchCriteria',        // Tiêu chí tìm kiếm
      'preselectedIntent',     // Intent booking được chọn sẵn
      'selectedHotelDetails',  // Thông tin khách sạn đã chọn
      'selectedRoomTypeDetails', // Thông tin loại phòng đã chọn
      'heldBookingMaDat',      // Mã booking đang hold
      'heldBookingExpiresAt',  // Thời gian hết hạn hold
      'guestAndPaymentInput',  // Input từ Step 3
      'finalBookingReference'  // Kết quả booking cuối cùng (quan trọng cho Step 4)
    ],

    /**
     * Callback được gọi sau khi khôi phục state từ localStorage
     * Xử lý logic kiểm tra tính toàn vẹn dữ liệu và cleanup các state không hợp lệ
     * @param {Object} context - Context chứa store instance
     */
    afterRestore: (context) => {
      console.log('[PiniaPersist] Sau khi khôi phục booking store. Bước hiện tại:', context.store.currentStep);

      // Reset các loading states về false sau khi khôi phục
      context.store.isLoadingRooms = false;
      context.store.isHoldingRoom = false;
      context.store.isCreatingBooking = false;

      // 1. XỬ LÝ TRƯỜNG HỢP BOOKING HOLD ĐÃ HẾT HẠN
      if (context.store.heldBookingMaDat && context.store.heldBookingExpiresAt && Date.now() > context.store.heldBookingExpiresAt) {
        console.warn('[PiniaPersist] Booking hold đã hết hạn sau khi khôi phục. Clearing hold data.');
        // Clear thông tin hold đã hết hạn
        context.store.heldBookingMaDat = null;
        context.store.heldBookingExpiresAt = null;
        context.store.holdError = "Booking hold trước đó đã hết hạn. Vui lòng chọn phòng lại.";
        
        // Nếu đang ở Step 3, buộc quay về Step 2 để hold lại
        if (context.store.currentStep === 3) {
          context.store.currentStep = 2;
          context.store.maxCompletedStep = Math.min(context.store.maxCompletedStep, 1);
        }
      }

      // 2. XỬ LÝ KHI KHÔI PHỤC STATE Ở STEP 4 (BOOKING ĐÃ HOÀN TẤT)
      // Nếu user đã ở Step 4 (booking hoàn tất) và refresh trang
      // Có thể cho phép xem lại confirmation page một lần, sau đó reset khi navigate đi
      if (context.store.currentStep === 4 && context.store.finalBookingReference) {
        console.log('[PiniaPersist] Khôi phục đến Step 4. Booking này được coi là đã hoàn tất.');
        // Ghi chú: Không reset ngay ở đây để user có thể xem lại confirmation page
        // Reset sẽ được xử lý bởi onBeforeUnmount của Step4 hoặc route guards
        
        // TÙY CHỌN: Reset ngay lập tức sau khi refresh
        // context.store.resetBookingProcess(); 
        // return; 
        // => Cách này sẽ không cho user xem lại confirmation page sau F5
      }

      // 3. KIỂM TRA TÍNH TOÀN VẸN DỮ LIỆU CHO CÁC BƯỚC KHÁC
      if (context.store.currentStep === 2 && !context.store.searchCriteria) {
        // Ở Step 2 nhưng không có search criteria
        console.warn("[PiniaPersist] Ở Step 2 nhưng không có searchCriteria. Resetting.");
        context.store.$reset(); // Reset về state ban đầu
        context.store.currentStep = 1;
      } else if (context.store.currentStep === 3 && (!context.store.selectedHotelDetails || !context.store.heldBookingMaDat)) {
        // Ở Step 3 nhưng thiếu dữ liệu tiên quyết
        console.warn("[PiniaPersist] Ở Step 3 nhưng thiếu dữ liệu tiên quyết. Resetting.");
        context.store.$reset();
        context.store.currentStep = 1;
      }
      
      // Lưu ý: Không cần fetch lại availableHotelsAndRooms vì nó không được persist
      // và sẽ được load lại khi user thực hiện search
    }
  }
});