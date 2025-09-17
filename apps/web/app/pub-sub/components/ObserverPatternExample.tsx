'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// 🔍 观察者模式 (Observer Pattern) 示例

// 观察者接口
interface Observer<T = any> {
  id: string;
  update: (data: T) => void;
  priority?: number;
}

// 可观察对象 (Subject) 基类
class Subject<T = any> {
  private observers: Observer<T>[] = [];
  private isNotifying = false;
  private pendingNotifications: T[] = [];
  
  // 添加观察者
  addObserver(observer: Observer<T>) {
    if (this.observers.find(o => o.id === observer.id)) {
      console.warn(`Observer ${observer.id} already exists`);
      return;
    }
    
    this.observers.push(observer);
    // 按优先级排序（高优先级先执行）
    this.observers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  // 移除观察者
  removeObserver(observerId: string) {
    this.observers = this.observers.filter(o => o.id !== observerId);
  }
  
  // 通知所有观察者
  notify(data: T) {
    if (this.isNotifying) {
      // 如果正在通知中，加入待处理队列
      this.pendingNotifications.push(data);
      return;
    }
    
    this.isNotifying = true;
    
    try {
      this.observers.forEach(observer => {
        try {
          observer.update(data);
        } catch (error) {
          console.error(`Error in observer ${observer.id}:`, error);
        }
      });
    } finally {
      this.isNotifying = false;
      
      // 处理待处理的通知
      if (this.pendingNotifications.length > 0) {
        const pending = this.pendingNotifications.shift();
        if (pending) {
          setTimeout(() => this.notify(pending), 0);
        }
      }
    }
  }
  
  // 获取观察者列表
  getObservers() {
    return [...this.observers];
  }
  
  // 清空所有观察者
  clearObservers() {
    this.observers = [];
  }
}

// 新闻发布系统
interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: 'tech' | 'sports' | 'business' | 'entertainment';
  timestamp: Date;
  urgent?: boolean;
}

class NewsAgency extends Subject<NewsItem> {
  private news: NewsItem[] = [];
  
  publishNews(newsItem: Omit<NewsItem, 'id' | 'timestamp'>) {
    const news: NewsItem = {
      ...newsItem,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    this.news.push(news);
    this.notify(news);
  }
  
  getNews() {
    return [...this.news];
  }
  
  getNewsByCategory(category: NewsItem['category']) {
    return this.news.filter(item => item.category === category);
  }
}

// 温度监控系统
interface TemperatureData {
  location: string;
  temperature: number;
  humidity: number;
  timestamp: Date;
  alert?: 'high' | 'low' | 'normal';
}

class TemperatureMonitor extends Subject<TemperatureData> {
  private sensors: Map<string, TemperatureData> = new Map();
  
  updateTemperature(location: string, temperature: number, humidity: number) {
    const alert = temperature > 35 ? 'high' : temperature < 5 ? 'low' : 'normal';
    
    const data: TemperatureData = {
      location,
      temperature,
      humidity,
      timestamp: new Date(),
      alert,
    };
    
    this.sensors.set(location, data);
    this.notify(data);
  }
  
  getSensorData() {
    return Array.from(this.sensors.values());
  }
}

// 用户状态管理
interface UserState {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
  location?: string;
}

class UserStatusManager extends Subject<UserState> {
  private users: Map<string, UserState> = new Map();
  
  updateUserStatus(userId: string, status: UserState['status'], location?: string) {
    const userState: UserState = {
      userId,
      status,
      lastActivity: new Date(),
      location,
    };
    
    this.users.set(userId, userState);
    this.notify(userState);
  }
  
  getUsers() {
    return Array.from(this.users.values());
  }
  
  getOnlineUsers() {
    return this.getUsers().filter(user => user.status === 'online');
  }
}

// 全局实例
const newsAgency = new NewsAgency();
const temperatureMonitor = new TemperatureMonitor();
const userStatusManager = new UserStatusManager();

// React Hook 集成
function useObserver<T>(
  subject: Subject<T>,
  observerId: string,
  onUpdate: (data: T) => void,
  priority = 0
) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastData, setLastData] = useState<T | null>(null);
  
  const observer = useMemo(() => ({
    id: observerId,
    priority,
    update: (data: T) => {
      setLastData(data);
      onUpdate(data);
    },
  }), [observerId, priority, onUpdate]);
  
  const subscribe = useCallback(() => {
    subject.addObserver(observer);
    setIsSubscribed(true);
  }, [subject, observer]);
  
  const unsubscribe = useCallback(() => {
    subject.removeObserver(observerId);
    setIsSubscribed(false);
  }, [subject, observerId]);
  
  useEffect(() => {
    return () => {
      if (isSubscribed) {
        subject.removeObserver(observerId);
      }
    };
  }, [subject, observerId, isSubscribed]);
  
  return {
    subscribe,
    unsubscribe,
    isSubscribed,
    lastData,
    observerCount: subject.getObservers().length,
  };
}

// 新闻发布组件
function NewsPublisher() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NewsItem['category']>('tech');
  const [urgent, setUrgent] = useState(false);
  
  const handlePublish = () => {
    if (title.trim() && content.trim()) {
      newsAgency.publishNews({
        title: title.trim(),
        content: content.trim(),
        category,
        urgent,
      });
      setTitle('');
      setContent('');
      setUrgent(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📰 新闻发布</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="新闻标题..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="新闻内容..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NewsItem['category'])}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tech">科技</option>
              <option value="sports">体育</option>
              <option value="business">商业</option>
              <option value="entertainment">娱乐</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">紧急</span>
            </label>
          </div>
        </div>
        
        <button
          onClick={handlePublish}
          disabled={!title.trim() || !content.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          发布新闻
        </button>
      </div>
    </div>
  );
}

