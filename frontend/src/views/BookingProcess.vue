<!-- src/views/BookingProcess.vue -->
<template>
  <Layout :show-title="false" title="" bg-color="">
    <div class="container page-content-container py-4">
      <HeroSection :image-url="bannerImageUrl" height="300px" :overlay-opacity="0"/>
      <h2 class="text-center fw-bold mt-4 mb-4 display-6">BOOK YOUR STAY</h2>
      <BookingProgressIndicator
        :current-step="bookingStore.currentStep"
        :max-completed-step="bookingStore.maxCompletedStep"
        @navigate-to-step="handleNavigateToStep"
        class="mb-4 mb-md-5"
      />
      <div class="booking-steps-content">
        <div :key="bookingStore.currentStep"> <!-- :key giúp re-render khi step thay đổi -->
          <Step1_SearchForm
            v-if="bookingStore.currentStep === 1"
            /> <!-- Step1_SearchForm tự gọi action store -->
          <Step2_RoomSelection
            v-if="bookingStore.currentStep === 2"
            @room-hold-requested="handleHoldRoomRequestFromStep2" 
          />
          <Step3_GuestInfo
            v-if="bookingStore.currentStep === 3"
            @booking-finalization-requested="handleFinalizeBookingRequestFromStep3" 
          />
          <Step4_Confirmation
            v-if="bookingStore.currentStep === 4"
            :final-booking-details="bookingStore.dataForStep4Display"
          />
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'; // Thêm watch
import Layout from '@/components/Layout.vue';
import HeroSection from '@/components/HeroSection.vue';
import BookingProgressIndicator from '@/components/booking/BookingProgressIndicator.vue';
import Step1_SearchForm from '@/components/booking/steps/Step1_SearchForm.vue';
import Step2_RoomSelection from '@/components/booking/steps/Step2_RoomSelection.vue';
import Step3_GuestInfo from '@/components/booking/steps/Step3_GuestInfo.vue';
import Step4_Confirmation from '@/components/booking/steps/Step4_Confirmation.vue';
import defaultBannerImage from '@/assets/mountain.jpg';
import { useBookingStore } from '@/store/bookingStore';
import { useRouter } from 'vue-router';

const bookingStore = useBookingStore();
const router = useRouter();

const bannerImageUrl = ref(defaultBannerImage);

// Handler mới cho sự kiện từ Step2
async function handleHoldRoomRequestFromStep2(payload) { // payload là { hotelInfo, roomInfo }
  console.log('BP: Hold room request received from Step2', payload);
  if (!bookingStore.searchCriteria) {
      console.error("BP: Cannot hold room without searchCriteria (dates, guests).");
      // Có thể hiển thị lỗi hoặc điều hướng về Step 1
      bookingStore.navigateToStep(1); // Hoặc startBookingFromScratch() nếu muốn reset mạnh hơn
      return;
  }
  const payloadForHold = {
    ...payload,
    searchCriteria: bookingStore.searchCriteria
  };
  await bookingStore.holdRoomAndProceed(payloadForHold);
  // Store sẽ tự động chuyển currentStep sang 3 nếu thành công
  // Nếu có lỗi (holdError trong store), Step2_RoomSelection sẽ hiển thị
  if (!bookingStore.holdError) { // Chỉ cuộn nếu không có lỗi giữ phòng
    scrollToTopOfSteps();
  }
}

// Handler mới cho sự kiện từ Step3
async function handleFinalizeBookingRequestFromStep3(formData) { // formData từ Step3
  console.log('BP: Finalize booking request received from Step3', formData);
  await bookingStore.finalizeBooking(formData);
  // Store sẽ tự động chuyển currentStep sang 4 nếu thành công
  // Nếu có lỗi (finalizeError trong store), Step3_GuestInfo sẽ hiển thị
  if (!bookingStore.finalizeError) { // Chỉ cuộn nếu không có lỗi finalize
    scrollToTopOfSteps();
  }
}

function handleNavigateToStep(stepId) {
  bookingStore.navigateToStep(stepId);
  scrollToTopOfSteps();
}

