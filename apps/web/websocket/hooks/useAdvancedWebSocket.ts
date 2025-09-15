'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AdvancedWebSocketOptions {
  // 重连配置
  shouldReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  
  // 心跳配置
  heartbeatInterval?: number;
  heartbeatMessage?: string | object;
  
  // 消息配置
  messageQueueSize?: number;
  
  // 事件回调
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onReconnectStart?: (attempt: number) => void;
  onReconnectSuccess?: () => void;
  onReconnectFailed?: () => void;
  
  // 其他配置
  protocols?: string | string[];
  binaryType?: 'blob' | 'arraybuffer';
}

export interface WebSocketStats {
  connectTime?: number;
  reconnectCount: number;
  messagesSent: number;
  messagesReceived: number;
  lastMessageTime?: number;
  totalUptime: number;
}

export interface AdvancedWebSocketReturn {
  socket: WebSocket | null;
  lastMessage: MessageEvent | null;
  readyState: number;
  connectionStatus: 'Uninstantiated' | 'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Reconnecting';
  
  // 发送消息
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => boolean;
  sendJSON: (object: any) => boolean;
  
  // 连接控制
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // 统计信息
  stats: WebSocketStats;
  
  // 错误信息
  lastError: Event | null;
}

const READY_STATE_CONNECTING = 0;
const READY_STATE_OPEN = 1;
const READY_STATE_CLOSING = 2;
const READY_STATE_CLOSED = 3;

