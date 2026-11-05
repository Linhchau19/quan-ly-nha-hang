
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Lấy thực đơn đã lưu từ trang Quản lý thực đơn
function loadMenu() {
  try {
    const savedMenu = JSON.parse(
      localStorage.getItem('restaurantMenu') || 'null'
    )

    if (Array.isArray(savedMenu)) {
      return savedMenu
    }
  } catch (error) {
    console.error('Lỗi đọc thực đơn:', error)
  }

  return []
}

const menu = ref(loadMenu())

// Sở thích của khách hàng
const selectedCategory = ref('Tất cả')
const maxPrice = ref(0)
const keyword = ref('')

// Danh mục món ăn
const categories = computed(() => {
  const values = menu.value.map(food => food.category).filter(Boolean)
  return ['Tất cả', ...new Set(values)]
})

// Lọc món ăn phù hợp
const recommendations = computed(() => {
  return menu.value.filter(food => {
    const isSelling = food.status !== 'Ngừng bán'

    const matchCategory =
      selectedCategory.value === 'Tất cả' ||
      food.category === selectedCategory.value

    const matchPrice =
      maxPrice.value <= 0 || Number(food.price) <= maxPrice.value

    const matchKeyword = (food.name || '')
      .toLowerCase()
      .includes(keyword.value.toLowerCase())

    return isSelling && matchCategory && matchPrice && matchKeyword
  })
})

// Trạng thái chatbot Gemini
const chatInput = ref('')
const isSending = ref(false)
const chatMessages = ref(null)
const messages = ref([
  {
    role: 'assistant',
    content: 'Xin chào! ✨ Mình là trợ lý AI của nhà hàng. Bạn thích món gì hoặc có ngân sách bao nhiêu? Mình sẽ giúp bạn chọn món phù hợp nhé!'
  }
])
// Tự động cuộn xuống tin nhắn mới nhất
watch(messages, async () => {
  await nextTick()

  if (chatMessages.value) {
    chatMessages.value.scrollTop =
      chatMessages.value.scrollHeight
  }
}, { deep: true })
// Định dạng câu trả lời của Gemini
function renderMessage(content) {
  const html = marked.parse(content || '')
  return DOMPurify.sanitize(html)
}
// Gửi câu hỏi đến Gemini Backend
async function sendMessage(customMessage = '') {
  const message = (customMessage || chatInput.value).trim()

  if (!message || isSending.value) return

  messages.value.push({
    role: 'user',
    content: message
  })

  chatInput.value = ''
  isSending.value = true

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        menu: menu.value.filter(food => food.status !== 'Ngừng bán')
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Không thể nhận phản hồi từ Gemini.')
    }

    messages.value.push({
      role: 'assistant',
      content: data.reply || 'Gemini chưa có câu trả lời.'
    })

  } catch (error) {
    console.error('Lỗi gửi tin nhắn:', error)

    messages.value.push({
      role: 'assistant',
      content: 'Xin lỗi, hiện tại mình chưa thể kết nối AI. Bạn hãy kiểm tra Backend đang chạy tại cổng 3000 nhé!'
    })
  } finally {
    isSending.value = false
  }
}

// Gợi ý món ăn bằng AI dựa trên bộ lọc
function suggestFood() {
  const conditions = []

  if (selectedCategory.value !== 'Tất cả') {
    conditions.push(`Danh mục: ${selectedCategory.value}`)
  }

  if (maxPrice.value > 0) {
    conditions.push(`Ngân sách tối đa: ${formatMoney(maxPrice.value)}`)
  }

  if (keyword.value.trim()) {
    conditions.push(`Tên món có chứa: ${keyword.value}`)
  }

  const filterText = conditions.length
    ? conditions.join(', ')
    : 'Không có điều kiện cụ thể'

  sendMessage(
    `Hãy tư vấn và gợi ý cho tôi những món ăn phù hợp. ${filterText}. Hãy dựa trên thực đơn nhà hàng được cung cấp, nêu tên món, giá tiền và lý do đề xuất.`
  )
}

// Đặt lại bộ lọc
function resetFilter() {
  selectedCategory.value = 'Tất cả'
  maxPrice.value = 0
  keyword.value = ''
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ'
}
</script>
<template>
  <div class="ai-page">

    <div class="page-header">
      <h1>✨ AI Suggestion</h1>
      <p>Trợ lý thông minh hỗ trợ gợi ý món ăn cho khách hàng</p>
    </div>

    <!-- Giới thiệu AI -->
    <div class="ai-banner">
      <div class="ai-icon">✦</div>

      <div>
        <h2>Trợ lý gợi ý món ăn</h2>
        <p>
          Hãy chọn sở thích và ngân sách để hệ thống tìm ra
          những món ăn phù hợp từ thực đơn nhà hàng.
        </p>
        <span class="ai-status">● AI Recommendation đang hoạt động</span>
      </div>
    </div>

    <!-- CHATBOT GEMINI -->
    <div class="chat-card">
      <div class="chat-header">
        <div class="chat-avatar">✦</div>

        <div>
          <h2>Gemini AI Assistant</h2>
          <p>Trợ lý tư vấn món ăn thông minh</p>
        </div>

        <span class="chat-online">● Online</span>
      </div>

