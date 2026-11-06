
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTableStore } from '../stores/tableStore.js'

const tableStore = useTableStore()
const keyword = ref('')

const BOOKING_DURATION = 120
const ARRIVAL_GRACE_PERIOD = 15

// Lấy ngày theo giờ máy tính, tránh sai lệch múi giờ
const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Ngày đặt bàn sớm nhất: ngày mai
const minBookingDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getLocalDate(tomorrow)
})

// Chuyển giờ HH:mm thành số phút
const timeToMinutes = (time) => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null

  const [hours, minutes] = time.split(':').map(Number)

  if (hours > 23 || minutes > 59) return null

  return hours * 60 + minutes
}

// Chuyển ngày và giờ thành timestamp
const getBookingTimestamp = (date, time) => {
  if (!date || timeToMinutes(time) === null) return null

  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)

  const result = new Date(year, month - 1, day, hours, minutes, 0, 0)

  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day
  ) {
    return null
  }

  return result.getTime()
}

// Tính giờ kết thúc
const getEndTime = (time) => {
  const start = timeToMinutes(time)

  if (start === null) return ''

  const end = start + BOOKING_DURATION
  const hours = String(Math.floor(end / 60) % 24).padStart(2, '0')
  const minutes = String(end % 60).padStart(2, '0')

  return `${hours}:${minutes}`
}

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

// Lưu dữ liệu
watch(
  bookings,
  (newBookings) => {
    try {
      localStorage.setItem(
        'restaurant_bookings',
        JSON.stringify(newBookings)
      )

      window.dispatchEvent(
        new Event('restaurantBookingsUpdated')
      )
    } catch (error) {
      console.error('Không thể lưu phiếu đặt bàn:', error)
    }
  },
  { deep: true }
)

// Kiểm tra hai khung giờ có bị trùng không
// Hỗ trợ cả trường hợp qua ngày mới
const isTimeOverlapping = (dateA, timeA, dateB, timeB) => {
  const startA = getBookingTimestamp(dateA, timeA)
  const startB = getBookingTimestamp(dateB, timeB)

  if (startA === null || startB === null) return false

  const endA = startA + BOOKING_DURATION * 60 * 1000
  const endB = startB + BOOKING_DURATION * 60 * 1000

  return startA < endB && startB < endA
}

// Kiểm tra bàn đã có lịch đặt hay chưa
const hasBookingConflict = (tableName, date, time) => {
  return bookings.value.some((booking) => {
    if (
      booking.table !== tableName ||
      ['Đã hủy', 'Hoàn thành'].includes(booking.status)
    ) {
      return false
    }

    return isTimeOverlapping(
      booking.date,
      booking.time,
      date,
      time
    )
  })
}

// Tự động hủy phiếu quá 15 phút
const expireOverdueBookings = () => {
  const now = Date.now()
  let hasExpired = false

  bookings.value.forEach((booking) => {
    if (
      !['Chờ xác nhận', 'Đã xác nhận'].includes(booking.status)
    ) {
      return
    }

    const bookingTime = getBookingTimestamp(
      booking.date,
      booking.time
    )

    if (bookingTime === null) return

    const expirationTime =
      bookingTime + ARRIVAL_GRACE_PERIOD * 60 * 1000

    if (now >= expirationTime) {
      booking.status = 'Đã hủy'
      booking.cancelReason = 'Khách không đến trong 15 phút'
      booking.expiredAt = new Date().toISOString()

      hasExpired = true
    }
  })

  if (hasExpired) {
    console.log('Đã tự động hủy phiếu đặt bàn quá 15 phút.')
  }
}

// Kiểm tra định kỳ
let expirationTimer = null

const handleVisibilityChange = () => {
  if (!document.hidden) {
    expireOverdueBookings()
  }
}

const handleStorageChange = (event) => {
  if (
    event.key === 'restaurant_bookings' &&
    event.newValue
  ) {
    try {
      const data = JSON.parse(event.newValue)

      if (Array.isArray(data)) {
        bookings.value = data
      }
    } catch (error) {
      console.error('Lỗi đồng bộ phiếu đặt bàn:', error)
    }
  }
}

onMounted(() => {
  expireOverdueBookings()

  expirationTimer = window.setInterval(() => {
    expireOverdueBookings()
  }, 15000)

  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange
  )

  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  if (expirationTimer) {
    clearInterval(expirationTimer)
  }

  document.removeEventListener(
    'visibilitychange',
    handleVisibilityChange
  )

  window.removeEventListener('storage', handleStorageChange)
})

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

// Danh sách bàn còn trống và đủ chỗ
const availableTables = computed(() => {
  return tableStore.tables.filter((table) => {
    if (table.status !== 'Trống') return false

    if (table.seats < Number(form.value.guests || 1)) {
      return false
    }

    if (form.value.date && form.value.time) {
      return !hasBookingConflict(
        table.name,
        form.value.date,
        form.value.time
      )
    }

    return true
  })
})

