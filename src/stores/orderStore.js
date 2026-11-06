
import { defineStore } from 'pinia'

function loadOrders() {
  try {
    const saved = localStorage.getItem('restaurantOrders')

    if (saved && saved !== 'undefined') {
      const parsed = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        return parsed.map(order => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
          stockDeducted: order.stockDeducted === true
        }))
      }
    }
  } catch (error) {
    console.error('Lỗi đọc đơn hàng:', error)
  }

  return [
    {
      id: 'GM001',
      table: 'Bàn 01',
      items: [
        {
          foodId: 'MA001',
          name: 'Cơm chiên hải sản',
          price: 65000,
          quantity: 2
        },
        {
          foodId: 'MA020',
          name: 'Trà đào cam sả',
          price: 40000,
          quantity: 2
        }
      ],
      status: 'Đang chế biến',
      time: '18:30',
      stockDeducted: false
    },
    {
      id: 'GM002',
      table: 'Bàn 03',
      items: [
        {
          foodId: 'MA007',
          name: 'Phở bò',
          price: 55000,
          quantity: 2
        }
      ],
      status: 'Chờ xác nhận',
      time: '18:45',
      stockDeducted: false
    }
  ]
}

function loadArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Lỗi đọc ${key}:`, error)
    return []
  }
}

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: loadOrders()
  }),

  getters: {
    totalOrders: state => state.orders.length,

    totalPrice: state => {
      return state.orders.reduce((total, order) => {
        if (order.status === 'Đã hủy') return total

        const items = Array.isArray(order.items) ? order.items : []

        return total + items.reduce((sum, item) => {
          return sum +
            Number(item.price || 0) *
            Number(item.quantity || 0)
        }, 0)
      }, 0)
    },

    pendingOrders: state =>
      state.orders.filter(
        order => order.status === 'Chờ xác nhận'
      ).length,

    confirmedOrders: state =>
      state.orders.filter(
        order => order.status === 'Đã xác nhận'
      ).length,

    cookingOrders: state =>
      state.orders.filter(
        order => order.status === 'Đang chế biến'
      ).length
  },

  actions: {
    addFood(table, food, quantity) {
      if (!table || !food || !quantity || quantity < 1) return

      const order = this.orders.find(item =>
  item.table === table &&
  !['Đã phục vụ', 'Đã hủy', 'Đã xuất hóa đơn'].includes(item.status)
)


      let currentOrder = order

      if (!currentOrder) {
        currentOrder = {
          id: 'GM' + String(Date.now()).slice(-6),
          table,
          items: [],
          status: 'Chờ xác nhận',
          time: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          stockDeducted: false
        }

        this.orders.unshift(currentOrder)
      }

      const existingFood = currentOrder.items.find(
        item => item.foodId === food.id
      )

      if (existingFood) {
        existingFood.quantity += Number(quantity)
      } else {
        currentOrder.items.push({
          foodId: food.id,
          name: food.name,
          price: Number(food.price),
          quantity: Number(quantity)
        })
      }
    },

    // Kiểm tra và trừ nguyên liệu khi phục vụ
    deductStock(order) {
      if (order.stockDeducted) {
        return {
          success: false,
          message: 'Đơn hàng này đã được trừ kho trước đó!'
        }
      }

      const ingredients = loadArray('restaurantIngredients')
      const recipes = loadArray('restaurantRecipes')
      let history = loadArray('restaurantStockHistory')

      if (!ingredients.length) {
        return {
          success: false,
          message: 'Không tìm thấy dữ liệu kho nguyên liệu!'
        }
      }

      const requirements = {}

      // Tổng hợp nguyên liệu cần dùng cho toàn bộ đơn hàng
      for (const food of order.items) {
        const recipe = recipes.find(
          item => item.foodId === food.foodId
        )

        if (!recipe || !Array.isArray(recipe.ingredients) ||
            recipe.ingredients.length === 0) {
          return {
            success: false,
            message: `Món "${food.name}" chưa có công thức. Hãy khai báo trong Kho nguyên liệu!`
          }
        }

        for (const detail of recipe.ingredients) {
          const amount = Number(detail.quantity) * Number(food.quantity)

          if (!Number.isFinite(amount) || amount <= 0) {
            return {
              success: false,
              message: `Định lượng nguyên liệu của món "${food.name}" không hợp lệ!`
            }
          }

          if (!requirements[detail.ingredientId]) {
            requirements[detail.ingredientId] = {
              quantity: 0,
              foods: []
            }
          }

          requirements[detail.ingredientId].quantity += amount
          requirements[detail.ingredientId].foods.push(food.name)
        }
      }

      // Kiểm tra toàn bộ kho trước khi trừ
      for (const [ingredientId, required] of Object.entries(requirements)) {
        const ingredient = ingredients.find(
          item => item.id === ingredientId
        )

        if (!ingredient) {
          return {
            success: false,
            message: `Không tìm thấy nguyên liệu mã ${ingredientId}!`
          }
        }

        if (Number(ingredient.quantity) < required.quantity) {
          return {
            success: false,
            message:
              `Không đủ ${ingredient.name}! ` +
              `Cần ${required.quantity} ${ingredient.unit}, ` +
              `hiện còn ${ingredient.quantity} ${ingredient.unit}.`
          }
        }
      }

      // Chỉ trừ khi tất cả nguyên liệu đều đủ
      for (const [ingredientId, required] of Object.entries(requirements)) {
        const ingredient = ingredients.find(
          item => item.id === ingredientId
        )

        const beforeQuantity = Number(ingredient.quantity)
        ingredient.quantity = beforeQuantity - required.quantity

        history.unshift({
          id: 'GD' + Date.now() + Math.random().toString(36).slice(2, 6),
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          type: 'out',
          quantity: required.quantity,
          unit: ingredient.unit,
          beforeQuantity,
          afterQuantity: ingredient.quantity,
          note: `Xuất nguyên liệu phục vụ đơn ${order.id}`,
          orderId: order.id,
          foodName: [...new Set(required.foods)].join(', '),
          date: new Date().toISOString()
        })
      }

      localStorage.setItem(
        'restaurantIngredients',
        JSON.stringify(ingredients)
      )

      localStorage.setItem(
        'restaurantStockHistory',
        JSON.stringify(history)
      )

      order.stockDeducted = true

      window.dispatchEvent(new Event('restaurantStockUpdated'))

      return {
        success: true,
        message: 'Đã xuất nguyên liệu khỏi kho thành công!'
      }
    },
updateStatus(orderId) {
  const order = this.orders.find(item => item.id === orderId)

  if (!order) {
    return false
  }

  if (order.status === 'Chờ xác nhận') {
    order.status = 'Đã xác nhận'
    return true
  }

  if (order.status === 'Đã xác nhận') {
    order.status = 'Đang chế biến'
    return true
  }

  if (order.status === 'Đang chế biến') {
    const result = this.deductStock(order)

    if (!result.success) {
      alert(result.message)
      return false
    }

    order.status = 'Đã phục vụ'
    alert(result.message)
    return true
  }

  return false
},
    cancelOrder(orderId) {
      const order = this.orders.find(
        item => item.id === orderId
      )

      if (!order) return

      if (
        order.status === 'Đã phục vụ' ||
        order.status === 'Đã hủy'
      ) {
        return
      }

      order.status = 'Đã hủy'
    },

    removeOrder(orderId) {
      this.orders = this.orders.filter(
        order => order.id !== orderId
      )
    }
  }
})
