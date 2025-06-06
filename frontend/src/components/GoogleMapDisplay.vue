<template>
  <div class="google-map-display">
    <div v-if="hasValidCoordinates" class="map-container">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 v-if="title" class="mb-0">{{ title }}</h6>
        <div class="map-controls">
          <button
            v-if="showDirectionsButton"
            type="button"
            class="btn btn-sm btn-outline-primary me-2"
            @click="openDirections"
            :title="`Chỉ đường đến ${placeName || 'vị trí này'}`"
          >
            <i class="bi bi-signpost me-1"></i>
            Chỉ đường
          </button>
          <button
            v-if="showFullscreenButton"
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="openFullscreen"
            :title="`Xem bản đồ toàn màn hình`"
          >
            <i class="bi bi-arrows-fullscreen me-1"></i>
            Toàn màn hình
          </button>
        </div>
      </div>
      
      <div class="map-wrapper" :style="{ height: mapHeight }">
        <iframe
          v-if="embedUrl"
          :src="embedUrl"
          :width="width"
          :height="height"
          style="border:0;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          :title="`Bản đồ vị trí của ${placeName || 'khách sạn'}`"
        ></iframe>
        <div v-else class="map-placeholder d-flex align-items-center justify-content-center bg-light border">
          <div class="text-center text-muted">
            <i class="bi bi-geo-alt display-4"></i>
            <p class="mb-0">Không thể tải bản đồ</p>
            <small>Kiểm tra lại tọa độ hoặc API key</small>
          </div>
        </div>
      </div>

      <!-- Hiển thị thông tin tọa độ -->
      <div v-if="showCoordinates" class="mt-2">
        <small class="text-muted">
          <i class="bi bi-geo me-1"></i>
          Tọa độ: {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
          <span v-if="address" class="ms-2">
            <i class="bi bi-map me-1"></i>
            {{ address }}
          </span>
        </small>
      </div>
    </div>

    <!-- Hiển thị khi không có tọa độ -->
    <div v-else class="no-map-placeholder p-4 text-center bg-light border rounded">
      <i class="bi bi-geo-alt-slash display-4 text-muted"></i>
      <h6 class="mt-2 text-muted">{{ noCoordinatesMessage }}</h6>
      <p class="mb-0 small text-muted">
        Tọa độ địa lý chưa được thiết lập cho vị trí này.
      </p>
    </div>

    <!-- Hiển thị khi API key chưa được cấu hình -->
    <div v-if="!isApiKeyConfigured && hasValidCoordinates" class="mt-2 alert alert-warning small">
      <i class="bi bi-exclamation-triangle me-1"></i>
      Google Maps API Key chưa được cấu hình. Bản đồ có thể không hiển thị chính xác.
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { generateGoogleMapsEmbedUrl, generateGoogleMapsLink, validateCoordinates, isGoogleMapsApiKeyConfigured } from '@/utils/googleMapsApi';

const props = defineProps({
  latitude: {
    type: Number,
    required: false,
    default: null
  },
  longitude: {
    type: Number,
    required: false,
    default: null
  },
  placeName: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: '100%'
  },
  height: {
    type: [String, Number],
    default: 400
  },
  zoom: {
    type: Number,
    default: 15
  },
  showCoordinates: {
    type: Boolean,
    default: true
  },
  showDirectionsButton: {
    type: Boolean,
    default: true
  },
  showFullscreenButton: {
    type: Boolean,
    default: true
  },
  noCoordinatesMessage: {
    type: String,
    default: 'Vị trí chưa được thiết lập'
  }
});

const isApiKeyConfigured = ref(true);

onMounted(() => {
  isApiKeyConfigured.value = isGoogleMapsApiKeyConfigured();
});

// Computed properties
const hasValidCoordinates = computed(() => {
  return validateCoordinates(props.latitude, props.longitude);
});

const embedUrl = computed(() => {
  if (!hasValidCoordinates.value || !isApiKeyConfigured.value) {
    return '';
  }

  return generateGoogleMapsEmbedUrl(
    props.latitude,
    props.longitude,
    props.placeName,
    props.zoom
  );
});

const mapHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height;
});

// Methods
const openDirections = () => {
  if (!hasValidCoordinates.value) return;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${props.latitude},${props.longitude}`;
  window.open(directionsUrl, '_blank');
};

const openFullscreen = () => {
  if (!hasValidCoordinates.value) return;

  const mapsUrl = generateGoogleMapsLink(props.latitude, props.longitude, props.placeName);
  window.open(mapsUrl, '_blank');
};

// Expose methods for parent component
defineExpose({
  openDirections,
  openFullscreen,
  hasValidCoordinates
});
</script>

<style scoped>
.google-map-display {
  width: 100%;
}

.map-container {
  position: relative;
}

.map-wrapper {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-wrapper iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.map-placeholder {
  border-radius: 8px;
  min-height: 200px;
}

.no-map-placeholder {
  min-height: 200px;
}

.map-controls .btn {
  font-size: 0.875rem;
}

.map-controls .btn i {
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .map-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .map-controls .btn {
    font-size: 0.8rem;
  }
  
  .d-flex.justify-content-between.align-items-center {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 