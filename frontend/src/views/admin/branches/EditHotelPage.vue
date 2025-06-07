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

    <!-- THẺ FORM CHÍNH BẮT ĐẦU Ở ĐÂY -->
    <form v-else-if="editableHotel.MaKS" @submit.prevent="submitFullHotelUpdate" id="mainHotelForm">

      <!-- Card 1: Hotel Information & New Image Upload -->
      <div class="card p-4 shadow-sm mx-auto mb-4" style="max-width: 800px;">
        <h3 class="mb-3">Hotel Information</h3>
        <hr class="my-2">

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

        <!-- Upload New Images Section -->
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
              If a new main image is selected, the current main image (if any) will become a gallery image by backend logic.
            </small>
          </div>
          <div v-if="uploadError" class="alert alert-danger mt-2">{{ uploadError }}</div>
        </div>
      </div> <!-- Kết thúc Card 1 -->


      <!-- Card 2: Existing Image Management -->
      <div class="card p-4 shadow-sm mx-auto mb-4" style="max-width: 800px;">
        <h3 class="mb-3">Manage Existing Images</h3>
        <hr class="my-2">

        <div v-if="imageOperationError" class="alert alert-danger mt-2">{{ imageOperationError }}</div>
        <div v-if="imageOperationSuccess" class="alert alert-success mt-2">{{ imageOperationSuccess }}</div>

        <!-- Display Main Image -->
        <div v-if="mainHotelImage" class="mb-4">
          <h4>Main Image</h4>
          <img :src="mainHotelImage.FullPath" alt="Main hotel image" class="img-fluid rounded mb-2" style="max-height: 300px; border: 1px solid #dee2e6;">
          <p><strong>Description:</strong> {{ mainHotelImage.MoTa || 'N/A' }}</p>
          <p><small class="text-muted">File: {{ mainHotelImage.TenFile }}</small></p>
        </div>
         <div v-else-if="!pageLoading && allHotelImages.length > 0 && !mainHotelImage">
          <p class="alert alert-info">No main image set.</p>
        </div>


        <!-- Display Gallery Images & Manage -->
        <h4 class="mt-4">Gallery Images ({{ galleryHotelImages.length }})</h4>
        <div v-if="galleryHotelImages.length > 0" class="row row-cols-1 row-cols-md-2 g-3 mt-1">
          <div v-for="image in galleryHotelImages" :key="image.MaAnh" class="col">
            <div class="card h-100">
              <img :src="image.FullPath" class="card-img-top" :alt="image.MoTa || 'Hotel gallery image'" style="height: 180px; object-fit: cover;">
              <div class="card-body">
                <!-- ... (Nội dung chỉnh sửa meta ảnh gallery) ... -->
                 <div class="mb-2">
                  <label :for="'mota-' + image.MaAnh" class="form-label form-label-sm">Description:</label>
                  <input type="text" :id="'mota-' + image.MaAnh" v-model="image.editableMoTa" class="form-control form-control-sm" placeholder="Image description">
                </div>
                <div class="mb-3">
                  <label :for="'thutu-' + image.MaAnh" class="form-label form-label-sm">Display Order:</label>
                  <input type="number" :id="'thutu-' + image.MaAnh" v-model.number="image.editableThuTu" class="form-control form-control-sm" placeholder="e.g., 1, 2, 3">
                </div>
                <div class="d-flex flex-wrap gap-1 justify-content-start">
                    <button @click="updateImageDetails(image)" class="btn btn-sm btn-outline-primary" :disabled="getIsUpdatingImageDetails(image.MaAnh) || isSubmitting" title="Save description/order changes">
                        <span v-if="getIsUpdatingImageDetails(image.MaAnh)" class="spinner-border spinner-border-sm"></span> Save
                    </button>
                    <button @click="setMainImage(image.MaAnh)" class="btn btn-sm btn-outline-success" :disabled="getIsSettingMain(image.MaAnh) || isSubmitting" title="Set this existing image as main">
                        <span v-if="getIsSettingMain(image.MaAnh)" class="spinner-border spinner-border-sm"></span> Set Main
                    </button>
                    <button @click="deleteImage(image.MaAnh)" class="btn btn-sm btn-outline-danger" :disabled="getIsDeletingImage(image.MaAnh) || isSubmitting" title="Delete this image">
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
        <div v-else-if="!pageLoading && (!mainHotelImage && galleryHotelImages.length === 0)">
          <p>No images for this hotel yet.</p>
        </div>
      </div> <!-- Kết thúc Card 2 -->

      <!-- CÁC NÚT CHÍNH ĐẶT Ở ĐÂY, BÊN TRONG FORM NHƯNG NGOÀI CÁC CARD CON -->
      <div class="mt-4 d-flex justify-content-center" style="max-width: 800px; margin-left: auto; margin-right: auto; padding-bottom: 20px;">
        <button type="button" @click="goBackToManageHotels" class="btn btn-lg btn-secondary me-3" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-lg btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          {{ isSubmitting ? 'Saving...' : 'Save All Hotel Changes' }}
        </button>
      </div>

    </form> <!-- THẺ FORM CHÍNH KẾT THÚC Ở ĐÂY -->

    <div v-else class="alert alert-warning mx-auto" style="max-width: 800px;">
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

