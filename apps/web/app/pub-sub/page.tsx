'use client';

import { useState } from 'react';

// 📡 Context API 发布订阅示例
function ContextExample() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold text-blue-800 mb-2">📡 Context API 发布订阅</h2>
        <p className="text-blue-700 text-sm">
          使用 React Context API 实现跨组件的状态共享和事件通信。
          Context 提供了一种在组件树中传递数据的方法，避免了 props drilling。
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">消息发布者</h3>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2">
            发送消息
          </button>
          <p className="text-sm text-gray-600">点击按钮发送消息到所有订阅者</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">消息订阅者</h3>
          <div className="p-3 bg-gray-50 rounded min-h-[100px]">
            <p className="text-sm text-gray-500">等待接收消息...</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔍 Context API 特点：</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Provider/Consumer 模式:</strong> 通过 Provider 提供数据，Consumer 消费数据</li>
          <li>• <strong>避免 Props Drilling:</strong> 无需逐层传递 props</li>
          <li>• <strong>React 原生支持:</strong> 无需额外库，内置 API</li>
          <li>• <strong>类型安全:</strong> 配合 TypeScript 有很好的类型推断</li>
        </ul>
      </div>
    </div>
  );
}

// 📢 EventEmitter 模式示例  
function EventEmitterExample() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h2 className="text-xl font-bold text-green-800 mb-2">📢 EventEmitter 模式</h2>
        <p className="text-green-700 text-sm">
          使用事件发射器模式实现松耦合的组件通信。
          组件之间通过事件进行通信，发布者和订阅者无需直接引用。
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">事件发布者</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              发布: 用户登录
            </button>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              发布: 数据更新
            </button>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              发布: 错误事件
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">事件监听器 A</h3>
          <div className="p-3 bg-gray-50 rounded min-h-[120px]">
            <p className="text-sm text-gray-500">监听所有事件...</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">事件监听器 B</h3>
          <div className="p-3 bg-gray-50 rounded min-h-[120px]">
            <p className="text-sm text-gray-500">只监听用户相关事件...</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔍 EventEmitter 特点：</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>松耦合:</strong> 发布者和订阅者互不依赖</li>
          <li>• <strong>多对多通信:</strong> 一个事件可以有多个监听器</li>
          <li>• <strong>动态订阅:</strong> 可以在运行时添加/移除监听器</li>
          <li>• <strong>事件命名:</strong> 通过事件名称进行分类管理</li>
        </ul>
      </div>
    </div>
  );
}

// 🪝 Custom Hooks 发布订阅示例
function CustomHooksExample() {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h2 className="text-xl font-bold text-purple-800 mb-2">🪝 Custom Hooks 发布订阅</h2>
        <p className="text-purple-700 text-sm">
          通过自定义 Hooks 封装发布订阅逻辑，提供更符合 React 风格的 API。
          利用 useEffect 和 useState 实现响应式的状态管理。
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">useGlobalState Hook</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">全局计数器</label>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">-</button>
                <span className="px-3 py-1 bg-gray-100 rounded">0</span>
                <button className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">用户名</label>
              <input
                type="text"
                placeholder="输入用户名"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">状态订阅者</h3>
          <div className="space-y-2">
            <div className="p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">计数器值: </span>
              <span className="font-medium">0</span>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">用户名: </span>
              <span className="font-medium">未设置</span>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">最后更新: </span>
              <span className="font-medium">-</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔍 Custom Hooks 特点：</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>React 风格:</strong> 符合 React Hooks 使用习惯</li>
          <li>• <strong>自动清理:</strong> 利用 useEffect 自动处理订阅/取消订阅</li>
          <li>• <strong>响应式更新:</strong> 状态变化自动触发组件重渲染</li>
          <li>• <strong>类型安全:</strong> TypeScript 友好，提供完整类型推断</li>
        </ul>
      </div>
    </div>
  );
}

