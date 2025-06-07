<!-- src/views/admin/hotels/EditHotelPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Edit Hotel</h1>

    <!-- Loading và Lỗi Trang -->
    <div v-if="pageLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading hotel data...</span>
      </div>
    </div>
    <div v-else-if="pageError" class="alert alert-danger mx-auto" style="max-width: 800px;">
      <p>{{ pageError }}</p>
      <button @click="goBackToManageHotels" class="btn btn-sm btn-secondary">Back to Manage Hotels</button>
    </div>

    <!-- Form Chính -->
    <form v-else-if="editableHotel.MaKS" @submit.prevent="submitFullHotelUpdate" id="mainHotelForm">

      <!-- Card 1: Thông tin Khách sạn & Upload Ảnh Mới -->
      <div class="card p-4 shadow-sm mx-auto mb-4" style="max-width: 800px;">
        <h3 class="mb-3">Hotel Information</h3>
        <hr class="my-2">

        <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <p class="text-muted">Editing Hotel ID: <strong>{{ hotelId }}</strong></p>

        <div class="row g-3 mt-1">
          <div class="col-md-6">
            <label for="tenKS" class="form-label">Hotel Name (TenKS) <span class="text-danger">*</span></label>
            <input id="tenKS" v-model.trim="editableHotel.TenKS" type="text" class="form-control" required />
          </div>
          <div class="col-md-12">
            <GeocodingAddressInput
              v-model="editableHotel.DiaChi"
              :coordinates="hotelCoordinates"
              @update:coordinates="hotelCoordinates = $event"
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
            <input id="maNguoiQuanLyEdit" v-model="editableHotel.MaNguoiQuanLy" type="text" class="form-control" placeholder="Enter User ID or leave blank"/>
            <small class="form-text text-muted">Enter User ID or leave blank to remove/keep current manager.</small>
          </div>
           <div class="col-12">
             <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="isActiveSwitch" v-model="editableHotel.IsActive">
                <label class="form-check-label" for="isActiveSwitch">Is Active</label>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-top">
          <h4 class="mb-3">Upload New Images</h4>
          <div class="mb-3">
            <label for="hotelImagesUpload" class="form-label">Select new images to add (up to 10, JPG/PNG)</label>
            <input type="file" id="hotelImagesUpload" @change="handleFileSelection" multiple class="form-control" accept="image/*" :disabled="isSubmitting">
          </div>
          <div v-if="newSelectedFiles.length > 0" class="mb-3">
            <p><strong>{{ newSelectedFiles.length }} file(s) selected for upload:</strong></p>
            <ul class="list-group mb-2">
              <li v-for="(file, index) in newSelectedFiles" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                <span style="max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ file.name }} ({{ (file.size / 1024).toFixed(2) }} KB)
                </span>
                <div class="form-check">
                  <input class="form-check-input" type="radio" :name="'newMainImageRadio'" :id="'newMainImageRadio-' + index" :value="index" v-model="selectedNewMainImageIndex">
                  <label class="form-check-label small" :for="'newMainImageRadio-' + index">
                    Set as main
                  </label>
                </div>
              </li>
            </ul>
            <small class="form-text text-muted">
              If a new main image is selected, the current main image (if any) will become a gallery image.
            </small>
          </div>
          <div v-if="uploadError" class="alert alert-danger mt-2">{{ uploadError }}</div>
        </div>
      </div>


      <div class="card p-4 shadow-sm mx-auto mb-4" style="max-width: 800px;">
        <h3 class="mb-3">Manage Existing Images</h3>
        <hr class="my-2">

        <div v-if="imageOperationError" class="alert alert-danger mt-2">{{ imageOperationError }}</div>
        <div v-if="imageOperationSuccess" class="alert alert-success mt-2">{{ imageOperationSuccess }}</div>

        <div v-if="mainHotelImage" class="mb-4">
          <h4>Main Image</h4>
          <img :src="mainHotelImage.FullPath" alt="Main hotel image" class="img-fluid rounded mb-2" style="max-height: 300px; border: 1px solid #dee2e6;">
          <p><strong>Description:</strong> {{ mainHotelImage.MoTa || 'N/A' }}</p>
          <p><small class="text-muted">File: {{ mainHotelImage.TenFile }}</small></p>
        </div>
         <div v-else-if="!pageLoading && allHotelImages.length > 0 && !mainHotelImage">
          <p class="alert alert-info">No main image set. You can set one from the gallery or upload a new one.</p>
        </div>

        <h4 class="mt-4">Gallery Images ({{ galleryHotelImages.length }})</h4>
        <div v-if="galleryHotelImages.length > 0" class="row row-cols-1 row-cols-md-2 g-3 mt-1">
          <div v-for="image in galleryHotelImages" :key="image.MaAnh" class="col">
            <div class="card h-100">
              <img :src="image.FullPath" class="card-img-top" :alt="image.MoTa || 'Hotel gallery image'" style="height: 180px; object-fit: cover;">
              <div class="card-body">
                 <div class="mb-2">
                  <label :for="'mota-' + image.MaAnh" class="form-label form-label-sm">Description:</label>
                  <input type="text" :id="'mota-' + image.MaAnh" v-model="image.editableMoTa" class="form-control form-control-sm" placeholder="Image description">
                </div>
                <div class="mb-3">
                  <label :for="'thutu-' + image.MaAnh" class="form-label form-label-sm">Display Order:</label>
                  <input type="number" :id="'thutu-' + image.MaAnh" v-model.number="image.editableThuTu" class="form-control form-control-sm" placeholder="e.g., 1, 2, 3">
                </div>
                <div class="d-flex flex-wrap gap-1 justify-content-start">
                    <button type="button" @click="updateImageDetails(image)" class="btn btn-sm btn-outline-primary" :disabled="getIsUpdatingImageDetails(image.MaAnh) || isSubmitting" title="Save description/order changes">
                        <span v-if="getIsUpdatingImageDetails(image.MaAnh)" class="spinner-border spinner-border-sm"></span> Save
                    </button>
                    <button type="button" @click="setMainImage(image.MaAnh)" class="btn btn-sm btn-outline-success" :disabled="getIsSettingMain(image.MaAnh) || isSubmitting" title="Set this existing image as main">
                        <span v-if="getIsSettingMain(image.MaAnh)" class="spinner-border spinner-border-sm"></span> Set Main
                    </button>
                    <button type="button" @click="deleteImage(image.MaAnh)" class="btn btn-sm btn-outline-danger" :disabled="getIsDeletingImage(image.MaAnh) || isSubmitting" title="Delete this image">
                        <span v-if="getIsDeletingImage(image.MaAnh)" class="spinner-border spinner-border-sm"></span> Delete
                    </button>
                </div>
              </div>
               <div class="card-footer bg-transparent border-top-0">
                <small class="text-muted">File: {{ image.TenFile }} (ID: {{image.MaAnh}})</small>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!pageLoading && !mainHotelImage && galleryHotelImages.length === 0">
          <p>No images for this hotel yet. Upload some in the section above.</p>
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-center" style="max-width: 800px; margin-left: auto; margin-right: auto; padding-bottom: 20px;">
        <button type="button" @click="goBackToManageHotels" class="btn btn-lg btn-secondary me-3" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-lg btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          {{ isSubmitting ? 'Saving All Changes...' : 'Save All Hotel Changes' }}
        </button>
      </div>

    </form>

    <div v-else-if="!pageLoading && !editableHotel.MaKS" class="alert alert-warning mx-auto" style="max-width: 800px;">
        Hotel data could not be loaded for editing. Perhaps the ID is invalid or the hotel does not exist.
         <button @click="goBackToManageHotels" class="btn btn-sm btn-secondary ms-2">Back</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import GeocodingAddressInput from '@/components/GeocodingAddressInput.vue';

