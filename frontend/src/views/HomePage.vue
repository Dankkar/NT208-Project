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
      <form
        @submit.prevent="submitSearchForm"
        class="search-bar-custom row g-3 justify-content-center align-items-center p-3 rounded"
      >
        <!-- Location Input -->
        <div class="col-lg-3 col-md-6">
          <div class="position-relative">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0">
                <i class="bi bi-geo-alt"></i>
              </span>
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
            <div
              v-if="isLocationSuggestionsVisible && (locationSuggestions.length > 0 || isLoadingSuggestions || showNoResults)"
              class="suggestions-dropdown"
            >
              <!-- Loading state -->
              <div v-if="isLoadingSuggestions" class="suggestion-item text-center">
                <div class="d-flex align-items-center justify-content-center">
                  <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span>Đang tìm kiếm...</span>
                </div>
              </div>
              
              <!-- No results -->
              <div v-else-if="showNoResults && locationSuggestions.length === 0" class="suggestion-item text-center text-muted">
                <i class="bi bi-search me-2"></i>
                Không tìm thấy kết quả
              </div>
              
              <!-- Suggestions -->
              <div
                v-for="suggestion in locationSuggestions"
                :key="suggestion.text || suggestion"
                class="suggestion-item"
                @mousedown="selectSuggestedLocation(suggestion)"
              >
                <div class="d-flex align-items-center">
                  <i :class="getSuggestionIcon(suggestion)" class="me-2"></i>
                  <div>
                    <div class="suggestion-text">
                      {{ getSuggestionDisplayText(suggestion) }}
                    </div>
                    <small v-if="suggestion.type === 'address'" class="text-muted">
                      {{ suggestion.hotelCount }} khách sạn
                    </small>
                  </div>
                </div>
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
              <i class="bi input-group-text bi-people h-100"></i>
            </div>
            <select
              v-model="searchForm.numberOfGuests"
              class="form-select border-start-0"
              id="numberOfGuests"
            >
              <option disabled value="">Guests</option>
              <option v-for="n in 5" :key="n" :value="n">
                {{ n }} {{ n > 1 ? 'Guests' : 'Guest' }}
              </option>
            </select>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="col-lg-2 col-md-6">
          <button
            type="submit"
            class="btn btn-primary w-100"
            :disabled="isSubmittingSearchForm"
          >
            <span
              v-if="isSubmittingSearchForm"
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-if="!isSubmittingSearchForm" class="bi bi-search me-1"></i>
            {{ isSubmittingSearchForm ? 'Searching...' : 'Search' }}
          </button>
        </div>
      </form>
      <div v-if="searchSubmissionError" class="alert alert-danger mt-3 col-md-8 mx-auto">
        {{ searchSubmissionError }}
      </div>
    </HeroSection>

    <section class="featured py-5">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="section-title mb-0">Top Hotels in Viet Nam</h2>
        </div>
        <div v-if="isLoadingFeaturedHotels" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div v-else-if="featuredHotelsError" class="alert alert-danger">
          {{ featuredHotelsError }}
        </div>
        <div v-else-if="featuredHotels.length > 0">
          <Carousel :items="featuredHotels">
            <template #default="{ item: hotel }">
              <HotelCard :hotel="hotel" />
            </template>
          </Carousel>
        </div>
        <div v-else class="text-center text-muted">
          No top hotels available at the moment.
        </div>
      </div>
    </section>

    <PromotionsSection />

    <!-- Mời đăng ký thành viên -->
    <Post
      :contents="memberBenefits"
      buttonText="Đăng ký ngay"
      :imgSrc="membershipImage"
      @action="goToRegisterPage"
    >
      <template #title>
        <h2 class="fw-bold">Trở thành thành viên Chill Chill</h2>
      </template>
    </Post>

    <!-- === Post: Mách bạn cách xếp vali gọn nhẹ === -->
    <Post
      :contents="packingTips"
      buttonText="Đặt phòng ngay"
      :imgSrc="packingImage"
      @action="goToBookingPage"
    >
      <template #title>
        <h2 class="fw-bold">Mách bạn cách xếp vali gọn nhẹ cho chuyến đi</h2>
      </template>
    </Post>

    <Footer />
    <NotificationToast ref="notificationToast" />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '../store/bookingStore'
