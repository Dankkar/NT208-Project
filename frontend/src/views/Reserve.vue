<template>
  <Layout title="ĐẶT PHÒNG KHÁCH SẠN">
    <div class="container mt-5">
     <vueCard 
     type="roomOffer"
    :imageUrl="mountainImage"
     >
     </vueCard>

      <vueCard 
     type="branchReview"
    :imageUrl="mountainImage"
     >
     </vueCard>

      <vueCard 
     type="bookingConfirmation"
    :imageUrl="mountainImage"
     >
     </vueCard>
    </div>
    </Layout>
</template>

<script setup>
    import { ref, onMounted } from 'vue'
    import Layout from '../components/Layout.vue';
    import vueCard from '../components/vueCard.vue';
    import mountainImage from '../assets/mountain.jpg';

</script>

<style>
</style>