const route = useRoute();
const router = useRouter();

const hotelId = ref(null); // Sẽ được set trong onMounted/watch
const originalHotelData = ref(null);

const editableHotel = reactive({
  MaKS: null,
  TenKS: '',
  DiaChi: '',
  HangSao: '',
  LoaiHinh: '',
  MoTaCoSoVatChat: '',
  QuyDinh: '',
  MotaChung: '',
  MaNguoiQuanLy: '',
  IsActive: true,
});

const hotelCoordinates = ref(null);

const pageLoading = ref(true);
const pageError = ref('');
const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

const allHotelImages = ref([]);
const newSelectedFiles = ref([]);
const selectedNewMainImageIndex = ref(null);
const uploadError = ref('');
const imageOperationError = ref('');
const imageOperationSuccess = ref('');
const imageOperationsLoading = reactive({
    deleting: {},
    settingMain: {},
    updatingDetails: {}
});

const mainHotelImage = computed(() => allHotelImages.value.find(img => img.LoaiAnh === 'main'));
const galleryHotelImages = computed(() => {
    return allHotelImages.value
        .filter(img => img.LoaiAnh === 'gallery')
        .map(img => ({
            ...img,
            editableMoTa: img.MoTa || '',
            editableThuTu: img.ThuTu === null || img.ThuTu === undefined ? '' : img.ThuTu
        }))
        .sort((a, b) => (a.editableThuTu === '' || a.editableThuTu === null ? Infinity : a.editableThuTu) - (b.editableThuTu === '' || b.editableThuTu === null ? Infinity : b.editableThuTu) || new Date(a.NgayThem).getTime() - new Date(b.NgayThem).getTime());
});

