<!-- src/components/booking/steps/Step2_RoomSelection.vue -->
<template>
  <div class="step2-room-selection py-4">
    <!-- Loading lớn ban đầu -->
    <div v-if="bookingStore.isLoadingRooms && initialLoad" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading rooms...</span>
      </div>
      <p class="mt-3 text-muted h5">Finding available rooms for you...</p>
    </div>

    <!-- Lỗi: ĐÃ CÓ ĐƠN ĐANG GIỮ -->
    <div v-else-if="bookingStore.holdError && bookingStore.holdError.includes('Bạn đã có một đơn đặt phòng đang được giữ')"
         class="alert alert-warning text-center">
      <h5 class="alert-heading">Action Required</h5>
      <p>{{ bookingStore.holdError }}</p>
      <hr>
      <button class="btn btn-primary me-2" @click="resumeHeldBooking" :disabled="isRetrying">
        <i class="bi bi-arrow-right-circle-fill me-1"></i> Continue with Held Booking
      </button>
      <button class="btn btn-outline-secondary me-2" @click="goToMyBookingsPage" :disabled="isRetrying">
        <i class="bi bi-list-check me-1"></i> View My Bookings
      </button>
      <button class="btn btn-outline-danger" @click="discardHoldAndSearchNew" :disabled="isRetrying">
         <span v-if="isRetrying" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
         <i v-if="!isRetrying" class="bi bi-trash me-1"></i>
         {{ isRetrying ? 'Processing...' : 'Discard Hold & Search New' }}
      </button>
    </div>

    <!-- Lỗi khác từ Store -->
    <div v-else-if="bookingStore.roomsError || bookingStore.holdError" class="alert alert-danger text-center">
      <p class="mb-1"><strong>{{ bookingStore.holdError ? 'Could not hold the room.' : 'Could not load rooms.' }}</strong></p>
      <p>{{ bookingStore.holdError || bookingStore.roomsError }}</p>
      <button class="btn btn-sm btn-primary" @click="retryGeneralError" :disabled="isRetrying || bookingStore.isLoadingRooms">
        <span v-if="isRetrying || bookingStore.isLoadingRooms" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        {{ (isRetrying || bookingStore.isLoadingRooms) ? 'Processing...' : 'Try Again' }}
      </button>
      <button class="btn btn-sm btn-link ms-2" @click="goToStep1AndClearIntent">Modify Search</button>
    </div>

    <!-- Danh sách phòng -->
    <div v-else-if="roomsToDisplay && roomsToDisplay.length > 0" class="room-list">
      <div v-if="showIntentFailedMessage" class="alert alert-info text-center small py-2"> <!-- Đổi sang alert-info -->
        The room you initially selected ({{ bookingStore.preselectedIntent?.roomName || 'your previously eyed room' }}
        at {{ bookingStore.preselectedIntent?.hotelName || 'the hotel' }})
        is not available for the chosen dates. Please explore other options below or change your search.
      </div>
      <div class="text-muted mb-3 small d-flex justify-content-between align-items-center" v-if="bookingStore.searchCriteria">
        <span>
          Showing results for:
          {{ bookingStore.searchCriteria.startDate }} to {{ bookingStore.searchCriteria.endDate }}
          - {{ bookingStore.searchCriteria.numberOfGuests }} guest(s).
        </span>
        <a href="#" @click.prevent="goToStep1AndClearIntent" class="ms-2">Change search</a>
      </div>
      <div class="row g-4">
        <div v-for="hotel in roomsToDisplay" :key="hotel.MaKS" class="col-12">
          <VueCard1
            :hotelData="hotel"
            :imageUrl="hotel.HinhAnhKS"
            @room-selected="(selectedRoomInfo) => handleRoomSelection(hotel, selectedRoomInfo)"
            @alternative-date-selected="(payload) => handleAlternativeDateSelection(hotel, payload)"
          />
        </div>
      </div>
    </div>

    <!-- Không có phòng nào -->
    <div v-else class="text-center py-5">
      <p class="text-muted h5">No rooms available for your current selection.</p>
      <p class="mb-3">Try modifying your search criteria for more options.</p>
      <button class="btn btn-primary" @click="goToStep1AndClearIntent">Modify Search</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, defineEmits } from 'vue';
