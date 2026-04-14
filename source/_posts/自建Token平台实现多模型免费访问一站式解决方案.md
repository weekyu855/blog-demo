---
title: 自建Token平台实现多模型免费访问：Claude、ChatGPT、Gemini、千问一站式解决方案
date: 2026-04-13 21:55:00
tags: [AI, 大模型, Token平台, 反代, Claude, ChatGPT, Gemini, 千问, 免费API]
categories: 技术实践
excerpt: "本文详细介绍如何自建Token平台，通过反代web端实现免费访问Claude、ChatGPT、Gemini、千问等顶级大模型，提供一站式解决方案。"
---

# 自建Token平台实现多模型免费访问：Claude、ChatGPT、Gemini、千问一站式解决方案

## 项目背景

随着AI技术的快速发展，各大厂商推出了众多优秀的大语言模型，如OpenAI的ChatGPT、Anthropic的Claude、Google的Gemini、阿里的千问等。然而，这些模型的官方API往往价格昂贵，且存在地域访问限制。本文介绍一种通过自建Token平台和反代web端的方式，实现免费访问这些顶级大模型的解决方案。

### 核心价值
- **成本为零**：充分利用各平台的免费额度
- **一站式访问**：统一接口调用多个大模型
- **绕过限制**：解决地域访问和API限制问题
- **高度可定制**：根据需求灵活配置

## 技术架构

### 1. 整体架构设计

```
┌─────────────────────────────────────────────────┐
│                   用户端                         │
│  (ChatGPT Web / Claude Web / Gemini Web)        │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                反向代理层                        │
│  (Nginx / Caddy / Cloudflare Workers)           │
│  • 请求转发                                      │
│  • 负载均衡                                      │
│  • 缓存加速                                      │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                Token管理平台                     │
│  • 多账号轮换管理                                │
│  • Token自动刷新                                 │
│  • 使用统计和监控                                │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              目标平台API                         │
│  (OpenAI / Anthropic / Google / 阿里云)         │
└─────────────────────────────────────────────────┘
```

### 2. 核心组件

#### 2.1 反向代理服务
- **Nginx配置**：实现请求转发和负载均衡
- **Cloudflare Workers**：边缘计算，全球加速
- **自定义中间件**：请求重写、Header修改

#### 2.2 Token管理平台
- **账号池管理**：多个免费账号轮换使用
- **自动刷新机制**：定时刷新Token保持有效
- **使用统计**：监控各模型使用情况

#### 2.3 客户端适配
- **Web界面**：统一的聊天界面
- **API接口**：标准化API供其他应用调用
- **浏览器扩展**：增强现有平台功能

## 实现步骤

### 1. 准备工作

#### 1.1 获取免费账号
```bash
# 需要注册的平台
1. OpenAI Platform - 免费试用额度
2. Anthropic Console - Claude免费试用
3. Google AI Studio - Gemini免费额度
4. 阿里云百炼 - 千问免费额度
5. DeepSeek - 免费API
6. 其他国内大模型平台
```

#### 1.2 环境准备
```bash
# 安装必要工具
sudo apt-get update
sudo apt-get install -y nginx docker.io nodejs npm python3-pip

# 创建项目目录
mkdir -p ~/ai-proxy-platform
cd ~/ai-proxy-platform
```

### 2. 搭建反向代理

