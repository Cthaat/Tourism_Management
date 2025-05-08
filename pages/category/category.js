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
    colorTheme: '默认绿', // 添加颜色主题变量
    showSelector: false, // 是否显示分类选择器
    allCategories: []   // 所有分类数据
  },

  onLoad(options) {
    const { category = '', type = '' } = options;
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
      originalSpots: spots, // 保存原始数据用于筛选恢复
      allCategories: app.globalData.categories || [] // 获取所有分类数据
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

      let spots = [];

      // 如果是"全部"分类，显示所有景点
      if (category === "全部") {
        spots = [...tourismSpots];
      } else {
        // 按具体分类筛选
        spots = tourismSpots.filter(spot => spot.category === category);
      }

      this.setData({
        pageTitle: category,
        category,
        spots,
        originalSpots: spots
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: category
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
      colorTheme: app.globalData.colorTheme,
      allCategories: app.globalData.categories || [] // 获取所有分类数据，确保数据最新
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  // 显示分类选择器
  showCategorySelector() {
    // 显示选择器前添加震动反馈
    wx.vibrateShort({
      type: 'light'
    });

    // 禁止页面滚动
    this.setData({
      showSelector: true,
      pageScrollEnabled: false
    });

    // 将主页面滚动设置为固定
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });

    // 添加样式禁止主页面滚动
    wx.createSelectorQuery()
      .select('.container')
      .node()
      .exec((res) => {
        if (res[0] && res[0].node) {
          res[0].node.style.overflow = 'hidden';
          res[0].node.style.position = 'fixed';
          res[0].node.style.width = '100%';
        }
      });
  },

  // 隐藏分类选择器
  hideCategorySelector() {
    // 恢复页面滚动
    this.setData({
      showSelector: false,
      pageScrollEnabled: true
    });

    // 恢复主页面的滚动能力
    wx.createSelectorQuery()
      .select('.container')
      .node()
      .exec((res) => {
        if (res[0] && res[0].node) {
          res[0].node.style.overflow = '';
          res[0].node.style.position = '';
          res[0].node.style.width = '';
        }
      });
  },

  // 选择分类
  selectCategory(e) {
    const selectedCategory = e.currentTarget.dataset.category;

    // 添加触感反馈
    wx.vibrateShort({
      type: 'light'
    });

    // 获取全局数据
    const tourismSpots = app.globalData.tourismSpots || [];

    let spots = [];

    // 如果是"全部"分类，显示所有景点
    if (selectedCategory === "全部") {
      spots = [...tourismSpots];
    } else {
      // 按具体分类筛选
      spots = tourismSpots.filter(spot => spot.category === selectedCategory);
    }

    // 更新数据
    this.setData({
      pageTitle: selectedCategory,
      category: selectedCategory,
      spots,
      originalSpots: spots,
      filterType: 'all', // 重置筛选
      showSelector: false // 隐藏选择器
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: selectedCategory
    });
  },

  // 防止触摸穿透
  preventTouchMove() {
    // 阻止事件冒泡和默认行为
    return false;
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

    // 添加过渡动画效果
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`,
        success: () => {
          console.log('成功跳转到景点详情页: ' + id);
        }
      });
    }, 150);
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