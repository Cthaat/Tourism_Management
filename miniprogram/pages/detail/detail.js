/**
 * @file pages/detail/detail.js
 * @description 旅游管理小程序景点详情页面的业务逻辑
 * @version 1.0.0
 * @date 2025-05-13
 * @author Tourism_Management开发团队
 * 
 * 功能说明:
 * - 展示单个旅游景点的详细信息
 * - 提供收藏和预订功能
 * - 支持多主题色和深色模式适配
 * - 实现景点图片展示和轮播
 * - 处理用户交互和状态管理
 * 
 * 主要功能模块:
 * - 景点详情数据加载与展示
 * - 收藏功能实现与状态管理
 * - 预订流程处理与记录保存
 * - 深色模式与主题切换实现
 * - 页面交互与用户操作处理
 * 
 * 数据依赖:
 * - 全局数据：app.globalData.tourismSpots
 * - 本地存储：favorites, bookings
 * 
 * 页面交互:
 * - 收藏/取消收藏景点
 * - 预订门票
 * - 获取导航路线
 * - 拨打咨询电话
 * - 复制景点地址
 * - 查看景点百科信息
 */

// 获取全局应用实例
const app = getApp()

/**
 * 景点详情页面配置
 * Page 对象定义了页面的初始数据、生命周期函数和自定义方法
 */