#### 2.1 Nginx配置
```nginx
# /etc/nginx/sites-available/ai-proxy
server {
    listen 80;
    server_name ai-proxy.yourdomain.com;
    
    # ChatGPT反向代理
    location /chatgpt/ {
        proxy_pass https://api.openai.com/;
        proxy_set_header Host api.openai.com;
        proxy_set_header Authorization "Bearer $OPENAI_API_KEY";
        proxy_set_header Content-Type "application/json";
        
        # 添加自定义Header
        add_header X-Proxy-Server "AI-Proxy-Platform";
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        
        # 缓存配置
        proxy_cache ai_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
    }
    
    # Claude反向代理
    location /claude/ {
        proxy_pass https://api.anthropic.com/;
        proxy_set_header Host api.anthropic.com;
        proxy_set_header x-api-key "$ANTHROPIC_API_KEY";
        proxy_set_header anthropic-version "2023-06-01";
        
        # 请求体修改
        proxy_set_header Content-Type "application/json";
    }
    
    # Gemini反向代理
    location /gemini/ {
        proxy_pass https://generativelanguage.googleapis.com/;
        proxy_set_header Host generativelanguage.googleapis.com;
        
        # API Key通过参数传递
        proxy_set_header x-goog-api-key "$GEMINI_API_KEY";
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### 2.2 Cloudflare Workers实现（替代方案）
```javascript
// cloudflare-worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetMap = {
      '/chatgpt': 'https://api.openai.com',
      '/claude': 'https://api.anthropic.com',
      '/gemini': 'https://generativelanguage.googleapis.com',
      '/qianwen': 'https://dashscope.aliyuncs.com'
    };
    
    // 找到目标路径
    let targetBase = null;
    let path = url.pathname;
    
    for (const [prefix, base] of Object.entries(targetMap)) {
      if (path.startsWith(prefix)) {
        targetBase = base;
        path = path.slice(prefix.length);
        break;
      }
    }
    
    if (!targetBase) {
      return new Response('Not Found', { status: 404 });
    }
    
    // 构建目标URL
    const targetUrl = new URL(path + url.search, targetBase);
    
    // 复制请求
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body
    });
    
    // 添加认证Header
    const apiKeys = {
      'api.openai.com': env.OPENAI_API_KEY,
      'api.anthropic.com': env.ANTHROPIC_API_KEY,
      'generativelanguage.googleapis.com': env.GEMINI_API_KEY,
      'dashscope.aliyuncs.com': env.QIANWEN_API_KEY
    };
    
    const apiKey = apiKeys[targetUrl.hostname];
    if (apiKey) {
      if (targetUrl.hostname.includes('openai.com')) {
        newRequest.headers.set('Authorization', `Bearer ${apiKey}`);
      } else if (targetUrl.hostname.includes('anthropic.com')) {
        newRequest.headers.set('x-api-key', apiKey);
      } else if (targetUrl.hostname.includes('googleapis.com')) {
        newRequest.headers.set('x-goog-api-key', apiKey);
      }
    }
    
    // 发送请求
    try {
      const response = await fetch(newRequest);
      const modifiedResponse = new Response(response.body, response);
      
      // 添加CORS Header
      modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
      modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return modifiedResponse;
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
  }
};
```

### 3. Token管理平台

#### 3.1 账号池管理
```python
# token_manager.py
import json
import time
import redis
from typing import Dict, List
from datetime import datetime, timedelta

class TokenManager:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.account_pools = {
            'openai': [],
            'anthropic': [],
            'google': [],
            'qianwen': []
        }
        
    def add_account(self, platform: str, api_key: str, quota: Dict):
        """添加账号到池中"""
        account_id = f"{platform}_{int(time.time())}"
        account_data = {
            'api_key': api_key,
            'quota': quota,
            'usage': {
                'total_tokens': 0,
                'last_used': None,
                'requests_today': 0
            },
            'status': 'active'
        }
        
        self.redis_client.hset(f"account:{account_id}", mapping=account_data)
        self.account_pools[platform].append(account_id)
        
    def get_available_account(self, platform: str):
        """获取可用的账号"""
        if not self.account_pools[platform]:
            return None
            
        # 简单的轮询策略
        account_id = self.account_pools[platform].pop(0)
        self.account_pools[platform].append(account_id)
        
        account_data = self.redis_client.hgetall(f"account:{account_id}")
        if account_data.get('status') == 'active':
            return account_data['api_key']
        return None
    
    def update_usage(self, account_id: str, tokens_used: int):
        """更新使用统计"""
        key = f"account:{account_id}"
        self.redis_client.hincrby(key, 'usage.total_tokens', tokens_used)
        self.redis_client.hset(key, 'usage.last_used', datetime.now().isoformat())
        
        # 重置每日计数
        today = datetime.now().date().isoformat()
        last_reset = self.redis_client.hget(key, 'usage.last_reset')
        if last_reset != today:
            self.redis_client.hset(key, 'usage.requests_today', 0)
            self.redis_client.hset(key, 'usage.last_reset', today)
        else:
            self.redis_client.hincrby(key, 'usage.requests_today', 1)
    
    def check_quota(self, account_id: str):
        """检查配额"""
        account_data = self.redis_client.hgetall(f"account:{account_id}")
        quota = account_data.get('quota', {})
        usage = account_data.get('usage', {})
        
        # 检查每日限制
        if quota.get('daily_limit'):
            if usage.get('requests_today', 0) >= quota['daily_limit']:
                return False
        
        # 检查总token限制
        if quota.get('total_tokens_limit'):
            if usage.get('total_tokens', 0) >= quota['total_tokens_limit']:
                return False
        
        return True
