# PancakeSwap 前端技术架构完整分析文档

## 目录

1. [项目概览](#项目概览)
2. [Monorepo 架构分析](#monorepo-架构分析)
3. [核心 DeFi 概念](#核心-defi-概念)
4. [技术栈详解](#技术栈详解)
5. [功能模块分析](#功能模块分析)
6. [智能合约集成](#智能合约集成)
7. [多链架构](#多链架构)
8. [状态管理体系](#状态管理体系)
9. [开发指南](#开发指南)

---

## 项目概览

PancakeSwap 是目前最大的去中心化交易所（DEX）之一，基于 **Monorepo 架构** 构建的现代化 DeFi 应用。该项目采用 **多链策略**，支持 EVM 兼容链（如 BSC、Ethereum、Arbitrum 等）以及非 EVM 链（Solana、Aptos）。

### 核心特性

- **🔄 多协议支持**: V2 AMM、V3 集中流动性、Stable Swap
- **🌐 跨链架构**: 支持 15+ 区块链网络
- **📱 响应式设计**: 适配桌面端和移动端
- **⚡ 高性能**: 基于 Next.js 和 TypeScript 构建
- **🔗 智能路由**: 自动寻找最优交易路径
- **💰 收益农场**: LP 挖矿和单币质押
- **🎮 GameFi 集成**: 游戏化功能和 NFT

### 技术规模

```
项目规模统计:
├── 总代码行数: 1,000,000+ 行
├── 支持链数: 15+ 条区块链
├── 功能模块: 20+ 个核心模块
├── 包数量: 50+ 个 npm 包
└── 日活用户: 500,000+ 用户
```

---

## Monorepo 架构分析

PancakeSwap 采用 **pnpm + Turbo** 的 Monorepo 架构，实现了代码共享、构建优化和依赖管理的统一。

### 顶层目录结构

```
pancake-frontend/
├── apps/                    # 应用层 - 各种前端应用
│   ├── web/                # 主 Web 应用（BSC、Ethereum 等）
│   ├── aptos/              # Aptos 链专用应用
│   ├── solana/             # Solana 链专用应用
│   ├── bridge/             # 跨链桥应用
│   ├── blog/               # 博客系统
│   ├── games/              # 游戏模块
│   ├── gamification/       # 游戏化功能
│   └── e2e/               # 端到端测试
│
├── packages/               # 共享包层 - 可复用的业务逻辑
│   ├── uikit/             # UI 组件库
│   ├── swap-sdk/          # 交换核心 SDK
│   ├── v3-sdk/            # V3 流动性 SDK
│   ├── chains/            # 链配置和工具
│   ├── wagmi/             # Web3 钱包集成
│   ├── tokens/            # 代币配置
│   ├── farms/             # 农场数据
│   ├── multicall/         # 批量调用工具
│   └── ...               # 更多业务包
│
├── apis/                  # API 服务层
│   ├── farms/             # 农场数据 API
│   ├── routing/           # 路由算法 API
│   └── proxy-worker/      # 代理服务
│
└── scripts/               # 构建和部署脚本
```

### 包管理策略

#### 依赖管理

```json
// 根目录 package.json
{
  "packageManager": "pnpm@10.13.1",
  "workspaces": ["apps/*", "packages/*", "packages/routing-sdk/addons/**", "apis/*", "scripts"]
}
```

#### 构建优化

```json
// turbo.json - 构建流水线配置
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### apps/ 应用层详解

#### 1. web/ - 主应用

- **功能**: EVM 链的核心 DEX 功能
- **技术**: Next.js 14, React 18, TypeScript
- **特色**: 支持 BSC、Ethereum、Arbitrum、Base 等链

#### 2. solana/ - Solana 应用

- **功能**: Solana 生态的 DEX 功能
- **技术**: Next.js + Solana Web3.js
- **特色**: Jupiter 集成、Solana 钱包适配

#### 3. aptos/ - Aptos 应用

- **功能**: Aptos 生态的 DEX 功能
- **技术**: Next.js + Aptos SDK
- **特色**: Move 合约集成

### packages/ 共享包层详解

#### 核心业务包

```
packages/
├── swap-sdk/              # 交换核心逻辑
├── v3-sdk/               # Uniswap V3 兼容实现
├── stable-swap-sdk/      # 稳定币交换算法
├── smart-router/         # 智能路由算法
├── farms/                # 流动性挖矿逻辑
├── pools/                # 流动性池管理
└── multicall/            # 批量合约调用
```

#### 基础设施包

```
packages/
├── chains/               # 区块链配置和工具
├── tokens/               # 代币信息和配置
├── wagmi/                # Web3 钱包集成封装
├── hooks/                # 通用 React Hooks
├── utils/                # 工具函数集合
└── uikit/                # UI 组件库
```

#### 前端框架包

```
packages/
├── widgets-internal/     # 内部组件库
├── ui-wallets/          # 钱包 UI 组件
├── localization/        # 国际化支持
└── next-config/         # Next.js 配置
```

---

## DeFi 核心概念详解

PancakeSwap 作为领先的去中心化交易所，实现了完整的 DeFi 生态系统。

### 自动化做市商 (AMM)

#### 恒定乘积公式

```
x * y = k
```

- **x**: Token A 的数量
- **y**: Token B 的数量
- **k**: 恒定值（流动性常数）

#### 价格发现机制

```typescript
// 价格计算示例
const getPrice = (reserveIn: bigint, reserveOut: bigint) => {
  return (reserveOut * 10n ** 18n) / reserveIn
}

// 滑点计算
const calculateSlippage = (inputAmount: bigint, reserveIn: bigint, reserveOut: bigint) => {
  const outputAmount = (inputAmount * reserveOut) / (reserveIn + inputAmount)
  const priceImpact = (inputAmount * 100n) / reserveIn
  return priceImpact
}
```

### 流动性池 (Liquidity Pools)

#### V2 池（均匀流动性）

```typescript
interface LiquidityPoolV2 {
  token0: Token
  token1: Token
  reserve0: bigint
  reserve1: bigint
  totalSupply: bigint
  fee: number // 0.25% 或 0.01%
}

// 添加流动性
const addLiquidity = (amountA: bigint, amountB: bigint, reserveA: bigint, reserveB: bigint, totalSupply: bigint) => {
  const liquidity = Math.min((amountA * totalSupply) / reserveA, (amountB * totalSupply) / reserveB)
  return liquidity
}
```

#### V3 池（集中流动性）

```typescript
interface LiquidityPoolV3 {
  token0: Token
  token1: Token
  fee: number
  tickSpacing: number
  liquidity: bigint
  sqrtPriceX96: bigint
  tick: number
}

// 价格范围计算
const getTickFromPrice = (price: number, token0Decimals: number, token1Decimals: number) => {
  const adjustedPrice = price * 10 ** (token0Decimals - token1Decimals)
  return Math.floor(Math.log(adjustedPrice) / Math.log(1.0001))
}
```

### 收益农场 (Yield Farming)

#### 单币质押

```typescript
interface SingleStakePool {
  stakingToken: Token // 质押代币
  rewardToken: Token // 奖励代币
  apr: number // 年化收益率
  totalStaked: bigint // 总质押量
  rewardPerBlock: bigint // 每区块奖励
}

// 收益计算
const calculateRewards = (userStake: bigint, totalStaked: bigint, rewardPerBlock: bigint, blocksPassed: number) => {
  const userShare = userStake / totalStaked
  return userShare * rewardPerBlock * BigInt(blocksPassed)
}
```

#### LP 代币农场

```typescript
interface LPFarm {
  lpToken: Token // LP 代币
  rewardTokens: Token[] // 多重奖励代币
  multiplier: number // 权重倍数
  allocPoint: number // 分配点数
  lastRewardBlock: number // 最后奖励区块
}

// 多重奖励计算
const calculateMultiRewards = (
  lpAmount: bigint,
  poolAllocPoint: number,
  totalAllocPoint: number,
  rewardPerBlock: bigint[],
) => {
  const poolShare = poolAllocPoint / totalAllocPoint
  return rewardPerBlock.map((reward) => reward * BigInt(poolShare))
}
```

### 预测市场 (Prediction)

#### 二元期权机制

```typescript
interface PredictionRound {
  epoch: number
  startTimestamp: number
  lockTimestamp: number
  closeTimestamp: number
  lockPrice: bigint
  closePrice: bigint
  totalAmount: bigint
  bullAmount: bigint
  bearAmount: bigint
  rewardBaseCalAmount: bigint
  rewardAmount: bigint
  oracleCalled: boolean
}

// 赔率计算
const calculateOdds = (bullAmount: bigint, bearAmount: bigint) => {
  const totalAmount = bullAmount + bearAmount
  const bullOdds = totalAmount / bullAmount
  const bearOdds = totalAmount / bearAmount
  return { bullOdds, bearOdds }
}
```

### 跨链桥 (Bridge)

#### 资产跨链机制

```typescript
interface BridgeTransaction {
  fromChain: ChainId
  toChain: ChainId
  token: Token
  amount: bigint
  recipient: string
  fee: bigint
  status: 'pending' | 'confirmed' | 'failed'
}

// 手续费计算
const calculateBridgeFee = (amount: bigint, baseFee: bigint, feeRate: number) => {
  const dynamicFee = (amount * BigInt(feeRate)) / 10000n
  return baseFee + dynamicFee
}
```

### 治理机制 (Governance)

#### 投票权重计算

```typescript
interface GovernanceProposal {
  id: number
  title: string
  description: string
  proposer: string
  startBlock: number
  endBlock: number
  forVotes: bigint
  againstVotes: bigint
  quorum: bigint
  executed: boolean
}

// CAKE 锁仓投票
const calculateVotingPower = (
  cakeAmount: bigint,
  lockDuration: number, // 周数
  maxLockDuration: number = 208, // 4年
) => {
  const lockMultiplier = lockDuration / maxLockDuration
  return cakeAmount * BigInt(Math.floor(lockMultiplier * 100))
}
```

---

## 技术栈详解

### 前端框架层

#### Next.js 14 + React 18

```json
// package.json 核心依赖
{
  "next": "14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.3"
}
```

#### 性能优化特性

- **App Router**: 新一代路由系统
- **Server Components**: 服务器端组件渲染
- **Streaming**: 流式渲染优化
- **Image Optimization**: 自动图片优化

### 区块链集成层

#### wagmi v2 + viem (EVM 链)

```typescript
// wagmi 配置示例
import { createConfig, http } from 'wagmi'
import { bsc, mainnet, arbitrum } from 'wagmi/chains'

export const config = createConfig({
  chains: [bsc, mainnet, arbitrum],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
  connectors: [injected(), walletConnect(), coinbaseWallet()],
})

// Hook 使用示例
const { address, isConnected } = useAccount()
const { data: balance } = useBalance({ address })
const { writeContract } = useWriteContract()
```

#### Solana Web3.js 集成

```typescript
// Solana 连接配置
import { Connection, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')

// Jupiter 集成示例
import { Jupiter } from '@jup-ag/core'

const jupiter = await Jupiter.load({
  connection,
  cluster: 'mainnet-beta',
  user: wallet.publicKey,
})
```

#### Aptos SDK 集成

```typescript
// Aptos 配置
import { AptosClient } from 'aptos'

const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com/v1')

// Move 合约调用
const payload = {
  type: 'entry_function_payload',
  function: '0x1::coin::transfer',
  type_arguments: ['0x1::aptos_coin::AptosCoin'],
  arguments: [recipientAddress, amount],
}
```

### 状态管理层

#### Redux Toolkit (复杂状态)

```typescript
// Store 配置
import { configureStore } from '@reduxjs/toolkit'
import { swapSlice } from './swap'
import { poolsSlice } from './pools'
import { farmsSlice } from './farms'

export const store = configureStore({
  reducer: {
    swap: swapSlice.reducer,
    pools: poolsSlice.reducer,
    farms: farmsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

// Slice 示例
const swapSlice = createSlice({
  name: 'swap',
  initialState: {
    inputCurrency: null,
    outputCurrency: null,
    inputAmount: '',
    slippage: 0.5,
  },
  reducers: {
    setInputCurrency: (state, action) => {
      state.inputCurrency = action.payload
    },
    setOutputCurrency: (state, action) => {
      state.outputCurrency = action.payload
    },
  },
})
```

#### Jotai (轻量状态)

```typescript
// 原子状态定义
import { atom } from 'jotai'

export const walletModalAtom = atom(false)
export const settingsModalAtom = atom(false)
export const userSlippageAtom = atom(0.5)

// 计算原子
export const userSettingsAtom = atom((get) => ({
  slippage: get(userSlippageAtom),
  deadline: get(userDeadlineAtom),
  expertMode: get(expertModeAtom),
}))

// 组件中使用
const [isWalletModalOpen, setWalletModalOpen] = useAtom(walletModalAtom)
```

### UI 组件层

#### PancakeSwap UIKit

```typescript
// 核心组件
import { Button, Modal, Card, Box, Flex, Text, Input, useToast } from '@pancakeswap/uikit'

// 主题系统
const theme = {
  colors: {
    primary: '#1FC7D4',
    secondary: '#7645D9',
    success: '#31D0AA',
    warning: '#FFB237',
    failure: '#ED4B9E',
  },
  breakpoints: ['370px', '576px', '852px', '968px', '1080px'],
  space: [0, 4, 8, 16, 24, 32, 48, 64],
}
```

#### Styled Components

```typescript
// 样式组件示例
import styled from 'styled-components'

const StyledCard = styled(Card)`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 24px;
  padding: 24px;

  ${({ theme }) => theme.mediaQueries.sm} {
    padding: 32px;
  }
`

const GradientButton = styled(Button)`
  background: linear-gradient(135deg, #1fc7d4 0%, #7645d9 100%);
  border: none;
  color: white;

  &:hover {
    opacity: 0.8;
  }
`
```

### 工具链层

#### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "components/*": ["./src/components/*"],
      "config/*": ["./src/config/*"]
    }
  }
}
```

#### 代码质量工具

```json
// ESLint + Prettier 配置
{
  "extends": ["@pancakeswap/eslint-config", "next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "import/no-unresolved": "error",
    "prettier/prettier": "error"
  }
}
```

---

## 功能模块详解

### 交换 (Swap) 模块

#### 智能路由算法

```typescript
// packages/smart-router/src/
interface TradeRoute {
  path: Token[]
  pools: Pool[]
  inputAmount: bigint
  outputAmount: bigint
  priceImpact: number
  fee: bigint
}

// 最优路径查找
const findBestRoute = async (
  inputToken: Token,
  outputToken: Token,
  amount: bigint,
  tradeType: 'EXACT_INPUT' | 'EXACT_OUTPUT',
) => {
  const allPools = await getAllPools([inputToken, outputToken])
  const routes = await generateRoutes(inputToken, outputToken, allPools)

  return routes
    .map((route) => calculateTradeOutput(route, amount, tradeType))
    .sort((a, b) => b.outputAmount - a.outputAmount)[0]
}

// V2 + V3 混合路由
const getMixedRoute = (v2Pools: V2Pool[], v3Pools: V3Pool[]) => {
  return {
    v2Routes: v2Pools.map((pool) => createV2Route(pool)),
    v3Routes: v3Pools.map((pool) => createV3Route(pool)),
    mixedRoutes: createMixedRoutes(v2Pools, v3Pools),
  }
}
```

#### 滑点保护机制

```typescript
// 滑点容忍度设置
const SLIPPAGE_PRESETS = {
  AUTO: 'auto', // 自动计算
  LOW: 0.1, // 0.1%
  MEDIUM: 0.5, // 0.5%
  HIGH: 1.0, // 1.0%
  CUSTOM: 'custom', // 自定义
}

// 最小输出计算
const calculateMinimumAmountOut = (outputAmount: bigint, slippageTolerance: number) => {
  const slippageAdjustment = 10000 - Math.floor(slippageTolerance * 100)
  return (outputAmount * BigInt(slippageAdjustment)) / 10000n
}
```

### 流动性池 (Pools) 模块

#### V2 流动性管理

```typescript
// 添加流动性
const addLiquidityV2 = async (
  tokenA: Token,
  tokenB: Token,
  amountADesired: bigint,
  amountBDesired: bigint,
  slippage: number,
) => {
  const pair = await getPair(tokenA, tokenB)
  const { reserveA, reserveB } = await getReserves(pair)

  // 计算最优比例
  const optimalRatio = reserveB / reserveA
  const amountBOptimal = amountADesired * optimalRatio

  if (amountBOptimal <= amountBDesired) {
    return {
      amountA: amountADesired,
      amountB: amountBOptimal,
    }
  } else {
    const amountAOptimal = amountBDesired / optimalRatio
    return {
      amountA: amountAOptimal,
      amountB: amountBDesired,
    }
  }
}
```

#### V3 集中流动性

```typescript
// 位置管理
interface PositionV3 {
  tokenId: number
  owner: string
  token0: Token
  token1: Token
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: bigint
  feeGrowthInside0LastX128: bigint
  feeGrowthInside1LastX128: bigint
  tokensOwed0: bigint
  tokensOwed1: bigint
}

// 价格范围设置
const createPositionV3 = (
  token0: Token,
  token1: Token,
  fee: number,
  priceLower: number,
  priceUpper: number,
  amount0: bigint,
  amount1: bigint,
) => {
  const tickLower = getTickFromPrice(priceLower)
  const tickUpper = getTickFromPrice(priceUpper)
  const liquidity = getLiquidityFromAmounts(getCurrentTick(), tickLower, tickUpper, amount0, amount1)

  return {
    tickLower,
    tickUpper,
    liquidity,
    amount0,
    amount1,
  }
}
```

### 农场 (Farms) 模块

#### 多重奖励系统

```typescript
// 农场配置
interface FarmConfig {
  pid: number                    // 池子 ID
  lpSymbol: string              // LP 代币符号
  lpAddress: string             // LP 合约地址
  token: Token                  // 主代币
  quoteToken: Token             // 计价代币
  multiplier: string            // 奖励倍数
  isCommunity?: boolean         // 社区农场
  auctionHostingStartSeconds?: number
  dual?: {
    rewardPerBlock: number
    earnLabel: string
    endBlock: number
  }
}

// 收益计算
const calculateFarmRewards = (
  userInfo: UserInfo,
  poolInfo: PoolInfo,
  cakePerBlock: bigint,
  totalAllocPoint: number
) => {
  const { amount, rewardDebt } = userInfo
  const { allocPoint, accCakePerShare, lastRewardBlock } = poolInfo

  const blocksSinceLastReward = getCurrentBlock() - lastRewardBlock
  const cakeReward = (cakePerBlock * BigInt(allocPoint) * BigInt(blocksSinceLastReward)) / BigInt(totalAllocPoint)
  const newAccCakePerShare = accCakePerShare + (cakeReward * 1e12n) / poolInfo.lpSupply

  const pendingCake = (amount * newAccCakePerShare) / 1e12n - rewardDebt
  return pendingCake
}
```

#### 自动复投 (Auto-Compound)

```typescript
// 自动复投池
interface AutoCakePool {
  totalShares: bigint // 总份额
  pricePerFullShare: bigint // 每份额价格
  totalCakeInVault: bigint // 金库总 CAKE
  performanceFee: number // 绩效费
  callFee: number // 调用费
  withdrawalFee: number // 提取费
  lastHarvestedAt: number // 最后收获时间
}

const calculateAutoCompoundAPY = (
  baseAPR: number,
  compoundFrequency: number, // 每年复投次数
  performanceFee: number,
) => {
  const netAPR = baseAPR * (1 - performanceFee / 10000)
  const compoundAPY = Math.pow(1 + netAPR / compoundFrequency, compoundFrequency) - 1
  return compoundAPY * 100
}
```

### 预测市场模块

#### 价格预测机制

```typescript
// 预测轮次
interface PredictionEpoch {
  epoch: number
  startTimestamp: number
  lockTimestamp: number
  closeTimestamp: number
  lockPrice: bigint // 锁定价格
  closePrice: bigint // 结算价格
  totalAmount: bigint // 总投注额
  bullAmount: bigint // 看涨投注额
  bearAmount: bigint // 看跌投注额
  rewardBaseCalAmount: bigint // 奖励基础计算额
  rewardAmount: bigint // 奖励总额
  treasuryAmount: bigint // 国库手续费
}

// 预测奖励计算
const calculatePredictionReward = (userBet: BetInfo, round: PredictionEpoch) => {
  const { position, amount } = userBet
  const { lockPrice, closePrice, totalAmount, bullAmount, bearAmount } = round

  const isWin = (position === 'Bull' && closePrice > lockPrice) || (position === 'Bear' && closePrice < lockPrice)

  if (!isWin) return 0n

  const winningPool = position === 'Bull' ? bullAmount : bearAmount
  const userShare = amount / winningPool
  const treasuryFee = (totalAmount * 3n) / 100n // 3% 手续费
  const rewardPool = totalAmount - treasuryFee

  return rewardPool * userShare
}
```

### NFT 市场模块

#### NFT 交易系统

```typescript
// NFT 集合信息
interface NFTCollection {
  address: string
  name: string
  symbol: string
  description: string
  totalSupply: number
  floorPrice: bigint
  volume24h: bigint
  owners: number
  verified: boolean
}

// NFT 拍卖
interface NFTAuction {
  tokenId: number
  seller: string
  startingPrice: bigint
  currentBid: bigint
  highestBidder: string
  endTime: number
  status: 'active' | 'ended' | 'cancelled'
}

// 版税计算
const calculateRoyalty = (salePrice: bigint, royaltyPercentage: number) => {
  return (salePrice * BigInt(royaltyPercentage)) / 10000n
}
```

---

## 智能合约集成

### 合约抽象层 (Contract Abstraction)

#### ABI 管理系统

```typescript
// packages/wagmi/src/abis/
export const pancakeRouterABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// 类型安全的合约接口
export const usePancakeRouter = () => {
  return useContract({
    address: PANCAKE_ROUTER_ADDRESS,
    abi: pancakeRouterABI,
  })
}
```

#### 合约调用封装

```typescript
// 交换合约调用
export const useSwapCallback = () => {
  const { writeContractAsync } = useWriteContract()

  return useCallback(
    async (amountIn: bigint, amountOutMin: bigint, path: string[], to: string, deadline: number) => {
      try {
        const hash = await writeContractAsync({
          address: PANCAKE_ROUTER_ADDRESS,
          abi: pancakeRouterABI,
          functionName: 'swapExactTokensForTokens',
          args: [amountIn, amountOutMin, path, to, deadline],
        })

        return hash
      } catch (error) {
        console.error('Swap failed:', error)
        throw error
      }
    },
    [writeContractAsync],
  )
}
```

### Multicall 优化

#### 批量合约调用

```typescript
// packages/multicall/src/
interface Call {
  address: string
  callData: string
  gasLimit?: bigint
}

interface MulticallResponse {
  success: boolean
  returnData: string
  gasUsed: bigint
}

// Multicall3 实现
export const useMultiCall = () => {
  const multicallContract = useContract({
    address: MULTICALL3_ADDRESS,
    abi: multicall3ABI,
  })

  return useCallback(
    async (calls: Call[]) => {
      const multicallData = calls.map((call) => ({
        target: call.address,
        callData: call.callData,
        gasLimit: call.gasLimit || 0n,
      }))

      const results = await multicallContract.read.aggregate3(multicallData)
      return results.map((result, index) => ({
        ...result,
        call: calls[index],
      }))
    },
    [multicallContract],
  )
}
```

#### 数据聚合查询

```typescript
// 农场数据批量查询
export const useFarmsData = () => {
  const { data, isLoading } = useMultiCall()

  const farmCalls = useMemo(() => {
    return FARMS_CONFIG.flatMap((farm) => [
      {
        address: MASTERCHEF_ADDRESS,
        callData: encodeFunctionData({
          abi: masterChefABI,
          functionName: 'poolInfo',
          args: [farm.pid],
        }),
      },
      {
        address: MASTERCHEF_ADDRESS,
        callData: encodeFunctionData({
          abi: masterChefABI,
          functionName: 'totalAllocPoint',
          args: [],
        }),
      },
      {
        address: farm.lpAddress,
        callData: encodeFunctionData({
          abi: erc20ABI,
          functionName: 'totalSupply',
          args: [],
        }),
      },
    ])
  }, [])

  return {
    farmsData: data ? parseFarmData(data) : [],
    isLoading,
  }
}
```

### 交易管理

#### 交易状态跟踪

```typescript
// 交易生命周期管理
interface TransactionState {
  hash?: string
  status: 'idle' | 'pending' | 'success' | 'error'
  confirmations: number
  receipt?: TransactionReceipt
  error?: Error
}

export const useTransactionStatus = (hash?: string) => {
  const [state, setState] = useState<TransactionState>({
    status: 'idle',
    confirmations: 0,
  })

  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2, // 等待 2 个确认
  })

  useEffect(() => {
    if (receipt) {
      setState((prev) => ({
        ...prev,
        status: receipt.status === 'success' ? 'success' : 'error',
        receipt,
        confirmations: receipt.blockNumber ? 2 : 0,
      }))
    }
  }, [receipt])

  return state
}
```

#### Gas 费用估算

```typescript
// Gas 优化策略
export const useGasEstimation = () => {
  const publicClient = usePublicClient()

  return useCallback(
    async (to: string, data: string, value?: bigint) => {
      try {
        // 基础 gas 估算
        const estimatedGas = await publicClient.estimateGas({
          to,
          data,
          value,
        })

        // 添加 20% 安全边际
        const gasLimit = (estimatedGas * 120n) / 100n

        // 获取当前 gas 价格
        const gasPrice = await publicClient.getGasPrice()

        // 计算总费用
        const totalCost = gasLimit * gasPrice

        return {
          gasLimit,
          gasPrice,
          totalCost,
          estimatedGas,
        }
      } catch (error) {
        console.error('Gas estimation failed:', error)
        throw error
      }
    },
    [publicClient],
  )
}
```

### 事件监听系统

#### 实时事件追踪

```typescript
// 交换事件监听
export const useSwapEvents = () => {
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([])

  useWatchContractEvent({
    address: PANCAKE_ROUTER_ADDRESS,
    abi: pancakeRouterABI,
    eventName: 'Swap',
    onLogs: (logs) => {
      const newEvents = logs.map((log) => ({
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        sender: log.args.sender,
        amount0In: log.args.amount0In,
        amount1In: log.args.amount1In,
        amount0Out: log.args.amount0Out,
        amount1Out: log.args.amount1Out,
        to: log.args.to,
        timestamp: Date.now(),
      }))

      setSwapEvents((prev) => [...newEvents, ...prev].slice(0, 100))
    },
  })

  return swapEvents
}
```

#### 流动性变化监听

```typescript
// 流动性池事件监听
export const useLiquidityEvents = (pairAddress: string) => {
  const [liquidityEvents, setLiquidityEvents] = useState<LiquidityEvent[]>([])

  // 监听添加流动性事件
  useWatchContractEvent({
    address: pairAddress,
    abi: pairABI,
    eventName: 'Mint',
    onLogs: (logs) => {
      const mintEvents = logs.map((log) => ({
        type: 'mint' as const,
        sender: log.args.sender,
        amount0: log.args.amount0,
        amount1: log.args.amount1,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }))

      setLiquidityEvents((prev) => [...mintEvents, ...prev])
    },
  })

  // 监听移除流动性事件
  useWatchContractEvent({
    address: pairAddress,
    abi: pairABI,
    eventName: 'Burn',
    onLogs: (logs) => {
      const burnEvents = logs.map((log) => ({
        type: 'burn' as const,
        sender: log.args.sender,
        amount0: log.args.amount0,
        amount1: log.args.amount1,
        to: log.args.to,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }))

      setLiquidityEvents((prev) => [...burnEvents, ...prev])
    },
  })

  return liquidityEvents
}
```

---

## 多链架构

### 链配置管理

#### 支持的区块链网络

```typescript
// packages/chains/src/index.ts
export const CHAINS = {
  // EVM 链
  BSC: {
    id: 56,
    name: 'BNB Smart Chain',
    network: 'bsc',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorers: [{ name: 'BscScan', url: 'https://bscscan.com' }],
    contracts: {
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      masterChef: '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652',
    },
  },
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    network: 'homestead',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://eth-mainnet.alchemyapi.io/v2/...'],
    blockExplorers: [{ name: 'Etherscan', url: 'https://etherscan.io' }],
    contracts: {
      router: '0xEfF92A263d31888d860bD50809A8D171709b7b1c',
      factory: '0x1097053Fd2ea711dad45caCcc45EfF7548fCB362',
    },
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum One',
    network: 'arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorers: [{ name: 'Arbiscan', url: 'https://arbiscan.io' }],
  },
  // 非 EVM 链
  SOLANA: {
    id: 'solana',
    name: 'Solana',
    network: 'mainnet-beta',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    rpcUrls: ['https://api.mainnet-beta.solana.com'],
    programs: {
      jupiter: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
      meteora: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
    },
  },
  APTOS: {
    id: 'aptos',
    name: 'Aptos',
    network: 'mainnet',
    nativeCurrency: { name: 'Aptos Coin', symbol: 'APT', decimals: 8 },
    rpcUrls: ['https://fullnode.mainnet.aptoslabs.com/v1'],
    modules: {
      swap: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12',
      liquidity: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12',
    },
  },
}

// 链类型判断
export const isEvm = (chainId: string | number): boolean => {
  return typeof chainId === 'number' && chainId > 0
}

export const isSolana = (chainId: string | number): boolean => {
  return chainId === 'solana'
}

export const isAptos = (chainId: string | number): boolean => {
  return chainId === 'aptos'
}
```

#### 动态链切换

```typescript
// 链切换逻辑
export const useChainSwitch = () => {
  const { switchChain } = useSwitchChain()
  const router = useRouter()

  const switchToChain = useCallback(
    async (targetChain: ChainId) => {
      try {
        if (isEvm(targetChain)) {
          // EVM 链切换
          await switchChain({ chainId: targetChain as number })
        } else if (isSolana(targetChain)) {
          // 跳转到 Solana 应用
          router.push('https://solana.pancakeswap.finance')
        } else if (isAptos(targetChain)) {
          // 跳转到 Aptos 应用
          router.push('https://aptos.pancakeswap.finance')
        }
      } catch (error) {
        console.error('Chain switch failed:', error)
        throw error
      }
    },
    [switchChain, router],
  )

  return { switchToChain }
}
```

### 跨链资产管理

#### 统一代币接口

```typescript
// 跨链代币标准化
interface UniversalToken {
  chainId: ChainId
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string

  // 链特定字段
  coingeckoId?: string
  extensions?: {
    // EVM
    bridgeInfo?: Record<number, { tokenAddress: string }>
    // Solana
    mint?: string
    // Aptos
    moduleAddress?: string
  }
}

// 代币解析器
export const parseToken = (token: any, chainId: ChainId): UniversalToken => {
  if (isEvm(chainId)) {
    return {
      chainId,
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      logoURI: token.logoURI,
    }
  } else if (isSolana(chainId)) {
    return {
      chainId,
      address: token.mint || token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      extensions: { mint: token.mint },
    }
  } else if (isAptos(chainId)) {
    return {
      chainId,
      address: token.coin_type || token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      extensions: { moduleAddress: token.coin_type },
    }
  }

  throw new Error(`Unsupported chain: ${chainId}`)
}
```

#### 跨链桥集成

```typescript
// 统一跨链桥接口
interface BridgeProvider {
  name: string
  supportedChains: ChainId[]
  estimateFee(from: ChainId, to: ChainId, token: UniversalToken, amount: bigint): Promise<bigint>
  bridge(from: ChainId, to: ChainId, token: UniversalToken, amount: bigint, recipient: string): Promise<string>
}

// LayerZero 桥实现
export const layerZeroBridge: BridgeProvider = {
  name: 'LayerZero',
  supportedChains: [56, 1, 42161, 137, 43114],

  async estimateFee(from, to, token, amount) {
    const bridgeContract = getBridgeContract(from)
    const fee = await bridgeContract.estimateSendFee(getLayerZeroChainId(to), token.address, amount, false, '0x')
    return fee.nativeFee
  },

  async bridge(from, to, token, amount, recipient) {
    const bridgeContract = getBridgeContract(from)
    const fee = await this.estimateFee(from, to, token, amount)

    const tx = await bridgeContract.sendFrom(
      recipient,
      getLayerZeroChainId(to),
      recipient,
      amount,
      {
        refundAddress: recipient,
        zroPaymentAddress: '0x0000000000000000000000000000000000000000',
        adapterParams: '0x',
      },
      { value: fee },
    )

    return tx.hash
  },
}
```

### 链特定适配器

#### Solana 适配器

```typescript
// Solana 交换集成
export const useSolanaSwap = () => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const swap = useCallback(
    async (inputMint: string, outputMint: string, amount: number, slippage: number) => {
      if (!publicKey) throw new Error('Wallet not connected')

      // Jupiter 聚合器查询
      const routes = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
          slippage * 100
        }`,
      ).then((res) => res.json())

      if (!routes.data || routes.data.length === 0) {
        throw new Error('No routes found')
      }

      const bestRoute = routes.data[0]

      // 获取交换指令
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: bestRoute,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
        }),
      }).then((res) => res.json())

      const transaction = Transaction.from(Buffer.from(swapResponse.swapTransaction, 'base64'))

      const signature = await sendTransaction(transaction, connection)
      return signature
    },
    [connection, publicKey, sendTransaction],
  )

  return { swap }
}
```

#### Aptos 适配器

````typescript
// Aptos 交换集成
export const useAptosSwap = () => {
  const { account, signAndSubmitTransaction } = useWallet()

  const swap = useCallback(async (
    inputCoin: string,
    outputCoin: string,
    amount: string,
    minOut: string
  ) => {
    if (!account) throw new Error('Wallet not connected')

    const payload = {
      type: 'entry_function_payload',
      function: `${PANCAKE_SWAP_MODULE}::swap::swap_exact_input`,
      type_arguments: [inputCoin, outputCoin],
      arguments: [amount, minOut]
    }

    const response = await signAndSubmitTransaction(payload)
    return response.hash
  }, [account, signAndSubmitTransaction])

  return { swap }
}

---

## 性能优化策略

### 前端性能优化

#### 代码分割与懒加载
```typescript
// 路由级别代码分割
const SwapPage = lazy(() => import('../views/Swap'))
const PoolsPage = lazy(() => import('../views/Pools'))
const FarmsPage = lazy(() => import('../views/Farms'))

// 组件级别懒加载
const LazyChart = lazy(() => import('@pancakeswap/uikit').then(module => ({
  default: module.Chart
})))

// 条件加载
const ConditionalComponent = () => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowAdvanced(true)}>
        Show Advanced
      </Button>
      {showAdvanced && (
        <Suspense fallback={<Skeleton />}>
          <LazyAdvancedSettings />
        </Suspense>
      )}
    </div>
  )
}
````

#### 图片优化

```typescript
// Next.js Image 组件优化
import Image from 'next/image'

const OptimizedTokenIcon = ({ src, alt, size = 24 }) => (
  <Image
    src={src}
    alt={alt}
    width={size}
    height={size}
    priority={size > 32} // 大图标优先加载
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    sizes={`${size}px`}
    style={{
      borderRadius: '50%',
      objectFit: 'cover',
    }}
  />
)

// SVG 图标优化
const TokenIcon = memo(({ token, size = 24 }) => {
  const [imgError, setImgError] = useState(false)

  if (imgError) {
    return <DefaultTokenIcon size={size} />
  }

  return (
    <Image
      src={`/images/tokens/${token.address}.png`}
      alt={token.symbol}
      width={size}
      height={size}
      onError={() => setImgError(true)}
    />
  )
})
```

#### 虚拟列表优化

```typescript
// 大数据列表虚拟化
import { FixedSizeList as List } from 'react-window'

const VirtualizedTokenList = ({ tokens, onSelect }) => {
  const Row = ({ index, style }) => {
    const token = tokens[index]
    return (
      <div style={style}>
        <TokenRow token={token} onSelect={onSelect} />
      </div>
    )
  }

  return (
    <List height={400} itemCount={tokens.length} itemSize={64} width="100%">
      {Row}
    </List>
  )
}

// 无限滚动优化
const InfiniteTokenList = () => {
  const [tokens, setTokens] = useState([])
  const [hasMore, setHasMore] = useState(true)

  const loadMoreTokens = useCallback(async () => {
    const newTokens = await fetchTokens(tokens.length, 50)
    setTokens((prev) => [...prev, ...newTokens])
    setHasMore(newTokens.length === 50)
  }, [tokens.length])

  return (
    <InfiniteScroll
      dataLength={tokens.length}
      next={loadMoreTokens}
      hasMore={hasMore}
      loader={<TokenSkeleton count={5} />}
    >
      {tokens.map((token) => (
        <TokenRow key={token.address} token={token} />
      ))}
    </InfiniteScroll>
  )
}
```

### 状态管理优化

#### Redux 性能优化

```typescript
// 选择器优化
const selectTokenBalance = createSelector(
  [(state: RootState) => state.tokens.balances, (state: RootState, tokenAddress: string) => tokenAddress],
  (balances, tokenAddress) => balances[tokenAddress] || '0',
)

// Reselect 缓存优化
const selectSortedTokens = createSelector([selectAllTokens, selectTokenSearchQuery], (tokens, query) => {
  return tokens
    .filter(
      (token) =>
        token.name.toLowerCase().includes(query.toLowerCase()) ||
        token.symbol.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      // 先按热度排序，再按字母排序
      if (a.volume24h !== b.volume24h) {
        return Number(b.volume24h - a.volume24h)
      }
      return a.symbol.localeCompare(b.symbol)
    })
})
```

#### React 渲染优化

```typescript
// memo 优化
const TokenRow = memo(
  ({ token, onSelect }) => {
    const handleClick = useCallback(() => {
      onSelect(token)
    }, [token, onSelect])

    return (
      <div onClick={handleClick}>
        <TokenIcon token={token} />
        <span>{token.symbol}</span>
        <span>{token.name}</span>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // 自定义比较函数
    return prevProps.token.address === nextProps.token.address && prevProps.onSelect === nextProps.onSelect
  },
)

// useMemo 优化计算
const SwapQuote = ({ inputAmount, outputAmount, route }) => {
  const priceImpact = useMemo(() => {
    if (!inputAmount || !outputAmount || !route) return 0

    const midPrice = route.midPrice
    const executionPrice = outputAmount / inputAmount
    return ((midPrice - executionPrice) / midPrice) * 100
  }, [inputAmount, outputAmount, route])

  const priceImpactColor = useMemo(() => {
    if (priceImpact < 1) return 'success'
    if (priceImpact < 3) return 'warning'
    return 'error'
  }, [priceImpact])

  return <Text color={priceImpactColor}>Price Impact: {priceImpact.toFixed(2)}%</Text>
}
```

### 网络优化

#### API 请求优化

```typescript
// SWR 数据缓存
const usePriceData = (tokenAddress: string) => {
  const { data, error, mutate } = useSWR(`/api/price/${tokenAddress}`, fetcher, {
    refreshInterval: 5000, // 5秒刷新
    dedupingInterval: 2000, // 2秒内去重
    focusThrottleInterval: 1000, // 焦点节流
    errorRetryCount: 3, // 错误重试
    fallbackData: { price: 0 }, // 降级数据
  })

  return {
    price: data?.price || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  }
}

// React Query 优化
const useTokenList = (chainId: ChainId) => {
  return useQuery({
    queryKey: ['tokenList', chainId],
    queryFn: () => fetchTokenList(chainId),
    staleTime: 5 * 60 * 1000, // 5分钟内数据新鲜
    gcTime: 30 * 60 * 1000, // 30分钟垃圾回收
    refetchOnWindowFocus: false, // 焦点时不重新获取
    retry: (failureCount, error) => {
      return failureCount < 3 && error.status !== 404
    },
  })
}
```

#### 预加载策略

```typescript
// 路由预加载
const useRoutePreload = () => {
  const router = useRouter()

  const preloadRoute = useCallback(
    (href: string) => {
      router.prefetch(href)
    },
    [router],
  )

  // 鼠标悬停预加载
  const handleMouseEnter = useCallback(
    (href: string) => {
      preloadRoute(href)
    },
    [preloadRoute],
  )

  return { preloadRoute, handleMouseEnter }
}

// 数据预加载
const useDataPreload = () => {
  const queryClient = useQueryClient()

  const preloadTokenData = useCallback(
    async (tokenAddress: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['token', tokenAddress],
        queryFn: () => fetchTokenData(tokenAddress),
      })
    },
    [queryClient],
  )

  return { preloadTokenData }
}
```

---

## 安全策略

### 前端安全防护

#### XSS 防护

```typescript
// 内容过滤和转义
import DOMPurify from 'dompurify'

const SafeHTML = ({ content }: { content: string }) => {
  const cleanContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em'],
      ALLOWED_ATTR: [],
    })
  }, [content])

  return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
}

// 用户输入验证
const validateTokenSymbol = (symbol: string): boolean => {
  const pattern = /^[A-Za-z0-9]{1,10}$/
  return pattern.test(symbol)
}

const validateAmount = (amount: string): boolean => {
  const pattern = /^\d+(\.\d{1,18})?$/
  return pattern.test(amount) && parseFloat(amount) > 0
}
```

#### CSRF 防护

```typescript
// API 请求 CSRF 令牌
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})

// 同源策略检查
const isSameOrigin = (url: string): boolean => {
  const origin = new URL(url).origin
  return origin === window.location.origin
}
```

### 智能合约安全

#### 交易安全检查

```typescript
// 合约地址验证
const VERIFIED_CONTRACTS = new Set([
  '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeRouter
  '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // PancakeFactory
  '0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652', // MasterChef
])

const validateContractAddress = (address: string): boolean => {
  return VERIFIED_CONTRACTS.has(address.toLowerCase())
}

// 交易参数验证
const validateSwapParams = (params: SwapParams): ValidationResult => {
  const errors: string[] = []

  if (!isAddress(params.tokenIn)) {
    errors.push('Invalid input token address')
  }

  if (!isAddress(params.tokenOut)) {
    errors.push('Invalid output token address')
  }

  if (BigInt(params.amountIn) <= 0n) {
    errors.push('Amount must be greater than 0')
  }

  if (params.slippage < 0.01 || params.slippage > 50) {
    errors.push('Slippage must be between 0.01% and 50%')
  }

  if (params.deadline < Date.now() / 1000) {
    errors.push('Deadline must be in the future')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

#### MEV 保护

```typescript
// 防抢跑保护
const useMEVProtection = () => {
  const [isProtectionEnabled, setProtectionEnabled] = useState(true)

  const submitTransaction = useCallback(
    async (transaction: TransactionRequest, options: { usePrivateMempool?: boolean } = {}) => {
      try {
        if (isProtectionEnabled && options.usePrivateMempool) {
          // 使用私有内存池
          return await submitToPrivateMempool(transaction)
        } else {
          // 常规提交
          return await submitToPublicMempool(transaction)
        }
      } catch (error) {
        console.error('Transaction submission failed:', error)
        throw error
      }
    },
    [isProtectionEnabled],
  )

  return {
    isProtectionEnabled,
    setProtectionEnabled,
    submitTransaction,
  }
}

// 滑点保护增强
const calculateDynamicSlippage = (amountIn: bigint, reserveIn: bigint, baseSlippage: number) => {
  const priceImpact = Number((amountIn * 10000n) / reserveIn) / 100

  // 根据价格影响动态调整滑点
  if (priceImpact > 5) {
    return Math.max(baseSlippage, priceImpact * 1.5)
  } else if (priceImpact > 1) {
    return Math.max(baseSlippage, priceImpact * 1.2)
  }

  return baseSlippage
}
```

### 钱包安全

#### 连接验证

```typescript
// 钱包安全检查
const validateWalletConnection = async (address: string) => {
  try {
    // 检查地址格式
    if (!isAddress(address)) {
      throw new Error('Invalid wallet address')
    }

    // 检查网络匹配
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    if (parseInt(chainId, 16) !== EXPECTED_CHAIN_ID) {
      throw new Error('Wrong network')
    }

    // 验证签名能力
    const message = `Verify wallet: ${Date.now()}`
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    })

    const recovered = recoverPersonalSignature({
      data: message,
      sig: signature,
    })

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Signature verification failed')
    }

    return true
  } catch (error) {
    console.error('Wallet validation failed:', error)
    return false
  }
}

