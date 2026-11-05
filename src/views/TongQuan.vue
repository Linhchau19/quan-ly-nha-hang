<script setup>
import { ref, computed } from 'vue'

const keyword = ref('')

const stats = [
  { title: 'Tổng số bàn', value: 20 },
  { title: 'Bàn đang phục vụ', value: 8 },
  { title: 'Bàn còn trống', value: 10 },
  { title: 'Doanh thu hôm nay', value: '5.250.000đ' }
]

const tables = ref([
  { id: 1, name: 'Bàn 01', seats: 4, status: 'Đang phục vụ' },
  { id: 2, name: 'Bàn 02', seats: 2, status: 'Trống' },
  { id: 3, name: 'Bàn 03', seats: 6, status: 'Đã đặt' },
  { id: 4, name: 'Bàn 04', seats: 4, status: 'Trống' },
  { id: 5, name: 'Bàn 05', seats: 4, status: 'Đang phục vụ' },
  { id: 6, name: 'Bàn 06', seats: 2, status: 'Trống' }
])

const filteredTables = computed(() =>
  tables.value.filter(table =>
    table.name.toLowerCase().includes(keyword.value.toLowerCase())
  )
)
</script>

<template>
  <div class="overview">
    <header class="topbar">
      <div>
        <h1>Tổng quan</h1>
        <p>Chào mừng bạn đến với hệ thống quản lý nhà hàng.</p>
      </div>
    </header>

    <section class="stats">
      <div
        v-for="item in stats"
        :key="item.title"
        class="stat-card"
      >
        <p>{{ item.title }}</p>
        <h2>{{ item.value }}</h2>
      </div>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h2>Trạng thái bàn ăn</h2>
          <p>Theo dõi tình trạng bàn trong nhà hàng</p>
        </div>

        <input
          v-model="keyword"
          placeholder="Tìm kiếm bàn..."
        />
      </div>

      <div class="table-grid">
        <div
          v-for="table in filteredTables"
          :key="table.id"
          class="table-card"
        >
          <h3>{{ table.name }}</h3>
          <p>👥 {{ table.seats }} người</p>

          <span
            class="status"
            :class="{
              empty: table.status === 'Trống',
              serving: table.status === 'Đang phục vụ',
              booked: table.status === 'Đã đặt'
            }"
          >
            {{ table.status }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview {
  color: #1F2937;
}

.topbar {
  margin-bottom: 30px;
}

.topbar h1 {
  color: #111827;
  font-size: 27px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card,
.content-card {
  background: white;
  padding: 23px;
  border-radius: 14px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 15px rgba(17, 24, 39, 0.05);
}

.stat-card p {
  color: #64748B;
}

.stat-card h2 {
  color: #237A50;
}

.content-card {
  max-width: 1150px;
  margin: auto;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 22px;
}

.section-heading h2 {
  color: #111827;
}

.section-heading input {
  padding: 11px 14px;
  border: 1px solid #D1DED5;
  border-radius: 8px;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.table-card {
  background: #F8FBF9;
  border: 1px solid #E2EDE5;
  border-radius: 12px;
  padding: 20px;
}

.status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status.empty {
  background: #DCFCE7;
  color: #166534;
}

.status.serving {
  background: #FEF3C7;
  color: #92400E;
}

.status.booked {
  background: #DBEAFE;
  color: #1D4ED8;
}

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .stats,
  .table-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>