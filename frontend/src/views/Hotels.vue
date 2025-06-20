--- START OF FILE Ratings.vue (Improved UI) ---
<template>
  <div class="hotels-page">
    <Layout title="Khách Sạn">
      <main class="page-content container-fluid">
        <div class="row">
          <!-- Mobile Filter Toggle Button -->
          <div class="col-12 d-md-none mb-3">
            <button 
              @click="toggleMobileFilter" 
              class="btn btn-outline-primary w-100 filter-toggle-btn"
              :class="{ active: showMobileFilter }"
            >
              <i class="bi bi-funnel-fill me-2"></i>
              {{ showMobileFilter ? 'Ẩn Bộ Lọc' : 'Hiện Bộ Lọc' }}
              <i :class="showMobileFilter ? 'bi bi-chevron-up' : 'bi bi-chevron-down'" class="ms-2"></i>
            </button>
          </div>

          <!-- Filter Sidebar -->
          <div class="col-lg-3 col-md-4" :class="{ 'd-none d-md-block': !showMobileFilter }">
            <div 
              class="filter-sidebar" 
              :class="{ 'mobile-filter-open': showMobileFilter }"
            >
              <div class="filter-header">
                <h5><i class="bi bi-funnel me-2"></i>Bộ Lọc</h5>
                <div class="filter-header-buttons">
                  <button @click="clearAllFilters" class="btn btn-sm btn-outline-secondary me-2">
                    <i class="bi bi-arrow-clockwise me-1"></i>Xóa tất cả
                  </button>
                  <button @click="closeMobileFilter" class="btn btn-sm btn-outline-primary d-md-none">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              <!-- Price Range Filter -->
              <div class="filter-section">
                <h6 class="filter-title">
                  <i class="bi bi-currency-dollar me-2"></i>Khoảng Giá
                </h6>
                <div class="price-range">
                  <div class="row g-2">
                    <div class="col-6">
                      <input 
                        v-model="filters.priceMin" 
                        type="number" 
                        class="form-control form-control-sm" 
                        placeholder="Từ"
                        @change="applyFiltersAndCloseMobile"
                      />
                    </div>
                    <div class="col-6">
                      <input 
                        v-model="filters.priceMax" 
                        type="number" 
                        class="form-control form-control-sm" 
                        placeholder="Đến"
                        @change="applyFiltersAndCloseMobile"
                      />
                    </div>
                  </div>
                  <div class="price-suggestions mt-2">
                    <button 
                      v-for="range in priceRanges" 
                      :key="range.label"
                      @click="setPriceRange(range.min, range.max)"
                      class="btn btn-sm btn-outline-primary me-1 mb-1"
                    >
                      {{ range.label }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Star Rating Filter -->
              <div class="filter-section">
                <h6 class="filter-title">
                  <i class="bi bi-star me-2"></i>Hạng Sao
                </h6>
                <div class="star-filter">
                  <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="form-check">
                    <input 
                      v-model="filters.starRatings" 
                      :value="star"
                      type="checkbox" 
                      class="form-check-input" 
                      :id="`star-${star}`"
                      @change="applyFiltersAndCloseMobile"
                    />
                    <label :for="`star-${star}`" class="form-check-label">
                      <div class="stars">
                        <i v-for="i in Math.min(star, 5)" :key="i" class="bi bi-star-fill text-warning"></i>
                        <i v-for="i in Math.max(5 - star, 0)" :key="`empty-${i}`" class="bi bi-star text-muted"></i>
                      </div>
                      <span class="ms-2">{{ star }} sao trở lên</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Hotel Type Filter -->
              <div class="filter-section">
                <h6 class="filter-title">
                  <i class="bi bi-building me-2"></i>Loại Hình
                </h6>
                <div class="hotel-type-filter">
                  <div v-for="type in hotelTypes" :key="type" class="form-check">
                    <input 
                      v-model="filters.hotelTypes" 
                      :value="type"
                      type="checkbox" 
                      class="form-check-input" 
                      :id="`type-${type}`"
                      @change="applyFilters"
                    />
                    <label :for="`type-${type}`" class="form-check-label">
                      {{ type }}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Amenities Filter -->
              <div class="filter-section">
                <h6 class="filter-title">
                  <i class="bi bi-gear me-2"></i>Tiện Nghi
                </h6>
                <div class="amenities-filter">
                  <div v-for="amenity in amenities" :key="amenity.value" class="form-check">
                    <input 
                      v-model="filters.amenities" 
                      :value="amenity.value"
                      type="checkbox" 
                      class="form-check-input" 
                      :id="`amenity-${amenity.value}`"
                      @change="applyFilters"
                    />
                    <label :for="`amenity-${amenity.value}`" class="form-check-label">
                      <i :class="amenity.icon" class="me-1"></i>
                      {{ amenity.label }}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Location Filter -->
              <div class="filter-section">
                <h6 class="filter-title">
                  <i class="bi bi-geo-alt me-2"></i>Địa Điểm
                </h6>
                <div class="location-filter">
                  <input 
                    v-model="filters.location" 
                    type="text" 
                    class="form-control form-control-sm" 
                    placeholder="Nhập địa điểm..."
                    @input="debounceLocationFilter"
                  />
                  <div v-if="locationSuggestions.length > 0" class="location-suggestions mt-2">
                    <div 
                      v-for="suggestion in locationSuggestions" 
                      :key="suggestion"
                      @click="selectLocation(suggestion)"
                      class="suggestion-item"
                    >
                      {{ suggestion }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Guest Rating Filter -->
              <div class="filter-section">
                <h6 class="filter-title">
                  <i class="bi bi-heart me-2"></i>Đánh Giá Khách
                </h6>
                <div class="guest-rating-filter">
                  <div v-for="rating in guestRatings" :key="rating.value" class="form-check">
                    <input 
                      v-model="filters.guestRating" 
                      :value="rating.value"
                      type="radio" 
                      class="form-check-input" 
                      :id="`rating-${rating.value}`"
                      @change="applyFilters"
                    />
                    <label :for="`rating-${rating.value}`" class="form-check-label">
                      {{ rating.label }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile Filter Overlay -->
          <div 
            v-if="showMobileFilter" 
            class="mobile-filter-overlay d-md-none"
            @click="toggleMobileFilter"
          ></div>

          <!-- Hotels List -->
          <div class="col-lg-9 col-md-8 col-12">
            <!-- Results Header -->
            <div class="results-header d-flex justify-content-between align-items-center mb-4">
              <div class="results-info">
                <h4>Kết Quả Tìm Kiếm</h4>
                <p class="text-muted mb-0">
                  {{ totalItems }} khách sạn được tìm thấy
                  <span v-if="hasActiveFilters" class="filter-indicator">
                    (đã áp dụng bộ lọc)
                  </span>
                </p>
              </div>

              <!-- Sort Controls -->
              <div class="sort-controls d-flex align-items-center">
                <label for="sort" class="me-2 text-muted">Sắp xếp:</label>
                <select 
                  id="sort" 
                  v-model="sortKey" 
                  @change="applySort" 
                  class="form-select form-select-sm w-auto"
                >
                  <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.text }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Active Filters Display -->
            <div v-if="hasActiveFilters" class="active-filters mb-3">
              <h6>Bộ lọc đang áp dụng:</h6>
              <div class="filter-tags">
                <span v-if="filters.priceMin || filters.priceMax" class="badge bg-primary me-2">
                  Giá: {{ formatPrice(filters.priceMin) }} - {{ formatPrice(filters.priceMax) }}
                  <i @click="clearPriceFilter" class="bi bi-x ms-1" style="cursor: pointer;"></i>
                </span>
                
                <span v-for="star in filters.starRatings" :key="`star-tag-${star}`" class="badge bg-warning me-2">
                  {{ star }} sao
                  <i @click="removeStarFilter(star)" class="bi bi-x ms-1" style="cursor: pointer;"></i>
                </span>
                
                <span v-for="type in filters.hotelTypes" :key="`type-tag-${type}`" class="badge bg-info me-2">
                  {{ type }}
                  <i @click="removeHotelTypeFilter(type)" class="bi bi-x ms-1" style="cursor: pointer;"></i>
                </span>
                
                <span v-for="amenity in filters.amenities" :key="`amenity-tag-${amenity}`" class="badge bg-success me-2">
                  {{ getAmenityLabel(amenity) }}
                  <i @click="removeAmenityFilter(amenity)" class="bi bi-x ms-1" style="cursor: pointer;"></i>
                </span>
                
                <span v-if="filters.location" class="badge bg-secondary me-2">
                  {{ filters.location }}
                  <i @click="clearLocationFilter" class="bi bi-x ms-1" style="cursor: pointer;"></i>
                </span>
                
                <span v-if="filters.guestRating" class="badge bg-danger me-2">
                  {{ getGuestRatingLabel(filters.guestRating) }}
                  <i @click="clearGuestRatingFilter" class="bi bi-x ms-1" style="cursor: pointer;"></i>
                </span>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Đang tải...</span>
              </div>
              <p class="mt-3 text-muted">Đang tìm kiếm khách sạn phù hợp...</p>
            </div>

            <!-- Hotels Grid -->
            <div v-else-if="hotels.length > 0" class="row g-4">
              <div v-for="hotel in hotels" :key="hotel.MaKS" class="col-xl-4 col-lg-6">
                <HotelCard :hotel="hotel" />
              </div>
            </div>

            <!-- No Results -->
            <div v-else class="text-center py-5">
              <i class="bi bi-search-x display-1 text-muted mb-3"></i>
              <h3 class="text-muted">Không Tìm Thấy Khách Sạn</h3>
              <p class="lead text-muted">
                Xin lỗi, không có khách sạn nào phù hợp với tiêu chí của bạn.
              </p>
              <button @click="clearAllFilters" class="btn btn-primary">
                <i class="bi bi-arrow-clockwise me-1"></i>Xóa bộ lọc và thử lại
              </button>
            </div>

            <!-- Pagination -->
            <nav v-if="!loading && totalPages > 1" aria-label="Phân trang" class="mt-5">
              <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <a class="page-link" href="#" @click.prevent="prevPage">
                    <i class="bi bi-chevron-left"></i>
                  </a>
                </li>
                
                <li
                  v-for="page in paginationRange"
                  :key="page.name + (page.isDisabled ? '-dot' : '')"
                  class="page-item"
                  :class="{ active: page.isActive, disabled: page.isDisabled }"
                >
                  <a v-if="!page.isDisabled" class="page-link" href="#" @click.prevent="goToPage(page.name)">
                    {{ page.name }}
                  </a>
                  <span v-else class="page-link">...</span>
                </li>
                
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <a class="page-link" href="#" @click.prevent="nextPage">
                    <i class="bi bi-chevron-right"></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </main>
    </Layout>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Layout from '../components/Layout.vue';
import HotelCard from '../components/HotelCard.vue';
import axios from 'axios';

const hotels = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(9);
const totalPages = ref(1);
const totalItems = ref(0);

const sortKey = ref('rating_desc');
const sortOptions = [
  { value: 'rating_desc', text: 'Đánh giá: Cao đến Thấp' },
  { value: 'rating_asc', text: 'Đánh giá: Thấp đến Cao' },
  { value: 'price_asc', text: 'Giá: Thấp đến Cao' },
  { value: 'price_desc', text: 'Giá: Cao đến Thấp' },
  { value: 'name_asc', text: 'Tên: A đến Z' },
  { value: 'name_desc', text: 'Tên: Z đến A' },
];

// Filter states
const filters = ref({
  priceMin: null,
  priceMax: null,
  starRatings: [],
  hotelTypes: [],
  amenities: [],
  location: '',
  guestRating: null
});

// Filter options
const priceRanges = ref([
  { label: 'Dưới 500K', min: 0, max: 500000 },
  { label: '500K - 1M', min: 500000, max: 1000000 },
  { label: '1M - 2M', min: 1000000, max: 2000000 },
  { label: '2M - 5M', min: 2000000, max: 5000000 },
  { label: 'Trên 5M', min: 5000000, max: null }
]);

const hotelTypes = ref([
  'Khách sạn',
  'Resort',
  'Villa',
  'Homestay',
  'Khách sạn boutique',
  'Nhà nghỉ',
  'Motel'
]);

const amenities = ref([
  { value: 'wifi', label: 'WiFi miễn phí', icon: 'bi bi-wifi' },
  { value: 'pool', label: 'Hồ bơi', icon: 'bi bi-water' },
  { value: 'gym', label: 'Phòng gym', icon: 'bi bi-dumbbell' },
  { value: 'spa', label: 'Spa', icon: 'bi bi-flower1' },
  { value: 'restaurant', label: 'Nhà hàng', icon: 'bi bi-cup-hot' },
  { value: 'parking', label: 'Bãi đậu xe', icon: 'bi bi-car-front' },
  { value: 'ac', label: 'Điều hòa', icon: 'bi bi-snow' },
  { value: 'elevator', label: 'Thang máy', icon: 'bi bi-arrow-up-square' },
  { value: 'bar', label: 'Quầy bar', icon: 'bi bi-cup-straw' },
  { value: 'beach', label: 'Gần bãi biển', icon: 'bi bi-water' }
]);

const guestRatings = ref([
  { value: '', label: 'Tất cả' },
  { value: '4.5+', label: 'Xuất sắc (4.5+ sao)' },
  { value: '4+', label: 'Rất tốt (4+ sao)' },
  { value: '3.5+', label: 'Tốt (3.5+ sao)' },
  { value: '3+', label: 'Khá (3+ sao)' }
]);

const locationSuggestions = ref([]);
let locationFilterTimeout = null;

// Mobile filter state
const showMobileFilter = ref(false);

// Toggle mobile filter
function toggleMobileFilter() {
  showMobileFilter.value = !showMobileFilter.value;
}

// Close mobile filter
function closeMobileFilter() {
  showMobileFilter.value = false;
}

// Close mobile filter when applying filters
function applyFiltersAndCloseMobile() {
  applyFilters();
  // Auto close on mobile after applying filter
  if (window.innerWidth < 768) {
    setTimeout(() => {
      closeMobileFilter();
    }, 300);
  }
}

// Computed properties
const hasActiveFilters = computed(() => {
  return filters.value.priceMin || filters.value.priceMax ||
         filters.value.starRatings.length > 0 ||
         filters.value.hotelTypes.length > 0 ||
         filters.value.amenities.length > 0 ||
         filters.value.location ||
         filters.value.guestRating;
});

// Fetch hotels with pagination, sorting and filtering
async function fetchHotels(page = 1, sort = sortKey.value, applyFilters = true) {
  try {
    loading.value = true;
    
    // Map frontend sort values to backend parameters
    let sortBy, sortOrder;
    switch (sort) {
      case 'rating_desc':
        sortBy = 'rating';
        sortOrder = 'desc';
        break;
      case 'rating_asc':
        sortBy = 'rating';
        sortOrder = 'asc';
        break;
      case 'price_asc':
        sortBy = 'price';
        sortOrder = 'asc';
        break;
      case 'price_desc':
        sortBy = 'price';
        sortOrder = 'desc';
        break;
      case 'name_asc':
        sortBy = 'name';
        sortOrder = 'asc';
        break;
      case 'name_desc':
        sortBy = 'name';
        sortOrder = 'desc';
        break;
      default:
        sortBy = 'rating';
        sortOrder = 'desc';
    }

    // Build filter parameters
    const params = {
      page,
      limit: itemsPerPage.value,
      sortBy,
      sortOrder
    };

    if (applyFilters) {
      if (filters.value.priceMin) params.priceMin = filters.value.priceMin;
      if (filters.value.priceMax) params.priceMax = filters.value.priceMax;
      if (filters.value.starRatings.length > 0) params.starRatings = filters.value.starRatings.join(',');
      if (filters.value.hotelTypes.length > 0) params.hotelTypes = filters.value.hotelTypes.join(',');
      if (filters.value.amenities.length > 0) params.amenities = filters.value.amenities.join(',');
      if (filters.value.location) params.location = filters.value.location;
      if (filters.value.guestRating) params.guestRating = filters.value.guestRating;
    }
    
    const response = await axios.get(`/api/hotels`, { params });
    

    
    hotels.value = response.data.data;
    totalItems.value = response.data.pagination.total;
    totalPages.value = response.data.pagination.totalPages;
    currentPage.value = response.data.pagination.page;
  } catch (error) {
    console.error('Error fetching hotels:', error);
    hotels.value = [];
    totalItems.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

// Filter functions
function applyFilters() {
  fetchHotels(1, sortKey.value, true);
}

function clearAllFilters() {
  filters.value = {
    priceMin: null,
    priceMax: null,
    starRatings: [],
    hotelTypes: [],
    amenities: [],
    location: '',
    guestRating: null
  };
  locationSuggestions.value = [];
  fetchHotels(1, sortKey.value, false);
}

function setPriceRange(min, max) {
  filters.value.priceMin = min;
  filters.value.priceMax = max;
  applyFiltersAndCloseMobile();
}

function clearPriceFilter() {
  filters.value.priceMin = null;
  filters.value.priceMax = null;
  applyFilters();
}

function removeStarFilter(star) {
  const index = filters.value.starRatings.indexOf(star);
  if (index > -1) {
    filters.value.starRatings.splice(index, 1);
    applyFilters();
  }
}

function removeHotelTypeFilter(type) {
  const index = filters.value.hotelTypes.indexOf(type);
  if (index > -1) {
    filters.value.hotelTypes.splice(index, 1);
    applyFilters();
  }
}

function removeAmenityFilter(amenity) {
  const index = filters.value.amenities.indexOf(amenity);
  if (index > -1) {
    filters.value.amenities.splice(index, 1);
    applyFilters();
  }
}

function clearLocationFilter() {
  filters.value.location = '';
  locationSuggestions.value = [];
  applyFilters();
}

function clearGuestRatingFilter() {
  filters.value.guestRating = null;
  applyFilters();
}

// Location suggestion functions
function debounceLocationFilter() {
  if (locationFilterTimeout) {
    clearTimeout(locationFilterTimeout);
  }
  locationFilterTimeout = setTimeout(() => {
    fetchLocationSuggestions();
  }, 300);
}

async function fetchLocationSuggestions() {
  if (!filters.value.location || filters.value.location.length < 2) {
    locationSuggestions.value = [];
    return;
  }

  try {
    const response = await axios.get('/api/hotels/suggest-locations', {
      params: { query: filters.value.location }
    });
    locationSuggestions.value = response.data.suggestions || [];
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    locationSuggestions.value = [];
  }
}

function selectLocation(suggestion) {
  filters.value.location = suggestion;
  locationSuggestions.value = [];
  applyFilters();
}

// Utility functions
function formatPrice(price) {
  if (!price) return '0';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

function getAmenityLabel(amenityValue) {
  const amenity = amenities.value.find(a => a.value === amenityValue);
  return amenity ? amenity.label : amenityValue;
}

function getGuestRatingLabel(ratingValue) {
  const rating = guestRatings.value.find(r => r.value === ratingValue);
  return rating ? rating.label : ratingValue;
}

// Pagination range computation
const paginationRange = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  if (total <= 1) {
    if (total === 1) return [{ name: 1, isActive: true, isDisabled: false }];
    return [];
  }
  
  range.push(1);
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    if (!range.includes(i)) range.push(i);
  }
  if (!range.includes(total)) range.push(total);

  range.sort((a,b) => a-b);

  range.forEach((i) => {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push({ name: l + 1, isActive: (l + 1) === current, isDisabled: false });
      } else if (i - l > 1) {
        rangeWithDots.push({ name: '...', isActive: false, isDisabled: true });
      }
    }
    rangeWithDots.push({ name: i, isActive: i === current, isDisabled: false });
    l = i;
  });
  return rangeWithDots;
});

