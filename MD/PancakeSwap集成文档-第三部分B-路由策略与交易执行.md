# PancakeSwap 集成文档 - 第三部分 B：路由策略与交易执行

## 目录

1. [交易策略详解](#交易策略详解)
2. [自定义兑换路由](#自定义兑换路由)
3. [智能路由算法](#智能路由算法)
4. [交易执行机制](#交易执行机制)
5. [Web2 vs Web3 架构对比](#web2-vs-web3-架构对比)
6. [API 调用 vs 合约交互](#api调用-vs-合约交互)
7. [性能优化策略](#性能优化策略)

## 交易策略详解

### 交易类型分类

PancakeSwap 支持多种交易策略，每种策略都有其特定的应用场景：

```typescript
// types/trading.ts
export enum TradeType {
  EXACT_INPUT = 'EXACT_INPUT', // 精确输入
  EXACT_OUTPUT = 'EXACT_OUTPUT', // 精确输出
}

export enum RoutingStrategy {
  DIRECT = 'DIRECT', // 直接交易
  SINGLE_HOP = 'SINGLE_HOP', // 单跳交易
  MULTI_HOP = 'MULTI_HOP', // 多跳交易
  SPLIT_ROUTING = 'SPLIT_ROUTING', // 分割路由
}

export interface TradeStrategy {
  type: TradeType
  routing: RoutingStrategy
  slippageTolerance: number
  deadline: number
  gasStrategy: 'fast' | 'standard' | 'safe'
  mevProtection: boolean
}
```

### 智能交易策略选择

```typescript
// hooks/useTradeStrategy.ts
import { useMemo } from 'react'
import { Currency, Trade } from '@pancakeswap/sdk'
import { useGasPrice } from './useGasPrice'
import { useLiquidityPools } from './useLiquidityPools'

export const useTradeStrategy = (inputCurrency?: Currency, outputCurrency?: Currency, inputAmount?: string) => {
  const gasPrice = useGasPrice()
  const liquidityPools = useLiquidityPools([inputCurrency, outputCurrency])

  const optimalStrategy = useMemo((): TradeStrategy => {
    if (!inputCurrency || !outputCurrency || !inputAmount) {
      return defaultStrategy
    }

    const amountUSD = parseFloat(inputAmount) * (inputCurrency.priceUSD || 0)

    // 大额交易策略
    if (amountUSD > 10000) {
      return {
        type: TradeType.EXACT_INPUT,
        routing: RoutingStrategy.SPLIT_ROUTING,
        slippageTolerance: 0.1, // 0.1%
        deadline: 1800, // 30分钟
        gasStrategy: 'fast',
        mevProtection: true,
      }
    }

    // 中等金额交易策略
    if (amountUSD > 1000) {
      return {
        type: TradeType.EXACT_INPUT,
        routing: RoutingStrategy.MULTI_HOP,
        slippageTolerance: 0.5, // 0.5%
        deadline: 1200, // 20分钟
        gasStrategy: 'standard',
        mevProtection: true,
      }
    }

    // 小额交易策略
    return {
      type: TradeType.EXACT_INPUT,
      routing: RoutingStrategy.DIRECT,
      slippageTolerance: 1.0, // 1%
      deadline: 600, // 10分钟
      gasStrategy: 'safe',
      mevProtection: false,
    }
  }, [inputCurrency, outputCurrency, inputAmount, gasPrice, liquidityPools])

  return optimalStrategy
}
```

## 自定义兑换路由

### 路由发现算法

```typescript
// utils/routing.ts
import { Currency, Token, WETH } from '@pancakeswap/sdk'
import { Pool } from '@pancakeswap/v3-sdk'

export class CustomRouter {
  private pools: Pool[]
  private commonBases: Token[]

  constructor(pools: Pool[], commonBases: Token[]) {
    this.pools = pools
    this.commonBases = commonBases
  }

  // 查找所有可能的交易路径
  findAllRoutes(currencyIn: Currency, currencyOut: Currency, maxHops: number = 3): Route[] {
    const tokenIn = currencyIn.wrapped
    const tokenOut = currencyOut.wrapped

    if (tokenIn.equals(tokenOut)) return []

    const routes: Route[] = []

    // 1. 直接路径
    const directPools = this.getPoolsForPair(tokenIn, tokenOut)
    directPools.forEach((pool) => {
      routes.push(new Route([pool], currencyIn, currencyOut))
    })

    // 2. 通过中间代币的路径
    if (maxHops > 1) {
      for (const intermediateToken of this.commonBases) {
        if (intermediateToken.equals(tokenIn) || intermediateToken.equals(tokenOut)) {
          continue
        }

        const firstHopPools = this.getPoolsForPair(tokenIn, intermediateToken)
        const secondHopPools = this.getPoolsForPair(intermediateToken, tokenOut)

        firstHopPools.forEach((firstPool) => {
          secondHopPools.forEach((secondPool) => {
            routes.push(new Route([firstPool, secondPool], currencyIn, currencyOut))
          })
        })
      }
    }

    // 3. 三跳路径（如果允许）
    if (maxHops > 2) {
      routes.push(...this.findThreeHopRoutes(tokenIn, tokenOut))
    }

    return routes.slice(0, 10) // 限制路径数量
  }

  private findThreeHopRoutes(tokenIn: Token, tokenOut: Token): Route[] {
    const routes: Route[] = []

    for (const firstIntermediate of this.commonBases) {
      if (firstIntermediate.equals(tokenIn) || firstIntermediate.equals(tokenOut)) continue

      for (const secondIntermediate of this.commonBases) {
        if (
          secondIntermediate.equals(tokenIn) ||
          secondIntermediate.equals(tokenOut) ||
          secondIntermediate.equals(firstIntermediate)
        )
          continue

        const firstPools = this.getPoolsForPair(tokenIn, firstIntermediate)
        const secondPools = this.getPoolsForPair(firstIntermediate, secondIntermediate)
        const thirdPools = this.getPoolsForPair(secondIntermediate, tokenOut)

        firstPools.forEach((firstPool) => {
          secondPools.forEach((secondPool) => {
            thirdPools.forEach((thirdPool) => {
              routes.push(
                new Route(
                  [firstPool, secondPool, thirdPool],
                  new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals),
                  new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals),
                ),
              )
            })
          })
        })
      }
    }

    return routes
  }

  private getPoolsForPair(tokenA: Token, tokenB: Token): Pool[] {
    return this.pools.filter((pool) => {
      return (
        (pool.token0.equals(tokenA) && pool.token1.equals(tokenB)) ||
        (pool.token0.equals(tokenB) && pool.token1.equals(tokenA))
      )
    })
  }
}
```

### 分割路由策略

```typescript
// utils/splitRouting.ts
export class SplitRoutingCalculator {
  // 计算最优分割比例
  calculateOptimalSplit(routes: Route[], totalAmountIn: BigNumber, maxSplits: number = 3): SplitRoute[] {
    if (routes.length <= 1) {
      return [
        {
          route: routes[0],
          percentage: 100,
          amountIn: totalAmountIn,
        },
      ]
    }

    // 使用动态规划找到最优分割
    const splitCombinations = this.generateSplitCombinations(routes.length, maxSplits)
    let bestSplit: SplitRoute[] = []
    let bestOutputAmount = BigNumber.from(0)

    for (const combination of splitCombinations) {
      const splits = this.calculateSplitAmounts(routes, totalAmountIn, combination)
      const totalOutput = await this.calculateTotalOutput(splits)

      if (totalOutput.gt(bestOutputAmount)) {
        bestOutputAmount = totalOutput
        bestSplit = splits
      }
    }

    return bestSplit
  }

  private generateSplitCombinations(routeCount: number, maxSplits: number): number[][] {
    const combinations: number[][] = []

    // 生成所有可能的分割比例组合
    const generateCombination = (remaining: number, splits: number[], index: number) => {
      if (index === routeCount - 1) {
        splits[index] = remaining
        if (splits.filter((s) => s > 0).length <= maxSplits) {
          combinations.push([...splits])
        }
        return
      }

      for (let i = 0; i <= remaining; i += 5) {
        // 5% 增量
        splits[index] = i
        generateCombination(remaining - i, splits, index + 1)
      }
    }

    generateCombination(100, new Array(routeCount).fill(0), 0)
    return combinations
  }

  private async calculateTotalOutput(splits: SplitRoute[]): Promise<BigNumber> {
    let totalOutput = BigNumber.from(0)

    for (const split of splits) {
      if (split.percentage > 0) {
        const quote = await this.getQuoteForRoute(split.route, split.amountIn)
        totalOutput = totalOutput.add(quote.amountOut)
      }
    }

    return totalOutput
  }
}
```

## 智能路由算法

### 路径优化器

```typescript
// utils/pathOptimizer.ts
export class PathOptimizer {
  private priceImpactThreshold = 5 // 5%
  private gasOptimizationEnabled = true

  async optimizeRoute(routes: Route[], amountIn: BigNumber, prioritizeGas: boolean = false): Promise<OptimizedRoute> {
    // 并行获取所有路径的报价
    const routeQuotes = await Promise.all(
      routes.map(async (route) => {
        const quote = await this.getDetailedQuote(route, amountIn)
        return { route, quote }
      }),
    )

    // 过滤掉价格影响过大的路径
    const viableRoutes = routeQuotes.filter(({ quote }) => quote.priceImpact < this.priceImpactThreshold)

    if (viableRoutes.length === 0) {
      throw new Error('No viable routes found')
    }

    // 根据优先级排序
    const sortedRoutes = viableRoutes.sort((a, b) => {
      if (prioritizeGas) {
        // 优先考虑 Gas 费用
        const gasComparison = a.quote.gasEstimate - b.quote.gasEstimate
        if (Math.abs(gasComparison) > a.quote.gasEstimate * 0.1) {
          return gasComparison
        }
      }

      // 主要考虑输出金额
      return b.quote.amountOut.sub(a.quote.amountOut).toNumber()
    })

    return {
      route: sortedRoutes[0].route,
      quote: sortedRoutes[0].quote,
      alternatives: sortedRoutes.slice(1, 3), // 保留2个备选方案
    }
  }

  private async getDetailedQuote(route: Route, amountIn: BigNumber): Promise<DetailedQuote> {
    // 获取基础报价
    const baseQuote = await this.quoter.quote(route, amountIn)

    // 计算价格影响
    const priceImpact = this.calculatePriceImpact(route, amountIn, baseQuote.amountOut)

    // 估算 Gas 费用
    const gasEstimate = await this.estimateGas(route, amountIn)

    // 计算滑点风险
    const slippageRisk = this.calculateSlippageRisk(route, amountIn)

    return {
      amountOut: baseQuote.amountOut,
      priceImpact,
      gasEstimate,
      slippageRisk,
      executionTime: this.estimateExecutionTime(route),
    }
  }

  private calculatePriceImpact(route: Route, amountIn: BigNumber, amountOut: BigNumber): number {
    // 获取池子的中间价格
    const midPrice = route.midPrice
    const executionPrice = amountIn.mul(parseUnits('1', 18)).div(amountOut)

    return Math.abs(midPrice.subtract(executionPrice).divide(midPrice).multiply(100).toNumber())
  }
}
```

## 交易执行机制

### 交易执行器

```typescript
// services/tradeExecutor.ts
export class TradeExecutor {
  private readonly maxRetries = 3
  private readonly retryDelay = 2000 // 2秒

  async executeTrade(trade: Trade, strategy: TradeStrategy, account: string): Promise<TransactionResponse> {
    // 1. 预执行检查
    await this.preExecutionChecks(trade, account)

    // 2. 准备交易参数
    const txParams = await this.prepareTxParams(trade, strategy, account)

    // 3. 执行交易
    return this.executeWithRetry(txParams)
  }

  private async preExecutionChecks(trade: Trade, account: string) {
    // 检查余额
    const balance = await this.getTokenBalance(trade.inputAmount.currency.wrapped.address, account)

    if (balance.lt(trade.inputAmount.quotient)) {
      throw new Error('Insufficient balance')
    }

    // 检查授权
    const allowance = await this.getTokenAllowance(
      trade.inputAmount.currency.wrapped.address,
      account,
      SWAP_ROUTER_ADDRESS,
    )

    if (allowance.lt(trade.inputAmount.quotient)) {
      throw new Error('Insufficient allowance')
    }

    // 检查池子流动性
    await this.checkPoolLiquidity(trade.route.pools)
  }

  private async prepareTxParams(trade: Trade, strategy: TradeStrategy, account: string): Promise<TransactionRequest> {
    const deadline = Math.floor(Date.now() / 1000) + strategy.deadline
    const slippageAmount = calculateSlippageAmount(
      trade.outputAmount,
      new Percent(strategy.slippageTolerance * 100, 10000),
    )

    // 根据路由类型选择合约方法
    if (trade.route.pools.length === 1) {
      // 单池交易
      return {
        to: SWAP_ROUTER_ADDRESS,
        data: SwapRouter.INTERFACE.encodeFunctionData('exactInputSingle', [
          {
            tokenIn: trade.inputAmount.currency.wrapped.address,
            tokenOut: trade.outputAmount.currency.wrapped.address,
            fee: trade.route.pools[0].fee,
            recipient: account,
            deadline,
            amountIn: trade.inputAmount.quotient.toString(),
            amountOutMinimum: slippageAmount[0].toString(),
            sqrtPriceLimitX96: 0,
          },
        ]),
      }
    } else {
      // 多池交易
      const path = encodePath(
        trade.route.tokenPath,
        trade.route.pools.map((pool) => pool.fee),
      )

      return {
        to: SWAP_ROUTER_ADDRESS,
        data: SwapRouter.INTERFACE.encodeFunctionData('exactInput', [
          {
            path,
            recipient: account,
            deadline,
            amountIn: trade.inputAmount.quotient.toString(),
            amountOutMinimum: slippageAmount[0].toString(),
          },
        ]),
      }
    }
  }

  private async executeWithRetry(txParams: TransactionRequest): Promise<TransactionResponse> {
    let lastError: Error

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // 获取最新的 gas 价格
        const gasPrice = await this.getOptimalGasPrice()

        const tx = await this.signer.sendTransaction({
          ...txParams,
          gasPrice,
          gasLimit: await this.signer.estimateGas(txParams),
        })

        return tx
      } catch (error) {
        lastError = error as Error

        // 如果是可重试的错误，等待后重试
        if (this.isRetryableError(error) && attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt)
          continue
        }

        throw error
      }
    }

    throw lastError!
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = ['replacement transaction underpriced', 'network error', 'timeout', 'nonce too low']

    return retryableErrors.some((msg) => error.message.toLowerCase().includes(msg))
  }
}
```

## Web2 vs Web3 架构对比

### 架构差异分析

| 特性         | Web2 架构    | Web3 架构           | PancakeSwap 实现          |
| ------------ | ------------ | ------------------- | ------------------------- |
| **数据存储** | 中心化数据库 | 区块链 + IPFS       | 链上状态 + 链下缓存       |
| **用户认证** | 用户名/密码  | 钱包签名            | 多种钱包连接方案          |
| **状态管理** | 服务器会话   | 本地状态 + 链上状态 | Redux + Jotai + Web3 状态 |
| **API 调用** | REST/GraphQL | RPC + 合约调用      | 混合模式                  |
| **实时更新** | WebSocket    | 事件监听 + 轮询     | WebSocket + 链上事件      |

### 混合架构实现

```typescript
// services/hybridDataService.ts
export class HybridDataService {
  private web2Cache = new Map<string, any>()
  private web3Provider: Provider

  // Web2 风格的 API 调用（用于非关键数据）
  async getTokenPrices(tokenAddresses: string[]): Promise<TokenPrice[]> {
    const cacheKey = `prices-${tokenAddresses.join(',')}`

    // 优先使用缓存
    if (this.web2Cache.has(cacheKey)) {
      const cached = this.web2Cache.get(cacheKey)
      if (Date.now() - cached.timestamp < 30000) {
        // 30秒缓存
        return cached.data
      }
    }

    // 调用价格 API
    const response = await fetch('/api/v1/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: tokenAddresses }),
    })

    const prices = await response.json()

    // 更新缓存
    this.web2Cache.set(cacheKey, {
      data: prices,
      timestamp: Date.now(),
    })

    return prices
  }

  // Web3 风格的链上数据查询（用于关键数据）
  async getPoolReserves(poolAddress: string): Promise<PoolReserves> {
    const contract = new Contract(poolAddress, POOL_ABI, this.web3Provider)

    // 直接从链上获取最新数据
    const [reserve0, reserve1, blockTimestampLast] = await contract.getReserves()

    return {
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      blockTimestampLast: blockTimestampLast.toNumber(),
    }
  }

  // 混合模式：优先使用 API，失败时回退到链上查询
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<BigNumber> {
    try {
      // 尝试 API 查询（更快）
      const response = await fetch(`/api/v1/balance/${userAddress}/${tokenAddress}`)
      if (response.ok) {
        const { balance } = await response.json()
        return BigNumber.from(balance)
      }
    } catch (error) {
      console.warn('API balance query failed, falling back to chain:', error)
    }

    // 回退到链上查询（更可靠）
    const contract = new Contract(tokenAddress, ERC20_ABI, this.web3Provider)
    return await contract.balanceOf(userAddress)
  }
}
```

## API 调用 vs 合约交互

### 接口设计模式

```typescript
// interfaces/dataProvider.ts
export interface IDataProvider {
  getTokenPrice(address: string): Promise<number>
  getPoolLiquidity(poolAddress: string): Promise<PoolInfo>
  getUserBalance(userAddress: string, tokenAddress: string): Promise<string>
}

// API 实现
export class APIDataProvider implements IDataProvider {
  private baseURL = 'https://api.pancakeswap.finance'

  async getTokenPrice(address: string): Promise<number> {
    const response = await fetch(`${this.baseURL}/v1/price/${address}`)
    const data = await response.json()
    return data.price
  }

  async getPoolLiquidity(poolAddress: string): Promise<PoolInfo> {
    const response = await fetch(`${this.baseURL}/v1/pool/${poolAddress}`)
    return await response.json()
  }

  async getUserBalance(userAddress: string, tokenAddress: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/v1/balance/${userAddress}/${tokenAddress}`)
    const data = await response.json()
    return data.balance
  }
}

// 合约实现
export class ContractDataProvider implements IDataProvider {
  constructor(private provider: Provider) {}

  async getTokenPrice(address: string): Promise<number> {
    // 通过 Oracle 合约获取价格
    const oracle = new Contract(PRICE_ORACLE_ADDRESS, ORACLE_ABI, this.provider)
    const price = await oracle.getPrice(address)
    return parseFloat(formatUnits(price, 8))
  }

  async getPoolLiquidity(poolAddress: string): Promise<PoolInfo> {
    const pool = new Contract(poolAddress, POOL_ABI, this.provider)
    const [reserve0, reserve1] = await pool.getReserves()

    return {
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      totalSupply: (await pool.totalSupply()).toString(),
    }
  }

  async getUserBalance(userAddress: string, tokenAddress: string): Promise<string> {
    const token = new Contract(tokenAddress, ERC20_ABI, this.provider)
    const balance = await token.balanceOf(userAddress)
    return balance.toString()
  }
}
```

### 智能切换策略

```typescript
// services/adaptiveDataService.ts
export class AdaptiveDataService {
  private apiProvider: APIDataProvider
  private contractProvider: ContractDataProvider
  private metrics = {
    apiSuccessRate: 0.95,
    apiAvgLatency: 200,
    contractAvgLatency: 2000,
  }

  async getData<T>(operation: string, ...args: any[]): Promise<T> {
    const strategy = this.selectStrategy(operation)

    if (strategy === 'api-first') {
      return this.apiFirstStrategy(operation, ...args)
    } else if (strategy === 'contract-first') {
      return this.contractFirstStrategy(operation, ...args)
    } else {
      return this.parallelStrategy(operation, ...args)
    }
  }

  private selectStrategy(operation: string): 'api-first' | 'contract-first' | 'parallel' {
    // 对于价格查询，API 通常更快
    if (operation === 'getTokenPrice') {
      return this.metrics.apiSuccessRate > 0.9 ? 'api-first' : 'contract-first'
    }

    // 对于余额查询，如果是实时交易，优先使用合约
    if (operation === 'getUserBalance') {
      return 'contract-first'
    }

    // 对于流动性查询，使用并行策略
    if (operation === 'getPoolLiquidity') {
      return 'parallel'
    }

    return 'api-first'
  }

  private async apiFirstStrategy<T>(operation: string, ...args: any[]): Promise<T> {
    try {
      const startTime = Date.now()
      const result = await (this.apiProvider as any)[operation](...args)

      // 更新成功率指标
      this.updateMetrics('api', true, Date.now() - startTime)
      return result
    } catch (error) {
      console.warn(`API ${operation} failed, falling back to contract:`, error)

      // 更新失败率指标
      this.updateMetrics('api', false, 0)

      // 回退到合约调用
      return await (this.contractProvider as any)[operation](...args)
    }
  }

  private async parallelStrategy<T>(operation: string, ...args: any[]): Promise<T> {
    const apiPromise = (this.apiProvider as any)[operation](...args)
    const contractPromise = (this.contractProvider as any)[operation](...args)

    try {
      // 等待最快的响应
      const result = await Promise.race([apiPromise, contractPromise])
      return result
    } catch (error) {
      // 如果最快的失败了，等待另一个
      try {
        return await Promise.any([apiPromise, contractPromise])
      } catch (allErrors) {
        throw new Error(`All providers failed: ${allErrors}`)
      }
    }
  }

  private updateMetrics(provider: 'api' | 'contract', success: boolean, latency: number) {
    if (provider === 'api') {
      this.metrics.apiSuccessRate = this.metrics.apiSuccessRate * 0.95 + (success ? 0.05 : 0)
      if (success) {
        this.metrics.apiAvgLatency = this.metrics.apiAvgLatency * 0.9 + latency * 0.1
      }
    }
  }
}
```

## 性能优化策略

### 缓存策略

```typescript
// utils/cacheManager.ts
export class CacheManager {
  private memoryCache = new Map<string, CacheItem>()
  private persistentCache: IDBDatabase | null = null

  async init() {
    // 初始化 IndexedDB 持久化缓存
    this.persistentCache = await this.openDB('pancakeswap-cache', 1)
  }

  async get<T>(key: string, fetchFn: () => Promise<T>, ttl: number = 300000): Promise<T> {
    // 1. 检查内存缓存
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && Date.now() - memoryItem.timestamp < ttl) {
      return memoryItem.data
    }

    // 2. 检查持久化缓存
    const persistentItem = await this.getFromPersistentCache<T>(key)
    if (persistentItem && Date.now() - persistentItem.timestamp < ttl) {
      // 更新内存缓存
      this.memoryCache.set(key, persistentItem)
      return persistentItem.data
    }

    // 3. 获取新数据
    const data = await fetchFn()
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    }

    // 4. 更新缓存
    this.memoryCache.set(key, cacheItem)
    await this.saveToPersistentCache(key, cacheItem)

    return data
  }

  // 预加载策略
  async preloadCriticalData() {
    const criticalKeys = ['common-tokens', 'top-pools', 'gas-price', 'network-status']

    await Promise.all(criticalKeys.map((key) => this.preloadKey(key)))
  }

  private async preloadKey(key: string) {
    try {
      await this.get(key, () => this.fetchCriticalData(key), 60000)
    } catch (error) {
      console.warn(`Failed to preload ${key}:`, error)
    }
  }
}
```

### 批量操作优化

```typescript
// utils/batchProcessor.ts
export class BatchProcessor {
  private batchQueue = new Map<string, BatchItem[]>()
  private batchTimers = new Map<string, NodeJS.Timeout>()

  // 批量处理代币价格查询
  async batchGetTokenPrices(tokenAddresses: string[]): Promise<Map<string, number>> {
    const batchId = 'token-prices'
    const maxBatchSize = 50
    const batchDelay = 100 // 100ms

    return new Promise((resolve, reject) => {
      const batchItems: BatchItem[] = tokenAddresses.map((address) => ({
        key: address,
        resolve,
        reject,
      }))

      // 添加到批处理队列
      if (!this.batchQueue.has(batchId)) {
        this.batchQueue.set(batchId, [])
      }

      const queue = this.batchQueue.get(batchId)!
      queue.push(...batchItems)

      // 如果达到批量大小或设置定时器
      if (queue.length >= maxBatchSize) {
        this.processBatch(batchId)
      } else if (!this.batchTimers.has(batchId)) {
        const timer = setTimeout(() => {
          this.processBatch(batchId)
        }, batchDelay)
        this.batchTimers.set(batchId, timer)
      }
    })
  }

  private async processBatch(batchId: string) {
    const queue = this.batchQueue.get(batchId)
    if (!queue || queue.length === 0) return

    // 清理定时器
    const timer = this.batchTimers.get(batchId)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(batchId)
    }

    // 提取要处理的项目
    const items = queue.splice(0, 50) // 限制批量大小
    const tokenAddresses = items.map((item) => item.key)

    try {
      // 执行批量查询
      const prices = await this.executeBatchPriceQuery(tokenAddresses)

      // 分发结果
      const priceMap = new Map(prices.map((p) => [p.address, p.price]))
      items.forEach((item) => {
        item.resolve(priceMap)
      })
    } catch (error) {
      // 分发错误
      items.forEach((item) => {
        item.reject(error)
      })
    }
  }

  private async executeBatchPriceQuery(addresses: string[]): Promise<TokenPriceData[]> {
    // 实际的批量查询实现
    const response = await fetch('/api/v1/prices/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: addresses }),
    })

    return await response.json()
  }
}
```

## 总结

第三部分 B 深入探讨了 PancakeSwap 交易模块的高级特性：

1. **交易策略**：根据交易金额和市场条件动态选择最优策略
2. **自定义路由**：实现了多跳路径发现和分割路由算法
3. **智能执行**：包含重试机制、Gas 优化和 MEV 保护
4. **混合架构**：Web2 和 Web3 的最佳实践结合
5. **性能优化**：缓存策略、批量处理和预加载机制

这些高级特性确保了 PancakeSwap 能够为用户提供最优的交易体验，同时保持系统的稳定性和可扩展性。通过 Web2 和 Web3 的混合架构，PancakeSwap 在保证去中心化特性的同时，也能提供接近中心化应用的用户体验。
