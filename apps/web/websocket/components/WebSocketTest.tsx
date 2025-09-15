'use client';

import { useState, useRef, useEffect } from 'react';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import { ConnectionStatus } from './ConnectionStatus';
import { MessageDisplay } from './MessageDisplay';

interface WebSocketTestProps {
  defaultUrl?: string;
}

export function WebSocketTest({ defaultUrl = 'ws://localhost:8080' }: WebSocketTestProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    socket,
    lastMessage,
    readyState,
    sendMessage,
    sendJsonMessage,
    connectionStatus,
  } = useWebSocket(isConnected ? url : null, {
    reconnectAttempts: 0, // 禁用自动重连
    onOpen: () => {
      console.log('WebSocket 连接已建立');
      addSystemMessage('连接已建立');
    },
    onClose: (event) => {
      console.log('WebSocket 连接已断开, code:', event.code, 'reason:', event.reason);
      addSystemMessage(`连接已断开 (${event.code}: ${event.reason})`);
    },
    onError: (error) => {
      console.error('WebSocket 错误:', error);
      addSystemMessage('连接发生错误');
    },
    onMessage: (message) => {
      console.log('收到消息:', message);
    },
  });

  const addSystemMessage = (content: string) => {
    const systemMessage: WebSocketMessage = {
      type: 'system',
      data: content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  useEffect(() => {
    // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0 && messagesEndRef.current) {
    //   messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleConnect = () => {
    if (!url.trim()) {
      alert('请输入有效的 WebSocket URL');
      return;
    }
    setIsConnected(true);
    setMessages([]);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    if (socket) {
      socket.close();
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      alert('请输入消息内容');
      return;
    }

    try {
      // 尝试解析为 JSON
      const parsedMessage = JSON.parse(message);
      sendJsonMessage(parsedMessage);
    } catch {
      // 如果不是有效的 JSON，作为文本发送
      sendMessage(message);
    }

    setMessage('');
  };

  const handleSendPredefinedMessage = (type: string, data: any) => {
    sendJsonMessage({
      type,
      data,
      timestamp: Date.now(),
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">WebSocket 测试工具</h2>
        
        {/* 连接控制 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WebSocket URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isConnected}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="ws://localhost:8080"
              />
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  连接
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  断开
                </button>
              )}
            </div>
          </div>

          {/* 连接状态 */}
          <div className="flex justify-between items-center">
            <ConnectionStatus connectionStatus={connectionStatus} readyState={readyState} />
            <button
              onClick={clearMessages}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              清空消息
            </button>
          </div>
        </div>
      </div>

      {/* 消息发送 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">发送消息</h3>
        
        {/* 预定义消息按钮 */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">快速发送:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSendPredefinedMessage('greeting', 'Hello, Server!')}
              disabled={connectionStatus !== 'Open'}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              问候消息
            </button>
            <button
              onClick={() => handleSendPredefinedMessage('ping', Date.now())}
              disabled={connectionStatus !== 'Open'}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ping
            </button>
            <button
              onClick={() => handleSendPredefinedMessage('test', { message: 'Test message', data: [1, 2, 3] })}
              disabled={connectionStatus !== 'Open'}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              测试数据
            </button>
          </div>
        </div>

        {/* 自定义消息 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            自定义消息 (支持 JSON)
          </label>
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='{"type": "message", "content": "Hello World"}'
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={connectionStatus !== 'Open'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
          <p className="text-xs text-gray-500">
            提示: 输入有效的 JSON 将作为对象发送，否则作为文本发送
          </p>
        </div>
      </div>

      {/* 消息历史 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">消息历史 ({messages.length})</h3>
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
          <MessageDisplay messages={messages} />
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
