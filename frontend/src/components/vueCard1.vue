<!-- src/components/VueCard1.vue -->
<template>
  <div class="booking-card-item card shadow-sm mb-4" v-if="processedData.displayTitle">
    <!-- PHẦN 1: HEADER CỦA BOOKING (THÔNG TIN CHUNG) -->
    <div class="card-header bg-light p-3">
      <div class="row align-items-center g-3">
        <div class="col-lg-3 col-md-4 d-none d-md-flex align-items-center justify-content-center booking-header-image-wrapper">
          <img 
            :src="processedData.displayMainImageUrl" 
            @error="onMainImageError" 
            :alt="processedData.displayMainImageAltText" 
            class="img-fluid rounded booking-header-image"
          />
        </div>
        <div class="col-lg-9 col-md-8">
          <h5 class="fw-bold mb-1 booking-title">{{ processedData.displayTitle }}</h5>
          <p class="text-muted small mb-1">{{ processedData.displaySubtitle1 }}</p>
           <!-- Ảnh chính cho màn hình tablet và mobile -->
          <div class="d-md-none my-2 text-center">
              <img 
                :src="processedData.displayMainImageUrl" 
                @error="onMainImageError" 
                :alt="processedData.displayMainImageAltText" 
                class="img-fluid rounded" 
                style="max-height: 160px; object-fit: cover; width: auto;"
              />
          </div>
          <div class="booking-header-details small mt-1" v-if="mode === 'booking-history' && processedData.historyDetails">
            <span class="me-3"><strong class="text-secondary">Booking Ref:</strong> #{{ processedData.historyDetails.bookingReference }}</span>
            <span class="me-3"><strong class="text-secondary">Booked on:</strong> {{ formatDate(processedData.historyDetails.bookingDate) }}</span>
            <span><strong class="text-secondary">Status:</strong> <span :class="getStatusClass(processedData.historyDetails.status)">{{ processedData.historyDetails.status }}</span></span>
          </div>
           <p class="text-muted small mb-2 mt-1" v-if="mode === 'search-results' && processedData.displayRatingAndType">
            <i class="bi bi-star-fill text-warning me-1"></i>{{ processedData.displayRatingAndType }}
          </p>
          <p class="text-muted extra-small mb-0" v-if="mode === 'search-results' && processedData.displayDescription">
            {{ processedData.displayDescription }}
          </p>

          <div class="booking-header-actions mt-2">
            <CustomButton
              v-if="shouldShowToggleButton"
              class="me-2 mb-1 btn-sm"
              :content="toggleButtonText"
              textColor="white" :backgroundColor="toggleButtonColor"
              :colorHover="toggleButtonColor" bgHover="white"
              :borderColor="toggleButtonColor"
              borderRadius="4px"
              padding="0.25rem 0.5rem"
              @click="toggleRoomItemsVisibility"
            />
            <template v-if="mode === 'booking-history' && processedData.actions && processedData.actions.length > 0">
              <CustomButton
                v-for="action in processedData.actions" :key="action.id" class="me-2 mb-1 btn-sm"
                :content="action.label" :textColor="action.textColor || 'white'"
                :backgroundColor="action.backgroundColor || 'var(--bs-danger, #dc3545)'"
                :colorHover="action.colorHover || 'white'" :bgHover="action.bgHover"
                :borderRadius="action.borderRadius || '4px'" padding="0.25rem 0.5rem"
                @click="() => handleActionClick(action.id, processedData.originalItem)"
                :disabled="action.disabled || false"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- PHẦN 2: CHI TIẾT PHÒNG/DỊCH VỤ (TOGGLE) -->
    <transition name="slide-fade">
      <div v-if="showRoomItems && processedData.displayRoomItems && processedData.displayRoomItems.length > 0" class="card-body room-items-details-wrapper p-3">
        <div 
            v-for="roomItem in processedData.displayRoomItems" 
            :key="roomItem.id" 
            class="room-item-detail-entry border-bottom pb-3 mb-3"
            :class="{'last-room-item': roomItem === processedData.displayRoomItems[processedData.displayRoomItems.length -1]}"
        >
           <div class="row g-3">
              <div class="col-md-3 room-item-image-col">
                   <img :src="roomItem.imageUrl || defaultRoomImagePlaceholder" @error="onRoomImageError($event)" :alt="`Image of ${roomItem.name}`" class="img-fluid rounded room-item-image">
              </div>
              <div class="col-md-6 room-item-info-col">
                  <h6 class="fw-semibold room-item-name mb-1">{{ roomItem.name }}</h6>
                  <p class="extra-small text-muted mb-1" v-if="roomItem.area"><i class="bi bi-rulers me-1"></i>Diện tích: {{ roomItem.area }} m²</p>
                  <p class="extra-small text-muted mb-1" v-if="roomItem.beds"><i class="bi bi-hdd-stack me-1"></i>Giường: {{ roomItem.beds }}</p>
                  <p class="extra-small text-muted mb-1" v-if="roomItem.amenities"><i class="bi bi-magic me-1"></i>Tiện nghi: {{ roomItem.amenities }}</p>

                  <p v-if="mode === 'search-results' && roomItem.availability > 0" class="small text-success mb-0">
                    <i class="bi bi-check-lg me-1"></i>Còn trống: {{ roomItem.availability }} phòng
                  </p>
                  <p v-if="mode === 'search-results' && roomItem.availability <= 0" class="small text-danger mb-0">
                    <i class="bi bi-x-lg me-1"></i>Hết phòng
                  </p>
                  
                  <div v-if="mode === 'booking-history'" class="mt-1">
                      <p class="extra-small text-muted mb-1" v-if="roomItem.quantity"><strong>Số lượng khách/phòng:</strong> {{ roomItem.quantity }}</p>
                      <div class="extra-small text-muted mb-1" v-if="roomItem.historyRoomDetails" style="white-space: pre-line;">{{ roomItem.historyRoomDetails }}</div>
                  </div>
              </div>
              <div class="col-md-3 room-item-price-col text-md-end mt-2 mt-md-0">
                  <p class="h6 fw-bold mb-1" :class="mode === 'search-results' ? 'text-danger' : 'text-primary-emphasis'">
                    {{ formatPrice(roomItem.price) }}
                  </p>
                  <p class="text-muted extra-small mt-0 mb-2" v-if="mode === 'search-results'">{{ roomItem.priceUnit || 'VND / đêm' }}</p>
                  <p class="text-muted extra-small mt-0 mb-2" v-else-if="mode === 'booking-history' && roomItem.priceUnit">{{ roomItem.priceUnit }}</p>
                  
                  <CustomButton
                    v-if="mode === 'search-results' && roomItem.availability > 0"
                    content="Chọn Phòng"
                    textColor="white" fontSize="13px" :backgroundColor="selectRoomButtonColor"
                    :colorHover="selectRoomButtonColor" bgHover="white" borderRadius="4px"
                    :borderColor="selectRoomButtonColor" padding="0.3rem 0.8rem"
                    class="w-100 w-md-auto mb-2 btn-sm"
                    @click="selectThisRoom(roomItem.originalRoomData)"
                  />
                  <div v-if="mode === 'search-results' && roomItem.availability <= 0 && roomItem.alternativeDates && roomItem.alternativeDates.length > 0" class="w-100 w-md-auto">
                     <p class="extra-small text-muted mb-1">Thử ngày khác:</p>
                    <div class="d-grid gap-1">
                      <button
                        v-for="(altDate, index) in roomItem.alternativeDates.slice(0, 1)"
                        :key="`alt-${index}`"
                        class="btn btn-sm btn-outline-success w-100"
                         @click="selectAlternative(roomItem.originalRoomData, altDate)"
                      >
                        {{ formatDateForButton(altDate.checkIn) }} - {{ formatDateForButton(altDate.checkOut) }}
                        <span class="extra-small ms-1">({{ altDate.duration }}N)</span>
                      </button>
                    </div>
                  </div>
                   <p v-if="mode === 'search-results' && roomItem.availability <= 0 && (!roomItem.alternativeDates || roomItem.alternativeDates.length === 0)" class="extra-small text-muted mt-1 fst-italic">
                      Không có gợi ý.
                  </p>
                  <p v-if="mode === 'booking-history' && roomItem.priceDescription" class="extra-small text-muted mt-1 text-md-end">{{ roomItem.priceDescription }}</p>
              </div>
           </div>
           <div v-if="mode === 'booking-history' && roomItem.services && roomItem.services.length > 0" class="mt-2 ms-md-1 ps-md-2 border-top-dashed pt-2">
              <p class="extra-small fw-medium mb-1 text-secondary">Dịch vụ đã đặt:</p>
              <ul class="list-unstyled ps-0 extra-small booking-services-list-condensed">
                  <li v-for="svc in roomItem.services" :key="svc.name" class="d-flex justify-content-between">
                     <span><i class="bi bi-check2 text-success"></i> {{ svc.name }} (x{{ svc.quantity }})</span>
                     <span>{{ formatPrice(svc.price * svc.quantity) }}</span>
                  </li>
              </ul>
          </div>
        </div>
      </div>
      <div v-else-if="showRoomItems && mode === 'booking-history'" class="card-body text-center text-muted p-3">
          <small><i class="bi bi-info-circle me-1"></i>Không có thông tin chi tiết bổ sung cho đặt phòng này.</small>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, defineEmits, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import defaultMainImagePlaceholder from '@/assets/mountain.jpg';
