<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">EDIT PROMOTION</h1>
    
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/admin/promotions" class="text-decoration-none">
            <i class="bi bi-gift me-1"></i>Promotions
          </router-link>
        </li>
        <li class="breadcrumb-item active">Edit #{{ promotionId }}</li>
      </ol>
    </nav>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading promotion...</span>
      </div>
      <p class="mt-2 text-muted">Loading promotion details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="alert alert-danger">
      <i class="bi bi-exclamation-circle-fill me-2"></i>
      {{ loadError }}
      <div class="mt-2">
        <button @click="loadPromotion" class="btn btn-sm btn-outline-danger me-2">Retry</button>
        <button @click="goBack" class="btn btn-sm btn-secondary">Go Back</button>
      </div>
    </div>

    <!-- Edit Form -->
    <form v-else-if="originalData" @submit.prevent="submitForm" class="card p-4 shadow-sm" style="max-width: 800px; margin: 0 auto;">
      <!-- Info Header -->
      <div class="mb-3 p-3 bg-light rounded">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">Editing Promotion ID: {{ promotionId }}</h6>
            <small class="text-muted">Created: {{ formatDate(originalData.CreatedAt) }}</small>
          </div>
          <span :class="getTimeStatusClass(originalData)" class="badge">
            {{ getTimeStatus(originalData) }}
          </span>
        </div>
      </div>

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
            required 
          />
          <div v-if="errors.NgayBatDau" class="invalid-feedback">{{ errors.NgayBatDau }}</div>
          <small v-if="hasStarted" class="form-text text-warning">
            <i class="bi bi-exclamation-triangle me-1"></i>
            This promotion has already started
          </small>
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
            :min="formData.NgayBatDau"
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

        <!-- Changes Summary -->
        <div v-if="hasChanges" class="col-12">
          <div class="card bg-info bg-opacity-10 border-info">
            <div class="card-body">
              <h6 class="card-title text-info">
                <i class="bi bi-info-circle-fill me-1"></i>Changes Detected
              </h6>
              <ul class="mb-0 small">
                <li v-for="change in getChanges()" :key="change" class="text-muted">{{ change }}</li>
              </ul>
            </div>
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
            @click="resetForm" 
            class="btn btn-outline-secondary me-2" 
            :disabled="isSubmitting || !hasChanges"
            title="Reset to original values"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>Reset
          </button>
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
            class="btn btn-warning" 
            :disabled="isSubmitting || !hasChanges"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
            {{ isSubmitting ? 'Updating...' : 'Update Promotion' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const promotionId = ref(route.params.promotionId);

// Data
const originalData = ref(null);
const formData = reactive({
  TenKM: '',
  MaCodeKM: '',
  PhanTramGiam: null,
  NgayBatDau: '',
  NgayKetThuc: '',
  MoTa: '',
  TrangThai: true
});

// State
const isLoading = ref(false);
const loadError = ref('');
const isSubmitting = ref(false);
const error = ref('');
const successMessage = ref('');
const showPreview = ref(false);
const errors = reactive({});

// Computed properties
const hasStarted = computed(() => {
  if (!originalData.value) return false;
  return new Date(originalData.value.NgayBatDau) <= new Date();
});

const hasChanges = computed(() => {
  if (!originalData.value) return false;
  
  return (
    formData.TenKM !== originalData.value.TenKM ||
    formData.MaCodeKM !== originalData.value.MaCodeKM ||
    formData.PhanTramGiam !== originalData.value.PhanTramGiam ||
    formData.NgayBatDau !== formatDateForInput(originalData.value.NgayBatDau) ||
    formData.NgayKetThuc !== formatDateForInput(originalData.value.NgayKetThuc) ||
    formData.MoTa !== (originalData.value.MoTa || '') ||
    formData.TrangThai !== Boolean(originalData.value.TrangThai)
  );
});

// Load promotion data
async function loadPromotion() {
  isLoading.value = true;
  loadError.value = '';
  
  try {
    const response = await axios.get(`/api/promotions/${promotionId.value}`, {
      withCredentials: true
    });

    if (response.data?.success) {
      originalData.value = response.data.data;
      populateForm();
    } else {
      loadError.value = response.data?.message || 'Failed to load promotion';
    }
  } catch (err) {
    console.error('Error loading promotion:', err);
    if (err.response?.status === 404) {
      loadError.value = 'Promotion not found';
    } else {
      loadError.value = err.response?.data?.message || 'Failed to load promotion';
    }
  } finally {
    isLoading.value = false;
  }
}

// Populate form with loaded data
function populateForm() {
  if (!originalData.value) return;
  
  formData.TenKM = originalData.value.TenKM || '';
  formData.MaCodeKM = originalData.value.MaCodeKM || '';
  formData.PhanTramGiam = originalData.value.PhanTramGiam || null;
  formData.NgayBatDau = formatDateForInput(originalData.value.NgayBatDau);
  formData.NgayKetThuc = formatDateForInput(originalData.value.NgayKetThuc);
  formData.MoTa = originalData.value.MoTa || '';
  formData.TrangThai = Boolean(originalData.value.TrangThai);
}

// Reset form to original values
function resetForm() {
  populateForm();
  Object.keys(errors).forEach(key => delete errors[key]);
  error.value = '';
}

// Form validation
function validateForm() {
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
    const response = await axios.put(`/api/promotions/${promotionId.value}`, {
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
      successMessage.value = 'Promotion updated successfully!';
      
      // Update original data to reflect changes
      await loadPromotion();
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push({ name: 'AdminManagePromotions' });
      }, 1500);
    } else {
      error.value = response.data?.message || 'Failed to update promotion';
    }
  } catch (err) {
    console.error('Error updating promotion:', err);
    
    if (err.response?.status === 400) {
      error.value = err.response.data?.message || 'Invalid promotion data';
    } else if (err.response?.data?.message?.includes('duplicate') || err.response?.data?.message?.includes('unique')) {
      errors.MaCodeKM = 'This promotion code already exists';
      error.value = 'Promotion code must be unique';
    } else {
      error.value = err.response?.data?.message || 'Failed to update promotion';
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Get list of changes
function getChanges() {
  if (!originalData.value) return [];
  
  const changes = [];
  
  if (formData.TenKM !== originalData.value.TenKM) {
    changes.push(`Name: "${originalData.value.TenKM}" → "${formData.TenKM}"`);
  }
  if (formData.MaCodeKM !== originalData.value.MaCodeKM) {
    changes.push(`Code: "${originalData.value.MaCodeKM}" → "${formData.MaCodeKM}"`);
  }
  if (formData.PhanTramGiam !== originalData.value.PhanTramGiam) {
    changes.push(`Discount: ${originalData.value.PhanTramGiam}% → ${formData.PhanTramGiam}%`);
  }
  if (formData.NgayBatDau !== formatDateForInput(originalData.value.NgayBatDau)) {
    changes.push(`Start Date changed`);
  }
  if (formData.NgayKetThuc !== formatDateForInput(originalData.value.NgayKetThuc)) {
    changes.push(`End Date changed`);
  }
  if (formData.MoTa !== (originalData.value.MoTa || '')) {
    changes.push(`Description updated`);
  }
  if (formData.TrangThai !== Boolean(originalData.value.TrangThai)) {
    changes.push(`Status: ${originalData.value.TrangThai ? 'Active' : 'Inactive'} → ${formData.TrangThai ? 'Active' : 'Inactive'}`);
  }
  
  return changes;
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

function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
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

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
}

function getTimeStatus(promotion) {
  const now = new Date();
  const start = new Date(promotion.NgayBatDau);
  const end = new Date(promotion.NgayKetThuc);
  
  if (now < start) return 'Upcoming';
  if (now > end) return 'Expired';
  return 'Current';
}

function getTimeStatusClass(promotion) {
  const status = getTimeStatus(promotion);
  switch (status) {
    case 'Current': return 'badge bg-success';
    case 'Upcoming': return 'badge bg-warning text-dark';
    case 'Expired': return 'badge bg-danger';
    default: return 'badge bg-secondary';
  }
}

function goBack() {
  router.push({ name: 'AdminManagePromotions' });
}

// Watch for route changes
watch(() => route.params.promotionId, (newId) => {
  if (newId && newId !== promotionId.value) {
    promotionId.value = newId;
    loadPromotion();
  }
});

// Initialize
onMounted(() => {
  if (promotionId.value) {
    loadPromotion();
  } else {
    loadError.value = 'Promotion ID is missing';
  }
});
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.form-control:focus,
.form-select:focus {
  border-color: #ffc107;
  box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
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
  color: #ffc107 !important;
}
</style> 
