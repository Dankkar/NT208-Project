<!-- src/pages/RatingDetails.vue -->
<template>
  <Layout title="Rating Details">
    <div class="page-container rating-details-page">
      <div v-if="loading" class="loading-message">Loading...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else class="content-wrapper">
        <h2 v-if="branchName" class="branch-title">{{ branchName }}</h2>

        <!-- Sorting Controls -->
        <div class="controls-container">
          <div class="sort-controls">
            <label for="sort-select">Sort by Stars: </label>
            <select id="sort-select" v-model="currentSortOrder" @change="applySort">
              <option value="desc">Highest to Lowest</option>
              <option value="asc">Lowest to Highest</option>
              <option value="none">Default (None)</option>
            </select>
          </div>
        </div>

        <div class="ratings-list">
          <!-- Sửa v-if và v-for để dùng allRatings vì nó đã được phân trang -->
          <div v-if="allRatings.length === 0 && !loading" class="no-ratings">
            No ratings to display.
          </div>
          <div v-for="(r, index) in allRatings" :key="r.id || index" class="rating-item">
            <div class="rating-left">
              <div class="user-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="60px" height="60px">
                  <path d="M12 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 11.5c-3.31 0-6 2.23-6 5v.5h12v-.5c0-2.77-2.69-5-6-5z"/>
                </svg>
              </div>
              <div class="user-name">{{ r.userName }}</div>
            </div>

            <div class="rating-middle">
              <div class="room-branch-info">
                <span class="room-type">{{ r.room }}</span>
                <span class="branch-name">{{ r.branch }}</span>
              </div>
              <div class="stars">
                <span v-for="n in r.stars" :key="`star-${r.id || index}-${n}`" class="star-icon filled">★</span>
                <span v-for="n in (5 - r.stars)" :key="`empty-star-${r.id || index}-${n}`" class="star-icon empty">☆</span>
              </div>
              <div class="comment">{{ r.comment }}</div>
            </div>

            <div class="rating-right">
              <img :src="r.image" :alt="`${r.userName}'s rating image`" class="rating-image">
            </div>
          </div>
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

      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
// import axios from 'axios'; // Bỏ import axios nếu chỉ dùng mock data
import Layout from '../components/Layout.vue';

const loading = ref(true);
const error = ref(null);
const branchName = ref('');
const allRatings = ref([]); // Sẽ chứa dữ liệu của CHỈ TRANG HIỆN TẠI

// Toàn bộ dữ liệu mock (giống như toàn bộ dữ liệu trên server)
// Chúng ta sẽ không gán trực tiếp vào allRatings.value nữa
const fullMockDataSource = [
  { id: 1, userName: 'Mr Hieu', room: 'Deluxe Room', branch: 'Da Nang Branch', stars: 5, comment: 'Fantastic stay, exceeded all expectations. Staff was amazing!', image: '/images/alien-no-way.png' },
  { id: 2, userName: 'Ms. Lan', room: 'Standard Room', branch: 'Da Nang Branch', stars: 3, comment: 'It was okay for the price. Room could be a bit cleaner but service was friendly.', image: '/images/alien-no-way.png' },
  { id: 3, userName: 'Mr. Binh', room: 'Suite', branch: 'Da Nang Branch', stars: 5, comment: 'Absolutely luxurious! The suite was spacious and the views were incredible.', image: '/images/alien-no-way.png' },
  { id: 4, userName: 'Ms. An', room: 'Deluxe Room', branch: 'Da Nang Branch', stars: 4, comment: 'Very good experience overall. The breakfast was particularly nice.', image: '/images/alien-no-way.png' },
  { id: 5, userName: 'Mr. Tuan', room: 'Family Room', branch: 'Da Nang Branch', stars: 4, comment: 'Great for families, spacious and comfortable. Kids loved it.', image: '/images/alien-no-way.png' },
  { id: 6, userName: 'Ms. Hoa', room: 'Standard Room', branch: 'Da Nang Branch', stars: 2, comment: 'Disappointing. Room was small and noisy. Wouldn\'t recommend.', image: '/images/alien-no-way.png' },
  { id: 7, userName: 'Mr. Duc', room: 'Deluxe Twin', branch: 'Da Nang Branch', stars: 5, comment: 'Perfect business trip stay. Efficient check-in and good amenities.', image: '/images/alien-no-way.png' },
  { id: 8, userName: 'Ms. Mai', room: 'Suite', branch: 'Da Nang Branch', stars: 4, comment: 'Lovely suite, but the AC was a bit loud. Service was excellent though.', image: '/images/alien-no-way.png' },
  { id: 9, userName: 'Mr. Son', room: 'Standard King', branch: 'Da Nang Branch', stars: 3, comment: 'Average. Nothing special, but nothing terrible either. Just fine.', image: '/images/alien-no-way.png' },
  { id: 10, userName: 'Ms. Ngoc', room: 'Deluxe Queen', branch: 'Da Nang Branch', stars: 5, comment: 'Truly a 5-star experience! I felt pampered from start to finish.', image: '/images/alien-no-way.png' },
  // Thêm vài item nữa để test phân trang rõ hơn nếu itemsPerPage = 3
  { id: 11, userName: 'User 11', room: 'Room X', branch: 'Da Nang Branch', stars: 4, comment: 'Another good stay.', image: '/images/alien-no-way.png' },
  { id: 12, userName: 'User 12', room: 'Room Y', branch: 'Da Nang Branch', stars: 1, comment: 'Not good.', image: '/images/alien-no-way.png' },
];


