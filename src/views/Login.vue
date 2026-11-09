<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Đăng nhập
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const errorMessage = ref('')

// Tạo tài khoản
const showRegister = ref(false)
const employeeId = ref('')
const registerPassword = ref('')
const confirmPassword = ref('')
const showRegisterPassword = ref(false)
const registerMessage = ref('')
const availableEmployees = ref([])

const defaultEmployees = [
  { id: 'NV001', name: 'Nguyễn Văn Nam', position: 'Quản lý', status: 'Đang làm' },
  { id: 'NV002', name: 'Trần Thị Lan', position: 'Thu ngân', status: 'Đang làm' },
  { id: 'NV003', name: 'Lê Minh Tuấn', position: 'Nhân viên phục vụ', status: 'Đang làm' },
  { id: 'NV004', name: 'Phạm Thu Hà', position: 'Nhân viên phục vụ', status: 'Nghỉ việc' }
]

// Chuẩn hóa dữ liệu để tránh trường hợp danh sách có khoảng trắng hoặc khác kiểu chữ.
function isWorking(employee) {
  const status = String(employee?.status ?? employee?.trangThai ?? 'Đang làm')
    .trim()
    .toLocaleLowerCase('vi-VN')

  return !['nghỉ việc', 'đã nghỉ việc', 'nghỉ', 'đã nghỉ', 'inactive', 'disabled'].includes(status)
}

function getEmployees() {
  try {
    const saved = localStorage.getItem('restaurantEmployees')

    if (!saved) {
      localStorage.setItem('restaurantEmployees', JSON.stringify(defaultEmployees))
      return defaultEmployees
    }

    const parsed = JSON.parse(saved)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('restaurantEmployees', JSON.stringify(defaultEmployees))
      return defaultEmployees
    }

    return parsed
      .filter(employee => employee && (employee.id || employee.employeeId))
      .map(employee => ({
        ...employee,
        id: String(employee.id ?? employee.employeeId).trim().toUpperCase(),
        name: String(employee.name ?? employee.fullName ?? employee.hoTen ?? 'Chưa có tên'),
        position: String(employee.position ?? employee.role ?? employee.chucVu ?? 'Nhân viên'),
        status: employee.status ?? employee.trangThai ?? 'Đang làm'
      }))
  } catch (error) {
    console.error('Không đọc được restaurantEmployees:', error)
    return defaultEmployees
  }
}

function getAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem('restaurantAccounts') || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Không đọc được restaurantAccounts:', error)
    return []
  }
}

function openRegister() {
  const employees = getEmployees()
  const accounts = getAccounts()

  // Chỉ hiển thị nhân viên đang làm và chưa có tài khoản.
  availableEmployees.value = employees.filter(employee =>
    isWorking(employee) &&
    !accounts.some(account =>
      String(account.employeeId ?? account.username ?? '').trim().toUpperCase() === employee.id
    )
  )

  employeeId.value = ''
  registerPassword.value = ''
  confirmPassword.value = ''
  showRegisterPassword.value = false
  registerMessage.value = ''
  showRegister.value = true
}

