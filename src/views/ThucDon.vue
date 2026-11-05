
<script setup>
import { ref, computed, watch } from 'vue'


const defaultFoods = [
 
  {
    id: 'MA007',
    name: 'Phở bò',
    category: 'Món chính',
    price: 55000,
    description: 'Phở bò truyền thống với nước dùng đậm đà.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA008',
    name: 'Bún bò Huế',
    category: 'Món chính',
    price: 60000,
    description: 'Bún bò với thịt bò, chả và rau sống.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA009',
    name: 'Bánh mì thịt',
    category: 'Món chính',
    price: 30000,
    description: 'Bánh mì giòn kèm thịt và rau thơm.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1600454309261-3dc9b7597637?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA010',
    name: 'Gỏi cuốn tôm thịt',
    category: 'Món khai vị',
    price: 45000,
    description: 'Gỏi cuốn tươi với tôm, thịt và rau.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA011',
    name: 'Chả giò chiên',
    category: 'Món khai vị',
    price: 40000,
    description: 'Chả giò vàng giòn ăn kèm rau sống.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA012',
    name: 'Cá kho tộ',
    category: 'Món chính',
    price: 75000,
    description: 'Cá kho với nước màu và gia vị truyền thống.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA013',
    name: 'Sườn nướng mật ong',
    category: 'Món chính',
    price: 95000,
    description: 'Sườn nướng mềm với sốt mật ong.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA014',
    name: 'Tôm rang muối',
    category: 'Món chính',
    price: 110000,
    description: 'Tôm rang muối thơm ngon, đậm vị.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA015',
    name: 'Mực xào sa tế',
    category: 'Món chính',
    price: 95000,
    description: 'Mực tươi xào cùng sa tế và rau củ.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA016',
    name: 'Lẩu Thái hải sản',
    category: 'Món chính',
    price: 250000,
    description: 'Lẩu chua cay với tôm, mực và rau.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA017',
    name: 'Chè ba màu',
    category: 'Món tráng miệng',
    price: 25000,
    description: 'Chè đậu xanh, đậu đỏ và thạch.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA018',
    name: 'Bánh flan',
    category: 'Món tráng miệng',
    price: 20000,
    description: 'Bánh flan mềm mịn với caramel.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA019',
    name: 'Nước ép cam',
    category: 'Đồ uống',
    price: 35000,
    description: 'Nước cam tươi nguyên chất.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA020',
    name: 'Trà đào cam sả',
    category: 'Đồ uống',
    price: 40000,
    description: 'Trà đào thơm kết hợp cam và sả.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 'MA021',
    name: 'Sinh tố bơ',
    category: 'Đồ uống',
    price: 45000,
    description: 'Sinh tố bơ béo mịn, thơm ngon.',
    status: 'Đang bán',
    image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=700&q=80'
  }
]
const savedMenu = localStorage.getItem('restaurantMenu')

let parsedMenu = null

try {
  if (savedMenu && savedMenu !== 'undefined') {
    parsedMenu = JSON.parse(savedMenu)
  }
} catch (error) {
  console.warn('Dữ liệu thực đơn không hợp lệ:', error)
}

const foods = ref(
  Array.isArray(parsedMenu) ? parsedMenu : defaultFoods
)

watch(
  foods,
  (newFoods) => {
    localStorage.setItem('restaurantMenu', JSON.stringify(newFoods))
  },
  { deep: true, immediate: true }
)

const keyword = ref('')
const filterCategory = ref('Tất cả')

const showForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
  name: '',
  category: 'Món chính',
  price: 0,
  description: '',
  status: 'Đang bán'
})

const form = ref(emptyForm())

const categories = [
  'Món chính',
  'Món khai vị',
  'Món canh',
  'Món tráng miệng',
  'Đồ uống'
]

const filteredFoods = computed(() => {
  return foods.value.filter(food => {
    const matchKeyword =
      food.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
      food.id.toLowerCase().includes(keyword.value.toLowerCase())

    const matchCategory =
      filterCategory.value === 'Tất cả' ||
      food.category === filterCategory.value

    return matchKeyword && matchCategory
  })
})

const sellingCount = computed(() =>
  foods.value.filter(food => food.status === 'Đang bán').length
)

const formatMoney = value =>
  new Intl.NumberFormat('vi-VN').format(value) + ' đ'

function openAddForm() {
  editingId.value = null
  form.value = emptyForm()
  showForm.value = true
}

function openEditForm(food) {
  editingId.value = food.id
  form.value = { ...food }
  showForm.value = true
}

function saveFood() {
  if (!form.value.name.trim()) {
    alert('Vui lòng nhập tên món ăn!')
    return
  }

  if (form.value.price <= 0) {
    alert('Giá bán phải lớn hơn 0!')
    return
  }

  if (editingId.value) {
    const index = foods.value.findIndex(
      food => food.id === editingId.value
    )

    if (index !== -1) {
      foods.value[index] = {
        ...foods.value[index],
        ...form.value
      }
    }
  } else {
    const nextNumber = Math.max(
      0,
      ...foods.value.map(food =>
        Number(food.id.replace('MA', '')) || 0
      )
    ) + 1

    foods.value.push({
      id: 'MA' + String(nextNumber).padStart(3, '0'),
      ...form.value
    })
  }

  showForm.value = false
}

function deleteFood(id) {
  if (confirm('Bạn có chắc chắn muốn xóa món ăn này?')) {
    foods.value = foods.value.filter(food => food.id !== id)
  }
}

function toggleStatus(food) {
  food.status = food.status === 'Đang bán'
    ? 'Ngừng bán'
    : 'Đang bán'
}
</script>

