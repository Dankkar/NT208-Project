<!-- src/components/HotelCard.vue -->
<!-- 
  HotelCard.vue - Component hiển thị card thông tin khách sạn
  Được sử dụng trong: danh sách khách sạn, kết quả tìm kiếm, hotel featured
  Features: hover effects, lazy image loading, price formatting, rating display
-->
<template>
  <!-- Link đến trang chi tiết khách sạn sử dụng slug thân thiện SEO -->
  <router-link :to="`/hotels/${hotelSlug}`" class="hotel-card-link text-decoration-none">
    <div class="card hotel-card h-100 shadow-sm">
      <!-- Container ảnh khách sạn với lazy loading và fallback -->
      <div class="img-wrapper">
        <img
          :src="hotelImage || 'https://via.placeholder.com/400x220.png?text=No+Image'"
          class="card-img-top"
          :alt="hotel.TenKS"
          @error="handleImageError"
        />
      </div>
      
      <!-- Nội dung thông tin khách sạn -->
      <div class="card-body d-flex flex-column">
        <!-- Tên khách sạn -->
        <h5 class="card-title mb-1">{{ hotel.TenKS }}</h5>
        
        <!-- Địa chỉ khách sạn với icon địa điểm -->
        <p class="location-text text-muted small mb-2">
          <i class="bi bi-geo-alt-fill me-1"></i>{{ hotel.DiaChi }}
        </p>

        <!-- Footer card: giá và rating -->
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <!-- Hiển thị giá thấp nhất -->
          <div class="hotel-price">
            <strong class="text-danger">{{ formatCurrency(hotel.GiaThapNhat) }}</strong>
            <span class="text-muted small"> /đêm</span>
          </div>
          
          <!-- Hiển thị rating nếu có -->
          <div v-if="hotel.HangSao" class="hotel-rating">
            <span class="rating-star me-1">⭐</span>
            <span class="rating-value fw-bold">{{ hotel.HangSao.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { defineProps, computed, ref } from 'vue'; // Vue 3 Composition API
import { generateSlug } from '../utils/generateSlug.js'; // Utility tạo slug cho SEO-friendly URLs

// Định nghĩa props nhận từ parent component
const props = defineProps({
  hotel: {
    type: Object,     // Object chứa thông tin khách sạn
    required: true,   // Bắt buộc phải có
  },
});

// State để track lỗi load ảnh
const imageError = ref(false);

/**
 * Computed property cho URL ảnh khách sạn
 * Ưu tiên: MainImagePath (mới) > AnhKS (legacy) > placeholder
 * Xử lý fallback khi có lỗi load ảnh
 */
const hotelImage = computed(() => {
  if(imageError.value) {
    return 'https://via.placeholder.com/400x220.png?text=No+Image';
  }
  return props.hotel.MainImagePath || props.hotel.AnhKS || 'https://via.placeholder.com/400x220.png?text=No+Image';
})

/**
 * Xử lý lỗi khi load ảnh thất bại
 * Set flag để hiển thị ảnh placeholder
 */
const handleImageError = () => {
  imageError.value = true;
}

/**
 * Computed property tạo slug SEO-friendly cho URL
 * Format: ten-khach-san-ma-ks
 * Fallback về MaKS nếu không có tên
 */
const hotelSlug = computed(() => {
  // Kiểm tra tồn tại của các trường cần thiết
  if (props.hotel && props.hotel.TenKS && props.hotel.MaKS) {
    return generateSlug(props.hotel.TenKS, props.hotel.MaKS);
  }
  // Fallback về string của MaKS nếu không có tên
  return props.hotel ? String(props.hotel.MaKS) : '';
});

/**
 * Format số tiền theo định dạng tiền tệ Việt Nam
 * @param {number} value - Giá trị cần format
 * @returns {string} Chuỗi tiền tệ đã format hoặc 'N/A'
 */
const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value))) {
    return 'N/A';
  }
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND', 
    minimumFractionDigits: 0 
  }).format(value);
};
</script>

<style scoped>
/* CSS tùy chỉnh cho HotelCard component */

/* Link wrapper - loại bỏ underline mặc định */
.hotel-card-link {
  display: block;
  color: inherit;
}
.hotel-card-link:hover {
  text-decoration: none;
}

/* Card container chính với hover effects */
.hotel-card {
  background-color: var(--card-bg, #ffffff);
  border: none;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}
.hotel-card:hover {
  transform: translateY(-8px);     /* Hiệu ứng nâng lên khi hover */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12) !important;
}

/* Image container với fixed height */
.hotel-card .img-wrapper {
  height: 220px;
  overflow: hidden;
}
.hotel-card .card-img-top {
  width: 100%;
  height: 100%;
  object-fit: cover;    /* Giữ tỷ lệ ảnh, crop nếu cần */
  transition: transform 0.4s ease;
}
.hotel-card:hover .card-img-top {
  transform: scale(1.05); /* Hiệu ứng zoom ảnh khi hover */
}

/* Card body styling */
.hotel-card .card-body {
  padding: 1.25rem;
}

/* Hotel title với text truncation */
.hotel-card .card-title {
  font-weight: 600;
  color: var(--text-dark, #212529);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  white-space: nowrap;     /* Không wrap text */
  overflow: hidden;
  text-overflow: ellipsis; /* Hiển thị ... khi text quá dài */
}

/* Location text với icon */
.hotel-card .location-text {
  color: #6c757d;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hotel-card .location-text .bi {
  vertical-align: middle;
}

/* Rating display */
.hotel-rating {
  display: flex;
  align-items: center;
  color: #495057;
  font-size: 0.9rem;
}
.hotel-rating .rating-value {
  color: var(--text-dark, #212529);
  font-size: 1rem;
}
.hotel-rating .rating-star {
  color: var(--star-color, #ffc107);
  font-size: 1rem;
  line-height: 1;
}

/* Price display */
.hotel-price {
  font-size: 1rem;
  font-weight: 500;
}
.hotel-price .text-danger{
    font-weight: 600;     /* Nhấn mạnh giá */
}
.hotel-price .text-muted {
    font-size: 0.8rem;    /* Text "/đêm" nhỏ hơn */
}

/* Import Bootstrap Icons */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");

/* CSS Variables cho theming */
:root {
  --primary-theme-color: #0077b6;
  --star-color: #ffc107;
  --card-bg: #ffffff;
  --text-dark: #212529;
}
</style>