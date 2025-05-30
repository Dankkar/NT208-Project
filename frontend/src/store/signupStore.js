// src/stores/signupStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSignupStore = defineStore('signup', () => {
  // State để lưu thông tin từ trang Signup
  const email = ref('')
  const password = ref('') // Lưu ý: Không nên lưu password dạng clear text quá lâu,
                          // nhưng với luồng này, nó cần thiết để gửi khi hoàn tất.

  // State để lưu thông tin từ trang Complete Profile
  const profileDetails = ref({
    HoTen: '',
    SDT: '',
    CCCD: '',
    NgaySinh: '',
    GioiTinh: '',
  })

  // Actions
  function setCredentials(newEmail, newPassword) {
    email.value = newEmail
    password.value = newPassword
  }

  function setProfileDetails(details) {
    profileDetails.value = { ...profileDetails.value, ...details }
  }

  function getRegistrationData() {
    return {
      Email: email.value,
      MatKhau: password.value,
      HoTen: profileDetails.value.HoTen,
      SDT: profileDetails.value.SDT,
      CCCD: profileDetails.value.CCCD,
      NgaySinh: profileDetails.value.NgaySinh || null, // Đảm bảo gửi null nếu rỗng
      GioiTinh: profileDetails.value.GioiTinh || null, // Đảm bảo gửi null nếu rỗng
    }
  }

  function clearSignupData() {
    email.value = ''
    password.value = ''
    profileDetails.value = { HoTen: '', SDT: '', CCCD: '', NgaySinh: '', GioiTinh: '' }
  }

  return {
    email,
    password, // Chỉ export nếu thực sự cần truy cập trực tiếp (thường không cần)
    profileDetails,
    setCredentials,
    setProfileDetails,
    getRegistrationData,
    clearSignupData,
  }
})