// Sorting
const currentSortOrder = ref('none'); // 'desc', 'asc', 'none'

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(3); // Show 3 ratings per page
const totalServerItems = ref(fullMockDataSource.length); // Tổng số items từ "server"


const fetchRatingDetails = async (pageToFetch = 1) => {
  loading.value = true;
  error.value = null;
  try {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

    branchName.value = 'Da Nang Branch'; // Có thể đặt ở ngoài nếu không đổi

    // 1. Tạo một bản sao của dữ liệu nguồn đầy đủ
    let processedData = [...fullMockDataSource];

    // 2. Sắp xếp (Mô phỏng server sắp xếp trước khi phân trang)
    if (currentSortOrder.value === 'desc') {
      processedData.sort((a, b) => b.stars - a.stars || a.id - b.id); // Thêm id sort để ổn định
    } else if (currentSortOrder.value === 'asc') {
      processedData.sort((a, b) => a.stars - b.stars || a.id - b.id); // Thêm id sort
    }
    // Nếu currentSortOrder.value === 'none', processedData giữ nguyên thứ tự của fullMockDataSource

    // 3. Cắt dữ liệu cho trang hiện tại (Mô phỏng server phân trang)
    const start = (pageToFetch - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    const paginatedDataFromServer = processedData.slice(start, end);

    allRatings.value = paginatedDataFromServer; // Đây là dữ liệu cho trang hiện tại
    currentPage.value = pageToFetch; // Cập nhật trang hiện tại đang hiển thị

    // totalServerItems đã được set ban đầu và không đổi (trừ khi dữ liệu nguồn thay đổi)

  } catch (e) {
    error.value = 'Failed to load rating details. Please try again later.';
    allRatings.value = [];
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// `sortedRatings` không cần thiết nữa nếu sắp xếp đã được thực hiện trong `fetchRatingDetails`
// const sortedRatings = computed(() => { ... });

// `totalPages` bây giờ sẽ dựa trên `totalServerItems`
const totalPages = computed(() => {
  return Math.ceil(totalServerItems.value / itemsPerPage.value);
});

// `paginatedRatings` sẽ chỉ đơn giản là `allRatings` vì nó đã được "phân trang"
const paginatedRatings = computed(() => {
  return allRatings.value;
});


const applySort = () => {
  // Khi thay đổi cách sắp xếp, chúng ta muốn bắt đầu lại từ trang 1
  // và lấy dữ liệu đã được sắp xếp cho trang 1 đó.
  fetchRatingDetails(1);
};

onMounted(() => {
  // Khi component được mounted, lấy dữ liệu cho trang đầu tiên.
  fetchRatingDetails(1);
});

// Pagination range computation (logic này có vẻ đã ổn từ code của bạn)
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

// Pagination handlers (giờ sẽ gọi fetchRatingDetails)
function prevPage() {
  if (currentPage.value > 1) {
    fetchRatingDetails(currentPage.value - 1);
    window.scrollTo(0, 0);
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    fetchRatingDetails(currentPage.value + 1);
    window.scrollTo(0, 0);
  }
}

function goToPage(pageNumber) {
  if (typeof pageNumber === 'number' && pageNumber >= 1 && pageNumber <= totalPages.value && pageNumber !== currentPage.value) {
    fetchRatingDetails(pageNumber);
    window.scrollTo(0, 0);
  }
}
</script>

<style scoped>
/* Giữ nguyên CSS hiện tại của bạn. */
/* Nếu bạn đã sao chép CSS cho .custom-pagination từ file Ratings.vue, hãy đảm bảo nó ở đây */
.page-container {
  font-family: Arial, sans-serif;
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  color: #333;
}

.loading-message,
.error-message,
.no-ratings {
  text-align: center;
  font-size: 1.2em;
  padding: 20px;
}

.error-message {
  color: red;
}
.no-ratings {
  color: #777;
}

.content-wrapper {
  /* Styles for the main content area if needed */
}

.page-title {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
  text-align: left;
}

.branch-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 20px;
  color: #555;
  text-align: left;
}

.controls-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end; /* Align sort to the right */
}

.sort-controls label {
  margin-right: 8px;
  font-weight: bold;
}

.sort-controls select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
  font-size: 0.9em;
}

