<!-- src/components/booking/steps/Step1_SearchForm.vue -->
<template>
  <div class="step1-search-form container py-4">
    <form @submit.prevent="handleSearch" class="needs-validation" novalidate>
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4 p-md-5">
              <div class="row g-4">
                <!-- Left Column: Date Picker -->
                <div class="col-md-7 col-lg-8">
                  <!-- <div class="d-flex justify-content-between align-items-center mb-2">
                    <label for="date-picker-input" class="form-label fw-medium text-dark mb-0">Dates</label>
                     <span v-if="ratesText" class="text-muted small">{{ ratesText }}</span>
                  </div> -->
                  <!-- Flatpickr component wrapper for custom styling if needed -->
                  <div class="flatpickr-wrapper">
                    <flat-pickr
                      id="date-picker-input"
                      v-model="selectedDates"
                      :config="flatpickrConfig"
                      class="form-control-plaintext p-0 d-block"
                      placeholder="Select Check-in & Check-out"
                      name="dateRange"
                      required
                    ></flat-pickr>
                  </div>
                  <div v-if="formSubmitted && errors.selectedDates" class="text-danger small mt-1">{{ errors.selectedDates }}</div>
                </div>

                <!-- Right Column: Number of Rooms & Guests -->
                <div class="col-md-5 col-lg-4">
                  <label class="form-label fw-medium text-dark mb-2">No. of Rooms & Guests</label>
                  <div class="guests-rooms-selection p-3 border rounded bg-light">
                    <div class="room-selector"> <!-- Assuming one room for now -->
                      <h6 class="small text-muted mb-2">Room 1</h6>
                      <div class="mb-3">
                        <label for="adults" class="form-label small text-secondary">Adults</label>
                        <div class="input-group input-group-sm">
                          <button class="btn btn-outline-secondary px-2" type="button" @click="decrement('adults')" :disabled="searchParams.adults <= 1">-</button>
                          <input type="text" class="form-control text-center fw-bold" id="adults" :value="searchParams.adults" readonly>
                          <button class="btn btn-outline-secondary px-2" type="button" @click="increment('adults')">+</button>
                        </div>
                        <div v-if="formSubmitted && errors.adults" class="text-danger small mt-1">{{ errors.adults }}</div>
                      </div>
                      <div>
                        <!-- <label for="children" class="form-label small text-secondary">Children</label>
                        <div class="input-group input-group-sm">
                          <button class="btn btn-outline-secondary px-2" type="button" @click="decrement('children')" :disabled="searchParams.children <= 0">-</button>
                          <input type="text" class="form-control text-center fw-bold" id="children" :value="searchParams.children" readonly>
                          <button class="btn btn-outline-secondary px-2" type="button" @click="increment('children')">+</button>
                        </div> -->
                        <!-- No error for children in this design usually -->
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Button - Full Width below columns -->
              <div class="text-center mt-4 pt-3 border-top">
                <button type="submit" class="btn btn-dark btn-lg text-uppercase px-5 py-2 fw-medium">
                  Check Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
// Nếu bạn muốn theme giống ảnh (màu nhạt, 2 tháng) thì có thể không cần theme đặc biệt
// import 'flatpickr/dist/themes/light.css'; // or material_blue, etc.

const emit = defineEmits(['search-submitted']);

const ratesText = ref(''); // "Rates shown in $" không rõ ràng trong ảnh này.

const selectedDates = ref([]);
const searchParams = reactive({
  adults: 1,
  children: 0,
});

const errors = reactive({ selectedDates: '', adults: '' });
const formSubmitted = ref(false);

const flatpickrConfig = reactive({
  // mode: 'range', // range mode sẽ chọn 2 ngày
  inline: true, 
  altInput: true,
  altFormat: "F j, Y",
  dateFormat: "Y-m-d",       // Hiển thị lịch trực tiếp trên trang
  minDate: 'today',
  monthSelectorType: 'static', // Để thanh điều hướng tháng tĩnh, không phải dropdown
  showMonths: 2,             // Hiển thị 2 tháng liền kề
  // enableTime: false,        // Không cần chọn giờ
  locale: { // Nếu cần tiếng Việt
    firstDayOfWeek: 1, // Thứ 2 là ngày đầu tuần
    weekdays: {
      shorthand: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
      longhand: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
    },
    months: {
      shorthand: ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"],
      longhand: ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"]
    }
  },
  //  Để có thể chọn 2 ngày riêng biệt Check-in và Check-out như trong các hệ thống lớn
  //  chúng ta cần 2 instance của flatpickr hoặc dùng `mode: 'range'` và tùy chỉnh UI cho 2 input
  //  Nếu dùng inline và chọn 1 khoảng thì cần mode: 'range'
  mode: 'range',
  onChange: function(selectedDatesArray) {
    // selectedDates.value = selectedDatesArray // v-model đã xử lý
    if (formSubmitted.value && selectedDatesArray.length === 2) {
       validateField('selectedDates');
    }
  }
});

