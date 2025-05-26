<!-- src/pages/HotelDetails.vue -->
<template>
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
              <h1 class="hotel-name mb-2">{{ hotel.name }}</h1>
              <div class="d-flex align-items-center mb-3">
                <div class="star-rating me-3">
                  <span v-for="s in 5" :key="`star-${s}`" class="star" :class="{ 'filled': s <= hotel.stars }">★</span>
                </div>
                <span class="hotel-address text-muted"><i class="bi bi-geo-alt-fill me-1"></i>{{ hotel.address }}</span>
              </div>
              <p class="hotel-short-description lead mb-4">{{ hotel.shortDescription }}</p>
              <div class="quick-highlights mb-3">
                <span v-if="hotel.priceFrom" class="price-from me-3">
                  Giá từ: <strong class="text-danger">{{ formatCurrency(hotel.priceFrom) }}</strong> / đêm
                </span>
              </div>
            </div>
            <div class="col-lg-5">
              <img :src="hotel.mainImage" :alt="hotel.name" class="img-fluid rounded shadow-sm main-hotel-image">
            </div>
          </div>
        </section>

        <!-- Gallery ảnh nhỏ (nếu có) -->
        <section v-if="hotel.galleryImages && hotel.galleryImages.length" class="hotel-gallery-thumbnails mb-5">
            <h2 class="section-title">Gallery</h2>
            <div class="row g-2">
                <div v-for="(img, idx) in hotel.galleryImages" :key="`gallery-${idx}`" class="col-3 col-md-2">
                    <img :src="img.src" :alt="img.alt || `Gallery image ${idx+1}`" class="img-thumbnail gallery-thumb">
                </div>
            </div>
        </section>

        <!-- Section 2: Mô tả chi tiết -->
        <section class="hotel-description-full mb-5">
          <h2 class="section-title">About {{ hotel.name }}</h2>
          <p v-html="hotel.longDescription" class="long-description"></p>
        </section>

        <!-- Section 3: Tiện nghi -->
        <section class="hotel-amenities mb-5">
          <h2 class="section-title">Hotel Amenities</h2>
          <ul class="list-unstyled row">
            <li v-for="amenity in hotel.amenities" :key="amenity" class="col-md-4 col-sm-6 mb-2 amenity-item">
              <i class="bi bi-check-circle-fill text-success me-2"></i>{{ amenity }}
            </li>
          </ul>
        </section>

        <!-- Section 4: Các loại phòng -->
        <section class="hotel-room-types mb-5">
          <h2 class="section-title">Room Types</h2>
          <div v-if="hotel.roomTypes && hotel.roomTypes.length" class="row g-4">
            <div v-for="room in hotel.roomTypes" :key="room.id" class="col-md-6 col-lg-4">
              <div class="card room-type-card h-100 shadow-sm">
                <img :src="room.image" class="card-img-top room-type-image" :alt="room.name">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title room-type-name">{{ room.name }}</h5>
                  <p class="card-text room-type-guests text-muted small">
                    <i class="bi bi-people-fill me-1"></i>Max Guests: {{ room.maxGuests }}
                  </p>
                  <p class="card-text room-type-price mt-auto">
                    <strong>{{ formatCurrency(room.price) }}</strong> / night
                  </p>
                  <button @click="navigateToBooking(hotel.id, room.id)" class="btn btn-primary btn-sm mt-2">
                    Book This Room
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-muted">No specific room types listed for this hotel currently.</p>
        </section>

        <!-- Section 5: Đánh giá (Link tới trang đánh giá chi tiết) -->
        <section class="hotel-reviews-link mb-5">
          <h2 class="section-title">Guest Reviews</h2>
          <div class="card bg-light p-3">
            <p class="mb-2">
              Overall rating: <strong>{{ hotel.overallRating }}/5</strong> based on {{ hotel.reviewCount }} reviews.
            </p>
            <router-link :to="`/ratings/hotel/${hotel.id}`" class="btn btn-outline-primary btn-sm">
              View All Reviews & Details
            </router-link>
          </div>
        </section>

        <!-- Section 6: Bản đồ -->
        <section class="hotel-location-map mb-5">
          <h2 class="section-title">Location</h2>
          <div class="map-placeholder border rounded p-3 text-center text-muted" style="height: 350px; background-color: #f8f9fa;">
            <p class="mt-5">Map of {{ hotel.address }} would be displayed here.</p>
            <i class="bi bi-map-fill display-1 text-secondary"></i>
          </div>
        </section>

        <div class="text-center my-4">
          <button @click="goBack" class="btn btn-secondary">
            <i class="bi bi-arrow-left-circle me-1"></i> Back to List
          </button>
        </div>

      </div>
      <div v-else class="not-found-message py-5 text-center">
        <i class="bi bi-emoji-frown display-1 text-warning"></i>
        <h3 class="mt-3">Hotel Not Found</h3>
        <p>The hotel you are looking for does not exist or could not be loaded.</p>
        <button @click="goBack" class="btn btn-primary mt-3">Go Back</button>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Navbar from '../components/Navbar.vue';

