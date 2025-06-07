<!-- src/pages/HotelDetails.vue -->
<template>
     <div>
      <Navbar
        :bgFixed="true"
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

          <!-- Section 5: Đánh giá -->
           <section class="hotel-actual-reviews mb-5">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="section-title mb-0">Guest Reviews & Ratings</h2>
                <!-- === THÊM ĐIỀU KHIỂN SẮP XẾP === -->
                <div v-if="reviews && reviews.length > 1" class="review-sort-controls d-flex align-items-center">
                  <label for="sortCriteriaSelect" class="form-label me-2 mb-0 small">Sort by:</label>
                    <select id="sortCriteriaSelect" class="form-select form-select-sm me-2" style="width: auto;" v-model="sortCriteria">
                      <option value="NgayDG">Date</option>
                      <option value="Sao">Rating</option>
                    </select>
                    <select id="sortOrderSelect" class="form-select form-select-sm" style="width: auto;" v-model="sortOrder">
                      <option v-if="sortCriteria === 'NgayDG'" value="desc">Newest First</option>
                      <option v-if="sortCriteria === 'NgayDG'" value="asc">Oldest First</option>
                      <option v-if="sortCriteria === 'Sao'" value="desc">Highest First</option>
                      <option v-if="sortCriteria === 'Sao'" value="asc">Lowest First</option>
                    </select>
                </div>
                <!-- === KẾT THÚC ĐIỀU KHIỂN SẮP XẾP === -->
              </div>
              <div v-if="loadingReviews" class="loading-reviews py-3 text-center">
                <!-- ... loading spinner ... -->
              </div>
              <div v-else-if="reviewsError" class="error-reviews py-3 text-center alert alert-warning">{{ reviewsError }}</div>
              <!-- SỬ DỤNG `sortedAndDisplayedReviews` Ở ĐÂY -->
              <div v-else-if="sortedAndDisplayedReviews.length > 0">
                <div v-for="review in sortedAndDisplayedReviews" :key="review.MaDG" class="card review-card mb-3 shadow-sm">
                  <div class="card-body">
                    <!-- ... nội dung card review như cũ (TenNguoiDung, Sao, NoiDung, NgayDG) ... -->
                      <div class="d-flex justify-content-between align-items-center mb-2">
                          <h6 class="card-title review-user mb-0">
                              <i class="bi bi-person-circle me-1"></i>{{ review.TenNguoiDung || 'Anonymous' }}
                              <span v-if="review.LoaiUser === 'QuanLyKS'" class="badge bg-info ms-2">Hotel Staff</span>
                          </h6>
                          <div class="star-rating review-stars">
                              <span v-for="s_review in 5" :key="`review-${review.MaDG}-star-${s_review}`" class="star" :class="{ 'filled': s_review <= review.Sao }">★</span>
                          </div>
                      </div>
                      <p class="card-text review-text">{{ review.NoiDung }}</p>
                      <small class="text-muted review-date">{{ formatDate(review.NgayDG) }}</small>
                  </div>
                </div>
                <!-- Nút "Show All" vẫn sử dụng `reviews.length` để biết tổng số -->
                <div v-if="reviews.length > 3 && !showAllReviews" class="text-center mt-3">
                    <button @click="showAllReviews = true" class="btn btn-outline-primary btn-sm">Show All {{ reviews.length }} Reviews</button>
                </div>
              </div>
              <div v-else class="text-muted text-center py-3">
                <!-- ... "No reviews yet" ... -->
              </div>
            </section>

          <!-- Section 6: Bản đồ  -->
            <section class="hotel-location-map mb-5">
            <h2 class="section-title">Location</h2>

            <!-- Vùng chứa bản đồ -->
            <div v-if="hotel && hotel.Latitude && hotel.Longitude && !mapError" style="height: 400px; width: 100%;">
              <div ref="mapCanvas" style="height: 100%; width: 100%; border-radius: 8px; background-color: #e9ecef;">
                <!-- Bản đồ sẽ được render vào đây bởi JavaScript -->
                <div v-if="!mapInstance && mapsApiKey" class="text-center pt-5 text-muted">
                  <div class="spinner-border spinner-border-sm" role="status"></div>
                   Loading map...
                </div>
              </div>
            </div>

            <!-- Thông báo lỗi hoặc Placeholder -->
            <div v-else class="map-placeholder border rounded p-3 text-center text-muted" style="height: 350px; background-color: #f8f9fa;">
              <div v-if="mapError" class="alert alert-warning py-4">
                <i class="bi bi-exclamation-triangle-fill fs-3 mb-2"></i>
                <p class="mb-0">{{ mapError }}</p>
              </div>
              <div v-else-if="hotel && hotel.DiaChi">
                <p class="mt-5">Map of {{ hotel.DiaChi }}.</p>
                 <p class="text-muted small" v-if="loading">Checking map availability...</p> <!-- Sử dụng loading chung -->
                 <p class="text-muted small" v-else-if="!hotel.Latitude || !hotel.Longitude">(Location coordinates not available)</p>
                <i class="bi bi-geo-alt-slash-fill display-1 text-secondary mt-3"></i>
              </div>
               <div v-else-if="loading && !hotel"> <!-- Chỉ hiển thị khi đang tải hotel ban đầu -->
                 <div class="spinner-border text-secondary mt-5" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading location...</span>
                  </div>
                  <p class="mt-3">Loading location data...</p>
               </div>
              <div v-else>
                  <p class="mt-5">Map information cannot be displayed at this moment.</p>
                  <i class="bi bi-exclamation-circle-fill display-1 text-secondary mt-3"></i>
              </div>
            </div>
          </section>


          <div class="text-center my-4">
            <button @click="goBackToHotelPage" class="btn btn-secondary">
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
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Navbar from '../components/NavBar.vue';
import { useBookingStore } from '@/store/bookingStore';
import defaultPlaceholderImage from '@/assets/mountain.jpg'; // Một ảnh placeholder chung

