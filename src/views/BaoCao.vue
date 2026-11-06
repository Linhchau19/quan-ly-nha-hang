
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const period = ref('month')
const invoices = ref([])

// Đọc hóa đơn
function loadInvoices() {
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

// Cập nhật dữ liệu khi hóa đơn thay đổi
function refreshInvoices() {
  invoices.value = loadInvoices()
}

onMounted(() => {
  refreshInvoices()
  window.addEventListener('restaurantInvoicesUpdated', refreshInvoices)
  window.addEventListener('storage', refreshInvoices)
})

onUnmounted(() => {
  window.removeEventListener('restaurantInvoicesUpdated', refreshInvoices)
  window.removeEventListener('storage', refreshInvoices)
})

// Ngày hiện tại YYYY-MM-DD
function getToday() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-')
}

// Chuẩn hóa ngày hóa đơn
function getInvoiceDate(invoice) {
  const value = String(
    invoice.paidAt || invoice.date || ''
  ).trim()

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)

  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }

  return ''
}

// Khoảng thời gian báo cáo
const dateRange = computed(() => {
  const now = new Date()
  const today = getToday()

  if (period.value === 'day') {
    return { start: today, end: today }
  }

  if (period.value === 'week') {
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)

    const start = [
      startDate.getFullYear(),
      String(startDate.getMonth() + 1).padStart(2, '0'),
      String(startDate.getDate()).padStart(2, '0')
    ].join('-')

    return { start, end: today }
  }

  return {
    start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    end: today
  }
})

// Chỉ lấy hóa đơn đã thanh toán trong kỳ
const paidInvoices = computed(() => {
  const { start, end } = dateRange.value

  return invoices.value.filter(invoice => {
    if (invoice.status !== 'Đã thanh toán') return false

    const date = getInvoiceDate(invoice)

    return date && date >= start && date <= end
  })
})

// Tính tổng tiền hóa đơn
function getInvoiceAmount(invoice) {
  const items = Array.isArray(invoice.items)
    ? invoice.items
    : []

  const calculatedAmount = items.reduce((sum, item) => {
    return sum +
      Number(item.price || 0) *
      Number(item.quantity || 0)
  }, 0)

  return Number(
    invoice.amount ??
    invoice.subtotal ??
    calculatedAmount
  ) || 0
}

// Thống kê tổng quan
const totalRevenue = computed(() =>
  paidInvoices.value.reduce(
    (sum, invoice) => sum + getInvoiceAmount(invoice),
    0
  )
)

const totalInvoices = computed(() =>
  paidInvoices.value.length
)

const averageRevenue = computed(() =>
  totalInvoices.value
    ? totalRevenue.value / totalInvoices.value
    : 0
)

const totalCustomers = computed(() =>
  paidInvoices.value.reduce(
    (sum, invoice) => sum + Math.max(0, Number(invoice.guests || 1)),
    0
  )
)

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN').format(
    Number(value || 0)
  ) + ' đ'
}

// Tổng hợp doanh thu từng ngày
const reports = computed(() => {
  const dailyData = {}

  paidInvoices.value.forEach(invoice => {
    const date = getInvoiceDate(invoice)
    if (!date) return

    if (!dailyData[date]) {
      dailyData[date] = {
        fullDate: date,
        date: date.slice(8, 10) + '/' + date.slice(5, 7),
        revenue: 0,
        invoices: 0
      }
    }

    dailyData[date].revenue += getInvoiceAmount(invoice)
    dailyData[date].invoices += 1
  })

  return Object.values(dailyData).sort((a, b) =>
    a.fullDate.localeCompare(b.fullDate)
  )
})

const chartReports = computed(() => reports.value)

const maxRevenue = computed(() =>
  Math.max(...chartReports.value.map(item => item.revenue), 1)
)

// Top 5 món ăn bán chạy
const topFoods = computed(() => {
  const foods = {}

  paidInvoices.value.forEach(invoice => {
    const items = Array.isArray(invoice.items)
      ? invoice.items
      : []

    items.forEach(item => {
      const name = item.name || 'Món ăn không tên'

      if (!foods[name]) {
        foods[name] = {
          name,
          quantity: 0,
          revenue: 0
        }
      }

      foods[name].quantity += Number(item.quantity || 0)
      foods[name].revenue +=
        Number(item.price || 0) * Number(item.quantity || 0)
    })
  })

  return Object.values(foods)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
})
</script>

