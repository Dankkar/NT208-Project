<template>
  <div class="card mb-4 shadow-sm">
    <img :src="hotel.HinhAnh || '/default-hotel.jpg'" class="card-img-top" :alt="hotel.TenKS" />
    <div class="card-body">
      <h5 class="card-title">{{ hotel.TenKS }}</h5>
      <p class="card-text text-muted">{{ hotel.DiaChi }}</p>
      <div class="d-flex justify-content-between align-items-center">
        <p class="fw-bold mb-0">{{ formatPrice(hotel.GiaThapNhat) }}/night</p>
        <div class="rating">
          <span class="text-warning">★</span>
          {{ hotel.HangSao?.toFixed(1) || 'N/A' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ hotel: Object })
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>

<style scoped>
.card-img-top { height: 200px; object-fit: cover; }
.rating { font-size: 0.9rem; }
</style> 