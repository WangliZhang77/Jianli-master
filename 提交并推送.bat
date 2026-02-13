@echo off
chcp 65001 >nul
echo ============================================
echo 提交并推送到 GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] 添加所有更改的文件...
git add .
if errorlevel 1 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)
echo ✅ 文件已添加
echo.

echo [2/4] 提交更改...
git commit -m "优化项目：删除无关脚本，完善 README 文档"
if errorlevel 1 (
    echo ⚠️  提交失败，可能没有更改需要提交
) else (
    echo ✅ 更改已提交
)
echo.

echo [3/4] 检查远程仓库...
git remote -v
echo.

echo [4/4] 推送到 GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 可能的原因：
    echo 1. 需要配置 GitHub 认证（Personal Access Token）
    echo 2. 网络连接问题
    echo 3. 远程仓库有新的提交，需要先拉取
    echo.
    echo 如果远程有新的提交，可以尝试：
    echo   git pull origin main --rebase
    echo   git push origin main
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