const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();

const hotel = ref(null);
const loading = ref(true);
const error = ref(null);
const canBookOverall = ref(false); // Biến này có thể không cần thiết nếu luôn có nút ở mỗi roomType

const loadingReviews = ref(false);
const reviews = ref([]);
const reviewsError = ref(null);
const showAllReviews = ref(false);
const sortCriteria = ref('NgayDG'); // Mặc định sắp xếp theo ngày đánh giá
const sortOrder = ref('desc');    // Mặc định mới nhất trước (descending)

// === THÊM CÁC REF VÀ BIẾN CỜ CHO BẢN ĐỒ ===
const mapInstance = ref(null);
const mapsApiKey = ref(null);
const mapError = ref(null);
const mapCanvas = ref(null);
let hasGoogleMapsScriptBeenAdded = false;

// === HÀM TẢI SCRIPT GOOGLE MAPS ===
const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      console.log("Map script already loaded.");
      resolve();
      return;
    }
    if (hasGoogleMapsScriptBeenAdded) {
      console.log("Map script add attempted, waiting for window.google.maps...");
      let attempts = 0;
      const intervalId = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(intervalId);
          console.log("window.google.maps is now available.");
          resolve();
        } else if (attempts++ > 20) { // Chờ tối đa 10 giây
          clearInterval(intervalId);
          const msg = "Timeout waiting for Google Maps API after script add.";
          console.error(msg);
          mapError.value = msg;
          reject(new Error(msg));
        }
      }, 500);
      return;
    }

    console.log("Attempting to load Google Maps script with key:", apiKey ? '********' : 'NO KEY');
    if (!apiKey) {
        const msg = "Cannot load Google Maps: API Key is missing.";
        console.error(msg);
        mapError.value = msg;
        reject(new Error(msg));
        return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google Maps script has loaded via onload.");
      hasGoogleMapsScriptBeenAdded = true;
      // Đôi khi onload kích hoạt nhưng window.google.maps chưa có ngay, thêm một chút trễ hoặc kiểm tra lại
      setTimeout(() => {
          if (window.google && window.google.maps) {
            resolve();
          } else {
             // Thử chờ thêm 1 lần nữa
            let innerAttempts = 0;
            const innerInterval = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(innerInterval);
                    resolve();
                } else if (innerAttempts++ > 5) {
                    clearInterval(innerInterval);
                    const msg = "Google Maps script loaded (onload) but window.google.maps not available after delay.";
                    console.error(msg);
                    mapError.value = msg;
                    reject(new Error(msg));
                }
            }, 200);
          }
      }, 100); // Trễ 100ms
    };
    script.onerror = (e) => {
      const msg = "Error loading Google Maps script. Check API Key, restrictions, or network.";
      console.error(msg, e);
      mapError.value = msg;
      hasGoogleMapsScriptBeenAdded = true; // Vẫn set để không thử add lại
      reject(e);
    };
    document.head.appendChild(script);
    hasGoogleMapsScriptBeenAdded = true; // Set ngay sau khi append để tránh add nhiều lần
  });
};

