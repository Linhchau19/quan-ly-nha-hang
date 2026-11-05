
<script setup>
import { ref, computed } from 'vue'

const keyword = ref('')

const customers = ref([
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
])

const filteredCustomers = computed(() => {
  const value = keyword.value.toLowerCase().trim()

  return customers.value.filter(customer =>
    customer.id.toLowerCase().includes(value) ||
    customer.name.toLowerCase().includes(value) ||
    customer.phone.includes(value)
  )
})

const totalSpent = computed(() =>
  customers.value.reduce((sum, customer) => sum + customer.totalSpent, 0)
)

const formatMoney = value =>
  new Intl.NumberFormat('vi-VN').format(value) + 'đ'

const showForm = ref(false)
const editingCustomer = ref(null)

const form = ref({
  name: '',
  phone: '',
  email: ''
})

function openAddForm() {
  editingCustomer.value = null
  form.value = { name: '', phone: '', email: '' }
  showForm.value = true
}

function openEditForm(customer) {
  editingCustomer.value = customer.id
  form.value = {
    name: customer.name,
    phone: customer.phone,
    email: customer.email
  }
  showForm.value = true
}

function saveCustomer() {
  if (!form.value.name.trim() || !form.value.phone.trim()) {
    alert('Vui lòng nhập họ tên và số điện thoại!')
    return
  }

  if (editingCustomer.value) {
    const customer = customers.value.find(
      item => item.id === editingCustomer.value
    )
    Object.assign(customer, form.value)
  } else {
    customers.value.push({
      id: 'KH' + String(Date.now()).slice(-5),
      ...form.value,
      visits: 0,
      totalSpent: 0
    })
  }

  showForm.value = false
}

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
        <h2>{{ customers.reduce((sum, c) => sum + c.visits, 0) }}</h2>
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
            <tr v-for="customer in filteredCustomers" :key="customer.id">
              <td>{{ customer.id }}</td>
              <td>{{ customer.name }}</td>
              <td>{{ customer.phone }}</td>
              <td>{{ customer.email || 'Chưa có' }}</td>
              <td>{{ customer.visits }}</td>
              <td>{{ formatMoney(customer.totalSpent) }}</td>
              <td>
                <button class="edit-btn" @click="openEditForm(customer)">
                  Sửa
                </button>
                <button class="delete-btn" @click="deleteCustomer(customer.id)">
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

    <div v-if="showForm" class="modal-overlay">
      <div class="modal">
        <h2>{{ editingCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng' }}</h2>

        <label>Họ và tên</label>
        <input v-model="form.name" placeholder="Nhập họ tên" />

        <label>Số điện thoại</label>
        <input v-model="form.phone" placeholder="Nhập số điện thoại" />

        <label>Email</label>
        <input v-model="form.email" type="email" placeholder="Nhập email" />

        <div class="modal-actions">
          <button class="cancel-btn" @click="showForm = false">
            Hủy
          </button>
          <button class="add-btn" @click="saveCustomer">
            Lưu thông tin
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customer-page {
  color: #26352d;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.page-header h1 {
  margin: 0 0 7px;
  font-size: 25px;
}

.page-header p {
  margin: 0;
  color: #84918a;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 25px;
}

.stat-card,
.content-card {
  background: white;
  padding: 22px;
  border: 1px solid #e5eee8;
  border-radius: 8px;
}

.stat-card span {
  color: #84918a;
}

.stat-card h2 {
  margin: 12px 0 0;
  color: #237a50;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.toolbar h3 {
  margin: 0;
}

.toolbar input {
  width: 320px;
}

input {
  box-sizing: border-box;
  padding: 11px 13px;
  border: 1px solid #dce7df;
  border-radius: 5px;
  outline: none;
}

input:focus {
  border-color: #52a879;
}

.table-wrapper {
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
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}
</style>
