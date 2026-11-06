<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTableStore } from '../stores/tableStore'

const keyword = ref('')
const tableStore = useTableStore()

// Đọc dữ liệu hóa đơn đã lưu
const loadInvoices = () => {
  try {
    return JSON.parse(
      localStorage.getItem('restaurantInvoices') || '[]'
    )
  } catch (error) {
    console.error('Lỗi đọc hóa đơn:', error)
    return []
  }
}
// Đọc danh sách đặt bàn
const loadBookings = () => {
  try {
    return JSON.parse(
      localStorage.getItem('restaurant_bookings') || '[]'
    )
  } catch (error) {
    console.error('Lỗi đọc đặt bàn:', error)
    return []
  }
}

const bookings = ref(loadBookings())

// Cập nhật danh sách đặt bàn
const refreshBookings = () => {
  bookings.value = loadBookings()
}

const invoices = ref(loadInvoices())

// Lấy ngày hiện tại theo giờ địa phương
const getToday = () => {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-')
}

// Cập nhật hóa đơn khi có thanh toán mới
const refreshInvoices = () => {
  invoices.value = loadInvoices()
}
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

// Tính doanh thu hôm nay
const todayRevenue = computed(() => {
  const today = getToday()

  return invoices.value
    .filter(invoice => {
      if (invoice.status !== 'Đã thanh toán') {
        return false
      }

      // Ưu tiên ngày thanh toán
      if (invoice.paidAt) {
        return invoice.paidAt === today
      }

      // Hỗ trợ hóa đơn cũ có ngày dạng YYYY-MM-DD
      return invoice.date?.slice(0, 10) === today
    })
    .reduce((sum, invoice) => {
      const amount = Number(
        invoice.amount ?? invoice.subtotal ?? 0
      )

      return sum + amount
    }, 0)
})

// Định dạng tiền Việt Nam
const formatMoney = amount =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
// Tổng số khách đã đến nhà hàng hôm nay
const customerVisits = computed(() => {
  const today = getToday()

  // Khách từ đơn gọi món
  const orderCustomers = invoices.value
    .filter(invoice =>
      invoice.createdAt === today &&
      invoice.status !== 'Đã hủy'
    )
    .reduce((sum, invoice) => {
      return sum + Number(invoice.guests || 1)
    }, 0)

  // Khách từ đặt bàn đã đến nhưng chưa có hóa đơn
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

const tables = tableStore.tables

const filteredTables = computed(() =>
  tables.filter(table =>
    table.name.toLowerCase().includes(keyword.value.toLowerCase())
  )
)
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
    title: 'Doanh thu hôm nay',
    value: formatMoney(todayRevenue.value)
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
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

/* Dashboard và khung nội dung góc vuông */
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

.table-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

/* Thẻ bàn góc vuông */
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