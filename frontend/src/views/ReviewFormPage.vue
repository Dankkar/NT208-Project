<!-- src/views/ReviewFormPage.vue -->
<template>
  <Layout :show-title="true" title="Đánh Giá Trải Nghiệm" bg-color="#F8F9FA">
    <div class="container page-content-container py-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Đang tải thông tin đặt phòng...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger text-center" role="alert">
        <h4 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i> Rất tiếc! Đã có lỗi xảy ra</h4>
        <p>{{ error }}</p>
        <hr>
        <p class="mb-0">Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.</p>
        <button @click="loadBookingInfo" class="btn btn-sm btn-danger mt-3" :disabled="isLoading">
          <i class="bi bi-arrow-clockwise me-1"></i> Thử lại
        </button>
      </div>

      <!-- Success State -->
      <div v-else-if="isSubmitted" class="text-center my-5 py-5 border rounded bg-light">
        <i class="bi bi-check-circle-fill fs-1 text-success mb-3"></i>
        <h3 class="fw-normal text-success">Cảm ơn bạn đã đánh giá!</h3>
        <p class="text-muted mb-4">Đánh giá của bạn đã được gửi thành công và đang chờ được duyệt.</p>
        <div class="d-flex gap-3 justify-content-center flex-wrap">
          <router-link to="/BookingHistory" class="btn btn-primary">
            <i class="bi bi-journal-text me-2"></i>Xem Lịch Sử Đặt Phòng
          </router-link>
          <router-link to="/" class="btn btn-outline-secondary">
            <i class="bi bi-house me-2"></i>Về Trang Chủ
          </router-link>
        </div>
      </div>

      <!-- Review Form -->
      <div v-else-if="bookingInfo" class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Booking Info Card -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <img 
                    :src="bookingInfo.AnhKhachSanUrl || '/placeholder-hotel.jpg'" 
                    :alt="bookingInfo.TenKS"
                    class="img-fluid rounded"
                    style="width: 100%; height: 200px; object-fit: cover;"
                  >
                </div>
                <div class="col-md-8">
                  <h5 class="card-title mb-1">{{ bookingInfo.TenKS }}</h5>
                  <p class="text-muted small mb-2">
                    <i class="bi bi-geo-alt-fill me-1"></i>{{ bookingInfo.DiaChi || 'Địa chỉ khách sạn' }}
                  </p>
                  <div class="row text-sm">
                    <div class="col-6">
                      <p class="mb-1"><strong>Mã đặt phòng:</strong> #{{ bookingInfo.MaDat }}</p>
                      <p class="mb-1"><strong>Loại phòng:</strong> {{ bookingInfo.TenLoaiPhong }}</p>
                    </div>
                    <div class="col-6">
                      <p class="mb-1"><strong>Ngày nhận:</strong> {{ formatDate(bookingInfo.NgayNhanPhong) }}</p>
                      <p class="mb-1"><strong>Ngày trả:</strong> {{ formatDate(bookingInfo.NgayTraPhong) }}</p>
                    </div>
                  </div>
                  <div class="mt-2">
                    <span class="badge bg-success">{{ bookingInfo.TrangThaiBooking }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Review Form Card -->
          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-star-fill me-2"></i>Chia sẻ trải nghiệm của bạn
              </h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="submitReview">
                <!-- Rating Section -->
                <div class="mb-4">
                  <label class="form-label fw-bold">Đánh giá tổng thể <span class="text-danger">*</span></label>
                  <div class="d-flex align-items-center gap-3 mb-2">
                    <div class="star-rating">
                      <span 
                        v-for="star in 5" 
                        :key="star"
                        class="star"
                        :class="{ 'filled': star <= (hoverRating || rating) }"
                        @click="setRating(star)"
                        @mouseover="hoverRating = star"
                        @mouseleave="hoverRating = 0"
                      >
                        <i class="bi bi-star-fill"></i>
                      </span>
                    </div>
                    <span class="text-muted small">{{ getRatingText(hoverRating || rating) }}</span>
                  </div>
                  <div v-if="errors.rating" class="text-danger small">{{ errors.rating }}</div>
                </div>

                <!-- Review Content -->
                <div class="mb-4">
                  <label for="reviewContent" class="form-label fw-bold">Chi tiết đánh giá <span class="text-danger">*</span></label>
                  <textarea 
                    id="reviewContent"
                    v-model="reviewContent"
                    class="form-control"
                    :class="{ 'is-invalid': errors.content }"
                    rows="6"
                    placeholder="Hãy chia sẻ trải nghiệm của bạn về dịch vụ khách sạn, chất lượng phòng, nhân viên, tiện nghi... Điều gì làm bạn ấn tượng nhất?"
                    maxlength="1000"
                  ></textarea>
                  <div class="form-text">{{ reviewContent.length }}/1000 ký tự</div>
                  <div v-if="errors.content" class="invalid-feedback">{{ errors.content }}</div>
                </div>

                <!-- Submit Buttons -->
                <div class="d-flex justify-content-between flex-wrap gap-2">
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    @click="goBack"
                    :disabled="isSubmitting"
                  >
                    <i class="bi bi-arrow-left me-2"></i>Quay lại
                  </button>
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    :disabled="isSubmitting || !rating || !reviewContent.trim()"
                  >
                    <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <i v-else class="bi bi-send me-2"></i>
                    {{ isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá' }}
                  </button>
                </div>

                <!-- Submit Error -->
                <div v-if="submitError" class="alert alert-danger mt-3">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  {{ submitError }}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

import Layout from '@/components/Layout.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Props
const props = defineProps({
  bookingId: {
    type: String,
    required: true
  }
});

// Data
const isLoading = ref(false);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const error = ref(null);
const submitError = ref(null);
const bookingInfo = ref(null);

// Form data
const rating = ref(0);
const hoverRating = ref(0);
const reviewContent = ref('');

// Form validation
const errors = reactive({
  rating: null,
  content: null
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy');
  } catch {
    return 'N/A';
  }
};

const setRating = (value) => {
  rating.value = value;
  errors.rating = null;
};

const getRatingText = (stars) => {
  const texts = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng', 
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng'
  };
  return texts[stars] || 'Chưa chọn';
};

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.rating = null;
  errors.content = null;
  
  // Validate rating
  if (!rating.value) {
    errors.rating = 'Vui lòng chọn số sao đánh giá';
    isValid = false;
  }
  
  // Validate content
  if (!reviewContent.value.trim()) {
    errors.content = 'Vui lòng nhập nội dung đánh giá';
    isValid = false;
  } else if (reviewContent.value.length < 10) {
    errors.content = 'Nội dung đánh giá phải có ít nhất 10 ký tự';
    isValid = false;
  }
  
  return isValid;
};

const loadBookingInfo = async () => {
  const bookingId = props.bookingId || route.params.bookingId;
  if (!bookingId) {
    error.value = 'Không tìm thấy thông tin đặt phòng';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const response = await axios.get(`/api/bookings/${bookingId}`, {
      withCredentials: true
    });

    if (response.data.success) {
      bookingInfo.value = response.data.data;
      
      // Kiểm tra xem có thể đánh giá không
      if (bookingInfo.value.TrangThaiBooking !== 'Đã trả phòng') {
        error.value = 'Bạn chỉ có thể đánh giá sau khi đã trả phòng';
        return;
      }
    } else {
      error.value = response.data.message || 'Không thể tải thông tin đặt phòng';
    }
  } catch (err) {
    console.error('Error loading booking info:', err);
    if (err.response?.status === 403) {
      error.value = 'Bạn không có quyền truy cập thông tin đặt phòng này';
    } else if (err.response?.status === 404) {
      error.value = 'Không tìm thấy thông tin đặt phòng';
    } else {
      error.value = 'Lỗi kết nối. Vui lòng thử lại sau';
    }
  } finally {
    isLoading.value = false;
  }
};

const submitReview = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;
  submitError.value = null;

  try {
    const reviewData = {
      MaKS: bookingInfo.value.MaKS,
      MaDat: bookingInfo.value.MaDat,
      NoiDung: reviewContent.value.trim(),
      Sao: rating.value
    };

    const response = await axios.post('/api/reviews', reviewData, {
      withCredentials: true
    });

    if (response.data.message) {
      isSubmitted.value = true;
    } else {
      submitError.value = response.data.error || 'Có lỗi xảy ra khi gửi đánh giá';
    }
  } catch (err) {
    console.error('Error submitting review:', err);
    if (err.response?.data?.error) {
      submitError.value = err.response.data.error;
    } else if (err.response?.status === 400) {
      submitError.value = 'Thông tin đánh giá không hợp lệ';
    } else if (err.response?.status === 403) {
      submitError.value = 'Bạn không có quyền đánh giá đơn đặt phòng này';
    } else {
      submitError.value = 'Lỗi kết nối. Vui lòng thử lại sau';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};

// Lifecycle
onMounted(() => {
  loadBookingInfo();
});
</script>

<style scoped>
.page-content-container {
  max-width: 1200px;
}

.star-rating {
  display: flex;
  gap: 2px;
}

.star {
  cursor: pointer;
  color: #ddd;
  font-size: 1.5rem;
  transition: color 0.2s ease;
}

.star:hover,
.star.filled {
  color: #ffc107;
}

.card {
  border: none;
  border-radius: 12px;
}

.card-header {
  border-radius: 12px 12px 0 0 !important;
}

.btn {
  border-radius: 8px;
  font-weight: 500;
}

.form-control {
  border-radius: 8px;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.alert {
  border-radius: 8px;
}

.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
}

@media (max-width: 768px) {
  .star {
    font-size: 1.25rem;
  }
  
  .d-flex.gap-3 {
    flex-direction: column;
    gap: 1rem !important;
  }
  
  .d-flex.justify-content-between {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 