# WebSocket 前端工程师完全指南

## 什么是 WebSocket？

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。它允许服务器和客户端之间进行实时的双向数据传输。

### WebSocket vs HTTP

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| 连接方式 | 请求-响应 | 持久连接 |
| 通信方向 | 单向（客户端发起） | 双向 |
| 开销 | 每次请求都有 HTTP 头 | 建立连接后开销小 |
| 实时性 | 需要轮询 | 真正实时 |
| 协议 | HTTP/HTTPS | WS/WSS |

### WebSocket 的优势

1. **实时通信**：无需轮询，服务器可主动推送数据
2. **低延迟**：减少了 HTTP 请求的开销
3. **双向通信**：客户端和服务器都可以主动发送消息
4. **节省带宽**：避免了重复的 HTTP 头信息

### 使用场景

- 🎮 **实时游戏**：多人在线游戏状态同步
- 💬 **即时通讯**：聊天应用、消息推送
- 📈 **实时数据**：股票价格、加密货币价格更新
- 🔄 **协作工具**：在线文档编辑、白板
- 📊 **监控系统**：服务器状态、日志监控
- 🛒 **电商**：库存更新、订单状态
- 🎵 **直播**：弹幕、在线观众数

## WebSocket API 基础

### 创建连接

```javascript
const socket = new WebSocket('ws://localhost:8080');
// 或者使用安全连接
const socket = new WebSocket('wss://example.com/socket');
```

### 连接状态

```javascript
// WebSocket.CONNECTING (0) - 正在连接
// WebSocket.OPEN (1) - 连接已开启
// WebSocket.CLOSING (2) - 连接正在关闭
// WebSocket.CLOSED (3) - 连接已关闭

console.log(socket.readyState);
```

### 事件监听

```javascript
socket.onopen = function(event) {
    console.log('连接已建立');
};

socket.onmessage = function(event) {
    console.log('收到消息:', event.data);
};

socket.onerror = function(error) {
    console.error('WebSocket 错误:', error);
};

socket.onclose = function(event) {
    console.log('连接已关闭', event.code, event.reason);
};
```

### 发送消息

```javascript
// 发送文本
socket.send('Hello Server!');

// 发送 JSON
socket.send(JSON.stringify({
    type: 'message',
    content: 'Hello World'
}));

// 发送二进制数据
const buffer = new ArrayBuffer(8);
socket.send(buffer);
```

## 在 React/Next.js 中使用 WebSocket

### 基础 Hook

```javascript
import { useState, useEffect, useRef } from 'react';

function useWebSocket(url) {
    const [socket, setSocket] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [readyState, setReadyState] = useState(WebSocket.CONNECTING);

    useEffect(() => {
        const ws = new WebSocket(url);
        
        ws.onopen = () => setReadyState(WebSocket.OPEN);
        ws.onclose = () => setReadyState(WebSocket.CLOSED);
        ws.onerror = () => setReadyState(WebSocket.CLOSED);
        ws.onmessage = (event) => setLastMessage(event.data);

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [url]);

    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
    };

    return { socket, lastMessage, readyState, sendMessage };
}
```

## 最佳实践

### 1. 错误处理和重连

```javascript
class WebSocketManager {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            reconnectInterval: 1000,
            maxReconnectAttempts: 5,
            ...options
        };
        this.reconnectAttempts = 0;
        this.connect();
    }

    connect() {
        this.socket = new WebSocket(this.url);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.socket.onclose = () => {
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... (${this.reconnectAttempts})`);
                this.connect();
            }, this.options.reconnectInterval);
        }
    }
}
```

### 2. 消息队列

```javascript
class WebSocketWithQueue {
    constructor(url) {
        this.url = url;
        this.messageQueue = [];
        this.connect();
    }

    connect() {
        this.socket = new WebSocket(this.url);
        
        this.socket.onopen = () => {
            // 发送队列中的消息
            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.socket.send(message);
            }
        };
    }

    send(message) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            // 如果连接未就绪，将消息加入队列
            this.messageQueue.push(message);
        }
    }
}
```

### 3. 心跳检测

```javascript
class WebSocketWithHeartbeat {
    constructor(url) {
        this.url = url;
        this.heartbeatInterval = 30000; // 30秒
        this.connect();
    }

    connect() {
        this.socket = new WebSocket(this.url);
        
        this.socket.onopen = () => {
            this.startHeartbeat();
        };

        this.socket.onmessage = (event) => {
            if (event.data === 'pong') {
                // 收到心跳响应
                return;
            }
            // 处理其他消息
        };

        this.socket.onclose = () => {
            this.stopHeartbeat();
        };
    }

    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send('ping');
            }
        }, this.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
    }
}
```

## 常见问题和解决方案

### 1. 跨域问题
WebSocket 同样受到同源策略限制，但可以通过服务器端设置 CORS 头来解决。

### 2. 代理问题
在开发环境中，可能需要配置代理：

```javascript
// next.config.js
module.exports = {
    async rewrites() {
        return [
            {
                source: '/api/socket',
                destination: 'ws://localhost:8080'
            }
        ];
    }
};
```

### 3. 浏览器兼容性
现代浏览器都支持 WebSocket，但对于老旧浏览器可以使用 polyfill 或降级到长轮询。

## 安全考虑

1. **使用 WSS**：在生产环境中始终使用加密连接
2. **身份验证**：实现适当的身份验证机制
3. **输入验证**：验证所有接收的消息
4. **速率限制**：防止消息洪水攻击
5. **CSRF 保护**：虽然 WebSocket 不受 CSRF 影响，但要注意相关安全问题

## 调试技巧

1. **Chrome DevTools**：Network 标签页可以查看 WebSocket 连接
2. **消息日志**：记录所有发送和接收的消息
3. **连接状态监控**：实时显示连接状态
4. **错误追踪**：详细的错误日志和堆栈跟踪

## 性能优化

1. **消息批处理**：将多个小消息合并发送
2. **数据压缩**：使用 gzip 或其他压缩算法
3. **连接池**：管理多个连接以提高性能
4. **内存管理**：及时清理不需要的数据
