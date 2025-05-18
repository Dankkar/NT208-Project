  <!-- src/views/HomePage.vue -->
<template>
  <div class="home-page">
    <!-- HEADER -->
    <header class="navbar navbar-expand-lg navbar-light bg-transparent position-absolute w-100 px-4">
      <button class="btn btn-link p-0 d-flex text-decoration-none align-items-center text-light">
        <i class="bi bi-list fs-2 me-2"></i>
        <span class="fw-bold">MENU</span>
      </button>
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
          <li class="nav-item"><a class="nav-link text-white" href="#">RATINGS</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle text-white" href="#" data-bs-toggle="dropdown">ROOM BOOKING</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#">By City</a></li>
              <li><a class="dropdown-item" href="#">By Date</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle text-white" href="#" data-bs-toggle="dropdown">MY ACCOUNT</a>
            <ul class="dropdown-menu">
              <li><router-link class="dropdown-item" to="/login">Sign In</router-link></li>
              <li><router-link class="dropdown-item" to="/signup">Sign Up</router-link></li>
            </ul>
          </li>
          <li class="nav-item"><router-link class="nav-link text-white" to="/reserve">RESERVE</router-link></li>
        </ul>
      </div>
    </header>

    <!-- HERO + SEARCH -->
    <section class="hero position-relative text-center text-white d-flex align-items-center">
      <div class="overlay"></div>
      <div class="container">
        <h1 class="display-4 fw-bold mb-4">Find Your Perfect Stay</h1>
        <form @submit.prevent="onSearch" class="row g-2 justify-content-center">
          <div class="col-md-3">
            <input v-model="search.location" type="text" class="form-control" placeholder="Location" />
          </div>
          <div class="col-md-2">
            <input v-model="search.checkIn" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <input v-model="search.checkOut" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <select v-model="search.guests" class="form-select">
              <option disabled value="">Guests</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n>1?'Guests':'Guest' }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button type="submit" class="btn btn-primary w-100">Search</button>
          </div>
        </form>
      </div>
    </section>

    <!-- FEATURED -->
    <section class="featured py-5">
      <div class="container">
        <h2 class="mb-4">Featured Properties</h2>
        <div class="row">
          <div class="col-md-4" v-for="hotel in featured" :key="hotel.id">
            <div class="card mb-4 shadow-sm">
              <img :src="hotel.image" class="card-img-top" :alt="hotel.name" />
              <div class="card-body">
                <h5 class="card-title">{{ hotel.name }}</h5>
                <p class="card-text text-muted">{{ hotel.location }}</p>
                <p class="fw-bold">{{ hotel.price }}/night</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import Hotel1 from '@/assets/mountain.jpg'
import Hotel2 from '@/assets/mountain.jpg'
import Hotel3 from '@/assets/mountain.jpg'

const search = reactive({
  location: '',
  checkIn: '',
  checkOut: '',
  guests: ''
})

function onSearch() {
  console.log('Searching with', { ...search })
  // TODO: chuyển đến trang kết quả search
}

const featured = ref([
  { id: 1, name: 'Grand Mountain Resort', location: 'Alps, Switzerland', price: '$250', image: Hotel1 },
  { id: 2, name: 'Beachside Hotel',       location: 'Maldives',          price: '$320', image: Hotel2 },
  { id: 3, name: 'City Lights Inn',       location: 'New York, USA',     price: '$180', image: Hotel3 }
])

// SLIDER state
const slides = [Hotel1, Hotel2, Hotel3]
const current = ref(0)

// chuyển slide tự động mỗi 5s
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    current.value = (current.value + 1) % slides.length
  }, 5000)
})
onUnmounted(() => clearInterval(timer))

// tính style cho hero
const heroStyle = computed(() => ({
  backgroundImage: `url(${slides[current.value]})`,
  backgroundSize:    'cover',
  backgroundPosition:'center',
  transition:        'background-image 0.8s ease-in-out'
}))

// prev/next handlers
function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
}
function next() {
  current.value = (current.value + 1) % slides.length
}
</script>

<style scoped>
.home-page { overflow-x: hidden; }

/* HERO */
.hero {
  height: 60vh;
  background: url('@/assets/mountain.jpg') no-repeat center/cover;
  position: relative;
}
.hero .overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
}
.hero .container {
  position: relative; z-index: 1;
}

/* Featured title */
.featured h2 {
  text-align: center;
  font-weight: 600;
}

/* Card images */
.card-img-top {
  height: 200px;
  object-fit: cover;
}

.home-page .navbar {
  position: absolute;
  z-index: 1000;
}
</style>
