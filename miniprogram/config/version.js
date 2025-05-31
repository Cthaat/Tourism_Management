/**
 * @fileoverview 版本配置文件
 * @description 统一管理应用版本信息，避免硬编码
 * @version 1.0.6
 * @date 2025-05-30
 * @author Tourism_Management开发团队
 */

/**
 * 版本配置对象
 */
const versionConfig = {
  // 应用版本号（遵循语义化版本规范）
  version: '1.0.6',

  // 版本构建号
  build: new Date() + ' (Build ' + Math.floor(Math.random() * 10000) + ')',

  // 版本发布日期
  releaseDate: new Date().toISOString().split('T')[0], // 格式化为 YYYY-MM-DD

  // 版本描述
  description: '旅游推荐小程序首个正式版本',

  // 版权年份（自动获取当前年份）
  copyrightYear: new Date().getFullYear(),

  // 应用名称
  appName: '旅游推荐',

  /**
   * 获取完整版本信息
   * @returns {string} 格式化的版本信息
   */
  getFullVersion() {
    return `v${this.version} (${this.build})`;
  },

  /**
   * 获取版权信息
   * @returns {string} 格式化的版权信息
   */
  getCopyright() {
    return `© ${this.copyrightYear} ${this.appName}`;
  },

  /**
   * 获取版本显示文本
   * @returns {string} 用于显示的版本文本
   */
  getVersionText() {
    return `v${this.version}`;
  }
};

module.exports = versionConfig;
