# PancakeSwap 集成文档 - 第一部分：钱包连接方案

## 📋 目录

1. [技术栈概览](#技术栈概览)
2. [核心目录结构](#核心目录结构)
3. [钱包连接架构](#钱包连接架构)
4. [技术工具详解](#技术工具详解)
5. [社交登录核心实现](#社交登录核心实现)
6. [自定义钱包 UI](#自定义钱包ui)
7. [实现流程分析](#实现流程分析)

## 🛠️ 技术栈概览

PancakeSwap 的钱包连接方案采用了现代化的多层架构，整合了多种先进技术：

### 核心技术栈

- **Wagmi v2** - React 钱包连接库
- **Viem** - 现代化的以太坊客户端库
- **Firebase Auth** - 社交登录认证服务
- **Privy** - Web3 用户身份管理平台
- **TanStack Query** - 数据获取和缓存
- **Jotai** - 原子化状态管理

### 支持的钱包类型

```typescript
// 传统钱包连接
- MetaMask, Trust Wallet, WalletConnect
- Coinbase Wallet, Binance Web3 Wallet
- SafePal, Blocto, Injected Wallets

// 社交登录钱包
- Google OAuth
- X (Twitter) OAuth
- Discord OAuth
- Telegram WebApp
```

## 📁 核心目录结构

```
apps/web/src/
├── wallet/                           # 钱包连接核心目录
│   ├── Privy/                       # Privy 集成
│   │   ├── firebase.tsx             # Firebase 社交登录实现
│   │   ├── telegramLogin.ts         # Telegram 登录集成
│   │   ├── constants.ts             # Firebase 配置
│   │   ├── atom.ts                  # Privy 状态管理
│   │   └── hooks/                   # Privy 相关 Hooks
│   │       └── usePrivySmartAccountConnector.ts
│   └── hook/                        # 钱包连接 Hooks
│       ├── useSyncWagmiState.ts     # Wagmi 状态同步
│       └── useSwitchNetworkV2.ts    # 网络切换逻辑
├── hooks/
│   └── useAuth.tsx                  # 统一认证入口
├── components/
│   └── WalletModalManager.tsx       # 钱包模态框管理
├── utils/
│   ├── wagmi.ts                     # Wagmi 配置
│   └── viem.ts                      # Viem 客户端配置
└── packages/
    ├── ui-wallets/                  # 钱包UI组件库
    │   └── src/components/
    │       └── SocialLogin.tsx      # 社交登录组件
    └── wagmi/                       # Wagmi 连接器
        └── connectors/              # 自定义连接器
            ├── trustWallet/
            ├── blocto/
            └── binanceWeb3/
```

## 🏗️ 钱包连接架构

### 1. 多链钱包连接架构图

```
用户界面层
    ↓
WalletModalManager (统一入口)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   传统钱包连接    │    社交登录钱包   │    智能合约钱包   │
│                │                │                │
│ Wagmi + Viem   │ Firebase Auth  │ Privy Smart    │
│ 连接器          │ + Privy        │ Account        │
└─────────────────┴─────────────────┴─────────────────┘
    ↓
统一状态管理 (Jotai Atoms)
    ↓
多链支持 (EVM + Solana + Aptos)
```

### 2. 状态管理架构

```typescript
// apps/web/src/hooks/useAuth.tsx
const useAuth = () => {
  const { connectAsync, connectors } = useConnect() // Wagmi 连接
  const { logout: privyLogout } = usePrivy() // Privy 登出
  const { signOutAndClearUserStates } = useFirebaseAuth() // Firebase 登出

  // 统一登录入口 - 支持多种钱包类型
  const login = useCallback(
    async (wallet: WalletConfigV3) => {
      const { connectorId, networks } = wallet

      // EVM 钱包连接
      if (networks.includes(WalletAdaptedNetwork.EVM)) {
        const findConnector = CONNECTOR_MAP[connectorId]
        return await connectAsync({ connector: findConnector })
      }

      // 其他链的钱包连接逻辑...
    },
    [connectAsync, connectors],
  )
}
```

## 🔧 技术工具详解

### 1. Wagmi v2 - React 钱包连接核心

**作用**：为 React 应用提供类型安全的以太坊钱包连接

**核心配置**：

```typescript
// apps/web/src/utils/wagmi.ts
export const wagmiConfig = createConfig({
  chains: CHAINS, // 支持的区块链
  connectors: [
    // 钱包连接器
    injectedConnector, // 注入式钱包 (MetaMask 等)
    coinbaseConnector, // Coinbase Wallet
    walletConnectConnector, // WalletConnect 协议
    bloctoConnector, // Blocto 钱包
    binanceWeb3WalletConnector, // 币安 Web3 钱包
  ],
  transports: {
    // 区块链传输层
    [mainnet.id]: http(),
    [bsc.id]: fallbackWithRank([http(PUBLIC_NODES[ChainId.BSC][0]), http(PUBLIC_NODES[ChainId.BSC][1])]),
  },
  ssr: true, // 服务端渲染支持
})
```

**优势**：

- 🔒 TypeScript 类型安全
- ⚡ 自动缓存和重新验证
- 🔄 自动重连机制
- 🎯 React Hooks 集成

### 2. Viem - 现代化以太坊客户端

**作用**：替代 ethers.js，提供更现代化的区块链交互

**核心功能**：

```typescript
// apps/web/src/utils/viem.ts
export const publicClient = createPublicClient({
  chain: bsc,
  transport: fallback([http(PUBLIC_NODES[ChainId.BSC][0]), http(PUBLIC_NODES[ChainId.BSC][1])]),
  batch: {
    multicall: true, // 批量调用优化
  },
})

// 多链客户端配置
export const viemClients = CHAINS.reduce((prev, cur) => {
  return {
    ...prev,
    [cur.id]: createPublicClient({
      chain: cur,
      transport: fallbackWithRank(getNodeRpcUrlsFromChainId(cur.id)),
    }),
  }
}, {} as Record<ChainId, PublicClient>)
```

**优势相比 ethers.js**：

- 📦 更小的包体积 (tree-shaking 友好)
- ⚡ 更快的性能
- 🔧 更好的 TypeScript 支持
- 🌐 原生 BigInt 支持

### 3. Firebase Auth - 社交登录认证服务

**作用**：提供 Google、Twitter、Discord 等社交平台登录

**为什么引入 Firebase**：

1. **统一认证管理**：集中管理多个社交平台的 OAuth 流程
2. **安全性保障**：Google 级别的安全标准
3. **用户体验**：一键登录，降低门槛
4. **数据一致性**：统一的用户 ID 体系

**核心实现**：

```typescript
// apps/web/src/wallet/Privy/firebase.tsx
export function FirebaseAuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | undefined>()

  // Google 登录实现
  const signInWithGoogle = async (): Promise<UserCredential> => {
    const auth = getAuth(firebaseApp)
    const googleProvider = new GoogleAuthProvider()
    const res = await signInWithPopup(auth, googleProvider)
    return res
  }

  // Twitter 登录实现
  const signInWithX = async (): Promise<UserCredential> => {
    const auth = getAuth(firebaseApp)
    const twitterProvider = new TwitterAuthProvider()
    const res = await signInWithPopup(auth, twitterProvider)
    return res
  }

  // 监听认证状态变化
  useEffect(() => {
    const auth = getAuth(firebaseApp)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const idToken = await user.getIdToken(true)
        setToken(idToken)
      } else {
        setToken(undefined)
      }
    })
    return unsubscribe
  }, [])
}
```

### 4. Privy - Web3 身份管理平台

**作用**：将传统社交登录账户转换为 Web3 钱包

**为什么引入 Privy**：

1. **Web2 到 Web3 桥梁**：让传统用户无缝进入 Web3
2. **智能合约钱包**：自动生成智能合约钱包
3. **多重签名支持**：增强安全性
4. **跨链兼容**：支持多个区块链网络

**核心流程**：

```typescript
// 社交登录 → Privy 钱包生成流程
Firebase Auth (社交登录)
    ↓
    获取 ID Token
    ↓
Privy 验证 Token
    ↓
自动生成智能合约钱包
    ↓
Wagmi 连接器集成
    ↓
用户可以进行 Web3 交易
```

**智能合约钱包连接器**：

```typescript
// apps/web/src/wallet/Privy/hooks/usePrivySmartAccountConnector.ts
export const useEmbeddedSmartAccountConnectorV2 = () => {
  const { client: isReady, getClientForChain } = useSmartWallets()

  // 注册智能账户连接器到 Wagmi
  useEffect(() => {
    if (isReady) {
      const smartAccountConnector = createSmartAccountConnector({
        client: getClientForChain,
        // 智能合约钱包配置
      })

      // 将连接器注册到 Wagmi 配置中
      config.connectors.push(smartAccountConnector)
    }
  }, [isReady])
}
```

## 🔐 社交登录核心实现

### 1. 社交登录的核心概念

**传统 Web2 登录**：

```
用户 → 社交平台 OAuth → 获取用户信息 → 应用内会话
```

**PancakeSwap Web3 社交登录**：

```
用户 → 社交平台 OAuth → Firebase Auth → 生成 ID Token → Privy 验证 → 创建智能合约钱包 → Web3 交易能力
```

### 2. Google 登录实现

```typescript
// apps/web/src/wallet/Privy/firebase.tsx
const loginWithGoogle = async () => {
  try {
    setPrivySocialLogin(true) // 标记为 Privy 社交登录
    setSocialProvider('google') // 设置登录提供商
    setLoading(true)

    // 1. Firebase Google OAuth
    const loginRes = await signInWithGoogle()

    // 2. 获取 ID Token
    const idToken = await loginRes.user.getIdToken(true)

    // 3. 设置 Token 供 Privy 使用
    setToken(idToken)
  } catch (err: any) {
    // 用户取消登录处理
    if (err?.message === 'LOGIN_CANCELLED') {
      setPrivySocialLogin(false)
      setSocialProvider(null)
      return
    }
    console.error('Google login error:', err)
  } finally {
    setLoading(false)
  }
}
```

### 3. Discord 登录实现

Discord 使用弹窗式 OAuth 流程：

```typescript
const loginWithDiscord = async () => {
  try {
    setPrivySocialLogin(true)
    setSocialProvider('discord')
    setLoading(true)

    // 1. 生成安全状态码防止 CSRF
    const state = nanoid(21)
    localStorage.setItem('discordAuthState', state)

    // 2. 打开 Discord OAuth 弹窗
    const redirectUri = `${window.location.origin}/api/auth/discord-callback`
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
    const popup = window.open(
      `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code&scope=identify&state=${state}`,
      '_blank',
      'width=500,height=600',
    )

    // 3. 监听回调消息
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.customToken) {
        // 验证状态码
        const expectedState = localStorage.getItem('discordAuthState')
        if (event.data.state !== expectedState) {
          console.error('Discord OAuth state mismatch, potential CSRF attack')
          return
        }

        // 4. 使用自定义 Token 登录 Firebase
        await loginWithCustomToken(event.data.customToken)
      }
    }

    window.addEventListener('message', handleMessage)
  } catch (err) {
    console.error('Discord login error:', err)
  }
}
```

### 4. Telegram 登录实现

Telegram 使用官方 Web Widget：

```typescript
// apps/web/src/wallet/Privy/telegramLogin.ts
export const loginWithTelegramViaScript = (callback: (token: string) => void) => {
  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME!)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')

  // 全局回调函数
  window.onTelegramAuth = async (user: TelegramUser) => {
    try {
      // 将 Telegram 用户数据发送到后端验证
      const response = await fetch('/api/auth/telegram-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })

      const { customToken } = await response.json()
      callback(customToken)
    } catch (error) {
      console.error('Telegram auth error:', error)
    }
  }

  document.body.appendChild(script)
}
```

## 🎨 自定义钱包 UI

### 1. 钱包模态框管理器

```typescript
// apps/web/src/components/WalletModalManager.tsx
const WalletModalManager = () => {
  const { connectAsync } = useConnect()
  const { chainId } = useActiveChainId()
  const { loginWithGoogle, loginWithX, loginWithDiscord, loginWithTelegram } = useFirebaseAuth()

  const createEvmQrCode = useCallback(() => {
    return createQrCode(chainId || ChainId.BSC, connectAsync)
  }, [chainId, connectAsync])

  return (
    <MultichainWalletModal
      evmAddress={evmAccount}
      solanaAddress={solanaAccount}
      evmLogin={login} // 传统钱包登录
      solanaLogin={solanaLogin} // Solana 钱包登录
      createEvmQrCode={createEvmQrCode} // 二维码登录
      // 社交登录方法
      onGoogleLogin={loginWithGoogle}
      onXLogin={loginWithX}
      onDiscordLogin={loginWithDiscord}
      onTelegramLogin={loginWithTelegram}
    />
  )
}
```

### 2. 社交登录组件

```typescript
// packages/ui-wallets/src/components/SocialLogin.tsx
export const SocialLogin: React.FC<SocialLoginProps> = ({
  onGoogleLogin,
  onXLogin,
  onTelegramLogin,
  onDiscordLogin,
}) => {
  return (
    <Column gap="12px">
      {/* Google 登录按钮 */}
      <SocialLoginButton onClick={onGoogleLogin}>
        <img src={`${ASSET_CDN}/web/wallets/social-login/google.jpg`} width="32" />
        <Text>Continue with Google</Text>
      </SocialLoginButton>

      {/* X (Twitter) 登录按钮 */}
      <SocialLoginButton onClick={onXLogin}>
        <img src={`${ASSET_CDN}/web/wallets/social-login/x.jpg`} width="32" />
        <Text>Continue with X</Text>
      </SocialLoginButton>

      {/* Discord 登录按钮 */}
      <SocialLoginButton onClick={onDiscordLogin}>
        <img src={`${ASSET_CDN}/web/wallets/social-login/discord.jpg`} width="32" />
        <Text>Continue with Discord</Text>
      </SocialLoginButton>

      {/* Telegram 登录按钮 */}
      <SocialLoginButton onClick={onTelegramLogin}>
        <img src={`${ASSET_CDN}/web/wallets/social-login/telegram.jpg`} width="32" />
        <Text>Continue with Telegram</Text>
      </SocialLoginButton>
    </Column>
  )
}
```

### 3. 自定义连接器实现

```typescript
// packages/wagmi/connectors/trustWallet/trustWallet.ts
export function trustWalletConnect() {
  return createConnector((config) => ({
    id: 'trustWallet',
    name: 'Trust Wallet',
    type: 'injected',

    async connect({ chainId } = {}) {
      try {
        const provider = await this.getProvider({ chainId })

        // 请求连接
        await provider.request({
          method: 'eth_requestAccounts',
        })

        const accounts = await this.getAccounts()
        const _chainId = await this.getChainId()

        return { accounts, chainId: _chainId }
      } catch (error) {
        throw error
      }
    },

    async getProvider() {
      if (!walletProvider) {
        walletProvider = getTrustWalletProvider()

        // 设置事件监听
        walletProvider.on('accountsChanged', this.onAccountsChanged.bind(this))
        walletProvider.on('chainChanged', this.onChainChanged.bind(this))
        walletProvider.on('disconnect', this.onDisconnect.bind(this))
      }

      return walletProvider
    },

    async isAuthorized() {
      const recentConnectorId = await config.storage?.getItem('recentConnectorId')
      if (recentConnectorId !== this.id) return false

      const accounts = await this.getAccounts()
      return !!accounts.length
    },
  }))
}
```

## 🔄 实现流程分析

### 1. 传统钱包连接流程

```typescript
// 用户点击钱包 → Wagmi 连接器 → 钱包授权 → 账户信息同步
用户选择 MetaMask
    ↓
useAuth.login(wallet) 调用
    ↓
wagmi connectAsync({ connector: metaMaskConnector })
    ↓
MetaMask 弹窗授权
    ↓
useSyncWagmiState 同步状态到 Jotai
    ↓
全局状态更新，UI 显示已连接
```

### 2. 社交登录钱包流程

```typescript
// 社交登录 → Firebase Auth → Privy 钱包 → Wagmi 集成
用户点击 "Continue with Google"
    ↓
Firebase Google OAuth 弹窗
    ↓
获取 Google ID Token
    ↓
Privy 验证 Token 并生成智能合约钱包
    ↓
usePrivySmartAccountConnector 注册连接器
    ↓
Wagmi 自动连接 Privy 钱包
    ↓
用户获得 Web3 交易能力
```

### 3. 状态同步机制

```typescript
// apps/web/src/wallet/hook/useSyncWagmiState.ts
export function useSyncWagmiState() {
  const { chainId: wagmiChainId } = useAccount()
  const { switchNetworkAsync } = useSwitchNetwork()

  // 监听 Wagmi 链 ID 变化
  useEffect(() => {
    const verifyWalletChainId = async () => {
      if (wagmiChainId && oldWagmiChainId.current !== wagmiChainId) {
        // 同步链 ID 到全局状态
        updAccountState((prev) => ({
          ...prev,
          chainId: wagmiChainId,
        }))

        oldWagmiChainId.current = wagmiChainId
      }
    }
    verifyWalletChainId()
  }, [wagmiChainId, switchNetworkAsync])

  // 监听账户变化
  useEffect(() => {
    updAccountState((prev) => ({
      ...prev,
      account: evmAccount,
    }))
  }, [evmAccount, updAccountState])
}
```

### 4. 多链网络切换

```typescript
// apps/web/src/wallet/hook/useSwitchNetworkV2.ts
export const useSwitchNetworkV2 = () => {
  const switchNetwork = useCallback(
    async (requestChainId: number) => {
      try {
        if (isEvm(requestChainId)) {
          // EVM 链切换
          const result = await switchNetworkAsync({ chainId: requestChainId })

          // 更新路由参数
          if (result?.id === requestChainId) {
            const chain = CHAIN_QUERY_NAME[requestChainId as ChainId]
            router.replace({ query: { ...router.query, chain } })
          }

          return true
        } else if (requestChainId === NonEVMChainId.SOLANA) {
          // Solana 链切换
          updateAccountState((prev) => ({
            ...prev,
            chainId: requestChainId,
          }))
          router.replace({ query: { ...router.query, chain: 'solana' } })
          return true
        }
      } catch (error) {
        console.log('switch error', error)
        return false
      }
    },
    [switchNetworkAsync, router],
  )
}
```

## 🏆 总结

PancakeSwap 的钱包连接方案体现了以下特点：

### 技术先进性

- **Wagmi v2 + Viem**：最新的 Web3 技术栈
- **类型安全**：全程 TypeScript 支持
- **性能优化**：批量调用、缓存机制

### 用户体验优化

- **多种连接方式**：传统钱包 + 社交登录
- **零门槛**：社交账户一键生成 Web3 钱包
- **多链支持**：EVM、Solana、Aptos 统一接入

### 安全性保障

- **Firebase 安全标准**：Google 级别的认证安全
- **智能合约钱包**：Privy 提供额外安全层
- **状态隔离**：Jotai 原子化状态管理

### 开发者友好

- **模块化设计**：连接器可插拔
- **统一接口**：多种钱包统一调用方式
- **扩展性强**：新钱包接入成本低

这套方案为 PancakeSwap 提供了业界领先的钱包连接体验，既保持了 Web3 的去中心化特性，又降低了用户使用门槛。