export function useAdvancedWebSocket(
  url: string | null,
  options: AdvancedWebSocketOptions = {}
): AdvancedWebSocketReturn {
  const {
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5,
    heartbeatInterval = 30000,
    heartbeatMessage = 'ping',
    messageQueueSize = 100,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnectStart,
    onReconnectSuccess,
    onReconnectFailed,
    protocols,
    binaryType = 'blob',
  } = options;

  // 状态管理
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(READY_STATE_CLOSED);
  const [connectionStatus, setConnectionStatus] = useState<AdvancedWebSocketReturn['connectionStatus']>('Uninstantiated');
  const [lastError, setLastError] = useState<Event | null>(null);
  const [stats, setStats] = useState<WebSocketStats>({
    reconnectCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
    totalUptime: 0,
  });

  // Refs
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<(string | ArrayBufferLike | Blob | ArrayBufferView)[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const connectTimeRef = useRef<number | null>(null);
  const currentReconnectIntervalRef = useRef(reconnectInterval);
  const isManualDisconnectRef = useRef(false);

  // 更新连接状态
  const updateConnectionStatus = useCallback((newReadyState: number, isReconnecting = false) => {
    setReadyState(newReadyState);
    
    if (isReconnecting) {
      setConnectionStatus('Reconnecting');
    } else {
      switch (newReadyState) {
        case READY_STATE_CONNECTING:
          setConnectionStatus('Connecting');
          break;
        case READY_STATE_OPEN:
          setConnectionStatus('Open');
          break;
        case READY_STATE_CLOSING:
          setConnectionStatus('Closing');
          break;
        case READY_STATE_CLOSED:
          setConnectionStatus('Closed');
          break;
        default:
          setConnectionStatus('Closed');
      }
    }
  }, []);

  // 开始心跳
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    if (heartbeatInterval > 0) {
      heartbeatIntervalRef.current = setInterval(() => {
        if (socket && socket.readyState === READY_STATE_OPEN) {
          try {
            if (typeof heartbeatMessage === 'string') {
              socket.send(heartbeatMessage);
            } else {
              socket.send(JSON.stringify(heartbeatMessage));
            }
          } catch (error) {
            console.warn('心跳发送失败:', error);
          }
        }
      }, heartbeatInterval);
    }
  }, [socket, heartbeatInterval, heartbeatMessage]);

  // 停止心跳
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // 处理消息队列
  const processMessageQueue = useCallback(() => {
    if (socket && socket.readyState === READY_STATE_OPEN) {
      while (messageQueueRef.current.length > 0) {
        const message = messageQueueRef.current.shift();
        if (message !== undefined) {
          try {
            socket.send(message);
            setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
          } catch (error) {
            console.warn('发送队列消息失败:', error);
            // 如果发送失败，将消息重新放回队列开头
            messageQueueRef.current.unshift(message);
            break;
          }
        }
      }
    }
  }, [socket]);

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!url) {
      console.warn('WebSocket URL 为空');
      return;
    }

    if (socket && socket.readyState === READY_STATE_OPEN) {
      console.warn('WebSocket 已经连接');
      return;
    }

    try {
      console.log('正在连接 WebSocket:', url);
      
      const newSocket = new WebSocket(url, protocols);
      newSocket.binaryType = binaryType;
      
      setSocket(newSocket);
      updateConnectionStatus(newSocket.readyState);
      connectTimeRef.current = Date.now();
      isManualDisconnectRef.current = false;

      newSocket.onopen = (event) => {
        console.log('WebSocket 连接成功');
        updateConnectionStatus(newSocket.readyState);
        
        // 重置重连计数
        reconnectAttemptsRef.current = 0;
        currentReconnectIntervalRef.current = reconnectInterval;
        
        // 更新统计信息
        setStats(prev => ({
          ...prev,
          connectTime: Date.now(),
        }));
        
        // 开始心跳
        startHeartbeat();
        
        // 处理消息队列
        processMessageQueue();
        
        // 触发回调
        onOpen?.(event);
        if (stats.reconnectCount > 0) {
          onReconnectSuccess?.();
        }
      };

      newSocket.onmessage = (event) => {
        setLastMessage(event);
        setStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          lastMessageTime: Date.now(),
        }));
        onMessage?.(event);
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket 连接关闭:', event.code, event.reason);
        updateConnectionStatus(newSocket.readyState);
        
        // 停止心跳
        stopHeartbeat();
        
        // 更新统计信息
        if (connectTimeRef.current) {
          const uptime = Date.now() - connectTimeRef.current;
          setStats(prev => ({
            ...prev,
            totalUptime: prev.totalUptime + uptime,
          }));
        }
        
        // 触发回调
        onClose?.(event);
        
        // 尝试重连
        if (shouldReconnect && !isManualDisconnectRef.current && reconnectAttemptsRef.current < reconnectAttempts) {
          scheduleReconnect();
        } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
          console.log('达到最大重连次数，停止重连');
          onReconnectFailed?.();
        }
      };

      newSocket.onerror = (event) => {
        console.error('WebSocket 错误:', event);
        setLastError(event);
        updateConnectionStatus(newSocket.readyState);
        onError?.(event);
      };

    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error);
      setConnectionStatus('Closed');
    }
  }, [url, protocols, binaryType, shouldReconnect, reconnectAttempts, onOpen, onMessage, onClose, onError, onReconnectSuccess, onReconnectFailed, startHeartbeat, processMessageQueue, updateConnectionStatus, reconnectInterval, stats.reconnectCount, stopHeartbeat]);

  // 计划重连
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttemptsRef.current++;
    const currentInterval = Math.min(
      currentReconnectIntervalRef.current,
      maxReconnectInterval
    );

    console.log(`计划在 ${currentInterval}ms 后进行第 ${reconnectAttemptsRef.current} 次重连`);
    
    updateConnectionStatus(READY_STATE_CLOSED, true);
    onReconnectStart?.(reconnectAttemptsRef.current);
    
    setStats(prev => ({
      ...prev,
      reconnectCount: prev.reconnectCount + 1,
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
      // 增加重连间隔
      currentReconnectIntervalRef.current = Math.min(
        currentReconnectIntervalRef.current * reconnectDecay,
        maxReconnectInterval
      );
    }, currentInterval);
  }, [connect, maxReconnectInterval, reconnectDecay, onReconnectStart, updateConnectionStatus]);

  // 断开连接
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (socket) {
      socket.close();
    }
    
    // 清空消息队列
    messageQueueRef.current = [];
  }, [socket, stopHeartbeat]);

  // 手动重连
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectAttemptsRef.current = 0;
      currentReconnectIntervalRef.current = reconnectInterval;
      connect();
    }, 100);
  }, [disconnect, connect, reconnectInterval]);

  // 发送消息
  const send = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView): boolean => {
    if (socket && socket.readyState === READY_STATE_OPEN) {
      try {
        socket.send(data);
        setStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
        return true;
      } catch (error) {
        console.warn('发送消息失败:', error);
        return false;
      }
    } else {
      // 将消息加入队列
      if (messageQueueRef.current.length < messageQueueSize) {
        messageQueueRef.current.push(data);
        return true;
      } else {
        console.warn('消息队列已满，丢弃消息');
        return false;
      }
    }
  }, [socket, messageQueueSize]);

  // 发送 JSON 消息
  const sendJSON = useCallback((object: any): boolean => {
    try {
      return send(JSON.stringify(object));
    } catch (error) {
      console.warn('JSON 序列化失败:', error);
      return false;
    }
  }, [send]);

  // 初始连接
  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]);

  // 清理副作用
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    socket,
    lastMessage,
    readyState,
    connectionStatus,
    send,
    sendJSON,
    connect,
    disconnect,
    reconnect,
    stats,
    lastError,
  };
}
