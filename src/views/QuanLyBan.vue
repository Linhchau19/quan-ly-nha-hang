<script setup>
import { ref, computed } from 'vue'
import { useTableStore } from '../stores/tableStore.js'

const keyword = ref('')
const filterStatus = ref('Tất cả')

const tableStore = useTableStore()

// Đọc các phiếu đặt bàn đã lưu
const loadBookings = () => {
  try {
    return JSON.parse(localStorage.getItem('restaurant_bookings')) || []
  } catch {
    return []
  }
}

const bookings = ref(loadBookings())

// Lấy ngày hiện tại theo giờ địa phương
const today = (() => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})()

// Tính trạng thái bàn dựa trên phiếu đặt
const tables = computed(() => {
  return tableStore.tables.map(table => {
    const hasConfirmedBooking = bookings.value.some(booking =>
      booking.table === table.name &&
      booking.status === 'Đã xác nhận' &&
      booking.date >= today
    )

    let status = table.status

    if (table.status !== 'Đang phục vụ' && hasConfirmedBooking) {
      status = 'Đã đặt'
    }

    return {
      ...table,
      status
    }
  })
})

// Tìm kiếm và lọc bàn
const filteredTables = computed(() => {
  return tables.value.filter(table => {
    const matchKeyword =
      table.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
      table.area.toLowerCase().includes(keyword.value.toLowerCase())

    const matchStatus =
      filterStatus.value === 'Tất cả' ||
      table.status === filterStatus.value

    return matchKeyword && matchStatus
  })
})

// Đếm số bàn theo trạng thái
const countStatus = (status) => {
  if (status === 'Tất cả') return tables.value.length

  return tables.value.filter(table =>
    table.status === status
  ).length
}

// Thêm bàn
const addTable = () => {
  tableStore.addTable()
}

// Xóa bàn
const deleteTable = (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
    tableStore.deleteTable(id)
  }
}
</script>

<template>
  <div class="table-page">

    <div class="page-header">
      <div>
        <h1>Quản lý bàn ăn</h1>
        <p>Quản lý danh sách và trạng thái bàn trong nhà hàng</p>
      </div>

      <button class="add-button" @click="addTable">
        + Thêm bàn
      </button>
    </div>

    <div class="summary">
      <div class="summary-card">
        <span>Tổng số bàn</span>
        <h2>{{ countStatus('Tất cả') }}</h2>
      </div>

      <div class="summary-card">
        <span>Bàn trống</span>
        <h2>{{ countStatus('Trống') }}</h2>
      </div>

      <div class="summary-card">
        <span>Đã đặt</span>
        <h2>{{ countStatus('Đã đặt') }}</h2>
      </div>

      <div class="summary-card">
        <span>Đang phục vụ</span>
        <h2>{{ countStatus('Đang phục vụ') }}</h2>
      </div>
    </div>

    <div class="table-container">

      <div class="toolbar">
        <input
          v-model="keyword"
          type="text"
          placeholder="Tìm kiếm bàn hoặc khu vực..."
        />

        <select v-model="filterStatus">
          <option>Tất cả</option>
          <option>Trống</option>
          <option>Đã đặt</option>
          <option>Đang phục vụ</option>
        </select>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Mã bàn</th>
              <th>Tên bàn</th>
              <th>Khu vực</th>
              <th>Số chỗ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="table in filteredTables" :key="table.id">
              <td>{{ table.id }}</td>
              <td>{{ table.name }}</td>
              <td>{{ table.area }}</td>
              <td>{{ table.seats }} người</td>

              <td>
                <span
                  class="status"
                  :class="{
                    empty: table.status === 'Trống',
                    booked: table.status === 'Đã đặt',
                    serving: table.status === 'Đang phục vụ'
                  }"
                >
                  {{ table.status }}
                </span>
              </td>

              <td>
                <button
                  class="delete-button"
                  @click="deleteTable(table.id)"
                >
                  Xóa
                </button>
              </td>
            </tr>

            <tr v-if="filteredTables.length === 0">
              <td colspan="6" class="no-data">
                Không tìm thấy bàn phù hợp
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<style scoped>
.table-page {
  color: #1F2937;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0;
  color: #111827;
  font-size: 27px;
}

.page-header p {
  color: #64748B;
  margin-top: 8px;
}

.add-button {
  background: #237A50;
  color: white;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  transition: 0.25s;
}

.add-button:hover {
  background: #185C3B;
  transform: translateY(-2px);
}

.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 25px;
}

.summary-card {
  background: white;
  padding: 22px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 12px rgba(17,24,39,0.04);
}

.summary-card span {
  color: #64748B;
  font-size: 14px;
}

.summary-card h2 {
  color: #237A50;
  font-size: 27px;
  margin-bottom: 0;
}

.table-container {
  background: white;
  padding: 24px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 12px rgba(17,24,39,0.04);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 22px;
}

.toolbar input,
.toolbar select {
  padding: 11px 14px;
  border: 1px solid #D1DED5;
  background: #F8FBF9;
  color: #1F2937;
  outline: none;
}

.toolbar input {
  width: 320px;
}

.toolbar input:focus,
.toolbar select:focus {
  border-color: #52A879;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background: #F0F7F2;
  color: #237A50;
  padding: 15px;
  font-size: 14px;
}

td {
  padding: 15px;
  border-bottom: 1px solid #E5EDE7;
  font-size: 14px;
}

tr:hover td {
  background: #F8FBF9;
}

.status {
  display: inline-block;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: bold;
}

.empty {
  background: #DCFCE7;
  color: #166534;
}

.booked {
  background: #DBEAFE;
  color: #1D4ED8;
}

.serving {
  background: #FEF3C7;
  color: #92400E;
}

.delete-button {
  background: #FEE2E2;
  color: #B91C1C;
  border: none;
  padding: 8px 13px;
  cursor: pointer;
}

.delete-button:hover {
  background: #DC2626;
  color: white;
}

.no-data {
  text-align: center;
  color: #64748B;
  padding: 30px;
}

@media (max-width: 900px) {
  .summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-responsive {
    overflow-x: auto;
  }
}

@media (max-width: 600px) {
  .page-header,
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .summary {
    grid-template-columns: 1fr;
  }

  .toolbar input {
    width: auto;
  }
}
</style>
