<template>
  <NavbarLogin />
  <div class="d-flex">
    <Sidebar />
    <main class="flex-grow-1 bg-light p-4" style="min-height: 100vh;">
      <h1 class="mb-4 fw-bold text-center">HOTEL BOOKING DASHBOARD</h1>

      <section>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h5 mb-0">Reservations</h2>
          <button
            class="btn btn-sm btn-outline-primary" 
            @click="toggleStatusSort"
            title="Sorts by status: Cancelled first, then Pending, then Confirm. Click again to clear sort."
          >
            {{ applyCustomStatusSort ? 'Clear Status Sort' : 'Sort by Status (Priority)' }}
          </button>
        </div>

        <ReservationTable :data="reservations" />

        <Pagination
          :page="page"
          :total="totalPages"
          @change="onPageChange"
        />
      </section>
    </main>
  </div>
  <Footer />
</template>

<script setup>
import { ref, computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import ReservationTable from '@/components/ReservationTable.vue'
import Pagination from '@/components/Pagination.vue'
import NavbarLogin from '../components/Navbar-login.vue'
import axios from 'axios'
import Footer from '../components/Footer.vue'

// Original data - remains unchanged
const allReservationsData = [
  { id: 1, name: 'Harry', branch: 'England', room: 'Premier', checkIn: '5/4/2025', checkOut: '6/4/2025', amount: '9.000.000 VND', status: 'Pending' },
  { id: 2, name: 'Potter', branch: 'Thailand', room: 'Standard', checkIn: '1/4/2025', checkOut: '3/4/2025', amount: '12.000.000 VND', status: 'Confirm' },
  { id: 3, name: 'Maguire', branch: 'France', room: 'Deluxe', checkIn: '17/3/2025', checkOut: '18/3/2025', amount: '7.000.000 VND', status: 'Cancelled' },
  { id: 4, name: 'Hermione', branch: 'Scotland', room: 'Suite', checkIn: '10/4/2025', checkOut: '12/4/2025', amount: '15.000.000 VND', status: 'Pending' },
  { id: 5, name: 'Ron', branch: 'Wales', room: 'Standard', checkIn: '20/3/2025', checkOut: '22/3/2025', amount: '6.500.000 VND', status: 'Confirm' },
  { id: 6, name: 'Dumbledore', branch: 'Ireland', room: 'Premier', checkIn: '1/5/2025', checkOut: '5/5/2025', amount: '20.000.000 VND', status: 'Cancelled' },
];

const perPage = 2;
const page = ref(1);

// --- Start of Sort Logic ---
const applyCustomStatusSort = ref(false);

// Define the desired order for statuses
const statusOrderMap = {
  'Cancelled': 0,
  'Pending': 1,
  'Confirm': 2
  // Any other status not in this map will be placed after these, in their original relative order.
};

const processedReservations = computed(() => {
  let list = [...allReservationsData]; // Work with a copy

  if (applyCustomStatusSort.value) {
    list.sort((a, b) => {
      const orderA = statusOrderMap[a.status] === undefined ? Infinity : statusOrderMap[a.status];
      const orderB = statusOrderMap[b.status] === undefined ? Infinity : statusOrderMap[b.status];
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Optional: if statuses are the same, maintain original relative order or sort by ID/name
      return a.id - b.id; // Fallback sort by ID to maintain some stability for items with same status
    });
  }
  // If applyCustomStatusSort is false, the list remains in its original order (or by ID if that's inherent)
  return list;
});

function toggleStatusSort() {
  applyCustomStatusSort.value = !applyCustomStatusSort.value;
  page.value = 1; // Reset to first page when sort changes
}
// --- End of Sort Logic ---


// totalPages should be based on the full list length
const totalPages = computed(() => Math.ceil(processedReservations.value.length / perPage));

// reservations for the table are sliced from the (potentially) sorted full list
const reservations = computed(() => {
  const start = (page.value - 1) * perPage;
  const end = start + perPage;
  return processedReservations.value.slice(start, end);
});

function onPageChange(newPage) {
  page.value = newPage;
}
</script>