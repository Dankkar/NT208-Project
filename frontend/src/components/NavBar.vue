<template>
  <header
    :class="[
      'navbar navbar-expand-lg w-100 px-4',
      navbarPositionClass,
      navbarThemeClass,
      { 'navbar-hidden': shouldHideNavbar }
    ]"
    ref="navbarRef"
  >
    <!-- MenuButton -->
    <div style="width: 7%; z-index: 10;">
      <MenuButton
        :textColor="computedMenuButtonTextColor"
        :items="menuButtonNavigationItems"
      />
    </div>

    <!-- Logo -->
    <router-link class="logo-wrapper" to="/homepage">
      <Logo
        :src="logoSrc"
        alt="UIT_Logo"
        hoverFilter="brightness(0.8)"
        width="50px"
      />
    </router-link>

    <!-- Desktop Navigation Items -->
    <div class="collapse navbar-collapse justify-content-end d-lg-flex d-none" id="mainNav">
     <ul class="navbar-nav align-items-center">
      <!-- LOGIN (if not authenticated) -->
      <li class="nav-item" v-if="!authStore.isAuthenticated">
        <router-link class="nav-link" to="/login">
          <Button content="LOGIN" 
          :variant="actualShowBg ? 'primary' : 'outline'"
          :iconMenu="false" 
          />
        </router-link>
      </li>
      <!-- MY ACCOUNT Dropdown (if authenticated) -->
      <li class="nav-item dropdown" v-if="authStore.isAuthenticated">
        <a class="nav-link dropdown-toggle" href="#" id="myAccountDesktopDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <Button
            content="MY ACCOUNT"
            :variant="navButtonVariant"
            icon="bi-caret-down-fill"
            :iconMenu="false"
          />
        </a>
        <ul class="dropdown-menu" aria-labelledby="myAccountDesktopDropdown">
          <li><router-link class="dropdown-item" to="/profile">Profile</router-link></li>
          <li><router-link class="dropdown-item" to="/BookingHistory">Booking History</router-link></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">Logout</a></li>
        </ul>
      </li>
      <!-- RESERVE - Nút đặc biệt -->
      <li class="nav-item ms-lg-2">
        <router-link class="nav-link" to="/bookingprocess" @click="bookingStore.refreshState">
          <Button
            content="RESERVE"
            :variant="actualShowBg ? 'primary' : 'outline'"
            :iconMenu="false"
          />
        </router-link>
      </li>
    </ul>
    </div>
  </header>
</template>

<script setup>
// Import các modules và components cần thiết
import { ref, computed, onMounted, onUnmounted, watch } from 'vue' // Vue 3 Composition API
import { useRoute, useRouter } from 'vue-router'  // Router để điều hướng
import Button from './Button.vue'          // Component nút bấm tùy chỉnh
import MenuButton from './MenuButton.vue'  // Component menu hamburger cho mobile
import Logo from './Logo.vue'              // Component logo
import logouitwhite from '../assets/Logo_UIT_white.jpg'  // Logo trắng
import logouitblue from '../assets/Logo_UIT_blue.jpg'    // Logo xanh
import { useAuthStore } from '../store/authStore'         // Store quản lý xác thực
import { useBookingStore } from '../store/bookingStore'   // Store quản lý đặt phòng

// Khởi tạo các composables
const route = useRoute();           // Thông tin route hiện tại
const router = useRouter();         // Router để điều hướng
const navbarRef = ref(null);        // Reference đến DOM element navbar
const authStore = useAuthStore();   // Store xác thực người dùng
const bookingStore = useBookingStore(); // Store quản lý booking

// Props từ component cha
const props = defineProps({
  bgFixed: { type: Boolean, default: false } // Có cố định background hay không
});

// Các state reactive để quản lý scroll và hiển thị navbar
const internalShowBg = ref(false);         // Có hiển thị background navbar không
const lastScrollPosition = ref(0);         // Vị trí scroll trước đó
const navbarVisible = ref(true);           // Navbar có visible không (cho hide on scroll)
const isAtTop = ref(true);                 // Có ở đầu trang không
const scrollThreshold = 5;                 // Ngưỡng scroll tối thiểu để trigger
const navbarHeight = ref(60);              // Chiều cao navbar
const currentScrollPosition = ref(0);      // Vị trí scroll hiện tại

// Computed properties để xác định behavior và style của navbar
// Lấy behavior của navbar từ route meta (homepage, sticky, fixed, etc.)
const currentNavbarBehavior = computed(() => route.meta.navbarBehavior || 'default');

// Xác định class position cho navbar (absolute, fixed)
const navbarPositionClass = computed(() => {
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    return 'position-fixed top-0 start-0';
  }
  return 'position-absolute';
});

// Xác định có hiển thị background hay không dựa trên props và behavior
const actualShowBg = computed(() => {
  if (props.bgFixed) return true; // Nếu prop bgFixed = true thì luôn hiển thị bg
  
  if (currentNavbarBehavior.value === 'homepage') {
    return internalShowBg.value; // Trang chủ: hiển thị bg khi scroll xuống
  }
  
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    return currentScrollPosition.value > 10 || !isAtTop.value; // Fixed: hiển thị bg khi scroll > 10px
  }
  
  return internalShowBg.value;
});

// Xác định theme class (light/dark) dựa trên background
const navbarThemeClass = computed(() => {
  return actualShowBg.value ? 'bg-white shadow-sm navbar-light' : 'bg-transparent navbar-dark';
});

