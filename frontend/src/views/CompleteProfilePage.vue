<!-- src/views/CompleteProfilePage.vue -->
<template>
  <div class="complete-profile-page signup-page">

    <div class="form-card cp-form-card">
      <h2 class="form-title cp-form-title">Complete Your Profile</h2>
      <p class="form-subtitle cp-form-subtitle">
        Please provide some additional information to complete your account setup.
      </p>

      <div v-if="alertMessage" :class="['alert', alertType]" role="alert">
        {{ alertMessage }}
      </div>
      <div class="divider mb-3"></div>

      <form @submit.prevent="() => handleRegistration(false)">
        <!-- Họ Tên -->
        <div class="mb-3 cp-input-group">
          <label for="hoTen" class="form-label">Full Name <span class="text-danger">*</span></label>
          <input id="hoTen" v-model="profileData.HoTen" type="text" class="form-control cp-input"
                 :class="{ 'is-invalid': formErrors.HoTen }" placeholder="Enter your full name"
                 @input="() => validateField('HoTen')" />
          <div v-if="formErrors.HoTen" class="invalid-feedback d-block">{{ formErrors.HoTen }}</div>
        </div>
        <!-- Số Điện Thoại -->
        <div class="mb-3 cp-input-group">
          <label for="sdt" class="form-label">Phone Number <span class="text-danger">*</span></label>
          <input id="sdt" v-model="profileData.SDT" type="tel" class="form-control cp-input"
                 :class="{ 'is-invalid': formErrors.SDT }" placeholder="Enter your phone number"
                 @input="() => validateField('SDT')" />
          <div v-if="formErrors.SDT" class="invalid-feedback d-block">{{ formErrors.SDT }}</div>
        </div>
        <!-- CCCD -->
        <div class="mb-3 cp-input-group">
          <label for="cccd" class="form-label">National ID (CCCD) <span class="text-danger">*</span></label>
          <input id="cccd" v-model="profileData.CCCD" type="text" class="form-control cp-input"
                 :class="{ 'is-invalid': formErrors.CCCD }" placeholder="Enter your National ID"
                 @input="() => validateField('CCCD')" />
          <div v-if="formErrors.CCCD" class="invalid-feedback d-block">{{ formErrors.CCCD }}</div>
        </div>
        <!-- Ngày Sinh (Tùy chọn) -->
        <div class="mb-3 cp-input-group">
          <label for="ngaySinh" class="form-label">Date of Birth (Optional)</label>
          <input id="ngaySinh" v-model="profileData.NgaySinh" type="date" class="form-control cp-input"
                 :class="{ 'is-invalid': formErrors.NgaySinh }" @input="() => validateField('NgaySinh')" />
           <div v-if="formErrors.NgaySinh" class="invalid-feedback d-block">{{ formErrors.NgaySinh }}</div>
        </div>
        <!-- Giới Tính (Tùy chọn) -->
        <div class="mb-4 cp-input-group">
          <label for="gioiTinh" class="form-label">Gender (Optional)</label>
          <select id="gioiTinh" v-model="profileData.GioiTinh" class="form-select cp-input"
                  :class="{ 'is-invalid': formErrors.GioiTinh }" @change="() => validateField('GioiTinh')">
            <option value="">Select Gender</option>
            <option value="Nam">Nam (Male)</option>
            <option value="Nữ">Nữ (Female)</option>
          </select>
           <div v-if="formErrors.GioiTinh" class="invalid-feedback d-block">{{ formErrors.GioiTinh }}</div>
        </div>

        <button type="submit" class="btn btn-primary w-100 cp-btn mb-2" :disabled="isLoading || !isProfileFormValidAndNotEmpty">
          <span v-if="isLoading && !isSkipping" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ (isLoading && !isSkipping) ? 'Registering...' : 'Complete Profile & Continue' }}
        </button>
      </form>

      <button type="button" class="btn btn-secondary w-100 cp-btn" @click="() => handleRegistration(true)" :disabled="isLoading">
        <span v-if="isLoading && isSkipping" class="spinner-border spinner-border-sm me-2" role="status"></span>
        {{ (isLoading && isSkipping) ? 'Processing...' : 'Skip for now & Continue' }}
      </button>

      <p class="card-footer mt-3">
        <router-link to="/signup" class="link-primary">
          ← Back to Sign Up
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
// import axios from 'axios'; // Remove: No longer making direct axios calls for auth here
import { useRouter } from 'vue-router';
import { useSignupStore } from '../store/signupStore';
import { useAuthStore } from '../store/authStore'; // Import the auth store

const router = useRouter();
const signupStore = useSignupStore();
const authStore = useAuthStore(); // Instantiate the auth store

