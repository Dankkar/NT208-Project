<!-- src/components/Post.vue -->
<template>
  <div class="post-section mb-5 mx-5">
    <div class="row g-0 align-items-stretch">
      <!-- Text block: 7/12 -->
      <div :class="['col-lg-7 col-md-12', reverse ? 'order-lg-2' : '']">
        <div class="text-block d-flex flex-column justify-content-center p-5 h-100">
          <slot name="title"></slot>
          <ul class="benefits-list mt-3 mb-4">
            <li v-for="(content, idx) in contents" :key="idx">{{ content }}</li>
          </ul>
          <div>
            <Button
              v-if="buttonText"
              :content="buttonText"
              @click="onAction"
            />
          </div>
        </div>
      </div>

      <!-- Image block: 5/12 -->
      <div :class="['col-lg-5 col-md-12', reverse ? 'order-lg-1' : '']">
        <div class="img-wrapper mx-auto">
          <img :src="imgSrc" alt="" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue'

defineProps({
  contents: { type: Array, default: () => [] },
  buttonText: String,
  imgSrc: String,
  reverse: { type: Boolean, default: false }
})

const emit = defineEmits(['action'])
function onAction() {
  emit('action')
}
</script>

<style scoped>
.post-section {
  background: #f5f5f5;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Text area */
.text-block {
  background: #fff;
  border-radius: 0; /* chỉ bo ở wrapper */
}
.text-block slot[name="title"] h2 {
  margin: 0;
  font-size: 1.75rem;
}
.benefits-list {
  list-style: inside disc;
  padding-left: 1rem;
  color: #333;
}
.benefits-list li {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

/* Image area */
.img-wrapper {
  max-width: 100%;
  overflow: hidden;
  border-radius: 0;
}
.img-wrapper img {
  width: 100%;
  height: 80%;
  object-fit: contain;
  transition: transform .4s ease;
}
.img-wrapper:hover img {
  transform: scale(1.05);
}

/* Responsive: trên mobile, text & ảnh xếp dọc */
@media (max-width: 767px) {
  .img-wrapper {
    height: 200px;
  }
}
</style>
