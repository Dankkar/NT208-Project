<!-- src/views/HomePage.vue -->
<template>
  <div class="home-page">
    <NavbarLogin style="position: fixed !important;" />
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
        <div v-if="loading" class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        <div v-else>
          <FeaturedCarousel :items="featuredHotels">
            <template #default="{ item: hotel }">
              <HotelCard :hotel="hotel" />
            </template>
          </FeaturedCarousel>
        </div>
      </div>
    </section> 
    <Feature/>

    <!-- Post -->
    <Post 
      :contents="[
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Khách sạn tốt nhất cho bạn'
      ]"
      buttonText="Xem thêm"
      :imgSrc="imageUrl"
    title="Title" 
    />
    <!-- Footer -->
    <Footer/>
  </div>
</template>

<script setup>
import NavbarLogin from '../components/Navbar-login.vue'
import Post from '../components/Post.vue'
import Footer from '../components/Footer.vue'
import FeaturedCarousel from '../components/FeaturedCarousel.vue'
import HotelCard from '../components/HotelCard.vue'
import { reactive, ref, onMounted } from 'vue'
import hotelService from '../services/hotelService'
import imageUrl from '@/assets/mountain.jpg'

const search = reactive({
  location: '',
  checkIn: '',
  checkOut: '',
  guests: ''
})

const featuredHotels = ref([])
const loading = ref(true)
const error = ref(null)

function onSearch() {
  console.log('Searching with', { ...search })
  // TODO: chuyển đến trang kết quả search
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

async function loadFeaturedHotels() {
  try {
    loading.value = true
    const response = await hotelService.getFeaturedHotels()
    featuredHotels.value = response.data
  } catch (err) {
    error.value = 'Không thể tải danh sách khách sạn. Vui lòng thử lại sau.'
    console.error('Error loading featured hotels:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFeaturedHotels()
})
</script>

<style scoped>
.home-page { overflow-x: hidden; }

/* HERO */
.hero {
  height: 85vh;
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

.rating {
  font-size: 0.9rem;
}
</style>
