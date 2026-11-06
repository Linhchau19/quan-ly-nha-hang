
import { defineStore } from 'pinia'

function loadOrders() {
  try {
    const saved = localStorage.getItem('restaurantOrders')

    if (saved && saved !== 'undefined') {
      const parsed = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        return parsed
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
      time: '18:30'
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
      time: '18:45'
    }
  ]
}

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: loadOrders()
    
  }),

  getters: {
    totalOrders: (state) => state.orders.length,

    totalPrice: (state) => {
      return state.orders.reduce((total, order) => {
        if (order.status === 'Đã hủy') return total

        return total + order.items.reduce((sum, item) => {
          return sum + item.price * item.quantity
        }, 0)
      }, 0)
    },

    pendingOrders: (state) =>
      state.orders.filter(
        order => order.status === 'Chờ xác nhận'
      ).length,
      confirmedOrders: (state) =>
  state.orders.filter(
    order => order.status === 'Đã xác nhận'
  ).length,

    cookingOrders: (state) =>
      state.orders.filter(
        order => order.status === 'Đang chế biến'
      ).length
  },
      
  actions: {
    addFood(table, food, quantity) {
      let order = this.orders.find(
        item =>
          item.table === table &&
          item.status !== 'Đã phục vụ' &&
          item.status !== 'Đã hủy'
      )

      if (!order) {
        order = {
          id: 'GM' + String(Date.now()).slice(-6),
          table,
          items: [],
          status: 'Chờ xác nhận',
          time: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }

        this.orders.unshift(order)
      }

      const existingFood = order.items.find(
        item => item.foodId === food.id
      )

      if (existingFood) {
        existingFood.quantity += quantity
      } else {
        order.items.push({
          foodId: food.id,
          name: food.name,
          price: food.price,
          quantity
        })
      }
    },

   updateStatus(orderId) {
  const order = this.orders.find(
    item => item.id === orderId
  )

  if (!order) return

  if (order.status === 'Chờ xác nhận') {
    order.status = 'Đã xác nhận'
  } else if (order.status === 'Đã xác nhận') {
    order.status = 'Đang chế biến'
  } else if (order.status === 'Đang chế biến') {
    order.status = 'Đã phục vụ'
  }
}
  }

})
