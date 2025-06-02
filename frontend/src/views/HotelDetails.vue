<!-- src/pages/HotelDetails.vue -->
<template>
     <div>
      <Navbar
        bgFixed="true"
        style="position: fixed !important; top: 0; width: 100%; z-index: 100;"
      />
      <div class="hotel-details-page page-container-fluid" style="padding-top:70px">
        <div v-if="loading" class="loading-message py-5 text-center">
          <!-- ... spinner ... -->
        </div>
        <div v-else-if="error" class="error-message py-5 text-center alert alert-danger">{{ error }}</div>
        <div v-else-if="hotel" class="hotel-content container">
          <!-- ... Section 1, 2, 3 (Hotel Info, Gallery, Description, Amenities) giữ nguyên ... -->
          <section class="hotel-main-info pt-4 pb-4"> <!-- ... --> </section>
          <section v-if="hotel.galleryImages && hotel.galleryImages.length" class="hotel-gallery-thumbnails mb-5"> <!-- ... --> </section>
          <section class="hotel-description-full mb-5"> <!-- ... --> </section>
          <section class="hotel-amenities mb-5"> <!-- ... --> </section>

          <!-- Section 4: Các loại phòng - CẬP NHẬT NÚT BOOK -->
          <section class="hotel-room-types mb-5">
            <h2 class="section-title">Room Types</h2>
            <div v-if="hotel.roomTypes && hotel.roomTypes.length" class="row g-4">
              <div v-for="roomType in hotel.roomTypes" :key="roomType.id" class="col-md-6 col-lg-4">
                <div class="card room-type-card h-100 shadow-sm">
                  <img :src="roomType.image" class="card-img-top room-type-image" :alt="roomType.name">
                  <div class="card-body d-flex flex-column">
                    <h5 class="card-title room-type-name">{{ roomType.name }}</h5>
                    <p class="card-text room-type-guests text-muted small">
                      <i class="bi bi-people-fill me-1"></i>Max Guests: {{ roomType.maxGuests }}
                    </p>
                    <p class="card-text room-type-price mt-auto">
                      <strong>{{ formatCurrency(roomType.price) }}</strong> / night
                    </p>
                    <!-- SỬA Ở ĐÂY: Gọi hàm xử lý booking mới -->
                    <button @click="initiateBookingForRoom(hotel, roomType)" class="btn btn-primary btn-sm mt-2">
                      Book This Room
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-muted">No specific room types listed for this hotel currently.</p>
          </section>

          <!-- ... Section 5, 6 (Reviews, Map) và nút Back giữ nguyên ... -->
          <section class="hotel-reviews-link mb-5"> <!-- ... --> </section>
          <section class="hotel-location-map mb-5"> <!-- ... --> </section>
          <div class="text-center my-4"> <!-- ... --> </div>

        </div>
        <div v-else class="not-found-message py-5 text-center"> <!-- ... --> </div>
      </div>
     </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import axios from 'axios'; // Bỏ axios nếu dùng mock data, hoặc để lại nếu fetchHotelDetails sẽ gọi API thật
import Navbar from '../components/NavBar.vue'; // Đảm bảo đường dẫn đúng
import { useBookingStore } from '@/store/bookingStore'; // THÊM IMPORT BOOKING STORE

const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore(); // KHỞI TẠO BOOKING STORE

const hotel = ref(null);
const loading = ref(true);
const error = ref(null);

const allHotelsMockData = { /* ... Dữ liệu mock của bạn giữ nguyên ... */ };

