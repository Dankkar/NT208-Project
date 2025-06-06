<template>
  <!-- Card Tổng Hợp Khách Sạn -->
  <div class="hotel-card card shadow-sm mb-4" v-if="processedData.displayTitle">
    
    <!-- Phần Header chung của Khách sạn -->
    <div class="card-header d-flex align-items-center justify-content-between">
        
        <div class="d-flex align-items-center justify-content-between">
            <img 
            :src="processedData.displayMainImageUrl" 
            @error="onMainImageError" 
            :alt="processedData.displayMainImageAltText" 
            class="hotel-logo-thumb img-fluid"
          />
          <div class="ms-2">
            <h1 class="fw-bolder mb-0 hotel-title">{{ processedData.displayTitle }}</h1>
            <p class="text-muted small mb-1 mt-1">
               <i class="bi bi-geo-alt-fill"></i> {{ processedData.displaySubtitle1 }}
            </p>
            <p v-if="processedData.displayRatingAndType" class="text-muted small mb-0">
              <i class="bi bi-star-fill text-warning"></i> {{ processedData.displayRatingAndType }}
            </p>
          </div>
        </div>
      <div class="d-flex justify-content-between align-items-center">
       
        <Button
          v-if="shouldShowToggleButton"
          :content="toggleButtonText"
          :icon="showRoomItems ? 'bi-chevron-up' : 'bi-chevron-down'"
          variant="secondary"
          size="lg"
          @click="toggleRoomItemsVisibility"
        />
      </div>
    </div>

    <!-- Danh sách các Loại phòng có thể ẩn/hiện -->
    <transition name="slide-fade">
      <div v-if="showRoomItems" class="list-group list-group-flush">
        
        <!-- MỖI LOẠI PHÒNG LÀ MỘT HÀNG -->
        <div 
          v-for="roomItem in processedData.displayRoomItems" 
          :key="roomItem.id" 
          class="list-group-item"
        >
          <!-- Bố cục 2 cột chính của hàng -->
          <div class="row g-0 align-items-center">
            
            <!-- Cột trái: Hình ảnh & Thông tin phòng -->
            <div class="col-lg-8">
              <div class="row g-3">
                <div class="col-md-6">
                  <img :src="roomItem.imageUrl" @error="onRoomImageError($event)" :alt="`Image of ${roomItem.name}`" class="img-fluid room-image">
                </div>
                <div class="col-md-6 d-flex flex-column justify-content-center info-column">
                  <h6 class="fw-bold room-name">{{ roomItem.name }}</h6>
                  <p class="text-muted mb-3">Up to {{ roomItem.guests || 3 }} guests</p>
                  <div class="amenities-list">
                    <p v-for="amenity in roomItem.parsedAmenities" :key="amenity" class="mb-1">
                      <i class="bi bi-check-circle text-success me-2"></i> {{ amenity }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cột phải: Giá & Nút CTA -->
            <div class="col-lg-4">
              <div class="price-box">
                <p class="text-muted small mb-0">FROM</p>
                <p class="price-amount fw-bolder mb-0 lh-1">{{ formatPrice(roomItem.price) }}</p>
                <p class="text-muted small mt-0 mb-3">/ đêm</p>
                
                <div class="price-details small mb-auto">
                   <p class="mb-1">Included VAT and charges</p>
                   <p v-if="roomItem.availability > 0" class="mb-0">{{ roomItem.beds }} available</p>
                </div>
                
                <Button
                  v-if="roomItem.availability > 0"
                  content="CHỌN PHÒNG"
                  variant="primary"
                  class="w-100 cta-button"
                  @click="selectThisRoom(roomItem.originalRoomData)"
                />
                <div v-else>
                  <Button
                    content="HẾT PHÒNG"
                    variant="secondary"
                    class="w-100 cta-button mb-2"
                    disabled
                  />
                  
                  <!-- Alternative Dates Section -->
                  <div v-if="roomItem.alternativeDates && roomItem.alternativeDates.length > 0" class="alternative-dates">
                    <p class="small text-muted mb-2">Suggested alternative dates:</p>
                    <div class="alternative-dates-list">
                      <button 
                        v-for="(altDate, index) in roomItem.alternativeDates.slice(0, 2)" 
                        :key="index"
                        class="btn btn-outline-primary btn-sm w-100 mb-1 alt-date-btn"
                        @click="selectAlternativeDate(roomItem.originalRoomData, altDate)"
                      >
                        {{ formatDate(altDate.checkIn) }} - {{ formatDate(altDate.checkOut) }}
                        <small class="d-block">{{ altDate.period === 'before' ? 'Earlier' : 'Later' }} (+{{ altDate.daysFromOriginal }} days)</small>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, defineEmits } from 'vue';
