<template>
  <Layout :title="pageTitle">
    <section class="account-info-section container py-5 position-relative">
      <!-- ... (Phần loading, error, user info đã có) ... -->
      <div v-if="authStore.isLoadingAuth && !authStore.currentUser" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="authStore.getAuthError && !authStore.currentUser" class="alert alert-danger">
        <p>{{ authStore.getAuthError }}</p>
        <p v-if="isAuthRelatedError(authStore.getAuthError)">
          Vui lòng <router-link :to="{ name: 'Login', query: { redirect: '/profile' } }">đăng nhập</router-link> để tiếp tục.
        </p>
      </div>

      <div v-else-if="authStore.currentUser" class="user-profile-content">
        <!-- Thông tin cá nhân -->
        <UserInfoCard
          title="Thông tin cá nhân"
          :onEdit="() => handleEdit('personal')"
          :highlight="highlight.personal"
        >
          <!-- ... (Nội dung thông tin cá nhân) ... -->
          <div class="d-flex align-items-center mb-3">
            <div class="avatar-icon me-3">
              <i class="bi bi-person-circle fs-1"></i>
            </div>
            <div>
              <p class="mb-1"><strong>Họ tên:</strong> {{ authStore.currentUser.HoTen }}</p>
              <p class="mb-1"><strong>Giới tính:</strong> {{ authStore.currentUser.GioiTinh || 'Chưa cập nhật' }}</p>
              <p class="mb-1"><strong>Ngày sinh:</strong> {{ authStore.currentUser.NgaySinh ? new Date(authStore.currentUser.NgaySinh).toLocaleDateString() : 'Chưa cập nhật' }}</p>
            </div>
          </div>
        </UserInfoCard>

        <!-- Liên hệ -->
        <UserInfoCard
          title="Liên hệ"
          :onEdit="() => handleEdit('contact')"
          :highlight="highlight.contact"
        >
          <p class="mb-1"><strong>Email:</strong> {{ authStore.currentUser.Email }}</p>
          <p class="mb-1"><strong>SĐT:</strong> {{ authStore.currentUser.SDT || 'Chưa cập nhật' }}</p>
        </UserInfoCard>

        <!-- Thông tin định danh -->
        <UserInfoCard
          title="Thông tin định danh"
          :onEdit="() => handleEdit('cccd')"
          :highlight="highlight.cccd"
        >
          <p class="mb-1"><strong>CCCD:</strong> {{ authStore.currentUser.CCCD || 'Chưa cập nhật' }}</p>
        </UserInfoCard>

        <!-- THÊM MỚI: Bảo mật tài khoản (Đổi mật khẩu) -->
        <UserInfoCard
          title="Bảo mật tài khoản"
          :onEdit="openChangePasswordModal"
        >
          <!-- Hiển thị thông báo thành công/lỗi ngay dưới phần mô tả, trước nút của UserInfoCard -->
          <p v-if="passwordChangeStatus.message" 
             :class="['mb-2', 'p-2', 'rounded', passwordChangeStatus.type === 'success' ? 'alert-success-profile' : 'alert-danger-profile']" 
             style="font-size: 0.9rem;">
            {{ passwordChangeStatus.message }}
          </p>
        </UserInfoCard>
        <!-- KẾT THÚC: Bảo mật tài khoản -->

        <!-- Nút Log out -->
        <div style="height: 30px; width: auto; margin-top: 20px;" class="d-flex justify-content-end">
          <Button
            content="LOG OUT"
            textColor="white"
            @click="handleLogout"
            borderRadius="0px"
            backgroundColor="black"
            textAlign="center"
            colorHover="white"
            bgHover="black"
            style="padding: 5px 15px;"
          />
        </div>
      </div>

      <div v-else-if="!authStore.isAuthenticated && !authStore.isLoadingAuth && !authStore.getAuthError" class="text-center py-5">
        <p>
          Vui lòng <router-link :to="{ name: 'Login', query: { redirect: '/profile' } }">đăng nhập</router-link> để xem thông tin cá nhân của bạn.
        </p>
      </div>
      
      <div v-else class="text-center py-5">
         <p>Không thể tải thông tin người dùng. Vui lòng thử lại sau hoặc <router-link :to="{ name: 'Login', query: { redirect: '/profile' } }">đăng nhập lại</router-link>.</p>
      </div>
    </section>

    <!-- Modal Edit User Info -->
    <EditUserModal
      v-if="showEditModal && authStore.currentUser"
      :user="editedUser"
      :section="editSection"
      @close="handleModalClose"
      @save="handleModalSave"
    />

    <!-- THÊM MỚI: Modal Change Password -->
    <ChangePasswordModal
      v-if="showChangePasswordModal"
      @close="closeChangePasswordModal"
      @password-changed="handlePasswordSuccessfullyChanged"
      @error="handlePasswordChangeError"
    />
    <!-- KẾT THÚC: Modal Change Password -->

  </Layout>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Layout from '../components/Layout.vue';
