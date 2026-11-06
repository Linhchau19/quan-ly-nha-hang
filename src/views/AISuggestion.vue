
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Đọc thực đơn từ localStorage
function loadMenu() {
  try {
    const savedMenu = JSON.parse(
      localStorage.getItem('restaurantMenu') || '[]'
    )
    return Array.isArray(savedMenu) ? savedMenu : []
  } catch (error) {
    console.error('Lỗi đọc thực đơn:', error)
    return []
  }
}

const menu = ref(loadMenu())

// Chỉ lấy món đang kinh doanh
const activeMenu = computed(() =>
  menu.value.filter(food => food.status !== 'Ngừng bán')
)

// Bộ lọc món ăn
const selectedCategory = ref('Tất cả')
const maxPrice = ref(0)
const keyword = ref('')

// Danh mục thực đơn
const categories = computed(() => [
  'Tất cả',
  ...new Set(activeMenu.value.map(food => food.category).filter(Boolean))
])

// Danh sách món phù hợp với bộ lọc
const recommendations = computed(() => {
  return activeMenu.value.filter(food => {
    const matchCategory =
      selectedCategory.value === 'Tất cả' ||
      food.category === selectedCategory.value

    const matchPrice =
      maxPrice.value <= 0 ||
      Number(food.price) <= Number(maxPrice.value)

    const matchKeyword =
      (food.name || '')
        .toLowerCase()
        .includes(keyword.value.trim().toLowerCase())

    return matchCategory && matchPrice && matchKeyword
  })
})

// Chatbot AI Gemini
const chatInput = ref('')
const isSending = ref(false)
const chatMessages = ref(null)

const messages = ref([
  {
    role: 'assistant',
    content: 'Xin chào! Mình là trợ lý AI của nhà hàng. Bạn có thể hỏi về thực đơn, giá món ăn hoặc nhờ mình tư vấn lựa chọn món phù hợp nhé!'
  }
])

// Tự động cuộn đến tin nhắn mới nhất
watch(messages, async () => {
  await nextTick()

  if (chatMessages.value) {
    chatMessages.value.scrollTop =
      chatMessages.value.scrollHeight
  }
}, { deep: true })

// Hiển thị nội dung Markdown an toàn
function renderMessage(content) {
  return DOMPurify.sanitize(marked.parse(content || ''))
}

// Gửi nội dung đến Gemini Backend
async function sendMessage(customMessage = '', menuForAI = null) {
  const message = (customMessage || chatInput.value).trim()

  if (!message || isSending.value) return

  messages.value.push({
    role: 'user',
    content: message
  })

  chatInput.value = ''
  isSending.value = true

  try {
    const response = await fetch(
      'https://restaurant-backend-0fhe.onrender.com/api/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          menu: menuForAI || activeMenu.value
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.error || 'Không thể nhận phản hồi từ Gemini.'
      )
    }

    messages.value.push({
      role: 'assistant',
      content: data.reply || 'Gemini chưa có câu trả lời.'
    })

  } catch (error) {
    console.error('Lỗi gửi tin nhắn:', error)

    messages.value.push({
      role: 'assistant',
      content: 'Hiện tại mình chưa thể kết nối AI. Vui lòng thử lại sau nhé!'
    })

  } finally {
    isSending.value = false
  }
}

// AI đề xuất món theo nhu cầu đã lọc
function suggestFood() {
  if (activeMenu.value.length === 0) {
    messages.value.push({
      role: 'assistant',
      content: 'Thực đơn hiện chưa có món ăn nào đang kinh doanh để đề xuất.'
    })
    return
  }

  const conditions = []

  if (selectedCategory.value !== 'Tất cả') {
    conditions.push(`Danh mục: ${selectedCategory.value}`)
  }

  if (maxPrice.value > 0) {
    conditions.push(`Ngân sách tối đa: ${formatMoney(maxPrice.value)}`)
  }

  if (keyword.value.trim()) {
    conditions.push(`Tên món chứa: ${keyword.value.trim()}`)
  }

  const filterText = conditions.length
    ? conditions.join('; ')
    : 'Không giới hạn danh mục, giá tiền hoặc tên món'

  const foodList = recommendations.value

  const prompt = `
Hãy đóng vai trò là nhân viên tư vấn món ăn của nhà hàng.

Nhu cầu của khách hàng: ${filterText}.

Dựa trên danh sách món ăn được cung cấp:
1. Chọn tối đa 3 món phù hợp nhất.
2. Nêu tên món và giá tiền chính xác.
3. Giải thích ngắn gọn lý do đề xuất.
4. Có thể gợi ý món ăn hoặc đồ uống đi kèm nếu phù hợp.
5. Không tự tạo món ăn hoặc giá tiền không có trong thực đơn.

Hãy trình bày thân thiện, ngắn gọn và dễ đọc.
`

  sendMessage(
    prompt,
    foodList.length > 0 ? foodList : activeMenu.value
  )
}

// Xóa bộ lọc
function resetFilter() {
  selectedCategory.value = 'Tất cả'
  maxPrice.value = 0
  keyword.value = ''
}

// Định dạng tiền Việt Nam
function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ'
}
</script>


