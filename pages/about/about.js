// pages/about/about.js
const app = getApp();

Page({
  data: {
    version: '1.0.0',
    appName: '旅游推荐',
    description: '为用户提供优质旅游景点推荐与预订服务的小程序',
    features: [
      { icon: '🏞️', title: '景点推荐', desc: '精选全国各地热门景点' },
      { icon: '🔍', title: '智能搜索', desc: '快速找到心仪的旅游目的地' },
      { icon: '🎫', title: '在线预订', desc: '便捷预订景点门票' },
      { icon: '❤️', title: '个性收藏', desc: '收藏喜爱的旅游景点' }
    ],
    developer: '旅游推荐开发团队',
    contactEmail: '2745296803@qq.com',
    isDarkMode: false, // 添加深色模式状态
    colorTheme: '默认绿' // 添加颜色主题状态
  },
  onLoad() {
    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,
        colorTheme: colorTheme
      });
    });

    // 初始化主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
  },
  onShow() {
    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  // 复制联系邮箱
  copyEmail() {
    wx.setClipboardData({
      data: this.data.contactEmail,
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
})