const getIsDeletingImage = (maAnh) => !!imageOperationsLoading.deleting[maAnh];
const getIsSettingMain = (maAnh) => !!imageOperationsLoading.settingMain[maAnh];
const getIsUpdatingImageDetails = (maAnh) => !!imageOperationsLoading.updatingDetails[maAnh];

function formatHangSaoForSelect(decimalHangSao) {
    if (decimalHangSao === null || decimalHangSao === undefined) return '';
    const sao = Math.floor(decimalHangSao);
    return (sao >= 1 && sao <= 5) ? `${sao} sao` : '';
}

function parseHangSaoForPayload(stringHangSao) {
    if (!stringHangSao) return null;
    const match = stringHangSao.match(/^(\d)/);
    return match ? match[1] : null; // Backend sẽ parse sang số
}

async function fetchHotelDataAndImages(id) {
  console.log('[FETCH] fetchHotelDataAndImages called with ID:', id);
  if (!id) {
      console.error('[FETCH] fetchHotelDataAndImages called with invalid ID:', id);
      pageError.value = "Invalid Hotel ID for fetching data.";
      pageLoading.value = false;
      editableHotel.MaKS = null;
      return;
  }
  pageLoading.value = true;
  pageError.value = ''; formError.value = ''; successMessage.value = '';
  imageOperationError.value = ''; imageOperationSuccess.value = '';
  uploadError.value = ''; newSelectedFiles.value = []; selectedNewMainImageIndex.value = null;
  hotelCoordinates.value = null;

  try {
    const response = await axios.get(`http://localhost:5000/api/hotels/${id}`, {
      withCredentials: true,
    });

    if (response.data && response.data.success && response.data.data) {
      const hotelDetails = response.data.data; // Toàn bộ object data từ getHotelById

      originalHotelData.value = { ...hotelDetails };

      editableHotel.MaKS = hotelDetails.MaKS;
      editableHotel.TenKS = hotelDetails.TenKS || '';
      editableHotel.DiaChi = hotelDetails.DiaChi || '';
      editableHotel.HangSao = formatHangSaoForSelect(hotelDetails.HangSao);
      editableHotel.LoaiHinh = hotelDetails.LoaiHinh || '';
      editableHotel.MoTaCoSoVatChat = hotelDetails.MoTaCoSoVatChat || '';
      editableHotel.QuyDinh = hotelDetails.QuyDinh || '';
      editableHotel.MotaChung = hotelDetails.MotaChung || '';
      editableHotel.MaNguoiQuanLy = hotelDetails.MaNguoiQuanLy !== null && hotelDetails.MaNguoiQuanLy !== undefined ? String(hotelDetails.MaNguoiQuanLy) : '';
      editableHotel.IsActive = hotelDetails.IsActive !== undefined ? hotelDetails.IsActive : true;

      if (hotelDetails.Latitude != null && hotelDetails.Longitude != null) {
        hotelCoordinates.value = {
          latitude: parseFloat(hotelDetails.Latitude),
          longitude: parseFloat(hotelDetails.Longitude)
        };
      }
      // Giả sử backend trả về mảng ảnh với key là AllImages hoặc AnhKhachSan
      allHotelImages.value = hotelDetails.AllImages || hotelDetails.AnhKhachSan || [];

    } else {
      pageError.value = response.data?.message || `Could not load hotel data and images for ID ${id}.`;
      editableHotel.MaKS = null;
    }
  } catch (err) {
    pageError.value = `Error fetching hotel (ID ${id}): ` + (err.response?.data?.error || err.response?.data?.message || err.message);
    console.error("Error fetching hotel data and images:", err);
    editableHotel.MaKS = null;
  } finally {
    pageLoading.value = false;
  }
}

