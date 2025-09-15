# WebSocket 快速上手指南

## 🚀 快速开始

### 1. 启动 WebSocket 服务器

```bash
# 进入服务器目录
cd apps/web/websocket/server

# 直接启动基础测试服务器
node simple-ws-server.js

# 或启动聊天室服务器
node chat-server.js
```

**注意**：服务器默认运行在端口 8080。确保端口未被占用。

### 2. 快速测试

启动服务器后，你应该看到如下输出：
```
WebSocket 服务器启动在端口 8080
服务器地址: ws://localhost:8080
```

然后在浏览器中访问你的 Next.js 应用的 WebSocket 测试页面进行连接测试。

### 2. 在 Next.js 项目中使用

```typescript
// 在你的 React 组件中
import { WebSocketTest } from './websocket/components/WebSocketTest';

export default function WebSocketPage() {
  return (
    <div>
      <h1>WebSocket 测试</h1>
      <WebSocketTest defaultUrl="ws://localhost:8080" />
    </div>
  );
}
```

## 📁 项目结构

```
apps/web/websocket/
├── README.md                          # 详细文档
├── GETTING_STARTED.md                 # 快速上手指南
├── components/                        # React 组件
│   ├── WebSocketShowcase.tsx          # 主展示页面
│   ├── WebSocketTest.tsx              # 基础测试组件
│   ├── ChatRoom.tsx                   # 聊天室组件
│   ├── AdvancedWebSocketDemo.tsx      # 高级功能演示
│   ├── ConnectionStatus.tsx           # 连接状态组件
│   ├── MessageDisplay.tsx             # 消息显示组件
│   └── WebSocketMonitor.tsx           # 连接监控组件
├── hooks/                             # 自定义 Hook
│   ├── useWebSocket.ts                # 基础 WebSocket Hook
│   └── useAdvancedWebSocket.ts        # 高级 WebSocket Hook
└── server/                            # 服务器代码
    ├── simple-ws-server.js            # 基础测试服务器
    └── chat-server.js                 # 聊天室服务器
```

## 🎯 功能特性

### 基础功能
- ✅ WebSocket 连接管理
- ✅ 消息发送和接收
- ✅ 连接状态显示
- ✅ JSON 和文本消息支持

### 高级功能
- ✅ 自动重连机制
- ✅ 心跳检测
- ✅ 消息队列
- ✅ 连接统计和监控
- ✅ 错误处理

### 实际应用
- ✅ 实时聊天室
- ✅ 多用户支持
- ✅ 用户列表
- ✅ 消息历史

## 🔧 使用说明

### 1. 基础 WebSocket Hook

```typescript
import { useWebSocket } from './hooks/useWebSocket';

function MyComponent() {
  const { 
    socket, 
    lastMessage, 
    readyState, 
    sendMessage, 
    sendJsonMessage,
    connectionStatus
  } = useWebSocket('ws://localhost:8080', {
    reconnectAttempts: 0, // 禁用自动重连避免无限循环
    onOpen: () => console.log('连接已建立'),
    onClose: () => console.log('连接已关闭'),
  });

  const handleSend = () => {
    sendJsonMessage({ type: 'greeting', data: 'Hello WebSocket!' });
  };

  return (
    <div>
      <p>状态: {connectionStatus}</p>
      <button onClick={handleSend} disabled={readyState !== 1}>
        发送消息
      </button>
      {lastMessage && <p>最新消息: {JSON.stringify(lastMessage.data)}</p>}
    </div>
  );
}
    </div>
  );
}
```

### 2. 高级 WebSocket Hook

