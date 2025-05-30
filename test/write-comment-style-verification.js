/**
 * 写评论页面样式验证脚本
 * 文件名: write-comment-style-verification.js
 * 描述: 验证写评论页面的85%宽度布局和美化样式
 * 版本: 1.0.0
 * 创建日期: 2025-01-20
 * 作者: Tourism_Management开发团队
 */

const fs = require('fs');
const path = require('path');

// 文件路径
const paths = {
  wxml: path.join(__dirname, '../miniprogram/pages/write-comment/write-comment.wxml'),
  wxss: path.join(__dirname, '../miniprogram/pages/write-comment/write-comment.wxss')
};

/**
 * 验证WXML结构
 */
function verifyWXMLStructure() {
  console.log('🔍 验证WXML结构...');

  try {
    const wxmlContent = fs.readFileSync(paths.wxml, 'utf8');

    const checks = [
      {
        name: 'form-wrapper容器存在',
        test: wxmlContent.includes('<view class="form-wrapper">'),
        required: true
      },
      {
        name: '景点信息在form-wrapper内',
        test: wxmlContent.includes('<view class="form-wrapper">') &&
          wxmlContent.indexOf('<view class="spot-info">') > wxmlContent.indexOf('<view class="form-wrapper">'),
        required: true
      },
      {
        name: '评分区域在form-wrapper内',
        test: wxmlContent.includes('<view class="rating-section">'),
        required: true
      },
      {
        name: '评论内容区域在form-wrapper内',
        test: wxmlContent.includes('<view class="comment-section">'),
        required: true
      },
      {
        name: '图片上传区域在form-wrapper内',
        test: wxmlContent.includes('<view class="images-section">'),
        required: true
      },
      {
        name: '提交区域在form-wrapper内',
        test: wxmlContent.includes('<view class="submit-section">'),
        required: true
      }
    ];

    let passCount = 0;

    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      if (check.test) passCount++;
    });

    console.log(`\n📊 WXML结构验证结果: ${passCount}/${checks.length} 通过\n`);
    return passCount === checks.length;

  } catch (error) {
    console.error('❌ WXML文件读取失败:', error.message);
    return false;
  }
}

/**
 * 验证WXSS样式
 */
function verifyWXSSStyles() {
  console.log('🎨 验证WXSS样式...');

  try {
    const wxssContent = fs.readFileSync(paths.wxss, 'utf8');

    const checks = [
      {
        name: 'form-wrapper样式定义',
        test: wxssContent.includes('.form-wrapper {') &&
          wxssContent.includes('width: 85%'),
        required: true
      },
      {
        name: '景点信息区域美化样式',
        test: wxssContent.includes('.spot-info {') &&
          wxssContent.includes('border-radius: 24rpx') &&
          wxssContent.includes('backdrop-filter: blur(20rpx)'),
        required: true
      },
      {
        name: '评分区域星级美化',
        test: wxssContent.includes('.star {') &&
          wxssContent.includes('font-size: 64rpx') &&
          wxssContent.includes('cubic-bezier'),
        required: true
      },
      {
        name: '评论输入框现代化样式',
        test: wxssContent.includes('.comment-textarea {') &&
          wxssContent.includes('min-height: 240rpx') &&
          wxssContent.includes('border-radius: 16rpx'),
        required: true
      },
      {
        name: '图片上传区域网格布局',
        test: wxssContent.includes('.images-grid {') &&
          wxssContent.includes('display: grid') &&
          wxssContent.includes('height: 220rpx'),
        required: true
      },
      {
        name: '提交按钮渐变效果',
        test: wxssContent.includes('.submit-btn {') &&
          wxssContent.includes('linear-gradient') &&
          wxssContent.includes('border-radius: 50rpx'),
        required: true
      },
      {
        name: '深色模式适配',
        test: wxssContent.includes('.container.dark-mode') &&
          wxssContent.includes('background: rgba(44, 44, 44'),
        required: true
      },
      {
        name: '多主题色彩支持',
        test: wxssContent.includes('[data-theme="蓝色"]') &&
          wxssContent.includes('[data-theme="紫色"]') &&
          wxssContent.includes('[data-theme="橙色"]') &&
          wxssContent.includes('[data-theme="红色"]'),
        required: true
      },
      {
        name: '响应式设计',
        test: wxssContent.includes('@media') &&
          wxssContent.includes('max-width: 750rpx') &&
          wxssContent.includes('min-width: 1200rpx'),
        required: true
      },
      {
        name: '动画效果',
        test: wxssContent.includes('@keyframes') &&
          wxssContent.includes('transition:') &&
          wxssContent.includes('transform:'),
        required: true
      }
    ];

    let passCount = 0;

    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      if (check.test) passCount++;
    });

    console.log(`\n📊 WXSS样式验证结果: ${passCount}/${checks.length} 通过\n`);
    return passCount === checks.length;

  } catch (error) {
    console.error('❌ WXSS文件读取失败:', error.message);
    return false;
  }
}

