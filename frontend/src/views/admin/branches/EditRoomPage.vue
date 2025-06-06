<!-- src/views/admin/rooms/EditRoomPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Edit Room</h1>
    <div v-if="pageLoading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="pageError" class="alert alert-danger">
        <p>{{ pageError }}</p>
        <button @click="goBackToManagePage" class="btn btn-sm btn-secondary">Back to Manage Page</button>
    </div>

    <form v-else-if="editableRoom.MaPhong" @submit.prevent="submitUpdateRoom" class="card p-4 shadow-sm">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <p class="text-muted">
        Editing Room ID: {{ roomId }} for Hotel: {{ originalHotelName }} - Room Type: {{ originalRoomTypeName }}
      </p>
      <hr class="my-3">

      <div class="row g-3">
        <div class="col-md-6">
          <label for="maPhong" class="form-label">Room ID (MaPhong)</label>
          <input id="maPhong" type="text" class="form-control" :value="editableRoom.MaPhong" readonly disabled />
        </div>
        
        <div class="col-md-6">
          <label for="soPhong" class="form-label">Room Number <span class="text-danger">*</span></label>
          <input id="soPhong" v-model="editableRoom.SoPhong" type="text" class="form-control" required />
        </div>

        <div class="col-md-6">
          <label for="tang" class="form-label">Floor</label>
          <input id="tang" v-model.number="editableRoom.Tang" type="number" step="1" min="1" class="form-control" />
        </div>

        <div class="col-md-6">
          <label for="trangThaiPhong" class="form-label">Room Status <span class="text-danger">*</span></label>
          <select id="trangThaiPhong" v-model="editableRoom.TrangThaiPhong" class="form-select" required>
            <option value="Sẵn sàng">Sẵn sàng</option>
            <option value="Đang ở">Đang ở</option>
            <option value="Bảo trì">Bảo trì</option>
            <option value="Dọn dẹp">Dọn dẹp</option>
          </select>
        </div>

        <div class="col-12">
          <label for="maCauHinhGiuong" class="form-label">Bed Configuration <span class="text-danger">*</span></label>
          <div v-if="loadingBedConfigs" class="text-center mt-2">
            <div class="spinner-border spinner-border-sm"></div> Loading bed configurations...
          </div>
          <div v-else>
            <select id="maCauHinhGiuong" v-model="editableRoom.MaCauHinhGiuong" class="form-select" required>
              <option value="">-- Select Bed Configuration --</option>
              <option v-for="config in bedConfigs" :key="config.MaCauHinhGiuong" :value="config.MaCauHinhGiuong">
                {{ config.TenCauHinh }} ({{ config.SoGiuongDoi }} double + {{ config.SoGiuongDon }} single)
              </option>
            </select>
          </div>
        </div>

        <div class="col-md-6 d-flex align-items-center mt-4">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="isActiveSwitch" v-model="editableRoom.IsActive">
            <label class="form-check-label" for="isActiveSwitch">Is Active</label>
          </div>
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManageRooms" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Updating...' : 'Update Room' }}
        </button>
      </div>
    </form>
    <div v-else class="alert alert-warning">
        Room data could not be loaded.
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

const roomId = ref(route.params.roomId || null);
const originalRoomData = ref(null);
const originalHotelName = ref('');
const originalRoomTypeName = ref('');
const bedConfigs = ref([]);
const loadingBedConfigs = ref(true);

const editableRoom = reactive({
  MaPhong: null,
  MaKS: null,
  MaLoaiPhong: null,
  MaCauHinhGiuong: '',
  SoPhong: '',
  Tang: null,
  TrangThaiPhong: 'Sẵn sàng',
  IsActive: true
});

const pageLoading = ref(true);
const pageError = ref('');
const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

async function fetchBedConfigurations() {
  loadingBedConfigs.value = true;
  try {
    const response = await axios.get('http://localhost:5000/api/bed-configs', { withCredentials: true });
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

async function fetchRoomDetails(id) {
  pageLoading.value = true;
  pageError.value = '';
  try {
    const response = await axios.get(`http://localhost:5000/api/rooms/${id}`, {
      withCredentials: true,
    });
    if (response.data && response.data.success) {
      originalRoomData.value = response.data.data;
      editableRoom.MaPhong = originalRoomData.value.MaPhong;
      editableRoom.MaKS = originalRoomData.value.MaKS;
      editableRoom.MaLoaiPhong = originalRoomData.value.MaLoaiPhong;
      editableRoom.MaCauHinhGiuong = originalRoomData.value.MaCauHinhGiuong;
      editableRoom.SoPhong = originalRoomData.value.SoPhong || '';
      editableRoom.Tang = originalRoomData.value.Tang || null;
      editableRoom.TrangThaiPhong = originalRoomData.value.TrangThaiPhong || 'Sẵn sàng';
      editableRoom.IsActive = originalRoomData.value.IsActive === 1 || originalRoomData.value.IsActive === true;
      
      // Set display names
      originalHotelName.value = originalRoomData.value.TenKS || '';
      originalRoomTypeName.value = originalRoomData.value.TenLoaiPhong || '';
    } else {
      pageError.value = response.data?.message || `Could not load room data for ID ${id}.`;
    }
  } catch (err) {
    pageError.value = `Error fetching room ID ${id}: ` + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    pageLoading.value = false;
  }
}

async function submitUpdateRoom() {
  if (!editableRoom.SoPhong || !editableRoom.MaCauHinhGiuong || !editableRoom.TrangThaiPhong) {
    formError.value = "Please fill in all required fields: Room Number, Bed Configuration, and Status.";
    return;
  }
  
  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  const payload = {
    MaKS: editableRoom.MaKS,
    MaLoaiPhong: editableRoom.MaLoaiPhong,
    MaCauHinhGiuong: editableRoom.MaCauHinhGiuong,
    SoPhong: editableRoom.SoPhong,
    Tang: editableRoom.Tang,
    TrangThaiPhong: editableRoom.TrangThaiPhong,
    IsActive: editableRoom.IsActive
  };

  try {
    const response = await axios.put(`http://localhost:5000/api/rooms/${roomId.value}`, payload, {
      withCredentials: true
    });
    if (response.data?.message) {
      successMessage.value = response.data.message;
      setTimeout(() => {
        goBackToManageRooms();
      }, 1000);
    } else {
      formError.value = response.data?.error || "Failed to update room.";
    }
  } catch (err) {
    formError.value = 'Error updating room: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManageRooms() {
  router.push({ name: 'AdminFindRoom' });
}

function goBackToManagePage() {
  router.push({ name: 'AdminFindRoom' });
}

watch(() => route.params.roomId, (newId) => {
  if (newId && newId !== roomId.value) {
    roomId.value = newId;
    fetchRoomDetails(newId);
  }
});

onMounted(async () => {
  if (roomId.value) {
    await Promise.all([
      fetchRoomDetails(roomId.value),
      fetchBedConfigurations()
    ]);
  } else {
    pageError.value = "Room ID is missing. Cannot load data for editing.";
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