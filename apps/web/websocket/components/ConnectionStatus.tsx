'use client';

import { UseWebSocketReturn } from '../hooks/useWebSocket';

interface ConnectionStatusProps {
  connectionStatus: 'Uninstantiated' | 'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Reconnecting';
  readyState: number;
}

export function ConnectionStatus({ connectionStatus, readyState }: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Open':
        return 'text-green-600 bg-green-100';
      case 'Connecting':
        return 'text-yellow-600 bg-yellow-100';
      case 'Reconnecting':
        return 'text-orange-600 bg-orange-100';
      case 'Closing':
        return 'text-orange-600 bg-orange-100';
      case 'Closed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'Open':
        return '🟢';
      case 'Connecting':
        return '🟡';
      case 'Reconnecting':
        return '🔄';
      case 'Closing':
        return '🟠';
      case 'Closed':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'Open':
        return '已连接';
      case 'Connecting':
        return '连接中...';
      case 'Reconnecting':
        return '重连中...';
      case 'Closing':
        return '断开中...';
      case 'Closed':
        return '已断开';
      case 'Uninstantiated':
        return '未初始化';
      default:
        return '未知状态';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
      <span className="mr-2">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      <span className="ml-2 text-xs opacity-75">({readyState})</span>
    </div>
  );
}
