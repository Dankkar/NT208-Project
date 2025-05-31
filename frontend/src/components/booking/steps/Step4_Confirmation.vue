<!-- src/components/booking/steps/Step4_Confirmation.vue -->
<template>
  <div class="step4-confirmation py-4">
    <div v-if="!confirmationDetails" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading confirmation...</span>
      </div>
      <p class="text-muted mt-2">Loading confirmation details or booking not yet finalized.</p>
    </div>

    <div v-else>
      <div class="text-center mb-4">
        <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
        <h2 class="fw-bold text-success mt-3">YOUR BOOKING IS COMPLETE!</h2>
        <p class="lead">Thank you for booking with us. Your confirmation details are below.</p>
      </div>

      <div class="booking-reference-wrapper mb-4 p-3 border rounded bg-light-subtle text-center mx-auto shadow-sm" style="max-width: 400px;">
        <h6 class="text-uppercase small text-muted mb-1">Booking Reference</h6>
        <p class="h3 fw-bold mb-0 text-primary">{{ confirmationDetails.bookingReference }}</p>
      </div>

      <div class="alert alert-info small mb-4 d-flex justify-content-between align-items-center" role="alert">
        <span>You will soon receive an email confirmation. We recommend saving or printing this page.</span>
        <button @click="printPage" class="btn btn-sm btn-outline-primary">
          <i class="bi bi-printer me-1"></i>Print Page
        </button>
      </div>

      <div class="row g-4 g-lg-5">
        <div class="col-lg-8">
          <section class="mb-4 card shadow-sm">
            <div class="card-header bg-light fw-semibold text-uppercase small">Your Hotel</div>
            <div class="card-body" v-if="confirmationDetails.hotelInfo">
              <h5 class="card-title fw-medium">{{ confirmationDetails.hotelInfo.TenKS }}</h5>
              <p class="card-text small text-muted mb-2">{{ confirmationDetails.hotelInfo.DiaChi }}</p>
              <p class="card-text small mb-1" v-if="confirmationDetails.hotelInfo.SoDienThoaiKS && confirmationDetails.hotelInfo.SoDienThoaiKS !== 'N/A'">
                <i class="bi bi-telephone me-2"></i>{{ confirmationDetails.hotelInfo.SoDienThoaiKS }}
              </p>
              <p class="card-text small mb-0" v-if="confirmationDetails.hotelInfo.EmailKS && confirmationDetails.hotelInfo.EmailKS !== 'N/A'">
                <i class="bi bi-envelope me-2"></i>{{ confirmationDetails.hotelInfo.EmailKS }}
              </p>
            </div>
            <div class="card-body text-muted small" v-else>Hotel information not available.</div>
          </section>

          <section class="mb-4 card shadow-sm">
             <div class="card-header bg-light fw-semibold text-uppercase small">Dates & Number of People</div>
            <div class="card-body" v-if="confirmationDetails.stayInfo">
              <p class="mb-1"><strong>Check-in:</strong> {{ confirmationDetails.stayInfo.checkInDateFormatted }}</p>
              <p class="mb-1"><strong>Check-out:</strong> {{ confirmationDetails.stayInfo.checkOutDateFormatted }}</p>
              <p class="mb-1"><strong>Duration:</strong> {{ confirmationDetails.stayInfo.durationText }} ({{ confirmationDetails.stayInfo.numberOfNights }} night(s))</p>
              <p class="mb-0"><strong>Guests:</strong> {{ confirmationDetails.stayInfo.numberOfAdults }} adult(s)
                <span v-if="confirmationDetails.stayInfo.numberOfChildren > 0">, {{ confirmationDetails.stayInfo.numberOfChildren }} child(ren)</span>
              </p>
            </div>
             <div class="card-body text-muted small" v-else>Stay information not available.</div>
          </section>

          <section class="mb-4 card shadow-sm">
            <div class="card-header bg-light fw-semibold text-uppercase small">Room Details</div>
            <div class="card-body" v-if="confirmationDetails.roomInfo">
              <div class="row align-items-center">
                <div :class="confirmationDetails.roomInfo.HinhAnhPhong ? 'col-md-8' : 'col-12'">
                  <h5 class="card-title fw-medium">{{ confirmationDetails.roomInfo.TenLoaiPhong }}</h5>
                  <ul v-if="confirmationDetails.roomInfo.TienNghiChinh && confirmationDetails.roomInfo.TienNghiChinh.length" class="list-unstyled small text-muted mb-0">
                    <li v-for="(amenity, index) in confirmationDetails.roomInfo.TienNghiChinh" :key="index" class="mb-1">
                      <i class="bi bi-check-circle text-success me-1"></i>{{ amenity }}
                    </li>
                  </ul>
                  <p v-else class="small text-muted mb-0">Room amenities not specified.</p>
                </div>
                <div class="col-md-4 text-center text-md-end mt-2 mt-md-0" v-if="confirmationDetails.roomInfo.HinhAnhPhong">
                  <img :src="confirmationDetails.roomInfo.HinhAnhPhong" alt="Room Image" class="img-fluid rounded" style="max-height: 100px; object-fit: cover;">
                </div>
              </div>
            </div>
             <div class="card-body text-muted small" v-else>Room details not available.</div>
          </section>
        </div>

        <div class="col-lg-4">
          <section class="mb-4 card shadow-sm">
            <div class="card-header bg-light fw-semibold text-uppercase small">Payment Summary</div>
            <div class="card-body payment-details-summary" v-if="confirmationDetails.paymentSummary && confirmationDetails.stayInfo">
              <div class="d-flex justify-content-between small mb-1">
                <span>Room Price ({{ confirmationDetails.stayInfo.numberOfNights }} nights):</span>
                <span>{{ formatDisplayPrice(confirmationDetails.paymentSummary.totalRoomPrice) }}</span>
              </div>
              <div class="d-flex justify-content-between small mb-1">
                <span class="text-muted">VAT (est.):</span>
                <span class="text-muted">{{ formatDisplayPrice(confirmationDetails.paymentSummary.vatAmount) }}</span>
              </div>
              <div v-if="confirmationDetails.paymentSummary.depositPaid > 0" class="d-flex justify-content-between small mb-1 text-success">
                <span>Deposit Paid:</span>
                <span>- {{ formatDisplayPrice(confirmationDetails.paymentSummary.depositPaid) }}</span>
              </div>
               <hr class="my-2">
              <div class="d-flex justify-content-between fw-bold h5 mb-0">
                <span>TOTAL PAID:</span>
                <span>{{ formatDisplayPrice(confirmationDetails.paymentSummary.amountDue) }}</span>
              </div>
            </div>
            <div class="card-body text-muted small" v-else>Payment summary not available.</div>
          </section>

          <section class="mb-4 card shadow-sm">
            <div class="card-header bg-light fw-semibold text-uppercase small">Customer Details</div>
            <div class="card-body small" v-if="confirmationDetails.customerDetails">
              <p class="mb-1"><strong>{{ confirmationDetails.customerDetails.fullName }}</strong></p>
              <p class="mb-1" v-if="confirmationDetails.customerDetails.address && confirmationDetails.customerDetails.address !== 'N/A' && confirmationDetails.customerDetails.address !== 'As per guest information (if provided)'">
                {{ confirmationDetails.customerDetails.address }}
                <template v-if="confirmationDetails.customerDetails.city || confirmationDetails.customerDetails.postalCode || confirmationDetails.customerDetails.country">
                  <br>
                  <span v-if="confirmationDetails.customerDetails.city">{{ confirmationDetails.customerDetails.city }}</span>
                  <span v-if="confirmationDetails.customerDetails.postalCode">, {{ confirmationDetails.customerDetails.postalCode }}</span>
                  <br v-if="confirmationDetails.customerDetails.country && (confirmationDetails.customerDetails.city || confirmationDetails.customerDetails.postalCode)">
                  <span v-if="confirmationDetails.customerDetails.country">{{ getCountryName(confirmationDetails.customerDetails.country) }}</span>
                </template>
              </p>
              <p class="mb-1"><i class="bi bi-telephone-fill me-1 text-muted"></i>{{ confirmationDetails.customerDetails.phone }}</p>
              <p class="mb-0"><i class="bi bi-envelope-fill me-1 text-muted"></i>{{ confirmationDetails.customerDetails.email }}</p>
            </div>
             <div class="card-body text-muted small" v-else>Customer details not available.</div>
          </section>
        </div>
      </div>

      <div class="row g-4 mt-3">
        <div class="col-md-6">
          <div class="p-3 border rounded bg-light-subtle h-100 shadow-sm">
            <h6 class="fw-semibold mb-2"><i class="bi bi-info-circle me-1"></i>What's Next?</h6>
            <p class="small">An email confirmation with your booking summary has been sent to <strong v-if="confirmationDetails.customerDetails">{{ confirmationDetails.customerDetails.email }}</strong><span v-else>your email address</span>. This email also contains instructions on how to view, modify, or request a cancellation of your reservation.</p>
          </div>
        </div>
        <div class="col-md-6">
           <div class="p-3 border rounded bg-light-subtle h-100 shadow-sm">
            <h6 class="fw-semibold mb-2"><i class="bi bi-question-circle me-1"></i>Any Queries?</h6>
            <p class="small">For any questions or changes to your booking, please contact the hotel directly:</p>
            <p class="small mb-0" v-if="confirmationDetails.contactSupport?.phone">
              <i class="bi bi-telephone me-1"></i>{{ confirmationDetails.contactSupport.phone }}
            </p>
            <p class="small mb-0" v-if="confirmationDetails.contactSupport?.email">
              <i class="bi bi-envelope me-1"></i>
              <a :href="'mailto:' + confirmationDetails.contactSupport.email" class="text-dark text-decoration-none">{{ confirmationDetails.contactSupport.email }}</a>
            </p>
          </div>
        </div>
      </div>

      <div class="text-center mt-5">
          <button class="btn btn-primary px-4" @click="startNewBooking">
            <i class="bi bi-plus-circle me-1"></i>Make Another Booking
          </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'; // Đã thêm watchEffect
