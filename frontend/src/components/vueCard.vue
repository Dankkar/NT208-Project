<template>
  <div class="custom-card-wrapper border-1 shadow-md w-100">
    <div class="card d-flex flex-md-row overflow-hidden ">
      <div class="custom-card__image-container col-md-4 d-flex align-items-center justify-content-center p-3 bg-white">
        <img :src="imageUrl" alt="Card Image" class="img-fluid custom-card__image" />
      </div>
      <div class="col-md-8">
        <div class="card-body custom-card__content-bg d-flex flex-column h-100">
          
          <div v-if="type === 'roomOffer'" class="content-booking-confirmation row flex-grow-1 mb-2">
            <div class="col-lg-7">
              <h5 class="card-title fw-bold text-black">{{ bookingConfirmationData.roomName }}</h5>
              <p class="small text-muted text-uppercase mb-0 fw-bold">DATE</p>
              <p class="mb-2">{{ bookingConfirmationData.dateRange }}</p>
              <p class="small text-muted text-uppercase mb-0 fw-bold">BOOKING REFERENCE</p>
              <p class="mb-2">{{ bookingConfirmationData.bookingReference }}</p>
              <p class="small text-muted text-uppercase mb-0 fw-bold">CITY</p>
              <p class="mb-2">{{ bookingConfirmationData.city }}</p>
              <p class="small text-muted text-uppercase mb-0 fw-bold">ADDRESS</p>
              <p class="mb-2">{{ bookingConfirmationData.address }}</p>
            </div>
            <div class="col-lg-5 d-flex flex-column">
              <p class="fw-bold text-black h6">Details</p>
              <p class="small mb-1">Name: {{ bookingConfirmationData.userDetails.name }}</p>
              <p class="small mb-1">Email: {{ bookingConfirmationData.userDetails.email }}</p>
              <p class="small mb-2">Mobile: {{ bookingConfirmationData.userDetails.mobile }}</p>
              <img v-if="bookingConfirmationData.qrCodeUrl" :src="bookingConfirmationData.qrCodeUrl" alt="QR Code" class="mb-3" style="width: 100px; height: 100px;" />
              <div class="mt-auto d-flex flex-column flex-sm-row gap-2">
                <button class="btn btn-dark btn-sm text-uppercase flex-fill">Direction</button>
                <button class="btn btn-dark btn-sm text-uppercase flex-fill">Reschedule</button>
                <button class="btn btn-dark btn-sm text-uppercase flex-fill">Share QR</button>
              </div>
            </div>
          </div>



          <!-- State 1: Room Offer -->
          <div v-if="type === '!roomOffer'" class="content-room-offer d-flex flex-column flex-grow-1">
            <div>
              <h5 class="card-title fw-bold text-black">{{ roomOfferData.name }}</h5>
              <p class="text-muted small mb-2">Up to {{ roomOfferData.guests }} guests</p>
              <div class="mb-3">
                <p v-if="roomOfferData.sqm" class="small mb-1 d-flex align-items-center">
                  <span class="icon me-2">📏</span> {{ roomOfferData.sqm }} SQM ON AVERAGE
                </p>
                <p v-if="roomOfferData.cocktailBar" class="small mb-1 d-flex align-items-center">
                  <span class="icon me-2">🍸</span> COCKTAIL BAR
                </p>
                <p v-if="roomOfferData.luxuriousBathroom" class="small mb-1 d-flex align-items-center">
                  <span class="icon me-2">🛁</span> LUXURIOUS BATHROOM
                </p>
              </div>
              <a href="#" class="small fw-bold text-dark text-decoration-underline text-uppercase">VIEW ROOM DETAILS</a>
            </div>

            <div class="pricing-section mt-auto pt-3">
              <p class="text-secondary text-decoration-line-through mb-0 small">
                <span class="text-uppercase small me-1">FROM</span>
                VND {{ formatPrice(roomOfferData.oldPrice) }}/
                <span class="small">night</span>
              </p>
              <p class="h4 fw-bold text-black mb-1">
                <span class="text-uppercase small text-muted me-1" style="font-size: 0.6em; vertical-align: middle;">FROM</span>
                VND {{ formatPrice(roomOfferData.newPrice) }}/
                <span class="small fw-normal" style="font-size: 0.6em;">night</span>
              </p>
              <p class="small text-dark my-1">Included VAT and charges</p>
              <p class="small text-dark mb-2">{{ roomOfferData.bedsAvailable }} beds available</p>
              <button class="btn btn-dark text-uppercase w-100">VIEW PACKAGES</button>
            </div>
          </div>

          <!-- State 2: Branch Review -->
          <div v-else-if="type === 'branchReview'" class="content-branch-review d-flex flex-column flex-grow-1">
            <div>
              <h5 class="card-title fw-bold text-black">{{ branchReviewData.name }}</h5>
              <ul class="list-unstyled mb-3">
                <li v-for="(review, index) in branchReviewData.reviews" :key="index" class="mb-1 d-flex align-items-center small">
                  {{ review.type }}
                  <StarRating :rating="review.rating" class="ms-2" />
                </li>
              </ul>
              <div class="fw-bold d-flex align-items-center mb-3">
                Overall <StarRating :rating="branchReviewData.overallRating" class="ms-2" />
              </div>
            </div>
            <div class="branch-details-section mt-auto">
              <img v-if="branchReviewData.detailsImageUrl" :src="branchReviewData.detailsImageUrl" alt="Branch Detail" class="img-fluid mb-3" style="max-width: 180px; border: 1px solid #eee;" />
              <button class="btn btn-dark text-uppercase w-100">VIEW DETAILS</button>
            </div>
          </div>

          <!-- State 3: Booking Confirmation -->
          <div v-else-if="type === 'bookingConfirmation'" class="content-booking-confirmation row flex-grow-1">
            <div class="col-lg-7">
              <h5 class="card-title fw-bold text-black">{{ bookingConfirmationData.roomName }}</h5>
              <p class="small text-muted text-uppercase mb-0 fw-bold">DATE</p>
              <p class="mb-2">{{ bookingConfirmationData.dateRange }}</p>
              <p class="small text-muted text-uppercase mb-0 fw-bold">BOOKING REFERENCE</p>
              <p class="mb-2">{{ bookingConfirmationData.bookingReference }}</p>
              <p class="small text-muted text-uppercase mb-0 fw-bold">CITY</p>
              <p class="mb-2">{{ bookingConfirmationData.city }}</p>
              <p class="small text-muted text-uppercase mb-0 fw-bold">ADDRESS</p>
              <p class="mb-2">{{ bookingConfirmationData.address }}</p>
            </div>
            <div class="col-lg-5 d-flex flex-column">
              <p class="fw-bold text-black h6">Details</p>
              <p class="small mb-1">Name: {{ bookingConfirmationData.userDetails.name }}</p>
              <p class="small mb-1">Email: {{ bookingConfirmationData.userDetails.email }}</p>
              <p class="small mb-2">Mobile: {{ bookingConfirmationData.userDetails.mobile }}</p>
              <img v-if="bookingConfirmationData.qrCodeUrl" :src="bookingConfirmationData.qrCodeUrl" alt="QR Code" class="mb-3" style="width: 100px; height: 100px;" />
              <div class="mt-auto d-flex flex-column flex-sm-row gap-2">
                <button class="btn btn-dark btn-sm text-uppercase flex-fill">Direction</button>
                <button class="btn btn-dark btn-sm text-uppercase flex-fill">Reschedule</button>
                <button class="btn btn-dark btn-sm text-uppercase flex-fill">Share QR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

