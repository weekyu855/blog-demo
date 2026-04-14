#!/bin/bash

# 推送Hexo博客到GitHub的脚本
# 使用方法：./push_to_github.sh "提交信息"

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}错误：请提供提交信息${NC}"
    echo "用法：$0 \"提交信息\""
    exit 1
fi

COMMIT_MSG="$1"

echo -e "${GREEN}开始推送Hexo博客到GitHub...${NC}"

# 1. 检查Git状态
echo -e "${YELLOW}1. 检查Git状态...${NC}"
git status

# 2. 添加所有更改
echo -e "${YELLOW}2. 添加更改到暂存区...${NC}"
git add .

# 3. 提交更改
echo -e "${YELLOW}3. 提交更改...${NC}"
git commit -m "$COMMIT_MSG"

# 4. 推送到GitHub
echo -e "${YELLOW}4. 推送到GitHub...${NC}"
git push origin main

echo -e "${GREEN}✅ 推送完成！${NC}"
echo ""
echo "新文章已发布："
echo "- 自建Token平台实现多模型免费访问一站式解决方案"
echo ""
echo "你可以访问以下地址查看："
echo "1. GitHub仓库：https://github.com/你的用户名/你的博客仓库"
echo "2. GitHub Pages：https://你的用户名.github.io/仓库名"
echo "3. 本地预览：http://localhost:4000"

# 可选：启动本地服务器预览
read -p "是否启动本地服务器预览？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}启动本地服务器...${NC}"
    hexo server &
    echo "本地服务器已启动：http://localhost:4000"
    echo "按 Ctrl+C 停止服务器"
    wait
fi