<!-- src/views/admin/amenities/EditAmenityPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Edit Amenity/Service</h1>
    <div v-if="pageLoading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="pageError" class="alert alert-danger">
        <p>{{ pageError }}</p>
        <button @click="goBackToManagePage" class="btn btn-sm btn-secondary">Back to Manage Amenities</button>
    </div>

    <form v-else-if="editableAmenity.MaLoaiDV" @submit.prevent="submitUpdateAmenity" class="card p-4 shadow-sm">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <p class="text-muted">
            Editing Service ID: <strong>{{ amenityId }}</strong>
            <span v-if="editableAmenity.MaKS"> for Hotel ID: {{ editableAmenity.MaKS }} ({{ originalHotelName }})</span>
        </p>
        <hr class="my-3">

      <div class="row g-3">
         <div class="col-md-6">
          <label for="maLoaiDV" class="form-label">Service ID (MaLoaiDV)</label>
          <input id="maLoaiDV" type="text" class="form-control" :value="editableAmenity.MaLoaiDV" readonly disabled />
        </div>
         <div class="col-md-6">
          <label for="maKS" class="form-label">Hotel ID (MaKS)</label>
          <input id="maKS" v-model.number="editableAmenity.MaKS" type="number" class="form-control" required />
           <!-- Hoặc bạn có thể dùng dropdown để chọn lại khách sạn nếu muốn -->
        </div>

        <div class="col-md-12">
          <label for="tenLoaiDV" class="form-label">Service Name (TenLoaiDV) <span class="text-danger">*</span></label>
          <input id="tenLoaiDV" v-model="editableAmenity.TenLoaiDV" type="text" class="form-control" required />
        </div>

        <div class="col-md-12">
          <label for="giaDV" class="form-label">Price (GiaDV) <span class="text-danger">*</span></label>
          <input id="giaDV" v-model.number="editableAmenity.GiaDV" type="number" step="1000" min="0" class="form-control" required />
        </div>

        <div class="col-12">
          <label for="moTaDV" class="form-label">Description (MoTaDV) <span class="text-danger">*</span></label>
          <textarea id="moTaDV" v-model="editableAmenity.MoTaDV" class="form-control" rows="3" required></textarea>
        </div>

        <!-- Optional: IsActive field (backend của bạn chưa hỗ trợ update IsActive) -->
        <!--
        <div class="col-md-12 d-flex align-items-center mt-3">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="isActiveAmenitySwitch" v-model="editableAmenity.IsActive">
            <label class="form-check-label" for="isActiveAmenitySwitch">Is Active</label>
          </div>
        </div>
        -->
      </div>

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManagePage" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Updating...' : 'Update Service' }}
        </button>
      </div>
    </form>
     <div v-else class="alert alert-warning">
        Service data could not be loaded.
         <button @click="goBackToManagePage" class="btn btn-sm btn-secondary ms-2">Back</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const amenityId = ref(route.params.amenityId || null); // Lấy MaLoaiDV từ route param
const originalAmenityData = ref(null);
const originalHotelName = ref(''); // Tên khách sạn ban đầu của dịch vụ này

const editableAmenity = reactive({
  MaLoaiDV: null,
  MaKS: null,
  TenLoaiDV: '',
  MoTaDV: '',
  GiaDV: null,
  // IsActive: true, // Mặc định là true nếu không có thông tin từ DB
});

const pageLoading = ref(true);
const pageError = ref('');
const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

