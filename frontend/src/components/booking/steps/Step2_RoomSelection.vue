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
      <p class="small text-muted" v-if="bookingStore.heldBookingExpiresAt">
        Your current hold will expire in approximately: {{ formatTimeUntilExpiry(bookingStore.heldBookingExpiresAt) }}
      </p>
      <hr>
      <div v-if="resumeError" class="alert alert-danger small py-2">{{ resumeError }}</div>
      <button class="btn btn-primary me-2" @click="resumeHeldBooking" :disabled="isProcessingAction">
        <i class="bi bi-arrow-right-circle-fill me-1"></i> Continue with Held Booking
      </button>
      <button class="btn btn-outline-secondary me-2" @click="goToMyBookingsPage" :disabled="isProcessingAction">
        <i class="bi bi-list-check me-1"></i> View My Bookings
      </button>
          <button class="btn btn-outline-info" @click="waitForHoldToExpire" :disabled="isProcessingAction">
          <i class="bi bi-hourglass-split me-1"></i> I'll Wait for Current Hold to Expire
        </button>

    </div>

    <!-- Lỗi khác từ Store -->
    <div v-else-if="bookingStore.roomsError || bookingStore.holdError" class="alert alert-danger text-center">
      <p class="mb-1"><strong>{{ bookingStore.holdError ? 'Could not hold the room.' : 'Could not load rooms.' }}</strong></p>
      <p>{{ bookingStore.holdError || bookingStore.roomsError }}</p>
      <button class="btn btn-sm btn-primary" @click="retryGeneralError" :disabled="isProcessingAction || bookingStore.isLoadingRooms">
        <span v-if="(isProcessingAction && actionName === 'retryGeneral') || bookingStore.isLoadingRooms" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        {{ ((isProcessingAction && actionName === 'retryGeneral') || bookingStore.isLoadingRooms) ? 'Retrying...' : 'Try Again' }}
      </button>
      <button class="btn btn-sm btn-link ms-2" @click="goToStep1AndClearIntent">Modify Search</button>
    </div>

    <!-- Danh sách phòng -->
    <div v-else-if="roomsToDisplay && roomsToDisplay.length > 0" class="room-list">
      <div v-if="showIntentFailedMessage" class="alert alert-info text-center small py-2">
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
import { computed, ref, onMounted, watch, defineEmits, onBeforeUnmount } from 'vue';
import { format, formatDistanceToNowStrict } from 'date-fns';
import VueCard1 from '../../vueCard1.vue';
import { useBookingStore } from '@/store/bookingStore';
import { useRouter } from 'vue-router';

const holdExpiryTimerInterval = ref(null); // Interval cho timer hiển thị
const timeUntilExpiryDisplay = ref(''); // Chuỗi hiển thị thời gian còn lại

const formatTimeUntilExpiry = (expiryTimestamp) => {
  if (!expiryTimestamp) return '';
  const timeLeft = expiryTimestamp - Date.now();
  if (timeLeft <= 0) return 'Expired';
  return formatDistanceToNowStrict(new Date(expiryTimestamp), { addSuffix: false }); // Ví dụ: "14 minutes", "2 hours"
};

const updateHoldExpiryDisplay = () => {
    if (bookingStore.heldBookingExpiresAt && bookingStore.holdError && bookingStore.holdError.includes('Bạn đã có một đơn đặt phòng đang được giữ')) {
        const timeLeftValue = bookingStore.heldBookingExpiresAt - Date.now();
        if (timeLeftValue > 0) {
            timeUntilExpiryDisplay.value = formatDistanceToNowStrict(new Date(bookingStore.heldBookingExpiresAt), { addSuffix: true });
        } else {
            timeUntilExpiryDisplay.value = 'Expired. You can try holding a room again.';
            if (holdExpiryTimerInterval.value) clearInterval(holdExpiryTimerInterval.value);
          
        }
    } else {  
         timeUntilExpiryDisplay.value = '';
         if (holdExpiryTimerInterval.value) clearInterval(holdExpiryTimerInterval.value);
    }
};


const emit = defineEmits(['room-hold-requested']);

