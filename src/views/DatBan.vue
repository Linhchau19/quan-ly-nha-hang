
<script setup>
import { ref, computed, watch } from 'vue'
import { useTableStore } from '../stores/tableStore.js'

const tableStore = useTableStore()
const keyword = ref('')

// Ngày đặt bàn sớm nhất: ngày mai
const minBookingDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
})

// Danh sách bàn còn trống
const availableTables = computed(() =>
  tableStore.tables.filter(table => table.status === 'Trống')
)

// Form đặt bàn
const form = ref({
  customer: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
  table: '',
  note: ''
})

// Đọc dữ liệu đặt bàn
const loadBookings = () => {
  try {
    const saved = localStorage.getItem('restaurant_bookings')

    if (saved !== null) {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Không thể đọc dữ liệu đặt bàn:', error)
  }

  return [
    {
      id: 'DB001',
      customer: 'Nguyễn Văn An',
      phone: '0901234567',
      date: '2026-11-04',
      time: '18:00',
      guests: 4,
      table: 'Bàn 01',
      status: 'Đã xác nhận'
    },
    {
      id: 'DB002',
      customer: 'Trần Thị Bình',
      phone: '0912345678',
      date: '2026-11-04',
      time: '19:00',
      guests: 2,
      table: 'Bàn 04',
      status: 'Chờ xác nhận'
    }
  ]
}

const bookings = ref(loadBookings())

// Tự động lưu dữ liệu
watch(
  bookings,
  (newBookings) => {
    localStorage.setItem(
      'restaurant_bookings',
      JSON.stringify(newBookings)
    )
  },
  { deep: true }
)

// Tìm kiếm phiếu đặt bàn
const filteredBookings = computed(() => {
  return bookings.value.filter(item =>
    item.customer.toLowerCase().includes(keyword.value.toLowerCase()) ||
    item.id.toLowerCase().includes(keyword.value.toLowerCase()) ||
    item.phone.includes(keyword.value)
  )
})

// Thêm phiếu đặt bàn
const addBooking = () => {
  if (
    !form.value.customer.trim() ||
    !form.value.phone.trim() ||
    !form.value.date ||
    !form.value.time ||
    !form.value.table
  ) {
    alert('Vui lòng nhập đầy đủ thông tin đặt bàn!')
    return
  }

  if (form.value.date < minBookingDate.value) {
    alert('Bạn phải đặt bàn trước ít nhất 1 ngày!')
    return
  }

  if (form.value.guests < 1 || form.value.guests > 30) {
    alert('Số lượng khách phải từ 1 đến 30 người!')
    return
  }

  // Kiểm tra bàn đã được đặt đúng ngày và giờ chưa
  const isDuplicate = bookings.value.some(booking =>
    booking.table === form.value.table &&
    booking.date === form.value.date &&
    booking.time === form.value.time &&
    booking.status !== 'Đã hủy'
  )

  if (isDuplicate) {
    alert('Bàn này đã có phiếu đặt vào thời gian bạn chọn. Vui lòng chọn bàn hoặc giờ khác!')
    return
  }

  const maxId = bookings.value.reduce((max, item) => {
    const number = Number(item.id.replace('DB', ''))
    return Math.max(max, number || 0)
  }, 0)

  const newId = 'DB' + String(maxId + 1).padStart(3, '0')

  bookings.value.push({
    id: newId,
    customer: form.value.customer.trim(),
    phone: form.value.phone.trim(),
    date: form.value.date,
    time: form.value.time,
    guests: form.value.guests,
    table: form.value.table,
    note: form.value.note,
    status: 'Chờ xác nhận'
  })

  alert('Đặt bàn thành công! Thông tin đã được lưu.')

  form.value = {
    customer: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    table: '',
    note: ''
  }
}

// Cập nhật trạng thái phiếu đặt bàn
const updateStatus = (booking) => {
  if (booking.status === 'Chờ xác nhận') {
    booking.status = 'Đã xác nhận'
    alert('Đã xác nhận đặt bàn!')
  }

  else if (booking.status === 'Đã xác nhận') {
    const table = tableStore.tables.find(
      item => item.name === booking.table
    )

    if (!table) {
      alert('Không tìm thấy bàn trong hệ thống!')
      return
    }

    if (table.status === 'Đang phục vụ') {
      alert('Bàn hiện đang phục vụ một khách khác!')
      return
    }

    booking.status = 'Đang phục vụ'
    table.status = 'Đang phục vụ'

    alert('Đã xác nhận khách đến!')
  }

  else if (booking.status === 'Đang phục vụ') {
    const table = tableStore.tables.find(
      item => item.name === booking.table
    )

    booking.status = 'Hoàn thành'

    if (table) {
      table.status = 'Trống'
    }

    alert('Đã hoàn thành phiếu đặt bàn!')
  }
}
localStorage.setItem(
  'restaurant_bookings',
  JSON.stringify(bookings.value)
)

window.dispatchEvent(new Event('restaurantBookingsUpdated'))

// Hủy phiếu đặt bàn
const cancelBooking = (id) => {
  const booking = bookings.value.find(item => item.id === id)

  if (!booking) return

  if (confirm('Bạn có chắc chắn muốn hủy phiếu đặt bàn này?')) {
    booking.status = 'Đã hủy'
    alert('Đã hủy phiếu đặt bàn!')
  }
}
</script>

<template>
  <div class="booking-page">

    <!-- Tiêu đề -->
    <header class="page-header">
      <div>
        <h1>Đặt bàn</h1>
        <p>Quản lý phiếu đặt bàn trong nhà hàng</p>
      </div>
    </header>

    <!-- Form đặt bàn -->
    <div class="booking-form-card">
      <h2>Thông tin đặt bàn</h2>

      <form @submit.prevent="addBooking">

        <div class="form-grid">

          <div class="form-group">
            <label>Họ tên khách hàng</label>
            <input
              v-model="form.customer"
              type="text"
              placeholder="Nhập tên khách hàng"
              required
            />
          </div>

          <div class="form-group">
            <label>Số điện thoại</label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>

          <div class="form-group">
            <label>Ngày đặt bàn</label>
            <input
              v-model="form.date"
              type="date"
              :min="minBookingDate"
              required
            />
            <small>Vui lòng đặt bàn trước ít nhất 1 ngày.</small>
          </div>

          <div class="form-group">
            <label>Giờ đặt bàn</label>
            <input
              v-model="form.time"
              type="time"
              required
            />
          </div>

          <div class="form-group">
            <label>Số lượng khách</label>
            <input
              v-model.number="form.guests"
              type="number"
              min="1"
              max="30"
              required
            />
          </div>

          <div class="form-group">
            <label>Chọn bàn</label>
            <select v-model="form.table" required>
              <option value="">-- Chọn bàn --</option>

              <option
                v-for="table in availableTables"
                :key="table.id"
                :value="table.name"
              >
                {{ table.name }} - {{ table.seats }} chỗ
              </option>
            </select>
          </div>

        </div>

        <div class="form-group note-group">
          <label>Ghi chú</label>
          <textarea
            v-model="form.note"
            rows="3"
            placeholder="Nhập yêu cầu của khách hàng..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="save-button">
            <span>+ Tạo phiếu đặt bàn</span>
          </button>
        </div>

      </form>
    </div>

    <!-- Danh sách phiếu đặt bàn -->
    <div class="booking-list-card">

      <div class="section-heading">
        <h2>Danh sách phiếu đặt bàn</h2>

        <input
          v-model="keyword"
          type="text"
          placeholder="Tìm mã phiếu, tên hoặc số điện thoại..."
        />
      </div>

      <div class="table-responsive">
        <table>

          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Giờ</th>
              <th>Số khách</th>
              <th>Bàn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="booking in filteredBookings"
              :key="booking.id"
            >
              <td>{{ booking.id }}</td>

              <td>
                {{ booking.customer }}
                <span class="phone">{{ booking.phone }}</span>
              </td>

              <td>{{ booking.date }}</td>

              <td>{{ booking.time }}</td>

              <td>{{ booking.guests }} người</td>

              <td>{{ booking.table }}</td>

              <td>
                <span
                  class="status"
                  :class="{
                    waiting: booking.status === 'Chờ xác nhận',
                    confirmed: booking.status === 'Đã xác nhận',
                    serving: booking.status === 'Đang phục vụ',
                    completed: booking.status === 'Hoàn thành',
                    cancelled: booking.status === 'Đã hủy'
                  }"
                >
                  {{ booking.status }}
                </span>
              </td>

              <td>
                <div class="action-buttons">

                  <button
                    v-if="booking.status !== 'Đã hủy' && booking.status !== 'Hoàn thành'"
                    class="confirm-button"
                    @click="updateStatus(booking)"
                  >
                    {{
                      booking.status === 'Chờ xác nhận'
                        ? 'Xác nhận'
                        : booking.status === 'Đã xác nhận'
                          ? 'Xác nhận khách đến'
                          : 'Hoàn thành phiếu'
                    }}
                  </button>

                  <button
                    v-if="booking.status === 'Chờ xác nhận' || booking.status === 'Đã xác nhận'"
                    class="cancel-button"
                    @click="cancelBooking(booking.id)"
                  >
                    Hủy
                  </button>

                </div>
              </td>
            </tr>

            <tr v-if="filteredBookings.length === 0">
              <td colspan="8" class="no-data">
                Không tìm thấy phiếu đặt bàn
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style scoped>
.booking-page {
  color: #1F2937;
}

