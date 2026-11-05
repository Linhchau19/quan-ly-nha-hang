import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue'
import TongQuan from '../views/TongQuan.vue'
import QuanLyBan from '../views/QuanLyBan.vue'
import DatBan from '../views/DatBan.vue'
import GoiMon from '../views/GoiMon.vue'
import ThucDon from '../views/ThucDon.vue'
import HoaDon from '../views/HoaDon.vue'
import KhachHang from '../views/KhachHang.vue'
import NhanVien from '../views/NhanVien.vue'
import KhoNguyenLieu from '../views/KhoNguyenLieu.vue'
import BaoCao from '../views/BaoCao.vue'
import CaiDat from '../views/CaiDat.vue'
import AISuggestion from '../views/AISuggestion.vue'

const routes = [
  {
    path: '/',
    component: Dashboard,
    redirect: '/tong-quan',
    children: [
      { path: 'tong-quan', component: TongQuan },
      { path: 'quan-ly-ban', component: QuanLyBan },
      { path: 'dat-ban', component: DatBan },
      { path: 'goi-mon', component: GoiMon },
      { path: 'thuc-don', component: ThucDon,
         meta: { title: 'Quản lý thực đơn' }
       },
      { path: 'hoa-don', component: HoaDon },
      { path: 'khach-hang', component: KhachHang },
      { path: 'nhan-vien', component: NhanVien },
      { path: 'kho-nguyen-lieu', component: KhoNguyenLieu },
      { path: 'bao-cao', component: BaoCao },
      { path: 'cai-dat', component: CaiDat },
      { path: 'ai-suggestion', component: AISuggestion }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router