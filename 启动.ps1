# 简历大师 - PowerShell 启动脚本
$ErrorActionPreference = "Stop"

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   简历大师 - 智能简历优化工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 是否安装
Write-Host "[1/4] 检查 Node.js 版本..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按 Enter 键退出"
    exit 1
}
Write-Host ""

# 检查 .env 文件
Write-Host "[2/4] 检查环境变量配置..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "[警告] .env 文件不存在！" -ForegroundColor Yellow
    Write-Host "正在创建 .env 文件..." -ForegroundColor Yellow
    
    $envContent = @"
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
"@
    
    Set-Content -Path ".env" -Value $envContent -Encoding UTF8
    Write-Host "[成功] .env 文件已创建" -ForegroundColor Green
} else {
    Write-Host "[成功] .env 文件已存在" -ForegroundColor Green
}
Write-Host ""

# 检查 node_modules
Write-Host "[3/4] 检查依赖包..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "[信息] 检测到依赖包未安装，正在安装..." -ForegroundColor Yellow
    Write-Host "这可能需要几分钟时间，请耐心等待..." -ForegroundColor Yellow
    
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 依赖安装失败，请检查网络连接" -ForegroundColor Red
        Read-Host "按 Enter 键退出"
        exit 1
    }
    Write-Host "[成功] 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "[成功] 依赖包已安装" -ForegroundColor Green
}
Write-Host ""

# 启动项目
Write-Host "[4/4] 正在启动项目..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   项目启动中，请稍候..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "前端地址: http://localhost:3000" -ForegroundColor Green
Write-Host "后端地址: http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 可以停止服务器" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