import defaultRoomImagePlaceholder from '@/assets/room-placeholder.jpg';
import CustomButton from './Button.vue';

const emit = defineEmits(['room-selected', 'alternative-date-selected', 'action-clicked']);

const props = defineProps({
  hotelData: { type: Object, required: true, default: () => ({}) },
  imageUrl: { type: String, default: '' },
  mode: {
    type: String, default: 'search-results',
    validator: (value) => ['search-results', 'booking-history'].includes(value)
  }
});

const showRoomItems = ref(props.mode === 'booking-history');
const defaultMainImage = defaultMainImagePlaceholder;
const defaultRoomImage = defaultRoomImagePlaceholder;

const selectRoomButtonColor = 'var(--bs-danger, #e74c3c)'; // Màu đỏ bạn thích
const toggleButtonColor = 'var(--bs-primary, #3498db)'; // Màu xanh dương bạn thích

const processedData = computed(() => {
  if (props.mode === 'search-results') {
    const hotel = props.hotelData;
    return {
      displayTitle: hotel.TenKS || 'Tên Khách Sạn',
      displaySubtitle1: hotel.DiaChi || 'Địa chỉ không xác định',
      displayRatingAndType: hotel.HangSao ? `${hotel.HangSao} ⭐ - ${hotel.LoaiHinh || ''}`.trim() : hotel.LoaiHinh,
      displayDescription: hotel.MoTaChung || '',
      displayMainImageUrl: props.imageUrl || hotel.MainImagePath || hotel.HinhAnhKS || defaultMainImage,
      displayMainImageAltText: `Hình ảnh của ${hotel.TenKS || 'khách sạn'}`,
      originalItem: hotel,
      historyDetails: null,
      actions: [],
      displayRoomItems: (hotel.roomTypes || []).map(rt => ({
        id: rt.MaLoaiPhong, name: rt.TenLoaiPhong, area: rt.DienTich, beds: rt.CauHinhGiuong,
        amenities: rt.TienNghi, imageUrl: rt.HinhAnhPhong || defaultRoomImage, price: rt.GiaCoSo,
        priceUnit: '/ đêm', availability: rt.SoPhongTrong, alternativeDates: rt.alternativeDates || [],
        originalRoomData: rt, quantity: null, historyRoomDetails: null, services: [], priceDescription: null
      }))
    };
  }
  // mode === 'booking-history'
  const booking = props.hotelData; // Đây là dataForCard từ BookingHistoryPage
  return {
    displayTitle: booking.title || 'Chi Tiết Đặt Phòng',
    displaySubtitle1: booking.subtitle1 || 'N/A',
    displayRatingAndType: null,
    displayDescription: booking.description || '',
    displayMainImageUrl: booking.mainImageUrl || defaultMainImage,
    displayMainImageAltText: booking.mainImageAltText || `Thông tin đặt phòng`,
    originalItem: booking.originalItem,
    historyDetails: booking.historyDetails, // Chứa bookingRef, bookingDate, status
    actions: booking.actions || [],
    displayRoomItems: (booking.roomItems || []).map(br => ({
      id: br.id, name: br.name, area: br.area, beds: br.beds, amenities: br.amenities,
      imageUrl: br.imageUrl || defaultRoomImage, price: br.price, priceUnit: br.priceUnit,
      availability: 0, alternativeDates: [], originalRoomData: br.originalRoomData || br,
      quantity: br.quantity, historyRoomDetails: br.historyRoomDetails, services: br.services || [],
      priceDescription: br.priceDescription
    }))
  };
});