import { useSEO } from '../composables/useSEO'
import {
  formatISO,
  parseISO,
  isBefore,
  isEqual,
  addDays,
  format as formatDateFns
} from 'date-fns'

import Navbar from '../components/NavBar.vue'
import HeroSection from '../components/HeroSection.vue'
import PromotionsSection from '../components/PromotionsSection.vue'
import Post from '../components/Post.vue'
import Footer from '../components/Footer.vue'
import Carousel from '../components/Carousel.vue'
import HotelCard from '../components/HotelCard.vue'
import NotificationToast from '../components/NotificationToast.vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

import hotelService from '../services/hotelService'
import defaultHeroImage from '../assets/mountain2.jpg'
import packingImage from '../assets/packing-tip.jpg'
import membershipImage from '../assets/membership.png'

const router = useRouter()
const bookingStore = useBookingStore()
const notificationToast = ref(null)
const { applySEOPreset, updateStructuredData } = useSEO()

const heroImageUrl = ref(defaultHeroImage)

// Member benefits data
const memberBenefits = [
  'Ưu đãi giảm giá độc quyền đến 20%',
  'Nhận thông báo khuyến mãi sớm nhất',
  'Quản lý đặt phòng & lịch sử dễ dàng',
  'Quà tặng sinh nhật dành riêng cho thành viên'
]

// Packing tips data
const packingTips = [
  'Cuộn quần áo thay vì gấp để tiết kiệm không gian và tránh nhăn',
  'Chia đồ theo túi zip trong suốt để dễ tìm, và để đồ bẩn riêng',
  'Tận dụng túi trong giày để nhét tất, phụ kiện nhỏ',
  'Mang theo túi gập (foldable bag) để đựng quà hoặc đồ mua thêm'
]

// Search form state
const searchForm = reactive({
  location: '',
  startDate: '',
  endDate: '',
  numberOfGuests: ''
})
const isSubmittingSearchForm = ref(false)
const searchSubmissionError = ref(null)

// Featured hotels state
const featuredHotels = ref([])
const isLoadingFeaturedHotels = ref(true)
const featuredHotelsError = ref(null)

// Location suggestions state
const locationSuggestions = ref([])
const isLocationSuggestionsVisible = ref(false)
const isLoadingSuggestions = ref(false)
const showNoResults = ref(false)
let locationSuggestionDebounceTimer = null
let hideSuggestionsDelayTimer = null

// Datepicker state
const dateRange = ref([])
const presetRanges = ref([
  { label: 'Today', range: [new Date(), new Date()] },
  { label: 'Next 7 Days', range: [new Date(), addDays(new Date(), 6)] },
  {
    label: 'This Month',
    range: [
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    ]
  }
])

function formatDateRangeForDisplayInPicker(dates) {
  if (dates && dates.length === 2 && dates[0] && dates[1]) {
    const [start, end] = dates
    return `${formatDateFns(start, 'dd/MM/yyyy')} - ${formatDateFns(end, 'dd/MM/yyyy')}`
  }
  return 'Select Check-in & Check-out Dates'
}

function handleDateRangeUpdate(modelData) {
  if (modelData && modelData.length === 2 && modelData[0] && modelData[1]) {
    searchForm.startDate = formatISO(modelData[0], { representation: 'date' })
    searchForm.endDate = formatISO(modelData[1], { representation: 'date' })
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
    dateRange.value = []
  }
}

const DEBOUNCE_DELAY_MS = 350
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(locationSuggestionDebounceTimer)
    locationSuggestionDebounceTimer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

