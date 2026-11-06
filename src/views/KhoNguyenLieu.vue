
<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const defaultIngredients = [
  {
    id: 'NL001',
    name: 'Gạo tẻ',
    category: 'Ngũ cốc',
    quantity: 50,
    unit: 'kg',
    minQuantity: 10,
    unitPrice: 18000,
    supplier: 'Đại lý Minh Phát'
  },
  {
    id: 'NL002',
    name: 'Thịt bò',
    category: 'Thịt',
    quantity: 8,
    unit: 'kg',
    minQuantity: 10,
    unitPrice: 220000,
    supplier: 'Thực phẩm An Phú'
  },
  {
    id: 'NL003',
    name: 'Thịt gà',
    category: 'Thịt',
    quantity: 25,
    unit: 'kg',
    minQuantity: 8,
    unitPrice: 85000,
    supplier: 'Thực phẩm An Phú'
  },
  {
    id: 'NL004',
    name: 'Rau xà lách',
    category: 'Rau củ',
    quantity: 5,
    unit: 'kg',
    minQuantity: 8,
    unitPrice: 30000,
    supplier: 'Nông sản sạch'
  },
  {
    id: 'NL005',
    name: 'Dầu ăn',
    category: 'Gia vị',
    quantity: 20,
    unit: 'lít',
    minQuantity: 5,
    unitPrice: 45000,
    supplier: 'Đại lý Minh Phát'
  },
  {
    id: 'NL006',
    name: 'Nước mắm',
    category: 'Gia vị',
    quantity: 15,
    unit: 'lít',
    minQuantity: 5,
    unitPrice: 55000,
    supplier: 'Đại lý Minh Phát'
  }
]

