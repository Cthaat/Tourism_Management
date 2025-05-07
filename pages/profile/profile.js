// pages/profile/profile.js
const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    defaultAvatarUrl,
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseChooseAvatar: wx.canIUse('open-type.chooseAvatar'),
    favoriteCount: 0,
    bookingCount: 0,
    scrollTop: 0,       // 记录滚动位置
    lastScrollTop: 0,   // 上次滚动位置
    isDarkMode: false,  // 深色模式状态
    colorTheme: '默认绿' // 添加颜色主题变量
  },

  onLoad() {
    // 检查是否有用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
    }

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
    // 每次页面显示时更新收藏和预订数据
    this.updateCounters();

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }

    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  // 更新计数器
  updateCounters() {
    const favorites = wx.getStorageSync('favorites') || [];
    const bookings = wx.getStorageSync('bookings') || [];

    this.setData({
      favoriteCount: favorites.length,
      bookingCount: bookings.length
    });
  },

  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo;
        wx.setStorageSync('userInfo', userInfo);
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });

        // 显示欢迎提示
        wx.showToast({
          title: '欢迎回来，' + userInfo.nickName,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = this.data.userInfo;
    userInfo.avatarUrl = avatarUrl;

    this.setData({
      userInfo,
      hasUserInfo: userInfo.nickName && avatarUrl,
    });

    wx.setStorageSync('userInfo', userInfo);
  },

  // 页面导航
  navigateToPage(e) {
    const url = e.currentTarget.dataset.url;

    // 跳转到相应页面
    if (url === '/pages/favorites/favorites') {
      // 我的收藏
      if (this.data.favoriteCount > 0) {
        wx.navigateTo({ url });
      } else {
        wx.showToast({
          title: '暂无收藏',
          icon: 'none'
        });
      }
    } else if (url === '/pages/bookings/bookings') {
      // 我的预订
      if (this.data.bookingCount > 0) {
        wx.navigateTo({ url });
      } else {
        wx.showToast({
          title: '暂无预订记录',
          icon: 'none'
        });
      }
    } else if (url === '/pages/about/about' ||
      url === '/pages/feedback/feedback' ||
      url === '/pages/settings/settings') {
      wx.navigateTo({ url });
    } else {
      // 其他未完成的页面
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  },

  // 页面滚动事件处理
  onPageScroll(e) {
    const scrollTop = e.scrollTop;
    const lastScrollTop = this.data.lastScrollTop;

    // 滚动超过50px才触发TabBar显示/隐藏
    if (Math.abs(scrollTop - lastScrollTop) < 50) return;

    // 获取tabBar实例
    const tabBar = this.getTabBar();
    if (!tabBar) return;

    // 向下滚动隐藏TabBar，向上滚动显示TabBar
    if (scrollTop > lastScrollTop) {
      // 向下滚动，隐藏TabBar
      tabBar.toggleVisible(false);
    } else {
      // 向上滚动，显示TabBar
      tabBar.toggleVisible(true);
    }

    // 更新上次滚动位置
    this.setData({ lastScrollTop: scrollTop });
  }
})