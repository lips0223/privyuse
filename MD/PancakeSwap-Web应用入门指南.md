# 🥞 PancakeSwap Web 应用入门指南

## 📖 项目概述

PancakeSwap Web 应用是一个功能完整的去中心化交易所(DEX)前端，支持多个 EVM 兼容区块链网络。本项目采用现代化的 Web 技术栈，提供代币交换、流动性挖矿、质押等 DeFi 功能。

### 🎯 核心特性

- **多链支持**: 以太坊、BSC、Polygon 等 EVM 兼容链
- **完整 DeFi 功能**: 交换、流动性、农场、质押、预测等
- **现代化架构**: Next.js + React + TypeScript + Redux
- **企业级质量**: 完整的测试、国际化、性能优化

---

## 🚀 快速开始

### 📋 环境要求

- **Node.js**: 16+ 版本
- **内存**: 推荐 32GB (最低 16GB + 足够的 swap 空间)
- **包管理器**: pnpm (强制要求)

### 🛠️ 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/pancakeswap/pancake-frontend.git
cd pancake-frontend
```

#### 2. 安装依赖

```bash
pnpm install
```

#### 3. 启动开发服务器

```bash
# 启动Web应用 (EVM链)
pnpm dev

# 启动其他应用
pnpm dev:aptos    # Aptos链
pnpm dev:solana   # Solana链
pnpm dev:bridge   # 跨链桥
```

#### 4. 访问应用

- **主应用**: http://localhost:3000
- **Aptos 应用**: http://localhost:3002

---

## 🏗️ 目录结构详解

### 📁 根目录结构

```
pancake-frontend/
├── apps/           # 应用目录
│   ├── web/        # 主Web应用 (EVM链)
│   ├── aptos/      # Aptos链应用
│   ├── solana/     # Solana链应用
│   └── bridge/     # 跨链桥应用
├── packages/       # 共享包
└── apis/          # API服务
```

### 🎯 Web 应用核心目录 (`apps/web/src/`)

#### 📄 **根级文件**

| 文件            | 功能          | 说明                               |
| --------------- | ------------- | ---------------------------------- |
| `Providers.tsx` | 全局 Provider | React Context 提供者，管理全局状态 |
| `index.tsx`     | 应用入口      | 应用主入口点                       |
| `middleware.ts` | 中间件        | Next.js 中间件，处理路由和认证     |

#### 📱 **`pages/` - 路由页面**

##### 🔄 **核心交易功能**

```
pages/
├── swap/                    # 代币交换
│   ├── index.tsx           # 主交换界面
│   ├── limit/              # 限价单交换
│   └── twap/               # 时间加权平均价格交换
├── liquidity/              # 流动性管理
├── add/, remove/, increase/ # 流动性操作
```

##### 🚜 **DeFi 功能**

```
pages/
├── farms/           # 流动性挖矿农场
├── pools/           # Syrup池(单币质押)
├── cake-staking/    # CAKE代币质押
├── liquid-staking/  # 流动性质押
├── simple-staking/  # 简单质押
```

##### 🎮 **特色功能**

```
pages/
├── lottery.tsx      # 彩票功能
├── prediction/      # 价格预测市场
├── competition/     # 交易竞赛
├── nfts/           # NFT市场
├── pancake-squad.tsx # PancakeSquad NFT
```

##### 🛠️ **工具页面**

```
pages/
├── info/           # 数据分析面板
├── bridge/         # 跨链桥
├── buy-crypto/     # 法币购买
├── migration/      # 代币迁移
```

#### 🎨 **`views/` - UI 视图组件**

```
views/
├── Swap/              # 交换界面核心逻辑
├── SwapSimplify/      # 简化版交换界面
├── Farms/             # 农场管理界面
├── Pools/             # 资金池界面
├── Liquidity/         # 流动性管理界面
├── V3Info/            # Uniswap V3数据分析
├── LimitOrders/       # 限价单管理
├── Predictions/       # 预测市场界面
├── Profile/           # 用户档案
├── Teams/             # 团队功能
├── Voting/            # 治理投票
└── Notifications/     # 通知中心
```

#### 🧩 **`components/` - 可复用组件**

##### 核心交易组件

```
components/
├── CurrencyInput/              # 代币输入组件
├── CurrencySelect/             # 代币选择器
├── ConnectWalletButton.tsx     # 钱包连接按钮
├── NetworkSwitcher.tsx         # 网络切换器
├── ApproveConfirmButtons.tsx   # 授权确认按钮
├── TransactionConfirmationModal/ # 交易确认弹窗
└── Settings/                   # 交易设置
```

##### UI 增强组件

```
components/
├── Modal/          # 模态框组件
├── Chart/          # 图表组件
├── Toast/          # 提示消息
├── Loader/         # 加载动画
├── Layout/         # 布局组件
└── Menu/           # 导航菜单
```

#### 📊 **`state/` - 状态管理 (Redux)**

```
state/
├── swap/           # 交换状态管理
├── farms/          # 农场状态
├── farmsV3/        # V3农场状态
├── farmsV4/        # V4农场状态
├── pools/          # 资金池状态
├── user/           # 用户状态
├── wallet/         # 钱包状态
├── info/           # 数据分析状态
├── block/          # 区块链状态
├── multicall/      # 批量调用
└── lists/          # 代币列表
```

#### ⚙️ **`config/` - 配置文件**

```
config/
├── chains.ts       # 支持的区块链配置
├── nodes.ts        # RPC节点配置
├── wallet.ts       # 钱包配置
├── pools.ts        # 资金池配置
└── abi/           # 智能合约ABI
```

#### 🔧 **其他重要目录**

```
src/
├── utils/          # 工具函数 (价格计算、格式化等)
├── hooks/          # 自定义React Hooks
├── queries/        # GraphQL查询和API调用
├── contexts/       # React上下文管理
├── lib/           # 第三方库配置
└── style/         # 样式文件
```

---

## 💡 开发指南

### 🎯 **添加新功能页面**

#### 1. 创建页面文件

```typescript
// src/pages/my-feature/index.tsx
import { NextPageWithLayout } from 'utils/page.types'
import MyFeatureView from 'views/MyFeature'

