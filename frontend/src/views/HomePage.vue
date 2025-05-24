  <!-- src/views/HomePage.vue -->
<template>
  <div class="home-page">
    <Navbar style="position: fixed !important;" />

    <HeroSection
      :image-url="heroImageUrl"
      height="85vh"
      :overlay-opacity="0.4"
      text-align="center"
      text-color="white"
    >
      <!-- This content goes into the slot of HeroSection -->
      <h1 class="display-4 fw-bold mb-4">Find Your Perfect Stay</h1>
      <form @submit.prevent="onSearch" class="row g-2 justify-content-center">
        <div class="col-md-3">
          <div class="position-relative">
            <input
              v-model="search.location"
              type="text"
              class="form-control"
              placeholder="Location"
              @input="handleLocationInput"
              @focus="showSuggestions = true"
              @blur="hideSuggestionsWithDelay"
            />
            <div v-if="showSuggestions && locationSuggestions.length > 0" class="suggestions-dropdown">
              <div
                v-for="suggestion in locationSuggestions"
                :key="suggestion"
                class="suggestion-item"
                @mousedown="selectLocation(suggestion)"
              >
                {{ suggestion }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <input v-model="search.checkIn" type="date" class="form-control" />
        </div>
        <div class="col-md-2">
          <input v-model="search.checkOut" type="date" class="form-control" />
        </div>
        <div class="col-md-2">
          <select v-model="search.guests" class="form-select">
            <option disabled value="">Guests</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n>1?'Guests':'Guest' }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <button type="submit" class="btn btn-primary w-100">Search</button>
        </div>
      </form>
    </HeroSection>

    <!-- FEATURED -->
    <section class="featured py-5">
      <div class="container">
        <h2 class="mb-4">Featured Properties</h2>
        <div v-if="loading" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        <div v-else>
          <FeaturedCarousel :items="featuredHotels">
            <template #default="{ item: hotel }">
              <HotelCard :hotel="hotel" />
            </template>
          </FeaturedCarousel>
        </div>
      </div>
    </section> 
    <Feature/>

    <!-- Post -->
    <Post 
      :contents="[
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Khách sạn tốt nhất cho bạn'
      ]"
      buttonText="Xem thêm"
      :imgSrc="imageUrl"
    title="Title" 
    />
    <!-- Footer -->
    <Footer/>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import HeroSection from '../components/HeroSection.vue'
import Post from '../components/Post.vue'
import Footer from '../components/Footer.vue'
import FeaturedCarousel from '../components/FeaturedCarousel.vue'
import HotelCard from '../components/HotelCard.vue'
import hotelService from '../services/hotelService'
import { useRouter } from 'vue-router'
import axios from 'axios'
import mountain from '../assets/mountain.jpg'


const heroImageUrl = mountain
const imageUrl = mountain


const search = reactive({
  location: '',
  checkIn: '',
  checkOut: '',
  guests: ''
})

const featuredHotels = ref([])
const loading = ref(true)
const error = ref(null)
const locationSuggestions = ref([])
const showSuggestions = ref(false)
let debounceTimer = null

// Debounce function
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

async function fetchLocationSuggestions() {
  if (search.location.length > 0) {
    try {
      const suggestions = await hotelService.suggestLocations(search.location)
      locationSuggestions.value = suggestions
    } catch (err) {
      console.error('Error fetching location suggestions:', err)
    }
  } else {
    locationSuggestions.value = []
  }
}

// Create debounced version of fetchLocationSuggestions
const debouncedFetchSuggestions = debounce(fetchLocationSuggestions, 360)

async function handleLocationInput() {
  debouncedFetchSuggestions()
}

async function onSearch() {
  try {
    const response = await axios.get('http://localhost:5000/api/bookings/search', {
      params: {
        location: search.location,
        startDate: search.checkIn,
        endDate: search.checkOut,
        numberOfGuests: search.guests
      }
    })
    console.log('Search response:', response.data)
  } catch (error) {
    console.error('Error fetching search results:', error)
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

async function loadFeaturedHotels() {
  try {
    loading.value = true
    const response = await hotelService.getFeaturedHotels()
    featuredHotels.value = response.data
  } catch (err) {
    error.value = 'Không thể tải danh sách khách sạn. Vui lòng thử lại sau.'
    console.error('Error loading featured hotels:', err)
  } finally {
    loading.value = false
  }
}

function selectLocation(location) {
  search.location = location
  locationSuggestions.value = []
  showSuggestions.value = false
}

onMounted(() => {
  loadFeaturedHotels()
})
</script>

<style scoped>
.home-page { overflow-x: hidden; }

/* HERO */
.hero {
  height: 85vh;
  background: url('@/assets/mountain.jpg') no-repeat center/cover;
  position: relative;
}
.hero .overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
}
.hero .container {
  position: relative; z-index: 1;
}

/* Featured title */
.featured h2 {
  text-align: center;
  font-weight: 600;
}

/* Card images */
.card-img-top {
  height: 200px;
  object-fit: cover;
}

.home-page .navbar {
  position: absolute;
  z-index: 1000;
}

.rating {
  font-size: 0.9rem;
}

/* Location suggestions dropdown */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: black;
  text-align: left;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}
</style>
