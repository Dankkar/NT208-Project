<!-- src/components/booking/steps/Step3_GuestInfo.vue -->
<template>
  <div class="step3-guest-info py-4">
    <div v-if="!details" class="text-center"> <!-- Sử dụng `details` computed prop -->
      <p class="text-muted">Loading booking details...</p>
    </div>
    <div v-else class="row g-4 g-lg-5">
      <div class="col-lg-7">
        <div class="guest-form-section">
          <h4 class="mb-4 fw-semibold">Guest & Payment Information</h4>
          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">Guest Information</h5>
            <div class="row g-3">
              <div class="col-md-3 col-sm-4">
                <label for="guestTitle" class="form-label small">Title <span class="text-danger">*</span></label>
                <select id="guestTitle" class="form-select form-select-sm" v-model="formData.guestInfo.title" required>
                  <option value="Mr.">Mr.</option> <option value="Ms.">Ms.</option> <option value="Mrs.">Mrs.</option> <option value="Other">Other</option>
                </select>
                <div v-if="formSubmitted && errors.guestInfo.title" class="text-danger small mt-1">{{ errors.guestInfo.title }}</div>
              </div>
              <div class="col-md-4 col-sm-8">
                <label for="guestFirstName" class="form-label small">First Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestFirstName" v-model.trim="formData.guestInfo.firstName" required placeholder="Enter first name">
                <div v-if="formSubmitted && errors.guestInfo.firstName" class="text-danger small mt-1">{{ errors.guestInfo.firstName }}</div>
              </div>
              <div class="col-md-5">
                <label for="guestLastName" class="form-label small">Last Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestLastName" v-model.trim="formData.guestInfo.lastName" required placeholder="Enter last name">
                <div v-if="formSubmitted && errors.guestInfo.lastName" class="text-danger small mt-1">{{ errors.guestInfo.lastName }}</div>
              </div>
              <div class="col-md-6">
                <label for="guestEmail" class="form-label small">Email Address <span class="text-danger">*</span></label>
                <input type="email" class="form-control form-control-sm" id="guestEmail" v-model.trim="formData.guestInfo.email" required placeholder="e.g., name@example.com">
                <div v-if="formSubmitted && errors.guestInfo.email" class="text-danger small mt-1">{{ errors.guestInfo.email }}</div>
              </div>
              <div class="col-md-6">
                <label for="guestPhone" class="form-label small">Phone Number <span class="text-danger">*</span></label>
                <input type="tel" class="form-control form-control-sm" id="guestPhone" v-model.trim="formData.guestInfo.phone" required placeholder="Enter phone number">
                <div v-if="formSubmitted && errors.guestInfo.phone" class="text-danger small mt-1">{{ errors.guestInfo.phone }}</div>
              </div>
              <div class="col-12">
                <label for="guestNationalId" class="form-label small">National ID / Passport <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="guestNationalId" v-model.trim="formData.guestInfo.nationalId" required placeholder="Enter National ID or Passport">
                <div v-if="formSubmitted && errors.guestInfo.nationalId" class="text-danger small mt-1">{{ errors.guestInfo.nationalId }}</div>
              </div>
            </div>
          </section>
          <section class="mb-4">
            <h5 class="mb-3 fw-medium pb-2 border-bottom">Payment Method</h5>
            <div class="mb-3 payment-icons">
              <i class="bi bi-credit-card-2-front-fill fs-3 me-2 text-primary"></i> <i class="bi bi-credit-card fs-3 me-2 text-success"></i> <i class="bi bi-bank fs-3 me-2 text-warning"></i>
            </div>
            <div class="row g-3">
              <div class="col-12">
                <label for="paymentCardName" class="form-label small">Name on Card <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCardName" v-model.trim="formData.paymentInfo.nameOnCard" required placeholder="Full name as displayed on card">
                <div v-if="formSubmitted && errors.paymentInfo.nameOnCard" class="text-danger small mt-1">{{ errors.paymentInfo.nameOnCard }}</div>
              </div>
              <div class="col-12">
                <label for="paymentCardNumber" class="form-label small">Card Number <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCardNumber" v-model.trim="formData.paymentInfo.cardNumber" required placeholder="---- ---- ---- ----">
                <div v-if="formSubmitted && errors.paymentInfo.cardNumber" class="text-danger small mt-1">{{ errors.paymentInfo.cardNumber }}</div>
              </div>
              <div class="col-md-6">
                <label for="paymentExpiryDate" class="form-label small">Expiry Date (MM/YY) <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentExpiryDate" v-model.trim="formData.paymentInfo.expiryDate" required placeholder="MM/YY">
                <div v-if="formSubmitted && errors.paymentInfo.expiryDate" class="text-danger small mt-1">{{ errors.paymentInfo.expiryDate }}</div>
              </div>
              <div class="col-md-6">
                <label for="paymentCvv" class="form-label small">CVV/CVC <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-sm" id="paymentCvv" v-model.trim="formData.paymentInfo.cvv" required placeholder="---" maxlength="4">
                <div v-if="formSubmitted && errors.paymentInfo.cvv" class="text-danger small mt-1">{{ errors.paymentInfo.cvv }}</div>
              </div>
            </div>
            <div class="form-check mt-4 mb-3">
              <input class="form-check-input" type="checkbox" id="billingAddressSame" v-model="formData.billingAddressSameAsContact">
              <label class="form-check-label small" for="billingAddressSame">My billing address is the same as my guest information.</label>
            </div>
            <div v-if="!formData.billingAddressSameAsContact" class="billing-address-form mt-3 border p-3 rounded bg-body-tertiary">
              <h6 class="mb-3 small text-secondary text-uppercase fw-semibold">Billing Address</h6>
              <div class="row g-3">
                <div class="col-12">
                  <label for="billingStreet" class="form-label small">Street Address <span class="text-danger">*</span></label>
                  <input type="text" class="form-control form-control-sm" id="billingStreet" v-model.trim="formData.billingAddress.street" :required="!formData.billingAddressSameAsContact" placeholder="123 Main St">
                  <div v-if="formSubmitted && errors.billingAddress.street" class="text-danger small mt-1">{{ errors.billingAddress.street }}</div>
                </div>
                <div class="col-md-6">
                  <label for="billingCity" class="form-label small">City <span class="text-danger">*</span></label>
                  <input type="text" class="form-control form-control-sm" id="billingCity" v-model.trim="formData.billingAddress.city" :required="!formData.billingAddressSameAsContact" placeholder="City name">
                  <div v-if="formSubmitted && errors.billingAddress.city" class="text-danger small mt-1">{{ errors.billingAddress.city }}</div>
                </div>
                <div class="col-md-6">
                  <label for="billingPostalCode" class="form-label small">Postal Code <span class="text-danger">*</span></label>
                  <input type="text" class="form-control form-control-sm" id="billingPostalCode" v-model.trim="formData.billingAddress.postalCode" :required="!formData.billingAddressSameAsContact" placeholder="Postal or ZIP code">
                  <div v-if="formSubmitted && errors.billingAddress.postalCode" class="text-danger small mt-1">{{ errors.billingAddress.postalCode }}</div>
                </div>
                <div class="col-12">
                  <label for="billingCountry" class="form-label small">Country <span class="text-danger">*</span></label>
                  <select id="billingCountry" class="form-select form-select-sm" v-model="formData.billingAddress.country" :required="!formData.billingAddressSameAsContact">
                    <option disabled value="">Please select a country</option>
                    <option v-for="country in countries" :key="country.code" :value="country.code">{{ country.name }}</option>
                  </select>
                  <div v-if="formSubmitted && errors.billingAddress.country" class="text-danger small mt-1">{{ errors.billingAddress.country }}</div>
                </div>
              </div>
            </div>
          </section>
          <div class="form-check mb-4">
            <input class="form-check-input" type="checkbox" id="termsAndConditions" v-model="formData.agreedToTerms">
            <label class="form-check-label small" for="termsAndConditions">
              I have read and agree to the <a href="#" @click.prevent class="text-decoration-none">terms and conditions</a> and <a href="#" @click.prevent class="text-decoration-none">privacy policy</a>.
            </label>
            <div v-if="formSubmitted && errors.agreedToTerms" class="text-danger small mt-1">{{ errors.agreedToTerms }}</div>
          </div>
          <div class="text-end mb-4">
            <Button content="Confirm Information" :is-loading="isSubmitting" textColor="#fff" fontSize="18px" backgroundColor="black" colorHover="white" bgHover="#198754" borderRadius="6px" class="w-100 text-uppercase fw-bold py-2" @click="handleSubmit" />
          </div>
        </div>
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
import { ref, reactive, computed, watch, onMounted } from 'vue';
import Button from "../../Button.vue";
import { useBookingStore } from '@/store/bookingStore';

