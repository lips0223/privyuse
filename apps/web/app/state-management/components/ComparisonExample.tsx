'use client';

import { useState } from 'react';

// 📊 对比数据
const comparisonData = {
  framework: {
    name: '框架对比',
    redux: {
      name: 'Redux Toolkit',
      scores: { complexity: 7, performance: 8, typescript: 9, ecosystem: 10, learning: 6 },
      pros: [
        '最成熟的状态管理解决方案',
        '庞大的生态系统和中间件',
        '优秀的开发者工具',
        '可预测的状态更新',
        '时间旅行调试',
        '适合大型应用'
      ],
      cons: [
        '相对复杂的样板代码',
        '学习曲线陡峭',
        '对小项目可能过度工程',
        'Action 和 Reducer 分离'
      ],
      useCase: '大型复杂应用，需要可预测状态管理',
      size: '~47KB (含 React-Redux)',
      stars: '60.8k'
    },
    zustand: {
      name: 'Zustand',
      scores: { complexity: 3, performance: 9, typescript: 8, ecosystem: 6, learning: 9 },
      pros: [
        '极简的 API 设计',
        '零样板代码',
        '优秀的性能',
        '支持中间件',
        '可以在组件外使用',
        '学习成本低'
      ],
      cons: [
        '生态系统相对较小',
        '开发者工具支持有限',
        '缺乏标准化模式',
        '复杂状态逻辑可能难以组织'
      ],
      useCase: '中小型应用，追求简洁性',
      size: '~8KB',
      stars: '45.2k'
    },
    jotai: {
      name: 'Jotai',
      scores: { complexity: 5, performance: 9, typescript: 9, ecosystem: 5, learning: 7 },
      pros: [
        '原子化状态管理',
        '优秀的 TypeScript 支持',
        '自下而上的设计',
        '支持异步和 Suspense',
        '灵活的状态组合',
        '无全局状态污染'
      ],
      cons: [
        '概念相对新颖',
        '生态系统较小',
        '调试相对困难',
        '原子过多时管理复杂'
      ],
      useCase: '组件级状态管理，复杂的状态依赖',
      size: '~13KB',
      stars: '18.1k'
    }
  }
};

// 🎯 功能实现对比
const codeExamples = {
  counter: {
    title: '计数器实现',
    redux: `// Redux Toolkit
import { createSlice } from '@reduxjs/toolkit'

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    }
  }
})

// 在组件中使用
const count = useSelector(state => state.counter.value)
const dispatch = useDispatch()
dispatch(counterSlice.actions.increment())`,
    
    zustand: `// Zustand
import { create } from 'zustand'

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 }))
}))

// 在组件中使用
const { count, increment, decrement } = useCounterStore()`,

    jotai: `// Jotai
import { atom, useAtom } from 'jotai'

const countAtom = atom(0)
const incrementAtom = atom(
  null,
  (get, set) => set(countAtom, get(countAtom) + 1)
)

// 在组件中使用
const [count] = useAtom(countAtom)
const [, increment] = useAtom(incrementAtom)`
  },
  
  persistence: {
    title: '数据持久化',
    redux: `// Redux Toolkit + Redux Persist
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
  key: 'root',
  storage,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)
const store = configureStore({
  reducer: persistedReducer,
})`,

    zustand: `// Zustand with persist middleware
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user })
    }),
    { name: 'user-storage' }
  )
)`,

    jotai: `// Jotai with atomWithStorage
import { atomWithStorage } from 'jotai/utils'

const userAtom = atomWithStorage('user', null)`
  },

  async: {
    title: '异步操作',
    redux: `// Redux Toolkit Query
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (id) => \`users/\${id}\`
    })
  })
})

const { data, error, isLoading } = api.useGetUserQuery(1)`,

    zustand: `// Zustand with async actions
const useStore = create((set, get) => ({
  user: null,
  loading: false,
  fetchUser: async (id) => {
    set({ loading: true })
    try {
      const user = await fetchUserAPI(id)
      set({ user, loading: false })
    } catch (error) {
      set({ loading: false })
    }
  }
}))`,

    jotai: `// Jotai async atom
const userAtom = atom(async (get) => {
  const userId = get(userIdAtom)
  const response = await fetch(\`/api/users/\${userId}\`)
  return response.json()
})

// 使用 Suspense
const User = () => {
  const user = useAtomValue(userAtom)
  return <div>{user.name}</div>
}`
  }
};