// 👁️ 观察者模式示例
function ObserverExample() {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h2 className="text-xl font-bold text-orange-800 mb-2">👁️ 观察者模式</h2>
        <p className="text-orange-700 text-sm">
          经典的观察者设计模式实现。当主题状态发生变化时，
          所有依赖于它的观察者都会得到通知并自动更新。
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">主题 (Subject)</h3>
          <div className="space-y-2">
            <div className="p-2 bg-orange-100 rounded text-center">
              <div className="text-2xl font-bold">42</div>
              <div className="text-xs text-gray-600">当前值</div>
            </div>
            <button className="w-full px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">
              随机更新
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">观察者 A</h3>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">监听到值: </div>
            <div className="text-lg font-medium">42</div>
            <div className="text-xs text-green-600">✓ 已更新</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">观察者 B</h3>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">处理后的值: </div>
            <div className="text-lg font-medium">84</div>
            <div className="text-xs text-gray-500">(x2 处理)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">观察者 C</h3>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">格式化显示: </div>
            <div className="text-lg font-medium">"42.00"</div>
            <div className="text-xs text-gray-500">(格式化)</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔍 观察者模式特点：</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>一对多依赖:</strong> 一个主题可以有多个观察者</li>
          <li>• <strong>自动通知:</strong> 状态变化时自动通知所有观察者</li>
          <li>• <strong>松耦合设计:</strong> 主题和观察者之间松耦合</li>
          <li>• <strong>动态关系:</strong> 可以动态添加/移除观察者</li>
        </ul>
      </div>
    </div>
  );
}

// 📊 模式对比示例
function ComparisonExample() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 发布订阅模式对比</h2>
        <p className="text-gray-600">
          详细对比各种发布订阅模式的特点、优缺点和适用场景。
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-sm border">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4 font-semibold">模式</th>
              <th className="text-left p-4 font-semibold">复杂度</th>
              <th className="text-left p-4 font-semibold">性能</th>
              <th className="text-left p-4 font-semibold">React 集成</th>
              <th className="text-left p-4 font-semibold">适用场景</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4">
                <div className="flex items-center">
                  <span className="mr-2">📡</span>
                  <span className="font-medium">Context API</span>
                </div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">简单</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">中等</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">完美</span>
              </td>
              <td className="p-4 text-sm">跨组件状态共享</td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="flex items-center">
                  <span className="mr-2">📢</span>
                  <span className="font-medium">EventEmitter</span>
                </div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">中等</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">高</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">需要封装</span>
              </td>
              <td className="p-4 text-sm">复杂事件系统</td>
            </tr>
            <tr className="border-b">
              <td className="p-4">
                <div className="flex items-center">
                  <span className="mr-2">🪝</span>
                  <span className="font-medium">Custom Hooks</span>
                </div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">简单</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">高</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">完美</span>
              </td>
              <td className="p-4 text-sm">全局状态管理</td>
            </tr>
            <tr>
              <td className="p-4">
                <div className="flex items-center">
                  <span className="mr-2">👁️</span>
                  <span className="font-medium">观察者模式</span>
                </div>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">复杂</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">高</span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">需要适配</span>
              </td>
              <td className="p-4 text-sm">经典设计模式</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-green-600">✅ 推荐使用</h3>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Context API:</strong> 简单的跨组件状态共享</li>
            <li>• <strong>Custom Hooks:</strong> 全局状态管理，符合 React 习惯</li>
            <li>• <strong>Redux/Zustand:</strong> 复杂应用的状态管理</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-orange-600">⚠️ 谨慎使用</h3>
          <ul className="space-y-2 text-sm">
            <li>• <strong>EventEmitter:</strong> 需要良好的事件管理</li>
            <li>• <strong>观察者模式:</strong> 在 React 中显得过于复杂</li>
            <li>• <strong>全局变量:</strong> 破坏 React 的响应式特性</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

type Tab = 'context' | 'eventEmitter' | 'customHooks' | 'observer' | 'comparison';

export default function PubSubPage() {
  const [activeTab, setActiveTab] = useState<Tab>('context');

  const tabs = [
    { id: 'context' as Tab, name: 'Context API', icon: '📡' },
    { id: 'eventEmitter' as Tab, name: 'EventEmitter', icon: '📢' },
    { id: 'customHooks' as Tab, name: 'Custom Hooks', icon: '🪝' },
    { id: 'observer' as Tab, name: '观察者模式', icon: '👁️' },
    { id: 'comparison' as Tab, name: '模式对比', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'context':
        return <ContextExample />;
      case 'eventEmitter':
        return <EventEmitterExample />;
      case 'customHooks':
        return <CustomHooksExample />;
      case 'observer':
        return <ObserverExample />;
      case 'comparison':
        return <ComparisonExample />;
      default:
        return <ContextExample />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              React 发布订阅机制学习
            </h1>
            <p className="mt-2 text-gray-600">
              学习 React 中的各种发布订阅模式：Context API、EventEmitter、Custom Hooks、观察者模式等
            </p>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}