function loadIngredients() {
  try {
    const saved = localStorage.getItem('restaurantIngredients')

    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (error) {
    console.error('Lỗi đọc dữ liệu kho:', error)
  }

  return defaultIngredients
}

const ingredients = ref(loadIngredients())
// ===============================
// QUẢN LÝ CÔNG THỨC MÓN ĂN
// ===============================

const defaultMenu = [
  { id: 'MA001', name: 'Cơm chiên hải sản' },
  { id: 'MA002', name: 'Bò lúc lắc' },
  { id: 'MA003', name: 'Gà chiên nước mắm' },
  { id: 'MA004', name: 'Canh chua cá' },
  { id: 'MA007', name: 'Phở bò' },
  { id: 'MA008', name: 'Bún bò Huế' },
  { id: 'MA010', name: 'Gỏi cuốn tôm thịt' },
  { id: 'MA016', name: 'Lẩu Thái hải sản' },
  { id: 'MA017', name: 'Chè ba màu' },
  { id: 'MA020', name: 'Trà đào cam sả' }
]

function loadMenu() {
  try {
    const saved = JSON.parse(
      localStorage.getItem('restaurantMenu') || 'null'
    )

    if (Array.isArray(saved) && saved.length) return saved
  } catch (error) {
    console.error('Lỗi đọc thực đơn:', error)
  }

  return defaultMenu
}

const menuItems = ref(loadMenu())

function loadRecipes() {
  try {
    const saved = JSON.parse(
      localStorage.getItem('restaurantRecipes') || '[]'
    )

    return Array.isArray(saved) ? saved : []
  } catch (error) {
    console.error('Lỗi đọc công thức:', error)
    return []
  }
}

const recipes = ref(loadRecipes())

watch(
  recipes,
  (value) => {
    localStorage.setItem('restaurantRecipes', JSON.stringify(value))
  },
  { deep: true }
)

const recipeFoodId = ref('')
const recipeIngredientId = ref('')
const recipeQuantity = ref(0)

const recipeDraft = ref([])
const editingRecipeId = ref(null)

const selectedRecipeFood = computed(() =>
  menuItems.value.find(item => item.id === recipeFoodId.value)
)

const currentRecipe = computed(() =>
  recipes.value.find(item => item.foodId === recipeFoodId.value)
)

function selectRecipeFood() {
  editingRecipeId.value = null

  const existing = currentRecipe.value

  recipeDraft.value = existing
    ? existing.ingredients.map(item => ({ ...item }))
    : []
}

function addRecipeIngredient() {
  const ingredient = ingredients.value.find(
    item => item.id === recipeIngredientId.value
  )

  const amount = Number(recipeQuantity.value)

  if (!recipeFoodId.value) {
    alert('Vui lòng chọn món ăn!')
    return
  }

  if (!ingredient) {
    alert('Vui lòng chọn nguyên liệu!')
    return
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert('Định lượng phải lớn hơn 0!')
    return
  }

  const existing = recipeDraft.value.find(
    item => item.ingredientId === ingredient.id
  )

  if (existing) {
    existing.quantity += amount
  } else {
    recipeDraft.value.push({
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity: amount,
      unit: ingredient.unit
    })
  }

  recipeIngredientId.value = ''
  recipeQuantity.value = 0
}

function removeRecipeIngredient(ingredientId) {
  recipeDraft.value = recipeDraft.value.filter(
    item => item.ingredientId !== ingredientId
  )
}

function saveRecipe() {
  const food = selectedRecipeFood.value

  if (!food) {
    alert('Vui lòng chọn món ăn!')
    return
  }

  if (recipeDraft.value.length === 0) {
    alert('Vui lòng thêm ít nhất một nguyên liệu!')
    return
  }

  const recipe = {
    foodId: food.id,
    foodName: food.name,
    ingredients: recipeDraft.value.map(item => ({ ...item })),
    updatedAt: new Date().toISOString()
  }

  const index = recipes.value.findIndex(
    item => item.foodId === food.id
  )

  if (index !== -1) {
    recipes.value[index] = recipe
  } else {
    recipes.value.push(recipe)
  }

  alert('Đã lưu công thức món ăn!')
  recipeDraft.value = []
  recipeFoodId.value = ''
}

function editRecipe(recipe) {
  recipeFoodId.value = recipe.foodId
  editingRecipeId.value = recipe.foodId
  recipeDraft.value = recipe.ingredients.map(item => ({ ...item }))
}

function deleteRecipe(foodId) {
  if (!confirm('Bạn có chắc muốn xóa công thức món ăn này?')) return

  recipes.value = recipes.value.filter(
    item => item.foodId !== foodId
  )

  if (recipeFoodId.value === foodId) {
    recipeFoodId.value = ''
    recipeDraft.value = []
  }
}
watch(
  ingredients,
  (newIngredients) => {
    localStorage.setItem(
      'restaurantIngredients',
      JSON.stringify(newIngredients)
    )
  },
  { deep: true }
)


const keyword = ref('')
const filterStatus = ref('Tất cả')

const showForm = ref(false)
const editingId = ref(null)

const emptyForm = () => ({
  name: '',
  category: 'Rau củ',
  quantity: 0,
  unit: 'kg',
  minQuantity: 5,
  unitPrice: 0,
  supplier: ''
})

const form = ref(emptyForm())


const showStockModal = ref(false)
const selectedIngredient = ref(null)

const stockForm = ref({
  type: 'in',
  quantity: 1,
  note: ''
})

// Đọc lịch sử nhập xuất kho
function loadStockHistory() {
  try {
    const saved = localStorage.getItem('restaurantStockHistory')
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Lỗi đọc lịch sử kho:', error)
    return []
  }
}

const stockHistory = ref(loadStockHistory())
function refreshStockHistory() {
  stockHistory.value = loadStockHistory()
  ingredients.value = loadIngredients()
}

window.addEventListener('restaurantStockUpdated', refreshStockHistory)

onUnmounted(() => {
  window.removeEventListener('restaurantStockUpdated', refreshStockHistory)
})
watch(
  stockHistory,
  (newHistory) => {
    localStorage.setItem(
      'restaurantStockHistory',
      JSON.stringify(newHistory)
    )
  },
  { deep: true }
)


const getStatus = (item) => {
  return item.quantity <= item.minQuantity ? 'Sắp hết' : 'Còn hàng'
}

const filteredIngredients = computed(() => {
  return ingredients.value.filter(item => {
    const matchKeyword =
      item.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
      item.id.toLowerCase().includes(keyword.value.toLowerCase())

    const matchStatus =
      filterStatus.value === 'Tất cả' ||
      getStatus(item) === filterStatus.value

    return matchKeyword && matchStatus
  })
})

const lowStockCount = computed(() => {
  return ingredients.value.filter(
    item => item.quantity <= item.minQuantity
  ).length
})

const inventoryValue = computed(() => {
  return ingredients.value.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0
  )
})

