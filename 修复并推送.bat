@echo off
chcp 65001 >nul
echo ============================================
echo 修复 API Key 并推送到 GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] 添加修改后的文件...
git add .
if errorlevel 1 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)
echo ✅ 文件已添加
echo.

echo [2/4] 修改最后一次提交...
git commit --amend -m "Initial commit: 简历大师项目"
if errorlevel 1 (
    echo ⚠️  提交修改失败，可能没有更改
) else (
    echo ✅ 提交已修改
)
echo.

echo [3/4] 检查远程仓库...
git remote -v
echo.

echo [4/4] 强制推送到 GitHub...
echo ⚠️  注意：这将覆盖远程仓库的历史记录
echo.
set /p confirm="确认推送？(Y/N): "
if /i not "%confirm%"=="Y" (
    echo 已取消推送
    pause
    exit /b 0
)

git push -u origin main --force
if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 可能的原因：
    echo 1. 需要配置 GitHub 认证（Personal Access Token）
    echo 2. 网络连接问题
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
