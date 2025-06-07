<!-- src/components/booking/steps/Step1_SearchForm.vue -->
<template>
  <div class="step1-search-form container-fluid py-4">
    <form @submit.prevent="handleLocalSearchSubmit" class="needs-validation" novalidate>
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10">
          <div class="card shadow-sm border">
            <div class="card-body">
              <div class="row">
                <div class="col-md-7 border-end mb-4 mb-md-0">
                  <div class="mb-3">
                    <div class="d-flex flex-wrap mt-2 justify-content-between">
                      <div class="d-flex align-items-center flex-column">
                        <strong class="small">Check-In:</strong>
                        <div class="small text-dark">{{ formattedCheckIn }}</div>
                      </div>
                      <div class="d-flex align-items-center flex-column">
                        <strong class="small">Check-Out:</strong>
                        <div class="small text-dark">{{ formattedCheckOut }}</div>
                      </div>
                      <div class="d-flex align-items-center flex-column">
                        <strong class="small">Duration:</strong>
                        <div class="small text-dark">{{ durationText }}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Datepicker
                      v-model="selectedDates"
                      inline
                      auto-apply
                      :min-date="new Date()"
                      :range="{ minRange: 1 }" 
                      :multi-calendars="isDesktop ? 2 : 1"
                      :clearable="false"
                      :enable-time-picker="false"
                      class="datepicker-wrapper d-flex flex-wrap justify-content-center"
                      @update:model-value="clearDateError"
                    />
                    <div v-if="formSubmitted && errors.selectedDates" class="text-danger small mt-2 text-center">
                      {{ errors.selectedDates }}
                    </div>
                    <small class="text-muted d-block mt-2 text-center">{{ ratesText }}</small>
                  </div>
                </div>

                <div class="col-md-5">
                  <h6 class="text-uppercase small fw-bold my-3 text-center text-md-start">Guests & Rooms</h6>
                  <div class="bg-light p-3 rounded">
                    <div class="mb-3">
                      <label class="form-label small text-secondary">Adults</label>
                      <div class="input-group input-group-sm">
                        <button class="btn btn-outline-secondary" type="button" @click="decrement('adults')" :disabled="searchParams.adults <= 1">-</button>
                        <input type="text" class="form-control text-center fw-bold" :value="searchParams.adults" readonly />
                        <button class="btn btn-outline-secondary" type="button" @click="increment('adults')">+</button>
                      </div>
                      <div v-if="formSubmitted && errors.adults" class="text-danger small mt-1">{{ errors.adults }}</div>
                    </div>
                     <!-- Thêm Rooms nếu cần -->
                  </div>
                </div>
              </div>

              <div class="text-center mt-4 py-4 border-top">
                <Button
                  content="CHECK AVAILABILITY"
                  type="submit"
                  :is-loading="isSubmittingLocalSearch"
                  :disabled="isSubmittingLocalSearch || (formSubmitted && !isFormValid)"
                  variant="confirm"
                ></Button>
              </div>
               <!-- Hiển thị lỗi từ store nếu có -->
              <div v-if="bookingStore.roomsError" class="alert alert-danger mt-3">
                Could not fetch availability: {{ bookingStore.roomsError }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import Button from '../../Button.vue'; // Đảm bảo đường dẫn đúng
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { format, differenceInCalendarDays, parseISO, isValid as isDateValid } from 'date-fns'; // Đổi tên isValid để tránh xung đột
import { useBookingStore } from '@/store/bookingStore';

const bookingStore = useBookingStore();
const isSubmittingLocalSearch = ref(false);

const initialStartDate = bookingStore.searchCriteria?.startDate;
const initialEndDate = bookingStore.searchCriteria?.endDate;

const selectedDates = ref(
  initialStartDate && initialEndDate && isDateValid(parseISO(initialStartDate)) && isDateValid(parseISO(initialEndDate))
    ? [parseISO(initialStartDate), parseISO(initialEndDate)]
    : []
);
const searchParams = reactive({
  adults: bookingStore.searchCriteria?.numberOfGuests || 1
});

const formSubmitted = ref(false);
const errors = reactive({ selectedDates: '', adults: '' });
const ratesText = ref('Rates may vary based on selection');
const isDesktop = ref(window.innerWidth >= 768);

const updateIsDesktop = () => { isDesktop.value = window.innerWidth >= 768; };

onMounted(() => {
  window.addEventListener('resize', updateIsDesktop);
  if (bookingStore.roomsError) {
      bookingStore.roomsError = null;
  }
});
onUnmounted(() => { window.removeEventListener('resize', updateIsDesktop); });

const formattedCheckIn = computed(() =>
  selectedDates.value?.[0] ? format(selectedDates.value[0], 'EEE, d MMM yyyy') : 'Select Date'
);
const formattedCheckOut = computed(() =>
  selectedDates.value?.[1] ? format(selectedDates.value[1], 'EEE, d MMM yyyy') : 'Select Date'
);
const durationText = computed(() => {
   if (selectedDates.value?.[0] && selectedDates.value?.[1]) {
    const start = selectedDates.value[0];
    const end = selectedDates.value[1];
    const nights = differenceInCalendarDays(end, start);
    if (nights < 0) return '–';
    return `${nights + 1}D, ${nights}N`;
  }
  return '–';
});

watch(() => bookingStore.searchCriteria, (newCriteria) => {
  if (newCriteria) {
    const newStartDate = newCriteria.startDate ? parseISO(newCriteria.startDate) : null;
    const newEndDate = newCriteria.endDate ? parseISO(newCriteria.endDate) : null;
    if (newStartDate && newEndDate && isDateValid(newStartDate) && isDateValid(newEndDate)) {
        selectedDates.value = [newStartDate, newEndDate];
    } else {
        selectedDates.value = [];
    }
    searchParams.adults = newCriteria.numberOfGuests || 1;
  } else { 
    selectedDates.value = [];
    searchParams.adults = 1;
  }
}, { deep: true, immediate: false });


function increment(type) {
  if (type === 'adults') searchParams.adults = Math.min(searchParams.adults + 1, 10); // Giới hạn tối đa 10
  if (formSubmitted.value && errors.adults) validateField('adults'); // Validate lại nếu đã có lỗi
}
function decrement(type) {
  if (type === 'adults' && searchParams.adults > 1) searchParams.adults--;
  if (formSubmitted.value && errors.adults) validateField('adults');
}

function clearDateError() {
    if (errors.selectedDates) errors.selectedDates = '';
}

function validateField(field) {
  let isValidField = true;
  if (field === 'selectedDates') {
    const [start, end] = selectedDates.value || [];
    if (!start || !end) { errors.selectedDates = 'Please select both check-in and check-out dates.'; isValidField = false; }
    else if (differenceInCalendarDays(end, start) < 1) { // Sửa: số đêm phải >= 1
        errors.selectedDates = 'Check-out date must be at least one day after check-in date.'; isValidField = false;
    }
    else { errors.selectedDates = '';}
  }
  if (field === 'adults') {
    if (searchParams.adults < 1) { errors.adults = 'At least one adult is required.'; isValidField = false; }
    else { errors.adults = ''; }
  }
  return isValidField;
}

const isFormValid = computed(() => {
    return validateField('selectedDates') && validateField('adults');
});


async function handleLocalSearchSubmit() {
  formSubmitted.value = true;
  if (!isFormValid.value) return;

  isSubmittingLocalSearch.value = true;
  if(bookingStore.roomsError) bookingStore.roomsError = null;

  const [checkIn, checkOut] = selectedDates.value;
  const searchData = {
    startDate: format(checkIn, 'yyyy-MM-dd'),
    endDate: format(checkOut, 'yyyy-MM-dd'),
    numberOfGuests: searchParams.adults,
  };
  await bookingStore.setSearchCriteriaAndFetchRooms(searchData);
  isSubmittingLocalSearch.value = false;
}
</script>

<style>
/* Giữ lại style global cho Datepicker nếu nó cần thiết từ đây */
/* Ví dụ, nếu bạn cần style một số thứ mà ::v-deep không làm được hoặc phức tạp */
.dp__theme_light { /* Ví dụ tùy chỉnh theme của datepicker nếu cần */
  --dp-primary-color: #007bff;
}
/* Style cho wrapper của Datepicker nếu có thêm div bọc không mong muốn */
/* Dòng này có thể không cần thiết nữa nếu Datepicker đã được render đúng */
::v-deep(.datepicker-wrapper > div:empty) {
  all: unset !important;
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
}

</style>

<style scoped>
.datepicker-wrapper { 
  max-width: 100%; 
  overflow-x: auto; 
  /* Căn giữa datepicker */
  /* display: flex; already have this */
  /* justify-content: center; already have this */
}
/* Media query để chỉnh lại vị trí datepicker trên màn hình hẹp hơn nhưng không phải mobile hẳn */
@media (min-width: 619px) and (max-width: 754px) {
  /* Logic này có thể không cần nếu Datepicker tự responsive tốt,
     hoặc bạn có thể dùng class `justify-content-md-start` nếu chỉ muốn áp dụng từ md trở lên
  */
  /* .datepicker-wrapper { margin-left: 7%; } */
}

.card {
  background-color: #FFF9F9; /* Màu nền bạn đã chọn */
}

/* Đảm bảo Datepicker con chiếm không gian */
.datepicker-wrapper > div:not(:empty) {
  flex: 1 1 auto;
}

.btn-outline-secondary {
    min-width: 40px; /* Đảm bảo nút + - có chiều rộng tối thiểu */
}
.form-control[readonly] {
    background-color: #fff; /* Để input readonly trông giống input thường */
}
</style>