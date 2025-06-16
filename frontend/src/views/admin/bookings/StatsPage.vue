<!-- src/views/admin/StatisticsPage.vue -->
<template>
  <div class="container-fluid mt-4">
    <h1 class="mb-4 fw-bold text-center">STATISTICS & ANALYTICS</h1>

    <!-- Filters cho các section cần startDate, endDate, groupBy -->
    <div class="card p-3 mb-4 shadow-sm">
      <h5 class="card-title">Filters for Detailed Reports</h5>
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label for="startDate" class="form-label">Start Date</label>
          <input type="date" class="form-control form-control-sm" id="startDate" v-model="filters.startDate">
        </div>
        <div class="col-md-3">
          <label for="endDate" class="form-label">End Date</label>
          <input type="date" class="form-control form-control-sm" id="endDate" v-model="filters.endDate">
        </div>
        <div class="col-md-3">
          <label for="groupByPeriod" class="form-label">Group Revenue by Period</label>
          <select class="form-select form-select-sm" id="groupByPeriod" v-model="filters.groupByPeriod">
            <!-- <option value="day">Day</option> -->
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
        <div class="col-md-3">
          <button class="btn btn-primary btn-sm w-100" @click="fetchFilteredData" :disabled="isLoadingFiltered">
            <span v-if="isLoadingFiltered" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Apply Filters & Refresh Details
          </button>
        </div>
      </div>
      <div v-if="filterError" class="alert alert-danger mt-3 py-2">{{ filterError }}</div>
    </div>

    <!-- Revenue Overview Section -->
    <section class="mb-5">
      <h3 class="mb-3 text-primary">1. Overall Revenue Overview</h3>
      <div v-if="loading.overview" class="text-center"><div class="spinner-border"></div></div>
      <div v-else-if="errors.overview" class="alert alert-danger py-2">{{ errors.overview }}</div>
      <div v-else-if="overviewData" class="row g-3">
        <div class="col-sm-6 col-md-4 col-lg-2">
          <div class="card text-center shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted small">Monthly Revenue</h6>
              <p class="card-text fs-5 fw-bold">{{ formatCurrency(overviewData.MonthlyRevenue) }}</p>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <div class="card text-center shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted small">Yearly Revenue</h6>
              <p class="card-text fs-5 fw-bold">{{ formatCurrency(overviewData.YearlyRevenue) }}</p>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <div class="card text-center shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted small">Total Valid Bookings</h6>
              <p class="card-text fs-5 fw-bold">{{ overviewData.TotalBookings }}</p>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <div class="card text-center shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted small">Avg. Booking Value</h6>
              <p class="card-text fs-5 fw-bold">{{ formatCurrency(overviewData.AverageBookingValue) }}</p>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-2">
          <div class="card text-center shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted small">Cancellation Rate</h6>
              <p class="card-text fs-5 fw-bold">{{ overviewData.CancellationRate !== null ? overviewData.CancellationRate + '%' : 'N/A' }}</p>
            </div>
          </div>
        </div>
         <div class="col-sm-6 col-md-4 col-lg-2">
          <div class="card text-center shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted small">Current Occupancy</h6>
              <p class="card-text fs-5 fw-bold">{{ overviewData.CurrentOccupancyRate !== null ? overviewData.CurrentOccupancyRate + '%' : 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="alert alert-info py-2">No overview data available.</div>
    </section>

    <!-- Revenue by Hotel Section (sử dụng filters startDate, endDate) -->
    <section class="mb-5">
      <h3 class="mb-3 text-primary">2. Revenue by Hotel</h3>
      <div v-if="loading.byHotel" class="text-center"><div class="spinner-border"></div></div>
      <div v-else-if="errors.byHotel" class="alert alert-danger py-2">{{ errors.byHotel }}</div>
      <div v-else-if="revenueByHotel.length > 0" class="card p-3 shadow-sm">
          <div class="chart-container mb-3" style="height: 350px;">
            <DoughnutChart v-if="revenueByHotelChartData.labels.length" :data="revenueByHotelChartData" :options="doughnutChartOptions('Revenue Distribution by Hotel')"/>
          </div>
          <div class="table-responsive">
            <table class="table table-sm table-striped table-hover">
              <thead><tr><th>Hotel Name</th><th>Total Revenue</th><th>Total Bookings</th><th>Cancelled</th><th>Avg. Revenue/Booking</th></tr></thead>
              <tbody>
                <tr v-for="item in revenueByHotel" :key="item.TenKS">
                  <td>{{ item.TenKS }}</td>
                  <td>{{ formatCurrency(item.Revenue) }}</td>
                  <td>{{ item.TotalBookings }}</td>
                  <td>{{ item.CancelledBookings }}</td>
                  <td>{{ formatCurrency(item.AverageRevenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
      <div v-else class="alert alert-info py-2">No revenue data for hotels in the selected period or filters not applied.</div>
    </section>

    <!-- Revenue by Time Period Section (sử dụng filters startDate, endDate, groupByPeriod) -->
    <section class="mb-5">
      <h3 class="mb-3 text-primary">3. Revenue by Time Period (Grouped by {{ filters.groupByPeriod }})</h3>
      <div v-if="loading.byPeriod" class="text-center"><div class="spinner-border"></div></div>
      <div v-else-if="errors.byPeriod" class="alert alert-danger py-2">{{ errors.byPeriod }}</div>
      <div v-else-if="revenueByPeriod.length > 0" class="card p-3 shadow-sm">
        <div class="chart-container mb-3" style="height: 350px;">
          <BarChart v-if="revenueByPeriodChartData.labels.length" :data="revenueByPeriodChartData" :options="barChartOptions(`Revenue by ${filters.groupByPeriod}`)" />
        </div>
        <div class="table-responsive">
            <table class="table table-sm table-striped table-hover">
              <thead><tr><th>Period</th><th>Revenue</th><th>Booking Count</th><th>Cancelled</th><th>Avg. Revenue/Booking</th></tr></thead>
              <tbody>
                <tr v-for="item in revenueByPeriod" :key="item.Period">
                  <td>{{ formatDateByGroup(item.Period, filters.groupByPeriod) }}</td>
                  <td>{{ formatCurrency(item.Revenue) }}</td>
                  <td>{{ item.BookingCount }}</td>
                  <td>{{ item.CancelledCount }}</td>
                  <td>{{ formatCurrency(item.AverageRevenue) }}</td>
                </tr>
              </tbody>
            </table>
        </div>
      </div>
      <div v-else class="alert alert-info py-2">No revenue data for the selected period/grouping or filters not applied.</div>
    </section>

    <!-- Các sections khác (Revenue by Room Type, Service, Analytics) sẽ được thêm sau nếu cần -->

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';
import { Bar as BarChart, Doughnut as DoughnutChart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

// === Filters ===
const today = new Date();
const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

const filters = reactive({
  startDate: firstDayLastMonth.toISOString().split('T')[0],
  endDate: lastDayLastMonth.toISOString().split('T')[0],
  groupByPeriod: 'month',
});
const filterError = ref('');

// === Loading and Error States ===
const loading = reactive({
  overview: true,
  byHotel: true,
  byPeriod: true,
  // Thêm các state khác nếu cần sau
});
const errors = reactive({
  overview: '',
  byHotel: '',
  byPeriod: '',
});
// Computed property để biết có API nào đang load không (cho nút Apply Filter)
const isLoadingFiltered = computed(() => loading.byHotel || loading.byPeriod);


// === Data Refs ===
const overviewData = ref(null);
const revenueByHotel = ref([]);
const revenueByPeriod = ref([]);

// === Utility Functions ===
const formatCurrency = (value) => {
  if (value == null || isNaN(parseFloat(value))) return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
};
const formatDateByGroup = (dateString, groupBy) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() trả về 0-11
    // const day = date.getDate();

    // if (groupBy === 'day') return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    if (groupBy === 'month') return `${month.toString().padStart(2, '0')}/${year}`;
    if (groupBy === 'year') return `${year}`;
    return date.toLocaleDateString('vi-VN'); // Fallback
};


// === API Calls ===
async function fetchRevenueOverview() {
  loading.overview = true;
  errors.overview = '';
  try {
    const response = await axios.get('/api/admin/revenue/overview', { withCredentials: true });
    if (response.data && response.data.success) {
      overviewData.value = response.data.data;
    } else {
      errors.overview = response.data?.message || 'Failed to load overview data.';
    }
  } catch (err) {
    console.error("Error fetching overview:", err);
    errors.overview = `API Error: ${err.response?.data?.error || err.message || 'Could not fetch overview.'}`;
  } finally {
    loading.overview = false;
  }
}

async function fetchRevenueByHotel() {
  loading.byHotel = true;
  errors.byHotel = '';
  revenueByHotel.value = []; // Xóa dữ liệu cũ trước khi fetch
  try {
    const response = await axios.get('/api/admin/revenue/hotels', {
        params: { startDate: filters.startDate, endDate: filters.endDate },
        withCredentials: true
    });
    if(response.data && response.data.success) {
        revenueByHotel.value = response.data.data;
    } else {
        errors.byHotel = response.data?.message || response.data?.error || 'Failed to load revenue by hotel.';
    }
  } catch (err) {
    console.error("Error fetching revenue by hotel:", err);
    errors.byHotel = `API Error: ${err.response?.data?.error || err.message || 'Could not fetch revenue by hotel.'}`;
  } finally {
    loading.byHotel = false;
  }
}

async function fetchRevenueByPeriod() {
  loading.byPeriod = true;
  errors.byPeriod = '';
  revenueByPeriod.value = []; // Xóa dữ liệu cũ
  try {
    const response = await axios.get('/api/admin/revenue/period', {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupBy: filters.groupByPeriod
      },
      withCredentials: true
    });
    if (response.data && response.data.success) {
      revenueByPeriod.value = response.data.data;
    } else {
      errors.byPeriod = response.data?.message || response.data?.error ||'Failed to load revenue by period.';
    }
  } catch (err) {
    console.error("Error fetching revenue by period:", err);
    errors.byPeriod = `API Error: ${err.response?.data?.error || err.message || 'Could not fetch revenue by period.'}`;
  } finally {
    loading.byPeriod = false;
  }
}

function validateFilters() {
    filterError.value = '';
    if (!filters.startDate || !filters.endDate) {
        filterError.value = "Start Date and End Date are required.";
        return false;
    }
    if (new Date(filters.startDate) > new Date(filters.endDate)) {
        filterError.value = "Start Date cannot be after End Date.";
        return false;
    }
    return true;
}

// Hàm gọi khi nhấn nút "Apply Filters & Refresh Details"
async function fetchFilteredData() {
  if (validateFilters()) {
    // Gọi các API cần filter ngày
    await Promise.all([
      fetchRevenueByHotel(),
      fetchRevenueByPeriod(),
      // Gọi thêm các fetch khác nếu cần ở đây
    ]);
  }
}

// Fetch dữ liệu khi component được mount
onMounted(async () => {
  await fetchRevenueOverview(); // Overview không cần filter ban đầu
  if (validateFilters()){ // Fetch các dữ liệu khác với filter mặc định
    await fetchFilteredData();
  }
});

// === Chart Configuration ===
const chartColors = [
  'rgba(54, 162, 235, 0.7)',   // Blue
  'rgba(255, 99, 132, 0.7)',   // Red
  'rgba(255, 206, 86, 0.7)',   // Yellow
  'rgba(75, 192, 192, 0.7)',   // Teal
  'rgba(153, 102, 255, 0.7)',  // Purple
  'rgba(255, 159, 64, 0.7)',   // Orange
  'rgba(46, 204, 113, 0.7)',   // Emerald Green
  'rgba(231, 76, 60, 0.7)',    // Alizarin Crimson (Darker Red)
  'rgba(52, 152, 219, 0.7)',   // Peter River Blue (Lighter Blue)
  'rgba(241, 196, 15, 0.7)',   // Sun Flower Yellow (Darker Yellow)
  'rgba(149, 165, 166, 0.7)',  // Concrete Gray
  'rgba(26, 188, 156, 0.7)',   // Turquoise
  'rgba(230, 126, 34, 0.7)',   // Carrot Orange
  'rgba(192, 57, 43, 0.7)',    // Pomegranate Red
  'rgba(41, 128, 185, 0.7)',   // Belize Hole Blue (Darker than Peter River)
  'rgba(243, 156, 18, 0.7)',   // Orange (Yellow-Orange)
  'rgba(39, 174, 96, 0.7)',    // Nephritis Green
  'rgba(142, 68, 173, 0.7)',   // Wisteria Purple
  'rgba(44, 62, 80, 0.7)',     // Midnight Blue (Very Dark Blue/Gray)
  'rgba(127, 140, 141, 0.7)'   // Asbestos Gray
];
const doughnutChartOptions = (titleText) => ({
    maintainAspectRatio: false, // Important for custom height
    plugins: {
        legend: {
            position: 'top', // Or 'bottom', 'left', 'right'
            labels: {
                // You can customize label appearance here if needed
                // boxWidth: 20,
                // padding: 20
            }
        },
        title: {
            display: true,
            text: titleText,
            font: {
                size: 16 // Adjust as needed
            }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed !== null) {
                        // For the doughnut chart, 'parsed' usually holds the direct value
                        label += formatCurrency(context.parsed); // Using your formatCurrency utility
                    }
                    return label;
                }
            }
        }
    }
});

const barChartOptions = (titleText) => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { callback: value => formatCurrency(value) } } },
    plugins: {
        legend: { display: false }, // Bar charts often hide dataset legend if only one dataset
        title: { display: true, text: titleText, font: { size: 16 } },
        tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}` } }
    }
});


// === Computed Chart Data ===
const revenueByHotelChartData = computed(() => ({
  labels: revenueByHotel.value.map(item => item.TenKS.substring(0,20) + (item.TenKS.length > 20 ? '...' : '')), // Rút gọn tên KS nếu quá dài
  datasets: [{
    label: 'Revenue',
    data: revenueByHotel.value.map(item => item.Revenue),
    backgroundColor: revenueByHotel.value.map((_, i) => chartColors[i % chartColors.length]),
  }]
}));

const revenueByPeriodChartData = computed(() => ({
  labels: revenueByPeriod.value.map(item => formatDateByGroup(item.Period, filters.groupByPeriod)),
  datasets: [{
    label: 'Revenue',
    data: revenueByPeriod.value.map(item => item.Revenue),
    backgroundColor: chartColors[0],
    borderColor: chartColors[0].replace('0.7', '1'),
    borderWidth: 1,
    barPercentage: 0.1
  }]
}));

</script>

<style scoped>
.card {
  margin-bottom: 1.5rem;
}
.card-text.fs-5 { /* Adjusted from fs-4 cho các card overview nhỏ hơn */
    min-height: 30px;
    line-height: 1.2;
}
.chart-container {
  position: relative;
  height: 350px; /* Chiều cao mặc định cho biểu đồ */
  width: 100%;
}
.table-sm td, .table-sm th {
    padding: .4rem;
    font-size: 0.875rem;
}
.form-control-sm, .form-select-sm {
    font-size: 0.875rem;
}
.small { font-size: .8rem; } /* Cho text nhỏ hơn nữa như card subtitle */
</style>
