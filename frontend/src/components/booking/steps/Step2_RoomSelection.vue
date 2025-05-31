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
      <button class="btn btn-primary me-2" @click="resumeHeldBooking">
        <i class="bi bi-arrow-right-circle-fill me-1"></i> Continue with Held Booking
      </button>
      <button class="btn btn-outline-secondary me-2" @click="goToMyBookingsPage">
        <i class="bi bi-list-check me-1"></i> View My Bookings
      </button>
      <button class="btn btn-outline-danger" @click="discardHoldAndSearchNew">
         <i class="bi bi-trash me-1"></i> Discard Hold & Search New
      </button>
    </div>



    <!-- Lỗi từ Store -->
    <div v-else-if="bookingStore.roomsError || bookingStore.holdError" class="alert alert-danger text-center">
      <p class="mb-1"><strong>{{ bookingStore.holdError ? 'Could not hold the room.' : 'Could not load rooms.' }}</strong></p>
      <p>{{ bookingStore.holdError || bookingStore.roomsError }}</p>
      <button class="btn btn-sm btn-primary" @click="retryLastAction" :disabled="isRetrying || bookingStore.isLoadingRooms">
        <span v-if="isRetrying || bookingStore.isLoadingRooms" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        {{ (isRetrying || bookingStore.isLoadingRooms) ? 'Processing...' : 'Try Again' }}
      </button>
      <button class="btn btn-sm btn-link ms-2" @click="goToStep1AndClearIntent">Modify Search</button>
    </div>

    <!-- Danh sách phòng -->
    <div v-else-if="roomsToDisplay && roomsToDisplay.length > 0" class="room-list">
      <!-- Thông báo nếu "ý định" ban đầu không thành công -->
      <div v-if="showIntentFailedMessage" class="alert alert-warning text-center small py-2">
        The room you previously selected ({{ bookingStore.preselectedIntent?.roomName || 'selected room' }}
        at {{ bookingStore.preselectedIntent?.hotelName || 'selected hotel' }})
        is not available for the chosen dates. Please select another room or modify your search.
      </div>

      <!-- Thông tin tìm kiếm hiện tại -->
      <div class="text-muted mb-3 small d-flex justify-content-between align-items-center" v-if="bookingStore.searchCriteria">
        <span>
          Showing results for:
          {{ bookingStore.searchCriteria.startDate }} to {{ bookingStore.searchCriteria.endDate }}
          - {{ bookingStore.searchCriteria.numberOfGuests }} guest(s).
        </span>
        <a href="#" @click.prevent="goToStep1AndClearIntent" class="ms-2">Change search</a>
      </div>

      <!-- Cards -->
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
import { computed, ref, onMounted, watch, defineEmits } from 'vue'; // Thêm defineEmits
import { format } from 'date-fns';
import VueCard1 from '../../vueCard1.vue';
import { useBookingStore } from '@/store/bookingStore';
import { useRouter } from 'vue-router';
const router = useRouter();

const emit = defineEmits(['room-hold-requested']); // Định nghĩa event sẽ emit cho BookingProcess

const bookingStore = useBookingStore();
const isRetrying = ref(false); // Dùng chung cho các hành động retry
const initialLoad = ref(true);
const showIntentFailedMessage = ref(false);

const roomsToDisplay = computed(() => bookingStore.availableHotelsAndRooms);

onMounted(() => {
    if (!bookingStore.isLoadingRooms) {
        initialLoad.value = false;
    }
    // Kiểm tra nếu có preselectedIntent và chúng ta đang ở Step 2 -> skip thất bại
    if (bookingStore.currentStep === 2 && bookingStore.preselectedIntent && !bookingStore.isHoldingRoom) {
        console.log("Step2 Mounted: Preselected intent exists, assuming skip failed or wasn't applicable yet.");
        showIntentFailedMessage.value = true;
        // Không clear intent ở đây ngay, để người dùng thấy thông báo.
        // Intent sẽ được clear khi họ chọn phòng mới, hoặc về step 1.
    }

    const unwatchLoading = watch(() => bookingStore.isLoadingRooms, (newValue) => {
        if (!newValue) {
            initialLoad.value = false;
            if(unwatchLoading) unwatchLoading();
        }
    }, { immediate: false });
});

