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
    <transition-group name="list" tag="div" class="list-group list-group-flush" v-if="showRoomItems">
      <div 

        v-for="roomItem in processedData.displayRoomItems" 
        :key="roomItem.id" 
        class="list-group-item"
      >
        <!-- Bố cục thẻ con, có class động để điều khiển giao diện theo mode -->
        <div class="room-item-card" :class="[cardModeClass, { 'is-unavailable': roomItem.availability <= 0 && roomItem.alternative.length <= 0 }]">
          <div class="row g-0 align-items-center">
            
            <!-- Cột trái: Hình ảnh & Thông tin phòng -->
            <div class="col-lg-8">
              <div class="row g-3">
                <div class="col-md-6">
                  <img :src="roomItem.imageUrl" @error="onRoomImageError($event)" :alt="`Image of ${roomItem.name}`" class="img-fluid room-image">
                </div>
                <div class="col-md-6 d-flex flex-column justify-content-center info-column">
                  <h4 class="fw-bold room-name">{{ roomItem.name }}</h4>
                  <!-- <p class="text-muted mb-3">Up to {{ roomItem.guests || 'N/A' }} guests</p> -->
                  <div class="amenities-list">
                    <div v-if="mode === 'search-results'">
                      <p v-for="amenity in roomItem.parsedAmenities" :key="amenity" class="mb-1">
                        <i class="bi bi-check-circle text-success me-2"></i> {{ amenity }}
                      </p>
                    </div>
  
                    <div v-else-if="mode === 'booking-history'">
                      <p v-for="(detailLine, index) in roomItem.parsedAmenities" :key="index" class="mb-1">
                        <!-- Icon ở đây có thể giữ nguyên hoặc thay đổi tùy bạn -->
                        <i class="bi bi-check-circle text-success me-2"></i> 
                        {{ detailLine }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cột phải: Giá & Nút CTA -->
                <div class="col-lg-4">
                  <div class="price-box">
                    <p class="text-muted small mb-0">{{ roomItem.priceLabel }}</p>
                    <p class="price-amount fw-bolder mb-0 lh-1">{{ formatPrice(roomItem.price) }}</p>
                    <p v-if="mode === 'search-results'" class="text-muted small mt-0 mb-3">/ đêm</p>
                    
                    <div class="price-details small">
                        <p class="mb-1">Included VAT and charges</p>
                        <p v-if="roomItem.availability > 0" class="mb-0">{{ roomItem.beds }} available</p>
                    </div>

                    <div class="cta-button-wrapper mt-auto">
                        <Button
                          v-if="mode === 'search-results' && roomItem.availability > 0"
                          :content="'Book this Room'"
                          variant="confirm"
                          :block="true"   
                          @click="handleCtaClick(roomItem.originalRoomData)"
                        />
                        <template v-else-if="mode === 'search-results' && roomItem.availability <= 0 && roomItem.alternative && roomItem.alternative.length > 0">
                           <Button
                              v-for="(altDate, idx) in roomItem.alternative"
                              :key="idx"
                              :content="`Book for ${formatAltDate(altDate.checkIn)} - ${formatAltDate(altDate.checkOut)}`"
                              variant="confirm"
                              :block="true"
                              class="mb-2"
                              @click="handleAlternativeClick(roomItem.originalRoomData, altDate)"
                            />
                        </template>
                        <Button
                          v-else-if="mode === 'search-results'"
                          content="Room is Full"
                          variant="confirm"
                          :block="true"
                          disabled
                        />

                        <Button
                          v-else-if="mode === 'booking-history' && processedData.actions.length > 0"
                          :content="getPrimaryAction.label.toUpperCase()"
                          class="mt-2"
                          :class="getActionButtonClass"
                          variant="confirm"
                          :block="true"
                          @click="handleCtaClick(roomItem.originalRoomData)"
                        />
                    </div>
                  </div>
                </div>

          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>

import { defineProps, ref, computed, defineEmits } from 'vue';
import Button from './Button.vue'; 
import defaultMainImagePlaceholder from '@/assets/mountain.jpg';
import defaultRoomImagePlaceholder from '@/assets/room-placeholder.jpg';

const emit = defineEmits(['room-selected', 'action-clicked']);


const formatAltDate = (dateStr) => {
  // Định dạng lại ngày, ví dụ: "2025-06-12" => "12/06/2025"
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
};

const handleAlternativeClick = (originalRoomData, altDate) => {
  // Gửi event với ngày alternative
  emit('alternative-date-selected', {
    roomInfo: originalRoomData,
    suggestedDates: altDate
  });
};


const props = defineProps({
  hotelData: { type: Object, required: true },
  imageUrl: { type: String, default: '' },
  mode: { 
    type: String, 
    default: 'search-results',
    validator: (value) => ['search-results', 'booking-history'].includes(value)
  }
});

const showRoomItems = ref(props.mode === 'booking-history' ? false : true); 
const defaultMainImage = defaultMainImagePlaceholder;
const defaultRoomImage = defaultRoomImagePlaceholder;

const cardModeClass = computed(() => {
    return props.mode === 'search-results' ? 'mode-search-result' : 'mode-history';
});

const getPrimaryAction = computed(() => {
  const actions = processedData.value.actions || [];
  return actions.find(a => a.isPrimary) || actions[0] || { label: '', id: '' };
});

const getActionButtonClass = computed(() => {
  const action = getPrimaryAction.value;
  if (action.id === 'cancel') {
    return 'cta-cancel';
  } else if (action.id === 'review') {
    return 'cta-review';
  } else {
    return 'cta-history';
  }
});

const processedData = computed(() => {
  // --- LOGIC CHO MODE: SEARCH RESULTS ---
  if (props.mode === 'search-results') {
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
        parsedAmenities: (rt.TienNghi ? rt.TienNghi.split(',').map(s => s.trim()) : [`~${rt.DienTich} m²`, rt.CauHinhGiuong]),
        imageUrl: rt.RoomImagePath || defaultRoomImage,
        price: rt.GiaCoSo,
        priceLabel: 'FROM',
        availability: rt.SoPhongTrong,
        beds: rt.CauHinhGiuong,
        originalRoomData: rt,
        alternative: rt.alternativeDates || []
      })),
      actions: [], 
    };
  }
  
  // --- LOGIC CHO MODE: BOOKING HISTORY ---
  if (props.mode === 'booking-history') {
    const booking = props.hotelData; 
    const hasActions = booking.actions && booking.actions.length > 0;
    return {
      displayTitle: booking.title,
      displaySubtitle1: booking.subtitle1,
      displayRatingAndType: null, 
      displayMainImageUrl: booking.mainImageUrl || defaultMainImage,
      displayMainImageAltText: `Image for booking ${booking.historyDetails?.bookingReference}`,
      displayRoomItems: (booking.roomItems || []).map(item => ({
        id: item.id,
        name: item.name,
        guests: item.quantity,
        parsedAmenities: item.amenities ? [item.amenities] : (item.historyRoomDetails ? item.historyRoomDetails : []),
        imageUrl: item.imageUrl || defaultRoomImage,
        price: item.price,
        priceLabel: 'PAID',
        availability: hasActions ? 1 : 0,  
        beds: `Quantity: ${item.quantity}`,
        originalRoomData: item.originalRoomData || item,
      })),
      actions: booking.actions || [],
      originalItem: booking.originalItem,
    };
  }
  return { displayTitle: 'Invalid Mode', displayRoomItems: [] };
});

