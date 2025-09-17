'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// 🪝 Custom Hooks 发布订阅示例

// 通用订阅管理器
class SubscriptionManager<T = any> {
  private subscribers = new Set<(data: T) => void>();
  private lastValue: T | undefined;

  subscribe(callback: (data: T) => void) {
    this.subscribers.add(callback);
    
    // 如果有最新值，立即调用
    if (this.lastValue !== undefined) {
      callback(this.lastValue);
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  publish(data: T) {
    this.lastValue = data;
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    });
  }

  getSubscriberCount() {
    return this.subscribers.size;
  }

  clear() {
    this.subscribers.clear();
    this.lastValue = undefined;
  }
}

// 创建全局订阅管理器实例
const globalManagers = {
  notifications: new SubscriptionManager<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>(),
  userActivity: new SubscriptionManager<{ user: string; action: string; timestamp: Date }>(),
  gameState: new SubscriptionManager<{ score: number; level: number; lives: number }>(),
};

// 通用发布订阅 Hook
function useSubscription<T>(manager: SubscriptionManager<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSubscribed) return;

    const unsubscribe = manager.subscribe((newData: T) => {
      setData(prev => [...prev, newData]);
    });

    return unsubscribe;
  }, [manager, isSubscribed]);

  const subscribe = useCallback(() => setIsSubscribed(true), []);
  const unsubscribe = useCallback(() => setIsSubscribed(false), []);
  const clearData = useCallback(() => setData([]), []);

  return {
    data,
    isSubscribed,
    subscribe,
    unsubscribe,
    clearData,
    subscriberCount: manager.getSubscriberCount(),
  };
}

// 通知系统 Hook
function useNotifications() {
  const subscription = useSubscription(globalManagers.notifications);

  const notify = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    globalManagers.notifications.publish({
      id: Date.now().toString(),
      message,
      type,
    });
  }, []);

  return {
    ...subscription,
    notify,
  };
}

// 用户活动跟踪 Hook
function useUserActivity() {
  const subscription = useSubscription(globalManagers.userActivity);

  const trackActivity = useCallback((user: string, action: string) => {
    globalManagers.userActivity.publish({
      user,
      action,
      timestamp: new Date(),
    });
  }, []);

  return {
    ...subscription,
    trackActivity,
  };
}

// 游戏状态管理 Hook
function useGameState() {
  const [localState, setLocalState] = useState({ score: 0, level: 1, lives: 3 });
  const subscription = useSubscription(globalManagers.gameState);

  const updateGameState = useCallback((updates: Partial<typeof localState>) => {
    setLocalState(prev => {
      const newState = { ...prev, ...updates };
      globalManagers.gameState.publish(newState);
      return newState;
    });
  }, []);

  const resetGame = useCallback(() => {
    const initialState = { score: 0, level: 1, lives: 3 };
    setLocalState(initialState);
    globalManagers.gameState.publish(initialState);
  }, []);

  return {
    ...subscription,
    localState,
    updateGameState,
    resetGame,
  };
}

// 实时数据 Hook (模拟 WebSocket)
function useRealTimeData<T>(
  endpoint: string,
  options: { autoConnect?: boolean; interval?: number } = {}
) {
  const { autoConnect = false, interval = 2000 } = options;
  const [data, setData] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const mockFetch = useCallback(async (): Promise<T> => {
    // 模拟不同端点的数据
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    if (Math.random() < 0.1) {
      throw new Error('模拟网络错误');
    }

    switch (endpoint) {
      case 'stock-prices':
        return {
          symbol: ['AAPL', 'GOOGL', 'TSLA', 'MSFT'][Math.floor(Math.random() * 4)],
          price: 100 + Math.random() * 200,
          change: (Math.random() - 0.5) * 10,
          timestamp: new Date(),
        } as T;
      
      case 'chat-messages':
        return {
          id: Date.now(),
          user: `用户${Math.floor(Math.random() * 100)}`,
          message: ['Hello!', '怎么样？', '好的', '收到'][Math.floor(Math.random() * 4)],
          timestamp: new Date(),
        } as T;
      
      default:
        return {
          id: Date.now(),
          value: Math.random() * 100,
          timestamp: new Date(),
        } as T;
    }
  }, [endpoint]);

  const connect = useCallback(() => {
    if (isConnected) return;
    
    setIsConnected(true);
    setError(null);
    
    intervalRef.current = setInterval(async () => {
      try {
        const newData = await mockFetch();
        setData(prev => [...prev.slice(-19), newData]); // 保持最近20条
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      }
    }, interval);
  }, [isConnected, interval, mockFetch]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const clearData = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return disconnect;
  }, [autoConnect, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
    clearData,
  };
}

