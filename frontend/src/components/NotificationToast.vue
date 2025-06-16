<template>
  <transition name="toast-slide-fade">
    <div v-if="isVisible" :class="['toast-notification-custom', `toast-${toastType}`]" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-icon-wrapper">
        <!-- Icons SVG (ví dụ từ Heroicons hoặc Bootstrap Icons) -->
        <svg v-if="toastType === 'success'" xmlns="http://www.w3.org/2000/svg" class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-if="toastType === 'error'" xmlns="http://www.w3.org/2000/svg" class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-if="toastType === 'warning'" xmlns="http://www.w3.org/2000/svg" class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg v-if="toastType === 'info'" xmlns="http://www.w3.org/2000/svg" class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="toast-content">
        <!-- <strong v-if="toastTitle" class="toast-title">{{ toastTitle }}</strong> -->
        <div class="toast-message">{{ toastMessage }}</div>
      </div>
      <button v-if="showCloseButton" type="button" class="toast-close-btn" @click="hide" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z"/>
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  showCloseButton: {
    type: Boolean,
    default: true
  }
});

const isVisible = ref(false);
const toastMessage = ref('');
// const toastTitle = ref(''); // Tùy chọn nếu muốn có tiêu đề
const toastType = ref('info'); // 'success', 'error', 'warning', 'info'
let timeoutId = null;

// type: 'success', 'error', 'warning', 'info'
function show(message, type = 'info', duration, /* optional title */) {
  toastMessage.value = message;
  // toastTitle.value = title || '';
  toastType.value = type.toLowerCase();
  isVisible.value = true;

  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  const effectiveDuration = duration !== undefined 
    ? duration 
    : (type === 'error' ? 6000 : 4000); // Lỗi hiển thị lâu hơn


  if (effectiveDuration > 0) {
    timeoutId = setTimeout(() => {
      hide();
    }, effectiveDuration);
  }
}

function hide() {
  isVisible.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

defineExpose({
  show,
  hide
});
</script>

<style scoped>
.toast-notification-custom {
  position: fixed;
  bottom: 25px;
  right: 25px;
  min-width: 300px;
  max-width: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.1);
  display: flex;
  align-items: flex-start; /* Canh trên cho icon và text nếu text nhiều dòng */
  padding: 1rem; /* 16px */
  z-index: 2000; /* Cao hơn cả navbar fixed */
  border-left-width: 5px;
  border-left-style: solid;
}

.toast-icon-wrapper {
  margin-right: 0.875rem; /* 14px */
  flex-shrink: 0; /* Không co lại */
  padding-top: 0.125rem; /* Điều chỉnh vị trí icon nếu cần */
}

.toast-icon {
  width: 1.5rem; /* 24px */
  height: 1.5rem; /* 24px */
}

.toast-content {
  flex-grow: 1;
  font-size: 0.9375rem; /* 15px */
  line-height: 1.4;
  color: #4B5563; /* Gray-700 Tailwind */
}

.toast-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #1F2937; /* Gray-800 Tailwind */
}

.toast-message {
  word-break: break-word;
}

.toast-close-btn {
  margin-left: 1rem; /* 16px */
  padding: 0.25rem;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #9CA3AF; /* Gray-400 Tailwind */
  opacity: 0.7;
  flex-shrink: 0;
  margin-top: -0.125rem; /* Canh nút đóng cho đẹp hơn */
}
.toast-close-btn:hover {
  opacity: 1;
  color: #374151; /* Gray-700 Tailwind */
}
.toast-close-btn svg {
  width: 1rem; /* 16px */
  height: 1rem; /* 16px */
}

/* Type-specific styles */
.toast-success {
  border-left-color: #10B981; /* Green-500 Tailwind */
  background-color: #F0FDF4; /* Green-50 Tailwind */
}
.toast-success .toast-icon { color: #10B981; }
.toast-success .toast-title { color: #059669; /* Green-600 */}
.toast-success .toast-content { color: #047857; /* Green-700 */}

.toast-error {
  border-left-color: #EF4444; /* Red-500 Tailwind */
  background-color: #FEF2F2; /* Red-50 Tailwind */
}
.toast-error .toast-icon { color: #EF4444; }
.toast-error .toast-title { color: #DC2626; /* Red-600 */}
.toast-error .toast-content { color: #B91C1C; /* Red-700 */}

.toast-warning {
  border-left-color: #F59E0B; /* Amber-500 Tailwind */
  background-color: #FFFBEB; /* Amber-50 Tailwind */
}
.toast-warning .toast-icon { color: #F59E0B; }
.toast-warning .toast-title { color: #D97706; /* Amber-600 */}
.toast-warning .toast-content { color: #B45309; /* Amber-700 */}

.toast-info {
  border-left-color: #3B82F6; /* Blue-500 Tailwind */
  background-color: #EFF6FF; /* Blue-50 Tailwind */
}
.toast-info .toast-icon { color: #3B82F6; }
.toast-info .toast-title { color: #2563EB; /* Blue-600 */}
.toast-info .toast-content { color: #1D4ED8; /* Blue-700 */}


/* Animation */
.toast-slide-fade-enter-active,
.toast-slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Easing function vui vẻ hơn */
}
.toast-slide-fade-enter-from,
.toast-slide-fade-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}
.toast-slide-fade-enter-to,
.toast-slide-fade-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}
</style>