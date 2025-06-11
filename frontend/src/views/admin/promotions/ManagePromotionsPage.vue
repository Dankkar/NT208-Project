<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">MANAGE PROMOTIONS</h1>

    <!-- Header with Add Button -->
    <div class="mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h5 class="mb-0">Promotion Management</h5>
        <small class="text-muted">Create, edit, and manage promotional campaigns</small>
      </div>
      <button @click="navigateToAddPromotion" class="btn btn-success">
        <i class="bi bi-plus-circle-fill me-1"></i> Add New Promotion
      </button>
    </div>

    <!-- Search and Filter Section -->
    <div class="mb-4 card p-3 shadow-sm">
      <div class="row g-3">
        <div class="col-md-4">
          <label for="searchTerm" class="form-label">Search</label>
          <input 
            id="searchTerm" 
            v-model="searchTerm" 
            type="text" 
            class="form-control" 
            placeholder="Search by name or code..."
            @input="debouncedSearch"
          />
        </div>
        <div class="col-md-3">
          <label for="statusFilter" class="form-label">Status</label>
          <select id="statusFilter" v-model="statusFilter" class="form-select" @change="applyFilters">
            <option value="">All Statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
        <div class="col-md-3">
          <label for="timeFilter" class="form-label">Time Status</label>
          <select id="timeFilter" v-model="timeFilter" class="form-select" @change="applyFilters">
            <option value="">All Time</option>
            <option value="current">Current/Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">&nbsp;</label>
          <button @click="resetFilters" class="btn btn-outline-secondary w-100">
            <i class="bi bi-arrow-clockwise me-1"></i> Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading promotions...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
      <button @click="fetchPromotions" class="btn btn-sm btn-outline-danger ms-2">Retry</button>
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show">
      {{ successMessage }}
      <button type="button" class="btn-close" @click="successMessage = ''"></button>
    </div>

    <!-- Promotions Table -->
    <div v-else-if="promotions.length > 0" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Code</th>
            <th>Discount %</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Time Status</th>
            <th style="min-width: 160px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="promotion in promotions" :key="promotion.MaKM">
            <td>{{ promotion.MaKM }}</td>
            <td>
              <strong>{{ promotion.TenKM }}</strong>
              <div v-if="promotion.MoTa" class="small text-muted">
                {{ truncateText(promotion.MoTa, 50) }}
              </div>
            </td>
            <td>
              <code class="bg-light px-2 py-1 rounded">{{ promotion.MaCodeKM }}</code>
            </td>
            <td>
              <span class="badge bg-info text-dark">{{ promotion.PhanTramGiam }}%</span>
            </td>
            <td>{{ formatDate(promotion.NgayBatDau) }}</td>
            <td>{{ formatDate(promotion.NgayKetThuc) }}</td>
            <td>
              <span :class="getStatusClass(promotion.TrangThai)">
                {{ promotion.TrangThai ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <span :class="getTimeStatusClass(promotion)">
                {{ getTimeStatus(promotion) }}
              </span>
            </td>
            <td>
              <div class="btn-group" role="group">
                <button 
                  @click="navigateToEditPromotion(promotion.MaKM)" 
                  class="btn btn-sm btn-outline-warning"
                  title="Edit Promotion"
                >
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button 
                  @click="togglePromotionStatus(promotion)" 
                  :class="promotion.TrangThai ? 'btn btn-sm btn-outline-secondary' : 'btn btn-sm btn-outline-success'"
                  :title="promotion.TrangThai ? 'Deactivate' : 'Activate'"
                >
                  <i :class="promotion.TrangThai ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                </button>
                <button 
                  @click="confirmDeletePromotion(promotion)" 
                  class="btn btn-sm btn-outline-danger"
                  title="Delete Promotion"
                >
                  <i class="bi bi-trash-fill"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <Pagination
        v-if="paginationData.totalPages > 1"
        :page="paginationData.page"
        :total="paginationData.totalPages"
        @change="handlePageChange"
        class="mt-3"
      />
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading" class="text-center py-5">
      <i class="bi bi-gift display-1 text-muted"></i>
      <h4 class="mt-3 text-muted">No Promotions Found</h4>
      <p class="text-muted">
        {{ searchTerm || statusFilter || timeFilter ? 'Try adjusting your search filters.' : 'Create your first promotion to get started.' }}
      </p>
      <button v-if="!searchTerm && !statusFilter && !timeFilter" @click="navigateToAddPromotion" class="btn btn-success">
        <i class="bi bi-plus-circle-fill me-1"></i> Create First Promotion
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this promotion?</p>
            <div v-if="promotionToDelete" class="card bg-light">
              <div class="card-body">
                <strong>{{ promotionToDelete.TenKM }}</strong><br>
                <small>Code: {{ promotionToDelete.MaCodeKM }}</small>
              </div>
            </div>
            <p class="text-danger mt-2 mb-0">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>
              This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
            <button type="button" class="btn btn-danger" @click="deletePromotion" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Pagination from '@/components/Pagination.vue';

const router = useRouter();

// Data
const promotions = ref([]);
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');

// Search and filters
const searchTerm = ref('');
const statusFilter = ref('');
const timeFilter = ref('');

// Pagination
const paginationData = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// Delete modal
const showDeleteModal = ref(false);
const promotionToDelete = ref(null);
const isDeleting = ref(false);

// Debounced search
let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchPromotions(1);
  }, 500);
};

