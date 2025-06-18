<template>
  <nav aria-label="breadcrumb" class="breadcrumb-nav">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <router-link to="/" class="breadcrumb-link">
          <i class="bi bi-house-door me-1"></i>
          Trang chủ
        </router-link>
      </li>
      <li 
        v-for="(item, index) in breadcrumbItems" 
        :key="index"
        class="breadcrumb-item"
        :class="{ active: index === breadcrumbItems.length - 1 }"
      >
        <router-link 
          v-if="item.path && index !== breadcrumbItems.length - 1"
          :to="item.path"
          class="breadcrumb-link"
        >
          {{ item.text }}
        </router-link>
        <span v-else class="breadcrumb-current">
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed, onMounted, onUpdated } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const route = useRoute()

const breadcrumbItems = computed(() => {
  return props.items.length > 0 ? props.items : generateAutoBreadcrumb()
})

// Tự động tạo breadcrumb dựa trên route
const generateAutoBreadcrumb = () => {
  const pathArray = route.path.split('/').filter(path => path)
  const breadcrumb = []

  pathArray.forEach((path, index) => {
    const routePath = '/' + pathArray.slice(0, index + 1).join('/')
    let text = path

    // Custom text cho các route phổ biến
    switch (path) {
      case 'hotels':
        text = 'Khách sạn'
        break
      case 'search':
        text = 'Tìm kiếm'
        break
      case 'booking':
        text = 'Đặt phòng'
        break
      case 'admin':
        text = 'Quản trị'
        break
      case 'user':
        text = 'Tài khoản'
        break
      default:
        // Nếu là ID số, thử lấy tên từ store hoặc param
        if (/^\d+$/.test(path)) {
          text = `Chi tiết #${path}`
        } else {
          text = path.charAt(0).toUpperCase() + path.slice(1)
        }
    }

    breadcrumb.push({
      text,
      path: index === pathArray.length - 1 ? null : routePath
    })
  })

  return breadcrumb
}

// Tạo structured data cho breadcrumb
const generateBreadcrumbStructuredData = () => {
  const baseUrl = 'https://chillchill-hotel.com'
  
  const listItems = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Trang chủ",
      "item": baseUrl + "/"
    }
  ]

  breadcrumbItems.value.forEach((item, index) => {
    if (item.path) {
      listItems.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.text,
        "item": baseUrl + item.path
      })
    } else {
      // Last item (current page) - không có URL
      listItems.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.text
      })
    }
  })

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": listItems
  }
}

// Update structured data khi component mount hoặc update
const updateStructuredData = () => {
  // Xóa breadcrumb structured data cũ
  const existingScript = document.querySelector('script[type="application/ld+json"]#breadcrumb-seo')
  if (existingScript) {
    existingScript.remove()
  }

  // Thêm breadcrumb structured data mới
  if (breadcrumbItems.value.length > 0) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'breadcrumb-seo'
    script.textContent = JSON.stringify(generateBreadcrumbStructuredData())
    document.head.appendChild(script)
  }
}

onMounted(() => {
  updateStructuredData()
})

onUpdated(() => {
  updateStructuredData()
})
</script>

<style scoped>
.breadcrumb-nav {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.breadcrumb {
  background-color: transparent;
  padding: 0.5rem 0;
  margin-bottom: 0;
}

.breadcrumb-item {
  color: #6c757d;
}

.breadcrumb-item.active {
  color: #495057;
  font-weight: 500;
}

.breadcrumb-link {
  color: #FF5A5F;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #E04347;
  text-decoration: underline;
}

.breadcrumb-current {
  color: #495057;
  font-weight: 500;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
  margin: 0 0.5rem;
}
</style> 