function registerAccount() {
  registerMessage.value = ''

  if (!employeeId.value || !registerPassword.value || !confirmPassword.value) {
    registerMessage.value = 'Vui lòng nhập đầy đủ thông tin.'
    return
  }

  if (registerPassword.value.length < 6) {
    registerMessage.value = 'Mật khẩu phải có ít nhất 6 ký tự.'
    return
  }

  if (registerPassword.value !== confirmPassword.value) {
    registerMessage.value = 'Mật khẩu xác nhận không khớp.'
    return
  }

  const employee = getEmployees().find(item =>
    item.id === employeeId.value && isWorking(item)
  )

  if (!employee) {
    registerMessage.value = 'Không tìm thấy nhân viên đang làm việc. Vui lòng kiểm tra trang Quản lý nhân viên.'
    return
  }

  const accounts = getAccounts()
  const alreadyExists = accounts.some(account =>
    String(account.employeeId ?? account.username ?? '').trim().toUpperCase() === employee.id
  )

  if (alreadyExists) {
    registerMessage.value = 'Nhân viên này đã có tài khoản.'
    return
  }

  accounts.push({
    employeeId: employee.id,
    username: employee.id,
    password: registerPassword.value,
    createdAt: new Date().toISOString()
  })

  try {
    localStorage.setItem('restaurantAccounts', JSON.stringify(accounts))
    username.value = employee.id
    password.value = ''
    showRegister.value = false
    alert(`Tạo tài khoản thành công!\nTên đăng nhập: ${employee.id}\nHãy dùng mật khẩu vừa tạo để đăng nhập.`)
  } catch (error) {
    console.error('Không lưu được tài khoản:', error)
    registerMessage.value = 'Không thể lưu tài khoản trên trình duyệt. Vui lòng thử lại.'
  }
}

function login() {
  errorMessage.value = ''

  const id = username.value.trim().toUpperCase()
  const pass = password.value

  if (!id || !pass) {
    errorMessage.value = 'Vui lòng nhập tên đăng nhập và mật khẩu.'
    return
  }

  const employee = getEmployees().find(item =>
    item.id === id && isWorking(item)
  )

  if (!employee) {
    errorMessage.value = 'Mã nhân viên không tồn tại hoặc nhân viên đã nghỉ việc.'
    return
  }

  const account = getAccounts().find(item =>
    String(item.employeeId ?? item.username ?? '').trim().toUpperCase() === id &&
    item.password === pass
  )

  if (!account) {
    errorMessage.value = 'Tên đăng nhập hoặc mật khẩu không chính xác. Nếu chưa có tài khoản, hãy chọn Tạo tài khoản mới.'
    return
  }

  const user = {
    employeeId: employee.id,
    username: employee.id,
    name: employee.name,
    role: employee.position
  }

  localStorage.removeItem('restaurantUser')
  sessionStorage.removeItem('restaurantUser')

  const storage = rememberMe.value ? localStorage : sessionStorage
  storage.setItem('restaurantUser', JSON.stringify(user))

  router.push('/tong-quan')
}

function closeRegister() {
  showRegister.value = false
  registerMessage.value = ''
}

onMounted(() => {
  // Đảm bảo danh sách nhân viên đã được khởi tạo trước khi mở đăng ký.
  getEmployees()
})
</script>

