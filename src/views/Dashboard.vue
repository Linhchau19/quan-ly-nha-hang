<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất không?')

  if (!confirmed) return

  localStorage.removeItem('restaurantUser')
  sessionStorage.removeItem('restaurantUser')

  router.push('/login')
}
const currentUser = ref({
  name: 'Nhân viên',
  role: 'Nhân viên'
})

onMounted(() => {
  const savedUser =
    localStorage.getItem('restaurantUser') ||
    sessionStorage.getItem('restaurantUser')

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser)

      currentUser.value = {
        name: user.name || user.fullName || user.username || 'Nhân viên',
        role: user.role || user.position || 'Nhân viên'
      }
    } catch (error) {
      console.error('Lỗi đọc thông tin tài khoản:', error)
    }
  }
})

</script>


<template>
  <div class="dashboard">
    <aside class="sidebar">
      <h2>🍴 Nhà Hàng</h2>
      <p class="subtitle">GREEN FOOD</p>

      <nav>
        <RouterLink to="/tong-quan">Tổng quan</RouterLink>
        <RouterLink to="/quan-ly-ban">Quản lý bàn</RouterLink>
        <RouterLink to="/dat-ban">Đặt bàn</RouterLink>
        <RouterLink to="/thuc-don">Quản lý thực đơn</RouterLink>
        <RouterLink to="/goi-mon">Quản lý gọi món</RouterLink>
        <RouterLink to="/hoa-don">Hóa đơn</RouterLink>
        <RouterLink to="/khach-hang">Khách hàng</RouterLink>
        <RouterLink to="/nhan-vien">Nhân viên</RouterLink>
        <RouterLink to="/kho-nguyen-lieu">Kho nguyên liệu</RouterLink>
        <RouterLink to="/bao-cao">Báo cáo thống kê</RouterLink>
        <RouterLink to="/cai-dat">Cài đặt hệ thống</RouterLink>
        <RouterLink to="/ai-suggestion">✨ AI Suggestion</RouterLink>
      </nav>

      <div class="user">
        <div class="avatar">
          {{ currentUser.name?.charAt(0).toUpperCase() || 'N' }}
        </div>

        <div class="user-info">
          <strong>{{ currentUser.name || 'Nhân viên' }}</strong>
          <small>{{ currentUser.role || 'Nhân viên' }}</small>
        </div>

        <button class="logout-btn" @click="logout">
          <span>↪</span>
          Đăng xuất
        </button>
      </div>
    </aside>

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  background: #F0F7F2;
  color: #1F2937;
  font-family: Arial, sans-serif;
}

/* THANH CÔNG CỤ */
.sidebar {
  width: 250px;
  min-width: 250px;
  background: #111827;
  color: #FFFFFF;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
}

.logo {
  color: #FFFFFF;
  font-size: 23px;
  font-weight: bold;
  margin-bottom: 40px;
}


/* MENU BÊN TRÁI */
nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 0 -20px;
}

nav a {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 15px 25px;
  color: #AEB9C8;
  text-decoration: none;
  border-radius: 0;
  border-left: 4px solid transparent;
  background: transparent;
  transition: all 0.3s ease;
}

/* Khi di chuột vào */
nav a:hover {
  color: #FFFFFF;
  background: #1F2937;
  border-left-color: #52A879;
  padding-left: 32px;
}

/* Menu đang được chọn */
nav a.router-link-active {
  color: #FFFFFF;
  background: linear-gradient(
    90deg,
    rgba(35, 122, 80, 0.95),
    rgba(35, 122, 80, 0.45)
  );
  border-left: 4px solid #52A879;
  font-weight: bold;
  box-shadow: inset 0 0 15px rgba(82, 168, 121, 0.12);
}

/* Hiệu ứng khi nhấp */
nav a:active {
  background: #185C3B;
  transform: scale(0.98);
}


/* THÔNG TIN ADMIN */
.user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 25px;
  border-top: 1px solid #374151;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #237A50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info strong {
  display: block;
  color: white;
  font-size: 14px;
}

.user-info small {
  display: block;
  margin-top: 5px;
  color: #9CA3AF;
  font-size: 11px;
}

.logout {
  flex-shrink: 0;
  padding: 8px 10px;
  border: 1px solid #4B5563;
  border-radius: 7px;
  background: #1F2937;
  color: white;
  font-size: 11px;
  cursor: pointer;
  transition: 0.25s;
}

.logout:hover {
  background: #237A50;
  border-color: #237A50;
}

/* KHU VỰC NỘI DUNG */
.main {
  flex: 1;
  min-width: 0;
  max-width: 1450px;
  width: 100%;
  margin: 0 auto;
  padding: 35px 45px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.topbar h1 {
  color: #111827;
  font-size: 27px;
  margin: 0;
}

/* THẺ THỐNG KÊ */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #FFFFFF;
  padding: 23px;
  border-radius: 14px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 15px rgba(17, 24, 39, 0.05);
}

.stat-card h3 {
  color: #64748B;
  font-size: 14px;
  font-weight: normal;
  margin: 0 0 14px;
}

.stat-card p {
  color: #237A50;
  font-size: 25px;
  font-weight: bold;
  margin: 0;
}

/* KHUNG NỘI DUNG */
.content-card {
  max-width: 1150px;
  margin: 0 auto;
  background: #FFFFFF;
  padding: 25px;
  border-radius: 14px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 15px rgba(17, 24, 39, 0.05);
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
  font-size: 20px;
  margin: 0;
}

input {
  padding: 11px 14px;
  border: 1px solid #D1DED5;
  border-radius: 8px;
  outline: none;
  background: #F8FBF9;
  color: #1F2937;
}

input:focus {
  border-color: #52A879;
  box-shadow: 0 0 0 3px rgba(82, 168, 121, 0.12);
}

/* DANH SÁCH BÀN */
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
  transition: 0.25s;
}

.table-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(17, 24, 39, 0.08);
}

.table-card h3 {
  color: #111827;
  margin: 0 0 12px;
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

/* RESPONSIVE */
@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main {
    padding: 25px;
  }
}

@media (max-width: 650px) {
  .dashboard {
    flex-direction: column;
  }

  .sidebar {
    width: auto;
    min-width: 0;
  }

  .main {
    padding: 20px 15px;
  }

  .stats,
  .table-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* ===== ĐIỀU CHỈNH GIAO DIỆN TỔNG QUAN ===== */

/* 5 thẻ thống kê trên 1 hàng */
:deep(.stats) {
  display: grid !important;
  grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  gap: 16px;
  width: 100%;
}

/* 4 bàn ăn trên 1 hàng */
:deep(.table-grid) {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 18px;
  width: 100%;
}

/* Màn hình vừa */
@media (max-width: 1200px) {
  :deep(.stats) {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }

  :deep(.table-grid) {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
}

/* Màn hình nhỏ */
@media (max-width: 768px) {
  :deep(.stats),
  :deep(.table-grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 480px) {
  :deep(.stats),
  :deep(.table-grid) {
    grid-template-columns: 1fr !important;
  }
}

</style>