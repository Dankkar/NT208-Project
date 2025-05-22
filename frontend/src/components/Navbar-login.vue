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
      
   <router-link class="nav-link" to="/homepage">
      <Button
        content="HOME"
        :textColor="showBg || bgFixed ? '#212529' : '#fff'"
        :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
      />
    </router-link>
    
  <li class="nav-item">
    <a class="nav-link" href="#">
      <Button
        content="RATINGS"
        :textColor="showBg || bgFixed ? '#212529' : '#fff'"
        :colorHover="showBg || bgFixed? '#0d6efd' : 'black'"
      />
    </a>
  </li>
  
  <li class="nav-item dropdown">
    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
      <Button
        content="ROOM BOOKING"
        isDropdown
        :textColor="showBg || bgFixed ? '#212529' : '#fff'"
        :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
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
        :textColor="showBg || bgFixed ? '#212529' : '#fff'"
        :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
      />
    </router-link>
    </li>


  <li class="nav-item dropdown" v-if="isLoggedIn">
    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
      <Button
        content="MY ACCOUNT"
        isDropdown
        :textColor="showBg || bgFixed ? '#212529' : '#fff'"
        :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
      />
    </a>
    <ul class="dropdown-menu">
      <li><router-link class="dropdown-item" to="/profile">Profile</router-link></li>
      <li><router-link class="dropdown-item" to="/login">Booking History</router-link></li>
    </ul>
  </li>
  <li class="nav-item">
    <router-link class="nav-link" to="/reserve">
      <Button
        content="RESERVE"
        :textColor="showBg || bgFixed ? '#212529' : '#fff'"
        :colorHover="showBg || bgFixed ? '#0d6efd' : 'black'"
        block
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
import { useAuth } from '../utils/auth'


const {isLoggedIn, checkLogin} = useAuth()
const showBg = ref(false)
const props = defineProps({
  bgFixed: { type: Boolean, default: false }
})
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 992
}
const baseItems = [
  'Stay', 'Dine', 'See & Do'
]
const fullItems = [
  'Stay', 
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
  checkLogin()
  console.log(isLoggedIn.value)
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
  height: 50px
}

.nav-link > * {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

/* Ẩn caret mặc định được Bootstrap tự thêm */
.nav-link.dropdown-toggle::after {
  display: none !important;
}
</style>