Page({
  /**
   * 页面初始数据 - 定义页面所需的状态变量
   * @property {Object|null} spot - 当前景点数据对象
   * @property {boolean} isFavorite - 当前景点是否被收藏
   * @property {boolean} isDarkMode - 深色模式状态标志
   * @property {string} colorTheme - 当前颜色主题名称
   * @property {Object} animationData - 动画数据对象
   * @property {boolean} showBookingPanel - 是否显示预订面板
   */
  data: {
    spot: null,                  // 当前景点数据对象
    isFavorite: false,           // 当前景点是否被收藏
    isDarkMode: false,           // 深色模式状态
    colorTheme: '默认绿',         // 当前颜色主题名称
    animationData: {},           // 动画数据对象
    showBookingPanel: false      // 是否显示预订面板
  },  /**
   * 生命周期函数 - 页面加载时触发
   * 初始化页面数据，设置主题和收藏状态
   * @param {Object} options - 页面参数对象，包含id等路由参数
   */
  onLoad(options) {
    const { id } = options;  // 获取路由参数中的景点ID

    // 详细调试输出 - 详情页接收参数
    console.log('=== 详情页接收参数调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('当前页面: detail.js');
    console.log('接收到的options:', options);
    console.log('提取的景点ID:', id);
    console.log('ID类型:', typeof id);
    console.log('页面栈信息:', getCurrentPages().map(page => page.route));

    // 分析全局数据状态
    const tourismSpots = app.globalData.tourismSpots || [];
    console.log('全局景点数据状态:', {
      景点总数: tourismSpots.length,
      前3个景点ID: tourismSpots.slice(0, 3).map(spot => ({ id: spot.id, name: spot.name, 类型: typeof spot.id })),
      分类数据: app.globalData.categories?.length || 0
    });

    // 根据ID从全局数据中查找景点信息（新数据结构中id是字符串）
    const spot = app.globalData.tourismSpots.find(item => item.id === id || item.id === parseInt(id));

    console.log('景点查找结果:', spot ? '✅ 找到' : '❌ 未找到');

    if (spot) {
      console.log('找到的景点原始数据:', {
        id: spot.id,
        name: spot.name,
        数据格式: spot.location?.geopoint ? '新格式(有geopoint)' : '旧格式',
        有地址: !!spot.location?.address,
        有坐标: !!(spot.latitude && spot.longitude),
        有分类ID: !!spot.category_id,
        有开放时间: !!(spot.opening_time && spot.closing_time),
        有图片: !!(spot.images || spot.mainImage),
        有网站: !!spot.website
      });

      // 处理数据格式适配
      console.log('开始数据格式处理...');
      const processedSpot = this.processSpotData(spot);
      console.log('数据处理完成，处理后的关键字段:', {
        latitude: processedSpot.latitude,
        longitude: processedSpot.longitude,
        address: processedSpot.address,
        category: processedSpot.category,
        categoryIcon: processedSpot.categoryIcon,
        hours: processedSpot.hours,
        bestSeasonText: processedSpot.bestSeasonText,
        图片数量: processedSpot.images?.length || 0
      });

      // 从本地存储获取收藏状态
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.includes(id) || favorites.includes(parseInt(id));
      console.log('收藏状态检查:', {
        收藏列表: favorites,
        当前ID收藏状态: isFavorite,
        字符串匹配: favorites.includes(id),
        数字匹配: favorites.includes(parseInt(id))
      });

      // 更新页面数据
      this.setData({
        spot: processedSpot,     // 设置处理后的景点数据
        isFavorite               // 设置收藏状态
      });

      // 设置导航栏标题为景点名称
      wx.setNavigationBarTitle({
        title: spot.name
      });

      console.log('✅ 详情页数据加载成功');
      console.log('========================');
    } else {
      // 未找到景点信息时的错误处理
      console.error('❌ 未找到景点信息，详细分析:');
      console.error('查找ID:', id);
      console.error('可用景点列表:', tourismSpots.map(spot => ({ id: spot.id, 类型: typeof spot.id, name: spot.name })));
      console.error('尝试的匹配条件:');
      console.error('- 直接匹配 (item.id === id):', tourismSpots.some(item => item.id === id));
      console.error('- 数字匹配 (item.id === parseInt(id)):', tourismSpots.some(item => item.id === parseInt(id)));
      console.log('========================');

      wx.showToast({
        title: '未找到景点信息',
        icon: 'none',       // 使用无图标样式
        duration: 1500      // 显示1.5秒
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();  // 返回上一页面
      }, 1500);
    }

    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      console.log('Detail页面 - 主题变化:', { darkMode, colorTheme });
      this.setData({
        isDarkMode: darkMode,
        colorTheme: colorTheme
      });
    });

    // 初始化主题状态
    console.log('Detail页面 - 初始化主题:', {
      darkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
  },

  /**
   * 处理景点数据格式，适配新的数据结构
   * @param {Object} rawSpot - 原始景点数据
   * @returns {Object} 处理后的景点数据
   */
  processSpotData(rawSpot) {
    // 获取分类信息
    const categories = app.globalData.categories || [];
    const category = categories.find(cat => cat.id === parseInt(rawSpot.category_id));

    // 处理时间格式（毫秒转为小时:分钟格式）
    const formatTime = (milliseconds) => {
      if (!milliseconds) return '未知';
      const hours = Math.floor(milliseconds / (1000 * 60 * 60));
      const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // 处理图片URL（确保云存储图片有完整路径）
    const processImageUrl = (imageUrl) => {
      if (!imageUrl) return '';
      // 如果已经是完整的云存储URL，直接返回
      if (imageUrl.startsWith('cloud://')) {
        return imageUrl;
      }
      // 如果是相对路径，添加云存储前缀
      return `cloud://cloud1-1g7t03e73d6c8ff9.636c-cloud1-1g7t03e73d6c8ff9-1358838268/${imageUrl}`;
    };

    return {
      ...rawSpot,
      // 适配经纬度格式
      latitude: rawSpot.location?.geopoint?.coordinates?.[1] || null,
      longitude: rawSpot.location?.geopoint?.coordinates?.[0] || null,
      // 适配地址格式
      address: rawSpot.location?.address || '',
      // 适配位置信息（使用省份）
      location: rawSpot.province || '',
      // 适配分类信息
      category: category?.name || '未知分类',
      categoryIcon: category?.icon || '📍',
      // 适配时间格式
      hours: `${formatTime(rawSpot.opening_time)} - ${formatTime(rawSpot.closing_time)}`,
      openingTime: formatTime(rawSpot.opening_time),
      closingTime: formatTime(rawSpot.closing_time),
      // 处理图片
      image: rawSpot.mainImage ? processImageUrl(rawSpot.mainImage) : (rawSpot.images?.[0] ? processImageUrl(rawSpot.images[0]) : ''),
      images: rawSpot.images?.map(img => processImageUrl(img)) || [],
      mainImage: rawSpot.mainImage ? processImageUrl(rawSpot.mainImage) : '',
      // 添加评论数量（模拟数据）
      reviewCount: Math.floor(Math.random() * 50000) + 1000 + '条评论',
      // 最佳季节处理
      bestSeasonText: this.getBestSeasonText(rawSpot.best_season),
      // 网站信息
      website: rawSpot.website || ''
    };
  },

  /**
   * 获取最佳季节文本
   * @param {number} seasonCode - 季节代码
   * @returns {string} 季节文本
   */
  getBestSeasonText(seasonCode) {
    const seasons = {
      0: '四季皆宜',
      1: '春季',
      2: '夏季',
      3: '秋季',
      4: '冬季'
    };
    return seasons[seasonCode] || '四季皆宜';
  },

  /**
   * 生命周期函数 - 页面显示时触发
   * 更新主题状态和导航栏样式
   */
  onShow() {
    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },  /**
   * 切换景点收藏状态
   * 实现收藏和取消收藏功能，并更新缓存与UI
   */
  toggleFavorite() {
    const { spot, isFavorite } = this.data;
    // 从缓存中获取收藏列表
    let favorites = wx.getStorageSync('favorites') || [];

    // 确保ID格式一致（支持字符串和数字）
    const spotId = spot.id;

    if (isFavorite) {
      // 取消收藏 - 移除所有可能的格式
      favorites = favorites.filter(id =>
        id !== spotId &&
        id !== parseInt(spotId) &&
        id.toString() !== spotId.toString()
      );
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      });
    } else {
      // 添加收藏 - 使用原始格式
      favorites.push(spotId);
      wx.showToast({
        title: '收藏成功',
        icon: 'success'
      });
    }

    // 更新缓存和状态
    wx.setStorageSync('favorites', favorites);
    this.setData({
      isFavorite: !isFavorite
    });
  },
  /**
   * 获取景点导航路线
   * 如果有经纬度信息，打开地图导航；否则提示无法导航
   */
  getDirections() {
    const { spot } = this.data;

    // 如果有经纬度信息，可以打开地图导航
    if (spot.latitude && spot.longitude) {
      wx.openLocation({
        latitude: spot.latitude,
        longitude: spot.longitude,
        name: spot.name,
        address: spot.address || spot.location
      });
    } else {
      wx.showToast({
        title: '暂无位置信息，无法导航',
        icon: 'none'
      });
    }
  },

  /**
   * 打开景点百科页面
   * 由于小程序限制，模拟打开外部Wikipedia链接
   */
  openWikipedia() {
    // 由于小程序限制，实际上可能无法直接打开外部网页
    // 这里模拟操作
    wx.showModal({
      title: 'Wikipedia',
      content: '是否跳转到' + this.data.spot.name + '的百科页面？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '小程序内无法直接打开外部链接',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },
  /**
   * 购买景点门票
   * 显示门票价格信息并提供购票入口
   */
  buyTicket() {
    const { spot } = this.data;
    wx.showModal({
      title: '购票信息',
      content: spot.price > 0 ? `门票价格：¥${spot.price}元/人` : '该景点免费参观',
      confirmText: '立即购票',
      success: (res) => {
        if (res.confirm) {
          this.makeReservation();
        }
      }
    });
  },
  /**
   * 复制景点地址
   * 将地址信息复制到剪贴板并提供反馈
   */
  copyAddress() {
    const { spot } = this.data;
    const address = spot.address || (spot.location + '景区') || '地址信息暂未提供';
    wx.setClipboardData({
      data: address,
      success: () => {
        wx.showToast({
          title: '地址已复制',
          icon: 'success'
        });
      }
    });
  },
  /**
   * 拨打景点咨询电话
   * 调用系统拨号功能并处理失败情况
   */
  callPhone() {
    const phone = this.data.spot.phone || '400 123 4567';
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({
          title: '拨号取消',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 返回上一页
   * 提供平滑的返回动画效果
   */
  goBack() {
    // 添加平滑的返回动画
    wx.showLoading({
      title: '返回中...',
      mask: true
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.navigateBack({
        delta: 1,
        success: () => {
          console.log('成功返回上一页');
        }
      });
    }, 100);
  },  /**
   * 景点门票预订
   * 处理整个预订流程并保存预订记录
   */
  makeReservation() {
    const { spot } = this.data;

    // 添加预订按钮动效
    wx.vibrateShort({
      type: 'medium'
    });

    wx.showModal({
      title: '预订确认',
      content: `您确定要预订${spot.name}的门票吗？${spot.price > 0 ? `价格：¥${spot.price}/人` : '免费景点'}`,
      success: (res) => {
        if (res.confirm) {
          // 模拟预订成功
          wx.showLoading({
            title: '预订中...',
          });

          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '预订成功',
              icon: 'success'
            });

            // 将预订记录保存到缓存
            const bookings = wx.getStorageSync('bookings') || [];
            const booking = {
              id: Date.now(),
              spotId: spot.id,
              spotName: spot.name,
              price: spot.price || 0,
              date: new Date().toISOString().split('T')[0],
              status: '待使用',
              address: spot.address,
              phone: spot.phone || '400 123 4567',
              hours: spot.hours
            };
            bookings.push(booking);
            wx.setStorageSync('bookings', bookings);
          }, 1500);
        }
      }
    });
  },
  /**
   * 打开景点官方网站
   * 显示网站链接并提供复制功能
   */
  openWebsite() {
    const { spot } = this.data;
    if (spot.website) {
      wx.showModal({
        title: '官方网站',
        content: `${spot.name}的官方网站：\n${spot.website}\n\n是否复制链接？`,
        confirmText: '复制链接',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: spot.website,
              success: () => {
                wx.showToast({
                  title: '链接已复制',
                  icon: 'success'
                });
              }
            });
          }
        }
      });
    }
  },

  // 分享
  onShareAppMessage() {
    const { spot } = this.data;
    return {
      title: `推荐给你一个好地方：${spot.name}`,
      path: `/pages/detail/detail?id=${spot.id}`,
      imageUrl: spot.mainImage || spot.image || (spot.images && spot.images[0]) || ''
    };
  }
})