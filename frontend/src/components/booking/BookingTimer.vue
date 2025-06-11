<template>
  <!-- Component hiển thị timer đếm ngược cho booking hold (15 phút) -->
  <div v-if="bookingStore.isTimerActive && displayTimeIfActive" 
       class="booking-timer-component alert alert-warning small py-2 px-3 mb-3 shadow-sm" 
       role="alert">
    <div class="d-flex align-items-center">
      <i class="bi bi-alarm fs-5 me-2"></i>
      <div>
        <span class="fw-semibold">Thời gian còn lại để hoàn tất:</span>
        <strong class="ms-1 timer-countdown">{{ displayTimeIfActive }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useBookingStore } from '@/store/bookingStore';

/**
 * Component BookingTimer
 * Chức năng: Hiển thị đếm ngược thời gian giữ chỗ booking (15 phút)
 * 
 * Logic hoạt động:
 * 1. Lấy thời gian hết hạn từ bookingStore.heldBookingExpiresAt
 * 2. Tính toán và hiển thị thời gian còn lại theo format MM:SS
 * 3. Khi hết thời gian, gọi store.handleTimerExpiration() để xử lý
 * 4. Đồng bộ với store state để đảm bảo tính nhất quán
 * 
 * Note: Component này chỉ hiển thị, logic chính vẫn ở trong store
 */

const bookingStore = useBookingStore();
const timeLeftMsInternal = ref(0); // Thời gian còn lại tính bằng milliseconds (chỉ để hiển thị)
let intervalId = null;             // ID của setInterval để clear khi cần

/**
 * Tính toán thời gian còn lại từ store state
 * @returns {number} Số milliseconds còn lại
 */
const calculateRemainingMsFromStore = () => {
  if (bookingStore.heldBookingExpiresAt) {
    return bookingStore.heldBookingExpiresAt - Date.now();
  }
  return 0;
};

/**
 * Computed hiển thị thời gian theo format MM:SS
 * Chỉ hiển thị khi timer active và còn thời gian > 100ms
 * @returns {string|null} Thời gian format "MM:SS" hoặc null để ẩn component
 */
const displayTimeIfActive = computed(() => {
  if (bookingStore.isTimerActive && timeLeftMsInternal.value > 100) { // > 100ms để tránh hiển thị 00:00
    const totalSeconds = Math.floor(timeLeftMsInternal.value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return null; // null sẽ làm component ẩn đi
});

/**
 * Dừng timer interval
 */
const stopInternalTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

/**
 * Hàm được gọi mỗi giây để cập nhật timer
 * Kiểm tra thời gian còn lại và xử lý khi hết hạn
 */
const tickInternal = () => {
  const remaining = calculateRemainingMsFromStore();
  timeLeftMsInternal.value = remaining;

  // Khi hết thời gian
  if (remaining <= 0) {
    stopInternalTimer(); // Dừng interval của component
    
    // Chỉ gọi store action nếu store timer vẫn active
    // (tránh gọi nhiều lần nếu store đã được update từ nguồn khác)
    if (bookingStore.isTimerActive) {
      // console.log("BookingTimer.vue: Phát hiện hết hạn. Gọi store.handleTimerExpiration().");
      bookingStore.handleTimerExpiration(); // Gọi action xử lý hết hạn
    }
  }
};

/**
 * Khởi động hoặc cập nhật timer
 * Nguồn chân lý là bookingStore.isTimerActive
 */
const startOrUpdateInternalTimer = () => {
  stopInternalTimer(); // Luôn dừng timer cũ trước

  // Chỉ start timer nếu store báo là active
  if (bookingStore.isTimerActive) {
    timeLeftMsInternal.value = calculateRemainingMsFromStore();
    if (timeLeftMsInternal.value > 0) {
      tickInternal(); // Cập nhật hiển thị ngay lần đầu
      intervalId = setInterval(tickInternal, 1000); // Update mỗi giây
    } else {
      // Nếu tính ra không còn thời gian, gọi tick để xử lý hết hạn
      tickInternal();
    }
  } else {
    timeLeftMsInternal.value = 0; // Đảm bảo là 0 nếu store nói timer không active
  }
};

// Lifecycle hooks
onMounted(() => {
  startOrUpdateInternalTimer();
});

onBeforeUnmount(() => {
  stopInternalTimer();
});

// Watch store state changes để đồng bộ

/**
 * Watch isTimerActive của store
 * Khi store timer state thay đổi (start/stop), component phải phản ứng
 */
watch(
  () => bookingStore.isTimerActive,
  (newStoreIsActive) => {
    if (newStoreIsActive) {
      startOrUpdateInternalTimer(); // Khởi động timer nếu store active
    } else {
      stopInternalTimer();          // Dừng timer nếu store không active
      timeLeftMsInternal.value = 0;
    }
  }
  // không cần immediate vì onMounted đã chạy
);

/**
 * Watch heldBookingExpiresAt để phản ứng khi có booking hold mới
 * (có thể từ việc user chọn phòng khác trong cùng session)
 */
watch(
    () => bookingStore.heldBookingExpiresAt,
    (newExpiry, oldExpiry) => {
        if (newExpiry !== oldExpiry) {
            startOrUpdateInternalTimer(); // Restart timer với thời gian hết hạn mới
        }
    }
);

</script>

<style scoped>
.booking-timer-component {
  border-radius: 0.375rem;
}

/* Font monospace cho timer để các số có width đồng đều */
.timer-countdown {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1em;
}
</style>