<!-- src/components/booking/steps/Step3_GuestInfo.vue -->
<template>
  <div class="step3-guest-info py-4">
    <!-- Loading khi store đang finalize booking hoặc không có details cho tóm tắt -->
    <div v-if="bookingStore.isFinalizingBooking" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Finalizing...</span>
        </div>
        <p class="mt-3 text-muted h5">Finalizing your booking, please wait...</p>
    </div>
    <div v-else-if="!details && !bookingStore.isFinalizingBooking" class="text-center">
      <p class="text-muted">Loading booking details or previous steps are incomplete.</p>
      <button class="btn btn-sm btn-outline-secondary" @click="goToPreviousStep">
        <i class="bi bi-arrow-left"></i> Go to Room Selection
      </button>
    </div>

    <div v-else class="row g-4 g-lg-5">
      <div class="col-lg-7">
        <form @submit.prevent="handleSubmit" class="guest-form-section">
          <h4 class="mb-4 fw-semibold">Guest & Payment Information</h4>

          <div v-if="bookingStore.finalizeError" class="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error:</strong> {{ bookingStore.finalizeError }}
            <button type="button" class="btn-close" @click="clearFinalizeError" aria-label="Close"></button>
          </div>

          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">Guest Information</h5>
            <div class="row g-3">
              <div class="col-md-3 col-sm-4">
                <label for="guestTitle" class="form-label small">Title <span class="text-danger">*</span></label>
                <select id="guestTitle" class="form-select form-select-sm" v-model="formData.guestInfo.title" required :disabled="bookingStore.isFinalizingBooking">
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Other">Other</option>
                </select>
                <div v-if="formSubmitted && errors.guestInfo.title" class="text-danger small mt-1">{{ errors.guestInfo.title }}</div>
              </div>
              <div class="col-md-4 col-sm-8">
                <label for="guestFirstName" class="form-label small">First Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestFirstName" v-model.trim="formData.guestInfo.firstName" required placeholder="Enter first name" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.guestInfo.firstName" class="text-danger small mt-1">{{ errors.guestInfo.firstName }}</div>
              </div>
              <div class="col-md-5">
                <label for="guestLastName" class="form-label small">Last Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestLastName" v-model.trim="formData.guestInfo.lastName" required placeholder="Enter last name" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.guestInfo.lastName" class="text-danger small mt-1">{{ errors.guestInfo.lastName }}</div>
              </div>
              <div class="col-md-6">
                <label for="guestEmail" class="form-label small">Email Address <span class="text-danger">*</span></label>
                <input type="email" class="form-control form-control-sm" id="guestEmail" v-model.trim="formData.guestInfo.email" required placeholder="e.g., name@example.com" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.guestInfo.email" class="text-danger small mt-1">{{ errors.guestInfo.email }}</div>
              </div>
              <div class="col-md-6">
                <label for="guestPhone" class="form-label small">Phone Number <span class="text-danger">*</span></label>
                <input type="tel" class="form-control form-control-sm" id="guestPhone" v-model.trim="formData.guestInfo.phone" required placeholder="Enter phone number" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.guestInfo.phone" class="text-danger small mt-1">{{ errors.guestInfo.phone }}</div>
              </div>
              <div class="col-md-6"> <!-- Thay đổi col-12 thành col-md-6 -->
                <label for="guestNationalId" class="form-label small">National ID / Passport <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestNationalId" v-model.trim="formData.guestInfo.nationalId" required placeholder="Enter National ID or Passport" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.guestInfo.nationalId" class="text-danger small mt-1">{{ errors.guestInfo.nationalId }}</div>
              </div>
              <div class="col-md-3 col-6"> <!-- Điều chỉnh cột cho Date of Birth -->
                <label for="guestBirthDate" class="form-label small">Date of Birth</label>
                <input type="date" class="form-control form-control-sm" id="guestBirthDate" v-model="formData.guestInfo.birthDate" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.guestInfo.birthDate" class="text-danger small mt-1">{{ errors.guestInfo.birthDate }}</div>
              </div>
              <div class="col-md-3 col-6"> <!-- Điều chỉnh cột cho Gender -->
                <label for="guestGender" class="form-label small">Gender</label>
                <select id="guestGender" class="form-select form-select-sm" v-model="formData.guestInfo.gender" :disabled="bookingStore.isFinalizingBooking">
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
                    <input type="text" class="form-control form-control-sm" id="billingStreet" v-model.trim="formData.billingAddress.street" required placeholder="123 Main St" :disabled="bookingStore.isFinalizingBooking">
                    <div v-if="formSubmitted && errors.billingAddress.street" class="text-danger small mt-1">{{ errors.billingAddress.street }}</div>
                </div>
                <div class="col-md-6">
                    <label for="billingCity" class="form-label small">City <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="billingCity" v-model.trim="formData.billingAddress.city" required placeholder="City name" :disabled="bookingStore.isFinalizingBooking">
                    <div v-if="formSubmitted && errors.billingAddress.city" class="text-danger small mt-1">{{ errors.billingAddress.city }}</div>
                </div>
                <div class="col-md-6">
                    <label for="billingPostalCode" class="form-label small">Postal Code <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" id="billingPostalCode" v-model.trim="formData.billingAddress.postalCode" required placeholder="Postal or ZIP code" :disabled="bookingStore.isFinalizingBooking">
                    <div v-if="formSubmitted && errors.billingAddress.postalCode" class="text-danger small mt-1">{{ errors.billingAddress.postalCode }}</div>
                </div>
                <div class="col-12">
                    <label for="billingCountry" class="form-label small">Country <span class="text-danger">*</span></label>
                    <select id="billingCountry" class="form-select form-select-sm" v-model="formData.billingAddress.country" required :disabled="bookingStore.isFinalizingBooking">
                        <option disabled value="">Please select a country</option>
                        <option v-for="country in countries" :key="country.code" :value="country.code">{{ country.name }}</option>
                    </select>
                    <div v-if="formSubmitted && errors.billingAddress.country" class="text-danger small mt-1">{{ errors.billingAddress.country }}</div>
                </div>
            </div>
          </section>

          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">Payment Method (Symbolic)</h5>
            <div class="mb-3 payment-icons">
              <i class="bi bi-credit-card-2-front-fill fs-3 me-2 text-primary"></i> <i class="bi bi-credit-card fs-3 me-2 text-success"></i> <i class="bi bi-bank fs-3 me-2 text-warning"></i>
            </div>
            <div class="row g-3">
              <div class="col-12">
                <label for="paymentCardName" class="form-label small">Name on Card <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCardName" v-model.trim="formData.paymentInfo.nameOnCard" required placeholder="Full name as displayed on card" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.nameOnCard" class="text-danger small mt-1">{{ errors.paymentInfo.nameOnCard }}</div>
              </div>
              <div class="col-12">
                <label for="paymentCardNumber" class="form-label small">Card Number <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCardNumber" v-model.trim="formData.paymentInfo.cardNumber" required placeholder="---- ---- ---- ----" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.cardNumber" class="text-danger small mt-1">{{ errors.paymentInfo.cardNumber }}</div>
              </div>
              <div class="col-md-6">
                <label for="paymentExpiryDate" class="form-label small">Expiry Date (MM/YY) <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentExpiryDate" v-model.trim="formData.paymentInfo.expiryDate" required placeholder="MM/YY" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.expiryDate" class="text-danger small mt-1">{{ errors.paymentInfo.expiryDate }}</div>
              </div>
              <div class="col-md-6">
                <label for="paymentCvv" class="form-label small">CVV/CVC <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCvv" v-model.trim="formData.paymentInfo.cvv" required placeholder="---" maxlength="4" :disabled="bookingStore.isFinalizingBooking">
                <div v-if="formSubmitted && errors.paymentInfo.cvv" class="text-danger small mt-1">{{ errors.paymentInfo.cvv }}</div>
              </div>
            </div>
          </section>

          <div class="form-check mb-4">
            <input class="form-check-input" type="checkbox" id="termsAndConditions" v-model="formData.agreedToTerms" :disabled="bookingStore.isFinalizingBooking">
            <label class="form-check-label small" for="termsAndConditions">
              I have read and agree to the <a href="#" @click.prevent class="text-decoration-none">terms and conditions</a> and <a href="#" @click.prevent class="text-decoration-none">privacy policy</a>.
            </label>
            <div v-if="formSubmitted && errors.agreedToTerms" class="text-danger small mt-1">{{ errors.agreedToTerms }}</div>
          </div>

          <div class="text-end mb-4">
            <Button
                content="Confirm & Finalize Booking"
                type="submit"
                :is-loading="bookingStore.isFinalizingBooking"
                :disabled="bookingStore.isFinalizingBooking || !bookingStore.isTimerActive"
                textColor="#fff" fontSize="18px" backgroundColor="black"
                colorHover="white" bgHover="#198754" borderRadius="6px"
                class="w-100 text-uppercase fw-bold py-2"
                />
          </div>
          <div v-if="!bookingStore.isTimerActive && bookingStore.heldBookingMaDat" class="alert alert-danger small text-center">
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
          <div class="summary-block summary-total-final" v-if="details.paymentSummaryPreview">
            <div class="summary-item"><span class="item-label summary-text-light">Subtotal</span><span class="item-value summary-text-light">{{ formatPrice(details.paymentSummaryPreview.subtotal) }}</span></div>
            <div class="summary-item"><span class="item-label summary-text-light">Taxes & Fees (est. 10%)</span><span class="item-value summary-text-light">{{ formatPrice(details.paymentSummaryPreview.taxesAndFees) }}</span></div>
            <hr class="summary-divider my-2">
            <div class="summary-item total-amount-display"><span class="item-label">TOTAL</span><span class="item-value">{{ formatPrice(details.paymentSummaryPreview.totalAmount) }}</span></div>
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