<template>
  <div class="menu-page">
    <div class="page-header">
      <div>
        <h1>Quản lý thực đơn</h1>
        <p>Quản lý món ăn, danh mục và giá bán của nhà hàng</p>
      </div>

      <button class="btn-primary" @click="openAddForm">
        + Thêm món ăn
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>Tổng số món ăn</span>
        <h2>{{ foods.length }}</h2>
        <small>Món trong thực đơn</small>
      </div>

      <div class="stat-card">
        <span>Đang kinh doanh</span>
        <h2>{{ sellingCount }}</h2>
        <small>Món đang được phục vụ</small>
      </div>

      <div class="stat-card">
        <span>Ngừng kinh doanh</span>
        <h2>{{ foods.length - sellingCount }}</h2>
        <small>Món tạm ngừng bán</small>
      </div>
    </div>

    <section class="menu-content">
      <div class="toolbar">
        <input
          v-model="keyword"
          placeholder="Tìm kiếm mã món hoặc tên món..."
        />

        <select v-model="filterCategory">
          <option>Tất cả</option>
          <option v-for="category in categories" :key="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div class="food-grid">
        <div
          v-for="food in filteredFoods"
          :key="food.id"
          class="food-card"
        >
          <div class="food-top">
            <span class="food-code">{{ food.id }}</span>
            <span
              :class="[
                'status',
                food.status === 'Đang bán' ? 'status-active' : 'status-off'
              ]"
            >
              {{ food.status }}
            </span>
          </div>

         <div class="food-image">
  <img
     v-if="food.image"
    :src="food.image"
    :alt="food.name"
    loading="lazy"
    @error="food.image = ''"
  />
  <span v-else class="food-placeholder">🍽️</span>
</div>
<div class="food-info">
  <h3>{{ food.name }}</h3>

  <p class="food-category">
    {{ food.category }}
  </p>

  <div class="food-price">
    {{ Number(food.price).toLocaleString('vi-VN') }}đ
  </div>
</div>
          <div class="food-actions">
            <button class="btn-edit" @click="openEditForm(food)">
              Sửa
            </button>

            <button
              class="btn-toggle"
              @click="toggleStatus(food)"
            >
              {{ food.status === 'Đang bán' ? 'Ngừng bán' : 'Mở bán' }}
            </button>

            <button class="btn-delete" @click="deleteFood(food.id)">
              Xóa
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredFoods.length === 0" class="empty">
        Không tìm thấy món ăn phù hợp.
      </div>
    </section>

    <!-- Form thêm và sửa món ăn -->
    <div v-if="showForm" class="modal-overlay">
      <div class="modal">
        <h2>{{ editingId ? 'Cập nhật món ăn' : 'Thêm món ăn mới' }}</h2>

        <div class="form-group">
          <label>Tên món ăn</label>
          <input v-model="form.name" placeholder="Nhập tên món ăn" />
        </div>

        <div class="form-group">
          <label>Danh mục</label>
          <select v-model="form.category">
            <option v-for="category in categories" :key="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Giá bán (VNĐ)</label>
          <input v-model.number="form.price" type="number" min="1" />
        </div>

        <div class="form-group">
          <label>Mô tả món ăn</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Nhập mô tả món ăn..."
          ></textarea>
        </div>

        <div class="form-group">
          <label>Trạng thái</label>
          <select v-model="form.status">
            <option>Đang bán</option>
            <option>Ngừng bán</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showForm = false">
            Hủy
          </button>
          <button class="btn-primary" @click="saveFood">
            Lưu món ăn
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-page {
  color: #25352d;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 25px;
  margin: 0 0 7px;
}

.page-header p {
  color: #829087;
  font-size: 14px;
  margin: 0;
}

.btn-primary {
  background: #237a50;
  color: white;
  border: none;
  padding: 11px 18px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover {
  background: #185c3b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 22px;
}

.stat-card {
  background: white;
  border: 1px solid #e2ece5;
  border-left: 4px solid #52a879;
  padding: 20px;
}

.stat-card span {
  color: #718078;
  font-size: 14px;
}

.stat-card h2 {
  color: #237a50;
  margin: 12px 0 5px;
  font-size: 25px;
}

.stat-card small {
  color: #8a978e;
}

.menu-content {
  background: white;
  padding: 20px;
  border: 1px solid #e4ece6;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.toolbar input {
  flex: 1;
}

.toolbar input,
.toolbar select,
.form-group input,
.form-group select,
.form-group textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #dce6df;
  padding: 11px 12px;
  outline: none;
  background: white;
  color: #26352c;
  font-size: 14px;
}

.toolbar select {
  width: 190px;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #52a879;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.food-card {
  border: 1px solid #e5ece7;
  background: #fff;
  padding: 16px;
  transition: border-color 0.2s, transform 0.2s;
}

.food-card:hover {
  border-color: #52a879;
  transform: translateY(-2px);
}

.food-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.food-code {
  color: #89958d;
  font-size: 12px;
}

.status {
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 600;
}

.status-active {
  background: #e5f4e9;
  color: #237a50;
}

.status-off {
  background: #f1eeee;
  color: #777;
}
.food-image {
  width: 100%;
  height: 160px;
  margin: 12px 0;
  overflow: hidden;
  background: #f0f7f2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.food-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.food-info {
  padding: 10px 5px;
}

.food-info h3 {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  margin: 5px 0 8px;
}

.food-category {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.food-price {
  font-size: 21px;
  font-weight: 700;
  color: #237a50;
  margin: 12px 0;
}

.food-card:hover .food-image img {
  transform: scale(1.05);
}

.food-image span {
  font-size: 42px;
}
</style>
