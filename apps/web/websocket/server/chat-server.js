const WebSocket = require('ws');
const http = require('http');

// 创建 HTTP 服务器
const server = http.createServer();

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 存储聊天室数据
const chatRoom = {
  clients: new Map(), // Map<WebSocket, {username: string, joinTime: number}>
  messages: [], // 历史消息
  maxMessages: 100, // 最大消息数量
};

// 获取在线用户列表
function getOnlineUsers() {
  return Array.from(chatRoom.clients.values()).map(client => client.username);
}

// 广播消息给所有客户端
function broadcast(message, excludeClient = null) {
  const messageStr = JSON.stringify(message);
  chatRoom.clients.forEach((clientInfo, client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// 发送消息给特定客户端
function sendToClient(client, message) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// 添加消息到历史记录
function addMessage(message) {
  chatRoom.messages.push(message);
  if (chatRoom.messages.length > chatRoom.maxMessages) {
    chatRoom.messages = chatRoom.messages.slice(-chatRoom.maxMessages);
  }
}

// 消息处理器
const messageHandlers = {
  join: (ws, data) => {
    const { username } = data;
    
    // 检查用户名是否已存在
    const existingUsers = getOnlineUsers();
    if (existingUsers.includes(username)) {
      sendToClient(ws, {
        type: 'error',
        message: '用户名已存在，请选择其他用户名',
        timestamp: Date.now(),
      });
      return;
    }

    // 检查用户名合法性
    if (!username || username.trim().length === 0 || username.length > 20) {
      sendToClient(ws, {
        type: 'error',
        message: '用户名不合法（长度应在1-20字符之间）',
        timestamp: Date.now(),
      });
      return;
    }

    // 添加用户到聊天室
    chatRoom.clients.set(ws, {
      username: username.trim(),
      joinTime: Date.now(),
    });

    console.log(`用户 ${username} 加入聊天室`);

    // 发送欢迎消息
    sendToClient(ws, {
      type: 'welcome',
      message: '欢迎加入聊天室！',
      username: username,
      timestamp: Date.now(),
    });

    // 发送在线用户列表
    sendToClient(ws, {
      type: 'online_users',
      users: getOnlineUsers(),
      timestamp: Date.now(),
    });

    // 发送最近的消息历史
    if (chatRoom.messages.length > 0) {
      const recentMessages = chatRoom.messages.slice(-20); // 最近20条消息
      recentMessages.forEach(msg => {
        sendToClient(ws, msg);
      });
    }

    // 广播用户加入消息
    broadcast({
      type: 'user_joined',
      username: username,
      message: `${username} 加入了聊天室`,
      onlineUsers: getOnlineUsers(),
      timestamp: Date.now(),
    }, ws);
  },

  leave: (ws, data) => {
    const clientInfo = chatRoom.clients.get(ws);
    if (clientInfo) {
      const { username } = clientInfo;
      chatRoom.clients.delete(ws);

      console.log(`用户 ${username} 离开聊天室`);

      // 广播用户离开消息
      broadcast({
        type: 'user_left',
        username: username,
        message: `${username} 离开了聊天室`,
        onlineUsers: getOnlineUsers(),
        timestamp: Date.now(),
      });
    }
  },

  chat_message: (ws, data) => {
    const clientInfo = chatRoom.clients.get(ws);
    if (!clientInfo) {
      sendToClient(ws, {
        type: 'error',
        message: '您尚未加入聊天室',
        timestamp: Date.now(),
      });
      return;
    }

    const { message } = data;
    if (!message || message.trim().length === 0) {
      sendToClient(ws, {
        type: 'error',
        message: '消息内容不能为空',
        timestamp: Date.now(),
      });
      return;
    }

    if (message.length > 500) {
      sendToClient(ws, {
        type: 'error',
        message: '消息长度不能超过500字符',
        timestamp: Date.now(),
      });
      return;
    }

    const chatMessage = {
      type: 'chat_message',
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username: clientInfo.username,
      message: message.trim(),
      timestamp: Date.now(),
    };

    // 添加到消息历史
    addMessage(chatMessage);

    // 广播消息给所有用户（包括发送者）
    broadcast(chatMessage);

    console.log(`${clientInfo.username}: ${message.trim()}`);
  },

  ping: (ws, data) => {
    sendToClient(ws, {
      type: 'pong',
      data: data,
      timestamp: Date.now(),
    });
  },

  get_online_users: (ws, data) => {
    sendToClient(ws, {
      type: 'online_users',
      users: getOnlineUsers(),
      timestamp: Date.now(),
    });
  },
};

wss.on('connection', function connection(ws, request) {
  console.log('新客户端连接:', request.socket.remoteAddress);

  // 监听消息
  ws.on('message', function message(data) {
    try {
      const parsedMessage = JSON.parse(data.toString());
      const { type } = parsedMessage;
      
      console.log('收到消息:', parsedMessage);

      if (messageHandlers[type]) {
        messageHandlers[type](ws, parsedMessage);
      } else {
        sendToClient(ws, {
          type: 'error',
          message: `未知的消息类型: ${type}`,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('解析消息错误:', error);
      sendToClient(ws, {
        type: 'error',
        message: '消息格式错误',
        timestamp: Date.now(),
      });
    }
  });

  // 连接关闭时的处理
  ws.on('close', function close() {
    const clientInfo = chatRoom.clients.get(ws);
    if (clientInfo) {
      const { username } = clientInfo;
      chatRoom.clients.delete(ws);

      console.log(`用户 ${username} 断开连接`);

      // 广播用户离开消息
      broadcast({
        type: 'user_left',
        username: username,
        message: `${username} 离开了聊天室`,
        onlineUsers: getOnlineUsers(),
        timestamp: Date.now(),
      });
    } else {
      console.log('未加入聊天室的客户端断开连接');
    }
  });

  // 错误处理
  ws.on('error', function error(err) {
    console.error('WebSocket 错误:', err);
    const clientInfo = chatRoom.clients.get(ws);
    if (clientInfo) {
      chatRoom.clients.delete(ws);
    }
  });
});

// 定期清理断开的连接
setInterval(() => {
  const toDelete = [];
  chatRoom.clients.forEach((clientInfo, client) => {
    if (client.readyState === WebSocket.CLOSED) {
      toDelete.push(client);
    }
  });
  toDelete.forEach(client => {
    chatRoom.clients.delete(client);
  });
}, 30000);

// 定期发送服务器状态
setInterval(() => {
  if (chatRoom.clients.size > 0) {
    broadcast({
      type: 'server_status',
      onlineCount: chatRoom.clients.size,
      timestamp: Date.now(),
    });
  }
}, 60000);

// 启动服务器
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`聊天室 WebSocket 服务器运行在端口 ${PORT}`);
  console.log(`测试地址: ws://localhost:${PORT}`);
  console.log('');
  console.log('支持的消息类型:');
  console.log('- join: 加入聊天室 {type: "join", username: "用户名"}');
  console.log('- leave: 离开聊天室 {type: "leave"}');
  console.log('- chat_message: 发送消息 {type: "chat_message", message: "消息内容"}');
  console.log('- ping: 心跳检测 {type: "ping"}');
  console.log('- get_online_users: 获取在线用户 {type: "get_online_users"}');
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭聊天室服务器...');
  broadcast({
    type: 'server_shutdown',
    message: '服务器即将关闭，请重新连接',
    timestamp: Date.now(),
  });
  
  setTimeout(() => {
    wss.close(() => {
      server.close(() => {
        console.log('聊天室服务器已关闭');
        process.exit(0);
      });
    });
  }, 1000);
});

process.on('SIGINT', () => {
  console.log('正在关闭聊天室服务器...');
  broadcast({
    type: 'server_shutdown',
    message: '服务器即将关闭，请重新连接',
    timestamp: Date.now(),
  });
  
  setTimeout(() => {
    wss.close(() => {
      server.close(() => {
        console.log('聊天室服务器已关闭');
        process.exit(0);
      });
    });
  }, 1000);
});
