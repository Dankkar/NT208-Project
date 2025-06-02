<!-- src/views/admin/amenities/FindAmenityPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">MANAGE AMENITIES</h1>

    <!-- Section Chọn Khách Sạn -->
    <div class="mb-4 card p-3 shadow-sm">
      <h5 class="card-title">Select Hotel to Manage Amenities</h5>
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
          @click="navigateToAddAmenity"
          class="btn btn-success"
          title="Add New Amenity for this Hotel"
        >
          <i class="bi bi-plus-circle-fill me-1"></i> Add Amenity
        </button>
      </div>
    </div>

    <!-- Hiển thị khi một khách sạn ĐÃ ĐƯỢC CHỌN VÀ KHÔNG CÒN LOADING HOTELS-->
    <div v-if="selectedHotelId !== null && !loadingHotels">
      <h3 class="mb-3">Amenities for: <strong>{{ selectedHotelName }}</strong></h3>

      <div v-if="isFetchingAmenities" class="text-center my-3">
        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading amenities...</span></div>
      </div>
      <div v-else-if="fetchError" class="alert alert-danger">{{ fetchError }}</div>

      <div v-else-if="foundAmenities.length > 0" class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>ID (MaLoaiDV)</th>
              <th>Name (TenLoaiDV)</th>
              <th>Price (GiaDV)</th>
              <th style="min-width: 200px;">Description (MoTaDV)</th>
              <th>IsActive</th>
              <th style="min-width: 140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="amenity in foundAmenities" :key="amenity.MaLoaiDV">
              <td>{{ amenity.MaLoaiDV }}</td>
              <td>{{ amenity.TenLoaiDV }}</td>
              <td>{{ formatCurrency(amenity.GiaDV) }}</td>
              <td style="max-width: 300px; white-space: pre-wrap;">{{ amenity.MoTaDV || 'N/A' }}</td>
              <td>
                <span :class="getActiveClass(amenity.IsActive)">
                  {{ amenity.IsActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button @click="navigateToEditAmenity(amenity.MaLoaiDV)" class="btn btn-sm btn-outline-warning me-2 mb-1" title="Edit Amenity">
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
          @change="handleAmenityPageChange"
          class="mt-3"
        />
      </div>
      <div v-else-if="fetchAttempted && foundAmenities.length === 0" class="alert alert-secondary text-center">
        No amenities found for {{ selectedHotelName }}. You can add one using the button above.
      </div>
       <div v-else-if="!fetchAttempted && selectedHotelId !== null" class="alert alert-info text-center">
          Amenities for {{selectedHotelName}} will be loaded.
      </div>
    </div>
     <div v-else-if="selectedHotelId === null && !loadingHotels && availableHotels.length > 0" class="alert alert-info text-center">
        Please select a hotel above to view and manage its amenities.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import Pagination from '@/components/Pagination.vue'; // Đảm bảo đường dẫn đúng

const router = useRouter();
const route = useRoute();

// === Variables for Hotels ===
const availableHotels = ref([]);
const loadingHotels = ref(true);
const hotelLoadError = ref('');
const selectedHotelId = ref(null); // Hotel ID (MaKS) từ URL hoặc dropdown

// === Variables for Amenities ===
const foundAmenities = ref([]);
const isFetchingAmenities = ref(false);
const fetchError = ref(''); // General fetch error for amenities
const fetchAttempted = ref(false); // To show "No amenities found" only after an attempt

// === Pagination ===
const paginationData = ref({
  page: 1,
  limit: 10, // Hoặc số lượng item bạn muốn trên mỗi trang
  total: 0,
  totalPages: 0
});

// === Computed Properties ===
const selectedHotelName = computed(() => {
  if (!selectedHotelId.value) return 'Selected Hotel';
  const hotel = availableHotels.value.find(h => h.MaKS === selectedHotelId.value);
  return hotel ? hotel.TenKS : `Hotel ID ${selectedHotelId.value}`;
});

// === Utility Functions ===
function getActiveClass(status) {
  // Giả sử IsActive là 1 (true) hoặc 0 (false) từ DB
  if (status === 1 || status === true) return 'badge bg-success text-white';
  return 'badge bg-danger text-white';
}

const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value))) return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};

// === API Calls ===
async function fetchAvailableHotels() {
  loadingHotels.value = true;
  hotelLoadError.value = '';
  try {
    const response = await axios.get('http://localhost:5000/api/hotels/list-basic', { withCredentials: true });
    if (response.data && response.data.success) {
      availableHotels.value = response.data.data || [];
    } else {
      hotelLoadError.value = response.data?.message || 'Could not load list of hotels.';
    }
  } catch (err) {
    console.error("Error fetching available hotels:", err);
    hotelLoadError.value = 'Failed to fetch hotels list (Client Error).';
  } finally {
    loadingHotels.value = false;
  }
}