// Pagination handlers
function prevPage() {
  if (currentPage.value > 1) {
    fetchHotels(currentPage.value - 1, sortKey.value);
    window.scrollTo(0, 0);
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    fetchHotels(currentPage.value + 1, sortKey.value);
    window.scrollTo(0, 0);
  }
}

function goToPage(pageNumber) {
  if (typeof pageNumber === 'number' && pageNumber >= 1 && pageNumber <= totalPages.value) {
    fetchHotels(pageNumber, sortKey.value);
    window.scrollTo(0, 0);
  }
}

function applySort() {
  // Fetch new data with the selected sorting
  fetchHotels(1, sortKey.value);
}

onMounted(() => {
  fetchHotels(1, sortKey.value, false);
});
</script>

<style scoped>
/* Import Google Font (cần thêm link vào index.html hoặc import trong main.js/main.css)
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
*/

:root {
  --primary-theme-color: #0077b6; /* Một màu xanh dương đẹp */
  --secondary-theme-color: #00b4d8;
  --text-dark: #212529;
  --text-muted-light: #adb5bd;
  --star-color: #ffc107; /* Màu vàng cho sao */
  --card-bg: #ffffff;
  --page-bg: #f8f9fa; /* Nền trang hơi xám nhẹ */
}

/* Apply Poppins font globally if imported, or fallback */
.hotels-page {
  font-family: 'Poppins', sans-serif;
  background-color: var(--page-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Mobile Filter Toggle Button */
.filter-toggle-btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.filter-toggle-btn.active {
  background-color: var(--primary-theme-color);
  border-color: var(--primary-theme-color);
  color: white;
}

/* Mobile Filter Overlay */
.mobile-filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

/* Filter Sidebar Styles */
.filter-sidebar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  transition: transform 0.3s ease;
}

/* Mobile Filter Sidebar */
@media (max-width: 767.98px) {
  .filter-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 85%;
    max-width: 320px;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    z-index: 1050;
    transform: translateX(-100%);
    box-shadow: 2px 0 15px rgba(0,0,0,0.2);
  }

  .filter-sidebar.mobile-filter-open {
    transform: translateX(0);
  }

  .filter-header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.filter-header-buttons {
  display: flex;
  align-items: center;
}

.filter-header h5 {
  margin: 0;
  color: var(--text-dark);
  font-weight: 600;
}

.filter-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f3f4;
}