// Watch preselectedIntent, nếu nó bị clear (ví dụ do skip thành công), ẩn thông báo
watch(() => bookingStore.preselectedIntent, (newIntent) => {
    if (bookingStore.currentStep === 2) { // Chỉ quan tâm nếu đang ở Step 2
        if (newIntent) {
            // Nếu có intent mới và đang ở Step 2 (ví dụ: quay lại từ Step 3 rồi navigate lại Step 2 với intent)
            // hoặc là intent ban đầu mà skip thất bại
            showIntentFailedMessage.value = true;
        } else {
            // Nếu intent bị clear (do chọn phòng thành công, hoặc về Step 1)
            showIntentFailedMessage.value = false;
        }
    } else {
        showIntentFailedMessage.value = false; // Nếu không ở Step 2, không hiển thị
    }
}, { immediate: true });


// Khi người dùng chọn một phòng CÒN TRỐNG thông thường
const handleRoomSelection = (fullHotelInfo, roomInfoFromCard) => {
  if (roomInfoFromCard.SoPhongTrong <= 0) {
      // Phòng này vừa hết chỗ, hoặc logic sai
      alert("This room is no longer available. Please refresh or choose another.");
      // Có thể gọi retryFetchRooms() để cập nhật lại danh sách
      bookingStore.roomsError = "Selected room just became unavailable. Please retry.";
      return;
  }

  console.log("Step2: Room selected, preparing to hold.", roomInfoFromCard);
  const essentialHotelInfo = { /* ... trích xuất như cũ ... */
    MaKS: fullHotelInfo.MaKS, TenKS: fullHotelInfo.TenKS, DiaChi: fullHotelInfo.DiaChi,
    HangSao: fullHotelInfo.HangSao, LoaiHinh: fullHotelInfo.LoaiHinh, MoTaChung: fullHotelInfo.MoTaChung,
    SoDienThoaiKS: fullHotelInfo.SoDienThoaiKS, EmailKS: fullHotelInfo.EmailKS,
    UrlBanDoKS: fullHotelInfo.UrlBanDoKS, HinhAnhKS: fullHotelInfo.HinhAnhKS,
  };

  emit('room-hold-requested', {
    hotelInfo: essentialHotelInfo,
    roomInfo: roomInfoFromCard
  });
  // BookingProcess sẽ gọi bookingStore.holdRoomAndProceed
  // Và bookingStore.holdRoomAndProceed sẽ clearPreselectedBookingIntent nếu thành công
};

