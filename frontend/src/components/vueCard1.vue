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
          <div>
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
                 <Button
                  v-else
                  content="HẾT PHÒNG"
                  variant="secondary"
                  class="w-100 cta-button"
                  disabled
                />
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

const emit = defineEmits(['room-selected']);

const props = defineProps({
  hotelData: { type: Object, required: true },
  imageUrl: { type: String, default: '' },
  mode: { type: String, default: 'search-results' }
});

const showRoomItems = ref(true);
const defaultMainImage = defaultMainImagePlaceholder;
const defaultRoomImage = defaultRoomImagePlaceholder;

const processedData = computed(() => {
  const hotel = props.hotelData;
  return {
    displayTitle: hotel.TenKS,
    displaySubtitle1: hotel.DiaChi,
    displayRatingAndType: hotel.HangSao ? `${hotel.HangSao} ⭐ - ${hotel.LoaiHinh || ''}`.trim() : hotel.LoaiHinh,
    displayMainImageUrl: props.imageUrl || hotel.MainImagePath || hotel.HinhAnhKS || defaultMainImage,
    displayMainImageAltText: `Image of ${hotel.TenKS}`,
    displayRoomItems: (hotel.roomTypes || []).map(rt => ({
      id: rt.MaLoaiPhong,
      name: rt.TenLoaiPhong,
      guests: rt.SoNguoiToiDa,
      parsedAmenities: (rt.TienNghi ? rt.TienNghi.split(',').map(s => s.trim()) : ['Thông tin đang cập nhật...']),
      imageUrl: rt.HinhAnhPhong || defaultRoomImage,
      price: rt.GiaCoSo,
      availability: rt.SoPhongTrong,
      beds: rt.CauHinhGiuong,
      originalRoomData: rt
    }))
  };
});

const toggleButtonText = computed(() => showRoomItems.value ? 'Ẩn Loại Phòng' : 'Xem Loại Phòng');
const shouldShowToggleButton = computed(() => processedData.value?.displayRoomItems && processedData.value.displayRoomItems.length > 0);
const toggleRoomItemsVisibility = () => { showRoomItems.value = !showRoomItems.value; };
const onMainImageError = (event) => { event.target.src = defaultMainImage; };
const onRoomImageError = (event) => { event.target.src = defaultRoomImage; };
const formatPrice = (value) => { if (value == null) return 'N/A'; return parseFloat(value).toLocaleString('vi-VN'); };
const selectThisRoom = (originalRoomData) => emit('room-selected', originalRoomData);

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

/* Animation */
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-15px);
  opacity: 0;
}
</style>