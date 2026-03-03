# Resume Master / 简历大师

Smart resume optimization and cover letter generator powered by OpenAI. Switch UI to 中文 or English in the app.

---

## English

### About

Resume Master is an intelligent resume optimization and cover letter generator built on the OpenAI API. It helps job seekers tailor their resumes to target roles and generate professional cover letters (in English).

### Features

- **Resume upload**: PDF and Word documents, or paste text
- **Smart optimization**: Optimize resume content by job description; custom prompt templates supported
- **Cover letter**: Generate professional cover letters from the optimized resume and JD; export to DOCX
- **Application history**: Record company, position, and JD per application; calendar view and charts
- **Statistics**: Count by position; filter by year / month / day
- **UI**: Single-page app with **Chinese / English** toggle; API Key can be set in the frontend (no `.env` required for basic use)

### Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT API

### Requirements

- Node.js 16+ (LTS recommended)
- npm or yarn
- OpenAI API key (set in the app or in `.env`)

### Quick Start

**Option 1: One-click start (Windows)**

1. Clone and enter the project:
   ```bash
   git clone https://github.com/WangliZhang77/Jianli-master.git
   cd Jianli-master
   ```
2. Run the start script:
   - Double-click `启动.bat`, or  
   - Right-click `启动.ps1` → Run with PowerShell  
   The script will check Node.js, create `.env` if missing, install dependencies if needed, and start frontend and backend.
3. Open the app: frontend at http://localhost:3000, API at http://localhost:3001.

**Option 2: Manual start**

