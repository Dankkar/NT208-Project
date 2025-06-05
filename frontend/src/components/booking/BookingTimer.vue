<template>
  <div v-if="bookingStore.isTimerActive && displayTimeIfActive" class="booking-timer-component alert alert-warning small py-2 px-3 mb-3 shadow-sm" role="alert">
    <div class="d-flex align-items-center">
      <i class="bi bi-alarm fs-5 me-2"></i>
      <div>
        <span class="fw-semibold">Time left to complete:</span>
        <strong class="ms-1 timer-countdown">{{ displayTimeIfActive }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useBookingStore } from '@/store/bookingStore';

const bookingStore = useBookingStore();
const timeLeftMsInternal = ref(0); // Chỉ dùng để tính toán hiển thị, không phải nguồn chân lý cho active
let intervalId = null;

// Tính toán thời gian còn lại từ store state
const calculateRemainingMsFromStore = () => {
  if (bookingStore.heldBookingExpiresAt) {
    return bookingStore.heldBookingExpiresAt - Date.now();
  }
  return 0;
};

// Hiển thị thời gian nếu timer của store đang active và còn thời gian
const displayTimeIfActive = computed(() => {
  if (bookingStore.isTimerActive && timeLeftMsInternal.value > 100) { // timeLeftMsInternal > 100 để tránh 00:00
    const totalSeconds = Math.floor(timeLeftMsInternal.value / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return null; // Sẽ làm component này ẩn đi nếu không có gì để hiển thị
});

const stopInternalTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const tickInternal = () => {
  const remaining = calculateRemainingMsFromStore();
  timeLeftMsInternal.value = remaining;

  if (remaining <= 0) {
    stopInternalTimer(); // Dừng interval của component này
    // Chỉ gọi action của store nếu isTimerActive của store VẪN còn true
    // (để tránh gọi nhiều lần nếu state store đã được cập nhật từ nguồn khác)
    if (bookingStore.isTimerActive) {
      // console.log("BookingTimer.vue: Tick detected expiry. Calling store.handleTimerExpiration().");
      bookingStore.handleTimerExpiration(); // Gọi action của store
    }
  }
};

const startOrUpdateInternalTimer = () => {
  stopInternalTimer(); // Luôn dừng timer cũ trước

  // Nguồn chân lý là bookingStore.isTimerActive
  if (bookingStore.isTimerActive) {
    timeLeftMsInternal.value = calculateRemainingMsFromStore();
    if (timeLeftMsInternal.value > 0) {
      tickInternal(); // Cập nhật hiển thị ngay lần đầu
      intervalId = setInterval(tickInternal, 1000);
    } else {
      // Nếu tính ra không còn thời gian, gọi tick để nó xử lý việc gọi store.handleTimerExpiration
      tickInternal();
    }
  } else {
    timeLeftMsInternal.value = 0; // Đảm bảo là 0 nếu store nói timer không active
  }
};

onMounted(() => {
  startOrUpdateInternalTimer();
});

onBeforeUnmount(() => {
  stopInternalTimer();
});

// Watch isTimerActive của store là chính
// Nếu isTimerActive của store thay đổi (ví dụ, từ 1 lượt giữ mới, hoặc từ việc hết hạn đã được xử lý)
// thì timer này phải phản ứng.
watch(
  () => bookingStore.isTimerActive,
  (newStoreIsActive) => {
    if (newStoreIsActive) {
      startOrUpdateInternalTimer(); // Thử khởi động lại
    } else {
      stopInternalTimer();        // Dừng nếu store nói không active
      timeLeftMsInternal.value = 0;
    }
  }
  // không cần immediate vì onMounted đã chạy
);

watch(
    () => bookingStore.heldBookingExpiresAt,
    (newExpiry, oldExpiry) => {
        if (newExpiry !== oldExpiry) {
            startOrUpdateInternalTimer();
        }
    }
);

</script>

<style scoped>
.booking-timer-component {
  border-radius: 0.375rem;
}
.timer-countdown {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1em;
}
</style>