<script setup>
import { ref, computed } from 'vue'
import { useOrderStore } from '../stores/orderStore.js'
import { useTableStore } from '../stores/tableStore.js'

const orderStore = useOrderStore()
const tableStore = useTableStore()

// Lưu đơn gọi món vào localStorage
orderStore.$subscribe((mutation, state) => {
  localStorage.setItem(
    'restaurantOrders',
    JSON.stringify(state.orders)
  )
})

// Danh sách bàn lấy trực tiếp từ quản lý bàn
const tables = computed(() =>
  tableStore.tables.map(table => table.name)
)

// Danh sách món mặc định
const defaultMenu = [
  { id: 'MA001', name: 'Cơm chiên hải sản', price: 65000 },
  { id: 'MA002', name: 'Bò lúc lắc', price: 85000 },
  { id: 'MA003', name: 'Gà chiên nước mắm', price: 60000 },
  { id: 'MA004', name: 'Canh chua cá', price: 50000 },
  { id: 'MA007', name: 'Phở bò', price: 55000 },
  { id: 'MA008', name: 'Bún bò Huế', price: 60000 },
  { id: 'MA010', name: 'Gỏi cuốn tôm thịt', price: 45000 },
  { id: 'MA016', name: 'Lẩu Thái hải sản', price: 250000 },
  { id: 'MA017', name: 'Chè ba màu', price: 25000 },
  { id: 'MA020', name: 'Trà đào cam sả', price: 40000 }
]

// Đọc thực đơn đã lưu
function loadMenu() {
  try {
    const saved = localStorage.getItem('restaurantMenu')

    if (saved) {
      const parsed = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Lỗi đọc thực đơn:', error)
  }

  return defaultMenu
}

const menu = ref(loadMenu())

const selectedTable = ref('Bàn 01')
const selectedFood = ref('')
const quantity = ref(1)

const search = ref('')
const orderSearch = ref('')
const statusFilter = ref('Tất cả')

// Danh sách đơn gọi món
const orders = computed(() => orderStore.orders)
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    const keyword = orderSearch.value.toLowerCase().trim()

    const matchSearch =
      String(order.id || '').toLowerCase().includes(keyword) ||
      String(order.table || '').toLowerCase().includes(keyword)

    const matchStatus =
      statusFilter.value === 'Tất cả' ||
      order.status === statusFilter.value

    return matchSearch && matchStatus
  })
})

// Tìm kiếm món ăn
const filteredMenu = computed(() => {
  return menu.value.filter(food => {
    const isSelling = food.status !== 'Ngừng bán'

    const matchSearch = food.name
      .toLowerCase()
      .includes(search.value.toLowerCase())

    return isSelling && matchSearch
  })
})

// Thống kê
const totalPrice = computed(() => orderStore.totalPrice)
const totalOrders = computed(() => orderStore.totalOrders)
const pendingOrders = computed(() => orderStore.pendingOrders)
const cookingOrders = computed(() => orderStore.cookingOrders)

// Định dạng tiền
function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ'
}

// Tăng giảm số lượng món
function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function increaseQuantity() {
  quantity.value++
}

// Thêm món vào đơn
function addFood() {
  if (!selectedFood.value || quantity.value < 1) {
    alert('Vui lòng chọn món ăn và số lượng hợp lệ!')
    return
  }

  if (!Number.isInteger(Number(quantity.value))) {
    alert('Số lượng phải là số nguyên!')
    return
  }

  if (!tables.value.includes(selectedTable.value)) {
    alert('Bàn không tồn tại trong hệ thống!')
    return
  }

  const food = menu.value.find(
    item => item.id === selectedFood.value
  )

  if (!food) {
    alert('Không tìm thấy món ăn!')
    return
  }

  if (food.status === 'Ngừng bán') {
    alert('Món ăn hiện đã ngừng bán!')
    return
  }

  orderStore.addFood(
    selectedTable.value,
    food,
    Number(quantity.value)
  )

  selectedFood.value = ''
  quantity.value = 1

  alert('Đã thêm món vào đơn gọi món!')
}

// Xóa món khỏi đơn
function removeFood(order, index) {
  if (
    order.status === 'Đã phục vụ' ||
    order.status === 'Đã hủy'
  ) {
    alert('Không thể chỉnh sửa đơn này!')
    return
  }

  if (confirm('Bạn có chắc chắn muốn xóa món này?')) {
    order.items.splice(index, 1)

    // Nếu đơn không còn món thì xóa đơn
    if (order.items.length === 0) {
      orderStore.orders = orderStore.orders.filter(
        item => item.id !== order.id
      )
    }
  }
}

