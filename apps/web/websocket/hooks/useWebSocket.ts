// 指定这是客户端组件，在 Next.js 13+ App Router 中使用
'use client';

// 导入 React 必要的 hooks
import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket 消息的标准格式接口
export interface WebSocketMessage {
  type: string;        // 消息类型，用于区分不同种类的消息
  data: any;          // 消息内容，可以是任意类型的数据
  timestamp: number;  // 消息时间戳，用于排序和调试
}

// useWebSocket hook 的配置选项接口
export interface UseWebSocketOptions {
  reconnectAttempts?: number;                          // 最大重连尝试次数，0 表示禁用重连
  reconnectInterval?: number;                          // 重连间隔时间（毫秒）
  heartbeatInterval?: number;                          // 心跳检测间隔时间（毫秒）
  onOpen?: (event: Event) => void;                    // 连接建立成功时的回调函数
  onClose?: (event: CloseEvent) => void;              // 连接关闭时的回调函数
  onError?: (event: Event) => void;                   // 连接出错时的回调函数
  onMessage?: (message: WebSocketMessage) => void;    // 收到消息时的回调函数
}

// useWebSocket hook 的返回值接口
export interface UseWebSocketReturn {
  socket: WebSocket | null;                                                          // WebSocket 实例，null 表示未连接
  lastMessage: WebSocketMessage | null;                                             // 最后收到的消息
  readyState: number;                                                               // WebSocket 连接状态的数字表示
  sendMessage: (message: any) => void;                                              // 发送字符串消息的函数
  sendJsonMessage: (object: any) => void;                                           // 发送 JSON 对象消息的函数
  getWebSocket: () => WebSocket | null;                                             // 获取 WebSocket 实例的函数
  lastJsonMessage: any;                                                             // 最后收到的 JSON 消息
  connectionStatus: 'Uninstantiated' | 'Connecting' | 'Open' | 'Closing' | 'Closed'; // 连接状态的字符串表示
}

// WebSocket 连接状态常量定义
const READY_STATE_CONNECTING = 0;  // 正在连接
const READY_STATE_OPEN = 1;        // 连接已建立
const READY_STATE_CLOSING = 2;     // 正在关闭连接
const READY_STATE_CLOSED = 3;      // 连接已关闭

// 数字状态码到字符串状态的映射表，方便理解和显示
const readyStateToStatus: Record<number, 'Connecting' | 'Open' | 'Closing' | 'Closed'> = {
  [READY_STATE_CONNECTING]: 'Connecting',  // 0 -> 'Connecting'
  [READY_STATE_OPEN]: 'Open',              // 1 -> 'Open'
  [READY_STATE_CLOSING]: 'Closing',        // 2 -> 'Closing'
  [READY_STATE_CLOSED]: 'Closed',          // 3 -> 'Closed'
};

// 将数字状态码转换为可读的字符串状态
const getConnectionStatus = (readyState: number): 'Connecting' | 'Open' | 'Closing' | 'Closed' => {
  return readyStateToStatus[readyState] || 'Closed';  // 如果状态码未知，默认返回 'Closed'
};

