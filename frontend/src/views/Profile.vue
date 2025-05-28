<!-- src/pages/Profile.vue -->
<template>
    <Layout title="THÔNG TIN NGƯỜI DÙNG">
    <section class="account-info-section container py-5 position-relative">
      <!-- 1. Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- 2. Lỗi (ví dụ: người dùng không được phép, API lỗi) -->
      <div v-else-if="error && !userDetails" class="alert alert-danger">
        <p>{{ error }}</p>
        <p v-if="isUnauthorizedError">
          Vui lòng <router-link to="/login">đăng nhập</router-link> để tiếp tục.
        </p>
      </div>

      <!-- 3. Hiển thị thông tin người dùng nếu đã đăng nhập VÀ có userDetails -->
      <div v-else-if="isLoggedIn && userDetails" class="user-profile-content">
        <!-- Thông tin cá nhân -->
        <UserInfoCard
          title="Thông tin cá nhân"
          :onEdit="() => handleEdit('personal')"
          :highlight="highlight.personal"
        >
          <div class="d-flex align-items-center mb-3">
            <div class="avatar-icon me-3">
              <i class="bi bi-person-circle fs-1"></i>
            </div>
            <div>
              <p class="mb-1"><strong>Họ tên:</strong> {{ userDetails.HoTen }}</p>
              <p class="mb-1"><strong>Giới tính:</strong> {{ userDetails.GioiTinh }}</p>
              <p class="mb-1"><strong>Ngày sinh:</strong> {{ userDetails.NgaySinh ? new Date(userDetails.NgaySinh).toLocaleDateString() : '' }}</p>
            </div>
          </div>
        </UserInfoCard>

        <!-- Liên hệ -->
        <UserInfoCard
          title="Liên hệ"
          :onEdit="() => handleEdit('contact')"
          :highlight="highlight.contact"
        >
          <p class="mb-1"><strong>Email:</strong> {{ userDetails.Email }}</p>
          <p class="mb-1"><strong>SĐT:</strong> {{ userDetails.SDT }}</p>
        </UserInfoCard>

        <!-- Thông tin định danh -->
        <UserInfoCard
          title="Thông tin định danh"
          :onEdit="() => handleEdit('cccd')"
          :highlight="highlight.cccd"
        >
          <p class="mb-1"><strong>CCCD:</strong> {{ userDetails.CCCD }}</p>
        </UserInfoCard>

        <!-- Nút Log out -->
        <div style="height: 30px; width: auto; margin-top: 20px;" class="d-flex justify-content-end">
          <Button
            content="LOG OUT"
            textColor="white"
            @click="logoutAndRedirect"
            borderRadius="0px"
            backgroundColor="black"
            textAlign="center"
            colorHover="white"
            bgHover="black"
            style="padding: 5px 15px;"
          />
        </div>
      </div>

      <!-- 4. Trường hợp người dùng chưa đăng nhập -->
      <div v-else-if="!isLoggedIn" class="text-center py-5">
        <p>
          Vui lòng <router-link to="/login">đăng nhập</router-link> để xem thông tin cá nhân của bạn.
        </p>
      </div>

      <!-- Fallback: Nếu isLoggedIn true nhưng không có userDetails (có thể đang đợi API /me hoặc API lỗi nhẹ) -->
      <div v-else class="text-center py-5">
         <p>Không thể tải thông tin người dùng. Vui lòng thử lại sau.</p>
      </div>
    </section>

    <!-- Modal Edit -->
    <EditUserModal
      v-if="showModal && userDetails"
      :user="editedUser"
      :section="editSection"
      @close="handleModalClose"
      @save="handleModalSave"
    />
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Layout from '../components/Layout.vue';
import Button from '../components/Button.vue';
import EditUserModal from '@/components/EditUserModal.vue';
import UserInfoCard from '@/components/UserInfoCard.vue';
import { useAuth } from '../utils/auth'; // Hook xác thực của chúng ta

const router = useRouter();
const { isLoggedIn, currentUserRole, logout, checkLogin } = useAuth(); // Lấy thêm currentUserRole và checkLogin

// State riêng cho component Profile
const userDetails = ref(null); // Thông tin chi tiết từ /api/users/me
const loading = ref(true);
const error = ref('');
const isUnauthorizedError = ref(false); // Để xử lý cụ thể lỗi 401

const showModal = ref(false);
const editSection = ref('');
const editedUser = ref({}); // Dữ liệu để edit, sẽ là bản copy của userDetails

