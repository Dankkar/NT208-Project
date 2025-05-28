<!-- src/views/SignupPage.vue -->
<template>
  <!-- ... (template không đổi nhiều, chỉ cần emailError phản ánh đúng) ... -->
  <div class="signup-page">
      <router-link class="logo-wrapper" to="/homepage">
        <Logo :src="logoSrc" alt="UIT_Logo" hoverFilter="brightness(0.8)" width="50px" />
      </router-link>
    <div class="form-card">
      <h2 class="form-title">Create your account</h2>
      <div v-if="alertMessage" :class="['alert', alertType]" role="alert">
        {{ alertMessage }}
      </div>
      <div class="divider mb-4"><span class="line"></span><span class="line"></span></div>

      <form @submit.prevent="goToCompleteProfile">
        <div class="mb-4">
          <label for="email" class="form-label">Email</label>
          <input id="email" v-model="formData.email" type="email" class="underline-input"
                 :class="{ 'is-invalid': errors.email }" placeholder="Enter your email"
                 @input="debouncedValidateEmail" @blur="validateEmailOnBlur" required />
                 <!-- Sử dụng @blur hoặc debounce để gọi API -->
          <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
          <small v-if="isCheckingEmail" class="form-text text-muted">Checking email...</small>
        </div>
        <!-- ... (Password và Confirm Password input giữ nguyên) ... -->
        <div class="mb-4">
          <label for="password" class="form-label">Password</label>
          <input id="password" v-model="formData.password" type="password" class="underline-input"
                 :class="{ 'is-invalid': errors.password }" placeholder="Create a password (min 8 characters)" @input="validatePassword" required />
          <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
        </div>
        <div class="mb-5">
          <label for="confirm" class="form-label">Confirm Password</label>
          <input id="confirm" v-model="formData.confirmPassword" type="password" class="underline-input"
                 :class="{ 'is-invalid': errors.confirmPassword }" placeholder="Repeat your password" @input="validateConfirmPassword" required />
          <div v-if="errors.confirmPassword" class="invalid-feedback d-block">{{ errors.confirmPassword }}</div>
        </div>
        <button type="submit" class="btn-signup w-100 mb-3" :disabled="!isFormValid || isCheckingEmail || emailAlreadyExists">
          <!-- Vô hiệu hóa nút nếu đang check email hoặc email đã tồn tại -->
          Create account
        </button>
      </form>
      <p class="card-footer">
        Already have an account? <router-link to="/login" class="link-primary">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted } from 'vue'; // Thêm ref
import { useRouter } from 'vue-router';
import { useSignupStore } from '../store/signupStore';
import axios from 'axios'; // Cần axios để gọi API check-email
import Logo from '../components/Logo.vue';
import uit_logo from '../assets/Logo_UIT_blue.jpg';

const router = useRouter();
const signupStore = useSignupStore();

const formData = reactive({
  email: signupStore.email || '',
  password: '',
  confirmPassword: '',
});
const errors = reactive({ email: '', password: '', confirmPassword: '' });
const alertMessage = ref('');
const alertType = ref('');
const logoSrc = ref(uit_logo);

const isCheckingEmail = ref(false); // Cờ để biết đang gọi API check email
const emailAlreadyExists = ref(false); // Cờ để biết email đã tồn tại hay chưa

let debounceTimer = null;

async function checkEmailOnServerIfValidFormat() {
  // Chỉ gọi API nếu email có giá trị và không có lỗi định dạng
  if (!formData.email || errors.email) {
    // Nếu có lỗi định dạng (ví dụ 'Email is required' hoặc 'Invalid format')
    // thì không cần check server.
    // Reset trạng thái check nếu trước đó email hợp lệ rồi user sửa thành không hợp lệ.
    isCheckingEmail.value = false;
    // emailAlreadyExists.value có thể giữ nguyên hoặc reset tùy logic
    return;
  }

  isCheckingEmail.value = true;
  emailAlreadyExists.value = false; // Reset giả định là chưa tồn tại
  try {
    const response = await axios.post('http://localhost:5000/api/auth/check-email', { Email: formData.email });
    if (response.data.exists) {
      errors.email = 'This email address is already registered.';
      emailAlreadyExists.value = true;
    } else {
      // Email hợp lệ và không tồn tại, errors.email đã được xóa bởi validateEmailFormat()
      emailAlreadyExists.value = false;
    }
  } catch (error) {
    console.error('Error checking email:', error);
    errors.email = 'Could not verify email. Please try again later.';
    // Không set emailAlreadyExists.value = true ở đây, vì lỗi có thể là do mạng
  } finally {
    isCheckingEmail.value = false;
  }
}