async function fetchAmenitiesForSelectedHotel(page = 1) {
  if (selectedHotelId.value === null) {
    foundAmenities.value = [];
    fetchAttempted.value = false; // Reset fetch attempt if no hotel selected
    return;
  }

  isFetchingAmenities.value = true;
  fetchError.value = '';
  fetchAttempted.value = true;
  paginationData.value.page = page;
  
  try {
    const response = await axios.get(
      `http://localhost:5000/api/services/hotel/${selectedHotelId.value}`,
      {
        params: { page: paginationData.value.page, limit: paginationData.value.limit },
        withCredentials: true
      }
    );

    if (response.data && response.data.success) {
      foundAmenities.value = response.data.data || [];
      if (response.data.pagination) {
        paginationData.value = { ...paginationData.value, ...response.data.pagination };
      } else { // Fallback if pagination is not in the expected structure
        paginationData.value.total = foundAmenities.value.length;
        paginationData.value.totalPages = Math.ceil(foundAmenities.value.length / paginationData.value.limit) || 1;
      }
    } else {
      fetchError.value = response.data?.message || 'Failed to load amenities for the selected hotel.';
      foundAmenities.value = [];
    }
  } catch (err) {
    fetchError.value = `Client Error: ${err.response?.data?.message || err.message || 'Could not fetch amenities.'}`;
    foundAmenities.value = [];
    console.error("Error fetching amenities:", err);
  } finally {
    isFetchingAmenities.value = false;
  }
}

// === Event Handlers & Watchers ===
function handleAmenityPageChange(newPage) {
  if (newPage !== paginationData.value.page && selectedHotelId.value !== null) {
    fetchAmenitiesForSelectedHotel(newPage);
  }
}

watch(selectedHotelId, (newHotelId, oldHotelId) => {
  if (newHotelId !== null && newHotelId !== undefined && newHotelId !== '') {
    // Nếu hotelId thay đổi, luôn fetch trang đầu tiên
    // Đồng bộ URL với hotelId được chọn
    if (String(route.params.hotelId || '') !== String(newHotelId)) {
        // Thay 'AdminFindAmenity' bằng tên route thực tế của bạn
        router.replace({ name: 'AdminFindAmenity', params: { hotelId: String(newHotelId) } });
    }
    // Không cần gọi fetchAmenitiesForSelectedHotel ở đây nữa vì watch route.params.hotelId sẽ xử lý
  } else if (newHotelId === null && oldHotelId !== null) { // Người dùng chọn "-- Select a Hotel --"
    foundAmenities.value = [];
    paginationData.value = { page: 1, limit: 10, total: 0, totalPages: 0 };
    fetchAttempted.value = false;
    // Xóa hotelId khỏi URL nếu nó đang tồn tại
    if (route.params.hotelId) {
        // Thay 'AdminFindAmenityNoParam' hoặc route tương ứng không có hotelId
        router.replace({ name: 'AdminFindAmenity' });
    }
  }
});


// Theo dõi selectedHotelId - Đây sẽ là trigger chính để fetch amenities
watch(selectedHotelId, (newHotelId, oldHotelId) => {
  console.log(`WATCH selectedHotelId: Changed from ${oldHotelId} to ${newHotelId}`);
  if (newHotelId !== null & newHotelId !== '' && newHotelId !== undefined) { // Chỉ xử lý nếu newHotelId có giá trị (không phải -- Select a Hotel --)
    // Đồng bộ URL (nếu thay đổi so với URL hiện tại)
    if (String(route.params.hotelId || '') !== String(newHotelId)) {
      console.log("WATCH selectedHotelId: Updating route to reflect newHotelId:", newHotelId);
      router.replace({ name: 'AdminFindAmenity', params: { hotelId: String(newHotelId) } });
      fetchAmenitiesForSelectedHotel(1);
    } else {
      foundAmenities.value = [];
      fetchAttempted.value = false;
    }
  } else if (newHotelId === null && oldHotelId !== null) { // Người dùng chọn "-- Select a Hotel --"
    console.log("WATCH selectedHotelId: Cleared by user selection.");
    foundAmenitiesTypes.value = [];
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
  await fetchAvailableHotels();
  // selectedHotelId và việc fetch amenities ban đầu đã được xử lý bởi watch route.params.hotelId
});

const navigateToAddAmenity = () => { if (selectedHotelId.value) { router.push({ name: 'AdminAddAmenity', params: { hotelId: String(selectedHotelId.value) }}); } else { alert("Please select a hotel."); }};
const navigateToEditAmenity = (amenityId) => { router.push({ name: 'AdminEditAmenity', params: { amenityId: String(amenityId) } }); };

</script>

<style scoped>
.table th, .table td { vertical-align: middle; }
.table td[style*="max-width"] { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
.input-group .form-select { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.input-group .btn { border-top-left-radius: 0; border-bottom-left-radius: 0; }
</style>