// Helper component for star ratings (can be in a separate file)
// Giữ nguyên component StarRating như trước, hoặc bạn có thể thay thế sao bằng Bootstrap Icons
const StarRating = {
  props: {
    rating: { type: Number, default: 0 },
    maxStars: { type: Number, default: 5 }
  },
  template: `
    <span class="star-rating">
      <span v-for="n in Math.floor(rating)" :key="'filled-' + n" class="star filled">★</span>
      <span v-if="rating % 1 !== 0 && rating % 1 >= 0.5" class="star filled">★</span> <!-- Hoặc icon nửa sao -->
      <span v-else-if="rating % 1 !== 0 && rating % 1 < 0.5" class="star empty">☆</span>
      <span v-for="n in Math.floor(maxStars - Math.ceil(rating))" :key="'empty-' + n" class="star empty">☆</span>
    </span>
  `
  // Nếu dùng Bootstrap Icons:
  // template: `
  //   <span class="star-rating">
  //     <i v-for="n in Math.floor(rating)" :key="'filled-' + n" class="bi bi-star-fill"></i>
  //     <i v-if="rating % 1 >= 0.5" class="bi bi-star-half"></i>
  //     <i v-for="n in Math.floor(maxStars - Math.ceil(rating))" :key="'empty-' + n" class="bi bi-star"></i>
  //   </span>
  // `
};

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['roomOffer', 'branchReview', 'bookingConfirmation'].includes(value)
  },
  imageUrl: {
    type: String,
    default:'../assets/mountain.jpg'
  },
  roomOfferData: {
    type: Object,
    default: () => ({
      name: 'DELUXE ROOM',
      guests: 3,
      sqm: '45',
      cocktailBar: true,
      luxuriousBathroom: true,
      oldPrice: 9000000,
      newPrice: 8500000,
      bedsAvailable: 2
    })
  },
  branchReviewData: {
    type: Object,
    default: () => ({
      name: 'Da Nang Branch',
      reviews: [
        { type: 'Deluxe Room', rating: 4.5 },
        { type: 'Deluxe Room', rating: 5 },
        { type: 'Deluxe Room', rating: 4 }
      ],
      overallRating: 4.5,
      detailsImageUrl: 'https://i.imgur.com/rA0THjM.png' // Matterhorn example
    })
  },
  bookingConfirmationData: {
    type: Object,
    default: () => ({
      roomName: 'DELUXE ROOM',
      dateRange: '05/04/2025 - 06/04/2025',
      bookingReference: 'UIT-23520498',
      city: 'Da Nang, Vietnam',
      address: '06 Linh Trung, Thủ Đức',
      userDetails: {
        name: 'Harry Potter',
        email: 'uit@edu.vn',
        mobile: '0123456789'
      },
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Example'
    })
  }
});

