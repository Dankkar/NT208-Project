<template>
  <div class="image-block">
    <img :src="imageUrl" alt="Featured scenery">
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import mountainImage from '@/assets/mountain.jpg'; // Đảm bảo đường dẫn đến ảnh này đúng

// Mặc định dùng ảnh núi tuyết, nhưng có thể truyền qua prop nếu muốn linh hoạt
const props = defineProps({
  src: {
    type: String,
    default: mountainImage 
  }
});

const imageUrl = props.src;
</script>

<style scoped>
.image-block {
  width: 100%;
  height: 100%; /* Để nó lấp đầy không gian được giao */
  border-radius: 8px; /* Bo góc cho khớp với text block */
  overflow: hidden; /* Để ảnh bên trong không tràn ra ngoài khi bo góc */
}

.image-block img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Đảm bảo ảnh lấp đầy và không bị méo */
  display: block; /* Loại bỏ khoảng trống dưới ảnh */
}
</style>