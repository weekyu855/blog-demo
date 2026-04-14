# 技术博客项目

这是一个基于Hexo构建的技术博客，包含多篇技术文章和完整的部署配置。

## 项目结构

```
blog-demo/
├── source/_posts/                    # 博客文章目录
│   ├── 使用OpenClaw构建智能助手的技术实践.md
│   ├── 本地搭建Hexo博客部署到GITHUB.md
│   ├── 用Redefing主题美化Hexo博客.md
│   ├── OpenList 网盘本地挂载.md
│   └── EdgeOne Pages 模板搭建个人静态博客完整教材.md
├── .github/workflows/                # GitHub Actions配置
│   └── deploy.yml                    # 自动部署工作流
├── public/                           # 生成的静态文件
├── themes/                           # Hexo主题
├── _config.yml                       # Hexo主配置
├── _config.redefine.yml              # Redefine主题配置
├── package.json                      # 项目依赖
├── DEPLOYMENT.md                     # 详细部署指南
└── README.md                         # 项目说明
```

## 已生成的文章

### 1. 使用OpenClaw构建智能助手的技术实践
- **标签**: OpenClaw, 智能助手, AI, 自动化, 飞书集成
- **分类**: 技术实践
- **内容**: 详细介绍如何使用OpenClaw框架构建功能强大的智能助手，包括环境搭建、技能开发、飞书集成和部署流程。

### 2. 本地搭建Hexo博客部署到GitHub
- **标签**: 教程
- **分类**: 博客搭建
- **内容**: 使用Hexo框架搭建个人博客并部署到GitHub Pages和Cloudflare Pages的完整教程。

### 3. 用Redefing主题美化Hexo博客
- **标签**: 教程
- **分类**: 博客搭建
- **内容**: 如何使用Redefine主题美化Hexo博客，提升用户体验。

### 4. OpenList网盘本地挂载
- **标签**: 软件
- **分类**: OpenList
- **内容**: 将OpenList网盘挂载到本地的技术指南。

### 5. EdgeOne Pages模板搭建个人静态博客完整教材
- **标签**: 教程
- **分类**: 博客搭建
- **内容**: 使用EdgeOne Pages模板快速搭建个人静态博客的完整教程。

## 快速开始

### 1. 本地开发

```bash
# 安装依赖
npm install

# 启动本地服务器
hexo server

# 生成静态文件
hexo generate

# 清理缓存
hexo clean
```

### 2. 部署到GitHub Pages

#### 自动部署（推荐）
1. 将代码推送到GitHub仓库
2. 在仓库Settings → Pages中启用GitHub Pages
3. GitHub Actions会自动构建并部署到gh-pages分支

#### 手动部署
```bash
# 配置部署信息（在_config.yml中）
deploy:
  type: git
  repo: https://github.com/username/repository.git
  branch: gh-pages

# 部署
hexo deploy
```

### 3. 部署到其他平台

#### Cloudflare Pages
1. 在Cloudflare控制台创建Pages项目
2. 连接GitHub仓库
3. 构建设置：
   - 构建命令：`hexo generate`
   - 输出目录：`public`

#### Vercel
1. 在Vercel控制台导入GitHub仓库
2. 框架预设选择 `Hexo`

#### Netlify
1. 在Netlify控制台导入GitHub仓库
2. 构建设置：
   - 构建命令：`hexo generate`
   - 发布目录：`public`

## 配置说明

### 1. 博客配置 (_config.yml)
- `title`: 博客标题
- `subtitle`: 博客副标题
- `description`: 博客描述
- `author`: 作者名称
- `language`: 语言设置
- `timezone`: 时区设置

### 2. 主题配置 (_config.redefine.yml)
- 主题样式和功能配置
- 导航栏设置
- 侧边栏配置
- 评论系统集成
- 统计代码配置

### 3. 部署配置 (.github/workflows/deploy.yml)
- 自动构建和部署流程
- 多平台部署支持（GitHub Pages, Cloudflare Pages）
- 部署通知（Telegram）

## 自定义开发

### 1. 添加新文章
```bash
# 创建新文章
hexo new "文章标题"

# 编辑文章
vim source/_posts/文章标题.md
```

### 2. 修改主题
- 主题文件位于 `themes/redefine/`
- 修改样式：`themes/redefine/source/css/`
- 修改模板：`themes/redefine/layout/`

### 3. 添加自定义页面
```bash
# 创建新页面
hexo new page "about"

# 编辑页面
vim source/about/index.md
```

## 性能优化

### 1. 图片优化
```bash
# 安装图片优化工具
npm install -g imagemin-cli

# 压缩图片
imagemin source/images/* --out-dir=source/images/optimized
```

### 2. 启用CDN
在主题配置中启用CDN加速：
```yaml
cdn:
  enable: true
  jquery: https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
  fontawesome: https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.0.0/css/all.min.css
```

### 3. 代码压缩
```bash
# 安装压缩插件
npm install hexo-all-minifier --save

# 在配置中启用
all_minifier: true
```

## 监控和维护

### 1. 网站监控
- 使用UptimeRobot监控网站可用性
- 配置Google Analytics分析访问数据
- 设置错误监控（如Sentry）

### 2. 定期更新
```bash
# 更新Hexo
npm update hexo

# 更新主题
cd themes/redefine
git pull origin master

# 更新依赖
npm update
```

### 3. 安全检查
```bash
# 检查安全漏洞
npm audit

# 修复漏洞
npm audit fix
```

## 故障排除

### 常见问题

#### 1. 部署失败
- 检查GitHub Actions日志
- 验证部署配置
- 检查文件权限

#### 2. 图片不显示
- 检查图片路径
- 验证文件是否存在
- 检查文件权限

#### 3. 样式错乱
- 清理浏览器缓存
- 检查CSS文件加载
- 验证主题配置

#### 4. 构建错误
```bash
# 清理缓存重新构建
rm -rf node_modules
npm cache clean --force
npm install
hexo clean
hexo generate
```

## 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

- 作者: Week
- 邮箱: your.email@example.com
- 博客: https://blog.example.com

## 更新日志

### v1.0.0 (2026-04-13)
- 初始版本发布
- 包含5篇技术文章
- 完整的部署配置
- GitHub Actions自动部署
- 多平台部署支持

---

**相关资源**:
- [Hexo官方文档](https://hexo.io/docs/)
- [Redefine主题文档](https://redefine-docs.ohevan.com/)
- [GitHub Pages文档](https://docs.github.com/en/pages)
- [Cloudflare Pages文档](https://developers.cloudflare.com/pages/)

**温馨提示**: 部署前请确保已配置正确的域名和SSL证书。建议使用HTTPS增强网站安全性。