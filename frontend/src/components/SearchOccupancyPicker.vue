<template>
  <div class="search-occupancy-picker-display" role="button" aria-haspopup="true">
    <span class="search-icon">👥</span> <!-- Thay bằng SVG icon -->
    <span class="search-display-field">{{ formattedOccupancy }}</span>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  adults: Number,
  children: Number,
  rooms: Number,
});

const formattedOccupancy = computed(() => {
  return `${props.adults} người lớn, ${props.children} Trẻ em, ${props.rooms} phòng`;
});
</script>

<style scoped>
.search-occupancy-picker-display {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}
.search-display-field {
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.search-icon { /* Lấy từ HomePage.vue */
    color: #0071c2;
    font-size: 1.3rem;
    margin-right: 10px;
}
</style>