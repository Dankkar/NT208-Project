<!-- src/components/booking/BookingProgressIndicator.vue -->
<template>
  <div class="booking-progress-indicator-wrapper py-4" style="background-color: #FFF0F5;"> <!-- Màu nền hồng nhạt từ ảnh -->
    <div class="container-fluid">
      <div class="d-flex justify-content-around align-items-center">
        <div
          v-for="step in steps"
          :key="step.id"
          class="progress-step text-center"
          :class="{
            'active-step': currentStep === step.id,
            'completed-step': currentStep > step.id,
            'clickable': isStepClickable(step.id)
          }"
          @click="navigateToStep(step.id)"
          role="button"
          tabindex="0"
        >
          <div class="step-number-wrapper mx-auto mb-1">
            <span>{{ step.id }}</span>
          </div>
          <div class="step-label small text-uppercase fw-medium">
            {{ step.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  maxCompletedStep: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['navigate-to-step']);

const steps = [
  { id: 1, label: 'Search' },
  { id: 2, label: 'Select Room' },
  { id: 3, label: 'Guest & Credit Card Information' },
  { id: 4, label: 'Confirmation' }
];

function isStepClickable(stepId) {
  return stepId <= props.currentStep || stepId <= props.maxCompletedStep;
}

function navigateToStep(stepId) {
  if (isStepClickable(stepId)) {
    emit('navigate-to-step', stepId);
  }
}
</script>

<style scoped>
.booking-progress-indicator-wrapper {
  /* background-color: #FEF0F5; Màu này từ component VueCard của bạn, có thể dùng nó */
  border-bottom: 1px solid #E8D6D9; /* Một màu viền nhẹ nhàng */
}

.progress-step {
  color: #6c757d; /* Màu text mặc định */
  cursor: default;
  padding: 0.5rem; /* Thêm chút padding */
}

.progress-step.clickable {
  cursor: pointer;
}
.progress-step.clickable:hover .step-label {
  color: #000; /* Hoặc một màu hover khác */
}
.progress-step.clickable:hover .step-number-wrapper {
   border-color: #000;
}


.step-number-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #FDF6F8; 
  border: 2px solid #E8D6D9; 
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #B0A0A4; 
  transition: all 0.2s ease-in-out;
}

.step-label {
  color: #A09094; 
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.progress-step.completed-step .step-number-wrapper {
  border-color: #D0B8BD;
  color: #807074;
}
.progress-step.completed-step .step-label {
   color: #706064;
}


.progress-step.active-step .step-number-wrapper {
  background-color: black;
  border-color: black;
  color: white;
}

.progress-step.active-step .step-label {
  color: black;
  font-weight: 600; 
}


.progress-step:not(.clickable):not(.active-step) {
  opacity: 0.7;
}

@media (max-width: 991.98px) {
  .step-label {
    /* Mặc định ẩn TẤT CẢ các label chữ */
    display: none;
  }

  /* CHỈ HIỂN THỊ LẠI label của bước đang active */
  .progress-step.active-step .step-label {
    display: block; /* Ghi đè luật `display: none` ở trên */
  }

  /* Điều chỉnh một chút cho đẹp hơn trên mobile */
  .step-number-wrapper {
     margin-bottom: 0 !important; /* Xóa khoảng trống dưới số khi chữ bị ẩn */
  }
  .progress-step.active-step .step-number-wrapper {
    margin-bottom: 4px !important; /* Thêm lại khoảng trống nhỏ khi chữ hiện ra */
  }
}
</style>
