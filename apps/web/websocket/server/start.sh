#!/bin/bash

# WebSocket 服务器启动脚本

echo "🚀 WebSocket 服务器启动脚本"
echo "================================"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 进入服务器目录
cd "$(dirname "$0")"

echo "📁 当前目录: $(pwd)"

# 检查是否存在 package.json
if [ ! -f "package.json" ]; then
    echo "❌ 未找到 package.json 文件"
    exit 1
fi

# 安装依赖
echo "📦 正在安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 显示可用的服务器选项
echo ""
echo "🎯 可用的服务器："
echo "1. 基础测试服务器 (simple-ws-server.js)"
echo "2. 聊天室服务器 (chat-server.js)"
echo ""

# 读取用户选择
read -p "请选择要启动的服务器 (1 或 2): " choice

case $choice in
    1)
        echo "🔧 启动基础测试服务器..."
        node simple-ws-server.js
        ;;
    2)
        echo "💬 启动聊天室服务器..."
        node chat-server.js
        ;;
    *)
        echo "❌ 无效选择，默认启动基础测试服务器..."
        node simple-ws-server.js
        ;;
esac