async function fetchLocationSuggestions() {
  const locationQuery = searchForm.location.trim()
  if (locationQuery.length < 2) {
    locationSuggestions.value = []
    showNoResults.value = false
    isLoadingSuggestions.value = false
    return
  }
  
  try {
    isLoadingSuggestions.value = true
    showNoResults.value = false
    
    console.log('Fetching suggestions for:', locationQuery)
    const res = await hotelService.suggestLocations(locationQuery)
    console.log('Raw response:', res)
    
    // Backend trả về {success: true, data: [...]}
    // hotelService.suggestLocations đã return response.data rồi
    const suggestions = res.data || res || []
    console.log('Processed suggestions:', suggestions)
    
    locationSuggestions.value = suggestions
    
    // Hiển thị "no results" nếu không có kết quả và đã search xong
    if (suggestions.length === 0 && locationQuery.length >= 2) {
      showNoResults.value = true
      console.log('No results found')
    }
    
    console.log('Final state:')
    console.log('- locationSuggestions.value:', locationSuggestions.value)
    console.log('- isLocationSuggestionsVisible.value:', isLocationSuggestionsVisible.value)
    console.log('- isLoadingSuggestions.value:', isLoadingSuggestions.value)
    console.log('- showNoResults.value:', showNoResults.value)
    
  } catch (err) {
    console.error('Error fetching location suggestions:', err)
    locationSuggestions.value = []
    showNoResults.value = true
  } finally {
    isLoadingSuggestions.value = false
  }
}
const debouncedFetchLocationSuggestions = debounce(fetchLocationSuggestions, DEBOUNCE_DELAY_MS)

function onLocationInput() {
  // Reset states khi user thay đổi input
  showNoResults.value = false
  isLoadingSuggestions.value = false
  
  console.log('onLocationInput triggered, current value:', searchForm.location)
  console.log('isLocationSuggestionsVisible:', isLocationSuggestionsVisible.value)
  
  // Nếu input trống, ẩn suggestions
  if (searchForm.location.trim().length === 0) {
    locationSuggestions.value = []
    isLocationSuggestionsVisible.value = false
    console.log('Input empty, hiding suggestions')
    return
  }
  
  // Hiển thị dropdown ngay khi user bắt đầu nhập
  isLocationSuggestionsVisible.value = true
  console.log('Set isLocationSuggestionsVisible to true')
  
  debouncedFetchLocationSuggestions()
}

function selectSuggestedLocation(suggestion) {
  // Xử lý cả format cũ (string) và format mới (object)
  const locationText = typeof suggestion === 'string' ? suggestion : suggestion.text
  searchForm.location = locationText
  locationSuggestions.value = []
  isLocationSuggestionsVisible.value = false
  clearTimeout(hideSuggestionsDelayTimer)
}

function getSuggestionIcon(suggestion) {
  if (typeof suggestion === 'string') {
    return 'bi bi-geo-alt text-muted'
  }
  return suggestion.type === 'hotel' 
    ? 'bi bi-building text-primary' 
    : 'bi bi-geo-alt text-success'
}

function getSuggestionDisplayText(suggestion) {
  if (typeof suggestion === 'string') {
    return suggestion
  }
  return suggestion.displayText || suggestion.text
}

function hideLocationSuggestionsWithDelay() {
  hideSuggestionsDelayTimer = setTimeout(() => {
    isLocationSuggestionsVisible.value = false
  }, 200)
}

function validateSearchForm() {
  searchSubmissionError.value = null
  const errors = []
  if (!searchForm.startDate) errors.push('Check-in date is required.')
  if (!searchForm.endDate) errors.push('Check-out date is required.')
  if (searchForm.startDate && searchForm.endDate) {
    const start = parseISO(searchForm.startDate)
    const end = parseISO(searchForm.endDate)
    if (isBefore(end, start) || isEqual(end, start)) {
      errors.push('Check-out date must be after Check-in date.')
    }
  }
  if (!searchForm.numberOfGuests) errors.push('Number of guests is required.')
  else {
    const guests = parseInt(searchForm.numberOfGuests)
    if (isNaN(guests) || guests <= 0) errors.push('Please enter a valid number of guests.')
  }
  if (errors.length > 0 && notificationToast.value) {
    notificationToast.value.show(errors[0], 'error')
    return false
  }
  return true
}

async function submitSearchForm() {
  if (!validateSearchForm()) return
  isSubmittingSearchForm.value = true
  searchSubmissionError.value = null
  if (bookingStore.roomsError) bookingStore.roomsError = null

  const criteria = {
    startDate: searchForm.startDate,
    endDate: searchForm.endDate,
    numberOfGuests: parseInt(searchForm.numberOfGuests)
  }

  try {
    await bookingStore.setSearchCriteriaAndFetchRooms(criteria)
    if (bookingStore.roomsError) {
      notificationToast.value.show(`Search failed: ${bookingStore.roomsError}`, 'error')
    } else {
      router.push('/BookingProcess')
    }
  } catch (err) {
    console.error('Error during search submission:', err)
    searchSubmissionError.value = 'An unexpected error occurred. Please try again.'
    notificationToast.value.show(searchSubmissionError.value, 'error')
  } finally {
    isSubmittingSearchForm.value = false
  }
}

