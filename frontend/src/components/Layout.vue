<template>
  <div class="template">
    <NavbarLogin bgFixed="true" />
    <div class="py-5"></div>
     <div class="d-flex align-items-center" style="background-color: #F6E4E4; height: 80px;">
      <h3 class="fw-bold mb-0 ms-5">{{ title }}</h3>
    </div>
    <slot></slot>
    <Footer shadow />
  </div>
</template>

<script setup>
import NavbarLogin from '@/components/Navbar-Login.vue'
import Footer from '@/components/Footer.vue'


const props = defineProps({
  bgFixed: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: 'Default Title'
  }
})


</script>

<style scoped>
.template {
  background-color: white;
  min-height: 100vh;
}

h3 {
  font-size: 24px;
  color: #333;
}
</style>
