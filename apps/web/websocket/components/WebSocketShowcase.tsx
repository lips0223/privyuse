'use client';

import { useState } from 'react';
import { WebSocketTest } from './WebSocketTest';
import { ChatRoom } from './ChatRoom';
import { AdvancedWebSocketDemo } from './AdvancedWebSocketDemo';

type DemoType = 'basic' | 'chat' | 'advanced';

export function WebSocketShowcase() {
  const [currentDemo, setCurrentDemo] = useState<DemoType>('basic');

  const demos = [
    {
      id: 'basic' as const,
      title: '基础 WebSocket 测试',
      description: '基本的 WebSocket 连接、发送和接收消息功能',
      features: ['连接管理', '消息发送/接收', '状态显示', '消息历史'],
    },
    {
      id: 'chat' as const,
      title: '实时聊天室',
      description: '完整的实时聊天应用，展示 WebSocket 的实际应用场景',
      features: ['多用户聊天', '用户列表', '系统消息', '实时通信'],
    },
    {
      id: 'advanced' as const,
      title: '高级 WebSocket 功能',
      description: '包含自动重连、心跳检测、消息队列等生产级功能',
      features: ['自动重连', '心跳检测', '消息队列', '连接监控', '统计信息'],
    },
  ];

  const renderCurrentDemo = () => {
    switch (currentDemo) {
      case 'basic':
        return <WebSocketTest defaultUrl="ws://localhost:8080" />;
      case 'chat':
        return <ChatRoom serverUrl="ws://localhost:8081" />;
      case 'advanced':
        return <AdvancedWebSocketDemo defaultUrl="ws://localhost:8080" />;
      default:
        return <WebSocketTest defaultUrl="ws://localhost:8080" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                WebSocket 完整示例
              </h1>
              <p className="text-gray-600 mt-1">
                前端工程师必备的 WebSocket 技术演示
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                📖 MDN 文档
              </a>
              <a
                href="/websocket/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                📋 学习指南
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 演示选择器 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {demos.map((demo) => (
            <div
              key={demo.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                currentDemo === demo.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setCurrentDemo(demo.id)}
            >
              <h3 className="text-lg font-semibold mb-2">{demo.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{demo.description}</p>
              <div className="space-y-1">
                {demo.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              {currentDemo === demo.id && (
                <div className="mt-4 text-blue-600 text-sm font-medium">
                  ✨ 当前演示
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 服务器启动提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-yellow-600 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                启动 WebSocket 服务器
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">在测试之前，请先启动 WebSocket 服务器：</p>
                <div className="bg-yellow-100 rounded p-2 font-mono text-xs">
                  <p># 进入服务器目录</p>
                  <p>cd apps/web/websocket/server</p>
                  <p></p>
                  <p># 安装依赖</p>
                  <p>npm install</p>
                  <p></p>
                  <p># 启动基础测试服务器 (端口 8080)</p>
                  <p>PORT=8080 node simple-ws-server.js</p>
                  <p></p>
                  <p># 或启动聊天服务器</p>
                  <p>PORT=8080 node chat-server.js</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 当前演示内容 */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderCurrentDemo()}
        </div>
      </div>

      {/* 页脚 */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">学习资源</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-blue-600">WebSocket API 文档</a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">React Hook 最佳实践</a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">WebSocket 安全指南</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">示例场景</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>实时聊天应用</li>
                <li>股票价格更新</li>
                <li>在线游戏同步</li>
                <li>协作编辑工具</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">技术栈</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>React + TypeScript</li>
                <li>Next.js</li>
                <li>Tailwind CSS</li>
                <li>Node.js WebSocket</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>WebSocket 技术演示 - 专为前端工程师打造的完整学习资源</p>
          </div>
        </div>
      </div>
    </div>
  );
}