const MyFeaturePage: NextPageWithLayout = () => {
  return <MyFeatureView />
}

MyFeaturePage.chains = [] // 支持的链
export default MyFeaturePage
```

#### 2. 创建视图组件

```typescript
// src/views/MyFeature/index.tsx
import { Page } from '@pancakeswap/uikit'

const MyFeatureView = () => {
  return (
    <Page>
      <h1>我的新功能</h1>
      {/* 功能内容 */}
    </Page>
  )
}

export default MyFeatureView
```

#### 3. 添加状态管理 (如需要)

```typescript
// src/state/myFeature/index.ts
import { createSlice } from '@reduxjs/toolkit'

const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState: {
    // 初始状态
  },
  reducers: {
    // 状态操作
  },
})

export default myFeatureSlice.reducer
```

### 🔗 **集成新区块链**

#### 1. 添加链配置

```typescript
// src/config/chains.ts
export const MY_CHAIN: Chain = {
  id: 123456,
  name: 'My Chain',
  network: 'mychain',
  nativeCurrency: {
    decimals: 18,
    name: 'My Token',
    symbol: 'MYT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mychain.com'] },
  },
  // ... 其他配置
}
```

#### 2. 添加到支持列表

```typescript
// utils/wagmi.ts
export const CHAIN_IDS = [
  // 现有链...
  MY_CHAIN.id,
]
```

### 🎨 **自定义组件开发**

#### 使用 UIKit 组件

```typescript
import { Box, Button, Modal, useModal } from '@pancakeswap/uikit'

