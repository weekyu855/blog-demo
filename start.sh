#!/bin/bash

# 本地预览博客：http://localhost:4000
# 首次运行会自动安装依赖；Ctrl+C 停止服务器。

set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
    echo "未找到 node_modules，正在安装依赖..."
    npm install
fi

echo "清理上次的生成结果..."
npm run clean

echo "启动本地服务器：http://localhost:4000"
echo "按 Ctrl+C 停止"
npm run server
