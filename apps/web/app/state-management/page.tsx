'use client';

import { useState } from 'react';
import { ReduxExample } from './components/ReduxExample';
import { ZustandExample } from './components/ZustandExample';
import { JotaiExample } from './components/JotaiExample';
import { ComparisonExample } from './components/ComparisonExample';
import { HybridStateExample } from './components/HybridStateExample';

type Tab = 'redux' | 'zustand' | 'jotai' | 'comparison' | 'hybrid';

export default function StateManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('redux');

  const tabs = [
    { id: 'redux' as Tab, name: 'Redux Toolkit', icon: '🔧' },
    { id: 'zustand' as Tab, name: 'Zustand', icon: '🐻' },
    { id: 'jotai' as Tab, name: 'Jotai', icon: '⚛️' },
    { id: 'hybrid' as Tab, name: 'Redux + Jotai', icon: '🔧⚛️' },
    { id: 'comparison' as Tab, name: '对比演示', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'redux':
        return <ReduxExample />;
      case 'zustand':
        return <ZustandExample />;
      case 'jotai':
        return <JotaiExample />;
      case 'hybrid':
        return <HybridStateExample />;
      case 'comparison':
        return <ComparisonExample />;
      default:
        return <ReduxExample />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              现代状态管理学习
            </h1>
            <p className="mt-2 text-gray-600">
              学习 Redux Toolkit、Zustand 和 Jotai 的使用方法和最佳实践
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