// 会话管理
const useSecureSession = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 分钟

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  const isSessionValid = useCallback(() => {
    return Date.now() - lastActivity < SESSION_TIMEOUT
  }, [lastActivity])

  const invalidateSession = useCallback(() => {
    setSessionToken(null)
    setLastActivity(0)
  }, [])

  return {
    sessionToken,
    setSessionToken,
    updateActivity,
    isSessionValid,
    invalidateSession,
  }
}
```

---

## 总结

PancakeSwap 前端项目展现了现代 DeFi 应用的完整技术实现，涵盖了从基础架构到高级安全策略的各个层面。项目的成功在于其模块化设计、多链支持能力和持续的性能优化。

### 核心技术亮点

- **Monorepo 架构**: 实现了代码复用和统一管理
- **多链支持**: 无缝支持 EVM、Solana、Aptos 生态
- **性能优化**: 通过代码分割、虚拟化、缓存等手段提升用户体验
- **安全防护**: 多层次安全策略保障用户资产安全

### 学习价值

通过深入研究 PancakeSwap 的技术实现，开发者可以掌握：

- 大型 DeFi 应用的架构设计思路
- 跨链技术的实际应用方案
- 前端性能优化的最佳实践
- 区块链应用的安全防护策略

这份技术文档为理解和学习现代 DeFi 应用开发提供了宝贵的参考资料。
