<!-- src/views/admin/bookings/CheckInOutPage.vue -->
<template>
  <div class="container-fluid mt-4">
    <h1 class="mb-4 fw-bold text-center">MANAGE BOOKING CHECK-IN / CHECK-OUT</h1>

    <!-- Thông báo -->
    <div v-if="actionMessage" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-danger']" role="alert">
      {{ actionMessage }}
    </div>

    <!-- Loading và Lỗi Fetch -->
    <div v-if="isFetchingBookings" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading bookings...</span>
      </div>
    </div>
    <div v-else-if="fetchError" class="alert alert-danger">{{ fetchError }}</div>

    <!-- Bảng Bookings -->
    <div v-else-if="bookings.length > 0" class="table-responsive card p-3 shadow-sm">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>ID (MaDat)</th>
            <th>Hotel (TenKS)</th>
            <th>Room (SoPhong)</th>
            <th>Guest (TenKhachHang)</th>
            <th>Check-in Date</th>
            <th>Check-out Date</th>
            <th>Status (TrangThaiBooking)</th>
            <th>Total (TongTienDuKien)</th>
            <th style="min-width: 220px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking.MaDat">
            <td>{{ booking.MaDat }}</td>
            <td>{{ booking.TenKS }}</td>
            <td>{{ booking.SoPhong }}</td>
            <td>{{ booking.TenKhachHang }}</td>
            <td>{{ formatDate(booking.NgayNhanPhong) }}</td>
            <td>{{ formatDate(booking.NgayTraPhong) }}</td>
            <td><span :class="getBookingStatusClass(booking.TrangThaiBooking)">{{ booking.TrangThaiBooking }}</span></td>
            <td>{{ formatCurrency(booking.TongTienDuKien) }}</td>
            <td>
              <button
                v-if="canPerformCheckIn(booking)"
                @click="performCheckIn(booking.MaDat)"
                class="btn btn-sm btn-success me-2 mb-1"
                :disabled="isProcessingAction === booking.MaDat"
                title="Check-in Guest"
              >
                <span v-if="isProcessingAction === booking.MaDat" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-box-arrow-in-right me-1"></i>
                Check-in
              </button>

              <button
                v-if="canPerformCheckOut(booking)"
                @click="performCheckOut(booking.MaDat)"
                class="btn btn-sm btn-info me-2 mb-1"
                :disabled="isProcessingAction === booking.MaDat"
                title="Check-out Guest"
              >
                 <span v-if="isProcessingAction === booking.MaDat" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-box-arrow-right me-1"></i>
                Check-out
              </button>
              <!-- Bạn có thể thêm nút xem chi tiết booking nếu cần -->
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
    <div v-else class="alert alert-info text-center">
      No bookings found matching your criteria.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Pagination from '@/components/Pagination.vue';
// import { useAuthStore } from '@/store/authStore'; // Nếu cần check role ở client

// const authStore = useAuthStore(); // (Optional)
const router = useRouter();

const bookings = ref([]);
const isFetchingBookings = ref(true);
const fetchError = ref('');
const actionMessage = ref('');
const messageType = ref('info'); // 'success' or 'danger'
const isProcessingAction = ref(null); // Lưu MaDat của booking đang xử lý

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// === Utility Functions ===
const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value))) return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' };
  try {
    return new Date(dateString).toLocaleString('vi-VN', options);
  } catch (e) { return 'Invalid Date';}
};

function getBookingStatusClass(status) {
  if (status === 'Đã xác nhận') return 'badge bg-primary';
  if (status === 'Đã nhận phòng') return 'badge bg-success';
  if (status === 'Đã trả phòng') return 'badge bg-secondary';
  if (status === 'Đã hủy') return 'badge bg-danger';
  return 'badge bg-light text-dark';
}

// Điều kiện để hiển thị nút Check-in/Check-out (chủ yếu dựa vào trạng thái)
// Backend sẽ kiểm tra quyền chi tiết hơn
function canPerformCheckIn(booking) {
  return booking.TrangThaiBooking === 'Đã xác nhận';
  // Có thể thêm điều kiện ngày: new Date() >= new Date(booking.NgayNhanPhong.split('T')[0])
}
function canPerformCheckOut(booking) {
  return booking.TrangThaiBooking === 'Đã nhận phòng';
}


