<!-- src/components/Logo.vue -->
<template>
  <img
    :src="src"
    :alt="alt"
    class="logo-img"
    @mouseover="hover = true"
    @mouseleave="hover = false"
    :style="{
      filter: hover ? hoverFilter : 'none',
      width: width,
      height: height,
    }"
  />
</template>

<script setup>
import { ref } from 'vue'

// Props nhận vào đường dẫn, alt text, hover effect, size…
const props = defineProps({
  src:         { type: String, required: true },
  alt:         { type: String, default: 'Logo' },
  hoverFilter: { type: String, default: 'brightness(1.2)' },
  width:       { type: String, default: '40px' },
  height:      { type: String, default: 'auto' },
})

const hover = ref(false)
</script>

<style scoped>
.logo-img {
  cursor: pointer;
  transition: filter .2s ease-in-out;
}

@media (max-width: 1024px) {
  .logo-img {
    max-width: 50px; /* Logo nhỏ hơn trên màn hình tablet/mobile */
    margin-right: 470px;
  }
}

@media (max-width: 768px) {
  .logo-img {
    max-width: 30px; /* Logo nhỏ hơn trên màn hình tablet/mobile */
    margin-left: 500px;
  }
}
</style>
