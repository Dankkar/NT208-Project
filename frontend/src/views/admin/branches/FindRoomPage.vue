<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">MANAGE ROOMS</h1>

    <!-- Section Chọn Khách Sạn -->
    <div class="mb-4 card p-3 shadow-sm">
      <h5 class="card-title">Select Hotel to Manage Rooms</h5>
      <div v-if="loadingHotels" class="text-center mt-2">
        <div class="spinner-border spinner-border-sm"></div> Loading hotels...
      </div>
      <div v-if="hotelLoadError" class="alert alert-danger mt-2">{{ hotelLoadError }}</div>
      <div v-if="!loadingHotels && availableHotels.length === 0 && !hotelLoadError" class="alert alert-warning mt-2">
          No hotels available to select.
      </div>

      <div v-if="availableHotels.length > 0" class="input-group">
        <select v-model="selectedHotelId" class="form-select" aria-label="Select Hotel">
          <option :value="null">-- Select a Hotel --</option>
          <option v-for="hotel in availableHotels" :key="hotel.MaKS" :value="hotel.MaKS">
            {{ hotel.TenKS }} (ID: {{ hotel.MaKS }})
          </option>
        </select>
      </div>
    </div>

    <!-- Section Chọn Loại Phòng -->
    <div v-if="selectedHotelId !== null && !loadingHotels" class="mb-4 card p-3 shadow-sm">
      <h5 class="card-title">Select Room Type to Manage Rooms</h5>
      <div v-if="loadingRoomTypes" class="text-center mt-2">
        <div class="spinner-border spinner-border-sm"></div> Loading room types...
      </div>
      <div v-if="roomTypeLoadError" class="alert alert-danger mt-2">{{ roomTypeLoadError }}</div>

      <div v-if="!loadingRoomTypes && availableRoomTypes.length > 0" class="input-group">
        <select v-model="selectedRoomTypeId" class="form-select" aria-label="Select Room Type">
          <option :value="null">-- Select a Room Type --</option>
          <option v-for="roomType in availableRoomTypes" :key="roomType.MaLoaiPhong" :value="roomType.MaLoaiPhong">
            {{ roomType.TenLoaiPhong }} - {{ formatCurrency(roomType.GiaCoSo) }}
          </option>
        </select>
        <button
          v-if="selectedRoomTypeId !== null"
          @click="navigateToAddRoom"
          class="btn btn-success"
          title="Add New Room for this Room Type"
        >
          <i class="bi bi-plus-circle-fill me-1"></i> Add Room
        </button>
      </div>
      <div v-if="!loadingRoomTypes && availableRoomTypes.length === 0 && selectedHotelId" class="alert alert-warning mt-2">
          No room types found for this hotel. Please add room types first.
      </div>
    </div>

    <!-- Hiển thị danh sách phòng khi đã chọn loại phòng -->
    <div v-if="selectedRoomTypeId !== null && !loadingRoomTypes">
      <h3 class="mb-3">Rooms for: <strong>{{ selectedRoomTypeName }}</strong> in {{ selectedHotelName }}</h3>

      <div v-if="isFetchingRooms" class="text-center my-3">
        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading rooms...</span></div>
      </div>
      <div v-else-if="fetchError" class="alert alert-danger">{{ fetchError }}</div>

      <div v-else-if="foundRooms.length > 0" class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Room ID</th>
              <th>Room Number</th>
              <th>Floor</th>
              <th>Bed Config</th>
              <th>Room Type</th>
              <th>Status</th>
              <th>IsActive</th>
              <th style="min-width: 140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in foundRooms" :key="room.MaPhong">
              <td>{{ room.MaPhong }}</td>
              <td>{{ room.SoPhong }}</td>
              <td>{{ room.Tang || 'N/A' }}</td>
              <td>{{ room.TenCauHinh }}</td>
              <td>{{ room.TenLoaiPhong }}</td>
              <td>
                <span :class="getStatusClass(room.TrangThaiPhong)">
                  {{ room.TrangThaiPhong }}
                </span>
              </td>
              <td>
                <span :class="getActiveClass(room.IsActive)">
                  {{ room.IsActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button @click="navigateToEditRoom(room.MaPhong)" class="btn btn-sm btn-outline-warning me-2 mb-1" title="Edit Room">
                  <i class="bi bi-pencil-fill"></i> Edit
                </button>
                <button @click="toggleRoomStatus(room)" class="btn btn-sm btn-outline-info mb-1" title="Change Status">
                  <i class="bi bi-arrow-repeat"></i> Status
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <Pagination
          v-if="paginationData.totalPages > 1"
          :page="paginationData.page"
          :total="paginationData.totalPages"
          @change="handleRoomPageChange"
          class="mt-3"
        />
      </div>
      <div v-else-if="fetchAttempted && foundRooms.length === 0" class="alert alert-secondary text-center">
        No rooms found for {{ selectedRoomTypeName }}. You can add one using the button above.
      </div>
    </div>

    <!-- Modal for Status Change -->
    <div v-if="showStatusModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Change Room Status</h5>
            <button type="button" class="btn-close" @click="showStatusModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Change status for Room {{ currentRoom?.SoPhong }}:</p>
            <select v-model="newStatus" class="form-select">
              <option value="Sẵn sàng">Sẵn sàng</option>
              <option value="Đang ở">Đang ở</option>
              <option value="Bảo trì">Bảo trì</option>
              <option value="Dọn dẹp">Dọn dẹp</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showStatusModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="updateRoomStatus" :disabled="isUpdatingStatus">
              <span v-if="isUpdatingStatus" class="spinner-border spinner-border-sm me-1"></span>
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import Pagination from '@/components/Pagination.vue';

const router = useRouter();
const route = useRoute();

const availableHotels = ref([]);
const loadingHotels = ref(true);
const hotelLoadError = ref('');
const selectedHotelId = ref(null);

const availableRoomTypes = ref([]);
const loadingRoomTypes = ref(false);
const roomTypeLoadError = ref('');
const selectedRoomTypeId = ref(null);

const foundRooms = ref([]);
const isFetchingRooms = ref(false);
const fetchError = ref('');
const fetchAttempted = ref(false);

const showStatusModal = ref(false);
const currentRoom = ref(null);
const newStatus = ref('');
const isUpdatingStatus = ref(false);

const paginationData = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

const selectedHotelName = computed(() => {
  if (!selectedHotelId.value) return 'Selected Hotel';
  const hotel = availableHotels.value.find(h => h.MaKS === selectedHotelId.value);
  return hotel ? hotel.TenKS : `Hotel ID ${selectedHotelId.value}`;
});

const selectedRoomTypeName = computed(() => {
  if (!selectedRoomTypeId.value) return 'Selected Room Type';
  const roomType = availableRoomTypes.value.find(rt => rt.MaLoaiPhong === selectedRoomTypeId.value);
  return roomType ? roomType.TenLoaiPhong : `Room Type ID ${selectedRoomTypeId.value}`;
});

function getActiveClass(status) {
  if (status === 1 || status === true) return 'badge bg-success text-white';
  return 'badge bg-danger text-white';
}

function getStatusClass(status) {
  switch (status) {
    case 'Sẵn sàng': return 'badge bg-success text-white';
    case 'Đang ở': return 'badge bg-primary text-white';
    case 'Bảo trì': return 'badge bg-warning text-dark';
    case 'Dọn dẹp': return 'badge bg-info text-dark';
    default: return 'badge bg-secondary text-white';
  }
}

async function fetchAvailableHotels() {
  loadingHotels.value = true;
  hotelLoadError.value = '';
  try {
    const response = await axios.get('/api/hotels/list-basic', { withCredentials: true });
    if (response.data && response.data.success) {
      availableHotels.value = response.data.data || [];
    } else {
      hotelLoadError.value = response.data?.message || 'Could not load list of hotels.';
      availableHotels.value = [];
    }
  } catch (err) {
    console.error("Error fetching available hotels:", err);
    hotelLoadError.value = 'Failed to fetch hotels list (Client Error).';
    availableHotels.value = [];
  } finally {
    loadingHotels.value = false;
  }
}

async function fetchRoomTypesForSelectedHotel() {
  if (!selectedHotelId.value) {
    availableRoomTypes.value = [];
    return;
  }

  loadingRoomTypes.value = true;
  roomTypeLoadError.value = '';
  try {
    const response = await axios.get(
      `/api/roomTypes/hotel/${selectedHotelId.value}`,
      { withCredentials: true }
    );
    if (response.data && response.data.success) {
      availableRoomTypes.value = response.data.data || [];
    } else {
      roomTypeLoadError.value = response.data?.error || 'Failed to load room types.';
      availableRoomTypes.value = [];
    }
  } catch (err) {
    roomTypeLoadError.value = `Failed to fetch room types: ${err.response?.data?.error || err.message}`;
    availableRoomTypes.value = [];
  } finally {
    loadingRoomTypes.value = false;
  }
}

async function fetchRoomsForSelectedRoomType(page = 1) {
  if (!selectedRoomTypeId.value) {
    foundRooms.value = [];
    paginationData.value = { page: 1, limit: 10, total: 0, totalPages: 0 };
    fetchAttempted.value = false;
    return;
  }

  isFetchingRooms.value = true;
  fetchError.value = '';
  fetchAttempted.value = true;
  paginationData.value.page = page;

  try {
    const response = await axios.get(
      `/api/rooms/roomtype/${selectedRoomTypeId.value}`,
      { withCredentials: true }
    );

    if (response.data && response.data.success) {
      foundRooms.value = response.data.data || [];
      // Since this endpoint doesn't return pagination, set simple pagination
      paginationData.value.total = foundRooms.value.length;
      paginationData.value.totalPages = Math.ceil(foundRooms.value.length / paginationData.value.limit) || 1;
    } else {
      fetchError.value = response.data?.error || 'Failed to load rooms.';
      foundRooms.value = [];
    }
  } catch (err) {
    fetchError.value = `Failed to fetch rooms: ${err.response?.data?.error || err.message}`;
    foundRooms.value = [];
  } finally {
    isFetchingRooms.value = false;
  }
}

function handleRoomPageChange(newPage) {
  if (newPage !== paginationData.value.page && selectedRoomTypeId.value !== null) {
    fetchRoomsForSelectedRoomType(newPage);
  }
}

function toggleRoomStatus(room) {
  currentRoom.value = room;
  newStatus.value = room.TrangThaiPhong;
  showStatusModal.value = true;
}

async function updateRoomStatus() {
  if (!currentRoom.value || !newStatus.value) return;
  
  isUpdatingStatus.value = true;
  try {
    const response = await axios.patch(
      `/api/rooms/${currentRoom.value.MaPhong}/status`,
      { TrangThaiPhong: newStatus.value },
      { withCredentials: true }
    );

    if (response.data && response.data.success) {
      // Update the room in the list
      const roomIndex = foundRooms.value.findIndex(r => r.MaPhong === currentRoom.value.MaPhong);
      if (roomIndex !== -1) {
        foundRooms.value[roomIndex].TrangThaiPhong = newStatus.value;
      }
      showStatusModal.value = false;
    } else {
      alert(response.data?.error || 'Failed to update room status');
    }
  } catch (err) {
    alert(`Error updating room status: ${err.response?.data?.error || err.message}`);
  } finally {
    isUpdatingStatus.value = false;
  }
}

// Watch for hotel selection changes
watch(selectedHotelId, (newHotelId) => {
  if (newHotelId !== null) {
    selectedRoomTypeId.value = null; // Reset room type selection
    foundRooms.value = [];
    fetchAttempted.value = false;
    fetchRoomTypesForSelectedHotel();
  } else {
    availableRoomTypes.value = [];
    selectedRoomTypeId.value = null;
    foundRooms.value = [];
    fetchAttempted.value = false;
  }
});

// Watch for room type selection changes  
watch(selectedRoomTypeId, (newRoomTypeId) => {
  if (newRoomTypeId !== null) {
    fetchRoomsForSelectedRoomType(1);
  } else {
    foundRooms.value = [];
    fetchAttempted.value = false;
  }
});

onMounted(async () => {
  await fetchAvailableHotels();
});

// Utility functions
const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value))) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(value);
};

const navigateToAddRoom = () => {
  if (selectedRoomTypeId.value && selectedHotelId.value) {
    router.push({
      name: 'AdminAddRoom',
      params: {
        hotelId: String(selectedHotelId.value),
        roomTypeId: String(selectedRoomTypeId.value)
      }
    });
  } else {
    alert("Please select a hotel and room type.");
  }
};

const navigateToEditRoom = (roomId) => {
  router.push({
    name: 'AdminEditRoom',
    params: { roomId: String(roomId) }
  });
};
</script>

<style scoped>
.table th, .table td { 
  vertical-align: middle; 
}

.input-group .form-select { 
  border-top-right-radius: 0; 
  border-bottom-right-radius: 0; 
}

.input-group .btn { 
  border-top-left-radius: 0; 
  border-bottom-left-radius: 0; 
}

.modal {
  z-index: 1055;
}
</style> 
