@echo off
chcp 65001 >nul
title 清除缓存并启动服务器

echo ========================================
echo    清除 Node.js 缓存并启动服务器
echo ========================================
echo.

echo [1/3] 清除 Node.js 缓存...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✅ 已清除 node_modules 缓存
) else (
    echo ℹ️  没有找到缓存目录
)
echo.

echo [2/3] 验证环境变量...
node verify-env.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ 环境变量验证失败，请检查 .env 文件
    pause
    exit /b 1
)
echo.

echo [3/3] 启动服务器...
echo.
call npm run dev

pause
