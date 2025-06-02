<!-- src/components/HotelCard.vue -->
<template>
  <!-- Sử dụng hotelSlug cho đường dẫn -->
  <router-link :to="`/hotels/${hotelSlug}`" class="hotel-card-link text-decoration-none">
    <div class="card hotel-card h-100 shadow-sm">
      <div class="img-wrapper">
        <img
          :src="hotelImage || 'https://via.placeholder.com/400x220.png?text=No+Image'"
          class="card-img-top"
          :alt="hotel.TenKS"
          @error="handleImageError"
        />
      </div>
      <div class="card-body d-flex flex-column">
        <h5 class="card-title mb-1">{{ hotel.TenKS }}</h5>
        <p class="location-text text-muted small mb-2">
          <i class="bi bi-geo-alt-fill me-1"></i>{{ hotel.DiaChi }}
        </p>

        <div class="mt-auto d-flex justify-content-between align-items-center">
          <div class="hotel-price">
            <strong class="text-danger">{{ formatCurrency(hotel.GiaThapNhat) }}</strong>
            <span class="text-muted small"> /đêm</span>
          </div>
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
import { defineProps, computed, ref } from 'vue';
import { generateSlug } from '../utils/generateSlug.js'; // Import hàm generateSlug

const props = defineProps({
  hotel: {
    type: Object,
    required: true,
  },
});

const imageError = ref(false);

//Uu tien MainImagePage tu APi sau do moi toi AnhKS (Legacy)

const hotelImage = computed(() => {
  if(imageError.value) {
    return 'https://via.placeholder.com/400x220.png?text=No+Image';
  }
  return props.hotel.MainImagePath || props.hotel.AnhKS || 'https://via.placeholder.com/400x220.png?text=No+Image';
})

const handleImageError = () => {
  imageError.value = true;
}

// Tạo computed property cho slug
const hotelSlug = computed(() => {
  // Đảm bảo hotel.TenKS và hotel.MaKS tồn tại
  if (props.hotel && props.hotel.TenKS && props.hotel.MaKS) {
    return generateSlug(props.hotel.TenKS, props.hotel.MaKS);
  }
  // Trả về ID nếu không có tên (phòng trường hợp)
  return props.hotel ? String(props.hotel.MaKS) : '';
});

const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value))) {
    return 'N/A';
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};
</script>

<style scoped>
/* CSS của bạn giữ nguyên */
/* ... */
.hotel-card-link {
  display: block;
  color: inherit;
}
.hotel-card-link:hover {
  text-decoration: none;
}

.hotel-card {
  background-color: var(--card-bg, #ffffff);
  border: none;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}
.hotel-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12) !important;
}

.hotel-card .img-wrapper {
  height: 220px;
  overflow: hidden;
}
.hotel-card .card-img-top {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.hotel-card:hover .card-img-top {
  transform: scale(1.05);
}

.hotel-card .card-body {
  padding: 1.25rem;
}

.hotel-card .card-title {
  font-weight: 600;
  color: var(--text-dark, #212529);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

.hotel-price {
  font-size: 1rem;
  font-weight: 500;
}
.hotel-price .text-danger{
    font-weight: 600;
}
.hotel-price .text-muted {
    font-size: 0.8rem;
}

@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");

:root {
  --primary-theme-color: #0077b6;
  --star-color: #ffc107;
  --card-bg: #ffffff;
  --text-dark: #212529;
}
</style>