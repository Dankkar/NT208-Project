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
    <!-- MenuButton - controls a mobile menu/offcanvas -->
    <div style="width: 7%; z-index: 10;"> <!-- z-index to keep it above centered logo -->
      <MenuButton
        :textColor="computedMenuButtonTextColor"
        :colorHover="computedMenuButtonColorHover"
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
     <ul class="navbar-nav">
      <!-- HOTEL Link -->
      <li class="nav-item">
        <router-link class="nav-link" to="/hotels">
          <Button
            content="HOTEL"
            :textColor="computedDesktopButtonTextColor"
            :colorHover="computedDesktopButtonColorHover"
            :bgColorOnHover="computedDesktopButtonBgColorHover"
          />
        </router-link>
      </li>
      <!-- LOGIN (if not authenticated) -->
      <li class="nav-item" v-if="!authStore.isAuthenticated">
        <router-link class="nav-link" to="/login">
          <Button
            content="LOGIN"
            :textColor="computedDesktopButtonTextColor"
            :colorHover="computedDesktopButtonColorHover"
            :bgColorOnHover="computedDesktopButtonBgColorHover"
          />
        </router-link>
      </li>
      <!-- MY ACCOUNT Dropdown (if authenticated) -->
      <li class="nav-item dropdown" v-if="authStore.isAuthenticated">
        <a class="nav-link dropdown-toggle" href="#" id="myAccountDesktopDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <Button
            content="MY ACCOUNT"
            isDropdown
            :textColor="computedDesktopButtonTextColor"
            :colorHover="computedDesktopButtonColorHover"
            :bgColorOnHover="computedDesktopButtonBgColorHover"
            :bgActiveColor="activeDropdownButtonBgColor"
            :textActiveColor="activeDropdownButtonTextColor"
          />
        </a>
        <ul class="dropdown-menu" aria-labelledby="myAccountDesktopDropdown">
          <li><router-link class="dropdown-item" to="/profile">Profile</router-link></li>
          <li><router-link class="dropdown-item" to="/BookingHistory">Booking History</router-link></li>
          <!-- <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">Logout</a></li> -->
        </ul>
      </li>
      <!-- RESERVE -->
      <li class="nav-item">
        <router-link class="nav-link" to="/bookingprocess" @click="bookingStore.refreshState">
          <Button
            content="RESERVE"
            :textColor="computedDesktopButtonTextColor"
            :colorHover="computedDesktopButtonColorHover"
            :bgColorOnHover="computedDesktopButtonBgColorHover"
            :isPrimary="true"
          />
        </router-link>
      </li>
    </ul>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router' // Import useRoute and useRouter
import Button from './Button.vue'       // Assuming Button.vue can handle new props
import MenuButton from './MenuButton.vue' // Assuming MenuButton.vue takes structured items
import Logo from './Logo.vue'
import logouitwhite from '../assets/Logo_UIT_white.jpg'
import logouitblue from '../assets/Logo_UIT_blue.jpg'
import { useAuthStore } from '../store/authStore' // Using Pinia Auth Store
import { useBookingStore } from '../store/bookingStore' // Using Pinia Booking Store

const route = useRoute();
const router = useRouter(); // For logout navigation
const navbarRef = ref(null);
const authStore = useAuthStore();
const bookingStore = useBookingStore(); // For booking-related actions

const props = defineProps({
  bgFixed: { type: Boolean, default: false } // Override for specific fixed background cases
});

// Scroll and visibility state
const internalShowBg = ref(false);
const lastScrollPosition = ref(0);
const navbarVisible = ref(true);
const isAtTop = ref(true);
const scrollThreshold = 5; // Min scroll distance to trigger hide/show
const navbarHeight = ref(60); // Initial estimate, updated on mount

// --- Navbar Behavior Configuration ---
const currentNavbarBehavior = computed(() => route.meta.navbarBehavior || 'default');

const navbarPositionClass = computed(() => {
  // 'stickyWithHideOnScroll' and 'simpleFixed' should be fixed to the top.
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    return 'position-fixed top-0 start-0';
  }
  // 'homepage' or 'default' behavior might be absolute or defined by parent.
  return 'position-absolute';
});

// Determines if navbar should have a solid background
const actualShowBg = computed(() => {
  if (props.bgFixed) return true; // bgFixed prop overrides other logic

  if (currentNavbarBehavior.value === 'homepage') {
    return internalShowBg.value; // Background appears after scrolling past hero section
  }
  // For fixed/sticky navbars, show background immediately or after a very small scroll
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll' || currentNavbarBehavior.value === 'simpleFixed') {
    return currentScrollPosition.value > 10 || !isAtTop.value;
  }
  return internalShowBg.value; // Default
});

const navbarThemeClass = computed(() => {
  return actualShowBg.value ? 'bg-white shadow-sm navbar-light' : 'bg-transparent navbar-dark';
});

// Determines if navbar should be hidden (slid up)
const shouldHideNavbar = computed(() => {
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    return !navbarVisible.value && !isAtTop.value;
  }
  return false; // Other behaviors don't hide this way
});

// --- Dynamic Styling for Buttons ---
// Desktop Nav Buttons
const computedDesktopButtonTextColor = computed(() => actualShowBg.value ? '#212529' : '#fff'); // Dark text on light_bg, White text on transparent_bg
const computedDesktopButtonColorHover = computed(() => actualShowBg.value ? '#0056b3' : 'black'); // Darker blue on light_bg, Lighter white/grey on transparent_bg (for text)
const computedDesktopButtonBgColorHover = computed(() => actualShowBg.value ? 'rgba(0, 123, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)'); // Subtle background tint on hover

