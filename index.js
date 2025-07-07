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

// Endpoint kiểm tra bot hoạt động - sẽ phục vụ file index.html từ thư mục public
// app.get('/', (req, res) => {
//   res.send('Bot is live! 🤖');
// });

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

// Webhook để nhận tin nhắn - POST request từ Facebook/Zalo
app.post('/webhook', (req, res) => {
  const body = req.body;
  console.log('📩 Webhook received:', JSON.stringify(body, null, 2));

  // Xử lý webhook từ Facebook Messenger
  if (body.object === 'page') {
    body.entry.forEach(entry => {
      // Lấy webhook event
      const webhookEvent = entry.messaging[0];
      console.log('📨 Facebook webhook event:', webhookEvent);

      // Lấy sender ID
      const senderId = webhookEvent.sender.id;

      // Kiểm tra nếu có tin nhắn text
      if (webhookEvent.message) {
        handleMessage(senderId, webhookEvent.message);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } 
  // Xử lý webhook từ Zalo OA
  else {
    console.log('📱 Sự kiện từ ZALO:', JSON.stringify(body, null, 2));
    
    // Xử lý các sự kiện Zalo
    handleZaloWebhook(body);
    
    // BẮT BUỘC: Trả về 200 OK để webhook không lỗi
    res.sendStatus(200);
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

// Xử lý các sự kiện từ Zalo OA
function handleZaloWebhook(data) {
  if (data.event_name === 'user_send_text') {
    const userId = data.sender.id;
    const message = data.message.text;
    console.log(`✉️ Người dùng Zalo (${userId}) gửi: ${message}`);
    
    // Tự động phản hồi tin nhắn
    replyZaloMessage(userId, `Bạn vừa nói: "${message}" 💬`);
    
  } else if (data.event_name === 'follow') {
    const userId = data.follower.id;
    console.log(`👋 Người dùng mới theo dõi OA: ${userId}`);
    
    // Chào mừng người dùng mới
    replyZaloMessage(userId, 'Chào mừng bạn đến với chatbot! 🤖 Hãy gửi tin nhắn để tôi phản hồi nhé!');
    
  } else if (data.event_name === 'unfollow') {
    const userId = data.follower.id;
    console.log(`👋 Người dùng hủy theo dõi OA: ${userId}`);
    
  } else {
    console.log(`📋 Sự kiện Zalo khác: ${data.event_name}`);
  }
}

// Gửi tin nhắn phản hồi qua Zalo OA API
async function replyZaloMessage(userId, text) {
  const OA_ACCESS_TOKEN = process.env.ZALO_OA_ACCESS_TOKEN;
  
  if (!OA_ACCESS_TOKEN) {
    console.log('⚠️ Chưa cấu hình ZALO_OA_ACCESS_TOKEN trong .env');
    return;
  }

  try {
    const response = await axios.post('https://openapi.zalo.me/v3.0/oa/message', {
      recipient: { user_id: userId },
      message: { text: text }
    }, {
      headers: {
        'access_token': OA_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Zalo message sent successfully!');
  } catch (error) {
    console.error('❌ Error sending Zalo message:', error.response?.data || error.message);
  }
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
    console.log('✅ Facebook message sent successfully!');
  })
  .catch(error => {
    console.error('❌ Error sending Facebook message:', error.response?.data || error.message);
  });
}

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Webhook URL: https://chatai-bot.onrender.com/webhook`);
  console.log(`🔗 Health check: https://chatai-bot.onrender.com/healthz`);
  console.log(`🎯 Hỗ trợ: Facebook Messenger + Zalo OA`);
  console.log(`⚡ Sự kiện Zalo: user_send_text, follow, unfollow`);
});

// Xử lý lỗi không mong muốn
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 