// === HÀM KHỞI TẠO BẢN ĐỒ GOOGLE === 
const initializeMap = async () => {
  if (!hotel.value || !hotel.value.Latitude || !hotel.value.Longitude) {
    mapError.value = "Hotel location data (coordinates) is not available to display map.";
    return;
  }
  if (!window.google || !window.google.maps || typeof window.google.maps.Map !== 'function') {
    mapError.value = "Google Maps API not ready. Please refresh later.";
    return;
  }
mapError.value = null;
  const el = mapCanvas.value;
  if (!el) {
    mapError.value = "Map display area could not be prepared. Please refresh.";
    return;
  }
  const hotelLocation = {
    lat: parseFloat(hotel.value.Latitude),
    lng: parseFloat(hotel.value.Longitude)
  };
  if (mapInstance.value) {
    mapInstance.value.setCenter(hotelLocation);
  } else {
    mapInstance.value = new window.google.maps.Map(el, {
      center: hotelLocation,
      zoom: 16,
    });
  }
  new window.google.maps.Marker({
    position: hotelLocation,
    map: mapInstance.value,
    title: hotel.value.TenKS,
  });
};

// === HÀM LẤY API KEY VÀ BẮT ĐẦU QUÁ TRÌNH MAP ===
const setupMapProcess = async () => {
    // Bước 1: Lấy API Key nếu chưa có
    if (!mapsApiKey.value) {
        console.log("Fetching Google Maps API Key from backend...");
        try {
            const response = await axios.get('/api/maps/client-maps-api-key'); // API endpoint của bạn
            if (response.data && response.data.success && response.data.apiKey) {
                mapsApiKey.value = response.data.apiKey;
                console.log("Google Maps API Key received.");
            } else {
                mapError.value = "Could not retrieve map configuration (API key).";
                console.error("Failed to fetch or invalid Maps API Key:", response.data);
                return; // Không thể tiếp tục nếu không có key
            }
        } catch (error) {
            console.error("Error fetching Maps API Key:", error);
            mapError.value = "Error configuring map. Please try again later.";
            return; // Không thể tiếp tục
        }
    }

    // Bước 2: Tải Google Maps Script nếu chưa được tải
    if (!(window.google && window.google.maps)) {
        try {
            await loadGoogleMapsScript(mapsApiKey.value);
        } catch (scriptError) {
            // Lỗi đã được set trong loadGoogleMapsScript
            return; // Không thể tiếp tục nếu script không load được
        }
    }

    // Bước 3: Khởi tạo bản đồ (nếu có hotel data và script đã load)
    if (hotel.value && hotel.value.Latitude && hotel.value.Longitude && window.google && window.google.maps) {
        await initializeMap();
    } else if (hotel.value && (!hotel.value.Latitude || !hotel.value.Longitude)){
        mapError.value = "Location coordinates for this hotel are missing.";
    }
};


const fetchHotelDetails = async (hotelId) => {
  loading.value = true;
  error.value = null;
  hotel.value = null;
  mapInstance.value = null; 
  mapError.value = null;
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
      canBookOverall.value = hotel.value.roomTypes && hotel.value.roomTypes.length > 0;
       if (hotel.value && hotel.value.MaKS) {
        await fetchHotelReviews(hotel.value.MaKS);
      } else {
      error.value = response.data.message || `Hotel with ID ${hotelId} not found or error fetching data.`;
    }
  }} catch (err) {
    console.error('Error fetching hotel details from API:', err);
    error.value = err.response?.data?.message || err.message || 'An error occurred.';
  } finally {
    loading.value = false;
  }
};