.ratings-list {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Space between rating items */
}

.rating-item {
  display: flex;
  align-items: flex-start;
  background-color: #FCEEED;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.rating-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
  flex-shrink: 0;
  width: 80px;
}

.user-avatar svg {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ddd;
  color: #777;
  padding: 5px;
  box-sizing: border-box;
}

.user-name {
  font-size: 0.9em;
  font-weight: bold;
  color: #333;
  margin-top: 5px;
  text-align: center;
}

.rating-middle {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-branch-info {
  font-size: 1em;
}

.room-type {
  font-weight: bold;
  display: block;
}
.branch-name {
  color: #555;
  display: block;
}

.stars {
  font-size: 1.2em;
  color: #000000;
}

.star-icon {
  margin-right: 2px;
}
.star-icon.filled {
  color: #000000; /* Or a gold color like #FFD700 */
}
.star-icon.empty {
  color: #ccc;
}


.comment {
  font-size: 0.9em;
  color: #444;
  line-height: 1.5;
  text-align: justify;
}

.rating-right {
  margin-left: 20px;
  flex-shrink: 0;
}

.rating-image {
  width: 80px;
  height: 80px; /* Maintain aspect ratio better */
  border-radius: 4px;
  object-fit: cover;
}

/* Custom Pagination from Ratings.vue (hoặc style bạn thích) */
/* Đảm bảo các biến CSS như --primary-theme-color được định nghĩa hoặc thay thế */
:root { /* Hoặc định nghĩa màu trực tiếp trong các class dưới đây */
  --primary-theme-color: #007bff; /* Example: Bootstrap primary blue */
}

.custom-pagination .page-item .page-link {
  color: var(--primary-theme-color);
  border-radius: 0.375rem;
  margin: 0 3px;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
  min-width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.custom-pagination .page-item.active .page-link {
  background-color: var(--primary-theme-color);
  border-color: var(--primary-theme-color);
  color: black;
  box-shadow: 0 2px 5px rgba(0, 123, 255, 0.3);
}
.custom-pagination .page-item:not(.active):not(.disabled) .page-link:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
  color: var(--primary-theme-color);
}
.custom-pagination .page-item.disabled .page-link {
  color: #6c757d;
  background-color: #fff;
  border-color: #dee2e6;
  pointer-events: none;
}
.custom-pagination .page-link.page-dots {
    color: #6c757d;
    background-color: transparent;
    border: none;
    pointer-events: none;
    box-shadow: none;
}


/* Responsive adjustments */
@media (max-width: 768px) {
  .rating-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .rating-left, .rating-middle, .rating-right {
    width: 100%;
    margin-right: 0;
    margin-left: 0;
  }
  .rating-middle { order: 1; margin-top: 10px; }
  .rating-left { order: 2; margin-top: 10px; }
  .rating-right { order: 3; margin-top: 15px; display: flex; justify-content: center; }
  .rating-image { width: 100px; height: 100px; }
  .comment { text-align: left; }
  .room-branch-info, .stars { text-align: center; }
  .controls-container { justify-content: center; }
  /* pagination-controls không còn được dùng, thay vào đó là .mt-5 .pt-3 và .custom-pagination */
   .custom-pagination { /* Thêm style cho pagination trên mobile nếu cần */
       flex-wrap: wrap;
       gap: 5px; /* Nếu bạn muốn khoảng cách nhất quán hơn trên mobile */
   }
   .custom-pagination .page-item .page-link {
       padding: 6px 10px;
       font-size: 0.9em;
       min-width: 32px;
       height: 32px;
   }
}
</style>