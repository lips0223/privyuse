'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useState, useEffect } from 'react';

// 🔧 Redux Toolkit 高级用法 - extraReducers 和 addCase

// 模拟 API 调用
const mockAPI = {
  fetchUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: 1, name: '张三', email: 'zhangsan@example.com', status: 'active' },
      { id: 2, name: '李四', email: 'lisi@example.com', status: 'inactive' },
      { id: 3, name: '王五', email: 'wangwu@example.com', status: 'active' },
    ];
  },
  
  createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      id: Date.now(),
      ...userData,
    };
  },
  
  updateUser: async (id: number, updates: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      id,
      name: 'Updated User',
      email: 'updated@example.com',
      status: 'active',
      ...updates,
    };
  }
};

// 类型定义
interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
}

// 🚀 创建异步 Thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const users = await mockAPI.fetchUsers();
      return users;
    } catch (error) {
      return rejectWithValue('获取用户列表失败');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Omit<User, 'id'>, { rejectWithValue }) => {
    try {
      const newUser = await mockAPI.createUser(userData);
      return newUser;
    } catch (error) {
      return rejectWithValue('创建用户失败');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, updates }: { id: number; updates: Partial<User> }, { rejectWithValue }) => {
    try {
      const updatedUser = await mockAPI.updateUser(id, updates);
      return updatedUser;
    } catch (error) {
      return rejectWithValue('更新用户失败');
    }
  }
);

// 🎯 Redux Slice with extraReducers
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
    selectedUser: null,
  } as UsersState,
  reducers: {
    // 普通的 reducers
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    deleteUser: (state, action: PayloadAction<number>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    }
  },
  // ✨ extraReducers - 处理异步 actions
  extraReducers: (builder) => {
    // fetchUsers 的三个状态
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // createUser 的三个状态  
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // updateUser 的三个状态
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// 创建 store
export const hybridStore = configureStore({
  reducer: {
    users: usersSlice.reducer,
  },
});

export type RootState = ReturnType<typeof hybridStore.getState>;
export type AppDispatch = typeof hybridStore.dispatch;

// 导出 actions
export const { setSelectedUser, clearError, deleteUser } = usersSlice.actions;

// ⚛️ Jotai Atoms - 用于客户端状态管理和 Redux 连接

// UI 状态原子
const uiStateAtom = atom({
  sidebarOpen: false,
  theme: 'light' as 'light' | 'dark',
  activeTab: 'list' as 'list' | 'form' | 'detail',
});

// 表单状态原子
const formStateAtom = atom({
  name: '',
  email: '',
  status: 'active' as 'active' | 'inactive',
});

// 过滤器状态原子  
const filterAtom = atomWithStorage('userFilter', {
  search: '',
  status: 'all' as 'all' | 'active' | 'inactive',
});

// Redux store 引用原子 - 让 Jotai 连接到 Redux
const reduxStoreAtom = atom<typeof hybridStore | null>(null);

// Redux 数据原子 - 存储从 Redux 获取的用户数据
const reduxUsersDataAtom = atom<User[]>([]);

// 派生原子 - 从 Redux store 获取用户数据
const reduxUsersAtom = atom(
  (get) => get(reduxUsersDataAtom),
  (get, set, users: User[]) => set(reduxUsersDataAtom, users)
);

// 派生原子 - 过滤后的用户列表 (Jotai 过滤 Redux 数据)
const filteredUsersAtom = atom((get) => {
  const users = get(reduxUsersAtom);
  const filter = get(filterAtom);
  console.log("FilteredUsersAtom - users:", users, "filter:", filter);
  if (!users.length) return [];
  
  return users.filter(user => {
    // 搜索过滤
    const matchesSearch = !filter.search || 
      user.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.search.toLowerCase());
    
    // 状态过滤
    const matchesStatus = filter.status === 'all' || user.status === filter.status;
    
    return matchesSearch && matchesStatus;
  });
});

// 统计信息原子
const userStatsAtom = atom((get) => {
  const users = get(reduxUsersAtom);
  const filteredUsers = get(filteredUsersAtom);
  
  return {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    filtered: filteredUsers.length,
  };
});

// 🎨 组件部分