<div class="chat-messages" ref="chatMessages">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message-row', message.role]"
        >
          <div class="message-avatar">
            {{ message.role === 'assistant' ? '✦' : '👤' }}
          </div>

          <div
  class="message-bubble"
  v-html="renderMessage(message.content)"
></div>
        </div>

        <div v-if="isSending" class="message-row assistant">
          <div class="message-avatar">✦</div>
          <div class="message-bubble typing">
            Gemini đang suy nghĩ...
          </div>
        </div>
      </div>

      <form class="chat-input-area" @submit.prevent="sendMessage()">
        <input
          v-model="chatInput"
          type="text"
          placeholder="Hỏi AI về món ăn, giá tiền, ngân sách..."
          :disabled="isSending"
        />

        <button type="submit" :disabled="isSending || !chatInput.trim()">
          {{ isSending ? 'Đang gửi...' : '➤ Gửi' }}
        </button>
      </form>

      <div class="chat-hint">
        ✨ Gemini AI sẽ tư vấn dựa trên thực đơn hiện tại của nhà hàng.
      </div>
    </div>

    <!-- Bộ lọc sở thích -->
    <div class="filter-card">
      <h2>🎯 Khám phá món ăn phù hợp</h2>

      <div class="filter-grid">

        <div class="form-group">
          <label>Bạn muốn ăn gì?</label>

          <select v-model="selectedCategory">
            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Ngân sách tối đa (VNĐ)</label>

          <input
            type="number"
            v-model.number="maxPrice"
            min="0"
            placeholder="Ví dụ: 100000"
          />
        </div>

        <div class="form-group">
          <label>Tìm tên món ăn</label>

          <input
            type="text"
            v-model="keyword"
            placeholder="Nhập tên món..."
          />
        </div>

      </div>

      <div class="filter-actions">
        <button class="suggest-button" @click="suggestFood">
          ✨ Gợi ý món ăn
        </button>

        <button class="reset-button" @click="resetFilter">
          Đặt lại
        </button>
      </div>
    </div>

    <!-- Kết quả -->
    <div class="result-section">

      <div class="result-heading">
        <div>
          <h2>🍽️ Món ăn được đề xuất</h2>
          <p>
            {{ hasSearched
              ? 'Kết quả dựa trên sở thích bạn đã chọn.'
              : 'Các món ăn phù hợp từ thực đơn nhà hàng.' }}
          </p>
        </div>

        <span class="result-count">
          {{ recommendations.length }} món
        </span>
      </div>

      <div v-if="recommendations.length > 0" class="food-grid">

        <div
          v-for="food in recommendations"
          :key="food.id"
          class="food-card"
        >
          <img
            v-if="food.image"
            :src="food.image"
            :alt="food.name"
            class="food-image"
          />

          <div v-else class="food-placeholder">
            🍽️
          </div>

          <div class="food-info">
            <span class="food-category">
              {{ food.category || 'Món ăn' }}
            </span>

            <h3>{{ food.name }}</h3>

            <p class="food-description">
              {{ food.description || 'Món ăn hấp dẫn từ thực đơn nhà hàng.' }}
            </p>

            <div class="food-bottom">
              <strong>{{ formatMoney(food.price) }}</strong>
              <span>✨ Phù hợp</span>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="empty-result">
        <span>🍽️</span>
        <h3>Chưa tìm thấy món ăn phù hợp</h3>
        <p>Hãy thử thay đổi danh mục hoặc ngân sách nhé!</p>
      </div>

    </div>

    <div class="ai-note">
      <strong>💡 Lưu ý:</strong>
      Đây là phiên bản gợi ý thông minh mô phỏng dựa trên dữ liệu thực đơn
      và điều kiện lọc. Chưa kết nối mô hình AI hoặc API bên ngoài.
    </div>

  </div>
</template>

<style scoped>
.ai-page {
  color: #1F2937;
}

.page-header {
  margin-bottom: 25px;
}

.page-header h1 {
  color: #111827;
  font-size: 27px;
  margin: 0;
}

.page-header p {
  color: #64748B;
  margin-top: 8px;
}

/* BANNER AI */
.ai-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  background: linear-gradient(120deg, #123B2B, #237A50);
  color: white;
  margin-bottom: 25px;
}

.ai-icon {
  width: 65px;
  height: 65px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255,255,255,0.15);
  font-size: 35px;
  flex-shrink: 0;
}

.ai-banner h2 {
  margin: 0 0 8px;
}

.ai-banner p {
  margin: 0 0 12px;
  color: #E2F5E9;
  font-size: 14px;
  line-height: 1.6;
}

.ai-status {
  color: #A7F3D0;
  font-size: 12px;
}

/* BỘ LỌC */
.filter-card,
.result-section {
  background: white;
  padding: 25px;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 12px rgba(17,24,39,0.04);
  margin-bottom: 25px;
}

