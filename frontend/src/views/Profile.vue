<!-- src/pages/Profile.vue -->
<template>
  <Layout title="THÔNG TIN NGƯỜI DÙNG">
  
    <section class="account-info-section container py-5 position-relative">
      <div v-if="authStore.isLoadingAuth && !authStore.currentUser" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="authStore.getAuthError && !authStore.currentUser" class="alert alert-danger">
        {{ authStore.getAuthError }}
      </div>
      <div v-else-if="authStore.currentUser">
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
              <p class="mb-1"><strong>Họ tên:</strong> {{ authStore.currentUser.HoTen }}</p>
              <p class="mb-1"><strong>Giới tính:</strong> {{ authStore.currentUser.GioiTinh || 'N/A' }}</p>
              <p class="mb-1"><strong>Ngày sinh:</strong> {{ authStore.currentUser.NgaySinh ? new Date(authStore.currentUser.NgaySinh).toLocaleDateString() : 'N/A' }}</p>
            </div>
          </div>
        </UserInfoCard>

        <UserInfoCard
          title="Liên hệ"
          :onEdit="() => handleEdit('contact')"
          :highlight="highlight.contact"
        >
          <p class="mb-1"><strong>Email:</strong> {{ authStore.currentUser.Email }}</p>
          <p class="mb-1"><strong>SĐT:</strong> {{ authStore.currentUser.SDT || 'N/A' }}</p>
        </UserInfoCard>

        <UserInfoCard
          title="Thông tin định danh"
          :onEdit="() => handleEdit('cccd')"
          :highlight="highlight.cccd"
        >
          <p class="mb-1"><strong>CCCD:</strong> {{ authStore.currentUser.CCCD || 'N/A' }}</p>
        </UserInfoCard>
      </div>
      <div v-else class="alert alert-warning">
          User data not available. You might need to log in.
      </div>

       <div style="height: 30px; width: 10%;" class="position-absolute end-0" v-if="authStore.isAuthenticated">
              <Button
                content="LOG OUT"
                block
                textColor="white"
                @click="handleLogout"
                borderRadius="0px"
                backgroundColor="black"
                textAlign="center"
                colorHover="white"
                bgHover="black"
              />
            </div>
    </section>

    <EditUserModal
      v-if="showModal"
      :user="editedUser"
      :section="editSection"
      @close="handleModalClose"
      @save="handleModalSave"
    />
  </Layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'; // Thêm watch
import axios from 'axios';
import Layout from '../components/Layout.vue';
import Button from '../components/Button.vue';
import EditUserModal from '@/components/EditUserModal.vue';
import UserInfoCard from '@/components/UserInfoCard.vue';
import { useRouter } from 'vue-router'; // Đổi từ useRoute sang useRouter
import { useAuthStore } from '../store/authStore';

const authStore = useAuthStore();
const router = useRouter(); // Dùng useRouter để điều hướng

//
// Không cần user, loading, error cục bộ nữa nếu thông tin user chính được quản lý bởi store
// const user = ref(null);
// const loading = ref(true);
// const error = ref('');
//

const showModal = ref(false);
const editSection = ref('');
const editedUser = ref({}); // Vẫn giữ để chỉnh sửa, sẽ đồng bộ với store.currentUser khi edit

const highlight = ref({
  personal: false,
  contact: false,
  cccd: false
});

//
// Hàm logout mới sẽ gọi action của store
//
async function handleLogout() {
    await authStore.logout();
    setTimeout(() => {
      const redirectPath = router.currentRoute.value.query.redirect || '/homepage';
      router.push(redirectPath);
    }, 1500);
}

onMounted(async () => {
  //
  // Nếu authStore.user chưa có giá trị (ví dụ sau khi reload và persist nạp lên là null,
  // hoặc initializeAuth chưa chạy xong), thì gọi fetchCurrentUser.
  // Action initializeAuth trong store cũng nên gọi fetchCurrentUser nếu user được nạp từ persist.
  //
  if (!authStore.currentUser && authStore.isAuthenticated) { // Chỉ fetch nếu đã xác thực (có token) nhưng chưa có user data
      console.log('ProfilePage: currentUser not found in store, attempting to fetch...');
      await authStore.fetchCurrentUser();
  } else if (!authStore.isAuthenticated) {
      console.log('ProfilePage: User not authenticated, redirecting to login.');
      router.push('/login'); // Nếu chưa đăng nhập, có thể chuyển về login
  }
  //
  // Dữ liệu user sẽ được đọc trực tiếp từ authStore.currentUser trong template
  //
});

function handleEdit(section) {
  editSection.value = section;
  //
  // Lấy dữ liệu user hiện tại từ store để đưa vào modal
  //
  editedUser.value = { ...authStore.currentUser };
  showModal.value = true;
}

function handleModalClose() {
  showModal.value = false;
}

async function handleModalSave({ section, data }) { // data là object chứa các trường đã sửa
  authStore.isLoading = true; // Dùng cờ loading của store
  authStore.authError = null; // Xóa lỗi cũ
  try {
    //
    // Gọi API cập nhật user
    //
    await axios.put('http://localhost:5000/api/users/me', data, {
      withCredentials: true
    });
    //
    // Sau khi cập nhật thành công, fetch lại thông tin user mới nhất từ backend
    // Action fetchCurrentUser sẽ cập nhật state.user trong store
    //
    await authStore.fetchCurrentUser();
    showModal.value = false;

    highlight.value[section] = true;
    setTimeout(() => {
      highlight.value[section] = false;
    }, 2000);
  } catch (err) {
    console.error('Update user info failed:', err);
    authStore.authError = err.response?.data?.message || 'Cập nhật thông tin thất bại';
    // Lỗi sẽ được hiển thị nếu bạn có v-if="authStore.getAuthError" trong template
  } finally {
    authStore.isLoading = false;
  }
}
</script>

<style scoped>
.account-info-section {
  padding-top: 120px; /* Giữ nguyên hoặc điều chỉnh */
}
.avatar-icon {
  width: 60px; height: 60px; border-radius: 50%; background: #eee;
  display: flex; align-items: center; justify-content: center;
}
</style>