// === API Calls ===
async function fetchBookings(page = 1) {
  isFetchingBookings.value = true;
  fetchError.value = '';
  actionMessage.value = ''; // Xóa thông báo cũ
  pagination.page = page;
  try {
    // Backend đã xử lý việc filter theo role (Admin/QuanLyKS)
    const response = await axios.get('http://localhost:5000/api/bookings/admin', {
      params: { page: pagination.page, limit: pagination.limit },
      withCredentials: true
    });

    if (response.data && response.data.success) {
      bookings.value = response.data.data || [];
      if (response.data.pagination) {
        pagination.total = response.data.pagination.total;
        pagination.totalPages = response.data.pagination.totalPages;
      } else {
        pagination.total = bookings.value.length;
        pagination.totalPages = Math.ceil(bookings.value.length / pagination.limit) || 1;
      }
    } else {
      fetchError.value = response.data?.message || response.data?.error || 'Failed to load bookings.';
    }
  } catch (err) {
    fetchError.value = `API Error: ${err.response?.data?.message || err.response?.data?.error || err.message || 'Could not fetch bookings.'}`;
    console.error("Error fetching bookings:", err);
  } finally {
    isFetchingBookings.value = false;
  }
}

async function performCheckIn(bookingId) {
  if (!confirm(`Are you sure you want to check-in for booking ID ${bookingId}?`)) return;

  isProcessingAction.value = bookingId;
  actionMessage.value = '';
  messageType.value = 'info';

  try {
    // API là put /api/bookings/:MaDat/check-in
    const response = await axios.put(`http://localhost:5000/api/bookings/${bookingId}/check-in`, {}, {
      withCredentials: true
    });
    if (response.data && response.data.message) { // Backend trả về { message: '...' }
      messageType.value = 'success';
      actionMessage.value = response.data.message;
      await fetchBookings(pagination.page); // Tải lại danh sách
    } else {
      messageType.value = 'danger';
      actionMessage.value = response.data?.error || 'Check-in failed. Unexpected response.';
    }
  } catch (err) {
    messageType.value = 'danger';
    actionMessage.value = `Check-in Error: ${err.response?.data?.error || err.response?.data?.message || err.message}`;
    console.error(`Error performing check-in for ${bookingId}:`, err);
  } finally {
    isProcessingAction.value = null;
  }
}

async function performCheckOut(bookingId) {
  if (!confirm(`Are you sure you want to check-out for booking ID ${bookingId}?`)) return;

  isProcessingAction.value = bookingId;
  actionMessage.value = '';
  messageType.value = 'info';
  try {
    // API là put /api/bookings/:MaDat/check-out
    const response = await axios.put(`http://localhost:5000/api/bookings/${bookingId}/check-out`, {}, {
      withCredentials: true
    });
     if (response.data && response.data.message) {
      messageType.value = 'success';
      actionMessage.value = response.data.message;
      await fetchBookings(pagination.page); // Tải lại danh sách
    } else {
      messageType.value = 'danger';
      actionMessage.value = response.data?.error || 'Check-out failed. Unexpected response.';
    }
  } catch (err) {
     messageType.value = 'danger';
    actionMessage.value = `Check-out Error: ${err.response?.data?.error || err.response?.data?.message || err.message}`;
    console.error(`Error performing check-out for ${bookingId}:`, err);
  } finally {
    isProcessingAction.value = null;
  }
}


// === Event Handlers ===
function handlePageChange(newPage) {
  if (newPage !== pagination.page) {
    fetchBookings(newPage);
  }
}

// === Lifecycle Hooks ===
onMounted(() => {
  fetchBookings(1);
});

</script>

<style scoped>
.table th, .table td {
  vertical-align: middle;
  font-size: 0.9rem; /* Thu nhỏ font một chút */
}
.table td[style*="max-width"] {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}
.badge {
    font-size: 0.8em;
}
.btn-sm {
    font-size: 0.8rem;
    padding: .25rem .5rem;
}
</style>