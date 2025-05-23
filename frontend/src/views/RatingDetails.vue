<template>
  <div class="p-4">
    <h2 class="mb-4">{{ hotelName }}</h2>

    <div v-for="(rating, idx) in ratings" :key="idx" class="mb-4 border rounded p-3 shadow-sm d-flex align-items-start">
      <img
        :src="`/images/users/${rating.userAvatar}`"
        alt="User avatar"
        class="rounded-circle me-3"
        width="80"
        height="80"
      />
      <div class="flex-grow-1">
        <h5>{{ rating.userName }}</h5>
        <div class="fw-semibold">{{ rating.room }} - {{ rating.branch }}</div>
        <div class="text-warning mb-2">
          <i
            v-for="i in 5"
            :key="i"
            class="bi"
            :class="i <= rating.stars ? 'bi-star-fill' : 'bi-star'"
          ></i>
        </div>
        <p>{{ rating.comment }}</p>
      </div>
      <img
        :src="`/images/reviews/${rating.reviewImage}`"
        alt="Review"
        width="140"
        height="100"
        class="ms-3 rounded"
      />
    </div>
  </div>
</template>

<script setup>
const hotelName = 'Da Nang Branch'

const ratings = [
  {
    userAvatar: 'user1.png',
    userName: 'Mr Hieu',
    room: 'Deluxe Room',
    branch: 'Da Nang Branch',
    stars: 5,
    comment:
      'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Veritatis, at ratione natus, quo voluptatibus mollitia, delectus quasi dicta autem perferendis praesentium asperiores dignissimos exercitationem illo hic nam deserunt! Asperiores, cupiditate.',
    reviewImage: 'alien1.png',
  },
  // có thể thêm nhiều đánh giá hơn
]
</script>

<style scoped>
.bi-star-fill {
  color: #ffc107;
}
</style>
