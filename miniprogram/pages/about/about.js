/**
 * 文件名: about.js
 * 描述: 旅游管理微信小程序"关于"页面逻辑文件
 * 版本: 1.0.0
 * 创建日期: 2023-05-13
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 展示应用基本信息（版本、名称、描述）
 * - 提供应用核心功能介绍
 * - 显示开发团队信息和联系方式
 * - 支持复制联系邮箱功能
 * - 适配主题模式（深色/浅色）和颜色主题
 */

// 获取应用实例，用于全局状态管理
const app = getApp();
// 引入版本配置
const versionConfig = require('../../config/version.js');

/**
 * 关于页面对象
 */
Page({
  /**
   * 页面的初始数据
   */  data: {
    version: versionConfig.getVersionText(),     // 应用版本号（动态获取）
    appName: versionConfig.appName,              // 应用名称（动态获取）
    copyrightText: versionConfig.getCopyright(), // 版权信息（动态获取）
    description: '为用户提供优质旅游景点推荐与预订服务的小程序', // 应用描述
    // 应用特性列表，包含图标、标题和描述
    features: [
      { icon: '🏞️', title: '景点推荐', desc: '精选全国各地热门景点' },
      { icon: '🔍', title: '智能搜索', desc: '快速找到心仪的旅游目的地' },
      { icon: '🎫', title: '在线预订', desc: '便捷预订景点门票' },
      { icon: '❤️', title: '个性收藏', desc: '收藏喜爱的旅游景点' }
    ],
    developer: '旅游推荐开发团队',   // 开发者信息
    contactEmail: '2745296803@qq.com', // 联系邮箱
    isDarkMode: false,              // 深色模式状态标志
    colorTheme: '默认绿'            // 当前颜色主题名称
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 监听主题变化，当全局主题改变时更新本页面主题
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,       // 更新深色模式状态
        colorTheme: colorTheme      // 更新颜色主题
      });
    });

    // 初始化主题状态，从全局数据中获取当前的主题设置
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次页面显示时确保主题状态与全局同步
   */
  onShow() {
    // 更新主题状态，确保与全局设置保持一致
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  /**
   * 复制联系邮箱到剪贴板
   * 点击联系方式时触发
   */
  copyEmail() {
    wx.setClipboardData({
      data: this.data.contactEmail, // 获取数据中的邮箱地址
      success: () => {
        // 复制成功后显示提示
        wx.showToast({
          title: '邮箱已复制',      // 提示文本
          icon: 'success'           // 成功图标
        });
      }
    });
  },

  /**
   * 打开GitHub仓库
   * 点击GitHub链接时触发
   */
  openGitHub() {
    // GitHub仓库地址
    const githubUrl = 'https://github.com/Cthaat/Tourism_Management.git';

    // 复制GitHub地址到剪贴板
    wx.setClipboardData({
      data: githubUrl,
      success: () => {
        // 显示提示信息
        wx.showModal({
          title: '提示',
          content: 'GitHub地址已复制到剪贴板，请在浏览器中打开',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: () => {
        // 复制失败时显示失败提示
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 返回上一页
   * 点击返回按钮时触发
   */
  goBack() {
    wx.navigateBack();             // 调用微信API返回上一页
  }
})