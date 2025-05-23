<template>
  <div class="d-flex flex-column bg-light vh-100 border-end p-3" style="width: 280px;">
    <h5 class="fw-bold mb-4">ADMINISTRATOR</h5>

    <div class="accordion" id="sidebarAccordion">
      <div class="accordion-item" v-for="(section, idx) in sections" :key="section.title">
        <h2 class="accordion-header" :id="'heading' + idx">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="'#collapse' + idx"
            aria-expanded="false"
            :aria-controls="'collapse' + idx"
          >
            <i class="bi bi-list me-2"></i> {{ section.title }}
          </button>
        </h2>
        <div
          :id="'collapse' + idx"
          class="accordion-collapse collapse"
          :aria-labelledby="'heading' + idx"
          data-bs-parent="#sidebarAccordion"
        >
          <div class="accordion-body p-0">
            <ul class="list-unstyled ps-3 mb-2">
              <li v-for="item in section.children" :key="item">
                <a href="#" class="d-block py-1 text-decoration-none text-dark">{{ item }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <hr />
    <a href="#" class="text-decoration-none text-dark d-flex align-items-center mt-auto">
      <i class="bi bi-gear me-2"></i> Settings
    </a>
  </div>
</template>

<script setup>
const sections = [
  {
    title: 'Dashboard',
    children: ['Reservations', 'Reviews', 'Photos'],
  },
  {
    title: 'Branches',
    children: ['Add Room', 'Remove Room', 'Add Amenity', 'Remove Amenity', 'Update Information'],
  },
  {
    title: 'Bookings',
    children: ['Statistics', 'Remove Bookings'],
  },
  {
    title: 'Users',
    children: ['Find User', 'Remove User', 'Respond User'],
  },
]
</script>
