<template>
  <button
    :class="[
      'btn btn-link btn-light py-0 px-2 d-inline-flex align-items-center text-decoration-none',
      { 'btn-block-size': block }
    ]"
    :style="{
      color:         textColor,
      fontSize,
      backgroundColor,
      borderRadius,
      textAlign,
      '--hover-color': colorHover
    }"
  >
    <i v-if="isMenu" class="bi bi-list fs-2 me-2"></i>
    <span class="fw-bold w-100">{{ content }}</span>
    <i v-if="isDropdown" class="bi bi-caret-down-fill ms-2"></i>
  </button>
</template>

<script setup>
defineProps({
  content:        { type: String,  required: true },
  isMenu:         { type: Boolean, default: false },
  isDropdown:     { type: Boolean, default: false },
  block:          { type: Boolean, default: false },

  textColor:      { type: String,  default: '#fff' },
  fontSize:       { type: String,  default: '16px' },
  colorHover:     { type: String,  default: 'black' },

  backgroundColor:{ type: String,  default: '' },
  borderRadius:   { type: String,  default: '6px' },
  textAlign:      { type: String,  default: 'left' }
})
</script>

<style scoped>
button {
  transition: transform 0.2s ease-in-out, color 0.2s;
}

/* Hover giữ nguyên */
button:hover {
  transform: scale(1.05);
  color: var(--hover-color) !important;
}

.btn-block-size {
  width: 100% !important;
  height: 100% !important;
}
</style>