// 新闻订阅组件
function NewsSubscriber({ subscriberId, title }: { subscriberId: string; title: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<NewsItem['category'] | 'all'>('all');
  
  const handleNewsUpdate = useCallback((newsItem: NewsItem) => {
    setNews(prev => [newsItem, ...prev.slice(0, 9)]); // 保持最新10条
  }, []);
  
  const observer = useObserver(
    newsAgency,
    subscriberId,
    handleNewsUpdate,
    1 // 优先级
  );
  
  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(item => item.category === filter);
  
  const getCategoryIcon = (category: NewsItem['category']) => {
    switch (category) {
      case 'tech': return '💻';
      case 'sports': return '⚽';
      case 'business': return '💼';
      case 'entertainment': return '🎬';
      default: return '📰';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{observer.observerCount} 观察者</span>
          <button
            onClick={observer.isSubscribed ? observer.unsubscribe : observer.subscribe}
            className={`px-3 py-1 rounded text-sm ${
              observer.isSubscribed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {observer.isSubscribed ? '✅ 已订阅' : '❌ 未订阅'}
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as NewsItem['category'] | 'all')}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">所有分类</option>
          <option value="tech">科技</option>
          <option value="sports">体育</option>
          <option value="business">商业</option>
          <option value="entertainment">娱乐</option>
        </select>
      </div>
      
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {filteredNews.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无新闻</div>
        ) : (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded border-l-4 ${
                item.urgent 
                  ? 'bg-red-50 border-l-red-500' 
                  : 'bg-gray-50 border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{getCategoryIcon(item.category)}</span>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {item.urgent && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">紧急</span>}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{item.content}</p>
                  <p className="text-xs text-gray-500">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 温度控制面板
function TemperatureControlPanel() {
  const [location, setLocation] = useState('客厅');
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(50);
  
  const handleUpdate = () => {
    temperatureMonitor.updateTemperature(location, temperature, humidity);
  };
  
  const locations = ['客厅', '卧室', '厨房', '办公室', '仓库'];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">🌡️ 温度控制</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            温度: {temperature}°C
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            湿度: {humidity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={humidity}
            onChange={(e) => setHumidity(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <button
          onClick={handleUpdate}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          更新温度
        </button>
      </div>
    </div>
  );
}

// 温度监控显示
function TemperatureDisplay({ displayId, title }: { displayId: string; title: string }) {
  const [readings, setReadings] = useState<TemperatureData[]>([]);
  
  const handleTemperatureUpdate = useCallback((data: TemperatureData) => {
    setReadings(prev => [data, ...prev.slice(0, 4)]); // 保持最新5条
  }, []);
  
  const observer = useObserver(
    temperatureMonitor,
    displayId,
    handleTemperatureUpdate,
    2 // 高优先级
  );
  
  const getAlertColor = (alert: TemperatureData['alert']) => {
    switch (alert) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={observer.isSubscribed ? observer.unsubscribe : observer.subscribe}
          className={`px-3 py-1 rounded text-sm ${
            observer.isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {observer.isSubscribed ? '🟢 监控中' : '🔴 未监控'}
        </button>
      </div>
      
      <div className="space-y-2">
        {readings.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无数据</div>
        ) : (
          readings.map((reading, index) => (
            <div
              key={index}
              className={`p-3 rounded border ${getAlertColor(reading.alert)}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{reading.location}</div>
                  <div className="text-sm">
                    温度: {reading.temperature}°C | 湿度: {reading.humidity}%
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded ${
                    reading.alert === 'high' ? 'bg-red-200' :
                    reading.alert === 'low' ? 'bg-blue-200' : 'bg-green-200'
                  }`}>
                    {reading.alert === 'high' ? '🔥 高温' :
                     reading.alert === 'low' ? '🧊 低温' : '✅ 正常'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {reading.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 主组件
export function ObserverPatternExample() {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h2 className="text-xl font-bold text-purple-800 mb-2">🔍 观察者模式 (Observer Pattern)</h2>
        <p className="text-purple-700 text-sm">
          观察者模式定义了一对多的依赖关系，当一个对象状态发生改变时，所有依赖于它的对象都会得到通知并自动更新。
          这是一种经典的设计模式，广泛应用于事件系统、状态管理和数据绑定中。
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <NewsPublisher />
        <NewsSubscriber subscriberId="news-sub-1" title="📱 新闻订阅 A" />
        <NewsSubscriber subscriberId="news-sub-2" title="💻 新闻订阅 B" />
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <TemperatureControlPanel />
        <TemperatureDisplay displayId="temp-display-1" title="🏠 家庭监控" />
        <TemperatureDisplay displayId="temp-display-2" title="🏢 办公监控" />
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-3">🏗️ 观察者模式特点：</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-purple-600 mb-2">核心概念</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Subject (主题):</strong> 被观察的对象，维护观察者列表</li>
              <li>• <strong>Observer (观察者):</strong> 监听主题变化的对象</li>
              <li>• <strong>松耦合:</strong> 主题和观察者之间只通过接口关联</li>
              <li>• <strong>动态关系:</strong> 运行时可以添加/移除观察者</li>
              <li>• <strong>广播通信:</strong> 一次通知，多个观察者响应</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-600 mb-2">应用场景</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Model-View:</strong> 数据模型变化通知视图更新</li>
              <li>• <strong>事件系统:</strong> DOM事件、自定义事件处理</li>
              <li>• <strong>状态管理:</strong> Redux、MobX 等状态库</li>
              <li>• <strong>实时更新:</strong> 聊天、股票价格、传感器数据</li>
              <li>• <strong>插件系统:</strong> 生命周期钩子、中间件</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
