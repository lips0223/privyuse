'use client';

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useState, useEffect } from 'react';

// 🐻 Zustand Store 定义

// Counter Store
interface CounterStore {
  count: number;
  history: number[];
  increment: () => void;
  decrement: () => void;
  incrementByAmount: (amount: number) => void;
  reset: () => void;
}

// Todo Store
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoStore {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  clearCompleted: () => void;
}

// User Store (带持久化)
interface UserStore {
  user: {
    name: string;
    email: string;
    preferences: {
      theme: 'light' | 'dark';
      language: 'zh' | 'en';
    };
  } | null;
  login: (name: string, email: string) => void;
  logout: () => void;
  updatePreferences: (preferences: Partial<{ theme: 'light' | 'dark'; language: 'zh' | 'en' }>) => void;
}

// 创建 Counter Store
const useCounterStore = create<CounterStore>()(
  devtools(
    immer((set) => ({
      count: 0,
      history: [0],
      increment: () => set((state) => {
        state.count += 1;
        state.history.push(state.count);
      }),
      decrement: () => set((state) => {
        state.count -= 1;
        state.history.push(state.count);
      }),
      incrementByAmount: (amount: number) => set((state) => {
        state.count += amount;
        state.history.push(state.count);
      }),
      reset: () => set((state) => {
        state.count = 0;
        state.history = [0];
      }),
    })),
    { name: 'counter-store' }
  )
);

// 创建 Todo Store
const useTodoStore = create<TodoStore>()(
  devtools(
    immer((set) => ({
      todos: [],
      filter: 'all',
      addTodo: (text: string) => set((state) => {
        state.todos.push({
          id: Date.now(),
          text,
          completed: false,
          createdAt: new Date(),
        });
      }),
      toggleTodo: (id: number) => set((state) => {
        const todo = state.todos.find(t => t.id === id);
        if (todo) {
          todo.completed = !todo.completed;
        }
      }),
      deleteTodo: (id: number) => set((state) => {
        state.todos = state.todos.filter(t => t.id !== id);
      }),
      setFilter: (filter) => set((state) => {
        state.filter = filter;
      }),
      clearCompleted: () => set((state) => {
        state.todos = state.todos.filter(t => !t.completed);
      }),
    })),
    { name: 'todo-store' }
  )
);

// 创建 User Store (带持久化)
const useUserStore = create<UserStore>()(
  persist(
    devtools(
      immer((set) => ({
        user: null,
        login: (name: string, email: string) => set((state) => {
          state.user = {
            name,
            email,
            preferences: {
              theme: 'light',
              language: 'zh',
            },
          };
        }),
        logout: () => set((state) => {
          state.user = null;
        }),
        updatePreferences: (preferences) => set((state) => {
          if (state.user) {
            Object.assign(state.user.preferences, preferences);
          }
        }),
      })),
      { name: 'user-store' }
    ),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// 🎯 组件部分

// Counter 组件
function CounterComponent() {
  const { count, history, increment, decrement, incrementByAmount, reset } = useCounterStore();
  const [amount, setAmount] = useState('');

  // 订阅状态变化
  useEffect(() => {
    const unsubscribe = useCounterStore.subscribe(
      (state) => {
        if (state.count > 10) {
          console.log('计数器超过 10！');
        }
      }
    );
    return unsubscribe;
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📊 计数器示例</h3>
      
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-green-600 mb-2">{count}</div>
        <div className="text-sm text-gray-500">当前计数</div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button
          onClick={decrement}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          -1
        </button>
        <button
          onClick={increment}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          +1
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          重置
        </button>
      </div>

      <div className="flex gap-2 justify-center mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="输入数字"
          className="px-3 py-1 border border-gray-300 rounded text-center w-24"
        />
        <button
          onClick={() => {
            if (amount) {
              incrementByAmount(Number(amount));
              setAmount('');
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          添加
        </button>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">历史记录:</h4>
        <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
          {history.join(' → ')}
        </div>
      </div>
    </div>
  );
}

// Todo 组件
function TodoComponent() {
  const { todos, filter, addTodo, toggleTodo, deleteTodo, setFilter, clearCompleted } = useTodoStore();
  const [newTodo, setNewTodo] = useState('');

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📝 待办事项示例</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="添加新任务..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAddTodo}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          添加
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 rounded text-sm ${
              filter === filterType
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterType === 'all' ? '全部' : filterType === 'active' ? '未完成' : '已完成'}
          </button>
        ))}
        <button
          onClick={clearCompleted}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          清除已完成
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredTodos.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无任务</div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-2 border border-gray-200 rounded"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="w-4 h-4 text-green-600"
              />
              <div className="flex-1">
                <span
                  className={`block ${
                    todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {todo.text}
                </span>
                <span className="text-xs text-gray-400">
                  {todo.createdAt.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="text-sm text-gray-600">
          总计: {todos.length} | 已完成: {todos.filter(t => t.completed).length} | 
          未完成: {todos.filter(t => !t.completed).length}
        </div>
      </div>
    </div>
  );
}

// User 组件 (带持久化演示)
function UserComponent() {
  const { user, login, logout, updatePreferences } = useUserStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    if (name && email) {
      login(name, email);
      setName('');
      setEmail('');
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">👤 用户登录</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="用户名"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            登录
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * 数据会持久化到 localStorage
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">👤 用户信息</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">用户名:</label>
          <div className="font-medium">{user.name}</div>
        </div>
        <div>
          <label className="text-sm text-gray-600">邮箱:</label>
          <div className="font-medium">{user.email}</div>
        </div>
        <div>
          <label className="text-sm text-gray-600">主题:</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => updatePreferences({ theme: 'light' })}
              className={`px-3 py-1 rounded text-sm ${
                user.preferences.theme === 'light' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200'
              }`}
            >
              明亮
            </button>
            <button
              onClick={() => updatePreferences({ theme: 'dark' })}
              className={`px-3 py-1 rounded text-sm ${
                user.preferences.theme === 'dark' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200'
              }`}
            >
              暗黑
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600">语言:</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => updatePreferences({ language: 'zh' })}
              className={`px-3 py-1 rounded text-sm ${
                user.preferences.language === 'zh' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => updatePreferences({ language: 'en' })}
              className={`px-3 py-1 rounded text-sm ${
                user.preferences.language === 'en' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200'
              }`}
            >
              英文
            </button>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}

// 主组件
export function ZustandExample() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h2 className="text-xl font-bold text-green-800 mb-2">🐻 Zustand</h2>
        <p className="text-green-700 text-sm">
          Zustand 是一个轻量级的状态管理库，API 简洁，支持中间件扩展。
          特点：小巧、快速、无样板代码、TypeScript 友好。
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <CounterComponent />
        <TodoComponent />
        <UserComponent />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔍 Zustand 特点：</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>简洁 API:</strong> 极少的样板代码，易于学习和使用</li>
          <li>• <strong>中间件支持:</strong> devtools、persist、immer 等中间件</li>
          <li>• <strong>选择性订阅:</strong> 组件只在使用的状态变化时重新渲染</li>
          <li>• <strong>无 Provider:</strong> 不需要包装组件树</li>
          <li>• <strong>持久化:</strong> 内置 localStorage/sessionStorage 支持</li>
        </ul>
      </div>
    </div>
  );
}