const toggleButtonText = computed(() => showRoomItems.value ? 'Ẩn Chi Tiết' : 'Xem Chi Tiết');
const shouldShowToggleButton = computed(() => processedData.value?.displayRoomItems && processedData.value.displayRoomItems.length > 0);
const toggleRoomItemsVisibility = () => { showRoomItems.value = !showRoomItems.value; };
const onMainImageError = (event) => { event.target.src = defaultMainImagePlaceholder; };
const onRoomImageError = (event) => { event.target.src = defaultRoomImagePlaceholder; };
const formatPrice = (value) => { if (value == null) return 'N/A'; return parseFloat(value).toLocaleString('vi-VN'); };

// HÀM XỬ LÝ CLICK CHUNG CHO CẢ 2 MODE
const handleCtaClick = (originalRoomData) => {
  if (props.mode === 'search-results') {
    emit('room-selected', originalRoomData);
  } else if (props.mode === 'booking-history' && processedData.value.actions.length > 0) {
    const primaryAction = getPrimaryAction.value;
    emit('action-clicked', { actionId: primaryAction.id, bookingItem: processedData.value.originalItem });
  }   
};
</script>

<style scoped>
/* ================================== */
/* === PHONG CÁCH GỐC (DESKTOP) === */
/* ================================== */
.hotel-card { border: 1px solid #e9ecef; border-radius: 8px !important; overflow: hidden; }
.card-header { background-color: white; padding: 1rem 1.5rem; border-bottom: 1px solid #e9ecef !important; }
.hotel-logo-thumb { width: 60px; height: 45px; object-fit: cover; border-radius: 4px; }
.hotel-title { font-size: 1.25rem; font-weight: 700; line-height: 1.2; }
.list-group-item { border-top: 1px solid #e9ecef; padding: 1.5rem; }
.list-group-item:first-child { border-top: none; }
.room-image { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
.info-column { padding: 0 1.5rem; }
.room-name { font-size: 1.5rem; font-weight: 700; margin-top: 1rem; margin-left: 1rem; }
.amenities-list .bi { font-size: 0.9rem;  margin-left: 1rem;}

.price-box {
  height: 100%;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  text-align: center;
}
.price-amount { font-size: 1.75rem; font-weight: 800; }
.price-details { flex-grow: 1;}

.cta-button { background-color: #1a1a1a; color: white; border: none; font-weight: 600; padding: 0.75rem 1rem; }
.cta-button:hover { background-color: #343a40; }
.cta-button.cta-history { background-color: #dc3545; }
.cta-button.cta-history:hover { background-color: #c82333; }
.cta-button.cta-cancel { background-color: #dc3545; }
.cta-button.cta-cancel:hover { background-color: #c82333; }
.cta-button.cta-review { background-color: #ffc107; color: #000; }
.cta-button.cta-review:hover { background-color: #e0a800; }
.room-item-card.is-unavailable .price-box { background-color: #f1f3f5; }
.room-item-card.is-unavailable .cta-button { background-color: #adb5bd; color: #6c757d; pointer-events: none; }
.room-item-card.mode-search-result { border: 1px solid #e9ecef; }
.room-item-card.mode-search-result:not(.is-unavailable):hover { border-color: var(--accent-color, #0d6efd); box-shadow: 0 4px 16px rgba(13, 110, 253, 0.1); }

/* --- Các Mode --- */
.room-item-card.is-unavailable .btn,
.room-item-card.is-unavailable :deep(.btn-custom-base) {
  opacity: 0.65;
  pointer-events: none;
}
.mode-search-result .price-box { background-color: #fef8f8; }
.mode-history .price-box { background-color: #f8f9fa; }


/* ================================== */
/* === PHONG CÁCH RESPONSIVE === */
/* ================================== */

/* Áp dụng cho màn hình nhỏ hơn 992px (Tablet và dưới) */
@media (max-width: 991.98px) {
  /* Hủy flex của .row để xếp chồng */
  .room-item-card .row, .col-lg-8 .row { display: block; }
  .room-item-card [class^="col-"], .col-lg-8 [class^="col-"] {
    width: 100%;
    max-width: 100%;
  }

  .info-column { padding: 0; margin-top: 1rem; }
  .room-name { margin-top: 0; margin-left: 1rem; }

  .price-box {
    margin-top: 1rem;
    padding: 1rem;
    border-top: 1px solid #e9ecef;
  }
}

/* Áp dụng cho màn hình nhỏ hơn 768px (Mobile) */
@media (max-width: 767.98px) {
  .card-header { flex-direction: column !important; align-items: flex-start !important; }
  .card-header > .d-flex.justify-content-between { width: 100%; }
  .card-header > .d-flex.justify-content-between:last-child { margin-top: 0.75rem; }
  .card-header :deep(.btn-custom-base) { width: 100%; }

  .hotel-title { font-size: 1.1rem; }
  .list-group-item { padding: 1rem; }
  .room-image { height: 180px; }
}
</style>