const highlight = ref({
  personal: false,
  contact: false,
  cccd: false,
});

const pageTitle = computed(() => {
  if (isLoggedIn.value && userDetails.value) return `THÔNG TIN NGƯỜI DÙNG: ${userDetails.value.HoTen}`;
  return 'TRANG CÁ NHÂN';
});

// Hàm tải dữ liệu người dùng chi tiết
async function fetchUserDetails() {
  if (!isLoggedIn.value) {
    loading.value = false;
    // isUnauthorizedError.value = true; // Không cần thiết vì v-else-if="!isLoggedIn" sẽ xử lý
    error.value = 'Bạn cần đăng nhập để xem thông tin này.';
    return;
  }

  loading.value = true;
  error.value = '';
  isUnauthorizedError.value = false;
  try {
    const res = await axios.get('http://localhost:5000/api/users/me', {
      withCredentials: true,
    });
    if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
      userDetails.value = res.data; // Dữ liệu này KHÔNG chứa loaiUSER (dựa trên hình ảnh)
    } else {
      userDetails.value = null;
      error.value = 'Không nhận được dữ liệu người dùng hợp lệ.';
    }
  } catch (err) {
    console.error("Lỗi khi lấy thông tin chi tiết người dùng:", err);
    if (err.response) {
      error.value = err.response.data?.message || `Lỗi ${err.response.status}: Không thể tải dữ liệu.`;
      if (err.response.status === 401) {
        isUnauthorizedError.value = true;
        // Nếu bị 401, có thể gọi lại checkLogin từ useAuth để nó dọn dẹp trạng thái
        await checkLogin(); // Điều này sẽ set isLoggedIn = false nếu session không hợp lệ
      }
    } else {
      error.value = 'Lỗi kết nối mạng hoặc server không phản hồi.';
    }
    userDetails.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchUserDetails();
});

// Watcher để theo dõi thay đổi trạng thái đăng nhập (ví dụ: người dùng logout từ tab khác)
// và tải lại dữ liệu nếu cần.
watch(isLoggedIn, (newValue, oldValue) => {
  if (newValue && !oldValue) { // User vừa đăng nhập
    fetchUserDetails();
  } else if (!newValue && oldValue) { // User vừa logout
    userDetails.value = null; // Xóa dữ liệu cũ
    error.value = '';
    isUnauthorizedError.value = false;
  }
});


async function logoutAndRedirect() {
  await logout(); // Hàm logout từ useAuth đã xử lý việc xóa token và set isLoggedIn=false
  router.push('/homepage'); // Hoặc '/login'
}

function handleEdit(section) {
  if (!userDetails.value) return;
  editSection.value = section;
  editedUser.value = { ...userDetails.value };
  showModal.value = true;
}

function handleModalClose() {
  showModal.value = false;
}

async function handleModalSave({ section, data }) {
  if (!isLoggedIn.value || !userDetails.value) {
    error.value = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
    isUnauthorizedError.value = true;
    showModal.value = false;
    await checkLogin(); // Có thể redirect hoặc dọn dẹp
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.put('http://localhost:5000/api/users/me', data, {
      withCredentials: true,
    });
    // Cập nhật userDetails với data mới nhất từ server (có thể không bao gồm loaiUSER)
    userDetails.value = res.data;

    // currentUserRole từ useAuth KHÔNG tự động cập nhật từ PUT này
    // vì token ở client không thay đổi sau PUT.
    // Nếu backend CÓ thay đổi `loaiUSER` và bạn muốn nó phản ánh ngay lập tức mà không cần logout/login,
    // thì API PUT /me này cũng phải trả về token MỚI chứa loaiUSER mới,
    // hoặc trả về loaiUSER mới trong response body, và bạn phải cập nhật nó vào currentUserRole.value.
    // Hoặc đơn giản hơn là yêu cầu người dùng đăng nhập lại để token mới được lấy.

    showModal.value = false;
    highlight.value[section] = true;
    setTimeout(() => {
      highlight.value[section] = false;
    }, 2000);
  } catch (err) {
    console.error("Lỗi khi cập nhật thông tin:", err);
    if (err.response) {
      error.value = err.response.data?.message || `Lỗi ${err.response.status}: Cập nhật thất bại.`;
      if (err.response.status === 401) {
        isUnauthorizedError.value = true;
        await checkLogin(); // Sẽ set isLoggedIn=false nếu cần và có thể redirect
        router.push('/login');
      }
    } else {
      error.value = 'Lỗi mạng hoặc server không phản hồi khi cập nhật.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.avatar-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>