<!-- src/views/HomePage.vue -->
<template>
  <div class="home-page">
    <Navbar style="position: fixed !important" />

    <HeroSection
      :image-url="heroImageUrl"
      height="85vh"
      :overlay-opacity="0.4"
      text-align="center"
      text-color="white"
    >
      <h1 class="display-4 fw-bold mb-4">Find Your Perfect Stay</h1>
      <form @submit.prevent="submitSearchForm" class="search-bar-custom row g-3 justify-content-center align-items-center p-3 rounded">
        <!-- Location Input -->
        <div class="col-lg-3 col-md-6">
          <div class="position-relative">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-geo-alt"></i></span>
              <input
                v-model="searchForm.location"
                type="text"
                class="form-control border-start-0"
                placeholder="Location (Optional)"
                @input="onLocationInput"
                @focus="isLocationSuggestionsVisible = true"
                @blur="hideLocationSuggestionsWithDelay"
              />
            </div>
            <div v-if="isLocationSuggestionsVisible && locationSuggestions.length > 0" class="suggestions-dropdown">
              <div
                v-for="suggestion in locationSuggestions"
                :key="suggestion"
                class="suggestion-item"
                @mousedown="selectSuggestedLocation(suggestion)"
              >
                {{ suggestion }}
              </div>
            </div>
          </div>
        </div>

        <!-- Date Range Picker -->
        <div class="col-lg-4 col-md-6">
          <Datepicker
            v-model="dateRange"
            range
            :enable-time-picker="false"
            placeholder="Select Check-in & Check-out Dates"
            :min-date="new Date()"
            auto-apply
            :format="formatDateRangeForDisplayInPicker"
            class="form-control custom-datepicker-input"
            :clearable="true"
            @update:model-value="handleDateRangeUpdate"
            :preset-ranges="presetRanges"
          >
            <template #input-icon>
              <i class="bi bi-calendar-range input-icon-calendar"></i>
            </template>
             <template #arrow-left>
                <i class="bi bi-chevron-left"></i>
            </template>
            <template #arrow-right>
                <i class="bi bi-chevron-right"></i>
            </template>
          </Datepicker>
        </div>

        <!-- Guests Select -->
        <div class="col-lg-2 col-md-6">
          <div class="input-group">
            <div class="input-group-prepend" for="numberOfGuests">
              <i class="bi  input-group-text bi-people h-100"></i>
            </div>
            <select v-model="searchForm.numberOfGuests" class="form-select border-start-0 " id="numberOfGuests">
              <option disabled value="">Guests</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n > 1 ? 'Guests' : 'Guest' }}</option>
            </select>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="col-lg-2 col-md-6">
          <button type="submit" class="btn btn-primary w-100" :disabled="isSubmittingSearchForm">
            <span v-if="isSubmittingSearchForm" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
             <i v-if="!isSubmittingSearchForm" class="bi bi-search me-1"></i>
            {{ isSubmittingSearchForm ? 'Searching...' : 'Search' }}
          </button>
        </div>
      </form>
      <div v-if="searchSubmissionError" class="alert alert-danger mt-3 col-md-8 mx-auto">
        {{ searchSubmissionError }}
      </div>
    </HeroSection>

    <Feature/>
    <section class="featured py-5">
      <div class="container">
        <h2 class="mb-4">Featured Properties</h2>
        <div v-if="isLoadingFeaturedHotels" class="text-center">
          <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
        <div v-else-if="featuredHotelsError" class="alert alert-danger">{{ featuredHotelsError }}</div>
        <div v-else-if="featuredHotels.length > 0">
          <Carousel :items="featuredHotels">
            <template #default="{ item: hotel }">
              <HotelCard :hotel="hotel" />
            </template>
          </Carousel>
        </div>
        <div v-else class="text-center text-muted">No featured properties available at the moment.</div>
      </div>
    </section>
    <Feature/>
    <Post
      :contents="postContents"
      buttonText="Xem thêm"
      :imgSrc="postImageUrl"
    title="Latest News & Offers"
    />
    <Footer/>
    <NotificationToast ref="notificationToast" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import Navbar from '../components/NavBar.vue';
import HeroSection from '../components/HeroSection.vue';
import Post from '../components/Post.vue';
import Footer from '../components/Footer.vue';
import Feature from '../components/Feature.vue';
import Carousel from '../components/Carousel.vue';
import HotelCard from '../components/HotelCard.vue';
import NotificationToast from '../components/NotificationToast.vue';
import hotelService from '../services/hotelService';
import { useRouter } from 'vue-router';
import { useBookingStore } from '../store/bookingStore';
import { formatISO, parseISO, isBefore, isEqual, addDays, format as formatDateFns } from 'date-fns';
import defaultHeroImage from '../assets/mountain.jpg';

