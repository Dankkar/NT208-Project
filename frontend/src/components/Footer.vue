<template>
  <footer 
  :class="[
      'w-100',
      'py-4',
      'd-flex',
      'flex-column',
      'justify-content-center',
      'align-items-center',
      shadow ? 'shadow-sm' : '',
      white ? 'bg-white text-dark' : 'text-dark'
    ]"
    :style="{
      backgroundColor: white ? '#fff' : '#DDE3F6',
      marginTop: '50px',
      height: '150px'
    }"
  >
  <!-- <div class="d-flex flex-column justify-content-center align-items-center h-100 text-black">
    <h4 class="fw-bold mb-1">CHILL CHILL</h4>
    <p class="mb-0">Phường 6, Thủ Đức, Linh xuân, Hồ Chí Minh</p>
  </div> -->
  <h4 class="fw-bold mb-1">CHILL CHILL</h4>
    <p class="mb-0">Phường 6, Linh Trung, Thủ Đức, Hồ Chí Minh</p>
</footer>

</template>

<script setup>
const props = defineProps({
   white: { type: Boolean, default: false }, 
  shadow: { type: Boolean, default: false } 
})

</script>

<style scoped>

</style>