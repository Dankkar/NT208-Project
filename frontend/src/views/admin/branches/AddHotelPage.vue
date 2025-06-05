<!-- src/views/admin/hotels/AddHotelPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">Add New Hotel</h1>

    <form @submit.prevent="submitAddHotel" class="card p-4 shadow-sm mx-auto" style="max-width: 800px;">
      <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="row g-3">
        <div class="col-md-6">
          <label for="tenKS" class="form-label">Hotel Name (TenKS) <span class="text-danger">*</span></label>
          <input id="tenKS" v-model.trim="hotelData.TenKS" type="text" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label for="diaChi" class="form-label">Address (DiaChi) <span class="text-danger">*</span></label>
          <input id="diaChi" v-model.trim="hotelData.DiaChi" type="text" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label for="hangSao" class="form-label">Star Rating (HangSao) <span class="text-danger">*</span></label>
          <select id="hangSao" v-model="hotelData.HangSao" class="form-select" required>
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
          <input id="loaiHinh" v-model.trim="hotelData.LoaiHinh" type="text" class="form-control" placeholder="e.g., Boutique, Resort, City Hotel" required />
        </div>
        <div class="col-12">
          <label for="moTaCoSoVatChat" class="form-label">Facility Description (MoTaCoSoVatChat) <span class="text-danger">*</span></label>
          <textarea id="moTaCoSoVatChat" v-model="hotelData.MoTaCoSoVatChat" class="form-control" rows="4" required></textarea>
        </div>
        <div class="col-12">
          <label for="quyDinh" class="form-label">Regulations (QuyDinh) <span class="text-danger">*</span></label>
          <textarea id="quyDinh" v-model="hotelData.QuyDinh" class="form-control" rows="4" required></textarea>
        </div>
        <div class="col-12">
          <label for="motaChung" class="form-label">General Description (MotaChung) (Optional)</label>
          <textarea id="motaChung" v-model="hotelData.MotaChung" class="form-control" rows="3"></textarea>
        </div>

        <!-- Chỉ định Người Quản Lý (Admin có thể làm điều này) -->
        <div class="col-md-6">
            <label for="maNguoiQuanLy" class="form-label">Assign Manager (MaNguoiQuanLy) (Optional)</label>
            <input id="maNguoiQuanLy" v-model.number="hotelData.MaNguoiQuanLy" type="number" class="form-control" placeholder="Enter User ID of Manager"/>
            <small class="form-text text-muted">If left blank, the current admin will be assigned if their role allows.</small>
        </div>

        <!-- Phần upload hình ảnh -->
        <div class="col-12">
            <label for="hotelImages" class="form-label">Upload Hotel Images (HotelImages) (Optional)</label>
            <input
              id="hotelImages"
              ref="fileInput"
              type="file"
              class="form-control"
              multiple
              accept="image/*"
              @change="handleImageChange"
            />
            <small class="form-text text-muted">
              Chọn tối đa 10 ảnh. Ảnh đầu tiên sẽ được đặt làm ảnh chính. Định dạng: JPG, PNG, JPEG (Tối đa 5MB mỗi ảnh)
            </small>
        </div>

        <!-- Preview ảnh đã chọn -->
        <div v-if="selectedFiles.length > 0" class="col-12">
          <label class="form-label">Preview Images:</label>
          <div class="row g-2">
            <div v-for="(file, index) in selectedFiles" :key="index" class="col-md-3 col-sm-6">
              <div class="card position-relative">
                <img :src="file.preview" :alt="file.name" class="card-img-top" style="height: 150px; object-fit: cover;">
                <div class="card-body p-2">
                  <small class="text-muted">{{ file.name }}</small>
                  <div v-if="index === 0" class="badge bg-primary mt-1">Ảnh chính</div>
                </div>
                <button 
                  type="button" 
                  class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                  @click="removeFile(index)"
                  :disabled="isSubmitting"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Chọn ảnh chính -->
        <div v-if="selectedFiles.length > 1" class="col-12">
          <label for="mainImageIndex" class="form-label">Chọn ảnh chính:</label>
          <select id="mainImageIndex" v-model.number="mainImageIndex" class="form-select">
            <option v-for="(file, index) in selectedFiles" :key="index" :value="index">
              {{ index + 1 }}. {{ file.name }}
            </option>
          </select>
        </div>
      </div>
    

      <div class="mt-4 d-flex justify-content-end">
        <button type="button" @click="goBackToManageHotels" class="btn btn-secondary me-2" :disabled="isSubmitting">
          Cancel
        </button>
        <button type="submit" class="btn btn-success" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSubmitting ? 'Adding...' : 'Add Hotel' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
// import { useAuthStore } from '@/store/authStore'; // Nếu bạn cần thông tin admin hiện tại

// const authStore = useAuthStore(); // (Optional)
const router = useRouter();

const hotelData = reactive({
  TenKS: '',
  DiaChi: '',
  HangSao: '',
  LoaiHinh: '',
  MoTaCoSoVatChat: '',
  QuyDinh: '',
  MotaChung: '',
  MaNguoiQuanLy: null // Khởi tạo là null
});

