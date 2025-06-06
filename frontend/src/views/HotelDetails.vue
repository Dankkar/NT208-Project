<!-- src/pages/HotelDetails.vue -->
<template>
     <div>
      <Navbar
        bgFixed="true"
        style="position: fixed !important; top: 0; width: 100%; z-index: 100;"
      />
      <div class="hotel-details-page page-container-fluid" style="padding-top:70px">
        <div v-if="loading" class="loading-message py-5 text-center">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Loading hotel details...</p>
        </div>
        <div v-else-if="error" class="error-message py-5 text-center alert alert-danger">{{ error }}</div>
        <div v-else-if="hotel" class="hotel-content container">
          <!-- Section 1: Tên khách sạn, Địa chỉ, Sao, Ảnh chính -->
          <section class="hotel-main-info pt-4 pb-4">
            <div class="row">
              <div class="col-lg-7">
                <h1 class="hotel-name mb-2">{{ hotel.TenKS }}</h1>
                <div class="d-flex align-items-center mb-3">
                  <div class="star-rating me-3" v-if="hotel.HangSao">
                    <span v-for="s in 5" :key="`star-${s}`" class="star" :class="{ 'filled': s <= hotel.HangSao }">★</span>
                    <span class="ms-1">({{ hotel.HangSao.toFixed(1) }})</span>
                  </div>
                  <span class="hotel-address text-muted"><i class="bi bi-geo-alt-fill me-1"></i>{{ hotel.DiaChi }}</span>
                </div>
                <p class="hotel-short-description lead mb-4">{{ hotel.MotaChung }}</p> <!-- Sử dụng MotaChung -->
                <div class="quick-highlights mb-3">
                  <span v-if="hotel.priceRange && hotel.priceRange.min > 0" class="price-from me-3">
                    Giá từ: <strong class="text-danger">{{ formatCurrency(hotel.priceRange.min) }}</strong> / đêm
                  </span>
                </div>
              </div>
              <div class="col-lg-5">
                <img :src="hotel.MainImagePath || defaultPlaceholderImage" @error="onImageError" :alt="hotel.TenKS" class="img-fluid rounded shadow-sm main-hotel-image">
              </div>
            </div>
          </section>

          <!-- Gallery ảnh nhỏ (nếu có) -->
          <section v-if="hotel.GalleryImages && hotel.GalleryImages.length" class="hotel-gallery-thumbnails mb-5">
              <h2 class="section-title">Gallery</h2>
              <div class="row g-2">
                  <div v-for="(img, idx) in hotel.GalleryImages" :key="idx" class="col-6 col-sm-4 col-md-3 col-lg-2">
                      <img :src="img.FullPath || defaultPlaceholderImage" @error="onImageError" :alt="img.MoTa || `Gallery image ${idx+1}`" class="img-thumbnail gallery-thumb">
                  </div>
              </div>
          </section>

          <!-- Section 2: Mô tả chi tiết -->
          <section class="hotel-description-full mb-5">
            <h2 class="section-title">About {{ hotel.TenKS }}</h2>
            <div v-if="hotel.MoTaCoSoVatChat" v-html="hotel.MoTaCoSoVatChat" class="long-description"></div>
            <div v-if="hotel.QuyDinh" class="property-rules mt-4 border-top pt-3">
                <h5 class="fw-medium">Hotel Policies</h5>
                <div v-html="hotel.QuyDinh"></div>
            </div>
          </section>

          <!-- Section 3: Tiện nghi (từ API services) -->
          <section class="hotel-amenities mb-5">
            <h2 class="section-title">Hotel Amenities</h2>
            <ul v-if="hotel.services && hotel.services.length" class="list-unstyled row">
              <li v-for="service in hotel.services" :key="service.MaLoaiDV" class="col-md-4 col-sm-6 mb-2 amenity-item">
                <i class="bi bi-check-circle-fill text-success me-2"></i>{{ service.TenLoaiDV }}
                <span v-if="service.GiaDV > 0" class="text-muted small"> ({{ formatCurrency(service.GiaDV) }})</span>
              </li>
            </ul>
            <p v-else class="text-muted">Amenities information not available for this hotel.</p>
          </section>

          <!-- Section 4: Các loại phòng -->
          <section class="hotel-room-types mb-5">
            <h2 class="section-title">Available Room Types</h2>
            <div v-if="hotel.roomTypes && hotel.roomTypes.length" class="row g-4">
              <div v-for="roomType in hotel.roomTypes" :key="roomType.MaLoaiPhong" class="col-md-6">
                <div class="card room-type-card h-100 shadow-sm">
                  <!-- API getHotelById hiện chưa trả về ảnh cho LoaiPhong, sẽ dùng placeholder -->
                  <img :src="roomType.HinhAnh || defaultPlaceholderImage" @error="onImageError" class="card-img-top room-type-image" :alt="roomType.TenLoaiPhong">
                  <div class="card-body d-flex flex-column">
                    <h5 class="card-title room-type-name">{{ roomType.TenLoaiPhong }}</h5>
                    <p class="card-text room-type-description text-muted small mb-2" v-if="roomType.MoTa">{{ roomType.MoTa }}</p>
                    <p class="card-text room-type-guests text-muted small">
                      <i class="bi bi-people-fill me-1"></i>Max Guests: {{ (roomType.SoGiuongDoi * 2) + roomType.SoGiuongDon }}
                    </p>
                    <p class="card-text room-type-amenities text-muted small mb-2" v-if="roomType.TienNghi">
                        <strong>Features:</strong> {{ roomType.TienNghi }}
                    </p>
                     <p class="card-text room-type-availability small" :class="roomType.SoPhongTrongThucTe > 0 ? 'text-success' : 'text-danger'">
                        {{ roomType.SoPhongTrongThucTe > 0 ? `✅ ${roomType.SoPhongTrongThucTe} room(s) currently available (check dates)` : '❌ May be unavailable (check dates)' }}
                    </p>
                    <p class="card-text room-type-price mt-auto">
                      <strong>{{ formatCurrency(roomType.GiaCoSo) }}</strong> / night
                    </p>
                    <button @click="initiateBookingForRoom(hotel, roomType)" class="btn btn-primary btn-sm mt-3">
                      <i class="bi bi-calendar-check me-1"></i> Check Availability & Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-muted">No specific room types listed for this hotel currently.</p>
          </section>

          <!-- Section 5: Đánh giá (Cần API riêng) -->
          <section class="hotel-reviews-link mb-5" v-if="hotel.overallRating || hotel.reviewCount">
            <h2 class="section-title">Guest Reviews</h2>
            <div class="card bg-light p-3">
              <p class="mb-2" v-if="hotel.overallRating">
                Overall rating: <strong>{{ hotel.overallRating.toFixed(1) }}/5</strong>
                <span v-if="hotel.reviewCount"> based on {{ hotel.reviewCount }} reviews.</span>
              </p>
              <router-link :to="`/reviews/hotel/${hotel.MaKS}`" class="btn btn-outline-primary btn-sm">
                View All Reviews
              </router-link>
            </div>
          </section>

          <!-- Section 6: Bản đồ -->
          <section class="hotel-location-map mb-5">
            <h2 class="section-title">Location</h2>
            <GoogleMapDisplay
              :latitude="hotel.Latitude"
              :longitude="hotel.Longitude"
              :place-name="hotel.TenKS"
              :address="hotel.DiaChi"
              :height="400"
              :zoom="15"
              :show-coordinates="false"
              :show-directions-button="true"
              :show-fullscreen-button="true"
              :no-coordinates-message="`Vị trí bản đồ chưa được thiết lập cho ${hotel.TenKS}`"
            />
          </section>

          <div class="text-center my-4">
            <button @click="goBack" class="btn btn-secondary">
              <i class="bi bi-arrow-left-circle me-1"></i> Back
            </button>
          </div>

        </div>
        <div v-else class="not-found-message py-5 text-center">
          <i class="bi bi-emoji-frown display-1 text-warning"></i>
          <h3 class="mt-3">Hotel Not Found</h3>
          <p>The hotel you are looking for does not exist or could not be loaded.</p>
          <button @click="goBackToHome" class="btn btn-primary mt-3">Go to Homepage</button>
        </div>
      </div>
     </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Navbar from '../components/NavBar.vue';
