'use client';

import { WebSocketMessage } from '../hooks/useWebSocket';

interface MessageDisplayProps {
  messages: WebSocketMessage[];
  className?: string;
}

export function MessageDisplay({ messages, className = '' }: MessageDisplayProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMessageTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'message':
        return 'bg-blue-50 border-blue-200';
      case 'system':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'ping':
      case 'pong':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const formatMessageData = (data: any) => {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data, null, 2);
  };

  if (messages.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        暂无消息
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border ${getMessageTypeColor(message.type)}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-700">
              类型: {message.type}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <div className="text-sm">
            <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
              {formatMessageData(message.data)}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
