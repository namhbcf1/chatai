# Facebook Messenger & Zalo OA Chatbot 🤖

Ứng dụng Node.js đa nền tảng hỗ trợ cả Facebook Messenger và Zalo OA, có thể phản hồi tin nhắn tự động.

## 📋 Yêu cầu

- Node.js 16+ 
- Facebook Developer Account
- Facebook Page

## 🚀 Cài đặt

1. **Clone/Download project này**
2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Tạo file `.env` với nội dung:**
   ```env
   # Facebook Messenger
   PAGE_TOKEN=your_page_access_token_here
   VERIFY_TOKEN=your_verify_token_here
   
   # Zalo OA (tùy chọn)
   ZALO_OA_ACCESS_TOKEN=your_zalo_oa_access_token_here
   ```

## 🔧 Cấu hình Facebook Developer

### 1. Tạo Facebook App
- Truy cập [Facebook Developer Console](https://developers.facebook.com/)
- Tạo app mới, chọn "Business" 
- Thêm sản phẩm "Messenger"

### 2. Lấy Page Access Token
- Vào **Messenger > Settings > Access Tokens**
- Chọn Facebook Page của bạn
- Copy **Page Access Token** vào file `.env`

### 3. Cấu hình Webhook
- Vào **Messenger > Settings > Webhooks**
- Callback URL: `https://your-domain.com/webhook`
- Verify Token: nhập giá trị `VERIFY_TOKEN` từ file `.env`
- Subscription Fields: chọn `messages`, `messaging_postbacks`

## 🏃‍♂️ Chạy ứng dụng

### Local Development
```bash
npm start
# hoặc
node index.js
```

Server sẽ chạy tại: `http://localhost:3000`

### Triển khai Production

#### Render.com (Miễn phí)
1. Push code lên GitHub
2. Kết nối Render với GitHub repo
3. Thêm Environment Variables:
   - `PAGE_TOKEN`
   - `VERIFY_TOKEN`
4. Deploy!

#### Railway.app (Miễn phí)
1. Push code lên GitHub  
2. Kết nối Railway với GitHub repo
3. Thêm Environment Variables
4. Deploy!

## 📁 Cấu trúc file

```
├── index.js          # File chính - Express server + webhook logic
├── package.json      # Dependencies và scripts
├── .env             # Biến môi trường (không commit)
└── README.md        # Hướng dẫn này
```

## 🔍 Endpoints

- `GET /` - Trang chủ với thông tin bot
- `GET /webhook` - Xác minh webhook từ Facebook
- `POST /webhook` - Nhận tin nhắn từ Facebook & Zalo
- `GET /healthz` - Health check cho Render
- `GET /zalo-verification.html` - Xác minh domain Zalo

## 🧪 Test chatbot

**Facebook Messenger:**
1. Gửi tin nhắn đến Facebook Page
2. Bot sẽ phản hồi: "Bạn vừa nói: [tin nhắn của bạn]"

**Zalo OA:**
1. Theo dõi Zalo OA → Nhận tin chào mừng
2. Gửi tin nhắn → Bot phản hồi tự động
3. Hỗ trợ sự kiện: `user_send_text`, `follow`, `unfollow`

## 🛠️ Tùy chỉnh

Sửa function `handleMessage()` trong `index.js` để thay đổi logic phản hồi:

```javascript
function handleMessage(senderId, receivedMessage) {
  let response;
  
  if (receivedMessage.text) {
    const userMessage = receivedMessage.text.toLowerCase();
    
    // Thêm logic tùy chỉnh ở đây
    if (userMessage.includes('xin chào')) {
      response = { text: 'Xin chào! Tôi có thể giúp gì cho bạn?' };
    } else if (userMessage.includes('giờ')) {
      response = { text: `Bây giờ là: ${new Date().toLocaleString('vi-VN')}` };
    } else {
      response = { text: `Bạn vừa nói: "${receivedMessage.text}" 💬` };
    }
  }
  
  callSendAPI(senderId, response);
}
```

## 📝 Lưu ý

- Giữ bí mật `PAGE_TOKEN` và `VERIFY_TOKEN`
- Webhook URL phải là HTTPS trong production
- Facebook yêu cầu SSL certificate cho webhook

## 🆘 Troubleshooting

**Webhook verification failed:**
- Kiểm tra `VERIFY_TOKEN` trong `.env` khớp với Facebook Developer Console

**Message not sending:**
- Kiểm tra `PAGE_TOKEN` có đúng không
- Kiểm tra Facebook Page có được kích hoạt Messenger không

**Server không start:**
- Chạy `npm install` để cài đặt dependencies
- Kiểm tra file `.env` có tồn tại không 