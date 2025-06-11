<!-- src/views/admin/hotels/EditHotelPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Edit Hotel</h1>

    <div v-if="pageLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading hotel data...</span>
      </div>
    </div>
    <div v-else-if="pageError" class="alert alert-danger mx-auto" style="max-width: 800px;">
      <p>{{ pageError }}</p>
      <button @click="goBackToManageHotels" class="btn btn-sm btn-secondary">Back to Manage Hotels</button>
    </div>

    <form v-else-if="editableHotel.MaKS" @submit.prevent="submitUpdateHotel" class="card p-4 shadow-sm mx-auto" style="max-width: 800px;">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <p class="text-muted">Editing Hotel ID: <strong>{{ hotelId }}</strong></p>
      <hr class="my-3">

      <div class="row g-3">
        <div class="col-md-6">
          <label for="tenKS" class="form-label">Hotel Name (TenKS) <span class="text-danger">*</span></label>
          <input id="tenKS" v-model.trim="editableHotel.TenKS" type="text" class="form-control" required />
        </div>
        <div class="col-md-12">
          <GeocodingAddressInput
            v-model="editableHotel.DiaChi"
            v-model:coordinates="hotelCoordinates"
            label="Address (DiaChi)"
            placeholder="Nhập địa chỉ khách sạn (VD: 123 Đường ABC, Quận XYZ, TP.HCM)"
            input-id="diaChi"
            :required="true"
            :disabled="isSubmitting"
            @geocoding-success="onGeocodingSuccess"
            @geocoding-error="onGeocodingError"
          />
        </div>
        <div class="col-md-6">
          <label for="hangSao" class="form-label">Star Rating (HangSao) <span class="text-danger">*</span></label>
           <select id="hangSao" v-model="editableHotel.HangSao" class="form-select" required>
            <option value="" disabled>-- Select Stars --</option>
            <option value="1 sao">1 Star</option>
            <option value="2 sao">2 Stars</option>
            <option value="3 sao">3 Stars</option>
            <option value="4 sao">4 Stars</option>
            <option value="5 sao">5 Stars</option>
          </select>
        </div>
        <div class="col-md-6">
          <label for="loaiHinh" class="form-label">Hotel Type (LoaiHinh) <span class="text-danger">*</span></label>
          <input id="loaiHinh" v-model.trim="editableHotel.LoaiHinh" type="text" class="form-control" required />
        </div>
        <div class="col-12">
          <label for="moTaCoSoVatChat" class="form-label">Facility Description (MoTaCoSoVatChat) <span class="text-danger">*</span></label>
          <textarea id="moTaCoSoVatChat" v-model="editableHotel.MoTaCoSoVatChat" class="form-control" rows="4" required></textarea>
        </div>
        <div class="col-12">
          <label for="quyDinh" class="form-label">Regulations (QuyDinh) <span class="text-danger">*</span></label>
          <textarea id="quyDinh" v-model="editableHotel.QuyDinh" class="form-control" rows="4" required></textarea>
        </div>
         <div class="col-12">
          <label for="motaChung" class="form-label">General Description (MotaChung)</label>
          <textarea id="motaChung" v-model="editableHotel.MotaChung" class="form-control" rows="3"></textarea>
        </div>

        <div class="col-md-6">
          <label for="maNguoiQuanLyEdit" class="form-label">Assign Manager (MaNguoiQuanLy)</label>
          <input id="maNguoiQuanLyEdit" v-model.number="editableHotel.MaNguoiQuanLy" type="number" class="form-control" placeholder="Enter User ID or leave blank"/>
          <small class="form-text text-muted">Enter new User ID to change manager, or leave blank to keep current/remove (if backend supports).</small>
        </div>

        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="isActiveSwitch" v-model="editableHotel.IsActive">
            <label class="form-check-label" for="isActiveSwitch">Is Active</label>
        </div>

        <!-- Thêm phần quản lý ảnh -->
        <div class="col-12 mt-4">
          <label class="form-label">Hotel Images</label>
          <div class="mb-3">
            <input
              type="file"
              class="form-control"
              accept="image/*"
              multiple
              @change="handleImageSelect"
              :disabled="isSubmitting"
            >
            <small class="form-text text-muted">You can select multiple images. Click on an image to set it as main image.</small>
          </div>

          <!-- Hiển thị ảnh -->
          <div class="row g-3">
            <div v-for="(image, index) in previewImages" :key="index" class="col-md-3">
              <div class="card h-100" :class="{'border-primary': mainImageIndex === index}">
                <div class="position-relative">
                  <img :src="image.url" class="card-img-top" style="height: 200px; object-fit: cover; cursor: pointer"
                       @click="setMainImage(index)"
                       :class="{'border border-primary border-3': mainImageIndex === index}">
                  <div v-if="mainImageIndex === index" class="position-absolute top-0 end-0 bg-primary text-white px-2 py-1 small">
                    MAIN
                  </div>
                  <div class="position-absolute top-0 start-0 bg-secondary text-white px-2 py-1 small">
                    {{ image.isNew ? 'NEW' : 'EXISTING' }}
                  </div>
                </div>
                <div class="card-body p-2">
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                      {{ mainImageIndex === index ? 'Ảnh chính' : 'Click để chọn làm ảnh chính' }}
                    </small>
                    <button type="button" class="btn btn-sm btn-danger" @click="removeImage(index)" :disabled="isSubmitting">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                  <div v-if="image.MaAnh" class="mt-1">
                    <small class="text-info">ID: {{ image.MaAnh }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManageHotels" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Updating...' : 'Update Hotel' }}
        </button>
      </div>
    </form>
    <div v-else class="alert alert-warning mx-auto" style="max-width: 800px;">
        Hotel data could not be loaded for editing.
         <button @click="goBackToManageHotels" class="btn btn-sm btn-secondary ms-2">Back</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import GeocodingAddressInput from '@/components/GeocodingAddressInput.vue';

const route = useRoute();
const router = useRouter();

const hotelId = ref(route.params.hotelId || null); // MaKS từ route
const originalHotelData = ref(null); // Dữ liệu gốc từ API

const editableHotel = reactive({
  MaKS: null,
  TenKS: '',
  DiaChi: '',
  HangSao: '',
  LoaiHinh: '',
  MoTaCoSoVatChat: '',
  QuyDinh: '',
  MotaChung: '',
  MaNguoiQuanLy: null,
  IsActive: ''
});

// Thêm các biến quản lý ảnh
const selectedImages = ref([]);
const previewImages = ref([]);
const existingImages = ref([]);
const mainImageIndex = ref(null);
const deleteImageIds = ref([]);

const pageLoading = ref(true);
const pageError = ref('');
const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

// Biến quản lý tọa độ
const hotelCoordinates = ref(null);

// Hàm chuyển đổi chuỗi số sang "X sa0"
function formatHangSaoForSelect(decimalHangSao) {
    if (decimalHangSao === null || decimalHangSao === undefined) return '';
    const sao = Math.floor(decimalHangSao); // Lấy phần nguyên
    if (sao >= 1 && sao <= 5) {
        return `${sao} sao`;
    }
    return ''; // Hoặc giá trị mặc định nếu không khớp
}

// Hàm chuyển đổi chuỗi "X sao" sang số
function parseHangSaoForPayload(stringHangSao) {
    if (!stringHangSao) return null;
    const match = stringHangSao.match(/^(\d)/); // Lấy chữ số đầu tiên
    if (match) {
        return parseFloat(match[1]);
    }
    return null; // Hoặc xử lý lỗi nếu định dạng không đúng
}

// Thêm các hàm xử lý ảnh
function handleImageSelect(event) {
  const files = event.target.files;
  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        selectedImages.value.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImages.value.push({
            url: e.target.result,
            file: file,
            isNew: true
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }
}

function removeImage(index) {
  const image = previewImages.value[index];
  
  if (image.isNew) {
    // Nếu là ảnh mới, xóa khỏi cả selectedImages và previewImages
    const fileIndex = selectedImages.value.indexOf(image.file);
    if (fileIndex > -1) {
      selectedImages.value.splice(fileIndex, 1);
    }
  } else {
    // Nếu là ảnh cũ, thêm vào danh sách ảnh cần xóa
    deleteImageIds.value.push(image.MaAnh);
  }
  
  // Xóa khỏi previewImages
  previewImages.value.splice(index, 1);
  
  // Điều chỉnh mainImageIndex
  if (mainImageIndex.value !== null) {
    if (mainImageIndex.value === index) {
      // Nếu ảnh bị xóa là ảnh main, reset về null
      mainImageIndex.value = null;
    } else if (mainImageIndex.value > index) {
      // Nếu ảnh main ở sau ảnh bị xóa, giảm index đi 1
      mainImageIndex.value = mainImageIndex.value - 1;
    }
  }
}

function setMainImage(index) {
  mainImageIndex.value = index;
}

async function fetchHotelDetails(id) {
  pageLoading.value = true;
  pageError.value = '';
  try {
    const response = await axios.get(`/api/hotels/${id}`, {
      withCredentials: true,
    });

    if (response.data && response.data.success && response.data.data) {
      const hotelDetails = response.data.data;
      originalHotelData.value = { ...hotelDetails };

      // Gán các trường thông tin cơ bản
      editableHotel.MaKS = hotelDetails.MaKS;
      editableHotel.TenKS = hotelDetails.TenKS || '';
      editableHotel.DiaChi = hotelDetails.DiaChi || '';
      editableHotel.HangSao = formatHangSaoForSelect(hotelDetails.HangSao);
      editableHotel.LoaiHinh = hotelDetails.LoaiHinh || '';
      editableHotel.MoTaCoSoVatChat = hotelDetails.MoTaCoSoVatChat || '';
      editableHotel.QuyDinh = hotelDetails.QuyDinh || '';
      editableHotel.MotaChung = hotelDetails.MotaChung || '';
      editableHotel.MaNguoiQuanLy = hotelDetails.MaNguoiQuanLy || null;
      editableHotel.IsActive = hotelDetails.IsActive;

      // Xử lý ảnh
      if (hotelDetails.AllImages && Array.isArray(hotelDetails.AllImages)) {
        existingImages.value = hotelDetails.AllImages;
        previewImages.value = hotelDetails.AllImages.map(img => ({
          ...img,
          url: img.FullPath,
          isNew: false
        }));
        // Tìm ảnh chính
        const mainIdx = hotelDetails.AllImages.findIndex(img => img.LoaiAnh === 'main');
        if (mainIdx !== -1) {
          mainImageIndex.value = mainIdx;
        }
      }

      // Set coordinates if available
      if (hotelDetails.Latitude && hotelDetails.Longitude) {
        hotelCoordinates.value = {
          latitude: hotelDetails.Latitude,
          longitude: hotelDetails.Longitude
        };
      }
    } else {
      pageError.value = response.data?.message || `Could not load hotel data for ID ${id}.`;
    }
  } catch (err) {
    pageError.value = `Error fetching hotel ID ${id}: ` + (err.response?.data?.error || err.response?.data?.message || err.message);
    console.error("Error fetching hotel details:", err.response?.data || err.message);
  } finally {
    pageLoading.value = false;
  }
}

async function submitUpdateHotel() {
  if (!editableHotel.TenKS || !editableHotel.DiaChi || !editableHotel.HangSao || !editableHotel.LoaiHinh || !editableHotel.MoTaCoSoVatChat || !editableHotel.QuyDinh ) {
    formError.value = "Please fill in all required fields marked with *.";
    return;
  }
  
  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  // Tạo FormData để gửi cả file và dữ liệu
  const formData = new FormData();
  
  // Thêm các trường thông tin cơ bản
  formData.append('TenKS', editableHotel.TenKS);
  formData.append('DiaChi', editableHotel.DiaChi);
  formData.append('HangSao', parseHangSaoForPayload(editableHotel.HangSao));
  formData.append('LoaiHinh', editableHotel.LoaiHinh);
  formData.append('MoTaCoSoVatChat', editableHotel.MoTaCoSoVatChat);
  formData.append('QuyDinh', editableHotel.QuyDinh);
  formData.append('MotaChung', editableHotel.MotaChung);
  formData.append('MaNguoiQuanLy', editableHotel.MaNguoiQuanLy === '' ? '' : editableHotel.MaNguoiQuanLy);
  formData.append('IsActive', editableHotel.IsActive);

  // Xử lý mainImageIndex - chỉ gửi nếu có giá trị hợp lệ
  if (mainImageIndex.value !== null && mainImageIndex.value >= 0 && mainImageIndex.value < previewImages.value.length) {
    const selectedImage = previewImages.value[mainImageIndex.value];
    if (selectedImage.isNew) {
      // Nếu là ảnh mới, gửi index trong selectedImages
      const newImageIndex = selectedImages.value.indexOf(selectedImage.file);
      if (newImageIndex !== -1) {
        formData.append('mainImageType', 'new');
        formData.append('mainImageIndex', newImageIndex);
      }
    } else {
      // Nếu là ảnh cũ, gửi MaAnh
      formData.append('mainImageType', 'existing');
      formData.append('mainImageId', selectedImage.MaAnh);
    }
  }
  
  // Thêm danh sách ảnh cần xóa
  if (deleteImageIds.value.length > 0) {
    formData.append('deleteImageIds', JSON.stringify(deleteImageIds.value));
  }

  // Thêm các file ảnh mới
  selectedImages.value.forEach((file) => {
    formData.append('images', file);
  });

  // Add coordinates if available
  if (hotelCoordinates.value && hotelCoordinates.value.latitude && hotelCoordinates.value.longitude) {
    formData.append('Latitude', hotelCoordinates.value.latitude);
    formData.append('Longitude', hotelCoordinates.value.longitude);
  }

  try {
    const response = await axios.put(`/api/hotels/${hotelId.value}`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && response.data.message) {
      successMessage.value = response.data.message;
      setTimeout(() => {
        goBackToManageHotels();
      }, 1000);
    } else {
      formError.value = response.data?.error || response.data?.message || "Failed to update hotel. Unexpected response.";
    }
  } catch (err) {
    console.error("Error updating hotel:", err.response?.data || err.message);
    formError.value = 'Error updating hotel: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManageHotels() {
  if(editableHotel.MaKS) {
      router.push({ name: 'AdminFindHotel', params: { hotelId: String(editableHotel.MaKS) } });
  } else {
      router.push({ name: 'AdminFindHotel' }); // Hoặc một route mặc định
  }
}


// Theo dõi nếu hotelId từ route thay đổi (dùng cho trường hợp điều hướng trực tiếp giữa các trang edit)
watch(() => route.params.hotelId, (newId) => {
  if (newId && newId !== hotelId.value) { // Chỉ fetch nếu newId khác với hotelId hiện tại của component
    hotelId.value = newId;
    fetchHotelDetails(newId);
  }
});

// Load dữ liệu khi component được mounted
onMounted(() => {
  if (hotelId.value) {
    fetchHotelDetails(hotelId.value);
  } else {
    pageError.value = "Hotel ID is missing. Cannot load data for editing.";
    pageLoading.value = false;
  }
});

// Handle geocoding events
function onGeocodingSuccess(coordinates) {
  console.log('Geocoding success:', coordinates);
  // Coordinates are automatically updated via v-model:coordinates
}

function onGeocodingError(error) {
  console.error('Geocoding error:', error);
  formError.value = `Lỗi lấy tọa độ: ${error.message}`;
}
</script>
