<template>
  <div class="template">
    <Navbar :bgFixed="true" style="position: fixed !important; z-index: 100;" />
    <div class="py-5"></div>
     <div  v-if="showTitle"  class="d-flex align-items-center" :style="{
      backgroundColor: bgColor,
      height: '80px'
      }">
      <h3 class="fw-bold mb-0 ms-5">{{ title }}</h3>
    </div>
    <slot></slot>
    <Footer shadow />
  </div>
</template>

<script setup>

import Navbar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'


const props = defineProps({
  bgFixed: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: 'Default Title'
  },
  bgColor: {
    type: String,
    default: '#F6E4E4'
  },
  showTitle: {
    type: Boolean,
    default: true
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