import { useBookingStore } from '@/store/bookingStore';
import { useRouter } from 'vue-router';

const bookingStore = useBookingStore();
const router = useRouter();
const confirmationDetails = computed(() => bookingStore.dataForStep4Display);

const formatDisplayPrice = (value) => {
  if (value == null || isNaN(value)) return 'N/A VND';
  value = Math.round(value);
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
};

const printPage = () => { window.print(); };
const startNewBooking = () => { 
   bookingStore.resetBookingProcess();
   router.push('/');
};

const countries = ref([
  { code: 'VN', name: 'Vietnam' }, { code: 'US', name: 'United States' },
  { code: 'SG', name: 'Singapore' }, { code: 'KR', name: 'South Korea' },
  { code: 'JP', name: 'Japan' }, { code: 'OTHER', name: 'Other' },
]);
const getCountryName = (code) => {
  const country = countries.value.find(c => c.code === code);
  return country ? country.name : code;
};

watchEffect(() => {
  if (confirmationDetails.value) {
    console.log('Step 4 Confirmation details from store:', JSON.parse(JSON.stringify(confirmationDetails.value)));
  } else {
    console.log('Step 4 Confirmation: No details yet from store.');
    console.log('Step 4 Confirmation:', confirmationDetails.value);
  }
});
</script>

<style scoped>
.booking-reference-wrapper { border-style: dashed !important; border-color: #adb5bd !important; background-color: #e9ecef !important; }
.card-header { font-size: 0.8rem; padding: 0.6rem 1rem; color: #495057; background-color: #f8f9fa !important; font-weight: 600; letter-spacing: 0.5px; }
.card-body { font-size: 0.9rem; color: #343a40; }
.payment-details-summary .small, .payment-details-summary span { font-size: 0.875rem; }
.payment-details-summary .h5, .payment-details-summary .h6 { font-size: 1.1rem; color: #212529; }
.step4-confirmation .lead { font-size: 1.1rem; font-weight: 300; }
.alert-info { background-color: #e6f3ff; border-color: #b8d6f3; color: #004085; }
.card-body .row.align-items-center .col-md-8 ul {margin-top: 0.25rem;}
</style>