.filter-card h2,
.result-heading h2 {
  margin: 0 0 20px;
  font-size: 19px;
  color: #111827;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 9px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #D1DED5;
  outline: none;
  box-sizing: border-box;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #52A879;
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.suggest-button,
.reset-button {
  padding: 11px 20px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.suggest-button {
  background: #237A50;
  color: white;
}

.suggest-button:hover {
  background: #185C3B;
}

.reset-button {
  background: #E5EDE7;
  color: #374151;
}

/* KẾT QUẢ */
.result-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.result-heading h2 {
  margin-bottom: 7px;
}

.result-heading p {
  color: #64748B;
  font-size: 13px;
  margin: 0;
}

.result-count {
  background: #DCFCE7;
  color: #166534;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.food-card {
  border: 1px solid #E2EDE5;
  background: white;
  overflow: hidden;
}

.food-image,
.food-placeholder {
  width: 100%;
  height: 175px;
  object-fit: cover;
}

.food-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F0F7F2;
  font-size: 45px;
}

.food-info {
  padding: 16px;
}

.food-category {
  color: #237A50;
  font-size: 12px;
  font-weight: 600;
}

.food-info h3 {
  margin: 9px 0;
  font-size: 17px;
}

.food-description {
  color: #64748B;
  font-size: 13px;
  line-height: 1.5;
  min-height: 38px;
}

.food-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
}

.food-bottom strong {
  color: #237A50;
  font-size: 16px;
}

.food-bottom span {
  color: #237A50;
  font-size: 11px;
}

.empty-result {
  text-align: center;
  padding: 45px 15px;
  color: #64748B;
}

.empty-result span {
  font-size: 40px;
}

.empty-result h3 {
  color: #374151;
}

.ai-note {
  background: #EAF5ED;
  border-left: 4px solid #237A50;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .filter-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .food-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .filter-grid,
  .food-grid {
    grid-template-columns: 1fr;
  }

  .ai-banner {
    align-items: flex-start;
  }

  .filter-actions {
    flex-wrap: wrap;
  }
  
/* ===== GEMINI CHATBOT ===== */

.chat-card {
  background: #FFFFFF;
  border: 1px solid #DCEBE0;
  box-shadow: 0 8px 25px rgba(17, 24, 39, 0.06);
  margin-bottom: 25px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(120deg, #123B2B, #237A50);
  color: white;
}

.chat-avatar {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.25);
  font-size: 25px;
}

.chat-header h2 {
  margin: 0 0 5px;
  font-size: 17px;
}

.chat-header p {
  margin: 0;
  color: #D1FAE5;
  font-size: 12px;
}

.chat-online {
  margin-left: auto;
  color: #A7F3D0;
  font-size: 12px;
  white-space: nowrap;
}

.chat-messages {
  min-height: 260px;
  max-height: 380px;
  overflow-y: auto;
  padding: 24px;
  background: #F7FAF8;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 85%;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #DCEFE2;
  color: #237A50;
  font-weight: bold;
}

.message-row.user .message-avatar {
  background: #237A50;
  color: white;
}

.message-bubble {
  padding: 12px 15px;
  background: white;
  border: 1px solid #E2EDE5;
  color: #374151;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message-row.user .message-bubble {
  background: #237A50;
  color: white;
  border-color: #237A50;
}

.message-bubble.typing {
  color: #237A50;
  font-style: italic;
}

.chat-input-area {
  display: flex;
  gap: 12px;
  padding: 18px 22px 10px;
  background: white;
}

.chat-input-area input {
  flex: 1;
  min-width: 0;
  padding: 13px 15px;
  border: 1px solid #D1DED5;
  outline: none;
  font-size: 13px;
}

.chat-input-area input:focus {
  border-color: #237A50;
}

.chat-input-area button {
  padding: 0 22px;
  border: none;
  background: #237A50;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.chat-input-area button:hover:not(:disabled) {
  background: #185C3B;
}

.chat-input-area button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chat-hint {
  padding: 0 22px 17px;
  color: #94A3B8;
  font-size: 11px;
}

@media (max-width: 600px) {
  .chat-header {
    padding: 16px;
  }

  .chat-messages {
    padding: 16px;
  }

  .message-row {
    max-width: 95%;
  }

  .chat-input-area {
    padding: 14px;
  }

  .chat-input-area button {
    padding: 0 14px;
  }
  /* ===== ĐỊNH DẠNG NỘI DUNG GEMINI ===== */

.message-bubble :deep(p) {
  margin: 0 0 10px;
  line-height: 1.7;
}

.message-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.message-bubble :deep(strong) {
  color: #237A50;
  font-weight: 700;
}

.message-bubble :deep(ol),
.message-bubble :deep(ul) {
  padding-left: 22px;
  margin: 10px 0;
}

.message-bubble :deep(li) {
  margin-bottom: 9px;
  line-height: 1.7;
}

.message-bubble :deep(h1),
.message-bubble :deep(h2),
.message-bubble :deep(h3) {
  color: #237A50;
  margin: 10px 0;
  font-size: 15px;
}

.message-bubble :deep(code) {
  background: #F0F7F2;
  padding: 2px 5px;
}
}
}
</style>