.filter-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.price-suggestions .btn {
  font-size: 11px;
  padding: 4px 8px;
}

.stars {
  display: inline-flex;
  align-items: center;
}

.form-check-label {
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.location-suggestions {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  max-height: 150px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  border-bottom: 1px solid #f1f3f4;
}

.suggestion-item:hover {
  background-color: #f8f9fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

/* Results Header */
.results-header h4 {
  color: var(--text-dark);
  margin-bottom: 5px;
  font-weight: 600;
}

.filter-indicator {
  color: var(--primary-theme-color);
  font-weight: 500;
}

/* Active Filters */
.active-filters {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid var(--primary-theme-color);
}

.active-filters h6 {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--text-dark);
  font-weight: 600;
}

.filter-tags .badge {
  font-size: 12px;
  padding: 6px 10px;
  margin-bottom: 5px;
}

.filter-tags .badge i {
  margin-left: 5px;
  font-size: 10px;
}

.filter-tags .badge i:hover {
  opacity: 0.7;
}

/* Responsive Results Header */
@media (max-width: 767.98px) {
  .results-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 15px;
  }

  .sort-controls {
    width: 100%;
    justify-content: space-between;
  }

  .sort-controls select {
    min-width: 180px;
  }
}

/* Responsive Hotels Grid */
@media (max-width: 575.98px) {
  .row.g-4 .col-xl-4,
  .row.g-4 .col-lg-6 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

/* Responsive Active Filters */
@media (max-width: 575.98px) {
  .active-filters {
    padding: 12px;
  }

  .filter-tags .badge {
    font-size: 11px;
    padding: 4px 8px;
    margin-bottom: 8px;
  }
}

.page-content {
  padding-top: 6rem; /* Khoảng trống dưới navbar fixed */
  padding-bottom: 3rem;
  flex-grow: 1;
}

.page-header .page-title {
  color: var(--text-dark);
  position: relative;
  padding-bottom: 0.5rem;
}
.page-header .page-title::after {
  content: '';
  display: block;
  width: 80px;
  height: 4px;
  background-color: var(--primary-theme-color);
  margin: 0.75rem auto 0;
  border-radius: 2px;
}

.page-header .lead {
  color: #5a6774;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.sort-label {
  font-weight: 500;
}

.custom-select {
  border-radius: 0.375rem; /* Bootstrap default is 0.25rem */
  border-color: #ced4da;
}
.custom-select:focus {
  border-color: var(--primary-theme-color);
  box-shadow: 0 0 0 0.25rem rgba(0, 119, 182, 0.25);
}

.text-primary-theme {
  color: var(--primary-theme-color) !important;
}

.hotel-card {
  background-color: var(--card-bg);
  border: none; /* Bỏ border mặc định của Bootstrap */
  border-radius: 0.75rem; /* Bo góc mềm mại hơn */
  overflow: hidden; /* Để img-top bo góc theo card */
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}
.hotel-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12) !important;
}