// Thay đổi số lượng món
function changeQuantity(order, item, amount) {
  if (
    order.status === 'Đã phục vụ' ||
    order.status === 'Đã hủy'
  ) {
    alert('Không thể chỉnh sửa đơn này!')
    return
  }

  const newQuantity = Number(item.quantity) + amount

  if (newQuantity <= 0) {
    order.items = order.items.filter(
      food => food !== item
    )

    if (order.items.length === 0) {
      orderStore.orders = orderStore.orders.filter(
        current => current.id !== order.id
      )
    }

    return
  }

  item.quantity = newQuantity
}

// Cập nhật trạng thái đơn
function updateStatus(order) {
  const result = orderStore.updateStatus(order.id)

  if (result === false) {
    alert('Không thể cập nhật trạng thái đơn hàng.')
  }
}

// Hủy đơn gọi món
function cancelOrder(order) {
  if (
    order.status === 'Đã phục vụ' ||
    order.status === 'Đã hủy'
  ) {
    alert('Không thể hủy đơn này!')
    return
  }

  if (confirm(`Bạn có chắc muốn hủy đơn ${order.id}?`)) {
    order.status = 'Đã hủy'
    alert('Đã hủy đơn gọi món!')
  }
}

// Tính tổng tiền từng đơn
function orderTotal(order) {
  return order.items.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity)
  }, 0)
}

// Xuất hóa đơn
function createInvoice(order) {
  if (order.status !== 'Đã phục vụ') {
    alert('Chỉ có thể xuất hóa đơn khi đơn đã phục vụ!')
    return
  }

  let savedInvoices = []

  try {
    savedInvoices = JSON.parse(
      localStorage.getItem('restaurantInvoices') || '[]'
    )

    if (!Array.isArray(savedInvoices)) {
      savedInvoices = []
    }
  } catch (error) {
    console.error('Lỗi đọc hóa đơn:', error)
    savedInvoices = []
  }

  // Kiểm tra đơn đã xuất hóa đơn chưa
  const exists = savedInvoices.some(
    invoice => invoice.orderId === order.id
  )

  if (exists) {
    alert('Đơn này đã được xuất hóa đơn rồi!')
    return
  }

  const today = new Date()

  const invoice = {
    id: 'HD' + Date.now(),
    orderId: order.id,
    table: order.table,

    items: order.items.map(item => ({
      ...item
    })),

    amount: orderTotal(order),
    subtotal: orderTotal(order),
    guests: order.guests || 1,

    createdAt: today.toISOString().slice(0, 10),
    date: today.toLocaleString('vi-VN'),

    status: 'Chưa thanh toán'
  }

  savedInvoices.push(invoice)

  localStorage.setItem(
    'restaurantInvoices',
    JSON.stringify(savedInvoices)
  )

  // Thông báo cho Dashboard và các trang liên quan
  window.dispatchEvent(
    new Event('restaurantInvoicesUpdated')
  )

  alert('Xuất hóa đơn thành công!')
}
</script>

<template>
  <section class="order-page">
    <div class="page-heading">
      <div>
        <h1>Quản lý gọi món</h1>
        <p>Quản lý các món ăn khách hàng yêu cầu tại nhà hàng</p>
      </div>
    </div>

    <!-- Thống kê -->
    <div class="order-stats">
      <div class="stat-card">
        <span>Tổng đơn gọi món</span>
        <h2>{{ totalOrders }}</h2>
      </div>

      <div class="stat-card">
        <span>Chờ xác nhận</span>
        <h2>{{ pendingOrders }}</h2>
      </div>

      <div class="stat-card">
        <span>Đang chế biến</span>
        <h2>{{ cookingOrders }}</h2>
      </div>

      <div class="stat-card">
        <span>Tổng giá trị đơn</span>
        <h2>{{ formatMoney(totalPrice) }}</h2>
      </div>
    </div>

    <!-- Form gọi món -->
    <div class="order-panel">
      <h2>Tạo đơn gọi món</h2>

      <div class="order-form">
        <div class="form-group">
          <label>Chọn bàn</label>
          <select v-model="selectedTable">
            <option
            v-for="table in tables"
            :key="table"
            :value="table"
          >
        {{ table }}
