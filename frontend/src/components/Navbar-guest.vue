<template>
  <header
    :class="[
      'navbar navbar-expand-lg position-absolute w-100 px-4',
      showBg || bgFixed ? 'bg-white shadow-sm navbar-light' : 'bg-transparent navbar-dark'
    ]"
  >
    <div style="width: 7%;">
      <MenuButton 
        :textColor="showBg || bgFixed ? '#212529' : '#fff'"
        :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
        :items="isMobile ? fullItems : baseItems" 
      />
    </div>

    <button
      class="navbar-toggler border-0"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#mainNav"
    >
      <i :class="['bi', 'bi-list', 'fs-2', showBg || bgFixed ? 'text-dark' : 'text-white']"></i>
    </button>

    <div class="collapse navbar-collapse justify-content-end d-lg-flex d-none" id="mainNav">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link" href="#">
            <router-link to="/ratings" style="margin-right: 5%; ">
            <Button
              content="RATINGS"
              block
              :textColor="showBg || bgFixed ? '#212529' : '#fff'"
              :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
              btnLight
              btnLink
            />
            </router-link>
          </a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
            <Button
              content="ROOM BOOKING"
              isDropdown
              :textColor="showBg || bgFixed ? '#212529' : '#fff'"
              :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
              btnLight
              btnLink
            />
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">By City</a></li>
            <li><a class="dropdown-item" href="#">By Date</a></li>
          </ul>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/login">
            <Button
              content="SIGN IN"
              :textColor="showBg || bgFixed ? '#212529' : '#fff'"
              :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
              btnLight
              btnLink
            />
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/signup">
            <Button
              content="CREATE ACCOUNT"
              :textColor="showBg || bgFixed ? '#212529' : '#fff'"
              :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
              btnLight
              btnLink
            />
          </router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/reserve">
            <Button
              content="RESERVE"
              :textColor="showBg || bgFixed ? '#212529' : '#fff'"
              :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
              btnLight
              btnLink
            />
          </router-link>
        </li>
      </ul>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Button from './Button.vue'
import MenuButton from './MenuButton.vue'

const props = defineProps({
  bgFixed: { type: Boolean, default: false }
})

const showBg = ref(false)
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 992
}
const baseItems = [
  'Stay', 'Shop', 'Dine', 'See & Do'
]
const fullItems = [
  'Stay', 
  'Shop', 
  'Dine', 
  'See & Do',
  'Ratings',
  'Room Booking',
  'My Account',
  'Reserve'
]

const handleScroll = () => {
  const heroHeight = window.innerHeight * 0.2 // hoặc 0.6 nếu hero thấp hơn
  showBg.value = window.scrollY > heroHeight
  console.log('showBg.value', showBg.value)
}

onMounted(() => {
  checkMobile()
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
header.navbar {
  transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.7s;
}
.nav-link, .navbar-toggler {
  transition: color 0.4s;
}
/* Ẩn caret mặc định được Bootstrap tự thêm */
.nav-link.dropdown-toggle::after {
  display: none !important;
}
</style>