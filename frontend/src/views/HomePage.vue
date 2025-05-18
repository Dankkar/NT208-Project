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
    <!-- <section class="featured py-5">
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
    </section> -->
    <Feature/>

    <!-- Post -->
        <Post title="Title" text="This is some text"/>
    <!-- Footer -->
     <Footer/>
  </div>
</template>

<script setup>
import NavbarLogin from '../components/Navbar-login.vue'
import Post from '../components/Post.vue'
import Footer from '../components/Footer.vue'
import Feature from '../components/Feature.vue'

import { reactive, ref } from 'vue'
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