const bookingStore = useBookingStore();
const router = useRouter();
const isProcessingAction = ref(false);
const actionName = ref('');
const initialLoad = ref(true);
const showIntentFailedMessage = computed(() => {
    if (bookingStore.currentStep !== 2 || bookingStore.isHoldingRoom) return false;
    const intent = bookingStore.preselectedIntent;
    if (!intent) return false;
    if(bookingStore.isLoadingRooms) return false;
    if( !bookingStore.availableHotelsAndRooms || bookingStore.availableHotelsAndRooms.length === 0) return false;
    const hotelData = bookingStore.availableHotelsAndRooms.find(h => h.MaKS === intent.hotelId);
    if (!hotelData) return true;
    const roomTypeData = hotelData.roomTypes.find(rt => rt.MaLoaiPhong === intent.roomTypeId);
    if (!roomTypeData || roomTypeData.SoPhongTrong <= 0) return true;
    return false;
  });

const roomsToDisplay = computed(() => bookingStore.availableHotelsAndRooms);

onMounted(() => {
    if (!bookingStore.isLoadingRooms) {
        initialLoad.value = false;
    }
    const unwatchLoading = watch(() => bookingStore.isLoadingRooms, (newValue) => {
        if (!newValue) {
            initialLoad.value = false;
            if(unwatchLoading) unwatchLoading();
        }
    }, { immediate: bookingStore.isLoadingRooms });

     watch(() => bookingStore.holdError, (newError) => {
        if (newError && newError.includes('Bạn đã có một đơn đặt phòng đang được giữ')) {
            updateHoldExpiryDisplay(); 
            if (!holdExpiryTimerInterval.value) {
                holdExpiryTimerInterval.value = setInterval(updateHoldExpiryDisplay, 2000); 
            }
        } else {
            if (holdExpiryTimerInterval.value) clearInterval(holdExpiryTimerInterval.value);
            holdExpiryTimerInterval.value = null;
            timeUntilExpiryDisplay.value = '';
        }
    }, { immediate: true });

});



onBeforeUnmount(() => {
    if (holdExpiryTimerInterval.value) clearInterval(holdExpiryTimerInterval.value);
});


function extractEssentialHotelInfo(fullHotelInfo) {
  return {
    MaKS: fullHotelInfo.MaKS, TenKS: fullHotelInfo.TenKS, DiaChi: fullHotelInfo.DiaChi,
    HangSao: fullHotelInfo.HangSao, LoaiHinh: fullHotelInfo.LoaiHinh, MoTaChung: fullHotelInfo.MoTaChung,
    SoDienThoaiKS: fullHotelInfo.SoDienThoaiKS || null, EmailKS: fullHotelInfo.EmailKS || null,
    UrlBanDoKS: fullHotelInfo.UrlBanDoKS || null, HinhAnhKS: fullHotelInfo.HinhAnhKS || null,
  };
}

const handleRoomSelection = (fullHotelInfo, roomInfoFromCard) => {
  if (bookingStore.isHoldingRoom || isProcessingAction.value) return;
  if (roomInfoFromCard.SoPhongTrong <= 0) {
    bookingStore.roomsError = "This room just became unavailable. Please try again or choose another.";
    return;
  }
  const essentialHotelInfo = extractEssentialHotelInfo(fullHotelInfo);
  emit('room-hold-requested', { hotelInfo: essentialHotelInfo, roomInfo: roomInfoFromCard });
};

