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
            /> <!-- @search-submitted không cần thiết vì Step1 gọi store trực tiếp -->
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
            :final-booking-details="bookingStore.dataForStep4Display"
          />
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Layout from '@/components/Layout.vue';
import HeroSection from '@/components/HeroSection.vue';
import BookingProgressIndicator from '@/components/booking/BookingProgressIndicator.vue';
import Step1_SearchForm from '@/components/booking/steps/Step1_SearchForm.vue';
import Step2_RoomSelection from '@/components/booking/steps/Step2_RoomSelection.vue';
import Step3_GuestInfo from '@/components/booking/steps/Step3_GuestInfo.vue';
import Step4_Confirmation from '@/components/booking/steps/Step4_Confirmation.vue';
import defaultBannerImage from '@/assets/mountain.jpg';
import { useBookingStore } from '@/store/bookingStore';
import { useRouter } from 'vue-router'; // Thêm nếu cần

const bookingStore = useBookingStore();
const router = useRouter(); // Khởi tạo router

const bannerImageUrl = ref(defaultBannerImage);

// Hàm xử lý sự kiện từ Step1 đã được loại bỏ vì Step1 tự gọi store

function handleRoomSelectionFromStep2(data) { // data là { hotelInfo, roomInfo }
  console.log('BP: Room selection finalized', data);
  bookingStore.selectRoomAndHotel(data);
  scrollToTopOfSteps();
}

function handleGuestInfoFromStep3(data) { // data là formData từ Step3
  console.log('BP: Guest info and payment submitted', data);
  bookingStore.submitGuestAndPaymentInfo(data);
  scrollToTopOfSteps();
}

function handleNavigateToStep(stepId) {
  bookingStore.navigateToStep(stepId);
  scrollToTopOfSteps();
}

function scrollToTopOfSteps() {
  const contentContainer = document.querySelector('.page-content-container');
  if (contentContainer) {
    const navbarElement = document.querySelector('.navbar-login'); // Giả sử bạn có class này cho navbar
    const navbarHeight = navbarElement ? navbarElement.offsetHeight : 0;
    const elementRect = contentContainer.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const offsetPosition = absoluteElementTop - navbarHeight - 20; // Thêm offset 20px
    window.scrollTo({
      top: Math.max(0, offsetPosition), // Đảm bảo không cuộn lên giá trị âm
      behavior: 'smooth'
    });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

onMounted(() => {
  console.log('BookingProcess.vue mounted. Current step from store:', bookingStore.currentStep);
  // Kiểm tra nếu người dùng vào thẳng URL /BookingProcess hoặc refresh trang
  // mà store không có trạng thái cần thiết (ví dụ, refresh ở Step 2 mà không có searchCriteria).
  // Chỉ áp dụng nếu không dùng persisted state cho Pinia.
  if (bookingStore.currentStep > 1 && !bookingStore.searchCriteria && !bookingStore.isLoadingRooms) {
    console.warn("Navigated to BookingProcess at step > 1 without search criteria. Resetting.");
    // Chuyển người dùng về Step 1 để bắt đầu lại, hoặc về trang chủ
    bookingStore.startBookingFromScratch(); // Action này sẽ reset store và set currentStep = 1
    // Hoặc router.push('/');
  } else if (bookingStore.currentStep === 1 && bookingStore.searchCriteria && bookingStore.availableHotelsAndRooms.length > 0 && !bookingStore.isLoadingRooms && !bookingStore.roomsError) {
      // Trường hợp hiếm: HomePage đã tìm kiếm (currentStep sẽ là 2 trong store),
      // nhưng vì lý do nào đó khi vào BookingProcess currentStep vẫn là 1.
      // Nếu có searchCriteria và phòng, chuyển thẳng sang step 2.
      console.log("Found existing search criteria and rooms on step 1, moving to step 2.");
      bookingStore.currentStep = 2; // Bắt buộc qua step 2
      if (bookingStore.maxCompletedStep < 1) bookingStore.maxCompletedStep = 1;
  }
  scrollToTopOfSteps(); // Cuộn lên đầu khi component được mount, đặc biệt khi chuyển route
});
</script>

<style scoped>
.page-content-container {
  /* Bạn có thể thêm padding-top ở đây nếu navbar che mất nội dung */
}
.booking-steps-content {
  min-height: 40vh; /* Đảm bảo có chiều cao tối thiểu cho nội dung các bước */
  /* Cân nhắc thêm animation khi chuyển bước nếu muốn */
}
</style>