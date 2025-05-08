// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    // 搜索关键词
    searchKeyword: '',
    // 轮播图数据，选取了几个精选景点
    banners: [],
    // 分类数据
    categories: [],
    // 热门景点，选取评分最高的几个
    hotSpots: [],
    // 全部景点
    spots: [],
    allSpots: [],
    scrollTop: 0, // 记录滚动位置
    lastScrollTop: 0, // 上次滚动位置
    isDarkMode: false, // 添加黑暗模式状态变量
    colorTheme: '默认绿' // 添加颜色主题变量
  },
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  onLoad() {
    // 初始化数据
    this.initData();

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
    // 每次页面显示时刷新数据
    this.initData();

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
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
  },

  // 初始化数据
  initData() {
    const tourismSpots = app.globalData.tourismSpots || [];
    const categories = app.globalData.categories || [];

    // 轮播图（取评分最高的3个）
    const banners = [...tourismSpots]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);

    // 热门推荐（取评分最高的2个）
    const hotSpots = [...tourismSpots]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);

    // 全部景点
    const allSpots = [...tourismSpots];

    this.setData({
      banners,
      categories,
      hotSpots,
      allSpots
    });
  },

  // 搜索输入事件
  onSearchInput(e) {
    const searchKeyword = e.detail.value;
    this.setData({ searchKeyword });

    // 如果关键词为空，显示全部景点
    if (!searchKeyword) {
      this.setData({ spots: app.globalData.tourismSpots });
      return;
    }

    // 根据关键词筛选景点
    const filteredSpots = app.globalData.tourismSpots.filter(spot =>
      spot.name.includes(searchKeyword) ||
      spot.location.includes(searchKeyword) ||
      spot.description.includes(searchKeyword)
    );

    this.setData({ spots: filteredSpots });
  },

  // 前往搜索页面
  goToSearch() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    });
  },

  // 跳转到详情页
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 前往景点详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 跳转到分类页
  navigateToCategory(e) {
    const category = e.currentTarget.dataset.category;
    wx.navigateTo({
      url: `/pages/category/category?category=${category}`
    });
  },

  // 前往分类页面
  goToCategory(e) {
    const category = e.currentTarget.dataset.category;

    // 添加淡出效果
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 先设置全局变量，再进行页面跳转
    app.globalData.currentCategory = category;

    // 延迟一小段时间后跳转，增加过渡效果
    setTimeout(() => {
      wx.hideLoading();
      wx.switchTab({
        url: '/pages/category/category',
        success: () => {
          // 页面跳转成功后的额外处理
          console.log('成功跳转到分类页: ' + category);
        }
      });
    }, 200);
  },

  // 查看更多
  navigateToMore(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/category/category?type=${type}`
    });
  },

  // 查看更多热门景点
  goToMoreHot() {
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 查看全部景点
  goToAllSpots() {
    // 添加淡出效果
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 设置全局变量为"全部"，表示查看所有景点
    app.globalData.currentCategory = "全部";

    // 延迟一小段时间后跳转，增加过渡效果
    setTimeout(() => {
      wx.hideLoading();
      wx.switchTab({
        url: '/pages/category/category',
        success: () => {
          console.log('成功跳转到全部景点分类页');
        }
      });
    }, 200);
  }
})
