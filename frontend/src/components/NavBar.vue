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
      <!-- HOTEL Link -->
      <!-- <li class="nav-item">
        <router-link class="nav-link" to="/hotels">
          <Button 
          content="HOTEL" 
          :variant="navButtonVariant"
          />
        </router-link>
<<<<<<< HEAD
      </li>
=======
      </li> -->
>>>>>>> bd187c517e1ac53f46a63fcc4addb30e746ceda6
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
// Toàn bộ phần script của bạn được giữ nguyên
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from './Button.vue'
import MenuButton from './MenuButton.vue'
import Logo from './Logo.vue'
import logouitwhite from '../assets/Logo_UIT_white.jpg'
import logouitblue from '../assets/Logo_UIT_blue.jpg'
import { useAuthStore } from '../store/authStore'
import { useBookingStore } from '../store/bookingStore'

const route = useRoute();
const router = useRouter();
const navbarRef = ref(null);
const authStore = useAuthStore();
const bookingStore = useBookingStore();

const props = defineProps({
  bgFixed: { type: Boolean, default: false }
});

// Các state về scroll và visibility
const internalShowBg = ref(false);
const lastScrollPosition = ref(0);
const navbarVisible = ref(true);
const isAtTop = ref(true);
const scrollThreshold = 5;
const navbarHeight = ref(60);
const currentScrollPosition = ref(0);

// Behavior và classes của Navbar
const currentNavbarBehavior = computed(() => route.meta.navbarBehavior || 'default');

const navbarPositionClass = computed(() => {
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    return 'position-fixed top-0 start-0';
  }
  return 'position-absolute';
});

const actualShowBg = computed(() => {
  if (props.bgFixed) return true;
  if (currentNavbarBehavior.value === 'homepage') {
    return internalShowBg.value;
  }
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    return currentScrollPosition.value > 10 || !isAtTop.value;
  }
  return internalShowBg.value;
});

const navbarThemeClass = computed(() => {
  return actualShowBg.value ? 'bg-white shadow-sm navbar-light' : 'bg-transparent navbar-dark';
});

const shouldHideNavbar = computed(() => {
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    return !navbarVisible.value && !isAtTop.value;
  }
  return false;
});

// === LOGIC TỐI GIẢN CHO BUTTON ===
// Quyết định variant nào sẽ được dùng cho các nút điều hướng chung
const navButtonVariant = computed(() => {
  return actualShowBg.value ? 'nav-dark' : 'nav-light';
});

// Style cho các thành phần khác
const computedMenuButtonTextColor = computed(() => actualShowBg.value ? '#212529' : '#fff');
const logoSrc = computed(() => actualShowBg.value ? logouitblue : logouitwhite);

// Menu items cho mobile
const menuButtonNavigationItems = computed(() => {
  const baseItems = [
    { label: 'Home', path: '/homepage', icon: 'bi-house' },
    { label: 'Hotels', path: '/hotels', icon: 'bi-building' },
    { label: 'Reserve', path: '/bookingprocess', icon: 'bi-bookmark-plus' },
  ];
  if(authStore.isAuthenticated) {
    baseItems.push({ type: 'divider' });
    baseItems.push({ label: 'Profile', path: '/profile', icon: 'bi-person' });
    baseItems.push({ label: 'Booking History', path: '/BookingHistory', icon: 'bi-clock-history' });
    baseItems.push({ type: 'divider' });
    baseItems.push({ label: 'Logout', action: handleLogout, icon: 'bi-box-arrow-right' });
  } else {
    baseItems.push({ type: 'divider' });
    baseItems.push({ label: 'Login', path: '/login', icon: 'bi-box-arrow-in-right' });
  }
  return baseItems;
});


// Logic scroll
const handleScroll = () => {
  currentScrollPosition.value = window.pageYOffset || document.documentElement.scrollTop;

  if (currentNavbarBehavior.value === 'homepage') {
    const heroHeightPercentage = 0.2;
    const heroScrollThreshold = window.innerHeight * heroHeightPercentage;
    internalShowBg.value = currentScrollPosition.value > heroScrollThreshold;
  } else {
    internalShowBg.value = currentScrollPosition.value > 10;
  }

  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    isAtTop.value = currentScrollPosition.value < navbarHeight.value / 3;

    if (Math.abs(currentScrollPosition.value - lastScrollPosition.value) < scrollThreshold && !isAtTop.value) {
      return;
    }

    if (isAtTop.value || currentScrollPosition.value < scrollThreshold ) {
      navbarVisible.value = true;
    } else if (currentScrollPosition.value > lastScrollPosition.value && currentScrollPosition.value > navbarHeight.value) {
      navbarVisible.value = false;
    } else if (currentScrollPosition.value < lastScrollPosition.value) {
      navbarVisible.value = true;
    }
  } else {
    navbarVisible.value = true;
  }
  lastScrollPosition.value = currentScrollPosition.value <= 0 ? 0 : currentScrollPosition.value;
};

// Logout
async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}

// Lifecycle Hooks
onMounted(() => {
  if (navbarRef.value) {
    navbarHeight.value = navbarRef.value.offsetHeight;
  }
  authStore.initializeAuth();
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  watch(() => route.fullPath, () => {
      lastScrollPosition.value = 0;
      currentScrollPosition.value = 0;
      internalShowBg.value = false;
      isAtTop.value = true;
      if (currentNavbarBehavior.value !== 'stickyWithHideOnScroll') {
          navbarVisible.value = true;
      }
      handleScroll();
  }, { immediate: true });
});

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