async function submitFullHotelUpdate() {
  if (!editableHotel.TenKS || !editableHotel.DiaChi || !editableHotel.HangSao || !editableHotel.LoaiHinh || !editableHotel.MoTaCoSoVatChat || !editableHotel.QuyDinh ) {
    formError.value = "Please fill in all required Hotel Information fields marked with *.";
    successMessage.value = '';
    window.scrollTo(0,0);
    return;
  }
  isSubmitting.value = true;
  formError.value = ''; successMessage.value = ''; uploadError.value = '';

  const hotelDataPayload = {
    TenKS: editableHotel.TenKS,
    DiaChi: editableHotel.DiaChi,
    HangSao: parseHangSaoForPayload(editableHotel.HangSao),
    LoaiHinh: editableHotel.LoaiHinh,
    MoTaCoSoVatChat: editableHotel.MoTaCoSoVatChat,
    QuyDinh: editableHotel.QuyDinh,
    MotaChung: editableHotel.MotaChung || null,
    IsActive: editableHotel.IsActive
  };

  const managerIdInput = editableHotel.MaNguoiQuanLy.trim();
  if (managerIdInput) {
    const parsedId = parseInt(managerIdInput, 10);
    if (isNaN(parsedId)) {
      formError.value = "Manager ID must be a valid number or left blank.";
      isSubmitting.value = false;
      return;
    }
    hotelDataPayload.MaNguoiQuanLy = parsedId;
  } else {
    hotelDataPayload.MaNguoiQuanLy = null;
  }

  if (hotelCoordinates.value && hotelCoordinates.value.latitude != null && hotelCoordinates.value.longitude != null) {
    hotelDataPayload.Latitude = hotelCoordinates.value.latitude;
    hotelDataPayload.Longitude = hotelCoordinates.value.longitude;
  }

  let requestPayload = new FormData(); // Luôn dùng FormData nếu backend updateHotel xử lý
  let headers = { 'Content-Type': 'multipart/form-data' }; // Header cho FormData

  // Append từng trường của hotelDataPayload vào FormData
  for (const key in hotelDataPayload) {
    if (hotelDataPayload[key] !== null && hotelDataPayload[key] !== undefined) {
      // Chuyển boolean thành string 'true'/'false' cho FormData
      if (typeof hotelDataPayload[key] === 'boolean') {
          requestPayload.append(key, String(hotelDataPayload[key]));
      } else {
          requestPayload.append(key, hotelDataPayload[key]);
      }
    } else if (key === 'MaNguoiQuanLy' && hotelDataPayload[key] === null) {
        requestPayload.append(key, ''); // Gửi chuỗi rỗng để backend hiểu là null cho MaNguoiQuanLy
    }
  }

  if (newSelectedFiles.value.length > 0) {
    newSelectedFiles.value.forEach(file => {
      requestPayload.append('images', file);
    });
    if (selectedNewMainImageIndex.value !== null) {
      requestPayload.append('mainImageIndex', selectedNewMainImageIndex.value);
    }
  }
  // Nếu không có file mới, requestPayload sẽ chỉ chứa các trường thông tin khách sạn.
  // Backend cần kiểm tra `req.files` để biết có file hay không.

  try {
    const response = await axios.put(`http://localhost:5000/api/hotels/${hotelId.value}`, requestPayload, {
      headers: headers, // Sử dụng header đã set cho FormData
      withCredentials: true
    });

    if (response.data && response.data.success) {
      successMessage.value = response.data.message || "Hotel updated successfully!";
      newSelectedFiles.value = [];
      selectedNewMainImageIndex.value = null;
      if (document.getElementById('hotelImagesUpload')) {
        document.getElementById('hotelImagesUpload').value = null;
      }
      await fetchHotelDataAndImages(hotelId.value);
      setTimeout(() => {
        if (!formError.value && !uploadError.value) {
            goBackToManageHotels();
        }
      }, 1000);
    } else {
      formError.value = response.data?.error || response.data?.message || "Failed to update hotel.";
    }
  } catch (err) {
    console.error("Error updating hotel:", err.response?.data || err.message);
    let errorMsg = 'Error saving hotel changes.';
    if(err.response?.data?.errors && Array.isArray(err.response.data.errors)){
        errorMsg += " " + err.response.data.errors.map(e => e.msg || e.message).join(', ');
    } else {
        errorMsg += ` ${err.response?.data?.error || err.response?.data?.message || err.message}`;
    }
    formError.value = errorMsg;
  } finally {
    isSubmitting.value = false;
  }
}


