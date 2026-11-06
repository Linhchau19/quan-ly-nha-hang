
<script setup>
function printInvoice() {
  window.print()
}
import { ref, computed } from 'vue'

const keyword = ref('')

const defaultInvoices = [
  {
    id: 'HD001',
    customer: 'Nguyễn Văn An',
    date: '2026-11-03',
    table: 'Bàn 01',
    amount: 450000,
    status: 'Đã thanh toán',
  },
  {
    id: 'HD002',
    customer: 'Trần Thị Bình',
    date: '2026-11-03',
    table: 'Bàn 02',
    amount: 680000,
    status: 'Chưa thanh toán',
  
  },
  {
    id: 'HD003',
    customer: 'Lê Minh Tuấn',
    date: '2026-11-02',
    table: 'Bàn 04',
    amount: 320000,
    status: 'Đã thanh toán',
     
  }
]

const savedInvoices = JSON.parse(
  localStorage.getItem('restaurantInvoices') || '[]'
)

const invoices = ref([
  ...defaultInvoices,
  ...savedInvoices.map(invoice => ({
    ...invoice,
    amount: Number(
      invoice.amount ??
      invoice.subtotal ??
      invoice.items?.reduce((sum, item) =>
        sum + item.price * item.quantity, 0
      ) ?? 0
    )
  }))
])

const filteredInvoices = computed(() => {
  return invoices.value.filter(item =>
    item.id.toLowerCase().includes(keyword.value.toLowerCase()) ||
    item.customer.toLowerCase().includes(keyword.value.toLowerCase())
  )
})

const paidCount = computed(() =>
  invoices.value.filter(i => i.status === 'Đã thanh toán').length
)

const unpaidCount = computed(() =>
  invoices.value.filter(i => i.status === 'Chưa thanh toán').length
)

const revenue = computed(() =>
  invoices.value
    .filter(i => i.status === 'Đã thanh toán')
    .reduce((sum, i) => sum + i.amount, 0)
)

const formatMoney = amount =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' đ'

const selectedInvoice = ref(null)

const payInvoice = (invoice) => {
  if (confirm('Xác nhận thanh toán hóa đơn này?')) {
    invoice.status = 'Đã thanh toán'

    // Lấy ngày thanh toán theo giờ địa phương
    const now = new Date()
    const paidAt = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-')

    invoice.paidAt = paidAt

    // Đọc danh sách hóa đơn đã lưu
    const savedInvoices = JSON.parse(
      localStorage.getItem('restaurantInvoices') || '[]'
    )

    const index = savedInvoices.findIndex(
      item => item.id === invoice.id
    )

    if (index !== -1) {
      savedInvoices[index] = {
        ...savedInvoices[index],
        status: 'Đã thanh toán',
        paidAt
      }
    } else {
      savedInvoices.push({ ...invoice })
    }

    // Lưu lại dữ liệu
    localStorage.setItem(
      'restaurantInvoices',
      JSON.stringify(savedInvoices)
    )

    // Thông báo cho trang Tổng quan cập nhật doanh thu
    window.dispatchEvent(new Event('restaurantInvoicesUpdated'))

    alert('Thanh toán thành công!')
  }
}

const viewInvoice = invoice => {
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
            <tr
              v-for="invoice in filteredInvoices"
              :key="invoice.id"
            >
              <td>{{ invoice.id }}</td>
              <td>{{ invoice.customer }}</td>
              <td>{{ invoice.date }}</td>
              <td>{{ invoice.table }}</td>
              <td class="money">{{ formatMoney(invoice.amount) }}</td>

              <td>
                <span
                  class="status"
                  :class="invoice.status === 'Đã thanh toán'
                    ? 'paid'
                    : 'unpaid'"
                >
                  {{ invoice.status }}
                </span>
              </td>

              <td>
                <div class="actions">
                  <button
                    class="view-button"
                    @click="viewInvoice(invoice)"
                  >
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
              <td colspan="7" class="no-data">
                Không tìm thấy hóa đơn
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CHI TIẾT HÓA ĐƠN -->
   <div v-if="selectedInvoice" class="modal-overlay"
  @click.self="selectedInvoice = null">
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
    <p><strong>Khách hàng:</strong> {{ selectedInvoice.customer || 'Khách tại bàn' }}</p>
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
          <tr
            v-for="(item, index) in selectedInvoice.items"
            :key="index"
          >
            <td>{{ item.name }}</td>
            <td>{{ formatMoney(item.price) }}</td>
            <td>{{ item.quantity }}</td>
            <td>
              {{ formatMoney(item.price * item.quantity) }}
            </td>
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

/* CỬA SỔ CHI TIẾT */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

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

/* BẢNG MÓN ĂN TRONG HÓA ĐƠN */
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

/* Tên món */
.detail-table th:nth-child(1),
.detail-table td:nth-child(1) {
  width: 30%;
  text-align: left;
}

/* Đơn giá */
.detail-table th:nth-child(2),
.detail-table td:nth-child(2) {
  width: 23%;
}

/* Số lượng */
.detail-table th:nth-child(3),
.detail-table td:nth-child(3) {
  width: 12%;
}

/* Thành tiền */
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

  .modal-overlay,
  .modal-overlay * {
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
