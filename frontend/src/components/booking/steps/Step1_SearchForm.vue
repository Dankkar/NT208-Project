<!-- src/components/booking/steps/Step1_SearchForm.vue -->
<template>
  <div class="step1-search-form container-fluid py-4">
    <form @submit.prevent="handleSearch" class="needs-validation" novalidate>
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
                        <strong class=" small">Check-Out:</strong>
                        <div class="small text-dark">{{ formattedCheckOut }}</div>
                      </div>
                      <div class="d-flex align-items-center flex-column">
                        <strong class="small">Duration:</strong>
                        <div class="small text-dark">{{ durationText }}</div>
                      </div>
                    </div>
                  </div>
                  <div >
                    <Datepicker
                      v-model="selectedDates"
                      inline
                      auto-apply
                      :min-date="new Date()"
                      :range="{ minRange: 2 }"
                      :multi-calendars="2"
                      :clearable="false"
                      :enable-time-picker="false"
                      class="datepicker-wrapper d-flex flex-wrap justify-content-center"
                    />
                    <div v-if="formSubmitted && errors.selectedDates" class="text-danger small mt-2">
                      {{ errors.selectedDates }}
                    </div>
                    <small class="text-muted d-block mt-2">{{ ratesText }}</small>
                  </div>
                </div>

                <div class="col-md-5">
                  <h6 class="text-uppercase small fw-bold my-3">No . Room & Guest</h6>
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
                  </div>
                </div>
              </div>

              <div class="text-center mt-4 py-4 border-top">
                <Button
                  content="CHECK AVAILABILITY"
                  type="submit"
                  :disabled="formSubmitted && (!validateForm())"
                  textColor="#fff"
                  colorHover="white"
                  backgroundColor="#000"
                  borderRadius="0px"
                  bgHover="black"
                ></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'; // Thêm watch nếu bạn muốn đồng bộ state cục bộ với store
import Button from '../../Button.vue';
import Datepicker from '@vuepic/vue-datepicker'; // Import Datepicker
import '@vuepic/vue-datepicker/dist/main.css';   // Import CSS cho Datepicker
import { format, differenceInCalendarDays, parseISO } from 'date-fns'; // parseISO nếu cần
import { useBookingStore } from '@/store/bookingStore'; // IMPORT STORE

const bookingStore = useBookingStore(); // Khởi tạo store

// Bỏ emit vì sẽ gọi action của store
// const emit = defineEmits(['search-submitted']);

const selectedDates = ref(
  //
  // Khởi tạo selectedDates từ store nếu có giá trị (khi người dùng quay lại bước này)
  //
  bookingStore.rawSearchCriteria && bookingStore.rawSearchCriteria.startDate && bookingStore.rawSearchCriteria.endDate
    ? [parseISO(bookingStore.rawSearchCriteria.startDate), parseISO(bookingStore.rawSearchCriteria.endDate)]
    : []
);
const searchParams = reactive({
  //
  // Khởi tạo adults từ store nếu có
  //
  adults: bookingStore.rawSearchCriteria?.numberOfGuests || 1
});

const formSubmitted = ref(false);
const errors = reactive({ selectedDates: '', adults: '' });
const ratesText = ref('Rates shown in S$');

const formattedCheckIn = computed(() =>
  selectedDates.value?.[0] ? format(selectedDates.value[0], 'EEE, d MMM yyyy') : '–'
);
const formattedCheckOut = computed(() =>
  selectedDates.value?.[1] ? format(selectedDates.value[1], 'EEE, d MMM yyyy') : '–'
);
const durationText = computed(() => {
   if (selectedDates.value?.[0] && selectedDates.value?.[1]) {
    const start = selectedDates.value[0]; // Datepicker trả về Date objects
    const end = selectedDates.value[1];
    const nights = differenceInCalendarDays(end, start);
    if (nights < 0) return '–'; // Đảm bảo checkout sau checkin
    return `${nights + 1}D, ${nights}N`;
  }
  return '–';
});

//
// Theo dõi nếu rawSearchCriteria trong store thay đổi (ví dụ khi reset), cập nhật lại state cục bộ
//
watch(() => bookingStore.rawSearchCriteria, (newCriteria) => {
  if (newCriteria) {
    selectedDates.value = newCriteria.startDate && newCriteria.endDate
      ? [parseISO(newCriteria.startDate), parseISO(newCriteria.endDate)]
      : [];
    searchParams.adults = newCriteria.numberOfGuests || 1;
  } else { // Reset nếu criteria trong store là null
    selectedDates.value = [];
    searchParams.adults = 1;
  }
}, { deep: true });


function increment(type) {
  if (type === 'adults') searchParams.adults = Math.min(searchParams.adults + 1, 10);
  if (formSubmitted.value) validateField(type);
}
function decrement(type) {
  if (type === 'adults' && searchParams.adults > 1) searchParams.adults--;
  if (formSubmitted.value) validateField(type);
}

function validateField(field) {
  let isValid = true;
  if (field === 'selectedDates') {
    const [start, end] = selectedDates.value || [];
    if (!start || !end) {
      errors.selectedDates = 'Please select both check-in and check-out dates.';
      isValid = false;
    } else if (differenceInCalendarDays(end, start) < 0) {
      errors.selectedDates = 'Check-out date must be after check-in date.';
      isValid = false;
    }
    else errors.selectedDates = '';
  }
  if (field === 'adults') {
    if (searchParams.adults < 1) {
      errors.adults = 'At least one adult is required.';
      isValid = false;
    } else errors.adults = '';
  }
  return isValid;
}

function validateForm() {
  return validateField('selectedDates') && validateField('adults');
}

async function handleSearch() { // Thay đổi thành async vì action trong store có thể là async
  formSubmitted.value = true;
  if (!validateForm()) return;
  const [checkIn, checkOut] = selectedDates.value || [];

  const searchData = {
    startDate: checkIn ? format(checkIn, 'yyyy-MM-dd') : null,
    endDate: checkOut ? format(checkOut, 'yyyy-MM-dd') : null,
    numberOfGuests: searchParams.adults,
  };

  await bookingStore.setSearchCriteriaAndFetchRooms(searchData);
}
</script>

<style>
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
.datepicker-wrapper { max-width: 100%; overflow-x: auto; }
@media (min-width: 619px) and (max-width: 754px) {
  .datepicker-wrapper { margin-left: 7%; }
}
.card { background-color: #FFF9F9; }
.datepicker-wrapper > div:not(:empty) { flex: 1 1 auto; }
</style>