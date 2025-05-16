<template>
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
</template>

<script setup>

</script>

<style scoped>

</style>