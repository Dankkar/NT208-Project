<!-- src/components/HeroSection.vue -->
<template>
  <section
    class="hero-section position-relative d-flex align-items-center"
    :style="heroStyles"
    :class="`text-${textAlign}`"
  >
    <div class="overlay" :style="overlayStyles"></div>
    <div class="container hero-content-container">
      <slot></slot>
    </div>
  </section>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  height: {
    type: String,
    default: '85vh', // Default height
  },
  overlayOpacity: {
    type: Number,
    default: 0.4, // Default overlay opacity
    validator: (value) => value >= 0 && value <= 1,
  },
  textAlign: {
    type: String,
    default: 'center', // 'center', 'left', 'right'
     validator: (value) => ['center', 'left', 'right'].includes(value),
  },
  textColor: {
    type: String,
    default: 'white', // Default text color
  }
});

const heroStyles = computed(() => ({
  height: props.height,
  backgroundImage: `url(${props.imageUrl})`,
  color: props.textColor, // Apply text color here
}));

const overlayStyles = computed(() => ({
  backgroundColor: `rgba(0, 0, 0, ${props.overlayOpacity})`,
}));
</script>

<style scoped>
.hero-section {
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  
}

.overlay {
  position: absolute;
  inset: 0; 
}

.hero-content-container {
  position: relative; 
  z-index: 1;
}
</style>