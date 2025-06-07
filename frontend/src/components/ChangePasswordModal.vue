<!-- src/components/ChangePassword.vue -->
<template>
  <div class="modal-backdrop-custom" @click.self="closeModal">
    <div class="modal-dialog-custom">
      <div class="modal-content-custom">
        <div class="modal-header-custom">
          <h5 class="modal-title-custom">Đổi mật khẩu</h5>
          <button type="button" class="btn-close-custom" @click="closeModal" aria-label="Đóng">×</button>
        </div>
        <form @submit.prevent="submitChangePassword">
          <div class="modal-body-custom">
            <div class="form-group-custom mb-3">
              <label for="currentPassword" class="form-label-custom">Mật khẩu hiện tại <span class="text-danger">*</span></label>
              <input type="password" class="form-control-custom" id="currentPassword" v-model="passwords.currentPassword" required>
            </div>
            <div class="form-group-custom mb-3">
              <label for="newPassword" class="form-label-custom">Mật khẩu mới <span class="text-danger">*</span></label>
              <input type="password" class="form-control-custom" id="newPassword" v-model="passwords.newPassword" required minlength="8">
              <small v-if="passwords.newPassword && passwords.newPassword.length < 8" class="text-danger d-block mt-1">Mật khẩu mới phải có ít nhất 8 ký tự.</small>
            </div>
            <div class="form-group-custom mb-3">
              <label for="confirmNewPassword" class="form-label-custom">Xác nhận mật khẩu mới <span class="text-danger">*</span></label>
              <input type="password" class="form-control-custom" id="confirmNewPassword" v-model="passwords.confirmNewPassword" required>
              <small v-if="passwords.newPassword && passwords.confirmNewPassword && passwords.newPassword !== passwords.confirmNewPassword" class="text-danger d-block mt-1">
                Mật khẩu xác nhận không khớp.
              </small>
            </div>
            <div v-if="apiError" class="alert alert-danger mt-3 py-2">{{ apiError }}</div>
            <div v-if="successMessage" class="alert alert-success mt-3 py-2">{{ successMessage }}</div>
          </div>
          <div class="modal-footer-custom">
            <button type="button" class="btn-custom btn-cancel-custom" @click="closeModal" :disabled="isLoading">Hủy</button>
            <button type="submit" class="btn-custom btn-save-custom" :disabled="isLoading || !isFormValid">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              {{ isLoading ? 'Đang lưu...' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close', 'password-changed', 'error']);

const passwords = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

const isLoading = ref(false);
const apiError = ref('');
const successMessage = ref('');

const isFormValid = computed(() => {
  return passwords.currentPassword &&
         passwords.newPassword &&
         passwords.newPassword.length >= 8 &&
         passwords.confirmNewPassword &&
         passwords.newPassword === passwords.confirmNewPassword;
});

const closeModal = () => {
  Object.assign(passwords, { currentPassword: '', newPassword: '', confirmNewPassword: '' });
  apiError.value = '';
  successMessage.value = '';
  isLoading.value = false;
  emit('close');
};

async function submitChangePassword() {
  if (!isFormValid.value) {
    apiError.value = 'Vui lòng điền đầy đủ và chính xác các trường.';
    successMessage.value = '';
    return;
  }

  isLoading.value = true;
  apiError.value = '';
  successMessage.value = '';

  try {
    const response = await axios.put('http://localhost:5000/api/auth/change-password', {
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
      confirmNewPassword: passwords.confirmNewPassword,
    }, { withCredentials: true });

    if (response.data.success) {
      successMessage.value = response.data.message || 'Đổi mật khẩu thành công!';
      emit('password-changed', successMessage.value);
      setTimeout(() => {
        if (successMessage.value) closeModal();
      }, 2000);
    } else {
      apiError.value = response.data.message || 'Đổi mật khẩu thất bại.';
      emit('error', apiError.value);
    }
  } catch (err) {
    console.error("Lỗi khi đổi mật khẩu:", err);
    if (err.response && err.response.data) {
      if (err.response.data.errors) {
        apiError.value = err.response.data.errors.map(e => e.msg).join(' ');
      } else {
        apiError.value = err.response.data.message || 'Đã xảy ra lỗi khi đổi mật khẩu.';
      }
    } else {
      apiError.value = 'Không thể kết nối đến máy chủ.';
    }
    emit('error', apiError.value);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-dialog-custom {
  background-color: white;
  border-radius: 8px; /* Rounded corners */
  max-width: 500px;
  width: 90%;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
}

.modal-content-custom {
  border: none;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-title-custom {
  margin-bottom: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.btn-close-custom {
  background: transparent;
  border: 0;
  font-size: 1.5rem;
  padding: 0.5rem;
  line-height: 1;
  opacity: 0.7;
}
.btn-close-custom:hover {
  opacity: 1;
}

.modal-body-custom {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-group-custom .form-label-custom {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control-custom {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
.form-control-custom:focus {
  color: #495057;
  background-color: #fff;
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.modal-footer-custom {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  gap: 0.5rem; /* Space between buttons */
}

.btn-custom {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 0.25rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}
.btn-custom:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.btn-cancel-custom {
  background-color: #f8f9fa; /* Light gray */
  color: #212529; /* Dark text */
  border-color: #ced4da;
}
.btn-cancel-custom:hover:not(:disabled) {
  background-color: #e2e6ea;
  border-color: #dae0e5;
}

.btn-save-custom {
  background-color: #6c757d; /* Slightly darker gray or muted primary */
  color: white;
  border-color: #6c757d;
}
.btn-save-custom:hover:not(:disabled) {
  background-color: #5a6268;
  border-color: #545b62;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
}
.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}
.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}
.text-danger {
  color: #dc3545 !important;
}
.d-block { display: block !important; }
.mt-1 { margin-top: 0.25rem !important; }
.mb-3 { margin-bottom: 1rem !important; }
.me-1 { margin-right: 0.25rem !important; }
</style>