```

#### 3.2 自动刷新机制
```javascript
// refresh_tokens.js
const cron = require('node-cron');
const axios = require('axios');

class TokenRefresher {
  constructor() {
    this.platforms = {
      openai: this.refreshOpenAI.bind(this),
      anthropic: this.refreshAnthropic.bind(this),
      google: this.refreshGoogle.bind(this),
      qianwen: this.refreshQianwen.bind(this)
    };
  }
  
  start() {
    // 每小时检查一次Token状态
    cron.schedule('0 * * * *', async () => {
      console.log('开始检查Token状态...');
      await this.checkAllTokens();
    });
    
    // 每天凌晨刷新Token
    cron.schedule('0 2 * * *', async () => {
      console.log('开始刷新Token...');
      await this.refreshAllTokens();
    });
  }
  
  async refreshOpenAI(account) {
    // OpenAI Token通常长期有效，主要检查配额
    const response = await axios.get('https://api.openai.com/v1/usage', {
      headers: {
        'Authorization': `Bearer ${account.api_key}`
      }
    });
    
    return {
      valid: response.status === 200,
      remaining: response.data.remaining_quota || 0,
      expires_at: account.expires_at
    };
  }
  
  async refreshAnthropic(account) {
    // Claude API Key检查
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        },
        {
          headers: {
            'x-api-key': account.api_key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );
      
      return {
        valid: true,
        remaining: 1000, // 假设值
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
  
  // 其他平台的刷新方法类似...
}
```

### 4. 统一客户端界面

#### 4.1 Web界面实现
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI模型聚合平台</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .models-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
        }
        
        .model-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
            cursor: pointer;
            border: 2px solid transparent;
        }
        
        .model-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-color: #667eea;
        }
        
        .model-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
        }
        
        .model-name {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }
        
        .model-desc {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 15px;
        }
        
        .model-status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .status-active {
            background: #d4edda;
            color: #155724;
        }
        
        .chat-container {
            padding: 40px;
            display: none;
        }
        
        .chat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .back-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .chat-messages {
            height: 400px;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 10px;
            max-width: 80%;
        }
        
        .user-message {
            background: #667eea;
            color: white;
            margin-left: auto;
        }
        
        .ai-message {
            background: white;
            border: 1px solid #ddd;
            margin-right: auto;
        }
        
        .input-area {
            display: flex;
            gap: 10px;
        }
        
        .message-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 1rem;
        }
        
        .send-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0 30px;
            border-radius: 10px;
            font-weight: 500;
            cursor: pointer;
        }
        
        @media (max-width: 768px) {
            .models-grid {
                grid-template-columns: 1fr;
                padding: 20px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI模型聚合平台</h1>
            <p>一站式访问Claude、ChatGPT、Gemini、千问等顶级大模型</p>
        </div>
        
        <div class="models-grid" id="modelsGrid">
            <div class="model-card" data-model="chatgpt">
                <div class="model-icon">GPT</div>
                <div class="model-name">ChatGPT</div>
                <div class="model-desc">OpenAI最新模型，强大的对话和推理能力</div>
                <div class="model-status status-active">在线</div>
            </div>
            
            <div class="model-card" data-model="claude">
                <div class="model-icon">C</div>
                <div class="model-name">Claude</div>
                <div class="model-desc">Anthropic的安全助手，擅长长文本处理</div>
                <div class="model-status status-active">在线</div>
            </div>
            
            <div class="model-card" data-model="gemini">
                <div class="model-icon">G</div>
                <div class="model-name">Gemini</div>
                <div class="model-desc">Google多模态模型，支持图像理解</div>
                <div class="model-status status-active">在线</div>
            </div>
            
            <div class="model-card" data-model="qianwen">
                <div class="model-icon">千</div>
                <div class="model-name">千问</div>
                <div class="model-desc">阿里云中文大模型，本土化优化</div>
                <div class="model-status status-active">在线</div>
            </div>
        </div>
        
        <div class="chat-container" id="chatContainer">
            <div class="chat-header">
                <button class="back-button" id="backButton">← 返回模型选择</button>
                <h2 id="currentModel">ChatGPT</h2>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <!-- 消息将动态添加到这里 -->
            </div>
            
            <div class="input-area">
                <input type="text" class="message-input" id="messageInput" placeholder="输入你的消息...">
                <button class="send-button" id="sendButton">发送</button>
            </div>
        </div>
    </div>

    <script>
        // DOM元素
        const modelsGrid = document.getElementById('modelsGrid');
        const chatContainer = document.getElementById('chatContainer');
        const chatMessages = document.getElementById('chatMessages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const backButton = document.getElementById('backButton');
        const currentModelEl = document.getElementById('currentModel');
        
        let currentModel = 'chatgpt';
        
        // 模型选择
        document.querySelectorAll('.model-card').forEach(card => {
            card.addEventListener('click', () => {
                currentModel = card.dataset.model;
                const modelName = card.querySelector('.model-name').textContent;
                
                // 更新界面
                modelsGrid.style.display = 'none';
                chatContainer.style.display = 'block';
                currentModelEl.textContent = modelName;
                
                // 清空聊天记录
                chatMessages.innerHTML = '';
                
                // 添加欢迎消息
                addMessage(`欢迎使用${modelName}！我是您的AI助手，请问有什么可以帮您？`, 'ai');
            });
        });
        
        // 返回按钮
        backButton.addEventListener('click', () => {
            modelsGrid.style.display = 'grid';
            chatContainer.style.display = 'none';
        });
        
        // 发送消息
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            // 添加用户消息
            addMessage(message, 'user');
            messageInput.value = '';
            
            // 显示加载中
            const loadingId = addMessage('思考中...', 'ai');
            
            // 发送到后端
            fetch(`/api/${currentModel}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    model: currentModel
                })
            })
            .then(response => response.json())
            .then(data => {
                // 移除加载消息
                const loadingMsg = document.getElementById(loadingId);
                if (loadingMsg) loadingMsg.remove();
                
                // 添加AI回复
                addMessage(data.response, 'ai');
            })
            .catch(error => {
                // 移除加载消息
                const loadingMsg = document.getElementById(loadingId);
                if (loadingMsg) loadingMsg.remove();
                
                // 显示错误
                addMessage(`抱歉，请求失败：${error.message}`, 'ai');
            });
        }
        
        // 添加消息到聊天框
        function addMessage(text, sender) {
            const messageId = 'msg_' + Date.now();
            const messageDiv = document.createElement('div');
            messageDiv.id = messageId;
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = text;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            return messageId;
        }
        
        // 事件监听
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // 初始化：显示模型选择
        modelsGrid.style.display = 'grid';
        chatContainer.style.display = 'none';
    </script>
