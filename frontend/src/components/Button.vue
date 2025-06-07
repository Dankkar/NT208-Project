<!-- src/components/Button.vue -->
<template>
  <button :class="buttonClasses" :style="{ textAlign: textAlign }">
    <i v-if="iconMenu" v-show="iconMenu" :class="['bi', icon, { 'me-2': hasContent && iconMenu }]"></i>
    <span v-if="hasContent" class="w-100">{{ content }}</span>
    <i v-if="icon && !iconMenu" :class="['bi ps-1 pt-1', icon, { 'me-2': hasContent }]"></i>

  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // NỘI DUNG & ICON
  content: { type: String, default: '' },
  icon:    { type: String, default: '' },
  iconMenu: {type: Boolean, default: true},

  // BIẾN THỂ (STYLE)
  variant: {
    type: String,
    default: 'secondary',
    validator: (value) => ['primary', 'secondary', 'text', 'nav-dark', 'nav-light', 'outline', 'confirm'].includes(value),
  },

  // KÍCH THƯỚC (MỚI!)
  size: {
    type: String,
    default: 'md', // sm | md | lg
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  
  // HÀNH VI
  block:   { type: Boolean, default: false },
  
  // TÙY CHỈNH NÂNG CAO
  textAlign: { type: String, default: 'center' } 
});

const hasContent = computed(() => props.content && props.content.trim() !== '');

const buttonClasses = computed(() => {
  return [
    'btn-custom-base',
    `btn-${props.variant}`,
    `btn-${props.size}`, // <--- Thêm class kích thước
    {
      'btn-block-size': props.block,
    },
  ];
});
</script>

<style scoped>
/* 
 * NỀN TẢNG CỦA NÚT 
 */
.btn-custom-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* border: 1px solid #ccc;

  text-decoration: none; */
  border-radius: 6px; 
  border-color: transparent;





  
  transition: transform 0.2s ease-in-out, color 0.2s, background-color 0.2s;
  cursor: pointer;
  
  font-weight: 500;
}
.btn-custom-base:hover {
  transform: scale(1.05); 
}


.btn-md { /* Size mặc định (md - medium) */
  padding: 0.375rem 0.75rem; /* ~Bootstrap's py-2 px-3 */
  font-size: 1.15rem;
}
.btn-lg { /* Size lớn */
  padding: 0.5rem 1rem;
  font-size: 1.25rem;
}
.btn-sm { /* Size nhỏ */
  padding: 0.25rem 0.5rem; /* py-1 px-2 */
  font-size: 0.875rem;
}


/* ==================================================== */
/*                      BIẾN THỂ                      */
/* ==================================================== */

/* === BIẾN THỂ "SECONDARY" (Nút mặc định) === */
.btn-secondary {
  background-color: var(--light-gray, #f8f9fa); 
  color: var(--primary-color, #212529);
  border-color:none;
}
.btn-secondary:hover {
  background-color: var(--white-color, #fff); 
  color: black;
  border-color:none;
}

/* === BIẾN THỂ "PRIMARY" (Nút cam) === */
.btn-primary {
  background-color: var(--accent-color, #ff7f00);
  color: var(--white-color, #fff);
  /* border-color: var(--accent-color, #ff7f00); */
  font-weight: bold;
}
.btn-primary:hover {
  background-color: var(--accent-color-dark, #e67300);
  border-color: var(--accent-color-dark, #e67300);
}

/* === BIẾN THỂ "TEXT" (Nút dạng link) === */
.btn-text {
  background-color: transparent;
  color: var(--primary-color, #212529);
  border-color: transparent;
}
.btn-text:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--accent-color, #ff7f00);
}

/* Nút cho Navbar nền trong suốt (chữ trắng) */
.btn-nav-light {
  background-color: transparent;
  color: white !important; /* Dùng !important để đảm bảo ghi đè */
  border-color: transparent;
}
.btn-nav-light:hover {
  color: white !important;
  background-color: rgba(0, 0, 0, 0.05);

}

/* Nút cho Navbar nền trắng (chữ đen) */
.btn-nav-dark {
  background-color: transparent;
  color: #212529 !important; /* Dùng !important để đảm bảo ghi đè */
  border-color: transparent;
}
.btn-nav-dark:hover {
  color: var(--accent-color, #0d6efd) !important;
  background-color: rgba(0, 123, 255, 0.1);
}


/* Biến thế outline */

.btn-outline {
  background-color: transparent;
  color: white !important;
  border: 3px solid var(--border-subtle, #0d6efd);
  font-weight: bold;
}
.btn-outline:hover {
  background-color: var(--accent-color, #0d6efd);
  color: var(--white-color, #fff) !important;
  border: none;
}

.btn-confirm {
  background-color: #1a1a1a;
  color: white; 
  border: none; 
  font-weight: 600; 
  padding: 0.25rem 1rem;
  margin-top: 0.25rem;
}

.btn-confirm:hover {
  background-color: #343a40;
  color: white;  
}



/* 
 * CLASS FULL-WIDTH
 */
.btn-block-size {
  width: 100%;
}
</style>