import { format } from 'date-fns';
import VueCard1 from '../../vueCard1.vue'; // Giả định đường dẫn đúng
import { useBookingStore } from '@/store/bookingStore';
import { useRouter } from 'vue-router';
// import axios from 'axios'; // Nếu cần gọi API release-hold trực tiếp

const emit = defineEmits(['room-hold-requested']);

const bookingStore = useBookingStore();
const router = useRouter();
const isRetrying = ref(false);
const initialLoad = ref(true);
const showIntentFailedMessage = ref(false);

const roomsToDisplay = computed(() => bookingStore.availableHotelsAndRooms);

onMounted(() => { /* ... giữ nguyên ... */ });
watch(() => bookingStore.preselectedIntent, (newIntent) => { /* ... giữ nguyên ... */ }, { immediate: true });

function extractEssentialHotelInfo(fullHotelInfo) {
  return {
    MaKS: fullHotelInfo.MaKS, TenKS: fullHotelInfo.TenKS, DiaChi: fullHotelInfo.DiaChi,
    HangSao: fullHotelInfo.HangSao, LoaiHinh: fullHotelInfo.LoaiHinh, MoTaChung: fullHotelInfo.MoTaChung,
    SoDienThoaiKS: fullHotelInfo.SoDienThoaiKS, EmailKS: fullHotelInfo.EmailKS,
    UrlBanDoKS: fullHotelInfo.UrlBanDoKS, HinhAnhKS: fullHotelInfo.HinhAnhKS,
  };
}

const handleRoomSelection = (fullHotelInfo, roomInfoFromCard) => {
  if (roomInfoFromCard.SoPhongTrong <= 0) {
    bookingStore.roomsError = "This room just became unavailable. Please try again or choose another.";
    return;
  }
  const essentialHotelInfo = extractEssentialHotelInfo(fullHotelInfo);
  emit('room-hold-requested', { hotelInfo: essentialHotelInfo, roomInfo: roomInfoFromCard });
};

async function handleAlternativeDateSelection(originalHotelData, payloadFromCard) {
  const { roomInfo: originalRoomInfo, suggestedDates } = payloadFromCard;
  if (!bookingStore.searchCriteria) return;

  isRetrying.value = true; initialLoad.value = false; showIntentFailedMessage.value = false;
  const newSearchCriteria = { /* ... (như cũ) ... */ };
  await bookingStore.setSearchCriteriaAndFetchRooms(newSearchCriteria);
  if (bookingStore.roomsError) { isRetrying.value = false; return; }

  const updatedHotelData = bookingStore.availableHotelsAndRooms.find(h => h.MaKS === originalHotelData.MaKS);
  if (updatedHotelData) {
    const targetRoomInNewSearch = updatedHotelData.roomTypes.find(rt => rt.MaLoaiPhong === originalRoomInfo.MaLoaiPhong);
    if (targetRoomInNewSearch && targetRoomInNewSearch.SoPhongTrong > 0) {
      const essentialHotelInfo = extractEssentialHotelInfo(updatedHotelData);
      emit('room-hold-requested', { hotelInfo: essentialHotelInfo, roomInfo: targetRoomInNewSearch });
    } else { /* ... (log như cũ) ... */ }
  } else { /* ... (log như cũ) ... */ }
  isRetrying.value = false;
}

async function resumeHeldBooking() { /* ... như đã implement ở trên ... */ }
function goToMyBookingsPage() { /* ... như đã implement ở trên ... */ }
async function discardHoldAndSearchNew() { /* ... như đã implement ở trên ... */ }

async function retryGeneralError() { // Đổi tên từ retryLastAction
  if (bookingStore.roomsError && bookingStore.searchCriteria) {
    isRetrying.value = true; initialLoad.value = false;
    await bookingStore.setSearchCriteriaAndFetchRooms(bookingStore.searchCriteria);
    isRetrying.value = false;
  } else { goToStep1AndClearIntent(); }
}

function goToStep1AndClearIntent() { /* ... như đã implement ở trên ... */ }
</script>

<style scoped>
.room-list .col-12 {
  display: flex;
}
.room-list .col-12 > :deep(div) {
  width: 100%;
}
/* Thêm CSS cho thông báo intent failed nếu muốn */
.alert-warning {
    /* styles */
}
</style>