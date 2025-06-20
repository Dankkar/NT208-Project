<!-- src/components/PromotionCard.vue -->
<template>
  <div class="promo-card card h-100 border-0 shadow-sm">
    <img :src="promotion.ImageUrl || defaultImage" class="card-img-top" alt="promo" />
    <div class="card-body">
      <h5 class="card-title">{{ promotion.TenKM }}</h5>
      <p class="card-text text-truncate">{{ promotion.MoTaKM }}</p>
      <p class="mb-1">
        <small class="text-muted">
          {{ formatDate(promotion.NgayBatDau) }} – {{ formatDate(promotion.NgayKetThuc) }}
        </small>
      </p>
      <span class="badge bg-danger"> Code: {{ promotion.MaCodeKM }} </span>
      <br>
      <span class="badge bg-danger">{{ promotion.PhanTramGiam }}% OFF</span>
    </div>
  </div>
</template>

<script setup>
import { format } from 'date-fns';
import defaultImage from '../assets/deals.png';

const props = defineProps({
  promotion: {
    type: Object,
    required: true
  }
});

function formatDate(d) {
  return format(new Date(d), 'dd/MM/yyyy');
}
</script>

<style scoped>
.promo-card img {
  object-fit: contain;      /* Hiển thị toàn bộ ảnh */
  height: 280px;
}
.promo-card .card-body {
  padding: 1rem;
}
</style>
