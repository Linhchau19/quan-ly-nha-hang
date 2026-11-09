
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Dữ liệu khách hàng mặc định
const defaultCustomers = [
  {
    id: 'KH001',
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'an@gmail.com',
    visits: 8,
    totalSpent: 2450000
  },
  {
    id: 'KH002',
    name: 'Trần Thị Bình',
    phone: '0912345678',
    email: 'binh@gmail.com',
    visits: 5,
    totalSpent: 1680000
  },
  {
    id: 'KH003',
    name: 'Lê Minh Tuấn',
    phone: '0987654321',
    email: 'tuan@gmail.com',
    visits: 3,
    totalSpent: 950000
  },
  {
    id: 'KH004',
    name: 'Phạm Thu Hà',
    phone: '0934567890',
    email: 'ha@gmail.com',
    visits: 12,
    totalSpent: 3850000
  }
]

// Đọc dữ liệu khách hàng đã lưu
function loadCustomers() {
  try {
    const saved = localStorage.getItem('restaurantCustomers')

    if (saved !== null) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (error) {
    console.error('Lỗi đọc dữ liệu khách hàng:', error)
  }

  return defaultCustomers.map(customer => ({ ...customer }))
}

const customers = ref(loadCustomers())
const keyword = ref('')

// Lưu khách hàng
watch(
  customers,
  (newCustomers) => {
    try {
      localStorage.setItem(
        'restaurantCustomers',
        JSON.stringify(newCustomers)
      )
    } catch (error) {
      console.error('Lỗi lưu dữ liệu khách hàng:', error)
      alert('Không thể lưu dữ liệu khách hàng!')
    }
  },
  { deep: true }
)

// Đọc hóa đơn
const invoices = ref([])

function loadCustomerInvoices() {
  try {
    const saved = JSON.parse(
      localStorage.getItem('restaurantInvoices') || '[]'
    )

    invoices.value = Array.isArray(saved) ? saved : []
  } catch (error) {
    console.error('Lỗi đọc hóa đơn:', error)
    invoices.value = []
  }
}

// Cập nhật hóa đơn khi có thanh toán mới
function refreshInvoices() {
  loadCustomerInvoices()
}

onMounted(() => {
  loadCustomerInvoices()

  window.addEventListener(
    'restaurantInvoicesUpdated',
    refreshInvoices
  )

  window.addEventListener('storage', refreshInvoices)
})

onUnmounted(() => {
  window.removeEventListener(
    'restaurantInvoicesUpdated',
    refreshInvoices
  )

  window.removeEventListener('storage', refreshInvoices)
})

// Chuẩn hóa số điện thoại
function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

// Lấy hóa đơn đã thanh toán của khách hàng
function getCustomerInvoices(customer) {
  return invoices.value.filter(invoice => {
    // Chỉ tính hóa đơn đã thanh toán
    if (invoice.status !== 'Đã thanh toán') {
      return false
    }

    // Ưu tiên đối chiếu bằng mã khách hàng
    if (invoice.customerId) {
      return String(invoice.customerId) === String(customer.id)
    }

    // Nếu không có mã khách hàng thì đối chiếu số điện thoại
    if (invoice.customerPhone) {
      return (
        normalizePhone(invoice.customerPhone) ===
        normalizePhone(customer.phone)
      )
    }

    return false
  })
}

// Tính số lượt ghé
function getCustomerVisits(customer) {
  const paidInvoices = getCustomerInvoices(customer)

  // Mỗi mã hóa đơn chỉ được tính một lượt
  return new Set(
    paidInvoices
      .map(invoice => invoice.id)
      .filter(Boolean)
  ).size
}

// Tính tổng chi tiêu
function getCustomerSpent(customer) {
  return getCustomerInvoices(customer).reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0
  )
}

// Tìm kiếm khách hàng
const filteredCustomers = computed(() => {
  const value = keyword.value.toLowerCase().trim()

  return customers.value.filter(customer =>
    String(customer.id || '').toLowerCase().includes(value) ||
    String(customer.name || '').toLowerCase().includes(value) ||
    String(customer.phone || '').includes(value)
  )
})

// Tổng lượt ghé của tất cả khách hàng
const totalVisits = computed(() =>
  customers.value.reduce(
    (sum, customer) => sum + getCustomerVisits(customer),
    0
  )
)

// Tổng chi tiêu của tất cả khách hàng
const totalSpent = computed(() =>
  customers.value.reduce(
    (sum, customer) => sum + getCustomerSpent(customer),
    0
  )
)

// Định dạng tiền
const formatMoney = value =>
  new Intl.NumberFormat('vi-VN').format(value) + 'đ'

// Form thêm và sửa
const showForm = ref(false)
const editingCustomer = ref(null)

const form = ref({
  name: '',
  phone: '',
  email: ''
})

function openAddForm() {
  editingCustomer.value = null

  form.value = {
    name: '',
    phone: '',
    email: ''
  }

  showForm.value = true
}

function openEditForm(customer) {
  editingCustomer.value = customer.id

  form.value = {
    name: customer.name,
    phone: customer.phone,
    email: customer.email || ''
  }

  showForm.value = true
}

// Lưu khách hàng
function saveCustomer() {
  if (!form.value.name.trim() || !form.value.phone.trim()) {
    alert('Vui lòng nhập họ tên và số điện thoại!')
    return
  }

  const phone = normalizePhone(form.value.phone)

  if (!phone) {
    alert('Số điện thoại không hợp lệ!')
    return
  }

  // Kiểm tra số điện thoại trùng
  const duplicatedPhone = customers.value.some(customer =>
    normalizePhone(customer.phone) === phone &&
    customer.id !== editingCustomer.value
  )

  if (duplicatedPhone) {
    alert('Số điện thoại này đã tồn tại!')
    return
  }

  if (editingCustomer.value) {
    const customer = customers.value.find(
      item => item.id === editingCustomer.value
    )

    if (customer) {
      Object.assign(customer, {
        name: form.value.name.trim(),
        phone: form.value.phone.trim(),
        email: form.value.email.trim()
      })
    }
  } else {
    customers.value.push({
      id: 'KH' + Date.now(),
      name: form.value.name.trim(),
      phone: form.value.phone.trim(),
      email: form.value.email.trim(),
      visits: 0,
      totalSpent: 0
    })
  }

  showForm.value = false
}

