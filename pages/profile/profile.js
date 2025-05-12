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
    canIUseChooseAvatar: wx.canIUse('button.open-type.chooseAvatar'),
    favoriteCount: 0,
    bookingCount: 0,
    scrollTop: 0,       // 记录滚动位置
    lastScrollTop: 0,   // 上次滚动位置
    isDarkMode: false,  // 深色模式状态
    colorTheme: '默认绿', // 添加颜色主题变量
    loginLoading: false, // 添加登录加载状态
    isEditingNickname: false, // 是否正在编辑昵称
    tempNickName: '' // 临时昵称存储
  }, onLoad() {
    // 检查是否有用户信息
    const userInfo = wx.getStorageSync('userInfo');
    console.log('用户信息:', userInfo);
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
    }

    // 检查基础库版本
    const systemInfo = wx.getSystemInfoSync();
    console.log('基础库版本:', systemInfo.SDKVersion);

    // 检查是否支持chooseAvatar
    const canIUseAvatar = wx.canIUse('button.open-type.chooseAvatar');
    console.log('支持chooseAvatar:', canIUseAvatar);

    this.setData({
      sdkVersion: systemInfo.SDKVersion,
      canIUseChooseAvatar: canIUseAvatar,
      tempNickName: '' // 添加临时昵称变量
    });

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
  // 获取用户信息并登录
  getUserProfile() {
    // 添加防抖，避免短时间内多次调用
    if (this.data.loginLoading) {
      return;
    }

    // 设置加载状态
    this.setData({
      loginLoading: true
    });

    // 直接使用微信的getUserProfile API
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        const userInfo = res.userInfo;
        wx.setStorageSync('userInfo', userInfo);
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
          loginLoading: false
        });

        // 显示欢迎提示
        wx.showToast({
          title: '欢迎回来，' + userInfo.nickName,
          icon: 'none',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error('登录失败:', err);
        this.setData({
          loginLoading: false
        });

        if (err.errMsg !== 'getUserProfile:fail auth deny') {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      }
    });
  },  // 选择头像（新版微信API）
  onChooseAvatar(e) {
    console.log('头像选择回调', e);
    // 检查是否存在avatarUrl，如果不存在可能是用户取消了
    if (e.detail && e.detail.avatarUrl) {
      const { avatarUrl } = e.detail;
      const userInfo = this.data.userInfo;
      userInfo.avatarUrl = avatarUrl;

      this.setData({
        userInfo,
        hasUserInfo: userInfo.nickName && userInfo.nickName !== '微信用户' && avatarUrl,
      });

      wx.setStorageSync('userInfo', userInfo);

      wx.showToast({
        title: '头像设置成功',
        icon: 'success',
        duration: 2000
      });
    } else {
      console.log('用户取消了头像选择');
      // 可以不做任何处理，或者显示提示
    }
  },
  // 进入编辑昵称状态
  editNickname() {
    this.setData({
      isEditingNickname: true,
      tempNickName: this.data.userInfo.nickName !== '微信用户' ? this.data.userInfo.nickName : ''
    });
  },

  // 输入昵称
  onInputNickname(e) {
    this.setData({
      tempNickName: e.detail.value
    });
  },

  // 保存昵称
  saveNickname(e) {
    const nickName = e.detail.value || this.data.tempNickName;
    if (nickName && nickName.trim() !== '') {
      const userInfo = this.data.userInfo;
      userInfo.nickName = nickName.trim();

      this.setData({
        userInfo,
        hasUserInfo: userInfo.nickName && userInfo.avatarUrl && userInfo.avatarUrl !== defaultAvatarUrl,
        isEditingNickname: false // 退出编辑模式
      });

      wx.setStorageSync('userInfo', userInfo);

      wx.showToast({
        title: '昵称设置成功',
        icon: 'success',
        duration: 2000
      });
    } else {
      // 如果输入为空，退出编辑模式但不保存
      this.setData({
        isEditingNickname: false
      });
    }
  },

  // 选择头像（旧版微信API的兼容处理）
  chooseAvatarLegacy() {
    wx.showToast({
      title: '正在打开相册',
      icon: 'none',
      duration: 1000
    });

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取图片临时路径
        const tempFilePath = res.tempFilePaths[0];

        // 更新用户头像
        const userInfo = this.data.userInfo;
        userInfo.avatarUrl = tempFilePath;

        this.setData({
          userInfo,
          hasUserInfo: userInfo.nickName && tempFilePath,
        });

        wx.setStorageSync('userInfo', userInfo);

        // 如果需要上传到服务器，可以在这里添加上传逻辑
        // wx.uploadFile({...})
      }
    });
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

  // 注销登录
  logout() {
    wx.showModal({
      title: '确认注销',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          wx.removeStorageSync('userInfo');

          // 重置用户信息
          this.setData({
            userInfo: {
              avatarUrl: defaultAvatarUrl,
              nickName: '',
            },
            hasUserInfo: false,
            isEditingNickname: false
          });

          wx.showToast({
            title: '已注销登录',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
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