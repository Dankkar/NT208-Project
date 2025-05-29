<!-- src/pages/BookingHistory.vue -->
<template>
  <Layout title="Room Booking History">
    <div class="page-container booking-history-page">
      <div v-if="AuthStore.isLoadingAuth" class="loading-message text-center py-5"> <!-- Thêm class bootstrap nếu muốn -->
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading your bookings...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div v-else-if="user" class="bookings-list-container">
        <div class="bookings-list">
          <div v-for="booking in bookings" :key="booking.id" class="booking-item">
            <div class="booking-image-container">
              <img :src="booking.roomImage" alt="Room image" class="room-image" />
            </div>

            <div class="booking-info-container">
              <h2 class="room-type">{{ booking.roomType }}</h2>
              <div class="info-block">
                <p><span class="info-label">DATE</span>{{ booking.dateRange }}</p>
                <p><span class="info-label">BOOKING REFERENCE</span>{{ booking.bookingReference }}</p>
                <p><span class="info-label">CITY</span>{{ booking.city }}</p>
                <p><span class="info-label">ADDRESS</span>{{ booking.address }}</p>
              </div>
            </div>

            <div class="guest-actions-container">
              <div class="guest-details-section">
                <h3 class="details-title">Details</h3>
                <p><span class="detail-label">Name:</span> {{ booking.guestDetails.name }}</p>
                <p><span class="detail-label">Email:</span> {{ booking.guestDetails.email }}</p>
                <p><span class="detail-label">Mobile:</span> {{ booking.guestDetails.mobile }}</p>
              </div>
              <div class="qr-code-container">
                <img :src="booking.qrCodeImage" alt="Booking QR Code" class="qr-code" />
              </div>
              <div class="action-buttons">
                <button :class="['action-btn', booking.isActive ? 'dark' : 'light']">Direction</button>
                <button :class="['action-btn', booking.isActive ? 'dark' : 'light']">Reschedule</button>
                <button :class="['action-btn', booking.isActive ? 'dark' : 'light']">Share QR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-bookings-message text-center py-5"> <!-- Hiển thị khi không loading, không error, và không có bookings -->
        You have no bookings yet.
      </div>

    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Layout from '../components/Layout.vue';
import axios from 'axios'; // Bỏ nếu không dùng để fetch user nữa
import { useAuthStore } from '../store/authStore';
import alienImageUrl from'../assets/mountain.jpg';

const user = ref(null);
const loading = ref(true);
const error = ref('');
const bookings = ref([]);

const AuthStore = useAuthStore();


const fetchBookings = async () => {
  loading.value = true; // Set loading true khi bắt đầu fetch
  error.value = null; // Reset error
  try {
    // Simulate API call
    console.log('Fetching booking history...', AuthStore.isLoadingAuth);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Gán dữ liệu giả lập
    bookings.value = [
      {
        id: 1,
        roomImage: alienImageUrl, // hoặc alienImageUrlFromAssets nếu import
        roomType: 'DELUXE ROOM',
        dateRange: '05/04/2025 - 06/04/2025',
        bookingReference: 'UIT-23520498',
        city: 'Da Nang, Vietnam',
        address: '06 Linh Trung, Thủ Đức',
        guestDetails: {
          name: 'Harry Potter',
          email: 'uit@edu.vn',
          mobile: '0123456789'
        },
        qrCodeImage: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('UIT-23520498 Booking')}&bgcolor=FCEEED`,
        isActive: true, // For dark buttons
      },
      {
        id: 2,
        roomImage: alienImageUrl, // hoặc alienImageUrlFromAssets nếu import
        roomType: 'SUPERIOR ROOM',
        dateRange: '05/04/2025 - 06/04/2025',
        bookingReference: 'UIT-23520499',
        city: 'Da Nang, Vietnam',
        address: '06 Linh Trung, Thủ Đức',
        guestDetails: {
          name: 'Harry Potter',
          email: 'uit@edu.vn',
          mobile: '0123456789'
        },
        qrCodeImage: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('UIT-23520499 Booking')}&bgcolor=FCEEED`,
        isActive: false, // For light grey buttons
      }
    ];
    // bookings.value = []; // Test trường hợp không có booking

  } catch (e) {
    error.value = 'Failed to load booking history. Please try again later.';
    console.error(e);
    bookings.value = []; // Đảm bảo bookings rỗng khi có lỗi
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBookings();
});

onMounted(async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5000/api/users/me', {
      withCredentials: true
    })
    user.value = res.data
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Không thể lấy thông tin người dùng'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-container {
  font-family: Arial, sans-serif;
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  color: #333;
}

.loading-message, /* Giữ lại .loading-message để tương thích với template */
.error-message,  /* .error-message không còn dùng trong template mới */
.no-bookings-message {
  text-align: center;
  font-size: 1.2em;
  padding: 20px;
}

/* .error-message { /* Đã được thay bằng .alert .alert-danger từ Bootstrap */
  /* color: red; */
/* } */

.no-bookings-message {
  color: #777;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.booking-item {
  display: flex;
  background-color: #FCEEED; /* Light pink background */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  gap: 20px;
}

.booking-image-container {
  flex-shrink: 0;
  width: 180px;
  height: 180px;
}

.room-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.booking-info-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.room-type {
  font-size: 1.6em;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.info-block p {
  margin: 5px 0 10px;
  font-size: 0.95em;
  line-height: 1.5;
}

.info-label {
  display: block;
  font-weight: bold;
  font-size: 0.8em;
  color: #555;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.guest-actions-container {
  flex-shrink: 0;
  width: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.guest-details-section {
  margin-bottom: 15px;
}

.details-title {
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 10px;
}

.guest-details-section p {
  margin: 4px 0;
  font-size: 0.9em;
}

.detail-label {
  font-weight: normal;
  color: #333;
}

.qr-code-container {
  text-align: center;
  margin-bottom: 15px;
}

.qr-code {
  width: 100px;
  height: 100px;
  border: 1px solid #eee;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.action-btn {
  flex-grow: 1;
  padding: 10px 5px;
  border: none;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: center;
}

.action-btn.dark {
  background-color: #333;
  color: white;
}
.action-btn.dark:hover {
  background-color: #555;
}

.action-btn.light {
  background-color: #B0B0B0;
  color: #333;
}
.action-btn.light:hover {
  background-color: #999999;
}

/* Responsive Adjustments */
@media (max-width: 900px) {
  .booking-item {
    flex-direction: column;
    align-items: center;
  }
  .booking-image-container {
    width: 250px;
    height: 250px;
    margin-bottom: 15px;
  }
  .booking-info-container,
  .guest-actions-container {
    width: 100%;
    text-align: center;
  }
  .info-block p, .guest-details-section p {
    text-align: left;
  }
   .info-label, .details-title {
    text-align: left;
  }
  .guest-actions-container {
     align-items: center;
  }
  .qr-code-container {
    margin-top: 10px;
  }
  .action-buttons {
    justify-content: center;
    width: 100%;
    max-width: 350px;
  }
}

@media (max-width: 500px) {
    /* .page-title không còn */
    .booking-image-container {
        width: 100%;
        max-width: 200px;
        height: auto;
    }
    .room-image {
        height: auto;
    }
    .room-type {
        font-size: 1.4em;
    }
    .info-block p, .guest-details-section p {
        font-size: 0.9em;
    }
    .action-btn {
      font-size: 0.8em;
      padding: 8px 5px;
    }
}
</style>