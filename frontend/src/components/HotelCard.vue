<!-- src/components/HotelCard.vue -->
<template>
  <!-- Bọc toàn bộ card bằng router-link -->
  <router-link :to="`/hotels/${hotel.MaKS}`" class="hotel-card-link text-decoration-none">
    <div class="card hotel-card h-100 shadow-sm">
      <div class="img-wrapper">
        <img
          :src="hotel.AnhKS || 'https://via.placeholder.com/400x220.png?text=No+Image'"
          class="card-img-top"
          :alt="hotel.TenKS"
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
        <!-- Bạn có thể bỏ nút này nếu click cả card đã điều hướng -->
        <!--
        <router-link :to="`/hotel/${hotel.MaKS}`" class="btn btn-sm btn-primary-theme mt-3 view-details-btn">
          View Details
        </router-link>
        -->
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  hotel: {
    type: Object,
    required: true,
  },
});

const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value))) {
    return 'N/A'; // Hoặc 'Liên hệ' nếu giá không xác định
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};
</script>

<style scoped>
/* Thêm style này để loại bỏ gạch chân của link và đảm bảo card chiếm toàn bộ link */
.hotel-card-link {
  display: block; /* Quan trọng để router-link hoạt động như một block */
  color: inherit; /* Kế thừa màu chữ để không bị xanh mặc định của link */
}
.hotel-card-link:hover {
  text-decoration: none; /* Bỏ gạch chân khi hover */
}

/* Giữ nguyên hoặc điều chỉnh các style khác của HotelCard từ file Ratings.vue hoặc style riêng của nó */
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
  /* Ngăn chặn chữ quá dài bằng ellipsis */
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
  vertical-align: middle; /* Căn icon cho đẹp hơn */
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
  /* color: var(--primary-theme-color, #0077b6); */
  font-size: 1rem;
  font-weight: 500;
}
.hotel-price .text-danger{
    font-weight: 600;
}
.hotel-price .text-muted {
    font-size: 0.8rem;
}

/* CSS cho nút View Details (nếu bạn quyết định giữ lại) */
.btn-primary-theme {
  background-color: var(--primary-theme-color, #0077b6);
  border-color: var(--primary-theme-color, #0077b6);
  color: white; /* Thường nút primary có chữ trắng */
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.btn-primary-theme:hover {
  background-color: #005f8e;
  border-color: #005f8e;
}
.view-details-btn {
    min-width: 110px;
}

/* Bootstrap Icons (ví dụ, nếu bạn dùng CDN thì không cần thêm) */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");

/* Biến màu (nếu chưa có trong file global) */
:root {
  --primary-theme-color: #0077b6;
  --star-color: #ffc107;
  --card-bg: #ffffff;
  --text-dark: #212529;
}

</style>