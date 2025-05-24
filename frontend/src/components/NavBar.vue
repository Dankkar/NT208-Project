<template>
  <header
    :class="[
      'navbar navbar-expand-lg w-100 px-4',
      navbarPositionClass, // Lớp vị trí động
      navbarThemeClass,    // Lớp theme (light/dark) và background động
      { 'navbar-hidden': shouldHideNavbar } // Lớp để ẩn/hiện động
    ]"
    ref="navbarRef"
  >
    <!-- Nội dung Navbar giữ nguyên: MenuButton, Logo, navbar-collapse -->
    <div style="width: 7%;">
      <MenuButton
        :textColor="computedTextColor"
        :colorHover="computedColorHover"
        :items="isMobile ? fullItems : baseItems"
      />
    </div>

    <router-link class="logo-wrapper" to="/homepage">
      <Logo
        :src="logoSrc"
        alt="UIT_Logo"
        hoverFilter="brightness(0.8)"
        width="50px"
      />
    </router-link>

    <div class="collapse navbar-collapse justify-content-end d-lg-flex d-none" id="mainNav">
     <ul class="navbar-nav">
      <router-link class="nav-link" to="/ratings">
        <Button
          content="RATINGS"
          :textColor="computedTextColor"
          :colorHover="computedColorHover"
        />
      </router-link>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
          <Button
            content="ROOM BOOKING"
            isDropdown
            :textColor="computedTextColor"
            :colorHover="computedColorHover"
          />
        </a>
        <ul class="dropdown-menu">
          <li><a class="dropdown-item" href="#">By City</a></li>
          <li><a class="dropdown-item" href="#">By Date</a></li>
        </ul>
      </li>
      <li class="nav-item" v-if="!isLoggedIn">
        <router-link class="nav-link" to="/login">
          <Button
            content="LOGIN"
            :textColor="computedTextColor"
            :colorHover="computedColorHover"
          />
        </router-link>
      </li>
      <li class="nav-item dropdown" v-if="isLoggedIn">
        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
          <Button
            content="MY ACCOUNT"
            isDropdown
            :textColor="computedTextColor"
            :colorHover="computedColorHover"
          />
        </a>
        <ul class="dropdown-menu">
          <li><router-link class="dropdown-item" to="/profile">Profile</router-link></li>
          <li><router-link class="dropdown-item" to="/bookinghistory">Booking History</router-link></li>
        </ul>
      </li>
      <li class="nav-item">
        <router-link class="nav-link" to="/bookingprocess">
          <Button
            content="RESERVE"
            :textColor="computedTextColor"
            :colorHover="computedColorHover"
            block
          />
        </router-link>
      </li>
    </ul>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router' // Import useRoute
import Button from './Button.vue'
import MenuButton from './MenuButton.vue'
import Logo from './Logo.vue'
import logouitwhite from '../assets/Logo_UIT_white.jpg'
import logouitblue from '../assets/Logo_UIT_blue.jpg'
import { useAuth } from '../utils/auth'

const route = useRoute(); // Sử dụng useRoute để truy cập thông tin route hiện tại
const navbarRef = ref(null);
const {isLoggedIn, checkLogin} = useAuth()

const props = defineProps({
  // bgFixed có thể không cần nữa nếu theme được quyết định bởi route.meta hoặc trạng thái cuộn
  // Hoặc bạn có thể giữ lại nếu muốn override cho một trường hợp cụ thể nào đó
  bgFixed: { type: Boolean, default: false }
})

// Các biến trạng thái cho scroll và visibility
const internalShowBg = ref(false); // Thay thế cho showBg trực tiếp, để có thể bị override
const lastScrollPosition = ref(0);
const navbarVisible = ref(true);
const isAtTop = ref(true);
const scrollThreshold = 5;
const navbarHeight = ref(60);

const isMobile = ref(false);
const baseItems = [ 'Stay', 'Dine', 'See & Do' ];
const fullItems = [ 'Stay', 'Dine', 'See & Do', 'Ratings', 'Room Booking', 'My Account', 'Reserve' ];

// Xác định hành vi Navbar dựa trên route.meta
const currentNavbarBehavior = computed(() => route.meta.navbarBehavior || 'default'); // 'default' nếu không có meta

// Tính toán các class động
const navbarPositionClass = computed(() => {
  if (currentNavbarBehavior.value === 'homepage') {
    return 'position-absolute';
  }
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    return 'position-fixed top-0 start-0'; // Luôn cố định ở trên cho các behavior này
  }
  return 'position-absolute'; // Default
});

