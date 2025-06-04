// 证言卡片样式验证脚本
console.log('=== 证言卡片样式验证开始 ===');

// 验证CSS文件是否存在必要的样式类
const fs = require('fs');
const path = require('path');

const showcaseWxssPath = path.join(__dirname, 'miniprogram/pages/showcase/showcase.wxss');

try {
  const content = fs.readFileSync(showcaseWxssPath, 'utf8');

  const requiredClasses = [
    '.testimonials-section',
    '.testimonials-swiper',
    '.testimonial-item',
    '.testimonial-card',
    '.testimonial-content',
    '.testimonial-author',
    '.rating-stars',
    '.star',
    '.star.active'
  ];

  console.log('检查必要的CSS类：');
  requiredClasses.forEach(className => {
    const exists = content.includes(className + ' {') || content.includes(className + '{');
    console.log(`${className}: ${exists ? '✅ 存在' : '❌ 缺失'}`);
  });

  // 检查居中相关样式
  console.log('\n检查居中样式：');
  const centeringStyles = [
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'max-width: 560rpx'
  ];

  centeringStyles.forEach(style => {
    const exists = content.includes(style);
    console.log(`${style}: ${exists ? '✅ 存在' : '❌ 缺失'}`);
  });

  // 检查暗色模式样式
  console.log('\n检查暗色模式样式：');
  const darkModeClasses = [
    '.dark-mode .testimonials-section',
    '.dark-mode .testimonial-card',
    '.dark-mode .testimonial-text',
    '.dark-mode .star.active'
  ];

  darkModeClasses.forEach(className => {
    const exists = content.includes(className);
    console.log(`${className}: ${exists ? '✅ 存在' : '❌ 缺失'}`);
  });

  console.log('\n=== 验证完成 ===');

} catch (error) {
  console.error('❌ 读取文件失败:', error.message);
}
