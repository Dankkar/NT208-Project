<template>
  <div class="text-content-block">
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Veritatis, at ratione natus, quo voluptatibus mollitia, delectus quasi dicta autem perferendis praesentium asperiores dignissimos exercitationem illo hic nam deserunt!
    </p>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Veritatis, at ratione natus, quo voluptatibus mollitia, delectus quasi dicta autem perferendis praesentium.
    </p>
    <a href="#" class="discover-more-btn">DISCOVER MORE</a>
  </div>
</template>

<script setup>
// Không cần script cụ thể cho component này nếu nó chỉ hiển thị nội dung tĩnh
</script>

<style scoped>
.text-content-block {
  padding: 2rem; /* Hoặc padding bạn muốn */
  background-color: #f0f2f5; /* Màu nền giống trong ảnh */
  border-radius: 8px; /* Bo góc */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Căn giữa nội dung theo chiều dọc nếu cần */
}

.text-content-block p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 1rem;
}
.text-content-block p:last-of-type {
  margin-bottom: 1.5rem; /* Khoảng cách lớn hơn trước nút */
}

.discover-more-btn {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  background-color: transparent; /* Hoặc một màu nếu bạn muốn */
  color: #007bff; /* Màu xanh cho nút */
  text-decoration: none;
  font-weight: bold;
  border: 2px solid #007bff; /* Border cho nút nếu nền trong suốt */
  border-radius: 5px;
  transition: background-color 0.3s, color 0.3s;
  align-self: flex-start; /* Để nút không chiếm toàn bộ chiều rộng */
}

.discover-more-btn:hover {
  background-color: #007bff;
  color: white;
}
</style>