async function handleAlternativeDateSelection(originalHotelData, payloadFromCard) {
  if (bookingStore.isHoldingRoom || isProcessingAction.value) return;
  const { roomInfo: originalRoomInfo, suggestedDates } = payloadFromCard;
  if (!bookingStore.searchCriteria) {
      console.error("Step2: Cannot handle alternative date without base searchCriteria.");
      return;
  }

  isProcessingAction.value = true; actionName.value = 'altDate';
  initialLoad.value = false; 

  const newSearchCriteria = {
    startDate: format(new Date(suggestedDates.checkIn), 'yyyy-MM-dd'),
    endDate: format(new Date(suggestedDates.checkOut), 'yyyy-MM-dd'),
    numberOfGuests: bookingStore.searchCriteria.numberOfGuests
  };

  await bookingStore.setSearchCriteriaAndFetchRooms(newSearchCriteria);

  if (bookingStore.roomsError) {
    isProcessingAction.value = false; actionName.value = '';
    return;
  }

  const updatedHotelData = bookingStore.availableHotelsAndRooms.find(h => h.MaKS === originalHotelData.MaKS);
  if (updatedHotelData) {
    const targetRoomInNewSearch = updatedHotelData.roomTypes.find(rt => rt.MaLoaiPhong === originalRoomInfo.MaLoaiPhong);
    if (targetRoomInNewSearch && targetRoomInNewSearch.SoPhongTrong > 0) {
      const essentialHotelInfo = extractEssentialHotelInfo(updatedHotelData);
      emit('room-hold-requested', { hotelInfo: essentialHotelInfo, roomInfo: targetRoomInNewSearch });
    } else {
      console.warn("Step2: Alt date picked, but room still unavailable after re-search. User needs to select manually.");
    }
  } else {
      console.warn("Step2: Alt date picked, but original hotel not found in new search results.");
  }
  isProcessingAction.value = false; actionName.value = '';
}
const resumeError = ref('');
async function resumeHeldBooking() {
  resumeError.value = '';
  console.log('Attempting to resume held booking...');
  
  // First check if we have a valid hold booking
  if (!bookingStore.heldBookingMaDat) {
    resumeError.value = "No held booking found. Please select a room first.";
    return;
  }
  
  // Check if hold booking has expired
  if (bookingStore.heldBookingExpiresAt && Date.now() > bookingStore.heldBookingExpiresAt) {
    resumeError.value = "Your previous room hold has expired. Please select a room again or start a new search.";
    // Cập nhật store để phản ánh đúng trạng thái hết hạn
    bookingStore.holdError = "Your previous room hold has expired. Please find a new room.";
    bookingStore.heldBookingMaDat = null;
    bookingStore.heldBookingExpiresAt = null;
    return;
  }
  
  // Check if we have required details, if not try to restore them
  if (!bookingStore.selectedHotelDetails || !bookingStore.selectedRoomTypeDetails || !bookingStore.searchCriteria) {
    console.warn('Step2: Missing some details for hold booking, but will attempt to continue. Step 3 will handle missing data.');
    console.log('Missing details:');
    if (!bookingStore.selectedHotelDetails) console.log('- selectedHotelDetails missing');
    if (!bookingStore.selectedRoomTypeDetails) console.log('- selectedRoomTypeDetails missing');
    if (!bookingStore.searchCriteria) console.log('- searchCriteria missing');
  }
  
  // Clear any hold errors and navigate to Step 3
  bookingStore.holdError = null;
  bookingStore.navigateToStep(3);
}

function goToMyBookingsPage() {
    alert("Navigating to 'My Bookings' page (functionality to be implemented).");
}

function waitForHoldToExpire() {
  isProcessingAction.value = true; // Chỉ để disable nút tạm thời
  console.log("Step2: User chose to wait for the current hold to expire.");
  // Không làm gì cả ở phía client để thay đổi state giữ phòng.
  // Thông báo lỗi "Bạn đã có một đơn đặt phòng..." vẫn sẽ hiển thị.
  // Người dùng sẽ cần tự làm mới hoặc thử lại sau.
  // Có thể hiển thị một toast nhẹ nhàng:
  // notificationToast.value.show("Okay, please try selecting a room again after your current hold expires (approx. X minutes).", "info");
  alert("Okay, please try selecting a room again after your current hold expires (check the timer). If the timer is gone, the hold might have expired.");
  // Sau đó, set isProcessingAction lại false để người dùng có thể click nút khác nếu muốn.
  setTimeout(() => { isProcessingAction.value = false; }, 500);
}

async function retryGeneralError() {
  if (bookingStore.roomsError && bookingStore.searchCriteria) {
    isProcessingAction.value = true; actionName.value = 'retryGeneral';
    initialLoad.value = false;
    await bookingStore.setSearchCriteriaAndFetchRooms(bookingStore.searchCriteria);
    isProcessingAction.value = false; actionName.value = '';
  } else {
    goToStep1AndClearIntent();
  }
}

function goToStep1AndClearIntent() {
  bookingStore.clearPreselectedBookingIntent();
  bookingStore.navigateToStep(1);
}
</script>

<style scoped>
.room-list .col-12 {
  display: flex;
}
.room-list .col-12 > :deep(div) { /* Đảm bảo VueCard1 chiếm đủ không gian */
  width: 100%;
}
.alert-warning, .alert-info {
    border-left: 5px solid;
}
.alert-warning { border-left-color: #ffc107; } /* Bootstrap warning color */
.alert-info { border-left-color: #0dcaf0; } /* Bootstrap info color */
</style>