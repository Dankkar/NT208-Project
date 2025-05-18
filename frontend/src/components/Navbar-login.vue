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
          <li class="nav-item"><a class="nav-link text-white" href="#"><Button content="RATINGS"></Button></a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle text-white" href="#" data-bs-toggle="dropdown"><Button content="ROOM BOOKING" isDropdown="true"></Button></a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#">By City</a></li>
              <li><a class="dropdown-item" href="#">By Date</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle text-white" href="#" data-bs-toggle="dropdown"><Button content="MY ACCOUNT" isDropdown="true"></Button></a>
            <ul class="dropdown-menu">
              <li><router-link class="dropdown-item" to="/login">Sign In</router-link></li>
              <li><router-link class="dropdown-item" to="/signup">Sign Up</router-link></li>
            </ul>
          </li>
          <li class="nav-item"><router-link class="nav-link text-white" to="/reserve"><Button content="RESERVE"></Button></router-link></li>
        </ul>
      </div>
    </header>
</template>

<script setup>
  import Button from './Button.vue';
  import MenuButton from './MenuButton.vue';
</script>
  
<style scoped>
  .btn-hover-text:hover {
    color: black !important;
  }
  /* Ẩn caret mặc định được Bootstrap tự thêm */
.nav-link.dropdown-toggle::after {
  display: none !important;
}

</style>