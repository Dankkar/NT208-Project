<template>
  <div>
    <!-- Navbar, Sidebar, Footer được xử lý bởi DashboardLayout.vue (component cha) -->
    <div v-if="pageLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading user data...</span>
      </div>
    </div>
    <div v-else-if="pageError" class="alert alert-danger">
      <p>Error loading user data: {{ pageError }}</p>
      <button @click="goBackToUserList" class="btn btn-secondary btn-sm mt-2">Back to Find User</button>
    </div>
    <div v-else-if="!userToEdit.MaKH">
        <div class="alert alert-warning">User data not available.</div>
        <button @click="goBackToUserList" class="btn btn-secondary btn-sm mt-2">Back to Find User</button>
    </div>

    <div v-else>
      <h1 class="mb-4 fw-bold text-center">Edit User: {{ originalUserName || `ID ${userId}`}}</h1>

      <form @submit.prevent="submitUpdateUser" class="card p-4 shadow-sm">
        <div v-if="updateError" class="alert alert-danger">{{ updateError }}</div>
        <div v-if="updateSuccessMessage" class="alert alert-success">{{ updateSuccessMessage }}</div>

        <div class="row g-3">
          <!-- MaKH (Read-only) -->
          <div class="col-md-6">
            <label for="maKH" class="form-label">User ID (MaKH)</label>
            <input id="maKH" type="text" class="form-control" :value="userToEdit.MaKH" readonly disabled />
          </div>

          <!-- HoTen -->
          <div class="col-md-6">
            <label for="hoTen" class="form-label">Full Name</label>
            <input id="hoTen" v-model="editableUserData.HoTen" type="text" class="form-control" placeholder="Enter full name" />
            <!-- Thêm validation error message nếu cần -->
          </div>

          <!-- Email -->
          <div class="col-md-6">
            <label for="email" class="form-label">Email</label>
            <input id="email" v-model="editableUserData.Email" type="email" class="form-control" placeholder="Enter email" />
          </div>

          <!-- SDT -->
          <div class="col-md-6">
            <label for="sdt" class="form-label">Phone Number</label>
            <input id="sdt" v-model="editableUserData.SDT" type="tel" class="form-control" placeholder="Enter phone number" />
          </div>

          <!-- CCCD -->
          <div class="col-md-6">
            <label for="cccd" class="form-label">National ID (CCCD)</label>
            <input id="cccd" v-model="editableUserData.CCCD" type="text" class="form-control" placeholder="Enter National ID" />
          </div>

          <!-- NgaySinh -->
          <div class="col-md-6">
            <label for="ngaySinh" class="form-label">Date of Birth</label>
            <input id="ngaySinh" v-model="editableUserData.NgaySinh" type="date" class="form-control" />
          </div>

          <!-- GioiTinh -->
          <div class="col-md-6">
            <label for="gioiTinh" class="form-label">Gender</label>
            <select id="gioiTinh" v-model="editableUserData.GioiTinh" class="form-select">
              <option value="">Select Gender</option>
              <option value="Nam">Nam (Male)</option>
              <option value="Nữ">Nữ (Female)</option>
              <option value="Khác">Khác (Other)</option>
            </select>
          </div>

          <!-- LoaiUser -->
          <div class="col-md-6">
            <label for="loaiUser" class="form-label">User Role (LoaiUser)</label>
            <select id="loaiUser" v-model="editableUserData.LoaiUser" class="form-select">
              <option value="KhachHang">KhachHang (Customer)</option>
              <option value="QuanLyKS">QuanLyKS (Hotel Manager)</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

           <!-- IsActive (Read-only or toggle, tùy theo nhu cầu) -->
          <div class="col-md-12 mt-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="editableUserData.IsActive" id="IsActiveCheck">
              <label class="form-check-label" for="IsActiveCheck">
                Is Active
              </label>
            </div>
          </div>


        </div>

        <div class="mt-4 d-flex justify-content-end">
          <button type="button" @click="goBackToUserList" class="btn btn-secondary me-2" :disabled="isUpdating">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isUpdating">
            <span v-if="isUpdating" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {{ isUpdating ? 'Updating...' : 'Update User' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const userId = ref(route.params.userId || null); // Lấy userId từ route params
const userToEdit = ref({}); // Dữ liệu gốc của user, không bind trực tiếp vào form
const originalUserName = ref(''); // Để hiển thị tên gốc ở tiêu đề

const editableUserData = reactive({ // Dữ liệu admin có thể sửa, bind vào form
  MaKH: null, // Sẽ không cho sửa
  HoTen: '',
  Email: '',
  SDT: '',
  CCCD: '',
  NgaySinh: '', // Format là YYYY-MM-DD cho input type="date"
  GioiTinh: '',
  LoaiUser: 'KhachHang', // Mặc định
  IsActive: true,
});

const pageLoading = ref(true);
const pageError = ref('');
const isUpdating = ref(false);
const updateError = ref('');
const updateSuccessMessage = ref('');

// Hàm fetch chi tiết người dùng từ backend
async function fetchUserDetails(id) {
  pageLoading.value = true;
  pageError.value = '';
  try {
    // Giả định bạn có API: GET /api/users/admin-view/:userId (hoặc tên khác)
    const response = await axios.get(`http://localhost:5000/api/users/admin-view/${id}`, {
      withCredentials: true,
    });

    if (response.data && response.data.success) {
      userToEdit.value = response.data.data;
      originalUserName.value = response.data.data.HoTen || '';
      // Populate editableUserData
      editableUserData.MaKH = userToEdit.value.MaKH;
      editableUserData.HoTen = userToEdit.value.HoTen || '';
      editableUserData.Email = userToEdit.value.Email || '';
      editableUserData.SDT = userToEdit.value.SDT || '';
      editableUserData.CCCD = userToEdit.value.CCCD || '';
      editableUserData.NgaySinh = userToEdit.value.NgaySinh ? new Date(userToEdit.value.NgaySinh).toISOString().split('T')[0] : '';
      editableUserData.GioiTinh = userToEdit.value.GioiTinh || '';
      editableUserData.LoaiUser = userToEdit.value.LoaiUser || 'KhachHang';
      editableUserData.IsActive = !!userToEdit.value.IsActive; // Chuyển sang boolean
    } else {
      pageError.value = response.data?.message || 'Could not load user data.';
    }
  } catch (err) {
    console.error('Error fetching user details for admin:', err);
    if (err.response && err.response.status === 404) {
        pageError.value = `User with ID ${id} not found.`;
    } else {
        pageError.value = err.response?.data?.message || 'An error occurred while fetching user data.';
    }
  } finally {
    pageLoading.value = false;
  }
}

async function submitUpdateUser() {
  isUpdating.value = true;
  updateError.value = '';
  updateSuccessMessage.value = '';

  // Tạo payload chỉ chứa các trường có thể đã thay đổi và không phải MaKH
  const payload = {
    HoTen: editableUserData.HoTen,
    Email: editableUserData.Email,
    SDT: editableUserData.SDT,
    CCCD: editableUserData.CCCD,
    NgaySinh: editableUserData.NgaySinh || null, // Gửi null nếu rỗng
    GioiTinh: editableUserData.GioiTinh || null,
    LoaiUser: editableUserData.LoaiUser, // Admin có thể thay đổi LoaiUser
    IsActive: editableUserData.IsActive
  };
  // Bỏ đi các trường rỗng (string) để backend có thể xử lý là không thay đổi nếu không muốn update
  // Hoặc backend của bạn phải tự xử lý các giá trị rỗng.
  // Với API updateUserByAdmin hiện tại của bạn, nó sẽ set các trường là rỗng nếu bạn gửi chuỗi rỗng.

  try {
    // API của bạn là PUT /api/users/:MaKH
    // Controller là updateUserByAdmin
    const response = await axios.put(
      `http://localhost:5000/api/users/${userId.value}`, // userId.value là MaKH của user cần update
      payload,
      { withCredentials: true }
    );

    // updateUserByAdmin của bạn trả về: { message: 'Cập nhật thông tin người dùng thành công' } khi status 200
    if (response.status === 200 && response.data?.message) {
      updateSuccessMessage.value = response.data.message;
      // Sau khi cập nhật thành công, có thể fetch lại dữ liệu để form hiển thị giá trị mới nhất
      // hoặc chỉ hiển thị thông báo.
      // fetchUserDetails(userId.value); // Option: fetch lại để cập nhật userToEdit và originalUserName
    } else {
      updateError.value = response.data?.message || 'Failed to update user: Unknown server response.';
    }
  } catch (err) {
    console.error('Error updating user by admin:', err);
    updateError.value = err.response?.data?.message || 'An error occurred while updating the user.';
  } finally {
    isUpdating.value = false;
  }
}

function goBackToUserList() {
  router.push({ name: 'AdminFindUser' }); // Hoặc route danh sách user nếu có
}

// Lắng nghe sự thay đổi của route.params.userId để fetch lại nếu user điều hướng
// trực tiếp giữa các trang edit của các user khác nhau (hiếm gặp nhưng để an toàn)
watch(() => route.params.userId, (newId) => {
  if (newId && newId !== userId.value) {
    userId.value = newId;
    fetchUserDetails(newId);
  }
});

onMounted(() => {
  if (userId.value) {
    fetchUserDetails(userId.value);
  } else {
    pageError.value = "User ID is missing. Cannot load data.";
    pageLoading.value = false;
  }
});

</script>

<style scoped>
/* Thêm style nếu cần */
.form-label {
  font-weight: 500;
}
.card {
  max-width: 800px; /* Giới hạn chiều rộng của form */
  margin: auto; /* Căn giữa form */
}
</style>