function handleFileSelection(event) {
  uploadError.value = ''; formError.value = ''; successMessage.value = '';
  selectedNewMainImageIndex.value = null;

  const files = Array.from(event.target.files);
  if (files.length > 10) {
    uploadError.value = "You can select a maximum of 10 images to upload at a time.";
    newSelectedFiles.value = [];
    event.target.value = null;
  } else {
    newSelectedFiles.value = files;
    if (files.length === 1 && (mainHotelImage.value === null || mainHotelImage.value === undefined)) { // Tự động chọn làm main nếu chưa có main và chỉ upload 1 ảnh
      selectedNewMainImageIndex.value = 0;
    }
  }
}

async function deleteImage(maAnh) {
  if (!confirm(`Are you sure you want to delete this image (ID: ${maAnh})? This cannot be undone.`)) return;
  imageOperationError.value = ''; imageOperationSuccess.value = '';
  imageOperationsLoading.deleting[maAnh] = true;
  try {
    const response = await axios.delete(`http://localhost:5000/api/hotels/images/${maAnh}`, { withCredentials: true });
    if (response.data?.success) {
      imageOperationSuccess.value = response.data.message || "Image deleted successfully.";
      await fetchHotelDataAndImages(hotelId.value);
    } else {
      imageOperationError.value = response.data?.message || "Failed to delete image.";
    }
  } catch (err) {
    imageOperationError.value = 'Error deleting image: ' + (err.response?.data?.error ||  err.response?.data?.message || err.message);
  } finally {
    imageOperationsLoading.deleting[maAnh] = false;
  }
}

async function setMainImage(maAnh) {
  imageOperationError.value = ''; imageOperationSuccess.value = '';
  imageOperationsLoading.settingMain[maAnh] = true;
  try {
    const response = await axios.put(`http://localhost:5000/api/hotels/images/${maAnh}/set-main`, {}, { withCredentials: true });
    if (response.data?.success) {
      imageOperationSuccess.value = response.data.message || "Main image set successfully.";
      await fetchHotelDataAndImages(hotelId.value);
    } else {
      imageOperationError.value = response.data?.message || "Failed to set main image.";
    }
  } catch (err) {
    imageOperationError.value = 'Error setting main image: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    imageOperationsLoading.settingMain[maAnh] = false;
  }
}