watch(() => props.mode, (newMode) => { showRoomItems.value = newMode === 'booking-history';});
const shouldShowToggleButton = computed(() => processedData.value?.displayRoomItems && processedData.value.displayRoomItems.length > 0);
const toggleButtonText = computed(() => {
  if (showRoomItems.value) {
    return props.mode === 'booking-history' ? 'Ẩn Chi Tiết' : 'Ẩn Loại Phòng';
  }
  return props.mode === 'booking-history' ? 'Xem Chi Tiết' : 'Xem Loại Phòng';
});

const onMainImageError = (event) => { event.target.src = defaultMainImage; };
const onRoomImageError = (event) => { event.target.src = defaultRoomImage; };
const toggleRoomItemsVisibility = () => { showRoomItems.value = !showRoomItems.value; };

const formatPrice = (value) => { if (value == null || isNaN(parseFloat(value))) return 'N/A'; return parseFloat(value).toLocaleString('vi-VN') + ' đ'; }; // Thêm đơn vị 'đ'
const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { const date = dateString.includes('T') ? parseISO(dateString) : new Date(dateString); return format(date, 'dd MMM yyyy'); } catch (e) { return dateString; }};
const formatDateForButton = (dateString) => { if (!dateString) return ''; try { const date = dateString.includes('T') ? parseISO(dateString) : new Date(dateString); return format(date, 'dd/MM'); } catch (e) { return 'Invalid Date'; }};

