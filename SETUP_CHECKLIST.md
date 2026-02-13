# 项目设置检查清单

## ✅ 需要完成的步骤

### 1. 创建 .env 文件
在项目根目录创建 `.env` 文件，内容如下：
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

### 2. 安装依赖
运行以下命令：
```bash
npm install
```

### 3. 启动项目
运行以下命令：
```bash
npm run dev
```

这将同时启动：
- 前端服务器：http://localhost:3000
- 后端服务器：http://localhost:3001

## 🔍 验证项目是否正常

1. 打开浏览器访问 http://localhost:3000
2. 应该能看到"简历大师"的界面
3. 尝试上传简历或粘贴文本
4. 输入岗位描述
5. 点击"优化简历"按钮测试功能

## ⚠️ 常见问题

- 如果提示找不到模块，运行 `npm install`
- 如果提示 API 密钥错误，检查 `.env` 文件是否正确
- 如果端口被占用，修改 `.env` 中的 PORT 值
