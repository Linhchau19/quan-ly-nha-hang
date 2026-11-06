
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const createDefaultTables = () =>
  Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    name: `Bàn ${String(index + 1).padStart(2, '0')}`,
    area: index < 8 ? 'Tầng 1' : index < 15 ? 'Tầng 2' : 'Sân vườn',
    seats: [4, 6, 4, 8][index % 4],
    status: ['Trống', 'Đang phục vụ', 'Đã đặt', 'Trống'][index % 4]
  }))

export const useTableStore = defineStore('table', () => {

  // Đọc dữ liệu đã lưu
  const savedTables = localStorage.getItem('restaurant_tables')

  const tables = ref(
    savedTables ? JSON.parse(savedTables) : createDefaultTables()
  )

  // Tự động lưu mỗi khi danh sách bàn thay đổi
  watch(
    tables,
    (newTables) => {
      localStorage.setItem(
        'restaurant_tables',
        JSON.stringify(newTables)
      )
    },
    { deep: true }
  )

  const totalTables = computed(() => tables.value.length)

  const emptyTables = computed(() =>
    tables.value.filter(t => t.status === 'Trống').length
  )

  const bookedTables = computed(() =>
    tables.value.filter(t => t.status === 'Đã đặt').length
  )

  const servingTables = computed(() =>
    tables.value.filter(t => t.status === 'Đang phục vụ').length
  )

  function addTable() {
    const nextId = tables.value.length
      ? Math.max(...tables.value.map(t => t.id)) + 1
      : 1

    tables.value.push({
      id: nextId,
      name: `Bàn ${String(nextId).padStart(2, '0')}`,
      area: 'Tầng 1',
      seats: 4,
      status: 'Trống'
    })
  }

  function deleteTable(id) {
    tables.value = tables.value.filter(t => t.id !== id)
  }

  return {
    tables,
    totalTables,
    emptyTables,
    bookedTables,
    servingTables,
    addTable,
    deleteTable
  }
})