<template>
  <div class="login-page">
    <section class="login-intro">
      <div class="brand">
        <div class="brand-icon">🍃</div>
        <div>
          <h2>Green Food</h2>
          <p>Restaurant Management</p>
        </div>
      </div>

      <div class="intro-content">
        <span class="intro-label">RESTAURANT MANAGEMENT SYSTEM</span>
        <h1>Chào mừng<br />trở lại!</h1>
        <p>Quản lý nhà hàng thông minh, nhanh chóng và hiệu quả.</p>
      </div>

      <div class="intro-footer">
        <span>Quản lý tốt hơn – Phục vụ tốt hơn</span>
      </div>
    </section>

    <section class="login-section">
      <div class="login-card">
        <div class="login-icon">♨</div>

        <h1>Đăng nhập hệ thống</h1>
        <p class="subtitle">Vui lòng đăng nhập để tiếp tục</p>

        <form @submit.prevent="login">
          <div class="form-group">
            <label for="login-username">Tên đăng nhập</label>
            <input
              id="login-username"
              v-model="username"
              type="text"
              placeholder="Nhập mã nhân viên, ví dụ NV001"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="login-password">Mật khẩu</label>
            <div class="password-input">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Nhập mật khẩu"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="show-password"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'Ẩn' : 'Hiện' }}
              </button>
            </div>
          </div>

          <div class="login-options">
            <label class="remember">
              <input type="checkbox" v-model="rememberMe" />
              Ghi nhớ đăng nhập
            </label>
          </div>

          <p v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </p>

          <button type="submit" class="login-button">
            Đăng nhập <span>→</span>
          </button>
        </form>

        <div class="divider"><span>hoặc</span></div>

        <button type="button" class="demo-button" @click="openRegister">
          + Tạo tài khoản nhân viên
        </button>

        <div v-if="showRegister" class="register-overlay" @click.self="closeRegister">
          <div class="register-card">
            <button type="button" class="register-close" @click="closeRegister" aria-label="Đóng">×</button>

            <h2>Tạo tài khoản nhân viên</h2>
            <p class="register-subtitle">Chọn nhân viên và thiết lập thông tin đăng nhập</p>

            <label for="register-employee">Chọn nhân viên</label>
            <select id="register-employee" v-model="employeeId">
              <option value="">-- Chọn nhân viên --</option>
              <option
                v-for="employee in availableEmployees"
                :key="employee.id"
                :value="employee.id"
              >
                {{ employee.id }} - {{ employee.name }} ({{ employee.position }})
              </option>
            </select>

            <p v-if="availableEmployees.length === 0" class="empty-employees">
              Không còn nhân viên đang làm việc chưa có tài khoản.
              Hãy kiểm tra danh sách tại trang Quản lý nhân viên.
            </p>

            <label for="register-password">Mật khẩu</label>
            <div class="register-password-input">
              <input
                id="register-password"
                v-model="registerPassword"
                :type="showRegisterPassword ? 'text' : 'password'"
                placeholder="Tối thiểu 6 ký tự"
                autocomplete="new-password"
              />
              <button type="button" @click="showRegisterPassword = !showRegisterPassword">
                {{ showRegisterPassword ? 'Ẩn' : 'Hiện' }}
              </button>
            </div>

            <label for="confirm-password">Xác nhận mật khẩu</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              autocomplete="new-password"
            />

            <p v-if="registerMessage" class="register-error">
              {{ registerMessage }}
            </p>

            <div class="register-actions">
              <button type="button" class="cancel-register" @click="closeRegister">
                Hủy
              </button>
              <button
                type="button"
                class="submit-register"
                @click="registerAccount"
                :disabled="availableEmployees.length === 0"
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>

        <div class="login-footer">
          © 2026 Green Food. All rights reserved.
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  display: flex;
  background: #f5f8f2;
  font-family: Arial, sans-serif;
}

