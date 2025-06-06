<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">ADD NEW PROMOTION</h1>
    
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/admin/promotions" class="text-decoration-none">
            <i class="bi bi-gift me-1"></i>Promotions
          </router-link>
        </li>
        <li class="breadcrumb-item active">Add New</li>
      </ol>
    </nav>

    <form @submit.prevent="submitForm" class="card p-4 shadow-sm" style="max-width: 800px; margin: 0 auto;">
      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger">
        <i class="bi bi-exclamation-circle-fill me-2"></i>
        {{ error }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="alert alert-success">
        <i class="bi bi-check-circle-fill me-2"></i>
        {{ successMessage }}
      </div>

      <div class="row g-3">
        <!-- Promotion Name -->
        <div class="col-12">
          <label for="tenKM" class="form-label">
            Promotion Name <span class="text-danger">*</span>
          </label>
          <input 
            id="tenKM" 
            v-model="formData.TenKM" 
            type="text" 
            class="form-control" 
            :class="{ 'is-invalid': errors.TenKM }"
            placeholder="Enter promotion name"
            required 
          />
          <div v-if="errors.TenKM" class="invalid-feedback">{{ errors.TenKM }}</div>
        </div>

        <!-- Promotion Code -->
        <div class="col-md-6">
          <label for="maCodeKM" class="form-label">
            Promotion Code <span class="text-danger">*</span>
          </label>
          <div class="input-group">
            <input 
              id="maCodeKM" 
              v-model="formData.MaCodeKM" 
              type="text" 
              class="form-control" 
              :class="{ 'is-invalid': errors.MaCodeKM }"
              placeholder="e.g., SUMMER2024"
              style="text-transform: uppercase"
              @input="formatCode"
              required 
            />
            <button 
              type="button" 
              class="btn btn-outline-secondary" 
              @click="generateCode"
              title="Generate random code"
            >
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
          <div v-if="errors.MaCodeKM" class="invalid-feedback d-block">{{ errors.MaCodeKM }}</div>
          <small class="form-text text-muted">Unique code customers will use</small>
        </div>

        <!-- Discount Percentage -->
        <div class="col-md-6">
          <label for="phanTramGiam" class="form-label">
            Discount Percentage <span class="text-danger">*</span>
          </label>
          <div class="input-group">
            <input 
              id="phanTramGiam" 
              v-model.number="formData.PhanTramGiam" 
              type="number" 
              class="form-control" 
              :class="{ 'is-invalid': errors.PhanTramGiam }"
              min="1" 
              max="100" 
              step="1"
              placeholder="25"
              required 
            />
            <span class="input-group-text">%</span>
          </div>
          <div v-if="errors.PhanTramGiam" class="invalid-feedback d-block">{{ errors.PhanTramGiam }}</div>
        </div>

        <!-- Start Date -->
        <div class="col-md-6">
          <label for="ngayBatDau" class="form-label">
            Start Date <span class="text-danger">*</span>
          </label>
          <input 
            id="ngayBatDau" 
            v-model="formData.NgayBatDau" 
            type="datetime-local" 
            class="form-control" 
            :class="{ 'is-invalid': errors.NgayBatDau }"
            :min="minDate"
            required 
          />
          <div v-if="errors.NgayBatDau" class="invalid-feedback">{{ errors.NgayBatDau }}</div>
        </div>

        <!-- End Date -->
        <div class="col-md-6">
          <label for="ngayKetThuc" class="form-label">
            End Date <span class="text-danger">*</span>
          </label>
          <input 
            id="ngayKetThuc" 
            v-model="formData.NgayKetThuc" 
            type="datetime-local" 
            class="form-control" 
            :class="{ 'is-invalid': errors.NgayKetThuc }"
            :min="formData.NgayBatDau || minDate"
            required 
          />
          <div v-if="errors.NgayKetThuc" class="invalid-feedback">{{ errors.NgayKetThuc }}</div>
        </div>

        <!-- Description -->
        <div class="col-12">
          <label for="moTa" class="form-label">Description</label>
          <textarea 
            id="moTa" 
            v-model="formData.MoTa" 
            class="form-control" 
            rows="4"
            placeholder="Describe the promotion details, terms, and conditions..."
            maxlength="1000"
          ></textarea>
          <div class="form-text">{{ formData.MoTa?.length || 0 }}/1000 characters</div>
        </div>

        <!-- Status -->
        <div class="col-12">
          <div class="form-check form-switch">
            <input 
              id="trangThai" 
              v-model="formData.TrangThai" 
              class="form-check-input" 
              type="checkbox" 
              role="switch"
            />
            <label class="form-check-label" for="trangThai">
              <strong>Active Promotion</strong>
              <div class="small text-muted">When enabled, customers can use this promotion code</div>
            </label>
          </div>
        </div>

        <!-- Preview Card -->
        <div v-if="showPreview" class="col-12">
          <h6 class="mb-3">Promotion Preview:</h6>
          <div class="card bg-light">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="card-title mb-1">{{ formData.TenKM || 'Promotion Name' }}</h6>
                  <code class="bg-white px-2 py-1 rounded border">{{ formData.MaCodeKM || 'CODE' }}</code>
                </div>
                <span class="badge bg-success fs-6">{{ formData.PhanTramGiam || 0 }}% OFF</span>
              </div>
              <p v-if="formData.MoTa" class="card-text mt-2 mb-1">{{ formData.MoTa }}</p>
              <small class="text-muted">
                <i class="bi bi-calendar-event me-1"></i>
                {{ formatDateForDisplay(formData.NgayBatDau) }} - {{ formatDateForDisplay(formData.NgayKetThuc) }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-4 d-flex justify-content-between">
        <div>
          <button 
            type="button" 
            @click="showPreview = !showPreview" 
            class="btn btn-outline-info"
          >
            <i class="bi bi-eye me-1"></i>
            {{ showPreview ? 'Hide' : 'Show' }} Preview
          </button>
        </div>
        <div>
          <button 
            type="button" 
            @click="goBack" 
            class="btn btn-secondary me-2" 
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-success" 
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
            {{ isSubmitting ? 'Creating...' : 'Create Promotion' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

// Form data
const formData = reactive({
  TenKM: '',
  MaCodeKM: '',
  PhanTramGiam: null,
  NgayBatDau: '',
  NgayKetThuc: '',
  MoTa: '',
  TrangThai: true
});

// Form state
const isSubmitting = ref(false);
const error = ref('');
const successMessage = ref('');
const showPreview = ref(false);
const errors = reactive({});

// Computed properties
const minDate = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
});

// Form validation
function validateForm() {
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key]);
  
  let isValid = true;

  // Required fields
  if (!formData.TenKM?.trim()) {
    errors.TenKM = 'Promotion name is required';
    isValid = false;
  }

  if (!formData.MaCodeKM?.trim()) {
    errors.MaCodeKM = 'Promotion code is required';
    isValid = false;
  } else if (formData.MaCodeKM.length < 3) {
    errors.MaCodeKM = 'Promotion code must be at least 3 characters';
    isValid = false;
  }

  if (!formData.PhanTramGiam || formData.PhanTramGiam < 1 || formData.PhanTramGiam > 100) {
    errors.PhanTramGiam = 'Discount must be between 1% and 100%';
    isValid = false;
  }

  if (!formData.NgayBatDau) {
    errors.NgayBatDau = 'Start date is required';
    isValid = false;
  }

  if (!formData.NgayKetThuc) {
    errors.NgayKetThuc = 'End date is required';
    isValid = false;
  } else if (formData.NgayBatDau && formData.NgayKetThuc <= formData.NgayBatDau) {
    errors.NgayKetThuc = 'End date must be after start date';
    isValid = false;
  }

  // Check if start date is not in the past (with some tolerance)
  if (formData.NgayBatDau) {
    const startDate = new Date(formData.NgayBatDau);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    if (startDate < now) {
      errors.NgayBatDau = 'Start date cannot be in the past';
      isValid = false;
    }
  }

  return isValid;
}