import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';


const heroImageUrl = ref(defaultHeroImage);
const postImageUrl = ref(defaultHeroImage);
const postContents = ref([
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Discover the best hotel deals for your next vacation.'
]);

const bookingStore = useBookingStore();
const router = useRouter();
const notificationToast = ref(null);

const searchForm = reactive({ location: '', startDate: '', endDate: '', numberOfGuests: '' });
const isSubmittingSearchForm = ref(false);
const searchSubmissionError = ref(null);

const featuredHotels = ref([]);
const isLoadingFeaturedHotels = ref(true);
const featuredHotelsError = ref(null);

const locationSuggestions = ref([]);
const isLocationSuggestionsVisible = ref(false);
let locationSuggestionDebounceTimer = null;
let hideSuggestionsDelayTimer = null;

const dateRange = ref([]);

const formatDateRangeForDisplayInPicker = (dates) => {
  if (dates && dates.length === 2 && dates[0] && dates[1]) {
    const [start, end] = dates;
    return `${formatDateFns(start, 'dd/MM/yyyy')} - ${formatDateFns(end, 'dd/MM/yyyy')}`;
  }
  return 'Select Check-in & Check-out Dates';
};

const handleDateRangeUpdate = (modelData) => {
  if (modelData && modelData.length === 2 && modelData[0] && modelData[1]) {
    searchForm.startDate = formatISO(modelData[0], { representation: 'date' });
    searchForm.endDate = formatISO(modelData[1], { representation: 'date' });
  } else {
    searchForm.startDate = '';
    searchForm.endDate = '';
    dateRange.value = [];
  }
};

const presetRanges = ref([
  { label: 'Today', range: [new Date(), new Date()] },
  { label: 'Next 7 Days', range: [new Date(), addDays(new Date(), 6)] },
  { label: 'This Month', range: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)] },
]);

const DEBOUNCE_DELAY_MS = 350;
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(locationSuggestionDebounceTimer);
    locationSuggestionDebounceTimer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
async function fetchLocationSuggestions() {
  const locationQuery = searchForm.location.trim();
  if (locationQuery.length < 2) { locationSuggestions.value = []; return; }
  try {
    locationSuggestions.value = await hotelService.suggestLocations(locationQuery);
  } catch (err) { console.error('Error fetching location suggestions:', err); locationSuggestions.value = []; }
}
const debouncedFetchLocationSuggestions = debounce(fetchLocationSuggestions, DEBOUNCE_DELAY_MS);
function onLocationInput() { debouncedFetchLocationSuggestions(); }
function selectSuggestedLocation(location) {
  searchForm.location = location; locationSuggestions.value = [];
  isLocationSuggestionsVisible.value = false; clearTimeout(hideSuggestionsDelayTimer);
}
function hideLocationSuggestionsWithDelay() {
  hideSuggestionsDelayTimer = setTimeout(() => { isLocationSuggestionsVisible.value = false; }, 200);
}
function validateSearchForm() {
  searchSubmissionError.value = null;
  const errors = [];
  if (!searchForm.startDate) errors.push('Check-in date is required.');
  if (!searchForm.endDate) errors.push('Check-out date is required.');
  if (searchForm.startDate && searchForm.endDate) {
    const start = parseISO(searchForm.startDate); const end = parseISO(searchForm.endDate);
    if (isBefore(end, start) || isEqual(end, start)) { errors.push('Check-out date must be after Check-in date.'); }
  }
  if (!searchForm.numberOfGuests) errors.push('Number of guests is required.');
  else {
    const guests = parseInt(searchForm.numberOfGuests);
    if (isNaN(guests) || guests <= 0) errors.push('Please enter a valid number of guests.');
  }
  if (errors.length > 0 && notificationToast.value) {
    notificationToast.value.show(errors[0], 'error'); return false;
  }
  return true;
}
async function submitSearchForm() {
  if (!validateSearchForm()) return;
  isSubmittingSearchForm.value = true; searchSubmissionError.value = null;
  if (bookingStore.roomsError) bookingStore.roomsError = null;
  const criteria = {
    startDate: searchForm.startDate, endDate: searchForm.endDate,
    numberOfGuests: parseInt(searchForm.numberOfGuests),
  };
  try {
    bookingStore.startBookingFromScratch(); // Reset booking state
    await bookingStore.setSearchCriteriaAndFetchRooms(criteria);
    if (bookingStore.roomsError) {
      if (notificationToast.value) notificationToast.value.show(`Search failed: ${bookingStore.roomsError}`, 'error');
    } else { router.push('/BookingProcess'); }
  } catch (err) {
    console.error("HomePage: Unexpected error during search form submission:", err);
    searchSubmissionError.value = 'An unexpected error occurred. Please try again.';
    if (notificationToast.value) notificationToast.value.show(searchSubmissionError.value, 'error');
  } finally { isSubmittingSearchForm.value = false; }
}
async function loadFeaturedHotels() {
  isLoadingFeaturedHotels.value = true; featuredHotelsError.value = null;
  try {
    const response = await hotelService.getFeaturedHotels();
    featuredHotels.value = response.data?.data || response.data || [];
  } catch (err) {
    console.error('Error loading featured hotels:', err);
    featuredHotelsError.value = 'Could not load featured properties. Please try again later.';
    featuredHotels.value = [];
  } finally { isLoadingFeaturedHotels.value = false; }
}
onMounted(() => { loadFeaturedHotels(); });
onBeforeUnmount(() => {
  clearTimeout(locationSuggestionDebounceTimer);
  clearTimeout(hideSuggestionsDelayTimer);
});
</script>