const fetchHotelReviews = async (hotelId) => {
  loadingReviews.value = true;
  reviewsError.value = null;
  reviews.value = [];
  try {
    console.log(`Fetching reviews for hotel ID: ${hotelId}`);
    // Sử dụng route API bạn đã định nghĩa: GET /reviews/hotel/:MaKS
    const response = await axios.get(`/api/reviews/hotel/${hotelId}`);
    if (response.data && response.data.success) {
      // Chỉ lấy các review đã được approve để hiển thị (IsApproved = true hoặc 1)
      reviews.value = response.data.data.filter(review => review.IsApproved === true || review.IsApproved === 1);
      console.log("Fetched and filtered reviews:", reviews.value);
    } else {
      reviewsError.value = response.data.message || `Could not fetch reviews for hotel ID ${hotelId}.`;
    }
  } catch (err) {
    console.error('Error fetching hotel reviews:', err);
    reviewsError.value = err.response?.data?.message || err.message || 'An error occurred while fetching reviews.';
  } finally {
    loadingReviews.value = false;
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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' };
  try {
    return new Date(dateString).toLocaleString('vi-VN', options);
  } catch (e) { return 'Invalid Date';}
};

const goBackToHotelPage = () => {
    router.push({ name: 'Hotels' });
};
const goBackToHome = () => {
    router.push({ name: 'HomePage' });
}

const sortedAndDisplayedReviews = computed(() => {
  if (!reviews.value || reviews.value.length === 0) {
    return [];
  }

  let tempReviews = [...reviews.value]; // Tạo bản sao để không thay đổi mảng gốc reviews.value

  // Sắp xếp dựa trên sortCriteria và sortOrder
  tempReviews.sort((a, b) => {
    let valA, valB;

    if (sortCriteria.value === 'Sao') {
      valA = a.Sao;
      valB = b.Sao;
    } else { // Mặc định hoặc 'NgayDG'
      valA = new Date(a.NgayDG).getTime(); // Chuyển date string sang number để so sánh
      valB = new Date(b.NgayDG).getTime();
    }

    if (sortOrder.value === 'asc') { // Ascending
      return valA > valB ? 1 : (valA < valB ? -1 : 0);
    } else { // Descending (mặc định)
      return valA < valB ? 1 : (valA > valB ? -1 : 0);
    }
  });

  // Hiển thị tất cả hoặc chỉ một phần
  return showAllReviews.value ? tempReviews : tempReviews.slice(0, 3);
});

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

watch(
  () => hotel.value,
  async (newHotel, oldHotel) => {
    // Khi newHotel có dữ liệu và đã có Latitude + Longitude
    if (
      newHotel &&
      newHotel.MaKS &&
      newHotel.Latitude &&
      newHotel.Longitude &&
      !mapInstance.value   // chưa có mapInstance thì mới khởi tạo
    ) {
      console.log("Hotel data thay đổi và có tọa độ, bắt đầu setup map.");
      await setupMapProcess();
    } else if (
      newHotel &&
      (!newHotel.Latitude || !newHotel.Longitude)
    ) {
      mapError.value = "Location coordinates for this hotel are missing.";
      // Xóa bản đồ cũ (nếu có) hoặc hiển thị placeholder
      if (mapInstance.value) {
        const mapCanvas = document.getElementById('mapCanvas');
        if (mapCanvas) {
          mapCanvas.innerHTML = '<p class="text-muted pt-5">Map not available due to missing coordinates.</p>';
        }
        mapInstance.value = null;
      }
    }
  },
  { deep: true }
);
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
.review-card {
  border: 1px solid #e9ecef;
}
.review-user {
  font-weight: 600;
  color: #495057;
}
.review-stars .star {
  font-size: 0.9rem; /* Sao trong review nhỏ hơn chút */
  color: #ccc;
}
.review-stars .star.filled {
  color: #ffc107;
}
.review-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #212529;
  white-space: pre-wrap; /* Giữ lại các xuống dòng trong nội dung review */
}
.review-date {
  font-size: 0.8rem;
}
</style>