const hotelId = ref(route.params.hotelId || null);
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
  MaNguoiQuanLy: '', // Store as string for input, parse before sending
  IsActive: true
});

const pageLoading = ref(true);
const pageError = ref('');
const isSubmitting = ref(false); // General submitting state for the main form
const formError = ref(''); // For main form errors
const successMessage = ref(''); // For main form success

// Image-related state
const allHotelImages = ref([]);
const newSelectedFiles = ref([]);
const selectedNewMainImageIndex = ref(null); // Index of the file in newSelectedFiles to be main

const uploadError = ref(''); // Specifically for errors during file input validation/selection phase (e.g. too many files)

const imageOperationError = ref(''); // For errors on existing image operations (delete, set main, update meta)
const imageOperationSuccess = ref(''); // For success on existing image operations

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
        .sort((a, b) => (a.ThuTu === '' || a.ThuTu === null ? Infinity : a.ThuTu) - (b.ThuTu === '' || b.ThuTu === null ? Infinity : b.ThuTu) || new Date(a.NgayThem).getTime() - new Date(b.NgayThem).getTime());
});

const getIsDeletingImage = (maAnh) => !!imageOperationsLoading.deleting[maAnh];
const getIsSettingMain = (maAnh) => !!imageOperationsLoading.settingMain[maAnh];
const getIsUpdatingImageDetails = (maAnh) => !!imageOperationsLoading.updatingDetails[maAnh];


// Biến quản lý tọa độ
const hotelCoordinates = ref(null);

// Hàm chuyển đổi chuỗi số sang "X sa0"
function formatHangSaoForSelect(decimalHangSao) {
    if (decimalHangSao === null || decimalHangSao === undefined) return '';
    const sao = Math.floor(decimalHangSao);
    if (sao >= 1 && sao <= 5) {
        return `${sao} sao`;
    }
    return '';
}

function parseHangSaoForPayload(stringHangSao) {
    if (!stringHangSao) return null;
    const match = stringHangSao.match(/^(\d(\.\d)?)/); // Allows for 3 or 3.0 etc from input if needed
    if (match) {
        // Return as string "3" or "3.0", backend will parseFloat. Or parseFloat here if backend strictly expects number.
        // Assuming backend's parseFloat is robust for '3' or '3.0'.
        return match[1];
    }
    return null;
}