// Fetch promotions
async function fetchPromotions(page = 1) {
  isLoading.value = true;
  error.value = '';
  
  try {
    const params = {
      page,
      limit: paginationData.value.limit
    };

    // Add filters
    if (searchTerm.value) params.search = searchTerm.value;
    if (statusFilter.value !== '') params.status = statusFilter.value;
    if (timeFilter.value) params.timeStatus = timeFilter.value;

    const response = await axios.get('/api/promotions', {
      params,
      withCredentials: true
    });

    if (response.data?.success) {
      promotions.value = response.data.data || [];
      if (response.data.pagination) {
        paginationData.value = { ...paginationData.value, ...response.data.pagination };
      }
    } else {
      error.value = response.data?.message || 'Failed to load promotions';
    }
  } catch (err) {
    console.error('Error fetching promotions:', err);
    error.value = err.response?.data?.message || 'Failed to load promotions';
  } finally {
    isLoading.value = false;
  }
}

// Navigation
function navigateToAddPromotion() {
  router.push({ name: 'AdminAddPromotion' });
}

function navigateToEditPromotion(promotionId) {
  router.push({ name: 'AdminEditPromotion', params: { promotionId } });
}

// Filters
function applyFilters() {
  fetchPromotions(1);
}

function resetFilters() {
  searchTerm.value = '';
  statusFilter.value = '';
  timeFilter.value = '';
  fetchPromotions(1);
}

// Status management
async function togglePromotionStatus(promotion) {
  try {
    const newStatus = !promotion.TrangThai;
    await axios.put(`/api/promotions/${promotion.MaKM}`, {
      ...promotion,
      TrangThai: newStatus
    }, { withCredentials: true });

    promotion.TrangThai = newStatus;
    successMessage.value = `Promotion ${newStatus ? 'activated' : 'deactivated'} successfully`;
    
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update promotion status';
  }
}

// Delete promotion
function confirmDeletePromotion(promotion) {
  promotionToDelete.value = promotion;
  showDeleteModal.value = true;
}

async function deletePromotion() {
  if (!promotionToDelete.value) return;
  
  isDeleting.value = true;
  try {
    await axios.delete(`/api/promotions/${promotionToDelete.value.MaKM}`, {
      withCredentials: true
    });

    successMessage.value = 'Promotion deleted successfully';
    showDeleteModal.value = false;
    promotionToDelete.value = null;
    fetchPromotions(); // Refresh list
    
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete promotion';
  } finally {
    isDeleting.value = false;
  }
}

// Pagination
function handlePageChange(page) {
  fetchPromotions(page);
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
}

function truncateText(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function getStatusClass(status) {
  return status ? 'badge bg-success' : 'badge bg-secondary';
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

// Initialize
onMounted(() => {
  fetchPromotions();
});
</script>

<style scoped>
.table td {
  vertical-align: middle;
}

code {
  font-size: 0.875em;
}

.btn-group .btn {
  border-radius: 0.25rem !important;
  margin-right: 2px;
}

.btn-group .btn:last-child {
  margin-right: 0;
}
</style> 
