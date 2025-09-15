'use client';

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomWithReducer, atomWithReset, RESET } from 'jotai/utils';
import { useState, useMemo } from 'react';

// ⚛️ Jotai Atoms 定义

// 基础原子
const countAtom = atom(0);
const countHistoryAtom = atom<number[]>([0]);

// 派生原子 (计算属性)
const doubleCountAtom = atom((get) => get(countAtom) * 2);
const isEvenAtom = atom((get) => get(countAtom) % 2 === 0);

// 写入原子 (action)
const incrementAtom = atom(
  null,
  (get, set) => {
    const newCount = get(countAtom) + 1;
    set(countAtom, newCount);
    set(countHistoryAtom, [...get(countHistoryAtom), newCount]);
  }
);

const decrementAtom = atom(
  null,
  (get, set) => {
    const newCount = get(countAtom) - 1;
    set(countAtom, newCount);
    set(countHistoryAtom, [...get(countHistoryAtom), newCount]);
  }
);

const incrementByAmountAtom = atom(
  null,
  (get, set, amount: number) => {
    const newCount = get(countAtom) + amount;
    set(countAtom, newCount);
    set(countHistoryAtom, [...get(countHistoryAtom), newCount]);
  }
);

// 重置原子
const resetCounterAtom = atomWithReset(0);

// Todo 相关原子
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const todosAtom = atom<Todo[]>([]);
const todoFilterAtom = atom<'all' | 'active' | 'completed'>('all');

// 添加 Todo 的原子
const addTodoAtom = atom(
  null,
  (get, set, text: string) => {
    console.log("Adding todo:", text);
    const todos = get(todosAtom);
    console.log("Current todos:", todos);
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date(),
    };
    set(todosAtom, [...todos, newTodo]);
  }
);

// 切换 Todo 状态的原子
const toggleTodoAtom = atom(
  null,
  (get, set, id: number) => {
    const todos = get(todosAtom);
    set(todosAtom, todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }
);

// 删除 Todo 的原子
const deleteTodoAtom = atom(
  null,
  (get, set, id: number) => {
    const todos = get(todosAtom);
    set(todosAtom, todos.filter(todo => todo.id !== id));
  }
);

// 过滤后的 todos (派生原子)
const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom);
  const filter = get(todoFilterAtom);
  
  if (filter === 'active') return todos.filter(todo => !todo.completed);
  if (filter === 'completed') return todos.filter(todo => todo.completed);
  return todos;
});

// Todo 统计信息 (派生原子)
const todoStatsAtom = atom((get) => {
  const todos = get(todosAtom);
  return {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
  };
});

// 用户信息原子 (带持久化，添加错误处理)
const userAtom = atomWithStorage<{
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    language: 'zh' | 'en';
  };
} | null>('jotai-user', null, undefined, { 
  getOnInit: true 
});

// 用户配置文件原子 (同步派生，避免异步问题)
const userProfileAtom = atom((get) => {
  const user = get(userAtom);
  if (!user) return null;
  
  // 同步生成用户配置，避免异步问题
  return {
    ...user,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
    lastLogin: new Date().toISOString(),
    posts: Math.floor(Math.random() * 100),
    followers: Math.floor(Math.random() * 1000),
  };
});

// Reducer 原子示例
interface ShoppingCart {
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: { id: number; name: string; price: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: ShoppingCart, action: CartAction): ShoppingCart => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        };
      } else {
        const newItems = [...state.items, { ...action.payload, quantity: 1 }];
        return {
          items: newItems,
          total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        };
      }
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload.id);
      return {
        items: filteredItems,
        total: filteredItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      return {
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    default:
      return state;
  }
};

const cartAtom = atomWithReducer({ items: [], total: 0 }, cartReducer);

// 🎯 组件部分

