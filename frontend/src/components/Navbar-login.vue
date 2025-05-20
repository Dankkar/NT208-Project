<template>
    <header class="navbar navbar-expand-lg navbar-light bg-transparent position-absolute w-100 px-4">
      <!-- <Button content="MENU" isMenu="true"></Button> -->
       <div style="width: 7%;"><MenuButton/></div>
      <button
        class="navbar-toggler border-0 text-white"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
      >
        <i class="bi bi-list fs-2"></i>
      </button>
      <div class="collapse navbar-collapse justify-content-end" id="mainNav">
        <ul class="navbar-nav">
          <li class="nav-item"><a class="nav-link text-white" href="#"><Button content="RATINGS" btnLight btnLink bgColor="#f0f0f0"></Button></a></li>
          <li class="nav-item dropdown"> 
            <a class="nav-link dropdown-toggle text-white" href="#" data-bs-toggle="dropdown"><Button content="ROOM BOOKING" isDropdown="true" btnLight btnLink bgColor="#f0f0f0"></Button></a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#">By City</a></li>
              <li><a class="dropdown-item" href="#">By Date</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle text-white" href="#" data-bs-toggle="dropdown"><Button content="MY ACCOUNT" isDropdown="true" btnLight btnLink bgColor="#f0f0f0"></Button></a>
            <ul class="dropdown-menu">
              <li><router-link class="dropdown-item" to="/profile">Profile</router-link></li>
              <li><router-link class="dropdown-item" to="/bookinghistory">Booking History</router-link></li>
            </ul>
          </li>
          <li class="nav-item"><router-link class="nav-link text-white" to="/reserve"><Button content="RESERVE" btnLight btnLink bgColor="#f0f0f0"></Button></router-link></li>
        </ul>
      </div>
    </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Button from './Button.vue'
import MenuButton from './MenuButton.vue'
const showBg = ref(false)
const props = defineProps({
  bgFixed: { type: Boolean, default: false }
})

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
<<<<<<< HEAD
.btn-hover-text:hover {
  color: black !important;
  }
  /* Ẩn caret mặc định được Bootstrap tự thêm */
=======
header.navbar {
  transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.7s;
}
.nav-link, .navbar-toggler {
  transition: color 0.4s;
}
/* Ẩn caret mặc định được Bootstrap tự thêm */
>>>>>>> 3e14644b0a3bbea3cfaf0a6b0709301848ee26b6
.nav-link.dropdown-toggle::after {
  display: none !important;
}
</style>