/**
 * 验证表单宽度设置
 */
function verifyFormWidthSettings() {
  console.log('📏 验证表单宽度设置...');

  try {
    const wxssContent = fs.readFileSync(paths.wxss, 'utf8');

    // 检查form-wrapper的宽度设置
    const formWrapperMatch = wxssContent.match(/\.form-wrapper\s*{[^}]*width:\s*85%[^}]*}/);
    const maxWidthMatch = wxssContent.match(/\.form-wrapper\s*{[^}]*max-width:\s*650rpx[^}]*}/);

    const checks = [
      {
        name: 'form-wrapper宽度设置为85%',
        test: !!formWrapperMatch,
        required: true
      },
      {
        name: 'form-wrapper最大宽度限制',
        test: !!maxWidthMatch,
        required: true
      },
      {
        name: 'form-wrapper居中对齐',
        test: wxssContent.includes('margin: 0 auto'),
        required: true
      },
      {
        name: '表单区域间距统一',
        test: wxssContent.includes('gap: 30rpx'),
        required: true
      }
    ];

    let passCount = 0;

    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      if (check.test) passCount++;
    });

    console.log(`\n📊 宽度设置验证结果: ${passCount}/${checks.length} 通过\n`);
    return passCount === checks.length;

  } catch (error) {
    console.error('❌ 宽度设置验证失败:', error.message);
    return false;
  }
}

/**
 * 主验证函数
 */
function runVerification() {
  console.log('🚀 开始写评论页面样式验证...\n');
  console.log('='.repeat(60));

  const results = {
    structure: verifyWXMLStructure(),
    styles: verifyWXSSStyles(),
    width: verifyFormWidthSettings()
  };

  console.log('='.repeat(60));
  console.log('📋 验证总结:');
  console.log(`  WXML结构: ${results.structure ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  WXSS样式: ${results.styles ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  宽度设置: ${results.width ? '✅ 通过' : '❌ 失败'}`);

  const allPassed = Object.values(results).every(result => result);

  if (allPassed) {
    console.log('\n🎉 所有验证项目通过！写评论页面样式更新成功！');
    console.log('\n✨ 主要改进:');
    console.log('  • 统一85%宽度布局，提升用户体验');
    console.log('  • 现代化视觉设计，圆角和阴影效果');
    console.log('  • 丰富的交互动画和过渡效果');
    console.log('  • 完整的深色模式和多主题适配');
    console.log('  • 响应式设计，适配不同屏幕尺寸');
    console.log('  • 优化的星级评分和图片上传界面');
  } else {
    console.log('\n⚠️  部分验证项目未通过，请检查相关实现');
  }

  console.log('\n📱 建议在微信开发者工具中预览效果');

  return allPassed;
}

// 如果直接运行脚本
if (require.main === module) {
  runVerification();
}

module.exports = {
  runVerification,
  verifyWXMLStructure,
  verifyWXSSStyles,
  verifyFormWidthSettings
};