import Button from './Button.vue'; 
import defaultMainImagePlaceholder from '@/assets/mountain.jpg';
import defaultRoomImagePlaceholder from '@/assets/room-placeholder.jpg';
import { format } from 'date-fns';

const emit = defineEmits(['room-selected', 'action-clicked', 'alternative-date-selected']);

const props = defineProps({
  hotelData: { type: Object, required: true },
  imageUrl: { type: String, default: '' },
  // Mode rất quan trọng để quyết định cách hiển thị
  mode: { 
    type: String, 
    default: 'search-results',
    validator: (value) => ['search-results', 'booking-history'].includes(value)
  }
});

const showRoomItems = ref(props.mode === 'booking-history'); // Mặc định mở nếu là history
const defaultMainImage = defaultMainImagePlaceholder;
const defaultRoomImage = defaultRoomImagePlaceholder;

// === ĐÂY LÀ PHẦN LOGIC ĐÃ ĐƯỢC HOÀN THIỆN ===
const processedData = computed(() => {
  // --- LOGIC CHO MODE: SEARCH RESULTS ---
  if (props.mode === 'search-results') {
    const hotel = props.hotelData;
    return {
      displayTitle: hotel.TenKS,
      displaySubtitle1: hotel.DiaChi,
      displayRatingAndType: hotel.HangSao ? `${hotel.HangSao} - ${hotel.LoaiHinh || ''}`.trim() : hotel.LoaiHinh,
      displayMainImageUrl: props.imageUrl || hotel.MainImagePath || hotel.HinhAnhKS || defaultMainImage,
      displayMainImageAltText: `Image of ${hotel.TenKS}`,
      // Lặp qua roomTypes và chuẩn hóa dữ liệu
      displayRoomItems: (hotel.roomTypes || []).map(rt => ({
        id: rt.MaLoaiPhong,
        name: rt.TenLoaiPhong,
        guests: rt.SoNguoiToiDa || (rt.SoGiuongDoi ? (rt.SoGiuongDoi * 2) + (rt.SoGiuongDon || 0) : 3),
        parsedAmenities: (rt.TienNghi ? rt.TienNghi.split(',').map(s => s.trim()) : [`~${rt.DienTich} m²`, rt.CauHinhGiuong]),
        imageUrl: rt.HinhAnhPhong || defaultRoomImage,
        price: rt.GiaCoSo,
        availability: rt.SoPhongTrong,
        beds: rt.CauHinhGiuong,
        originalRoomData: rt,
        alternativeDates: rt.alternativeDates || []
      })),
      actions: [], // không có action trong mode này
    };
  }
  
  // --- LOGIC CHO MODE: BOOKING HISTORY ---
  if (props.mode === 'booking-history') {
    const booking = props.hotelData; // booking là object dataForCard
    return {
      displayTitle: booking.title,
      displaySubtitle1: booking.subtitle1,
      displayRatingAndType: null, // Không hiển thị rating trong history
      displayMainImageUrl: booking.mainImageUrl || defaultMainImage,
      displayMainImageAltText: `Image for booking ${booking.historyDetails?.bookingReference}`,
      // Ánh xạ dữ liệu từ booking.roomItems
      displayRoomItems: (booking.roomItems || []).map(item => ({
        id: item.id,
        name: item.name,
        guests: item.quantity, // Lấy số lượng khách từ đây
        parsedAmenities: item.amenities ? [item.amenities] : (item.historyRoomDetails ? [item.historyRoomDetails] : []), // Hiển thị chi tiết đơn giản
        imageUrl: item.imageUrl || defaultRoomImage,
        price: item.price, // Giá đã trả
        availability: 0, // Luôn là 0 trong history
        beds: `Paid: ${formatPrice(item.price)}`,
        originalRoomData: item.originalRoomData || item,
      })),
      actions: booking.actions || [], // Truyền các action như "Hủy phòng" vào
    };
  }

  // Fallback
  return { displayTitle: 'Invalid Mode', displayRoomItems: [] };
});

const toggleButtonText = computed(() => showRoomItems.value ? 'Ẩn Chi Tiết' : 'Xem Chi Tiết');
const shouldShowToggleButton = computed(() => processedData.value?.displayRoomItems && processedData.value.displayRoomItems.length > 0);
const toggleRoomItemsVisibility = () => { showRoomItems.value = !showRoomItems.value; };
const onMainImageError = (event) => { event.target.src = defaultMainImage; };
const onRoomImageError = (event) => { event.target.src = defaultRoomImage; };
const formatPrice = (value) => { if (value == null) return 'N/A'; return parseFloat(value).toLocaleString('vi-VN'); };
const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'MMM dd');
  } catch (error) {
    return dateString;
  }
};