</option>
          </select>
        </div>

        <div class="form-group">
          <label>Tìm món ăn</label>
          <input
            v-model="search"
            type="text"
            placeholder="Nhập tên món ăn..."
          />
        </div>

        <div class="form-group">
          <label>Chọn món</label>
          <select v-model="selectedFood">
            <option value="">-- Chọn món ăn --</option>
            <option
              v-for="food in filteredMenu"
              :key="food.id"
              :value="food.id"
            >
              {{ food.name }} - {{ formatMoney(food.price) }}
            </option>
          </select>
        </div>

        <div class="form-group">
  <label>Số lượng</label>

  <div class="quantity-input">
    <button
      type="button"
      @click="decreaseQuantity"
    >
      −
    </button>

    <input
      type="number"
      v-model.number="quantity"
      min="1"
    />

    <button
      type="button"
      @click="increaseQuantity"
    >
      +
    </button>
  </div>
</div>
      </div>

      <button class="btn-add" @click="addFood">
        + Thêm món vào đơn
      </button>
    </div>

    <!-- Danh sách đơn -->
    <div class="order-panel">
      <h2>Danh sách đơn gọi món</h2>
<div class="order-filters">
  <input
    v-model="orderSearch"
    type="text"
    placeholder="Tìm theo mã đơn hoặc tên bàn..."
  />

  <select v-model="statusFilter">
    <option>Tất cả</option>
    <option>Chờ xác nhận</option>
    <option>Đang chế biến</option>
    <option>Đã phục vụ</option>
    <option>Đã hủy</option>
  </select>
</div>

    <div v-if="filteredOrders.length === 0" class="empty">
  Không tìm thấy đơn gọi món phù hợp.
      </div>

      <div v-for="order in filteredOrders" :key="order.id" class="order-card">
        <div class="order-header">
          <div>
            <h3>{{ order.table }}</h3>
            <p>{{ order.id }} · {{ order.time }}</p>
          </div>

          <span :class="[
  'order-status',
  order.status === 'Chờ xác nhận' ? 'pending' :
  order.status === 'Đã xác nhận' ? 'confirmed' :
  order.status === 'Đang chế biến' ? 'cooking' :
  order.status === 'Đã hủy' ? 'cancelled' : 'served'
]"  >
            {{ order.status }}  
          </span>
        </div>

        <table class="order-table">
          <thead>
            <tr>
              <th>Tên món</th>
              <th>Đơn giá</th>
              <th>Số lượng</th>
              <th>Thành tiền</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in order.items" :key="item.foodId">
              <td>{{ item.name }}</td>
              <td>{{ formatMoney(item.price) }}</td>
                <td>
  <div class="quantity-control">
    <button
      @click="changeQuantity(order, item, -1)"
      :disabled="order.status === 'Đã phục vụ' || order.status === 'Đã hủy'"
    >
      −
    </button>

    <span>{{ item.quantity }}</span>

    <button
      @click="changeQuantity(order, item, 1)"
      :disabled="order.status === 'Đã phục vụ' || order.status === 'Đã hủy'"
    >
      +
    </button>
  </div>
</td>
              <td>{{ formatMoney(item.price * item.quantity) }}</td>
              <td>
                <button
                  class="btn-remove"
                  @click="removeFood(order, index)"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="order-footer">
  <strong>
    Tổng tiền: {{ formatMoney(orderTotal(order)) }}
  </strong>

  <!-- Cập nhật trạng thái -->
  <button
  v-if="order.status !== 'Đã phục vụ' && order.status !== 'Đã hủy'"
  class="btn-status"
  @click="updateStatus(order)"
>
  {{
    order.status === 'Chờ xác nhận'
      ? 'Xác nhận đơn'
      : order.status === 'Đã xác nhận'
        ? 'Bắt đầu chế biến'
        : 'Xác nhận đã phục vụ'
  }}
</button>
  <!-- Hủy đơn -->
  <button
    v-if="order.status !== 'Đã phục vụ' && order.status !== 'Đã hủy'"
    class="btn-cancel"
    @click="cancelOrder(order)"
  >
    Hủy đơn
  </button>

  <!-- Xuất hóa đơn -->
  <button
    v-if="order.status === 'Đã phục vụ'"
    class="btn-status"
    @click="createInvoice(order)"
  >
    Xuất hóa đơn
  </button>
</div>
        </div>
      </div>
      
  </section>
</template>

<style scoped>
.order-page {
  color: #1f2937;
}

.page-heading {
  margin-bottom: 25px;
}

