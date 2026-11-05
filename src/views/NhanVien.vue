
<script setup>
import { ref, computed } from 'vue'

const employees = ref([
  {
    id: 'NV001',
    name: 'Nguyễn Văn Nam',
    phone: '0901234567',
    email: 'nam@gmail.com',
    position: 'Quản lý',
    salary: 12000000,
    status: 'Đang làm'
  },
  {
    id: 'NV002',
    name: 'Trần Thị Lan',
    phone: '0912345678',
    email: 'lan@gmail.com',
    position: 'Thu ngân',
    salary: 8000000,
    status: 'Đang làm'
  },
  {
    id: 'NV003',
    name: 'Lê Minh Tuấn',
    phone: '0987654321',
    email: 'tuan@gmail.com',
    position: 'Nhân viên phục vụ',
    salary: 6500000,
    status: 'Đang làm'
  },
  {
    id: 'NV004',
    name: 'Phạm Thu Hà',
    phone: '0934567890',
    email: 'ha@gmail.com',
    position: 'Nhân viên phục vụ',
    salary: 6500000,
    status: 'Nghỉ việc'
  }
])

const keyword = ref('')
const filterPosition = ref('Tất cả')

const filteredEmployees = computed(() => {
  return employees.value.filter(employee => {
    const search = keyword.value.toLowerCase().trim()

    const matchKeyword =
      employee.id.toLowerCase().includes(search) ||
      employee.name.toLowerCase().includes(search) ||
      employee.phone.includes(search)

    const matchPosition =
      filterPosition.value === 'Tất cả' ||
      employee.position === filterPosition.value

    return matchKeyword && matchPosition
  })
})

const workingCount = computed(() =>
  employees.value.filter(e => e.status === 'Đang làm').length
)

const showForm = ref(false)
const editingId = ref(null)

const form = ref({
  name: '',
  phone: '',
  email: '',
  position: 'Nhân viên phục vụ',
  salary: 6500000,
  status: 'Đang làm'
})

const formatMoney = value =>
  new Intl.NumberFormat('vi-VN').format(value) + 'đ'

function openAddForm() {
  editingId.value = null
  form.value = {
    name: '',
    phone: '',
    email: '',
    position: 'Nhân viên phục vụ',
    salary: 6500000,
    status: 'Đang làm'
  }
  showForm.value = true
}

function openEditForm(employee) {
  editingId.value = employee.id
  form.value = { ...employee }
  showForm.value = true
}

function saveEmployee() {
  if (!form.value.name.trim() || !form.value.phone.trim()) {
    alert('Vui lòng nhập họ tên và số điện thoại!')
    return
  }

  if (editingId.value) {
    const employee = employees.value.find(
      e => e.id === editingId.value
    )
    Object.assign(employee, form.value)
  } else {
    employees.value.push({
      id: 'NV' + String(Date.now()).slice(-5),
      ...form.value
    })
  }

  showForm.value = false
}

function deleteEmployee(id) {
  if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
    employees.value = employees.value.filter(e => e.id !== id)
  }
}
</script>

<template>
  <div class="employee-page">
    <div class="page-header">
      <div>
        <h1>Quản lý nhân viên</h1>
        <p>Quản lý thông tin và phân công nhân viên nhà hàng</p>
      </div>

      <button class="add-btn" @click="openAddForm">
        + Thêm nhân viên
      </button>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span>Tổng nhân viên</span>
        <h2>{{ employees.length }}</h2>
      </div>

      <div class="stat-card">
        <span>Đang làm việc</span>
        <h2>{{ workingCount }}</h2>
      </div>

      <div class="stat-card">
        <span>Đã nghỉ việc</span>
        <h2>{{ employees.length - workingCount }}</h2>
      </div>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <h3>Danh sách nhân viên</h3>

        <div class="filters">
          <input
            v-model="keyword"
            placeholder="Tìm tên, mã hoặc số điện thoại..."
          />

          <select v-model="filterPosition">
            <option>Tất cả</option>
            <option>Quản lý</option>
            <option>Thu ngân</option>
            <option>Nhân viên phục vụ</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Mã nhân viên</th>
              <th>Họ và tên</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Chức vụ</th>
              <th>Lương</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="employee in filteredEmployees" :key="employee.id">
              <td>{{ employee.id }}</td>
              <td>{{ employee.name }}</td>
              <td>{{ employee.phone }}</td>
              <td>{{ employee.email || 'Chưa có' }}</td>
              <td>{{ employee.position }}</td>
              <td>{{ formatMoney(employee.salary) }}</td>
              <td>
                <span
                  :class="employee.status === 'Đang làm' ? 'status-working' : 'status-off'"
                >
                  {{ employee.status }}
                </span>
              </td>
              <td>
                <button class="edit-btn" @click="openEditForm(employee)">
                  Sửa
                </button>
                <button class="delete-btn" @click="deleteEmployee(employee.id)">
                  Xóa
                </button>
              </td>
            </tr>

            <tr v-if="filteredEmployees.length === 0">
              <td colspan="8" class="empty">
                Không tìm thấy nhân viên
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay">
      <div class="modal">
        <h2>{{ editingId ? 'Cập nhật nhân viên' : 'Thêm nhân viên' }}</h2>

        <label>Họ và tên</label>
        <input v-model="form.name" placeholder="Nhập họ tên" />

        <label>Số điện thoại</label>
        <input v-model="form.phone" placeholder="Nhập số điện thoại" />

        <label>Email</label>
        <input v-model="form.email" type="email" placeholder="Nhập email" />

        <label>Chức vụ</label>
        <select v-model="form.position">
          <option>Quản lý</option>
          <option>Thu ngân</option>
          <option>Nhân viên phục vụ</option>
        </select>

        <label>Mức lương (VNĐ)</label>
        <input v-model.number="form.salary" type="number" min="0" />

        <label>Trạng thái</label>
        <select v-model="form.status">
          <option>Đang làm</option>
          <option>Nghỉ việc</option>
        </select>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showForm = false">
            Hủy
          </button>

          <button class="add-btn" @click="saveEmployee">
            Lưu thông tin
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.employee-page {
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

.filters {
  display: flex;
  gap: 10px;
}

input,
select {
  box-sizing: border-box;
  padding: 11px 13px;
  border: 1px solid #dce7df;
  border-radius: 5px;
  outline: none;
  background: white;
}

input:focus,
select:focus {
  border-color: #52a879;
}

.filters input {
  width: 280px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
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
  padding: 10px 13px;
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
  margin-right: 5px;
}

.delete-btn {
  color: #c0392b;
  background: #fff0ee;
}

.status-working,
.status-off {
  display: inline-block;
  padding: 6px 9px;
  border-radius: 4px;
  font-size: 12px;
}

.status-working {
  color: #237a50;
  background: #e8f4ec;
}

.status-off {
  color: #b5473c;
  background: #fff0ee;
}

.empty {
  text-align: center;
  color: #84918a;
  padding: 25px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, .45);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  width: 440px;
  max-width: calc(100% - 40px);
  max-height: 85vh;
  overflow-y: auto;
  background: white;
  padding: 25px;
  border-radius: 8px;
}

.modal h2 {
  margin: 0 0 20px;
}

.modal label {
  display: block;
  margin: 12px 0 7px;
  font-size: 14px;
}

.modal input,
.modal select {
  width: 100%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .page-header,
  .toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .filters {
    width: 100%;
    flex-wrap: wrap;
  }

  .filters input {
    width: 100%;
  }
}
</style>