<style scoped>
.home-page { overflow-x: hidden; }
.hero .container { position: relative; z-index: 1; }
.featured h2 { text-align: center; font-weight: 600; }

/* --- STYLE CHO SEARCH BAR VÀ DATEPICKER (ĐÃ BỎ BACKGROUND, SHADOW, BLUR CHO SEARCH BAR) --- */
.search-bar-custom {
  /* background-color: none; -- Đã xóa */
  /* backdrop-filter: blur(8px); -- Đã xóa */
  border-radius: 0.75rem;
  /* box-shadow: 0 8px 25px rgba(0,0,0,0.15); -- Đã xóa */
  padding: 1.25rem 1rem;
}

.search-bar-custom .form-control,
.search-bar-custom .form-select,
.search-bar-custom .btn {
  height: 50px;
  font-size: 1rem;
  border: 1px solid #ced4da; /* Thêm lại border mặc định hoặc một border nhẹ nếu muốn */
  /* box-shadow: 0 2px 5px rgba(0,0,0,0.05); -- Đã xóa, có thể thêm lại nếu muốn input có shadow riêng */
}

/* Override Bootstrap focus styles để loại bỏ viền xanh */
.search-bar-custom .form-control:focus,
.search-bar-custom .form-select:focus {
  border-color: #ced4da;
  outline: 0;
  box-shadow: none;
}
.search-bar-custom .input-group .form-control {
   border-left: none;
   border-radius: 0 0.375rem 0.375rem 0;
}
.search-bar-custom .input-group .input-group-text {
  background-color: #fff;
  border-right: none;
  border-radius: 0.375rem 0 0 0.375rem;
  padding: 0 0.9rem;
  border: 1px solid #ced4da; /* Thêm border cho input-group-text */
  border-right: none; /* Bỏ border phải để liền với input */
}
.search-bar-custom .btn-primary {
    background-color: #FF5A5F;
    border-color: #FF5A5F;
    transition: background-color 0.2s ease, border-color 0.2s ease;
    /* box-shadow: 0 2px 5px rgba(0,0,0,0.05); -- Đã xóa, có thể thêm lại nếu muốn nút có shadow riêng */

}
.search-bar-custom .btn-primary:hover {
    background-color: #E04347;
    border-color: #E04347;
}

:deep(.dp__main > div:first-child) {
  height: 100% !important;
  position: relative !important;
  font-size: 1rem !important;
  border-radius: 0.375rem !important;
  padding-left: 3rem !important;
}

:deep(.dp__main > div:first-child > div) {

    position: absolute !important;
    left: 0 !important;
    border: none !important;

}

:deep(.dp__main > div:first-child > div > input) {
    border: none !important;
}





.input-icon-calendar {
    position: absolute;
    left: 0; 
     top: 50%;
    transform: translateY(-50%); color: #484848; font-size: 1.2rem;
}
:deep(.dp__theme_light) {
  --dp-background-color: #ffffff; --dp-text-color: #212529; --dp-hover-color: #f0f0f0;
  --dp-hover-text-color: #212529; --dp-hover-icon-color: #959595; --dp-primary-color: #FF5A5F;
  --dp-primary-text-color: #ffffff; --dp-secondary-color: #f0f0f0; --dp-border-color: #e0e0e0;
  --dp-menu-border-color: #ddd; --dp-border-color-hover: #b3b3b3; --dp-border-radius: 0.5rem;
  --dp-font-size: 0.95rem; --dp-font-family: inherit;
}
.suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1050; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.suggestion-item { padding: 8px 12px; cursor: pointer; transition: background-color 0.2s; color: black; text-align: left; }
.suggestion-item:hover { background-color: #f5f5f5; }
</style>