<template>
  <div class="report-page">
    <div class="page-header">
      <div>
        <h1>Báo cáo thống kê</h1>
        <p>Theo dõi doanh thu và tình hình kinh doanh nhà hàng</p>
      </div>

      <select v-model="period" class="period-select">
        <option value="day">Hôm nay</option>
        <option value="week">7 ngày gần nhất</option>
        <option value="month">Tháng này</option>
      </select>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon green">₫</div>
        <span>Tổng doanh thu</span>
        <h2>{{ formatMoney(totalRevenue) }}</h2>
        <small>Doanh thu đã thanh toán trong kỳ</small>
      </div>

      <div class="stat-card">
        <div class="stat-icon blue">▤</div>
        <span>Tổng hóa đơn</span>
        <h2>{{ totalInvoices }}</h2>
        <small>Hóa đơn đã thanh toán trong kỳ</small>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">◉</div>
        <span>Khách hàng</span>
        <h2>{{ totalCustomers }}</h2>
        <small>Lượt khách trong kỳ</small>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">↗</div>
        <span>Trung bình / hóa đơn</span>
        <h2>{{ formatMoney(averageRevenue) }}</h2>
        <small>Giá trị hóa đơn trung bình</small>
      </div>
    </div>

    <div class="report-grid">
      <section class="report-card revenue-card">
        <div class="section-heading">
          <div>
            <h2>Biểu đồ doanh thu</h2>
            <p>Doanh thu theo từng ngày</p>
          </div>
          <span class="unit-label">VNĐ</span>
        </div>

        <div v-if="chartReports.length === 0" class="empty-state">
          Chưa có doanh thu đã thanh toán trong kỳ.
        </div>

        <div v-else class="chart">
          <div
            v-for="item in chartReports"
            :key="item.fullDate"
            class="chart-column"
          >
            <span class="chart-value">
              {{ (item.revenue / 1000000).toFixed(1) }}tr
            </span>

            <div class="bar-area">
              <div
                class="bar"
                :style="{
                  height: (item.revenue / maxRevenue * 100) + '%'
                }"
              ></div>
            </div>

            <span class="chart-date">{{ item.date }}</span>
          </div>
        </div>
      </section>

      <section class="report-card">
        <div class="section-heading">
          <div>
            <h2>Món ăn bán chạy</h2>
            <p>Top 5 món được gọi nhiều nhất</p>
          </div>
        </div>

        <div v-if="topFoods.length === 0" class="empty-state">
          Chưa có dữ liệu món ăn đã bán trong kỳ.
        </div>

        <div v-else class="food-list">
          <div
            v-for="(food, index) in topFoods"
            :key="food.name"
            class="food-item"
          >
            <div class="food-rank">{{ index + 1 }}</div>

            <div class="food-info">
              <strong>{{ food.name }}</strong>
              <span>{{ food.quantity }} phần đã bán</span>
            </div>

            <strong class="food-revenue">
              {{ formatMoney(food.revenue) }}
            </strong>
          </div>
        </div>
      </section>
    </div>

    <section class="report-card detail-card">
      <div class="section-heading">
        <div>
          <h2>Chi tiết doanh thu</h2>
          <p>Thống kê doanh thu và số hóa đơn từng ngày</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số hóa đơn</th>
              <th>Doanh thu</th>
              <th>Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in chartReports"
              :key="item.fullDate"
            >
              <td>{{ item.fullDate.split('-').reverse().join('/') }}</td>
              <td>{{ item.invoices }}</td>
              <td class="revenue-text">
                {{ formatMoney(item.revenue) }}
              </td>
              <td>
                <span class="completed">Đã tổng hợp</span>
              </td>
            </tr>

            <tr v-if="chartReports.length === 0">
              <td colspan="4" class="empty-state">
                Chưa có dữ liệu doanh thu trong kỳ.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.report-page {
  color: #25352d;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 15px;
}

.page-header h1 {
  font-size: 25px;
  margin: 0 0 7px;
}

.page-header p,
.section-heading p {
  color: #829087;
  font-size: 14px;
  margin: 0;
}

.period-select {
  width: 170px;
  padding: 11px;
  border: 1px solid #dce6df;
  background: white;
  color: #365443;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}

.stat-card,
.report-card {
  background: white;
  border: 1px solid #e4ece6;
  padding: 20px;
}

.stat-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 13px;
}

.green { background: #e5f4e9; color: #237a50; }
.blue { background: #e8efff; color: #4166a8; }
.orange { background: #fff2dc; color: #b7791f; }
.purple { background: #f0eafe; color: #7652b5; }

.stat-card span {
  color: #718078;
  font-size: 13px;
}

.stat-card h2 {
  color: #237a50;
  font-size: 21px;
  margin: 10px 0 6px;
}

.stat-card small {
  color: #8a978e;
  font-size: 12px;
}

.report-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 18px;
  margin-bottom: 20px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-heading h2 {
  font-size: 17px;
  margin: 0 0 7px;
}

.unit-label {
  color: #237a50;
  font-size: 12px;
}

.chart {
  height: 230px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 12px;
  border-bottom: 1px solid #e5ece7;
  padding: 0 5px;
  overflow-x: auto;
}

.chart-column {
  height: 100%;
  min-width: 35px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.chart-value,
.chart-date {
  font-size: 11px;
  color: #718078;
  white-space: nowrap;
}

.bar-area {
  height: 160px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: min(48px, 75%);
  min-height: 4px;
  background: linear-gradient(180deg, #52a879, #237a50);
  transition: height 0.3s ease;
}

.food-list {
  display: flex;
  flex-direction: column;
}

.food-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid #edf1ee;
}

.food-rank {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: #e5f4e9;
  color: #237a50;
  font-weight: bold;
  flex-shrink: 0;
}

.food-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.food-info strong {
  font-size: 13px;
}

.food-info span {
  font-size: 11px;
  color: #89958d;
}

.food-revenue {
  font-size: 12px;
  color: #237a50;
  white-space: nowrap;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

th {
  background: #f0f7f2;
  color: #365443;
  text-align: left;
  padding: 13px;
  font-size: 13px;
}

td {
  padding: 13px;
  border-bottom: 1px solid #edf1ee;
  font-size: 13px;
}

.revenue-text {
  color: #237a50;
  font-weight: 600;
}

.completed {
  background: #e5f4e9;
  color: #237a50;
  padding: 6px 9px;
  font-size: 11px;
}

.empty-state {
  text-align: center;
  color: #829087;
  padding: 25px;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .report-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