const emit = defineEmits(['booking-finalization-requested']);
const bookingStore = useBookingStore();

const defaultFormData = () => ({
  guestInfo: {
    title: 'Mr.',
    firstName: '',
    lastName: '',
    nationalId: '',
    phone: '',
    email: '',
    birthDate: '', // Thêm birthDate
    gender: ''      // Thêm gender
  },
  paymentInfo: {
    nameOnCard: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  },
  services: [], // Giả sử bạn có thể thêm services sau này
  promotionCode: '',
  agreedToTerms: false,
  // billingAddressSameAsContact đã bị BỎ
  billingAddress: {
    street: '',
    city: '',
    postalCode: '',
    country: '' // Nên có giá trị mặc định, ví dụ 'VN' nếu phổ biến nhất
  }
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

function resetFormToDefaults() {
    // Sao chép sâu object mặc định để tránh tham chiếu
    const defaults = JSON.parse(JSON.stringify(defaultFormData()));
    Object.assign(formData.guestInfo, defaults.guestInfo);
    Object.assign(formData.paymentInfo, defaults.paymentInfo);
    formData.services = defaults.services;
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
  if (bookingStore.guestAndPaymentInput && typeof bookingStore.guestAndPaymentInput === 'object') {
    const stored = JSON.parse(JSON.stringify(bookingStore.guestAndPaymentInput)); // Deep clone
    const defaults = defaultFormData();

    formData.guestInfo = { ...defaults.guestInfo, ...(stored.guestInfo || {}) };
    formData.paymentInfo = { ...defaults.paymentInfo, ...(stored.paymentInfo || {}) };
    formData.services = Array.isArray(stored.services) ? [...stored.services] : defaults.services;
    formData.promotionCode = typeof stored.promotionCode === 'string' ? stored.promotionCode : defaults.promotionCode;
    formData.agreedToTerms = typeof stored.agreedToTerms === 'boolean' ? stored.agreedToTerms : defaults.agreedToTerms;
    // billingAddressSameAsContact đã bị bỏ
    formData.billingAddress = { ...defaults.billingAddress, ...(stored.billingAddress || {}) };
  } else {
    resetFormToDefaults();
  }
}

onMounted(() => {
  initializeFormDataFromStore();
});

watch(() => bookingStore.guestAndPaymentInput, () => {
    initializeFormDataFromStore();
}, { deep: true });

function validateFormFields() {
  let isValid = true;
  const guest = formData.guestInfo;
  const payment = formData.paymentInfo;
  const billing = formData.billingAddress; // billingAddress giờ luôn được dùng
  const guestErrs = errors.guestInfo;
  const paymentErrs = errors.paymentInfo;
  const billingErrs = errors.billingAddress;

  // Guest Info Validation
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
  // Validation cho Ngày sinh và Giới tính (nếu bạn muốn chúng bắt buộc)
  // guestErrs.birthDate = !guest.birthDate ? 'Date of birth is required.' : ''; if (guestErrs.birthDate) isValid = false;
  // guestErrs.gender = !guest.gender ? 'Gender is required.' : ''; if (guestErrs.gender) isValid = false;
  // Nếu không bắt buộc, thì không cần set lỗi trừ khi có định dạng sai
  guestErrs.birthDate = ''; // Ví dụ: không bắt buộc
  guestErrs.gender = '';   // Ví dụ: không bắt buộc


  // Billing Address Validation (BẮT BUỘC)
  billingErrs.street = !billing.street ? 'Billing street address is required.' : ''; if (billingErrs.street) isValid = false;
  billingErrs.city = !billing.city ? 'Billing city is required.' : ''; if (billingErrs.city) isValid = false;
  billingErrs.postalCode = !billing.postalCode ? 'Billing postal code is required.' : ''; if (billingErrs.postalCode) isValid = false;
  billingErrs.country = !billing.country ? 'Billing country is required.' : ''; if (billingErrs.country) isValid = false;

  // Payment Info Validation
  paymentErrs.nameOnCard = !payment.nameOnCard ? 'Name on card is required.' : ''; if (paymentErrs.nameOnCard) isValid = false;
  if (!payment.cardNumber) { paymentErrs.cardNumber = 'Card number is required.'; isValid = false;
  } else if (!/^[0-9]{13,19}$/.test(payment.cardNumber.replace(/\s/g, ''))) { paymentErrs.cardNumber = 'Valid card number required (13-19 digits).'; isValid = false;
  } else { paymentErrs.cardNumber = ''; }
  if (!payment.expiryDate) { paymentErrs.expiryDate = 'Expiry date (MM/YY) is required.'; isValid = false;
  } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(payment.expiryDate)) { paymentErrs.expiryDate = 'Valid MM/YY format required (e.g., 12/25).'; isValid = false;
  } else { paymentErrs.expiryDate = ''; }
  if (!payment.cvv) { paymentErrs.cvv = 'CVV/CVC is required.'; isValid = false;
  } else if (!/^[0-9]{3,4}$/.test(payment.cvv)) { paymentErrs.cvv = 'Valid CVV (3 or 4 digits).'; isValid = false;
  } else { paymentErrs.cvv = ''; }

  // Terms and Conditions Validation
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
  
  if (bookingStore.finalizeError) bookingStore.finalizeError = null;
  
  emit('booking-finalization-requested', JSON.parse(JSON.stringify(formData)));
};

function goToPreviousStep() {
    bookingStore.navigateToStep(2);
}

function clearFinalizeError() {
    bookingStore.finalizeError = null;
}

const formatPriceBase = (value) => {
  if (value == null || isNaN(parseFloat(value))) return 'N/A';
  value = Math.round(parseFloat(value));
  return value.toLocaleString('vi-VN');
};
const formatPrice = (value) => formatPriceBase(value) + ' VND';
const formatPricePerNight = (value) => formatPriceBase(value) + '/night';
</script>

<style scoped>
/* ... style của bạn giữ nguyên từ lần trước ... */
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
</style>