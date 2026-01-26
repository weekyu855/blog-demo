---
title: 本地搭建Hexo博客部署到GITHUB
date: 2026-01-26 12:12:12
tags: 教程
categories: 博客搭建
excerpt: "使用Hexo框架搭建一个个人博客，并将其部署到GitHub Pages和Cloudflare Pages上"
cover: false
---
# 本地搭建Hexo博客部署到GITHUB
本文详细介绍了如何使用Hexo框架搭建一个个人博客，并将其部署到GitHub Pages和Cloudflare Pages上。主要内容包括环境准备、Git配置、Hexo初始化、以及部署流程。
## 1. 事前准备
在开始之前，请准备好以下账号：
1.  **GitHub**（必须）：注册一个 GitHub 账号。
2.  **Cloudflare**（非必须）：注册 Cloudflare 账号，用于将博客部署到 CF CDN 加速。
3.  **域名**（非必须）：可以使用默认分配的 `github.io` 或 `pages.dev` 域名。
## 2. 软件支持与环境安装
### 2.1 安装 Node.js
1.  前往 [Node.js 官网](https://nodejs.org/en) 下载并安装适合你系统的版本（LTS版本即可）。
    
    ![Node.js下载页面](https://nodejs.org/en/next-data/og/announcement/Node.js — Download Node.js®)
2.  安装完成后，打开 CMD（命令提示符），输入以下命令检查是否安装成功：
    ```bash
    node -v
    ```
3.  修改 npm 源（推荐使用华为云镜像源以加快下载速度）：
    ```bash
    npm config set registry https://mirrors.huaweicloud.com/repository/npm/
    ```
### 2.2 安装 Git
1.  前往 [Git 官网](https://git-scm.com/downloads) 下载并安装 Git。
    ![Git下载页面](https://cdn.lo4d.com/t/screenshot/git-for-windows-3.png)
2.  安装过程中建议使用默认路径。
3.  安装完成后，建议使用 **Git Bash**（Linux 风格指令）进行后续操作。
## 3. 配置 Git 密钥并连接至 GitHub
### 3.1 配置用户名和邮箱
在 Git Bash 中执行以下命令（替换为你自己的信息）：
```bash
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"
```
检查配置：
```bash
git config -l
```
### 3.2 配置公钥连接 GitHub
1.  生成 SSH 公钥：
    ```bash
    ssh-keygen -t rsa -C "你的邮箱"
    ```
    执行后一路回车即可（不推荐设置密码）。
2.  查看公钥：打开 `C:\Users\你的用户名\.ssh` 目录，用记事本打开 `id_rsa.pub` 文件，复制全部内容。
3.  添加 SSH Key 到 GitHub：
    ![GitHub SSH设置](https://docs.github.com/assets/cb-29762/images/help/settings/ssh-keys-title.png)
    *   进入 GitHub，点击右上角头像 -> **Settings**。
    *   左侧菜单选择 **SSH and GPG keys**，点击 **New SSH key**。
    *   将刚才复制的内容粘贴到 `Key` 栏中，Title 随意填写，点击 **Add SSH key**。
4.  测试连接：
    ```bash
    ssh -T git@github.com
    ```
    第一次连接提示 `Are you sure...` 时输入 `yes`，若显示 `Hi 用户名! You've successfully authenticated...` 则说明连接成功。
### 3.3 创建 GitHub.io 仓库
1.  点击 GitHub 右上角的 `+` 号，选择 **New repository**。
    ![创建GitHub仓库](https://docs.github.com/assets/cb-29762/images/help/repository/repo-create-global-nav-update.png)
2.  仓库名必须格式为：`<你的用户名>.github.io`（例如 `cmliussss2024.github.io`）。
3.  可见性选择 **Public**，点击 **Create repository**。
## 4. 初始化 Hexo 博客
1.  在本地创建一个文件夹（如 `D:\Hexo-Blog`），进入文件夹后右键选择 **Open Git Bash here**。
2.  安装 Hexo 脚手架：
    ```bash
    npm install -g hexo-cli
    ```
3.  初始化博客项目：
    ```bash
    hexo init blog-demo
    cd blog-demo
    npm install
    ```
4.  启动本地服务：
    ```bash
    hexo clean && hexo s
    ```
5.  打开浏览器访问 [http://localhost:4000/](http://localhost:4000/) ，若看到 Hexo 默认页面，说明搭建成功。
    ![Hexo本地预览](https://blog.iw17.net/hexo-github-pages/localhost-4000.png)
## 5. 将静态博客挂载到 GitHub Pages
### 5.1 安装部署插件
在博客根目录下执行：
```bash
npm install hexo-deployer-git --save
```
### 5.2 修改配置文件
打开根目录下的 `_config.yml` 文件，翻到最末尾，修改 `deploy` 配置（注意缩进，`:` 后要加空格）：
```yaml
deploy:
  type: git
  repository: git@github.com:你的用户名/你的用户名.github.io.git
  branch: main
```
*注意：现在 GitHub 新仓库默认分支通常为 `main`，若你的仓库是旧版可能是 `master`，请根据实际情况填写。*
### 5.3 生成并部署
执行以下命令（即 Hexo 三连）：
```bash
hexo clean && hexo generate && hexo deploy
```
*   `hexo clean`：清除缓存。
*   `hexo generate` (或 `hexo g`)：生成静态文件。
*   `hexo deploy` (或 `hexo d`)：部署到 GitHub。
等待提示 `Deploy done` 后，稍等 1-2 分钟，访问 `https://你的用户名.github.io` 即可查看博客。
## 6. 将静态博客挂载到 Cloudflare Pages
如果你使用 Cloudflare 进行加速，可以按以下步骤操作：
1.  登录 Cloudflare 控制台，选择 **Workers 和 Pages** -> **Create application** -> **Pages** -> **连接到 Git**。
    ![Cloudflare Pages连接Git](https://developers.cloudflare.com/_astro/site-dashboard.Ct8X8ZRP_Z1XcghK.webp)
2.  登录你的 GitHub 账号并授权，选择刚才创建的博客仓库。
3.  配置构建设置（重要）：
    *   **构建命令**: `hexo generate` (或 `npm run build`)
    *   **构建输出目录**: `public`
    ![Cloudflare构建设置](https://developers.cloudflare.com/_astro/deploy-log.D8BQ4nzJ_Z2wcvzD.webp)
4.  点击 **保存并部署**。
5.  部署成功后，Cloudflare 会分配一个 `https://项目名.pages.dev` 的域名，访问即可看到博客内容。
    *   此时你可以将 GitHub 仓库设置为 Private（私库）。
6.  （可选）在 Cloudflare Pages 项目设置中绑定你自己的自定义域名。
## 7. 如何使用博客
### 新建文章
```bash
hexo new "这是一篇新的博文"
```
这会在 `source/_posts/` 目录下生成一个 `.md` 文件，使用 Markdown 语法编辑即可。
### 本地预览
编辑完成后，运行：
```bash
hexo clean && hexo s
```
访问 http://localhost:4000/ 预览修改效果。
### 发布更新
确认无误后，执行部署命令推送到 GitHub：
```bash
hexo clean && hexo g && hexo d
```
## 附录：常见问题
1.  **VSCODE 终端首次执行报错**
    *   解决方法：使用管理员身份打开 PowerShell，输入 `Set-ExecutionPolicy RemoteSigned` 并回车确认。
2.  **执行 `hexo d` 提示找不到部署器**
    *   原因：未安装 `hexo-deployer-git`。
    *   解决：执行 `npm install hexo-deployer-git --save`。
3.  **Cloudflare Pages 构建失败**
    *   检查 **构建命令** 是否为 `hexo generate`。
    *   检查 **构建输出目录** 是否为 `public`。
## 参考资料
*   [Hexo 官方文档](https://hexo.io/zh-cn/)
*   [GitHub Pages 官方文档](https://docs.github.com/en/pages)
