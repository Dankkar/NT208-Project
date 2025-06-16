<template>
  <div class="row align-items-center mb-5 mx-5">
    <div :class="['col-md-6', reverse ? 'order-md-2' : '']">
      <div class="text-block p-4">
        <slot name="title"></slot>
        <p v-for="(content, idx) in contents" :key="idx" class="mb-3">{{ content }}</p>
        <Button v-if="buttonText" :content="buttonText" />
      </div>
    </div>
    <div :class="['col-md-6', reverse ? 'order-md-1' : '']">
      <img :src="imgSrc" alt="Scenic" class="img-fluid rounded" />
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue'
defineProps({
  contents: { type: Array, default: () => [] }, // nhận mảng content động
  buttonText: String,
  imgSrc: String,
  reverse: { type: Boolean, default: false }
})
</script>

<style scoped>
.text-block {
  background: #e0e4f1;
  border-radius: 8px;
}
.text-block p {
  color: #333;
}
</style>