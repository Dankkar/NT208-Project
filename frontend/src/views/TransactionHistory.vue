<!-- src/pages/TransactionHistory.vue -->
<template>
  <Layout title="Transaction History">
    <div class="page-container transaction-history-page">
      <div class="header-background">
      <div class="content-wrapper">
        <div v-if="loading" class="loading-message">Loading...</div>
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        <div v-else-if="user">
          <div v-if="transactions.length === 0" class="no-transactions-message">
            You have no transactions yet.
          </div>
          <div v-else class="transactions-table-container">
            <table>
              <thead>
                <tr>
                  <th>Payment date</th>
                  <th>Payment method</th>
                  <th>Payment status</th>
                  <th>Amount</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in transactions" :key="transaction.id">
                  <td>{{ transaction.paymentDate }}</td>
                  <td>{{ transaction.paymentMethod }}</td>
                  <td>
                    <span :class="getStatusClass(transaction.paymentStatus)">
                      {{ transaction.paymentStatus }}
                    </span>
                  </td>
                  <td>{{ formatCurrency(transaction.amount) }}</td>
                  <td>{{ formatCurrency(transaction.discount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Layout>
</template>

<script setup>
// Script của bạn vẫn giữ nguyên như đã cung cấp
import { ref, onMounted } from 'vue';
import Layout from '../components/Layout.vue';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const user = ref(null);
const loading = ref(true);
const error = ref('');
const transactions = ref([]);

const fetchTransactions = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 700));
    transactions.value = [
      { id: 1, paymentDate: '01/04/2025', paymentMethod: 'VISA', paymentStatus: 'Waiting', amount: 12000000, discount: 0 },
      { id: 2, paymentDate: '28/03/2025', paymentMethod: 'Paypal', paymentStatus: 'Completed', amount: 12000000, discount: 0 },
      { id: 3, paymentDate: '15/03/2025', paymentMethod: 'MOMO', paymentStatus: 'Cancelled', amount: 12000000, discount: 0 },
      { id: 4, paymentDate: '10/02/2025', paymentMethod: 'Bank Transfer', paymentStatus: 'Completed', amount: 5500000, discount: 100000 },
      { id: 5, paymentDate: '05/01/2025', paymentMethod: 'ZaloPay', paymentStatus: 'Failed', amount: 780000, discount: 0 }
    ];
  } catch (e) {
    error.value = 'Failed to load transaction history. Please try again later.';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '0VND';
  return new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + 'VND';
};

const getStatusClass = (status) => {
  if (!status) return 'status-default';
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
};

onMounted(() => {
  fetchTransactions();
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
  background-color: #fff;
}

/* BEGIN: CSS cho header-background và page-title đã được thêm lại/cập nhật */
.header-background {
  padding: 20px 40px;
  margin-bottom: 30px;
}

.page-title {
  font-size: 1.5em;
  font-weight: bold;
  color: #000;
  text-transform: uppercase;
  margin: 0;
}
/* END: CSS cho header-background và page-title */

.content-wrapper {
  /* Nếu có .header-background ở trên, padding-top nên để nội dung bắt đầu ngay dưới nó,
     hoặc có một khoảng cách nhỏ nếu muốn.
     Nếu .header-background nằm TRÊN content-wrapper như cấu trúc này,
     thì content-wrapper sẽ cách header-background bởi margin-bottom của header-background (nếu có)
     hoặc padding-top của content-wrapper sẽ quyết định khoảng cách từ đầu trang.
     Trong trường hợp này, chúng ta đã đặt header-background bên ngoài content-wrapper,
     nên padding của content-wrapper sẽ quyết định khoảng cách với nó.
  */
  padding: 30px 40px 40px 40px; /* Đã điều chỉnh padding-top cho content-wrapper */
  max-width: 1100px;
  margin: 0 auto;
}

.loading-message,
.error-message,
.no-transactions-message {
  text-align: center;
  font-size: 1.1em;
  padding: 30px 0;
  color: #555;
}

.error-message {
  color: #d9534f;
}

.no-transactions-message {
  color: #777;
}

.transactions-table-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow-x: auto;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9em;
  color: #333;
}

th {
  background-color: #fff;
  font-weight: bold;
  color: #000;
  font-size: 0.95em;
  white-space: nowrap;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background-color: #fdfdfe;
}

.status-completed { color: #28a745; }
.status-waiting { color: #ffc107; }
.status-cancelled { color: #6c757d; }
.status-failed { color: #dc3545; }
.status-default { color: #333; }

@media (max-width: 768px) {
  .header-background, .content-wrapper {
    padding-left: 15px;
    padding-right: 15px;
  }
  /* .page-title không cần định nghĩa lại trong media query nếu style đã OK */
  th, td {
    padding: 12px 10px;
    font-size: 0.85em;
  }
}
</style>