// 通知发布组件
function NotificationPublisher() {
  const { notify } = useNotifications();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const handleSend = () => {
    if (message.trim()) {
      notify(message.trim(), type);
      setMessage('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📢 通知发布器</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            通知内容
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入通知内容..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            通知类型
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="info">信息</option>
            <option value="success">成功</option>
            <option value="warning">警告</option>
            <option value="error">错误</option>
          </select>
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          发送通知
        </button>
      </div>
    </div>
  );
}

// 通知订阅组件
function NotificationSubscriber({ title }: { title: string }) {
  const { data, isSubscribed, subscribe, unsubscribe, clearData, subscriberCount } = useNotifications();

  const getTypeColor = (type: string) => {
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{subscriberCount} 订阅者</span>
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            className={`px-3 py-1 rounded text-sm ${
              isSubscribed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isSubscribed ? '✅ 已订阅' : '❌ 未订阅'}
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {data.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无通知</div>
        ) : (
          data.slice(-10).map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded border ${getTypeColor(notification.type)}`}
            >
              <div className="font-medium">{notification.message}</div>
            </div>
          ))
        )}
      </div>
      
      <button
        onClick={clearData}
        disabled={data.length === 0}
        className="w-full mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
      >
        清空通知
      </button>
    </div>
  );
}

