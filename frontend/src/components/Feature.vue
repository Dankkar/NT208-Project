// src/components/FeaturedProperties.vue
<template>
  <section class="featured py-5">
    <div class="container">
      <h2 class="mb-4 text-center text-md-start">Featured Properties</h2>
      <div v-if="properties && properties.length > 0" class="row">
        <div
          v-for="property in properties"
          :key="property.id"
          class="col-lg-4 col-md-6 mb-4"
        >
          <div class="card h-100 shadow-sm">
            <img
              :src="property.image || defaultImage"
              class="card-img-top featured-property-image"
              :alt="property.name"
              @error="handleImageError"
            />
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ property.name }}</h5>
              <p class="card-text text-muted small">
                <i class="bi bi-geo-alt-fill me-1"></i>{{ property.location }}
              </p>
              <p class="card-text fw-bold mt-auto mb-0">{{ property.price }}/night</p>
              <!-- Optional: Nút xem chi tiết hoặc đặt phòng -->
              <!--
              <router-link :to="`/property/${property.id}`" class="btn btn-primary btn-sm mt-2 align-self-start">
                View Details
              </router-link>
              -->
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-5">
        <p class="text-muted">No featured properties available at the moment.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { defineProps } from 'vue';

// Định nghĩa props mà component này sẽ nhận
const props = defineProps({
  properties: {
    type: Array,
    required: true,
    default: () => [] // Giá trị mặc định là một mảng rỗng
  }
});

// Một ảnh mặc định nếu ảnh từ API bị lỗi hoặc không có
const defaultImage = 'https://via.placeholder.com/400x250.png?text=No+Image';

// Xử lý lỗi khi tải ảnh
const handleImageError = (event) => {
  event.target.src = defaultImage;
};

// Nếu bạn muốn sử dụng Vue Router cho nút "View Details"
// import { useRouter } from 'vue-router';
// const router = useRouter();
</script>

<style scoped>
.featured-property-image {
  height: 250px; /* Đặt chiều cao cố định cho ảnh */
  object-fit: cover; /* Đảm bảo ảnh fill và crop đẹp mắt */
  width: 100%;
}

.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important; /* shadow-lg của Bootstrap */
}

.card-title {
  /* Có thể giới hạn số dòng nếu tên quá dài */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.5em; /* Đảm bảo chiều cao cho 2 dòng, tránh nhảy layout */
}

.card-body {
  /* d-flex flex-column được dùng để đẩy giá xuống dưới cùng nếu card-text không đủ dài */
}

/* Responsive cho cột
   col-lg-4: 3 cột trên màn hình lớn (large)
   col-md-6: 2 cột trên màn hình trung bình (medium)
   Mặc định Bootstrap sẽ là 1 cột trên màn hình nhỏ (small và extra-small)
*/
</style>