<!-- src/components/Footer.vue -->
<template>
  <footer
    :class="[
      'w-100',
      'py-5',
      shadow ? 'shadow-sm' : '',
      white ? 'bg-white text-dark' : 'bg-light text-dark'
    ]"
    :style="{ marginTop: '50px' }"
  >
    <div class="container">
      <div class="row">

        <!-- Logo + Địa chỉ -->
        <div class="col-md-4 mb-4 mb-md-0 text-center text-md-start">
          <h4 class="fw-bold mb-2">CHILL CHILL</h4>
          <p class="mb-1">
            Khu phố 6, phường Linh Trung,<br />
            TP.Thủ Đức, TP.Hồ Chí Minh
          </p>
          <p class="mb-0">
            <strong>Email:</strong>
            <a href="mailto:info@chillchillhotel.vn" class="text-decoration-none">
              info@chillchillhotel.vn
            </a>
          </p>
          <p>
            <strong>Hotline:</strong>
            <a href="tel:+8412375179" class="text-decoration-none">
              +84 123 75 179
            </a>
          </p>
        </div>

        <!-- Quick Links -->
        <div class="col-md-4 mb-4 mb-md-0 text-center">
          <h5 class="fw-semibold mb-3">Quick Links</h5>
          <ul class="list-unstyled">
            <li class="mb-2">
              <router-link to="/" class="text-decoration-none text-dark">
                Trang chủ
              </router-link>
            </li>
            <li class="mb-2">
              <router-link to="/hotels" class="text-decoration-none text-dark">
                Khách sạn
              </router-link>
            </li>
            <li>
              <router-link to="" class="text-decoration-none text-dark">
                Liên hệ
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Social Media -->
        <div class="col-md-4 text-center text-md-end">
          <h5 class="fw-semibold mb-3">Follow Us</h5>
          <div class="d-flex justify-content-center justify-content-md-end">
            <a href="https://facebook.com" target="_blank" class="me-3 text-dark fs-4">
              <i class="bi bi-facebook"></i>
            </a>
            <a href="https://instagram.com" target="_blank" class="me-3 text-dark fs-4">
              <i class="bi bi-instagram"></i>
            </a>
            <a href="https://twitter.com" target="_blank" class="text-dark fs-4">
              <i class="bi bi-twitter"></i>
            </a>
          </div>
        </div>

      </div>

      <!-- Copyright -->
      <div class="row mt-4">
        <div class="col text-center">
          <small class="text-muted">
            © 2025 Chill Chill. All rights reserved.
          </small>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const props = defineProps({
  white: { type: Boolean, default: false },
  shadow: { type: Boolean, default: false },
})
</script>

<style scoped>
footer {
  font-size: 0.9rem;
}
footer a:hover {
  text-decoration: underline;
}
</style>
