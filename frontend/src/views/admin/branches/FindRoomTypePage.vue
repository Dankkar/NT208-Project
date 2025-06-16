<!-- src/views/admin/roomtypes/FindRoomTypePage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">MANAGE ROOM TYPES</h1>

    <!-- Section Chọn Khách Sạn -->
    <div class="mb-4 card p-3 shadow-sm">
      <h5 class="card-title">Select Hotel to Manage Room Types</h5>
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
        <button
          v-if="selectedHotelId !== null"
          @click="navigateToAddRoomType"
          class="btn btn-success"
          title="Add New Room Type for this Hotel"
        >
          <i class="bi bi-plus-circle-fill me-1"></i> Add Room Type
        </button>
      </div>
    </div>

    <!-- Hiển thị khi một khách sạn ĐÃ ĐƯỢC CHỌN VÀ KHÔNG CÒN LOADING HOTELS-->
    <div v-if="selectedHotelId !== null && !loadingHotels">
      <h3 class="mb-3">Room Types for: <strong>{{ selectedHotelName }}</strong></h3>

      <div v-if="isFetchingRoomTypes" class="text-center my-3">
        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading room types...</span></div>
      </div>
      <div v-else-if="fetchError" class="alert alert-danger">{{ fetchError }}</div>

      <div v-else-if="foundRoomTypes.length > 0" class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Base Price</th>
              <th>Area</th>
              <th>Total R.</th>
              <th>Avail. R.</th>
              <th style="min-width: 180px;">Amenities</th>
              <th style="min-width: 180px;">IsActive</th>
              <th style="min-width: 140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rt in foundRoomTypes" :key="rt.MaLoaiPhong">
              <td>{{ rt.MaLoaiPhong }}</td>
              <td>{{ rt.TenLoaiPhong }}</td>
              <td>{{ formatCurrency(rt.GiaCoSo) }}</td>
              <td>{{ rt.DienTich ? `${rt.DienTich} m²` : 'N/A' }}</td>
              <td>{{ rt.TongSoPhong !== null ? rt.TongSoPhong : 0 }}</td>
              <td>{{ rt.SoPhongTrong !== null ? rt.SoPhongTrong : 0 }}</td>
              <td style="max-width: 250px; white-space: pre-wrap;">{{ rt.TienNghi || 'N/A' }}</td>
              <td>
                <span :class="getActiveClass(rt.IsActive)">
                  {{ rt.IsActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button @click="navigateToEditRoomType(rt.MaLoaiPhong)" class="btn btn-sm btn-outline-warning me-2 mb-1" title="Edit Room Type">
                  <i class="bi bi-pencil-fill"></i> Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <Pagination
          v-if="paginationData.totalPages > 1"
          :page="paginationData.page"
          :total="paginationData.totalPages"
          @change="handleRoomTypePageChange"
          class="mt-3"
        />
      </div>
      <div v-else-if="fetchAttempted && foundRoomTypes.length === 0" class="alert alert-secondary text-center">
        No room types found for {{ selectedHotelName }}. You can add one using the button above.
      </div>
       <div v-else-if="!fetchAttempted && selectedHotelId !== null" class="alert alert-info text-center">
          Room types for {{selectedHotelName}} will be loaded.
      </div>
    </div>
     <div v-else-if="selectedHotelId === null && !loadingHotels && availableHotels.length > 0" class="alert alert-info text-center">
        Please select a hotel above to view and manage its room types.
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
const selectedHotelId = ref(null); // Khởi tạo là null

const foundRoomTypes = ref([]);
const isFetchingRoomTypes = ref(false);
const fetchError = ref('');
const fetchAttempted = ref(false);

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

function getActiveClass(status) {
  // Giả sử IsActive là 1 (true) hoặc 0 (false) từ DB
  if (status === 1 || status === true) return 'badge bg-success text-white';
  return 'badge bg-danger text-white';
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
      availableHotels.value = []; // Đảm bảo là mảng rỗng nếu lỗi
    }
  } catch (err) {
    console.error("Error fetching available hotels:", err);
    hotelLoadError.value = 'Failed to fetch hotels list (Client Error).';
    availableHotels.value = [];
  } finally {
    loadingHotels.value = false;
  }
}

async function fetchRoomTypesForSelectedHotel(page = 1) {
  if (selectedHotelId.value === null || selectedHotelId.value === '') {
    foundRoomTypes.value = [];
    paginationData.value = { page: 1, limit: 10, total: 0, totalPages: 0 };
    fetchAttempted.value = false;
    return;
  }
  console.log(`==> FETCHING Room Types for Hotel ID: ${selectedHotelId.value}, Page: ${page}`);
  isFetchingRoomTypes.value = true;
  fetchError.value = '';
  fetchAttempted.value = true;
  paginationData.value.page = page;

  try {
    const response = await axios.get(
      `/api/roomTypes/hotel/${selectedHotelId.value}`, // URL phải khớp với backend
      {
        params: { page: paginationData.value.page, limit: paginationData.value.limit },
        withCredentials: true
      }
    );
    console.log("==> API Response Room Types:", response.data);

    if (response.data && response.data.success) {
      foundRoomTypes.value = response.data.data || [];
      if (response.data.pagination) {
        paginationData.value = { ...paginationData.value, ...response.data.pagination };
      } else {
        paginationData.value.total = foundRoomTypes.value.length;
        paginationData.value.totalPages = Math.ceil(foundRoomTypes.value.length / paginationData.value.limit) || 1;
      }
    } else {
      fetchError.value = response.data?.error || response.data?.message || 'Failed to load room types.';
      foundRoomTypes.value = [];
    }
  } catch (err) {
    handleApiError(err, `Failed to fetch room types for hotel ID ${selectedHotelId.value}.`);
    foundRoomTypes.value = [];
  } finally {
    isFetchingRoomTypes.value = false;
  }
}