const route = useRoute();
const router = useRouter();

const hotel = ref(null);
const loading = ref(true);
const error = ref(null);

// --- Dữ liệu Mock cho chi tiết khách sạn ---
// Sửa ID thành chuỗi số để khớp với route.params.id (ví dụ "1", "2")
const allHotelsMockData = {
  '1': { // ID khách sạn là "1" (chuỗi)
    id: '1', // Giữ id nội bộ để tham chiếu nếu cần
    name: 'Khách Sạn Biển Xanh (Mock)', // Thay đổi tên để dễ nhận biết là mock
    stars: 4,
    address: '101 Đường Biển, TP. Vũng Tàu, Việt Nam',
    shortDescription: 'Một khách sạn tuyệt vời gần biển với nhiều tiện nghi hiện đại.',
    longDescription: `<p>Khách Sạn Biển Xanh (Mock) là điểm đến lý tưởng cho kỳ nghỉ của bạn tại Vũng Tàu. Tọa lạc tại vị trí đắc địa, chỉ cách bãi biển vài bước chân, khách sạn mang đến không gian nghỉ dưỡng thoải mái và tiện nghi.</p><p>Tất cả các phòng đều được trang bị đầy đủ tiện nghi hiện đại, ban công riêng nhìn ra biển hoặc thành phố. Chúng tôi tự hào có đội ngũ nhân viên chuyên nghiệp, luôn sẵn sàng phục vụ để đảm bảo quý khách có những trải nghiệm đáng nhớ.</p>`,
    mainImage: 'https://plus.unsplash.com/premium_photo-1675745329954-9639737ea7a9?q=80&w=1974&auto=format&fit=crop', // Placeholder
    galleryImages: [
        {src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', alt: 'Sảnh'},
        {src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop', alt: 'Hồ bơi'},
        {src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop', alt: 'Phòng ngủ'},
    ],
    amenities: ['WiFi Miễn Phí', 'Hồ Bơi Ngoài Trời', 'Nhà Hàng', 'Lễ Tân 24/7', 'Dịch Vụ Phòng', 'Bãi Đậu Xe'],
    roomTypes: [
      { id: 'deluxe_mock_1', name: 'Phòng Deluxe Hướng Biển', maxGuests: 2, price: 1800000, image: 'https://images.unsplash.com/photo-1598009003085-34025a45e58c?q=80&w=1964&auto=format&fit=crop' },
      { id: 'standard_mock_1', name: 'Phòng Standard Hướng Vườn', maxGuests: 2, price: 1200000, image: 'https://images.unsplash.com/photo-1590490359854-dfba1968827b?q=80&w=2070&auto=format&fit=crop' },
    ],
    priceFrom: 1200000,
    overallRating: 4.2,
    reviewCount: 350,
  },
  '2': { // ID khách sạn là "2" (chuỗi)
    id: '2',
    name: 'Resort Núi Vàng (Mock)',
    stars: 5,
    address: 'Khu du lịch Núi Vàng, Huyện X, Tỉnh Y, Việt Nam',
    shortDescription: 'Trải nghiệm sự sang trọng và hòa mình với thiên nhiên tại resort đẳng cấp 5 sao.',
    longDescription: `<p>Resort Núi Vàng (Mock) mang đến một không gian nghỉ dưỡng độc đáo, kết hợp giữa kiến trúc hiện đại và vẻ đẹp hùng vĩ của núi rừng. Đây là nơi lý tưởng để bạn trốn khỏi sự ồn ào của thành phố và tìm lại sự bình yên.</p><p>Các biệt thự và phòng nghỉ tại resort đều có thiết kế tinh tế, tầm nhìn tuyệt đẹp ra quang cảnh núi non. Hãy tận hưởng các dịch vụ cao cấp như spa, nhà hàng ẩm thực đa dạng, và các hoạt động giải trí ngoài trời.</p>`,
    mainImage: 'https://images.unsplash.com/photo-1586611292717-f8284e47564e?q=80&w=1974&auto=format&fit=crop', // Placeholder
    galleryImages: [
        {src: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1948&auto=format&fit=crop', alt: 'Lối vào resort'},
        {src: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop', alt: 'Hồ bơi trên núi'},
    ],
    amenities: ['Biệt Thự Riêng', 'Spa Cao Cấp', 'Nhà Hàng Á - Âu', 'Câu Lạc Bộ Trẻ Em', 'WiFi Miễn Phí Toàn Khu', 'Dịch Vụ Quản Gia'],
    roomTypes: [
      { id: 'villa_mock_2', name: 'Biệt Thự Trên Đồi', maxGuests: 4, price: 5500000, image: 'https://images.unsplash.com/photo-1559841644-0878006ab625?q=80&w=2070&auto=format&fit=crop' },
      { id: 'suite_mock_2', name: 'Phòng Suite Nhìn Ra Thung Lũng', maxGuests: 2, price: 3800000, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop' },
    ],
    priceFrom: 3800000,
    overallRating: 4.9,
    reviewCount: 720,
  },
  // Bạn có thể thêm các khách sạn khác ở đây với ID "3", "4", ...
  'ks001': { // Giữ lại để nếu có link cũ vẫn hoạt động, hoặc bỏ đi nếu không cần
    id: 'ks001', // Thật ra ID nội bộ nên khớp với key chính
    name: 'Chill Chill Premier Hotel (Old ID)',
    stars: 5,
    address: '123 Nguyen Hue St, District 1, Ho Chi Minh City, Vietnam',
    shortDescription: 'Experience unparalleled luxury and service in the heart of the city.',
    longDescription: `<p>Nestled in the vibrant heart of Ho Chi Minh City, Chill Chill Premier Hotel offers an oasis of tranquility and luxury.</p>`,
    mainImage: 'https://plus.unsplash.com/premium_photo-1675745329954-9639737ea7a9?q=80&w=1974&auto=format&fit=crop',
    amenities: ['Free WiFi', 'Rooftop Pool'],
    priceFrom: 3500000,
    overallRating: 4.8,
    reviewCount: 2150,
  }
};
// --- Kết thúc dữ liệu Mock ---

const fetchHotelDetails = async (hotelId) => {
  loading.value = true;
  error.value = null;
  hotel.value = null; // Reset hotel data
  try {
    console.log(`Fetching details for MOCK hotel ID: ${hotelId}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700)); // Giảm delay 1 chút

    // Dòng quan trọng: Lấy dữ liệu từ mock data sử dụng hotelId làm key
    const data = allHotelsMockData[hotelId];

    if (data) {
      hotel.value = data;
    } else {
      console.warn(`Hotel with ID "${hotelId}" not found in MOCK data.`);
      error.value = `Hotel not found (ID: ${hotelId}). Please check the ID or add mock data for it.`;
    }
  } catch (err) {
    console.error('Error in fetchHotelDetails (mock):', err);
    error.value = 'An error occurred while fetching mock hotel details.';
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};

const navigateToBooking = (hotelId, roomId) => {
  console.log(`Navigate to booking for Hotel ID: ${hotelId}, Room ID: ${roomId}`);
  alert(`Chức năng đặt phòng cho Hotel ID: ${hotelId}, Room ID: ${roomId} chưa được triển khai.`);
};

const goBack = () => {
  if (window.history.length > 1 && document.referrer.includes(window.location.host)) { // Check if previous page is on the same host
    router.back();
  } else {
    router.push({ name: 'Hotels' }); // Điều hướng về trang danh sách khách sạn nếu có (thay 'Hotels' bằng tên route của bạn)
  }
};

onMounted(() => {
  const hotelId = route.params.id;
  if (hotelId) {
    fetchHotelDetails(hotelId);
  } else {
    error.value = "Hotel ID is missing in the URL.";
    loading.value = false;
    console.error("Hotel ID is undefined in route params.");
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