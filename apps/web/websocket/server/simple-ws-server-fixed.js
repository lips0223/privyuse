const WebSocket = require('ws');
const http = require('http');

// 创建 HTTP 服务器
const server = http.createServer();

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 存储所有连接的客户端
const clients = new Set();

// 消息类型处理器
const messageHandlers = {
  ping: (ws, data) => {
    // 响应 ping 消息
    ws.send(JSON.stringify({
      type: 'pong',
      data: data,
      timestamp: Date.now()
    }));
  },
  
  greeting: (ws, data) => {
    // 响应问候消息
    ws.send(JSON.stringify({
      type: 'greeting_response',
      data: `服务器收到你的问候: ${data}`,
      timestamp: Date.now()
    }));
  },
  
  broadcast: (ws, data) => {
    // 广播消息给所有客户端
    const broadcastMessage = JSON.stringify({
      type: 'broadcast',
      data: data,
      timestamp: Date.now(),
      from: 'server'
    });
    
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        try {
          client.send(broadcastMessage);
        } catch (error) {
          console.error('广播消息失败:', error);
          clients.delete(client);
        }
      }
    });
    
    // 确认发送
    ws.send(JSON.stringify({
      type: 'broadcast_confirm',
      data: '消息已广播给所有客户端',
      timestamp: Date.now()
    }));
  },
  
  echo: (ws, data) => {
    // 回声消息
    ws.send(JSON.stringify({
      type: 'echo',
      data: data,
      timestamp: Date.now()
    }));
  }
};

wss.on('connection', function connection(ws, request) {
  console.log('新客户端连接:', request.socket.remoteAddress);
  
  // 添加到客户端列表
  clients.add(ws);
  
  // 发送欢迎消息
  try {
    ws.send(JSON.stringify({
      type: 'welcome',
      data: '欢迎连接到 WebSocket 服务器！',
      timestamp: Date.now(),
      clientCount: clients.size
    }));
  } catch (error) {
    console.error('发送欢迎消息失败:', error);
    clients.delete(ws);
    return;
  }
  
  // 广播新用户加入
  const joinMessage = JSON.stringify({
    type: 'user_joined',
    data: '有新用户加入了',
    timestamp: Date.now(),
    clientCount: clients.size
  });
  
  clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      try {
        client.send(joinMessage);
      } catch (error) {
        console.error('发送加入消息失败:', error);
        clients.delete(client);
      }
    }
  });

  // 监听消息
  ws.on('message', function message(data) {
    console.log('收到消息:', data.toString());
    
    try {
      // 尝试解析 JSON 消息
      const parsedMessage = JSON.parse(data.toString());
      const { type, data: messageData } = parsedMessage;
      
      // 处理不同类型的消息
      if (messageHandlers[type]) {
        messageHandlers[type](ws, messageData);
      } else {
        // 未知消息类型，简单回声
        ws.send(JSON.stringify({
          type: 'unknown_type',
          data: `收到未知类型消息: ${type}`,
          originalMessage: parsedMessage,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      // 如果不是 JSON，作为普通文本处理
      try {
        ws.send(JSON.stringify({
          type: 'text_message',
          data: `服务器收到文本消息: ${data.toString()}`,
          timestamp: Date.now()
        }));
      } catch (sendError) {
        console.error('发送回复失败:', sendError);
        clients.delete(ws);
      }
    }
  });

  // 错误处理
  ws.on('error', function error(err) {
    console.error('WebSocket 错误:', err);
    // 清理资源
    clients.delete(ws);
  });

  // 连接关闭时的处理
  ws.on('close', function close() {
    console.log('客户端断开连接');
    clients.delete(ws);
    
    // 广播用户离开
    const leaveMessage = JSON.stringify({
      type: 'user_left',
      data: '有用户离开了',
      timestamp: Date.now(),
      clientCount: clients.size
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(leaveMessage);
        } catch (error) {
          console.error('发送离开消息失败:', error);
          clients.delete(client);
        }
      }
    });
  });

  // 定期发送心跳 (每30秒)
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          data: '服务器心跳',
          timestamp: Date.now(),
          clientCount: clients.size
        }));
      } catch (error) {
        console.error('发送心跳失败:', error);
        clearInterval(heartbeat);
        clients.delete(ws);
      }
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  // 确保在连接关闭时清理心跳定时器
  ws.on('close', () => {
    clearInterval(heartbeat);
  });
});

// 定期清理断开的连接
setInterval(() => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.CLOSED) {
      clients.delete(client);
    }
  });
}, 10000);

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket 服务器运行在端口 ${PORT}`);
  console.log(`测试地址: ws://localhost:${PORT}`);
  console.log('支持的消息类型:');
  console.log('- ping: 心跳检测');
  console.log('- greeting: 问候消息');
  console.log('- broadcast: 广播消息');
  console.log('- echo: 回声消息');
  console.log('- 其他: 作为未知类型处理');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  wss.close(() => {
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  wss.close(() => {
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
});
