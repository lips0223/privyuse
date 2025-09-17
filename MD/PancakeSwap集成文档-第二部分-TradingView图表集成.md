# PancakeSwap 集成文档 - 第二部分：TradingView 图表集成

## 📋 目录

1. [TradingView 集成概览](#tradingview-集成概览)
2. [核心目录结构](#核心目录结构)
3. [Datafeed 数据源架构](#datafeed-数据源架构)
4. [WebSocket 实时数据流](#websocket-实时数据流)
5. [图表组件实现](#图表组件实现)
6. [数据处理流程](#数据处理流程)
7. [性能优化策略](#性能优化策略)

## 🚀 TradingView 集成概览

PancakeSwap 采用 TradingView 的 Charting Library 来实现专业级的 K 线图表功能，整个集成方案包含：

### 核心特性

- **专业 K 线图**：支持多种时间周期（1m, 5m, 15m, 30m, 1h, 1d）
- **实时数据流**：WebSocket 连接实现毫秒级价格更新
- **多链支持**：统一接口支持 BSC、Ethereum、Polygon 等
- **自定义 Datafeed**：完全自主的数据源控制
- **技术指标**：内置丰富的技术分析工具

### 技术架构

```
TradingView Widget
    ↓
自定义 Datafeed (pancakeswap-charting-library.es.js)
    ↓
┌─────────────────┬─────────────────┐
│   历史数据API     │   实时WebSocket  │
│                │                │
│ REST API       │ WSS 连接        │
│ 获取K线历史      │ 实时价格推送     │
└─────────────────┴─────────────────┘
    ↓
数据处理与计算 (价格比率计算)
    ↓
图表渲染与更新
```

## 📁 核心目录结构

```
apps/web/src/components/Chart/
├── lib/                                    # TradingView 核心库
│   ├── pancakeswap-charting-library.es.js  # 自定义 Datafeed 实现
│   ├── pancakeswap-charting-library.d.ts   # TypeScript 类型定义
│   └── charting_library/                   # TradingView 官方库文件
├── TradingViewChart.tsx                     # 图表主组件
├── hooks/                                   # 图表相关 Hooks
│   ├── useChartData.ts                     # 图表数据管理
│   └── useSymbolInfo.ts                    # 交易对信息管理
└── utils/                                   # 工具函数
    ├── setSymbolInfo.ts                    # 设置交易对信息
    └── createTradingViewWidget.ts          # 创建图表实例
```

## 🏗️ Datafeed 数据源架构

### 1. 自定义 Datafeed 类结构

```javascript
// apps/web/src/components/Chart/lib/pancakeswap-charting-library.es.js

class PancakeSwapDatafeed {
  constructor(configuration = {}, apiClient) {
    // WebSocket 连接配置
    this.wsUrl = 'wss://pcs-ws.dquery.ai/ws'
    this.ws = null
    this.subscriptions = new Map()

    // API 客户端配置
    this.api = apiClient
    this.configuration = {
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true,
      ...configuration,
    }
  }

  // TradingView 必需的核心方法
  onReady(callback) {
    // 返回 Datafeed 配置信息
    setTimeout(() => callback(this.configuration), 0)
  }

  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    // 解析交易对信息，从 window.pcsExtraData 获取代币地址
    const tokenInfo = this.getTokenInfoFromGlobal()

    const symbolInfo = {
      name: symbolName,
      ticker: symbolName,
      description: `${tokenInfo.baseSymbol}/${tokenInfo.quoteSymbol}`,
      type: 'token',
      session: '24x7',
      timezone: 'Etc/UTC',
      pricescale: 100000,
      minmov: 1,
      format: 'price',
      supported_resolutions: this.configuration.supported_resolutions,
      // 将代币信息存储在 long_description 中供后续使用
      long_description: JSON.stringify({
        baseToken: tokenInfo.baseToken,
        quoteToken: tokenInfo.quoteToken,
        fromChainId: tokenInfo.fromChainId,
        toChainId: tokenInfo.toChainId,
      }),
    }

    onSymbolResolvedCallback(symbolInfo)
  }

  getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    // 获取历史 K 线数据
    this.fetchHistoricalData(symbolInfo, resolution, periodParams)
      .then((bars) => onHistoryCallback(bars, { noData: bars.length === 0 }))
      .catch((error) => onErrorCallback(error))
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID) {
    // 订阅实时数据
    this.initWebSocket()
    this.subscriptions.set(subscriberUID, {
      symbolInfo,
      resolution,
      onTick: onRealtimeCallback,
    })

    // 发送 WebSocket 订阅消息
    this.sendSubscriptionMessage(symbolInfo, resolution)
  }

  unsubscribeBars(subscriberUID) {
    // 取消订阅
    this.subscriptions.delete(subscriberUID)
    if (this.subscriptions.size === 0) {
      this.closeWebSocket()
    }
  }
}
```

### 2. 全局数据接口设计

```typescript
// TradingView 与 React 组件的数据桥梁
interface Window {
  TradingView: {
    widget: new (options: TradingViewWidgetOptions) => TradingViewWidget
  }
  Datafeeds: {
    UDFCompatibleDatafeed: new (url: string, options?: any) => any
  }
  pcsExtraData: {
    token0Address: string // 基础代币地址
    token1Address: string // 报价代币地址
    fromChainId: number // 源链 ID
    toChainId: number // 目标链 ID
    on24HrDataReady: (h: number, l: number, c: number, changes: number) => void
    onCurrentPriceUpdate: (c: number) => void
    fetch24HrData?: () => Promise<{ high: number; low: number; close: number; changes: number } | null>
  }
}

// React 组件设置交易对信息
const setSymbolInfo = (currency0, currency1, on24HPriceDataChange, onLiveDataChanges) => {
  window.pcsExtraData = {
    token0Address: currency0?.wrapped?.address || '',
    token1Address: currency1?.wrapped?.address || '',
    fromChainId: currency0?.chainId || 56,
    toChainId: currency1?.chainId || 56,
    on24HrDataReady: on24HPriceDataChange,
    onCurrentPriceUpdate: onLiveDataChanges,
  }
}
```

## 🌐 WebSocket 实时数据流

### 1. WebSocket 连接管理

```javascript
class PancakeSwapDatafeed {
  initWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[Datafeed]: WebSocket connection already open')
      return
    }

    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('[Datafeed]: WebSocket connection established')
        this.resubscribeAll() // 重新订阅所有交易对
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.processWebSocketMessage(data)
        } catch (error) {
          console.error('[Datafeed]: Error processing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[Datafeed]: WebSocket error:', error)
      }

      this.ws.onclose = (event) => {
        console.log(`[Datafeed]: WebSocket connection closed: ${event.code} ${event.reason}`)
        if (event.code !== 1000) {
          // 非正常关闭，5秒后重连
          setTimeout(() => this.initWebSocket(), 5000)
        }
      }
    } catch (error) {
      console.error('[Datafeed]: Error initializing WebSocket:', error)
    }
  }
}
```

### 2. 订阅消息格式

```javascript
subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID) {
  const tokenInfo = JSON.parse(symbolInfo.long_description || '{}')
  const { baseToken, quoteToken, fromChainId, toChainId } = tokenInfo

  // 获取链信息
  const baseChain = getChainInfo(fromChainId)
  const quoteChain = getChainInfo(toChainId)

  // 构建订阅消息
  const baseSubscription = `datahub@kline@${baseChain.id}@${baseToken.toLowerCase()}@${resolution}`
  const quoteSubscription = `datahub@kline@${quoteChain.id}@${quoteToken.toLowerCase()}@${resolution}`

  // 发送订阅请求
  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(JSON.stringify({
      method: 'SUBSCRIPTION',
      params: [baseSubscription]
    }))

    this.ws.send(JSON.stringify({
      method: 'SUBSCRIPTION',
      params: [quoteSubscription]
    }))
  }
}
```

### 3. 实时数据处理

```javascript
processWebSocketMessage(data) {
  if (!data.d || !data.c) return

  // 解析订阅字符串获取代币地址
  const subscription = data.c
  const parts = subscription.split('@')
  if (parts.length < 4) return

  const tokenAddress = parts[3].toLowerCase()

  // 解析价格数据 [open, high, low, close, volume, timestamp]
  const priceData = data.d.u
  const [open, high, low, close, volume, timestamp] = priceData.map(parseFloat)

  // 时间戳转换 (秒 → 毫秒)
  let finalTimestamp = timestamp
  if (timestamp < 10000000000) {
    finalTimestamp *= 1000
  }

  const klineData = {
    o: open,
    h: high,
    l: low,
    c: close,
    v: volume,
    t: finalTimestamp
  }

  // 分发数据到相应的订阅
  this.subscriptions.forEach((subscription, subscriberUID) => {
    const { symbolInfo, onTick } = subscription
    const symbolTokens = JSON.parse(symbolInfo.long_description || '{}')

    if (this.isTokenMatch(tokenAddress, symbolTokens)) {
      // 缓存基础代币和报价代币数据
      if (tokenAddress === symbolTokens.baseToken.toLowerCase()) {
        subscription.baseData = klineData
      } else {
        subscription.quoteData = klineData
      }

      // 当两个代币数据都到达时，计算价格比率
      if (subscription.baseData && subscription.quoteData) {
        this.calculatePriceRatio(subscription)
      }
    }
  })
}

calculatePriceRatio(subscription) {
  const { baseData, quoteData, onTick } = subscription

  // 确保时间戳接近 (允许1秒误差)
  if (Math.abs(baseData.t - quoteData.t) <= 1000) {
    // 计算价格比率：base/quote
    const open = baseData.o / quoteData.o
    let high = baseData.h / quoteData.h
    let low = baseData.l / quoteData.l
    const close = baseData.c / quoteData.c

    // 确保 high >= low
    if (high < low) {
      [high, low] = [low, high]
    }

    const volume = (baseData.v + quoteData.v) / 2

    // 构建 TradingView K线数据格式
    const bar = {
      time: baseData.t,
      open: open,
      high: high,
      low: low,
      close: close,
      volume: volume
    }

    // 回调更新图表
    onTick(bar)

    // 更新全局价格信息
    if (window.pcsExtraData?.onCurrentPriceUpdate) {
      window.pcsExtraData.onCurrentPriceUpdate(close)
    }
  }
}
```

## 📈 图表组件实现

### 1. TradingViewChart 主组件

```typescript
// apps/web/src/components/Chart/TradingViewChart.tsx
export const TradingViewChart: FC<TradingViewChartProps> = ({
  currency0,
  currency1,
  onLiveDataChanges,
  on24HPriceDataChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<TradingViewWidget | null>(null)

  // 防抖处理货币变化
  const debouncedCurrency0 = useDebounce(currency0, 500)
  const debouncedCurrency1 = useDebounce(currency1, 500)

  // 异步初始化图表
  const initChart = useCallback(async () => {
    if (!containerRef.current || !debouncedCurrency0 || !debouncedCurrency1) return

    try {
      // 等待 TradingView 库加载
      await waitForTradingView()

      // 设置图表配置
      const options = {
        symbol: `${debouncedCurrency0.symbol}/${debouncedCurrency1.symbol}`,
        interval: '15', // 默认15分钟
        library_path: 'https://assets.pancakeswap.finance/web/charts/charting_library/',
        locale: 'en',
        theme: 'Light',
        // 自定义 Datafeed
        datafeed: createCustomDatafeed(),
        disabled_features: ['use_localstorage_for_settings', 'volume_force_overlay'],
        enabled_features: ['study_templates', 'create_volume_indicator_by_default'],
        overrides: {
          // 自定义样式
          'paneProperties.background': '#ffffff',
          'paneProperties.vertGridProperties.color': '#f0f0f0',
          'paneProperties.horzGridProperties.color': '#f0f0f0',
        },
        custom_css_url: '/charting_library/custom.css',
        time_frames: [
          { text: '1m', resolution: '1' },
          { text: '5m', resolution: '5' },
          { text: '15m', resolution: '15' },
          { text: '30m', resolution: '30' },
          { text: '1h', resolution: '60' },
          { text: '1d', resolution: '1D' },
        ],
      }

      // 设置全局交易对信息
      setSymbolInfo(debouncedCurrency0, debouncedCurrency1, on24HPriceDataChange, onLiveDataChanges)

      // 创建 TradingView 图表实例
      widgetRef.current = createTradingViewWidget(containerRef.current, options)

      console.log('TradingView chart initialized successfully')
    } catch (error) {
      console.error('Failed to initialize TradingView chart:', error)
    }
  }, [debouncedCurrency0, debouncedCurrency1, on24HPriceDataChange, onLiveDataChanges])

  // 监听货币变化，重新初始化图表
  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.remove()
      widgetRef.current = null
    }

    initChart()

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove()
      }
    }
  }, [initChart])

  return (
    <div className="tradingview-chart-container">
      <div ref={containerRef} className="tradingview-chart" />
      {!debouncedCurrency0 ||
        (!debouncedCurrency1 && (
          <div className="chart-loading">
            <Spinner />
            <Text>Loading chart...</Text>
          </div>
        ))}
    </div>
  )
}
```

### 2. 图表实例创建

```javascript
// createTradingViewWidget 函数实现
function createTradingViewWidget(container, options = {}) {
  if (!window.TradingView || !window.Datafeeds) {
    console.error('TradingView or Datafeeds not found')
    return null
  }

  // 设置默认的全局数据
  window.pcsExtraData = window.pcsExtraData || {}
  window.pcsExtraData.token0Address = window.pcsExtraData.token0Address || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // WBNB
  window.pcsExtraData.token1Address = window.pcsExtraData.token1Address || '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' // CAKE
  window.pcsExtraData.fromChainId = window.pcsExtraData.fromChainId || 56
  window.pcsExtraData.toChainId = window.pcsExtraData.toChainId || 56

  // 获取链信息
  const fromChain = getChainInfo(window.pcsExtraData.fromChainId)
  const toChain = getChainInfo(window.pcsExtraData.toChainId)

  console.log(`Creating chart for ${fromChain?.name} → ${toChain?.name}`)

  // 创建自定义 Datafeed
  const apiClient = createApiClient()
  const datafeed = new PancakeSwapDatafeed({}, apiClient)

  // 合并配置
  const config = {
    symbol: 'WBNB/CAKE',
    interval: '15',
    fullscreen: false,
    library_path: 'https://assets.pancakeswap.finance/web/charts/charting_library/',
    locale: 'en',
    datafeed: datafeed, // 注入自定义 Datafeed
    disabled_features: ['use_localstorage_for_settings'],
    enabled_features: ['study_templates'],
    charts_storage_url: 'https://saveload.tradingview.com',
    charts_storage_api_version: '1.1',
    client_id: 'tradingview.com',
    user_id: 'public_user_id',
    theme: 'Light',
    ...options,
    container: typeof container === 'string' ? container : container.id,
  }

  // 创建 TradingView Widget
  return new window.TradingView.widget(config)
}
```

## 📊 数据处理流程

### 1. 历史数据获取流程

```javascript
// 历史 K 线数据获取
async getBars(symbolInfo, resolution, periodParams, onResult, onError) {
  console.log('[Datafeed]: getBars() called', {
    symbol: symbolInfo.name,
    resolution: resolution,
    from: new Date(periodParams.from * 1000).toISOString(),
    to: new Date(periodParams.to * 1000).toISOString()
  })

  try {
    const tokenInfo = JSON.parse(symbolInfo.long_description || '{}')
    const { baseToken, quoteToken, fromChainId, toChainId } = tokenInfo

    if (!baseToken || !quoteToken) {
      onError('Missing token information')
      return
    }

    // 设置 API 平台
    this.api.setPlatform(Number(fromChainId), 'from')
    this.api.setPlatform(Number(toChainId), 'to')

    const { from, to, countBack } = periodParams

    // 并行获取两个代币的历史数据
    const [baseHistory, quoteHistory] = await Promise.all([
      this.api.getHistoricalData(baseToken, resolution, from, to, countBack),
      this.api.getHistoricalData(quoteToken, resolution, from, to, countBack)
    ])

    // 数据对齐和比率计算
    const alignedBars = this.alignAndCalculateBars(baseHistory, quoteHistory)

    console.log(`[Datafeed]: Returning ${alignedBars.length} bars`)
    onResult(alignedBars, { noData: alignedBars.length === 0 })

  } catch (error) {
    console.error('[Datafeed]: Error in getBars:', error)
    onError(error.message)
  }
}

// 数据对齐和价格比率计算
alignAndCalculateBars(baseData, quoteData) {
  const bars = []
  const baseMap = new Map()
  const quoteMap = new Map()

  // 创建时间戳映射
  baseData.forEach(bar => baseMap.set(bar.time, bar))
  quoteData.forEach(bar => quoteMap.set(bar.time, bar))

  // 找到共同的时间点
  const commonTimes = [...baseMap.keys()].filter(time => quoteMap.has(time))

  commonTimes.forEach(time => {
    const baseBar = baseMap.get(time)
    const quoteBar = quoteMap.get(time)

    // 计算价格比率
    const bar = {
      time: time,
      open: baseBar.open / quoteBar.open,
      high: baseBar.high / quoteBar.high,
      low: baseBar.low / quoteBar.low,
      close: baseBar.close / quoteBar.close,
      volume: (baseBar.volume + quoteBar.volume) / 2
    }

    // 确保 high >= low
    if (bar.high < bar.low) {
      [bar.high, bar.low] = [bar.low, bar.high]
    }

    bars.push(bar)
  })

  // 按时间排序
  return bars.sort((a, b) => a.time - b.time)
}
```

### 2. 24 小时数据计算

```javascript
// 24小时价格数据计算
async fetch24HrData() {
  try {
    const token0Address = window.pcsExtraData.token0Address
    const token1Address = window.pcsExtraData.token1Address
    const fromChainId = window.pcsExtraData.fromChainId
    const toChainId = window.pcsExtraData.toChainId

    if (!token0Address || !token1Address) {
      console.error('[fetch24HrData]: Missing token addresses')
      return null
    }

    console.log(`[Datafeed]: Fetching 24hr data for ${token0Address}/${token1Address}`)

    // 设置API平台
    this.api.setPlatform(Number(fromChainId), 'from')
    this.api.setPlatform(Number(toChainId), 'to')

    // 并行获取24小时数据
    const [base24hr, quote24hr] = await Promise.all([
      this.api.get24HrData(token0Address, 'from'),
      this.api.get24HrData(token1Address, 'to')
    ])

    if (!base24hr || !quote24hr) {
      console.warn('[fetch24HrData]: Missing 24hr data')
      return null
    }

    // 计算比率
    const high = base24hr.high / quote24hr.low    // 最高比率
    const low = base24hr.low / quote24hr.high     // 最低比率
    const close = base24hr.close / quote24hr.close // 当前比率
    const open = base24hr.open / quote24hr.open   // 开盘比率

    // 计算24小时变化百分比
    const changes = ((close - open) / open) * 100

    const result = { high, low, close, changes }
    console.log('[fetch24HrData]: Calculated 24hr data:', result)

    // 通知 React 组件
    if (window.pcsExtraData?.on24HrDataReady) {
      window.pcsExtraData.on24HrDataReady(high, low, close, changes)
    }

    return result

  } catch (error) {
    console.error('[fetch24HrData]: Error fetching 24hr data:', error)
    return null
  }
}
```

## ⚡ 性能优化策略

### 1. 连接复用和重连机制

```javascript
class PancakeSwapDatafeed {
  constructor() {
    this.connectionPool = new Map() // 连接池
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  initWebSocket() {
    // 检查现有连接
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    // 清理旧连接
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        console.log('[Datafeed]: WebSocket connected')
        this.reconnectAttempts = 0 // 重置重连计数
        this.resubscribeAll()
      }

      this.ws.onclose = (event) => {
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          // 指数退避重连
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
          this.reconnectAttempts++

          console.log(`[Datafeed]: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
          setTimeout(() => this.initWebSocket(), delay)
        }
      }
    } catch (error) {
      console.error('[Datafeed]: WebSocket initialization error:', error)
    }
  }
}
```

### 2. 数据缓存和批量处理

```javascript
class DataCache {
  constructor(ttl = 60000) {
    // 1分钟TTL
    this.cache = new Map()
    this.ttl = ttl
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }
}

// 使用缓存优化历史数据获取
const dataCache = new DataCache()

async function getCachedHistoricalData(token, resolution, from, to) {
  const cacheKey = `${token}-${resolution}-${from}-${to}`

  // 尝试从缓存获取
  const cached = dataCache.get(cacheKey)
  if (cached) {
    console.log('[Cache]: Hit for', cacheKey)
    return cached
  }

  // 缓存未命中，获取新数据
  const data = await api.getHistoricalData(token, resolution, from, to)
  dataCache.set(cacheKey, data)

  return data
}
```

### 3. 订阅管理优化

```javascript
class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map()
    this.pendingSubscriptions = new Set()
    this.batchTimeout = null
  }

  addSubscription(uid, subscription) {
    this.subscriptions.set(uid, subscription)

    // 批量处理订阅请求
    this.pendingSubscriptions.add(subscription)
    this.scheduleBatchProcess()
  }

  scheduleBatchProcess() {
    if (this.batchTimeout) return

    this.batchTimeout = setTimeout(() => {
      this.processBatchSubscriptions()
      this.batchTimeout = null
    }, 100) // 100ms 批量窗口
  }

  processBatchSubscriptions() {
    if (this.pendingSubscriptions.size === 0) return

    console.log(`[Subscription]: Processing ${this.pendingSubscriptions.size} subscriptions`)

    // 按链和分辨率分组
    const groups = new Map()

    this.pendingSubscriptions.forEach((sub) => {
      const key = `${sub.chainId}-${sub.resolution}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(sub)
    })

    // 批量发送订阅请求
    groups.forEach((subs, key) => {
      const subscriptionMessages = subs.map((sub) => ({
        method: 'SUBSCRIPTION',
        params: [sub.channel],
      }))

      // 一次性发送多个订阅
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            method: 'BATCH_SUBSCRIPTION',
            params: subscriptionMessages,
          }),
        )
      }
    })

    this.pendingSubscriptions.clear()
  }
}
```

## 🎯 总结

PancakeSwap 的 TradingView 集成方案体现了以下特点：

### 架构优势

- **自定义 Datafeed**：完全控制数据源和处理逻辑
- **实时数据流**：WebSocket 提供毫秒级价格更新
- **多链支持**：统一接口支持多个区块链网络
- **价格比率计算**：智能处理两个代币的价格关系

### 技术特色

- **数据对齐算法**：确保历史数据的时间同步
- **连接管理**：自动重连和连接池优化
- **缓存策略**：减少重复数据请求
- **批量处理**：优化 WebSocket 订阅性能

### 用户体验

- **专业图表**：TradingView 级别的交易体验
- **流畅交互**：实时数据无延迟显示
- **多时间周期**：满足不同交易策略需求
- **技术分析**：内置丰富的技术指标

这套方案为 PancakeSwap 提供了专业级的图表功能，既保持了数据的实时性和准确性，又提供了优秀的用户体验。通过自定义 Datafeed 和智能的数据处理算法，成功解决了去中心化交易所图表数据的复杂性问题。