import Button from '../components/Button.vue'; // Giả sử Button.vue là component bạn dùng
import EditUserModal from '@/components/EditUserModal.vue';
import UserInfoCard from '@/components/UserInfoCard.vue';
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'; // Import modal mới
import { useAuthStore } from '../store/authStore';

const authStore = useAuthStore();
const router = useRouter();

const showEditModal = ref(false);
const editSection = ref('');
const editedUser = ref({}); 

const highlight = ref({
  personal: false,
  contact: false,
  cccd: false,
});

// START: Trạng thái cho việc đổi mật khẩu
const showChangePasswordModal = ref(false);
const passwordChangeStatus = reactive({ type: '', message: '' }); // type: 'success' | 'error'
// END: Trạng thái cho việc đổi mật khẩu

const pageTitle = computed(() => {
  if (authStore.currentUser) {
    return `THÔNG TIN NGƯỜI DÙNG: ${authStore.currentUser.HoTen}`;
  }
  return 'TRANG CÁ NHÂN';
});

const isAuthRelatedError = (errorMsg) => {
  if (!errorMsg) return false;
  const lowerError = errorMsg.toLowerCase();
  return lowerError.includes('unauthorized') || lowerError.includes('401') || lowerError.includes('đăng nhập');
};

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.currentUser) {
    await authStore.fetchCurrentUser(); 
  } else if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

async function handleLogout() {
  await authStore.logout();
  router.push('/homepage');
}

function handleEdit(section) {
  if (!authStore.currentUser) return; 
  editSection.value = section;
  editedUser.value = JSON.parse(JSON.stringify(authStore.currentUser));
  showEditModal.value = true;
}

function handleModalClose() {
  showEditModal.value = false;
}

async function handleModalSave({ section, data }) {
  // ... (code xử lý lưu thông tin user đã có) ...
   const tempLoading = ref(true); 
  try {
    await axios.put('http://localhost:5000/api/users/me', data, {
      withCredentials: true,
    });
    await authStore.fetchCurrentUser();
    showEditModal.value = false;

    highlight.value[section] = true;
    setTimeout(() => {
      highlight.value[section] = false;
    }, 2000);

  } catch (err) {
    console.error("Lỗi khi cập nhật thông tin:", err);
    let errorMsg = 'Lỗi mạng hoặc server không phản hồi khi cập nhật.';
    if (err.response) {
      errorMsg = err.response.data?.message || `Lỗi ${err.response.status}: Cập nhật thất bại.`;
      if (err.response.status === 401) {
        authStore.setError(errorMsg + " Phiên của bạn có thể đã hết hạn."); 
        await authStore.logout(); 
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } }); 
        return; 
      }
    }
    authStore.setError(errorMsg); 
  } finally {
    tempLoading.value = false;
  }
}

// START: Các hàm xử lý cho việc đổi mật khẩu
function openChangePasswordModal() {
  passwordChangeStatus.message = ''; 
  passwordChangeStatus.type = '';
  showChangePasswordModal.value = true;
}

function closeChangePasswordModal() {
  showChangePasswordModal.value = false;
}

function handlePasswordSuccessfullyChanged(message) {
  passwordChangeStatus.type = 'success';
  passwordChangeStatus.message = message || 'Đổi mật khẩu thành công!';
  showChangePasswordModal.value = false; 
  setTimeout(() => { // Tự động xóa thông báo sau vài giây
    passwordChangeStatus.message = '';
    passwordChangeStatus.type = '';
  }, 5000);
}

function handlePasswordChangeError(message) {
  passwordChangeStatus.type = 'error';
  // Thông báo lỗi đã được hiển thị trong modal, nên ở đây có thể không cần đặt lại message
  // hoặc chỉ đặt nếu modal không tự hiển thị.
  // passwordChangeStatus.message = message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
  // showChangePasswordModal.value = false; // Không đóng modal nếu có lỗi để user sửa
  setTimeout(() => {
    if (passwordChangeStatus.type === 'error') {
        passwordChangeStatus.message = ''; // Xóa thông báo lỗi trên trang Profile sau 1 thời gian
        passwordChangeStatus.type = '';
    }
  }, 7000);
}
// END: Các hàm xử lý cho việc đổi mật khẩu
</script>

<style scoped>
.account-info-section {
  padding-top: 120px;
}
.avatar-icon {
  width: 60px; height: 60px; border-radius: 50%; background: #eee;
  display: flex; align-items: center; justify-content: center;
}
/* Style cho thông báo thành công/lỗi trên Profile.vue */
.alert-success-profile {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}
.alert-danger-profile {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}
.mt-2 { margin-top: 0.5rem !important; }
.p-2 { padding: 0.5rem !important; }
.rounded { border-radius: 0.25rem !important; }

/* Các style khác nếu cần */
</style>