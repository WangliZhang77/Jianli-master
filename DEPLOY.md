# 简历大师 - 云端部署指南

本项目可一键部署到云平台，前后端一起运行。部署前请确保已在平台配置 **OPENAI_API_KEY**。

---

## 方式一：Railway 部署（推荐，简单）

[Railway](https://railway.app) 支持从 GitHub 自动部署，有免费额度。

### 步骤

1. **代码推送到 GitHub**  
   - 在 GitHub 新建仓库，把本项目推送上去（不要推送 `.env`，已在 .gitignore 中）。

2. **注册并登录 Railway**  
   - 打开 https://railway.app ，用 GitHub 登录。

3. **新建项目并部署**  
   - 点击 **New Project** → **Deploy from GitHub repo**，选择你的仓库。  
   - 若提示配置，在项目里点 **Variables**，添加环境变量：
     - `OPENAI_API_KEY` = 你的 OpenAI API 密钥  
     - `NODE_ENV` = `production`
   - Railway 会自动检测 Node 项目并执行 `npm install`。  
   - 在 **Settings** 里设置：
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Root Directory**: 留空（项目根目录）

4. **生成公网访问地址**  
   - 在 **Settings** → **Networking** 里点击 **Generate Domain**，会得到一个 `xxx.railway.app` 的网址，打开即可访问。

---

## 方式二：Render 部署

[Render](https://render.com) 同样支持 GitHub 部署，有免费档。

### 步骤

1. **代码在 GitHub**（同上）。

2. **注册 Render**  
   - 打开 https://render.com ，用 GitHub 登录。

3. **新建 Web Service**  
   - **New** → **Web Service**，连接你的 GitHub 仓库。  
   - 配置：
     - **Runtime**: Node  
     - **Build Command**: `npm install && npm run build`  
     - **Start Command**: `npm start`  
     - **Instance Type**: 选 Free（或付费）

4. **环境变量**  
   - 在 **Environment** 里添加：
     - `OPENAI_API_KEY` = 你的 API 密钥  
     - `NODE_ENV` = `production`

5. **部署**  
   - 保存后会自动构建并部署，完成后会给你一个 `xxx.onrender.com` 的地址。

> 注意：免费实例一段时间无访问会休眠，首次打开可能较慢。

---

## 方式三：Vercel（仅前端）+ 后端单独部署

若希望前端用 Vercel、后端用 Railway/Render：

- **后端**：在 Railway 或 Render 上只跑 Node 服务（同上，Start Command 用 `npm start`，并设置 `OPENAI_API_KEY`），得到后端地址，例如 `https://xxx.railway.app`。  
- **前端**：在 Vite 里配置生产环境 API 地址（例如 `vite.config.js` 里用 `define` 或环境变量），然后部署到 Vercel。  

不推荐新手用此方式，除非你已熟悉前后端分离部署。

---

## 部署前本地自测（生产模式）

在本地模拟生产环境，确保能正常访问页面和接口：

```bash
# 1. 构建前端
npm run build

# 2. 以生产模式启动（会托管 dist 并提供 /api）
# Windows PowerShell:
$env:NODE_ENV="production"; node server/index.js

# 3. 浏览器打开 http://localhost:3001 测试
```

---

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `OPENAI_API_KEY` | 是 | OpenAI API 密钥 |
| `NODE_ENV` | 生产建议 | 设为 `production`，服务会托管前端并启用生产行为 |
| `PORT` | 否 | 服务端口，云平台一般自动注入，可不设 |
| `OPENAI_MODEL` | 否 | 简历/推荐信使用的模型，默认 `gpt-4o-mini`（省 token），可改为 `gpt-4` |
| `OPENAI_LIGHT_MODEL` | 否 | 职位信息提取使用的模型，默认 `gpt-4o-mini` |
| `MAX_RESUME_CHARS` | 否 | 简历最大字符数（截断以省 token），默认 4000 |
| `MAX_JD_CHARS` | 否 | 岗位描述最大字符数，默认 2000 |
| `MAX_RESUME_FOR_COVER_LETTER_CHARS` | 否 | 生成推荐信时传入的简历最大字符数，默认 3000 |

---

## 上传文件说明

当前版本上传的简历会保存在服务器进程所在目录的 `uploads/` 下。在 Railway、Render 等**无持久磁盘**的环境里，重启或重新部署后这些文件会丢失，仅适合临时使用。若需要长期保存，可后续改为使用对象存储（如 AWS S3、云厂商 OSS）存储文件。

---

## 常见问题

- **部署后打开页面一直转圈或 404**  
  检查 Build Command 是否包含 `npm run build`，且 Start Command 为 `npm start`，并设置了 `NODE_ENV=production`。

- **接口报错「OpenAI API 密钥未配置」**  
  在对应平台的环境变量里添加 `OPENAI_API_KEY` 并重新部署。

- **端口**  
  云平台会通过环境变量注入 `PORT`，代码里已使用 `process.env.PORT || 3001`，一般无需改。