const MyComponent = () => {
  const [onPresentModal] = useModal(
    <Modal title="我的模态框">
      <Box p="24px">内容</Box>
    </Modal>,
  )

  return <Button onClick={onPresentModal}>打开模态框</Button>
}
```

---

## 🔧 构建和部署

### 📦 **分批构建 (推荐)**

由于项目较大，建议分批构建：

```bash
# 1. 构建所有packages
pnpm build:packages

# 2. 构建Web应用
pnpm build --filter=web

# 3. 构建其他应用
pnpm build:aptos
pnpm build:solana
```

### 🚀 **生产环境构建**

```bash
# 设置环境变量
export NODE_OPTIONS="--max-old-space-size=8192"
export TURBO_CONCURRENCY=2

# 构建
pnpm build

# 启动生产服务器
pnpm start
```

### 🐳 **Docker 部署**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 🧪 测试

### 🔍 **运行测试**

```bash
# 运行所有测试
pnpm test:ci

# 运行特定应用测试
pnpm test --filter=web

# 运行类型检查
pnpm build:check
```

### 📝 **测试示例**

```typescript
// __tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@pancakeswap/uikit'

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

---

## 🌍 国际化

### 📚 **添加翻译**

```json
// locales/zh-CN.json
{
  "Swap": "交换",
  "Liquidity": "流动性",
  "Farms": "农场"
}
```

### 🔤 **使用翻译**

```typescript
import { useTranslation } from '@pancakeswap/localization'

const MyComponent = () => {
  const { t } = useTranslation()

  return <h1>{t('Swap')}</h1>
}
```

---

## 🛡️ 最佳实践

### 📏 **代码规范**

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 规则
- 组件使用函数式写法
- 自定义 Hooks 封装业务逻辑

### 🚀 **性能优化**

- 使用 React.memo 优化重渲染
- 懒加载大型组件
- 图片压缩和优化
- 代码分割和 tree shaking

### 🔒 **安全考虑**

- 输入验证和清理
- CSP (内容安全策略)
- 防止 XSS 攻击
- 安全的随机数生成

---

## 🆘 常见问题

### ❓ **构建问题**

**Q: 构建时内存不足怎么办？**

```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=8192"

# 减少并发数
export TURBO_CONCURRENCY=2

# 分批构建
pnpm build:packages
pnpm build --filter=web
```

**Q: 端口被占用？**

```bash
# 查找占用进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 使用其他端口
pnpm dev -- -p 3001
```

### 🔧 **开发问题**

**Q: 钱包连接失败？**

- 检查网络配置是否正确
- 确认钱包插件已安装
- 验证链 ID 配置

**Q: 代币不显示？**

- 检查代币地址是否正确
- 确认代币在支持的链上
- 验证代币列表配置

---

## 📚 相关资源

### 🔗 **官方链接**

- [PancakeSwap 官网](https://pancakeswap.finance)
- [GitHub 仓库](https://github.com/pancakeswap/pancake-frontend)
- [开发文档](https://docs.pancakeswap.finance)

### 🛠️ **技术文档**

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://reactjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Redux Toolkit](https://redux-toolkit.js.org)

### 🎨 **设计系统**

- [PancakeSwap UIKit](https://github.com/pancakeswap/pancake-frontend/tree/develop/packages/uikit)
- [Styled Components](https://styled-components.com)

---

## 🤝 贡献指南

1. **Fork 项目** 到你的 GitHub
2. **创建功能分支**: `git checkout -b feature/amazing-feature`
3. **提交更改**: `git commit -m 'Add amazing feature'`
4. **推送分支**: `git push origin feature/amazing-feature`
5. **创建 Pull Request**

### 📝 **贡献要求**

- 代码必须通过 ESLint 检查
- 新功能需要添加测试
- 更新相关文档
- 遵循现有代码风格

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

**🎉 欢迎来到 PancakeSwap 生态系统！Happy Coding! 🥞**
