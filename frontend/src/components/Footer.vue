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
  <h4 class="fw-bold mb-1">CHILL CHILL</h4>
    <p class="mb-0">Khu phố 6, phường Linh Trung,TP.Thủ Đức, TP.Hồ Chí Minh</p>
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