<template>
  <div>
    <Navbar :bgFixed="true" style="position: fixed !important; top: 0; width: 100%; z-index: 100;" />

    <!-- A. Hiển thị loading nếu store đang trong quá trình initializeAuth CHUNG -->
    <!-- Hoặc nếu Dashboard đang tự thực hiện kiểm tra onMounted -->
    <div v-if="isLoadingStore || isVerifyingAccess" class="text-center py-5" style="margin-top: 70px;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Verifying access...</span>
      </div>
    </div>

    <!-- B. Sau khi store đã khởi tạo và component đã check xong -->
    <template v-else>
      <!-- 1. Nếu người dùng chưa đăng nhập -->
      <div v-if="!isAuthenticatedStore" class="alert alert-warning text-center" style="margin-top: 70px;">
        <p>Vui lòng <router-link to="/login">đăng nhập</router-link> để tiếp tục.</p>
      </div>

      <!-- 2. Nếu người dùng đã đăng nhập nhưng không phải Admin -->
      <div v-else-if="currentUserStore?.LoaiUser !== 'Admin'" class="alert alert-danger text-center" style="margin-top: 70px;">
        <p>Bạn không có quyền truy cập vào trang này. Trang này chỉ dành cho Admin.</p>
        <p><router-link to="/homepage">Quay về trang chủ</router-link></p>
      </div>

      <!-- 3. Nếu là Admin, hiển thị nội dung Dashboard -->
      <div v-else-if="currentUserStore?.LoaiUser === 'Admin'">
        <div class="admin-body d-flex" style="margin-top: 70px;">
          <aside class="sidebar-wrapper">
            <Sidebar />
          </aside>
          <main class="content-wrapper bg-light p-4" style="min-height: calc(100vh - 70px);">
            <router-view />
          </main>
        </div>
      </div>
    </template>

    <Footer shadow style="margin-top: 0 !important;"/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from "vue"; // Thêm computed
import { useRouter } from 'vue-router';
import Sidebar from "../components/Sidebar.vue";
import Navbar from "../components/NavBar.vue";
import Footer from "../components/Footer.vue";
import { useAuthStore } from '@/store/authStore';

const router = useRouter();
const authStore = useAuthStore();

// Computed properties từ store
const isLoadingStore = computed(() => authStore.getIsLoading); // Trạng thái loading chung của store
const isAuthenticatedStore = computed(() => authStore.isAuthenticated);
const currentUserStore = computed(() => authStore.currentUser);
const initialAuthCheckCompleted = computed(() => authStore.hasInitialAuthBeenChecked);


// State cục bộ cho component Dashboard
const isVerifyingAccess = ref(true); // Loading riêng của Dashboard khi nó tự check

onMounted(async () => {
  isVerifyingAccess.value = true;

  // Nếu initializeAuth của store chưa chạy (ví dụ: user vào thẳng trang /admin)
  // thì hãy đảm bảo nó được chạy.
  // Hoặc, bạn có thể luôn gọi initializeAuth từ main.js trước khi mount app.
  // Ở đây, chúng ta giả định nó có thể chưa chạy và component này cần trigger nó.
  if (!initialAuthCheckCompleted.value) {
    await authStore.initializeAuth(); // Đảm bảo store đã thử lấy user ban đầu
  }
  // Sau khi initializeAuth chạy (dù ở đây hay ở main.js), các computed ở trên sẽ cập nhật.
  isVerifyingAccess.value = false;
});

watchEffect(() => {
  // Chỉ thực hiện logic redirect/UI khi quá trình xác minh của component này đã xong
  // VÀ quá trình khởi tạo của store cũng đã hoàn tất (nếu bạn không muốn thấy FOUC)
  if (!isVerifyingAccess.value && initialAuthCheckCompleted.value) {
    if (!isAuthenticatedStore.value) {
      // User không đăng nhập, chuyển hướng về login
      // console.log("Dashboard WatchEffect: Not authenticated, redirecting to login.");
      // router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
    } else if (currentUserStore.value?.LoaiUser !== 'Admin') {
      // User đăng nhập nhưng không phải Admin, chuyển hướng về homepage
      // console.log("Dashboard WatchEffect: Authenticated but not Admin, redirecting to homepage.");
      // router.push({ name: 'Homepage' });
    }
    // Nếu đã đăng nhập và là Admin thì không làm gì cả, template sẽ hiển thị nội dung
  }
});
</script>

<style scoped>
.admin-body { width: 100%; }
.sidebar-wrapper { width: 250px; flex-shrink: 0; background: #F8F9FA; }
.content-wrapper { flex-grow: 1; }
</style>