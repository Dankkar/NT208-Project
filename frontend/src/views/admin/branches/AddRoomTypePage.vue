<!-- src/views/admin/roomtypes/AddRoomTypePage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Add New Room Type</h1>
    <p v-if="selectedHotel" class="text-center text-muted mb-4">For Hotel: <strong>{{ selectedHotel.TenKS }}</strong> (ID: {{ hotelId }})</p>
    <div v-if="pageLoading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="pageError" class="alert alert-danger">{{ pageError }}</div>

    <form v-else @submit.prevent="submitAddRoomType" class="card p-4 shadow-sm">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="row g-3">
        <!-- MaKS (hidden) -->
        <input type="hidden" :value="hotelId" /> <!-- Hoặc :value="roomTypeData.MaKS" nếu bạn muốn đồng bộ -->

        <!-- 1. Tên Loại Phòng -->
        <div class="col-md-6">
          <label for="tenLoaiPhong" class="form-label">Room Type Name <span class="text-danger">*</span></label>
          <input id="tenLoaiPhong" v-model="roomTypeData.TenLoaiPhong" type="text" class="form-control" required />
        </div>

        <!-- 2. Số Giường -->
        <div class="col-md-6">
          <label for="soGiuong" class="form-label">Number of Beds <span class="text-danger">*</span></label>
          <input id="soGiuong" v-model.number="roomTypeData.SoGiuong" type="number" step="1" min="1" class="form-control" required />
        </div>

        <!-- 3. Tiện Nghi -->
        <div class="col-12">
          <label for="tienNghi" class="form-label">Amenities (comma-separated) <span class="text-danger">*</span></label>
          <textarea id="tienNghi" v-model="roomTypeData.TienNghi" class="form-control" rows="3" placeholder="e.g., WiFi, Air Conditioning, TV" required></textarea>
        </div>

        <!-- 4. Diện Tích -->
        <div class="col-md-6">
          <label for="dienTich" class="form-label">Area (m²) <span class="text-danger">*</span></label>
          <input id="dienTich" v-model.number="roomTypeData.DienTich" type="number" step="0.1" min="0" class="form-control" required />
        </div>

        <!-- 5. Giá Cơ Sở -->
        <div class="col-md-6">
          <label for="giaCoSo" class="form-label">Base Price (VND) <span class="text-danger">*</span></label>
          <input id="giaCoSo" v-model.number="roomTypeData.GiaCoSo" type="number" step="1000" min="0" class="form-control" required />
        </div>

        <!-- 6. Mô Tả -->
        <div class="col-12">
          <label for="moTa" class="form-label">Description (Optional)</label>
          <textarea id="moTa" v-model="roomTypeData.MoTa" class="form-control" rows="3"></textarea>
        </div>

        <!-- 7. Upload Ảnh -->
        <div class="col-12">
          <label for="roomTypeImage" class="form-label">Room Type Image (Optional)</label>
          <input 
            type="file" 
            id="roomTypeImage" 
            ref="imageInput"
            @change="handleImageChange" 
            accept="image/*" 
            class="form-control" 
          />
          <div v-if="imagePreview" class="mt-2">
            <img :src="imagePreview" alt="Preview" class="img-thumbnail" style="max-width: 200px; max-height: 150px;" />
            <button type="button" @click="removeImage" class="btn btn-sm btn-outline-danger ms-2">Remove Image</button>
          </div>
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManageRoomTypes" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-success" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Adding...' : 'Add Room Type' }}
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

const hotelId = ref(route.params.hotelId || null);
const selectedHotel = ref(null); // Thông tin KS để hiển thị tên
const pageLoading = ref(true);
const pageError = ref('');


const roomTypeData = reactive({
  MaKS: hotelId.value ? parseInt(hotelId.value) : null,
  TenLoaiPhong: '',
  TienNghi: '',
  DienTich: null,
  GiaCoSo: null,
  MoTa: ''
});

const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

// Image upload variables
const imageInput = ref(null);
const selectedImage = ref(null);
const imagePreview = ref('');

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
  }
}

function removeImage() {
  selectedImage.value = null;
  imagePreview.value = '';
  if (imageInput.value) {
    imageInput.value.value = '';
  }
}

async function fetchSelectedHotelDetails() {
    if(!hotelId.value) {
        pageError.value = "Hotel ID is missing.";
        pageLoading.value = false;
        return;
    }
    pageLoading.value = true;
    try {
        const response = await axios.get(`http://localhost:5000/api/roomTypes/hotel/${hotelId.value}`, { withCredentials: true });
        if (response.data && response.data.success) {
            selectedHotel.value = response.data.data;
        } else {
            pageError.value = response.data.message || `Could not load hotel details for ID ${hotelId.value}.`;
        }
    } catch (err) {
        pageError.value = `Failed to fetch hotel (ID ${hotelId.value}) details: ${err.response?.data?.message || err.message}`;
    } finally {
        pageLoading.value = false;
    }
}


async function submitAddRoomType() {
  if (!roomTypeData.TenLoaiPhong || !roomTypeData.SoGiuong || !roomTypeData.GiaCoSo || !roomTypeData.DienTich || !roomTypeData.TienNghi) {
    formError.value = "Please fill in all required fields: Name, Price, Area, and Amenities.";
    return;
  }
  if (!roomTypeData.MaKS) {
    formError.value = "Hotel ID is missing. Cannot add room type.";
    return;
  }

  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  try {
    // Prepare FormData for multipart/form-data request
    const formData = new FormData();
    formData.append('MaKS', roomTypeData.MaKS);
    formData.append('TenLoaiPhong', roomTypeData.TenLoaiPhong);
    formData.append('SoGiuong', roomTypeData.SoGiuong);
    formData.append('TienNghi', roomTypeData.TienNghi);
    formData.append('DienTich', roomTypeData.DienTich);
    formData.append('GiaCoSo', roomTypeData.GiaCoSo);
    formData.append('MoTa', roomTypeData.MoTa);
    
    // Add image if selected
    if (selectedImage.value) {
      formData.append('image', selectedImage.value);
    }

    // Gọi API createRoomType của bạn
    const response = await axios.post(`http://localhost:5000/api/roomTypes/`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    if (response.status === 201 && response.data?.message) { // API trả về 201 khi tạo thành công
      successMessage.value = response.data.message;
      // Reset form
      Object.keys(roomTypeData).forEach(key => {
        if(key !== 'MaKS') roomTypeData[key] = (typeof roomTypeData[key] === 'number' ? null : '');
      });
      // Reset image
      removeImage();
      setTimeout(() => {
          goBackToManageRoomTypes();
      }, 1000);
    } else {
      formError.value = response.data?.error || response.data?.message || "Failed to add room type.";
    }
  } catch (err) {
    formError.value = 'Error adding room type: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManageRoomTypes() {
  // Điều hướng về trang quản lý loại phòng của khách sạn hiện tại (nếu có hotelId)
  // Hoặc một trang chung nếu hotelId không có (dù ở đây luôn có hotelId để vào trang Add)
  if(hotelId.value) {
      router.push({ name: 'AdminFindRoomType', params: { hotelId: hotelId.value } });
  } else {
      router.push({ name: 'AdminFindRoomType' }); // Hoặc một route mặc định
  }
}

onMounted(() => {
  if (hotelId.value) {
    roomTypeData.MaKS = parseInt(hotelId.value); // Đảm bảo MaKS là số
    fetchSelectedHotelDetails();
  } else {
    pageError.value = "Hotel ID is required to add a new room type. Please go back and select a hotel.";
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