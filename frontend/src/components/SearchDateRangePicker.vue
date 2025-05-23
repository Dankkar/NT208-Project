<template>
  <div class="search-date-range-picker-display" role="button" aria-haspopup="true" aria-expanded="isCalendarOpen">
    <span class="search-icon">🗓️</span> <!-- Thay bằng SVG icon -->
    <span v-if="formattedDateRange" class="search-display-field">{{ formattedDateRange }}</span>
    <span v-else class="search-display-field placeholder-text">Ngày nhận - Ngày trả</span>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  checkIn: String, // YYYY-MM-DD
  checkOut: String, // YYYY-MM-DD
  // isCalendarOpen: Boolean, // Để xử lý aria
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00'); // Đảm bảo parse là ngày địa phương
  // Định dạng theo "Thg 5, 22 thg 5 2025" (Tiếng Việt)
  const day = date.toLocaleDateString('vi-VN', { weekday: 'short' });
  const dayOfMonth = date.getDate();
  const month = date.toLocaleDateString('vi-VN', { month: 'short' });
  const year = date.getFullYear();
  return `${day}, ${dayOfMonth} ${month} ${year}`;

  // Hoặc định dạng "22 thg 5 2025"
  // return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatRangeForInput = (dateString) => {
    if(!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    // DD thg M YYYY
    return `${date.getDate()} thg ${date.getMonth() + 1} ${date.getFullYear()}`;
}

const formattedDateRange = computed(() => {
  if (props.checkIn && props.checkOut) {
    return `${formatRangeForInput(props.checkIn)} - ${formatRangeForInput(props.checkOut)}`;
  } else if (props.checkIn) {
    return `${formatRangeForInput(props.checkIn)} - Ngày trả`;
  }
  return '';
});
</script>

<style scoped>
.search-date-range-picker-display {
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
.search-display-field.placeholder-text {
  color: #757575;
}
.search-icon { /* Lấy từ HomePage.vue */
    color: #0071c2;
    font-size: 1.3rem;
    margin-right: 10px;
}
</style>