// Remove useAuth if it was only for login/checkLogin here
// import { useAuth } from '../utils/auth';
// const { login, checkLogin } = useAuth(); // Remove

const profileData = reactive({
  HoTen: signupStore.profileDetails.HoTen || '',
  SDT: signupStore.profileDetails.SDT || '',
  CCCD: signupStore.profileDetails.CCCD || '',
  NgaySinh: signupStore.profileDetails.NgaySinh || '',
  GioiTinh: signupStore.profileDetails.GioiTinh || '',
});

const formErrors = reactive({ HoTen: '', SDT: '', CCCD: '', NgaySinh: '', GioiTinh: '' });
const isLoading = ref(false);
const isSkipping = ref(false);
const alertMessage = ref('');
const alertType = ref('');

// VALIDATION LOGIC (remains the same)
function validateField(fieldName, isSkippingCheck = false) {
  formErrors[fieldName] = '';
  if (isSkippingCheck && (fieldName === 'HoTen' || fieldName === 'SDT' || fieldName === 'CCCD')) {
    return;
  }
  if (fieldName === 'HoTen' && !profileData.HoTen?.trim()) formErrors.HoTen = 'Full name is required.';
  if (fieldName === 'SDT') {
    const sdtRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b$/;
    if (!profileData.SDT?.trim()) formErrors.SDT = 'Phone number is required.';
    else if (!sdtRegex.test(profileData.SDT.trim())) formErrors.SDT = 'Invalid Vietnamese phone number.';
  }
  if (fieldName === 'CCCD') {
    const cccdRegex = /^[0-9]{12}$/;
    if (!profileData.CCCD?.trim()) formErrors.CCCD = 'National ID (CCCD) is required.';
    else if (!cccdRegex.test(profileData.CCCD.trim())) formErrors.CCCD = 'National ID must be 12 digits.';
  }
  if (fieldName === 'NgaySinh' && profileData.NgaySinh && new Date(profileData.NgaySinh) >= new Date()) {
    formErrors.NgaySinh = 'Date of birth cannot be today or in the future.';
  }
}

const isProfileFormValidAndNotEmpty = computed(() => {
  return !formErrors.HoTen && !formErrors.SDT && !formErrors.CCCD && !formErrors.NgaySinh && !formErrors.GioiTinh &&
         profileData.HoTen?.trim() && profileData.SDT?.trim() && profileData.CCCD?.trim();
});

onMounted(() => {
  if (!signupStore.email || !signupStore.password) {
    showAlert('Signup data missing. Please start from the first step.', 'warning');
    setTimeout(() => router.replace('/signup'), 2000); // Give user time to read
    return;
  }
  profileData.HoTen = signupStore.profileDetails.HoTen || '';
  profileData.SDT = signupStore.profileDetails.SDT || '';
  profileData.CCCD = signupStore.profileDetails.CCCD || '';
  profileData.NgaySinh = signupStore.profileDetails.NgaySinh || '';
  profileData.GioiTinh = signupStore.profileDetails.GioiTinh || '';
  ['HoTen', 'SDT', 'CCCD', 'NgaySinh', 'GioiTinh'].forEach(field => {
    if (profileData[field]) validateField(field);
  });
});

function showAlert(message, type = 'danger') {
  alertMessage.value = message;
  alertType.value = `alert-${type}`;
}

async function handleRegistration(skippedProfile = false) {
  isSkipping.value = skippedProfile;
  isLoading.value = true;
  alertMessage.value = '';
  authStore.clearError(); // Clear any previous auth errors from the store

  if (!skippedProfile) {
    ['HoTen', 'SDT', 'CCCD'].forEach(field => validateField(field));
    if (profileData.NgaySinh) validateField('NgaySinh');
    if (profileData.GioiTinh) validateField('GioiTinh');
    if (!isProfileFormValidAndNotEmpty.value) {
      showAlert('Please fill in all required fields correctly.', 'danger');
      isLoading.value = false;
      isSkipping.value = false;
      return;
    }
  }

  signupStore.setProfileDetails({
    HoTen: profileData.HoTen.trim(),
    SDT: profileData.SDT.trim(),
    CCCD: profileData.CCCD.trim(),
    NgaySinh: profileData.NgaySinh || null,
    GioiTinh: profileData.GioiTinh || null,
  });

  const finalPayload = signupStore.getRegistrationData();
  if (skippedProfile) {
    finalPayload.HoTen = null;
    finalPayload.SDT = null;
    finalPayload.CCCD = null;
    // NgaySinh and GioiTinh are already set to null if empty by signupStore.setProfileDetails
    // or will be passed as their values if provided.
  }

  try {
    // Use the signup action from authStore
    const signupResult = await authStore.signup(finalPayload);

    if (signupResult.success) {
      // Signup in store was successful, user should be logged in
      // (authStore.signup calls fetchCurrentUser)
      showAlert(
        skippedProfile
          ? 'Account base created. You can complete your profile later. Redirecting...'
          : 'Account created and profile completed! Redirecting...',
        'success'
      );
      
      signupStore.clearSignupData(); // Clear sensitive data from signupStore
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for user to read message
      router.push('/homepage'); // Navigate to homepage or dashboard

    } else {
      // Signup failed, authStore.authError should be set, and message is in signupResult
      showAlert(signupResult.message || 'Registration failed. Please try again.', 'danger');
    }

  } catch (err) {
    // This catch block is for unexpected errors if authStore.signup itself throws
    // an error not caught by its own try/catch (unlikely for Promise rejections).
    // The authStore.signup action should return {success: false, message: ...} for API errors.
    console.error('Unexpected error during registration process in component:', err);
    showAlert( 'An unexpected error occurred. Please try again.', 'danger');
  } finally {
    isLoading.value = false;
    isSkipping.value = false;
  }
}
</script>