// 📈 性能对比组件
function PerformanceChart({ data }: { data: any }) {
  const maxScore = 10;
  
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold mb-4">📈 性能对比</h3>
      
      {Object.entries(data.framework).slice(1).map(([key, lib]: [string, any]) => (
        <div key={key} className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">{lib.name}</h4>
          <div className="space-y-2">
            {Object.entries(lib.scores).map(([metric, score]: [string, any]) => {
              const percentage = (score / maxScore) * 100;
              const metricNames: { [key: string]: string } = {
                complexity: '复杂度 (越低越好)',
                performance: '性能',
                typescript: 'TypeScript 支持',
                ecosystem: '生态系统',
                learning: '学习曲线 (越高越好)'
              };
              
              return (
                <div key={metric} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {metricNames[metric]}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric === 'complexity' 
                            ? (score <= 3 ? 'bg-green-500' : score <= 6 ? 'bg-yellow-500' : 'bg-red-500')
                            : score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-8 text-sm font-medium">{score}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// 🔍 代码示例对比组件
function CodeComparison() {
  const [selectedExample, setSelectedExample] = useState<keyof typeof codeExamples>('counter');
  
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold mb-4">💻 代码对比</h3>
      
      <div className="flex gap-2 mb-4">
        {Object.entries(codeExamples).map(([key, example]) => (
          <button
            key={key}
            onClick={() => setSelectedExample(key as keyof typeof codeExamples)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              selectedExample === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {example.title}
          </button>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-3 gap-4">
        {Object.entries(codeExamples[selectedExample]).slice(1).map(([framework, code]) => (
          <div key={framework} className="border border-gray-200 rounded">
            <div className="bg-gray-50 px-3 py-2 border-b">
              <h4 className="font-medium capitalize">{framework}</h4>
            </div>
            <pre className="p-3 text-xs overflow-x-auto bg-gray-900 text-gray-100">
              <code>{code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// 📋 详细对比表格
function DetailedComparison() {
  const frameworks = Object.entries(comparisonData.framework).slice(1);
  
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">📋 详细对比</h3>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">特性</th>
            {frameworks.map(([key, lib]: [string, any]) => (
              <th key={key} className="text-left p-2">{lib.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2 font-medium">包大小</td>
            {frameworks.map(([key, lib]: [string, any]) => (
              <td key={key} className="p-2">{lib.size}</td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">GitHub Stars</td>
            {frameworks.map(([key, lib]: [string, any]) => (
              <td key={key} className="p-2">{lib.stars}</td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">适用场景</td>
            {frameworks.map(([key, lib]: [string, any]) => (
              <td key={key} className="p-2">{lib.useCase}</td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium align-top">优点</td>
            {frameworks.map(([key, lib]: [string, any]) => (
              <td key={key} className="p-2">
                <ul className="text-xs space-y-1">
                  {lib.pros.slice(0, 3).map((pro: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-1">✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-2 font-medium align-top">缺点</td>
            {frameworks.map(([key, lib]: [string, any]) => (
              <td key={key} className="p-2">
                <ul className="text-xs space-y-1">
                  {lib.cons.slice(0, 3).map((con: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-red-500 mr-1">✗</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// 🎯 选择建议组件
function SelectionGuide() {
  const recommendations = [
    {
      title: '🚀 选择 Redux Toolkit',
      conditions: [
        '大型复杂应用 (100+ 组件)',
        '需要时间旅行调试',
        '团队熟悉 Redux 生态',
        '需要丰富的中间件支持',
        '状态逻辑复杂且可预测性要求高'
      ],
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      title: '⚡ 选择 Zustand',
      conditions: [
        '中小型应用 (< 50 组件)',
        '追求极简的代码体验',
        '快速原型开发',
        '团队新手较多',
        '不需要复杂的状态逻辑'
      ],
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      title: '⚛️ 选择 Jotai',
      conditions: [
        '组件间状态依赖复杂',
        '需要细粒度的状态控制',
        '大量异步状态管理',
        '追求性能优化',
        '喜欢函数式编程范式'
      ],
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">🎯 选择建议</h3>
      
      <div className="grid md:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => (
          <div key={idx} className={`p-4 rounded-lg border ${rec.color}`}>
            <h4 className="font-semibold mb-3">{rec.title}</h4>
            <ul className="text-sm space-y-2">
              {rec.conditions.map((condition, condIdx) => (
                <li key={condIdx} className="flex items-start">
                  <span className="mr-2">•</span>
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2">💡 通用建议</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• 小项目或学习阶段：<strong>Zustand</strong> (最容易上手)</li>
          <li>• 企业级应用：<strong>Redux Toolkit</strong> (最成熟稳定)</li>
          <li>• 性能要求高：<strong>Jotai</strong> (原子化更新)</li>
          <li>• 可以在同一项目中混合使用不同的状态管理库</li>
        </ul>
      </div>
    </div>
  );
}

// 主组件
export function ComparisonExample() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔍 状态管理库对比</h2>
        <p className="text-gray-600">
          Redux Toolkit、Zustand 和 Jotai 的全面对比分析，帮助你选择最适合的状态管理解决方案。
        </p>
      </div>

      <PerformanceChart data={comparisonData} />
      
      <CodeComparison />
      
      <DetailedComparison />
      
      <SelectionGuide />
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📚 学习资源</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-600 mb-2">Redux Toolkit</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <a href="https://redux-toolkit.js.org/" className="hover:text-purple-600">官方文档</a></li>
              <li>• <a href="https://react-redux.js.org/" className="hover:text-purple-600">React Redux</a></li>
              <li>• Redux DevTools Extension</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-600 mb-2">Zustand</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <a href="https://zustand-demo.pmnd.rs/" className="hover:text-green-600">官方文档</a></li>
              <li>• <a href="https://github.com/pmndrs/zustand" className="hover:text-green-600">GitHub 仓库</a></li>
              <li>• Zustand DevTools Middleware</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-600 mb-2">Jotai</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• <a href="https://jotai.org/" className="hover:text-blue-600">官方文档</a></li>
              <li>• <a href="https://github.com/pmndrs/jotai" className="hover:text-blue-600">GitHub 仓库</a></li>
              <li>• Jotai DevTools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
