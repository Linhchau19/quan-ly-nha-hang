
<script setup>
import { ref, computed } from 'vue'

const period = ref('month')

const reports = [
  {
    date: '01/11',
    revenue: 3200000,
    invoices: 16
  },
  {
    date: '02/11',
    revenue: 4100000,
    invoices: 20
  },
  {
    date: '03/11',
    revenue: 2800000,
    invoices: 14
  },
  {
    date: '04/11',
    revenue: 5200000,
    invoices: 25
  },
  {
    date: '05/11',
    revenue: 3900000,
    invoices: 19
  },
  {
    date: '06/11',
    revenue: 6300000,
    invoices: 30
  }
]

const topFoods = ref([
  { name: 'Cơm chiên hải sản', quantity: 85, revenue: 4250000 },
  { name: 'Bò lúc lắc', quantity: 72, revenue: 5760000 },
  { name: 'Gà chiên nước mắm', quantity: 65, revenue: 3900000 },
  { name: 'Mì xào bò', quantity: 58, revenue: 2900000 },
  { name: 'Canh chua cá', quantity: 45, revenue: 2250000 }
])

const totalRevenue = computed(() =>
  reports.reduce((sum, item) => sum + item.revenue, 0)
)

const totalInvoices = computed(() =>
  reports.reduce((sum, item) => sum + item.invoices, 0)
)

const averageRevenue = computed(() =>
  totalInvoices.value
    ? totalRevenue.value / totalInvoices.value
    : 0
)

const maxRevenue = Math.max(...reports.map(item => item.revenue))

const formatMoney = (value) =>
  new Intl.NumberFormat('vi-VN').format(value) + ' đ'

const chartReports = computed(() => {
  if (period.value === 'week') return reports.slice(-3)
  if (period.value === 'day') return reports.slice(-1)
  return reports
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
        <small>Doanh thu mẫu trong kỳ</small>
      </div>

      <div class="stat-card">
        <div class="stat-icon blue">▤</div>
        <span>Tổng hóa đơn</span>
        <h2>{{ totalInvoices }}</h2>
        <small>Hóa đơn trong kỳ</small>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">◉</div>
        <span>Khách hàng</span>
        <h2>86</h2>
        <small>Số liệu khách hàng mẫu</small>
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

        <div class="chart">
          <div
            v-for="item in chartReports"
            :key="item.date"
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

        <div class="food-list">
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
            <tr v-for="item in chartReports" :key="item.date">
              <td>{{ item.date }}/2026</td>
              <td>{{ item.invoices }}</td>
              <td class="revenue-text">
                {{ formatMoney(item.revenue) }}
              </td>
              <td>
                <span class="completed">Đã tổng hợp</span>
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
}

.chart-column {
  height: 100%;
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