// Form submission
async function submitForm() {
  if (!validateForm()) {
    error.value = 'Please fix the validation errors above';
    return;
  }

  isSubmitting.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    const response = await axios.post('http://localhost:5000/api/promotions', {
      TenKM: formData.TenKM.trim(),
      MaCodeKM: formData.MaCodeKM.trim().toUpperCase(),
      PhanTramGiam: formData.PhanTramGiam,
      NgayBatDau: formData.NgayBatDau,
      NgayKetThuc: formData.NgayKetThuc,
      MoTa: formData.MoTa?.trim() || null,
      TrangThai: formData.TrangThai
    }, {
      withCredentials: true
    });

    if (response.data?.success) {
      successMessage.value = 'Promotion created successfully!';
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push({ name: 'AdminManagePromotions' });
      }, 1500);
    } else {
      error.value = response.data?.message || 'Failed to create promotion';
    }
  } catch (err) {
    console.error('Error creating promotion:', err);
    
    // Handle specific error cases
    if (err.response?.status === 400) {
      error.value = err.response.data?.message || 'Invalid promotion data';
    } else if (err.response?.data?.message?.includes('duplicate') || err.response?.data?.message?.includes('unique')) {
      errors.MaCodeKM = 'This promotion code already exists';
      error.value = 'Promotion code must be unique';
    } else {
      error.value = err.response?.data?.message || 'Failed to create promotion';
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Utility functions
function formatCode() {
  formData.MaCodeKM = formData.MaCodeKM.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  formData.MaCodeKM = result;
}

function formatDateForDisplay(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function goBack() {
  router.push({ name: 'AdminManagePromotions' });
}

// Initialize default dates
onMounted(() => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Set default start date to tomorrow
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  formData.NgayBatDau = tomorrow.toISOString().slice(0, 16);
  
  // Set default end date to next week
  nextWeek.setMinutes(nextWeek.getMinutes() - nextWeek.getTimezoneOffset());
  formData.NgayKetThuc = nextWeek.toISOString().slice(0, 16);
});
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.form-control:focus,
.form-select:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}

.form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

code {
  font-size: 0.875em;
}

.badge {
  font-size: 0.875em;
}

.breadcrumb-item a:hover {
  color: #198754 !important;
}
</style> 