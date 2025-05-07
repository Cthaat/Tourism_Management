// pages/settings/settings.js
const app = getApp(); // 获取app实例

Page({
  data: {
    settings: [
      {
        id: 'notification',
        name: '通知设置',
        items: [
          { id: 'push', name: '推送通知', type: 'switch', value: true },
          { id: 'sound', name: '通知声音', type: 'switch', value: true },
          { id: 'vibrate', name: '振动', type: 'switch', value: true }
        ]
      },
      {
        id: 'preference',
        name: '偏好设置',
        items: [
          { id: 'language', name: '语言', type: 'select', value: '简体中文', options: ['简体中文', '繁体中文', 'English'] },
          { id: 'theme', name: '主题', type: 'select', value: '默认绿', options: ['默认绿', '天空蓝', '中国红'] },
          { id: 'darkMode', name: '深色模式', type: 'switch', value: false }
        ]
      },
      {
        id: 'data',
        name: '数据与存储',
        items: [
          { id: 'autoClean', name: '自动清理缓存', type: 'switch', value: false },
          { id: 'cache', name: '清除缓存', type: 'button', value: '0.00MB' }
        ]
      },
      {
        id: 'about',
        name: '其他',
        items: [
          { id: 'feedback', name: '意见反馈', type: 'link', path: '/pages/feedback/feedback' },
          { id: 'about', name: '关于我们', type: 'link', path: '/pages/about/about' },
          { id: 'version', name: '当前版本', type: 'text', value: 'v1.0.0' }
        ]
      }
    ],
    isDarkMode: false, // 添加黑暗模式状态变量
    colorTheme: '默认绿', // 添加颜色主题状态变量
    themes: [
      { id: 'default', name: '默认绿', checked: true },
      { id: 'blue', name: '天空蓝', checked: false },
      { id: 'red', name: '中国红', checked: false }
    ]
  },

  onLoad() {
    // 获取当前深色模式和颜色主题状态
    const darkMode = app.globalData.darkMode;
    const colorTheme = app.globalData.colorTheme;

    // 设置初始状态
    this.setData({
      'settings[1].items[2].value': darkMode,
      'settings[1].items[1].value': colorTheme,
      isDarkMode: darkMode,
      colorTheme: colorTheme
    });

    // 初始化缓存大小
    this.getCacheSize();

    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,
        'settings[1].items[2].value': darkMode,
        colorTheme: colorTheme,
        'settings[1].items[1].value': colorTheme
      });

      // 更新选中状态
      this.updateThemeSelection(colorTheme);
    });

    // 更新选中状态
    this.updateThemeSelection(app.globalData.colorTheme);
  },

  onShow() {
    // 每次页面显示时更新深色模式状态和颜色主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      'settings[1].items[2].value': app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme,
      'settings[1].items[1].value': app.globalData.colorTheme
    });

    // 更新选中状态
    this.updateThemeSelection(app.globalData.colorTheme);

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  // 更新主题选中状态
  updateThemeSelection(colorTheme) {
    const themes = this.data.themes.map(theme => {
      return {
        ...theme,
        checked: theme.name === colorTheme
      };
    });
    this.setData({ themes });
  },

  // 切换开关设置
  switchChange(e) {
    const { settingindex, itemindex } = e.currentTarget.dataset;
    const settingPath = `settings[${settingindex}].items[${itemindex}].value`;
    const newValue = e.detail.value;

    // 特殊处理深色模式切换
    if (settingindex === 1 && itemindex === 2) {
      // 切换全局暗黑模式状态
      const isDarkMode = app.toggleDarkMode();

      // 更新本地状态
      this.setData({
        [settingPath]: isDarkMode,
        isDarkMode: isDarkMode
      });
    } else {
      // 处理其他开关设置
      this.setData({
        [settingPath]: newValue
      });
    }

    // 在实际应用中，这里会保存设置到本地存储
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1000
    });
  },

  // 打开选择器
  openPicker(e) {
    const { settingindex, itemindex } = e.currentTarget.dataset;
    const item = this.data.settings[settingindex].items[itemindex];

    wx.showActionSheet({
      itemList: item.options,
      success: (res) => {
        const settingPath = `settings[${settingindex}].items[${itemindex}].value`;
        const selectedValue = item.options[res.tapIndex];

        // 特殊处理主题颜色切换
        if (settingindex === 1 && itemindex === 1) {
          // 调用app的颜色主题切换方法
          const newColorTheme = app.changeColorTheme(selectedValue);

          // 更新本地状态
          this.setData({
            [settingPath]: newColorTheme,
            colorTheme: newColorTheme
          });

          // 更新选中状态
          this.updateThemeSelection(newColorTheme);
        } else {
          // 处理其他选择器设置
          this.setData({
            [settingPath]: selectedValue
          });
        }

        // 保存设置并提示
        wx.showToast({
          title: '设置已保存',
          icon: 'success',
          duration: 1000
        });
      }
    });
  },

  // 计算缓存大小
  getCacheSize() {
    // 在实际应用中，这里会调用相关API计算缓存大小
    // 这里简单模拟一个值
    const cacheSize = (Math.random() * 5).toFixed(2) + 'MB';
    this.setData({
      'settings[2].items[1].value': cacheSize
    });
  },

  // 清理缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清理中...',
          });

          // 模拟清理过程
          setTimeout(() => {
            wx.hideLoading();
            this.setData({
              'settings[2].items[1].value': '0.00MB'
            });

            wx.showToast({
              title: '清理完成',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },

  // 页面导航
  navigate(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({
      url: path
    });
  }
});