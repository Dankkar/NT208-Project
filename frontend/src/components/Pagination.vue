<template>
  <nav aria-label="Page navigation example" class="mt-3 d-flex justify-content-end">
    <ul class="pagination mb-0">
      <li :class="['page-item', { disabled: page === 1 }]">
        <button class="page-link" @click="$emit('change', page - 1)" :disabled="page === 1">Previous</button>
      </li>

      <li
        v-for="n in total"
        :key="n"
        :class="['page-item', { active: n === page }]"
      >
        <button class="page-link" @click="$emit('change', n)">{{ n }}</button>
      </li>

      <li :class="['page-item', { disabled: page === total }]">
        <button class="page-link" @click="$emit('change', page + 1)" :disabled="page === total">Next</button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
const props = defineProps({
  page: { type: Number, default: 1 },
  total: { type: Number, default: 1 },
})
</script>
