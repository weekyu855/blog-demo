# Hexo博客部署指南

本文档提供了多种部署Hexo博客到不同平台的方法。

## 部署选项

### 1. GitHub Pages（推荐）
GitHub Pages是GitHub提供的静态网站托管服务，完全免费。

#### 自动部署（使用GitHub Actions）
1. 确保仓库中有 `.github/workflows/deploy.yml` 文件
2. 在GitHub仓库设置中启用Pages：
   - 进入 Settings → Pages
   - Source选择 `GitHub Actions`
3. 推送代码到main分支，Actions会自动构建并部署

#### 手动部署
```bash
# 安装依赖
npm install -g hexo-cli
npm install

# 生成静态文件
hexo clean
hexo generate

# 部署到GitHub Pages
hexo deploy
```

### 2. Cloudflare Pages
Cloudflare Pages提供全球CDN加速，部署简单。

#### 自动部署
1. 在Cloudflare控制台创建Pages项目
2. 连接GitHub仓库
3. 配置构建设置：
   - 构建命令：`hexo generate`
   - 输出目录：`public`
   - Node.js版本：18

#### 手动部署
```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 部署到Cloudflare Pages
wrangler pages deploy ./public --project-name=hexo-blog
```

### 3. Vercel
Vercel提供快速的静态网站部署和全球CDN。

#### 自动部署
1. 在Vercel控制台导入GitHub仓库
2. 框架预设选择 `Hexo`
3. 构建命令自动填充为 `hexo generate`

#### 手动部署
```bash
# 安装Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

### 4. Netlify
Netlify提供持续部署和表单处理等功能。

#### 自动部署
1. 在Netlify控制台导入GitHub仓库
2. 构建设置：
   - 构建命令：`hexo generate`
   - 发布目录：`public`

#### 手动部署
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=public
```

### 5. 自有服务器部署

#### 使用rsync同步
```bash
# 生成静态文件
hexo generate

# 同步到服务器
rsync -avz --delete public/ user@yourserver.com:/var/www/blog/

# 设置权限
ssh user@yourserver.com "chmod -R 755 /var/www/blog"
```

#### 使用Docker部署
创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install && hexo generate

FROM nginx:alpine
COPY --from=builder /app/public /usr/share/nginx/html
EXPOSE 80
```

构建并运行：
```bash
docker build -t hexo-blog .
docker run -d -p 8080:80 --name blog hexo-blog
```

## 环境变量配置

### GitHub Secrets配置
在GitHub仓库的Settings → Secrets and variables → Actions中添加：

| Secret名称 | 说明 |
|------------|------|
| `GITHUB_TOKEN` | 自动生成，无需配置 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API令牌 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare账户ID |
| `TELEGRAM_BOT_TOKEN` | Telegram机器人令牌（可选） |
| `TELEGRAM_CHAT_ID` | Telegram聊天ID（可选） |

### 本地环境变量
创建 `.env` 文件：
```env
# 博客配置
BLOG_TITLE=我的技术博客
BLOG_URL=https://blog.example.com
BLOG_AUTHOR=Your Name

# 部署配置
DEPLOY_TYPE=github  # github, cloudflare, vercel, netlify
DEPLOY_REPO=git@github.com:username/repo.git

# 第三方服务
GOOGLE_ANALYTICS_ID=UA-XXXXX-Y
DISQUS_SHORTNAME=your-disqus-shortname
```

## 自定义域名配置

### GitHub Pages
1. 在仓库Settings → Pages中设置Custom domain
2. 在域名DNS中添加CNAME记录：
   ```
   blog.yourdomain.com CNAME username.github.io
   ```
3. 在source目录创建CNAME文件：
   ```bash
   echo "blog.yourdomain.com" > source/CNAME
   ```

### Cloudflare Pages
1. 在Pages项目设置中添加Custom domain
2. Cloudflare会自动配置DNS记录

### 通用HTTPS配置
所有上述平台都自动提供HTTPS证书，无需额外配置。

## 监控和告警

### 使用UptimeRobot监控
1. 注册UptimeRobot账号
2. 添加监控：
   - URL: https://your-blog-url.com
   - 检查间隔: 5分钟
   - 通知方式: Email/Telegram

### 使用Google Analytics
在主题配置中添加：
```yaml
# _config.yml
google_analytics:
  tracking_id: UA-XXXXX-Y
  only_pageview: false
```

## 备份策略

### 自动备份到GitHub
创建备份工作流 `.github/workflows/backup.yml`：
```yaml
name: Backup Blog Source

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日0点
  workflow_dispatch:  # 手动触发

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      
    - name: Create backup archive
      run: |
        tar -czf blog-backup-$(date +%Y%m%d).tar.gz \
          --exclude=node_modules \
          --exclude=.git \
          --exclude=public \
          .
          
    - name: Upload to GitHub Releases
      uses: softprops/action-gh-release@v1
      with:
        files: blog-backup-*.tar.gz
        tag_name: backup-$(date +%Y%m%d)
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 手动备份
```bash
# 创建备份
tar -czf blog-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=public \
  .

# 上传到云存储
# 例如上传到AWS S3
aws s3 cp blog-backup-*.tar.gz s3://your-backup-bucket/
```

## 故障排除

### 常见问题

#### 1. 部署失败：构建错误
```bash
# 清理缓存重新构建
rm -rf node_modules
npm cache clean --force
npm install
hexo clean
hexo generate
```

#### 2. 图片不显示
- 检查图片路径是否正确
- 确保使用相对路径：`![alt](images/example.png)`
- 检查文件权限

#### 3. CSS/JS文件404
- 检查主题配置
- 确保静态文件在public目录中
- 清除浏览器缓存

#### 4. 域名解析问题
```bash
# 检查DNS解析
nslookup blog.yourdomain.com
dig blog.yourdomain.com

# 检查SSL证书
openssl s_client -connect blog.yourdomain.com:443 -servername blog.yourdomain.com
```

### 性能优化

#### 1. 图片优化
```bash
# 安装图片优化工具
npm install -g imagemin-cli

# 压缩图片
imagemin source/images/* --out-dir=source/images/optimized
```

#### 2. 启用Gzip压缩
在服务器配置中添加：
```nginx
# nginx配置
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

#### 3. 使用CDN加速
在主题配置中启用CDN：
```yaml
# _config.yml
cdn:
  enable: true
  jquery: https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
  fontawesome: https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.0.0/css/all.min.css
```

## 更新和维护

### 定期更新
```bash
# 更新Hexo
npm update hexo

# 更新主题
cd themes/your-theme
git pull origin master

# 更新依赖
npm update
```

### 安全检查
```bash
# 检查安全漏洞
npm audit

# 修复漏洞
npm audit fix

# 更新所有依赖
npx npm-check-updates -u
npm install
```

## 联系和支持

如果在部署过程中遇到问题：

1. **查看日志**：部署平台的构建日志
2. **社区支持**：
   - [Hexo官方文档](https://hexo.io/docs/)
   - [GitHub Discussions](https://github.com/hexojs/hexo/discussions)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/hexo)
3. **提交Issue**：在项目仓库提交问题报告

---

**最后更新**：2026-04-13  
**版本**：1.0.0  
**作者**：Your Name  
**许可证**：MIT