<!-- Button.vue -->
<template>
  <button
    :class="[
      'btn btn-link btn-light py-0 px-2 d-inline-flex align-items-center text-decoration-none',
      { 'w-100 h-100': block }       /* chỉ full‑width khi prop block = true */
    ]"
    :style="{
      color:        textColor,
      fontSize,                     /* cho phép tuỳ cỡ chữ */
      '--hover-color': colorHover   /* custom property dùng trong CSS hover */
    }"
  >
    <i v-if="isMenu"      class="bi bi-list fs-2 me-2"></i>
    <span class="fw-bold">{{ content }}</span>
    <i v-if="isDropdown"  class="bi bi-caret-down-fill ms-2"></i>
  </button>
</template>

<script setup>
defineProps({
  content:     { type: String,  required: true },
  isMenu:      { type: Boolean, default: false },
  isDropdown:  { type: Boolean, default: false },
  block:       { type: Boolean, default: false },   // bật full‑width nếu cần
  textColor:   { type: String,  default: '#fff' },
  fontSize:    { type: String,  default: '16px' },
  colorHover:  { type: String,  default: 'black' },
  
})
</script>

<style scoped>
button {
  transition: transform .2s ease-in-out, color .2s;
}

/* Hover effect */
button:hover {
  transform: scale(1.05);
  color: var(--hover-color) !important;
}
</style>
