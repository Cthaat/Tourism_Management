#!/usr/bin/env node

/**
 * @fileoverview 本地版本发布脚本
 * @description 用于本地测试版本更新流程，创建版本标签并推送到GitHub
 * @version 1.0.0
 * @date 2025-05-30
 * @author Tourism_Management开发团队
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 执行命令并显示输出
 * @param {string} command 要执行的命令
 * @param {string} description 命令描述
 */
function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log(`✅ ${description}完成`);
    return output;
  } catch (error) {
    console.error(`❌ ${description}失败:`, error.message);
    process.exit(1);
  }
}

/**
 * 检查指定远程仓库是否存在
 * @param {string} remoteName 远程仓库名称
 * @returns {boolean} 是否存在
 */
function hasRemote(remoteName) {
  try {
    const remotes = execSync('git remote', { encoding: 'utf8' });
    return remotes
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
      .includes(remoteName);
  } catch (error) {
    return false;
  }
}

/**
 * 检查本地标签是否存在
 * @param {string} tagName 标签名
 * @returns {boolean} 是否存在
 */
function hasLocalTag(tagName) {
  try {
    const output = execSync(`git tag --list ${tagName}`, { encoding: 'utf8' });
    return output.trim() === tagName;
  } catch (error) {
    return false;
  }
}

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
 * 获取当前version.js中的版本号
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
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📋 版本发布脚本使用说明:');
    console.log('');
    console.log('用法: node scripts/release.js <新版本号> [--no-wechat]');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/release.js 1.0.4              # 发布版本 v1.0.4');
    console.log('  node scripts/release.js 2.1.0 --no-wechat  # 发布版本并跳过 wechat 推送');
    console.log('');
    console.log(`当前版本: v${getCurrentVersion()}`);
    console.log('');
    console.log('⚠️  注意: 此脚本会创建Git标签并推送到GitHub，触发自动化版本更新流程');
    return;
  }

  const noWechat = args.includes('--no-wechat');
  const newVersion = args.find(arg => !arg.startsWith('--'));

  if (!newVersion) {
    console.error('❌ 缺少版本号参数! 请使用 x.y.z 格式，如: 1.5.0');
    process.exit(1);
  }

  // 验证版本号格式
  if (!validateVersion(newVersion)) {
    console.error('❌ 版本号格式错误! 请使用 x.y.z 格式，如: 1.0.4');
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  console.log(`📋 当前版本: v${currentVersion}`);
  console.log(`🎯 目标版本: v${newVersion}`);

  console.log('');
  console.log('🚀 即将执行以下操作:');
  console.log('   1. 检查Git工作区状态');
  console.log('   2. 创建版本标签 v' + newVersion);
  console.log('   3. 推送标签到GitHub');
  if (!noWechat) {
    console.log('   4. 推送到 wechat 分支/标签（若已配置远程）');
  } else {
    console.log('   4. 跳过 wechat 推送（按参数要求）');
  }
  console.log('   5. 触发GitHub Actions自动更新版本号');
  console.log('');

  console.log('🔄 开始版本发布流程...');
  console.log('');

  // 1. 检查Git状态
  try {
    runCommand('git status --porcelain', '检查Git工作区状态');
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('⚠️  检测到未提交的更改');
    }
  } catch (error) {
    console.error('❌ 检查Git状态失败');
    process.exit(1);
  }

  // 2. 创建并推送标签
  try {
    const hasWechatRemote = hasRemote('wechat');
    const shouldPushWechat = hasWechatRemote && !noWechat;
    const tagName = `v${newVersion}`;

    if (shouldPushWechat) {
      runCommand(`git push wechat`, `推送到wechat分支`);
    } else if (!hasWechatRemote) {
      console.log('ℹ️ 未检测到 wechat 远程仓库，跳过 wechat 推送步骤');
    } else {
      console.log('ℹ️ 已启用 --no-wechat，跳过 wechat 推送步骤');
    }

    if (hasLocalTag(tagName)) {
      console.log(`ℹ️ 标签 ${tagName} 已存在，跳过创建步骤`);
    } else {
      runCommand(`git tag ${tagName}`, `创建版本标签 ${tagName}`);
    }

    runCommand(`git push origin ${tagName}`, `推送标签到GitHub`);

    if (shouldPushWechat) {
      runCommand(`git push wechat ${tagName}`, `推送标签到wechat`);
    }
  } catch (error) {
    console.error('❌ 创建或推送标签失败');
    process.exit(1);
  }

  console.log('');
  console.log('🎉 版本发布完成!');
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  validateVersion,
  getCurrentVersion,
  main
};
