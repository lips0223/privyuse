'use client';

import { useState, useEffect } from 'react';
import { useAdvancedWebSocket } from '../hooks/useAdvancedWebSocket';
import { WebSocketMonitor } from './WebSocketMonitor';
import { ConnectionStatus } from './ConnectionStatus';

interface AdvancedWebSocketDemoProps {
  defaultUrl?: string;
}

export function AdvancedWebSocketDemo({ defaultUrl = 'ws://localhost:8080' }: AdvancedWebSocketDemoProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [reconnectLogs, setReconnectLogs] = useState<string[]>([]);

  const websocket = useAdvancedWebSocket(url, {
    shouldReconnect: true,
    reconnectAttempts: 5,
    reconnectInterval: 2000,
    maxReconnectInterval: 10000,
    reconnectDecay: 1.5,
    heartbeatInterval: 30000,
    heartbeatMessage: { type: 'ping', timestamp: Date.now() },
    messageQueueSize: 50,
    
    onOpen: () => {
      addLog('WebSocket 连接已建立');
    },
    
    onClose: (event) => {
      addLog(`WebSocket 连接已关闭: ${event.code} - ${event.reason}`);
    },
    
    onError: (error) => {
      addLog(`WebSocket 发生错误: ${error.type}`);
    },
    
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(data);
      } catch {
        addMessage({ type: 'text', data: event.data, timestamp: Date.now() });
      }
    },
    
    onReconnectStart: (attempt) => {
      const logMessage = `开始第 ${attempt} 次重连尝试`;
      addLog(logMessage);
      setReconnectLogs(prev => [...prev.slice(-9), logMessage]);
    },
    
    onReconnectSuccess: () => {
      const logMessage = '重连成功！';
      addLog(logMessage);
      setReconnectLogs(prev => [...prev.slice(-9), logMessage]);
    },
    
    onReconnectFailed: () => {
      const logMessage = '重连失败，已达到最大重连次数';
      addLog(logMessage);
      setReconnectLogs(prev => [...prev.slice(-9), logMessage]);
    },
  });

  const addLog = (message: string) => {
    console.log(`[WebSocket] ${message}`);
  };

  const addMessage = (messageData: any) => {
    setMessages(prev => [...prev.slice(-49), {
      ...messageData,
      id: Date.now() + Math.random(),
      receivedAt: Date.now(),
    }]);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    try {
      const jsonMessage = JSON.parse(message);
      websocket.sendJSON(jsonMessage);
    } catch {
      websocket.send(message);
    }

    setMessage('');
  };

  const handleSendPredefinedMessage = (type: string, data: any) => {
    websocket.sendJSON({
      type,
      data,
      timestamp: Date.now(),
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearReconnectLogs = () => {
    setReconnectLogs([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          高级 WebSocket 演示
        </h1>
        <p className="text-gray-600">
          包含自动重连、心跳检测、消息队列等高级功能
        </p>
      </div>

      {/* 配置区域 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">连接配置</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WebSocket URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ws://localhost:8080"
            />
          </div>
          <div className="flex justify-between items-center">
            <ConnectionStatus 
              connectionStatus={websocket.connectionStatus} 
              readyState={websocket.readyState} 
            />
            <div className="space-x-2">
              <button
                onClick={websocket.connect}
                disabled={websocket.connectionStatus === 'Open' || websocket.connectionStatus === 'Connecting'}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                连接
              </button>
              <button
                onClick={websocket.disconnect}
                disabled={websocket.connectionStatus === 'Closed'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                断开
              </button>
              <button
                onClick={websocket.reconnect}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                重连
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 监控组件 */}
      <WebSocketMonitor websocket={websocket} />

      {/* 消息发送 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">发送消息</h2>
        
        {/* 预定义消息 */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">快速发送:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSendPredefinedMessage('greeting', 'Hello, Advanced WebSocket!')}
              disabled={websocket.connectionStatus !== 'Open'}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
            >
              问候消息
            </button>
            <button
              onClick={() => handleSendPredefinedMessage('test', { message: 'Test message', array: [1, 2, 3], nested: { key: 'value' } })}
              disabled={websocket.connectionStatus !== 'Open'}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              复杂数据
            </button>
            <button
              onClick={() => handleSendPredefinedMessage('stress_test', Array.from({ length: 10 }, (_, i) => `Message ${i + 1}`))}
              disabled={websocket.connectionStatus !== 'Open'}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
            >
              批量消息
            </button>
            <button
              onClick={() => {
                // 发送多个消息来测试队列
                for (let i = 0; i < 5; i++) {
                  websocket.sendJSON({ type: 'queue_test', index: i, timestamp: Date.now() });
                }
              }}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              队列测试
            </button>
          </div>
        </div>

        {/* 自定义消息 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            自定义消息 (JSON 或文本)
          </label>
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='{"type": "custom", "message": "Hello World"}'
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={websocket.connectionStatus !== 'Open'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 消息历史 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              消息历史 ({messages.length})
            </h2>
            <button
              onClick={clearMessages}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              清空
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暂无消息</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {msg.type || 'unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.receivedAt)}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 重连日志 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              重连日志 ({reconnectLogs.length})
            </h2>
            <button
              onClick={clearReconnectLogs}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              清空
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {reconnectLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暂无重连记录</div>
            ) : (
              reconnectLogs.map((log, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-700 p-2 bg-gray-50 rounded"
                >
                  <span className="text-xs text-gray-500 mr-2">
                    {formatTime(Date.now())}
                  </span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
