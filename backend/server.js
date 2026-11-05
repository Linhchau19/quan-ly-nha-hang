
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

// Kiểm tra Backend
app.get('/', (req, res) => {
  res.send('Gemini AI Backend is running!')
})
// tu van
app.post('/api/chat', async (req, res) => {
  try {
    console.log('📩 Đã nhận câu hỏi:', req.body.message)
const { message, menu = [] } = req.body
   const menuText = menu.map((food, index) => `
${index + 1}. Tên món: ${food.name}
   Giá bán: ${Number(food.price).toLocaleString('vi-VN')}đ
   Danh mục: ${food.category || 'Chưa phân loại'}
   Mô tả: ${food.description || 'Chưa có mô tả'}
`).join('\n')

const prompt = `
Bạn là trợ lý AI tư vấn món ăn chuyên nghiệp của nhà hàng.

DANH SÁCH THỰC ĐƠN CHÍNH THỨC:
${menuText || 'Nhà hàng chưa có món ăn trong thực đơn.'}

QUY TẮC BẮT BUỘC:
1. Chỉ được tư vấn những món có trong danh sách thực đơn.
2. Phải giữ nguyên tên món và giá bán được cung cấp.
3. Tuyệt đối không tự tạo tên món, giá tiền hoặc danh mục.
4. Không được thay đổi giá món ăn.
5. Nếu khách hỏi món không có trong thực đơn, hãy lịch sự thông báo.
6. Nếu thực đơn trống, hãy thông báo nhà hàng chưa có dữ liệu.
7. Khi gợi ý nhiều món, hãy liệt kê tên, giá và lý do đề xuất.
8. Trả lời bằng tiếng Việt, thân thiện và tự nhiên.

CÂU HỎI CỦA KHÁCH:
${message}
`

  let response

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`Đang gọi Gemini lần ${attempt}...`)

    response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt
    })

    break
  } catch (error) {
    if (error.status === 503 && attempt < 3) {
      console.log('Gemini đang quá tải, thử lại sau 3 giây...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      throw error
    }
  }
}
   console.log('✅ Gemini đã phản hồi:', response.text) 



    res.json({
      reply: response.text
    })

  } catch (error) {
    console.error('Gemini API Error:', error)

    res.status(500).json({
      error: 'Không thể kết nối Gemini. Vui lòng thử lại!'
    })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Backend đang chạy tại http://localhost:${PORT}`)
})
