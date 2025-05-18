/**
 * 文件名: index.js
 * 描述: 旅游管理微信小程序的自定义TabBar组件JS文件
 * 版本: 1.0.0
 * 创建日期: 2023-05-13
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 实现自定义底部导航栏的交互逻辑
 * - 管理导航项的选中状态和页面跳转
 * - 支持主题模式切换（深色/浅色）
 * - 提供TabBar显示/隐藏控制功能
 */

Component({
  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,                 // 当前选中的标签索引
    color: "#8a8a8a",            // 未选中标签的颜色
    selectedColor: "#ffffff",    // 选中标签的颜色（默认为白色，避免绿色闪烁）
    visible: true,               // 控制TabBar显示/隐藏状态
    isDarkMode: false,           // 是否为暗黑模式标志
    colorTheme: '默认绿',        // 颜色主题名称
    preventTransition: true,     // 防止过渡动画标志，避免闪烁
    list: [                      // 标签项配置列表
      {
        pagePath: "/pages/index/index",  // 首页路径
        text: "首页",                    // 标签文本
        iconPath: "/images/home.png",    // 未选中图标
        selectedIconPath: "/images/home_selected.png" // 选中图标
      },
      {
        pagePath: "/pages/category/category", // 分类页路径
        text: "分类",                         // 标签文本
        iconPath: "/images/category.png",     // 未选中图标
        selectedIconPath: "/images/category_selected.png" // 选中图标
      },
      {
        pagePath: "/pages/profile/profile",   // 个人页路径
        text: "我的",                         // 标签文本
        iconPath: "/images/profile.png",      // 未选中图标
        selectedIconPath: "/images/profile_selected.png" // 选中图标
      }
    ]
  },  /**
   * 组件生命周期函数
   */
  lifetimes: {
    /**
     * 组件实例刚刚被创建时执行
     * 在created生命周期就预先检测是否为深色模式，确保尽早应用正确的主题
     */
    created: function () {
      this._checkDarkModeEarly();
    },

    /**
     * 组件实例进入页面节点树时执行
     * 完整初始化组件状态，获取全局配置
     */
    attached: function () {
      // 预先设置深色模式，不等待系统或全局变量
      this._checkDarkModeEarly();

      // 获取全局应用实例
      const app = getApp();
      if (app && app.globalData) {
        // 从全局数据获取深色模式设置
        const isDarkMode = !!app.globalData.darkMode;

        // 更新数据
        this.setData({
          isDarkMode: isDarkMode,
          selectedColor: isDarkMode ? "#ffffff" : this._getThemeColor(app.globalData.colorTheme || '默认绿'),
          colorTheme: app.globalData.colorTheme || '默认绿'
        });

        // 监听主题变化
        app.watchThemeChange && app.watchThemeChange((darkMode, theme) => {
          this.setData({
            isDarkMode: darkMode,
            selectedColor: darkMode ? "#ffffff" : this._getThemeColor(theme),
            colorTheme: theme,
            preventTransition: true // 暂时禁用过渡效果
          });

          // 延迟恢复过渡效果
          setTimeout(() => {
            this.setData({
              preventTransition: false
            });
          }, 500);
        });
      }

      // 获取当前选中的标签
      setTimeout(() => {
        this.setData({
          selected: this._getTabIndex()
        });
      }, 10);
    },
    detached: function () {
      // 清理监听
      const app = getApp();
      if (app && app.unwatchThemeChange) {
        app.unwatchThemeChange(this);
      }
    }
  }, pageLifetimes: {
    show: function () {
      // 标签栏所在页面被展示时执行
      this._checkDarkModeEarly(); // 提前检查深色模式

      // 获取当前索引
      const currentIndex = this._getTabIndex();
      console.log('页面显示，当前索引:', currentIndex);

      // 更新选中的标签
      this.setData({
        selected: currentIndex
      });

      // 确保深色模式状态正确
      this._forceDarkModeIfNeeded();

      // 强制刷新当前页面的TabBar状态
      const app = getApp();
      if (app && app.globalData) {
        // 从全局数据获取深色模式和主题设置
        const isDarkMode = !!app.globalData.darkMode;
        const colorTheme = app.globalData.colorTheme || '默认绿';

        // 确保TabBar样式与全局设置一致
        this.setData({
          isDarkMode: isDarkMode,
          selectedColor: isDarkMode ? "#ffffff" : this._getThemeColor(colorTheme),
          colorTheme: colorTheme,
          selected: currentIndex,
          preventTransition: false
        });
      }
    }
  },
  methods: {
    // 预先检查深色模式状态
    _checkDarkModeEarly: function () {
      try {
        // 1. 首先尝试从全局状态获取深色模式设置
        const app = getApp();
        if (app && app.globalData && app.globalData.darkMode !== undefined) {
          this.data.isDarkMode = !!app.globalData.darkMode;
          return;
        }

        // 2. 然后尝试从系统获取深色模式设置
        try {
          const appBaseInfo = wx.getAppBaseInfo();
          this.data.isDarkMode = appBaseInfo.theme === 'dark';
        } catch (e) {
          console.error('获取系统深色模式失败:', e);

          // 3. 最后尝试从本地存储获取设置
          try {
            const themeSetting = wx.getStorageSync('themeSetting');
            this.data.isDarkMode = themeSetting === 'dark';
          } catch (e) {
            console.error('获取本地存储主题设置失败:', e);
          }
        }
      } catch (e) {
        console.error('初始化深色模式状态失败:', e);
      }
    },

    // 强制应用深色模式
    _forceDarkModeIfNeeded: function () {
      const app = getApp();
      if (!app || !app.globalData) return;

      if (app.globalData.darkMode) {
        // 立即设置深色模式样式
        this.setData({
          isDarkMode: true,
          selectedColor: "#ffffff",
          preventTransition: true
        });
      }
    },

    // 获取当前标签索引
    _getTabIndex: function () {
      try {
        const pages = getCurrentPages();
        if (!pages || pages.length === 0) {
          return 0;
        }

        const currentPage = pages[pages.length - 1];
        const url = `/${currentPage.route}`;

        // 调试输出
        console.log('当前页面路径:', url);
        console.log('TabBar列表:', this.data.list);

        // 更精确的路径匹配
        for (let i = 0; i < this.data.list.length; i++) {
          if (url === this.data.list[i].pagePath) {
            console.log('匹配到索引:', i);
            return i;
          }
        }

        // 兜底处理
        return 0;
      } catch (error) {
        console.error('获取当前Tab索引出错:', error);
        return 0;
      }
    },

    // 获取主题颜色
    _getThemeColor: function (theme) {
      switch (theme) {
        case '天空蓝':
          return "#1296db";
        case '中国红':
          return "#e54d42";
        case '默认绿':
        default:
          return "#1aad19";
      }
    },    // 切换标签
    switchTab: function (e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      const index = data.index;

      console.log('切换到页面:', url, '索引:', index);

      // 预先设置深色模式
      this._checkDarkModeEarly();
      this._forceDarkModeIfNeeded();

      // 立即更新选中的标签，提高响应速度
      this.setData({
        selected: index
      });

      // 跳转页面
      wx.switchTab({
        url,
        success: () => {
          console.log('页面切换成功');
          // 成功后确保TabBar状态正确
          setTimeout(() => {
            this.setData({
              selected: index,  // 再次确认选中状态
              preventTransition: false
            });
            this._forceDarkModeIfNeeded();
          }, 100);
        },
        fail: (error) => {
          console.error('页面切换失败:', error);
        }
      });
    },

    // 控制标签栏显示/隐藏
    toggleVisible: function (visible) {
      this.setData({
        visible
      });
    }
  }
})