const formatMoney = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

function openAddForm() {
  editingId.value = null
  form.value = emptyForm()
  showForm.value = true
}

function openEditForm(item) {
  editingId.value = item.id
  form.value = { ...item }
  showForm.value = true
}

function saveIngredient() {
  if (!form.value.name.trim()) {
    alert('Vui lòng nhập tên nguyên liệu!')
    return
  }

  if (
    form.value.quantity < 0 ||
    form.value.minQuantity < 0 ||
    form.value.unitPrice < 0
  ) {
    alert('Số lượng, định mức và đơn giá không được âm!')
    return
  }

  if (editingId.value) {
    const index = ingredients.value.findIndex(
      item => item.id === editingId.value
    )

    if (index !== -1) {
      ingredients.value[index] = {
        ...ingredients.value[index],
        ...form.value
      }
    }
  } else {
    const newId = 'NL' + String(
      Math.max(
        0,
        ...ingredients.value.map(item =>
          Number(item.id.replace('NL', '')) || 0
        )
      ) + 1
    ).padStart(3, '0')

    ingredients.value.push({
      id: newId,
      ...form.value
    })
  }

  showForm.value = false
}

function deleteIngredient(id) {
  if (confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) {
    ingredients.value = ingredients.value.filter(
      item => item.id !== id
    )
  }
}

function openStockModal(item, type) {
  selectedIngredient.value = item

  stockForm.value = {
    type,
    quantity: 1,
    note: ''
  }

  showStockModal.value = true
}

function saveStock() {
  const amount = Number(stockForm.value.quantity)

  if (!Number.isFinite(amount) || amount <= 0) {
    alert('Vui lòng nhập số lượng hợp lệ!')
    return
  }

  if (!selectedIngredient.value) return

  const ingredient = selectedIngredient.value

  if (
    stockForm.value.type === 'out' &&
    amount > ingredient.quantity
  ) {
    alert('Số lượng xuất vượt quá số lượng tồn kho!')
    return
  }

  const beforeQuantity = ingredient.quantity

  if (stockForm.value.type === 'in') {
    ingredient.quantity += amount
  } else {
    ingredient.quantity -= amount
  }

  stockHistory.value.unshift({
    id: 'GD' + Date.now(),
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    type: stockForm.value.type,
    quantity: amount,
    unit: ingredient.unit,
    beforeQuantity,
    afterQuantity: ingredient.quantity,
    note: stockForm.value.note.trim(),
    date: new Date().toISOString()
  })

  showStockModal.value = false
  selectedIngredient.value = null
}

</script>

