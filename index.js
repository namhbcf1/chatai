const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000; // Render yêu cầu sử dụng process.env.PORT

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Phục vụ file tĩnh từ thư mục public (cho Zalo verification)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint kiểm tra bot hoạt động
app.get('/', (req, res) => {
  res.send('Bot is live! 🤖');
});

// Health check endpoint cho Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint xác minh domain Zalo (backup nếu file tĩnh không hoạt động)
app.get('/zalo-verification.html', (req, res) => {
  res.type('text/plain');
  res.send('zalo-platform-site-verification=JSQZ9QZeDYvImemKfBmi5dETl0cVwsfUD3Cs');
});

// Webhook verification - GET request từ Facebook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Kiểm tra mode và token
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed!');
    res.sendStatus(403);
  }
});

// Webhook để nhận tin nhắn - POST request từ Facebook
app.post('/webhook', (req, res) => {
  const body = req.body;

  // Kiểm tra đây có phải là page event không
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      // Lấy webhook event
      const webhookEvent = entry.messaging[0];
      console.log('📨 Received webhook event:', webhookEvent);

      // Lấy sender ID
      const senderId = webhookEvent.sender.id;

      // Kiểm tra nếu có tin nhắn text
      if (webhookEvent.message) {
        handleMessage(senderId, webhookEvent.message);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Xử lý tin nhắn nhận được
function handleMessage(senderId, receivedMessage) {
  let response;

  // Kiểm tra nếu tin nhắn có text
  if (receivedMessage.text) {
    const userMessage = receivedMessage.text;
    
    // Tạo phản hồi đơn giản
    response = {
      text: `Bạn vừa nói: "${userMessage}" 💬`
    };
  } else {
    // Phản hồi khi không hiểu tin nhắn
    response = {
      text: 'Xin chào! Tôi chỉ hiểu tin nhắn văn bản. Hãy gửi tin nhắn text cho tôi nhé! 😊'
    };
  }

  // Gửi phản hồi
  callSendAPI(senderId, response);
}

// Gửi tin nhắn qua Facebook Send API
function callSendAPI(senderId, response) {
  const requestBody = {
    recipient: {
      id: senderId
    },
    message: response
  };

  // Gửi HTTP request tới Facebook Graph API
  axios.post(`https://graph.facebook.com/v18.0/me/messages`, requestBody, {
    params: {
      access_token: process.env.PAGE_TOKEN
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('✅ Message sent successfully!');
  })
  .catch(error => {
    console.error('❌ Error sending message:', error.response?.data || error.message);
  });
}

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Webhook URL: https://chatai-bot.onrender.com/webhook`);
  console.log(`🔗 Health check: https://chatai-bot.onrender.com/healthz`);
});

// Xử lý lỗi không mong muốn
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 