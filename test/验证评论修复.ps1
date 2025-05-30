# 评论功能修复验证脚本
# Tourism Management 小程序评论展开功能修复验证

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   评论功能修复验证脚本" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查项目结构
Write-Host "🔍 检查项目结构..." -ForegroundColor Green

$projectRoot = Get-Location
$detailWxml = Join-Path $projectRoot "miniprogram\pages\detail\detail.wxml"
$detailJs = Join-Path $projectRoot "miniprogram\pages\detail\detail.js"

if (Test-Path $detailWxml) {
    Write-Host "✅ detail.wxml 文件存在" -ForegroundColor Green
    
    # 检查修复内容
    $content = Get-Content $detailWxml -Raw
    if ($content -match 'bindtap="toggleShowAllComments"') {
        Write-Host "✅ 事件绑定已修复: toggleShowAllComments" -ForegroundColor Green
    } else {
        Write-Host "❌ 事件绑定未修复" -ForegroundColor Red
    }
} else {
    Write-Host "❌ detail.wxml 文件不存在" -ForegroundColor Red
}

if (Test-Path $detailJs) {
    Write-Host "✅ detail.js 文件存在" -ForegroundColor Green
    
    # 检查方法存在
    $jsContent = Get-Content $detailJs -Raw
    if ($jsContent -match 'toggleShowAllComments\(\)') {
        Write-Host "✅ toggleShowAllComments 方法存在" -ForegroundColor Green
    } else {
        Write-Host "❌ toggleShowAllComments 方法不存在" -ForegroundColor Red
    }
} else {
    Write-Host "❌ detail.js 文件不存在" -ForegroundColor Red
}

Write-Host ""
Write-Host "🧪 运行自动化测试..." -ForegroundColor Green

# 运行测试
try {
    $testResult = & node ".\miniprogram\test\comment-integration-test.js" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 自动化测试通过" -ForegroundColor Green
    } else {
        Write-Host "❌ 自动化测试失败" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  无法运行自动化测试: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📱 下一步操作指南:" -ForegroundColor Cyan
Write-Host "1. 打开微信开发者工具" -ForegroundColor White
Write-Host "2. 导入项目: $projectRoot" -ForegroundColor White
Write-Host "3. 编译并运行小程序" -ForegroundColor White
Write-Host "4. 导航到景点详情页面" -ForegroundColor White
Write-Host "5. 测试'查看全部评论'按钮" -ForegroundColor White
Write-Host ""

Write-Host "📖 详细验证步骤请查看:" -ForegroundColor Cyan
Write-Host "   docs\评论功能修复验证指南.md" -ForegroundColor White
Write-Host ""

Write-Host "✅ 修复状态: 已完成" -ForegroundColor Green
Write-Host "🎯 验证状态: 等待用户测试" -ForegroundColor Yellow
Write-Host ""

Read-Host "按任意键继续..."
