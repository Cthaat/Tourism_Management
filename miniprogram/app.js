/**
 * ================================================================
 * 文件名: app.js
 * 描述: 旅游管理微信小程序应用程序入口文件
 * 版本: 1.0.0
 * 创建日期: 2025-05-13
 * 更新日期: 2025-05-14
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 应用程序的生命周期管理
 * - 云开发环境的初始化与配置
 * - 深色模式和主题切换的实现
 * - 全局数据和状态管理
 * - 全局主题系统的配置与更新
 * - 全局导航栏和标签栏样式管理
 * - 用户登录与身份验证
 * ================================================================
 */

// 引入日志系统，优先引入以便捕获所有日志
const { logger } = require('./utils/logger');

// 引入景点管理API
const SpotManageApi = require('./server/SpotManageApi.js');
// 引入图片管理API
const ImageApi = require('./server/ImageApi.js');
// 引入用户登录API
const UserLoginApi = require('./server/UserLoginApi.js');
// 引入用户资料更新API
const UserUpdateApi = require('./server/UserUpdate.js');

// app.js - 小程序应用实例
App({
  /**
   * 生命周期函数--监听小程序初始化
   * 当小程序初始化完成时触发，全局只触发一次
   */  onLaunch() {
    // 全局挂载日志工具，使其在所有页面均可访问
    this.logger = logger;
    // 记录应用启动日志
    console.info('应用程序已启动', 'app.js');

    // 设置全局错误处理
    this.setupErrorHandlers();

    // 检查云开发能力并初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      // 初始化云开发环境
      wx.cloud.init({
        traceUser: true,                        // 记录用户访问痕迹，用于统计分析
        env: 'cloud1-1g7t03e73d6c8ff9',         // 云环境ID，用于连接特定的云环境
      });
      console.log('云开发环境初始化成功');       // 初始化成功日志
    }
    // 记录日志：展示本地存储能力，记录启动时间    // 获取本地存储中的日志记录或初始化日志数组
    const logs = wx.getStorageSync('logs') || []
    // 在日志数组开头添加当前时间戳，记录应用启动时间
    logs.unshift(Date.now())
    // 将更新后的日志数组保存回本地存储
    wx.setStorageSync('logs', logs)

    // 预先设置深色模式标志，避免初始化渲染时的闪烁问题
    this.globalData.darkMode = false;

    // 先读取本地存储的主题设置，优先使用用户已保存的偏好
    const themeSetting = wx.getStorageSync('themeSetting');
    if (themeSetting) {
      this.globalData.darkMode = themeSetting === 'dark';
    }

    // 在读取系统信息前预先给TabBar设置深色模式，确保界面一致性
    this.presetDarkModeBeforeRendering();    // 获取系统信息（使用新API替换旧的wx.getSystemInfo）
    try {
      // 获取窗口信息：包括屏幕尺寸、状态栏高度等
      const windowInfo = wx.getWindowInfo();
      // 获取应用基本信息：包括系统语言、主题、版本号等
      const appBaseInfo = wx.getAppBaseInfo();      // 合并保存系统信息到全局数据中
      this.globalData.systemInfo = {
        ...windowInfo,
        ...appBaseInfo
      };

      // 如果没有用户存储的主题设置，则按系统主题设置（跟随系统）
      if (!themeSetting) {
        this.globalData.darkMode = appBaseInfo.theme === 'dark';
      }

      // 检查是否有保存的颜色主题设置
      const colorTheme = wx.getStorageSync('colorTheme');
      if (colorTheme) {
        this.globalData.colorTheme = colorTheme;
      } else {        // 默认使用绿色主题
        this.globalData.colorTheme = 'default';
      }

      // 应用初始主题：设置导航栏、TabBar等UI组件样式
      this.applyTheme();
    } catch (err) {
      console.error('获取系统信息失败:', err);
      // 系统信息获取失败时使用默认主题设置
      this.applyTheme();
    }

    // 监听系统主题变化，实现自动深色模式切换
    wx.onThemeChange((result) => {
      // 如果用户没有手动设置过主题，则跟随系统主题自动切换
      const themeSetting = wx.getStorageSync('themeSetting');
      if (!themeSetting) {
        this.globalData.darkMode = result.theme === 'dark';
        this.applyTheme();
      }
    });    // 在应用启动时预先设置深色模式，确保UI一致性
    this.ensureDarkModePreset();

    // 登录处理：获取用户身份信息
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        // 开发者需在此处添加与服务器交互的代码
        console.log('登录成功，获取到的code:', res.code);
      }
    })

    // 自动获取用户资料信息并存储到全局数据
    this.initUserProfile();

    // 设置全局错误捕获机制
    this.setupErrorHandlers();

    // 初始化景点数据（从云端获取，失败时使用本地备用数据）
    this.initSpotData();
  },

  /**
   * 初始化用户资料
   * 在应用启动时自动获取用户资料信息并存储到全局数据
   */
  async initUserProfile() {
    try {
      console.log('开始初始化用户资料...');

      // 检查登录状态
      const loginStatus = UserLoginApi.checkLoginStatus();
      console.log('当前登录状态:', loginStatus);

      if (!loginStatus.isLoggedIn) {
        console.log('用户未登录，跳过自动获取用户资料');

        // 尝试从本地存储获取用户信息
        const localUserInfo = wx.getStorageSync('userInfo');
        if (localUserInfo && Object.keys(localUserInfo).length > 0) {
          console.log('从本地存储恢复用户信息');
          this.globalData.userInfo = localUserInfo;
        }
        return;
      }

      // 用户已登录，尝试获取最新的用户资料
      let profileResult = null;

      try {
        // 优先使用 UserUpdateApi 获取用户资料
        if (UserUpdateApi && UserUpdateApi.getUserProfile) {
          console.log('使用 UserUpdateApi 获取用户资料...');
          profileResult = await UserUpdateApi.getUserProfile();
          console.log('UserUpdateApi 获取结果:', profileResult);
        }
      } catch (updateError) {
        console.warn('UserUpdateApi 获取用户资料失败:', updateError);
      }

      // 如果 UserUpdateApi 失败，尝试使用 UserLoginApi
      if (!profileResult || !profileResult.success) {
        try {
          console.log('使用 UserLoginApi 获取用户资料...');
          profileResult = await UserLoginApi.fetchUserProfile();
          console.log('UserLoginApi 获取结果:', profileResult);
        } catch (loginError) {
          console.warn('UserLoginApi 获取用户资料失败:', loginError);
        }
      }

      // 处理获取结果
      if (profileResult && profileResult.success && profileResult.userInfo) {
        // 成功获取到用户资料
        const userInfo = profileResult.userInfo;

        // 确保用户信息字段完整
        const completeUserInfo = {
          ...userInfo,
          // 确保昵称字段存在
          nickName: userInfo.nickName || userInfo.nickname || '用户',
          nickname: userInfo.nickName || userInfo.nickname || '用户',
          // 确保头像字段存在
          avatarUrl: userInfo.avatarUrl || userInfo.avatar_url || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          avatar_url: userInfo.avatarUrl || userInfo.avatar_url,
          // 保留重要标识字段
          _id: userInfo._id,
          _openid: userInfo._openid,
          account: userInfo.account
        };

        // 存储到全局数据
        this.globalData.userInfo = completeUserInfo;

        // 同步更新本地存储和登录状态
        wx.setStorageSync('userInfo', completeUserInfo);
        UserLoginApi.updateLoginStatus(completeUserInfo);

        console.log('用户资料初始化成功，已存储到 globalData.userInfo');
        console.log('用户资料摘要:', {
          nickName: completeUserInfo.nickName,
          hasAvatar: !!completeUserInfo.avatarUrl,
          hasId: !!completeUserInfo._id
        });

      } else {
        // 云端获取失败，尝试使用本地缓存
        console.log('云端获取用户资料失败，尝试使用本地缓存');

        const localUserInfo = wx.getStorageSync('userInfo');
        if (localUserInfo && Object.keys(localUserInfo).length > 0) {
          this.globalData.userInfo = localUserInfo;
          console.log('使用本地缓存的用户资料');
        } else {
          console.log('无可用的用户资料数据');
        }
      }

    } catch (error) {
      console.error('初始化用户资料失败:', error);

      // 错误发生时，尝试使用本地存储的用户信息
      try {
        const localUserInfo = wx.getStorageSync('userInfo');
        if (localUserInfo && Object.keys(localUserInfo).length > 0) {
          this.globalData.userInfo = localUserInfo;
          console.log('发生错误，已使用本地缓存的用户资料');
        }
      } catch (localError) {
        console.error('读取本地用户资料也失败:', localError);
      }
    }
  },

  /**
   * 在应用启动时预先设置深色模式
   * 此方法会在渲染前执行，防止界面闪烁
   */
  presetDarkModeBeforeRendering() {
    // 首先检查本地存储的用户主题偏好设置
    try {
      const themeSetting = wx.getStorageSync('themeSetting');
      if (themeSetting) {
        this.globalData.darkMode = themeSetting === 'dark';
        return;
      }

      // 如果没有本地存储的设置，尝试读取系统主题设置
      try {
        const appBaseInfo = wx.getAppBaseInfo();
        this.globalData.darkMode = appBaseInfo.theme === 'dark';
      } catch (e) {
        console.error('获取系统主题失败:', e);
      }
    } catch (e) {
      console.error('预设深色模式失败:', e);
    }
  },
  /**
   * 确保深色模式在所有页面预设完成
   * 使用微信小程序的渲染机制，确保所有UI组件正确应用深色模式
   */
  ensureDarkModePreset() {
    // 使用小程序提供的下一帧渲染机制确保样式被应用
    wx.nextTick(() => {
      // 强制更新所有页面的TabBar，确保深色模式正确应用
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        pages.forEach(page => {
          if (page && page.getTabBar) {
            const tabBar = page.getTabBar();
            if (tabBar) {
              tabBar.setData({
                isDarkMode: this.globalData.darkMode,
                selectedColor: this.globalData.darkMode ? "#ffffff" : this.getThemeColor()
              });
            }
          }
        });
      }
    });
  },
  /**
   * 切换深色模式状态
   * 在用户手动切换主题时调用，会保存设置并应用到全局UI
   * @returns {boolean} 返回切换后的深色模式状态
   */
  toggleDarkMode() {
    // 切换深色模式状态
    this.globalData.darkMode = !this.globalData.darkMode;

    // 保存主题设置到本地存储，确保下次启动时保持设置
    wx.setStorageSync('themeSetting', this.globalData.darkMode ? 'dark' : 'light');    // 设置系统级深色模式状态 - 微信小程序7.0.0及以上版本支持
    if (wx.setWindowDark) {
      wx.setWindowDark({
        dark: this.globalData.darkMode,
        success: () => {
          console.log('深色模式设置成功：', this.globalData.darkMode ? '开启' : '关闭');
        },
        fail: (error) => {
          console.error('深色模式设置失败：', error);
        }
      });
    }

    // 同步深色模式到用户资料（云端）
    this.syncThemeSettingsToCloud();

    // 应用主题变化到全局UI
    this.applyTheme();

    return this.globalData.darkMode;
  },
  /**
   * 切换颜色主题
   * 更改应用的主色调，支持多种预设颜色主题
   * @param {string} theme - 主题名称：'默认绿'、'天空蓝'或'中国红'
   * @returns {string} 返回设置后的主题名称
   */  changeColorTheme(theme) {
    // 更新全局主题设置
    this.globalData.colorTheme = theme;

    // 保存主题设置到本地，确保下次启动时保持设置
    wx.setStorageSync('colorTheme', theme);

    // 同步主题设置到用户资料（云端）
    this.syncThemeSettingsToCloud();

    // 应用主题变化到全局UI
    this.applyTheme();

    return this.globalData.colorTheme;
  },

  /**
   * 应用主题
   * 将当前的主题设置应用到全局UI元素
   */
  applyTheme() {
    // 触发主题变化事件，通知页面更新
    if (this.themeChangeCallback) {
      this.themeChangeCallback(this.globalData.darkMode, this.globalData.colorTheme);
    }

    // 设置导航栏样式适应当前主题
    this.updateNavBarStyle();

    // 立即更新自定义TabBar的深色模式状态
    this.updateTabBarDarkMode();

    // 在下一个渲染周期再次确保更新，防止样式闪烁
    wx.nextTick(() => {
      this.updateTabBarDarkMode();
    });
  },
  /**
   * 更新标签栏的深色模式状态
   * 确保自定义TabBar正确应用当前的主题设置
   */
  updateTabBarDarkMode() {
    try {
      // 获取当前页面堆栈
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        // 获取当前显示的页面
        const currentPage = pages[pages.length - 1];
        if (currentPage && currentPage.getTabBar) {
          // 获取当前页面的TabBar实例
          const tabBar = currentPage.getTabBar();
          if (tabBar) {
            // 直接设置标签栏的深色模式状态和选中颜色
            tabBar.setData({
              isDarkMode: this.globalData.darkMode,
              selectedColor: this.globalData.darkMode ? "#ffffff" : this.getThemeColor()
            });
          }
        }
      }
    } catch (e) {
      console.error('更新TabBar深色模式失败', e);
    }
  },
  /**
   * 获取当前主题的颜色值
   * 根据设置的主题名称返回对应的十六进制颜色代码
   * @returns {string} 返回当前主题的颜色代码
   */  getThemeColor() {
    // 根据主题名称返回对应的颜色值
    switch (this.globalData.colorTheme) {
      case 'blue':
        return "#1296db";  // 天空蓝主题色
      case 'red':
        return "#e54d42";  // 中国红主题色
      case 'default':
      default:
        return "#1aad19";  // 默认绿主题色
    }
  },

  /**
   * 同步主题设置到云数据库
   * 将当前的主题颜色和深色模式状态保存到用户资料中
   */
  syncThemeSettingsToCloud() {
    console.log('同步主题设置到云端数据库...');
    const Pages = getCurrentPages();
    // 查找profile页面实例
    const profilePage = Pages.find(page => page && page.route && page.route.includes('profile/profile'));

    if (profilePage && typeof profilePage.syncThemeSettings === 'function') {
      // 如果找到profile页面并且有syncThemeSettings方法，直接调用它
      profilePage.syncThemeSettings(this.globalData.darkMode, this.globalData.colorTheme);
    } else {
      // 否则尝试直接调用UserUpdate API
      const userUpdateApi = require('./server/UserUpdate');

      // 准备主题数据
      const themeData = {
        theme_setting: this.globalData.darkMode ? 'dark' : 'light',
        color_theme: this.globalData.colorTheme || '默认绿'
      };

      // 调用API进行同步
      userUpdateApi.updateUserProfile(themeData)
        .then(res => {
          if (res.success) {
            console.log('主题设置已成功同步到云端');
          } else {
            console.warn('主题设置同步失败:', res.message);
          }
        })
        .catch(err => {
          console.error('同步主题设置时发生错误:', err);
        });
    }
  },

  /**
   * 更新导航栏样式以适应当前主题
   * 根据深色模式和颜色主题设置导航栏的背景色和文字颜色
   */
  updateNavBarStyle() {
    const darkMode = this.globalData.darkMode;
    const colorTheme = this.globalData.colorTheme;

    let backgroundColor;

    // 根据颜色主题和深色模式设置不同的背景色
    if (darkMode) {
      backgroundColor = '#222222'; // 深色模式统一使用深灰色背景
    } else {      // 根据颜色主题选择对应的背景色
      switch (colorTheme) {
        case 'blue':
          backgroundColor = '#1296db';
          break;
        case 'red':
          backgroundColor = '#e54d42';
          break;
        case 'default':
        default:
          backgroundColor = '#1aad19';
          break;
      }
    }    // 设置导航栏颜色，应用主题
    wx.setNavigationBarColor({
      frontColor: '#ffffff',  // 统一使用白色文字，确保在所有背景下可读性
      backgroundColor: backgroundColor,
      animation: {
        duration: 0, // 移除动画，避免主题切换时的闪烁
        timingFunc: 'linear'
      }
    });
  },

  /**
   * 页面监听主题变化
   * 允许页面或组件注册回调函数，在主题变化时收到通知
   * @param {Function} callback - 主题变化时的回调函数
   * @returns {Object} 返回当前的主题状态
   */
  watchThemeChange(callback) {
    // 保存回调函数
    this.themeChangeCallback = callback;

    // 立即返回当前主题状态，便于初始化
    return {
      darkMode: this.globalData.darkMode,
      colorTheme: this.globalData.colorTheme
    };
  },
  /**
   * 取消监听主题变化
   * 移除之前注册的主题变化回调函数
   * @param {Object} component - 注册了回调的组件实例
   */
  unwatchThemeChange(component) {
    // 如果参数是指定组件，只移除该组件的回调
    if (component && this.themeChangeCallback === component.themeChangeCallback) {
      this.themeChangeCallback = null;
    }
  },

  /**
   * 注册数据加载完成的回调函数
   * @param {Function} callback - 数据加载完成后的回调函数
   */
  onSpotDataReady(callback) {
    if (this.globalData.spotsDataReady) {
      // 如果数据已经准备好，立即执行回调
      callback(this.globalData.tourismSpots);
    } else {
      // 否则将回调函数添加到队列中
      this.globalData.dataLoadCallbacks.push(callback);
    }
  },

  /**
   * 通知所有等待数据的回调函数
   */
  notifyDataReady() {
    console.log('通知数据加载完成，调用', this.globalData.dataLoadCallbacks.length, '个回调函数');
    this.globalData.spotsDataReady = true;

    // 执行所有等待的回调函数
    this.globalData.dataLoadCallbacks.forEach(callback => {
      try {
        callback(this.globalData.tourismSpots);
      } catch (error) {
        console.error('执行数据加载回调时出错:', error);
      }
    });

    // 清空回调队列
    this.globalData.dataLoadCallbacks = [];
  },

  /**
   * 设置全局错误捕获机制
   */
  setupErrorHandlers() {
    // 监听未捕获的Promise拒绝
    wx.onUnhandledRejection(({ reason, promise }) => {
      console.error('未捕获的Promise拒绝', 'app.js', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise
      });
    });

    // 监听脚本错误
    wx.onError((errorMessage) => {
      console.error('小程序全局错误', 'app.js', {
        errorMessage
      });
    });

    // 监听页面不存在
    wx.onPageNotFound((res) => {
      console.warn('页面不存在', 'app.js', {
        path: res.path,
        query: res.query,
        isEntryPage: res.isEntryPage
      });

      // 尝试重定向到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    });

    // 监听内存警告
    wx.onMemoryWarning(() => {
      console.warn('内存不足警告', 'app.js');

      // 可以在这里执行一些清理操作
      if (this.logger) {
        this.logger.clearLogs(); // 清除内存中的日志缓存
      }
    });
  },

  /**
   * 获取全局用户信息
   * 提供给其他页面或组件获取当前登录用户的信息
   * @returns {Object|null} 返回用户信息对象，如果未登录则返回null
   */
  getUserInfo() {
    return this.globalData.userInfo;
  },

  /**
   * 更新全局用户信息
   * 提供给其他页面或组件更新全局用户信息的方法
   * @param {Object} userInfo - 新的用户信息对象
   */
  updateUserInfo(userInfo) {
    if (userInfo && typeof userInfo === 'object') {
      this.globalData.userInfo = userInfo;
      // 同步更新本地存储
      wx.setStorageSync('userInfo', userInfo);
      console.log('全局用户信息已更新');
    }
  },

  /**
   * 刷新全局用户信息
   * 从云端重新获取用户最新信息并更新到全局数据
   * @returns {Promise} 返回刷新结果
   */
  async refreshUserInfo() {
    try {
      console.log('刷新全局用户信息...');

      // 检查登录状态
      const loginStatus = UserLoginApi.checkLoginStatus();
      if (!loginStatus.isLoggedIn) {
        console.log('用户未登录，无法刷新用户信息');
        return { success: false, message: '用户未登录' };
      }

      let profileResult = null;

      // 尝试获取最新用户资料
      try {
        if (UserUpdateApi && UserUpdateApi.getUserProfile) {
          profileResult = await UserUpdateApi.getUserProfile();
        }
      } catch (updateError) {
        console.warn('UserUpdateApi 刷新失败，尝试备选方法:', updateError);
      }

      if (!profileResult || !profileResult.success) {
        try {
          profileResult = await UserLoginApi.fetchUserProfile();
        } catch (loginError) {
          console.warn('UserLoginApi 刷新失败:', loginError);
        }
      }

      if (profileResult && profileResult.success && profileResult.userInfo) {
        // 更新全局用户信息
        this.updateUserInfo(profileResult.userInfo);
        UserLoginApi.updateLoginStatus(profileResult.userInfo);

        console.log('全局用户信息刷新成功');
        return { success: true, userInfo: profileResult.userInfo };
      } else {
        console.log('刷新用户信息失败，保持当前状态');
        return { success: false, message: '获取用户信息失败' };
      }

    } catch (error) {
      console.error('刷新全局用户信息失败:', error);
      return { success: false, message: error.message || '刷新失败' };
    }
  },

  /**
   * 全局数据
   * 存储应用程序全局共享的数据
   */globalData: {
    userInfo: null,         // 用户信息
    darkMode: false,        // 暗黑模式状态，默认关闭
    colorTheme: '默认绿',    // 颜色主题，默认使用绿色
    systemInfo: null,       // 系统信息，包含设备和系统相关数据

    // 景点数据加载状态
    spotsLoadedFromCloud: false,  // 是否从云端加载成功
    spotsLoadTime: null,         // 数据加载时间
    spotsLastRefresh: null,      // 最后刷新时间
    spotsDataReady: false,       // 景点数据是否已准备就绪
    dataLoadCallbacks: [],       // 数据加载完成后的回调函数列表

    // 旅游景点数据：备用数据，优先使用云端数据
    tourismSpots: [{
      id: 1,                           // 景点唯一标识
      name: "西湖风景区",               // 景点名称
      location: "浙江省杭州市",         // 景点位置
      category: "自然风光",             // 景点分类
      image: "/images/xihu.png",       // 景点图片路径
      price: 80,                       // 门票价格（人民币）
      rating: 4.8,                     // 评分（满分5分）
      description: "西湖，位于浙江省杭州市西湖区龙井路1号，杭州市区西部，景区总面积49平方千米，汇水面积为21.22平方千米，湖面面积为6.38平方千米。", // 景点描述
      features: ["千岛湖", "三潭印月", "断桥残雪", "雷峰塔"] // 景点特色
    }, {
      id: 2,
      name: "故宫博物院",
      location: "北京市东城区",
      category: "历史遗迹",
      image: "/images/gugong.png",     // 故宫图片
      price: 60,
      rating: 4.9,
      description: "故宫又名紫禁城，是中国明清两代的皇家宫殿，旧称为紫禁城，位于北京中轴线的中心，是中国古代宫廷建筑之精华。",
      features: ["太和殿", "中和殿", "保和殿", "乾清宫"]
    },
    {
      id: 3,
      name: "张家界国家森林公园",
      location: "湖南省张家界市",
      category: "自然风光",
      image: "/images/zhangjiajie.png", // 张家界图片
      price: 225,
      rating: 4.7,
      description: "张家界国家森林公园是中国第一个国家森林公园，也是武陵源风景名胜区的核心景区，以典型的喀斯特地貌著称。",
      features: ["天子山", "袁家界", "金鞭溪", "黄石寨"]
    }, {
      id: 4,
      name: "兵马俑博物馆",
      location: "陕西省西安市",
      category: "历史遗迹",
      image: "/images/bingmayong.png", // 兵马俑图片
      price: 120,
      rating: 4.8,
      description: "秦始皇兵马俑博物馆位于陕西省西安市临潼区，是世界上规模最大的古代军事博物馆，被誉为\"世界第八大奇迹\"。",
      features: ["一号坑", "二号坑", "三号坑", "秦始皇陵"]
    },
    {
      id: 5,
      name: "三亚亚龙湾",
      location: "海南省三亚市",
      category: "海滨度假",
      image: "/images/sanya.png",      // 三亚图片
      price: 0,                        // 免费景点
      rating: 4.6,
      description: "亚龙湾位于海南省三亚市东南部，是海南岛最南端的一个半月形海湾，被称为\"天下第一湾\"。",
      features: ["沙滩", "潜水", "海上运动", "豪华酒店"]
    }, {
      id: 6,
      name: "九寨沟风景区",
      location: "四川省阿坝藏族羌族自治州",
      category: "自然风光",
      image: "/images/jiuzhaigou.png", // 九寨沟图片
      price: 190,
      rating: 4.8,
      description: "九寨沟位于四川省阿坝藏族羌族自治州九寨沟县，是中国第一个以保护自然风景为主要目的的自然保护区。",
      features: ["五彩池", "熊猫海", "诺日朗瀑布", "树正瀑布"]
    }
    ],    // 旅游分类数据：预定义的景点分类及其图标
    categories: [
      { id: 1, name: "自然风光", icon: "🏞️" }, // 自然风景类景点
      { id: 2, name: "历史遗迹", icon: "🏛️" }, // 历史文化类景点
      { id: 3, name: "海滨度假", icon: "🏖️" }, // 海滨沙滩类景点
      { id: 4, name: "主题乐园", icon: "🎡" }, // 游乐设施类景点
      { id: 5, name: "民俗文化", icon: "🏮" }  // 民族风情类景点
    ]
  },

  /**
   * 初始化景点数据
   * 从云端获取最新景点数据，失败时使用本地备用数据
   */
  async initSpotData() {
    try {
      console.log('开始初始化景点数据...');

      // 尝试从云端获取景点数据
      const cloudSpots = await SpotManageApi.getSpotList();


      console.log('从云端获取景点数据:', cloudSpots);
      console.log('云端景点数据长度:', cloudSpots.data.length);      // 修复：正确检查条件和数据赋值
      if (cloudSpots && cloudSpots.data && cloudSpots.data.length > 0) {
        console.log('云端景点数据长度:', cloudSpots.data.length);

        // 为每个景点获取图片数组
        console.log('开始为景点数据添加图片信息...');
        try {
          // 提取所有景点的ID
          const spotIds = cloudSpots.data.map(spot => spot.id).filter(id => id);
          console.log('景点ID列表:', spotIds);

          if (spotIds.length > 0) {
            // 批量获取所有景点的图片
            const allSpotImages = await ImageApi.preloadSpotImages(spotIds, {
              concurrent: true,
              maxConcurrent: 3 // 限制并发数避免云函数压力过大
            });

            console.log('批量获取图片结果:', allSpotImages);

            // 为每个景点数据添加图片数组
            cloudSpots.data.forEach(spot => {
              const spotImageData = allSpotImages[spot.id];
              if (spotImageData && spotImageData.success && spotImageData.images) {
                // 添加图片数组到景点数据
                spot.images = spotImageData.images;
                spot.imageCount = spotImageData.total;
                spot.mainImage = spotImageData.images.length > 0 ? spotImageData.images[0] : null;
                console.log(`景点 ${spot.name || spot.id} 添加了 ${spotImageData.total} 张图片`);
              } else {
                // 没有图片或获取失败时设置为空数组
                spot.images = [];
                spot.imageCount = 0;
                spot.mainImage = null;
                console.log(`景点 ${spot.name || spot.id} 没有图片或获取失败`);
              }
            });

            console.log('所有景点图片数据整合完成');
          }
        } catch (imageError) {
          console.warn('获取景点图片失败，将使用无图片的景点数据:', imageError);
          // 图片获取失败时，为所有景点设置空图片数组
          cloudSpots.data.forEach(spot => {
            spot.images = [];
            spot.imageCount = 0;
            spot.mainImage = null;
          });
        }

        // 修复：正确赋值云端数据到globalData.tourismSpots
        this.globalData.tourismSpots = cloudSpots.data;
        this.globalData.spotsLoadedFromCloud = true;
        this.globalData.spotsLoadTime = new Date();
        this.globalData.spotsLastRefresh = new Date();

        console.log('景点数据初始化成功，显示最终的globalData.tourismSpots:', this.globalData.tourismSpots);
        console.log('从云端成功加载景点数据', cloudSpots.data.length, '个景点');        // 缓存云端数据到本地存储
        console.log('景点数据初始化成功，显示最终的globalData', this.globalData);

        try {
          wx.setStorageSync('cloudSpots', cloudSpots);
          wx.setStorageSync('spotsLoadTime', this.globalData.spotsLoadTime);
        } catch (storageError) {
          console.warn('缓存景点数据失败:', storageError);
        }

        // 云端数据加载成功，立即通知数据准备就绪
        console.log('云端数据加载完成，立即通知页面刷新');
        this.notifyDataReady();
        return; // 提前返回，避免执行后续的缓存读取逻辑
      } else {
        throw new Error('云端返回的景点数据为空');
      }
    } catch (error) {
      console.warn('从云端加载景点数据失败:', error);

      // 尝试从本地缓存加载
      try {
        const cachedSpots = wx.getStorageSync('cloudSpots');
        const cachedTime = wx.getStorageSync('spotsLoadTime');        // 修复：正确检查缓存数据条件和赋值
        if (cachedSpots && cachedSpots.data && cachedSpots.data.length > 0) {
          this.globalData.tourismSpots = cachedSpots.data;
          this.globalData.spotsLoadedFromCloud = true;
          this.globalData.spotsLoadTime = cachedTime || new Date();
          console.log('从本地缓存加载景点数据', cachedSpots.data.length, '个景点');
        } else {
          // 使用内置的备用数据
          this.globalData.spotsLoadedFromCloud = false;
          console.log('使用内置备用景点数据', this.globalData.tourismSpots.length, '个景点');
        }
      } catch (cacheError) {
        console.warn('从本地缓存加载景点数据失败:', cacheError);
        // 最终回退到内置备用数据
        this.globalData.spotsLoadedFromCloud = false;
        console.log('使用内置备用景点数据', this.globalData.tourismSpots.length, '个景点');
      }
    }

    // 无论从云端、缓存还是备用数据，最终都通知数据已准备就绪
    console.log('景点数据初始化完成，通知所有等待的页面');
    this.notifyDataReady();
  },
  /**
   * 刷新景点数据
   * 强制从云端重新获取最新数据，包括图片数据
   */
  async refreshSpotData() {
    try {
      console.log('刷新景点数据...');

      const cloudSpots = await SpotManageApi.getSpotList();

      // 修复：正确检查条件和数据赋值
      if (cloudSpots && cloudSpots.data && cloudSpots.data.length > 0) {
        console.log('云端景点数据长度:', cloudSpots.data.length);

        // 为每个景点获取图片数组
        console.log('开始为景点数据添加图片信息...');
        try {
          // 提取所有景点的ID
          const spotIds = cloudSpots.data.map(spot => spot.id).filter(id => id);
          console.log('景点ID列表:', spotIds);

          if (spotIds.length > 0) {
            // 批量获取所有景点的图片
            const allSpotImages = await ImageApi.preloadSpotImages(spotIds, {
              concurrent: true,
              maxConcurrent: 3 // 限制并发数避免云函数压力过大
            });

            console.log('批量获取图片结果:', allSpotImages);

            // 为每个景点数据添加图片数组
            cloudSpots.data.forEach(spot => {
              const spotImageData = allSpotImages[spot.id];
              if (spotImageData && spotImageData.success && spotImageData.images) {
                // 添加图片数组到景点数据
                spot.images = spotImageData.images;
                spot.imageCount = spotImageData.total;
                spot.mainImage = spotImageData.images.length > 0 ? spotImageData.images[0] : null;
                console.log(`景点 ${spot.name || spot.id} 添加了 ${spotImageData.total} 张图片`);
              } else {
                // 没有图片或获取失败时设置为空数组
                spot.images = [];
                spot.imageCount = 0;
                spot.mainImage = null;
                console.log(`景点 ${spot.name || spot.id} 没有图片或获取失败`);
              }
            });

            console.log('所有景点图片数据整合完成');
          }
        } catch (imageError) {
          console.warn('获取景点图片失败，将使用无图片的景点数据:', imageError);
          // 图片获取失败时，为所有景点设置空图片数组
          cloudSpots.data.forEach(spot => {
            spot.images = [];
            spot.imageCount = 0;
            spot.mainImage = null;
          });
        }

        this.globalData.tourismSpots = cloudSpots.data;
        this.globalData.spotsLoadedFromCloud = true;
        this.globalData.spotsLastRefresh = new Date();

        // 更新本地缓存
        wx.setStorageSync('cloudSpots', cloudSpots);
        wx.setStorageSync('spotsLoadTime', this.globalData.spotsLastRefresh);

        console.log('景点数据刷新成功', cloudSpots.data.length, '个景点');
        return { success: true, count: cloudSpots.data.length };
      } else {
        throw new Error('云端返回的景点数据为空');
      }
    } catch (error) {
      console.error('刷新景点数据失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取景点数据
   * @param {boolean} forceRefresh 是否强制刷新数据
   * @returns {Array} 景点数据列表
   */
  async getSpotData(forceRefresh = false) {
    if (forceRefresh) {
      await this.refreshSpotData();
    }

    return this.globalData.tourismSpots || [];
  },

  /**
   * 获取景点数据加载状态
   * @returns {Object} 包含加载状态信息的对象
   */
  getSpotDataStatus() {
    return {
      loadedFromCloud: this.globalData.spotsLoadedFromCloud,
      loadTime: this.globalData.spotsLoadTime,
      lastRefresh: this.globalData.spotsLastRefresh,
      spotsCount: this.globalData.tourismSpots ? this.globalData.tourismSpots.length : 0
    };
  },
})

/*
 * ......................................&&.........................
 * ....................................&&&..........................
 * .................................&&&&............................
 * ...............................&&&&..............................
 * .............................&&&&&&..............................
 * ...........................&&&&&&....&&&..&&&&&&&&&&&&&&&........
 * ..................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&..............
 * ................&...&&&&&&&&&&&&&&&&&&&&&&&&&&&&.................
 * .......................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&.........
 * ...................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&...............
 * ..................&&&   &&&&&&&&&&&&&&&&&&&&&&&&&&&&&............
 * ...............&&&&&@  &&&&&&&&&&..&&&&&&&&&&&&&&&&&&&...........
 * ..............&&&&&&&&&&&&&&&.&&....&&&&&&&&&&&&&..&&&&&.........
 * ..........&&&&&&&&&&&&&&&&&&...&.....&&&&&&&&&&&&&...&&&&........
 * ........&&&&&&&&&&&&&&&&&&&.........&&&&&&&&&&&&&&&....&&&.......
 * .......&&&&&&&&.....................&&&&&&&&&&&&&&&&.....&&......
 * ........&&&&&.....................&&&&&&&&&&&&&&&&&&.............
 * ..........&...................&&&&&&&&&&&&&&&&&&&&&&&............
 * ................&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&............
 * ..................&&&&&&&&&&&&&&&&&&&&&&&&&&&&..&&&&&............
 * ..............&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&....&&&&&............
 * ...........&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&......&&&&............
 * .........&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&.........&&&&............
 * .......&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&...........&&&&............
 * ......&&&&&&&&&&&&&&&&&&&...&&&&&&...............&&&.............
 * .....&&&&&&&&&&&&&&&&............................&&..............
 * ....&&&&&&&&&&&&&&&.................&&...........................
 * ...&&&&&&&&&&&&&&&.....................&&&&......................
 * ...&&&&&&&&&&.&&&........................&&&&&...................
 * ..&&&&&&&&&&&..&&..........................&&&&&&&...............
 * ..&&&&&&&&&&&&...&............&&&.....&&&&...&&&&&&&.............
 * ..&&&&&&&&&&&&&.................&&&.....&&&&&&&&&&&&&&...........
 * ..&&&&&&&&&&&&&&&&..............&&&&&&&&&&&&&&&&&&&&&&&&.........
 * ..&&.&&&&&&&&&&&&&&&&&.........&&&&&&&&&&&&&&&&&&&&&&&&&&&.......
 * ...&&..&&&&&&&&&&&&.........&&&&&&&&&&&&&&&&...&&&&&&&&&&&&......
 * ....&..&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&...........&&&&&&&&.....
 * .......&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&..............&&&&&&&....
 * .......&&&&&.&&&&&&&&&&&&&&&&&&..&&&&&&&&...&..........&&&&&&....
 * ........&&&.....&&&&&&&&&&&&&.....&&&&&&&&&&...........&..&&&&...
 * .......&&&........&&&.&&&&&&&&&.....&&&&&.................&&&&...
 * .......&&&...............&&&&&&&.......&&&&&&&&............&&&...
 * ........&&...................&&&&&&.........................&&&..
 * .........&.....................&&&&........................&&....
 * ...............................&&&.......................&&......
 * ................................&&......................&&.......
 * .................................&&..............................
 * ..................................&..............................
 */