const fetchHotelDetails = async (hotelIdToFetch) => {
  loading.value = true; error.value = null; hotel.value = null;
  try {
    console.log(`Fetching details for MOCK hotel ID: ${hotelIdToFetch}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Giảm delay
    const data = allHotelsMockData[hotelIdToFetch];
    if (data) {
      hotel.value = data;
    } else {
      error.value = `Hotel not found (ID: ${hotelIdToFetch}).`;
    }
  } catch (err) {
    error.value = 'An error occurred while fetching hotel details.';
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => { /* ... giữ nguyên ... */ };

// HÀM MỚI ĐỂ XỬ LÝ KHI NHẤN "Book This Room"
const initiateBookingForRoom = (currentHotel, selectedRoomType) => {
  console.log(`HotelDetails: Initiating booking for Room ID: ${selectedRoomType.id} at Hotel ID: ${currentHotel.id}`);

  if (!currentHotel || !selectedRoomType) {
    console.error("HotelDetails: Missing hotel or roomType data for booking initiation.");
    alert("An error occurred. Could not proceed with booking.");
    return;
  }

  // 1. Set "ý định đặt phòng" trong store
  bookingStore.setPreselectedBookingIntent({
    hotelId: currentHotel.id, // API getHotelById của bạn dùng MaKS, mock data hiện tại đang là `id`
                             // Cần thống nhất: `MaKS` từ API sẽ map sang `id` ở mock data hoặc ngược lại
                             // Giả sử mock data key và hotel.id là MaKS (ví dụ: "1", "ks001")
                             // và selectedRoomType.id là MaLoaiPhong
    hotelName: currentHotel.name,
    roomTypeId: selectedRoomType.id, // ID của loại phòng, ví dụ 'deluxe_mock_1' hoặc MaLoaiPhong
    roomName: selectedRoomType.name,
    roomPrice: selectedRoomType.price,
    roomMaxGuests: selectedRoomType.maxGuests
    // Bạn có thể thêm các chi tiết phòng khác vào intent nếu Step1_SearchForm cần
    // ví dụ: roomDetails: { TienNghi: selectedRoomType.amenitiesInRoom, ... }
  });

  // 2. Reset store và chuẩn bị cho Step 1 của booking process
  bookingStore.startBookingFromScratch();

  // 3. Điều hướng đến trang booking process
  router.push('/BookingProcess');
};

const goBack = () => { /* ... giữ nguyên ... */ };

onMounted(() => {
  const slugOrIdFromRoute = route.params.id;
  let hotelIdToFetch = null;

  if (slugOrIdFromRoute) {
    // Logic trích xuất ID từ slug (đã cập nhật ở lần trước)
    // Giả sử slug dạng "ten-khach-san-ID" hoặc chỉ là "ID"
    const parts = slugOrIdFromRoute.split('-');
    const potentialId = parts[parts.length - 1];

    if (allHotelsMockData[potentialId]) { // Thử với ID trích xuất
      hotelIdToFetch = potentialId;
    } else if (allHotelsMockData[slugOrIdFromRoute]) { // Thử với cả slug (phòng trường hợp ID không có dấu '-')
      hotelIdToFetch = slugOrIdFromRoute;
    }
  }

  if (hotelIdToFetch) {
    fetchHotelDetails(hotelIdToFetch);
  } else {
    error.value = `Invalid hotel identifier in URL: "${slugOrIdFromRoute}".`;
    loading.value = false;
  }
});
</script>

<style scoped>
.page-container-fluid {
  background-color: #f8f9fa;
}
.hotel-content {
  background-color: #fff;
  padding-top: 20px;
  padding-bottom: 20px;
  border-radius: 0 0 8px 8px;
}

.hotel-name {
  font-size: 2.2rem;
  font-weight: 700;
  color: #343a40;
}

.star-rating .star {
  font-size: 1.2rem;
  color: #ccc;
}
.star-rating .star.filled {
  color: #ffc107;
}

.hotel-address {
  font-size: 0.95rem;
}
.hotel-address .bi {
  color: #007bff;
}

.main-hotel-image {
  max-height: 450px;
  width: 100%;
  object-fit: cover;
}
.gallery-thumb {
    cursor: pointer;
    transition: opacity 0.2s;
    height: 100px;
    object-fit: cover;
}
.gallery-thumb:hover {
    opacity: 0.8;
}


.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #007bff;
  display: inline-block;
}

.long-description p {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: #495057;
}

.amenity-item {
  font-size: 0.95rem;
  color: #495057;
}
.amenity-item .bi {
  font-size: 1.1em;
}


.room-type-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.room-type-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
}
.room-type-image {
  height: 200px;
  object-fit: cover;
}
.room-type-name {
  font-weight: 600;
}
.room-type-price strong {
  color: #dc3545;
  font-size: 1.2em;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.btn-outline-primary {
  color: #007bff;
  border-color: #007bff;
}
.btn-outline-primary:hover {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-secondary {
    background-color: #6c757d;
    border-color: #6c757d;
}
.btn-secondary:hover {
    background-color: #5a6268;
    border-color: #545b62;
}
.text-primary { color: #007bff !important; }
.text-secondary { color: #6c757d !important; }
.text-success { color: #28a745 !important; }
.text-danger { color: #dc3545 !important; }
.text-warning { color: #ffc107 !important; }
.text-info { color: #17a2b8 !important; }
.text-light { color: #f8f9fa !important; }
.text-dark { color: #343a40 !important; }
.text-muted { color: #6c757d !important; }

.loading-message .spinner-border {
    color: #007bff !important;
}
.not-found-message .bi {
    font-size: 4rem; /* Làm icon to hơn */
}
</style>