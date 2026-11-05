
<script setup>
import { ref } from 'vue'

const settings = ref({
  restaurantName: 'Nhà hàng Green Food',
  address: '123 Nguyễn Văn Trỗi, Phú Nhuận, TP. Hồ Chí Minh',
  phone: '0901234567',
  email: 'greenfood@gmail.com',
  tax: 8,
  serviceFee: 5,
  currency: 'VND',
  openingTime: '08:00',
  closingTime: '22:00',
  maxTables: 20
})

const saved = ref(false)

function saveSettings() {
  if (!settings.value.restaurantName.trim()) {
    alert('Vui lòng nhập tên nhà hàng!')
    return
  }

  if (
    settings.value.tax < 0 ||
    settings.value.serviceFee < 0 ||
    settings.value.maxTables < 1
  ) {
    alert('Vui lòng kiểm tra lại các thông số!')
    return
  }

  // Lưu cấu hình tạm thời trên trình duyệt
  localStorage.setItem(
    'restaurantSettings',
    JSON.stringify(settings.value)
  )

  saved.value = true
  alert('Đã lưu cài đặt thành công!')
}

function resetSettings() {
  if (confirm('Bạn có chắc chắn muốn khôi phục cài đặt mặc định?')) {
    settings.value = {
      restaurantName: 'Nhà hàng Green Food',
      address: '123 Nguyễn Văn Trỗi, Phú Nhuận, TP. Hồ Chí Minh',
      phone: '0901234567',
      email: 'greenfood@gmail.com',
      tax: 8,
      serviceFee: 5,
      currency: 'VND',
      openingTime: '08:00',
      closingTime: '22:00',
      maxTables: 20
    }

    localStorage.removeItem('restaurantSettings')
    saved.value = false
  }
}
</script>

<template>
  <div class="settings-page">

    <div class="page-header">
      <div>
        <h1>Cài đặt hệ thống</h1>
        <p>Quản lý thông tin và cấu hình hoạt động nhà hàng</p>
      </div>

      <span class="settings-label">⚙ Cấu hình hệ thống</span>
    </div>

    <!-- Thông tin nhà hàng -->
    <section class="settings-card">
      <div class="section-title">
        <div class="section-icon">🏠</div>
        <div>
          <h2>Thông tin nhà hàng</h2>
          <p>Cập nhật thông tin cơ bản của nhà hàng</p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Tên nhà hàng</label>
          <input v-model="settings.restaurantName" type="text" />
        </div>

        <div class="form-group">
          <label>Số điện thoại</label>
          <input v-model="settings.phone" type="tel" />
        </div>

        <div class="form-group full-width">
          <label>Địa chỉ</label>
          <input v-model="settings.address" type="text" />
        </div>

        <div class="form-group full-width">
          <label>Email</label>
          <input v-model="settings.email" type="email" />
        </div>
      </div>
    </section>

    <!-- Thiết lập hóa đơn -->
    <section class="settings-card">
      <div class="section-title">
        <div class="section-icon">🧾</div>
        <div>
          <h2>Thiết lập hóa đơn</h2>
          <p>Cấu hình thuế và phí áp dụng khi thanh toán</p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Thuế VAT (%)</label>
          <input
            v-model.number="settings.tax"
            type="number"
            min="0"
            max="100"
          />
          <small>Thuế giá trị gia tăng áp dụng cho hóa đơn</small>
        </div>

        <div class="form-group">
          <label>Phí dịch vụ (%)</label>
          <input
            v-model.number="settings.serviceFee"
            type="number"
            min="0"
            max="100"
          />
          <small>Phí dịch vụ tính trên giá trị món ăn</small>
        </div>

        <div class="form-group">
          <label>Đơn vị tiền tệ</label>
          <select v-model="settings.currency">
            <option value="VND">Việt Nam Đồng (VND)</option>
            <option value="USD">Đô la Mỹ (USD)</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Thiết lập hoạt động -->
    <section class="settings-card">
      <div class="section-title">
        <div class="section-icon">🕒</div>
        <div>
          <h2>Thiết lập hoạt động</h2>
          <p>Quản lý thời gian và quy mô phục vụ</p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Giờ mở cửa</label>
          <input v-model="settings.openingTime" type="time" />
        </div>

        <div class="form-group">
          <label>Giờ đóng cửa</label>
          <input v-model="settings.closingTime" type="time" />
        </div>

        <div class="form-group">
          <label>Tổng số bàn</label>
          <input
            v-model.number="settings.maxTables"
            type="number"
            min="1"
          />
        </div>
      </div>
    </section>

    <!-- Nút thao tác -->
    <div class="bottom-actions">
      <button class="btn-reset" @click="resetSettings">
        Khôi phục mặc định
      </button>

      <button class="btn-save" @click="saveSettings">
        ✓ Lưu cài đặt
      </button>
    </div>

  </div>
</template>

<style scoped>
.settings-page {
  color: #25352d;
  max-width: 1050px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 15px;
}

.page-header h1 {
  margin: 0 0 7px;
  font-size: 25px;
}

.page-header p {
  margin: 0;
  color: #829087;
  font-size: 14px;
}

.settings-label {
  background: #e5f4e9;
  color: #237a50;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
}

.settings-card {
  background: white;
  border: 1px solid #e4ece6;
  padding: 24px;
  margin-bottom: 18px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 25px;
  padding-bottom: 17px;
  border-bottom: 1px solid #edf1ee;
}

.section-icon {
  width: 42px;
  height: 42px;
  background: #e5f4e9;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.section-title h2 {
  margin: 0 0 6px;
  font-size: 17px;
  color: #237a50;
}

.section-title p {
  margin: 0;
  color: #89958d;
  font-size: 13px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #52645a;
  font-weight: 600;
  font-size: 13px;
}

.form-group input,
.form-group select {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #dce6df;
  outline: none;
  background: white;
  color: #26352c;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #52a879;
}

.form-group small {
  color: #929d96;
  font-size: 11px;
}

.full-width {
  grid-column: 1 / -1;
}

.bottom-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 25px 0;
}

.bottom-actions button {
  padding: 12px 20px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.btn-reset {
  background: #edf1ee;
  color: #53645a;
}

.btn-reset:hover {
  background: #dfe8e1;
}

.btn-save {
  background: #237a50;
  color: white;
}

.btn-save:hover {
  background: #185c3b;
}

@media (max-width: 650px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