.page-heading h1 {
  font-size: 27px;
  margin-bottom: 8px;
}

.page-heading p {
  color: #6b7280;
}

.order-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 25px;
}

.stat-card,
.order-panel,
.order-card {
  background: #fff;
  padding: 22px;
  border: 1px solid #e5eee8;
  box-shadow: 0 4px 15px rgba(31, 41, 55, 0.04);
}

.stat-card span {
  color: #6b7280;
  font-size: 14px;
}

.stat-card h2 {
  color: #237a50;
  font-size: 23px;
  margin-top: 12px;
}

.order-panel {
  margin-bottom: 25px;
}

.order-panel h2 {
  font-size: 19px;
  margin-bottom: 20px;
}

.order-form {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 11px;
  border: 1px solid #d5e2d9;
  outline: none;
  background: #fff;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #237a50;
}

.btn-add,
.btn-status {
  background: #237a50;
  color: white;
  border: none;
  padding: 11px 18px;
  cursor: pointer;
  margin-top: 18px;
}

.btn-add:hover,
.btn-status:hover {
  background: #185c3b;
}

.order-card {
  margin-bottom: 18px;
}

.order-header,
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.order-header h3 {
  color: #237a50;
  margin-bottom: 6px;
}

.order-header p {
  color: #6b7280;
  font-size: 13px;
}

.order-status {
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 600;
}

.pending {
  background: #fff1dc;
  color: #b45309;
}

.cooking {
  background: #dbeafe;
  color: #1d4ed8;
}

.served {
  background: #dcfce7;
  color: #15803d;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.order-table th,
.order-table td {
  padding: 13px 10px;
  text-align: left;
  border-bottom: 1px solid #e5eee8;
  font-size: 14px;
}

.order-table th {
  background: #f0f7f2;
  color: #237a50;
}

.btn-remove {
  background: #fee2e2;
  color: #b91c1c;
  border: none;
  padding: 7px 12px;
  cursor: pointer;
}

.order-footer {
  border-top: 1px solid #e5eee8;
  padding-top: 15px;
}

.order-footer strong {
  color: #237a50;
  font-size: 17px;
}

.btn-status {
  margin-top: 0;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}

@media (max-width: 900px) {
  .order-stats,
  .order-form {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .order-stats,
  .order-form {
    grid-template-columns: 1fr;
  }

  .order-table {
    display: block;
    overflow-x: auto;
  }

  .order-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
/* Chống tràn kích thước */
.order-page,
.order-page * {
  box-sizing: border-box;
}

.order-stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.order-form {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.form-group {
  min-width: 0;
}

.form-group input,
.form-group select {
  max-width: 100%;
  box-sizing: border-box;
}

.order-panel {
  min-width: 0;
  overflow-x: auto;
}

.order-table {
  min-width: 650px;
}

@media (max-width: 1100px) {
  .order-stats,
  .order-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .order-stats,
  .order-form {
    grid-template-columns: 1fr;
  }
}
.order-filters {
  display: flex;
  gap: 12px;
  margin: 15px 0 20px;
}

.order-filters input,
.order-filters select {
  padding: 11px 14px;
  border: 1px solid #d5e2d9;
  outline: none;
  background: white;
}

.order-filters input {
  flex: 1;
  min-width: 0;
}

.order-filters select {
  width: 220px;
}

.btn-cancel {
  background: #fee2e2;
  color: #b91c1c;
  border: none;
  padding: 11px 18px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #fecaca;
}

.cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 600px) {
  .order-filters {
    flex-direction: column;
  }

  .order-filters select {
    width: 100%;
  }
}
.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-control button {
  width: 30px;
  height: 30px;
  border: none;
  background: #e2f3e9;
  color: #237a50;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

.quantity-control button:hover {
  background: #237a50;
  color: white;
}

.quantity-control button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quantity-control span {
  min-width: 18px;
  text-align: center;
  font-weight: 600;
}
.quantity-input {
  display: flex;
  align-items: center;
  height: 49px;
}

.quantity-input input {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 100%;
  text-align: center;
  border: 1px solid #d5e2d9;
  outline: none;
  font-size: 16px;
}

.quantity-input button {
  width: 45px;
  height: 100%;
  border: none;
  background: #e2f3e9;
  color: #237a50;
  font-size: 22px;
  font-weight: bold;
  cursor: pointer;
}

.quantity-input button:hover {
  background: #237a50;
  color: white;
}
.confirmed {
  background: #fef3c7;
  color: #92400e;
}
</style>