function handleRoomTypePageChange(newPage){
  if(newPage !== paginationData.value.page && selectedHotelId.value !== null){
    fetchRoomTypesForSelectedHotel(newPage);
  }
}

// Theo dõi selectedHotelId - Đây sẽ là trigger chính để fetch room types
watch(selectedHotelId, (newHotelId, oldHotelId) => {
  console.log(`WATCH selectedHotelId: Changed from ${oldHotelId} to ${newHotelId}`);
  if (newHotelId !== null & newHotelId !== '' && newHotelId !== undefined) { // Chỉ xử lý nếu newHotelId có giá trị (không phải -- Select a Hotel --)
    // Đồng bộ URL (nếu thay đổi so với URL hiện tại)
    if (String(route.params.hotelId || '') !== String(newHotelId)) {
      console.log("WATCH selectedHotelId: Updating route to reflect newHotelId:", newHotelId);
      router.replace({ name: 'AdminFindRoomType', params: { hotelId: String(newHotelId) } });
      fetchRoomTypesForSelectedHotel(1);
    } else {
      foundRoomTypes.value = [];
      fetchAttempted.value = false;
    }
  } else if (newHotelId === null && oldHotelId !== null) { // Người dùng chọn "-- Select a Hotel --"
    console.log("WATCH selectedHotelId: Cleared by user selection.");
    foundRoomTypes.value = [];
    paginationData.value = { page: 1, limit: 10, total: 0, totalPages: 0 };
    fetchAttempted.value = false;
    if (route.params.hotelId) { // Nếu URL vẫn còn hotelId, xóa nó đi
        router.replace({ name: 'AdminManageRoomTypes' });
    }
  }
});

// Theo dõi route.params.hotelId để cập nhật selectedHotelId nếu URL thay đổi từ bên ngoài
watch(() => route.params.hotelId, (newHotelIdParam, oldHotelIdParam) => {
  const newIdFromRoute = newHotelIdParam ? parseInt(newHotelIdParam) : null;
  console.log(`WATCH route.params.hotelId: Changed from "${oldHotelIdParam}" to "${newHotelIdParam}". Parsed to: ${newIdFromRoute}`);
  // Chỉ cập nhật selectedHotelId nếu nó thực sự khác, để tránh vòng lặp và trigger không cần thiết
  if (newIdFromRoute !== selectedHotelId.value) {
    console.log(`WATCH route.params.hotelId: Setting selectedHotelId to ${newIdFromRoute}`);
    selectedHotelId.value = newIdFromRoute; // Gán giá trị mới, việc này sẽ trigger watch(selectedHotelId, ...)
  } else if (newIdFromRoute === null && selectedHotelId.value !== null){
    // Nếu URL không có hotelId, nhưng selectedHotelId đang có giá trị (ví dụ người dùng bỏ chọn)
    // thì clear selectedHotelId để đồng bộ (watch(selectedHotelId) sẽ dọn dẹp list)
    console.log(`WATCH route.params.hotelId: Clearing selectedHotelId because route param is null.`);
    selectedHotelId.value = null;
  }
}, { immediate: true }); // immediate: true để chạy ngay khi component load, lấy hotelId từ URL ban đầu

onMounted(async () => {
  console.log("FindRoomTypePage MOUNTED.");
  await fetchAvailableHotels();
  // Không cần gán selectedHotelId ở đây nữa vì watch route.params.hotelId (với immediate:true) sẽ làm việc đó.
  // Sau khi availableHotels được tải, nếu watch(route.params.hotelId) đã set selectedHotelId,
  // thì watch(selectedHotelId) sẽ được trigger để fetch room types.
});

const formatCurrency = (value) => { if (value == null || isNaN(parseFloat(value))) return 'N/A'; return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value); };
const handleApiError = (err, defaultMessage) => { if (err.response) { fetchError.value = err.response.data?.error || err.response.data?.message || `Error: ${err.response.status} - ${defaultMessage}.`;} else if (err.request) { fetchError.value = `No response from server for: ${defaultMessage}. Please check network.`;} else { fetchError.value = `An error occurred with: ${defaultMessage}.`;} console.error(defaultMessage, err);};
const navigateToAddRoomType = () => { if (selectedHotelId.value) { router.push({ name: 'AdminAddRoomType', params: { hotelId: String(selectedHotelId.value) }}); } else { alert("Please select a hotel."); }};
const navigateToEditRoomType = (roomTypeId) => { router.push({ name: 'AdminEditRoomType', params: { roomTypeId: String(roomTypeId) } }); };

</script>

<style scoped>
.table th, .table td { vertical-align: middle; }
.table td[style*="max-width"] { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
.input-group .form-select { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.input-group .btn { border-top-left-radius: 0; border-bottom-left-radius: 0; }
</style>
