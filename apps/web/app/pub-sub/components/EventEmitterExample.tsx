'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// 📡 EventEmitter 发布订阅示例

// 简单的 EventEmitter 实现
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  // 订阅事件
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // 返回取消订阅函数
    return () => {
      this.off(event, callback);
    };
  }

  // 取消订阅
  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  // 发布事件
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  // 一次性订阅
  once(event: string, callback: Function) {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  // 获取事件监听器数量
  listenerCount(event: string): number {
    return this.events[event] ? this.events[event].length : 0;
  }

  // 获取所有事件名
  eventNames(): string[] {
    return Object.keys(this.events);
  }

  // 清空所有监听器
  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// 全局事件总线
const eventBus = new EventEmitter();

// 事件类型定义
interface ChatMessage {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  room: string;
}

interface UserStatus {
  user: string;
  status: 'online' | 'offline' | 'away';
  timestamp: Date;
}

// 聊天发布组件
function ChatPublisher() {
  const [user, setUser] = useState('用户' + Math.floor(Math.random() * 100));
  const [content, setContent] = useState('');
  const [room, setRoom] = useState('general');

  const sendMessage = () => {
    if (content.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        user,
        content: content.trim(),
        timestamp: new Date(),
        room,
      };
      
      eventBus.emit('chat:message', message);
      eventBus.emit(`chat:room:${room}`, message);
      setContent('');
    }
  };

  const changeStatus = (status: UserStatus['status']) => {
    const userStatus: UserStatus = {
      user,
      status,
      timestamp: new Date(),
    };
    eventBus.emit('user:status', userStatus);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">💬 聊天发布器</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            用户名
          </label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            房间
          </label>
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">通用频道</option>
            <option value="tech">技术讨论</option>
            <option value="random">随机聊天</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            消息内容
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="输入消息..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={sendMessage}
          disabled={!content.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          发送消息
        </button>
        
        <div className="border-t pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            状态控制
          </label>
          <div className="flex gap-2">
            {(['online', 'away', 'offline'] as const).map(status => (
              <button
                key={status}
                onClick={() => changeStatus(status)}
                className={`px-3 py-1 rounded text-sm ${
                  status === 'online' ? 'bg-green-100 text-green-800' :
                  status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 聊天订阅组件
function ChatSubscriber({ title, rooms }: { title: string; rooms?: string[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubscribeRefs = useRef<Function[]>([]);

  const subscribe = useCallback(() => {
    const unsubscribers: Function[] = [];
    
    // 订阅全局聊天消息
    const unsubGlobal = eventBus.on('chat:message', (message: ChatMessage) => {
      if (!rooms || rooms.includes(message.room)) {
        setMessages(prev => [...prev, message]);
      }
    });
    unsubscribers.push(unsubGlobal);
    
    // 如果指定了房间，订阅特定房间
    if (rooms) {
      rooms.forEach(room => {
        const unsubRoom = eventBus.on(`chat:room:${room}`, (message: ChatMessage) => {
          console.log(`Room ${room} received message:`, message);
        });
        unsubscribers.push(unsubRoom);
      });
    }
    
    unsubscribeRefs.current = unsubscribers;
  }, [rooms]);

  const unsubscribe = useCallback(() => {
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];
  }, []);

  useEffect(() => {
    if (isSubscribed) {
      subscribe();
    } else {
      unsubscribe();
    }
    
    return unsubscribe;
  }, [isSubscribed, subscribe, unsubscribe]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={() => setIsSubscribed(!isSubscribed)}
          className={`px-3 py-1 rounded text-sm ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isSubscribed ? '✅ 已订阅' : '❌ 未订阅'}
        </button>
      </div>
      
      {rooms && (
        <div className="mb-3 text-sm text-gray-600">
          监听房间: {rooms.join(', ')}
        </div>
      )}
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无消息</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="p-3 bg-gray-50 rounded border"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-blue-600">{message.user}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {message.room}
                    </span>
                  </div>
                  <div className="text-gray-800">{message.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button
        onClick={() => setMessages([])}
        className="w-full mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
      >
        清空消息
      </button>
    </div>
  );
}

// 用户状态监听组件
function UserStatusMonitor() {
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const unsubscribeRef = useRef<Function | null>(null);

  useEffect(() => {
    if (isMonitoring) {
      const unsubscribe = eventBus.on('user:status', (status: UserStatus) => {
        setUserStatuses(prev => {
          const filtered = prev.filter(s => s.user !== status.user);
          return [...filtered, status].slice(-10); // 只保留最近10条
        });
      });
      unsubscribeRef.current = unsubscribe;
    } else if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isMonitoring]);

  const getStatusColor = (status: UserStatus['status']) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'away': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">👥 用户状态监控</h3>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-3 py-1 rounded text-sm ${
            isMonitoring 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isMonitoring ? '✅ 监控中' : '❌ 未监控'}
        </button>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {userStatuses.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无状态更新</div>
        ) : (
          userStatuses.map((status, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{status.user}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status.status)}`}>
                  {status.status}
                </span>
                <span className="text-xs text-gray-500">
                  {status.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// EventBus 状态监控
function EventBusMonitor() {
  const [eventStats, setEventStats] = useState<{ [key: string]: number }>({});
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const events = eventBus.eventNames();
      const stats: { [key: string]: number } = {};
      events.forEach(event => {
        stats[event] = eventBus.listenerCount(event);
      });
      setEventStats(stats);
      forceUpdate(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📊 EventBus 监控</h3>
      
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-700">事件监听器统计:</div>
          <div className="space-y-1 mt-2">
            {Object.entries(eventStats).map(([event, count]) => (
              <div key={event} className="flex justify-between text-sm">
                <span className="font-mono text-blue-600">{event}</span>
                <span>{count} 个监听器</span>
              </div>
            ))}
            {Object.keys(eventStats).length === 0 && (
              <div className="text-gray-500 text-sm">暂无活动事件</div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => {
            eventBus.removeAllListeners();
            setEventStats({});
          }}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          清空所有监听器
        </button>
      </div>
    </div>
  );
}

// 主组件
export function EventEmitterExample() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h2 className="text-xl font-bold text-green-800 mb-2">📡 EventEmitter 发布订阅</h2>
        <p className="text-green-700 text-sm">
          使用经典的 EventEmitter 模式实现发布订阅。EventEmitter 是一种常见的设计模式，
          允许对象在特定事件发生时通知其他对象，实现了松耦合的组件通信。
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <ChatPublisher />
        <ChatSubscriber title="📱 全局监听器" />
        <ChatSubscriber title="💻 房间监听器" rooms={['general', 'tech']} />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <UserStatusMonitor />
        <EventBusMonitor />
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-3">🔍 EventEmitter 特点：</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-green-600 mb-2">优势</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>跨组件通信:</strong> 不受组件层级限制</li>
              <li>• <strong>灵活订阅:</strong> 可以订阅多个事件</li>
              <li>• <strong>动态管理:</strong> 运行时添加/移除监听器</li>
              <li>• <strong>命名空间:</strong> 支持事件命名空间</li>
              <li>• <strong>一次性订阅:</strong> once 方法支持</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-orange-600 mb-2">注意事项</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>内存泄漏:</strong> 需要手动清理监听器</li>
              <li>• <strong>错误处理:</strong> 监听器错误可能影响其他监听器</li>
              <li>• <strong>调试困难:</strong> 事件流不如 React 状态直观</li>
              <li>• <strong>类型安全:</strong> 需要额外的 TypeScript 支持</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
