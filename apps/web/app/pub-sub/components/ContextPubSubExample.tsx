'use client';

import React, { createContext, useContext, useReducer, useState, useCallback } from 'react';

// 🎯 Context API 发布订阅示例

// 1. 基础 Context 发布订阅
interface Message {
  id: number;
  content: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface MessageState {
  messages: Message[];
  subscribers: number;
}

type MessageAction = 
  | { type: 'ADD_MESSAGE'; payload: Omit<Message, 'id' | 'timestamp'> }
  | { type: 'REMOVE_MESSAGE'; payload: number }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'ADD_SUBSCRIBER' }
  | { type: 'REMOVE_SUBSCRIBER' };

const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          ...action.payload,
          id: Date.now(),
          timestamp: new Date(),
        }],
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    case 'ADD_SUBSCRIBER':
      return {
        ...state,
        subscribers: state.subscribers + 1,
      };
    case 'REMOVE_SUBSCRIBER':
      return {
        ...state,
        subscribers: state.subscribers - 1,
      };
    default:
      return state;
  }
};

// Context 定义
interface MessageContextType {
  state: MessageState;
  publish: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  subscribe: () => () => void;
  clearMessages: () => void;
  removeMessage: (id: number) => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

// Provider 组件
export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(messageReducer, {
    messages: [],
    subscribers: 0,
  });

  const publish = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const subscribe = useCallback(() => {
    dispatch({ type: 'ADD_SUBSCRIBER' });
    return () => {
      dispatch({ type: 'REMOVE_SUBSCRIBER' });
    };
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const removeMessage = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_MESSAGE', payload: id });
  }, []);

  return (
    <MessageContext.Provider value={{
      state,
      publish,
      subscribe,
      clearMessages,
      removeMessage,
    }}>
      {children}
    </MessageContext.Provider>
  );
}

// Hook 用于使用 Context
function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within MessageProvider');
  }
  return context;
}

// 消息发布组件
function MessagePublisher() {
  const { publish } = useMessages();
  const [content, setContent] = useState('');
  const [type, setType] = useState<Message['type']>('info');

  const handlePublish = () => {
    if (content.trim()) {
      publish({ content: content.trim(), type });
      setContent('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📢 消息发布器</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            消息内容
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePublish()}
            placeholder="输入消息内容..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            消息类型
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Message['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="info">信息</option>
            <option value="success">成功</option>
            <option value="warning">警告</option>
            <option value="error">错误</option>
          </select>
        </div>
        
        <button
          onClick={handlePublish}
          disabled={!content.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          发布消息
        </button>
      </div>
    </div>
  );
}

// 消息订阅组件
function MessageSubscriber({ title }: { title: string }) {
  const { state, subscribe, removeMessage } = useMessages();
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  React.useEffect(() => {
    if (isSubscribed) {
      const unsubscribe = subscribe();
      return unsubscribe;
    }
  }, [isSubscribed, subscribe]);

  const getTypeColor = (type: Message['type']) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

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
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {state.messages.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无消息</div>
        ) : (
          state.messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded border ${getTypeColor(message.type)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => removeMessage(message.id)}
                  className="ml-2 text-red-500 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {isSubscribed && (
        <div className="mt-3 text-xs text-gray-600">
          正在监听消息更新...
        </div>
      )}
    </div>
  );
}

// 统计信息组件
function MessageStats() {
  const { state, clearMessages } = useMessages();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📊 统计信息</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>总消息数:</span>
          <span className="font-medium">{state.messages.length}</span>
        </div>
        
        <div className="flex justify-between">
          <span>订阅者数:</span>
          <span className="font-medium">{state.subscribers}</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm font-medium">消息类型分布:</div>
          {(['info', 'success', 'warning', 'error'] as const).map(type => {
            const count = state.messages.filter(msg => msg.type === type).length;
            return (
              <div key={type} className="flex justify-between text-sm">
                <span className="capitalize">{type}:</span>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
        
        <button
          onClick={clearMessages}
          disabled={state.messages.length === 0}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          清空所有消息
        </button>
      </div>
    </div>
  );
}

// 主组件
export function ContextPubSubExample() {
  return (
    <MessageProvider>
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold text-blue-800 mb-2">🎯 Context API 发布订阅</h2>
          <p className="text-blue-700 text-sm">
            使用 React Context API 实现发布订阅模式。Context 提供了一种在组件树中共享数据的方式，
            配合 useReducer 可以实现强大的状态管理和事件分发机制。
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <MessagePublisher />
          <MessageSubscriber title="📱 订阅者 A" />
          <MessageSubscriber title="💻 订阅者 B" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <MessageStats />
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold mb-3">🔍 Context API 特点：</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• <strong>原生支持:</strong> React 内置，无需额外依赖</li>
              <li>• <strong>类型安全:</strong> TypeScript 支持良好</li>
              <li>• <strong>组件解耦:</strong> 发布者和订阅者无需直接关联</li>
              <li>• <strong>自动更新:</strong> Context 值变化时所有消费者自动重渲染</li>
              <li>• <strong>嵌套支持:</strong> 可以有多层 Provider</li>
              <li>• <strong>性能考虑:</strong> 需要注意避免不必要的重渲染</li>
            </ul>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2">💡 使用场景</h4>
          <p className="text-amber-700 text-sm">
            Context API 适合于主题切换、用户认证状态、语言设置、全局消息通知等需要在多个组件间共享的状态。
            对于复杂的业务逻辑和大量频繁更新的数据，建议使用专门的状态管理库。
          </p>
        </div>
      </div>
    </MessageProvider>
  );
}