const bookingStore = useBookingStore();
const isSubmitting = ref(false);

const defaultFormData = () => ({
  guestInfo: { title: 'Mr.', firstName: '', lastName: '', nationalId: '', phone: '', email: '' },
  paymentInfo: { nameOnCard: '', cardNumber: '', expiryDate: '', cvv: '' },
  agreedToTerms: false,
  billingAddressSameAsContact: true,
  billingAddress: { street: '', city: '', postalCode: '', country: '' }
});
const formData = reactive(defaultFormData());

const errors = reactive({
  guestInfo: { firstName: '', lastName: '', nationalId: '', phone: '', email: '', title: '' },
  paymentInfo: { nameOnCard: '', cardNumber: '', expiryDate: '', cvv: '' },
  billingAddress: { street: '', city: '', postalCode: '', country: '' },
  agreedToTerms: ''
});
const formSubmitted = ref(false);

const countries = ref([ { code: 'VN', name: 'Vietnam' }, { code: 'US', name: 'United States' }, { code: 'SG', name: 'Singapore' }, { code: 'KR', name: 'South Korea' }, { code: 'JP', name: 'Japan' }, { code: 'OTHER', name: 'Other' } ]);
const details = computed(() => bookingStore.dataForStep3Display);

function resetFormToDefaults() {
    Object.assign(formData, defaultFormData());
    Object.keys(errors.guestInfo).forEach(key => errors.guestInfo[key] = '');
    Object.keys(errors.paymentInfo).forEach(key => errors.paymentInfo[key] = '');
    Object.keys(errors.billingAddress).forEach(key => errors.billingAddress[key] = '');
    errors.agreedToTerms = '';
    formSubmitted.value = false;
}

