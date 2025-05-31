<!-- src/views/admin/roomtypes/EditRoomTypePage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Edit Room Type</h1>
    <div v-if="pageLoading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="pageError" class="alert alert-danger">
        <p>{{ pageError }}</p>
        <button @click="goBackToManagePage" class="btn btn-sm btn-secondary">Back to Manage Page</button>
    </div>

    <form v-else-if="editableRoomType.MaLoaiPhong" @submit.prevent="submitUpdateRoomType" class="card p-4 shadow-sm">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <p class="text-muted">Editing Room Type ID: {{ roomTypeId }} for Hotel ID: {{ editableRoomType.MaKS }} ({{ originalHotelName }})</p>
        <hr class="my-3">

      <div class="row g-3">
         <div class="col-md-6">
          <label for="maLoaiPhong" class="form-label">Room Type ID (MaLoaiPhong)</label>
          <input id="maLoaiPhong" type="text" class="form-control" :value="editableRoomType.MaLoaiPhong" readonly disabled />
        </div>
        <div class="col-md-6">
          <label for="tenLoaiPhong" class="form-label">Room Type Name <span class="text-danger">*</span></label>
          <input id="tenLoaiPhong" v-model="editableRoomType.TenLoaiPhong" type="text" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label for="soGiuong" class="form-label">Number of Beds <span class="text-danger">*</span></label>
          <input id="soGiuong" v-model.number="editableRoomType.SoGiuong" type="number" step="1" min="1" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label for="giaCoSo" class="form-label">Base Price (VND) <span class="text-danger">*</span></label>
          <input id="giaCoSo" v-model.number="editableRoomType.GiaCoSo" type="number" step="1000" min="0" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label for="dienTich" class="form-label">Area (m²) <span class="text-danger">*</span></label>
          <input id="dienTich" v-model.number="editableRoomType.DienTich" type="number" step="0.1" min="0" class="form-control" required />
        </div>
        <div class="col-12">
          <label for="tienNghi" class="form-label">Amenities (comma-separated) <span class="text-danger">*</span></label>
          <textarea id="tienNghi" v-model="editableRoomType.TienNghi" class="form-control" rows="3" required></textarea>
        </div>
        <div class="col-12">
          <label for="moTa" class="form-label">Description (Optional)</label>
          <textarea id="moTa" v-model="editableRoomType.MoTa" class="form-control" rows="3"></textarea>
        </div>
        <div class="col-md-6 d-flex align-items-center mt-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="isActiveSwitch" v-model="editableRoomType.IsActive">
            <label class="form-check-label" for="isActiveSwitch">Is Active</label>
          </div>
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManageRoomTypes" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Updating...' : 'Update Room Type' }}
        </button>
      </div>
    </form>
     <div v-else class="alert alert-warning">
        Room type data could not be loaded.
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

const roomTypeId = ref(route.params.roomTypeId || null);
const originalRoomTypeData = ref(null); // Dữ liệu gốc
const originalHotelName = ref('');

const editableRoomType = reactive({
  MaLoaiPhong: null,
  MaKS: null, // Cần MaKS để biết nó thuộc KS nào (nếu cần hiển thị)
  TenLoaiPhong: '',
  TienNghi: '',
  DienTich: null,
  GiaCoSo: null,
  MoTa: ''
});

const pageLoading = ref(true);
const pageError = ref('');
const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

async function fetchRoomTypeDetails(id) {
  pageLoading.value = true;
  pageError.value = '';
  try {
    // BẠN CẦN TẠO API GET /api/room-types/:id Ở BACKEND ĐỂ LẤY CHI TIẾT 1 LOẠI PHÒNG
    const response = await axios.get(`http://localhost:5000/api/roomTypes/${id}`, {
      withCredentials: true,
    });
    if (response.data && response.data.success) {
      originalRoomTypeData.value = response.data.data;
      editableRoomType.MaLoaiPhong = originalRoomTypeData.value.MaLoaiPhong;
      editableRoomType.MaKS = originalRoomTypeData.value.MaKS;
      editableRoomType.TenLoaiPhong = originalRoomTypeData.value.TenLoaiPhong || '';
      editableRoomType.SoGiuong = originalRoomTypeData.value.SoGiuong;
      editableRoomType.TienNghi = originalRoomTypeData.value.TienNghi || '';
      editableRoomType.DienTich = originalRoomTypeData.value.DienTich || null;
      editableRoomType.GiaCoSo = originalRoomTypeData.value.GiaCoSo || null;
      editableRoomType.MoTa = originalRoomTypeData.value.MoTa || '';
      editableRoomType.IsActive = originalRoomTypeData.value.IsActive === 1 || originalRoomTypeData.value.IsActive === true;
      // Có thể fetch thêm tên KS nếu cần hiển thị
      if(editableRoomType.MaKS) await fetchHotelNameForDisplay(editableRoomType.MaKS);

    } else {
      pageError.value = response.data?.message || `Could not load room type data for ID ${id}.`;
    }
  } catch (err) {
    pageError.value = `Error fetching room type ID ${id}: ` + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    pageLoading.value = false;
  }
}
async function fetchHotelNameForDisplay(hotelId){
    try {
        const hotelRes = await axios.get(`http://localhost:5000/api/hotels/${hotelId}`, { withCredentials: true });
        if(hotelRes.data && hotelRes.data.success){
            originalHotelName.value = hotelRes.data.data.TenKS;
        }
    } catch (error) {
        console.warn("Could not fetch hotel name for display", error);
    }
}


async function submitUpdateRoomType() {
  if (!editableRoomType.TenLoaiPhong || editableRoomType.GiaCoSo == null || editableRoomType.DienTich == null || !editableRoomType.TienNghi) {
    formError.value = "Please fill in all required fields: Name, Price, Area, and Amenities.";
    return;
  }
  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  const payload = {
    TenLoaiPhong: editableRoomType.TenLoaiPhong,
    SoGiuong: editableRoomType.SoGiuong,
    TienNghi: editableRoomType.TienNghi,
    DienTich: editableRoomType.DienTich,
    GiaCoSo: editableRoomType.GiaCoSo,
    MoTa: editableRoomType.MoTa,
    IsActive: editableRoomType.IsActive
  };

  try {
    // Gọi API updateRoomType của bạn
    const response = await axios.put(`http://localhost:5000/api/roomTypes/${roomTypeId.value}`, payload, {
      withCredentials: true
    });
    if (response.data?.message) { // API của bạn trả về {message: '...'}
      successMessage.value = response.data.message;
      setTimeout(() => {
        goBackToManageRoomTypes();
      }, 1000);
    } else {
      formError.value = response.data?.error || "Failed to update room type.";
    }
  } catch (err) {
    formError.value = 'Error updating room type: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManageRoomTypes() {
  // Điều hướng về trang quản lý của khách sạn chứa loại phòng này
  if(editableRoomType.MaKS) {
      router.push({ name: 'AdminFindRoomType', params: { hotelId: String(editableRoomType.MaKS) } });
  } else {
      router.push({ name: 'AdminFindRoomType' }); // Hoặc một route mặc định
  }
}


watch(() => route.params.roomTypeId, (newId) => {
  if (newId && newId !== roomTypeId.value) {
    roomTypeId.value = newId;
    fetchRoomTypeDetails(newId);
  }
});

onMounted(() => {
  if (roomTypeId.value) {
    fetchRoomTypeDetails(roomTypeId.value);
  } else {
    pageError.value = "Room Type ID is missing. Cannot load data for editing.";
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