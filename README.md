# 简历大师 - 智能简历优化工具

一个基于 ChatGPT API 的智能简历优化和推荐信生成工具。帮助求职者根据目标岗位要求优化简历，并自动生成专业的英文推荐信。

## ✨ 功能特点

- 📄 **简历上传**：支持 PDF 和 Word 文档上传，或直接粘贴文本
- 🎯 **智能优化**：根据岗位要求自动优化简历内容，支持自定义提示词模板
- ✉️ **推荐信生成**：基于优化后的简历和岗位描述生成专业推荐信（纯英文），支持一键导出 DOCX
- 📊 **投递记录**：记录每次投递的公司、职位和 JD，支持日历视图和图表统计
- 📈 **数据统计**：按岗位统计投递数量，支持按年/月/日筛选
- 🎨 **现代化UI**：美观的单页面应用设计

## 🛠️ 技术栈

- **前端**：React + Vite + Tailwind CSS
- **后端**：Node.js + Express
- **AI**：OpenAI GPT API

## 📋 前置要求

- Node.js 16+ （推荐使用 LTS 版本）
- npm 或 yarn
- OpenAI API 密钥

## 🚀 快速开始

### 方法一：一键启动（推荐 Windows 用户）

1. **克隆或下载项目**
   ```bash
   git clone https://github.com/WangliZhang77/Jianli-master.git
   cd Jianli-master
   ```

2. **双击启动脚本**
   - Windows: 双击 `启动.bat`
   - PowerShell: 右键 `启动.ps1` → 使用 PowerShell 运行

   启动脚本会自动：
   - ✅ 检查 Node.js 是否安装
   - ✅ 检查并创建 `.env` 文件（如果不存在）
   - ✅ 自动安装依赖（如果 `node_modules` 不存在）
   - ✅ 启动前端和后端服务器

3. **访问应用**
   - 前端界面: http://localhost:3000
   - 后端 API: http://localhost:3001

### 方法二：手动启动

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   
   在项目根目录创建 `.env` 文件，内容如下：
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```
   
   > 💡 **获取 API 密钥**：访问 [OpenAI Platform](https://platform.openai.com/api-keys) 注册并获取 API 密钥

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   这将同时启动前端（端口 3000）和后端（端口 3001）服务器。

## 📖 使用说明

### 基本流程

1. **上传简历**
   - 在"上传简历"标签页中，上传 PDF/Word 文档或直接粘贴简历文本

2. **输入岗位描述**
   - 在"岗位描述"标签页中，输入目标公司和岗位的详细描述（JD）

3. **优化简历**
   - 点击"优化简历"按钮
   - 系统会根据岗位要求优化您的简历
   - 可以自定义提示词模板以获得更好的优化效果

4. **生成推荐信**
   - 在查看优化后的简历后，点击"生成推荐信"按钮
   - 系统会生成专业的英文推荐信
   - 支持一键导出为 DOCX 文件

5. **记录投递**
   - 生成推荐信后，可以记录投递信息
   - 系统会自动识别公司名称和职位

6. **查看统计**
   - 在"投递记录"页面查看历史记录
   - 支持日历视图和岗位统计图表
   - 支持按年/月/日筛选数据

### 高级功能

- **自定义提示词**：为简历优化和推荐信生成分别设置自定义提示词模板
- **数据导出**：支持将投递记录导出为 CSV 或 JSON 格式
- **岗位统计**：可视化查看每个岗位的投递数量

## 📁 项目结构

```
简历大师/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   │   ├── ResumeUpload.jsx      # 简历上传组件
│   │   ├── JobDescription.jsx    # 岗位描述组件
│   │   ├── OptimizedResume.jsx   # 优化后简历组件
│   │   ├── CoverLetter.jsx       # 推荐信组件
│   │   ├── ApplicationHistory.jsx # 投递记录组件
│   │   └── ...
│   ├── utils/              # 工具函数
│   ├── App.jsx            # 主应用组件
│   └── main.jsx           # 入口文件
├── server/                 # 后端源代码
│   ├── services/          # 业务逻辑服务
│   │   ├── resumeService.js      # 简历优化服务
│   │   ├── coverLetterService.js # 推荐信生成服务
│   │   └── jobInfoExtractor.js   # 岗位信息提取服务
│   ├── utils/             # 工具函数
│   │   └── fileParser.js  # 文件解析工具
│   └── index.js           # 服务器入口
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置
├── tailwind.config.js     # Tailwind CSS 配置
├── .env                   # 环境变量（需要自己创建）
├── 启动.bat               # Windows 一键启动脚本
├── 启动.ps1               # PowerShell 启动脚本
└── README.md             # 说明文档
```

## ⚙️ 环境变量配置

创建 `.env` 文件并配置以下变量：

| 变量名 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ | - |
| `PORT` | 后端服务器端口 | ❌ | 3001 |

## 🔧 常见问题

### 问题 1：提示"未检测到 Node.js"
**解决方案**：
- 访问 [Node.js 官网](https://nodejs.org/) 下载并安装 Node.js
- 推荐安装 LTS（长期支持）版本
- 安装完成后重启命令行窗口

### 问题 2：端口被占用
**解决方案**：
1. 修改 `.env` 文件中的 `PORT` 值（例如改为 3002）
2. 或关闭占用端口的程序：
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <进程ID> /F
   ```

### 问题 3：依赖安装失败
**解决方案**：
1. 检查网络连接
2. 尝试使用国内镜像：
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```
3. 清除缓存后重试：
   ```bash
   npm cache clean --force
   npm install
   ```

### 问题 4：API 密钥错误
**解决方案**：
- 检查 `.env` 文件中的 `OPENAI_API_KEY` 是否正确
- 确认 API 密钥是否有效且有足够的余额
- 检查 API 密钥是否已过期或被撤销

### 问题 5：文件上传失败
**解决方案**：
- 确保文件格式为 PDF 或 Word（.doc, .docx）
- 检查文件大小是否超过 10MB
- 检查文件是否损坏

### 问题 6：后端服务器连接失败
**解决方案**：
1. 确认后端服务器已启动（查看终端输出）
2. 检查端口是否正确（默认 3001）
3. 查看终端中的错误信息，根据提示解决

## 📝 开发说明

### 可用脚本

```bash
# 同时启动前端和后端
npm run dev

# 仅启动后端服务器
npm run dev:server

# 仅启动前端开发服务器
npm run dev:client

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 修改端口

如果需要修改端口，编辑 `.env` 文件：
```env
PORT=3002  # 修改为你想要的端口
```

同时需要修改 `vite.config.js` 中的代理配置（如果修改了后端端口）。

## ⚠️ 注意事项

- **API 密钥安全**：请勿将 `.env` 文件提交到 Git 仓库，已包含在 `.gitignore` 中
- **API 费用**：使用 OpenAI API 会产生费用，建议设置使用限额
- **文件安全**：上传的文件会在解析后自动删除，不会永久存储
- **数据存储**：投递记录存储在浏览器本地（localStorage），清除浏览器数据会丢失记录

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [OpenAI](https://openai.com/) - 提供强大的 AI API
- [React](https://react.dev/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

如有问题或建议，欢迎提交 [Issue](https://github.com/WangliZhang77/Jianli-master/issues)！