<style scoped>
/* Styles remain the same */
.signup-page {
  display: flex;
  flex-direction: column; /* Logo ở trên */
  align-items: center;
  justify-content: center;
  background: url('../assets/mountain.jpg') no-repeat center/cover;
  min-height: 100vh;
  width: 100%;
  padding: 1.5rem;
  position: relative;
}
.cp-form-card { /* ... các style cho form card ... */
  background: #fff; max-width: 430px; width: 100%; padding: 1.8rem 2.2rem; border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08); z-index: 1;
  margin-top: 20px; 
}
.cp-form-title { margin-bottom: 0.4rem; font-size: 1.5rem; font-weight: 600; text-align: center; color: #333;}
.form-subtitle.cp-form-subtitle { margin-bottom: 1.3rem; font-size: 0.85rem; text-align: center; color: #666;}
.divider {display: flex; align-items: center; margin: 1.3rem 0;}
.divider .line { flex: 1; height: 1px; background: #ccc; }
.cp-input-group { margin-bottom: 0.9rem !important; }
.form-label { display: block; font-weight: 500; margin-bottom: 0.25rem; font-size: 0.8rem; color: #485563; }
.form-label .text-danger { font-weight: normal; color: #e74c3c;}
.form-control.cp-input, .form-select.cp-input { display: block; width: 100%; padding: 0.55rem 0.7rem; font-size: 0.85rem; font-weight: 400; line-height: 1.5; color: #212529; background-color: #fff; background-clip: padding-box; border: 1px solid #ced4da; appearance: none; border-radius: 0.3rem; transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;}
.form-control.cp-input:focus, .form-select.cp-input:focus { color: #212529; background-color: #fff; border-color: #86b7fe; outline: 0; box-shadow: 0 0 0 0.15rem rgba(13,110,253,.25);}
.form-control.is-invalid, .form-select.is-invalid { border-color: #dc3545; padding-right: calc(1.5em + 0.75rem); background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right calc(0.375em + 0.1875rem) center; background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);}
.form-control.is-invalid:focus, .form-select.is-invalid:focus { border-color: #dc3545; box-shadow: 0 0 0 0.15rem rgba(220,53,69,.25);}
.form-select.cp-input { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 0.7rem center; background-size: 14px 10px;}
.invalid-feedback.d-block { display: block; width: 100%; margin-top: .2rem; font-size: .78em; color: #dc3545;}
.cp-btn { padding: 0.65rem 0; font-size: 0.9rem; font-weight: 500; border-radius: 6px; transition: opacity .15s ease-in-out; width: 100%;}
.cp-btn.btn-primary { background-color: #0d6efd; color: white; border: 1px solid #0d6efd;}
.cp-btn.btn-primary:hover:not(:disabled) { background-color: #0b5ed7; border-color: #0a58ca;}
.cp-btn.btn-primary:disabled { opacity: 0.65; cursor: not-allowed;}
.cp-btn.btn-secondary { background-color: #6c757d; color: white; border: 1px solid #6c757d; }
.cp-btn.btn-secondary:hover { background-color: #5a6268; border-color: #545b62;}
.alert { padding: 0.7rem 1rem; margin-bottom: 1.2rem; border-radius: 6px; font-size: 0.85rem;}
.alert-success { background-color: #d1e7dd; border: 1px solid #badbcc; color: #0f5132; }
.alert-danger { background-color: #f8d7da; border: 1px solid #f5c2c7; color: #842029; }
.alert-info { background-color: #cfe2ff; border-color: #b6d4fe; color: #084298; }
.card-footer { margin-top: 1rem; text-align: center; font-size: 0.9rem;}
.card-footer a { color: #0d6efd; text-decoration: none;}
.card-footer a:hover { text-decoration: underline;}
</style>