.page-header {
  margin-bottom: 25px;
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

.booking-form-card,
.booking-list-card {
  background: #FFFFFF;
  padding: 25px;
  margin-bottom: 25px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.04);
}

.booking-form-card h2,
.booking-list-card h2 {
  color: #111827;
  font-size: 19px;
  margin: 0 0 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #D1DED5;
  background: #F8FBF9;
  color: #1F2937;
  font: inherit;
  outline: none;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #52A879;
  box-shadow: 0 0 0 3px rgba(82, 168, 121, 0.12);
}

.form-group small {
  color: #64748B;
  font-size: 12px;
}

.note-group {
  margin-top: 20px;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.save-button {
  padding: 12px 20px;
  background: #237A50;
  color: white;
  border: none;
  cursor: pointer;
  transition: 0.25s;
}

.save-button:hover {
  background: #185C3B;
  transform: translateY(-2px);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.section-heading h2 {
  margin: 0;
}

.section-heading input {
  width: 300px;
  max-width: 100%;
  padding: 11px 13px;
  border: 1px solid #D1DED5;
  outline: none;
}

.table-responsive {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 950px;
}

th {
  background: #F0F7F2;
  color: #237A50;
  padding: 14px;
  font-size: 13px;
}

td {
  padding: 14px;
  border-bottom: 1px solid #E5EDE7;
  font-size: 13px;
}

tbody tr:hover td {
  background: #F8FBF9;
}

.phone {
  display: block;
  margin-top: 5px;
  color: #64748B;
  font-size: 12px;
}

.status {
  display: inline-block;
  padding: 7px 10px;
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
}

.waiting {
  background: #FEF3C7;
  color: #92400E;
}

.confirmed {
  background: #DCFCE7;
  color: #166534;
}

.serving {
  background: #E0F2FE;
  color: #1E40AF;
}

.completed {
  background: #F0FDF4;
  color: #166534;
}

.cancelled {
  background: #FEE2E2;
  color: #B91C1C;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.confirm-button,
.cancel-button {
  border: none;
  padding: 8px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s;
}

.confirm-button {
  background: #DCFCE7;
  color: #166534;
}

.confirm-button:hover {
  background: #237A50;
  color: #FFFFFF;
}

.cancel-button {
  background: #FEE2E2;
  color: #B91C1C;
}

.cancel-button:hover {
  background: #DC2626;
  color: #FFFFFF;
}

.no-data {
  text-align: center;
  color: #64748B;
  padding: 30px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading input {
    width: 100%;
    box-sizing: border-box;
  }

  .booking-form-card,
  .booking-list-card {
    padding: 18px;
  }
}
</style>
