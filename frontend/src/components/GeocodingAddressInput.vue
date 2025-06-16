<template>
  <div class="geocoding-address-input">
    <label :for="inputId" class="form-label">
      {{ label }} <span v-if="required" class="text-danger">*</span>
    </label>
    
    <div class="input-group">
      <input
        :id="inputId"
        v-model="localAddress"
        type="text"
        class="form-control"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled || isGeocoding"
        @blur="handleAddressChange"
        @keyup.enter="handleAddressChange"
      />
      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="disabled || isGeocoding || !localAddress.trim()"
        @click="handleAddressChange"
        :title="isGeocoding ? 'Đang lấy tọa độ...' : 'Lấy tọa độ từ địa chỉ'"
      >
        <span v-if="isGeocoding" class="spinner-border spinner-border-sm me-1"></span>
        <i v-else class="bi bi-geo-alt me-1"></i>
        {{ isGeocoding ? 'Đang xử lý...' : 'Lấy tọa độ' }}
      </button>
    </div>

    <!-- Hiển thị thông tin tọa độ nếu có -->
    <div v-if="coordinates && coordinates.latitude && coordinates.longitude" class="mt-2 p-2 bg-light border rounded">
      <small class="text-success">
        <i class="bi bi-check-circle me-1"></i>
        <strong>Tọa độ:</strong> {{ coordinates.latitude.toFixed(6) }}, {{ coordinates.longitude.toFixed(6) }}
        <span v-if="coordinates.formattedAddress" class="d-block mt-1">
          <strong>Địa chỉ chuẩn hóa:</strong> {{ coordinates.formattedAddress }}
        </span>
      </small>
    </div>

    <!-- Hiển thị lỗi -->
    <div v-if="error" class="mt-2 text-danger small">
      <i class="bi bi-exclamation-triangle me-1"></i>
      {{ error }}
    </div>

    <!-- Thông báo trạng thái API -->
    <div v-if="!isApiKeyConfigured" class="mt-2 alert alert-warning small">
      <i class="bi bi-exclamation-triangle me-1"></i>
      Google Maps API Key chưa được cấu hình. Tính năng lấy tọa độ tự động không khả dụng.
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { getCoordinatesFromAddress, isGoogleMapsApiKeyConfigured } from '@/utils/googleMapsApi';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  coordinates: {
    type: Object,
    default: () => null
  },
  label: {
    type: String,
    default: 'Địa chỉ'
  },
  placeholder: {
    type: String,
    default: 'Nhập địa chỉ khách sạn'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  inputId: {
    type: String,
    default: () => `address-input-${Math.random().toString(36).substr(2, 9)}`
  },
  autoGeocode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'update:coordinates', 'geocoding-success', 'geocoding-error']);

const localAddress = ref(props.modelValue);
const isGeocoding = ref(false);
const error = ref('');
const isApiKeyConfigured = ref(true);

// Computed property để theo dõi việc thay đổi địa chỉ
const hasAddressChanged = computed(() => {
  return localAddress.value !== props.modelValue;
});

onMounted(() => {
  isApiKeyConfigured.value = isGoogleMapsApiKeyConfigured();
});

// Watch để đồng bộ với parent component
watch(() => props.modelValue, (newValue) => {
  localAddress.value = newValue;
});

watch(localAddress, (newValue) => {
  emit('update:modelValue', newValue);
  
  // Auto geocode if enabled and address is sufficient
  if (props.autoGeocode && newValue && newValue.length > 10) {
    const debounceTimer = setTimeout(() => {
      handleAddressChange();
    }, 1000);
    
    return () => clearTimeout(debounceTimer);
  }
});

const handleAddressChange = async () => {
  if (!localAddress.value || !localAddress.value.trim()) {
    error.value = '';
    emit('update:coordinates', null);
    return;
  }

  if (!isApiKeyConfigured.value) {
    error.value = 'Google Maps API Key chưa được cấu hình';
    return;
  }

  isGeocoding.value = true;
  error.value = '';

  try {
    const result = await getCoordinatesFromAddress(localAddress.value.trim());
    emit('update:coordinates', result);
    emit('geocoding-success', result);
    
    console.log('Geocoding success:', result);
  } catch (err) {
    error.value = err.message || 'Không thể lấy tọa độ từ địa chỉ này';
    emit('update:coordinates', null);
    emit('geocoding-error', err);
    
    console.error('Geocoding error:', err);
  } finally {
    isGeocoding.value = false;
  }
};

// Expose methods for parent component
defineExpose({
  geocode: handleAddressChange,
  isGeocoding: computed(() => isGeocoding.value),
  error: computed(() => error.value)
});
</script>

<style scoped>
.geocoding-address-input .input-group .btn {
  border-left: none;
}

.geocoding-address-input .form-control:focus + .btn {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style> 