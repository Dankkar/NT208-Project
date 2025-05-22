<template>
  <div class="d-flex">
    <Sidebar />

    <main class="flex-grow-1 bg-light p-4" style="min-height: 100vh;">
      <h1 class="mb-4 fw-bold text-center">HOTEL BOOKING DASHBOARD</h1>

      <section>
        <h2 class="h5 mb-3">Reservations</h2>

        <ReservationTable :data="reservations" />

        <Pagination
          :page="page"
          :total="totalPages"
          @change="onPageChange"
        />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import ReservationTable from '@/components/ReservationTable.vue'
import Pagination from '@/components/Pagination.vue'

const allReservations = [
  { id: 1, name: 'Harry', branch: 'England', room: 'Premier', checkIn: '5/4/2025', checkOut: '6/4/2025', amount: '9.000.000 VND', status: 'Pending' },
  { id: 2, name: 'Potter', branch: 'Thailand', room: 'Standard', checkIn: '1/4/2025', checkOut: '3/4/2025', amount: '12.000.000 VND', status: 'Confirm' },
  { id: 3, name: 'Maguire', branch: 'France', room: 'Deluxe', checkIn: '17/3/2025', checkOut: '18/3/2025', amount: '7.000.000 VND', status: 'Cancelled' },
]

const perPage = 2
const page = ref(1)

const totalPages = computed(() => Math.ceil(allReservations.length / perPage))

const reservations = computed(() =>
  allReservations.slice((page.value - 1) * perPage, page.value * perPage)
)

function onPageChange(n) {
  page.value = n
}
</script>