<template>
  <div class="ai-page">

    <!-- Tiêu đề -->
    <div class="page-header">
      <div>
        <h1>AI Suggestion</h1>
        <p>Trợ lý AI hỗ trợ tư vấn và lựa chọn món ăn thông minh</p>
      </div>

      <span class="ai-badge">
        <span class="status-dot"></span>
        Gemini AI
      </span>
    </div>

    <!-- Bộ lọc món ăn -->
    <div class="filter-card">

      <div class="section-heading">
        <div>
          <h2>Khám phá món ăn</h2>
          <p>Chọn nhu cầu để AI tư vấn món ăn phù hợp</p>
        </div>

        <span class="food-count">
          {{ recommendations.length }} món phù hợp
        </span>
      </div>

      <div class="filter-grid">

        <div class="form-group">
          <label>Danh mục món ăn</label>

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
          <label>Tìm kiếm món ăn</label>

          <input
            type="text"
            v-model="keyword"
            placeholder="Nhập tên món ăn..."
          />
        </div>

      </div>

      <div class="filter-footer">
        <p>
          <span class="filter-icon">✦</span>
          AI sẽ dựa trên thực đơn đang kinh doanh để tư vấn.
        </p>

        <div class="filter-actions">
          <button
            type="button"
            class="reset-button"
            @click="resetFilter"
          >
            Đặt lại
          </button>

          <button
            type="button"
            class="suggest-button"
            :disabled="isSending"
            @click="suggestFood"
          >
            ✨ Đề xuất bằng AI
          </button>
        </div>
      </div>

    </div>

    <!-- Chatbot Gemini -->
    <div class="chat-card">

      <div class="chat-header">

        <div class="chat-avatar">
          ✦
        </div>

        <div class="chat-title">
          <h2>Trợ lý AI Gemini</h2>
          <p>Tư vấn thực đơn và hỗ trợ lựa chọn món ăn</p>
        </div>

        <span class="chat-online">
          <span class="status-dot"></span>
          Online
        </span>

      </div>

      <!-- Nội dung trò chuyện -->
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

        <!-- Đang xử lý -->
        <div v-if="isSending" class="message-row assistant">

          <div class="message-avatar">✦</div>

          <div class="message-bubble typing">
            Gemini đang phân tích và trả lời...
          </div>

        </div>

      </div>

      <!-- Nhập câu hỏi -->
      <form
        class="chat-input-area"
        @submit.prevent="sendMessage()"
      >

        <input
          v-model="chatInput"
          type="text"
          placeholder="Nhập câu hỏi về món ăn, giá tiền..."
          :disabled="isSending"
        />

        <button
          type="submit"
          :disabled="isSending || !chatInput.trim()"
        >
          {{ isSending ? 'Đang gửi...' : 'Gửi ➤' }}
        </button>

      </form>

      <div class="chat-hint">
        ✦ Gemini AI tư vấn dựa trên dữ liệu thực đơn hiện tại của nhà hàng.
      </div>

    </div>

  </div>
</template>

<style scoped>

.ai-page {
  color: #1F2937;
  width: 100%;
}

/* TIÊU ĐỀ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.page-header h1 {
  color: #111827;
  font-size: 27px;
  margin: 0;
}

.page-header p {
  color: #64748B;
  margin: 8px 0 0;
  font-size: 14px;
}

.ai-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #EAF5ED;
  color: #237A50;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.status-dot {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-radius: 50%;
  background: #22C55E;
}

/* KHUNG CHUNG */
.filter-card,
.chat-card {
  background: #FFFFFF;
  border: 1px solid #E2EDE5;
  box-shadow: 0 4px 15px rgba(17, 24, 39, 0.05);
  margin-bottom: 25px;
}

/* BỘ LỌC */
.filter-card {
  padding: 24px;
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
  font-size: 19px;
  margin: 0 0 7px;
}

.section-heading p {
  color: #64748B;
  font-size: 13px;
  margin: 0;
}

.food-count {
  background: #EAF5ED;
  color: #237A50;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 9px;
}

.form-group input,
.form-group select {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #D1DED5;
  background: #FFFFFF;
  color: #374151;
  font-size: 13px;
  outline: none;
  border-radius: 0;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #237A50;
}

.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #E8F0EA;
}

.filter-footer p {
  color: #64748B;
  font-size: 12px;
  margin: 0;
}

.filter-icon {
  color: #237A50;
  font-weight: bold;
  margin-right: 5px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.suggest-button,
.reset-button {
  padding: 11px 18px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  border-radius: 0;
}

.suggest-button {
  background: #237A50;
  color: white;
}

.suggest-button:hover:not(:disabled) {
  background: #185C3B;
}

.suggest-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.reset-button {
  background: #E8F0EA;
  color: #374151;
}

.reset-button:hover {
  background: #DCEBE0;
}

/* CHATBOT */
.chat-card {
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 25px;
}

.chat-title h2 {
  margin: 0 0 5px;
  font-size: 17px;
}

.chat-title p {
  margin: 0;
  color: #D1FAE5;
  font-size: 12px;
}

.chat-online {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #A7F3D0;
  font-size: 12px;
  white-space: nowrap;
}

/* TIN NHẮN */
.chat-messages {
  min-height: 280px;
  max-height: 420px;
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
  width: 34px;
  height: 34px;
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
  padding: 12px 16px;
  background: white;
  border: 1px solid #E2EDE5;
  color: #374151;
  font-size: 13px;
  line-height: 1.7;
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

/* ĐỊNH DẠNG NỘI DUNG GEMINI */
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

.message-row.user .message-bubble :deep(strong) {
  color: #FFFFFF;
}

.message-bubble :deep(ol),
.message-bubble :deep(ul) {
  padding-left: 22px;
  margin: 10px 0;
}

.message-bubble :deep(li) {
  margin-bottom: 8px;
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

/* KHUNG NHẬP */
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
  border-radius: 0;
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

/* RESPONSIVE */
@media (max-width: 900px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .page-header {
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 23px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-actions {
    width: 100%;
  }

  .filter-actions button {
    flex: 1;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

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
}
</style>