async function loadFeaturedHotels() {
  isLoadingFeaturedHotels.value = true
  featuredHotelsError.value = null
  try {
    const response = await hotelService.getFeaturedHotels()
    featuredHotels.value = response.data?.data || response.data || []
  } catch (err) {
    console.error('Error loading featured hotels:', err)
    featuredHotelsError.value = 'Could not load featured properties. Please try again later.'
    featuredHotels.value = []
  } finally {
    isLoadingFeaturedHotels.value = false
  }
}

function goToBookingPage() {
  router.push('/BookingProcess')
}

function goToRegisterPage() {
  router.push('/SignUp')
}

onMounted(() => {
  // Áp dụng SEO cho trang chủ
  applySEOPreset('home')
  
  // Tạo structured data cho trang chủ với featured hotels
  const homepageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ChillChill Hotel",
    "description": "Hệ thống đặt phòng khách sạn trực tuyến hàng đầu Việt Nam",
    "url": "https://chillchill-hotel.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://chillchill-hotel.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ChillChill Hotel",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chillchill-hotel.com/images/logo.png"
      }
    }
  }
  
  updateStructuredData(homepageStructuredData)
  
  loadFeaturedHotels()
})

onBeforeUnmount(() => {
  clearTimeout(locationSuggestionDebounceTimer)
  clearTimeout(hideSuggestionsDelayTimer)
})
</script>

<style scoped>
.home-page {
  overflow-x: hidden;
}

.hero .container {
  position: relative;
  z-index: 1;
}

.section-title {
  font-weight: 600;
  border-bottom: 2px solid #FF5A5F;
  padding-bottom: 0.25rem;
}

.search-bar-custom {
  border-radius: 0.75rem;
  padding: 1.25rem 1rem;
}

.search-bar-custom .form-control,
.search-bar-custom .form-select,
.search-bar-custom .btn {
  height: 50px;
  font-size: 1rem;
  border: 1px solid #ced4da;
}

/* Bỏ viền xanh bootstrap khi focus */
.search-bar-custom .form-control:focus,
.search-bar-custom .form-select:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: #ced4da !important; /* giữ border xám nhạt */
}

.search-bar-custom .input-group .form-control {
  border-left: none;
  border-radius: 0 0.375rem 0.375rem 0;
}

.search-bar-custom .input-group .form-control:focus {
  border-left: none;
  border-color: #FF5A5F;
}

.search-bar-custom .btn-primary {
  background-color: #FF5A5F;
  border-color: #FF5A5F;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.search-bar-custom .btn-primary:hover {
  background-color: #E04347;
  border-color: #E04347;
}

.input-icon-calendar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #484848;
  font-size: 1.2rem;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white !important;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 9999 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 2px;
  min-height: 40px; /* Để debug */
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333 !important;
  text-align: left;
  border-bottom: 1px solid #f8f9fa;
  background: white;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #f8f9fa !important;
  transform: translateX(2px);
}

.suggestion-item .suggestion-text {
  font-weight: 500;
  color: #333 !important;
  margin-bottom: 2px;
}

.suggestion-item small {
  font-size: 0.75rem;
  color: #6c757d !important;
}

.suggestion-item i {
  font-size: 1.1rem;
  width: 20px;
  flex-shrink: 0;
}

.featured h2 {
  text-align: center;
  font-weight: 600;
}
.search-bar-custom .input-group-text {
  background-color: #fff;
  border-right: none;
  border-radius: 0.375rem 0 0 0.375rem;
  padding: 0 0.9rem;
  border: 1px solid #ced4da;
  border-right: none;
}

/* Focus state cho input group */
.search-bar-custom .input-group:focus-within .input-group-text {
  outline: none !important;
  box-shadow: none !important;
  border-color: #ced4da !important;
  background-color: #fff !important;
}

:deep(.custom-datepicker-input input) {
  border: none;
}
</style>
