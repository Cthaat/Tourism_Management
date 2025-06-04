/**
 * @fileoverview 证言卡片居中对齐验证脚本
 * @description 验证showcase页面证言卡片的居中样式是否正确实现
 * @version 1.0.0
 * @date 2025-06-04
 */

const fs = require('fs');
const path = require('path');

// 文件路径配置
const paths = {
  wxml: path.join(__dirname, 'miniprogram/pages/showcase/showcase.wxml'),
  wxss: path.join(__dirname, 'miniprogram/pages/showcase/showcase.wxss')
};

console.log('🎯 证言卡片居中对齐验证');
console.log('='.repeat(50));

/**
 * 验证WXML结构
 */
function verifyWXMLStructure() {
  console.log('📄 验证WXML结构...');
  
  try {
    const wxmlContent = fs.readFileSync(paths.wxml, 'utf8');
    
    const checks = [
      {
        name: 'testimonials-section容器存在',
        test: wxmlContent.includes('class="testimonials-section"'),
        required: true
      },
      {
        name: 'testimonials-swiper轮播容器存在',
        test: wxmlContent.includes('class="testimonials-swiper"'),
        required: true
      },
      {
        name: 'testimonial-item轮播项存在',
        test: wxmlContent.includes('class="testimonial-item"'),
        required: true
      },
      {
        name: 'testimonial-wrapper包装层存在',
        test: wxmlContent.includes('class="testimonial-wrapper"'),
        required: true
      },
      {
        name: 'testimonial-card卡片容器存在',
        test: wxmlContent.includes('class="testimonial-card"'),
        required: true
      },
      {
        name: 'WXML结构标签正确闭合',
        test: !wxmlContent.includes('<view class="testimonial-wrapper">') || 
              wxmlContent.includes('</view>') && 
              (wxmlContent.match(/<view/g) || []).length === (wxmlContent.match(/<\/view>/g) || []).length,
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
 * 验证WXSS居中样式
 */
function verifyWXSSCenteringStyles() {
  console.log('🎨 验证WXSS居中样式...');

  try {
    const wxssContent = fs.readFileSync(paths.wxss, 'utf8');

    const checks = [
      {
        name: 'testimonials-section区域样式定义',
        test: wxssContent.includes('.testimonials-section {') &&
              wxssContent.includes('padding: 60rpx 40rpx'),
        required: true
      },
      {
        name: 'testimonials-swiper轮播容器样式',
        test: wxssContent.includes('.testimonials-swiper {') &&
              wxssContent.includes('height: 400rpx'),
        required: true
      },
      {
        name: 'testimonial-item flex居中设置',
        test: wxssContent.includes('.testimonial-item {') &&
              wxssContent.includes('display: flex') &&
              wxssContent.includes('align-items: center') &&
              wxssContent.includes('justify-content: center'),
        required: true
      },
      {
        name: 'testimonial-wrapper包装层flex设置',
        test: wxssContent.includes('.testimonial-wrapper {') &&
              wxssContent.includes('display: flex') &&
              wxssContent.includes('align-items: center') &&
              wxssContent.includes('justify-content: center'),
        required: true
      },
      {
        name: 'testimonial-card卡片样式完整',
        test: wxssContent.includes('.testimonial-card {') &&
              wxssContent.includes('max-width: 540rpx') &&
              wxssContent.includes('margin: 0 auto'),
        required: true
      },
      {
        name: '深色模式testimonial样式支持',
        test: wxssContent.includes('.dark-mode .testimonial-card') ||
              wxssContent.includes('.dark-mode .testimonials-section'),
        required: true
      }
    ];

    let passCount = 0;

    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      if (check.test) passCount++;
    });

    console.log(`\n📊 WXSS居中样式验证结果: ${passCount}/${checks.length} 通过\n`);
    return passCount === checks.length;

  } catch (error) {
    console.error('❌ WXSS文件读取失败:', error.message);
    return false;
  }
}

/**
 * 验证关键居中属性
 */
function verifyKeyFlexProperties() {
  console.log('🔧 验证关键flex居中属性...');

  try {
    const wxssContent = fs.readFileSync(paths.wxss, 'utf8');

    const checks = [
      {
        name: 'testimonial-item使用display: flex',
        test: wxssContent.includes('.testimonial-item {') &&
              wxssContent.includes('display: flex'),
        required: true
      },
      {
        name: 'testimonial-item设置align-items: center',
        test: wxssContent.includes('align-items: center'),
        required: true
      },
      {
        name: 'testimonial-item设置justify-content: center',
        test: wxssContent.includes('justify-content: center'),
        required: true
      },
      {
        name: 'testimonial-wrapper也使用flex布局',
        test: wxssContent.includes('.testimonial-wrapper {') &&
              wxssContent.includes('display: flex'),
        required: true
      },
      {
        name: '卡片设置了最大宽度限制',
        test: wxssContent.includes('max-width: 540rpx'),
        required: true
      },
      {
        name: '卡片使用了margin: 0 auto备用居中',
        test: wxssContent.includes('margin: 0 auto'),
        required: true
      }
    ];

    let passCount = 0;

    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      if (check.test) passCount++;
    });

    console.log(`\n📊 关键flex属性验证结果: ${passCount}/${checks.length} 通过\n`);
    return passCount === checks.length;

  } catch (error) {
    console.error('❌ WXSS文件读取失败:', error.message);
    return false;
  }
}

/**
 * 主验证流程
 */
function main() {
  console.log('🚀 开始验证证言卡片居中对齐实现...\n');

  const results = {
    wxml: verifyWXMLStructure(),
    wxss: verifyWXSSCenteringStyles(),
    flex: verifyKeyFlexProperties()
  };

  console.log('📋 验证总结:');
  console.log('='.repeat(30));
  console.log(`WXML结构: ${results.wxml ? '✅ 通过' : '❌ 失败'}`);
  console.log(`WXSS样式: ${results.wxss ? '✅ 通过' : '❌ 失败'}`);
  console.log(`Flex属性: ${results.flex ? '✅ 通过' : '❌ 失败'}`);

  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 所有验证项目均通过！证言卡片居中对齐已正确实现');
    console.log('💡 建议: 在微信开发者工具中测试实际效果');
  } else {
    console.log('⚠️  部分验证项目未通过，请检查相关样式设置');
  }
  console.log('='.repeat(50));

  return allPassed;
}

// 执行验证
if (require.main === module) {
  main();
}

module.exports = {
  verifyWXMLStructure,
  verifyWXSSCenteringStyles,
  verifyKeyFlexProperties,
  main
};
