<!-- src/views/SignupPage.vue -->
<template>
  <div class="signup-page">
    <router-link class="logo-wrapper" to="/homepage">
      <Logo :src="logoSrc" alt="UIT_Logo" hoverFilter="brightness(0.8)" width="50px" />
    </router-link>
    <div class="form-card">
      <h2 class="form-title">Create your account</h2>

      <!-- Local form alerts (validation, email exists) -->
      <div v-if="alertMessage" :class="['alert', alertType]" role="alert">
        {{ alertMessage }}
      </div>
      <!-- Global auth errors (e.g., if check-email API failed in a way authStore handles) -->
      <div v-if="authStore.getAuthError" class="alert alert-danger" role="alert">
        {{ authStore.getAuthError }}
      </div>
      
      <div class="divider mb-4"><span class="line"></span><span class="line"></span></div>

      <form @submit.prevent="handleFormSubmit">
        <div class="mb-4">
          <label for="email" class="form-label">Email</label>
          <input 
            id="email" 
            v-model="formData.email" 
            type="email" 
            class="underline-input"
            :class="{ 'is-invalid': errors.email || emailAlreadyExists }" 
            placeholder="Enter your email"
            @input="debouncedValidateEmailFormatAndExistence" 
            @blur="validateEmailOnBlur" 
            required 
          />
          <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
          <div v-if="!errors.email && emailAlreadyExists" class="invalid-feedback d-block">This email address is already registered.</div>
          <small v-if="isCheckingEmail" class="form-text text-muted">Checking email...</small>
        </div>
        
        <div class="mb-4">
          <label for="password" class="form-label">Password</label>
          <input 
            id="password" 
            v-model="formData.password" 
            type="password" 
            class="underline-input"
            :class="{ 'is-invalid': errors.password }" 
            placeholder="Create a password (min 8 characters)" 
            @input="validatePassword" 
            required 
          />
          <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
        </div>

        <div class="mb-5">
          <label for="confirm" class="form-label">Confirm Password</label>
          <input 
            id="confirm" 
            v-model="formData.confirmPassword" 
            type="password" 
            class="underline-input"
            :class="{ 'is-invalid': errors.confirmPassword }" 
            placeholder="Repeat your password" 
            @input="validateConfirmPassword" 
            required 
          />
          <div v-if="errors.confirmPassword" class="invalid-feedback d-block">{{ errors.confirmPassword }}</div>
        </div>

        <button 
          type="submit" 
          class="btn-signup w-100 mb-3" 
          :disabled="!isFormCompletelyValid || isCheckingEmail"
        >
          <span v-if="isCheckingEmail || isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
          {{ (isCheckingEmail || isSubmitting) ? 'Processing...' : 'Create account' }}
        </button>
      </form>
      
      <p class="card-footer">
        Already have an account? <router-link to="/login" class="link-primary">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSignupStore } from '../store/signupStore'; // For passing credentials to next step
import { useAuthStore } from '@/store/authStore';    // For global errors or auth state if needed}
import axios from 'axios';
import Logo from '../components/Logo.vue';
import uit_logo from '../assets/Logo_UIT_blue.jpg';

const router = useRouter();
const signupStore = useSignupStore();
const authStore = useAuthStore();

const logoSrc = ref(uit_logo);

const formData = reactive({
  email: signupStore.email || '', // Pre-fill if coming back or from other flow
  password: '',
  confirmPassword: '',
});

const errors = reactive({
  email: '',
  password: '',
  confirmPassword: '',
});

const alertMessage = ref('');
const alertType = ref('');

const isCheckingEmail = ref(false);       // True while API call to check email is in progress
const emailAlreadyExists = ref(false);    // True if API confirms email is registered
const isSubmitting = ref(false);          // True during the final submission process

let debounceTimer = null;

// --- Validation Logic ---
function validateEmailFormat() {
  errors.email = ''; // Reset
  emailAlreadyExists.value = false; // Reset server state on format re-check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  return !errors.email;
}

async function checkEmailOnServer() {
  if (!validateEmailFormat()) { // Ensure format is valid before server check
    isCheckingEmail.value = false; // Ensure this is reset if format becomes invalid during typing
    return;
  }

  isCheckingEmail.value = true;
  emailAlreadyExists.value = false; // Assume not registered until confirmed
  // Clear only server-related email error, not format error
  if (errors.email && errors.email.includes('verify') || errors.email.includes('registered')) {
    errors.email = '';
  }
  authStore.clearError(); // Clear global auth error if any

  try {
    const response = await axios.post('http://localhost:5000/api/auth/check-email', { Email: formData.email });
    if (response.data.exists) {
      // errors.email = 'This email address is already registered.'; // Can be displayed via emailAlreadyExists flag too
      emailAlreadyExists.value = true;
    } else {
      emailAlreadyExists.value = false;
    }
  } catch (error) {
    console.error('Error checking email:', error);
    // Example: Set error in authStore or local errors
    // authStore.setError(error.response?.data?.message || 'Could not verify email. Please try again later.');
    errors.email = error.response?.data?.message || 'Could not verify email. Please try again.';
    emailAlreadyExists.value = false; // Can't confirm it exists if there's an error
  } finally {
    isCheckingEmail.value = false;
  }
}

