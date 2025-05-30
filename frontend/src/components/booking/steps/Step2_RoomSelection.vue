<!-- src/components/booking/steps/Step2_RoomSelection.vue -->
<template>
  <div class="step2-room-selection py-4">
    <div v-if="bookingStore.isLoadingRooms && initialLoad" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading rooms...</span>
      </div>
      <p class="mt-3 text-muted h5">Finding available rooms for you...</p>
    </div>

    <div v-else-if="bookingStore.roomsError" class="alert alert-danger text-center">
      <p class="mb-1"><strong>Could not load rooms.</strong></p>
      <p>{{ bookingStore.roomsError }}</p>
      <button class="btn btn-sm btn-primary" @click="retryFetchRooms" :disabled="isRetrying">
        <span v-if="isRetrying" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        {{ isRetrying ? 'Retrying...' : 'Try Again' }}
      </button>
      <button class="btn btn-sm btn-link ms-2" @click="goToStep1">Modify Search</button>
    </div>

    <div v-else-if="roomsToDisplay && roomsToDisplay.length > 0" class="room-list">
      <div class="text-muted mb-3 small" v-if="bookingStore.searchCriteria">
        Showing results for:
        {{ bookingStore.searchCriteria.startDate }} to {{ bookingStore.searchCriteria.endDate }}
        - {{ bookingStore.searchCriteria.numberOfGuests }} guest(s).
        <a href="#" @click.prevent="goToStep1" class="ms-2">Change search</a>
      </div>
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
      <p class="text-muted h5">No rooms available for your current selection.</p>
      <p class="mb-3">Try modifying your search criteria for more options.</p>
      <button class="btn btn-primary" @click="goToStep1">Modify Search</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'; // THÊM `watch` VÀO ĐÂY
import VueCard1 from '../../vueCard1.vue';
import { useBookingStore } from '@/store/bookingStore';

const bookingStore = useBookingStore();
const isRetrying = ref(false);
const initialLoad = ref(true); 

const roomsToDisplay = computed(() => bookingStore.availableHotelsAndRooms);

onMounted(() => {
    if (!bookingStore.isLoadingRooms) {
        initialLoad.value = false;
    }
    const unwatchLoading = watch(() => bookingStore.isLoadingRooms, (newValue) => {
        if (!newValue) {
            initialLoad.value = false;
            if(unwatchLoading) unwatchLoading(); // Hủy watch sau khi hoàn tất lần tải đầu
        }
    }, { immediate: false }); // immediate: false vì onMounted đã check initial state
});


const handleRoomChosen = (fullHotelInfo, roomInfoFromCard) => {
  const essentialHotelInfo = {
    MaKS: fullHotelInfo.MaKS,
    TenKS: fullHotelInfo.TenKS,
    DiaChi: fullHotelInfo.DiaChi,
    HangSao: fullHotelInfo.HangSao,
    LoaiHinh: fullHotelInfo.LoaiHinh,
    MoTaChung: fullHotelInfo.MoTaChung,
    SoDienThoaiKS: fullHotelInfo.SoDienThoaiKS,
    EmailKS: fullHotelInfo.EmailKS,
    UrlBanDoKS: fullHotelInfo.UrlBanDoKS,
    HinhAnhKS: fullHotelInfo.HinhAnhKS,
  };
  bookingStore.selectRoomAndHotel({
    hotelInfo: essentialHotelInfo,
    roomInfo: roomInfoFromCard 
  });
};

async function retryFetchRooms() {
  if (bookingStore.searchCriteria) {
    isRetrying.value = true;
    initialLoad.value = false;
    await bookingStore.setSearchCriteriaAndFetchRooms(bookingStore.searchCriteria);
    isRetrying.value = false;
  } else {
    goToStep1();
  }
}

function goToStep1() {
  bookingStore.navigateToStep(1);
}
</script>

<style scoped>
.room-list .col-12 {
  display: flex;
}
.room-list .col-12 > :deep(div) { 
  width: 100%; 
}
</style>