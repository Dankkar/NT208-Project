<!-- src/views/admin/amenities/AddAmenityPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Add New Amenity/Service</h1>
    <p v-if="selectedHotel" class="text-center text-muted mb-4">For Hotel: <strong>{{ selectedHotel.TenKS }}</strong> (ID: {{ hotelId }})</p>
    <div v-if="pageLoading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="pageError" class="alert alert-danger">{{ pageError }}</div>

    <form v-else @submit.prevent="submitAddAmenity" class="card p-4 shadow-sm">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="row g-3">
        <!-- MaKS (hidden) -->
        <input type="hidden" :value="hotelId" />

        <div class="col-md-12">
          <label for="tenLoaiDV" class="form-label">Service Name (TenLoaiDV) <span class="text-danger">*</span></label>
          <input id="tenLoaiDV" v-model="amenityData.TenLoaiDV" type="text" class="form-control" required />
        </div>

        <div class="col-md-12">
          <label for="giaDV" class="form-label">Price (GiaDV) <span class="text-danger">*</span></label>
          <input id="giaDV" v-model.number="amenityData.GiaDV" type="number" step="1000" min="0" class="form-control" required />
        </div>

        <div class="col-12">
          <label for="moTaDV" class="form-label">Description (MoTaDV) <span class="text-danger">*</span></label>
          <textarea id="moTaDV" v-model="amenityData.MoTaDV" class="form-control" rows="3" required></textarea>
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManageAmenities" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-success" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Adding...' : 'Add Service' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const hotelId = ref(route.params.hotelId || null); // Lấy MaKS từ route param
const selectedHotel= ref(''); // Tên khách sạn để hiển thị
const pageLoading = ref(true);
const pageError = ref('');

const amenityData = reactive({
  MaKS: hotelId.value ? parseInt(hotelId.value) : null,
  TenLoaiDV: '',
  MoTaDV: '',
  GiaDV: null,
  // IsActive sẽ được backend xử lý hoặc DB có default, hiện tại createService không nhận IsActive
});

const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

async function fetchHotelNameForDisplay() {
    if (!hotelId.value) {
        pageError.value = "Hotel ID is missing for context.";
        pageLoading.value = false;
        return;
    }
    pageLoading.value = true; // Đặt loading trước khi gọi API
    try {
        // API lấy tên dịch vụ theo khách sạn
        const response = await axios.get(`/api/services/hotel/${hotelId.value}`, { withCredentials: true });
        if (response.data && response.data.success) {
            selectedHotel.value = response.data.data;
        } else {
            pageError.value = response.data.message || `Could not load hotel name for ID ${hotelId.value}.`;
        }
    } catch (err) {
        pageError.value = `Failed to fetch hotel (ID ${hotelId.value}) name: ${err.response?.data?.message || err.message}`;
    } finally {
        pageLoading.value = false;
    }
}

async function submitAddAmenity() {
  if (!amenityData.TenLoaiDV || amenityData.GiaDV === null || !amenityData.MoTaDV) {
    formError.value = "Please fill in all required fields: Name, Price, and Description.";
    return;
  }
  if (!amenityData.MaKS) {
    formError.value = "Hotel ID (MaKS) is missing. Cannot add service.";
    return;
  }

  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  try {
    // Gọi API createService của bạn (POST /api/services)
    const response = await axios.post('/api/services/${hotelId.value}', amenityData, {
      withCredentials: true
    });
    if (response.status === 201 && response.data?.message) { // API trả về 201 khi tạo thành công
      successMessage.value = response.data.message;
      // Reset form
      Object.keys(amenityData).forEach(key => {
        if(key !== 'MaKS') amenityData[key] = (typeof amenityData[key] === 'number' ? null : '');
      });
      setTimeout(() => {
          goBackToManageAmenities();
      }, 1000);
    } else {
      formError.value = response.data?.error || response.data?.message || "Failed to add amenity.";
    }
  } catch (err) {
    formError.value = 'Error adding amenity: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManageAmenities() {
  if(hotelId.value) {
      // Thay 'AdminManageAmenities' bằng tên route đúng của bạn
      router.push({ name: 'AdminFindAmenity', params: { hotelId: hotelId.value } });
  } else {
      router.push({ name: 'AdminFindAmenity' }); // Fallback
  }
}

onMounted(() => {
  if (hotelId.value) {
    amenityData.MaKS = parseInt(hotelId.value);
    fetchHotelNameForDisplay();
  } else {
    pageError.value = "Hotel ID is required to add a new service. Please go back and select a hotel.";
    pageLoading.value = false; // Không cần loading nếu đã lỗi ngay
  }
});
</script>

<style scoped>
.card {
  max-width: 700px;
  margin: auto;
}
</style>
