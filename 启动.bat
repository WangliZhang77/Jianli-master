@echo off
chcp 65001 >nul
title 简历大师 - 启动脚本

echo ========================================
echo    简历大师 - 智能简历优化工具
echo ========================================
echo.

:: 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] 检查 Node.js 版本...
node --version
echo.

:: 检查 .env 文件
echo [2/4] 检查环境变量配置...
if not exist .env (
    echo [警告] .env 文件不存在！
    echo 正在创建 .env 文件...
    (
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo PORT=3001
    ) > .env
    echo [成功] .env 文件已创建
) else (
    echo [成功] .env 文件已存在
)
echo.

:: 检查 node_modules
echo [3/4] 检查依赖包...
if not exist node_modules (
    echo [信息] 检测到依赖包未安装，正在安装...
    echo 这可能需要几分钟时间，请耐心等待...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
) else (
    echo [成功] 依赖包已安装
)
echo.

:: 启动项目
echo [4/4] 正在启动项目...
echo.
echo ========================================
echo    项目启动中，请稍候...
echo ========================================
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 按 Ctrl+C 可以停止服务器
echo ========================================
echo.

call npm run dev

pause
