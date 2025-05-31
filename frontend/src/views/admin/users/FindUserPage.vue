<!-- src/views/admin/users/FindUserPage.vue -->
<template>
  <div>
    <h1 class="mb-4 fw-bold text-center">FIND USER</h1>

    <form @submit.prevent="searchUser" class="mb-4">
      <div class="input-group">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control"
          placeholder="Enter user ID"
          aria-label="Search query"
        />
        <button class="btn btn-primary" type="submit" :disabled="isProcessing">
          <span v-if="isProcessing" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          {{ isProcessing ? 'Processing...' : 'Search' }}
        </button>
      </div>
    </form>

    <div v-if="isProcessing && !foundUsers.length" class="text-center my-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Searching...</span>
      </div>
    </div>

    <div v-if="apiError" class="alert alert-danger">{{ apiError }}</div>

    <div v-if="foundUsers.length > 0 && !isProcessing" class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>ID (MaKH)</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>IsActive</th>
            <th>Role (LoaiUser)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in foundUsers" :key="user.MaKH">
            <td>{{ user.MaKH }}</td>
            <td>{{ user.HoTen || 'N/A' }}</td>
            <td>{{ user.Email }}</td>
            <td><span :class="getActiveClass(user.IsActive)">{{ user.IsActive || 'N/A' }}</span></td>
            <td><span :class="getRoleClass(user.LoaiUser)">{{ user.LoaiUser || 'N/A' }}</span></td>
            <td>
              <button @click="editUser(user.MaKH)" class="btn btn-sm btn-outline-warning me-2 mb-1" title="Edit User" :disabled="isProcessing">
                <i class="bi bi-pencil-fill"></i> Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="!isProcessing && searchAttempted && foundUsers.length === 0" class="alert alert-secondary text-center">
      No users found matching your query "{{ previousQuery }}".
    </div>
     <div v-else-if="!isProcessing && !searchAttempted" class="alert alert-info text-center">
      Enter a search term above to find users.
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const searchQuery = ref('');
const foundUsers = ref([]);
const isProcessing = ref(false);
const apiError = ref('');
const searchAttempted = ref(false);
const previousQuery = ref('');

async function searchUser() {
  if (!searchQuery.value.trim()) {
    apiError.value = "Please enter a search term.";
    return;
  }
  isProcessing.value = true;
  apiError.value = '';
  foundUsers.value = [];
  searchAttempted.value = true;
  previousQuery.value = searchQuery.value;

  try {
    const response = await axios.get(
      `http://localhost:5000/api/users/search?keyword=${encodeURIComponent(searchQuery.value)}`,
      { withCredentials: true }
    );

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      foundUsers.value = response.data.data;
    } else if (response.data && !response.data.success) {
      apiError.value = response.data.message || "Search failed: Server indicated an error.";
      foundUsers.value = [];
    } else {
      foundUsers.value = [];
      apiError.value = "Received an unexpected response from the server.";
    }
  } catch (err) {
    handleApiError(err, "Failed to search users.");
    foundUsers.value = [];
  } finally {
    isProcessing.value = false;
  }
}

function getRoleClass(role) {
  if (role === 'Admin') return 'badge bg-danger text-white';
  if (role === 'QuanLyKS') return 'badge bg-warning text-dark';
  if (role === 'KhachHang') return 'badge bg-success text-white';
  return 'badge bg-secondary text-white';
}

function getActiveClass(status) {
  if (status === 1) return 'badge bg-success text-white';
  if (status === 0) return 'badge bg-danger text-white';
  return 'badge bg-secondary text-white'; // Default or N/A
}

function editUser(userId) {
  console.log(`Navigating to edit user ID ${userId}`);
  // Bạn cần tạo route và component cho 'AdminEditUser'
  router.push({ name: 'AdminEditUser', params: { userId: String(userId) } });
}

function handleApiError(err, defaultMessage) {
  if (err.response) {
    apiError.value = err.response.data?.message || `Error: ${err.response.status} - ${defaultMessage}.`;
  } else if (err.request) {
    apiError.value = `No response from server for: ${defaultMessage}. Please check network.`;
  } else {
    apiError.value = `An error occurred with: ${defaultMessage}.`;
  }
  console.error(defaultMessage, err);
}
</script>

<style scoped>
.table th {
  font-weight: 600;
}
.table-responsive {
  margin-top: 1rem;
}
.badge {
    padding: 0.4em 0.65em;
    font-size: 0.8em;
}
.input-group .form-control {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}
.input-group .btn {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
</style>