// Xóa khách hàng
function deleteCustomer(id) {
  if (confirm('Bạn có chắc muốn xóa khách hàng này?')) {
    customers.value = customers.value.filter(
      customer => customer.id !== id
    )
  }
}
</script>

<template>
  <div class="customer-page">
    <div class="page-header">
      <div>
        <h1>Quản lý khách hàng</h1>
        <p>Quản lý thông tin và lịch sử khách hàng</p>
      </div>

      <button class="add-btn" @click="openAddForm">
        + Thêm khách hàng
      </button>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span>Tổng khách hàng</span>
        <h2>{{ customers.length }}</h2>
      </div>

      <div class="stat-card">
        <span>Tổng lượt ghé</span>
        <h2>{{ totalVisits }}</h2>
      </div>

      <div class="stat-card">
        <span>Tổng chi tiêu</span>
        <h2>{{ formatMoney(totalSpent) }}</h2>
      </div>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <h3>Danh sách khách hàng</h3>

        <input
          v-model="keyword"
          type="text"
          placeholder="Tìm theo tên, mã hoặc số điện thoại..."
        />
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Mã khách hàng</th>
              <th>Họ và tên</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Lượt ghé</th>
              <th>Tổng chi tiêu</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
            >
              <td>{{ customer.id }}</td>
              <td>{{ customer.name }}</td>
              <td>{{ customer.phone }}</td>
              <td>{{ customer.email || 'Chưa có' }}</td>

              <td>{{ getCustomerVisits(customer) }}</td>

              <td>
                {{ formatMoney(getCustomerSpent(customer)) }}
              </td>

              <td>
                <button
                  class="edit-btn"
                  @click="openEditForm(customer)"
                >
                  Sửa
                </button>

                <button
                  class="delete-btn"
                  @click="deleteCustomer(customer.id)"
                >
                  Xóa
                </button>
              </td>
            </tr>

            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="empty">
                Không tìm thấy khách hàng
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- FORM THÊM / SỬA KHÁCH HÀNG -->
    <div v-if="showForm" class="modal-overlay">
      <div class="modal">
        <h2>
          {{ editingCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng' }}
        </h2>

        <label>Họ và tên</label>
        <input
          v-model="form.name"
          placeholder="Nhập họ tên"
        />

        <label>Số điện thoại</label>
        <input
          v-model="form.phone"
          type="tel"
          placeholder="Nhập số điện thoại"
        />

        <label>Email</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="Nhập email"
        />

        <div class="modal-actions">
          <button
            class="cancel-btn"
            @click="showForm = false"
          >
            Hủy
          </button>

          <button
            class="add-btn"
            @click="saveCustomer"
          >
            Lưu thông tin
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customer-page {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  color: #26352d;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 28px;
}

/* THỐNG KÊ KHÁCH HÀNG */
/* 3 THANH THỐNG KÊ */
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  gap: 12px;
  margin: 0 0 32px 0;
  padding: 0;
  box-sizing: border-box;
}

.stat-card {
  width: 100%;
  min-width: 0;
  min-height: 125px;
  box-sizing: border-box;
  background: white;
  padding: 25px 30px;
  border: 1px solid #e0ebe3;
  border-radius: 0;
  box-shadow: 0 4px 12px rgba(35, 122, 80, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: 0.25s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 18px rgba(35, 122, 80, 0.12);
}

.stat-card span {
  color: #84918a;
  font-size: 15px;
}

.stat-card h2 {
  margin: 12px 0 0;
  color: #237a50;
  font-size: 30px;
  font-weight: 700;
}
@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

/* DANH SÁCH KHÁCH HÀNG */
.content-card {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: white;
  padding: 26px;
  border: 1px solid #e5eee8;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(17, 24, 39, 0.04);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 22px;
}

.toolbar input {
  width: 380px;
  max-width: 45%;
  box-sizing: border-box;
}

.table-wrapper {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

th,
td {
  padding: 15px 12px;
  text-align: left;
  border-bottom: 1px solid #edf1ee;
  font-size: 13px;
}

th {
  color: #64746a;
  background: #f5faf6;
}

/* CÁC NÚT */
.add-btn,
.edit-btn,
.delete-btn,
.cancel-btn {
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 4px;
}

.add-btn {
  color: white;
  background: #237a50;
}

.edit-btn {
  color: #237a50;
  background: #e8f4ec;
  margin-right: 6px;
}

.delete-btn {
  color: #c0392b;
  background: #fff0ee;
}

.cancel-btn {
  background: #edf0ee;
  color: #526158;
}

.empty {
  text-align: center;
  color: #84918a;
  padding: 25px;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  width: 420px;
  max-width: calc(100% - 40px);
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-sizing: border-box;
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 22px;
}

.modal label {
  display: block;
  margin: 13px 0 7px;
  font-size: 14px;
}

.modal input {
  width: 100%;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

/* RESPONSIVE */
@media (max-width: 1000px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .stat-card {
    width: 100%;
    min-height: 100px;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar input {
    width: 100%;
    max-width: 100%;
  }

  .page-header {
    gap: 12px;
    align-items: flex-start;
    flex-direction: column;
  }

  .content-card {
    padding: 16px;
  }
}
</style>
