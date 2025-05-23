<template>
  <div class="table-responsive border bg-white">
    <table class="table mb-0">
      <thead class="table-primary">
        <tr>
          <th>Name</th>
          <th>Branch</th>
          <th>Room</th>
          <th>Check in-out</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in data" :key="r.id">
          <td>{{ r.name }}</td>
          <td>{{ r.branch }}</td>
          <td>{{ r.room }}</td>
          <td>{{ r.checkIn }} - {{ r.checkOut }}</td>
          <td>{{ r.amount }}</td>
          <td :class="statusClass(r.status)">{{ r.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
})

function statusClass(status) {
  if (status === 'Pending') return 'text-primary'
  if (status === 'Confirm') return 'text-success'
  if (status === 'Cancelled') return 'text-danger'
  return ''
}
</script>
