<!-- src/pages/Profile.vue -->
<template>
  <Layout :title="pageTitle">
    <section class="account-info-section container py-5 position-relative">
      <!-- 1. Loading: While auth state is being checked or user data is being fetched initially -->
      <div v-if="authStore.isLoadingAuth && !authStore.currentUser" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- 2. Error: If there was an error fetching auth state or user data -->
      <div v-else-if="authStore.getAuthError && !authStore.currentUser" class="alert alert-danger">
        <p>{{ authStore.getAuthError }}</p>
        <!-- Offer login if it seems like an auth-related error (e.g., 401 was part of error) -->
        <p v-if="isAuthRelatedError(authStore.getAuthError)">
          Vui lòng <router-link :to="{ name: 'Login', query: { redirect: '/profile' } }">đăng nhập</router-link> để tiếp tục.
        </p>
      </div>

      <!-- 3. User Info: If currentUser exists in the store -->
      <div v-else-if="authStore.currentUser" class="user-profile-content">
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

      <!-- 4. Not Authenticated: If not loading, no error, no user, and not authenticated -->
      <div v-else-if="!authStore.isAuthenticated && !authStore.isLoadingAuth && !authStore.getAuthError" class="text-center py-5">
        <p>
          Vui lòng <router-link :to="{ name: 'Login', query: { redirect: '/profile' } }">đăng nhập</router-link> để xem thông tin cá nhân của bạn.
        </p>
      </div>
      
      <!-- 5. Fallback: Catch-all for unexpected states (e.g., authenticated but no user data, and not loading/erroring) -->
      <div v-else class="text-center py-5">
         <p>Không thể tải thông tin người dùng. Vui lòng thử lại sau hoặc <router-link :to="{ name: 'Login', query: { redirect: '/profile' } }">đăng nhập lại</router-link>.</p>
      </div>
    </section>

    <!-- Modal Edit -->
    <EditUserModal
      v-if="showModal && authStore.currentUser"
      :user="editedUser"
      :section="editSection"
      @close="handleModalClose"
      @save="handleModalSave"
    />
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Layout from '../components/Layout.vue';
import Button from '../components/Button.vue';
import EditUserModal from '@/components/EditUserModal.vue';
import UserInfoCard from '@/components/UserInfoCard.vue';
import { useAuthStore } from '../store/authStore';

const authStore = useAuthStore();
const router = useRouter();

const showModal = ref(false);
const editSection = ref('');
const editedUser = ref({}); // Data for editing, copied from authStore.currentUser

const highlight = ref({
  personal: false,
  contact: false,
  cccd: false,
});

const pageTitle = computed(() => {
  if (authStore.currentUser) {
    return `THÔNG TIN NGƯỜI DÙNG: ${authStore.currentUser.HoTen}`;
  }
  return 'TRANG CÁ NHÂN';
});

// Helper to check if an error message suggests an authentication issue
const isAuthRelatedError = (errorMsg) => {
  if (!errorMsg) return false;
  const lowerError = errorMsg.toLowerCase();
  return lowerError.includes('unauthorized') || lowerError.includes('401') || lowerError.includes('đăng nhập');
};

onMounted(async () => {
  // If authenticated (e.g., token exists from previous session) but currentUser data is not in store,
  // try to fetch it. The initializeAuth action in the store might also do this.
  if (authStore.isAuthenticated && !authStore.currentUser) {
    console.log('ProfilePage: currentUser not in store, attempting to fetch...');
    await authStore.fetchCurrentUser(); // This might set isLoadingAuth and authError in store
  } else if (!authStore.isAuthenticated) {
    // If not authenticated at all, redirect to login.
    // Add a redirect query parameter so user comes back to profile after login.
    console.log('ProfilePage: User not authenticated, redirecting to login.');
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

async function handleLogout() {
  await authStore.logout();
  // Redirect to homepage or login page after logout
  router.push('/homepage');
}

function handleEdit(section) {
  if (!authStore.currentUser) return; // Should not happen if button is shown
  editSection.value = section;
  // Create a deep copy for editing to avoid mutating store state directly
  editedUser.value = JSON.parse(JSON.stringify(authStore.currentUser));
  showModal.value = true;
}

function handleModalClose() {
  showModal.value = false;
}

async function handleModalSave({ section, data }) {
  // Use store's loading and error states if available, or manage locally
  // authStore.setLoading(true); // Or a more specific loading state
  // authStore.clearError();
  const tempLoading = ref(true); // Local loading for this operation
  
  try {
    await axios.put('http://localhost:5000/api/users/me', data, {
      withCredentials: true,
    });
    // After successful update, fetch the latest user info to update the store
    await authStore.fetchCurrentUser();
    showModal.value = false;

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
        // If unauthorized during update, treat as session expiry
        authStore.setError(errorMsg + " Phiên của bạn có thể đã hết hạn."); // Set error in store
        await authStore.logout(); // Logout
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } }); // Redirect to login
        return; // Stop further processing
      }
    }
    authStore.setError(errorMsg); // Set error in store for general display
    // Optionally, show error in modal or as a toast notification
  } finally {
    tempLoading.value = false;
    // authStore.setLoading(false);
  }
}
</script>

<style scoped>
.account-info-section {
  /* padding-top: 120px; */ /* Removed fixed padding, adjust if needed based on Layout component */
}
.avatar-icon {
  width: 60px; height: 60px; border-radius: 50%; background: #eee;
  display: flex; align-items: center; justify-content: center;
}
</style>