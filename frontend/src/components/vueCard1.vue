<template>
  <div class="custom-card-wrapper shadow w-100 mb-4" v-if="hotelData">
    <!-- Card Khách sạn -->
    <div class="card d-flex flex-md-row overflow-hidden border-0">
      <!-- Ảnh khách sạn -->
      <div class="custom-card__image-container col-md-4 d-flex align-items-center justify-content-center p-3 bg-white">
        <img :src="imageUrl" alt="Hotel Image" class="img-fluid custom-card__image" />
      </div>

      <!-- Nội dung khách sạn -->
      <div class="col-md-8">
        <div class="card-body custom-card__content-bg d-flex flex-column h-100 justify-content-between">
          <div>
            <h3 class="card-title fw-bold text-black">{{ hotelData.TenKS }}</h3>
            <p class="mb-1 text-muted">{{ hotelData.DiaChi }}</p>
            <p class="mb-1">⭐ {{ hotelData.HangSao }} - {{ hotelData.LoaiHinh }}</p>
            <p class="mb-2">{{ hotelData.MoTaChung }}</p>
          </div>

          <CustomButton
            class="mt-2 w-50"
            :content="showRooms ? 'Ẩn phòng' : 'Xem các loại phòng còn trống'"
            :block="false"
            textColor="#fff"
            fontSize="14px"
            backgroundColor="black"
            colorHover="black"
            bgHover="white"
            borderRadius="5px"
            textAlign="center"
            @click="toggleRoomVisibility"
          />
        </div>
      </div>
    </div>

    <!-- Danh sách phòng -->
    <transition name="slide-fade">
      <div v-if="showRooms" class="room-types mt-3 px-3">
        <div
          v-for="room in hotelData.roomTypes"
          :key="room.MaLoaiPhong"
          class="room-card d-flex flex-column flex-md-row bg-white rounded shadow-sm p-3 mb-3"
        >
          <!-- Ảnh phòng -->
          <div class="room-image col-md-3 mb-3 mb-md-0 d-flex align-items-center justify-content-center p-3">
            <img :src="imageUrl" alt="Room Image" class="img-fluid rounded" style="max-height: 150px; object-fit: cover;" />
          </div>

          <!-- Thông tin phòng -->
          <div class="room-info col-md-6 px-md-4  p-3">
            <h5 class="fw-bold">{{ room.TenLoaiPhong }}</h5>
            <p class="mb-1"><strong>📐 Diện tích:</strong> {{ room.DienTich }} m²</p>
            <p class="mb-1"><strong>🛏 Giường:</strong> {{ room.CauHinhGiuong }}</p>
            <p class="mb-1"><strong>🧰 Tiện nghi:</strong> {{ room.TienNghi }}</p>
            <p class="mb-1 text-success"><strong>✅ Còn trống:</strong> {{ room.SoPhongTrong }} phòng</p>
          </div>

          <!-- Hành động -->
          <div class="room-action col-md-3 text-center mt-3 mt-md-0 p-3">
            <p class="mb-2"><strong>💰 Giá:</strong> {{ formatPrice(room.GiaCoSo) }} VND / đêm</p>
            <CustomButton
              :content="'Chọn phòng'"
              textColor="#fff"
              fontSize="14px"
              backgroundColor="black"
              colorHover="black"
              bgHover="white"
              borderRadius="6px"
              textAlign="center"
              class="w-100"
              @click="chonPhong(room)"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, ref } from 'vue';
import mountain from '../assets/mountain.jpg'; // Ảnh mặc định
import CustomButton from './Button.vue';

const imageUrl = ref(mountain);
const emit = defineEmits(['room-selected']);

const props = defineProps({
  hotelData: {
    type: Object,
    required: true
  },
  imageUrl: {
    type: String,
    default: '../assets/mountain.jpg'
  }
});

const showRooms = ref(false);

const toggleRoomVisibility = () => {
  showRooms.value = !showRooms.value;
};

const formatPrice = (value) => {
  if (value == null) return 'N/A';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const chonPhong = (room) => {
  console.log("Đã chọn phòng:", room);
  emit('room-selected', room);

};
</script>

<style scoped>
.custom-card-wrapper {
  border: 2px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  background-color: #fff;
  font-size: 16px;
}

.custom-card__image {
  max-height: 250px;
  width: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.custom-card__content-bg {
  background-color: rgb(255, 240, 245);
  padding: 1.5rem;
}

.room-types {
  font-size: 0.95em;
  width: 100%;
}

.room-card {
  border: 1px solid #ddd;
  transition: transform 0.2s ease-in-out;
  padding: 0 !important;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
}

.room-action {
  background-color: #F6E4E4;
  padding: 1rem;

}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
