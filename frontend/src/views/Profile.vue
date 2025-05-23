<!-- src/pages/Profile.vue -->
<template>
  <Layout title="THÔNG TIN NGƯỜI DÙNG">
  
    <section class="account-info-section container py-5 position-relative">
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
        <UserInfoCard
          title="Thông tin cá nhân"
          :onEdit="() => handleEdit('personal')"
          :highlight="highlight.personal"
        >
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
        <UserInfoCard
          title="Liên hệ"
          :onEdit="() => handleEdit('contact')"
          :highlight="highlight.contact"
        >
          <p class="mb-1"><strong>Email:</strong> {{ user.Email }}</p>
          <p class="mb-1"><strong>SĐT:</strong> {{ user.SDT }}</p>
        </UserInfoCard>

        <!-- CCCD Info -->
        <UserInfoCard
          title="Thông tin định danh"
          :onEdit="() => handleEdit('cccd')"
          :highlight="highlight.cccd"
        >
          <p class="mb-1"><strong>CCCD:</strong> {{ user.CCCD }}</p>
        </UserInfoCard>
      </div>
       <div style="height: 30px; width: 10%;" class="position-absolute end-0" >
              <Button
                content="LOG OUT"
                block
                textColor="white"
                @click="logoutHandler"
                borderRadius="0px"
                backgroundColor="black"
                textAlign="center"
                colorHover="white"
              />
            </div>
    </section>

    <EditUserModal
      v-if="showModal"
      :user="editedUser"
      :section="editSection"
      @close="handleModalClose"
      @save="handleModalSave"
    />
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Layout from '../components/Layout.vue'
import Button from '../components/Button.vue'
import EditUserModal from '@/components/EditUserModal.vue'
import UserInfoCard from '@/components/UserInfoCard.vue'

import  { useAuth } from '../utils/auth'
const { logout } = useAuth()

async function logoutHandler() {
  const result = await logout()
  if (result.success) {
    window.location.href = '/homepage'
  } else {
    console.error('Logout failed:', result)
  }

}

const user = ref(null)
const loading = ref(true)
const error = ref('')

const showModal = ref(false)
const editSection = ref('')
const editedUser = ref({})

const highlight = ref({
  personal: false,
  contact: false,
  cccd: false
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5000/api/users/me', {
      withCredentials: true
    })
    user.value = res.data
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Không thể lấy thông tin người dùng'
  } finally {
    loading.value = false
  }
})

function handleEdit(section) {
  editSection.value = section
  editedUser.value = { ...user.value }
  showModal.value = true
}

function handleModalClose() {
  showModal.value = false
}

function handleModalSave({ section, data }) {
  loading.value = true
  axios.put('http://localhost:5000/api/users/me', data, {
    withCredentials: true
  })
    .then(() => {
      user.value = { ...user.value, ...data }
      showModal.value = false

      highlight.value[section] = true
      setTimeout(() => {
        highlight.value[section] = false
      }, 2000)
    })
    .catch(err => {
      error.value = err.response?.data?.message || 'Cập nhật thông tin thất bại'
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<style scoped>
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
