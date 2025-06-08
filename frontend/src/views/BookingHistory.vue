<!-- src/views/BookingHistory.vue -->
<template>
  <Layout :show-title="true" title="Lịch Sử Đặt Phòng" >
    <div class="container page-content-container py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0 d-none d-md-block">Các Đặt Phòng Của Bạn</h4>
        <button
          v-if="!historyStore.isLoadingHistory && historyStore.hasBookings"
          class="btn btn-sm btn-outline-secondary"
          @click="refreshHistory"
          :disabled="historyStore.isLoadingHistory"
        >
          <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="historyStore.isLoadingHistory" class="text-center my-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Đang tải lịch sử đặt phòng của bạn...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="historyStore.getHistoryError" class="alert alert-danger text-center" role="alert">
        <h4 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i> Rất tiếc! Đã có lỗi xảy ra</h4>
        <p>{{ historyStore.getHistoryError }}</p>
        <hr>
        <p class="mb-0">Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.</p>
        <button @click="refreshHistory" class="btn btn-sm btn-danger mt-3" :disabled="historyStore.isLoadingHistory">
          <i class="bi bi-arrow-clockwise me-1"></i> Thử lại
        </button>
      </div>

      <!-- No Bookings State -->
      <div v-else-if="!historyStore.hasBookings" class="text-center my-5 py-5 border rounded bg-light">
        <i class="bi bi-journal-x fs-1 text-muted mb-3"></i>
        <h3 class="fw-normal">Lịch sử đặt phòng trống</h3>
        <p class="text-muted mb-4">Bạn chưa thực hiện đặt phòng nào. Hãy khám phá và đặt ngay!</p>
        <router-link to="/bookingprocess" class="btn btn-primary btn-lg">
          <i class="bi bi-calendar2-plus me-2"></i>Tìm & Đặt Phòng Ngay
        </router-link>
      </div>

      <!-- Display Bookings List -->
      <div v-else class="booking-history-list">
        <!-- Pagination Info -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <p v-if="historyStore.bookings.length > 0" class="text-muted small mb-0">
            Hiển thị {{ historyStore.bookings.length }} / {{ historyStore.getPagination.total }} đặt phòng 
            (Trang {{ historyStore.getCurrentPage }} / {{ historyStore.getTotalPages }})
          </p>
          
          <!-- Items per page selector -->
          <div class="d-flex align-items-center">
            <label class="form-label small me-2 mb-0">Hiển thị:</label>
            <select 
              class="form-select form-select-sm" 
              style="width: auto;"
              :value="historyStore.getPagination.limit"
              @change="handleLimitChange"
              :disabled="historyStore.isLoadingHistory"
            >
              <option value="5">5 / trang</option>
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
          </div>
        </div>

        <!-- Booking Cards -->
        <VueCard1
          v-for="bookingEntry in preparedBookingHistoryData"
          :key="bookingEntry.idForVForKey"
          :hotelData="bookingEntry.dataForCard"
          :imageUrl="bookingEntry.dataForCard.mainImageUrl" 
          mode="booking-history"
          @action-clicked="handleBookingAction"
          class="mb-4 vue-card-item"
        />

        <!-- Pagination Component -->
        <Pagination 
          v-if="historyStore.getTotalPages > 1"
          :page="historyStore.getCurrentPage" 
          :total="historyStore.getTotalPages"
          @change="handlePageChange"
          class="mt-4"
        />
      </div>

      <!-- Modal Hủy Đặt Phòng (Ví dụ đơn giản, bạn có thể dùng component modal phức tạp hơn) -->
      <div v-if="showCancelModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Xác nhận Hủy Đặt Phòng</h5>
              <button type="button" class="btn-close" @click="closeCancelModal" :disabled="isCancelling"></button>
            </div>
            <div class="modal-body">
              <p v-if="bookingToCancel">Bạn có chắc chắn muốn hủy đặt phòng <strong>#{{ bookingToCancel.MaDat }}</strong> tại khách sạn <strong>{{ bookingToCancel.TenKS }}</strong>?</p>
              <p class="text-danger small">Lưu ý: Vui lòng kiểm tra chính sách hủy phòng. Hành động này có thể không được hoàn tác.</p>
              <div class="mb-3">
                <label for="cancelReason" class="form-label small">Lý do hủy (tùy chọn):</label>
                <textarea id="cancelReason" v-model="cancelReason" class="form-control form-control-sm" rows="2" :disabled="isCancelling"></textarea>
              </div>
              <div v-if="cancelError" class="alert alert-danger small py-2">{{ cancelError }}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-sm btn-secondary" @click="closeCancelModal" :disabled="isCancelling">Không, giữ lại</button>
              <button type="button" class="btn btn-sm btn-danger" @click="confirmCancellation" :disabled="isCancelling">
                <span v-if="isCancelling" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                {{ isCancelling ? 'Đang xử lý...' : 'Có, hủy đặt phòng' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </Layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useBookingHistoryStore } from '@/store/bookingHistoryStore';
import { useAuthStore } from '@/store/authStore'; // authStore để check đăng nhập ban đầu
import { useRouter } from 'vue-router';
import { format, parseISO, differenceInCalendarDays } from 'date-fns'; // Thêm differenceInCalendarDays

import Layout from '@/components/Layout.vue';
import VueCard1 from '@/components/vueCard1.vue'; // Đảm bảo đường dẫn đúng
import Pagination from '@/components/Pagination.vue';

const historyStore = useBookingHistoryStore();
const authStore = useAuthStore();
const router = useRouter();

const layoutTitleBgColor = ref('#F8F9FA'); // Màu nền xám nhạt cho tiêu đề Layout

// State cho modal hủy
const showCancelModal = ref(false);
const bookingToCancel = ref(null); // Lưu trữ thông tin booking đang chuẩn bị hủy
const cancelReason = ref('');
const isCancelling = ref(false);   // Cờ cho spinner nút confirm hủy
const cancelError = ref(null);     // Lỗi khi hủy

// Chuẩn bị dữ liệu cho VueCard1
const preparedBookingHistoryData = computed(() => {
  return (historyStore.allBookings || []).map(apiBooking => {
    const checkInDate = apiBooking.NgayNhanPhong ? parseISO(apiBooking.NgayNhanPhong) : null;
    const checkOutDate = apiBooking.NgayTraPhong ? parseISO(apiBooking.NgayTraPhong) : null;
    let numberOfNights = 0;
    if (checkInDate && checkOutDate) {
      numberOfNights = differenceInCalendarDays(checkOutDate, checkInDate);
      numberOfNights = numberOfNights < 0 ? 0 : numberOfNights;
    }

    let actions = [];
    const allowCancellation = apiBooking.TrangThaiBooking === 'Đã xác nhận' &&
                             checkInDate && differenceInCalendarDays(checkInDate, new Date()) > 1; // Ví dụ: chỉ hủy trước 1 ngày
    if (allowCancellation) {
      actions.push({ id: 'cancel', label: 'Hủy Đặt Phòng', backgroundColor: '#dc3545', textColor: '#fff' });
    }
    
    // Thêm nút đánh giá cho booking đã trả phòng
    const allowReview = apiBooking.TrangThaiBooking === 'Đã trả phòng';
    if (allowReview) {
      actions.push({ id: 'review', label: 'Đánh Giá', backgroundColor: '#ffc107', textColor: '#000', isPrimary: true });
    }
    
    // actions.push({ id: 'view-receipt', label: 'Xem Hóa Đơn', backgroundColor: '#0dcaf0', textColor: '#000' });


    return {
      idForVForKey: apiBooking.MaDat,
      dataForCard: {
        // Thông tin chính hiển thị trên Card
        title: `Mã ĐP: #${apiBooking.MaDat} - ${apiBooking.TenKS || 'N/A'}`,
        subtitle1: `Ngày đặt: ${formatFullDate(apiBooking.NgayDat)}`,
        description: `Trạng thái hiện tại.`, // Mô tả chung có thể bỏ qua hoặc để trống ở đây
        mainImageUrl: apiBooking.AnhKhachSanUrl,
        mainImageAltText: `Hình ảnh của ${apiBooking.TenKS || 'khách sạn'}`,
        originalItem: { ...apiBooking }, // Quan trọng: truyền bản sao để tránh VueCard1 thay đổi store
        // Thông tin chi tiết hiển thị khi mode là 'booking-history'
        historyDetails: {
          bookingReference: apiBooking.MaDat,
          bookingDate: apiBooking.NgayDat, // Dùng cho formatDate trong VueCard1
          status: apiBooking.TrangThaiBooking
        },
        actions: actions,
        // Thông tin phòng và dịch vụ hiển thị trong phần roomItems của VueCard1
        roomItems: [
          {
            id: apiBooking.MaLoaiPhong || apiBooking.MaPhongDat || `${apiBooking.MaDat}_room`,
            name: apiBooking.TenLoaiPhong || 'Chi tiết lưu trú',
            area: apiBooking.DienTichLoaiPhong || null,
            beds: apiBooking.CauHinhGiuong || null,
            amenities: apiBooking.TienNghiLoaiPhong || null,
            imageUrl: apiBooking.AnhLoaiPhongUrl,
            price: apiBooking.TongTienDuKien, // Tổng tiền cho booking
            priceUnit: 'VNĐ', // Hoặc 'Tổng cộng'
            quantity: apiBooking.SoLuongKhach, // Hoặc nếu có số lượng phòng cụ thể
            historyRoomDetails: [
              `Nhận phòng: ${formatFullDate(apiBooking.NgayNhanPhong)} (Phòng ${apiBooking.SoPhong || 'N/A'})`,
              `Trả phòng: ${formatFullDate(apiBooking.NgayTraPhong)}`,
              `Số đêm: ${numberOfNights} đêm`,
              `Yêu cầu: ${apiBooking.YeuCauDacBiet || 'Không có'}`,
              `Trạng thái: ${apiBooking.TrangThaiBooking}`
            ],
            services: (apiBooking.DichVuSuDung || []).map(s => ({
                name: s.TenLoaiDV,
                quantity: s.SoLuong,
                price: s.GiaTaiThoiDiemSuDung || s.ThanhTien
            })),
            priceDescription: `Hóa đơn #${apiBooking.MaHD || 'N/A'} | ${apiBooking.TrangThaiThanhToan || 'N/A'}`
          }
        ]
      }
    };
  });
});

onMounted(() => {
  // authStore.isAuthenticated sẽ được cập nhật bởi router guard hoặc App.vue
  if (authStore.isAuthenticated) {
    historyStore.fetchBookingHistory();
  } else {
    // Guard nên xử lý việc này, nhưng để an toàn:
    console.warn("BookingHistory: User not authenticated, redirecting to login from onMounted.");
    router.replace({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

// Theo dõi lỗi từ store để có thể reset khi người dùng thực hiện hành động mới
watch(() => historyStore.getHistoryError, (newError) => {
    if (newError && isCancelling.value) { // Nếu có lỗi store trong khi đang chờ hủy
        cancelError.value = newError; // Hiển thị lỗi đó trong modal
        isCancelling.value = false; // Dừng spinner của modal
    }
});


const refreshHistory = () => {
  historyStore.fetchBookingHistory();
};

// Pagination handlers
const handlePageChange = (newPage) => {
  historyStore.goToPage(newPage);
};

const handleLimitChange = (event) => {
  const newLimit = parseInt(event.target.value);
  historyStore.changeLimit(newLimit);
};

const handleBookingAction = ({ actionId, bookingItem }) => {
  console.log(`Action '${actionId}' triggered for booking ID: ${bookingItem.MaDat}`);
  if (actionId === 'cancel') {
    bookingToCancel.value = bookingItem;
    cancelReason.value = ''; // Reset lý do
    cancelError.value = null; // Reset lỗi modal cũ
    showCancelModal.value = true;
  } else if (actionId === 'review') {
    // Điều hướng tới trang đánh giá
    router.push({ name: 'ReviewForm', params: { bookingId: bookingItem.MaDat } });
  } else if (actionId === 'view-receipt') {
    // Ví dụ: điều hướng tới trang xem hóa đơn chi tiết
    // router.push({ name: 'InvoiceDetails', params: { id: bookingItem.MaHD } });
    alert(`Xem hóa đơn #${bookingItem.MaHD} cho Booking #${bookingItem.MaDat}. Chức năng này sẽ được phát triển.`);
  }
};

const closeCancelModal = () => {
  if (isCancelling.value) return; // Không cho đóng khi đang xử lý
  showCancelModal.value = false;
  bookingToCancel.value = null;
  cancelReason.value = '';
  cancelError.value = null;
};

const confirmCancellation = async () => {
  if (!bookingToCancel.value) return;
  isCancelling.value = true;
  cancelError.value = null; // Xóa lỗi cũ trước khi thử lại

  const result = await historyStore.cancelBooking({
    bookingId: bookingToCancel.value.MaDat,
    reason: cancelReason.value || 'Khách hàng yêu cầu hủy trực tuyến'
  });

  isCancelling.value = false;
  if (result.success) {
    alert(result.message || 'Hủy đặt phòng thành công!');
    closeCancelModal();
    // Không cần fetchBookingHistory() vì store đã cập nhật item đó rồi
    // Tuy nhiên, nếu bạn muốn đảm bảo 100% dữ liệu mới nhất, có thể gọi:
    // historyStore.fetchBookingHistory();
  } else {
    // Lỗi đã được set vào historyStore.error, cũng có thể hiển thị nó ở đây
    cancelError.value = result.error || result.message || 'Không thể hủy đặt phòng. Vui lòng thử lại.';
    // Không đóng modal để user thấy lỗi
  }
};

// Hàm định dạng ngày tháng (YYYY-MM-DD hoặc ISO string -> dd/MM/yyyy)
const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = dateString.includes('T') ? parseISO(dateString) : new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm'); // Định dạng dd/MM/yyyy HH:mm
  } catch (e) {
    return dateString; // Trả về chuỗi gốc nếu không parse được
  }
};

const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = dateString.includes('T') ? parseISO(dateString) : new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  } catch (e) {
    return dateString;
  }
};

</script>

<style scoped>
.page-content-container {
  min-height: calc(100vh - 150px); /* Giả sử navbar + footer ~ 150px, điều chỉnh nếu cần */
}
.booking-history-list .vue-card-item:last-child {
  margin-bottom: 0 !important;
}
.alert-danger p { margin-bottom: 0.5rem; }
.alert-danger hr { margin-top: 0.8rem; margin-bottom: 0.8rem; }

/* Styles for basic modal */
.modal.d-block { display: block; }
.modal-dialog { margin-top: 10vh; }
.modal-content { border-radius: 0.5rem; }
.modal-header { border-bottom: 1px solid #dee2e6; }
.modal-footer { border-top: 1px solid #dee2e6; }
</style>