function initializeFormDataFromStore() {
  if (bookingStore.guestAndPaymentInput) {
    const storedData = JSON.parse(JSON.stringify(bookingStore.guestAndPaymentInput));
    Object.assign(formData.guestInfo, storedData.guestInfo);
    Object.assign(formData.paymentInfo, storedData.paymentInfo);
    formData.agreedToTerms = storedData.agreedToTerms || false;
    formData.billingAddressSameAsContact = storedData.billingAddressSameAsContact !== undefined ? storedData.billingAddressSameAsContact : true;
    Object.assign(formData.billingAddress, storedData.billingAddress);
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
  const guest = formData.guestInfo; const payment = formData.paymentInfo; const billing = formData.billingAddress;
  const guestErrs = errors.guestInfo; const paymentErrs = errors.paymentInfo; const billingErrs = errors.billingAddress;
  guestErrs.title = !guest.title ? 'Title is required.' : ''; if (guestErrs.title) isValid = false;
  guestErrs.firstName = !guest.firstName ? 'First name is required.' : ''; if (guestErrs.firstName) isValid = false;
  guestErrs.lastName = !guest.lastName ? 'Last name is required.' : ''; if (guestErrs.lastName) isValid = false;
  guestErrs.nationalId = !guest.nationalId ? 'National ID/Passport is required.' : ''; if (guestErrs.nationalId) isValid = false;
  if (!guest.phone) { guestErrs.phone = 'Phone number is required.'; isValid = false;
  } else if (!/^\+?[0-9\s-()]{7,20}$/.test(guest.phone)) { guestErrs.phone = 'Valid phone number required.'; isValid = false;
  } else { guestErrs.phone = ''; }
  if (!guest.email) { guestErrs.email = 'Email address is required.'; isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) { guestErrs.email = 'Valid email address required.'; isValid = false;
  } else { guestErrs.email = ''; }
  paymentErrs.nameOnCard = !payment.nameOnCard ? 'Name on card is required.' : ''; if (paymentErrs.nameOnCard) isValid = false;
  if (!payment.cardNumber) { paymentErrs.cardNumber = 'Card number is required.'; isValid = false;
  } else if (!/^[0-9]{13,19}$/.test(payment.cardNumber.replace(/\s/g, ''))) { paymentErrs.cardNumber = 'Valid card number required.'; isValid = false;
  } else { paymentErrs.cardNumber = ''; }
  if (!payment.expiryDate) { paymentErrs.expiryDate = 'Expiry date (MM/YY) is required.'; isValid = false; }
  else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(payment.expiryDate)) { paymentErrs.expiryDate = 'Valid MM/YY format required.'; isValid = false; }
  else { paymentErrs.expiryDate = ''; }
  if (!payment.cvv) { paymentErrs.cvv = 'CVV/CVC is required.'; isValid = false; }
  else if (!/^[0-9]{3,4}$/.test(payment.cvv)) { paymentErrs.cvv = 'Valid CVV (3 or 4 digits).'; isValid = false; }
  else { paymentErrs.cvv = ''; }
  if (!formData.billingAddressSameAsContact) {
    billingErrs.street = !billing.street ? 'Street address is required.' : ''; if (billingErrs.street) isValid = false;
    billingErrs.city = !billing.city ? 'City is required.' : ''; if (billingErrs.city) isValid = false;
    billingErrs.postalCode = !billing.postalCode ? 'Postal code is required.' : ''; if (billingErrs.postalCode) isValid = false;
    billingErrs.country = !billing.country ? 'Country for billing is required.' : ''; if (billingErrs.country) isValid = false;
  } else {
    Object.keys(billingErrs).forEach(key => billingErrs[key] = '');
  }
  errors.agreedToTerms = !formData.agreedToTerms ? 'You must agree to terms and conditions.' : ''; if (errors.agreedToTerms) isValid = false;
  return isValid;
}

