<!-- src/components/Carousel.vue -->
<template>
  <div>
    <div class="row">
      <div class="col-md-4" v-for="item in visibleItems" :key="itemKey(item)">
        <slot :item="item" />
      </div>
    </div>
    <div class="d-flex justify-content-center mt-3">
      <button class="btn btn-outline-primary me-2" @click="prev" :disabled="currentIndex === 0">
        &lt;
      </button>
      <button class="btn btn-outline-primary" @click="next" :disabled="currentIndex + itemsPerPage >= items.length">
        &gt;
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
const props = defineProps({
  items: { type: Array, required: true },
  itemsPerPage: { type: Number, default: 3 },
  itemKey: { type: Function, default: item => item.id || item.MaKS || item.MaDV || item.key }
})
const currentIndex = ref(0)
const visibleItems = computed(() => props.items.slice(currentIndex.value, currentIndex.value + props.itemsPerPage))
function next() {
  if (currentIndex.value + props.itemsPerPage < props.items.length) {
    currentIndex.value += props.itemsPerPage
  }
}
function prev() {
  if (currentIndex.value - props.itemsPerPage >= 0) {
    currentIndex.value -= props.itemsPerPage
  }
}
watch(() => props.items, () => { currentIndex.value = 0 })
</script>

<style scoped>
.row { min-height: 1px; }
</style> 