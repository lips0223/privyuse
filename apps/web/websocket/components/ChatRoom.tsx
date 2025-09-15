'use client';

import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { ConnectionStatus } from './ConnectionStatus';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'user' | 'system';
}

interface ChatRoomProps {
  serverUrl?: string;
}

export function ChatRoom({ serverUrl = 'ws://localhost:8081' }: ChatRoomProps) {
  const [username, setUsername] = useState(''); //用户名
  const [isJoined, setIsJoined] = useState(false); // 是否已加入聊天室
  const [message, setMessage] = useState(''); // 当前输入的消息
  const [messages, setMessages] = useState<ChatMessage[]>([]); // 聊天消息列表
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // 在线用户列表
  const messagesEndRef = useRef<HTMLDivElement>(null); // 消息列表底部引用
  const inputRef = useRef<HTMLInputElement>(null); // 输入框引用

  const {
    lastJsonMessage,
    sendJsonMessage,
    connectionStatus,
    readyState,
  } = useWebSocket(isJoined ? serverUrl : null, {
    reconnectAttempts: 0, // 暂时禁用重连进行调试
    onOpen: () => {
      console.log('WebSocket连接已建立，准备加入聊天室'); // 调试日志
      // 稍微延迟后加入聊天室，确保连接完全建立
      setTimeout(() => {
        console.log('发送加入请求:', { type: 'join', username: username }); // 调试日志
        sendJsonMessage({
          type: 'join',
          username: username,
        });
      }, 100);
    },
    onClose: () => {
      addSystemMessage('与服务器的连接已断开');
    },
    onError: () => {
      addSystemMessage('连接发生错误');
    },
  });

  const addSystemMessage = (content: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      username: '系统',
      message: content,
      timestamp: Date.now(),
      type: 'system',
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  useEffect(() => {
    if (lastJsonMessage) {
      handleServerMessage(lastJsonMessage);
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleServerMessage = (serverMessage: any) => {
    console.log('收到服务器消息:', serverMessage); // 添加调试日志
    
    switch (serverMessage.type) {
      case 'welcome':
        addSystemMessage('欢迎加入聊天室！');
        // 加入成功后，获取在线用户列表
        sendJsonMessage({ type: 'get_online_users' });
        break;
      
      case 'user_joined':
        if (serverMessage.username !== username) {
          addSystemMessage(`${serverMessage.username} 加入了聊天室`);
        }
        if (serverMessage.onlineUsers) {
          setOnlineUsers(serverMessage.onlineUsers);
        }
        break;
      
      case 'user_left':
        addSystemMessage(`${serverMessage.username} 离开了聊天室`);
        if (serverMessage.onlineUsers) {
          setOnlineUsers(serverMessage.onlineUsers);
        }
        break;
      
      case 'chat_message':
        console.log('处理聊天消息:', serverMessage); // 添加调试日志
        const chatMessage: ChatMessage = {
          id: serverMessage.id || Date.now().toString(),
          username: serverMessage.username,
          message: serverMessage.message,
          timestamp: serverMessage.timestamp,
          type: 'user',
        };
        setMessages(prev => [...prev, chatMessage]);
        console.log('消息已添加到状态'); // 添加调试日志
        break;
      
      case 'online_users':
        setOnlineUsers(serverMessage.users);
        break;
      
      case 'error':
        addSystemMessage(`错误: ${serverMessage.message}`);
        break;
      
      default:
        console.log('未处理的消息类型:', serverMessage);
    }
  };

  const handleJoinChat = () => {
    if (!username.trim()) {
      alert('请输入用户名');
      return;
    }
    setIsJoined(true);
  };

  const handleLeaveChat = () => {
    if (isJoined) {
      // 离开聊天室 - 不需要额外参数
      sendJsonMessage({
        type: 'leave',
      });
    }
    setIsJoined(false);
    setMessages([]);
    setOnlineUsers([]);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    console.log('发送消息:', { type: 'chat_message', message: message.trim() }); // 添加调试日志
    
    // 只发送消息内容，用户名由服务器端从客户端信息中获取
    sendJsonMessage({
      type: 'chat_message',
      message: message.trim(),
    });

    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isJoined) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">加入聊天室</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinChat()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入您的用户名"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务器地址
            </label>
            <input
              type="text"
              value={serverUrl}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <button
            onClick={handleJoinChat}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            加入聊天室
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 h-screen flex flex-col">
      {/* 头部 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">实时聊天室</h1>
            <p className="text-sm text-gray-600">用户: {username}</p>
          </div>
          <div className="flex items-center space-x-4">
            <ConnectionStatus connectionStatus={connectionStatus} readyState={readyState} />
            <button
              onClick={handleLeaveChat}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              离开聊天室
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex space-x-4 min-h-0">
        {/* 主聊天区域 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  {msg.type === 'system' ? (
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {msg.message}
                    </div>
                  ) : (
                    <div className={`max-w-xs lg:max-w-md ${msg.username === username ? 'ml-auto' : ''}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.username === username
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {msg.username === username ? '我' : msg.username}
                        </div>
                        <div className="break-words">{msg.message}</div>
                        <div className={`text-xs mt-1 ${
                          msg.username === username ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 消息输入区域 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={connectionStatus !== 'Open'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder={connectionStatus === 'Open' ? '输入消息...' : '连接中...'}
                maxLength={500}
              />
              <button
                onClick={handleSendMessage}
                disabled={connectionStatus !== 'Open' || !message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>按 Enter 发送，Shift + Enter 换行</span>
              <span>{message.length}/500</span>
            </div>
          </div>
        </div>

        {/* 在线用户列表 */}
        <div className="w-64 bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold mb-3">
            在线用户 ({onlineUsers.length})
          </h3>
          <div className="space-y-2">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-2 rounded ${
                    user === username ? 'bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">
                    {user === username ? `${user} (我)` : user}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">暂无其他用户</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