const handleSubmit = async () => {
  formSubmitted.value = true;
  if (!validateFormFields()) return;
  isSubmitting.value = true;
  try {
    const dataToSubmit = JSON.parse(JSON.stringify(formData));
    await bookingStore.submitGuestAndPaymentInfo(dataToSubmit);
  } catch (error) {
    console.error("Error submitting guest info:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const formatPriceBase = (value) => {
  if (value == null || isNaN(value)) return 'N/A';
  value = Math.round(value);
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const formatPrice = (value) => formatPriceBase(value) + ' VND';
const formatPricePerNight = (value) => formatPriceBase(value) + '/night';
</script>

<style scoped>
.form-label-sm { font-size: 0.8rem; margin-bottom: 0.25rem; color: #555; }
.section-title { font-size: 1.1rem; color: #4A4A4A; border-bottom: 1px solid #E0DACC; padding-bottom: 0.75rem; margin-bottom: 1.25rem !important; font-weight: 600; }
.sticky-top-summary { top: 90px; z-index: 1000; position: sticky; } /* Điều chỉnh top offset nếu cần */
.booking-summary-section {
  background-color: #F8F5F0; /* Màu nền kem nhẹ */
  border: 1px solid #E7E0D7 !important; /* Border mềm hơn */
  border-radius: 6px !important; /* Bo góc */
  padding: 1.25rem !important; /* 20px */
  color: #4B4B4B; /* Màu chữ chính */
  font-size: 0.875rem; /* 14px */
}
.summary-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; /* Font rõ ràng, hiện đại */
  font-size: 1.4rem; /* 22.4px */
  font-weight: 700;
  color: #333333; /* Màu tiêu đề đậm */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1.5rem; /* 24px */
  padding-bottom: 0.75rem; /* 12px */
  border-bottom: 1px solid #E7E0D7; /* Đường kẻ chia mềm mại */
}
.hotel-name, .room-name {
  font-weight: 600;
  color: #333333; /* Màu đậm hơn cho tên KS, phòng */
  font-size: 1rem; /* 16px */
  margin-bottom: 0.3rem; /* 4.8px */
}
.summary-text-light {
  color: #757575; /* Màu xám nhạt cho text phụ */
  font-size: 0.825rem; /* 13.2px */
}
.summary-block {
  margin-bottom: 1.25rem; /* 20px */
  padding-bottom: 1.25rem; /* 20px */
  border-bottom: 1px solid #E7E0D7; /* Đường kẻ chia mềm mại */
}
.summary-block:last-child { /* Khối cuối cùng không có đường kẻ dưới */
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem; /* 8px */
  line-height: 1.5;
}
.item-label { color: #555555; /* Màu chữ cho nhãn */ }
.item-value {
  font-weight: 500; /* Giá trị hơi đậm hơn */
  color: #333333;
  text-align: right;
}
.summary-divider { border-color: #E0DACC !important; }
.total-amount-display .item-label,
.total-amount-display .item-value {
  font-size: 1.15rem; /* 18.4px - Tổng tiền to hơn */
  color: #212529; /* Màu đen đậm */
  font-weight: 700; /* Rất đậm */
  text-transform: uppercase;
}
.payment-icons i { opacity: 0.7; transition: opacity 0.2s ease-in-out; }
.payment-icons i:hover { opacity: 1; }
.billing-address-form { /* background-color: #f9f9f9; đã có bg-body-tertiary */ }
/* Thêm style cho input nếu muốn (ví dụ bo góc, padding) */
.form-control-sm {
    border-radius: 0.2rem; /* Hơi bo góc cho input */
}
.form-select-sm {
    border-radius: 0.2rem;
}
</style>