// Xác định có ẩn navbar không (chỉ áp dụng cho stickyWithHideOnScroll)
const shouldHideNavbar = computed(() => {
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    return !navbarVisible.value && !isAtTop.value;
  }
  return false;
});

// Xác định variant cho các button navigation
const navButtonVariant = computed(() => {
  return actualShowBg.value ? 'nav-dark' : 'nav-light';
});

// Computed properties cho styling các thành phần
const computedMenuButtonTextColor = computed(() => actualShowBg.value ? '#212529' : '#fff');
const logoSrc = computed(() => actualShowBg.value ? logouitblue : logouitwhite);

// Tạo menu items cho mobile menu (MenuButton)
const menuButtonNavigationItems = computed(() => {
  const baseItems = [
    { label: 'Home', path: '/homepage', icon: 'bi-house' },
    { label: 'Hotels', path: '/hotels', icon: 'bi-building' },
    { label: 'Reserve', path: '/bookingprocess', icon: 'bi-bookmark-plus' },
  ];
  
  // Nếu đã đăng nhập: thêm Profile, Booking History, Logout
  if(authStore.isAuthenticated) {
    baseItems.push({ type: 'divider' });
    baseItems.push({ label: 'Profile', path: '/profile', icon: 'bi-person' });
    baseItems.push({ label: 'Booking History', path: '/BookingHistory', icon: 'bi-clock-history' });
    baseItems.push({ type: 'divider' });
    baseItems.push({ label: 'Logout', action: handleLogout, icon: 'bi-box-arrow-right' });
  } else {
    // Nếu chưa đăng nhập: thêm Login
    baseItems.push({ type: 'divider' });
    baseItems.push({ label: 'Login', path: '/login', icon: 'bi-box-arrow-in-right' });
  }
  return baseItems;
});

/**
 * Hàm xử lý scroll để điều khiển hiển thị navbar
 * - Thay đổi background khi scroll
 * - Ẩn/hiện navbar khi scroll (nếu có behavior tương ứng)
 */
const handleScroll = () => {
  // Lấy vị trí scroll hiện tại
  currentScrollPosition.value = window.pageYOffset || document.documentElement.scrollTop;

  // Logic hiển thị background dựa trên behavior
  if (currentNavbarBehavior.value === 'homepage') {
    // Trang chủ: hiển thị bg khi scroll qua 20% chiều cao viewport
    const heroHeightPercentage = 0.2;
    const heroScrollThreshold = window.innerHeight * heroHeightPercentage;
    internalShowBg.value = currentScrollPosition.value > heroScrollThreshold;
  } else {
    // Các trang khác: hiển thị bg khi scroll > 10px
    internalShowBg.value = currentScrollPosition.value > 10;
  }

  // Logic ẩn/hiện navbar cho stickyWithHideOnScroll
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    // Xác định có ở đầu trang không
    isAtTop.value = currentScrollPosition.value < navbarHeight.value / 3;

    // Kiểm tra threshold để tránh trigger quá nhiều
    if (Math.abs(currentScrollPosition.value - lastScrollPosition.value) < scrollThreshold && !isAtTop.value) {
      return;
    }

    // Logic hiển thị navbar
    if (isAtTop.value || currentScrollPosition.value < scrollThreshold) {
      navbarVisible.value = true; // Luôn hiển thị ở đầu trang
    } else if (currentScrollPosition.value > lastScrollPosition.value && currentScrollPosition.value > navbarHeight.value) {
      navbarVisible.value = false; // Ẩn khi scroll xuống
    } else if (currentScrollPosition.value < lastScrollPosition.value) {
      navbarVisible.value = true; // Hiển thị khi scroll lên
    }
  } else {
    navbarVisible.value = true; // Các behavior khác luôn hiển thị
  }
  
  // Lưu vị trí scroll để so sánh lần sau
  lastScrollPosition.value = currentScrollPosition.value <= 0 ? 0 : currentScrollPosition.value;
};

/**
 * Hàm xử lý đăng xuất
 * - Gọi action logout từ store
 * - Chuyển hướng về trang login
 */
async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}

// Lifecycle Hooks
onMounted(() => {
  // Lấy chiều cao navbar thực tế
  if (navbarRef.value) {
    navbarHeight.value = navbarRef.value.offsetHeight;
  }
  
  // Khởi tạo authentication store
  authStore.initializeAuth();
  
  // Thêm scroll listener với passive để tối ưu performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Gọi handleScroll lần đầu để set initial state
  handleScroll();

  // Watch route changes để reset navbar state
  watch(() => route.fullPath, () => {
      // Reset tất cả state khi chuyển trang
      lastScrollPosition.value = 0;
      currentScrollPosition.value = 0;
      internalShowBg.value = false;
      isAtTop.value = true;
      
      // Chỉ reset navbarVisible nếu không phải stickyWithHideOnScroll
      if (currentNavbarBehavior.value !== 'stickyWithHideOnScroll') {
          navbarVisible.value = true;
      }
      
      // Gọi lại handleScroll để cập nhật state
      handleScroll();
  }, { immediate: true });
});

// Cleanup scroll listener khi component unmount
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* Toàn bộ phần style của bạn được giữ nguyên */
header.navbar {
  transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.35s ease-in-out;
  z-index: 1030;
}

.navbar-hidden {
  transform: translateY(-100%);
}

.nav-link, .navbar-toggler {
  padding: 0.25rem;
}
.nav-link.dropdown-toggle::after {
  display: none !important;
}
.logo-wrapper {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}
.dropdown-menu {
  margin-top: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
  border: none;
}
</style>