const debouncedValidateEmailFormatAndExistence = () => {
  clearTimeout(debounceTimer);
  if (validateEmailFormat()) { // Only debounce server check if format is initially valid
    debounceTimer = setTimeout(async () => {
      await checkEmailOnServer();
    }, 700); // Adjust debounce delay as needed
  }
};

async function validateEmailOnBlur() {
  clearTimeout(debounceTimer); // Cancel any pending debounced check
  if (validateEmailFormat()) { // Validate format first
    await checkEmailOnServer(); // Then check on server
  }
}

function validatePassword() {
  if (!formData.password) errors.password = 'Password is required';
  else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else errors.password = '';
  // If confirm password has a value, re-validate it as it depends on password
  if (formData.confirmPassword) validateConfirmPassword();
  return !errors.password;
}

function validateConfirmPassword() {
  if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Passwords do not match';
  else errors.confirmPassword = '';
  return !errors.confirmPassword;
}

const isFormCompletelyValid = computed(() => {
  return (
    formData.email && !errors.email && !emailAlreadyExists.value &&
    formData.password && !errors.password &&
    formData.confirmPassword && !errors.confirmPassword
  );
});

// --- Alerting ---
function showAlert(message, type = 'danger', duration = 5000) {
  alertMessage.value = message;
  alertType.value = `alert-${type}`;
  if (duration > 0) {
    setTimeout(() => {
      alertMessage.value = '';
      alertType.value = '';
    }, duration);
  }
}

// --- Form Submission ---
async function handleFormSubmit() {
  isSubmitting.value = true;
  authStore.clearError(); // Clear previous global errors
  alertMessage.value = ''; // Clear local alerts

  // Perform all validations again, including awaiting the email server check
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();
  
  // For email, ensure format is valid before attempting server check
  const isEmailFormatValid = validateEmailFormat();
  if (isEmailFormatValid) {
      await checkEmailOnServer(); // Await the server check outcome
  }
  
  // Now, check all conditions after validations have completed
  if (!isFormCompletelyValid.value) {
    let firstError = '';
    if (errors.email) firstError = errors.email;
    else if (emailAlreadyExists.value) firstError = 'This email address is already registered.';
    else if (errors.password) firstError = errors.password;
    else if (errors.confirmPassword) firstError = errors.confirmPassword;
    else if (isCheckingEmail.value) firstError = 'Email verification is in progress. Please wait a moment and try again.'; // Should ideally not happen if awaited
    else firstError = 'Please ensure all fields are correct and email is verified.';
    
    showAlert(firstError || 'Please complete the form correctly.', 'danger');
    isSubmitting.value = false;
    return;
  }

  // If all checks pass:
  signupStore.setCredentials(formData.email, formData.password);
  router.push('/complete-profile');
  // isSubmitting.value will remain true until navigation, or set to false if navigation fails.
  // Typically, page unmount will clear it. If staying on page, set to false after router.push promise resolves if needed.
}

// --- Lifecycle Hooks ---
onMounted(() => {
  // If email is pre-filled (e.g. from signupStore), validate it
  if (formData.email) {
    validateEmailOnBlur(); // Validate format and check on server
  }
});

onUnmounted(() => {
  clearTimeout(debounceTimer);
  // Optionally clear errors in authStore if this page was responsible for setting them
  // if (authStore.getAuthError) {
  //   authStore.clearError();
  // }
});

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
  border-bottom-color: #888; /* Or your primary color */
}
.underline-input.is-invalid {
  border-bottom-color: #dc3545;
}

/* feedback text for invalid inputs */
.invalid-feedback.d-block {
    display: block !important; /* Ensure it shows */
    width: 100%;
    margin-top: .25rem;
    font-size: .875em;
    color: #dc3545;
}
.form-text.text-muted {
    font-size: .875em;
    color: #6c757d;
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
  transition: opacity 0.2s ease-in-out, background-color 0.2s ease-in-out;
}
.btn-signup:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-signup:disabled {
  opacity: 0.65;
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
  border: 1px solid transparent;
}
.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}
.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}
.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.logo-wrapper {
  position: absolute;
  top: 2rem; /* Adjust as needed */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  z-index: 10;
}
</style>  