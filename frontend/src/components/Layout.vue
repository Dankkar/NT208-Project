
<!-- Layout.vue -->

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
    <Toast ref="toastRef" />
    <Footer shadow />
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'; 
import Navbar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
import Toast from '@/components/NotificationToast.vue'; // Sửa đường dẫn nếu cần
import { useNotificationStore } from '@/store/notificationStore';


const toastRef = ref(null);
const notificationStore = useNotificationStore();
onMounted(() => {
  // Đăng ký component Toast với store khi nó được mount
  if (toastRef.value) {
    notificationStore.registerToastComponent(toastRef.value);
    console.log('Toast component has been registered with the store.'); // Thêm log để kiểm tra
  } else {
    console.error('Failed to get ref to Toast component.');
  }
});


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
