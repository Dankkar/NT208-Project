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
      >
      </HeroSection>

      <h2 class="text-center fw-bold mt-4 mb-4 display-6">BOOK YOUR STAY</h2>

      <BookingProgressIndicator
        :current-step="currentStep"
        :max-completed-step="maxCompletedStep"
        @navigate-to-step="goToStep"
        class="mb-4 mb-md-5"
      />

      <div class="booking-steps-content">
        <div :key="currentStep">
          <Step1_SearchForm
            v-if="currentStep === 1"
            @search-submitted="handleSearchSubmitted"
          />
          <!-- <div v-if="currentStep === 2" class="text-center py-5">
            <h4 class="text-muted">Step 2: Select Room (Placeholder)</h4>
            <p>Search Params: {{ searchCriteria }}</p>
            <button class="btn btn-primary mt-3" @click="mockGoToNextStepFromStep2">Mock Select Room & Proceed</button>
          </div> -->

          <Step2_RoomSelection
            v-if="currentStep === 2"
            :search-params="searchCriteria"
            @view-packages-clicked="mockGoToNextStepFromStep2"
            />
          <div v-if="currentStep === 3" class="text-center py-5">
            <h4 class="text-muted">Step 3: Guest Info (Placeholder)</h4>
            <p>Selected Room/Package: {{ selectedRoomAndPackage }}</p>
            <button class="btn btn-primary mt-3" @click="mockGoToNextStepFromStep3">Mock Submit Guest Info & Proceed</button>
          </div>
          <div v-if="currentStep === 4" class="text-center py-5">
            <h4 class="text-muted">Step 4: Confirmation (Placeholder)</h4>
            <p>Final Details: {{ finalBookingDetails }}</p>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref } from 'vue';
import Layout from '@/components/Layout.vue';
import HeroSection from '@/components/HeroSection.vue';
import BookingProgressIndicator from '@/components/booking/BookingProgressIndicator.vue';
import Step1_SearchForm from '@/components/booking/steps/Step1_SearchForm.vue';
import Step2_RoomSelection from '../components/booking/steps/Step2_RoomSelection.vue';

import defaultBannerImage from '@/assets/mountain.jpg';

const bannerImageUrl = ref(defaultBannerImage);

const currentStep = ref(1);
const maxCompletedStep = ref(0);
const searchCriteria = ref(null);
const selectedRoomAndPackage = ref(null);
const guestInformation = ref(null);
const finalBookingDetails = ref(null);

function handleSearchSubmitted(data) {
  console.log('Search submitted with data:', data);
  searchCriteria.value = data;
  currentStep.value = 2;
  if (maxCompletedStep.value < 1) maxCompletedStep.value = 1;
  scrollToTopOfSteps();
}
function mockGoToNextStepFromStep2() {
    selectedRoomAndPackage.value = { room: 'Deluxe Mock', package: 'Best Price Mock' };
    currentStep.value = 3;
    if (maxCompletedStep.value < 2) maxCompletedStep.value = 2;
    scrollToTopOfSteps();
}
function mockGoToNextStepFromStep3() {
    guestInformation.value = { name: 'Mock User', email: 'mock@example.com'};
    finalBookingDetails.value = { bookingRef: 'MOCK123', details: 'All mocked up!'};
    currentStep.value = 4;
    if (maxCompletedStep.value < 3) maxCompletedStep.value = 3;
    scrollToTopOfSteps();
}
function goToStep(stepId) {
  if (stepId <= currentStep.value || stepId <= maxCompletedStep.value + 1) {
    if (stepId < currentStep.value) {
      if (stepId < 2) { searchCriteria.value = null; selectedRoomAndPackage.value = null; guestInformation.value = null; finalBookingDetails.value = null; maxCompletedStep.value = 0;}
      if (stepId < 3) { selectedRoomAndPackage.value = null; guestInformation.value = null; finalBookingDetails.value = null; maxCompletedStep.value = Math.min(maxCompletedStep.value, 1); }
      if (stepId < 4) { guestInformation.value = null; finalBookingDetails.value = null; maxCompletedStep.value = Math.min(maxCompletedStep.value, 2);}
    }
    currentStep.value = stepId;
    scrollToTopOfSteps();
  }
}

function scrollToTopOfSteps() {
  const contentContainer = document.querySelector('.page-content-container');
  if (contentContainer) {
    const navbarElement = document.querySelector('.navbar-login'); 
    const navbarHeight = navbarElement ? navbarElement.offsetHeight : 0;
    
    const elementRect = contentContainer.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const offsetPosition = absoluteElementTop - navbarHeight -10;

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

}
.booking-steps-content {
  min-height: 40vh;
}
</style>