@echo off
echo ====================================
echo    旅游管理小程序评论功能测试
echo ====================================
echo.
echo 正在检查项目结构...

if exist "miniprogram\pages\detail\detail.js" (
    echo ✅ 详情页面文件存在
) else (
    echo ❌ 详情页面文件缺失
    goto :error
)

if exist "miniprogram\components\comment-card\comment-card.js" (
    echo ✅ 评论卡片组件存在
) else (
    echo ❌ 评论卡片组件缺失
    goto :error
)

if exist "miniprogram\pages\write-comment\write-comment.js" (
    echo ✅ 写评论页面存在
) else (
    echo ❌ 写评论页面缺失
    goto :error
)

echo.
echo ✅ 所有必要文件检查通过！
echo.
echo 📋 接下来的测试步骤：
echo 1. 打开微信开发者工具
echo 2. 导入项目目录: %CD%
echo 3. 编译并运行小程序
echo 4. 导航到任意景点详情页面
echo 5. 测试评论功能
echo.
echo 📖 详细测试指南请查看: 评论功能演示指南.md
echo.
pause
goto :end

:error
echo.
echo ❌ 项目文件检查失败，请确保所有必要文件都存在
echo.
pause

:end