// Emit sự kiện tương ứng với từng mode
const selectThisRoom = (originalRoomData) => {
  if (props.mode === 'search-results') {
    emit('room-selected', originalRoomData);
  } else if (props.mode === 'booking-history' && processedData.value.actions.length > 0) {
    // Nếu có action thì cho nút này làm action chính
    const primaryAction = processedData.value.actions.find(a => a.isPrimary) || processedData.value.actions[0];
    emit('action-clicked', { actionId: primaryAction.id, bookingItem: props.hotelData.originalItem });
  }
};

const selectAlternativeDate = (originalRoomData, suggestedDates) => {
  console.log('VueCard1: Alternative date selected', { originalRoomData, suggestedDates });
  emit('alternative-date-selected', {
    roomInfo: originalRoomData,
    suggestedDates: suggestedDates
  });
};
</script>

<style scoped>
/* ======================================= */
/* === STYLE CHO CARD KHÁCH SẠN LỚN   === */
/* ======================================= */
.hotel-card {
  border: 1px solid #e0e7ff; /* Viền xanh nhạt hơn */
  background-color: #ffffff;
  transition: all 0.25s ease-in-out;
  font-size: 2rem !important;
  height: 25%px;
}
/* Hiệu ứng hover cho card khách sạn sẽ nổi lên */
.hotel-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(100, 100, 150, 0.12);
  
}

.card-header {
  background-color: #ffffff; /* Đảm bảo nền header luôn trắng */
  border-bottom: 1px solid #e9ecef !important;
  padding: 0.5rem 0.5rem; /* Tăng padding cho thoáng hơn */
}

.hotel-logo-thumb {
  height: 220px; /* Ảnh phòng cao hơn */
  max-width: 350px;
  object-fit: cover;
  border-radius: 6px;
}

.hotel-title {
  color: var(--text-primary, #212529);
  font-size: 1.75rem; /* Font to và rõ ràng hơn */
}
.hotel-card p.small {
  font-size: 0.9rem; /* Chữ phụ to hơn một chút */
}

/* ======================================= */
/* === STYLE CHO CÁC HÀNG PHÒNG BÊN TRONG === */
/* ======================================= */
.list-group-item {
  padding: 1.5rem 0 0 0 !important; /* Thêm khoảng cách Ở TRÊN mỗi hàng phòng */
  border-top: 1px solid #f0f3f7; /* Đường kẻ nhạt hơn nữa */
  background-color: transparent;
}
.list-group-item:first-child {
  padding-top: 0.25rem !important; /* Giảm khoảng trống cho hàng đầu tiên */
  border-top: none; /* Hàng đầu tiên không có đường kẻ trên */
}
.list-group-item .row {
  margin: 0; /* Reset margin của row để các cột chiếm hết không gian */
}

.room-image {
  height: 220px; /* Ảnh phòng cao hơn */
  width: 100%;
  object-fit: cover;
  /* Bỏ bo góc ảnh để liền mạch với cột */
  border-radius: 0;
}

.info-column {
  padding: 1rem 2rem; /* Tăng padding ngang cho cột thông tin */
}

.room-name {
  color: var(--text-primary);
  font-size: 1.3rem; /* TÊN PHÒNG TO HƠN */
  font-weight: 700;
}
.info-column p {
  font-size: 1rem; /* CHỮ PHỤ, TIỆN NGHI TO HƠN */
  margin-bottom: 0.5rem !important;
}

/* 
 * ==========================================================
 * ===         STYLE CỘT GIÁ - ĐÃ SỬA LẠI THEO YÊU CẦU    ===
 * ==========================================================
 */
.price-box {
  background-color: #f7f8fc; /* ĐỔI MÀU NỀN cho hợp với màu xanh */
  padding: 1.5rem;
  height: 100%; /* Đảm bảo chiếm hết chiều cao */
  display: flex;
  flex-direction: column;
  text-align: center;
  /* Bỏ bo góc để liền mạch với card lớn */
  border-radius: 0;
}

.price-amount {
  font-size: 2.1rem; 
  color: var(--text-primary);
  font-weight: 800;
}

/*
 * ===============================================
 * ===        STYLE NÚT CTA - ĐÚNG THIẾT KẾ     ===
 * ===============================================
 */
.cta-button.btn-primary {
  background-color: var(--accent-color, #0d6efd) !important;
  color: white !important;
  border: none;
  border-radius: 8px; /* Bo góc nút lớn hơn */
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.cta-button.btn-primary:hover {
  background-color: var(--accent-color-dark, #0b5ed7) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

/* Alternative Dates Styling */
.alternative-dates {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9ecef;
}

.alt-date-btn {
  font-size: 0.75rem !important;
  padding: 0.375rem 0.5rem !important;
  line-height: 1.2;
}

.alt-date-btn small {
  font-size: 0.65rem;
  opacity: 0.8;
}

.alt-date-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.2);
}

/* Animation */
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-15px);
  opacity: 0;
}
</style>