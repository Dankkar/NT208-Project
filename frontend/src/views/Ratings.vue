--- START OF FILE Ratings.vue (Improved UI) ---
<template>
  <div class="ratings-page">
    <Layout title="Ratings and Reviews">
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

      <div v-else-if="paginatedHotels.length" class="row g-4">
        <div v-for="hotel in paginatedHotels" :key="hotel.id" class="col-md-6 col-lg-4 d-flex align-items-stretch">
          <div class="card hotel-card h-100 w-100 shadow-sm">
            <div class="img-wrapper">
              <img :src="hotel.image || defaultImage" class="card-img-top" :alt="hotel.name">
            </div>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ hotel.name }}</h5>
              <p class="card-text text-muted small mb-2 location-text">
                <i class="icon-map-pin me-1"></i>{{ hotel.location }}
              </p>
              <div class="hotel-rating mb-2">
                 <span class="rating-value fw-bold">{{ hotel.rating.toFixed(1) }}</span>
                 <span class="rating-star">★</span>
                 <!-- <span class="text-muted small ms-1">(123 reviews)</span> Optional: review count -->
              </div>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <p class="hotel-price fw-bold mb-0">{{ hotel.price }}<span class="text-muted fw-normal">/night</span></p>
                <a href="#" class="btn btn-primary-theme btn-sm view-details-btn">View Details</a>
              </div>
            </div>
          </div>
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
import defaultHotelImage from '../assets/mountain.jpg';
import Layout from '../components/Layout.vue';
import axios from 'axios';

// Icon imports (Ví dụ - bạn cần setup thư viện icon hoặc dùng SVG)
// import { MapPin, SearchX } from 'lucide-vue-next'; // Ví dụ nếu dùng Lucide Icons

const hotels = ref([]);
const defaultImage = defaultHotelImage;
const loading = ref(true); // Thêm trạng thái loading

const sortKey = ref('rating_desc');
const sortOptions = ref([
  { value: 'rating_desc', text: 'Rating: High to Low' },
  { value: 'rating_asc', text: 'Rating: Low to High' },
  { value: 'price_asc', text: 'Price: Low to High' },
  { value: 'price_desc', text: 'Price: High to Low' },
]);

const currentPage = ref(1);
const itemsPerPage = ref(6);

const sampleHotels = [
  // Giữ nguyên dữ liệu mẫu của bạn
  { id: 1, name: 'Grand Resort Alpha', location: 'City A, Country X', rating: 4.5, price: '$150', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aG90ZWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60' },
  { id: 2, name: 'Beach Hotel Beta', location: 'Beach B, Country Y', rating: 4.2, price: '$220', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aG90ZWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60' },
  { id: 3, name: 'Mountain Inn Gamma', location: 'Mountain C, Country Z', rating: 4.8, price: '$180', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGhvdGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' },
  { id: 4, name: 'City Lights Delta', location: 'City D, Country X', rating: 3.9, price: '$120', image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvdGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' },
  { id: 5, name: 'Lakeside Epsilon', location: 'Lake E, Country Y', rating: 4.6, price: '$250', image: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGhvdGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' },
  { id: 6, name: 'Historic Hotel Zeta', location: 'Old Town F, Country Z', rating: 4.1, price: '$160', image: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fGhvdGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' },
  { id: 7, name: 'Luxury Suites Eta', location: 'Downtown G, Country X', rating: 4.9, price: '$350', image: 'https://images.unsplash.com/photo-1535827841776-24e3548245b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDZ8fGhvdGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' },
  { id: 8, name: 'Cozy Cabin Theta', location: 'Forest H, Country Y', rating: 4.3, price: '$130', image: 'https://images.unsplash.com/photo-1586611292717-f8284e3641ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fGhvdGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' },
];


const sortedHotels = computed(() => {
  const sorted = [...hotels.value];
  switch (sortKey.value) {
    case 'rating_desc':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'rating_asc':
      return sorted.sort((a, b) => a.rating - b.rating);
    case 'price_asc':
      return sorted.sort((a, b) => parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', '')));
    case 'price_desc':
      return sorted.sort((a, b) => parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', '')));
    default:
      return sorted;
  }
});

const totalPages = computed(() => {
  return Math.ceil(sortedHotels.value.length / itemsPerPage.value);
});

const paginatedHotels = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return sortedHotels.value.slice(start, end);
});

// Computed property for pagination range (e.g., 1 2 ... 5 6 7 ... 10 11)
const paginationRange = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 1; // Number of pages to show on each side of the current page
  const range = [];
  const rangeWithDots = [];
  let l;

  if (total <= 1) { // No pagination needed if 0 or 1 page
    if (total === 1) return [{ name: 1, isActive: true, isDisabled: false }];
    return [];
  }
  
  range.push(1);
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    if (!range.includes(i)) range.push(i);
  }
  if (!range.includes(total)) range.push(total);

  range.sort((a,b) => a-b); // Ensure sorted

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


function applySort() {
  currentPage.value = 1;
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo(0, 0); // Cuộn lên đầu trang
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo(0, 0); // Cuộn lên đầu trang
  }
}

function goToPage(pageNumber) {
  if (typeof pageNumber === 'number' && pageNumber >= 1 && pageNumber <= totalPages.value) {
    currentPage.value = pageNumber;
    window.scrollTo(0, 0); // Cuộn lên đầu trang
  }
}

onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    hotels.value = sampleHotels;
    loading.value = false;
  }, 1200); // Giả lập độ trễ mạng lâu hơn chút
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