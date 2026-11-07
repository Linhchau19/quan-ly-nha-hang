
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

function printInvoice() {
  window.print()
}

const keyword = ref('')
const selectedInvoice = ref(null)

const paymentInvoice = ref(null)
const paymentMethod = ref('cash')
const cashReceived = ref('')
const paymentError = ref('')

// CẤU HÌNH NGÂN HÀNG - BỔ SUNG SAU
const BANK_ID = 'TPB'
const BANK_ACCOUNT = '05597520801'
const BANK_ACCOUNT_NAME = 'BUI CHAU HOAI LINH'

const defaultInvoices = [
  {
    id: 'HD001',
    customer: 'Nguyễn Văn An',
    date: '2026-11-03',
    table: 'Bàn 01',
    amount: 450000,
    status: 'Đã thanh toán',
    paymentMethod: 'Tiền mặt',
    items: []
  },
  {
    id: 'HD002',
    customer: 'Trần Thị Bình',
    date: '2026-11-03',
    table: 'Bàn 02',
    amount: 680000,
    status: 'Chưa thanh toán',
    items: []
  },
  {
    id: 'HD003',
    customer: 'Lê Minh Tuấn',
    date: '2026-11-02',
    table: 'Bàn 04',
    amount: 320000,
    status: 'Đã thanh toán',
    paymentMethod: 'Chuyển khoản QR',
    items: []
  }
]

// Chuẩn hóa hóa đơn
function normalizeInvoice(invoice) {
  const items = Array.isArray(invoice.items) ? invoice.items : []

  const calculatedAmount = items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 0)
  }, 0)

  return {
    ...invoice,
    customer: invoice.customer || 'Khách tại bàn',
    table: invoice.table || 'Chưa xác định',
    date: invoice.date ||
      (invoice.createdAt
        ? String(invoice.createdAt).slice(0, 10)
        : new Date().toISOString().slice(0, 10)),
    items,
    amount: Number(invoice.amount ?? invoice.subtotal ?? calculatedAmount),
    status: invoice.status || 'Chưa thanh toán',
    paymentMethod: invoice.paymentMethod || ''
  }
}

// Đọc hóa đơn
function loadInvoices() {
  try {
    const saved = localStorage.getItem('restaurantInvoices')

    if (saved !== null) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeInvoice)
      }
    }
  } catch (error) {
    console.error('Lỗi đọc hóa đơn:', error)
  }

  return defaultInvoices.map(normalizeInvoice)
}

const invoices = ref(loadInvoices())

function refreshInvoices() {
  invoices.value = loadInvoices()
}

onMounted(() => {
  window.addEventListener('restaurantInvoicesUpdated', refreshInvoices)
  window.addEventListener('storage', refreshInvoices)
})

onUnmounted(() => {
  window.removeEventListener('restaurantInvoicesUpdated', refreshInvoices)
  window.removeEventListener('storage', refreshInvoices)
})

// Tìm kiếm
const filteredInvoices = computed(() => {
  const searchText = keyword.value.toLowerCase().trim()

  return invoices.value.filter(invoice =>
    String(invoice.id || '').toLowerCase().includes(searchText) ||
    String(invoice.customer || '').toLowerCase().includes(searchText) ||
    String(invoice.table || '').toLowerCase().includes(searchText)
  )
})

// Thống kê
const paidCount = computed(() =>
  invoices.value.filter(invoice => invoice.status === 'Đã thanh toán').length
)

const unpaidCount = computed(() =>
  invoices.value.filter(invoice => invoice.status === 'Chưa thanh toán').length
)

const revenue = computed(() =>
  invoices.value
    .filter(invoice => invoice.status === 'Đã thanh toán')
    .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)
)

const formatMoney = amount =>
  new Intl.NumberFormat('vi-VN').format(Number(amount || 0)) + ' đ'

// Mở thanh toán
function payInvoice(invoice) {
  if (invoice.status !== 'Chưa thanh toán') return

  paymentInvoice.value = invoice
  paymentMethod.value = 'cash'
  cashReceived.value = ''
  paymentError.value = ''
}

// Tính tiền thừa
const changeAmount = computed(() => {
  return Math.max(
    0,
    Number(cashReceived.value || 0) -
    Number(paymentInvoice.value?.amount || 0)
  )
})

