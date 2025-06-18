<!-- src/components/PromotionsSection.vue -->
<template>
  <section class="promotions py-5 bg-light">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="section-title mb-0">Hot Promotions</h2>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-else-if="promotions.length > 0">
        <!-- Sử dụng component Carousel đã có -->
        <Carousel
          :items="promotions"
          :items-per-page="itemsPerPageForPromotions"
          :item-key="promotionItemKey"
        >
          <template #default="{ item: promotion }">
            <!-- PromotionCard sẽ được render bởi slot của Carousel -->
            <!-- Carousel sẽ tự tạo col, nên không cần div.col ở đây nữa -->
            <PromotionCard :promotion="promotion" class="h-100" />
          </template>
        </Carousel>
      </div>
      <div v-else class="text-center text-muted py-4">
        Chưa có khuyến mãi nào.
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import promotionService from '../services/hotelService';
import PromotionCard from './PromotionCard.vue';
import Carousel from './Carousel.vue';
import hotelService from '../services/hotelService';

const promotions = ref([]);
const loading = ref(true); // Đặt true ban đầu
const error = ref(null);
const itemsPerPageForPromotions = ref(3); // Ví dụ: hiển thị 3 promotions một lúc

// Hàm để Carousel biết cách lấy key cho mỗi promotion
// Đảm bảo MaKM là duy nhất cho mỗi promotion
const promotionItemKey = (promotion) => promotion.MaKM;

async function loadPromotions() {
   loading.value = true;
   error.value = null;
   try {
     const response = await hotelService.getActivePromotions();
     if (response.data && Array.isArray(response.data.data)) {
        promotions.value = response.data.data;
     } else if (response.data && Array.isArray(response.data)) {
        promotions.value = response.data;
     } else {
        console.warn("Unexpected response structure for promotions:", response);
        promotions.value = [];
     }

   } catch (err) {
     console.error("Error fetching promotions:", err);
     error.value = 'Không tải được khuyến mãi. Vui lòng thử lại sau.';
     promotions.value = [];
   } finally {
     loading.value = false;
   }
}

onMounted(() => {
  loadPromotions();
});

</script>

<style scoped>
.section-title {
  font-weight: 600;
  border-bottom: 2px solid #FF5A5F; /* Màu primary của bạn */
  padding-bottom: 0.25rem;
  display: inline-block;
}

.spinner-border.text-primary {
  color: #FF5A5F !important;
}

:deep(.carousel-item-wrapper .promo-card) { /* Giả sử slot bọc item trong .carousel-item-wrapper */
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.carousel-item-wrapper .promo-card .card-body) {
  flex-grow: 1;
}

</style>