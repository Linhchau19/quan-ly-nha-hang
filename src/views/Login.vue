
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const errorMessage = ref('')

const accounts = [
  {
    username: 'admin',
    password: '123456',
    name: 'Quản trị viên',
    role: 'Admin'
  },
  {
    username: 'nhanvien',
    password: '123456',
    name: 'Nhân viên',
    role: 'Nhân viên'
  }
]

function login() {
  errorMessage.value = ''

  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.'
    return
  }

  const account = accounts.find(item =>
    item.username === username.value.trim() &&
    item.password === password.value
  )

  if (!account) {
    errorMessage.value = 'Tài khoản hoặc mật khẩu không chính xác.'
    return
  }

  const user = {
    username: account.username,
    name: account.name,
    role: account.role
  }

  // Xóa trạng thái đăng nhập cũ
  localStorage.removeItem('restaurantUser')
  sessionStorage.removeItem('restaurantUser')

  // Lưu trạng thái đăng nhập
  const storage = rememberMe.value ? localStorage : sessionStorage
  storage.setItem('restaurantUser', JSON.stringify(user))

  router.push('/tong-quan')
}

function demoLogin() {
  username.value = 'admin'
  password.value = '123456'
  login()
}
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
        <p>
          Quản lý nhà hàng thông minh,
          nhanh chóng và hiệu quả.
        </p>
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
            <label>Tên đăng nhập</label>
            <input
              v-model="username"
              type="text"
              placeholder="Nhập tên đăng nhập"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label>Mật khẩu</label>

            <div class="password-input">
              <input
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
            Đăng nhập
            <span>→</span>
          </button>

          <div class="divider">
            <span>hoặc</span>
          </div>

          <button
            type="button"
            class="demo-button"
            @click="demoLogin"
          >
            Trải nghiệm hệ thống Demo
          </button>
        </form>
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
    linear-gradient(
      90deg,
      rgba(15, 55, 34, 0.78),
      rgba(20, 75, 43, 0.38)
    ),
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

.login-card h1 {
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

.form-group input:focus {
  border-color: #27834c;
  box-shadow: 0 0 0 3px rgba(39, 131, 76, 0.1);
}

.password-input {
  display: flex;
  align-items: center;
  position: relative;
}

.password-input input {
  padding-right: 65px;
}

.show-password {
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

.error-message {
  margin: 0 0 15px;
  color: #d43d3d;
  font-size: 13px;
}

.account-info {
  margin-top: 23px;
  padding: 13px;
  border-radius: 8px;
  background: #f5f8f4;
  color: #68766c;
  font-size: 12px;
}

.account-info p {
  margin: 5px 0;
}

.login-footer {
  margin-top: 25px;
  text-align: center;
  color: #a0aaa2;
  font-size: 11px;
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
</style>