// Tạo QR VietQR
const qrUrl = computed(() => {
  const invoice = paymentInvoice.value

  if (!invoice || !BANK_ID || !BANK_ACCOUNT || !BANK_ACCOUNT_NAME) {
    return ''
  }

  return `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact2.png?amount=${invoice.amount}&addInfo=${encodeURIComponent(invoice.id)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME)}`
})

// Xác nhận thanh toán
function confirmPayment() {
  const invoice = paymentInvoice.value

  if (!invoice || invoice.status !== 'Chưa thanh toán') return

  if (paymentMethod.value === 'cash') {
    const received = Number(cashReceived.value)

    if (!cashReceived.value || !Number.isFinite(received) || received < invoice.amount) {
      paymentError.value = 'Số tiền khách đưa chưa đủ!'
      return
    }
  } else if (!qrUrl.value) {
    paymentError.value = 'Bạn cần cấu hình tài khoản ngân hàng trước!'
    return
  }

  const message = paymentMethod.value === 'cash'
    ? 'Xác nhận đã nhận tiền mặt từ khách?'
    : 'Bạn đã kiểm tra tài khoản và nhận được tiền chuyển khoản?'

  if (!confirm(message)) return

  const now = new Date()

  const oldInvoice = { ...invoice }

  invoice.status = 'Đã thanh toán'
  invoice.paidAt = now.toISOString()
  invoice.paymentMethod = paymentMethod.value === 'cash'
    ? 'Tiền mặt'
    : 'Chuyển khoản QR'

  if (paymentMethod.value === 'cash') {
    invoice.cashReceived = Number(cashReceived.value)
    invoice.change = changeAmount.value
  } else {
    invoice.cashReceived = invoice.amount
    invoice.change = 0
  }

  try {
    localStorage.setItem('restaurantInvoices', JSON.stringify(invoices.value))

    window.dispatchEvent(new Event('restaurantInvoicesUpdated'))

    paymentInvoice.value = null
    alert('Thanh toán thành công!')
  } catch (error) {
    Object.assign(invoice, oldInvoice)
    console.error('Lỗi lưu thanh toán:', error)
    alert('Không thể lưu thanh toán. Vui lòng thử lại!')
  }
}

// Xem chi tiết
function viewInvoice(invoice) {
  selectedInvoice.value = invoice
}
</script>