async function fetchHotelData(id) {
  pageLoading.value = true;
  pageError.value = '';
  allHotelImages.value = [];
  imageOperationError.value = '';
  imageOperationSuccess.value = '';
  uploadError.value = '';
  formError.value = '';
  successMessage.value = '';
  newSelectedFiles.value = [];
  selectedNewMainImageIndex.value = null;


  try {
    const response = await axios.get(`http://localhost:5000/api/hotels/${id}/images`, {
      withCredentials: true,
    });

    if (response.data && response.data.success && response.data.data) {
      const hotelDataWithImages = response.data.data;
      originalHotelData.value = { ...hotelDataWithImages };

      editableHotel.MaKS = hotelDataWithImages.MaKS;
      editableHotel.TenKS = hotelDataWithImages.TenKS || '';
      editableHotel.DiaChi = hotelDataWithImages.DiaChi || '';
      editableHotel.HangSao = formatHangSaoForSelect(hotelDataWithImages.HangSao);
      editableHotel.LoaiHinh = hotelDataWithImages.LoaiHinh || '';
      editableHotel.MoTaCoSoVatChat = hotelDataWithImages.MoTaCoSoVatChat || '';
      editableHotel.QuyDinh = hotelDataWithImages.QuyDinh || '';
      editableHotel.MotaChung = hotelDataWithImages.MotaChung || '';
      // Store MaNguoiQuanLy as string for the input field, parse before sending
      editableHotel.MaNguoiQuanLy = hotelDataWithImages.MaNguoiQuanLy !== null && hotelDataWithImages.MaNguoiQuanLy !== undefined ? String(hotelDataWithImages.MaNguoiQuanLy) : '';
      editableHotel.IsActive = hotelDataWithImages.IsActive !== undefined ? hotelDataWithImages.IsActive : true;

      // Set coordinates if available
      if (hotelDetails.Latitude && hotelDetails.Longitude) {
        hotelCoordinates.value = {
          latitude: hotelDetails.Latitude,
          longitude: hotelDetails.Longitude
        };
      }

    } else {
      pageError.value = response.data?.message || `Could not load hotel data for ID ${id}.`;
      editableHotel.MaKS = null;
    }
  } catch (err) {
    pageError.value = `Error fetching hotel ID ${id}: ` + (err.response?.data?.error || err.response?.data?.message || err.message);
    console.error("Error fetching hotel data:", err.response?.data || err.message);
    editableHotel.MaKS = null;
  } finally {
    pageLoading.value = false;
  }
}

