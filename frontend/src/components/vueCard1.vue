<template>
  <div class="custom-card-wrapper shadow w-100 mb-4" v-if="hotelData">
    <!-- Card Khách sạn -->
    <div class="card d-flex flex-md-row overflow-hidden border-0">
      <!-- Ảnh khách sạn -->
      <div class="custom-card__image-container col-md-4 d-flex align-items-center justify-content-center p-3 bg-white">
        <!-- Sử dụng prop imageUrl cho ảnh khách sạn, fallback về ảnh mặc định nếu prop không có hoặc lỗi -->
        <img :src="effectiveHotelImageUrl" @error="onHotelImageError" alt="Hotel Image" class="img-fluid custom-card__image" />
      </div>

      <!-- Nội dung khách sạn -->
      <div class="col-md-8">
        <div class="card-body custom-card__content-bg d-flex flex-column h-100 justify-content-between">
          <div>
            <h3 class="card-title fw-bold text-black">{{ hotelData.TenKS }}</h3>
            <p class="mb-1 text-muted">{{ hotelData.DiaChi }}</p>
            <p class="mb-1" v-if="hotelData.HangSao">⭐ {{ hotelData.HangSao }} - {{ hotelData.LoaiHinh }}</p>
            <p class="mb-2 text-muted small">{{ hotelData.MoTaChung }}</p>
          </div>

          <CustomButton
            class="mt-2 align-self-start" 
            :content="showRooms ? 'Ẩn phòng' : 'Xem các loại phòng'"
            :block="false"
            textColor="#fff"
            fontSize="14px"
            backgroundColor="black"
            colorHover="black"
            bgHover="white"
            borderRadius="5px"
            textAlign="center"
            style="max-width: 250px;" 
            @click="toggleRoomVisibility"
          />
        </div>
      </div>
    </div>

    <!-- Danh sách phòng -->
    <transition name="slide-fade">
      <div v-if="showRooms" class="room-types mt-3 px-3 py-2">
        <div v-if="!hotelData.roomTypes || hotelData.roomTypes.length === 0" class="text-center text-muted p-3">
          <small>Hiện không có thông tin loại phòng cho khách sạn này.</small>
        </div>
        <div
          v-for="room in hotelData.roomTypes"
          :key="room.MaLoaiPhong"
          class="room-card d-flex flex-column flex-md-row bg-white rounded shadow-sm mb-3" 
        >
          <!-- Ảnh phòng -->
          <div class="room-image col-md-3 d-flex align-items-center justify-content-center p-md-3 p-2">
            <img 
              :src="room.HinhAnhPhong || defaultRoomImage" 
              @error="onRoomImageError($event, defaultRoomImage)" 
              alt="Room Image" 
              class="img-fluid rounded" 
              style="max-height: 150px; width:100%; object-fit: cover;" 
            />
          </div>

          <!-- Thông tin phòng -->
          <div class="room-info col-md-6 px-md-4 p-3">
            <h5 class="fw-bold mb-2">{{ room.TenLoaiPhong }}</h5>
            <p class="mb-1 small text-muted" v-if="room.DienTich"><strong>📐 Diện tích:</strong> {{ room.DienTich }} m²</p>
            <p class="mb-1 small text-muted" v-if="room.CauHinhGiuong"><strong>🛏 Giường:</strong> {{ room.CauHinhGiuong }}</p>
            <p class="mb-1 small text-muted" v-if="room.TienNghi"><strong>🧰 Tiện nghi:</strong> {{ room.TienNghi }}</p>
            <p v-if="room.SoPhongTrong > 0" class="mb-1 text-success small">
              <strong>✅ Còn trống:</strong> {{ room.SoPhongTrong }} phòng
            </p>
            <p v-else class="mb-1 text-danger small">
              <strong><i class="bi bi-x-circle-fill"></i> Hết phòng vào ngày bạn chọn</strong>
            </p>
          </div>

          <!-- Hành động & Giá -->
          <div class="room-action col-md-3 d-flex flex-column justify-content-center text-center p-3">
            <p class="mb-2 h5 fw-semibold text-danger">{{ formatPrice(room.GiaCoSo) }} <span class="small text-muted">VND / đêm</span></p>
            <CustomButton
              v-if="room.SoPhongTrong > 0"
              :content="'Chọn phòng này'"
              textColor="#fff"
              fontSize="14px"
              backgroundColor="#0d6efd" 
              colorHover="white"
              bgHover="#0b5ed7"
              borderRadius="6px"
              textAlign="center"
              class="w-100 mb-2"
              @click="selectThisRoom(room)"
            />
            <!-- Hiển thị các ngày gợi ý -->
            <div v-if="room.SoPhongTrong === 0 && room.alternativeDates && room.alternativeDates.length > 0" class="mt-2">
              <p class="small text-muted mb-1">Thử các ngày khác còn trống:</p>
              <div class="d-grid gap-1">
                <button
                  v-for="(altDate, index) in room.alternativeDates.slice(0, 2)" 
                  :key="`alt-${index}`"
                  class="btn btn-sm btn-outline-success w-100"
                  @click="selectAlternative(room, altDate)"
                >
                  {{ formatDateForButton(altDate.checkIn) }} - {{ formatDateForButton(altDate.checkOut) }}
                  <div class="extra-small text-muted">({{ altDate.duration }}N)</div>
                </button>
              </div>
            </div>
            <p v-if="room.SoPhongTrong === 0 && (!room.alternativeDates || room.alternativeDates.length === 0)" class="small text-muted mt-2 fst-italic">
              Hiện chưa có gợi ý ngày khác.
            </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, defineEmits } from 'vue';