<template>
  <div class="invoice-page">
    <div class="page-header">
      <div>
        <h1>Quản lý hóa đơn</h1>
        <p>Theo dõi hóa đơn và tình hình thanh toán của nhà hàng</p>
      </div>
    </div>

    <!-- THỐNG KÊ -->
    <div class="summary">
      <div class="summary-card">
        <span>Tổng hóa đơn</span>
        <h2>{{ invoices.length }}</h2>
      </div>

      <div class="summary-card">
        <span>Đã thanh toán</span>
        <h2>{{ paidCount }}</h2>
      </div>

      <div class="summary-card">
        <span>Chưa thanh toán</span>
        <h2>{{ unpaidCount }}</h2>
      </div>

      <div class="summary-card">
        <span>Doanh thu đã thu</span>
        <h2>{{ formatMoney(revenue) }}</h2>
      </div>
    </div>

    <!-- DANH SÁCH HÓA ĐƠN -->
    <div class="invoice-card">
      <div class="section-heading">
        <h2>Danh sách hóa đơn</h2>

        <input
          v-model="keyword"
          type="text"
          placeholder="Tìm mã hóa đơn hoặc khách hàng..."
        />
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Mã hóa đơn</th>
              <th>Khách hàng</th>
              <th>Ngày lập</th>
              <th>Bàn</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="invoice in filteredInvoices" :key="invoice.id">
              <td>{{ invoice.id }}</td>
              <td>{{ invoice.customer }}</td>
              <td>{{ invoice.date }}</td>
              <td>{{ invoice.table }}</td>
              <td class="money">{{ formatMoney(invoice.amount) }}</td>

              <td>
                <span
                  class="status"
                  :class="invoice.status === 'Đã thanh toán' ? 'paid' : 'unpaid'"
                >
                  {{ invoice.status }}
                </span>
              </td>

              <td>
                <div class="actions">
                  <button class="view-button" @click="viewInvoice(invoice)">
                    Chi tiết
                  </button>

                  <button
                    v-if="invoice.status === 'Chưa thanh toán'"
                    class="pay-button"
                    @click="payInvoice(invoice)"
                  >
                    Thanh toán
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredInvoices.length === 0">
              <td colspan="7" class="no-data">Không tìm thấy hóa đơn</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CỬA SỔ THANH TOÁN -->
    <div
      v-if="paymentInvoice"
      class="modal-overlay"
      @click.self="paymentInvoice = null"
    >
      <div class="payment-modal">
        <h2>Thanh toán hóa đơn</h2>

        <div class="payment-info">
          <p>Mã hóa đơn: <strong>{{ paymentInvoice.id }}</strong></p>
          <p>Khách hàng: <strong>{{ paymentInvoice.customer }}</strong></p>
          <div class="payment-total">
            {{ formatMoney(paymentInvoice.amount) }}
          </div>
        </div>

        <h3>Chọn phương thức thanh toán</h3>

        <div class="payment-methods">
          <button
            type="button"
            :class="{ active: paymentMethod === 'cash' }"
            @click="paymentMethod = 'cash'; paymentError = ''"
          >
            <span>💵</span>
            Tiền mặt
          </button>

          <button
            type="button"
            :class="{ active: paymentMethod === 'qr' }"
            @click="paymentMethod = 'qr'; paymentError = ''"
          >
            <span>▦</span>
            Chuyển khoản QR
          </button>
        </div>

        <!-- TIỀN MẶT -->
        <div v-if="paymentMethod === 'cash'" class="cash-section">
          <label>Số tiền khách đưa (VNĐ)</label>

          <input
            v-model="cashReceived"
            type="number"
            min="0"
            placeholder="Nhập số tiền khách đưa"
          />

          <div class="change-info">
            <span>Tiền khách đưa:</span>
            <strong>{{ formatMoney(Number(cashReceived || 0)) }}</strong>
          </div>

          <div class="change-info">
            <span>Tiền thừa:</span>
            <strong class="change-money">{{ formatMoney(changeAmount) }}</strong>
          </div>
        </div>

        <!-- QR -->
        <div v-if="paymentMethod === 'qr'" class="qr-section">
          <template v-if="qrUrl">
            <img :src="qrUrl" alt="Mã QR thanh toán" />
            <p>Quét mã QR để chuyển khoản</p>

            <div class="qr-information">
              <p>Ngân hàng: <strong>{{ BANK_ID }}</strong></p>
              <p>Số tài khoản: <strong>{{ BANK_ACCOUNT }}</strong></p>
              <p>Chủ tài khoản: <strong>{{ BANK_ACCOUNT_NAME }}</strong></p>
              <p>Nội dung: <strong>{{ paymentInvoice.id }}</strong></p>
            </div>
          </template>

          <div v-else class="qr-warning">
            Chưa cấu hình tài khoản ngân hàng. Hãy bổ sung BANK_ID,
            BANK_ACCOUNT và BANK_ACCOUNT_NAME ở đầu file.
          </div>

          <p class="qr-note">
            Chỉ xác nhận sau khi nhân viên kiểm tra đã nhận được tiền.
          </p>
        </div>

        <p v-if="paymentError" class="payment-error">
          {{ paymentError }}
        </p>

        <div class="payment-actions">
          <button class="confirm-payment" @click="confirmPayment">
            Xác nhận thanh toán
          </button>

          <button class="cancel-payment" @click="paymentInvoice = null">
            Hủy
          </button>
        </div>
      </div>
    </div>

    <!-- CHI TIẾT HÓA ĐƠN -->
    <div
      v-if="selectedInvoice"
      class="modal-overlay"
      @click.self="selectedInvoice = null"
    >
      <div class="invoice-detail">
        <div class="print-header">
          <h2>NHÀ HÀNG GREEN FOOD</h2>
          <p>Địa chỉ: 123 Nguyễn Văn Trỗi, TP. Hồ Chí Minh</p>
          <p>Điện thoại: 0365437460</p>
          <div class="print-divider"></div>
          <h3>HÓA ĐƠN THANH TOÁN</h3>
        </div>

        <h3>Chi tiết hóa đơn</h3>

        <p><strong>Mã hóa đơn:</strong> {{ selectedInvoice.id }}</p>
        <p><strong>Khách hàng:</strong> {{ selectedInvoice.customer }}</p>
        <p><strong>Ngày lập:</strong> {{ selectedInvoice.date }}</p>
        <p><strong>Bàn:</strong> {{ selectedInvoice.table }}</p>

        <h3 class="detail-title">Danh sách món ăn</h3>

        <div v-if="selectedInvoice.items?.length" class="detail-table-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                <th>Tên món</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(item, index) in selectedInvoice.items" :key="index">
                <td>{{ item.name }}</td>
                <td>{{ formatMoney(item.price) }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatMoney(item.price * item.quantity) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-else class="empty-detail">
          Hóa đơn này chưa có thông tin món ăn.
        </p>

        <div class="total">
          Tổng tiền: {{ formatMoney(selectedInvoice.amount) }}
        </div>

        <p>
          <strong>Trạng thái:</strong>
          {{ selectedInvoice.status }}
        </p>

        <p v-if="selectedInvoice.paymentMethod">
          <strong>Phương thức:</strong>
          {{ selectedInvoice.paymentMethod }}
        </p>

        <p v-if="selectedInvoice.paidAt">
          <strong>Thời gian thanh toán:</strong>
          {{ new Date(selectedInvoice.paidAt).toLocaleString('vi-VN') }}
        </p>

        <p v-if="selectedInvoice.status === 'Đã thanh toán' && selectedInvoice.paymentMethod === 'Tiền mặt'">
          <strong>Tiền khách đưa:</strong>
          {{ formatMoney(selectedInvoice.cashReceived) }}
        </p>

        <p v-if="selectedInvoice.status === 'Đã thanh toán' && selectedInvoice.paymentMethod === 'Tiền mặt'">
          <strong>Tiền thừa:</strong>
          {{ formatMoney(selectedInvoice.change) }}
        </p>

        <div class="invoice-actions">
          <button class="print-button" @click="printInvoice">
            🖨️ In hóa đơn
          </button>

          <button class="close-button" @click="selectedInvoice = null">
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoice-page {
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
  font-size: 13px;
}

.summary-card h2 {
  color: #237A50;
  font-size: 23px;
  margin-bottom: 0;
}

.invoice-card {
  background: white;
  padding: 25px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 12px rgba(17,24,39,0.04);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 22px;
}

.section-heading h2 {
  margin: 0;
  font-size: 19px;
}

.section-heading input {
  width: 300px;
  padding: 11px;
  border: 1px solid #D1DED5;
  outline: none;
}

.section-heading input:focus {
  border-color: #52A879;
}

.table-responsive {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
  text-align: left;
}

th {
  background: #F0F7F2;
  color: #237A50;
  padding: 15px;
  font-size: 13px;
}

td {
  padding: 15px;
  border-bottom: 1px solid #E5EDE7;
  font-size: 13px;
}

tbody tr:hover td {
  background: #F8FBF9;
}

.money {
  color: #237A50;
  font-weight: bold;
  white-space: nowrap;
}

.status {
  display: inline-block;
  padding: 7px 10px;
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
}

.paid {
  background: #DCFCE7;
  color: #166534;
}

.unpaid {
  background: #FEF3C7;
  color: #92400E;
}

.actions {
  display: flex;
  gap: 7px;
}

.view-button,
.pay-button,
.close-button {
  border: none;
  padding: 8px 11px;
  cursor: pointer;
}

.view-button {
  background: #DBEAFE;
  color: #1D4ED8;
}

.pay-button,
.close-button {
  background: #237A50;
  color: white;
}

.view-button:hover {
  background: #1D4ED8;
  color: white;
}

.pay-button:hover,
.close-button:hover {
  background: #185C3B;
}

.no-data {
  text-align: center;
  padding: 25px;
  color: #64748B;
}

/* CỬA SỔ CHUNG */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

/* CHI TIẾT HÓA ĐƠN */
.invoice-detail {
  background: white;
  width: 100%;
  max-width: 450px;
  padding: 28px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
  box-sizing: border-box;
}

.invoice-detail h2 {
  color: #237A50;
  margin-top: 0;
  margin-bottom: 22px;
}

.invoice-detail p {
  padding-bottom: 10px;
  border-bottom: 1px solid #E5EDE7;
  font-size: 14px;
}

.total {
  font-size: 18px;
  font-weight: bold;
  color: #237A50;
  margin: 20px 0;
}

.detail-title {
  margin: 22px 0 12px;
  color: #237A50;
  font-size: 17px;
}

.detail-table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.detail-table {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  table-layout: fixed !important;
  border-collapse: collapse;
  font-size: 11px;
  box-sizing: border-box;
}

.detail-table th,
.detail-table td {
  padding: 6px 3px;
  font-size: 11px;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  box-sizing: border-box;
}

.detail-table th:nth-child(1),
.detail-table td:nth-child(1) {
  width: 30%;
  text-align: left;
}

.detail-table th:nth-child(2),
.detail-table td:nth-child(2) {
  width: 23%;
}

.detail-table th:nth-child(3),
.detail-table td:nth-child(3) {
  width: 12%;
}

.detail-table th:nth-child(4),
.detail-table td:nth-child(4) {
  width: 35%;
}

.invoice-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 25px;
}