// Tìm kiếm phiếu đặt bàn
const filteredBookings = computed(() => {
  const search = keyword.value.toLowerCase().trim()

  return bookings.value.filter((item) => {
    return (
      String(item.customer || '').toLowerCase().includes(search) ||
      String(item.id || '').toLowerCase().includes(search) ||
      String(item.phone || '').includes(search)
    )
  })
})

// Thêm phiếu đặt bàn
const addBooking = () => {
  expireOverdueBookings()

  const customer = form.value.customer.trim()
  const phone = form.value.phone.trim()
  const date = form.value.date
  const time = form.value.time
  const guests = Number(form.value.guests)
  const tableName = form.value.table

  if (!customer || !phone || !date || !time || !tableName) {
    alert('Vui lòng nhập đầy đủ thông tin đặt bàn!')
    return
  }

  if (!/^0\d{9}$/.test(phone)) {
    alert('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0!')
    return
  }

  if (date < minBookingDate.value) {
    alert('Bạn phải đặt bàn trước ít nhất 1 ngày!')
    return
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 30) {
    alert('Số lượng khách phải từ 1 đến 30 người!')
    return
  }

  if (timeToMinutes(time) === null) {
    alert('Vui lòng chọn giờ đặt bàn hợp lệ!')
    return
  }

  const selectedTable = tableStore.tables.find(
    (table) => table.name === tableName
  )

  if (!selectedTable || selectedTable.status !== 'Trống') {
    alert('Bàn đã được sử dụng hoặc không còn khả dụng!')
    return
  }

  if (selectedTable.seats < guests) {
    alert('Số lượng chỗ ngồi của bàn không đủ!')
    return
  }

  if (hasBookingConflict(tableName, date, time)) {
    alert(
      'Bàn đã có lịch đặt trong khung giờ này. ' +
      'Mỗi lượt đặt bàn kéo dài 2 tiếng. Vui lòng chọn giờ khác!'
    )
    return
  }

  // Tạo mã phiếu tiếp theo
  const maxId = bookings.value.reduce((max, item) => {
    const number = Number(
      String(item.id || '').replace('DB', '')
    )

    return Math.max(max, Number.isFinite(number) ? number : 0)
  }, 0)

  const newId = 'DB' + String(maxId + 1).padStart(3, '0')
  const endTime = getEndTime(time)

  bookings.value.push({
    id: newId,
    customer,
    phone,
    date,
    time,
    endTime,
    duration: BOOKING_DURATION,
    arrivalGracePeriod: ARRIVAL_GRACE_PERIOD,
    guests,
    table: tableName,
    note: form.value.note.trim(),
    status: 'Chờ xác nhận',
    createdAt: new Date().toISOString()
  })

  alert(
    `Đặt bàn thành công!\n` +
    `Mã phiếu: ${newId}\n` +
    `Bàn: ${tableName}\n` +
    `Khung giờ: ${time} - ${endTime}\n` +
    `Khách cần đến trong vòng 15 phút kể từ giờ đặt.`
  )

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

// Cập nhật trạng thái phiếu
const updateStatus = (booking) => {
  expireOverdueBookings()

  if (booking.status === 'Đã hủy') {
    alert('Phiếu đặt bàn đã bị hủy do khách không đến trong 15 phút!')
    return
  }

  if (booking.status === 'Chờ xác nhận') {
    booking.status = 'Đã xác nhận'
    alert('Đã xác nhận đặt bàn!')
    return
  }

  if (booking.status === 'Đã xác nhận') {
    const table = tableStore.tables.find(
      (item) => item.name === booking.table
    )

    if (!table) {
      alert('Không tìm thấy bàn trong hệ thống!')
      return
    }

    if (table.status !== 'Trống') {
      alert('Bàn hiện không còn trống!')
      return
    }

    booking.status = 'Đang phục vụ'
    booking.arrivedAt = new Date().toISOString()
    table.status = 'Đang phục vụ'

    alert('Đã xác nhận khách đến nhận bàn!')
    return
  }

  if (booking.status === 'Đang phục vụ') {
    const table = tableStore.tables.find(
      (item) => item.name === booking.table
    )

    booking.status = 'Hoàn thành'
    booking.completedAt = new Date().toISOString()

    if (table && table.status === 'Đang phục vụ') {
      table.status = 'Trống'
    }

    alert('Đã hoàn thành phiếu đặt bàn!')
  }
}

// Hủy phiếu thủ công
const cancelBooking = (id) => {
  const booking = bookings.value.find(
    (item) => item.id === id
  )

  if (!booking) return

  if (
    !['Chờ xác nhận', 'Đã xác nhận'].includes(booking.status)
  ) {
    alert('Chỉ có thể hủy phiếu đang chờ hoặc đã xác nhận!')
    return
  }

  if (confirm('Bạn có chắc chắn muốn hủy phiếu đặt bàn này?')) {
    booking.status = 'Đã hủy'
    booking.cancelReason = 'Nhân viên hủy phiếu'
    booking.cancelledAt = new Date().toISOString()

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
          <small>
            Mỗi lượt đặt cách nhau 2 tiếng. Khách cần đến trong
            vòng 15 phút kể từ giờ đặt, nếu không phiếu sẽ tự động hủy.
          </small>
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
