<!-- src/views/BookingProcess.vue -->
<template>
  <Layout
    :show-title="false"
    title=""
    bg-color=""
  >
    <div class="container page-content-container py-4">
      <HeroSection
        :image-url="bannerImageUrl" 
        height="300px"
        :overlay-opacity="0"
      />

      <h2 class="text-center fw-bold mt-4 mb-4 display-6">BOOK YOUR STAY</h2>

      <BookingProgressIndicator
        :current-step="bookingStore.currentStep" 
        :max-completed-step="bookingStore.maxCompletedStep" 
        @navigate-to-step="handleNavigateToStep" 
        class="mb-4 mb-md-5"
      />

      <div class="booking-steps-content">
        <div :key="bookingStore.currentStep"> 
          <Step1_SearchForm
            v-if="bookingStore.currentStep === 1"
            @search-submitted="handleSearchFromStep1" 
          />
          <Step2_RoomSelection
            v-if="bookingStore.currentStep === 2"
            @rooms-finalize="handleRoomSelectionFromStep2"
          />
          <Step3_GuestInfo
            v-if="bookingStore.currentStep === 3"
            @guest-info-submitted="handleGuestInfoFromStep3"
          />
          <Step4_Confirmation
            v-if="bookingStore.currentStep === 4"
            :final-booking-details="bookingStore.dataForStep4" 
          />
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed } from 'vue'; // Chỉ cần computed nếu bạn muốn tạo computed prop từ store state
import Layout from '@/components/Layout.vue';
import HeroSection from '@/components/HeroSection.vue';
import BookingProgressIndicator from '@/components/booking/BookingProgressIndicator.vue';
import Step1_SearchForm from '@/components/booking/steps/Step1_SearchForm.vue';
import Step2_RoomSelection from '@/components/booking/steps/Step2_RoomSelection.vue'; // Đường dẫn của bạn
import Step3_GuestInfo from '@/components/booking/steps/Step3_GuestInfo.vue';     // Đường dẫn của bạn
import Step4_Confirmation from '@/components/booking/steps/Step4_Confirmation.vue'; // Đường dẫn của bạn

import defaultBannerImage from '@/assets/mountain.jpg';

//
// Import store
//
import { useBookingStore } from '@/store/bookingStore'; // Đảm bảo đường dẫn đúng

const bookingStore = useBookingStore();

const bannerImageUrl = ref(defaultBannerImage); // Cái này có thể giữ lại cục bộ



//
// Hàm xử lý sự kiện từ các component con, giờ sẽ gọi actions của store
//
async function handleSearchFromStep1(data) {
  console.log('BP: Search submitted', data);
  await bookingStore.setSearchCriteriaAndFetchRooms(data); // Gọi action
  scrollToTopOfSteps();
}

async function handleRoomSelectionFromStep2(data) { // data là { hotelInfo (tinh gọn), roomInfo }
  console.log('BP: Room selection finalized', data);
  bookingStore.selectRoomAndHotel(data); // Gọi action
  scrollToTopOfSteps();
}

async function handleGuestInfoFromStep3(data) { // data là { bookingSummary, guestAndPaymentInfo }
  console.log('BP: Guest info and payment submitted', data);
  bookingStore.submitGuestAndPaymentInfo(data); // Gọi action
  scrollToTopOfSteps();
}

function handleNavigateToStep(stepId) {
  bookingStore.navigateToStep(stepId);
  scrollToTopOfSteps();
}

//
// Hàm scroll giữ nguyên
//
function scrollToTopOfSteps() {
  const contentContainer = document.querySelector('.page-content-container');
  if (contentContainer) {
    const navbarElement = document.querySelector('.navbar-login');
    const navbarHeight = navbarElement ? navbarElement.offsetHeight : 0;
    const elementRect = contentContainer.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const offsetPosition = absoluteElementTop - navbarHeight - 10;
    window.scrollTo({
      top: offsetPosition < 0 ? 0 : offsetPosition,
      behavior: 'smooth'
    });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
</script>

<style scoped>
.page-content-container {
  /* Style nếu cần */
}
.booking-steps-content {
  min-height: 40vh;
}
</style>