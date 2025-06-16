<!-- src/views/admin/hotels/FindHotelPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">MANAGE HOTELS</h1>

    <div class="d-flex justify-content-end mb-3">
      <button @click="navigateToAddHotel" class="btn btn-success">
        <i class="bi bi-plus-circle-fill me-1"></i> Add New Hotel
      </button>
    </div>

    <div v-if="isFetching" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading hotels...</span>
      </div>
    </div>
    <div v-else-if="fetchError" class="alert alert-danger">{{ fetchError }}</div>

    <div v-else-if="hotels.length > 0" class="table-responsive card p-3 shadow-sm">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>ID (MaKS)</th>
            <th>Hotel Name</th>
            <th>Address</th>
            <th>Star</th>
            <th>Type</th>
            <th>Manager</th>
            <th>IsActive</th>
            <th style="min-width: 100px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hotel in hotels" :key="hotel.MaKS">
            <td>{{ hotel.MaKS }}</td> 
            <td>{{ hotel.TenKS }}</td>
            <td style="max-width: 250px;">{{ hotel.DiaChi }}</td>
            <td>{{ hotel.HangSao }}</td>
            <td>{{ hotel.LoaiHinh }}</td>
            <td>{{ hotel.NguoiQuanLy || (hotel.MaNguoiQuanLy ? `ID: ${hotel.MaNguoiQuanLy}` : 'N/A') }}</td>
            <td>
                <span :class="getActiveClass(hotel.IsActive)">
                  {{ hotel.IsActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            <td>
              <button @click="navigateToEditHotel(hotel.MaKS)" class="btn btn-sm btn-outline-warning me-2 mb-1" title="Edit Hotel">
                <i class="bi bi-pencil-fill"></i> Edit
              </button>
              <!-- Nút xóa có thể thêm sau nếu cần -->
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="pagination.totalPages > 1"
        :page="pagination.page"
        :total="pagination.totalPages"
        @change="handlePageChange"
        class="mt-3"
      />
    </div>
    <div v-else class="alert alert-secondary text-center">
      No hotels found. You can add one using the button above.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Pagination from '@/components/Pagination.vue'; // Đảm bảo đường dẫn đúng

const router = useRouter();

const hotels = ref([]);
const isFetching = ref(true);
const fetchError = ref('');

const pagination = reactive({
  page: 1,
  limit: 10, // Số khách sạn trên mỗi trang
  total: 0,
  totalPages: 0
});

function getActiveClass(status) {
  // Giả sử IsActive là 1 (true) hoặc 0 (false) từ DB
  if (status === 1 || status === true) return 'badge bg-success text-white';
  return 'badge bg-danger text-white';
}

// === API Calls ===
async function fetchHotels(page = 1) {
  isFetching.value = true;
  fetchError.value = '';
  pagination.page = page;
  try {
    // API của bạn cho getAllHotels là GET /api/hotels (có admin check bên trong)
    const response = await axios.get('/api/hotels', {
      params: { page: pagination.page, limit: pagination.limit },
      withCredentials: true // Quan trọng để backend biết role của user
    });

    if (response.data && response.data.success) {
      hotels.value = response.data.data || [];
      if (response.data.pagination) {
        pagination.total = response.data.pagination.total;
        pagination.totalPages = response.data.pagination.totalPages;
      } else { // Fallback nếu API không trả về pagination đúng chuẩn
        pagination.total = hotels.value.length;
        pagination.totalPages = Math.ceil(hotels.value.length / pagination.limit) || 1;

      }
    } else {
      fetchError.value = response.data?.message || response.data?.error || 'Failed to load hotels.';
      hotels.value = [];
    }
  } catch (err) {
    fetchError.value = `Client Error: ${err.response?.data?.message || err.response?.data?.error || err.message || 'Could not fetch hotels.'}`;
    hotels.value = [];
    console.error("Error fetching hotels:", err);
  } finally {
    isFetching.value = false;
  }
}

// === Event Handlers ===
function handlePageChange(newPage) {
  if (newPage !== pagination.page) {
    fetchHotels(newPage);
  }
}

// === Navigation ===
function navigateToAddHotel() {
  router.push({ name: 'AdminAddHotel' }); // Cần định nghĩa route này
}

function navigateToEditHotel(hotelId) {
  router.push({ name: 'AdminEditHotel', params: { hotelId: String(hotelId) } }); // Cần định nghĩa route này
}

// === Utility ===
const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value)) || parseFloat(value) === 0) return 'N/A'; // Hiển thị N/A nếu giá là null hoặc 0
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};


// === Lifecycle Hooks ===
onMounted(() => {
  fetchHotels(1); // Fetch trang đầu tiên khi component được mount
});
</script>

<style scoped>
.table th, .table td { vertical-align: middle; }
.table td[style*="max-width"] { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
</style>