// Redux 用户列表组件
function ReduxUserList() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, loading, error, selectedUser } = useSelector((state: RootState) => state.users);
  
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-blue-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={() => dispatch(clearError())}
          className="mt-2 text-red-600 hover:text-red-800"
        >
          清除错误
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">用户列表 (Redux)</h3>
        <button
          onClick={() => dispatch(fetchUsers())}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          刷新
        </button>
      </div>
      
      <div className="grid gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedUser?.id === user.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => dispatch(setSelectedUser(user))}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(deleteUser(user.id));
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Redux 用户表单组件
function ReduxUserForm() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, selectedUser } = useSelector((state: RootState) => state.users);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name,
        email: selectedUser.email,
        status: selectedUser.status,
      });
    }
  }, [selectedUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      dispatch(updateUser({ id: selectedUser.id, updates: formData }));
    } else {
      dispatch(createUser(formData));
    }
    setFormData({ name: '', email: '', status: 'active' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {selectedUser ? '编辑用户' : '创建用户'} (Redux)
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            姓名
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            邮箱
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            状态
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">激活</option>
            <option value="inactive">非激活</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '处理中...' : (selectedUser ? '更新' : '创建')}
          </button>
          
          {selectedUser && (
            <button
              type="button"
              onClick={() => {
                dispatch(setSelectedUser(null));
                setFormData({ name: '', email: '', status: 'active' });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              取消编辑
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Jotai UI 控制组件 - 真正连接 Redux 数据
function JotaiUIControls() {
  const [uiState, setUiState] = useAtom(uiStateAtom);
  const [filter, setFilter] = useAtom(filterAtom);
  const setReduxStore = useSetAtom(reduxStoreAtom);
  const [, setReduxUsers] = useAtom(reduxUsersAtom);
  const filteredUsers = useAtomValue(filteredUsersAtom);
  const stats = useAtomValue(userStatsAtom);
  
  // 使用 Redux selector 获取用户数据
  const reduxUsers = useSelector((state: RootState) => state.users.users);
  
  // 设置 Redux store 引用，让 Jotai 可以访问 Redux 数据
  useEffect(() => {
    setReduxStore(hybridStore);
  }, [setReduxStore]);
  
  // 当 Redux 用户数据变化时，同步到 Jotai
  useEffect(() => {
    setReduxUsers(reduxUsers);
  }, [reduxUsers, setReduxUsers]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">UI 控制 (Jotai)</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">主题:</label>
          <button
            onClick={() => setUiState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
            className={`px-3 py-1 rounded text-sm ${
              uiState.theme === 'light' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-800 text-white'
            }`}
          >
            {uiState.theme === 'light' ? '☀️ 明亮' : '🌙 暗黑'}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">侧边栏:</label>
          <button
            onClick={() => setUiState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))}
            className={`px-3 py-1 rounded text-sm ${
              uiState.sidebarOpen 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {uiState.sidebarOpen ? '✅ 打开' : '❌ 关闭'}
          </button>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">搜索过滤 (Jotai 过滤 Redux 数据):</label>
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            placeholder="搜索用户..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">状态过滤:</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">全部</option>
            <option value="active">激活</option>
            <option value="inactive">非激活</option>
          </select>
        </div>
        
        {/* 统计信息 - Jotai 计算 Redux 数据 */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-purple-600 mb-2">📊 统计信息 (Jotai 计算)</h4>
          <div className="space-y-1 text-xs">
            <div>总用户: {stats.total}</div>
            <div>激活: {stats.active} | 非激活: {stats.inactive}</div>
            <div className="font-medium text-purple-600">过滤结果: {stats.filtered}</div>
          </div>
        </div>
        
        {/* 过滤结果展示 - Jotai 过滤的 Redux 数据 */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-purple-600 mb-2">🔍 过滤结果 (实时)</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-xs text-gray-500">无匹配用户 (来自 Redux: {reduxUsers.length} 个用户)</div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} className="text-xs p-2 bg-purple-50 rounded flex justify-between">
                  <span>{user.name}</span>
                  <span className={`px-1 rounded ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 主组件
export function HybridStateExample() {
  return (
    <Provider store={hybridStore}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🔧⚛️ Redux + Jotai 混合状态管理</h2>
          <p className="text-gray-600 text-sm">
            演示 Redux Toolkit 的 <strong>extraReducers</strong> 和 <strong>addCase</strong> 用法，
            以及如何与 Jotai 结合使用，实现服务端状态 + 客户端状态的完美配合。
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <ReduxUserList />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <ReduxUserForm />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <JotaiUIControls />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-4">🔍 关键概念解析：</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-blue-600 mb-2">Redux extraReducers & addCase</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>extraReducers:</strong> 处理外部 actions (如异步 thunks)</li>
                <li>• <strong>addCase:</strong> 为特定 action 添加处理逻辑</li>
                <li>• <strong>pending/fulfilled/rejected:</strong> 异步操作的三个状态</li>
                <li>• <strong>createAsyncThunk:</strong> 自动生成异步 action creators</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-purple-600 mb-2">Redux + Jotai 混合策略</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Redux:</strong> 处理服务端状态 (用户数据、API 调用)</li>
                <li>• <strong>Jotai:</strong> 处理客户端状态 (UI 状态、表单、过滤器)</li>
                <li>• <strong>优势:</strong> 各自发挥所长，避免状态混乱</li>
                <li>• <strong>最佳实践:</strong> 明确状态所有权和职责边界</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-amber-50 rounded border border-amber-200">
            <h5 className="font-medium text-amber-800 mb-2">💡 实际应用建议</h5>
            <p className="text-sm text-amber-700">
              在真实项目中，使用 Redux 管理需要在组件间共享的复杂数据（如用户信息、购物车、缓存的 API 数据），
              使用 Jotai 管理组件级别的 UI 状态（如表单状态、模态框开关、过滤器设置）。
              这样既保持了状态管理的清晰性，又充分利用了两个库的优势。
            </p>
          </div>
        </div>
      </div>
    </Provider>
  );
}