async function fetchAmenityDetails(id) {
  pageLoading.value = true;
  pageError.value = '';
  try {
    // API GET /api/services/:MaDV (MaDV ở đây là amenityId)
    const response = await axios.get(`http://localhost:5000/api/services/${id}`, {
      withCredentials: true,
    });
    // Backend getServiceById của bạn trả về trực tiếp object data, không có { success: true, data: ...}
    // Nên cần điều chỉnh cách lấy dữ liệu
    if (response.data && response.data.MaLoaiDV) { // Kiểm tra sự tồn tại của MaLoaiDV
      originalAmenityData.value = response.data;

      editableAmenity.MaLoaiDV = originalAmenityData.value.MaLoaiDV;
      editableAmenity.MaKS = originalAmenityData.value.MaKS;
      editableAmenity.TenLoaiDV = originalAmenityData.value.TenLoaiDV || '';
      editableAmenity.MoTaDV = originalAmenityData.value.MoTaDV || '';
      editableAmenity.GiaDV = originalAmenityData.value.GiaDV || null;
      // Backend của bạn hiện tại chưa trả về IsActive trong getServiceById.
      // editableAmenity.IsActive = originalAmenityData.value.IsActive === 1 || originalAmenityData.value.IsActive === true;

      if(editableAmenity.MaKS) await fetchHotelNameForDisplay(editableAmenity.MaKS);

    } else if (response.data && response.data.message) { // Trường hợp API báo không tìm thấy (404)
        pageError.value = response.data.message;
    }
    else {
      pageError.value = `Could not load service data for ID ${id}. Unexpected response structure.`;
    }
  } catch (err) {
     pageError.value = `Error fetching service ID ${id}: `;
    if (err.response && err.response.data) {
        pageError.value += `${err.response.data.error || err.response.data.message || err.message}`;
    } else {
        pageError.value += err.message;
    }
  } finally {
    pageLoading.value = false;
  }
}

async function fetchHotelNameForDisplay(hotelIdToFetch){
    if (!hotelIdToFetch) return;
    try {
        const hotelRes = await axios.get(`http://localhost:5000/api/hotels/${hotelIdToFetch}/name-only`, { withCredentials: true });
        if(hotelRes.data && hotelRes.data.success){
            originalHotelName.value = hotelRes.data.data.TenKS;
        }
    } catch (error) {
        console.warn("Could not fetch hotel name for display for hotel ID", hotelIdToFetch, error);
        originalHotelName.value = ''; // Reset nếu không fetch được
    }
}


async function submitUpdateAmenity() {
  if (!editableAmenity.TenLoaiDV || editableAmenity.GiaDV == null || !editableAmenity.MoTaDV || editableAmenity.MaKS == null) {
    formError.value = "Please fill in all required fields: Hotel ID, Name, Price, and Description.";
    return;
  }
  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  const payload = {
    MaKS: editableAmenity.MaKS,
    TenLoaiDV: editableAmenity.TenLoaiDV,
    MoTaDV: editableAmenity.MoTaDV,
    GiaDV: editableAmenity.GiaDV,
    // IsActive: editableAmenity.IsActive, // Nếu backend hỗ trợ update IsActive
  };

  try {
    // Gọi API updateService của bạn: PUT /api/services/:MaDV
    // MaDV ở đây là amenityId.value (hoặc editableAmenity.MaLoaiDV)
    const response = await axios.put(`http://localhost:5000/api/services/${amenityId.value}`, payload, {
      withCredentials: true
    });
    if (response.data && response.data.success && response.data.message) {
      successMessage.value = response.data.message;
      await fetchAmenityDetails(amenityId.value); // Tải lại dữ liệu mới nhất
    } else {
      formError.value = response.data?.message || response.data?.error || "Failed to update service.";
    }
  } catch (err) {
    formError.value = 'Error updating service: ' + (err.response?.data?.message || err.response?.data?.error || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManagePage() {
  // Điều hướng về trang quản lý của khách sạn chứa dịch vụ này
  if(editableAmenity.MaKS) {
      router.push({ name: 'AdminManageAmenities', params: { hotelId: String(editableAmenity.MaKS) } });
  } else {
      router.push({ name: 'AdminManageAmenities' }); // Fallback
  }
}

// Theo dõi nếu amenityId từ route thay đổi (ví dụ người dùng điều hướng trực tiếp)
watch(() => route.params.amenityId, (newId) => {
  if (newId && newId !== amenityId.value) {
    amenityId.value = newId;
    fetchAmenityDetails(newId);
  }
});

onMounted(() => {
  if (amenityId.value) {
    fetchAmenityDetails(amenityId.value);
  } else {
    pageError.value = "Service ID (MaLoaiDV) is missing. Cannot load data for editing.";
    pageLoading.value = false;
  }
});
</script>

<style scoped>
.card {
  max-width: 700px;
  margin: auto;
}
</style>