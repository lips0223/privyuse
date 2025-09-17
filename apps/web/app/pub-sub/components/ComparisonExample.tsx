'use client';

import React, { useState } from 'react';

// 📊 发布订阅模式对比分析

interface PatternComparison {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  complexity: 'Low' | 'Medium' | 'High';
  reactIntegration: 'Excellent' | 'Good' | 'Fair';
  performance: 'Excellent' | 'Good' | 'Fair';
  codeExample: string;
}

const patterns: PatternComparison[] = [
  {
    name: 'Context API',
    description: 'React 原生的状态共享和发布订阅机制，通过 Context.Provider 和 useContext 实现组件间通信。',
    pros: [
      'React 原生支持，无需额外依赖',
      '与组件树紧密集成',
      '自动重渲染管理',
      'TypeScript 支持良好',
      '调试工具完善'
    ],
    cons: [
      '性能开销较大（所有消费者都会重渲染）',
      '不支持组件树外通信',
      '复杂状态管理较困难',
      '缺乏中间件支持'
    ],
    useCases: [
      '组件树内的状态共享',
      '主题切换、语言设置',
      '用户认证状态',
      '简单的全局状态管理'
    ],
    complexity: 'Low',
    reactIntegration: 'Excellent',
    performance: 'Fair',
    codeExample: `// Context API 示例
const MessageContext = createContext();

function Provider({ children }) {
  const [messages, setMessages] = useState([]);
  
  const publish = (message) => {
    setMessages(prev => [...prev, message]);
  };
  
  return (
    <MessageContext.Provider value={{ messages, publish }}>
      {children}
    </MessageContext.Provider>
  );
}

function Subscriber() {
  const { messages } = useContext(MessageContext);
  return <div>{messages.map(m => <p key={m.id}>{m.text}</p>)}</div>;
}`
  },
  {
    name: 'EventEmitter',
    description: '经典的发布订阅模式实现，通过事件名称进行消息分发，支持跨组件、跨模块通信。',
    pros: [
      '灵活的事件系统',
      '支持跨组件通信',
      '事件命名空间',
      '支持一次性监听',
      '内存管理可控'
    ],
    cons: [
      '需要手动管理生命周期',
      '调试相对困难',
      '没有类型安全保障',
      '容易出现内存泄漏'
    ],
    useCases: [
      '跨组件通信',
      '插件系统',
      '实时消息系统',
      '复杂的业务事件'
    ],
    complexity: 'Medium',
    reactIntegration: 'Good',
    performance: 'Excellent',
    codeExample: `// EventEmitter 示例
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
  
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

const emitter = new EventEmitter();
emitter.on('message', (data) => console.log(data));
emitter.emit('message', 'Hello World!');`
  },
  {
    name: 'Custom Hooks',
    description: '将发布订阅逻辑封装在自定义 React Hooks 中，提供更好的代码复用性和 React 生态集成。',
    pros: [
      'React 生态集成完美',
      '代码复用性高',
      'TypeScript 支持优秀',
      '自动资源清理',
      '可组合性强'
    ],
    cons: [
      '学习曲线较陡',
      '需要深入理解 React Hooks',
      '过度抽象可能导致复杂性',
      '调试相对复杂'
    ],
    useCases: [
      '状态逻辑复用',
      '实时数据订阅',
      '复杂的异步操作',
      '跨组件的业务逻辑'
    ],
    complexity: 'High',
    reactIntegration: 'Excellent',
    performance: 'Good',
    codeExample: `// Custom Hooks 示例
function useSubscription(manager) {
  const [data, setData] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  useEffect(() => {
    if (!isSubscribed) return;
    
    const unsubscribe = manager.subscribe((newData) => {
      setData(prev => [...prev, newData]);
    });
    
    return unsubscribe;
  }, [manager, isSubscribed]);
  
  const subscribe = useCallback(() => setIsSubscribed(true), []);
  const unsubscribe = useCallback(() => setIsSubscribed(false), []);
  
  return { data, isSubscribed, subscribe, unsubscribe };
}

// 使用
function Component() {
  const { data, subscribe, unsubscribe } = useSubscription(messageManager);
  return <div>{data.map(item => <p key={item.id}>{item.text}</p>)}</div>;
}`
  },
  {
    name: 'Observer Pattern',
    description: '经典的设计模式，定义了一对多的依赖关系，当主题状态改变时通知所有观察者。',
    pros: [
      '设计模式经典',
      '松耦合架构',
      '支持优先级',
      '可扩展性好',
      '职责分离清晰'
    ],
    cons: [
      '实现相对复杂',
      '需要管理观察者生命周期',
      '可能出现循环依赖',
      '调试困难'
    ],
    useCases: [
      'Model-View 架构',
      '状态管理系统',
      '事件驱动架构',
      '插件和扩展系统'
    ],
    complexity: 'High',
    reactIntegration: 'Good',
    performance: 'Excellent',
    codeExample: `// Observer Pattern 示例
class Subject {
  constructor() {
    this.observers = [];
  }
  
  addObserver(observer) {
    this.observers.push(observer);
  }
  
  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  
  notify(data) {
    this.observers.forEach(observer => {
      observer.update(data);
    });
  }
}

class Observer {
  constructor(id, updateFn) {
    this.id = id;
    this.update = updateFn;
  }
}

const subject = new Subject();
const observer = new Observer('obs1', (data) => console.log(data));
subject.addObserver(observer);
subject.notify('Hello Observers!');`
  }
];

