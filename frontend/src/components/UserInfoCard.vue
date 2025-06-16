<!-- components/UserInfoCard.vue -->
<template>
  <div :class="['info-card mb-4', highlight ? 'highlight-success' : '']">
    <h5 class="fw-bold">{{ title }}</h5>

    <slot></slot>

    <Button
      content="Chỉnh sửa"
      textColor="#0d6efd"
      colorHover="#0a58ca"
      fontSize="14px"
      textAlign="center"
      @click="onEdit"
    />
  </div>
</template>

<script setup>
import Button from './Button.vue'
defineProps({
  title: String,
  onEdit: Function,
  highlight: Boolean
})
</script>

<style scoped>
.info-card {
  background: #fff;
  border-left: 5px solid #0d6efd;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: border-left-color 0.6s ease, box-shadow 0.6s ease;
}

.highlight-success {
  border-left-color: #28a745 !important;
  box-shadow: 0 0 12px rgba(40, 167, 69, 0.5); /* ánh sáng xanh */
  animation: pulseHighlight 0.6s ease;
}

@keyframes pulseHighlight {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.01);
    opacity: 0.95;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

</style>
