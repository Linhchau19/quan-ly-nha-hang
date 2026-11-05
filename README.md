# quan-ly-nha-hang

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

<script setup>
import { ref, computed } from 'vue'

const keyword = ref('')

const stats = [
  { title: 'Tổng số bàn', value: 20, icon: '🪑' },
  { title: 'Bàn đang phục vụ', value: 8, icon: '🍽️' },
  { title: 'Bàn còn trống', value: 10, icon: '✅' },
  { title: 'Doanh thu hôm nay', value: '5.250.000đ', icon: '💰' }
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
  <div class="dashboard">
    <aside class="sidebar">
      <h2>🍴 Nhà Hàng</h2>
      <p class="subtitle">RESTAURANT MANAGEMENT</p>

      <nav>
        <a class="active" href="#">🏠 Tổng quan</a>
        <a href="#">🪑 Quản lý bàn</a>
        <a href="#">🍜 Quản lý món ăn</a>
        <a href="#">📅 Đặt bàn</a>
        <a href="#">📝 Gọi món</a>
        <a href="#">🧾 Hóa đơn</a>
        <a href="#">📊 Doanh thu</a>
      </nav>

      <div class="user">
        <div class="avatar">A</div>
        <div>
          <strong>Admin</strong>
          <small>Quản trị viên</small>
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <h1>Tổng quan</h1>
          <p>Chào mừng bạn đến với hệ thống quản lý nhà hàng.</p>
        </div>
        <button class="logout">Đăng xuất</button>
      </header>

      <section class="stats">
        <div v-for="item in stats" :key="item.title" class="stat-card">
          <div>
            <p>{{ item.title }}</p>
            <h2>{{ item.value }}</h2>
          </div>
          <span class="stat-icon">{{ item.icon }}</span>
        </div>
      </section>

      <section class="content-card">
        <div class="section-heading">
          <div>
            <h2>Trạng thái bàn ăn</h2>
            <p>Theo dõi tình trạng bàn trong nhà hàng</p>
          </div>

          <input v-model="keyword" placeholder="Tìm kiếm bàn..." />
        </div>

        <div class="table-grid">
          <div v-for="table in filteredTables" :key="table.id" class="table-card">
            <h3>{{ table.name }}</h3>
            <p>👥 {{ table.seats }} người</p>

            <span class="status" :class="{
              empty: table.status === 'Trống',
              serving: table.status === 'Đang phục vụ',
              booked: table.status === 'Đã đặt'
            }">
              {{ table.status }}
            </span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.dashboard {
  min-height: 100vh;
  display: flex;
  background: #f4f6fb;
  color: #253047;
  font-family: Arial, sans-serif;
}

.sidebar {
  width: 250px;
  background: #172554;
  color: white;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
}

.sidebar h2 {
  margin: 0;
}

.subtitle {
  font-size: 10px;
  color: #a5b4fc;
  letter-spacing: 1px;
  margin-bottom: 35px;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

nav a {
  padding: 13px;
  border-radius: 9px;
  color: #cbd5e1;
  text-decoration: none;
}

nav a:hover,
nav a.active {
  background: #334b89;
  color: white;
}

.user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 30px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #818cf8;
  display: grid;
  place-items: center;
}

.user small {
  display: block;
  color: #cbd5e1;
  margin-top: 4px;
}

.main {
  flex: 1;
  padding: 32px;
  min-width: 0;
}

.topbar,
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.topbar h1 {
  margin: 0 0 8px;
}

.topbar p,
.section-heading p {
  color: #8490a5;
}

.logout {
  border: 0;
  background: #172554;
  color: white;
  padding: 11px 18px;
  border-radius: 8px;
  cursor: pointer;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin: 28px 0;
}

.stat-card,
.content-card {
  background: white;
  padding: 22px;
  border-radius: 14px;
  box-shadow: 0 3px 15px #1725540c;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card p {
  color: #8490a5;
  font-size: 14px;
}

.stat-card h2 {
  margin-bottom: 0;
}

.stat-icon {
  font-size: 28px;
}

.section-heading input {
  padding: 11px 14px;
  border: 1px solid #dce2ec;
  border-radius: 8px;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 25px;
}

.table-card {
  border: 1px solid #e8edf5;
  padding: 20px;
  border-radius: 12px;
}

.table-card h3 {
  margin-top: 0;
}

.table-card p {
  color: #8490a5;
}

.status {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 20px;
  font-size: 12px;
}

.empty {
  background: #dcfce7;
  color: #15803d;
}

.serving {
  background: #ffedd5;
  color: #c2410c;
}

.booked {
  background: #dbeafe;
  color: #1d4ed8;
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .sidebar {
    width: 75px;
    padding: 20px 8px;
  }

  .sidebar h2,
  .sidebar .subtitle,
  .sidebar nav a,
  .user div:not(.avatar) {
    font-size: 0;
  }

  .main {
    padding: 18px;
  }

  .stats,
  .table-grid {
    grid-template-columns: 1fr;
  }
}
</style>

