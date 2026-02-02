---
title: OpenList 网盘本地挂载完全教程
date: 2026-01-15 12:12:12
tags: 软件
categories: OpenList
excerpt: "OpenList是一个网盘聚合工具，搭配网盘挂载利器RaiDrive，立刻把阿里云盘、百度网盘、夸克网盘……全都当成本地硬盘用！"
cover: /images/1.jpg
---
                                                 
# OpenList 网盘本地挂载完全教程

### 一、前期准备



1. **必备工具**

* 操作系统：Windows 10+

* 依赖工具：RaiDrive（本地挂载工具）、Docker（可选，推荐部署方式）

* 网盘账号：123 云盘 / 迅雷云盘 / 阿里云盘等（支持 40 + 存储类型）

2. **软件获取**

* OpenList 官方地址：[Github仓库](https://github.com/OpenListTeam/OpenList)

* **RaiDrive 下载**：[官方最新版](https://www.raidrive.com/)（支持 32/64 位 Windows，无需破解）

3. **视频教程**

* bilibili：[视频教程](https://www.bilibili.com/video/BV1crucz2EPU/?share_source=copy_web&vd_source=db10c9ae8f1e2356b533421b72b176d8)

### 二、OpenList 安装部署



1. 下载 OpenList Windows 客户端，双击安装

2. 打开软件后依次安装三大组件：

* 「Openlist 服务」→「RClone」→「Openlist 核心」（缺一不可）

3. 基础配置：

* 进入【设置】：默认端口 5244（可自定义），点击「放行端口」

* 开启「开机自启」，修改并牢记「管理密码」（后续登录用）

* 【应用程序】中开启「开机启动」和「链接处理」

4. 访问管理后台：

* 浏览器打开 `http://localhost:5244`

* 默认账号：`admin`，密码：刚才设置的管理密码


### 三、添加主流网盘（详细配置）

#### 🔹 123 云盘（5 步速成）



1. 管理后台左侧→【存储】→【添加】

2. 驱动选择「123 云盘」

3. 挂载路径：`/123`（自定义，必须加 `/`）

4. 填写 123 云盘账号（手机号）和密码

5. 点击【保存】，验证访问：`http://localhost:5244/123`



#### 🔹 阿里云盘（获取 Refresh Token）



1. 获取 Token（二选一）：

* 方法 1（推荐）：访问[Open](https://api.oplist.org)[List](https://api.oplist.org)[ 官方工具](https://api.oplist.org)→扫码授权→复制 `refresh_token`

* 方法 2：网页版登录→F12→Application→Local Storage→`token` 字段中提取 `refresh_token`

2. 【存储】→【添加】，驱动选择「阿里云盘 Open」

3. 挂载路径：`/aliyun`，粘贴 `refresh_token`

4. 根文件夹 ID 留空（使用根目录）→【保存】

### 四、本地磁盘挂载（RaiDrive 专属配置）

#### 🔧 第一步：安装 RaiDrive



1. 双击下载的 RaiDrive 安装包，勾选「同意协议」→【下一步】

2. 安装路径默认即可（建议保留 C 盘默认路径，避免权限问题）

3. 勾选「创建桌面快捷方式」→【安装】→【完成】（自动启动 RaiDrive）

#### 🔧 第二步：配置 WebDAV 连接（核心步骤）



1. 打开 RaiDrive，点击左上角「+」号添加连接

2. 基础配置（必选参数）：



| 配置项  | 操作步骤                                                 |
| ---- | ---------------------------------------------------- |
| 存储类型 | 选择「NAS」→ 子类型选择「WebDAV」（关键！不要选错）                      |
| 名称   | 自定义（如「OpenList 网盘」，便于识别）                             |
| 地址   | 填写 `localhost:5244`（本地部署）或 `服务器IP:5244`（Linux 服务器部署） |
| 路径   | 必须填写 `/dav`（OpenList WebDAV 固定路径，少写报错）               |
| 用户名  | 输入 OpenList 管理账号（默认 `admin`）                         |
| 密码   | 输入 OpenList 管理密码（不是网盘密码！）                            |
| 挂载点  | 选择未被占用的盘符（如 G:、H:，下拉选择即可）                            |



3. 高级配置（可选优化）：

* 勾选「开机自动连接」（避免重启后重新配置）

* TLS/SSL：默认「关闭」（本地部署无需加密，远程访问可开启）

* 点击【高级】→ 缓存大小：默认 100MB，可改为 500MB 提升访问速度

4. 测试连接：点击右下角【连接】，显示「已连接」即配置成功

#### 🔧 第三步：验证挂载效果



1. 打开「此电脑」，即可看到新增的网络磁盘（如 G: 盘，名称为刚才自定义的「OpenList 网盘」）

2. 双击进入后，可直接查看所有已添加的网盘（如 / 123、/XL、/aliyun 目录）

3. 测试操作：复制 / 粘贴本地文件到该磁盘，或直接打开网盘中的视频 / 文档（与本地磁盘操作一致）

### 五、常见问题排查（新增 RaiDrive 专属故障）



1. **端口无法访问**

* Windows：关闭防火墙或放行 5244 端口

* Linux：`sudo ufw allow 5244`（Ubuntu）/ `firewall-cmd --add-port=5244/tcp`（CentOS）

2. **天翼云盘不能复制**

* 在Openlist管理存储——天翼云盘编辑——将WeDav策略由“302重定向”改为“本地代理”

* 重新执行验证步骤，确保手机号验证码正确

3. **RaiDrive 挂载后目录为空 / 无法访问**

* 核对路径：必须填写 `/dav`，而非 `/` 或其他路径

* 清除缓存：关闭 RaiDrive→打开安装目录→删除「Cache」文件夹→重新连接

* 更新版本：卸载旧版 RaiDrive，从官网下载最新版（避免兼容性问题）

* 验证 WebDAV 接口：浏览器访问 `http://localhost:5244/dav`，能弹出登录框即正常

4. **RaiDrive 提示「连接失败：认证错误」**

* 确认用户名是 `admin`（不是网盘账号）

* 密码是 OpenList 管理密码（不是网盘密码）

* 重新登录 OpenList 后台，确认密码未修改

5. **忘记管理密码**

* Windows：重新安装 OpenList 并重新配置

* Linux：删除容器 `docker rm -f openlist` 后重新部署

### 六、核心优势总结

✅ 开源纯净：原 Alist 核心团队打造，无商业捆绑

✅ 多盘整合：支持 123 云盘 / 迅雷 / 阿里云盘等 40 + 存储

✅ 无缝迁移：可导入 Alist 备份数据

✅ 本地操作：通过 RaiDrive 实现磁盘级挂载，文件操作零门槛

✅ 稳定兼容：RaiDrive 支持断点续传、缓存优化，适配 Windows 全版本

✅ 离线下载：支持 BT / 种子直接下载到网盘（需搭配 qBittorrent）
