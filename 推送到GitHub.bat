@echo off
chcp 65001 >nul
echo ============================================
echo 推送到 GitHub 仓库
echo ============================================
echo.

cd /d "%~dp0"

echo [1/5] 检查 Git 是否已安装...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git 未安装，请先安装 Git
    pause
    exit /b 1
)
echo ✅ Git 已安装
echo.

echo [2/5] 初始化 Git 仓库（如果尚未初始化）...
if not exist ".git" (
    echo 正在初始化 Git 仓库...
    git init
    echo ✅ Git 仓库已初始化
) else (
    echo ✅ Git 仓库已存在
)
echo.

echo [3/5] 检查远程仓库配置...
git remote -v | findstr "origin" >nul
if errorlevel 1 (
    echo 正在添加远程仓库...
    git remote add origin https://github.com/WangliZhang77/Jianli-master.git
    echo ✅ 远程仓库已添加
) else (
    echo 检查现有远程仓库...
    git remote set-url origin https://github.com/WangliZhang77/Jianli-master.git
    echo ✅ 远程仓库已更新
)
echo.

echo [4/5] 添加文件到暂存区...
git add .
echo ✅ 文件已添加到暂存区
echo.

echo [5/5] 提交并推送代码...
echo.
set /p commit_msg="请输入提交信息（直接回车使用默认信息）: "
if "%commit_msg%"=="" set commit_msg=Initial commit: 简历大师项目

git commit -m "%commit_msg%"
if errorlevel 1 (
    echo.
    echo ⚠️  提交失败，可能没有更改需要提交
    echo 继续尝试推送...
) else (
    echo ✅ 代码已提交
)
echo.

echo 正在推送到 GitHub...
git branch -M main
git push -u origin main
if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 可能的原因：
    echo 1. 需要配置 Git 用户信息
    echo 2. 需要配置 GitHub 认证（Personal Access Token）
    echo 3. 网络连接问题
    echo.
    echo 请检查：
    echo - Git 用户配置: git config --global user.name "你的名字"
    echo - Git 邮箱配置: git config --global user.email "你的邮箱"
    echo - GitHub 认证: 使用 Personal Access Token 或 SSH 密钥
    echo.
) else (
    echo.
    echo ✅✅✅ 推送成功！✅✅✅
    echo.
    echo 你的代码已成功推送到：
    echo https://github.com/WangliZhang77/Jianli-master.git
    echo.
)

pause
