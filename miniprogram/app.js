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

// app.js - 小程序应用实例
App({
  /**
   * 生命周期函数--监听小程序初始化
   * 当小程序初始化完成时触发，全局只触发一次
   */  onLaunch() {
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
      } else {
        // 默认使用绿色主题
        this.globalData.colorTheme = '默认绿';
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
    });

    // 在应用启动时预先设置深色模式，确保UI一致性
    this.ensureDarkModePreset();

    // 登录处理：获取用户身份信息
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        // 开发者需在此处添加与服务器交互的代码
        console.log('登录成功，获取到的code:', res.code);
      }
    })
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
   */
  getThemeColor() {
    // 根据主题名称返回对应的颜色值
    switch (this.globalData.colorTheme) {
      case '天空蓝':
        return "#1296db";  // 天空蓝主题色
      case '中国红':
        return "#e54d42";  // 中国红主题色
      case '默认绿':
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
    } else {
      // 根据颜色主题选择对应的背景色
      switch (colorTheme) {
        case '天空蓝':
          backgroundColor = '#1296db';
          break;
        case '中国红':
          backgroundColor = '#e54d42';
          break;
        case '默认绿':
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
   * 全局数据
   * 存储应用程序全局共享的数据
   */
  globalData: {
    userInfo: null,         // 用户信息
    darkMode: false,        // 暗黑模式状态，默认关闭
    colorTheme: '默认绿',    // 颜色主题，默认使用绿色
    systemInfo: null,       // 系统信息，包含设备和系统相关数据

    // 旅游景点数据：示例数据，实际应用中可能从服务器获取
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
    ],

    // 旅游分类数据：预定义的景点分类及其图标
    categories: [
      { id: 1, name: "自然风光", icon: "🏞️" }, // 自然风景类景点
      { id: 2, name: "历史遗迹", icon: "🏛️" }, // 历史文化类景点
      { id: 3, name: "海滨度假", icon: "🏖️" }, // 海滨沙滩类景点
      { id: 4, name: "主题乐园", icon: "🎡" }, // 游乐设施类景点
      { id: 5, name: "民俗文化", icon: "🏮" }  // 民族风情类景点
    ]
  }
})
