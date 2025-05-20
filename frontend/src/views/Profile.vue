<template>
  <div class="account-page">
    <NavbarLogin bgFixed="true"  />
    <div class="py-5"></div>
    <section class="account-info-section container py-5">
      <h3 class="fw-bold mb-4">THÔNG TIN NGƯỜI DÙNG</h3>

      <!-- Loading Spinner -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <!-- User Info -->
      <div v-else-if="user">
        <!-- Personal Details -->
        <div class="info-card mb-4">
          <h5 class="fw-bold">Thông tin cá nhân</h5>
          <div class="d-flex align-items-center mb-3">
            <div class="avatar-icon me-3">
              <i class="bi bi-person-circle fs-1"></i>
            </div>
            <div>
              <p class="mb-1"><strong>Họ tên:</strong> {{ user.HoTen }}</p>
              <p class="mb-1"><strong>Giới tính:</strong> {{ user.GioiTinh }}</p>
              <p class="mb-1">
                <strong>Ngày sinh:</strong>
                {{ user.NgaySinh ? new Date(user.NgaySinh).toLocaleDateString() : '' }}
              </p>
            </div>
          </div>
          <Button
            content="Chỉnh sửa"
            textColor="#0d6efd"
            colorHover="#0a58ca"
            fontSize="14px"
            @click="handleEdit('personal')"
          />
        </div>

        <!-- Contact Details -->
        <div class="info-card mb-4">
          <h5 class="fw-bold">Liên hệ</h5>
          <p class="mb-1"><strong>Email:</strong> {{ user.Email }}</p>
          <p class="mb-1"><strong>SĐT:</strong> {{ user.SDT }}</p>
          <Button
            content="Chỉnh sửa"
            textColor="#0d6efd"
            colorHover="#0a58ca"
            fontSize="14px"
            @click="handleEdit('contact')"
          />
        </div>

        <!-- CCCD -->
        <div class="info-card mb-4">
          <h5 class="fw-bold">Thông tin định danh</h5>
          <p class="mb-1"><strong>CCCD:</strong> {{ user.CCCD }}</p>
          <Button
            content="Chỉnh sửa"
            textColor="#0d6efd"
            colorHover="#0a58ca"
            fontSize="14px"
            @click="handleEdit('cccd')"
          />
        </div>
      </div>
    </section>

    <Footer shadow />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import NavbarLogin from '@/components/Navbar-Login.vue'
import Footer from '@/components/Footer.vue'
import Button from '@/components/Button.vue'

const user = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5000/api/users/me', {
      withCredentials: true
    })
    user.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Không thể lấy thông tin người dùng'
  } finally {
    loading.value = false
  }
})

function handleEdit(section) {
  alert(`Bạn đang chỉnh sửa: ${section}`)
}
</script>

<style scoped>
.account-page {
  /* background-color: #f9ecec; */
  background-color: white;
  min-height: 100vh;
}

.account-info-section {
  padding-top: 120px;
}

.info-card {
  background: #fff;
  border-left: 5px solid #0d6efd;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.avatar-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