const selectThisRoom = (originalRoomData) => { if (props.mode === 'search-results') emit('room-selected', originalRoomData);};
const selectAlternative = (originalRoomData, altDate) => { if (props.mode === 'search-results') emit('alternative-date-selected', { roomInfo: originalRoomData, suggestedDates: altDate });};
const handleActionClick = (actionId, bookingItem) => { if (props.mode === 'booking-history') emit('action-clicked', { actionId, bookingItem });};
const getStatusClass = (status) => { if (!status) return 'text-muted'; const ls = status.toLowerCase(); if (ls === 'đã xác nhận' || ls === 'confirmed' || ls === 'completed' || ls === 'đã trả phòng') return 'badge bg-success text-white fw-medium'; if (ls === 'chờ thanh toán' || ls === 'pending payment' || ls ==='đã nhận phòng' || ls === 'pending') return 'badge bg-warning text-dark fw-medium'; if (ls === 'đã hủy' || ls === 'cancelled' || ls === 'rejected') return 'badge bg-danger text-white fw-medium'; if (ls === 'tạm giữ' || ls === 'holding') return 'badge bg-info text-dark fw-medium'; return 'badge bg-secondary text-white fw-medium';};

</script>

<style scoped>
.booking-card-item {
  border: 1px solid #e9ecef; /* Border mềm hơn */
  background-color: #fff;
  border-radius: 0.375rem; /* Bo góc nhẹ nhàng */
}

/* Phần Header của Card Booking */
.booking-card-header {
  /* card-header có padding và bg mặc định rồi, nếu muốn custom thì ghi đè */
}
.booking-header-image-wrapper {
  /* padding: 0.5rem;  Optional: if you want space around the image within its column */
}
.booking-header-image {
  width: 100%;
  height: 150px; /* Fixed height for main header image */
  object-fit: cover; /* Crop to fit */
}
.booking-title {
  font-size: 1.1rem;
  color: #343a40; /* Màu chữ tiêu đề đậm hơn */
}
.booking-header-details {
  font-size: 0.8rem;
  color: #6c757d;
  display: flex; /* Để các span nằm trên một hàng và xuống dòng nếu cần */
  flex-wrap: wrap;
  gap: 0 0.75rem; /* Khoảng cách ngang giữa các item */
}
.booking-header-details span {
  white-space: nowrap; /* Ngăn các cụm text nhỏ bị ngắt dòng sớm */
}
.booking-header-actions .btn-sm {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem; /* Nút nhỏ hơn */
}
.history-details-main .badge {
  font-size: 0.75em;
  padding: .3em .5em;
}

/* Phần Chi Tiết Phòng (khi mở ra) */
.room-items-details-wrapper {
  background-color: #f8f9fa; /* Nền hơi xám nhẹ cho khu vực chi tiết */
}
.room-item-detail-entry {
  /* border-bottom: 1px solid #e9ecef; */ /* Giữ border này */
}
.room-item-detail-entry.last-room-item { /* Class đặc biệt cho item cuối */
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
.room-item-image-col {
  display: flex;
  align-items: center; /* Căn giữa ảnh theo chiều dọc */
}
.room-item-image {
  max-height: 120px; /* Chiều cao tối đa cho ảnh phòng */
  width: 100%;
  object-fit: cover; /* Đảm bảo ảnh được crop đẹp */
}
.room-item-name {
  font-size: 1rem;
  color: var(--bs-primary, #0069d9); /* Màu xanh dương primary */
}
.room-item-info-col p, .room-item-price-col p {
  margin-bottom: 0.2rem;
}
.room-item-info-col .extra-small i {
  width: 1em; /* Giúp icon thẳng hàng hơn */
}
.booking-services-list-condensed li {
  padding: 1px 0;
  color: #495057;
}
.booking-services-list-condensed i.bi-check2 { /* Đã sửa icon */
  font-size: 1em;
  margin-right: 5px;
}
.room-item-price-col .h6 {
  font-size: 1.05rem; /* Kích thước giá phòng */
}
.border-top-dashed {
    border-top: 1px dashed #ced4da;
}

.extra-small { font-size: 0.78rem; } /* Hơi to hơn chút */
.small { font-size: 0.85rem; }
.text-primary-emphasis { color: var(--bs-primary-text-emphasis) !important; }

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease-in-out; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-5px); opacity: 0; }
</style>