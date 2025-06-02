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
      <form @submit.prevent="submitSearchForm" class="row g-2 justify-content-center align-items-center">
        <!-- Location Input -->
        <div class="col-md-3">
          <div class="position-relative">
            <input
              v-model="searchForm.location"
              type="text"
              class="form-control"
              placeholder="Location (Optional)"
              @input="onLocationInput"
              @focus="isLocationSuggestionsVisible = true"
              @blur="hideLocationSuggestionsWithDelay"
            />
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

        <!-- Date Inputs -->
        <div class="col-md-2">
          <input v-model="searchForm.startDate" type="date" class="form-control" :min="minDateForPicker" />
        </div>
        <div class="col-md-2">
          <input v-model="searchForm.endDate" type="date" class="form-control" :min="minEndDateForPicker" />
        </div>

        <!-- Guests Select -->
        <div class="col-md-2">
          <select v-model="searchForm.numberOfGuests" class="form-select">
            <option disabled value="">Guests</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n > 1 ? 'Guests' : 'Guest' }}</option>
          </select>
        </div>

        <!-- Submit Button -->
        <div class="col-md-2">
          <button type="submit" class="btn btn-primary w-100" :disabled="isSubmittingSearchForm">
            <span v-if="isSubmittingSearchForm" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ isSubmittingSearchForm ? 'Searching...' : 'Search & Book' }}
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
              <!-- HotelCard giờ chỉ là link, không cần @reserve-now -->
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
import HotelCard from '../components/HotelCard.vue'; // Vẫn import để hiển thị
import NotificationToast from '../components/NotificationToast.vue';
import hotelService from '../services/hotelService';
import { useRouter } from 'vue-router';
import { useBookingStore } from '../store/bookingStore';
import { formatISO, parseISO, isBefore, isEqual, addDays } from 'date-fns';
import defaultHeroImage from '../assets/mountain.jpg';

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

const minDateForPicker = computed(() => formatISO(new Date(), { representation: 'date' }));
const minEndDateForPicker = computed(() => {
  if (searchForm.startDate) {
    return formatISO(addDays(parseISO(searchForm.startDate), 1), { representation: 'date' });
  }
  return formatISO(addDays(new Date(), 1), { representation: 'date' });
});

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
  if (locationQuery.length < 2) {
    locationSuggestions.value = [];
    return;
  }
  try {
    locationSuggestions.value = await hotelService.suggestLocations(locationQuery);
  } catch (err) {
    console.error('Error fetching location suggestions:', err);
    locationSuggestions.value = [];
  }
}
const debouncedFetchLocationSuggestions = debounce(fetchLocationSuggestions, DEBOUNCE_DELAY_MS);

function onLocationInput() { debouncedFetchLocationSuggestions(); }
function selectSuggestedLocation(location) {
  searchForm.location = location;
  locationSuggestions.value = [];
  isLocationSuggestionsVisible.value = false;
  clearTimeout(hideSuggestionsDelayTimer);
}
function hideLocationSuggestionsWithDelay() {
  hideSuggestionsDelayTimer = setTimeout(() => {
    isLocationSuggestionsVisible.value = false;
  }, 200);
}

function validateSearchForm() {
  searchSubmissionError.value = null;
  const errors = [];
  if (!searchForm.startDate) errors.push('Check-in date is required.');
  if (!searchForm.endDate) errors.push('Check-out date is required.');
  if (searchForm.startDate && searchForm.endDate) {
    const start = parseISO(searchForm.startDate);
    const end = parseISO(searchForm.endDate);
    if (isBefore(end, start) || isEqual(end, start)) {
      errors.push('Check-out date must be after Check-in date.');
    }
  }
  if (!searchForm.numberOfGuests) errors.push('Number of guests is required.');
  else {
    const guests = parseInt(searchForm.numberOfGuests);
    if (isNaN(guests) || guests <= 0) errors.push('Please enter a valid number of guests.');
  }

  if (errors.length > 0 && notificationToast.value) {
    notificationToast.value.show(errors[0], 'error');
    return false;
  }
  return true;
}

async function submitSearchForm() {
  if (!validateSearchForm()) return;

  isSubmittingSearchForm.value = true;
  searchSubmissionError.value = null;
  if (bookingStore.roomsError) bookingStore.roomsError = null;

  const criteria = {
    startDate: searchForm.startDate,
    endDate: searchForm.endDate,
    numberOfGuests: parseInt(searchForm.numberOfGuests),
  };

  try {
    await bookingStore.setSearchCriteriaAndFetchRooms(criteria);
    if (bookingStore.roomsError) {
      if (notificationToast.value) {
        notificationToast.value.show(`Search failed: ${bookingStore.roomsError}`, 'error');
      }
    } else {
      router.push('/BookingProcess');
    }
  } catch (err) {
    console.error("HomePage: Unexpected error during search form submission:", err);
    searchSubmissionError.value = 'An unexpected error occurred. Please try again.';
    if (notificationToast.value) {
      notificationToast.value.show(searchSubmissionError.value, 'error');
    }
  } finally {
    isSubmittingSearchForm.value = false;
  }
}

// Hàm initiateBookingFromScratch không còn được gọi từ HotelCard ở đây nữa.
// Nếu bạn có một nút "Book Now" chung chung khác trên HomePage mà không liên quan
// đến một khách sạn cụ thể từ carousel, bạn có thể giữ hàm này (ví dụ đổi tên thành `startGenericBooking`):
// function startGenericBooking() {
//   bookingStore.clearPreselectedBookingIntent(); // Không có intent cụ thể
//   bookingStore.startBookingFromScratch();
//   router.push('/BookingProcess');
// }

async function loadFeaturedHotels() {
  isLoadingFeaturedHotels.value = true;
  featuredHotelsError.value = null;
  try {
    const response = await hotelService.getFeaturedHotels();
    featuredHotels.value = response.data?.data || response.data || [];
  } catch (err) {
    console.error('Error loading featured hotels:', err);
    featuredHotelsError.value = 'Could not load featured properties. Please try again later.';
    featuredHotels.value = [];
  } finally {
    isLoadingFeaturedHotels.value = false;
  }
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
.suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.suggestion-item { padding: 8px 12px; cursor: pointer; transition: background-color 0.2s; color: black; text-align: left; }
.suggestion-item:hover { background-color: #f5f5f5; }
</style>