</body>
</html>
```

#### 4.2 API服务端
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 配置各平台API端点
const API_ENDPOINTS = {
  chatgpt: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  qianwen: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
};

// Token管理器实例
const tokenManager = new TokenManager();

// 统一聊天接口
app.post('/api/:model/chat', async (req, res) => {
  try {
    const { model } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }
    
    // 获取可用的API Key
    const apiKey = tokenManager.getAvailableAccount(model);
    if (!apiKey) {
      return res.status(503).json({ error: '当前模型暂时不可用' });
    }
    
    let response;
    
    switch (model) {
      case 'chatgpt':
        response = await callChatGPT(apiKey, message);
        break;
      case 'claude':
        response = await callClaude(apiKey, message);
        break;
      case 'gemini':
        response = await callGemini(apiKey, message);
        break;
      case 'qianwen':
        response = await callQianwen(apiKey, message);
        break;
      default:
        return res.status(400).json({ error: '不支持的模型' });
    }
    
    // 更新使用统计
    tokenManager.updateUsage(apiKey, response.usage?.total_tokens || 100);
    
    res.json({
      response: response.content,
      usage: response.usage,
      model: model
    });
    
  } catch (error) {
    console.error('聊天接口错误:', error);
    res.status(500).json({ 
      error: '请求失败',
      details: error.message 
    });
  }
});

// ChatGPT调用
async function callChatGPT(apiKey, message) {
  const response = await axios.post(
    API_ENDPOINTS.chatgpt,
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000,
      temperature: 0.7
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return {
    content: response.data.choices[0].message.content,
    usage: response.data.usage
  };
}

// Claude调用
async function callClaude(apiKey, message) {
  const response = await axios.post(
    API_ENDPOINTS.claude,
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: message }]
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );
  
  return {
    content: response.data.content[0].text,
    usage: { total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens }
  };
}

// Gemini调用
async function callGemini(apiKey, message) {
  const response = await axios.post(
    `${API_ENDPOINTS.gemini}?key=${apiKey}`,
    {
      contents: [{
        parts: [{ text: message }]
      }]
    }
  );
  
  return {
    content: response.data.candidates[0].content.parts[0].text,
    usage: { total_tokens: 100 } // Gemini不返回token数
  };
}

// 千问调用
async function callQianwen(apiKey, message) {
  const response = await axios.post(
    API_ENDPOINTS.qianwen,
    {
      model: 'qwen-max',
      input: {
        messages: [{ role: 'user', content: message }]
      },
      parameters: {
        max_tokens: 1000,
        temperature: 0.7
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return {
    content: response.data.output.text,
    usage: response.data.usage
  };
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    models: Object.keys(API_ENDPOINTS)
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI代理服务器运行在 http://localhost:${PORT}`);
  console.log('可用模型:', Object.keys(API_ENDPOINTS).join(', '));
});
```

## 部署指南

### 1. 本地部署
```bash
# 克隆项目
git clone https://github.com/yourusername/ai-proxy-platform.git
cd ai-proxy-platform

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，添加你的API Keys

