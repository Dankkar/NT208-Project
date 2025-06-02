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
        <div class="col-md-6">
          <label for="diaChi" class="form-label">Address (DiaChi) <span class="text-danger">*</span></label>
          <input id="diaChi" v-model.trim="editableHotel.DiaChi" type="text" class="form-control" required />
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

const pageLoading = ref(true);
const pageError = ref('');
const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

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

async function fetchHotelDetails(id) {
  pageLoading.value = true;
  pageError.value = '';
  try {
    // API của bạn là GET /api/hotels/:MaKS
    const response = await axios.get(`http://localhost:5000/api/hotels/${id}`, {
      withCredentials: true,
    });

    // API getHotelById của bạn trả về { success: true, data: { ...hotelData, roomTypes, services, priceRange... } }
    if (response.data && response.data.success && response.data.data) {
      const hotelDetails = response.data.data; // Đây là object khách sạn, chưa bao gồm roomTypes, services...
      originalHotelData.value = { ...hotelDetails }; // Sao chép để tránh mutate

      // Gán vào editableHotel (chỉ các trường khách sạn)
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

  // Tạo payload chỉ với các trường mà API updateHotel mong đợi
  const payload = {
    TenKS: editableHotel.TenKS,
    DiaChi: editableHotel.DiaChi,
    HangSao: editableHotel.HangSao,
    LoaiHinh: editableHotel.LoaiHinh,
    MoTaCoSoVatChat: editableHotel.MoTaCoSoVatChat,
    QuyDinh: editableHotel.QuyDinh,
    MotaChung: editableHotel.MotaChung,
    MaNguoiQuanLy: editableHotel.MaNguoiQuanLy,
    IsActive: editableHotel.IsActive
  };

  if (editableHotel.MaNguoiQuanLy !== undefined) { // Gửi cả khi nó là null để cho phép xóa người quản lý
      payload.MaNguoiQuanLy = editableHotel.MaNguoiQuanLy === '' ? null : parseInt(editableHotel.MaNguoiQuanLy, 10);
      if (editableHotel.MaNguoiQuanLy !== '' && editableHotel.MaNguoiQuanLy !== null && isNaN(payload.MaNguoiQuanLy)) {
          formError.value = "Manager ID must be a valid number or empty to remove.";
          isSubmitting.value = false;
          return;
      }
  }


  try {
    // API updateHotel là PUT /api/hotels/:MaKS
    const response = await axios.put(`http://localhost:5000/api/hotels/${hotelId.value}`, payload, {
      withCredentials: true
    });

    // API updateHotel của bạn trả về { message: '...' }
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
</script>