function scrollToTopOfSteps() {
  const contentContainer = document.querySelector('.page-content-container');
  if (contentContainer) {
    const navbarElement = document.querySelector('.navbar'); // Dùng class .navbar chung chung hơn
    const navbarHeight = navbarElement ? navbarElement.offsetHeight : 0;
    const elementRect = contentContainer.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const offsetPosition = absoluteElementTop - navbarHeight - 20;
    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// --- Logic Skip Step 2 ---
watch(() => bookingStore.currentStep, async (newStep, oldStep) => {
  console.log(`BP: Current step changed from ${oldStep} to ${newStep}`);
  if (newStep === 2 && oldStep === 1 && bookingStore.preselectedIntent) {
    console.log("BP: Attempting to skip Step 2 due to preselectedIntent:", JSON.parse(JSON.stringify(bookingStore.preselectedIntent)));

    const intent = bookingStore.preselectedIntent;
    // Cần searchCriteria để lấy ngày và số khách cho việc giữ phòng
    if (!bookingStore.searchCriteria) {
        console.warn("BP: Cannot skip Step 2, searchCriteria is missing. User needs to complete Step 1 first.");
        // Trong trường hợp này, preselectedIntent có thể nên được xóa nếu nó không còn ý nghĩa
        // bookingStore.clearPreselectedBookingIntent();
        return; // Không skip, để Step 2 hiển thị (hoặc Step 1 nếu searchCriteria rỗng)
    }

    const hotelData = bookingStore.availableHotelsAndRooms.find(h => h.MaKS === intent.hotelId);

    if (hotelData) {
      const roomTypeData = hotelData.roomTypes.find(rt => rt.MaLoaiPhong === intent.roomTypeId);

      if (roomTypeData && roomTypeData.SoPhongTrong > 0) {
        console.log("BP: Preselected room is available in search results! Attempting to hold and skip Step 2.", roomTypeData);
        
        const essentialHotelInfo = { // Trích xuất thông tin khách sạn cần thiết
          MaKS: hotelData.MaKS, TenKS: hotelData.TenKS, DiaChi: hotelData.DiaChi,
          HangSao: hotelData.HangSao, LoaiHinh: hotelData.LoaiHinh, MoTaChung: hotelData.MoTaChung,
          SoDienThoaiKS: hotelData.SoDienThoaiKS, EmailKS: hotelData.EmailKS,
          UrlBanDoKS: hotelData.UrlBanDoKS, HinhAnhKS: hotelData.HinhAnhKS,
        };
        
        const payloadForHold = {
          hotelInfo: essentialHotelInfo,
          roomInfo: roomTypeData, // roomTypeData là object phòng từ availableHotelsAndRooms
          searchCriteria: bookingStore.searchCriteria
        };

        await bookingStore.holdRoomAndProceed(payloadForHold);
        // Nếu holdRoomAndProceed thành công, store sẽ tự chuyển currentStep = 3
        if (!bookingStore.holdError) {
            console.log("BP: Successfully held preselected room and skipped Step 2. Moving to Step 3.");
            // Không cần scrollToTopOfSteps ở đây vì người dùng không thấy Step 2
        } else {
            console.warn("BP: Failed to hold preselected room, will show Step 2. Error:", bookingStore.holdError);
            // Lỗi sẽ được hiển thị ở Step2_RoomSelection.vue
            // Không clearPreselectedBookingIntent vội để Step 2 có thể thông báo lỗi liên quan đến intent.
        }
        return; // Kết thúc logic của watcher cho lần thay đổi này
      } else {
        console.log("BP: Preselected room not available (SoPhongTrong=0 or not found in roomTypes). Showing Step 2.");
      }
    } else {
      console.log("BP: Preselected hotel not found in available search results. Showing Step 2.");
    }
    // Nếu không skip, Step2_RoomSelection sẽ hiện ra và có thể hiển thị thông báo dựa trên preselectedIntent
  }
  // Cuộn lên khi bước thay đổi (trừ khi đang skip ngầm)
  if (newStep !== oldStep && !(newStep === 3 && oldStep === 1 && bookingStore.preselectedIntent && !bookingStore.holdError) ) {
      scrollToTopOfSteps();
  }
}, { immediate: false }); // immediate: false để không chạy khi component mount lần đầu


onMounted(() => {
  console.log('BookingProcess.vue mounted. Current step from store:', bookingStore.currentStep);
  // Xử lý vào thẳng URL hoặc refresh
  if (bookingStore.currentStep > 1 && !bookingStore.searchCriteria && !bookingStore.isLoadingRooms && !bookingStore.heldBookingMaDat) {
    // Chỉ reset nếu không có thông tin giữ chỗ nào (ví dụ từ persisted state)
    console.warn("BP: Navigated to step > 1 without search criteria or hold. Resetting to Step 1.");
    bookingStore.startBookingFromScratch(); // Sẽ đặt currentStep = 1
  } else if (bookingStore.currentStep === 1 && bookingStore.searchCriteria && bookingStore.availableHotelsAndRooms.length === 0 && !bookingStore.isLoadingRooms && !bookingStore.roomsError) {
      // Nếu vào Step 1, đã có searchCriteria, nhưng chưa có phòng (ví dụ đến từ HomePage bị lỗi API)
      // Thì không tự ý chuyển sang Step 2, để Step1 hiển thị và cho user submit lại.
      // Hoặc có thể gọi lại setSearchCriteriaAndFetchRooms ở đây nếu muốn tự động retry.
      console.log("BP: On Step 1 with search criteria but no rooms. Awaiting user action in Step1_SearchForm.");
  } else if (bookingStore.currentStep === 2 && !bookingStore.searchCriteria && !bookingStore.isLoadingRooms) {
      // Edge case: somehow on step 2 without search criteria
      console.warn("BP: On Step 2 without search criteria. Resetting to Step 1.");
      bookingStore.startBookingFromScratch();
  }

  // Kiểm tra ngay khi mount nếu điều kiện skip Step 2 đã được đáp ứng (ví dụ, currentStep=2, có intent, có phòng)
  // Điều này quan trọng nếu người dùng F5 trang ở Step 1 sau khi search từ HomePage, và intent vẫn còn
  // Hoặc nếu watch không kích hoạt đúng lúc.
  if (bookingStore.currentStep === 2 && bookingStore.preselectedIntent && bookingStore.searchCriteria && bookingStore.availableHotelsAndRooms.length > 0) {
      // Gọi lại logic kiểm tra skip tương tự như trong watch
      // Điều này đảm bảo ngay cả khi watch không trigger, việc skip vẫn được thử
      // Tạo hàm riêng để tránh lặp code:
      attemptToSkipStep2();
  }


  scrollToTopOfSteps();
});

// Hàm riêng để kiểm tra và skip Step 2 (tránh lặp code)
async function attemptToSkipStep2() {
    if (!(bookingStore.currentStep === 2 && bookingStore.preselectedIntent && bookingStore.searchCriteria && bookingStore.availableHotelsAndRooms.length > 0) ) {
        return;
    }
    console.log("BP (attemptToSkipStep2): Checking preselectedIntent:", JSON.parse(JSON.stringify(bookingStore.preselectedIntent)));
    const intent = bookingStore.preselectedIntent;
    const hotelData = bookingStore.availableHotelsAndRooms.find(h => h.MaKS === intent.hotelId);
    if (hotelData) {
      const roomTypeData = hotelData.roomTypes.find(rt => rt.MaLoaiPhong === intent.roomTypeId);
      if (roomTypeData && roomTypeData.SoPhongTrong > 0) {
        console.log("BP (attemptToSkipStep2): Preselected room is available! Attempting to hold.", roomTypeData);
        const essentialHotelInfo = { /* ... trích xuất ... */ };
        const payloadForHold = { hotelInfo: essentialHotelInfo, roomInfo: roomTypeData, searchCriteria: bookingStore.searchCriteria };
        await bookingStore.holdRoomAndProceed(payloadForHold);
        if (!bookingStore.holdError) {
            console.log("BP (attemptToSkipStep2): Successfully held preselected room. Moved to Step 3.");
        } else {
            console.warn("BP (attemptToSkipStep2): Failed to hold preselected room. Error:", bookingStore.holdError);
        }
      }
    }
}

</script>

<style scoped>
.page-content-container {
  /* padding-top: 70px;  Nếu navbar của bạn fixed và có chiều cao nhất định */
}
.booking-steps-content {
  min-height: 40vh;
}
</style>