# 启动服务
npm start

# 或者使用Docker
docker build -t ai-proxy-platform .
docker run -p 3000:3000 --env-file .env ai-proxy-platform
```

### 2. Docker Compose部署
```yaml
# docker-compose.yml
version: '3.8'

services:
  ai-proxy:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env
    depends_on:
      - redis
    restart: unless-stopped
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ai-proxy
    restart: unless-stopped

volumes:
  redis_data:
```

### 3. 云服务器部署
```bash
# 使用一键安装脚本
curl -sSL https://raw.githubusercontent.com/yourusername/ai-proxy-platform/main/scripts/install.sh | bash

# 或者手动部署
# 1. 安装Node.js和Redis
# 2. 配置Nginx反向代理
# 3. 设置系统服务
# 4. 配置SSL证书
```

### 4. 使用说明

#### 4.1 获取API Keys
1. **OpenAI**: 注册OpenAI平台获取免费额度
2. **Anthropic**: 申请Claude API访问权限
3. **Google**: 注册Google AI Studio获取Gemini API Key
4. **阿里云**: 注册百炼平台获取千问API Key

#### 4.2 配置环境变量
```bash
# .env文件示例
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
QIANWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 服务器配置
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
```

#### 4.3 监控和维护
```bash
# 查看服务状态
systemctl status ai-proxy

# 查看日志
journalctl -u ai-proxy -f

# 备份数据
redis-cli save
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb

# 更新服务
git pull
npm install
systemctl restart ai-proxy
```

## 安全注意事项

### 1. API Key安全
- 不要将API Key提交到版本控制系统
- 使用环境变量或密钥管理服务
- 定期轮换API Key
- 设置使用限额和告警

### 2. 访问控制
- 实施IP白名单
- 添加身份验证中间件
- 限制请求频率
- 记录访问日志

### 3. 数据安全
- 加密敏感数据
- 定期备份
- 实施数据保留策略
- 遵守隐私法规

### 4. 网络安全
- 使用HTTPS
- 配置防火墙规则
- 定期安全扫描
- 更新依赖包

## 性能优化

### 1. 缓存策略
```nginx
# Nginx缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=ai_cache:10m inactive=60m;

