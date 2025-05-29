<template>
  <div>
<Navbar :bgFixed="true" style="position: fixed !important; top: 0; width: 100%; z-index: 100;" />
  <div v-if="authLoading" class="text-center py-5" style="margin-top: 70px;">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading authentication...</span>
    </div>
  </div>

  <!-- 2. Nếu người dùng chưa đăng nhập -->
  <div v-else-if="!isLoggedIn && authChecked" class="alert alert-warning text-center" style="margin-top: 70px;">
    <p>Vui lòng <router-link to="/login">đăng nhập</router-link> để tiếp tục.</p>
  </div>

  <!-- 3. Nếu người dùng đã đăng nhập nhưng không phải Admin -->
  <div v-else-if="isLoggedIn && currentUserRole !== 'Admin' && authChecked" class="alert alert-danger text-center" style="margin-top: 70px;">
    <p>Bạn không có quyền truy cập vào trang này. Trang này chỉ dành cho Admin.</p>
    <p><router-link to="/homepage">Quay về trang chủ</router-link></p>
  </div>

  <!-- 4. Nếu là Admin, hiển thị nội dung Dashboard (bao gồm cả việc load data của dashboard) -->
  <div v-else-if="isLoggedIn && currentUserRole === 'Admin' && authChecked">
    <!-- Loading cho dữ liệu của Dashboard (ví dụ reservations) -->
    <div v-if="dashboardDataLoading" class="text-center py-5" style="margin-top: 70px;">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading dashboard data...</span>
      </div>
    </div>
    <!-- Lỗi khi tải dữ liệu Dashboard -->
    <div v-else-if="dashboardError" class="alert alert-danger" style="margin-top: 70px;">
      {{ dashboardError }}
    </div>
    <!-- Nội dung Dashboard khi đã có quyền và có dữ liệu -->
    <div v-else class="admin-body d-flex" style="margin-top: 70px;">
      <aside class="sidebar-wrapper">
        <Sidebar />
      </aside>
      <main class="content-wrapper bg-light p-4" style="min-height: calc(100vh - 70px);">
        <h1 class="mb-4 fw-bold text-center">ADMIN DASHBOARD</h1>
        <router-view />
      </main>
    </div>
  </div>

  <!-- Fallback (nếu có trạng thái không ngờ tới, hoặc auth chưa check xong lần đầu) -->
  <div v-else-if="!authChecked" class="text-center py-5" style="margin-top: 70px;">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Verifying access...</span>
    </div>
  </div>

  <Footer shadow style="margin-top: 0 !important;"/>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect } from "vue";
import { useRouter } from 'vue-router';
import Sidebar from "../components/Sidebar.vue";
import Navbar from "../components/NavBar.vue";
import Footer from "../components/Footer.vue";
import axios from "axios";
import { useAuth } from '../utils/auth'; // Import useAuth

const router = useRouter(); // Khởi tạo router
const { isLoggedIn, currentUserRole, checkLogin } = useAuth(); // Lấy từ useAuth

// State cho việc kiểm tra xác thực ban đầu
const authLoading = ref(true); // Loading trạng thái xác thực
const authChecked = ref(false); // Đánh dấu đã kiểm tra xác thực lần đầu

// Thực hiện kiểm tra xác thực và vai trò khi component được mount
onMounted(async () => {
  authLoading.value = true;
  await checkLogin(); // Gọi checkLogin từ useAuth để đảm bảo state được cập nhật
  authLoading.value = false;
  authChecked.value = true; // Đánh dấu đã kiểm tra xong
});

// Theo dõi sự thay đổi của currentUserRole và isLoggedIn để xử lý nếu có thay đổi bất ngờ
// (ví dụ: token hết hạn ở tab khác, được checkLogin ở background cập nhật)
watchEffect(() => {
  if (authChecked.value) {
    if (!isLoggedIn.value) {
      // Có thể thêm redirect nếu chưa login và đang cố vào trang admin
      // router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
    } else if (isLoggedIn.value && currentUserRole.value !== 'Admin') {
      // Có thể thêm redirect nếu login nhưng không phải admin
      // router.push({ name: 'Homepage' });
    }
    // Logic trong watchEffect này chủ yếu để xử lý các thay đổi auth bất ngờ
    // và có thể không cần fetch data cụ thể của dashboard tại đây nữa
  }
});

</script>

<style scoped>
.admin-body { width: 100%; }
.sidebar-wrapper { width: 250px; flex-shrink: 0; background: #F8F9FA; }
.content-wrapper { flex-grow: 1; }
</style>