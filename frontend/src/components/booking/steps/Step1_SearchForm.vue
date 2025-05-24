<template>
  <div class="step1-search-form container-fluid py-4">
    <form @submit.prevent="handleSearch" class="needs-validation" novalidate>
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10">
          <div class="card shadow-sm border">
            <div class="card-body">
              <div class="row">
                <!-- Lịch bên trái -->
                <div class="col-md-7 border-end mb-4 mb-md-0">
                  <div class="mb-3">
                    <div class="d-flex flex-wrap mt-2 justify-content-between">
                      <!-- <div>
                        <strong class="text-uppercase">Dates of stay</strong>
                      </div> -->
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
                      :range="true"
                      inline
                      auto-apply
                      :min-date="new Date()"
                      :format="formatDate"
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

                <!-- Khách bên phải -->
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
                <!-- <button type="submit" class="btn btn-dark btn-lg text-uppercase px-5 fw-bold">
                  Check Availability
                </button> -->
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
import { ref, reactive, computed } from 'vue';
import Button from '../../Button.vue';
import { format, differenceInCalendarDays } from 'date-fns';

const emit = defineEmits(['search-submitted']);
const selectedDates = ref([]);
const searchParams = reactive({ adults: 1 });
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
    const start = new Date(selectedDates.value[0]);
    const end = new Date(selectedDates.value[1]);
    const nights = differenceInCalendarDays(end, start);
    return `${nights + 1}D, ${nights}N`;
  }
  return '–';
});

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
    } else errors.selectedDates = '';
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

function handleSearch() {
  formSubmitted.value = true;
  if (!validateForm()) return;
  const [checkIn, checkOut] = selectedDates.value || [];
  const searchData = {
    checkInDate: checkIn ? format(checkIn, 'yyyy-MM-dd') : null,
    checkOutDate: checkOut ? format(checkOut, 'yyyy-MM-dd') : null,
    adults: searchParams.adults,
  };
  emit('search-submitted', searchData);
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
.datepicker-wrapper {
  max-width: 100%;
  overflow-x: auto;
}

@media (min-width: 619px) and (max-width: 754px) {
  .datepicker-wrapper {
    margin-left: 7%;
  }
}

.card {
  background-color: #FFF9F9;
}


.datepicker-wrapper > div:not(:empty) {
  flex: 1 1 auto;
}
</style>