location /api/ {
    proxy_cache ai_cache;
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_use_stale error timeout updating;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 2. 负载均衡
```nginx
upstream ai_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    
    # 最少连接算法
    least_conn;
    
    # 健康检查
    check interval=3000 rise=2 fall=3 timeout=1000;
}

location / {
    proxy_pass http://ai_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 3. CDN加速
- 使用Cloudflare CDN
- 配置边缘缓存
- 启用HTTP/3
- 优化图片和静态资源

### 4. 数据库优化
```sql
-- Redis优化配置
# redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 故障排除

### 常见问题及解决方案

#### 1. API Key失效
```bash
# 检查API Key状态
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# 重新获取API Key
# 1. 登录对应平台
# 2. 生成新的API Key
# 3. 更新环境变量
# 4. 重启服务
```

#### 2. 服务不可用
```bash
# 检查服务状态
systemctl status ai-proxy
journalctl -u ai-proxy --since "1 hour ago"

# 重启服务
systemctl restart ai-proxy

# 检查端口占用
netstat -tlnp | grep :3000
lsof -i :3000
```

#### 3. 性能问题
```bash
# 监控系统资源
htop
iotop -o

# 检查日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 性能测试
ab -n 1000 -c 100 http://localhost:3000/health
```

## 扩展功能

### 1. 模型微调
```python
# fine_tune.py
import openai

def fine_tune_model(api_key, training_file, model_name="gpt-3.5-turbo"):
    openai.api_key = api_key
    
    # 创建微调任务
    response = openai.FineTuningJob.create(
        training_file=training_file,
        model=model_name,
        hyperparameters={
            "n_epochs": 3,
            "batch_size": 4,
            "learning_rate_multiplier": 0.1
        }
    )
    
    return response.id
```

### 2. 多模态支持
```javascript
// 图像识别功能
async function analyzeImage(apiKey, imageUrl) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '描述这张图片的内容' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 300
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.choices[0].message.content;
}
```

### 3. 语音功能
```python
# speech_to_text.py
import whisper

def transcribe_audio(audio_path):
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    return result["text"]

def text_to_speech(text, output_path):
    # 使用TTS服务
    import gtts
    tts = gtts.gTTS(text, lang='zh-cn')
    tts.save(output_path)
```

## 总结

通过自建Token平台和反代web端，我们成功实现了一个免费访问多个顶级大模型的解决方案。这个方案具有以下优势：

### 核心优势
1. **零成本运营**：充分利用各平台的免费额度
2. **高可用性**：多账号轮换，避免单点故障
3. **易扩展**：支持随时添加新的模型平台
4. **统一接口**：简化客户端开发
5. **安全可控**：完全掌握数据流向

### 技术亮点
- 创新的Token池管理机制
- 智能的负载均衡策略
- 完善的监控和告警系统
- 高度可配置的架构设计

### 适用场景
1. **个人开发者**：学习和实验AI技术
2. **小型团队**：内部工具开发
3. **教育机构**：教学和研究用途
4. **创业公司**：产品原型验证

### 未来展望
随着AI技术的不断发展，这个平台可以进一步扩展：
- 支持更多的大模型平台
- 集成向量数据库实现RAG
- 开发移动端应用
- 实现模型联邦学习
- 构建AI应用市场

## 资源链接

### 官方文档
- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude文档](https://docs.anthropic.com/claude/reference/)
- [Google Gemini文档](https://ai.google.dev/gemini-api/docs)
- [阿里云百炼文档](https://help.aliyun.com/zh/dashscope/)

### 开源项目
- [本项目GitHub仓库](https://github.com/yourusername/ai-proxy-platform)
- [类似项目参考](https://github.com/search?q=ai+proxy+platform)
- [前端模板](https://github.com/chatgpt-ui/chatgpt-ui)

### 学习资源
- [AI模型原理详解](https://course.fast.ai/)
- [大模型应用开发实战](https://www.deeplearning.ai/short-courses/)
- [Prompt Engineering指南](https://www.promptingguide.ai/zh)

---

**最后提醒**：使用各平台API时，请遵守相关服务条款，合理使用免费额度，不要用于商业盈利目的。技术应该用来创造价值，而不是滥用资源。

希望这个方案能帮助你更好地探索和应用AI技术！如果有任何问题或建议，欢迎在评论区讨论。

---
*本文基于B站视频【自建token平台，反代web端免费使用顶级大模型code plan，claude，chatgpt，gemini，千问】整理而成，结合实际技术实践进行了扩展和优化。*