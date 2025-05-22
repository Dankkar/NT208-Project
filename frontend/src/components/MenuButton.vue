<template>
  <div>
    <!-- Nút gọi menu -->
    <Button
      content="MENU"
      isMenu
      :textColor="textColor"
      :colorHover="colorHover"
      :fontSize="fontSize"
      @click="show = !show"
    />

    <!-- Teleport overlay -->
    <teleport to="body">
      <transition name="slide">
        <div
          v-if="show"
          class="overlay"
          @click.self="closeMenu"
        >
          <nav class="sidebar" @click.stop>
            <div class="sidebar-header d-flex justify-content-between align-items-center mb-3">
              <h2 class="fw-bold text-uppercase mb-0">CHILL CHILL</h2>
              <button
                type="button"
                class="btn-close d-md-none"
                @click="closeMenu"
                aria-label="Close menu"
              ></button>
            </div>
            <ul class="list-unstyled mb-auto flex-grow-1">
              <li v-for="item in items" :key="item" class="mb-2">
                <Button
                  :content="item"
                  block
                  textColor="black"
                  @click="handleMenuItemClick"
                />
              </li>
            </ul>
            <div>
              <Button
                content="Log Out"
                block
                textColor="black"
                @click="handleMenuItemClick"
              />
            </div>
          </nav>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Button from './Button.vue'

const props = defineProps({
  textColor:   { type: String, default: 'white' },
  colorHover:  { type: String, default: '#white' },
  fontSize:    { type: String, default: '16px' },
  items:      { type: Array, default: () => ['Stay', 'Shop', 'Dine', 'See & Do'] }
})

const show = ref(false)

const closeMenu = () => {
  show.value = false
}

const handleMenuItemClick = () => {
  closeMenu()
}

const handleEscKey = (e) => {
  if (e.key === 'Escape' && show.value) {
    closeMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})

watch(show, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* ...giữ nguyên phần CSS như cũ... */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  z-index: 1040;
}
.sidebar {
  height: 100%;
  width: 80vw;
  max-width: 280px;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.sidebar-header .btn-close {
  font-size: 0.85rem;
}
@media (min-width: 768px) {
  .sidebar {
    width: 20vw;
    max-width: 260px;
  }
  .sidebar-header .btn-close {
    display: none;
  }
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>