const formatPrice = (value) => {
  if (value == null) return 'N/A';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
</script>

<style scoped>
.custom-card-wrapper {
  /* For the blue border in the example */
  border: 3px solid #007bff; /* Bootstrap primary blue, or your desired blue */
  padding: 0;
  display: inline-block; /* Adjust as needed */
  width: 100%; /* Makes it responsive within its container */
  margin-bottom: 30px;
}

.card {
  border: none; /* Remove default Bootstrap card border if wrapper has one */
}

.custom-card__image-container {
  /* background-color: #f8f9fa; */ /* Bootstrap light gray or keep white */
}

.custom-card__image {
  max-height: 280px; /* Adjust to prevent overly tall images */
  object-fit: contain;
}

.custom-card__content-bg {
  background-color: #FEF0F5; /* Light pinkish color from screenshots */
}

.icon {
  font-size: 1.1em; /* Adjust icon size as needed */
}

/* Star Rating Component Style (nếu không dùng Bootstrap Icons) */
.star-rating {
  color: #000; /* Black stars */
  font-size: 1.1em; /* Match text size or make slightly larger */
}
.star.filled {
  /* color: #f39c12; */
}
.star.empty {
  /* color: #bdc3c7; */
}

/* Điều chỉnh nhỏ cho 'FROM' text ở new price để giống ảnh hơn */
.pricing-section .h4 .small.text-muted {
  font-size: 0.6em !important; /* Bootstrap's small might be too large */
  vertical-align: middle;
}
.pricing-section .h4 .small.fw-normal {
    font-size: 0.6em !important;
}

/* Đảm bảo nút chiếm toàn bộ chiều rộng trên màn hình nhỏ cho Booking Confirmation */
@media (max-width: 575.98px) {
  .content-booking-confirmation .action-buttons .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
  .content-booking-confirmation .action-buttons .btn:last-child {
    margin-bottom: 0;
  }
  .content-booking-confirmation .d-flex.gap-2 {
    flex-direction: column;
  }
}
</style>