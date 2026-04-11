#!/usr/bin/env node

/**
 * @fileoverview 版本号更新脚本
 * @description 批量更新项目中的版本号，包括 version.js, package.json, README.md 等
 * @version 1.0.0
 * @date 2026-04-11
 * @author AI Agent
 */

const fs = require('fs');
const path = require('path');

/**
 * 验证版本号格式
 * @param {string} version 版本号
 * @returns {boolean} 是否有效
 */
function validateVersion(version) {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

/**
 * 获取当前版本号
 * @returns {string} 当前版本号
 */
function getCurrentVersion() {
  try {
    const versionFilePath = path.join(__dirname, '..', 'miniprogram', 'config', 'version.js');
    const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
    const versionMatch = versionFileContent.match(/version:\s*['"]([^'"]+)['"]/);

    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    } else {
      throw new Error('无法从version.js文件中提取版本号');
    }
  } catch (error) {
    console.error('读取当前版本失败:', error.message);
    process.exit(1);
  }
}

/**
 * 更新 miniprogram/config/version.js 中的版本号
 * @param {string} newVersion 新版本号
 */
function updateVersionJs(newVersion) {
  try {
    const versionFilePath = path.join(__dirname, '..', 'miniprogram', 'config', 'version.js');
    let versionFileContent = fs.readFileSync(versionFilePath, 'utf8');

    // 更新版本号行
    versionFileContent = versionFileContent.replace(
      /version:\s*['"][^'"]+['"]/,
      `version: '${newVersion}'`
    );

    // 更新 @version 注释（如果存在）
    versionFileContent = versionFileContent.replace(
      /@version\s+[\d.]+/,
      `@version ${newVersion}`
    );

    fs.writeFileSync(versionFilePath, versionFileContent, 'utf8');
    console.log(`✅ miniprogram/config/version.js 已更新为 v${newVersion}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新 version.js 失败:`, error.message);
    return false;
  }
}

/**
 * 更新 package.json 中的版本号
 * @param {string} newVersion 新版本号
 */
function updatePackageJson(newVersion) {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    let packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageContent);

    // 更新版本号
    packageJson.version = newVersion;

    // 写回文件（保持格式）
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log(`✅ package.json 已更新为 v${newVersion}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新 package.json 失败:`, error.message);
    return false;
  }
}

/**
 * 更新 README.md 中的版本号
 * @param {string} newVersion 新版本号
 */
function updateReadmeVersion(newVersion) {
  try {
    const readmePath = path.join(__dirname, '..', 'README.md');
    let readmeContent = fs.readFileSync(readmePath, 'utf8');

    // 匹配版本标签的正则表达式（shields.io badge）
    const versionBadgeRegex = /(\[!\[小程序版本\]\(https:\/\/img\.shields\.io\/badge\/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E7%89%88%E6%9C%AC-v)[^-]+(-blue\.svg\)\]\(https:\/\/github\.com\/Tourism-Management\))/;

    const updatedContent = readmeContent.replace(versionBadgeRegex, `$1${newVersion}$2`);

    // 检查是否成功替换
    if (updatedContent !== readmeContent) {
      fs.writeFileSync(readmePath, updatedContent, 'utf8');
      console.log(`✅ README.md 版本号已更新为 v${newVersion}`);
      return true;
    } else {
      console.log(`ℹ️  README.md 中未找到版本标签，跳过更新`);
      return true;
    }
  } catch (error) {
    console.error(`❌ 更新 README.md 失败:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  // 显示使用说明
  if (args.length === 0) {
    console.log('📋 版本号更新脚本使用说明:');
    console.log('');
    console.log('用法: node scripts/update-version.js <新版本号>');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/update-version.js 1.6.0');
    console.log('');
    const currentVersion = getCurrentVersion();
    console.log(`当前版本: v${currentVersion}`);
    return;
  }

  const newVersion = args[0];

  // 验证版本号格式
  if (!validateVersion(newVersion)) {
    console.error('❌ 版本号格式错误! 请使用 x.y.z 格式，如: 1.6.0');
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();

  // 检查版本号是否相同
  if (currentVersion === newVersion) {
    console.log(`ℹ️  当前实际版本已为 v${newVersion}，无需更新`);
    return;
  }

  console.log('');
  console.log('🚀 开始更新版本号...');
  console.log(`📋 当前版本: v${currentVersion}`);
  console.log(`🎯 目标版本: v${newVersion}`);
  console.log('');
  console.log('🔄 即将更新以下文件:');
  console.log('   1. miniprogram/config/version.js');
  console.log('   2. package.json');
  console.log('   3. README.md（如果存在版本标签）');
  console.log('');

  // 执行更新
  let allSuccess = true;

  allSuccess &= updateVersionJs(newVersion);
  allSuccess &= updatePackageJson(newVersion);
  allSuccess &= updateReadmeVersion(newVersion);

  console.log('');

  if (allSuccess) {
    console.log('✅ 所有版本号已成功更新!');
    console.log('');
    console.log('📝 后续步骤:');
    console.log('   1. 检查修改: git status');
    console.log('   2. 提交修改: git add -A && git commit -m "版本: 更新到 v' + newVersion + '"');
    console.log('   3. 创建标签: git tag v' + newVersion);
    console.log('   4. 推送标签: git push origin v' + newVersion);
    console.log('');
  } else {
    console.log('⚠️  部分文件更新失败，请检查上述错误信息');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  validateVersion,
  updateVersionJs,
  updatePackageJson,
  updateReadmeVersion
};