```typescript
import { useAdvancedWebSocket } from './hooks/useAdvancedWebSocket';

function AdvancedComponent() {
  const websocket = useAdvancedWebSocket('ws://localhost:8080', {
    shouldReconnect: true,
    reconnectAttempts: 5,
    reconnectInterval: 2000,
    heartbeatInterval: 30000,
    onReconnectStart: (attempt) => {
      console.log(`开始第 ${attempt} 次重连`);
    },
  });

  return (
    <div>
      <p>状态: {websocket.connectionStatus}</p>
      <p>发送: {websocket.stats.messagesSent}</p>
      <p>接收: {websocket.stats.messagesReceived}</p>
      <button onClick={() => websocket.reconnect()}>重连</button>
    </div>
  );
}
```

## 🛠️ 服务器 API

### 基础测试服务器

支持的消息类型：
- `ping`: 心跳检测
- `greeting`: 问候消息
- `broadcast`: 广播消息
- `echo`: 回声消息

### 聊天室服务器

支持的消息类型：
- `join`: 加入聊天室
- `leave`: 离开聊天室
- `chat_message`: 发送聊天消息
- `get_online_users`: 获取在线用户列表

## 📊 性能考虑

### 消息优化
- 使用 JSON 格式统一消息结构
- 实现消息队列避免丢失
- 批处理小消息提高效率

### 连接优化
- 实现指数退避重连策略
- 心跳检测保持连接活跃
- 错误处理和日志记录

### 内存优化
- 限制消息历史数量
- 及时清理断开的连接
- 避免内存泄漏

## 🔒 安全建议

1. **使用 WSS**：生产环境始终使用加密连接
2. **身份验证**：实现适当的用户认证机制
3. **输入验证**：验证所有接收的消息
4. **速率限制**：防止消息洪水攻击
5. **错误处理**：不要泄露敏感的错误信息

## � 故障排除

### 启动服务器
1. 确保在正确的目录：`cd apps/web/websocket/server`
2. 检查 Node.js 版本：`node --version`（推荐 18+）
3. 确认端口 8080 未被占用：`lsof -i :8080`
4. 查看启动日志确认服务器正常运行

### 前端连接问题
1. **无限重连循环**：设置 `reconnectAttempts: 0` 进行调试
2. **连接立即断开**：检查服务器是否正在运行
3. **消息发送失败**：确认连接状态为 "Open"
4. **控制台错误**：检查 WebSocket URL 格式是否正确

### 开发技巧
- 使用浏览器开发者工具的 Network 标签页监控 WebSocket 连接
- 在 Console 中查看详细的连接日志
- 服务器终端会显示客户端连接和断开信息

## �🐛 常见问题

### Q: 为什么会出现无限重连循环？
A: 这通常是由于以下原因：
- useEffect 依赖数组配置不当，导致连接不断重建
- 重连逻辑错误，即使设置 `reconnectAttempts: 0` 仍然重连
- 回调函数依赖导致 hook 重新初始化

**解决方法**：
```typescript
// 正确的配置
const { socket } = useWebSocket(url, {
  reconnectAttempts: 0, // 明确禁用重连
  onOpen: useCallback(() => {
    console.log('连接建立');
  }, []),
});
```

### Q: 连接失败怎么办？
A: 检查服务器是否启动，URL 是否正确，网络连接是否正常。

### Q: 为什么收不到消息？
A: 确认连接状态为 "Open"，检查消息格式是否正确。

### Q: 如何处理跨域问题？
A: WebSocket 不受同源策略限制，但可能需要配置 CORS 头。

### Q: 重连机制如何工作？
A: 自动重连使用指数退避策略，每次重连间隔递增直到达到最大值。如果设置 `reconnectAttempts: 0` 则完全禁用重连。

### ⚠️ 重要提示

**避免无限循环**：
- 总是明确设置 `reconnectAttempts` 参数
- 使用 `useCallback` 包装回调函数
- 注意 useEffect 的依赖数组配置
- 测试时建议先设置 `reconnectAttempts: 0`

## 📚 学习资源

- [WebSocket MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Socket.IO 文档](https://socket.io/docs/)
- [实时应用开发指南](https://web.dev/websockets/)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个示例！

## 📄 许可证

MIT License
