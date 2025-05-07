// pages/category/category.js
const app = getApp()

Page({
  data: {
    pageTitle: '分类',
    filterType: 'all',  // 筛选类型：all, rating, price
    category: '',       // 当前分类
    type: '',           // 类型：hot, all
    spots: [],          // 景点列表
    scrollTop: 0,       // 记录滚动位置
    lastScrollTop: 0,   // 上次滚动位置
    isDarkMode: false,  // 添加黑暗模式状态变量
    colorTheme: '默认绿' // 添加颜色主题变量
  },

  onLoad(options) {
    const { category, type } = options;
    let pageTitle = '全部景点';
    let spots = [];

    // 获取全局数据
    const tourismSpots = app.globalData.tourismSpots || [];

    if (category) {
      // 按分类筛选
      pageTitle = category;
      spots = tourismSpots.filter(spot => spot.category === category);
    } else if (type === 'hot') {
      // 热门景点，按评分排序
      pageTitle = '热门推荐';
      spots = [...tourismSpots].sort((a, b) => b.rating - a.rating);
    } else {
      // 全部景点
      spots = tourismSpots;
    }

    this.setData({
      pageTitle,
      category,
      type,
      spots,
      originalSpots: spots // 保存原始数据用于筛选恢复
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
    // 检查是否有传入的分类参数
    if (app.globalData.currentCategory) {
      const category = app.globalData.currentCategory;
      app.globalData.currentCategory = null; // 使用后清空

      // 获取全局数据
      const tourismSpots = app.globalData.tourismSpots || [];

      // 按分类筛选
      const spots = tourismSpots.filter(spot => spot.category === category);

      this.setData({
        pageTitle: category,
        category,
        spots,
        originalSpots: spots
      });
    }

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
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

  // 改变筛选方式
  changeFilter(e) {
    const filterType = e.currentTarget.dataset.type;
    let spots = [...this.data.originalSpots]; // 使用原始数据

    // 根据筛选类型排序
    if (filterType === 'rating') {
      // 按评分从高到低排序
      spots.sort((a, b) => b.rating - a.rating);
    } else if (filterType === 'price') {
      // 按价格从低到高排序
      spots.sort((a, b) => a.price - b.price);
    }

    this.setData({
      filterType,
      spots
    });
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
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