<!-- src/components/booking/steps/Step3_GuestInfo.vue -->
<template> 
  <div class="step3-guest-info py-4">
    <BookingTimer v-if="bookingStore.isTimerActive && bookingStore.heldBookingMaDat" />
    <!-- Loading khi store đang finalize booking hoặc không có details cho tóm tắt -->
    <div v-if="bookingStore.isCreatingBooking || isLoadingServices" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">
                {{ bookingStore.isCreatingBooking ? 'Finalizing...' : 'Loading data...' }}
            </span>
        </div>
        <p class="mt-3 text-muted h5">
            {{ bookingStore.isCreatingBooking ? 'Finalizing your booking, please wait...' : 'Loading information...' }}
        </p>
    </div>
    <div v-else-if="!details && !bookingStore.isCreatingBooking" class="text-center">
      <p class="text-muted">Loading booking details or previous steps are incomplete.</p>
      <button class="btn btn-sm btn-outline-secondary" @click="goToPreviousStep">
        <i class="bi bi-arrow-left"></i> Go to Room Selection
      </button>
    </div>

    <div v-else class="row g-4 g-lg-5">
      <div class="col-lg-7">
        <form @submit.prevent="handleSubmit" class="guest-form-section">
          <h4 class="mb-4 fw-semibold">{{ authStore.isAuthenticated ? 'Payment and Services' : 'Guest, Payment and Services' }}</h4>

          <div v-if="bookingStore.createBookingError" class="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error:</strong> {{ bookingStore.createBookingError }}
            <button type="button" class="btn-close" @click="clearcreateBookingError" aria-label="Close"></button>
          </div>

          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">
             {{ authStore.isAuthenticated ? 'Your Information' : 'Guest Information' }}
            </h5>
            <div class="row g-3">
              <div class="col-md-3 col-sm-4">
                <label for="guestTitle" class="form-label small">Title <span class="text-danger">*</span></label>
                <select id="guestTitle" class="form-select form-select-sm" v-model="formData.guestInfo.title" required :disabled="bookingStore.isCreatingBooking">
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Other">Other</option>
                </select>
                <div v-if="formSubmitted && errors.guestInfo.title" class="text-danger small mt-1">{{ errors.guestInfo.title }}</div>
              </div>
              <div class="col-md-4 col-sm-8">
                <label for="guestFirstName" class="form-label small">First Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestFirstName" v-model.trim="formData.guestInfo.firstName" required placeholder="Enter first name" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.guestInfo.firstName" class="text-danger small mt-1">{{ errors.guestInfo.firstName }}</div>
              </div>
              <div class="col-md-5">
                <label for="guestLastName" class="form-label small">Last Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestLastName" v-model.trim="formData.guestInfo.lastName" required placeholder="Enter last name" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.guestInfo.lastName" class="text-danger small mt-1">{{ errors.guestInfo.lastName }}</div>
              </div>
              <div class="col-md-6">
                <label for="guestEmail" class="form-label small">Email Address <span class="text-danger">*</span></label>
                <input type="email" class="form-control form-control-sm" id="guestEmail" v-model.trim="formData.guestInfo.email" required placeholder="e.g., name@example.com" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.guestInfo.email" class="text-danger small mt-1">{{ errors.guestInfo.email }}</div>
              </div>
              <div class="col-md-6">
                <label for="guestPhone" class="form-label small">Phone Number <span class="text-danger">*</span></label>
                <input type="tel" class="form-control form-control-sm" id="guestPhone" v-model.trim="formData.guestInfo.phone" required placeholder="Enter phone number" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.guestInfo.phone" class="text-danger small mt-1">{{ errors.guestInfo.phone }}</div>
              </div>
              <div class="col-md-6">
                <label for="guestNationalId" class="form-label small">National ID / Passport <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestNationalId" v-model.trim="formData.guestInfo.nationalId" required placeholder="Enter National ID or Passport" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.guestInfo.nationalId" class="text-danger small mt-1">{{ errors.guestInfo.nationalId }}</div>
              </div>
              <div class="col-md-3 col-6">
                <label for="guestBirthDate" class="form-label small">Date of Birth</label>
                <input type="date" class="form-control form-control-sm" id="guestBirthDate" v-model="formData.guestInfo.birthDate" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.guestInfo.birthDate" class="text-danger small mt-1">{{ errors.guestInfo.birthDate }}</div>
              </div>
              <div class="col-md-3 col-6">
                <label for="guestGender" class="form-label small">Gender</label>
                <select id="guestGender" class="form-select form-select-sm" v-model="formData.guestInfo.gender" :disabled="bookingStore.isCreatingBooking">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                 <div v-if="formSubmitted && errors.guestInfo.gender" class="text-danger small mt-1">{{ errors.guestInfo.gender }}</div>
              </div>
            </div>
          </section>

          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">Billing Address <span class="text-danger">*</span></h5>
             <div class="row g-3">
                <div class="col-12">
                    <label for="billingStreet" class="form-label small">Street Address <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="billingStreet" v-model.trim="formData.billingAddress.street" required placeholder="123 Main St" :disabled="bookingStore.isCreatingBooking">
                    <div v-if="formSubmitted && errors.billingAddress.street" class="text-danger small mt-1">{{ errors.billingAddress.street }}</div>
                </div>
                <div class="col-md-6">
                    <label for="billingCity" class="form-label small">City <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="billingCity" v-model.trim="formData.billingAddress.city" required placeholder="City name" :disabled="bookingStore.isCreatingBooking">
                    <div v-if="formSubmitted && errors.billingAddress.city" class="text-danger small mt-1">{{ errors.billingAddress.city }}</div>
                </div>
                <div class="col-md-6">
                    <label for="billingPostalCode" class="form-label small">Postal Code <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="billingPostalCode" v-model.trim="formData.billingAddress.postalCode" required placeholder="Postal or ZIP code" :disabled="bookingStore.isCreatingBooking">
                    <div v-if="formSubmitted && errors.billingAddress.postalCode" class="text-danger small mt-1">{{ errors.billingAddress.postalCode }}</div>
                </div>
                <div class="col-12">
                    <label for="billingCountry" class="form-label small">Country <span class="text-danger">*</span></label>
                    <select id="billingCountry" class="form-select form-select-sm" v-model="formData.billingAddress.country" required :disabled="bookingStore.isCreatingBooking">
                        <option disabled value="">Please select a country</option>
                        <option v-for="country in countries" :key="country.code" :value="country.code">{{ country.name }}</option>
                    </select>
                    <div v-if="formSubmitted && errors.billingAddress.country" class="text-danger small mt-1">{{ errors.billingAddress.country }}</div>
                </div>
            </div>
          </section>

          <!-- Additional Services Section -->
          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">Additional Services</h5>
            <div v-if="isLoadingServices" class="text-center my-3">
              <div class="spinner-border spinner-border-sm text-secondary" role="status">
                <span class="visually-hidden">Loading services...</span>
              </div>
            </div>
            <div v-else-if="availableHotelServices.length > 0" class="row g-3">
              <div v-for="service in availableHotelServices" :key="service.MaLoaiDV" class="col-12 col-md-6">
                <div class="card service-card h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 class="card-title small fw-semibold mb-1">{{ service.TenLoaiDV }}</h6>
                        <p v-if="service.MoTaDV" class="card-text extra-small text-muted mb-2">{{ service.MoTaDV }}</p>
                      </div>
                      <p class="card-text small fw-bold mb-0 ms-2 text-nowrap">{{ formatPrice(service.GiaDV) }}</p>
                    </div>
                    <div class="d-flex align-items-center mt-2">
                      <input
                        type="checkbox"
                        :id="`service-${service.MaLoaiDV}`"
                        :value="service.MaLoaiDV"
                        @change="toggleService(service, $event.target.checked)"
                        :checked="isServiceSelected(service.MaLoaiDV)"
                        class="form-check-input me-2"
                        :disabled="bookingStore.isCreatingBooking"
                      />
                      <label :for="`service-${service.MaLoaiDV}`" class="form-check-label small">Add</label>
                      <input
                        v-if="isServiceSelected(service.MaLoaiDV)"
                        type="number"
                        min="1"
                        :value="getSelectedService(service.MaLoaiDV).quantity"
                        @input="updateServiceQuantity(service.MaLoaiDV, parseInt($event.target.value))"
                        class="form-control form-control-sm ms-auto"
                        style="width: 70px;"
                        :disabled="bookingStore.isCreatingBooking"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
             <p v-else class="text-muted small">No additional services currently available for this hotel.</p>
          </section>

          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">Payment Method (Symbolic)</h5>
            <div class="mb-3 payment-icons">
              <i class="bi bi-credit-card-2-front-fill fs-3 me-2 text-primary"></i> <i class="bi bi-credit-card fs-3 me-2 text-success"></i> <i class="bi bi-bank fs-3 me-2 text-warning"></i>
            </div>
            <div class="row g-3">
              <div class="col-12">
                <label for="paymentCardName" class="form-label small">Name on Card <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCardName" v-model.trim="formData.paymentInfo.nameOnCard" required placeholder="Full name as displayed on card" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.nameOnCard" class="text-danger small mt-1">{{ errors.paymentInfo.nameOnCard }}</div>
              </div>
              <div class="col-12">
                <label for="paymentCardNumber" class="form-label small">Card Number <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCardNumber" v-model.trim="formData.paymentInfo.cardNumber" required placeholder="---- ---- ---- ----" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.cardNumber" class="text-danger small mt-1">{{ errors.paymentInfo.cardNumber }}</div>
              </div>
              <div class="col-md-6">
                <label for="paymentExpiryDate" class="form-label small">Expiry Date (MM/YY) <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentExpiryDate" v-model.trim="formData.paymentInfo.expiryDate" required placeholder="MM/YY" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.expiryDate" class="text-danger small mt-1">{{ errors.paymentInfo.expiryDate }}</div>
              </div>
              <div class="col-md-6">
                <label for="paymentCvv" class="form-label small">CVV/CVC <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCvv" v-model.trim="formData.paymentInfo.cvv" required placeholder="---" maxlength="4" :disabled="bookingStore.isCreatingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.cvv" class="text-danger small mt-1">{{ errors.paymentInfo.cvv }}</div>
              </div>
            </div>
          </section>

          <div class="form-check mb-4">
            <input class="form-check-input" type="checkbox" id="termsAndConditions" v-model="formData.agreedToTerms" :disabled="bookingStore.isCreatingBooking">
            <label class="form-check-label small" for="termsAndConditions">
              I have read and agree to the <a href="#" @click.prevent class="text-decoration-none">terms and conditions</a> and <a href="#" @click.prevent class="text-decoration-none">privacy policy</a>.
            </label>
            <div v-if="formSubmitted && errors.agreedToTerms" class="text-danger small mt-1">{{ errors.agreedToTerms }}</div>
          </div>

          <div class="text-end mb-4">
            <Button
                content="Confirm & Finalize Booking"
                type="submit"
                :is-loading="bookingStore.isCreatingBooking"
                :disabled="bookingStore.isCreatingBooking || !bookingStore.isTimerActive"
                textColor="#fff" fontSize="18px" backgroundColor="black"
                colorHover="white" bgHover="#198754" borderRadius="6px"
                class="w-100 text-uppercase fw-bold py-2"
                />
          </div>
          <div v-if="!bookingStore.isTimerActive" class="alert alert-danger small text-center">
            Your booking hold has expired. Please <a href="#" @click.prevent="goToPreviousStep">go back to room selection</a> and try again.
          </div>
        </form>
      </div>
      <div class="col-lg-5">
        <div class="booking-summary-section sticky-top-summary" v-if="details">
          <h5 class="summary-title">Booking Summary</h5>
          <div class="summary-block" v-if="details.bookingDetail?.hotelInfo">
            <h6 class="hotel-name">{{ details.bookingDetail.hotelInfo.TenKS }}</h6>
            <p class="summary-text-light mb-0">{{ details.bookingDetail.hotelInfo.DiaChi }}</p>
          </div>
          <div class="summary-block" v-if="details.searchInfo">
            <div class="summary-item"><span class="item-label">Check-in:</span><span class="item-value">{{ details.searchInfo.checkInDateFormatted || '–' }}</span></div>
            <div class="summary-item"><span class="item-label">Check-out:</span><span class="item-value">{{ details.searchInfo.checkOutDateFormatted || '–' }}</span></div>
            <div class="summary-item"><span class="item-label">Duration:</span><span class="item-value">{{ details.searchInfo.durationText || '–' }}</span></div>
            <div class="summary-item"><span class="item-label">Guests:</span><span class="item-value">{{ details.searchInfo.numberOfGuests }} adult(s)</span></div>
          </div>
          <div class="summary-block" v-if="details.bookingDetail?.roomInfo">
            <h6 class="room-name">{{ details.bookingDetail.roomInfo.TenLoaiPhong }}</h6>
            <div class="summary-item" v-if="details.paymentSummaryPreview">
                <span class="item-label">({{ details.searchInfo.numberOfNights }} night<span v-if="details.searchInfo.numberOfNights !== 1">s</span> at {{ formatPricePerNight(details.paymentSummaryPreview.roomPricePerNight) }})</span>
                <span class="item-value">{{ formatPrice(details.paymentSummaryPreview.subtotal) }}</span>
            </div>
          </div>
           <div class="summary-block" v-if="formData.services.length > 0">
            <h6 class="room-name">Selected Services</h6>
            <div v-for="service in formData.services" :key="service.MaLoaiDV" class="summary-item">
              <span class="item-label">{{ service.TenLoaiDV }} (x{{ service.quantity }})</span>
              <span class="item-value">{{ formatPrice(service.GiaDV * service.quantity) }}</span>
            </div>
          </div>
          <div class="summary-block summary-total-final" v-if="details.paymentSummaryPreview">
            <div class="summary-item"><span class="item-label summary-text-light">Subtotal (Rooms)</span><span class="item-value summary-text-light">{{ formatPrice(details.paymentSummaryPreview.subtotal) }}</span></div>
            <div class="summary-item" v-if="totalSelectedServicesPrice > 0">
              <span class="item-label summary-text-light">Subtotal (Services)</span>
              <span class="item-value summary-text-light">{{ formatPrice(totalSelectedServicesPrice) }}</span>
            </div>
            <div class="summary-item">
              <span class="item-label summary-text-light">Taxes & Fees (est. 10%)</span>
              <span class="item-value summary-text-light">{{ formatPrice(estimatedTaxesAndFees) }}</span>
            </div>
            <hr class="summary-divider my-2">
            <div class="summary-item total-amount-display">
              <span class="item-label">TOTAL (EST.)</span>
              <span class="item-value">{{ formatPrice(estimatedGrandTotal) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center p-3 border rounded bg-light sticky-top-summary"><p class="text-muted">Summary not available.</p></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, defineEmits } from 'vue';
import Button from "../../Button.vue";
import { useBookingStore } from '@/store/bookingStore';
import axios from 'axios';
import BookingTimer from '../../booking/BookingTimer.vue';
import { useAuthStore } from '../../../store/authStore';

const emit = defineEmits(['booking-finalization-requested']);
const bookingStore = useBookingStore();
const authStore = useAuthStore();

const defaultFormData = () => ({
  guestInfo: { title: 'Mr.', firstName: '', lastName: '', nationalId: '', phone: '', email: '', birthDate: '', gender: '' },
  paymentInfo: { nameOnCard: '', cardNumber: '', expiryDate: '', cvv: '' },
  services: [],
  promotionCode: '',
  agreedToTerms: false,
  billingAddress: { street: '', city: '', postalCode: '', country: 'VN' } // Đặt VN làm mặc định nếu muốn
});
const formData = reactive(defaultFormData());

const errors = reactive({
  guestInfo: { title: '', firstName: '', lastName: '', nationalId: '', phone: '', email: '', birthDate: '', gender: '' },
  paymentInfo: { nameOnCard: '', cardNumber: '', expiryDate: '', cvv: '' },
  billingAddress: { street: '', city: '', postalCode: '', country: '' },
  agreedToTerms: ''
});
const formSubmitted = ref(false);

const countries = ref([
    { code: 'VN', name: 'Vietnam' }, { code: 'US', name: 'United States' },
    { code: 'SG', name: 'Singapore' }, { code: 'KR', name: 'South Korea' },
    { code: 'JP', name: 'Japan' }, { code: 'OTHER', name: 'Other' },
]);
const details = computed(() => bookingStore.dataForStep3Display);

const availableHotelServices = ref([]);
const isLoadingServices = ref(false);

async function fetchHotelServices(maKS) {
  if (!maKS) return;
  isLoadingServices.value = true;
  availableHotelServices.value = []; // Xóa danh sách cũ
  // Reset services đã chọn trong formData nếu fetch lại services
  // Hoặc chỉ reset nếu danh sách mới không chứa service đã chọn (logic phức tạp hơn)
  // Cách đơn giản: formData.services = [];
  try {
    const response = await axios.get(`api/services/hotel/${maKS}`); // Giả sử baseURL đã có /api
    if (response.data && response.data.success) {
      availableHotelServices.value = response.data.data || [];
    } else {
      console.error("Failed to fetch hotel services:", response.data.message);
      availableHotelServices.value = []; // Đảm bảo là mảng rỗng khi lỗi
    }
  } catch (error) {
    console.error("Error fetching hotel services:", error);
    availableHotelServices.value = [];
  } finally {
    isLoadingServices.value = false;
  }
}

const isServiceSelected = (maLoaiDV) => {
  return formData.services.some(s => s.MaLoaiDV === maLoaiDV);
};

const getSelectedService = (maLoaiDV) => {
  return formData.services.find(s => s.MaLoaiDV === maLoaiDV) || { quantity: 1 }; // Fallback quantity
};

const toggleService = (service, isChecked) => {
  const index = formData.services.findIndex(s => s.MaLoaiDV === service.MaLoaiDV);
  if (isChecked) {
    if (index === -1) { // Chỉ thêm nếu chưa có
      formData.services.push({
        MaLoaiDV: service.MaLoaiDV,
        TenLoaiDV: service.TenLoaiDV,
        GiaDV: service.GiaDV,
        quantity: 1
      });
    }
  } else {
    if (index !== -1) { // Chỉ xóa nếu có
      formData.services.splice(index, 1);
    }
  }
};

const updateServiceQuantity = (maLoaiDV, quantityString) => {
  const serviceInForm = getSelectedService(maLoaiDV);
  if (serviceInForm && serviceInForm.MaLoaiDV) { // Kiểm tra serviceInForm có tồn tại thực sự trong formData.services
    const newQuantity = parseInt(quantityString, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      serviceInForm.quantity = newQuantity;
    } else if (!isNaN(newQuantity) && newQuantity < 1) {
      serviceInForm.quantity = 1; // Hoặc xóa service nếu số lượng là 0 (toggleService sẽ làm điều này nếu uncheck)
    }
    // Nếu quantityString không phải là số, không làm gì cả hoặc set lại giá trị cũ
  }
};

const totalSelectedServicesPrice = computed(() => {
    return formData.services.reduce((total, service) => total + (service.GiaDV * service.quantity), 0);
});

const estimatedTaxesAndFees = computed(() => {
    const roomSubtotal = details.value?.paymentSummaryPreview?.subtotal || 0;
    return (roomSubtotal + totalSelectedServicesPrice.value) * 0.1;
});

const estimatedGrandTotal = computed(() => {
    const roomSubtotal = details.value?.paymentSummaryPreview?.subtotal || 0;
    return roomSubtotal + totalSelectedServicesPrice.value + estimatedTaxesAndFees.value;
});

function resetFormToDefaults() {
    const defaults = defaultFormData(); // Lấy object mới từ hàm
    Object.assign(formData.guestInfo, defaults.guestInfo);
    Object.assign(formData.paymentInfo, defaults.paymentInfo);
    formData.services = [...defaults.services]; // Sao chép mảng
    formData.promotionCode = defaults.promotionCode;
    formData.agreedToTerms = defaults.agreedToTerms;
    Object.assign(formData.billingAddress, defaults.billingAddress);

    Object.keys(errors.guestInfo).forEach(key => errors.guestInfo[key] = '');
    Object.keys(errors.paymentInfo).forEach(key => errors.paymentInfo[key] = '');
    Object.keys(errors.billingAddress).forEach(key => errors.billingAddress[key] = '');
    errors.agreedToTerms = '';
    formSubmitted.value = false;
}

function initializeFormDataFromStore() {

  formSubmitted.value = false;
  const defaults = defaultFormData();
    console.log("STEP 3 INIT - START");
  console.log("STEP 3 INIT - bookingStore.guestAndPaymentInput:", JSON.parse(JSON.stringify(bookingStore.guestAndPaymentInput)));
  console.log("STEP 3 INIT - authStore.isAuthenticated:", authStore.isAuthenticated);
  console.log("STEP 3 INIT - authStore.currentUser:", JSON.parse(JSON.stringify(authStore.currentUser)));


  if (bookingStore.guestAndPaymentInput && typeof bookingStore.guestAndPaymentInput === 'object') {
        console.log("STEP 3 INIT: Branch 1 - Using guestAndPaymentInput from bookingStore.");
    const stored = JSON.parse(JSON.stringify(bookingStore.guestAndPaymentInput));
    formData.guestInfo = { ...defaults.guestInfo, ...(stored.guestInfo || {}) };
    formData.paymentInfo = { ...defaults.paymentInfo, ...(stored.paymentInfo || {}) };
    formData.services = Array.isArray(stored.services) ? [...stored.services] : [...defaults.services];
    formData.promotionCode = typeof stored.promotionCode === 'string' ? stored.promotionCode : defaults.promotionCode;
    formData.agreedToTerms = typeof stored.agreedToTerms === 'boolean' ? stored.agreedToTerms : defaults.agreedToTerms;
    formData.billingAddress = { ...defaults.billingAddress, ...(stored.billingAddress || {}) };
  } else if(authStore.isAuthenticated && authStore.currentUser) {
        console.log("STEP 3 INIT: Branch 2 - User logged in, pre-filling GUEST INFO from profile.");
      const userProfile = authStore.currentUser;
      let firstName = '';
      let lastName = '';
      if (userProfile.HoTen) {
        const nameParts = userProfile.HoTen.trim().split(' ');
        if(nameParts.length > 1 ) {
        firstName = nameParts.pop();
        lastName = nameParts.join(' ');
      } 
      else {
        lastName = userProfile.HoTen;
      }

      let title = defaults.guestInfo.title;
    if (userProfile.GioiTinh) {
        if (userProfile.GioiTinh.toLowerCase() === 'nam') title = 'Mr.';
        else if (userProfile.GioiTinh.toLowerCase() === 'nữ') title = 'Ms.';
        
    }

    formData.guestInfo.title = title;
    formData.guestInfo.firstName = firstName;
    formData.guestInfo.lastName = lastName;
    formData.guestInfo.email = userProfile.Email || '';
    formData.guestInfo.phone = userProfile.SDT || '';
    formData.guestInfo.nationalId = userProfile.CCCD || '';
    formData.guestInfo.birthDate = userProfile.NgaySinh ? userProfile.NgaySinh.substring(0, 10) : ''; // Format YYYY-MM-DD
    formData.guestInfo.gender = userProfile.GioiTinh || '';

    console.log("STEP 3 INIT: Branch 2 - formData.guestInfo after prefill from profile:", JSON.parse(JSON.stringify(formData.guestInfo)))

    // Khi guestInfo được điền từ profile, các phần khác sẽ lấy từ giá trị mặc định
    Object.assign(formData.billingAddress, defaults.billingAddress); // ĐÚNG: Reset billingAddress về mặc định
    formData.paymentInfo = { ...defaults.paymentInfo };
    formData.services = [...defaults.services];
    formData.promotionCode = defaults.promotionCode;
    formData.agreedToTerms = defaults.agreedToTerms;

  }

  let genderForForm = '';
if (userProfile.GioiTinh) {
  const apiGender = userProfile.GioiTinh.toLowerCase();
  if (apiGender === 'nam') {
    genderForForm = 'Male';
  } else if (apiGender === 'nữ' || apiGender === 'nu') { // Bao gồm cả 'nu' nếu có thể
    genderForForm = 'Female';
  } else if (apiGender === 'khác' || apiGender === 'khac' || apiGender === 'other') {
    genderForForm = 'Other';
  }
  // Nếu không khớp, genderForForm sẽ vẫn là '', và "Select..." sẽ được chọn
}
formData.guestInfo.gender = genderForForm;

}
    
  else {
    console.log("STEP 3 INIT: Branch 3 - Resetting to defaults.");
  resetFormToDefaults();;
}
console.log("STEP 3 INIT - END - Final formData.guestInfo:", JSON.parse(JSON.stringify(formData.guestInfo)));
}


onMounted(() => {
  initializeFormDataFromStore();
  if (details.value && bookingStore.selectedHotelDetails?.MaKS) { // Chỉ fetch nếu có details (tức là Step 2 đã xong)
    fetchHotelServices(bookingStore.selectedHotelDetails.MaKS);
  }
});

watch(() => bookingStore.selectedHotelDetails?.MaKS, (newMaKS, oldMaKS) => {
  if (newMaKS && newMaKS !== oldMaKS) {
    fetchHotelServices(newMaKS);
    formData.services = []; // Reset services đã chọn khi khách sạn thay đổi
  }
});

watch(
  // Lắng nghe guestAndPaymentInput VÀ trạng thái đăng nhập/thông tin user
  () => [
    bookingStore.guestAndPaymentInput,
    authStore.isAuthenticated,
    authStore.currentUser?.MaKH // Dùng ID để biết user có thay đổi thực sự không
  ],
  ([newGuestInput, newIsAuth, newUserId], [oldGuestInput, oldIsAuth, oldUserId]) => {
    const formDataString = JSON.stringify(formData);

    // Kịch bản 1: guestAndPaymentInput được store set (hoặc reset)
    if (newGuestInput !== oldGuestInput || (newGuestInput && JSON.stringify(newGuestInput) !== formDataString)) {
      console.log("Step3 Watch: guestAndPaymentInput changed or differs from formData. Re-initializing.");
      initializeFormDataFromStore();
    }
    // Kịch bản 2: Người dùng vừa đăng nhập VÀ chưa có dữ liệu form cụ thể cho lượt booking này
    else if (!newGuestInput && newIsAuth && !oldIsAuth) {
      console.log("Step3 Watch: User just logged in and no current form data. Re-initializing to prefill.");
      initializeFormDataFromStore();
    }
    // Kịch bản 3: Người dùng vừa đăng xuất, và form đang chứa thông tin của họ -> reset
    else if (oldIsAuth && !newIsAuth && oldUserId && formData.guestInfo.email === authStore.currentUser /*Lúc này currentUser là null sau logout, cần lưu email cũ để so sánh*/) {
        // Logic này phức tạp hơn, có thể chỉ cần reset nếu oldUserId khớp với một ID đã lưu trước đó.
        // Đơn giản nhất là initializeFormDataFromStore() cũng sẽ tự reset về default nếu !isAuthenticated.
        console.log("Step3 Watch: User just logged out. Re-initializing form.");
        initializeFormDataFromStore();
    }
  },
  { deep: true }
);

function validateFormFields() {
  let isValid = true;
  const guest = formData.guestInfo;
  const payment = formData.paymentInfo;
  const billing = formData.billingAddress;
  const guestErrs = errors.guestInfo;
  const paymentErrs = errors.paymentInfo;
  const billingErrs = errors.billingAddress;

  guestErrs.title = !guest.title ? 'Title is required.' : ''; if (guestErrs.title) isValid = false;
  guestErrs.firstName = !guest.firstName ? 'First name is required.' : ''; if (guestErrs.firstName) isValid = false;
  guestErrs.lastName = !guest.lastName ? 'Last name is required.' : ''; if (guestErrs.lastName) isValid = false;
  guestErrs.nationalId = !guest.nationalId ? 'National ID/Passport is required.' : ''; if (guestErrs.nationalId) isValid = false;
  if (!guest.phone) { guestErrs.phone = 'Phone number is required.'; isValid = false;
  } else if (!/^\+?[0-9\s-()]{7,20}$/.test(guest.phone)) { guestErrs.phone = 'Valid phone number required (7-20 digits).'; isValid = false;
  } else { guestErrs.phone = ''; }
  if (!guest.email) { guestErrs.email = 'Email address is required.'; isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) { guestErrs.email = 'Valid email address required.'; isValid = false;
  } else { guestErrs.email = ''; }
  // Optional validation for birthDate and gender
  guestErrs.birthDate = '';
  guestErrs.gender = '';

  billingErrs.street = !billing.street ? 'Billing street address is required.' : ''; if (billingErrs.street) isValid = false;
  billingErrs.city = !billing.city ? 'Billing city is required.' : ''; if (billingErrs.city) isValid = false;
  billingErrs.postalCode = !billing.postalCode ? 'Billing postal code is required.' : ''; if (billingErrs.postalCode) isValid = false;
  billingErrs.country = !billing.country ? 'Billing country is required.' : ''; if (billingErrs.country) isValid = false;

  paymentErrs.nameOnCard = !payment.nameOnCard ? 'Name on card is required.' : ''; if (paymentErrs.nameOnCard) isValid = false;
  if (!payment.cardNumber) { paymentErrs.cardNumber = 'Card number is required.'; isValid = false;
  } else if (!/^[0-9]{13,19}$/.test(payment.cardNumber.replace(/\s/g, ''))) { paymentErrs.cardNumber = 'Valid card number (13-19 digits).'; isValid = false;
  } else { paymentErrs.cardNumber = ''; }
  if (!payment.expiryDate) { paymentErrs.expiryDate = 'Expiry date (MM/YY) is required.'; isValid = false;
  } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(payment.expiryDate)) { paymentErrs.expiryDate = 'Valid MM/YY format (e.g., 12/25).'; isValid = false;
  } else { paymentErrs.expiryDate = ''; }
  if (!payment.cvv) { paymentErrs.cvv = 'CVV/CVC is required.'; isValid = false;
  } else if (!/^[0-9]{3,4}$/.test(payment.cvv)) { paymentErrs.cvv = 'Valid CVV (3 or 4 digits).'; isValid = false;
  } else { paymentErrs.cvv = ''; }

  errors.agreedToTerms = !formData.agreedToTerms ? 'You must agree to terms and conditions.' : ''; if (errors.agreedToTerms) isValid = false;
  
  return isValid;
}

const handleSubmit = () => {
  formSubmitted.value = true;
  if (!validateFormFields()) return;
  if (!bookingStore.isTimerActive && bookingStore.heldBookingMaDat) {
      alert("Your booking hold has expired. Please go back to room selection and try again.");
      return;
  }
  if (bookingStore.createBookingError) bookingStore.createBookingError = null;
  emit('booking-finalization-requested', JSON.parse(JSON.stringify(formData)));
};

function goToPreviousStep() { bookingStore.navigateToStep(2); }
function clearcreateBookingError() { bookingStore.createBookingError = null; }

const formatPriceBase = (value) => {
  if (value == null || isNaN(parseFloat(value))) return 'N/A';
  value = Math.round(parseFloat(value));
  return value.toLocaleString('vi-VN');
};
const formatPrice = (value) => formatPriceBase(value) + ' VND';
const formatPricePerNight = (value) => formatPriceBase(value) + '/night';
</script>

<style scoped>
.form-label-sm { font-size: 0.8rem; margin-bottom: 0.25rem; color: #555; }
.section-title { font-size: 1.1rem; color: #4A4A4A; border-bottom: 1px solid #E0DACC; padding-bottom: 0.75rem; margin-bottom: 1.25rem !important; font-weight: 600; }
.sticky-top-summary { top: 90px; z-index: 1000; position: sticky; } 
.booking-summary-section { background-color: #F8F5F0; border: 1px solid #E7E0D7 !important; border-radius: 6px !important; padding: 1.25rem !important; color: #4B4B4B; font-size: 0.875rem; }
.summary-title { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 1.4rem; font-weight: 700; color: #333333; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #E7E0D7; }
.hotel-name, .room-name { font-weight: 600; color: #333333; font-size: 1rem; margin-bottom: 0.3rem; }
.summary-text-light { color: #757575; font-size: 0.825rem; }
.summary-block { margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid #E7E0D7; }
.summary-block:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.summary-item { display: flex; justify-content: space-between; margin-bottom: 0.5rem; line-height: 1.5; }
.item-label { color: #555555; }
.item-value { font-weight: 500; color: #333333; text-align: right; }
.summary-divider { border-color: #E0DACC !important; }
.total-amount-display .item-label, .total-amount-display .item-value { font-size: 1.15rem; color: #212529; font-weight: 700; text-transform: uppercase; }
.payment-icons i { opacity: 0.7; transition: opacity 0.2s ease-in-out; }
.payment-icons i:hover { opacity: 1; }
.form-control-sm { border-radius: 0.2rem; }
.form-select-sm { border-radius: 0.2rem; }
.service-card { font-size: 0.9rem; margin-bottom: 0.75rem; }
.service-card .card-body { padding: 0.75rem 1rem; }
.extra-small { font-size: 0.75rem; }
</style>