function increment(type) {
  if (type === 'adults') searchParams.adults = Math.min(searchParams.adults + 1, 10);
  else if (type === 'children') searchParams.children = Math.min(searchParams.children + 1, 5);
  if (formSubmitted.value) validateField(type);
}

function decrement(type) {
  if (type === 'adults' && searchParams.adults > 1) searchParams.adults--;
  else if (type === 'children' && searchParams.children > 0) searchParams.children--;
  if (formSubmitted.value) validateField(type);
}

function validateField(field) {
  let isValid = true;
  if (field === 'selectedDates') {
    if (selectedDates.value.length !== 2 || !selectedDates.value[0] || !selectedDates.value[1]) {
      errors.selectedDates = 'Please select both check-in and check-out dates.';
      isValid = false;
    } else {
      errors.selectedDates = '';
    }
  }
  if (field === 'adults') {
    if (searchParams.adults < 1) {
      errors.adults = 'At least one adult is required.';
      isValid = false;
    } else {
      errors.adults = '';
    }
  }
  return isValid;
}

function validateForm() {
  let isValid = true;
  isValid = validateField('selectedDates') && isValid;
  isValid = validateField('adults') && isValid;
  return isValid;
}

function handleSearch() {
  formSubmitted.value = true;
  if (!validateForm()) {
    return;
  }
  const searchData = {
    checkInDate: selectedDates.value[0], // flatpickr mode:range trả về mảng 2 ngày
    checkOutDate: selectedDates.value[1],
    adults: searchParams.adults,
    children: searchParams.children,
  };
  emit('search-submitted', searchData);
}
</script>

<style> /* Không scoped để có thể style cho flatpickr */
/* Custom styles for Flatpickr to match the screenshot if needed */
.flatpickr-calendar {
  width: 100% !important; /* Làm cho lịch inline chiếm toàn bộ chiều rộng */
  height: 100% !important; 
  box-shadow: none !important;
  border: 1px solid #dee2e6; /* Viền nhẹ cho lịch */
  border-radius: 0.25rem;
}
.flatpickr-months .flatpickr-month {
  background: #f8f9fa; /* Nền cho header tháng */
  /* color: #333; */
}
.flatpickr-current-month .flatpickr-monthDropdown-months {
  font-size: 1rem;
  font-weight: 500;
}
.flatpickr-months .flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month {
  /* Tùy chỉnh icon mũi tên nếu cần */
  padding: 8px;
}
span.flatpickr-weekday {
  color: #6c757d;
  font-weight: 500;
}
.dayContainer {
    /* Tùy chỉnh kích thước của các ô ngày nếu cần */

}
.flatpickr-day {
  border-radius: 0.25rem; /* Bo tròn ô ngày */
  font-weight: 400;
}
.flatpickr-day.selected,
.flatpickr-day.startRange,
.flatpickr-day.endRange,
.flatpickr-day.selected.inRange,
.flatpickr-day.startRange.inRange,
.flatpickr-day.endRange.inRange,
.flatpickr-day.selected:focus,
.flatpickr-day.startRange:focus,
.flatpickr-day.endRange:focus,
.flatpickr-day.selected:hover,
.flatpickr-day.startRange:hover,
.flatpickr-day.endRange:hover,
.flatpickr-day.selected.prevMonthDay,
.flatpickr-day.startRange.prevMonthDay,
.flatpickr-day.endRange.prevMonthDay,
.flatpickr-day.selected.nextMonthDay,
.flatpickr-day.startRange.nextMonthDay,
.flatpickr-day.endRange.nextMonthDay {
  background: #000000; 
  border-color: #000000;
  color: #fff;
}
.flatpickr-day.inRange,
.flatpickr-day.prevMonthDay.inRange,
.flatpickr-day.nextMonthDay.inRange {
  background: #f0f0f0; 
  border-color: #f0f0f0;
  box-shadow: -5px 0 0 #f0f0f0, 5px 0 0 #f0f0f0; /* Tạo hiệu ứng liền mạch cho range */
}

.flatpickr-input.form-control-plaintext {
    /* Ẩn input gốc nếu lịch đã là inline */
    display: none !important;    
    
}
.flatpickr-wrapper {
    min-height: 300px; /* Đảm bảo có không gian cho lịch 2 tháng */
}
</style>
<style scoped> /* CSS scoped cho các phần tử khác của component */
.guests-rooms-selection .input-group .form-control {
  border-left: 0;
  border-right: 0;
  box-shadow: none;
}
.guests-rooms-selection .input-group .btn {
  border-color: #ced4da;
}
</style>