// 主要的 useWebSocket hook 函数
export function useWebSocket(
  socketUrl: string | null,           // WebSocket 服务器地址，null 表示不连接
  options: UseWebSocketOptions = {}   // 配置选项，有默认值
): UseWebSocketReturn {
  // 解构配置选项，设置默认值
  const {
    reconnectAttempts = 3,        // 默认最大重连 3 次
    reconnectInterval = 3000,     // 默认重连间隔 3 秒
    heartbeatInterval = 30000,    // 默认心跳间隔 30 秒
    onOpen,                       // 连接建立回调
    onClose,                      // 连接关闭回调
    onError,                      // 连接错误回调
    onMessage,                    // 消息接收回调
  } = options;

  // 状态管理：使用 useState 管理组件状态
  const [socket, setSocket] = useState<WebSocket | null>(null);                    // 当前 WebSocket 实例
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);  // 最后收到的消息
  const [readyState, setReadyState] = useState<number>(READY_STATE_CONNECTING);   // 连接状态（数字）
  const [lastJsonMessage, setLastJsonMessage] = useState<any>(null);              // 最后收到的 JSON 消息
  const [connectionStatus, setConnectionStatus] = useState<UseWebSocketReturn['connectionStatus']>('Uninstantiated'); // 连接状态（字符串）

  // 引用管理：使用 useRef 存储不会触发重渲染的值
  const reconnectCount = useRef(0);                     // 当前重连次数计数器
  const messageQueue = useRef<string[]>([]);           // 消息队列，存储连接断开时的待发送消息
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null); // 心跳定时器引用
  
  // 使用 ref 存储回调函数，避免 useCallback 依赖问题导致的无限循环
  const onOpenRef = useRef(onOpen);      // 连接建立回调的引用
  const onCloseRef = useRef(onClose);    // 连接关闭回调的引用
  const onErrorRef = useRef(onError);    // 连接错误回调的引用
  const onMessageRef = useRef(onMessage); // 消息接收回调的引用
  
  // 更新回调函数的引用，确保总是使用最新的回调
  useEffect(() => {
    onOpenRef.current = onOpen;      // 更新连接建立回调
    onCloseRef.current = onClose;    // 更新连接关闭回调
    onErrorRef.current = onError;    // 更新连接错误回调
    onMessageRef.current = onMessage; // 更新消息接收回调
  }, [onOpen, onClose, onError, onMessage]);

  // 启动心跳检测的函数
  const startHeartbeat = useCallback(() => {
    // 如果已经有心跳定时器，先清除它
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
    }
    
    // 创建新的心跳定时器
    heartbeatTimer.current = setInterval(() => {
      // 检查连接是否仍然打开
      if (socket && socket.readyState === READY_STATE_OPEN) {
        // 发送心跳消息到服务器，包含时间戳用于延迟测量
        socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, heartbeatInterval); // 按指定间隔执行心跳检测
  }, [socket, heartbeatInterval]); // 依赖 socket 和心跳间隔

  // 停止心跳检测的函数
  const stopHeartbeat = useCallback(() => {
    // 如果心跳定时器存在，清除它
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current); // 清除定时器
      heartbeatTimer.current = null;         // 重置引用为 null
    }
  }, []); // 无依赖，函数内容不变

  // 创建和配置 WebSocket 连接的核心函数
  const connectWebSocket = useCallback(() => {
    // 如果没有提供 URL，设置状态为未实例化并返回
    if (!socketUrl) {
      setConnectionStatus('Uninstantiated');
      return;
    }

    try {
      // 创建新的 WebSocket 实例
      const ws = new WebSocket(socketUrl);
      setSocket(ws);                                           // 保存 WebSocket 实例
      setReadyState(ws.readyState);                           // 设置连接状态
      setConnectionStatus(getConnectionStatus(ws.readyState)); // 设置状态字符串

      // 连接成功建立时的处理函数
      ws.onopen = (event) => {
        console.log('WebSocket connected');                    // 输出连接成功日志
        setReadyState(ws.readyState);                         // 更新连接状态
        setConnectionStatus(getConnectionStatus(ws.readyState)); // 更新状态字符串
        reconnectCount.current = 0;                           // 重置重连计数器
        
        // 发送队列中的消息（连接断开期间积累的消息）
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift();       // 从队列头部取出消息
          if (message) {
            ws.send(message);                                 // 发送消息
          }
        }

        startHeartbeat();                                     // 启动心跳检测
        onOpenRef.current?.(event);                           // 调用用户提供的连接建立回调
      };

      // 收到消息时的处理函数
      ws.onmessage = (event) => {
        try {
          // 尝试将接收到的数据解析为 JSON
          const parsedMessage = JSON.parse(event.data);
          
          // 处理心跳响应，直接返回不触发用户回调
          if (parsedMessage.type === 'pong') {
            return; // 心跳响应不需要进一步处理
          }

          // 构造标准的 WebSocket 消息格式
          const message: WebSocketMessage = {
            type: parsedMessage.type || 'message',           // 消息类型，默认为 'message'
            data: parsedMessage.data || parsedMessage,       // 消息数据，取 data 字段或整个对象
            timestamp: Date.now(),                           // 当前时间戳
          };

          setLastMessage(message);                           // 更新最后收到的消息
          setLastJsonMessage(parsedMessage);                 // 更新最后收到的 JSON 消息
          onMessageRef.current?.(message);                  // 调用用户提供的消息处理回调
        } catch (error) {
          // 如果解析 JSON 失败，将数据作为纯文本处理
          const message: WebSocketMessage = {
            type: 'text',                                    // 消息类型为文本
            data: event.data,                                // 原始数据
            timestamp: Date.now(),                           // 当前时间戳
          };
          setLastMessage(message);                           // 更新最后收到的消息
          onMessageRef.current?.(message);                  // 调用用户提供的消息处理回调
        }
      };

      // 连接关闭时的处理函数
      ws.onclose = (event) => {
        console.log('WebSocket disconnected');              // 输出连接断开日志
        setReadyState(ws.readyState);                       // 更新连接状态
        setConnectionStatus(getConnectionStatus(ws.readyState)); // 更新状态字符串
        stopHeartbeat();                                    // 停止心跳检测
        onCloseRef.current?.(event);                        // 调用用户提供的连接关闭回调

        // 重连逻辑：只有在设置了重连次数且未达到上限时才尝试重连
        if (reconnectAttempts > 0 && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;                         // 增加重连计数
          console.log(`Attempting to reconnect... (${reconnectCount.current}/${reconnectAttempts})`);
          setTimeout(connectWebSocket, reconnectInterval);  // 延迟后重新连接
        } else {
          console.log('No reconnection attempts configured or max attempts reached');
          setSocket(null);                                  // 清空 socket 引用
        }
      };

      // 连接出错时的处理函数
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);           // 输出错误日志
        setReadyState(ws.readyState);                       // 更新连接状态
        setConnectionStatus(getConnectionStatus(ws.readyState)); // 更新状态字符串
        onErrorRef.current?.(event);                        // 调用用户提供的错误处理回调
      };

    } catch (error) {
      // 创建 WebSocket 失败时的处理
      console.error('Failed to create WebSocket:', error);   // 输出创建失败日志
      setConnectionStatus('Closed');                         // 设置状态为已关闭
    }
  }, [socketUrl, reconnectAttempts, reconnectInterval]); // 依赖项：只包含必要的配置，避免无限循环

  // 主要的副作用处理：管理 WebSocket 连接的生命周期
  useEffect(() => {
    // 如果没有提供 URL，设置为未实例化状态
    if (!socketUrl) {
      setConnectionStatus('Uninstantiated');
      return;
    }

    // 建立 WebSocket 连接
    connectWebSocket();

    // 清理函数：组件卸载或依赖项变化时执行
    return () => {
      stopHeartbeat();                                      // 停止心跳检测
      if (socket) {
        socket.close();                                     // 关闭 WebSocket 连接
        setSocket(null);                                    // 清空 socket 引用
      }
    };
  }, [socketUrl, connectWebSocket]); // 依赖：URL 和连接函数（现在依赖是稳定的）

  // 发送字符串消息的函数
  const sendMessage = useCallback((message: string) => {
    // 检查连接是否打开
    if (socket && socket.readyState === READY_STATE_OPEN) {
      socket.send(message);                                 // 直接发送消息
    } else {
      // 连接未打开时，将消息加入队列，等待连接建立后发送
      messageQueue.current.push(message);
    }
  }, [socket]); // 依赖 socket 实例

  // 发送 JSON 对象消息的便捷函数
  const sendJsonMessage = useCallback((object: any) => {
    sendMessage(JSON.stringify(object));                   // 将对象序列化为 JSON 字符串后发送
  }, [sendMessage]); // 依赖 sendMessage 函数

  // 获取当前 WebSocket 实例的函数
  const getWebSocket = useCallback(() => socket, [socket]); // 返回当前 socket 实例

  // 返回 hook 的所有功能和状态
  return {
    socket,              // WebSocket 实例
    lastMessage,         // 最后收到的消息
    readyState,          // 连接状态（数字）
    sendMessage,         // 发送字符串消息的函数
    sendJsonMessage,     // 发送 JSON 消息的函数
    getWebSocket,        // 获取 WebSocket 实例的函数
    lastJsonMessage,     // 最后收到的 JSON 消息
    connectionStatus,    // 连接状态（字符串）
  };
}

// 这个 useWebSocket hook 提供了完整的 WebSocket 功能：
// 1. 自动连接管理和重连机制
// 2. 心跳检测保持连接活跃
// 3. 消息队列处理断线期间的消息
// 4. 多种消息格式支持（JSON/文本）
// 5. 完整的连接状态管理
// 6. 错误处理和日志记录
// 7. 内存泄漏防护（正确的清理机制）
