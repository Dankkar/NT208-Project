<template>
  <div v-if="isActive && timeLeftFormatted" class="booking-timer-component alert alert-warning small py-2 px-3 mb-3 shadow-sm" role="alert">
    <div class="d-flex align-items-center">
      <i class="bi bi-alarm fs-5 me-2"></i>
      <div>
        <span class="fw-semibold">Time left to complete:</span>
        <strong class="ms-1 timer-countdown">{{ timeLeftFormatted }}</strong>
      </div>
    </div>
  </div>
  <!-- Không cần hiển thị thông báo hết hạn ở đây nữa, vì Step3_GuestInfo đã có rồi -->
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useBookingStore } from '@/store/bookingStore'; // Đảm bảo đường dẫn đúng

const bookingStore = useBookingStore();

const timeLeftMs = ref(0); // Lưu trữ thời gian còn lại bằng mili giây
const intervalId = ref(null);
const isActive = ref(false); // Timer có đang chạy và còn thời gian không

const calculateTimeLeft = () => {
  if (!bookingStore.heldBookingExpiresAt) {
    isActive.value = false;
    return 0;
  }
  const now = Date.now();
  const remaining = bookingStore.heldBookingExpiresAt - now;
  
  if (remaining > 0) {
    isActive.value = true;
    return remaining;
  } else {
    isActive.value = false; // Hết giờ
    // Store getter isTimerActive sẽ tự động thành false, Step3 sẽ phản ứng
    return 0;
  }
};

const timeLeftFormatted = computed(() => {
  if (!isActive.value || timeLeftMs.value <= 0) {
    // Không hiển thị gì nếu không active hoặc hết giờ
    // (Step3 sẽ hiển thị thông báo "expired")
    return null;
  }
  const totalSeconds = Math.floor(timeLeftMs.value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const stopTimer = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
  isActive.value = false; // Dừng active khi timer bị stop thủ công
};

const startOrUpdateTimer = () => {
  stopTimer(); // Dừng timer cũ (nếu có) trước khi bắt đầu timer mới hoặc cập nhật

  // Chỉ khởi động timer nếu đang ở Step 3 VÀ có thời gian hết hạn hợp lệ
  if (bookingStore.currentStep === 3 && bookingStore.heldBookingExpiresAt) {
    timeLeftMs.value = calculateTimeLeft(); // Tính toán thời gian còn lại

    if (isActive.value) { // Nếu vẫn còn thời gian (isActive được set bởi calculateTimeLeft)
      intervalId.value = setInterval(() => {
        timeLeftMs.value = calculateTimeLeft();
        if (!isActive.value) { // Nếu hết giờ trong lúc interval đang chạy
          stopTimer();
          console.warn("BookingTimer.vue: Hold timer expired from interval.");
          // Store getter `isTimerActive` sẽ tự động cập nhật,
          // Step3_GuestInfo sẽ dựa vào đó để disable nút và hiển thị thông báo
        }
      }, 1000);
    }
  } else {
    // Nếu không phải Step 3 hoặc không có thời gian hết hạn, đảm bảo timer không active
    isActive.value = false;
  }
};

onMounted(() => {
  console.log("BookingTimer.vue mounted. HeldExpiresAt:", bookingStore.heldBookingExpiresAt, "CurrentStep:", bookingStore.currentStep);
  startOrUpdateTimer();
});

onBeforeUnmount(() => {
  stopTimer();
});

// Theo dõi sự thay đổi của `heldBookingExpiresAt` (ví dụ khi có lượt giữ mới)
// hoặc `currentStep` (để dừng/khởi động timer khi chuyển step)
watch(
  () => [bookingStore.heldBookingExpiresAt, bookingStore.currentStep],
  (newValues, oldValues) => {
    console.log("BookingTimer.vue: Watched values changed. New heldBookingExpiresAt:", newValues[0], "New currentStep:", newValues[1]);
    startOrUpdateTimer();
  },
  { immediate: false } // Không cần chạy ngay khi watch, onMounted đã xử lý lần đầu
);

</script>

<style scoped>
.booking-timer-component {
  /* Vị trí bạn muốn hiển thị timer, ví dụ: */
  /* position: fixed;
  top: 80px;
  right: 20px; 
  z-index: 1050; */
  /* Hoặc để nó là block bình thường nếu đặt trong luồng của Step3 */
  border-radius: 0.375rem;
}
.timer-countdown {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1em;
}
</style>