<template>
  <div class="inventory-page">

    <div class="page-header">
      <div>
        <h1>Quản lý kho nguyên liệu</h1>
        <p>Theo dõi số lượng và tình trạng nguyên liệu trong nhà hàng</p>
      </div>

      <button class="btn-primary" @click="openAddForm">
        + Thêm nguyên liệu
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>Tổng số nguyên liệu</span>
        <h2>{{ ingredients.length }}</h2>
        <small>Loại nguyên liệu</small>
      </div>

      <div class="stat-card warning-card">
        <span>Nguyên liệu sắp hết</span>
        <h2>{{ lowStockCount }}</h2>
        <small>Cần kiểm tra và nhập thêm</small>
      </div>

      <div class="stat-card">
        <span>Giá trị tồn kho</span>
        <h2>{{ formatMoney(inventoryValue) }}</h2>
        <small>Tổng giá trị nguyên liệu</small>
      </div>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <input
          v-model="keyword"
          type="text"
          placeholder="Tìm theo mã hoặc tên nguyên liệu..."
        />

        <select v-model="filterStatus">
          <option>Tất cả</option>
          <option>Còn hàng</option>
          <option>Sắp hết</option>
        </select>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Mã NL</th>
              <th>Tên nguyên liệu</th>
              <th>Danh mục</th>
              <th>Số lượng</th>
              <th>Định mức</th>
              <th>Đơn giá</th>
              <th>Nhà cung cấp</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in filteredIngredients"
              :key="item.id"
            >
              <td>{{ item.id }}</td>
              <td class="item-name">{{ item.name }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.quantity }} {{ item.unit }}</td>
              <td>{{ item.minQuantity }} {{ item.unit }}</td>
              <td>{{ formatMoney(item.unitPrice) }}</td>
              <td>{{ item.supplier || '—' }}</td>

              <td>
                <span
                  :class="[
                    'status',
                    getStatus(item) === 'Còn hàng'
                      ? 'status-good'
                      : 'status-low'
                  ]"
                >
                  {{ getStatus(item) }}
                </span>
              </td>

              <td>
                <div class="actions">
                  <button
                    class="btn-in"
                    @click="openStockModal(item, 'in')"
                  >
                    Nhập
                  </button>

                  <button
                    class="btn-out"
                    @click="openStockModal(item, 'out')"
                  >
                    Xuất
                  </button>

                  <button
                    class="btn-edit"
                    @click="openEditForm(item)"
                  >
                    Sửa
                  </button>

                  <button
                    class="btn-delete"
                    @click="deleteIngredient(item.id)"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredIngredients.length === 0">
              <td colspan="9" class="empty">
                Không tìm thấy nguyên liệu phù hợp.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
<div class="content-card history-card">
  <div class="history-heading">
    <div>
      <h2>Lịch sử nhập xuất kho</h2>
      <p>Theo dõi các giao dịch nguyên liệu</p>
    </div>
    <span>{{ stockHistory.length }} giao dịch</span>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Thời gian</th>
          <th>Mã NL</th>
          <th>Nguyên liệu</th>
          <th>Loại giao dịch</th>
          <th>Số lượng</th>
          <th>Tồn trước</th>
          <th>Tồn sau</th>
          <th>Ghi chú</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in stockHistory" :key="item.id">
          <td>{{ new Date(item.date).toLocaleString('vi-VN') }}</td>
          <td>{{ item.ingredientId }}</td>
          <td>{{ item.ingredientName }}</td>
          <td>
            <span
              :class="item.type === 'in' ? 'status-good' : 'status-low'"
              class="status"
            >
              {{ item.type === 'in' ? 'Nhập kho' : 'Xuất kho' }}
            </span>
          </td>
          <td>{{ item.quantity }} {{ item.unit }}</td>
          <td>{{ item.beforeQuantity }} {{ item.unit }}</td>
          <td>{{ item.afterQuantity }} {{ item.unit }}</td>
          <td>{{ item.note || '—' }}</td>
        </tr>

        <tr v-if="stockHistory.length === 0">
          <td colspan="8" class="empty">
            Chưa có giao dịch nhập xuất kho.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<!-- QUẢN LÝ CÔNG THỨC MÓN ĂN -->