// Khi người dùng chọn một NGÀY GỢI Ý
async function handleAlternativeDateSelection(originalHotelData, payloadFromCard) {
  // payloadFromCard: { roomInfo (loại phòng gốc), suggestedDates (ngày gợi ý) }
  const { roomInfo: originalRoomInfo, suggestedDates } = payloadFromCard;

  if (!bookingStore.searchCriteria) return;

  isRetrying.value = true; // Sử dụng isRetrying để hiển thị loading trên nút Try Again hoặc UI chung
  initialLoad.value = false;
  showIntentFailedMessage.value = false; // Ẩn thông báo intent cũ nếu có

  const newSearchCriteria = {
    startDate: format(new Date(suggestedDates.checkIn), 'yyyy-MM-dd'),
    endDate: format(new Date(suggestedDates.checkOut), 'yyyy-MM-dd'),
    numberOfGuests: bookingStore.searchCriteria.numberOfGuests
  };

  await bookingStore.setSearchCriteriaAndFetchRooms(newSearchCriteria);

  if (bookingStore.roomsError) {
    isRetrying.value = false;
    return; // Lỗi sẽ được hiển thị bởi v-else-if ở template
  }

  // Sau khi fetch, tìm lại khách sạn và phòng đó trong kết quả mới
  // originalHotelData là context khách sạn của phòng được click gợi ý ngày
  const updatedHotelData = bookingStore.availableHotelsAndRooms.find(h => h.MaKS === originalHotelData.MaKS);

  if (updatedHotelData) {
    const targetRoomInNewSearch = updatedHotelData.roomTypes.find(rt => rt.MaLoaiPhong === originalRoomInfo.MaLoaiPhong);

    if (targetRoomInNewSearch && targetRoomInNewSearch.SoPhongTrong > 0) {
      console.log("Step2: Alternative date picked, room IS available. Emitting for hold.", targetRoomInNewSearch);
      // Thông tin khách sạn có thể lấy từ updatedHotelData hoặc originalHotelData đều được
      const essentialHotelInfo = { /* ... trích xuất từ updatedHotelData ... */
        MaKS: updatedHotelData.MaKS, TenKS: updatedHotelData.TenKS, DiaChi: updatedHotelData.DiaChi,
        HangSao: updatedHotelData.HangSao, LoaiHinh: updatedHotelData.LoaiHinh, MoTaChung: updatedHotelData.MoTaChung,
        SoDienThoaiKS: updatedHotelData.SoDienThoaiKS, EmailKS: updatedHotelData.EmailKS,
        UrlBanDoKS: updatedHotelData.UrlBanDoKS, HinhAnhKS: updatedHotelData.HinhAnhKS,
       };
      emit('room-hold-requested', {
        hotelInfo: essentialHotelInfo,
        roomInfo: targetRoomInNewSearch, // QUAN TRỌNG: Dùng room từ kết quả search mới
      });
    } else {
      console.warn("Step2: Alt date picked, but room still unavailable after re-search. User needs to select manually.");
      // Không làm gì thêm, Step 2 sẽ hiển thị danh sách mới, người dùng tự chọn.
      // Intent gốc có thể vẫn còn, hoặc nên được clear ở đây nếu logic này được coi là "thất bại" cho intent đó
      // bookingStore.clearPreselectedBookingIntent();
    }
  } else {
      console.warn("Step2: Alt date picked, but original hotel not found in new search results.");
  }
  isRetrying.value = false;
}

// Chung cho retry lỗi search rooms hoặc lỗi hold rooms (nếu muốn đơn giản)
async function retryLastAction() {
  if (bookingStore.holdError && bookingStore.selectedHotelDetails && bookingStore.selectedRoomTypeDetails && bookingStore.searchCriteria) {
    // Nếu lỗi trước đó là holdError, thử hold lại phòng đã chọn
    isRetrying.value = true;
    initialLoad.value = false;
    const payloadForHold = {
        hotelInfo: bookingStore.selectedHotelDetails,
        roomInfo: bookingStore.selectedRoomTypeDetails,
        searchCriteria: bookingStore.searchCriteria
    };
    await bookingStore.holdRoomAndProceed(payloadForHold); // Giả sử nó reset holdError
    isRetrying.value = false;
  } else if (bookingStore.roomsError && bookingStore.searchCriteria) {
    // Nếu lỗi là roomsError, thử search lại
    isRetrying.value = true;
    initialLoad.value = false;
    await bookingStore.setSearchCriteriaAndFetchRooms(bookingStore.searchCriteria);
    isRetrying.value = false;
  } else {
    // Không có gì để retry, hoặc thiếu thông tin
    goToStep1AndClearIntent();
  }
}

function goToStep1AndClearIntent() {
  bookingStore.clearPreselectedBookingIntent(); // Xóa ý định khi người dùng chủ động về Step 1
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
/* Thêm CSS cho thông báo intent failed nếu muốn */
.alert-warning {
    /* styles */
}
</style>