async function updateImageDetails(image) {
  imageOperationError.value = ''; imageOperationSuccess.value = '';
  imageOperationsLoading.updatingDetails[image.MaAnh] = true;

  const payload = { MoTa: image.editableMoTa };
  const thuTuValue = image.editableThuTu === '' || image.editableThuTu === null ? null : parseInt(image.editableThuTu, 10);

  if (image.editableThuTu !== '' && image.editableThuTu !== null && isNaN(thuTuValue)) {
      imageOperationError.value = `Invalid order value for image ID ${image.MaAnh}. Must be a number or empty.`;
      imageOperationsLoading.updatingDetails[image.MaAnh] = false;
      return;
  }
  payload.ThuTu = thuTuValue;

  try {
    const response = await axios.put(`http://localhost:5000/api/hotels/images/${image.MaAnh}`, payload, { withCredentials: true });
    if (response.data?.success) {
      imageOperationSuccess.value = response.data.message || `Image ${image.MaAnh} details updated.`;
      await fetchHotelDataAndImages(hotelId.value);
    } else {
      imageOperationError.value = response.data?.message || `Failed to update image ${image.MaAnh} details.`;
    }
  } catch (err) {
    imageOperationError.value = `Error updating image ${image.MaAnh}: ` + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    imageOperationsLoading.updatingDetails[image.MaAnh] = false;
  }
}

function goBackToManageHotels() {
  router.push({ name: 'AdminFindHotel' }); // Đảm bảo đây là route name quản lý khách sạn của bạn
}

watch(() => route.params.hotelId, (newIdFromRoute) => {
  console.log('[WATCHER] route.params.hotelId changed. newIdFromRoute:', newIdFromRoute, 'current hotelId.value:', hotelId.value);
  if (newIdFromRoute !== undefined && newIdFromRoute !== hotelId.value) {
    if (newIdFromRoute) {
      console.log('[WATCHER] Calling fetch for new ID:', newIdFromRoute);
      hotelId.value = newIdFromRoute;
      fetchHotelDataAndImages(newIdFromRoute);
    } else {
      console.log('[WATCHER] hotelId removed from route.');
      hotelId.value = null;
      pageError.value = "Hotel ID removed from route parameters.";
      pageLoading.value = false;
      editableHotel.MaKS = null;
      // Reset thêm các state khác nếu cần
    }
  } else {
    console.log('[WATCHER] No change or newIdFromRoute is undefined or same as current hotelId.');
  }
});

onMounted(() => {
  const idFromRoute = route.params.hotelId;
  console.log('[ONMOUNTED] Component mounted. idFromRoute:', idFromRoute);
  if (idFromRoute) {
    hotelId.value = idFromRoute;
    console.log('[ONMOUNTED] Calling fetch for ID:', idFromRoute);
    fetchHotelDataAndImages(idFromRoute);
  } else {
    console.log('[ONMOUNTED] No hotelId in route on mount.');
    pageError.value = "Hotel ID is missing in route. Cannot load data for editing.";
    pageLoading.value = false;
    editableHotel.MaKS = null;
  }
});


function onGeocodingSuccess(coordinates) {
  formError.value = '';
  // `hotelCoordinates` được cập nhật qua @update:coordinates="hotelCoordinates = $event"
}

function onGeocodingError(error) {
  console.error('Geocoding error in parent:', error);
  formError.value = `Lỗi tìm kiếm địa chỉ: ${error.message || 'Không thể lấy tọa độ cho địa chỉ này.'}`;
  hotelCoordinates.value = null; // Xóa tọa độ nếu geocode lỗi
}
</script>

<style scoped>
.card-img-top {
  border-bottom: 1px solid #eee;
  width: 100%;
  object-fit: cover;
}
.form-label-sm {
    font-size: .875em;
    margin-bottom: .25rem;
}
.gap-1 {
    gap: 0.25rem !important;
}
.img-fluid.rounded.mb-2 {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 100%;
}
</style>