.print-button {
  background: #237A50;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
}

.print-button:hover {
  background: #185C3B;
}

/* THANH TOÁN */
.payment-modal {
  background: white;
  width: 100%;
  max-width: 430px;
  padding: 28px;
  box-sizing: border-box;
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
}

.payment-modal h2 {
  color: #237A50;
  margin-top: 0;
}

.payment-modal h3 {
  font-size: 15px;
  margin-top: 22px;
}

.payment-info {
  background: #F0F7F2;
  padding: 12px 16px;
}

.payment-info p {
  margin: 7px 0;
  font-size: 13px;
}

.payment-total {
  font-size: 25px;
  font-weight: bold;
  color: #237A50;
  margin-top: 15px;
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.payment-methods button {
  padding: 14px 8px;
  background: white;
  border: 1px solid #D1DED5;
  color: #374151;
  cursor: pointer;
  font-weight: 600;
}

.payment-methods button span {
  display: block;
  font-size: 24px;
  margin-bottom: 7px;
}

.payment-methods button.active {
  border: 2px solid #237A50;
  background: #F0F7F2;
  color: #237A50;
}

.cash-section {
  margin-top: 20px;
}

.cash-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.cash-section input {
  width: 100%;
  padding: 12px;
  border: 1px solid #D1DED5;
  box-sizing: border-box;
  outline: none;
}

.cash-section input:focus {
  border-color: #237A50;
}

.change-info {
  display: flex;
  justify-content: space-between;
  margin-top: 13px;
  font-size: 13px;
}

.change-money {
  color: #237A50;
}

.qr-section {
  text-align: center;
  margin-top: 20px;
}

.qr-section img {
  width: 220px;
  max-width: 100%;
  display: block;
  margin: 0 auto;
}

.qr-section > p {
  font-size: 13px;
}

.qr-information {
  text-align: left;
  background: #F0F7F2;
  padding: 10px 15px;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.qr-information p {
  margin: 7px 0;
}

.qr-warning {
  padding: 15px;
  background: #FEF3C7;
  color: #92400E;
  font-size: 13px;
  line-height: 1.6;
}

.qr-note {
  color: #92400E;
  font-size: 12px;
  line-height: 1.5;
}

.payment-error {
  color: #DC2626;
  font-size: 13px;
}

.payment-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.payment-actions button {
  flex: 1;
  padding: 11px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.confirm-payment {
  background: #237A50;
  color: white;
}

.confirm-payment:hover {
  background: #185C3B;
}

.cancel-payment {
  background: #E5E7EB;
  color: #374151;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .summary {
    grid-template-columns: 1fr;
  }

  .section-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .section-heading input {
    width: 100%;
    box-sizing: border-box;
  }
}

/* CHẾ ĐỘ IN */
@media print {
  body * {
    visibility: hidden !important;
  }

  .invoice-detail,
  .invoice-detail * {
    visibility: visible !important;
  }

  .modal-overlay {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    background: white !important;
    padding: 0 !important;
    display: block !important;
  }

  .invoice-detail {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 15px !important;
    box-shadow: none !important;
    border: none !important;
    color: black !important;
    background: white !important;
  }

  .invoice-actions {
    display: none !important;
  }

  .detail-table-wrapper {
    width: 100% !important;
    overflow: visible !important;
  }

  .detail-table {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    font-size: 10px !important;
  }

  .detail-table th,
  .detail-table td {
    padding: 4px 2px !important;
    font-size: 10px !important;
    overflow-wrap: anywhere !important;
    color: black !important;
  }

  .detail-table th:nth-child(1),
  .detail-table td:nth-child(1) {
    width: 30% !important;
  }

  .detail-table th:nth-child(2),
  .detail-table td:nth-child(2) {
    width: 23% !important;
  }

  .detail-table th:nth-child(3),
  .detail-table td:nth-child(3) {
    width: 12% !important;
  }

  .detail-table th:nth-child(4),
  .detail-table td:nth-child(4) {
    width: 35% !important;
  }

  @page {
    size: A4;
    margin: 15mm;
  }
}
</style>
