<template>
  <div class="account-page">
    <NavbarLogin bgFixed="true" />
    <div class="py-5"></div>

    <section class="account-info-section container py-5">
      <h3 class="fw-bold mb-4">THÔNG TIN NGƯỜI DÙNG</h3>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-else-if="user">
        <!-- Personal Info -->
        <UserInfoCard title="Thông tin cá nhân" :onEdit="() => handleEdit('personal')">
          <div class="d-flex align-items-center mb-3">
            <div class="avatar-icon me-3">
              <i class="bi bi-person-circle fs-1"></i>
            </div>
            <div>
              <p class="mb-1"><strong>Họ tên:</strong> {{ user.HoTen }}</p>
              <p class="mb-1"><strong>Giới tính:</strong> {{ user.GioiTinh }}</p>
              <p class="mb-1"><strong>Ngày sinh:</strong> {{ user.NgaySinh ? new Date(user.NgaySinh).toLocaleDateString() : '' }}</p>
            </div>
          </div>
        </UserInfoCard>

        <!-- Contact Info -->
        <UserInfoCard title="Liên hệ" :onEdit="() => handleEdit('contact')">
          <p class="mb-1"><strong>Email:</strong> {{ user.Email }}</p>
          <p class="mb-1"><strong>SĐT:</strong> {{ user.SDT }}</p>
        </UserInfoCard>

        <!-- CCCD Info -->
        <UserInfoCard title="Thông tin định danh" :onEdit="() => handleEdit('cccd')">
          <p class="mb-1"><strong>CCCD:</strong> {{ user.CCCD }}</p>
        </UserInfoCard>
      </div>
    </section>
      <EditUserModal
    v-if="showModal"
    :user="editedUser"
    :section="editSection"
    @close="handleModalClose"
    @save="handleModalSave"
  />


    <Footer shadow />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import NavbarLogin from '@/components/Navbar-Login.vue'
import Footer from '@/components/Footer.vue'
import EditUserModal from '@/components/EditUserModal.vue'
import Button from '@/components/Button.vue'
import UserInfoCard from '@/components/UserInfoCard.vue'

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

const showModal = ref(false)
const editSection = ref('')
const editedUser = ref({})

function handleEdit(section) {
  editSection.value = section
  editedUser.value = { ...user.value }
  showModal.value = true
}

function handleModalClose() {
  showModal.value = false
}

function handleModalSave({ section, data }) {
  user.value = { ...user.value, ...data }
  showModal.value = false
  // Bạn có thể gọi API PUT ở đây để cập nhật lên server
  // await axios.put('/api/users/update', data)
}
</script>

<style scoped>
.account-page {
  background-color: white;
  min-height: 100vh;
}

.account-info-section {
  padding-top: 120px;
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
