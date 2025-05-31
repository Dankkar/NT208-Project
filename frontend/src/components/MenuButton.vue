<template>
  <div>
    <!-- Nút gọi menu (ví dụ: "MENU") -->
    <Button
      content="MENU"
      isMenu
      btnLight
      btnLink
      @click="toggleMenu"
      :textColor="textColor"
      class="fw-bold"
    />

    <!-- Teleport overlay -->
    <teleport to="body">
      <transition name="slide">
        <div v-if="show" class="overlay" @click.self="closeMenu">
          <nav class="sidebar" @click.stop>
            <div class="sidebar-header d-flex justify-content-between align-items-center mb-3">
              <h2 class="fw-bold text-uppercase mb-0">CHILL CHILL</h2>
              <button
                type="button"
                class="btn-close"
                @click="closeMenu"
                aria-label="Close menu"
              ></button>
            </div>

            <!-- Danh sách các mục menu -->
            <ul class="list-unstyled mb-auto flex-grow-1">
              <!-- Bỏ :key ở đây -->
              <template v-for="(item, index) in items">
                <!-- Xử lý Divider -->
                <li v-if="item.type === 'divider'"
                    :key="`divider-${index}`"
                    class="my-2">
                  <hr />
                </li>

                <!-- Xử lý Item thông thường (bao gồm cả các item trước đây có subItems) -->
                <li v-else-if="item.label"
                    :key="item.label || `item-${index}`"
                    class="mb-2">
                  <Button
                    :content="item.label"
                    :icon="item.icon"
                    block
                    textColor="black"
                    btnLight
                    btnLink
                    bgHover="#f0f0f0"
                    @click="handleNavigation(item)"
                  />
                </li>
                <!-- Bạn có thể cần một `v-else` hoặc xử lý khác nếu có trường hợp item không có type 'divider' và cũng không có 'label' -->
                <!-- Ví dụ: <li v-else :key="`unknown-item-${index}`">Mục không xác định</li> -->
              </template>
            </ul>
          </nav>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
// ... Script của bạn giữ nguyên ...
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from './Button.vue';

const props = defineProps({
  textColor: { type: String, default: 'white' },
  items: { type: Array, default: () => [] },
});

const show = ref(false);
const router = useRouter();

const toggleMenu = () => {
  show.value = !show.value;
};

const closeMenu = () => {
  show.value = false;
};

const handleNavigation = (menuItem) => {
  if (menuItem.action) {
    menuItem.action();
  } else if (menuItem.path) {
    router.push(menuItem.path);
  }
  closeMenu();
};

const handleEscKey = (e) => {
  if (e.key === 'Escape' && show.value) {
    closeMenu();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleEscKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey);
});

watch(show, (newValue) => {
  document.body.style.overflow = newValue ? 'hidden' : '';
});
</script>

<style scoped>
/* ... CSS của bạn giữ nguyên ... */
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
}
.sidebar-header .btn-close {
  font-size: 0.85rem;
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

:deep(.btn .bi) {
  margin-right: 0.5rem;
}
</style>