// 性能对比数据
const performanceData = [
  { pattern: 'Context API', memory: 'Medium', speed: 'Medium', scalability: 'Low' },
  { pattern: 'EventEmitter', memory: 'Low', speed: 'High', scalability: 'High' },
  { pattern: 'Custom Hooks', memory: 'Medium', speed: 'High', scalability: 'Medium' },
  { pattern: 'Observer Pattern', memory: 'Low', speed: 'High', scalability: 'High' },
];

// 使用场景矩阵
const useCaseMatrix = [
  { scenario: '简单状态共享', contextApi: '优秀', eventEmitter: '一般', customHooks: '好', observerPattern: '一般' },
  { scenario: '跨组件通信', contextApi: '一般', eventEmitter: '优秀', customHooks: '好', observerPattern: '优秀' },
  { scenario: '实时数据', contextApi: '一般', eventEmitter: '优秀', customHooks: '优秀', observerPattern: '优秀' },
  { scenario: 'React 集成', contextApi: '优秀', eventEmitter: '好', customHooks: '优秀', observerPattern: '好' },
  { scenario: '类型安全', contextApi: '优秀', eventEmitter: '一般', customHooks: '优秀', observerPattern: '好' },
  { scenario: '性能要求', contextApi: '一般', eventEmitter: '优秀', customHooks: '好', observerPattern: '优秀' },
];