import GoogleMapDisplay from '@/components/GoogleMapDisplay.vue';
import { useBookingStore } from '@/store/bookingStore';
import defaultPlaceholderImage from '@/assets/mountain.jpg'; // Một ảnh placeholder chung

const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();

const hotel = ref(null);
const loading = ref(true);
const error = ref(null);
const canBookOverall = ref(false); // Biến này có thể không cần thiết nếu luôn có nút ở mỗi roomType

const fetchHotelDetails = async (hotelId) => {
  loading.value = true;
  error.value = null;
  hotel.value = null;
  try {
    console.log(`Fetching details for hotel ID from API: ${hotelId}`);
    const response = await axios.get(`/api/hotels/${hotelId}`); 

    if (response.data && response.data.success) {
      const apiHotelData = response.data.data;
      // Ánh xạ trực tiếp hoặc qua một hàm helper nếu cần
      hotel.value = apiHotelData; // Giả sử cấu trúc trả về từ API đã gần khớp với những gì template cần
                                  // Hoặc bạn cần map chi tiết ở đây
      console.log("Hotel data from API:", hotel.value);
      // Ví dụ: nếu API trả về `roomTypes` và bạn cần tính maxGuests cho mỗi cái:
      if (hotel.value && hotel.value.roomTypes && Array.isArray(hotel.value.roomTypes)) {
        hotel.value.roomTypes = hotel.value.roomTypes.map(rt => ({
          ...rt,
          maxGuests: (rt.SoGiuongDoi * 2) + rt.SoGiuongDon,
          // Nếu API chưa có HinhAnh cho LoaiPhong, bạn có thể gán placeholder ở đây
          // image: rt.HinhAnh || defaultPlaceholderImage
        }));
      }
      // Kiểm tra xem có thể đặt phòng tổng thể không (nếu có roomTypes)
      canBookOverall.value = hotel.value.roomTypes && hotel.value.roomTypes.length > 0;

    } else {
      error.value = response.data.message || `Hotel with ID ${hotelId} not found or error fetching data.`;
    }
  } catch (err) {
    console.error('Error fetching hotel details from API:', err);
    error.value = err.response?.data?.message || err.message || 'An error occurred.';
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return 'Contact';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};

const initiateBookingForRoom = (currentHotel, selectedRoomType) => {
  console.log(`HotelDetails: Initiating booking for Room ID: ${selectedRoomType.MaLoaiPhong} at Hotel ID: ${currentHotel.MaKS}`);

  if (!currentHotel || !selectedRoomType) {
    alert("Error: Hotel or Room Type data is missing.");
    return;
  }
  const isActiveHoldPresent = bookingStore.heldBookingMaDat &&
                             bookingStore.heldBookingExpiresAt &&
                             bookingStore.heldBookingExpiresAt > Date.now();

  if (isActiveHoldPresent) {
    // TRƯỜNG HỢP 1: ĐANG CÓ LƯỢT GIỮ CÒN HẠN
    console.log(`HotelDetails: Active hold found (MaDat: ${bookingStore.heldBookingMaDat}). Navigating to BookingProcess to resume.`);
    // Không làm gì thêm với intent hoặc reset, chỉ điều hướng.
    // BookingProcess sẽ dựa vào currentStep (đã persist) và heldBookingMaDat để hiển thị đúng bước (Step 2 hoặc Step 3).
    // Nếu currentStep đã là 3, Step3_GuestInfo sẽ hiện.
    // Nếu currentStep là 2 (hiếm hơn trong trường hợp này, nhưng có thể), Step2_RoomSelection sẽ hiện "Action Required".
    router.push('/BookingProcess');
  }  else {
    // TRƯỜNG HỢP 2: KHÔNG CÓ LƯỢT GIỮ NÀO
    console.log(`HotelDetails: No active hold found. Starting new booking process.`);
    bookingStore.startBookingFromScratchForHotelDetails();
    console.log(`HotelDetails: Setting preselected booking intent for Hotel ID: ${currentHotel.MaKS}, Room Type ID: ${selectedRoomType.MaLoaiPhong}`);
    // Thiết lập intent booking với thông tin đã chọn-
    bookingStore.setPreselectedBookingIntent({
    hotelId: currentHotel.MaKS,
    hotelName: currentHotel.TenKS,
    roomTypeId: selectedRoomType.MaLoaiPhong,
    roomName: selectedRoomType.TenLoaiPhong,
    roomPrice: selectedRoomType.GiaCoSo,
    roomMaxGuests: (selectedRoomType.SoGiuongDoi * 2) + selectedRoomType.SoGiuongDon
  });
  router.push('/BookingProcess');
  }



};

const goBack = () => {
  if (window.history.length > 2 && document.referrer && document.referrer.startsWith(window.location.origin)) {
    router.back();
  } else {
    router.push({ name: 'HomePage' }); // Hoặc tên route trang chủ/danh sách KS
  }
};
const goBackToHome = () => {
    router.push({ name: 'HomePage' });
}

const onImageError = (event) => {
  event.target.src = defaultPlaceholderImage;
};

onMounted(() => {
  const slugOrIdFromRoute = route.params.id; // API của bạn dùng MaKS, không phải slug
  let hotelIdToFetch = null;

  if (slugOrIdFromRoute) {
    // Logic trích xuất MaKS từ slug dạng "ten-ks-MAKS"
    const parts = slugOrIdFromRoute.split('-');
    const potentialId = parts[parts.length - 1];
    if (!isNaN(parseInt(potentialId))) { // Kiểm tra xem phần cuối có phải là số (MaKS)
      hotelIdToFetch = potentialId;
    } else {
        // Nếu slug không có dạng ID ở cuối, có thể slug chính là MaKS (nếu MaKS không phải số)
        // Hoặc logic trích xuất của bạn khác
        hotelIdToFetch = slugOrIdFromRoute; // Thử dùng cả slug, API sẽ validate
        console.warn(`Could not reliably extract numeric ID from slug "${slugOrIdFromRoute}". Using full slug/ID for API call.`);
    }
  }

  if (hotelIdToFetch) {
    fetchHotelDetails(hotelIdToFetch);
  } else {
    error.value = "Invalid hotel identifier provided in URL.";
    loading.value = false;
  }
});
</script>

<style scoped>
/* ... style của bạn ... */
.page-container-fluid { background-color: #f8f9fa; }
.hotel-content { background-color: #fff; padding-top: 20px; padding-bottom: 20px; border-radius: 0 0 8px 8px; }
.hotel-name { font-size: 2.2rem; font-weight: 700; color: #343a40; }
.star-rating .star { font-size: 1.2rem; color: #ccc; }
.star-rating .star.filled { color: #ffc107; }
.hotel-address { font-size: 0.95rem; }
.hotel-address .bi { color: #007bff; }
.main-hotel-image { max-height: 450px; width: 100%; object-fit: cover; border: 1px solid #dee2e6;}
.gallery-thumb { cursor: pointer; transition: opacity 0.2s; height: 120px; width: 100%; object-fit: cover; border: 1px solid #dee2e6; padding: 0.25rem; background-color: #fff;}
.gallery-thumb:hover { opacity: 0.8; }
.section-title { font-size: 1.75rem; font-weight: 600; color: #343a40; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 3px solid #007bff; display: inline-block; }
.long-description p, .property-rules p { margin-bottom: 1rem; line-height: 1.7; color: #495057; }
.amenity-item { font-size: 0.95rem; color: #495057; }
.amenity-item .bi { font-size: 1.1em; }
.room-type-card { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
.room-type-card:hover { transform: translateY(-5px); box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important; }
.room-type-image { height: 200px; object-fit: cover; }
.room-type-name { font-weight: 600; }
.room-type-price strong { color: #dc3545; font-size: 1.2em; }
.btn-primary { background-color: #007bff; border-color: #007bff; }
.btn-primary:hover { background-color: #0056b3; border-color: #0056b3; }
.btn-outline-primary { color: #007bff; border-color: #007bff; }
.btn-outline-primary:hover { color: #fff; background-color: #007bff; border-color: #007bff; }
.btn-secondary { background-color: #6c757d; border-color: #6c757d; }
.btn-secondary:hover { background-color: #5a6268; border-color: #545b62; }
.not-found-message .bi { font-size: 4rem; }
</style>