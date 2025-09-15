'use client';

import { useState, useEffect } from 'react';
import { AdvancedWebSocketReturn } from '../hooks/useAdvancedWebSocket';

interface WebSocketMonitorProps {
  websocket: AdvancedWebSocketReturn;
  className?: string;
}

export function WebSocketMonitor({ websocket, className = '' }: WebSocketMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '从未';
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  const getStatusColor = () => {
    switch (websocket.connectionStatus) {
      case 'Open':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'Connecting':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Reconnecting':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Closing':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'Closed':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getCurrentUptime = () => {
    if (websocket.stats.connectTime && websocket.connectionStatus === 'Open') {
      return currentTime - websocket.stats.connectTime;
    }
    return 0;
  };

  const getTotalUptime = () => {
    const baseUptime = websocket.stats.totalUptime;
    const currentUptime = getCurrentUptime();
    return baseUptime + currentUptime;
  };

  const getLastMessageAgo = () => {
    if (!websocket.stats.lastMessageTime) return '从未';
    const ago = currentTime - websocket.stats.lastMessageTime;
    return formatDuration(ago) + '前';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="font-medium text-gray-900">WebSocket 监控</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
              {websocket.connectionStatus}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {websocket.connectionStatus === 'Open' && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
            <button className="text-gray-400 hover:text-gray-600">
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-2 text-sm text-gray-600">
            发送: {websocket.stats.messagesSent} | 接收: {websocket.stats.messagesReceived} | 重连: {websocket.stats.reconnectCount}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* 连接信息 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">连接信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">状态:</span>
                <span className="ml-2 font-medium">{websocket.connectionStatus}</span>
              </div>
              <div>
                <span className="text-gray-500">就绪状态:</span>
                <span className="ml-2 font-medium">{websocket.readyState}</span>
              </div>
              <div>
                <span className="text-gray-500">连接时间:</span>
                <span className="ml-2">{formatTimestamp(websocket.stats.connectTime)}</span>
              </div>
              <div>
                <span className="text-gray-500">当前运行时长:</span>
                <span className="ml-2">{formatDuration(getCurrentUptime())}</span>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">统计信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">发送消息:</span>
                <span className="ml-2 font-medium text-blue-600">{websocket.stats.messagesSent}</span>
              </div>
              <div>
                <span className="text-gray-500">接收消息:</span>
                <span className="ml-2 font-medium text-green-600">{websocket.stats.messagesReceived}</span>
              </div>
              <div>
                <span className="text-gray-500">重连次数:</span>
                <span className="ml-2 font-medium text-orange-600">{websocket.stats.reconnectCount}</span>
              </div>
              <div>
                <span className="text-gray-500">总运行时长:</span>
                <span className="ml-2">{formatDuration(getTotalUptime())}</span>
              </div>
              <div>
                <span className="text-gray-500">最后消息:</span>
                <span className="ml-2">{getLastMessageAgo()}</span>
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">连接控制</h4>
            <div className="flex space-x-2">
              <button
                onClick={websocket.connect}
                disabled={websocket.connectionStatus === 'Open' || websocket.connectionStatus === 'Connecting'}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                连接
              </button>
              <button
                onClick={websocket.disconnect}
                disabled={websocket.connectionStatus === 'Closed'}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                断开
              </button>
              <button
                onClick={websocket.reconnect}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                重连
              </button>
            </div>
          </div>

          {/* 错误信息 */}
          {websocket.lastError && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">最后错误</h4>
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                错误类型: {websocket.lastError.type}
              </div>
            </div>
          )}

          {/* 最后消息 */}
          {websocket.lastMessage && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">最后消息</h4>
              <div className="text-sm bg-gray-50 p-2 rounded">
                <div className="text-gray-500 mb-1">
                  类型: {websocket.lastMessage.type} | 
                  时间: {formatTimestamp(websocket.lastMessage.timeStamp || Date.now())}
                </div>
                <div className="font-mono text-xs break-all">
                  {typeof websocket.lastMessage.data === 'string' 
                    ? websocket.lastMessage.data 
                    : '[Binary Data]'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