// Active state for dropdown buttons (like "MY ACCOUNT" in the image when navbar is transparent)
const activeDropdownButtonBgColor = computed(() => actualShowBg.value ? 'rgba(0, 123, 255, 0.15)' : '#fff'); // Brighter blue tint on light_bg, Solid white on transparent_bg
const activeDropdownButtonTextColor = computed(() => actualShowBg.value ? '#0056b3' : '#212529');    // Darker blue on light_bg, Dark text on transparent_bg

// MenuButton (Hamburger)
const computedMenuButtonTextColor = computed(() => actualShowBg.value ? '#212529' : '#fff');
const computedMenuButtonColorHover = computed(() => actualShowBg.value ? '#0056b3' : 'rgba(255, 255, 255, 0.7)');

const logoSrc = computed(() => actualShowBg.value ? logouitblue : logouitwhite);

// --- Menu Items for MenuButton (Mobile Navigation) ---
const menuButtonNavigationItems = computed(() => {
  const baseItems = [
    { label: 'Home', path: '/homepage', icon: 'bi-house' },
    { label: 'Hotels', path: '/hotel', icon: 'bi-building' },
    { label: 'Reserve', path: '/bookingprocess', icon: 'bi-bookmark-plus' },
  ];
  return baseItems;
});

// --- Scroll Handling Logic ---
const currentScrollPosition = ref(0);

const handleScroll = () => {
  currentScrollPosition.value = window.pageYOffset || document.documentElement.scrollTop;

  // Logic for internalShowBg (controls background change, typically for 'homepage' behavior)
  if (currentNavbarBehavior.value === 'homepage') {
    const heroHeightPercentage = 0.2; // e.g., 20% of viewport height
    const heroScrollThreshold = window.innerHeight * heroHeightPercentage;
    internalShowBg.value = currentScrollPosition.value > heroScrollThreshold;
  } else {
     // For other modes, internalShowBg might not be the primary driver for actualShowBg.
     // However, setting it can be a fallback. For 'simpleFixed' it might always be true after a small scroll.
    internalShowBg.value = currentScrollPosition.value > 10;
  }

  // Logic for hiding/showing Navbar ('stickyWithHideOnScroll' behavior)
  if (currentNavbarBehavior.value === 'stickyWithHideOnScroll') {
    isAtTop.value = currentScrollPosition.value < navbarHeight.value / 3; // More sensitive check for "at top"

    // Debounce or avoid reacting to tiny scrolls if not at the very top
    if (Math.abs(currentScrollPosition.value - lastScrollPosition.value) < scrollThreshold && !isAtTop.value) {
      return;
    }

    if (isAtTop.value || currentScrollPosition.value < scrollThreshold ) { // Always show if at top or scrolled very little
      navbarVisible.value = true;
    } else if (currentScrollPosition.value > lastScrollPosition.value && currentScrollPosition.value > navbarHeight.value) {
      // Scrolling Down and past navbar height
      navbarVisible.value = false;
    } else if (currentScrollPosition.value < lastScrollPosition.value) {
      // Scrolling Up
      navbarVisible.value = true;
    }
  } else {
    // For other behaviors (e.g., 'homepage', 'simpleFixed', 'default'), navbar is always visible.
    navbarVisible.value = true;
  }

  lastScrollPosition.value = currentScrollPosition.value <= 0 ? 0 : currentScrollPosition.value;
};

// --- Logout ---
async function handleLogout() {
  await authStore.logout();
  router.push('/login'); // Or '/homepage'
}

// --- Lifecycle Hooks ---
onMounted(() => {
  if (navbarRef.value) {
    navbarHeight.value = navbarRef.value.offsetHeight;
  }
  authStore.initializeAuth(); // Make sure auth state is initialized if needed
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Call once to set initial state based on current scroll/route

  watch(() => route.fullPath, () => {
      lastScrollPosition.value = 0;
      currentScrollPosition.value = 0;
      internalShowBg.value = false; // Reset for new page context
      isAtTop.value = true;         // Assume at top for new page
      // window.scrollTo(0,0); // If you want to scroll to top on every route change
      // Ensure navbar visibility is reset correctly based on the new route's behavior
      if (currentNavbarBehavior.value !== 'stickyWithHideOnScroll') {
          navbarVisible.value = true;
      }
      handleScroll(); // Re-evaluate Navbar state for the new page
  }, { immediate: true }); // Immediate for initial route
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
header.navbar {
  transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.35s ease-in-out; /* Smoother transform */
  z-index: 1030;
}

.navbar-hidden {
  transform: translateY(-100%);
}

.nav-link, .navbar-toggler {
  transition: color 0.4s;
  padding: 0.5rem 0.75rem; /* Typical Bootstrap padding */
  height: auto; /* Allow natural height based on content */
}

/* Wrapper for Button inside nav-link to ensure flex alignment if Button itself isn't display:flex */
.nav-link > :deep(button), 
.nav-link > .btn-component-wrapper { /* If your Button has a wrapper */
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  border: none; /* Ensure buttons inside links don't look like form buttons */
  background: transparent;
  padding: 0;
}


.nav-link.dropdown-toggle::after {
  display: none !important; /* Assuming Button component handles dropdown caret */
}

.logo-wrapper {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  z-index: 1; /* Behind MenuButton if they overlap on very small screens */
}

/* Dropdown menu styling */
.dropdown-menu {
  margin-top: 0.125rem; /* Small gap from toggle */
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
  border: none;
}
.dropdown-item {
  padding: 0.5rem 1rem;
}
.dropdown-item:active { /* Bootstrap's default active color */
  background-color: #0d6efd;
  color: #fff;
}
</style>