// 游戏状态组件
function GameStateDemo() {
  const { data, localState, updateGameState, resetGame, isSubscribed, subscribe, unsubscribe } = useGameState();
  const { trackActivity } = useUserActivity();

  const handleScoreChange = (delta: number) => {
    updateGameState({ score: Math.max(0, localState.score + delta) });
    trackActivity('Player', `得分变化: ${delta > 0 ? '+' : ''}${delta}`);
  };

  const handleLevelUp = () => {
    updateGameState({ level: localState.level + 1, lives: localState.lives + 1 });
    trackActivity('Player', `升级到第 ${localState.level + 1} 级`);
  };

  const handleGameOver = () => {
    updateGameState({ lives: 0 });
    trackActivity('Player', '游戏结束');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🎮 游戏状态演示</h3>
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={`px-3 py-1 rounded text-sm ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isSubscribed ? '✅ 监听中' : '❌ 未监听'}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{localState.score}</div>
          <div className="text-sm text-gray-600">分数</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">{localState.level}</div>
          <div className="text-sm text-gray-600">等级</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">{localState.lives}</div>
          <div className="text-sm text-gray-600">生命</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleScoreChange(10)}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          +10 分
        </button>
        <button
          onClick={() => handleScoreChange(-5)}
          className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
        >
          -5 分
        </button>
        <button
          onClick={handleLevelUp}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          升级
        </button>
        <button
          onClick={handleGameOver}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          游戏结束
        </button>
      </div>
      
      <button
        onClick={resetGame}
        className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
      >
        重置游戏
      </button>
      
      {isSubscribed && data.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="text-sm font-medium mb-2">状态历史:</div>
          <div className="text-xs space-y-1">
            {data.slice(-3).map((state, index) => (
              <div key={index}>
                分数: {state.score}, 等级: {state.level}, 生命: {state.lives}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 实时数据组件
function RealTimeDataDemo() {
  const stockData = useRealTimeData<{ symbol: string; price: number; change: number; timestamp: Date }>('stock-prices');
  const chatData = useRealTimeData<{ id: number; user: string; message: string; timestamp: Date }>('chat-messages');

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📈 股票实时数据</h3>
          <button
            onClick={stockData.isConnected ? stockData.disconnect : stockData.connect}
            className={`px-3 py-1 rounded text-sm ${
              stockData.isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {stockData.isConnected ? '🟢 已连接' : '🔴 未连接'}
          </button>
        </div>
        
        {stockData.error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {stockData.error}
          </div>
        )}
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {stockData.data.slice(-5).map((stock, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded flex justify-between">
              <span className="font-medium">{stock.symbol}</span>
              <div className="text-right">
                <div className="font-bold">${stock.price.toFixed(2)}</div>
                <div className={`text-xs ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={stockData.clearData}
          className="w-full mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          清空数据
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">💬 实时聊天</h3>
          <button
            onClick={chatData.isConnected ? chatData.disconnect : chatData.connect}
            className={`px-3 py-1 rounded text-sm ${
              chatData.isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {chatData.isConnected ? '🟢 已连接' : '🔴 未连接'}
          </button>
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {chatData.data.slice(-5).map((chat, index) => (
            <div key={index} className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-600">{chat.user}</div>
              <div className="text-sm">{chat.message}</div>
            </div>
          ))}
        </div>
        
        <button
          onClick={chatData.clearData}
          className="w-full mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          清空聊天
        </button>
      </div>
    </div>
  );
}

// 主组件
export function CustomHookPubSubExample() {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h2 className="text-xl font-bold text-orange-800 mb-2">🪝 Custom Hooks 发布订阅</h2>
        <p className="text-orange-700 text-sm">
          使用自定义 React Hooks 实现发布订阅模式。这种方法将发布订阅逻辑封装在 Hooks 中，
          提供了更好的代码复用性和 React 生态集成，同时保持了组件的简洁性。
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <NotificationPublisher />
        <NotificationSubscriber title="📱 通知中心 A" />
        <NotificationSubscriber title="💻 通知中心 B" />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <GameStateDemo />
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">👥 用户活动跟踪</h3>
          <UserActivityTracker />
        </div>
      </div>
      
      <RealTimeDataDemo />
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-3">🔍 Custom Hooks 特点：</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-orange-600 mb-2">优势</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>React 集成:</strong> 与 React 生命周期完美结合</li>
              <li>• <strong>代码复用:</strong> 逻辑可以在多个组件间共享</li>
              <li>• <strong>类型安全:</strong> TypeScript 支持良好</li>
              <li>• <strong>自动清理:</strong> useEffect 自动处理资源清理</li>
              <li>• <strong>状态管理:</strong> 结合 useState/useReducer</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-600 mb-2">最佳实践</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>命名规范:</strong> 以 use 开头</li>
              <li>• <strong>单一职责:</strong> 每个 Hook 负责一个功能</li>
              <li>• <strong>依赖数组:</strong> 正确设置 useEffect 依赖</li>
              <li>• <strong>错误处理:</strong> 提供错误状态和处理</li>
              <li>• <strong>性能优化:</strong> 使用 useCallback/useMemo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 用户活动跟踪器组件
function UserActivityTracker() {
  const { data, isSubscribed, subscribe, unsubscribe, clearData, trackActivity } = useUserActivity();
  const [user, setUser] = useState('用户' + Math.floor(Math.random() * 100));

  const activities = ['登录', '查看页面', '点击按钮', '发送消息', '下载文件'];

  const handleActivity = (action: string) => {
    trackActivity(user, action);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="flex-1 mr-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="用户名"
        />
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={`px-3 py-1 rounded text-sm ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isSubscribed ? '✅ 监听' : '❌ 未监听'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {activities.map(activity => (
          <button
            key={activity}
            onClick={() => handleActivity(activity)}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            {activity}
          </button>
        ))}
      </div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {data.slice(-5).map((activity, index) => (
          <div key={index} className="text-xs p-2 bg-gray-50 rounded">
            <span className="font-medium">{activity.user}</span> {activity.action}
            <span className="text-gray-500 ml-2">
              {activity.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      
      <button
        onClick={clearData}
        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
      >
        清空活动记录
      </button>
    </div>
  );
}
