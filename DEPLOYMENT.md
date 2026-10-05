# 博客部署说明

本站（<https://www.weekyu.dpdns.org>）实际使用 **EdgeOne Pages** 托管，通过 Git 仓库自动构建部署。

## 一、实际部署方式：EdgeOne Pages

EdgeOne Pages 项目关联本仓库的 `main` 分支，推送后自动构建：

| 配置项 | 值 |
|---|---|
| 根目录 | `./` |
| 构建依赖命令 | `npm install` |
| 构建命令 | `npm run build`（即 `hexo generate`） |
| 输出目录 | `public` |

### 发布流程

```bash
# 1. 写好文章（source/_posts/*.md）或改好配置
# 2. 提交并推送
./push_to_github.sh "文章标题"

# 或手动
git add -A && git commit -m "提交信息" && git push origin main
```

推送后 EdgeOne 约 30 秒 ~ 1 分钟完成构建并上线，无需手动执行 `hexo generate`。

> 判断是否部署成功：`curl -sI https://www.weekyu.dpdns.org/ | grep -i last-modified`
> 这个时间戳只在**成功构建并发布新版本**后才会更新；构建失败时线上保持上一个版本。

## 二、本地预览

```bash
./start.sh          # 自动装依赖 + 清理 + 起服务，访问 http://localhost:4000
```

手动等价操作：

```bash
npm install         # 首次
npm run clean       # 清掉旧的生成结果
npm run server      # 本地服务，改文件即时生效
npm run build       # 只生成静态文件到 public/
```

## 三、目录说明（哪些要提交、哪些不要）

| 路径 | 说明 | 是否提交 |
|---|---|---|
| `source/_posts/` | 文章 Markdown | ✅ 提交 |
| `source/_data/` | 友链、书签、相册等数据 | ✅ 提交 |
| `source/*/index.md` | 独立页面（关于、标签、分类等） | ✅ 提交 |
| `source/images/` | **正文配图**（文章插图、头像、首页背景图等，统一用 `/images/xxx` 引用） | ✅ 提交 |
| `source/music/` | 背景音乐 MP3 与封面 | ✅ 提交 |
| `_config.yml` | Hexo 站点配置 | ✅ 提交 |
| `_config.redefine.yml` | Redefine 主题配置（**主要改这里**） | ✅ 提交 |
| `themes/redefine/` | 主题（**含本站自定义**，不要用 npm 版覆盖） | ✅ 提交 |
| `live2d_models/` | Live2D 看板娘模型 | ✅ 提交 |
| `node_modules/` | 依赖，由 `npm install` 生成 | ❌ 已在 `.gitignore` |
| `public/` | 构建产物，由 `npm run build` 生成 | ❌ 已在 `.gitignore` |
| `db.json` | Hexo 缓存 | ❌ 已在 `.gitignore` |

> `themes/redefine` 里除了主题代码，还包含本站的定制（`layout/components/header/head.ejs` 的早期主题设置、`languages/zh-CN.yml` 的「常用 / 相册 / 书签」等），比 npm 上的 `hexo-theme-redefine` 包内容更新，**不要用 npm 包替换它**。
>
> **自己的图片一律放 `source/images/`，不要放 `themes/redefine/source/images/`。** 两个位置生成的最终 URL 都是 `/images/xxx`，网页上没有任何区别，但放在主题目录里的图在更新主题时有被覆盖或删除的风险。`themes/redefine/source/images/` 现在只保留主题自身使用的资源（`bookmark-placeholder.svg`、`loading.svg`、`redefine-*`、`wallhaven-*`、`2.png`）。

## 四、常见问题

**1. 推送后线上没变化**
先看 `Last-Modified` 是否更新。没更新说明构建失败，去 EdgeOne 控制台看构建日志；常见原因是 `package.json` 与 `package-lock.json` 不一致，本地执行一次 `npm install` 后把 `package-lock.json` 一起提交即可。

**2. 改动没生效 / 样式是旧的**
浏览器缓存。EdgeOne 侧是 `Cache-Control: max-age=0, must-revalidate`，强刷（Ctrl+F5）即可。

**3. 背景音乐不响**
- 音频必须放 `source/music/`，配置里写 `/music/xxx.mp3`
- 首页顶部滚动 100px 以内播放器是隐藏的（主题行为），往下滚才出现
- 浏览器可能拦截自动播放，需要用户点一下播放键

**4. 每次构建后，同一天的文章顺序会变**
`source/_posts/` 里多篇文章的日期完全相同（例如同一天 2026-01-15 的几篇）时，Hexo 的排序不稳定，每次构建顺序都可能不同。想让顺序固定，给文章 front-matter 里补上具体时间（`date: 2026-01-15 10:30:00`）。

**5. 想换别的托管平台**
输出是纯静态文件（`public/`），Cloudflare Pages / Vercel / Netlify 均可直接用：
构建命令 `npm run build`，输出目录 `public`。仓库里没有配置 GitHub Actions，GitHub Pages 需要另行配置。

## 五、发布新文章

```bash
# 新建文章
npx hexo new "文章标题"      # 生成 source/_posts/文章标题.md
# 编辑内容，front-matter 里填好 title / date / categories / tags
./push_to_github.sh "新增文章：文章标题"
```
