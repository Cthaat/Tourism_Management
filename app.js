// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 预先设置深色模式标志，避免闪烁
    this.globalData.darkMode = false;

    // 先读取本地存储的主题设置
    const themeSetting = wx.getStorageSync('themeSetting');
    if (themeSetting) {
      this.globalData.darkMode = themeSetting === 'dark';
    }

    // 在读取系统信息前预先给TabBar设置深色模式
    this.presetDarkModeBeforeRendering();

    // 获取系统信息（使用新API替换旧的wx.getSystemInfo）
    try {
      // 获取窗口信息
      const windowInfo = wx.getWindowInfo();
      // 获取应用基本信息
      const appBaseInfo = wx.getAppBaseInfo();

      // 保存系统信息
      this.globalData.systemInfo = {
        ...windowInfo,
        ...appBaseInfo
      };

      // 如果没有用户存储的主题设置，则按系统主题设置
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

      // 应用初始主题
      this.applyTheme();
    } catch (err) {
      console.error('获取系统信息失败:', err);
      // 使用默认值
      this.applyTheme();
    }

    // 监听系统主题变化
    wx.onThemeChange((result) => {
      // 如果用户没有手动设置过主题，则跟随系统
      const themeSetting = wx.getStorageSync('themeSetting');
      if (!themeSetting) {
        this.globalData.darkMode = result.theme === 'dark';
        this.applyTheme();
      }
    });

    // 在应用启动时预先设置深色模式
    this.ensureDarkModePreset();

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },

  // 在应用启动时预先设置好深色模式，防止闪烁
  presetDarkModeBeforeRendering() {
    // 首先检查本地存储
    try {
      const themeSetting = wx.getStorageSync('themeSetting');
      if (themeSetting) {
        this.globalData.darkMode = themeSetting === 'dark';
        return;
      }

      // 如果没有本地存储，尝试读取系统设置
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

  // 确保深色模式在所有页面预设完成
  ensureDarkModePreset() {
    // 使用小程序提供的下一帧渲染机制确保样式被应用
    wx.nextTick(() => {
      // 强制更新所有页面的TabBar
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

  toggleDarkMode() {
    this.globalData.darkMode = !this.globalData.darkMode;

    // 保存主题设置到本地
    wx.setStorageSync('themeSetting', this.globalData.darkMode ? 'dark' : 'light');

    // 设置系统级深色模式状态 - 微信小程序7.0.0及以上版本支持
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

    // 应用主题变化
    this.applyTheme();

    return this.globalData.darkMode;
  },

  // 切换颜色主题
  changeColorTheme(theme) {
    this.globalData.colorTheme = theme;

    // 保存主题设置到本地
    wx.setStorageSync('colorTheme', theme);

    // 应用主题变化
    this.applyTheme();

    return this.globalData.colorTheme;
  },

  // 应用主题
  applyTheme() {
    // 触发主题变化事件，通知页面更新
    if (this.themeChangeCallback) {
      this.themeChangeCallback(this.globalData.darkMode, this.globalData.colorTheme);
    }

    // 设置导航栏样式
    this.updateNavBarStyle();

    // 立即更新自定义TabBar的深色模式
    this.updateTabBarDarkMode();

    // 在下一个渲染周期再次确保更新，防止闪烁
    wx.nextTick(() => {
      this.updateTabBarDarkMode();
    });
  },

  // 更新标签栏的深色模式状态
  updateTabBarDarkMode() {
    try {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        if (currentPage && currentPage.getTabBar) {
          const tabBar = currentPage.getTabBar();
          if (tabBar) {
            // 直接设置标签栏的深色模式状态
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

  // 获取当前主题的颜色
  getThemeColor() {
    switch (this.globalData.colorTheme) {
      case '天空蓝':
        return "#1296db";
      case '中国红':
        return "#e54d42";
      case '默认绿':
      default:
        return "#1aad19";
    }
  },

  // 更新导航栏样式以适应当前主题
  updateNavBarStyle() {
    const darkMode = this.globalData.darkMode;
    const colorTheme = this.globalData.colorTheme;

    let backgroundColor;

    // 根据颜色主题设置不同的背景色
    if (darkMode) {
      backgroundColor = '#222222'; // 深色模式统一使用深灰色
    } else {
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
    }

    wx.setNavigationBarColor({
      frontColor: '#ffffff',  // 统一使用白色文字
      backgroundColor: backgroundColor,
      animation: {
        duration: 0, // 移除动画，避免闪烁
        timingFunc: 'linear'
      }
    });
  },

  // 页面监听主题变化
  watchThemeChange(callback) {
    this.themeChangeCallback = callback;
    // 立即返回当前主题状态
    return {
      darkMode: this.globalData.darkMode,
      colorTheme: this.globalData.colorTheme
    };
  },

  // 取消监听主题变化
  unwatchThemeChange(component) {
    // 如果参数是指定组件，只移除该组件的回调
    if (component && this.themeChangeCallback === component.themeChangeCallback) {
      this.themeChangeCallback = null;
    }
  },

  globalData: {
    userInfo: null,
    darkMode: false, // 暗黑模式状态
    colorTheme: '默认绿', // 颜色主题
    systemInfo: null, // 系统信息
    // 旅游景点数据
    tourismSpots: [
      {
        id: 1,
        name: "西湖风景区",
        location: "浙江省杭州市",
        category: "自然风光",
        image: "/images/xihu.png", // 使用本地图片
        price: 80,
        rating: 4.8,
        description: "西湖，位于浙江省杭州市西湖区龙井路1号，杭州市区西部，景区总面积49平方千米，汇水面积为21.22平方千米，湖面面积为6.38平方千米。",
        features: ["千岛湖", "三潭印月", "断桥残雪", "雷峰塔"]
      },
      {
        id: 2,
        name: "故宫博物院",
        location: "北京市东城区",
        category: "历史遗迹",
        image: "/images/gugong.png", // 使用本地图片
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
        image: "/images/zhangjiajie.png", // 使用本地图片
        price: 225,
        rating: 4.7,
        description: "张家界国家森林公园是中国第一个国家森林公园，也是武陵源风景名胜区的核心景区，以典型的喀斯特地貌著称。",
        features: ["天子山", "袁家界", "金鞭溪", "黄石寨"]
      },
      {
        id: 4,
        name: "兵马俑博物馆",
        location: "陕西省西安市",
        category: "历史遗迹",
        image: "/images/bingmayong.png", // 使用本地图片
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
        image: "/images/sanya.png", // 使用本地图片
        price: 0,
        rating: 4.6,
        description: "亚龙湾位于海南省三亚市东南部，是海南岛最南端的一个半月形海湾，被称为\"天下第一湾\"。",
        features: ["沙滩", "潜水", "海上运动", "豪华酒店"]
      },
      {
        id: 6,
        name: "九寨沟风景区",
        location: "四川省阿坝藏族羌族自治州",
        category: "自然风光",
        image: "/images/jiuzhaigou.png", // 使用本地图片
        price: 190,
        rating: 4.8,
        description: "九寨沟位于四川省阿坝藏族羌族自治州九寨沟县，是中国第一个以保护自然风景为主要目的的自然保护区。",
        features: ["五彩池", "熊猫海", "诺日朗瀑布", "树正瀑布"]
      }
    ],
    // 旅游分类
    categories: [
      { id: 1, name: "自然风光", icon: "🏞️" },
      { id: 2, name: "历史遗迹", icon: "🏛️" },
      { id: 3, name: "海滨度假", icon: "🏖️" },
      { id: 4, name: "主题乐园", icon: "🎡" },
      { id: 5, name: "民俗文化", icon: "🏮" }
    ]
  }
})
