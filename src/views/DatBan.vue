
<script setup>
import { ref, computed } from 'vue'

const keyword = ref('')

const form = ref({
  customer: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
  table: '',
  note: ''
})

const availableTables = ref([
  'Bàn 01',
  'Bàn 04',
  'Bàn 06'
])

const bookings = ref([
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
])

const filteredBookings = computed(() => {
  return bookings.value.filter(item =>
    item.customer.toLowerCase().includes(keyword.value.toLowerCase()) ||
    item.id.toLowerCase().includes(keyword.value.toLowerCase()) ||
    item.phone.includes(keyword.value)
  )
})

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

  const newId = 'DB' + String(bookings.value.length + 1).padStart(3, '0')

  bookings.value.push({
    id: newId,
    customer: form.value.customer,
    phone: form.value.phone,
    date: form.value.date,
    time: form.value.time,
    guests: form.value.guests,
    table: form.value.table,
    status: 'Chờ xác nhận'
  })

  alert('Thêm phiếu đặt bàn thành công!')

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

const updateStatus = (booking) => {
  booking.status = booking.status === 'Chờ xác nhận'
    ? 'Đã xác nhận'
    : 'Chờ xác nhận'
}

const cancelBooking = (id) => {
  if (confirm('Bạn có chắc chắn muốn hủy phiếu đặt bàn này?')) {
    bookings.value = bookings.value.map(item =>
      item.id === id
        ? { ...item, status: 'Đã hủy' }
        : item
    )
  }
}
</script>

<template>
  <div class="booking-page">

    <div class="page-header">
      <div>
        <h1>Quản lý đặt bàn</h1>
        <p>Tiếp nhận và quản lý thông tin đặt bàn của khách hàng</p>
      </div>
    </div>

    <!-- FORM ĐẶT BÀN -->
    <div class="booking-form-card">
      <h2>Thông tin đặt bàn</h2>

      <form @submit.prevent="addBooking">

        <div class="form-grid">
          <div class="form-group">
            <label>Họ tên khách hàng *</label>
            <input
              v-model="form.customer"
              type="text"
              placeholder="Nhập tên khách hàng"
              required
            />
          </div>

          <div class="form-group">
            <label>Số điện thoại *</label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>

          <div class="form-group">
            <label>Ngày đặt *</label>
            <input
              v-model="form.date"
              type="date"
              required
            />
          </div>

          <div class="form-group">
            <label>Giờ đặt *</label>
            <input
              v-model="form.time"
              type="time"
              required
            />
          </div>

          <div class="form-group">
            <label>Số lượng khách *</label>
            <input
              v-model.number="form.guests"
              type="number"
              min="1"
              max="30"
              required
            />
          </div>

          <div class="form-group">
            <label>Chọn bàn *</label>
            <select v-model="form.table" required>
              <option value="">-- Chọn bàn --</option>
              <option
                v-for="table in availableTables"
                :key="table"
                :value="table"
              >
                {{ table }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group note-group">
          <label>Ghi chú</label>
          <textarea
            v-model="form.note"
            rows="3"
            placeholder="Nhập yêu cầu thêm của khách hàng..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="save-button">
            + Xác nhận đặt bàn
          </button>
        </div>

      </form>
    </div>

    <!-- DANH SÁCH ĐẶT BÀN -->
    <div class="booking-list-card">
      <div class="section-heading">
        <h2>Danh sách phiếu đặt bàn</h2>

        <input
          v-model="keyword"
          type="text"
          placeholder="Tìm tên, mã hoặc số điện thoại..."
        />
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Mã đặt bàn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Giờ đặt</th>
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
                <strong>{{ booking.customer }}</strong>
                <small class="phone">{{ booking.phone }}</small>
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
                    cancelled: booking.status === 'Đã hủy'
                  }"
                >
                  {{ booking.status }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                    v-if="booking.status !== 'Đã hủy'"
                    class="confirm-button"
                    @click="updateStatus(booking)"
                  >
                    {{ booking.status === 'Đã xác nhận' ? 'Chờ lại' : 'Xác nhận' }}
                  </button>

                  <button
                    v-if="booking.status !== 'Đã hủy'"
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
  min-width: 850px;
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

.cancelled {
  background: #FEE2E2;
  color: #B91C1C;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.confirm-button,
.cancel-button {
  border: none;
  padding: 8px 10px;
  cursor: pointer;
  white-space: nowrap;
}

.confirm-button {
  background: #DCFCE7;
  color: #166534;
}

.confirm-button:hover {
  background: #237A50;
  color: white;
}

.cancel-button {
  background: #FEE2E2;
  color: #B91C1C;
}

.cancel-button:hover {
  background: #DC2626;
  color: white;
}

.no-data {
  text-align: center;
  padding: 25px;
  color: #64748B;
}

@media (max-width: 750px) {
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
}
</style>
