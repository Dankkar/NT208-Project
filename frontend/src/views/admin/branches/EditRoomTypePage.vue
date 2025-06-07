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

                  <!-- Upload Ảnh -->
        <div class="col-12">
          <label for="roomTypeImage" class="form-label">Room Type Image</label>
          
          <!-- Debug info (remove in production) -->
          <div v-if="currentImagePath" class="small text-info mb-2">
            Debug: Image path = {{ currentImagePath }}
          </div>
          
          <!-- Hiển thị ảnh hiện tại nếu có -->
          <div v-if="currentImagePath && !imagePreview && !willDeleteImage" class="mb-2">
            <p class="text-muted small">Current image:</p>
            <div class="position-relative d-inline-block">
              <img 
                v-if="!imageLoadError"
                :src="currentImagePath" 
                alt="Current room type image" 
                class="img-thumbnail" 
                style="max-width: 200px; max-height: 150px; object-fit: cover;" 
                @error="handleImageError"
                @load="handleImageLoad"
              />
              <div 
                v-else 
                class="img-thumbnail d-flex align-items-center justify-content-center bg-light text-muted" 
                style="max-width: 200px; height: 150px;"
              >
                <i class="bi bi-image" style="font-size: 2rem;"></i>
                <span class="ms-2">Image not found</span>
              </div>
            </div>
            <div class="mt-2">
              <button type="button" @click="deleteCurrentImage" class="btn btn-sm btn-outline-danger">Delete Current Image</button>
            </div>
            <div v-if="imageLoadError" class="text-warning small mt-1">
              <small>⚠️ Could not load image from: {{ currentImagePath }}</small>
            </div>
          </div>

          <!-- Input file cho ảnh mới -->
          <input 
            type="file" 
            id="roomTypeImage" 
            ref="imageInput"
            @change="handleImageChange" 
            accept="image/*" 
            class="form-control" 
          />
          
          <!-- Preview ảnh mới được chọn -->
          <div v-if="imagePreview" class="mt-2">
            <p class="text-muted small">New image preview:</p>
            <img :src="imagePreview" alt="Preview" class="img-thumbnail" style="max-width: 200px; max-height: 150px;" />
            <button type="button" @click="removeNewImage" class="btn btn-sm btn-outline-danger ms-2">Cancel New Image</button>
          </div>

          <!-- Hiển thị trạng thái delete image -->
          <div v-if="willDeleteImage" class="mt-2 alert alert-warning">
            <small>Current image will be deleted when you save.</small>
            <button type="button" @click="cancelDeleteImage" class="btn btn-sm btn-outline-secondary ms-2">Keep Current Image</button>
          </div>
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

// Image handling variables
const imageInput = ref(null);
const selectedImage = ref(null);
const imagePreview = ref('');
const currentImagePath = ref('');
const willDeleteImage = ref(false);
const imageLoadError = ref(false);

async function fetchRoomTypeDetails(id) {
  pageLoading.value = true;
  pageError.value = '';
  
  // Reset image variables
  currentImagePath.value = '';
  imagePreview.value = '';
  selectedImage.value = null;
  willDeleteImage.value = false;
  imageLoadError.value = false;
  
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
      
      // Set current image path - check both possible field names
      currentImagePath.value = originalRoomTypeData.value.RoomImagePath || originalRoomTypeData.value.RoomTypeImagePath || '';
      
      // Debug log to check image path
      console.log('Original room type data:', originalRoomTypeData.value);
      console.log('Current image path:', currentImagePath.value);
      
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

// Image handling functions
function handleImageChange(event) {
  const file = event.target.files[0];
  if (file) {
    selectedImage.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
    willDeleteImage.value = false; // Cancel delete if new image selected
  }
}

function removeNewImage() {
  selectedImage.value = null;
  imagePreview.value = '';
  if (imageInput.value) {
    imageInput.value.value = '';
  }
}

function deleteCurrentImage() {
  willDeleteImage.value = true;
  removeNewImage(); // Also remove any new image preview
}

function cancelDeleteImage() {
  willDeleteImage.value = false;
}

function handleImageError() {
  imageLoadError.value = true;
  console.error('Failed to load image:', currentImagePath.value);
}

function handleImageLoad() {
  imageLoadError.value = false;
  console.log('Image loaded successfully:', currentImagePath.value);
}


async function submitUpdateRoomType() {
  if (!editableRoomType.TenLoaiPhong || editableRoomType.GiaCoSo == null || editableRoomType.DienTich == null || !editableRoomType.TienNghi) {
    formError.value = "Please fill in all required fields: Name, Price, Area, and Amenities.";
    return;
  }
  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  // Prepare FormData for multipart/form-data request
  const formData = new FormData();
  formData.append('TenLoaiPhong', editableRoomType.TenLoaiPhong);
  formData.append('SoGiuong', editableRoomType.SoGiuong);
  formData.append('TienNghi', editableRoomType.TienNghi);
  formData.append('DienTich', editableRoomType.DienTich);
  formData.append('GiaCoSo', editableRoomType.GiaCoSo);
  formData.append('MoTa', editableRoomType.MoTa);
  formData.append('IsActive', editableRoomType.IsActive);

  // Handle image operations
  if (selectedImage.value) {
    formData.append('image', selectedImage.value);
  }
  if (willDeleteImage.value) {
    formData.append('deleteImage', 'true');
  }

  try {
    // Gọi API updateRoomType của bạn
    const response = await axios.put(`http://localhost:5000/api/roomTypes/${roomTypeId.value}`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
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