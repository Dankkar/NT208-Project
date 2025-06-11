--- START OF FILE Ratings.vue (Improved UI) ---
<template>
  <div class="ratings-page">
    <Layout title="Hotels">
      <main class="page-content container">
        <!-- Sort Controls -->
        <div class="sort-controls-wrapper d-flex justify-content-end align-items-center mb-4">
          <label for="sort" class="me-2 text-muted sort-label">Sort by:</label>
          <select id="sort" v-model="sortKey" @change="applySort" class="form-select form-select-sm w-auto shadow-sm custom-select">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>

        <!-- Hotel List -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary-theme" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Loading hotels, please wait...</p>
        </div>

        <div v-else-if="hotels.length" class="row g-4">
          <div v-for="hotel in hotels" :key="hotel.MaKS" class="col-md-6 col-lg-4">
            <HotelCard :hotel="hotel" />
          </div>
        </div>
        <div v-else class="text-center py-5">
          <i class="icon-search-x display-1 text-muted mb-3"></i>
          <h3 class="text-muted">No Hotels Found</h3>
          <p class="lead text-muted">Sorry, no hotels matched your criteria. Try adjusting your search or sort options.</p>
        </div>

        <!-- Pagination -->
        <nav aria-label="Page navigation" v-if="!loading && totalPages > 1" class="mt-5 pt-3">
          <ul class="pagination justify-content-center custom-pagination">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="prevPage" aria-label="Previous">
                <span aria-hidden="true">«</span>
              </a>
            </li>
            <li
              v-for="page in paginationRange"
              :key="page.name + (page.isDisabled ? '-dot' : '')"
              class="page-item"
              :class="{ active: page.isActive, disabled: page.isDisabled }"
            >
              <a v-if="!page.isDisabled" class="page-link" href="#" @click.prevent="goToPage(page.name)">{{ page.name }}</a>
              <span v-else class="page-link page-dots">...</span>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="nextPage" aria-label="Next">
                <span aria-hidden="true">»</span>
              </a>
            </li>
          </ul>
        </nav>
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
const itemsPerPage = ref(6);
const totalPages = ref(1);
const totalItems = ref(0);

const sortKey = ref('rating_desc');
const sortOptions = [
  { value: 'rating_desc', text: 'Rating: High to Low' },
  { value: 'rating_asc', text: 'Rating: Low to High' },
  { value: 'price_asc', text: 'Price: Low to High' },
  { value: 'price_desc', text: 'Price: High to Low' },
  { value: 'name_asc', text: 'Name: A to Z' },
  { value: 'name_desc', text: 'Name: Z to A' },
];

// Fetch hotels with pagination and sorting
async function fetchHotels(page = 1, sort = sortKey.value) {
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
    
    const response = await axios.get(`/api/hotels`, {
      params: {
        page,
        limit: itemsPerPage.value,
        sortBy,
        sortOrder
      }
    });
    
    hotels.value = response.data.data;
    totalItems.value = response.data.pagination.total;
    totalPages.value = response.data.pagination.totalPages;
    currentPage.value = response.data.pagination.page;
  } catch (error) {
    console.error('Error fetching hotels:', error);
  } finally {
    loading.value = false;
  }
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
  fetchHotels(1);
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
.ratings-page {
  font-family: 'Poppins', sans-serif; /* Nếu đã import Poppins */
  background-color: var(--page-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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