.hotel-card .img-wrapper {
  height: 220px; /* Chiều cao cố định cho ảnh */
  overflow: hidden;
}
.hotel-card .card-img-top {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Đảm bảo ảnh lấp đầy, không bị méo */
  transition: transform 0.4s ease;
}
.hotel-card:hover .card-img-top {
  transform: scale(1.05); /* Hiệu ứng zoom nhẹ khi hover */
}

.hotel-card .card-body {
  padding: 1.25rem;
}

.hotel-card .card-title {
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.hotel-card .location-text {
  color: #6c757d;
  font-size: 0.85rem;
}
/* Icon giả lập nếu không dùng thư viện */
.icon-map-pin::before { content: "📍"; /* Hoặc dùng SVG/Font Icon */}
.icon-search-x::before { content: "🔍"; /* Hoặc dùng SVG/Font Icon */}


.hotel-rating {
  display: flex;
  align-items: center;
  color: #495057;
  font-size: 0.9rem;
}
.hotel-rating .rating-value {
  color: var(--text-dark);
  font-size: 1rem;
  margin-right: 0.25rem;
}
.hotel-rating .rating-star {
  color: var(--star-color);
  font-size: 1rem; /* Kích thước cho sao */
  line-height: 1;
}

.hotel-price {
  color: var(--primary-theme-color);
  font-size: 1.1rem;
}
.hotel-price .text-muted {
    font-size: 0.85rem;
}

.btn-primary-theme {
  background-color: var(--primary-theme-color);
  border-color: var(--primary-theme-color);
  color: black;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.btn-primary-theme:hover {
  background-color: #005f8e; /* Màu đậm hơn khi hover */
  border-color: #005f8e;
}
.view-details-btn {
    min-width: 110px; /*Đảm bảo nút có độ rộng nhất định*/
}

/* Custom Pagination */
.custom-pagination .page-item .page-link {
  color: var(--primary-theme-color);
  border-radius: 0.375rem; /* Bo tròn các nút */
  margin: 0 3px; /* Khoảng cách giữa các nút */
  border: 1px solid #dee2e6; /* Border nhẹ */
  transition: all 0.2s ease;
}
.custom-pagination .page-item.active .page-link {
  background-color: var(--primary-theme-color);
  border-color: var(--primary-theme-color);
  color: #0077b6;
  box-shadow: 0 2px 5px rgba(0, 119, 182, 0.3);
}
.custom-pagination .page-item:not(.active) .page-link:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
}
.custom-pagination .page-item.disabled .page-link {
  color: #6c757d;
  background-color: transparent;
  border-color: #dee2e6;
}
.custom-pagination .page-link.page-dots {
    color: #6c757d;
    background-color: transparent;
    border: none;
    pointer-events: none;
}

.no-hotels-message .display-1 {
    font-size: 5rem; /* Hoặc kích thước phù hợp */
}

/* Thêm CSS cho các icon giả lập nếu không dùng thư viện icon */
.icon-map-pin, .icon-search-x {
    display: inline-block;
    font-style: normal; /* Quan trọng nếu bạn định nghĩa content cho pseudo-element */
}
</style>
--- END OF FILE Ratings.vue (Improved UI) ---