const actualShowBg = computed(() => {
  if (props.bgFixed) return true; // props.bgFixed luôn override
  if (currentNavbarBehavior.value === 'homepage') {
    return internalShowBg.value; // Dùng internalShowBg cho homepage
  }
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    // Cho navbar fixed/sticky, có thể muốn nó luôn có bg sau khi cuộn 1 chút, hoặc ngay lập tức
    return currentScrollPosition.value > 10 || lastScrollPosition.value > 10 ; // Ví dụ: luôn có bg sau khi cuộn qua 10px
  }
  return internalShowBg.value; // Default
});


const navbarThemeClass = computed(() => {
  return actualShowBg.value ? 'bg-white shadow-sm navbar-light' : 'bg-transparent navbar-dark';
});

const computedTextColor = computed(() => actualShowBg.value ? '#212529' : '#fff');
const computedColorHover = computed(() => actualShowBg.value ? '#0d6efd' : 'black');

const logoSrc = computed(() => actualShowBg.value ? logouitblue : logouitwhite);


const shouldHideNavbar = computed(() => {
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    return !navbarVisible.value && !isAtTop.value;
  }
  return false; // Homepage và các behavior khác không ẩn kiểu này
});

const currentScrollPosition = ref(0); // Lưu trữ vị trí cuộn hiện tại

const handleScroll = () => {
  currentScrollPosition.value = window.pageYOffset || document.documentElement.scrollTop;

  // Logic cho internalShowBg (thay đổi background cho homepage)
  if (currentNavbarBehavior.value === 'homepage') {
    const heroHeightPercentage = 0.2;
    const heroScrollThreshold = window.innerHeight * heroHeightPercentage;
    internalShowBg.value = currentScrollPosition.value > heroScrollThreshold;
  }
  // Với các behavior khác, actualShowBg sẽ tự tính toán

  // Logic cho ẩn/hiện Navbar (chỉ cho 'stickyWithHideOnScroll')
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    isAtTop.value = currentScrollPosition.value < navbarHeight.value / 2;

    if (Math.abs(currentScrollPosition.value - lastScrollPosition.value) < scrollThreshold && !isAtTop.value) {
      return;
    }

    if (currentScrollPosition.value < scrollThreshold) {
      navbarVisible.value = true;
    } else if (currentScrollPosition.value > lastScrollPosition.value && currentScrollPosition.value > navbarHeight.value) {
      navbarVisible.value = false;
    } else if (currentScrollPosition.value < lastScrollPosition.value) {
      navbarVisible.value = true;
    }
  } else {
    // Với các behavior khác (ví dụ: homepage), navbar luôn hiển thị
    navbarVisible.value = true;
  }

  lastScrollPosition.value = currentScrollPosition.value <= 0 ? 0 : currentScrollPosition.value;
};


const checkMobile = () => { isMobile.value = window.innerWidth < 992; };

onMounted(() => {
  if (navbarRef.value) { navbarHeight.value = navbarRef.value.offsetHeight; }
  checkLogin();
  checkMobile();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', checkMobile);
  handleScroll(); // Gọi lần đầu để set trạng thái ban đầu

  // Đặt lại trạng thái cuộn khi route thay đổi, đặc biệt nếu là Single Page Application (SPA)
  // và người dùng điều hướng giữa các trang mà không tải lại toàn bộ.
  watch(() => route.path, () => {
      lastScrollPosition.value = 0;
      currentScrollPosition.value = 0; // Đặt lại vị trí cuộn cho logic handleScroll mới
      // scrollTopIfNeeded(); // Hàm này cuộn lên đầu trang mới nếu cần
      handleScroll(); // Re-evaluate Navbar state for the new page
  });

});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', checkMobile);
});

// Hàm ví dụ để cuộn lên đầu trang khi route thay đổi (tùy chọn)
// const scrollTopIfNeeded = () => {
//   if (window.scrollY > 0) {
//     window.scrollTo({ top: 0, behavior: 'smooth' }); // hoặc 'auto'
//   }
// };
</script>

<style scoped>
header.navbar {
  transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s ease-in-out;
  z-index: 1030; /* Quan trọng cho position-fixed */
}

.navbar-hidden {
  transform: translateY(-100%);
}

.navbar.position-fixed {
  /* Đã có top-0 start-0 từ class bootstrap */
}

.nav-link, .navbar-toggler {
  transition: color 0.4s;
  height: 50px;
}

.nav-link > * {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.nav-link.dropdown-toggle::after {
  display: none !important;
}

.logo-wrapper {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  z-index: 1;
}
</style>