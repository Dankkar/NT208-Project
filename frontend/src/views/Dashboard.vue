<template>
  <!-- Giữ nguyên NavBar, mình chỉ bổ sung thêm top/width -->
  <Navbar
    bgFixed="true"
    style="position: fixed !important; top: 0; width: 100%; z-index: 100;"
  />

  <!-- Wrapper chung nằm ngay dưới header -->
  <div
    class="admin-body d-flex"
    style="margin-top: 70px;"
  >
    <!-- Sidebar bên trái -->
    <aside class="sidebar-wrapper">
      <Sidebar />
    </aside>

    <!-- Nội dung chính -->
    <main
      class="content-wrapper bg-light p-4"
      style="min-height: calc(100vh - 70px);"
    >
      <h1 class="mb-4 fw-bold text-center">
        HOTEL BOOKING DASHBOARD
      </h1>

      <section>
        <div
          class="d-flex justify-content-between align-items-center mb-3"
        >
          <h2 class="h5 mb-0">Reservations</h2>
          <button
            class="btn btn-sm btn-outline-primary"
            @click="toggleStatusSort"
            title="Sort by status"
          >
            {{ applyCustomStatusSort
              ? "Clear Status Sort"
              : "Sort by Status (Priority)" }}
          </button>
        </div>

        <ReservationTable :data="reservations" />

        <Pagination
          :page="page"
          :total="totalPages"
          @change="onPageChange"
        />
      </section>
    </main>
  </div>
  <Footer shadow style="margin-top: 0 !important;" />
</template>

<script setup>
// giữ nguyên toàn bộ logic script của bạn
import { ref, computed } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import ReservationTable from "@/components/ReservationTable.vue";
import Pagination from "@/components/Pagination.vue";
import Navbar from "@/components/NavBar.vue";
import Footer from "@/components/Footer.vue";

// ... phần data & sort/page logic của bạn ...
</script>

<style scoped>
/* Wrapper chung */
.admin-body {
  width: 100%;
}

/* Sidebar: cố định độ rộng, không co khi flex */
.sidebar-wrapper {
  width: 250px;      /* đặt đúng với width sidebar hiện tại của bạn */
  flex-shrink: 0;    /* không cho sidebar co lại */
  background: #F8F9FA
}

/* Content: chiếm toàn bộ phần còn lại */
.content-wrapper {
  flex-grow: 1;
}
</style>