async function submitFullHotelUpdate() {
  if (!editableHotel.TenKS || !editableHotel.DiaChi || !editableHotel.HangSao || !editableHotel.LoaiHinh || !editableHotel.MoTaCoSoVatChat || !editableHotel.QuyDinh ) {
    formError.value = "Please fill in all required Hotel Information fields marked with *.";
    successMessage.value = '';
    return;
  }
  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';
  uploadError.value = ''; // Clear any previous file selection errors

  let requestPayload;
  let headers = { 'Content-Type': 'application/json' }; // Default for no files

  const parsedManagerId = editableHotel.MaNguoiQuanLy && editableHotel.MaNguoiQuanLy.trim() !== '' ? parseInt(editableHotel.MaNguoiQuanLy.trim(), 10) : null;
  if (editableHotel.MaNguoiQuanLy && editableHotel.MaNguoiQuanLy.trim() !== '' && isNaN(parsedManagerId)) {
    formError.value = "Manager ID must be a valid number or blank.";
    isSubmitting.value = false;
    return;
  }
  // Add coordinates if available
  if (hotelCoordinates.value && hotelCoordinates.value.latitude && hotelCoordinates.value.longitude) {
    payload.Latitude = hotelCoordinates.value.latitude;
    payload.Longitude = hotelCoordinates.value.longitude;
  }

  if (editableHotel.MaNguoiQuanLy !== undefined) { // Gửi cả khi nó là null để cho phép xóa người quản lý
      payload.MaNguoiQuanLy = editableHotel.MaNguoiQuanLy === '' ? null : parseInt(editableHotel.MaNguoiQuanLy, 10);
      if (editableHotel.MaNguoiQuanLy !== '' && editableHotel.MaNguoiQuanLy !== null && isNaN(payload.MaNguoiQuanLy)) {
          formError.value = "Manager ID must be a valid number or empty to remove.";
          isSubmitting.value = false;
          return;
      }
  }

  if (newSelectedFiles.value.length > 0) {
    headers['Content-Type'] = 'multipart/form-data';
    requestPayload = new FormData();

    requestPayload.append('TenKS', editableHotel.TenKS);
    requestPayload.append('DiaChi', editableHotel.DiaChi);
    const hangSaoPayloadValue = parseHangSaoForPayload(editableHotel.HangSao);
    if (hangSaoPayloadValue !== null) {
      requestPayload.append('HangSao', hangSaoPayloadValue); // Backend will parseFloat
    }
    requestPayload.append('LoaiHinh', editableHotel.LoaiHinh);
    requestPayload.append('MoTaCoSoVatChat', editableHotel.MoTaCoSoVatChat);
    requestPayload.append('QuyDinh', editableHotel.QuyDinh);
    requestPayload.append('MotaChung', editableHotel.MotaChung || ''); // Send empty string for null if BE expects it
    if (parsedManagerId !== null) {
      requestPayload.append('MaNguoiQuanLy', parsedManagerId);
    } else {
      requestPayload.append('MaNguoiQuanLy', ''); // Send empty string to signify null/remove for manager
    }
    requestPayload.append('IsActive', String(editableHotel.IsActive)); // FormData sends booleans as strings "true"/"false"

    newSelectedFiles.value.forEach(file => {
      requestPayload.append('images', file); // Key 'images' must match multer field name
    });

    if (selectedNewMainImageIndex.value !== null && selectedNewMainImageIndex.value !== undefined) {
      requestPayload.append('mainImageIndex', selectedNewMainImageIndex.value);
    }
  } else {
    // No new files, send JSON payload
    requestPayload = {
      TenKS: editableHotel.TenKS,
      DiaChi: editableHotel.DiaChi,
      HangSao: parseHangSaoForPayload(editableHotel.HangSao), // Send as string "3" or "3.0" or null
      LoaiHinh: editableHotel.LoaiHinh,
      MoTaCoSoVatChat: editableHotel.MoTaCoSoVatChat,
      QuyDinh: editableHotel.QuyDinh,
      MotaChung: editableHotel.MotaChung || null, // Send null for empty
      MaNguoiQuanLy: parsedManagerId, // Will be null or integer
      IsActive: editableHotel.IsActive
    };
  }

  try {
    // This single PUT request goes to your `uploadHotelWithImages` if `uploadHotelImages.array` middleware is used
    // or to a simple hotel update if no `uploadHotelImages` middleware (based on route definition)
    const response = await axios.put(`http://localhost:5000/api/hotels/${hotelId.value}`, requestPayload, {
      headers: headers,
      withCredentials: true
    });

    if (response.data && response.data.success) {
      successMessage.value = response.data.message || "Hotel updated successfully!";
      newSelectedFiles.value = [];
      selectedNewMainImageIndex.value = null;
      if (document.getElementById('hotelImagesUpload')) {
        document.getElementById('hotelImagesUpload').value = null;
      }
      setTimeout(() => {
        goBackToManageHotels();
      }, 1000);
    } else {
      formError.value = response.data?.error || response.data?.message || "Failed to update hotel.";
    }
  } catch (err) {
    console.error("Error updating hotel:", err.response?.data || err.message);
    formError.value = 'Error saving hotel changes: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}


function handleFileSelection(event) {
  uploadError.value = ''; // Clear previous file selection error
  formError.value = ''; // Clear form errors too
  successMessage.value = '';
  selectedNewMainImageIndex.value = null; // Reset main image selection

  const files = Array.from(event.target.files);
  if (files.length > 10) {
    uploadError.value = "You can select a maximum of 10 images to upload at a time.";
    newSelectedFiles.value = files.slice(0, 10);
    // To make the input reflect this slice, you'd need a more complex way or just show error and user reselects
    event.target.value = null; // Clear the input so user can try again if they want to change
  } else {
    newSelectedFiles.value = files;
  }
}

// ---- Existing Image Management Functions (Delete, Set Main, Update Details) ----
// These remain largely the same as they operate on *existing* images via different endpoints.

async function deleteImage(maAnh) {
  if (!confirm(`Are you sure you want to delete this image (ID: ${maAnh})? This cannot be undone.`)) {
    return;
  }
  imageOperationError.value = '';
  imageOperationSuccess.value = '';

  imageOperationsLoading.deleting[maAnh] = true;
  try {
    const response = await axios.delete(`http://localhost:5000/api/hotels/images/${maAnh}`, {
      withCredentials: true,
    });
    if (response.data && response.data.success) {
      imageOperationSuccess.value = response.data.message || "Image deleted successfully.";
      await fetchHotelData(hotelId.value); // Refresh
    } else {
      imageOperationError.value = response.data?.message || "Failed to delete image.";
    }
  } catch (err) {
    imageOperationError.value = 'Error deleting image: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    imageOperationsLoading.deleting[maAnh] = false;
  }
}

async function setMainImage(maAnh) { // For existing gallery images
  imageOperationError.value = '';
  imageOperationSuccess.value = '';

  imageOperationsLoading.settingMain[maAnh] = true;
  try {
    const response = await axios.put(`http://localhost:5000/api/hotels/images/${maAnh}/set-main`, {}, {
      withCredentials: true,
    });
    if (response.data && response.data.success) {
      imageOperationSuccess.value = response.data.message || "Main image set successfully.";
      await fetchHotelData(hotelId.value); // Refresh
    } else {
      imageOperationError.value = response.data?.message || "Failed to set main image.";
    }
  } catch (err) {
    imageOperationError.value = 'Error setting main image: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    imageOperationsLoading.settingMain[maAnh] = false;
  }
}

async function updateImageDetails(image) { // For existing images' metadata
  imageOperationError.value = '';
  imageOperationSuccess.value = '';
  imageOperationsLoading.updatingDetails[image.MaAnh] = true;

  const payload = {};
  payload.MoTa = image.editableMoTa;

  const thuTuValue = image.editableThuTu === '' || image.editableThuTu === null ? null : parseInt(image.editableThuTu, 10);
  if (image.editableThuTu !== '' && image.editableThuTu !== null && isNaN(thuTuValue)) {
      imageOperationError.value = `Invalid order value for image ID ${image.MaAnh}. Must be a number or empty.`;
      imageOperationsLoading.updatingDetails[image.MaAnh] = false;
      return;
  }
  payload.ThuTu = thuTuValue;

  try {
    const response = await axios.put(`http://localhost:5000/api/hotels/images/${image.MaAnh}`, payload, {
      withCredentials: true,
    });
    if (response.data && response.data.success) {
      imageOperationSuccess.value = response.data.message || `Image ${image.MaAnh} details updated.`;
      // Optimistic update (already bound via v-model) or full re-fetch
      const updatedImageIndex = allHotelImages.value.findIndex(img => img.MaAnh === image.MaAnh);
      if (updatedImageIndex !== -1) {
        allHotelImages.value[updatedImageIndex].MoTa = response.data.data.MoTa;
        allHotelImages.value[updatedImageIndex].ThuTu = response.data.data.ThuTu;
      }
      // Re-sort if order changed - or simply re-fetch
      await fetchHotelData(hotelId.value); 
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
  router.push({ name: 'AdminFindHotel' });
}

watch(() => route.params.hotelId, (newId, oldId) => {
  if (newId && newId !== hotelId.value) {
    hotelId.value = newId;
    fetchHotelData(newId);
  } else if (!newId && oldId) {
      pageError.value = "No Hotel ID provided for editing.";
      pageLoading.value = false;
      editableHotel.MaKS = null;
      originalHotelData.value = null;
      allHotelImages.value = [];
  }
});

onMounted(() => {
  if (hotelId.value) {
    fetchHotelData(hotelId.value);
  } else {
    pageError.value = "Hotel ID is missing. Cannot load data for editing.";
    pageLoading.value = false;
    editableHotel.MaKS = null;
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

<style scoped>
.card-img-top {
  border-bottom: 1px solid #eee;
}
.form-label-sm {
    font-size: .875em;
    margin-bottom: .25rem;
}
.gap-1 { 
    gap: 0.25rem !important;
}
</style>
