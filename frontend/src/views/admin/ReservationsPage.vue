<!-- src/views/admin/ReservationsPage.vue -->
<template>
  <div>
    <h1 class="mb-4 text-center">HOTEL BOOKING DASHBOARD</h1>
    <section>
      <!-- copy nguyên phần fetch + table từ Dashboard cũ của bạn -->
      <div class="d-flex justify-content-between mb-3">
        <h2 class="h5 mb-0">Reservations</h2>
        <button @click="toggleStatusSort" class="btn btn-sm btn-outline-primary">
          {{ applySort? 'Clear Sort':'Sort by Status' }}
        </button>
      </div>
      <ReservationTable :data="reservations" />
      <Pagination :page="page" :total="totalPages" @change="onPageChange"/>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ReservationTable from '@/components/ReservationTable.vue'
import Pagination       from '@/components/Pagination.vue'

const reservations = ref([])
const page = ref(1)
const totalPages = ref(0)
const applySort = ref(false)

async function fetchData() {
  // gọi API /api/reservations?page=${page.value}
  // gán về reservations.value, totalPages.value
}
onMounted(fetchData)
function toggleStatusSort() { applySort.value = !applySort.value; fetchData() }
function onPageChange(p) { page.value = p; fetchData() }
</script>
