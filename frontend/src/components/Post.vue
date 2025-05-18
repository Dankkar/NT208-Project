<template>
  <div class="container mt-5 mb-5">
    <div class="card">
      <div class="row g-0 justify-content-between">
        <!-- Image Column -->
        <div :class="['col-md-7 shadow-sm', turn ? 'order-md-2' : 'order-md-1']">
          <img src="../assets/mountain.jpg" class="img-fluid h-100 w-100 object-fit-cover" alt="Card Image">
        </div>
        <!-- Content Column --> 
        <div :class="['col-md-4 d-flex flex-column justify-content-between p-4', turn ? 'order-md-1 ms-2' : 'order-md-2 me-2']">
          <div :class="[turn ? 'text-start' : 'text-end']">
            <h5 class="card-title">{{ title }}</h5>
            <p class="card-text">
              {{ text }}
            </p>
          </div>
          <div :class="[turn ? 'text-start' : 'text-end']" >
            <a href="#" class="btn btn-primary mt-3">Discover More</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['title', 'text', 'turn'])
</script>

<style scoped>
.object-fit-cover {
  object-fit: cover;
  height: 100%;
}
</style>