<div class="content-card recipe-card">
  <div class="history-heading">
    <div>
      <h2>Định lượng công thức món ăn</h2>
      <p>Khai báo lượng nguyên liệu cần dùng cho một phần ăn</p>
    </div>
    <span>{{ recipes.length }} công thức</span>
  </div>

  <div class="recipe-form">
    <div class="form-group">
      <label>Chọn món ăn</label>
      <select v-model="recipeFoodId" @change="selectRecipeFood">
        <option value="">-- Chọn món ăn --</option>
        <option
          v-for="food in menuItems"
          :key="food.id"
          :value="food.id"
        >
          {{ food.name }}
        </option>
      </select>
    </div>

    <div class="recipe-add-row">
      <div class="form-group">
        <label>Nguyên liệu</label>
        <select v-model="recipeIngredientId">
          <option value="">-- Chọn nguyên liệu --</option>
          <option
            v-for="ingredient in ingredients"
            :key="ingredient.id"
            :value="ingredient.id"
          >
            {{ ingredient.name }} ({{ ingredient.unit }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Định lượng / phần</label>
        <input
          v-model.number="recipeQuantity"
          type="number"
          min="0.001"
          step="0.001"
          placeholder="Ví dụ: 0.15"
        />
      </div>

      <button class="btn-primary recipe-add-btn" @click="addRecipeIngredient">
        + Thêm nguyên liệu
      </button>
    </div>

    <div v-if="recipeFoodId" class="recipe-draft">
      <h3>
        Công thức:
        {{ selectedRecipeFood?.name }}
      </h3>

      <table>
        <thead>
          <tr>
            <th>Nguyên liệu</th>
            <th>Định lượng cho 1 phần</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in recipeDraft"
            :key="item.ingredientId"
          >
            <td>{{ item.ingredientName }}</td>
            <td>{{ item.quantity }} {{ item.unit }}</td>
            <td>
              <button
                class="btn-delete"
                @click="removeRecipeIngredient(item.ingredientId)"
              >
                Xóa
              </button>
            </td>
          </tr>

          <tr v-if="recipeDraft.length === 0">
            <td colspan="3" class="empty">
              Chưa có nguyên liệu trong công thức.
            </td>
          </tr>
        </tbody>
      </table>

      <div class="recipe-save">
        <button class="btn-primary" @click="saveRecipe">
          Lưu công thức
        </button>
      </div>
    </div>
  </div>

  <div class="table-wrapper recipe-list">
    <h3>Danh sách công thức đã khai báo</h3>

    <table>
      <thead>
        <tr>
          <th>Mã món</th>
          <th>Tên món ăn</th>
          <th>Nguyên liệu sử dụng</th>
          <th>Thao tác</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="recipe in recipes" :key="recipe.foodId">
          <td>{{ recipe.foodId }}</td>
          <td class="item-name">{{ recipe.foodName }}</td>
          <td>
            <div
              v-for="item in recipe.ingredients"
              :key="item.ingredientId"
            >
              {{ item.ingredientName }}:
              {{ item.quantity }} {{ item.unit }}
            </div>
          </td>
          <td>
            <div class="actions">
              <button class="btn-edit" @click="editRecipe(recipe)">
                Sửa
              </button>
              <button
                class="btn-delete"
                @click="deleteRecipe(recipe.foodId)"
              >
                Xóa
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="recipes.length === 0">
          <td colspan="4" class="empty">
            Chưa có công thức. Hãy chọn món ăn và khai báo nguyên liệu.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Form thêm và chỉnh sửa nguyên liệu -->
<div v-if="showForm" class="modal-overlay">
  <div class="modal">
    <h2>
      {{ editingId ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới' }}
    </h2>

    <div class="form-grid">
      <div class="form-group full-width">
        <label>Tên nguyên liệu</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Nhập tên nguyên liệu"
        />
      </div>

      <div class="form-group">
        <label>Danh mục</label>
        <select v-model="form.category">
          <option>Rau củ</option>
          <option>Thịt</option>
          <option>Hải sản</option>
          <option>Ngũ cốc</option>
          <option>Gia vị</option>
          <option>Đồ uống</option>
          <option>Khác</option>
        </select>
      </div>

      <div class="form-group">
        <label>Số lượng tồn</label>
        <input
          v-model.number="form.quantity"
          type="number"
          min="0"
          placeholder="Nhập số lượng tồn"
        />
      </div>

      <div class="form-group">
        <label>Đơn vị tính</label>
        <select v-model="form.unit">
          <option>kg</option>
          <option>gram</option>
          <option>lít</option>
          <option>chai</option>
          <option>thùng</option>
          <option>cái</option>
        </select>
      </div>

      <div class="form-group">
        <label>Định mức tối thiểu</label>
        <input
          v-model.number="form.minQuantity"
          type="number"
          min="0"
          placeholder="Nhập định mức"
        />
      </div>

      <div class="form-group">
        <label>Đơn giá (VNĐ)</label>
        <input
          v-model.number="form.unitPrice"
          type="number"
          min="0"
          placeholder="Nhập đơn giá"
        />
      </div>

      <div class="form-group full-width">
        <label>Nhà cung cấp</label>
        <input
          v-model="form.supplier"
          type="text"
          placeholder="Nhập tên nhà cung cấp"
        />
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn-cancel" @click="showForm = false">
        Hủy
      </button>

      <button class="btn-primary" @click="saveIngredient">
        Lưu thông tin
      </button>
    </div>
  </div>
</div>

<!-- Form nhập kho / xuất kho -->
<div v-if="showStockModal" class="modal-overlay">
  <div class="modal stock-modal">
    <h2>
      {{ stockForm.type === 'in' ? 'Nhập kho' : 'Xuất kho' }}
    </h2>

    <p class="stock-description">
      Nguyên liệu:
      <strong>{{ selectedIngredient?.name }}</strong>
    </p>

    <p class="stock-description">
      Số lượng hiện tại:
      <strong>
        {{ selectedIngredient?.quantity }}
        {{ selectedIngredient?.unit }}
      </strong>
    </p>

    <div class="form-group">
      <label>Số lượng {{ stockForm.type === 'in' ? 'nhập' : 'xuất' }}</label>
      <input
        v-model.number="stockForm.quantity"
        type="number"
        min="1"
        placeholder="Nhập số lượng"
      />
    </div>

    <div class="form-group">
      <label>Ghi chú</label>
      <input
        v-model="stockForm.note"
        type="text"
        placeholder="Ví dụ: Nhập hàng từ nhà cung cấp..."
      />
    </div>

    <div class="modal-actions">
      <button
        class="btn-cancel"
        @click="showStockModal = false"
      >
        Hủy
      </button>

      <button class="btn-primary" @click="saveStock">
        Xác nhận
      </button>
    </div>
  </div>
</div>

  </div>
</template>

<style scoped>

.inventory-page {
  color: #25352d;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  gap: 15px;
}

.page-header h1 {
  margin: 0 0 7px;
  font-size: 25px;
}

.page-header p {
  color: #7b8980;
  margin: 0;
  font-size: 14px;
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
  padding: 20px;
  border: 1px solid #e2ece5;
  border-left: 4px solid #52a879;
}

.stat-card span {
  color: #718078;
  font-size: 14px;
}

.stat-card h2 {
  margin: 12px 0 5px;
  color: #237a50;
  font-size: 24px;
}

.stat-card small {
  color: #8a978e;
}

.warning-card {
  border-left-color: #e6a23c;
}

.warning-card h2 {
  color: #d18a22;
}

.content-card,
.history-card {
  background: white;
  border: 1px solid #e4ece6;
  padding: 20px;
  margin-top: 22px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.toolbar input {
  flex: 1;
}

.inventory-page input,
.inventory-page select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #bdcec2;
  border-radius: 3px;
  padding: 11px 12px;
  outline: none;
  background: #fff;
  color: #25352d;
  font-size: 14px;
}

.inventory-page input:focus,
.inventory-page select:focus {
  border-color: #237a50;
  box-shadow: 0 0 0 2px rgba(35, 122, 80, 0.12);
}

.toolbar select {
  width: 160px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1050px;
}

th {
  background: #f0f7f2;
  color: #365443;
  text-align: left;
  padding: 13px 10px;
  font-size: 13px;
  white-space: nowrap;
}

td {
  padding: 13px 10px;
  border-bottom: 1px solid #edf1ee;
  font-size: 13px;
}

.item-name {
  font-weight: 600;
  color: #237a50;
}

.status {
  display: inline-block;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-good {
  background: #e5f4e9;
  color: #237a50;
}

.status-low {
  background: #fff2dc;
  color: #b7791f;
}

.actions {
  display: flex;
  gap: 5px;
}

.actions button {
  border: none;
  padding: 7px 9px;
  cursor: pointer;
  font-size: 12px;
}

.btn-in {
  background: #e5f4e9;
  color: #237a50;
}

.btn-out {
  background: #fff2dc;
  color: #a66b16;
}

.btn-edit {
  background: #e8efff;
  color: #4166a8;
}

.btn-delete {
  background: #ffebeb;
  color: #c04444;
}

.empty {
  text-align: center;
  color: #89958d;
  padding: 25px;
}

/* Lớp phủ form */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 20, 14, 0.68);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}


/* Form thêm và chỉnh sửa */
.modal {
  background: #ffffff;
  color: #25352d;
  width: 95%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  box-sizing: border-box;
  border: 1px solid #dce8df;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
}

.modal h2 {
  margin: 0 0 25px;
  color: #185c3b;
  font-size: 23px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 22px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 8px;
  min-width: 0;
}

.form-group label {
  font-size: 15px;
  font-weight: 700;
  color: #344b3c;
}

.modal .form-group input,
.modal .form-group select {
  display: block;
  width: 100%;
  height: 52px;
  box-sizing: border-box;
  padding: 12px 15px;
  font-size: 16px;
  color: #25352d;
  background: #ffffff;
  border: 1.5px solid #aebfb3;
  border-radius: 4px;
}

.modal .form-group input:focus,
.modal .form-group select:focus {
  outline: none;
  border-color: #237a50;
  box-shadow: 0 0 0 3px rgba(35, 122, 80, 0.15);
}

.modal .form-group input::placeholder {
  color: #89958d;
  font-size: 14px;
}

.full-width {
  grid-column: 1 / -1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
}

.modal-actions button {
  min-width: 120px;
  min-height: 46px;
  padding: 10px 18px;
  cursor: pointer;
  border: none;
  font-size: 15px;
  font-weight: 600;
}

.stock-modal {
  max-width: 480px;
}

@media (max-width: 650px) {
  .modal {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}


@media (max-width: 650px) {
  .modal {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
  
/* Làm lớn các ô nhập thông tin nguyên liệu */
.modal .form-group input,
.modal .form-group select,
.modal .form-group textarea {
  display: block;
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  box-sizing: border-box;
  font-size: 16px;
  color: #25352d;
  background: #ffffff;
  border: 1.5px solid #aebfb3;
  border-radius: 4px;
}

/* Nhãn tên trường */
.modal .form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 700;
  color: #25352d;
}

/* Khi bấm vào ô nhập */
.modal .form-group input:focus,
.modal .form-group select:focus,
.modal .form-group textarea:focus {
  outline: none;
  border-color: #237a50;
  box-shadow: 0 0 0 3px rgba(35, 122, 80, 0.15);
}

/* Chữ gợi ý trong ô nhập */
.modal .form-group input::placeholder {
  color: #89958d;
  font-size: 14px;
}
/* QUẢN LÝ CÔNG THỨC */
.recipe-card {
  margin-top: 22px;
}

.history-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.history-heading h2 {
  margin: 0 0 7px;
  color: #185c3b;
  font-size: 20px;
}

.history-heading p {
  margin: 0;
  color: #7b8980;
  font-size: 13px;
}

.history-heading > span {
  color: #237a50;
  background: #e5f4e9;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
}

.recipe-form {
  background: #f7faf7;
  border: 1px solid #e2ece5;
  padding: 18px;
  margin-bottom: 25px;
}

.recipe-add-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: end;
  gap: 15px;
}

.recipe-add-btn {
  height: 43px;
  margin-bottom: 8px;
  white-space: nowrap;
}

.recipe-draft {
  margin-top: 20px;
  background: white;
  padding: 15px;
  border: 1px solid #e2ece5;
}

.recipe-draft h3,
.recipe-list h3 {
  color: #237a50;
  font-size: 16px;
  margin: 0 0 15px;
}

.recipe-save {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}

.recipe-list {
  margin-top: 20px;
}

.recipe-list table {
  min-width: 700px;
}

.recipe-list td {
  line-height: 1.8;
}

@media (max-width: 750px) {
  .recipe-add-row {
    grid-template-columns: 1fr;
  }

  .recipe-add-btn {
    width: 100%;
    margin-bottom: 0;
  }

  .history-heading {
    align-items: flex-start;
  }
}
}
</style>