// Counter 组件
function CounterComponent() {
  const [count, setCount] = useAtom(countAtom);
  const [history] = useAtom(countHistoryAtom);
  const doubleCount = useAtomValue(doubleCountAtom);
  const isEven = useAtomValue(isEvenAtom);
  const increment = useSetAtom(incrementAtom);
  const decrement = useSetAtom(decrementAtom);
  const incrementByAmount = useSetAtom(incrementByAmountAtom);
  const [amount, setAmount] = useState('');

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📊 计数器示例</h3>
      
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-purple-600 mb-2">{count}</div>
        <div className="text-sm text-gray-500">当前计数</div>
        <div className="text-lg text-purple-500 mt-2">双倍: {doubleCount}</div>
        <div className="text-sm text-gray-600">
          {isEven ? '偶数 🎯' : '奇数 🎲'}
        </div>
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
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          +1
        </button>
        <button
          onClick={() => setCount(0)}
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
  const [todos] = useAtom(filteredTodosAtom);
  const [filter, setFilter] = useAtom(todoFilterAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const deleteTodo = useSetAtom(deleteTodoAtom);
  const stats = useAtomValue(todoStatsAtom);
  const [newTodo, setNewTodo] = useState('');

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
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleAddTodo}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
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
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterType === 'all' ? '全部' : filterType === 'active' ? '未完成' : '已完成'}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无任务</div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-2 border border-gray-200 rounded"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="w-4 h-4 text-purple-600"
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
          总计: {stats.total} | 已完成: {stats.completed} | 未完成: {stats.active}
        </div>
      </div>
    </div>
  );
}

// 购物车组件 (Reducer 示例)
function ShoppingCartComponent() {
  const [cart, dispatch] = useAtom(cartAtom);

  const products = [
    { id: 1, name: '苹果', price: 5 },
    { id: 2, name: '香蕉', price: 3 },
    { id: 3, name: '橙子', price: 4 },
    { id: 4, name: '葡萄', price: 8 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">🛒 购物车示例 (Reducer)</h3>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">商品列表:</h4>
        <div className="space-y-2">
          {products.map(product => (
            <div key={product.id} className="flex justify-between items-center p-2 border rounded">
              <span>{product.name} - ¥{product.price}</span>
              <button
                onClick={() => dispatch({ type: 'ADD_ITEM', payload: product })}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                添加
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">购物车:</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="text-gray-500 text-center py-2">购物车为空</div>
          ) : (
            cart.items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                <span>{item.name} x {item.quantity}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => dispatch({ 
                      type: 'UPDATE_QUANTITY', 
                      payload: { id: item.id, quantity: item.quantity - 1 }
                    })}
                    className="px-2 py-1 bg-gray-300 rounded text-sm"
                  >
                    -
                  </button>
                  <button
                    onClick={() => dispatch({ 
                      type: 'UPDATE_QUANTITY', 
                      payload: { id: item.id, quantity: item.quantity + 1 }
                    })}
                    className="px-2 py-1 bg-gray-300 rounded text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } })}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">总计: ¥{cart.total}</span>
          <button
            onClick={() => dispatch({ type: 'CLEAR_CART' })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            清空购物车
          </button>
        </div>
      </div>
    </div>
  );
}

// 用户组件 (异步原子示例)
function UserComponent() {
  const [user, setUser] = useAtom(userAtom);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    if (name && email) {
      setUser({
        name,
        email,
        preferences: { theme: 'light', language: 'zh' },
      });
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
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
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
              onClick={() => setUser(prev => prev ? { 
                ...prev, 
                preferences: { ...prev.preferences, theme: 'light' }
              } : null)}
              className={`px-3 py-1 rounded text-sm ${
                user.preferences.theme === 'light' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-200'
              }`}
            >
              明亮
            </button>
            <button
              onClick={() => setUser(prev => prev ? { 
                ...prev, 
                preferences: { ...prev.preferences, theme: 'dark' }
              } : null)}
              className={`px-3 py-1 rounded text-sm ${
                user.preferences.theme === 'dark' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-200'
              }`}
            >
              暗黑
            </button>
          </div>
        </div>
        <button
          onClick={() => setUser(null)}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}

// 主组件
export function JotaiExample() {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h2 className="text-xl font-bold text-purple-800 mb-2">⚛️ Jotai</h2>
        <p className="text-purple-700 text-sm">
          Jotai 采用原子化状态管理，每个状态都是独立的原子，支持派生状态和异步操作。
          特点：原子化、自下而上、无样板代码、优秀的 TypeScript 支持。
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <CounterComponent />
        <TodoComponent />
        <ShoppingCartComponent />
        <UserComponent />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🔍 Jotai 特点：</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>原子化状态:</strong> 每个状态都是独立的原子，可以单独订阅</li>
          <li>• <strong>派生状态:</strong> 基于其他原子计算的状态，自动更新</li>
          <li>• <strong>自下而上:</strong> 从组件需求出发定义状态，而不是全局状态树</li>
          <li>• <strong>无样板代码:</strong> 简洁的 API，减少重复代码</li>
          <li>• <strong>优秀的 TypeScript 支持:</strong> 完整的类型推断和类型安全</li>
        </ul>
      </div>
    </div>
  );
}
