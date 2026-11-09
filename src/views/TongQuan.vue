
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTableStore } from '../stores/tableStore'

const keyword = ref('')
const tableStore = useTableStore()

// Đọc dữ liệu hóa đơn đã lưu
const loadInvoices = () => {
  try {
    const data = JSON.parse(
      localStorage.getItem('restaurantInvoices') || '[]'
    )
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Lỗi đọc hóa đơn:', error)
    return []
  }
}

// Đọc danh sách đặt bàn
const loadBookings = () => {
  try {
    const data = JSON.parse(
      localStorage.getItem('restaurant_bookings') || '[]'
    )
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Lỗi đọc đặt bàn:', error)
    return []
  }
}

const bookings = ref(loadBookings())
const invoices = ref(loadInvoices())

// Cập nhật danh sách đặt bàn
const refreshBookings = () => {
  bookings.value = loadBookings()
}

// Cập nhật hóa đơn
const refreshInvoices = () => {
  invoices.value = loadInvoices()
}

// Lấy ngày hiện tại theo giờ địa phương
const getToday = () => {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-')
}

// Theo dõi dữ liệu thay đổi
onMounted(() => {
  window.addEventListener(
    'restaurantInvoicesUpdated',
    refreshInvoices
  )

  window.addEventListener('storage', refreshInvoices)

  window.addEventListener(
    'restaurantBookingsUpdated',
    refreshBookings
  )
})

onUnmounted(() => {
  window.removeEventListener(
    'restaurantInvoicesUpdated',
    refreshInvoices
  )

  window.removeEventListener('storage', refreshInvoices)

  window.removeEventListener(
    'restaurantBookingsUpdated',
    refreshBookings
  )
})

// Tổng số khách đã đến nhà hàng hôm nay
const customerVisits = computed(() => {
  const today = getToday()

  // Khách từ hóa đơn
  const orderCustomers = invoices.value
    .filter(invoice =>
      invoice.createdAt === today &&
      invoice.status !== 'Đã hủy'
    )
    .reduce((sum, invoice) => {
      return sum + Number(invoice.guests || 1)
    }, 0)

  // Khách đặt bàn đã đến nhưng chưa có hóa đơn
  const bookingCustomers = bookings.value
    .filter(booking =>
      booking.date === today &&
      ['Đang phục vụ', 'Hoàn thành'].includes(booking.status) &&
      !invoices.value.some(invoice =>
        invoice.table === booking.table &&
        invoice.createdAt === today
      )
    )
    .reduce((sum, booking) => {
      return sum + Number(booking.guests || 0)
    }, 0)

  return orderCustomers + bookingCustomers
})

// Danh sách bàn
const tables = tableStore.tables

// Tìm kiếm bàn
const filteredTables = computed(() =>
  tables.filter(table =>
    table.name.toLowerCase().includes(keyword.value.toLowerCase())
  )
)

// Thống kê tổng quan
const stats = computed(() => [
  {
    title: 'Tổng số bàn',
    value: tableStore.totalTables
  },
  {
    title: 'Bàn đang phục vụ',
    value: tableStore.servingTables
  },
  {
    title: 'Bàn còn trống',
    value: tableStore.emptyTables
  },
  {
    title: 'Bàn đã đặt',
    value: tableStore.bookedTables
  },
  {
    title: 'Khách hàng lượt ghé',
    value: customerVisits.value + ' người'
  }
])
</script>

<template>
  <div class="overview">
    <header class="topbar">
      <div>
        <h1>Tổng quan</h1>
        <p>Chào mừng bạn đến với hệ thống quản lý nhà hàng.</p>
      </div>
    </header>

    <!-- Thống kê tổng quan -->
    <section class="stats">
      <div
        v-for="item in stats"
        :key="item.title"
        class="stat-card"
      >
        <p>{{ item.title }}</p>
        <h2>{{ item.value }}</h2>
      </div>
    </section>

    <!-- Trạng thái bàn ăn -->
    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Trạng thái bàn ăn</h2>
          <p>Theo dõi tình trạng bàn trong nhà hàng</p>
        </div>

        <input
          v-model="keyword"
          placeholder="Tìm kiếm bàn..."
        />
      </div>

      <div class="table-grid">
        <div
          v-for="table in filteredTables"
          :key="table.id"
          class="table-card"
        >
          <h3>{{ table.name }}</h3>
          <p>👥 {{ table.seats }} người</p>

          <span
            class="status"
            :class="{
              empty: table.status === 'Trống',
              serving: table.status === 'Đang phục vụ',
              booked: table.status === 'Đã đặt'
            }"
          >
            {{ table.status }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview {
  color: #1F2937;
}

.topbar {
  margin-bottom: 30px;
}

.topbar h1 {
  color: #111827;
  font-size: 27px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

/* Khung thống kê và nội dung */
.stat-card,
.content-card {
  background: white;
  padding: 23px;
  border-radius: 0;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 15px rgba(17, 24, 39, 0.05);
}

.stat-card p {
  color: #64748B;
}

.stat-card h2 {
  color: #237A50;
}

.content-card {
  max-width: 1150px;
  margin: auto;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 22px;
}

.section-heading h2 {
  color: #111827;
}

.section-heading input {
  padding: 11px 14px;
  border: 1px solid #D1DED5;
  border-radius: 0;
  outline: none;
}

.section-heading input:focus {
  border-color: #237A50;
}

/* Danh sách bàn */
.table-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.table-card {
  background: #F8FBF9;
  border: 1px solid #E2EDE5;
  border-radius: 0;
  padding: 20px;
}

.status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 0;
  font-size: 12px;
  font-weight: bold;
}

.status.empty {
  background: #DCFCE7;
  color: #166534;
}

.status.serving {
  background: #FEF3C7;
  color: #92400E;
}

.status.booked {
  background: #DBEAFE;
  color: #1D4ED8;
}

/* Responsive */
@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .stats,
  .table-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

</style>
