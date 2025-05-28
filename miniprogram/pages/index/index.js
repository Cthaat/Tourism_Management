/**
 * 文件名: index.js
 * 描述: 旅游管理微信小程序首页逻辑文件
 * 版本: 1.0.0
 * 创建日期: 2023-05-13
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 首页主视图的交互和数据管理
 * - 用户信息获取和管理
 * - 旅游景点列表和搜索功能
 * - 轮播图和分类展示
 * - 主题模式切换（深色/浅色）
 */

// 默认头像图片URL，当用户未授权头像时使用
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
// 获取应用实例，用于全局状态管理
const app = getApp()

/**
 * 首页页面对象
 */
Page({
  /**
   * 页面的初始数据对象
   */  data: {
    motto: 'Hello World',             // 欢迎语
    userInfo: {                       // 用户信息对象
      avatarUrl: defaultAvatarUrl,    // 默认头像URL
      nickName: '',                   // 用户昵称
    },
    hasUserInfo: false,               // 是否已获取用户信息标志
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),       // 检测getUserProfile接口可用性
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),    // 检测昵称输入组件可用性
    searchKeyword: '',                // 搜索关键词
    banners: [],                      // 轮播图数据数组，包含精选景点
    categories: [],                   // 景点分类数据数组
    hotSpots: [],                     // 热门景点数组，包含评分最高的景点
    spots: [],                        // 当前显示的景点数组
    allSpots: [],                     // 全部景点数据数组
    scrollTop: 0,                     // 记录当前页面滚动位置
    lastScrollTop: 0,                 // 记录上次滚动位置，用于计算滚动方向
    isDarkMode: false,                // 深色模式状态标志
    colorTheme: '默认绿',             // 当前应用的颜色主题名称
    loading: false,                   // 数据加载状态标志
    isReachBottomLoading: false       // 上拉刷新加载状态标志
  },

  /**
   * 视图点击事件处理函数
   */
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
  }, onLoad() {
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

    // 等待app.js中的景点数据加载完成后再初始化数据
    console.log('index页面等待景点数据加载完成...');
    app.onSpotDataReady((spotData) => {
      console.log('收到景点数据加载完成通知，开始初始化首页数据');
      this.initData();
    });
  }, onShow() {
    // 检查数据是否已经准备就绪
    if (app.globalData.spotsDataReady) {
      // 数据已经准备就绪，直接刷新
      console.log('数据已准备就绪，直接刷新首页数据');
      this.initData();
    } else {
      // 数据还未准备就绪，等待加载完成
      console.log('数据未准备就绪，等待数据加载完成...');
      app.onSpotDataReady((spotData) => {
        console.log('收到数据加载完成通知，刷新首页数据');
        this.initData();
      });
    }

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar();
      // 强制更新TabBar状态
      tabBar.setData({
        selected: 0,
        preventTransition: false,
        isDarkMode: app.globalData.darkMode,
        selectedColor: app.globalData.darkMode ? "#ffffff" : tabBar._getThemeColor(app.globalData.colorTheme || '默认绿')
      });
      console.log('首页TabBar已更新，选中索引: 0');
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
  /**
   * 下拉刷新事件处理
   * 重新从云端数据库获取最新的景点数据（包括图片）
   */
  async onPullDownRefresh() {
    console.log('=== 🔄 首页下拉刷新开始 ===');
    console.log('刷新时间:', new Date().toLocaleString());

    try {
      // 显示加载状态（可选，因为已有系统下拉刷新动画）
      this.setData({ loading: true });

      // 调用app.js中的刷新方法强制从云端获取最新数据
      console.log('正在从云端重新获取景点数据和图片...');
      const refreshResult = await app.refreshSpotData();

      if (refreshResult.success) {
        console.log('✅ 云端数据获取成功，景点数量:', refreshResult.count);

        // 重新初始化页面数据
        this.initData();

        // 显示成功提示
        wx.showToast({
          title: `刷新成功，获取${refreshResult.count}个景点`,
          icon: 'success',
          duration: 2000
        });

        console.log('首页数据刷新完成');
      } else {
        console.log('❌ 云端数据获取失败:', refreshResult.error);

        // 即使云端失败，也尝试重新初始化数据（可能使用缓存数据）
        this.initData();

        // 显示错误提示
        wx.showToast({
          title: '刷新失败，使用缓存数据',
          icon: 'none',
          duration: 2000
        });
      }

    } catch (error) {
      console.error('下拉刷新异常:', error);

      // 异常情况下也尝试重新初始化数据
      this.initData();

      wx.showToast({
        title: '刷新异常，请重试',
        icon: 'none',
        duration: 2000
      });
    } finally {
      // 隐藏加载状态
      this.setData({ loading: false });

      // 停止下拉刷新动画
      wx.stopPullDownRefresh();

      console.log('=== 🔄 首页下拉刷新结束 ===');
    }
  },
  /**
   * 上拉刷新事件处理（触底时触发）
   * 重新从云端数据库获取最新的景点数据和图片，效果等同于重新进入小程序
   */
  async onReachBottom() {
    console.log('=== 📱 首页上拉刷新开始 ===');
    console.log('触发时间:', new Date().toLocaleString());

    // 防止重复触发
    if (this.data.isReachBottomLoading) {
      console.log('上拉刷新正在进行中，忽略重复触发');
      return;
    }

    try {
      // 设置加载状态，防止重复触发
      this.setData({
        isReachBottomLoading: true,
        loading: true
      });

      // 显示加载提示
      wx.showLoading({
        title: '正在获取最新数据和图片...',
        mask: true
      });

      console.log('正在从云端重新获取景点数据和图片...');

      // 调用app.js中的刷新方法强制从云端获取最新数据（包括图片）
      const refreshResult = await app.refreshSpotData();

      if (refreshResult.success) {
        console.log('✅ 云端数据获取成功，景点数量:', refreshResult.count);

        // 重新初始化页面数据
        this.initData();

        // 显示成功提示
        wx.showToast({
          title: `获取成功，共${refreshResult.count}个景点`,
          icon: 'success',
          duration: 2000
        });

        console.log('首页上拉刷新数据更新完成');
      } else {
        console.log('❌ 云端数据获取失败:', refreshResult.error);

        // 即使云端失败，也尝试重新初始化数据（可能使用缓存数据）
        this.initData();

        // 显示错误提示
        wx.showToast({
          title: '获取失败，显示缓存数据',
          icon: 'none',
          duration: 2000
        });
      }

    } catch (error) {
      console.error('上拉刷新异常:', error);

      // 异常情况下也尝试重新初始化数据
      this.initData();

      wx.showToast({
        title: '数据加载异常，请重试',
        icon: 'none',
        duration: 2000
      });
    } finally {
      // 隐藏加载提示
      wx.hideLoading();

      // 重置加载状态
      this.setData({
        isReachBottomLoading: false,
        loading: false
      });

      console.log('=== 📱 首页上拉刷新结束 ===');
    }
  },
  // 初始化数据
  initData() {
    console.log('初始化首页数据...');

    const tourismSpots = app.globalData.tourismSpots || [];
    const categories = app.globalData.categories || [];

    console.log('获取到的景点数据:', tourismSpots);
    console.log('获取到的分类数据:', categories);

    // === 轮播图专项调试开始 ===
    console.log('=== 🎠 轮播图专项调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('原始景点数据总数:', tourismSpots.length);

    // 检查前3个景点的图片信息
    tourismSpots.slice(0, 3).forEach((spot, index) => {
      console.log(`景点${index + 1} [${spot.name}]:`, {
        id: spot.id,
        rating: spot.rating,
        mainImage: spot.mainImage || '无',
        images: spot.images ? `${spot.images.length}张` : '无',
        image: spot.image || '无'
      });
    });

    // 轮播图（取评分最高的3个）
    const banners = [...tourismSpots]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);

    console.log('轮播图处理结果:');
    console.log('- 轮播图数量:', banners.length);

    banners.forEach((banner, index) => {
      const imageSource = banner.mainImage || (banner.images && banner.images[0]) || banner.image || '/images/default-spot.png';
      console.log(`轮播图${index + 1}:`, {
        name: banner.name,
        rating: banner.rating,
        图片来源: imageSource,
        图片类型: banner.mainImage ? 'mainImage' :
          (banner.images && banner.images[0]) ? 'images数组' :
            banner.image ? 'image字段' : '默认图片'
      });
    });

    console.log('================================');
    // === 轮播图专项调试结束 ===

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
    });    // 数据设置后验证
    setTimeout(() => {
      console.log('✅ setData完成验证:', {
        轮播图数量: this.data.banners.length,
        轮播图状态: this.data.banners.length > 0 ? '有数据' : '无数据',
        页面是否正常: this.data.banners.length > 0 && this.data.banners.length <= 3 ? '正常' : '异常'
      });

      // 自动检查轮播图状态
      this.checkBannerStatus();

      // 延迟检查DOM状态，确保渲染完成
      setTimeout(() => {
        this.checkBannerDOM();
      }, 500);
    }, 100);
  },

  // === 轮播图事件处理函数 ===

  // 轮播图切换事件
  onBannerChange(e) {
    const { current, source } = e.detail;
    console.log('🎠 轮播图切换事件:', {
      当前索引: current,
      切换来源: source, // 'autoplay', 'touch', 'navigation'
      时间: new Date().toLocaleString(),
      轮播图总数: this.data.banners.length
    });
  },

  // 轮播图动画完成事件
  onBannerAnimationFinish(e) {
    const { current, source } = e.detail;
    console.log('🎬 轮播图动画完成:', {
      当前索引: current,
      切换来源: source,
      时间: new Date().toLocaleString()
    });
  },

  // 轮播图图片加载成功事件
  onBannerImageLoad(e) {
    const { detail } = e;
    console.log('🖼️ 轮播图图片加载成功:', {
      图片尺寸: `${detail.width}x${detail.height}`,
      时间: new Date().toLocaleString()
    });
  },

  // 轮播图图片加载失败事件
  onBannerImageError(e) {
    const { detail } = e;
    console.error('❌ 轮播图图片加载失败:', {
      错误信息: detail.errMsg,
      时间: new Date().toLocaleString()
    });
  },

  // === 轮播图事件处理函数结束 ===

  // 检查轮播图状态（调试用）
  checkBannerStatus() {
    console.log('🔍 轮播图状态检查:', {
      数据状态: {
        轮播图数量: this.data.banners.length,
        轮播图数据: this.data.banners.map(banner => ({
          id: banner.id,
          name: banner.name,
          图片: banner.mainImage || banner.images?.[0] || banner.image || '默认'
        }))
      },
      DOM状态: '请在控制台手动检查DOM元素',
      自动播放配置: 'autoplay=true, interval=3000ms',
      建议: this.data.banners.length === 0 ? '轮播图无数据，请检查数据加载' :
        this.data.banners.length === 1 ? '只有1张图片，循环播放可能不明显' :
          '数据正常，如不自动播放请检查小程序环境设置'
    });
  },

  // 检测轮播图DOM状态（调试用）
  checkBannerDOM() {
    const query = wx.createSelectorQuery().in(this);

    // 检查轮播图容器
    query.select('.banner-container').boundingClientRect((rect) => {
      console.log('🎠 轮播图容器DOM状态:', {
        是否存在: !!rect,
        尺寸: rect ? `${rect.width}x${rect.height}` : '未找到',
        位置: rect ? `left:${rect.left}, top:${rect.top}` : '未找到',
        可见性: rect ? (rect.width > 0 && rect.height > 0 ? '可见' : '不可见') : '不存在'
      });
    });

    // 检查具体的swiper-item数量
    query.selectAll('.banner-image').boundingClientRect((rects) => {
      console.log('🖼️ 轮播图片DOM状态:', {
        图片数量: rects ? rects.length : 0,
        预期数量: this.data.banners.length,
        状态匹配: rects && rects.length === this.data.banners.length ? '正常' : '异常'
      });

      if (rects && rects.length > 0) {
        rects.forEach((rect, index) => {
          console.log(`图片${index + 1}:`, {
            尺寸: `${rect.width}x${rect.height}`,
            是否可见: rect.width > 0 && rect.height > 0
          });
        });
      }
    });

    query.exec();
  },

  // 修复轮播图自动播放问题的尝试方法
  fixBannerAutoplay() {
    console.log('🔧 尝试修复轮播图自动播放...');

    // 方法1：重新设置轮播图数据
    const banners = this.data.banners;
    if (banners && banners.length > 1) {
      this.setData({
        banners: []
      }, () => {
        // 清空后重新设置
        setTimeout(() => {
          this.setData({ banners }, () => {
            console.log('✅ 轮播图数据重新设置完成');
          });
        }, 100);
      });
    } else {
      console.log('⚠️ 轮播图数据不足（需要至少2张图片才能看到自动播放效果）');
    }
  },

  // 手动触发轮播图数据刷新（调试用）
  refreshBannerData() {
    console.log('🔄 手动刷新轮播图数据...');
    this.initData();
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
    const dataset = e.currentTarget.dataset;
    console.log('跳转到详情页，dataset:', e.currentTarget);

    // 详细调试输出
    console.log('=== 首页跳转到详情页调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('源页面: index.js');
    console.log('目标页面: detail.js');
    console.log('景点ID:', id);
    console.log('ID类型:', typeof id);
    console.log('完整dataset:', dataset);
    console.log('当前页面数据状态:', {
      spots数量: this.data.spots?.length || 0,
      热门景点数量: this.data.hotSpots?.length || 0,
      推荐景点数量: this.data.recommendedSpots?.length || 0
    });

    // 查找当前景点的详细信息用于调试
    const currentSpot = this.data.spots?.find(spot => spot.id === id || spot.id === parseInt(id));
    if (currentSpot) {
      console.log('找到景点详情:', {
        name: currentSpot.name,
        category: currentSpot.category,
        location: currentSpot.location,
        hasCoordinates: !!(currentSpot.latitude && currentSpot.longitude),
        hasNewFormat: !!(currentSpot.location?.geopoint?.coordinates)
      });
    } else {
      console.warn('⚠️ 未在当前页面数据中找到景点ID:', id);
    }

    const targetUrl = `/pages/detail/detail?id=${id}`;
    console.log('跳转URL:', targetUrl);
    console.log('==========================');

    wx.navigateTo({
      url: targetUrl,
      success: () => {
        console.log('✅ 首页->详情页跳转成功, ID:', id);
      },
      fail: (error) => {
        console.error('❌ 首页->详情页跳转失败:', error);
        console.error('失败的URL:', targetUrl);
      }
    });
  },
  // 跳转到分类页
  navigateToCategory(e) {
    const category = e.currentTarget.dataset.category;
    const dataset = e.currentTarget.dataset;

    // 详细调试输出
    console.log('=== 首页跳转到分类页调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('源页面: index.js');
    console.log('目标页面: category.js');
    console.log('分类名称:', category);
    console.log('分类类型:', typeof category);
    console.log('完整dataset:', dataset);
    console.log('当前分类数据:', this.data.categories?.find(cat => cat.name === category));

    const targetUrl = `/pages/category/category?category=${category}`;
    console.log('跳转URL:', targetUrl);
    console.log('跳转方式: wx.navigateTo (非Tab跳转)');
    console.log('=============================');

    wx.navigateTo({
      url: targetUrl,
      success: () => {
        console.log('✅ 首页->分类页跳转成功, 分类:', category);
      },
      fail: (error) => {
        console.error('❌ 首页->分类页跳转失败:', error);
        console.error('失败的URL:', targetUrl);
      }
    });
  },
  // 前往分类页面
  goToCategory(e) {
    const category = e.currentTarget.dataset.category;
    const dataset = e.currentTarget.dataset;

    // 详细调试输出
    console.log('=== 首页Tab跳转到分类页调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('源页面: index.js');
    console.log('目标页面: category.js (Tab页面)');
    console.log('分类名称:', category);
    console.log('分类类型:', typeof category);
    console.log('完整dataset:', dataset);
    console.log('设置全局变量前 - app.globalData.currentCategory:', app.globalData.currentCategory);

    // 查找分类详情
    const categoryInfo = this.data.categories?.find(cat => cat.name === category);
    if (categoryInfo) {
      console.log('分类详情:', {
        id: categoryInfo.id,
        name: categoryInfo.name,
        icon: categoryInfo.icon
      });
    }

    // 添加淡出效果
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 先设置全局变量，再进行页面跳转
    app.globalData.currentCategory = category;
    console.log('设置全局变量后 - app.globalData.currentCategory:', app.globalData.currentCategory);
    console.log('跳转方式: wx.switchTab (Tab页面切换)');
    console.log('目标URL: /pages/category/category');

    // 延迟一小段时间后跳转，增加过渡效果
    setTimeout(() => {
      wx.hideLoading();
      wx.switchTab({
        url: '/pages/category/category', success: () => {
          // 页面跳转成功后的额外处理
          console.log('✅ 首页->分类页Tab跳转成功: ' + category);
          console.log('Tab切换完成时间:', new Date().toLocaleString());
          console.log('================================');
        },
        fail: (error) => {
          console.error('❌ 首页->分类页Tab跳转失败:', error);
          console.error('失败的分类:', category);
          console.log('================================');
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
  },

  // 手动测试轮播图显示（可通过控制台调用）
  testBannerDisplay() {
    console.log('🧪 轮播图显示测试开始...');

    // 测试1：数据验证
    console.log('📊 数据测试:', {
      轮播图数据数量: this.data.banners.length,
      轮播图数据内容: this.data.banners.map(banner => ({
        名称: banner.name,
        图片源: banner.mainImage || banner.images?.[0] || banner.image || '默认图片'
      }))
    });

    // 测试2：DOM存在性检查
    const query = wx.createSelectorQuery().in(this);
    query.select('.fullscreen-banner').boundingClientRect((rect) => {
      console.log('🔍 DOM测试:', {
        轮播图容器存在: !!rect,
        容器尺寸: rect ? `${rect.width}x${rect.height}` : '未找到',
        容器可见: rect ? (rect.width > 0 && rect.height > 0) : false
      });

      if (rect && rect.height > 0) {
        console.log('✅ 轮播图容器正常显示');
      } else {
        console.log('❌ 轮播图容器显示异常');
      }
    });

    query.exec();

    // 测试3：自动播放验证（3秒后检查）
    setTimeout(() => {
      console.log('⏱️ 自动播放测试：请观察轮播图是否在3秒内自动切换');
    }, 3000);

    console.log('🧪 轮播图显示测试完成，请查看上述日志信息');
  },
})
