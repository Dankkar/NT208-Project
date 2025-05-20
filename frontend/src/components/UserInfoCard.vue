<!-- components/UserInfoCard.vue -->
<template>
  <div class="info-card mb-4">
    <h5 class="fw-bold">{{ title }}</h5>

    <slot></slot>

    <Button
      content="Chỉnh sửa"
      textColor="#0d6efd"
      colorHover="#0a58ca"
      fontSize="14px"
      @click="onEdit"
    />
  </div>
</template>

<script setup>
import Button from './Button.vue'
defineProps({
  title: String,
  onEdit: Function
})
</script>

<style scoped>
.info-card {
  background: #fff;
  border-left: 5px solid #0d6efd;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>
