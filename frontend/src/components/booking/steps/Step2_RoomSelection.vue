<!-- src/components/booking/steps/Step2_RoomSelection.vue -->
<template>
  <div class="step2-room-selection py-4">
    <div v-if="bookingStore.isLoadingRooms" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading rooms...</span>
      </div>
      <p class="mt-2 text-muted">Finding available rooms...</p>
    </div>

    <div v-else-if="bookingStore.roomsError" class="alert alert-danger text-center">
      <p class="mb-1"><strong>Could not load rooms.</strong></p>
      <p>{{ bookingStore.roomsError }}</p>
      <button class="btn btn-sm btn-primary" @click="retryFetchRooms">Try Again</button>
    </div>

    <div v-else-if="roomsToDisplay && roomsToDisplay.length > 0" class="room-list">
      <div class="row g-4">
        <div v-for="hotel in roomsToDisplay" :key="hotel.MaKS" class="col-12">
          <VueCard1
            :hotelData="hotel"
            :imageUrl="hotel.HinhAnhKS"
            @room-selected="(selectedRoomInfo) => handleRoomChosen(hotel, selectedRoomInfo)"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-5">
      <p class="text-muted h5">No rooms available for your selection.</p>
      <button class="btn btn-link" @click="goToStep1">Modify Search</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import VueCard1 from '../../vueCard1.vue';
import { useBookingStore } from '@/store/bookingStore';

const bookingStore = useBookingStore();

const roomsToDisplay = computed(() => bookingStore.availableHotelsAndRooms);

onMounted(() => {
  if (bookingStore.rawSearchCriteria && bookingStore.availableHotelsAndRooms.length === 0 && !bookingStore.isLoadingRooms && !bookingStore.roomsError) {
    bookingStore.fetchAvailableRooms();
  }
});

watch(() => bookingStore.rawSearchCriteria, (newCriteria, oldCriteria) => {
  if (newCriteria && (JSON.stringify(newCriteria) !== JSON.stringify(oldCriteria))) {
    bookingStore.fetchAvailableRooms();
  }
}, { deep: true });

const handleRoomChosen = (fullHotelInfo, roomInfoFromCard) => {
  const essentialHotelInfo = {
    MaKS: fullHotelInfo.MaKS,
    TenKS: fullHotelInfo.TenKS,
    DiaChi: fullHotelInfo.DiaChi,
    HangSao: fullHotelInfo.HangSao,
    LoaiHinh: fullHotelInfo.LoaiHinh,
    MoTaChung: fullHotelInfo.MoTaChung,
    HinhAnhKS: fullHotelInfo.HinhAnhKS,
  };
  bookingStore.selectRoomAndHotel({
    hotelInfo: essentialHotelInfo,
    roomInfo: roomInfoFromCard
  });
};

function retryFetchRooms() {
  bookingStore.fetchAvailableRooms();
}

function goToStep1() {
  bookingStore.navigateToStep(1);
}
</script>

<style scoped>
.room-list .col-12 { display: flex; }
.room-list .col-12 > :deep(div) { width: 100%; }
</style>