const isSubmitting = ref(false);
const formError = ref('');
const successMessage = ref('');

// Biến quản lý ảnh
const selectedFiles = ref([]);
const mainImageIndex = ref(0);
const fileInput = ref(null);

// Xử lý khi người dùng chọn files
function handleImageChange(event) {
  const files = Array.from(event.target.files);
  
  // Validate số lượng file
  if (files.length > 10) {
    formError.value = "Chỉ được chọn tối đa 10 ảnh.";
    return;
  }

  // Clear previous selection
  selectedFiles.value = [];
  
  files.forEach((file, index) => {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      formError.value = `File "${file.name}" vượt quá 5MB. Vui lòng chọn file nhỏ hơn.`;
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      formError.value = `File "${file.name}" không phải là ảnh. Vui lòng chọn file ảnh.`;
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFiles.value.push({
        file: file,
        name: file.name,
        preview: e.target.result,
        index: index
      });
    };
    reader.readAsDataURL(file);
  });

  // Reset main image index
  mainImageIndex.value = 0;
  
  // Clear any previous error if files are valid
  if (files.every(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith('image/'))) {
    formError.value = '';
  }
}

// Xóa một file khỏi danh sách
function removeFile(index) {
  selectedFiles.value.splice(index, 1);
  
  // Adjust main image index if necessary
  if (mainImageIndex.value >= selectedFiles.value.length) {
    mainImageIndex.value = Math.max(0, selectedFiles.value.length - 1);
  }
  
  // Clear file input if no files left
  if (selectedFiles.value.length === 0) {
    fileInput.value.value = '';
  }
}

async function submitAddHotel() {
  // Basic client-side validation (có thể thêm nhiều hơn)
  if (!hotelData.TenKS || !hotelData.DiaChi || !hotelData.HangSao || !hotelData.LoaiHinh || !hotelData.MoTaCoSoVatChat || !hotelData.QuyDinh) {
    formError.value = "Please fill in all required fields marked with *.";
    return;
  }

  isSubmitting.value = true;
  formError.value = '';
  successMessage.value = '';

  // Tạo FormData để gửi cả data và files
  const formData = new FormData();

   // Append hotel data
   Object.keys(hotelData).forEach(key => {
    if (hotelData[key] !== null && hotelData[key] !== '') {
      if (key === 'MaNguoiQuanLy') {
        const managerVal = parseInt(hotelData[key], 10);
        if (!isNaN(managerVal)) {
          formData.append(key, managerVal);
        }
      } else {
        formData.append(key, hotelData[key]);
      }
    }
  });

  // Append images
  selectedFiles.value.forEach((fileObj, index) => {
    formData.append('images', fileObj.file);
  });

  // Append main image index
  if (selectedFiles.value.length > 0) {
    formData.append('mainImageIndex', mainImageIndex.value);
  }

  // // Tạo payload, chỉ gửi MaNguoiQuanLy nếu nó có giá trị (khác null và không rỗng)
  // const payload = { ...hotelData };
  // if (payload.MaNguoiQuanLy === null || payload.MaNguoiQuanLy === '') {
  //   delete payload.MaNguoiQuanLy; // Không gửi nếu admin không nhập
  // } else {
  //   payload.MaNguoiQuanLy = parseInt(payload.MaNguoiQuanLy, 10);
  //   if(isNaN(payload.MaNguoiQuanLy)) { // Validate nếu nhập chữ
  //       formError.value = "Manager ID must be a valid number.";
  //       isSubmitting.value = false;
  //       return;
  //   }
  // }


  try {
    // API createHotel là POST /api/hotels (không có params trên URL)
    const response = await axios.post('http://localhost:5000/api/hotels', formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // API createHotel của bạn trả về { message: '...' } khi status 201
    if (response.status === 201 && response.data && response.data.message) {
      successMessage.value = response.data.message + " Redirecting back to manage page...";
      // Reset form
      Object.keys(hotelData).forEach(key => {
        hotelData[key] = (typeof hotelData[key] === 'number' ? null : '');
      });
      setTimeout(() => {
        goBackToManageHotels();
      }, 2500);
    } else {
      // Xử lý trường hợp backend không trả về như mong đợi dù status có thể là 2xx
      formError.value = response.data?.error || response.data?.message || "Failed to add hotel. Unexpected response.";
    }
  } catch (err) {
    console.error("Error adding hotel:", err.response?.data || err.message);
    formError.value = 'Error adding hotel: ' + (err.response?.data?.error || err.response?.data?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function goBackToManageHotels() {
  router.push({ name: 'AdminFindHotel' }); // Cần định nghĩa route này
}
</script>

<style scoped>
.card img {
  transition: transform 0.2s;
}

.card:hover img {
  transform: scale(1.05);
}

.position-relative .btn {
  opacity: 0.8;
}

.position-relative .btn:hover {
  opacity: 1;
}
</style>