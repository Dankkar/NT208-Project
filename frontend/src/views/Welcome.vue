<!-- src/views/HomePage.vue -->
<template>
  <div class="home-page">
    <!-- HEADER -->
    <header class="page-header d-flex justify-content-between align-items-center px-4">
      <MenuButton></MenuButton>
      <div class="d-flex">
        <router-link to="/login" style="margin-right: 8%; ">
            <Button content="LOGIN" block bgHover="white" btnOutLine  ></Button>
        </router-link>
        <router-link to="/homepage" style="margin-right: 5%; ">
            <Button content="RESERVE" block bgHover="white" btnOutLine ></Button>
        </router-link>
      </div>
      
    </header>

    <!-- HERO -->
    <section class="hero-section d-flex align-items-center justify-content-center text-center text-white">
      <div class="hero-overlay"></div>
      <h1 class="display-4 fw-bold">WELCOME TO CHILLCHILL</h1>
    </section>

    <!-- CONTENT -->
    <section class="content-section py-5">
      <div class="container">
        <!-- Row 1: Text left, Image right -->
        <div class="row align-items-center mb-5">
          <div class="col-md-6">
            <div class="text-block p-4">
              <p class="mb-3">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Veritatis, at ratione natus, quo voluptatibus mollitia, delectus quasi dicta autem perferendis praesentium asperiores dignissimos exercitationem illo hic nam deserunt!
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Veritatis, at ratione natus, quo voluptatibus mollitia, delectus quasi dicta autem perferendis praesentium.
              </p>
              <a href="#" class="discover-link">DISCOVER MORE</a>
            </div>
          </div>
          <div class="col-md-6">
            <img src="@/assets/mountain.jpg" alt="Scenic" class="img-fluid rounded" />
          </div>
        </div>

        <!-- Row 2: Image left, Text right -->
        <div class="row align-items-center mb-5">
          <div class="col-md-6 order-md-2">
            <div class="text-block p-4">
              <p class="mb-3">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Veritatis, at ratione natus, quo voluptatibus mollitia, delectus quasi dicta autem perferendis praesentium asperiores dignissimos exercitationem illo hic nam deserunt!
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Veritatis, at ratione natus, quo voluptatibus mollitia, delectus quasi dicta autem perferendis praesentium.
              </p>
              <a href="#" class="discover-link">DISCOVER MORE</a>
            </div>
          </div>
          <div class="col-md-6 order-md-1">
            <img src="@/assets/mountain.jpg" alt="Scenic" class="img-fluid rounded" />
          </div>
        </div>

        <!-- Row 3: Two images -->
        <div class="row g-4">
          <div class="col-md-6">
            <img src="@/assets/mountain.jpg" alt="Scenic" class="img-fluid rounded" />
          </div>
          <div class="col-md-6">
            <img src="@/assets/mountain.jpg" alt="Scenic" class="img-fluid rounded" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// không cần logic đặc biệt cho demo
import Button from '../components/Button.vue';
import MenuButton from '../components/MenuButton.vue';
</script>

<style scoped>
.home-page {
  background: #fffbfa;
  position: relative;
  min-height: 100vh;
}

/* HEADER */
.page-header {
  position: absolute;
  top: 0; left: 0; right: 0;
  padding-top: 1rem;
  padding-bottom: 1rem;
  z-index: 10;
}

/* Hero */
.hero-section {
  height: 50vh;
  background: url('../assets/mountain.jpg') center/cover no-repeat;
  position: relative;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
}
.hero-section h1 {
  position: relative;
  z-index: 1;
  text-transform: uppercase;
}

/* Content */
.content-section {
  padding-top: 60px; /* để cách hero */
}

/* Text block */
.text-block {
  background: #e0e4f1;
  border-radius: 8px;
}
.text-block p {
  color: #333;
}
.discover-link {
  display: inline-block;
  margin-top: 1rem;
  font-weight: 500;
  text-decoration: none;
  color: #0033cc;
}
.discover-link:hover {
  text-decoration: underline;
}
</style>

<Footer/>
