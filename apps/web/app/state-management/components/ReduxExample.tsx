'use client';

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'; // Redux Toolkit Store 配置
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

// 🔧 Redux Toolkit Store 配置

// 定义状态类型
interface CounterState {
  value: number;
  history: number[];
}

interface TodoState {
  todos: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
  filter: 'all' | 'active' | 'completed';
}

// Counter Slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
    history: [0],
  } as CounterState,
  reducers: {
    increment: (state) => {
      state.value += 1;
      state.history.push(state.value);
    },
    decrement: (state) => {
      state.value -= 1;
      state.history.push(state.value);
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
      state.history.push(state.value);
    },
    reset: (state) => {
      state.value = 0;
      state.history = [0];
    },
  },
});

// Todo Slice
const todoSlice = createSlice({
  name: 'todos',
  initialState: {
    todos: [],
    filter: 'all',
  } as TodoState,
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      state.todos.push({
        id: Date.now(),
        text: action.payload,
        completed: false,
      });
    },
    toggleTodo: (state, action: PayloadAction<number>) => {
      const todo = state.todos.find(todo => todo.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    deleteTodo: (state, action: PayloadAction<number>) => {
      state.todos = state.todos.filter(todo => todo.id !== action.payload);
    },
    setFilter: (state, action: PayloadAction<'all' | 'active' | 'completed'>) => {
      state.filter = action.payload;
    },
  },
});

// 配置 Store
export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    todos: todoSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 导出 actions
export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions;
export const { addTodo, toggleTodo, deleteTodo, setFilter } = todoSlice.actions;

// 🎯 组件部分

// Counter 组件
function CounterComponent() {
  const { value, history } = useSelector((state: RootState) => state.counter);
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState('');

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">📊 计数器示例</h3>
      
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-blue-600 mb-2">{value}</div>
        <div className="text-sm text-gray-500">当前计数</div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button
          onClick={() => dispatch(decrement())}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          -1
        </button>
        <button
          onClick={() => dispatch(increment())}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          +1
        </button>
        <button
          onClick={() => dispatch(reset())}
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
              dispatch(incrementByAmount(Number(amount)));
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
  const { todos, filter } = useSelector((state: RootState) => state.todos);
  const dispatch = useDispatch<AppDispatch>();
  const [newTodo, setNewTodo] = useState('');

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      dispatch(addTodo(newTodo.trim()));
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
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          添加
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => dispatch(setFilter(filterType))}
            className={`px-3 py-1 rounded text-sm ${
              filter === filterType
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterType === 'all' ? '全部' : filterType === 'active' ? '未完成' : '已完成'}
          </button>
        ))}
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
                onChange={() => dispatch(toggleTodo(todo.id))}
                className="w-4 h-4 text-blue-600"
              />
              <span
                className={`flex-1 ${
                  todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => dispatch(deleteTodo(todo.id))}
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

// 主组件
export function ReduxExample() {
  return (
    <Provider store={store}>
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold text-blue-800 mb-2">🔧 Redux Toolkit</h2>
          <p className="text-blue-700 text-sm">
            Redux Toolkit 是官方推荐的 Redux 工具集，提供了更简洁的 API 和内置的最佳实践。
            特点：内置 Immer、Redux DevTools、中间件配置等。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <CounterComponent />
          <TodoComponent />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">🔍 Redux Toolkit 特点：</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>createSlice:</strong> 自动生成 action creators 和 action types</li>
            <li>• <strong>Immer 集成:</strong> 可以直接"修改"状态，内部使用不可变更新</li>
            <li>• <strong>Redux DevTools:</strong> 自动配置开发者工具</li>
            <li>• <strong>配置简化:</strong> 减少样板代码，提高开发效率</li>
            <li>• <strong>TypeScript 友好:</strong> 优秀的类型推断支持</li>
          </ul>
        </div>
      </div>
    </Provider>
  );
}