import { format } from 'date-fns';
import defaultHotelImage from '@/assets/mountain.jpg'; // Ảnh mặc định cho khách sạn
import defaultRoomImage from '@/assets/room-placeholder.jpg'; // Ảnh mặc định cho phòng (tạo ảnh này)
import CustomButton from './Button.vue'; // Đảm bảo đường dẫn đúng

const emit = defineEmits(['room-selected', 'alternative-date-selected']);

const props = defineProps({
  hotelData: {
    type: Object,
    required: true,
    default: () => ({ roomTypes: [] }) // Đảm bảo roomTypes luôn là mảng
  },
  imageUrl: { // Đây là ảnh cho Khách Sạn
    type: String,
    default: '' // Để rỗng, sẽ fallback nếu cần
  }
});

const showRooms = ref(false);

const effectiveHotelImageUrl = computed(() => {
  return props.imageUrl || props.hotelData?.HinhAnhKS || defaultHotelImage;
});

const onHotelImageError = (event) => {
  event.target.src = defaultHotelImage;
};

const onRoomImageError = (event, fallbackImage) => {
  event.target.src = fallbackImage || defaultRoomImage;
};


const toggleRoomVisibility = () => {
  showRooms.value = !showRooms.value;
};

const formatPrice = (value) => {
  if (value == null || isNaN(parseFloat(value))) return 'Liên hệ';
  return parseFloat(value).toLocaleString('vi-VN');
};

const formatDateForButton = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd/MM');
  } catch (e) {
    return 'Invalid Date';
  }
};

// Khi người dùng chọn phòng CÒN TRỐNG bình thường
const selectThisRoom = (room) => {
  console.log("VueCard1: Room selected", room);
  emit('room-selected', room);
};

// Khi người dùng chọn một NGÀY GỢI Ý
const selectAlternative = (originalRoomInfo, alternativeDateInfo) => {
  console.log("VueCard1: Alternative date selected for room:", originalRoomInfo, "Suggested dates:", alternativeDateInfo);
  emit('alternative-date-selected', {
    roomInfo: originalRoomInfo,        // Thông tin loại phòng gốc
    suggestedDates: alternativeDateInfo // Object { checkIn, checkOut, duration, ... } của ngày gợi ý
  });
};
</script>

<style scoped>
.custom-card-wrapper {
  border: 1px solid #e0e0e0; /* Nhẹ nhàng hơn */
  border-radius: 8px; /* Giảm bo góc */
  overflow: hidden;
  background-color: #fff;
}

.custom-card__image-container {
  background-color: #f8f9fa; /* Màu nền nhẹ cho ảnh */
}

.custom-card__image {
  max-height: 220px; /* Giảm chiều cao một chút */
  width: 100%;
  object-fit: cover;
  border-radius: 6px 0 0 6px; /* Bo góc chỉ bên trái nếu nằm ngang */
}
@media (max-width: 767.98px) {
  .custom-card__image {
    border-radius: 6px 6px 0 0; /* Bo góc trên khi xếp dọc */
     max-height: 200px;
  }
}


.custom-card__content-bg {
  background-color: #ffffff; /* Nền trắng cho sang trọng */
  padding: 1.25rem; /* Giảm padding */
}
.card-title {
  font-size: 1.25rem; /* Tăng kích thước tiêu đề */
}

.room-types {
  background-color: #f9f9f9; /* Nền nhẹ cho danh sách phòng */
  /* padding đã có ở trên */
}

.room-card {
  border: 1px solid #e9ecef; /* Border mềm cho card phòng */
  transition: box-shadow 0.2s ease-in-out; /* Bỏ transform, chỉ dùng shadow */
  /* padding đã bị ghi đè !important */
}
.room-card:hover {
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.room-image {
  /* padding đã bị ghi đè */
}
.room-image img {
   border: 1px solid #eee; /* Thêm border nhẹ cho ảnh phòng */
}


.room-info {
  /* padding đã bị ghi đè */
}
.room-info h5 {
  font-size: 1.1rem;
}

.room-action {
  background-color: #f8f9fa; /* Màu nền nhất quán */
  border-left: 1px solid #e9ecef; /* Kẻ phân cách nếu nằm ngang */
}
@media (max-width: 767.98px) {
  .room-action {
    border-left: none;
    border-top: 1px solid #e9ecef; /* Kẻ phân cách nếu nằm dọc */
  }
}
.extra-small {
  font-size: 0.75rem;
}


.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out; /* Nhanh hơn chút */
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px); /* Hiệu ứng trượt lên/xuống */
}

/* Button mặc định của bạn (CustomButton) có thể cần thêm style để ghi đè Bootstrap nếu cần */
</style>