'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useDisconnect } from 'wagmi'

export default function WalletButton() {
  const { login, logout, ready, authenticated, user } = usePrivy()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (!ready) {
    return <button disabled>Loading...</button>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            React 学习演示平台
          </h1>
          <p className="text-xl text-gray-600">
            区块链钱包 + WebSocket + 状态管理 综合学习演示
          </p>
        </div>

        {/* 钱包连接状态 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">钱包连接</h2>
          {authenticated && isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="font-medium">已连接</span>
              </div>
              <p className="text-gray-700">
                <span className="font-medium">地址:</span> {address}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">用户:</span> {user?.email?.address || 'Anonymous'}
              </p>
              <button 
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                断开连接
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                <span className="font-medium">未连接</span>
              </div>
              <button 
                onClick={login}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                连接钱包
              </button>
            </div>
          )}
        </div>

        {/* 功能导航 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/websocket"
            className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">🔌</span>
              </div>
              <h3 className="text-lg font-semibold">WebSocket 演示</h3>
            </div>
            <p className="text-gray-600 text-sm">
              完整的 WebSocket 功能演示，包括基础测试、实时聊天和高级功能
            </p>
            <div className="mt-4 text-blue-600 text-sm font-medium">
              查看演示 →
            </div>
          </Link>

          <Link 
            href="/state-management"
            className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">🔧</span>
              </div>
              <h3 className="text-lg font-semibold">状态管理学习</h3>
            </div>
            <p className="text-gray-600 text-sm">
              学习最新的状态管理库：Redux Toolkit、Zustand 和 Jotai
            </p>
            <div className="mt-4 text-purple-600 text-sm font-medium">
              开始学习 →
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6 opacity-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-lg">🎮</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-500">游戏演示</h3>
            </div>
            <p className="text-gray-400 text-sm">
              结合钱包和 WebSocket 的实时游戏演示（即将推出）
            </p>
          </div>
        </div>

        {/* 技术栈说明 */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">技术栈</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">⚛️</span>
              </div>
              <p className="text-sm font-medium">React 18</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">N</span>
              </div>
              <p className="text-sm font-medium">Next.js 14</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">P</span>
              </div>
              <p className="text-sm font-medium">Privy</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">WS</span>
              </div>
              <p className="text-sm font-medium">WebSocket</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}