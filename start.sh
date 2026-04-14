#!/bin/bash

# 启动Hexo博客本地服务器
echo "正在启动Hexo博客本地服务器..."

# 检查是否已安装hexo-cli
if ! command -v hexo &> /dev/null; then
    echo "未找到hexo命令，正在安装hexo-cli..."
    npm install -g hexo-cli
fi

# 安装项目依赖
echo "安装项目依赖..."
npm install

# 清理并生成静态文件
echo "生成静态文件..."
hexo clean
hexo generate

# 启动本地服务器
echo "启动本地服务器..."
echo "博客地址: http://localhost:4000"
echo "按 Ctrl+C 停止服务器"
hexo server