/**
 * @file pages/category/category.js
 * @description 旅游管理小程序的分类页面业务逻辑
 * @version 1.0.0
 * @date 2025-05-13
 * @author Tourism_Management开发团队
 * 
 * 功能说明:
 * - 实现景点分类展示与筛选功能
 * - 支持按热门、评分、价格等条件筛选景点
 * - 提供分类切换功能与动画
 * - 支持多主题色和深色模式适配
 * - 管理分类选择器的显示与交互
 */

// 获取全局应用实例
const app = getApp()

Page({
  /**
   * 页面初始数据 - 定义页面所需的状态变量
   */
  data: {
    pageTitle: '分类',              // 页面标题 - 显示在页面顶部
    filterType: 'all',              // 筛选类型：all(全部), rating(评分), price(价格)
    category: '',                   // 当前选中的分类 - 用于筛选景点
    type: '',                       // 类型参数：hot(热门), all(全部) - 从页面参数获取
    spots: [],                      // 景点列表数据 - 当前显示的景点
    originalSpots: [],              // 原始景点数据 - 用于恢复筛选
    scrollTop: 0,                   // 当前滚动位置 - 记录列表滚动状态
    lastScrollTop: 0,               // 上次滚动位置 - 用于判断滚动方向
    isDarkMode: false,              // 深色模式状态 - 控制UI暗色适配
    colorTheme: '默认绿',            // 当前颜色主题 - 控制UI主题色
    showSelector: false,            // 是否显示分类选择器 - 控制底部选择面板
    pageScrollEnabled: true,        // 页面是否可滚动 - 弹窗时禁用滚动
    allCategories: []               // 所有分类数据数组 - 用于选择器展示
  },
  /**
   * 生命周期函数 - 页面加载时触发
   * @param {Object} options - 页面参数对象，包含路由传递的参数
   */
  onLoad(options) {
    // 详细调试输出 - 分类页接收参数
    console.log('=== 分类页接收参数调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('当前页面: category.js');
    console.log('接收到的options:', options);
    console.log('页面栈信息:', getCurrentPages().map(page => page.route));

    const { category = '', type = '' } = options; // 解构获取路由参数
    console.log('解析的参数:', {
      分类名称: category,
      分类类型: typeof category,
      类型参数: type,
      类型类型: typeof type
    });

    let pageTitle = '全部景点';                     // 默认页面标题
    let spots = [];                               // 初始化景点数组

    // 从全局数据获取景点信息
    const tourismSpots = app.globalData.tourismSpots || [];
    console.log('全局数据状态:', {
      景点总数: tourismSpots.length,
      分类总数: app.globalData.categories?.length || 0,
      当前全局分类: app.globalData.categories?.map(cat => cat.name) || []
    });    // 根据传入的分类参数筛选景点
    if (category) {
      // 按分类筛选景点 - 更新页面标题为分类名
      console.log('按分类筛选模式 - 分类名:', category);

      // 获取分类ID映射
      const categories = app.globalData.categories || [];
      const categoryInfo = categories.find(cat => cat.name === category);
      const categoryId = categoryInfo?.id;

      console.log('分类映射信息:', {
        分类名称: category,
        分类ID: categoryId,
        找到的分类信息: categoryInfo
      });

      spots = tourismSpots.filter(spot => {
        // 兼容新旧数据格式
        // 新格式：使用 category_id 字段
        if (spot.category_id !== undefined) {
          return parseInt(spot.category_id) === categoryId;
        }
        // 旧格式：使用 category 字段
        return spot.category === category;
      });

      pageTitle = category;
      console.log('分类筛选结果:', {
        筛选条件: category,
        分类ID: categoryId,
        匹配景点数: spots.length,
        匹配的景点: spots.map(spot => ({
          name: spot.name,
          category: spot.category,
          category_id: spot.category_id,
          使用字段: spot.category_id !== undefined ? 'category_id' : 'category'
        }))
      });
    } else if (type === 'hot') {
      // 热门景点，按评分排序
      console.log('热门推荐模式');
      pageTitle = '热门推荐';
      spots = [...tourismSpots].sort((a, b) => b.rating - a.rating);
      console.log('热门景点排序结果:', {
        前5个热门景点: spots.slice(0, 5).map(spot => ({ name: spot.name, rating: spot.rating })),
        总景点数: spots.length
      });
    } else {
      // 全部景点
      console.log('全部景点模式');
      spots = tourismSpots;
      console.log('显示全部景点:', spots.length, '个');
    }

    console.log('最终页面设置:', {
      页面标题: pageTitle,
      景点数量: spots.length,
      分类状态: category,
      类型状态: type
    });

    this.setData({
      pageTitle,
      category,
      type,
      spots,
      originalSpots: spots, // 保存原始数据用于筛选恢复
      allCategories: app.globalData.categories || [] // 获取所有分类数据
    });

    console.log('✅ 分类页数据加载成功');
    console.log('========================');// 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,        // 更新深色模式状态
        colorTheme: colorTheme       // 更新颜色主题
      });
    });

    // 初始化主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,      // 从全局获取深色模式状态
      colorTheme: app.globalData.colorTheme     // 从全局获取颜色主题
    });
  },

  /**
   * 生命周期函数 - 页面显示时触发
   */
  onShow() {
    // 检查是否有传入的分类参数 - 处理从其他页面传入的分类
    if (app.globalData.currentCategory) {
      const category = app.globalData.currentCategory;
      app.globalData.currentCategory = null; // 使用后清空全局变量      // 获取全局数据
      const tourismSpots = app.globalData.tourismSpots || [];

      let spots = [];      // 如果是"全部"分类，显示所有景点
      if (category === "全部") {
        spots = [...tourismSpots];
      } else {
        // 获取分类ID映射
        const categories = app.globalData.categories || [];
        const categoryInfo = categories.find(cat => cat.name === category);
        const categoryId = categoryInfo?.id;

        // 按具体分类筛选
        spots = tourismSpots.filter(spot => {
          // 兼容新旧数据格式
          // 新格式：使用 category_id 字段
          if (spot.category_id !== undefined) {
            return parseInt(spot.category_id) === categoryId;
          }
          // 旧格式：使用 category 字段
          return spot.category === category;
        });
      }

      // 更新页面数据
      this.setData({
        pageTitle: category,         // 更新页面标题为分类名
        category,                    // 更新当前分类
        spots,                       // 更新筛选后的景点列表
        originalSpots: spots         // 保存原始数据用于筛选恢复
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: category
      });
    }    // 更新自定义tabBar的选中状态 - 确保底部栏正确高亮当前页面
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar();
      // 强制更新TabBar状态
      tabBar.setData({
        selected: 1,  // 1 表示分类页，对应tabBar的索引
        preventTransition: false,
        isDarkMode: app.globalData.darkMode,
        selectedColor: app.globalData.darkMode ? "#ffffff" : tabBar._getThemeColor(app.globalData.colorTheme || '默认绿')
      });
      console.log('分类页TabBar已更新，选中索引: 1');
    }

    // 更新主题状态 - 确保与全局状态同步
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme,
      allCategories: app.globalData.categories || [] // 获取所有分类数据，确保数据最新
    });

    // 确保导航栏颜色更新 - 应用全局导航栏样式
    app.updateNavBarStyle();
  },

  /**
   * 显示分类选择器 - 弹出底部分类选择面板
   */
  showCategorySelector() {
    // 显示选择器前添加震动反馈 - 提升用户体验
    wx.vibrateShort({
      type: 'light'  // 轻微振动
    });

    // 禁止页面滚动 - 避免底部弹出层显示时页面可滚动
    this.setData({
      showSelector: true,          // 显示选择器
      pageScrollEnabled: false     // 禁用页面滚动
    });

    // 将主页面滚动设置为固定 - 防止背景页面滚动
    wx.pageScrollTo({
      scrollTop: 0,      // 滚动到顶部
      duration: 0        // 立即执行，无动画
    });

    // 添加样式禁止主页面滚动 - 修改DOM节点样式
    wx.createSelectorQuery()
      .select('.container')
      .node()
      .exec((res) => {
        if (res[0] && res[0].node) {
          res[0].node.style.overflow = 'hidden';    // 隐藏溢出内容
          res[0].node.style.position = 'fixed';     // 固定位置
          res[0].node.style.width = '100%';         // 保持宽度
        }
      });
  },

  /**
   * 隐藏分类选择器 - 关闭底部分类选择面板
   */
  hideCategorySelector() {
    // 恢复页面滚动状态
    this.setData({
      showSelector: false,     // 隐藏选择器
      pageScrollEnabled: true  // 启用页面滚动
    });

    // 恢复主页面的滚动能力 - 还原DOM节点样式
    wx.createSelectorQuery()
      .select('.container')
      .node()
      .exec((res) => {
        if (res[0] && res[0].node) {
          res[0].node.style.overflow = '';     // 还原溢出处理
          res[0].node.style.position = '';     // 还原定位方式
          res[0].node.style.width = '';        // 还原宽度设置
        }
      });
  },

  /**
   * 选择分类 - 处理用户分类选择
   * @param {Object} e - 事件对象
   */
  selectCategory(e) {
    const selectedCategory = e.currentTarget.dataset.category; // 获取选中的分类名称

    // 添加触感反馈 - 提升用户体验
    wx.vibrateShort({
      type: 'light'  // 轻微振动
    });

    // 获取全局景点数据
    const tourismSpots = app.globalData.tourismSpots || [];

    let spots = [];    // 根据所选分类筛选景点数据
    // 如果是"全部"分类，显示所有景点
    if (selectedCategory === "全部") {
      spots = [...tourismSpots];  // 复制全部景点数据
    } else {
      // 获取分类ID映射
      const categories = app.globalData.categories || [];
      const categoryInfo = categories.find(cat => cat.name === selectedCategory);
      const categoryId = categoryInfo?.id;

      // 按具体分类筛选对应景点
      spots = tourismSpots.filter(spot => {
        // 兼容新旧数据格式
        // 新格式：使用 category_id 字段
        if (spot.category_id !== undefined) {
          return parseInt(spot.category_id) === categoryId;
        }
        // 旧格式：使用 category 字段
        return spot.category === selectedCategory;
      });
    }// 更新数据
    this.setData({
      pageTitle: selectedCategory,      // 更新页面标题
      category: selectedCategory,       // 更新当前分类
      spots,                            // 更新筛选后的景点列表
      originalSpots: spots,             // 保存原始数据用于筛选恢复
      filterType: 'all',                // 重置筛选类型为全部
      showSelector: false               // 隐藏分类选择器
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: selectedCategory
    });
  },

  /**
   * 防止触摸穿透 - 阻止底层元素接收触摸事件
   */
  preventTouchMove() {
    // 阻止事件冒泡和默认行为
    return false;
  },

  /**
   * 改变筛选方式 - 对景点列表进行排序
   * @param {Object} e - 事件对象
   */
  changeFilter(e) {
    const filterType = e.currentTarget.dataset.type; // 获取筛选类型
    let spots = [...this.data.originalSpots]; // 复制原始数据，避免直接修改

    // 根据不同筛选类型进行排序
    if (filterType === 'rating') {
      // 按评分从高到低排序 - 评分高的景点排在前面
      spots.sort((a, b) => b.rating - a.rating);
    } else if (filterType === 'price') {
      // 按价格从低到高排序 - 价格便宜的景点排在前面      spots.sort((a, b) => a.price - b.price);
    }

    // 更新页面数据
    this.setData({
      filterType,        // 更新当前筛选类型
      spots              // 更新筛选排序后的景点列表
    });
  },
  /**
   * 跳转到详情页 - 跳转到指定景点的详情页面
   * @param {Object} e - 事件对象
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id; // 获取景点ID
    const dataset = e.currentTarget.dataset;

    // 详细调试输出
    console.log('=== 分类页跳转到详情页调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('源页面: category.js');
    console.log('目标页面: detail.js');
    console.log('景点ID:', id);
    console.log('ID类型:', typeof id);
    console.log('完整dataset:', dataset);
    console.log('当前分类页状态:', {
      当前分类: this.data.category,
      当前页面标题: this.data.pageTitle,
      景点总数: this.data.spots?.length || 0,
      热门景点数: this.data.hotSpots?.length || 0,
      已选分类: this.data.selectedCategory
    });

    // 查找当前景点的详细信息
    const currentSpot = this.data.spots?.find(spot => spot.id === id || spot.id === parseInt(id));
    if (currentSpot) {
      console.log('找到景点详情:', {
        name: currentSpot.name,
        category: currentSpot.category,
        location: currentSpot.location,
        价格: currentSpot.price,
        评分: currentSpot.rating,
        数据格式: currentSpot.location?.geopoint ? '新格式' : '旧格式'
      });
    } else {
      console.warn('⚠️ 未在当前分类页数据中找到景点ID:', id);
      console.log('当前spots数据前3个:', this.data.spots?.slice(0, 3));
    }

    const targetUrl = `/pages/detail/detail?id=${id}`;
    console.log('跳转URL:', targetUrl);

    // 添加过渡动画效果 - 增强用户体验
    wx.showLoading({
      title: '加载中...',
      mask: true      // 显示透明蒙层，防止触摸穿透
    });

    // 延迟跳转，配合加载动画效果
    setTimeout(() => {
      wx.hideLoading();  // 隐藏加载提示
      wx.navigateTo({
        url: targetUrl,  // 跳转到详情页并传递景点ID
        success: () => {
          console.log('✅ 分类页->详情页跳转成功: ' + id);
          console.log('============================');
        },
        fail: (error) => {
          console.error('❌ 分类页->详情页跳转失败:', error);
          console.error('失败的URL:', targetUrl);
          console.log('============================');
        }
      });
    }, 150);  // 150毫秒的延迟，提供平滑过渡
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