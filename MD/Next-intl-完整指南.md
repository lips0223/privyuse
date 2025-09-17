# Next-intl 国际化完整指南

## 目录
- [简介](#简介)
- [优势](#优势)
- [项目中的集成步骤](#项目中的集成步骤)
- [基本用法](#基本用法)
- [踩坑记录与解决方案](#踩坑记录与解决方案)
- [水合错误解决方案](#水合错误解决方案)
- [排查问题的思路](#排查问题的思路)
- [最佳实践](#最佳实践)

## 简介

Next-intl 是专为 Next.js 设计的国际化解决方案，支持 App Router 和 Pages Router，提供类型安全的翻译功能。

## 优势

### 🚀 核心优势
1. **完整的 SSR/SSG 支持** - 服务端和客户端组件都能无缝工作
2. **类型安全** - TypeScript 完全支持，编译时检查翻译键
3. **性能优化** - 按需加载翻译文件，减少包大小
4. **灵活的路由** - 支持多种路由策略（子路径、域名、Cookie）
5. **丰富的格式化** - 数字、日期、相对时间等本地化格式
6. **中间件集成** - 自动语言检测和重定向

### 🆚 与其他方案对比
- **vs react-i18next**: 更好的 Next.js 集成，更少的配置
- **vs next-i18next**: 原生支持 App Router，更现代的 API
- **vs 自建方案**: 功能更全面，维护成本更低

## 项目中的集成步骤

### 1. 安装依赖
```bash
npm install next-intl
```

### 2. 项目结构
```
bsc-bound/
├── messages/           # 翻译文件
│   ├── en.json
│   └── zh.json
├── i18n/              # 国际化配置
│   └── request.ts
├── middleware.ts      # 路由中间件
├── next.config.ts     # Next.js 配置
└── app/
    ├── [locale]/      # 动态路由
    │   ├── layout.tsx
    │   └── page.tsx
    ├── layout.tsx     # 根布局
    └── not-found.tsx  # 404 页面
```

### 3. 配置文件设置

#### `next.config.ts`
```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  experimental: {},
};

export default withNextIntl(nextConfig);
```

#### `i18n/request.ts`
```typescript
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  return {
    messages: (await import(`../messages/${locale ?? 'en'}.json`)).default,
    locale: locale ?? 'en'
  };
});
```

#### `middleware.ts`
```typescript
import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en'
});
 
export const config = {
  matcher: ['/', '/(zh|en)/:path*']
};
```

### 4. 翻译文件

#### `messages/en.json`
```json
{
  "welcome": "Welcome to BSC Bound",
  "description": "A decentralized application on Binance Smart Chain",
  "switchToEn": "Switch to English",
  "switchToZh": "切换中文"
}
```

#### `messages/zh.json`
```json
{
  "welcome": "欢迎来到 BSC 边界",
  "description": "币安智能链上的去中心化应用",
  "switchToEn": "Switch to English",
  "switchToZh": "切换中文"
}
```

### 5. 布局配置

#### `app/layout.tsx` (根布局)
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children; // 将渲染委托给 [locale]/layout.tsx
}
```

#### `app/[locale]/layout.tsx`
```typescript
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import { ClientProviders } from "../ClientProviders";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const { locale } = await params;
  const messages = await getMessages({locale});

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## 基本用法

### 服务端组件
```typescript
import { useTranslations } from 'next-intl';

export default function ServerComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 客户端组件
```typescript
'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export default function ClientComponent() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (locale: string) => {
    const newPath = pathname.replace(/^\/[a-z]{2}/, `/${locale}`);
    router.push(newPath);
  };

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => switchLanguage('zh')}>
        {t('switchToZh')}
      </button>
    </div>
  );
}
```

## 踩坑记录与解决方案

### 🐛 坑1: 无限重定向循环

#### 问题表现
```
GET /en 200
GET /en 200  
GET /en 200  
...（无限循环）
```

#### 根本原因
`app/not-found.tsx` 中存在重定向：
```typescript
// ❌ 错误写法
export default function NotFound() {
  redirect('/en'); // 造成无限循环
}
```

#### 解决方案
```typescript
// ✅ 正确写法
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h1>404 - Page not found</h1>
      <Link href="/en">Go back home</Link>
    </div>
  );
}
```

### 🐛 坑2: 翻译键缺失错误

#### 问题表现
```
IntlError: MISSING_MESSAGE: Could not resolve 'switchToEn' in messages for locale 'en'.
```

#### 解决方案
确保所有翻译文件包含相同的键：
```json
// messages/en.json 和 messages/zh.json 都要包含
{
  "switchToEn": "Switch to English",
  "switchToZh": "切换中文"
}
```

### 🐛 坑3: i18n 配置无效

#### 问题表现
```
Invalid i18n request configuration detected.
```

#### 常见原因与解决方案
1. **配置文件路径错误**
   ```typescript
   // ✅ 确保路径正确
   const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
   ```

2. **缺少默认导出**
   ```typescript
   // ✅ 必须使用 export default
   export default getRequestConfig(async ({locale}) => {
     // ...
   });
   ```

3. **返回值格式错误**
   ```typescript
   // ✅ 正确的返回格式
   return {
     messages: (await import(`../messages/${locale ?? 'en'}.json`)).default,
     locale: locale ?? 'en'
   };
   ```

### 🐛 坑4: 中间件匹配规则

#### 问题表现
语言切换不生效或路由匹配错误

#### 解决方案
```typescript
export const config = {
  // ✅ 正确的匹配规则
  matcher: ['/', '/(zh|en)/:path*']
  
  // ❌ 错误写法
  // matcher: ['/(.*)'] // 过于宽泛
};
```

## 水合错误解决方案

### 🌊 什么是水合错误？

水合错误发生在服务端渲染的 HTML 与客户端 React 组件初始状态不匹配时：

```
Hydration failed because the server rendered HTML didn't match the client.
```

### 🔧 解决方案

#### 方案1: 客户端专用 Providers（推荐）

```typescript
// app/ClientProviders.tsx
'use client';

import { Providers } from './Providers';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
```

#### 方案2: 条件渲染
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>; // 服务端渲染内容
  }

  return <ClientOnlyComponent />; // 客户端渲染内容
}
```

#### 方案3: SSR 配置优化
```typescript
// Providers.tsx
const config = getDefaultConfig({
  appName: "BSC Bound",
  projectId: "your-project-id",
  chains: [bsc, mainnet],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true, // 启用 SSR 支持
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // SSR 期间不立即重新获取
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 🔍 水合错误常见场景

1. **随机值/时间戳** - 使用 `useEffect` 延迟渲染
2. **本地存储** - 客户端挂载后再读取
3. **第三方库** - 确保库支持 SSR 或使用动态导入
4. **环境变量** - 区分客户端和服务端环境

## 排查问题的思路

### 🔍 系统性排查方法

#### 1. 确认基础配置
```bash
# 检查配置文件
✅ next.config.ts - next-intl 插件配置
✅ middleware.ts - 路由匹配规则
✅ i18n/request.ts - 翻译配置
✅ messages/*.json - 翻译文件完整性
```

#### 2. 检查网络请求
```javascript
// 浏览器 DevTools Network 标签
// 查找异常的重定向循环
GET /en → 200
GET /en → 200 (重复请求表示循环)
```

#### 3. 控制台错误分析
```javascript
// 常见错误模式
- MISSING_MESSAGE: 翻译键缺失
- Invalid i18n request configuration: 配置错误
- Hydration failed: 水合错误
- useConfig must be used within WagmiProvider: Provider 错误
```

#### 4. 逐步排除法
```typescript
// 1. 先测试最简配置
export default function Page() {
  return <div>Hello World</div>;
}

// 2. 添加翻译功能
const t = useTranslations();
return <div>{t('welcome')}</div>;

// 3. 添加语言切换
// 4. 集成第三方库
```

#### 5. 日志调试
```typescript
// i18n/request.ts 添加日志
export default getRequestConfig(async ({locale}) => {
  console.log('Loading locale:', locale);
  
  try {
    const messages = (await import(`../messages/${locale ?? 'en'}.json`)).default;
    console.log('Messages loaded:', Object.keys(messages));
    return { messages, locale: locale ?? 'en' };
  } catch (error) {
    console.error('Failed to load messages:', error);
    throw error;
  }
});
```

## 最佳实践

### 📋 开发规范

#### 1. 文件组织
```
i18n/
├── request.ts         # 配置文件
├── types.ts          # 类型定义
└── utils.ts          # 工具函数

messages/
├── en.json           # 英文翻译
├── zh.json           # 中文翻译
└── index.ts          # 导出类型
```

#### 2. 翻译键命名
```json
{
  "page": {
    "home": {
      "title": "首页",
      "description": "欢迎来到首页"
    }
  },
  "component": {
    "button": {
      "submit": "提交",
      "cancel": "取消"
    }
  },
  "error": {
    "network": "网络错误",
    "validation": "验证失败"
  }
}
```

#### 3. 类型安全
```typescript
// messages/index.ts
export type Messages = typeof import('./en.json');

// 使用时获得完整的类型提示
const t = useTranslations('page.home');
t('title'); // ✅ 类型安全
t('invalid'); // ❌ TypeScript 错误
```

#### 4. 性能优化
```typescript
// 预加载翻译文件
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'zh' }
  ];
}

// 使用 React.memo 优化重渲染
const TranslatedComponent = React.memo(function Component() {
  const t = useTranslations();
  return <div>{t('content')}</div>;
});
```

### 🚀 生产环境注意事项

1. **构建优化**
   ```typescript
   // next.config.ts
   const nextConfig = {
     experimental: {
       optimizeCss: true,
       optimizePackageImports: ['next-intl']
     }
   };
   ```

2. **缓存策略**
   ```typescript
   // 合理设置 staleTime
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 分钟
       },
     },
   });
   ```

3. **错误边界**
   ```typescript
   function I18nErrorBoundary({ children }: { children: React.ReactNode }) {
     return (
       <ErrorBoundary fallback={<div>翻译加载失败</div>}>
         {children}
       </ErrorBoundary>
     );
   }
   ```

## 总结

Next-intl 是一个功能强大且易用的国际化解决方案，但在集成过程中需要注意以下关键点：

1. **正确配置中间件和路由匹配规则**
2. **避免在 not-found.tsx 中使用重定向**
3. **确保翻译文件的键值对完整一致**
4. **妥善处理 SSR 水合问题**
5. **使用系统性的方法排查问题**

通过遵循本指南的最佳实践，可以构建出稳定、高性能的多语言 Next.js 应用。
