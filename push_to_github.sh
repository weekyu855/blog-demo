#!/bin/bash

# 提交并推送博客到 GitHub（EdgeOne Pages 会自动重新构建并部署）
# 用法：./push_to_github.sh "提交信息"

set -e
cd "$(dirname "$0")"

if [ $# -eq 0 ]; then
    echo "错误：请提供提交信息"
    echo "用法：$0 \"提交信息\""
    exit 1
fi

echo "==> 当前改动"
git status --short

echo "==> 暂存并提交"
git add -A
git commit -m "$1"

echo "==> 推送到 origin main"
git push origin main

echo
echo "完成。EdgeOne Pages 会在约 1 分钟内自动重新构建并部署。"
echo "线上地址：https://www.weekyu.dpdns.org"
echo "本地预览：./start.sh"
