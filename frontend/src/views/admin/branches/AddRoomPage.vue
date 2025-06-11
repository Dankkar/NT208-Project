<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Add New Room</h1>
    <p v-if="selectedHotel && selectedRoomType" class="text-center text-muted mb-4">
      For Hotel: <strong>{{ selectedHotel.TenKS }}</strong> (ID: {{ hotelId }}) - 
      Room Type: <strong>{{ selectedRoomType.TenLoaiPhong }}</strong>
    </p>
    <div v-if="pageLoading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="pageError" class="alert alert-danger">{{ pageError }}</div>

    <form v-else @submit.prevent="submitAddRoom" class="card p-4 shadow-sm">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="row g-3">
        <!-- Hidden fields -->
        <input type="hidden" :value="hotelId" />
        <input type="hidden" :value="roomTypeId" />

        <!-- 1. Số Phòng -->
        <div class="col-md-6">
          <label for="soPhong" class="form-label">Room Number <span class="text-danger">*</span></label>
          <input id="soPhong" v-model="roomData.SoPhong" type="text" class="form-control" required />
        </div>

        <!-- 2. Tầng -->
        <div class="col-md-6">
          <label for="tang" class="form-label">Floor</label>
          <input id="tang" v-model.number="roomData.Tang" type="number" step="1" min="1" class="form-control" />
        </div>

        <!-- 3. Cấu Hình Giường -->
        <div class="col-12">
          <label for="maCauHinhGiuong" class="form-label">Bed Configuration <span class="text-danger">*</span></label>
          <div v-if="loadingBedConfigs" class="text-center mt-2">
            <div class="spinner-border spinner-border-sm"></div> Loading bed configurations...
          </div>
          <div v-else>
            <select id="maCauHinhGiuong" v-model="roomData.MaCauHinhGiuong" class="form-select" required>
              <option value="">-- Select Bed Configuration --</option>
              <option v-for="config in bedConfigs" :key="config.MaCauHinhGiuong" :value="config.MaCauHinhGiuong">
                {{ config.TenCauHinh }} ({{ config.SoGiuongDoi }} double + {{ config.SoGiuongDon }} single)
              </option>
            </select>
          </div>
        </div>

        <!-- 4. Trạng Thái Phòng -->
        <div class="col-md-6">
          <label for="trangThaiPhong" class="form-label">Room Status</label>
          <select id="trangThaiPhong" v-model="roomData.TrangThaiPhong" class="form-select">
            <option value="Sẵn sàng">Sẵn sàng</option>
            <option value="Bảo trì">Bảo trì</option>
            <option value="Dọn dẹp">Dọn dẹp</option>
          </select>
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManageRooms" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-success" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Adding...' : 'Add Room' }}
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
const roomTypeId = ref(route.params.roomTypeId || null);
const selectedHotel = ref(null);
const selectedRoomType = ref(null);
const bedConfigs = ref([]);
const loadingBedConfigs = ref(true);
const pageLoading = ref(true);
const pageError = ref('');

const roomData = reactive({
  MaKS: hotelId.value ? parseInt(hotelId.value) : null,
  MaLoaiPhong: roomTypeId.value ? parseInt(roomTypeId.value) : null,
  MaCauHinhGiuong: '',
  SoPhong: '',
  Tang: null,
  TrangThaiPhong: 'Sẵn sàng'
});

const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

async function fetchHotelDetails() {
  if (!hotelId.value) return;
  
  try {
    const response = await axios.get(`/api/hotels/${hotelId.value}`, { withCredentials: true });
    if (response.data && response.data.success) {
      selectedHotel.value = response.data.data;
    } else {
      pageError.value = `Could not load hotel details for ID ${hotelId.value}.`;
    }
  } catch (err) {
    pageError.value = `Failed to fetch hotel details: ${err.response?.data?.message || err.message}`;
  }
}

async function fetchRoomTypeDetails() {
  if (!roomTypeId.value) return;
  
  try {
    const response = await axios.get(`/api/roomTypes/${roomTypeId.value}`, { withCredentials: true });
    if (response.data && response.data.success) {
      selectedRoomType.value = response.data.data;
    } else {
      pageError.value = `Could not load room type details for ID ${roomTypeId.value}.`;
    }
  } catch (err) {
    pageError.value = `Failed to fetch room type details: ${err.response?.data?.message || err.message}`;
  }
}

async function fetchBedConfigurations() {
  loadingBedConfigs.value = true;
  try {
    const response = await axios.get('/api/bed-configs', { withCredentials: true });
    if (response.data && response.data.success) {
      bedConfigs.value = response.data.data || [];
    } else {
      console.error('Failed to load bed configurations');
    }
  } catch (err) {
    console.error('Error fetching bed configurations:', err);
  } finally {
    loadingBedConfigs.value = false;
  }
}

async function submitAddRoom() {
  if (!roomData.SoPhong || !roomData.MaCauHinhGiuong) {
    formError.value = "Please fill in all required fields: Room Number and Bed Configuration.";
    return;
  }
  if (!roomData.MaKS || !roomData.MaLoaiPhong) {
    formError.value = "Hotel ID and Room Type ID are missing. Cannot add room.";
    return;
  }

  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  try {
    const response = await axios.post('/api/rooms', roomData, {
      withCredentials: true
    });
    if (response.status === 201 && response.data?.message) {
      successMessage.value = response.data.message;
      // Reset form
      Object.keys(roomData).forEach(key => {
        if (!['MaKS', 'MaLoaiPhong', 'TrangThaiPhong'].includes(key)) {
          roomData[key] = (typeof roomData[key] === 'number' ? null : '');
        }
      });
      setTimeout(() => {
        goBackToManageRooms();
      }, 1000);
    } else {
      formError.value = response.data?.error || response.data?.message || "Failed to add room.";
    }
  } catch (err) {
    formError.value = 'Error adding room: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManageRooms() {
  router.push({ name: 'AdminFindRoom' });
}

onMounted(async () => {
  if (!hotelId.value || !roomTypeId.value) {
    pageError.value = "Hotel ID and Room Type ID are required to add a new room. Please go back and select them.";
    pageLoading.value = false;
    return;
  }

  roomData.MaKS = parseInt(hotelId.value);
  roomData.MaLoaiPhong = parseInt(roomTypeId.value);
  
  try {
    await Promise.all([
      fetchHotelDetails(),
      fetchRoomTypeDetails(),
      fetchBedConfigurations()
    ]);
  } catch (err) {
    console.error('Error loading page data:', err);
  } finally {
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
