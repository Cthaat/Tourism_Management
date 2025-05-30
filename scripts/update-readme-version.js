/**
 * @fileoverview 自动更新README.md版本号脚本
 * @description 从version.js配置文件中读取版本号，自动更新README.md中的版本标签
 * @version 1.0.0
 * @date 2025-05-30
 * @author Tourism_Management开发团队
 */

const fs = require('fs');
const path = require('path');

/**
 * 从version.js文件中提取版本号
 * @returns {string} 版本号
 */
function getVersionFromConfig() {
  try {
    const versionFilePath = path.join(__dirname, '..', 'miniprogram', 'config', 'version.js');
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');

    // 匹配版本号的正则表达式
    const versionMatch = versionFileContent.match(/version:\s*['"]([^'"]+)['"]/);

    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    } else {
      throw new Error('无法从version.js文件中提取版本号');
    }
  } catch (error) {
    console.error('读取版本配置文件失败:', error.message);
    process.exit(1);
  }
}

/**
 * 更新README.md文件中的版本号
 * @param {string} newVersion 新版本号
 */
function updateReadmeVersion(newVersion) {
  try {
    const readmePath = path.join(__dirname, '..', 'README.md');
    let readmeContent = fs.readFileSync(readmePath, 'utf8');

    // 匹配版本标签的正则表达式
    const versionBadgeRegex = /(\[!\[小程序版本\]\(https:\/\/img\.shields\.io\/badge\/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E7%89%88%E6%9C%AC-v)[^-]+(-blue\.svg\)\]\(https:\/\/github\.com\/Tourism-Management\))/;

    // 替换版本号
    const updatedContent = readmeContent.replace(versionBadgeRegex, `$1${newVersion}$2`);

    // 检查是否成功替换
    if (updatedContent === readmeContent) {
      console.warn('⚠️  未找到版本标签或版本号未发生变化');
      return false;
    }

    // 写入更新后的内容
    fs.writeFileSync(readmePath, updatedContent, 'utf8');
    console.log(`✅ README.md版本号已更新为: v${newVersion}`);
    return true;

  } catch (error) {
    console.error('❌ 更新README.md失败:', error.message);
    process.exit(1);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始更新README.md版本号...');

  // 从配置文件获取当前版本号
  const currentVersion = getVersionFromConfig();
  console.log(`📋 从配置文件读取到版本号: v${currentVersion}`);

  // 更新README.md
  const updated = updateReadmeVersion(currentVersion);

  if (updated) {
    console.log('🎉 版本号更新完成！');
  } else {
    console.log('ℹ️  无需更新版本号');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  getVersionFromConfig,
  updateReadmeVersion,
  main
};