.login-intro {
  width: 48%;
  min-height: 100vh;
  padding: 55px 8%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  background:
    linear-gradient(90deg, rgba(15, 55, 34, 0.78), rgba(20, 75, 43, 0.38)),
    url("https://tse2.mm.bing.net/th/id/OIP.nvEdo2agQnY2iMhdN9U3OAHaNQ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-icon {
  font-size: 42px;
}

.brand h2 {
  margin: 0;
  font-size: 27px;
}

.brand p {
  margin: 5px 0 0;
  font-size: 13px;
  opacity: 0.8;
}

.intro-content {
  max-width: 480px;
}

.intro-label {
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.8;
}

.intro-content h1 {
  font-size: clamp(42px, 5vw, 65px);
  line-height: 1.15;
  margin: 25px 0;
}

.intro-content p {
  font-size: 19px;
  line-height: 1.7;
  max-width: 390px;
  opacity: 0.9;
}

.intro-footer {
  font-size: 13px;
  opacity: 0.8;
}

.login-section {
  width: 52%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 35px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  padding: 42px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 15px 45px rgba(25, 75, 45, 0.09);
}

.login-icon {
  width: 65px;
  height: 65px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #e8f4e9;
  color: #267548;
  font-size: 35px;
}

.login-card > h1 {
  margin: 0;
  text-align: center;
  font-size: 26px;
  color: #203d2c;
}

.subtitle {
  margin: 12px 0 32px;
  text-align: center;
  color: #89938c;
  font-size: 14px;
}

.form-group {
  margin-bottom: 21px;
}

.form-group label {
  display: block;
  margin-bottom: 9px;
  font-size: 14px;
  font-weight: 600;
  color: #344b3c;
}

.form-group input {
  width: 100%;
  height: 49px;
  padding: 0 15px;
  border: 1px solid #dce5dd;
  border-radius: 9px;
  outline: none;
  font-size: 14px;
  transition: 0.2s;
}

.form-group input:focus,
.register-card input:focus,
.register-card select:focus {
  border-color: #27834c;
  box-shadow: 0 0 0 3px rgba(39, 131, 76, 0.1);
}

.password-input,
.register-password-input {
  display: flex;
  align-items: center;
  position: relative;
}

.password-input input,
.register-password-input input {
  padding-right: 65px;
}

.show-password,
.register-password-input button {
  position: absolute;
  right: 12px;
  border: none;
  background: none;
  color: #28794a;
  cursor: pointer;
  font-size: 12px;
}

.login-options {
  margin: 5px 0 20px;
  font-size: 13px;
  color: #66736a;
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember input {
  accent-color: #28794a;
}

.login-button,
.demo-button {
  width: 100%;
  height: 49px;
  border-radius: 9px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: none;
  color: white;
  background: linear-gradient(110deg, #267348, #39945b);
  box-shadow: 0 5px 12px rgba(39, 115, 72, 0.18);
}

.login-button:hover {
  background: #185d37;
  transform: translateY(-1px);
}

.login-button span {
  font-size: 21px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 22px 0;
  color: #a0aaa2;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5ebe6;
}

.demo-button {
  border: 1px solid #70ad7d;
  background: #f4faf3;
  color: #28794a;
}

.demo-button:hover {
  background: #e7f4e7;
}

.error-message,
.register-error {
  margin: 0 0 15px;
  color: #d43d3d;
  font-size: 13px;
}

.login-footer {
  margin-top: 25px;
  text-align: center;
  color: #a0aaa2;
  font-size: 11px;
}

.register-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.58);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 430px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 30px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.2);
  position: relative;
}

.register-card h2 {
  color: #203d2c;
  text-align: center;
  margin: 0 25px 8px;
  font-size: 22px;
}

.register-subtitle {
  text-align: center;
  color: #84938a;
  font-size: 13px;
  margin: 0 0 22px;
}

.register-close {
  position: absolute;
  top: 12px;
  right: 16px;
  border: 0;
  background: transparent;
  color: #748078;
  font-size: 27px;
  cursor: pointer;
}

.register-card label {
  display: block;
  margin: 16px 0 7px;
  font-weight: 600;
  font-size: 14px;
  color: #344b3c;
}

.register-card input,
.register-card select {
  width: 100%;
  height: 45px;
  padding: 0 12px;
  border: 1px solid #dce5dd;
  border-radius: 7px;
  outline: none;
  background: #fff;
  color: #26382d;
  font-size: 14px;
}

.empty-employees {
  padding: 11px;
  margin: 12px 0 0;
  border-radius: 7px;
  background: #fff7e8;
  color: #95651d;
  font-size: 12px;
  line-height: 1.5;
}

.register-error {
  margin: 12px 0 0;
  line-height: 1.5;
}

.register-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.register-actions button {
  padding: 11px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.cancel-register {
  background: #edf1ee;
  color: #526158;
}

.submit-register {
  background: #237a50;
  color: white;
}

.submit-register:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 800px) {
  .login-intro {
    display: none;
  }

  .login-section {
    width: 100%;
    padding: 20px;
  }

  .login-card {
    padding: 30px 23px;
  }
}

@media (max-width: 420px) {
  .register-card {
    padding: 25px 20px;
  }

  .register-actions button {
    flex: 1;
  }
}
</style>