1. Install dependencies: `npm install`
2. (Optional) Create `.env` in the project root:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```
   You can also set the API key in the app (top-right “Set API Key”) and leave `.env` empty.
3. Start dev server: `npm run dev` (frontend on 3000, backend on 3001).

### Usage

1. **Upload resume** – Upload a PDF/Word file or paste resume text.
2. **Job description** – Paste the target job description (JD).
3. **Optimize resume** – Use “Optimize resume” or “One-click (optimize + cover letter)”.
4. **Cover letter** – View the optimized resume, then generate and export the cover letter (e.g. DOCX).
5. **Record application** – Save company, position, and JD; view history and stats.

### Project structure (main)

```
├── src/                 # Frontend (React, Vite)
│   ├── components/      # ResumeUpload, JobDescription, OptimizedResume, CoverLetter, ApplicationHistory, …
│   ├── contexts/        # I18n (EN/中文)
│   └── utils/           # apiKeyStorage, i18n, promptStorage, …
├── server/              # Backend (Express)
│   ├── services/        # resumeService, coverLetterService, fullFlowService, jobInfoExtractor
│   └── utils/           # tokenHelper, fileParser
├── package.json
├── vite.config.js
├── tailwind.config.js
├── 启动.bat / 启动.ps1  # Windows start scripts
└── DEPLOY.md            # Cloud deployment (Railway, Render)
```

### Environment variables (optional)

| Variable           | Description              | Required | Default |
|--------------------|--------------------------|----------|---------|
| `OPENAI_API_KEY`   | OpenAI API key           | No*      | -       |
| `PORT`             | Backend port             | No       | 3001    |

\* You can set the API key in the app UI instead.

### Scripts

```bash
npm run dev          # Start frontend + backend
npm run dev:server   # Backend only
npm run dev:client   # Frontend only
npm run build        # Production build
npm start            # Run production server (after build)
```

### FAQ

- **“Node.js not found”** – Install Node.js from https://nodejs.org (LTS) and restart the terminal.
- **Port in use** – Change `PORT` in `.env` or stop the process using the port.
- **API key errors** – Set the key in the app (“Set API Key”) or in `.env`; ensure it’s valid and has quota.
- **Upload fails** – Use PDF or Word (≤10MB); ensure the file isn’t corrupted.

### Notes

- Do not commit `.env` (it’s in `.gitignore`).
- OpenAI API usage is billable; set limits in your OpenAI account.
- Application history is stored in the browser (localStorage).

### License & thanks

MIT License. Thanks to OpenAI, React, Vite, and Tailwind CSS.

---

## 中文

### 简介

简历大师是一款基于 OpenAI API 的智能简历优化与推荐信（Cover Letter）生成工具，支持根据目标岗位优化简历并生成英文推荐信。应用内可切换 **中文 / English** 界面；API 密钥可在前端「设置 API Key」中填写，无需强制配置 `.env`。

### 功能特点

- **简历上传**：支持 PDF、Word 或直接粘贴文本
- **智能优化**：按岗位描述优化简历，支持自定义提示词模板
- **推荐信（Cover Letter）**：根据优化后简历和 JD 生成推荐信，支持导出 DOCX
- **投递记录**：记录公司、职位、JD，支持日历与图表统计
- **数据统计**：按岗位统计、按年/月/日筛选
- **界面**：中英双语切换；API Key 可在前端设置，不必依赖 `.env`

### 技术栈

- **前端**：React + Vite + Tailwind CSS
- **后端**：Node.js + Express
- **AI**：OpenAI GPT API

### 前置要求

- Node.js 16+（建议 LTS）
- npm 或 yarn
- OpenAI API 密钥（可在应用内设置或写在 `.env`）

### 快速开始

**方式一：一键启动（Windows）**

1. 克隆并进入项目：
   ```bash
   git clone https://github.com/WangliZhang77/Jianli-master.git
   cd Jianli-master
   ```
2. 双击 `启动.bat`，或右键 `启动.ps1` → 使用 PowerShell 运行。脚本会检查 Node.js、创建 `.env`（若不存在）、安装依赖并启动前后端。
3. 访问：前端 http://localhost:3000，后端 http://localhost:3001。

**方式二：手动启动**

1. 安装依赖：`npm install`
2. （可选）在项目根目录创建 `.env`：
   ```env
   OPENAI_API_KEY=你的密钥
   PORT=3001
   ```
   也可不创建 `.env`，在应用内右上角「设置 API Key」中填写密钥。
3. 启动开发服务：`npm run dev`（前端 3000，后端 3001）。

### 使用说明

1. **上传简历**：上传 PDF/Word 或粘贴简历内容。
2. **岗位描述**：粘贴目标岗位的 JD。
3. **优化简历**：使用「仅优化简历」或「一键生成（优化简历 + 推荐信）」。
4. **推荐信（Cover Letter）**：查看优化简历后生成推荐信，可导出 DOCX 等。
5. **记录投递**：保存公司、职位、JD；在投递记录中查看历史与统计。

### 项目结构（概要）

```
├── src/                 # 前端
│   ├── components/      # 简历上传、岗位描述、优化简历、推荐信、投递记录等
│   ├── contexts/        # 中英文案（I18n）
│   └── utils/           # API Key 存储、文案、提示词存储等
├── server/              # 后端
│   ├── services/        # 简历优化、推荐信、一键流程、职位信息提取
│   └── utils/           # token 控制、文件解析等
├── package.json
├── 启动.bat / 启动.ps1  # Windows 启动脚本
└── DEPLOY.md            # 云端部署说明（Railway、Render）
```

### 环境变量（可选）

| 变量名             | 说明           | 必填 | 默认值 |
|--------------------|----------------|------|--------|
| `OPENAI_API_KEY`   | OpenAI API 密钥 | 否*  | -      |
| `PORT`             | 后端端口       | 否   | 3001   |

\* 可在应用内「设置 API Key」中配置。

### 常用脚本

```bash
npm run dev          # 同时启动前后端
npm run dev:server   # 仅后端
npm run dev:client   # 仅前端
npm run build        # 生产构建
npm start            # 运行生产服务（需先 build）
```

### 常见问题

- **未检测到 Node.js**：从 https://nodejs.org 安装 LTS 版本后重启终端。
- **端口被占用**：修改 `.env` 中的 `PORT` 或关闭占用端口的程序。
- **API 密钥错误**：在应用内重新设置 API Key 或检查 `.env` 中的密钥是否有效、有余额。
- **上传失败**：确保为 PDF 或 Word、不超过 10MB，且文件未损坏。

### 注意事项

- 请勿将 `.env` 提交到 Git（已列入 `.gitignore`）。
- 使用 OpenAI API 会产生费用，请在 OpenAI 后台设置用量限制。
- 投递记录保存在浏览器本地（localStorage），清除浏览器数据会丢失。

### 许可证与致谢

MIT License。感谢 OpenAI、React、Vite、Tailwind CSS。

---

如有问题或建议，欢迎提交 [Issue](https://github.com/WangliZhang77/Jianli-master/issues)。
