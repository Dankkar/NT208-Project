<!-- src/views/admin/reviews/FindReviewsPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">MANAGE HOTEL REVIEWS</h1>

    <div class="mb-4 card p-3 shadow-sm">
      <h5 class="card-title">Select Hotel to Manage Reviews</h5>
       <div v-if="availableHotels.length > 0" class="input-group">
        <select v-model="selectedHotelId" class="form-select" aria-label="Select Hotel">
          <option :value="null">-- Select a Hotel --</option>
          <option v-for="hotel in availableHotels" :key="hotel.MaKS" :value="hotel.MaKS">
            {{ hotel.TenKS }} (ID: {{ hotel.MaKS }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="selectedHotelId !== null && !loadingHotels">
      <h3 class="mb-3">Reviews for: <strong>{{ selectedHotelName }}</strong></h3>

      <!-- Không cần filter status ở đây nữa nếu Admin xem hết -->

      <div v-if="isFetchingReviews" class="text-center my-3"> Loading.... </div>
      <div v-else-if="fetchError" class="alert alert-danger">{{ fetchError }}</div>

      <div v-else-if="foundReviews.length > 0" class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>ID (MaDG)</th>
              <th>Username</th>
              <th>Booking ID</th>
              <th>Rating</th>
              <th style="min-width: 250px;">Content</th>
              <th>Date</th>
              <th>Approved</th>
              <th style="min-width: 180px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in foundReviews" :key="review.MaDG">
              <td>{{ review.MaDG }}</td>
              <td>{{ review.TenNguoiDung }}</td>
              <td>{{ review.MaDat || 'N/A' }}</td>
              <td>
                <span class="star-display" :title="`${review.Sao} out of 5 stars`">
                  <span
                    v-for="starIndex in 5"
                    :key="`${review.MaDG}-star-${starIndex}`"
                    :class="starIndex <= Math.round(Number(review.Sao) || 0) ? 'star-filled' : 'star-empty'"
                  >★</span>
                </span>
              </td>
              <td style="max-width: 300px; white-space: pre-wrap;">{{ review.NoiDung }}</td>
              <td>{{ formatDate(review.NgayDG) }}</td>
              <td>
                <span :class="getApprovalClass(review.IsApproved)">
                  {{ review.IsApproved ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                <button v-if="!review.IsApproved"
                        @click="setApprovalStatus(review.MaDG, true)"
                        class="btn btn-sm btn-success me-1 mb-1" title="Approve this review">
                  Approve
                </button>
                <button v-if="review.IsApproved"
                        @click="setApprovalStatus(review.MaDG, false)"
                        class="btn btn-sm btn-warning me-1 mb-1" title="Unapprove this review">
                  Unapprove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <Pagination
          v-if="paginationData.totalPages > 1"
          :page="paginationData.page"
          :total="paginationData.totalPages"
          @change="handleReviewPageChange"
          class="mt-3"
        />
      </div>
      <div v-else-if="fetchAttempted && foundReviews.length === 0" class="alert alert-info text-center">
        No reviews found for {{ selectedHotelName }}.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import Pagination from '@/components/Pagination.vue';
// import vue3StarRatings from 'vue3-star-ratings';

const router = useRouter();
const route = useRoute();

// ... (các ref như selectedHotelId, foundReviews, isFetchingReviews, fetchError, paginationData giữ nguyên) ...
const availableHotels = ref([]);
const loadingHotels = ref(true);
const hotelLoadError = ref('');
const selectedHotelId = ref(null);

const foundReviews = ref([]);
const isFetchingReviews = ref(false);
const fetchError = ref('');
const fetchAttempted = ref(false);

const paginationData = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

function getApprovalClass(status) {
  // Giả sử IsApproved là 1 (true) hoặc 0 (false) từ DB
  if (status === 1 || status === true) return 'badge bg-success text-white';
  return 'badge bg-danger text-white';
}

const selectedHotelName = computed(() => {
  if (!selectedHotelId.value) return '';
  const hotel = availableHotels.value.find(h => h.MaKS === selectedHotelId.value);
  return hotel ? hotel.TenKS : `Hotel ID ${selectedHotelId.value}`;
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' };
  try {
    return new Date(dateString).toLocaleString('vi-VN', options);
  } catch (e) { return 'Invalid Date';}
};

async function fetchAvailableHotels() {
  loadingHotels.value = true;
  hotelLoadError.value = '';
  try {
    const response = await axios.get('http://localhost:5000/api/hotels/list-basic', { withCredentials: true });
    if (response.data && response.data.success) {
      availableHotels.value = response.data.data || [];
    } else {
      hotelLoadError.value = response.data?.message || 'Could not load list of hotels.';
      availableHotels.value = []; // Đảm bảo là mảng rỗng nếu lỗi
    }
  } catch (err) {
    console.error("Error fetching available hotels:", err);
    hotelLoadError.value = 'Failed to fetch hotels list (Client Error).';
    availableHotels.value = [];
  } finally {
    loadingHotels.value = false;
  }
}

async function fetchReviewsForSelectedHotel(page = 1) {
  if (selectedHotelId.value === null || selectedHotelId.value === '') {
    foundReviews.value = [];
    paginationData.value = { page: 1, limit: 10, total: 0, totalPages: 0 };
    fetchAttempted.value = false;
    return;
  }
  isFetchingReviews.value = true;
  fetchError.value = '';
  fetchAttempted.value = true;
  paginationData.value.page = page;

  try {
    // API không cần filter status nữa
    const response = await axios.get(
      `http://localhost:5000/api/reviews/admin/hotel/${selectedHotelId.value}`,
      {
        params: {
            page: paginationData.value.page,
            limit: paginationData.value.limit
        },
        withCredentials: true
      }
    );
    console.log("==> API Response Reviews:", response.data);

    if (response.data && response.data.success) {
      foundReviews.value = response.data.data || [];
      console.log("Full foundReviews array:", JSON.parse(JSON.stringify(foundReviews.value)));
      if (response.data.pagination) {
        paginationData.value = { ...paginationData.value, ...response.data.pagination };
      } else {
        paginationData.value.total = foundReviews.value.length;
        paginationData.value.totalPages = Math.ceil(foundReviews.value.length / paginationData.value.limit) || 1;
      }
    } else {
      fetchError.value = response.data?.error || response.data?.message || 'Failed to load room types.';
      foundReviews.value = [];
    }
  } catch (err) {
    handleApiError(err, `Failed to fetch reviews for hotel ID ${selectedHotelId.value}.`);
    foundReviews.value = [];
  } finally {
    isFetchingReviews.value = false;
  }
}

function handleReviewPageChange(newPage) {
  if (newPage !== paginationData.value.page) {
    fetchReviewsForSelectedHotel(newPage);
  }
}

// HÀM MỚI ĐỂ SET APPROVAL STATUS
async function setApprovalStatus(reviewId, newStatus) {
    const actionText = newStatus ? 'approve' : 'unapprove';
    if (!confirm(`Are you sure you want to ${actionText} review ID ${reviewId}?`)) return;

    try {
        await axios.put(
            `http://localhost:5000/api/reviews/admin/${reviewId}/approval`,
            { newApprovalState: newStatus },
            { withCredentials: true }
        );
        alert(`Review ID ${reviewId} has been ${newStatus ? 'approved' : 'unapproved'}.`);
        // Cập nhật cục bộ để giao diện thay đổi ngay
        const reviewToUpdate = foundReviews.value.find(r => r.MaDG === reviewId); // Quan trọng: tìm theo MaDG
        if(reviewToUpdate) {
            reviewToUpdate.IsApproved = newStatus;
        }
        fetchReviewsForSelectedHotel(paginationData.value.page);
    } catch (err) {
        handleApiError(err, `Failed to ${actionText} review ID ${reviewId}.`);
    }
}

// Theo dõi selectedHotelId - Đây sẽ là trigger chính để fetch reviews
watch(selectedHotelId, (newHotelId, oldHotelId) => {
  console.log(`WATCH selectedHotelId: Changed from ${oldHotelId} to ${newHotelId}`);
  if (newHotelId !== null & newHotelId !== '' && newHotelId !== undefined) { // Chỉ xử lý nếu newHotelId có giá trị (không phải -- Select a Hotel --)
    // Đồng bộ URL (nếu thay đổi so với URL hiện tại)
    if (String(route.params.hotelId || '') !== String(newHotelId)) {
      console.log("WATCH selectedHotelId: Updating route to reflect newHotelId:", newHotelId);
      router.replace({ name: 'AdminFindReview', params: { hotelId: String(newHotelId) } });
      fetchReviewsForSelectedHotel(1);
    } else {
      foundReviews.value = [];
      fetchAttempted.value = false;
    }
  } else if (newHotelId === null && oldHotelId !== null) { // Người dùng chọn "-- Select a Hotel --"
    console.log("WATCH selectedHotelId: Cleared by user selection.");
    foundReviews.value = [];
    paginationData.value = { page: 1, limit: 10, total: 0, totalPages: 0 };
    fetchAttempted.value = false;
    if (route.params.hotelId) { // Nếu URL vẫn còn hotelId, xóa nó đi
        router.replace({ name: 'AdminFindReview' });
    }
  }
});

// Theo dõi route.params.hotelId để cập nhật selectedHotelId nếu URL thay đổi từ bên ngoài
watch(() => route.params.hotelId, (newHotelIdParam, oldHotelIdParam) => {
  const newIdFromRoute = newHotelIdParam ? parseInt(newHotelIdParam) : null;
  console.log(`WATCH route.params.hotelId: Changed from "${oldHotelIdParam}" to "${newHotelIdParam}". Parsed to: ${newIdFromRoute}`);
  // Chỉ cập nhật selectedHotelId nếu nó thực sự khác, để tránh vòng lặp và trigger không cần thiết
  if (newIdFromRoute !== selectedHotelId.value) {
    console.log(`WATCH route.params.hotelId: Setting selectedHotelId to ${newIdFromRoute}`);
    selectedHotelId.value = newIdFromRoute; // Gán giá trị mới, việc này sẽ trigger watch(selectedHotelId, ...)
  } else if (newIdFromRoute === null && selectedHotelId.value !== null){
    // Nếu URL không có hotelId, nhưng selectedHotelId đang có giá trị (ví dụ người dùng bỏ chọn)
    // thì clear selectedHotelId để đồng bộ (watch(selectedHotelId) sẽ dọn dẹp list)
    console.log(`WATCH route.params.hotelId: Clearing selectedHotelId because route param is null.`);
    selectedHotelId.value = null;
  }
}, { immediate: true }); // immediate: true để chạy ngay khi component load, lấy hotelId từ URL ban đầu

onMounted(async () => {
  console.log("FindRoomTypePage MOUNTED.");
  await fetchAvailableHotels();
  // Không cần gán selectedHotelId ở đây nữa vì watch route.params.hotelId (với immediate:true) sẽ làm việc đó.
  // Sau khi availableHotels được tải, nếu watch(route.params.hotelId) đã set selectedHotelId,
  // thì watch(selectedHotelId) sẽ được trigger để fetch room types.
});

const handleApiError = (err, defaultMessage) => { if (err.response) { fetchError.value = err.response.data?.error || err.response.data?.message || `Error: ${err.response.status} - ${defaultMessage}.`;} else if (err.request) { fetchError.value = `No response from server for: ${defaultMessage}. Please check network.`;} else { fetchError.value = `An error occurred with: ${defaultMessage}.`;} console.error(defaultMessage, err);};
</script>

<style scoped>
.table th, .table td { vertical-align: middle; }
.table td[style*="max-width"] { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
.input-group .form-select { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.input-group .btn { border-top-left-radius: 0; border-bottom-left-radius: 0; }
.star-display span { /* Áp dụng cho cả sao đầy và sao rỗng bên trong */
  font-size: 1.2em; /* Điều chỉnh kích thước sao nếu bạn muốn */
  letter-spacing: 1px; /* Khoảng cách nhỏ giữa các sao */
}
.star-display span {
  font-size: 1.4em;
  margin-right: 2px;
  user-select: none;
  transition: color 0.2s;
}
.star-filled {
  color: #ffc107; /* vàng đậm */
  text-shadow: 0 1px 2px #a0800033;
}
.star-empty {
  color: #e0e0e0; /* xám nhạt */
}
</style>