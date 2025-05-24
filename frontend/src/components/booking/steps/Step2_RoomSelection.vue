<!-- src/components/booking/steps/Step2_RoomSelection.vue -->
<template>
  <div class="step2-room-selection py-4">
    <div class="filters-section mb-4 p-3 border rounded bg-light sticky-top-filters">
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label for="roomViewFilter" class="form-label small fw-medium">Room View</label>
          <select id="roomViewFilter" class="form-select form-select-sm" v-model="selectedFilters.roomView" @change="applyFilters">
            <option v-for="option in filterOptions.roomViews" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="collectionFilter" class="form-label small fw-medium">Hotel Collection</label>
          <select id="collectionFilter" class="form-select form-select-sm" v-model="selectedFilters.collection" @change="applyFilters">
            <option v-for="option in filterOptions.collections" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label for="currencyFilter" class="form-label small fw-medium">Currency</label>
          <select id="currencyFilter" class="form-select form-select-sm" v-model="selectedFilters.currency" @change="applyFilters">
            <option v-for="option in filterOptions.currencies" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="filteredRooms.length > 0" class="room-list">
      <div class="row g-4">
        <div v-for="room in filteredRooms" :key="room.id" class="col-12">
          <CustomCard
            :type="'roomOffer'"
            :image-url="room.imageUrl"
            :room-offer-data="room.details"
            @view-packages-clicked="handleViewPackages(room)"
            @view-details-clicked="handleViewDetails(room.id)"
          />
        </div>
      </div>
    </div>
    <div v-else class="text-center py-5">
      <p class="text-muted">No rooms available matching your criteria.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import CustomCard from '@/components/VueCard.vue';

const props = defineProps({
  searchParams: {
    type: Object,
    default: () => ({ checkInDate: null, checkOutDate: null, adults: 1 })
  }
});

const emit = defineEmits(['room-selected-for-packages', 'view-room-details-request']);

const filterOptions = reactive({
  roomViews: [
    { value: 'all', text: 'All Room Views' },
    { value: 'city', text: 'City View' },
    { value: 'beach', text: 'Beach View' },
    { value: 'mountain', text: 'Mountain View' },
  ],
  collections: [
    { value: 'all', text: 'All Hotel Collections' },
    { value: 'deluxe', text: 'Deluxe Collection' },
    { value: 'superior', text: 'Superior Collection' },
    { value: 'presidential', text: 'Presidential Collection' },
  ],
  currencies: [
    { value: 'vnd', text: 'VND' },
    { value: 'usd', text: 'USD' },
  ]
});

const selectedFilters = reactive({
  roomView: 'all',
  collection: 'all',
  currency: 'vnd'
});

const allRooms = ref([
  {
    id: 'deluxe001',
    imageUrl: 'https://i.imgur.com/LzHmNTc.png',
    details: {
      name: 'DELUXE ROOM',
      guests: 2,
      sqm: '45',
      cocktailBar: true,
      luxuriousBathroom: true,
      oldPrice: 9000000,
      newPrice: 7500000,
      bedsAvailable: 2,
      availabilityStatus: 'Available 5/4/2025 - 6/4/2025'
    },
    viewType: 'city',
    collectionType: 'deluxe'
  },
  {
    id: 'superior002',
    imageUrl: 'https://i.imgur.com/LzHmNTc.png',
    details: {
      name: 'SUPERIOR ROOM',
      guests: 3,
      sqm: '55',
      cocktailBar: false,
      luxuriousBathroom: true,
      oldPrice: 12000000,
      newPrice: 10000000,
      bedsAvailable: 1,
      availabilityStatus: 'Available'
    },
    viewType: 'beach',
    collectionType: 'superior'
  },
  {
    id: 'president003',
    imageUrl: 'https://i.imgur.com/LzHmNTc.png',
    details: {
      name: 'PRESIDENT SUITE',
      guests: 4,
      sqm: '120',
      cocktailBar: true,
      luxuriousBathroom: true,
      newPrice: 25000000,
      bedsAvailable: 0,
      availabilityStatus: 'Currently booked on 4/4/2025 - Then Booked.'
    },
    viewType: 'mountain',
    collectionType: 'presidential'
  }
]);

const applyFilters = () => {
  console.log('Applying filters:', JSON.parse(JSON.stringify(selectedFilters)));
};

const filteredRooms = computed(() => {
  return allRooms.value.filter(room => {
    const matchesView = selectedFilters.roomView === 'all' || room.viewType === selectedFilters.roomView;
    const matchesCollection = selectedFilters.collection === 'all' || room.collectionType === selectedFilters.collection;
    // Hiện tại chưa lọc theo searchParams (ngày, số khách) và currency
    return matchesView && matchesCollection;
  });
});

const handleViewPackages = (room) => {
  emit('room-selected-for-packages', { ...room }); // Gửi bản sao của object room
};

const handleViewDetails = (roomId) => {
  emit('view-room-details-request', roomId);
};

// Log props để kiểm tra giá trị nhận được từ BookingProcess
console.log('Step 2 - Search Params Received:', JSON.parse(JSON.stringify(props.searchParams)));
</script>

<style scoped>
.sticky-top-filters {
    top: 10px;
    z-index: 1000;
}
.room-list .col-12 {
  display: flex;
}
.room-list .col-12 > :deep(div) {
  width: 100%;
}
</style>