function PatternCard({ pattern }: { pattern: PatternComparison }) {
  const [showCode, setShowCode] = useState(false);
  
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Fair': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{pattern.name}</h3>
        <span className={`px-2 py-1 rounded text-xs ${getComplexityColor(pattern.complexity)}`}>
          {pattern.complexity}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">{pattern.description}</p>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500">React 集成</div>
          <div className={`font-medium ${getRatingColor(pattern.reactIntegration)}`}>
            {pattern.reactIntegration}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">性能</div>
          <div className={`font-medium ${getRatingColor(pattern.performance)}`}>
            {pattern.performance}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">复杂度</div>
          <div className="font-medium">{pattern.complexity}</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-green-600 mb-1">✅ 优势</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {pattern.pros.slice(0, 3).map((pro, index) => (
              <li key={index}>• {pro}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium text-red-600 mb-1">❌ 劣势</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {pattern.cons.slice(0, 2).map((con, index) => (
              <li key={index}>• {con}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium text-blue-600 mb-1">🎯 适用场景</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {pattern.useCases.slice(0, 2).map((useCase, index) => (
              <li key={index}>• {useCase}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <button
        onClick={() => setShowCode(!showCode)}
        className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
      >
        {showCode ? '隐藏代码' : '查看代码示例'}
      </button>
      
      {showCode && (
        <div className="mt-4">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
            <code>{pattern.codeExample}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function PerformanceComparison() {
  const getPerformanceColor = (value: string) => {
    switch (value) {
      case 'High': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">⚡ 性能对比</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">模式</th>
              <th className="text-center py-2">内存使用</th>
              <th className="text-center py-2">执行速度</th>
              <th className="text-center py-2">可扩展性</th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map((data, index) => (
              <tr key={index} className="border-b">
                <td className="py-3 font-medium">{data.pattern}</td>
                <td className="text-center py-3">
                  <span className={`inline-block w-16 h-2 rounded ${getPerformanceColor(data.memory)}`}></span>
                  <div className="text-xs mt-1">{data.memory}</div>
                </td>
                <td className="text-center py-3">
                  <span className={`inline-block w-16 h-2 rounded ${getPerformanceColor(data.speed)}`}></span>
                  <div className="text-xs mt-1">{data.speed}</div>
                </td>
                <td className="text-center py-3">
                  <span className={`inline-block w-16 h-2 rounded ${getPerformanceColor(data.scalability)}`}></span>
                  <div className="text-xs mt-1">{data.scalability}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UseCaseMatrix() {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '优秀': return 'bg-green-100 text-green-800';
      case '好': return 'bg-blue-100 text-blue-800';
      case '一般': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">🎯 使用场景对比</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">场景</th>
              <th className="text-center py-2">Context API</th>
              <th className="text-center py-2">EventEmitter</th>
              <th className="text-center py-2">Custom Hooks</th>
              <th className="text-center py-2">Observer</th>
            </tr>
          </thead>
          <tbody>
            {useCaseMatrix.map((row, index) => (
              <tr key={index} className="border-b">
                <td className="py-3 font-medium">{row.scenario}</td>
                <td className="text-center py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getRatingColor(row.contextApi)}`}>
                    {row.contextApi}
                  </span>
                </td>
                <td className="text-center py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getRatingColor(row.eventEmitter)}`}>
                    {row.eventEmitter}
                  </span>
                </td>
                <td className="text-center py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getRatingColor(row.customHooks)}`}>
                    {row.customHooks}
                  </span>
                </td>
                <td className="text-center py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getRatingColor(row.observerPattern)}`}>
                    {row.observerPattern}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DecisionGuide() {
  const scenarios = [
    {
      title: '🏠 简单的组件状态共享',
      recommendation: 'Context API',
      reason: 'React 原生支持，简单直接，适合小型应用的主题、语言等全局状态。',
      code: 'const theme = useContext(ThemeContext);'
    },
    {
      title: '🚀 高性能实时应用',
      recommendation: 'EventEmitter',
      reason: '最低的性能开销，支持精确的事件控制，适合游戏、交易系统等。',
      code: 'emitter.emit("priceUpdate", newPrice);'
    },
    {
      title: '🧩 复杂业务逻辑复用',
      recommendation: 'Custom Hooks',
      reason: '强大的抽象能力，与 React 完美集成，适合复杂的状态逻辑。',
      code: 'const { data, subscribe } = useRealTimeData(url);'
    },
    {
      title: '🏗️ 大型架构设计',
      recommendation: 'Observer Pattern',
      reason: '经典设计模式，松耦合架构，适合复杂的企业级应用。',
      code: 'subject.addObserver(new DataObserver());'
    }
  ];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">🤔 如何选择合适的模式？</h3>
      
      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-blue-800">{scenario.title}</h4>
            <div className="mt-1">
              <span className="text-sm text-gray-600">推荐: </span>
              <span className="text-sm font-medium text-green-600">{scenario.recommendation}</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{scenario.reason}</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
              {scenario.code}
            </code>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">💡 选择建议</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>开始简单:</strong> 优先考虑 Context API，满足不了再升级</li>
          <li>• <strong>性能优先:</strong> 对性能敏感的场景选择 EventEmitter</li>
          <li>• <strong>React 生态:</strong> 深度使用 React 的项目选择 Custom Hooks</li>
          <li>• <strong>大型项目:</strong> 复杂架构考虑 Observer Pattern</li>
          <li>• <strong>混合使用:</strong> 不同场景可以使用不同的模式</li>
        </ul>
      </div>
    </div>
  );
}

export function ComparisonExample() {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <h2 className="text-xl font-bold text-indigo-800 mb-2">📊 发布订阅模式对比分析</h2>
        <p className="text-indigo-700 text-sm">
          深入对比四种主要的 React 发布订阅模式：Context API、EventEmitter、Custom Hooks 和 Observer Pattern。
          帮助你在不同场景下选择最合适的实现方案。
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {patterns.map((pattern, index) => (
          <PatternCard key={index} pattern={pattern} />
        ))}
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <PerformanceComparison />
        <UseCaseMatrix />
      </div>
      
      <DecisionGuide />
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-3">📚 总结</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">关键考虑因素</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>项目规模:</strong> 小项目用 Context API，大项目考虑 Observer</li>
              <li>• <strong>性能要求:</strong> 高性能场景优选 EventEmitter</li>
              <li>• <strong>团队技能:</strong> React 熟练度决定 Custom Hooks 的使用</li>
              <li>• <strong>维护成本:</strong> 简单模式降低维护复杂度</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">最佳实践</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>渐进式采用:</strong> 从简单模式开始，按需升级</li>
              <li>• <strong>职责分离:</strong> 不同功能模块可用不同模式</li>
              <li>• <strong>统一约定:</strong> 团队内统一命名和使用规范</li>
              <li>• <strong>错误处理:</strong> 所有模式都要考虑异常情况</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
