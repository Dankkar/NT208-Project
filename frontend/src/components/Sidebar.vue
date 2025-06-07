<template>
  <nav class="d-flex flex-column bg-light vh-100 border-end p-3">
    <h5 class="fw-bold mb-4">ADMINISTRATOR</h5>
    <div class="accordion" id="sidebarAccordion">
      <div
        class="accordion-item"
        v-for="(section, idx) in sections"
        :key="section.title"
      >
        <h2 class="accordion-header" :id="`heading${idx}`">
          <button
            class="accordion-button"
            :class="{ collapsed: !isSectionOpen(idx) }"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="`#collapse${idx}`"
            :aria-expanded="isSectionOpen(idx)"
            :aria-controls="`collapse${idx}`"
          >
            <i class="bi bi-list me-2"></i>
            {{ section.title }}
          </button>
        </h2>
        <div
          :id="`collapse${idx}`"
          class="accordion-collapse collapse"
          :class="{ show: isSectionOpen(idx) }"
          :aria-labelledby="`heading${idx}`"
          data-bs-parent="#sidebarAccordion"
        >
          <div class="accordion-body p-0">
            <ul class="list-unstyled ps-3 mb-2">
              <li
                v-for="child in section.children"
                :key="child.name"
              >
                <router-link
                  :to="child.route"
                  class="d-block py-1 text-decoration-none"
                  :class="{ 'text-primary fw-bold': isActiveRoute(child.route), 'text-dark': !isActiveRoute(child.route) }"
                >
                  {{ child.name }}
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

// Define the sidebar sections and their corresponding routes
const sections = [
  {
    title: 'Dashboard',
    children: [
      { name: 'Reservations', route: '/admin/reservations' },
    ],
  },
  {
    title: 'Branches',
    children: [
      { name: 'Find Hotel', route: '/admin/branches/find-hotel' },
      { name: 'Find Room Type', route: '/admin/branches/find-room-type' },
      { name: 'Find Amenity', route: '/admin/branches/find-amenity' },
    ],
  },
  {
    title: 'Bookings',
    children: [
      { name: 'Statistics', route: '/admin/bookings/statistics' },
      { name: 'CheckIn/CheckOut', route: '/admin/bookings/check-in-out' },
    ],
  },
  {
    title: 'Users',
    children: [
      { name: 'Find User', route: '/admin/users/find-user' },
    ],
  },
  {
    title: 'Reviews',
    children: [
      { name: 'Find Review', route: '/admin/reviews/find-review' },
    ]
  }
];

// Determine if a section should be open based on current route
const isSectionOpen = idx => {
  return sections[idx].children.some(child => child.route === route.path);
};

// Check if a given route is active
const isActiveRoute = routePath => route.path === routePath;
</script>

<style scoped>
nav {
  width: 280px;
}
.accordion-button {
  display: flex;
  align-items: center;
}
</style>