// Hàm này chỉ kiểm tra định dạng
function validateEmailFormat() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  } else {
    errors.email = ''; // Định dạng đúng
  }
}

async function validateEmailOnBlur() {
  validateEmailFormat(); // Kiểm tra định dạng
  await checkEmailOnServerIfValidFormat(); // Rồi mới kiểm tra trên server nếu định dạng ổn
}

function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  errors.email = ''; // Reset lỗi trước khi validate lại
  emailAlreadyExists.value = false; // Reset cờ tồn tại
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  // Không gọi API check email ngay ở đây để tránh gọi quá nhiều khi đang gõ
  // Sẽ gọi khi blur hoặc debounce
}

function validatePassword() { /* ... giữ nguyên ... */
  if (!formData.password) errors.password = 'Password is required';
  else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else errors.password = '';
  if (formData.confirmPassword) validateConfirmPassword();
}
function validateConfirmPassword() { /* ... giữ nguyên ... */
  if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Passwords do not match';
  else errors.confirmPassword = '';
}

onMounted(() => {
    if (formData.email) {
        validateEmail(); // Validate định dạng ban đầu
        // Có thể cân nhắc checkEmailOnServer() nếu email từ store là hợp lệ
        // nhưng cần cẩn thận để không spam API khi người dùng F5 nhiều lần
    }
});


const isFormValid = computed(() => {
  return (
    formData.email && !errors.email && !emailAlreadyExists.value && !isCheckingEmail.value &&
    formData.password && !errors.password &&
    formData.confirmPassword && !errors.confirmPassword
  );
});

function showAlert(message, type = 'danger') { /* ... giữ nguyên ... */
  alertMessage.value = message;
  alertType.value = `alert-${type}`;
}

function goToCompleteProfile() {
  // Validate lại tất cả các trường trước khi đi tiếp
  validateEmailOnBlur(); // Gọi hàm có check server
  validatePassword();
  validateConfirmPassword();

  // Đợi một chút để API check email (nếu có) hoàn tất
  // (hoặc có thể dựa vào isCheckingEmail và emailAlreadyExists)
  // Một cách đơn giản hơn là dựa vào isFormValid đã bao gồm các cờ đó.
  if (!isFormValid.value || emailAlreadyExists.value || isCheckingEmail.value ) {
    if(emailAlreadyExists.value){
        showAlert('This email address is already registered. Please use a different email.', 'danger');
    } else if (isCheckingEmail.value){
        showAlert('Please wait, email verification is in progress.', 'info');
        signupStore.setCredentials(formData.email, formData.password);
        router.push('/complete-profile');
    }
    else {
        showAlert('Please correct the errors in the form.', 'danger');
    }
    return;
  }
}
</script>

<style scoped>  
/* full-screen bg */
.signup-page {
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('../assets/mountain.jpg') no-repeat center/cover;
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
}

/* white card */
.form-card {
  background: #fff;
  max-width: 420px;
  width: 100%;
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

/* title */
.form-title {
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  color: #111;
}

/* divider */
.divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
}
.divider .line {
  flex: 1;
  height: 1px;
  background: #ccc;
}
.divider small {
  padding: 0 0.75rem;
  color: #666;
  font-size: 0.9rem;
}

/* inputs underline */
.underline-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  background: transparent;
  padding: 0.5rem 0;
  font-size: 1rem;
}
.underline-input:focus {
  outline: none;
  border-bottom-color: #888;
}
.underline-input.is-invalid {
  border-bottom-color: #dc3545;
}

/* sign-up button */
.btn-signup {
  width: 100%;
  padding: 0.75rem 0;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.btn-signup:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-signup:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* footer link */
.card-footer {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
}
.card-footer a {
  color: #007bff;
  text-decoration: none;
}
.card-footer a:hover {
  text-decoration: underline;
}

/* Alert styles */
.alert {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
.alert-info {
  background-color: #cce5ff;
  border: 1px solid #b8daff;
  color: #004085;
}
.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}
.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.logo-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 700px;
  display: flex;
  align-items: center;
}
</style>