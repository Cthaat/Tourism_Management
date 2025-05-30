#!/usr/bin/env node

/**
 * @fileoverview 版本管理系统测试脚本
 * @description 用于验证版本管理自动化系统的各个组件是否正常工作
 * @version 1.0.0
 * @date 2025-05-30
 * @author Tourism_Management开发团队
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 测试结果收集器
 */
class TestCollector {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * 添加测试结果
   * @param {string} name 测试名称
   * @param {boolean} passed 是否通过
   * @param {string} message 详细信息
   */
  addTest(name, passed, message = '') {
    this.tests.push({ name, passed, message });
    if (passed) {
      this.passed++;
      console.log(`✅ ${name}`);
    } else {
      this.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  }

  /**
   * 输出测试总结
   */
  summary() {
    console.log('\n📊 测试总结:');
    console.log(`   通过: ${this.passed}`);
    console.log(`   失败: ${this.failed}`);
    console.log(`   总计: ${this.tests.length}`);

    if (this.failed === 0) {
      console.log('\n🎉 所有测试通过！版本管理系统工作正常');
    } else {
      console.log('\n⚠️  部分测试失败，请检查相关组件');
    }
  }
}

/**
 * 测试文件是否存在
 * @param {string} filePath 文件路径
 * @param {string} description 文件描述
 * @param {TestCollector} collector 测试收集器
 */
function testFileExists(filePath, description, collector) {
  const exists = fs.existsSync(filePath);
  collector.addTest(
    `文件存在: ${description}`,
    exists,
    exists ? '' : `文件不存在: ${filePath}`
  );
}

/**
 * 测试Node.js脚本是否可执行
 * @param {string} scriptPath 脚本路径
 * @param {string} description 脚本描述
 * @param {TestCollector} collector 测试收集器
 */
function testScriptExecutable(scriptPath, description, collector) {
  try {
    // 检查语法
    execSync(`node -c "${scriptPath}"`, { stdio: 'pipe' });
    collector.addTest(`脚本可执行: ${description}`, true);
  } catch (error) {
    collector.addTest(`脚本可执行: ${description}`, false, error.message);
  }
}

/**
 * 测试版本配置文件格式
 * @param {TestCollector} collector 测试收集器
 */
function testVersionConfig(collector) {
  try {
    const versionPath = path.join(__dirname, '..', 'miniprogram', 'config', 'version.js');
    const content = fs.readFileSync(versionPath, 'utf8');

    // 检查版本号格式
    const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);
    if (versionMatch && versionMatch[1]) {
      const version = versionMatch[1];
      const versionRegex = /^\d+\.\d+\.\d+$/;
      collector.addTest(
        '版本号格式正确',
        versionRegex.test(version),
        `当前版本: ${version}`
      );
    } else {
      collector.addTest('版本号格式正确', false, '无法提取版本号');
    }

    // 检查必要的方法
    const hasGetVersionText = content.includes('getVersionText()');
    const hasGetCopyright = content.includes('getCopyright()');

    collector.addTest('包含getVersionText方法', hasGetVersionText);
    collector.addTest('包含getCopyright方法', hasGetCopyright);

  } catch (error) {
    collector.addTest('版本配置文件测试', false, error.message);
  }
}

/**
 * 测试README版本更新脚本
 * @param {TestCollector} collector 测试收集器
 */
function testReadmeUpdateScript(collector) {
  try {
    const scriptPath = path.join(__dirname, 'update-readme-version.js');
    const { getVersionFromConfig } = require(scriptPath);

    // 测试版本提取功能
    const version = getVersionFromConfig();
    collector.addTest(
      'README更新脚本-版本提取',
      typeof version === 'string' && version.length > 0,
      `提取的版本: ${version}`
    );

  } catch (error) {
    collector.addTest('README更新脚本测试', false, error.message);
  }
}

/**
 * 测试GitHub Actions工作流文件
 * @param {TestCollector} collector 测试收集器
 */
function testGitHubActions(collector) {
  try {
    const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'update-version.yml');
    const content = fs.readFileSync(workflowPath, 'utf8');

    // 检查关键配置
    const hasTagTrigger = content.includes('tags:') && content.includes('v*.*.*');
    const hasNodeSetup = content.includes('actions/setup-node');
    const hasVersionUpdate = content.includes('update-readme-version.js');

    collector.addTest('GitHub Actions-标签触发器配置', hasTagTrigger);
    collector.addTest('GitHub Actions-Node.js环境设置', hasNodeSetup);
    collector.addTest('GitHub Actions-版本更新脚本调用', hasVersionUpdate);

  } catch (error) {
    collector.addTest('GitHub Actions工作流测试', false, error.message);
  }
}

/**
 * 测试Git环境
 * @param {TestCollector} collector 测试收集器
 */
function testGitEnvironment(collector) {
  try {
    // 检查是否在Git仓库中
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    collector.addTest('Git仓库环境', true);

    // 检查是否有远程仓库
    const remotes = execSync('git remote', { encoding: 'utf8' });
    collector.addTest('Git远程仓库配置', remotes.trim().length > 0);

  } catch (error) {
    collector.addTest('Git环境测试', false, error.message);
  }
}

/**
 * 主测试函数
 */
function runTests() {
  console.log('🧪 开始版本管理系统测试...\n');

  const collector = new TestCollector();

  // 1. 测试核心文件存在
  console.log('📁 测试核心文件...');
  testFileExists(
    path.join(__dirname, '..', 'miniprogram', 'config', 'version.js'),
    'version.js配置文件',
    collector
  );
  testFileExists(
    path.join(__dirname, 'update-readme-version.js'),
    'README更新脚本',
    collector
  );
  testFileExists(
    path.join(__dirname, 'release.js'),
    '版本发布脚本',
    collector
  );
  testFileExists(
    path.join(__dirname, '..', '.github', 'workflows', 'update-version.yml'),
    'GitHub Actions工作流',
    collector
  );

  // 2. 测试脚本可执行性
  console.log('\n🔧 测试脚本可执行性...');
  testScriptExecutable(
    path.join(__dirname, 'update-readme-version.js'),
    'README更新脚本',
    collector
  );
  testScriptExecutable(
    path.join(__dirname, 'release.js'),
    '版本发布脚本',
    collector
  );

  // 3. 测试版本配置
  console.log('\n⚙️  测试版本配置...');
  testVersionConfig(collector);

  // 4. 测试脚本功能
  console.log('\n🎯 测试脚本功能...');
  testReadmeUpdateScript(collector);

  // 5. 测试GitHub Actions配置
  console.log('\n🤖 测试GitHub Actions配置...');
  testGitHubActions(collector);

  // 6. 测试Git环境
  console.log('\n📂 测试Git环境...');
  testGitEnvironment(collector);

  // 输出总结
  collector.summary();

  // 返回测试结果
  return collector.failed === 0;
}

// 如果直接运行此脚本
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  runTests,
  TestCollector
};
