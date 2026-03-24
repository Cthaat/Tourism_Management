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
 * - 评论功能集成
 * 
 * 主要功能模块:
 * - 景点详情数据加载与展示
 * - 收藏功能实现与状态管理
 * - 预订流程处理与记录保存
 * - 深色模式与主题切换实现
 * - 页面交互与用户操作处理
 * - 评论系统（显示、点赞、回复、写评论）
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
 * - 查看和管理评论
 */

// 获取全局应用实例
const app = getApp()
const CommentApi = require('../../server/CommentApi');
const UserUpdate = require('../../server/UserUpdate');

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
   * @property {Array} comments - 评论列表
   * @property {boolean} commentsLoaded - 评论是否已加载
   * @property {boolean} showAllComments - 是否显示所有评论
   * @property {number} displayCommentCount - 默认显示的评论数量
   * @property {Object} commentStats - 评论统计信息
   */
  data: {
    spot: null,                  // 当前景点数据对象
    isFavorite: false,           // 当前景点是否被收藏
    isDarkMode: false,           // 深色模式状态
    colorTheme: '默认绿',         // 当前颜色主题名称
    animationData: {},           // 动画数据对象
    showBookingPanel: false,     // 是否显示预订面板
    comments: [],                // 评论列表
    displayedComments: [],       // 当前展示的评论列表（避免模板层直接 slice）
    commentsLoaded: false,       // 评论是否已加载
    showAllComments: false,      // 是否显示所有评论
    displayCommentCount: 0,      // 默认显示的评论数量（从0改为1）
    commentStats: {              // 评论统计信息
      total: 0,
      averageRating: 0,
      ratingDistribution: [0, 0, 0, 0, 0] // 1-5星的分布
    },
    // 新增：详情页评论输入相关字段
    newCommentContent: '',       // 新评论内容
    newCommentRating: 5,         // 新评论评分（1-5）
    submittingComment: false     // 发送评论 loading 状态
  },

  /**
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

      // 加载评论数据
      this.loadComments(id);

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
      return `cloud://cloud1-7gwgvcaxe59bbe99.636c-cloud1-7gwgvcaxe59bbe99-1358838268/${imageUrl}`;
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
  },

  /**
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
  },

  /**
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

  // ========== 评论功能相关方法 ==========

  /**
   * 加载景点评论数据
   * @param {string} spotId - 景点ID
   */
  async loadComments(spotId) {
    console.log('开始加载评论数据，景点ID:', spotId);
    try {
      const res = await CommentApi.getCommentsBySpot({ spot_id: parseInt(spotId) });
      let formatted;
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        formatted = CommentApi.formatCommentsForDisplay(res.data);
      } else {
        console.warn('未获取到服务器评论，使用模拟数据', res.message);
        formatted = this.generateMockComments(spotId);
      }
      // 计算评论统计
      const stats = this.calculateCommentStats(formatted);

      console.log('评论统计信息:', stats);
      console.log('格式化后的评论数据:', formatted);
      // 新增：根据每条评论的userId获取用户资料，并补充昵称和头像
      const commentsWithUser = await Promise.all(
        formatted.map(async (comment) => {
          try {
            const userRes = await UserUpdate.getCommentUserProfile({ _id: comment.author });
            console.log('获取用户信息:', userRes);
            if (userRes.success && userRes.userInfo) {
              comment.userName = userRes.userInfo.nickName || userRes.userInfo.nickname || comment.userName;
              comment.userAvatar = userRes.userInfo.avatarUrl || userRes.userInfo.avatar_url || comment.userAvatar;
              console.log('更新评论用户信息:', { userId: comment.userId, userName: comment.userName, userAvatar: comment.userAvatar });
            }
          } catch (e) {
            console.error('获取用户信息失败:', e);
          }
          return comment;
        })
      );

      const displayedComments = this.buildDisplayedComments(
        commentsWithUser,
        this.data.showAllComments,
        this.data.displayCommentCount
      );

      this.setData({
        comments: commentsWithUser,
        displayedComments,
        commentsLoaded: true,
        commentStats: stats
      });
    } catch (error) {
      console.error('加载评论失败:', error);
      const mock = this.generateMockComments(spotId);
      const stats = this.calculateCommentStats(mock);
      const displayedComments = this.buildDisplayedComments(
        mock,
        this.data.showAllComments,
        this.data.displayCommentCount
      );

      this.setData({
        comments: mock,
        displayedComments,
        commentsLoaded: true,
        commentStats: stats
      });
      wx.showToast({ title: '加载评论失败，显示模拟数据', icon: 'none' });
    }
  },

  /**
   * 生成模拟评论数据
   * @param {string} spotId - 景点ID
   * @returns {Array} 评论数组
   */
  generateMockComments(spotId) {
    const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '陈十二'];
    const avatars = [
      '/images/profile.png', '/images/profile.png', '/images/profile.png',
      '/images/profile.png', '/images/profile.png'
    ];
    const commentContents = [
      '景色非常美丽，值得一去！拍照效果特别好，强烈推荐给大家。',
      '交通便利，设施完善，服务态度很好。整体体验非常满意。',
      '风景如画，空气清新，是放松心情的好地方。下次还会再来的。',
      '历史文化底蕴深厚，导游讲解详细，学到了很多知识。',
      '门票价格合理，性价比很高。适合全家一起出游。',
      '人不算太多，可以慢慢欣赏。建议早上去，光线比较好。',
      '周边配套设施齐全，餐饮住宿都很方便。体验很棒。',
      '四季都有不同的美景，春天樱花盛开特别漂亮。',
      '适合情侣约会的地方，浪漫指数五颗星！',
      '孩子们玩得很开心，是亲子游的好选择。'
    ];

    const comments = [];
    const commentCount = Math.floor(Math.random() * 15) + 8; // 8-22条评论

    for (let i = 0; i < commentCount; i++) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5星评分为主
      const timeAgo = this.getRandomTimeAgo();

      comments.push({
        id: `comment_${spotId}_${i}`,
        userId: `user_${i}`,
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        userAvatar: avatars[Math.floor(Math.random() * avatars.length)],
        rating: rating,
        content: commentContents[Math.floor(Math.random() * commentContents.length)],
        timeAgo: timeAgo,
        likeCount: Math.floor(Math.random() * 50),
        helpfulCount: Math.floor(Math.random() * 30),
        isLiked: Math.random() > 0.8,
        images: Math.random() > 0.7 ? ['/images/xihu.png', '/images/sanya.png'] : [],
        replies: Math.random() > 0.8 ? this.generateMockReplies() : []
      });
    }

    // 按时间排序（最新的在前）
    return comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  /**
   * 生成模拟回复数据
   * @returns {Array} 回复数组
   */
  generateMockReplies() {
    const replyContents = [
      '谢谢推荐！', '下次我也要去看看', '拍的照片能分享一下吗？', '请问具体位置在哪里？'
    ];
    const replies = [];
    const replyCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < replyCount; i++) {
      replies.push({
        id: `reply_${Date.now()}_${i}`,
        userId: `user_reply_${i}`,
        userName: `回复用户${i + 1}`,
        content: replyContents[Math.floor(Math.random() * replyContents.length)],
        timeAgo: this.getRandomTimeAgo()
      });
    }

    return replies;
  },

  /**
   * 获取随机时间描述
   * @returns {string} 时间描述
   */
  getRandomTimeAgo() {
    const timeTypes = [
      { type: 'minutes', max: 60, suffix: '分钟前' },
      { type: 'hours', max: 24, suffix: '小时前' },
      { type: 'days', max: 30, suffix: '天前' },
      { type: 'months', max: 12, suffix: '个月前' }
    ];

    const randomType = timeTypes[Math.floor(Math.random() * timeTypes.length)];
    const value = Math.floor(Math.random() * randomType.max) + 1;

    return `${value}${randomType.suffix}`;
  },

  /**
   * 计算评论统计信息
   * @param {Array} comments - 评论数组
   * @returns {Object} 统计信息
   */
  calculateCommentStats(comments) {
    const safeComments = Array.isArray(comments) ? comments : [];

    if (safeComments.length === 0) {
      return {
        total: 0,
        averageRating: 0,
        ratingDistribution: [0, 0, 0, 0, 0]
      };
    }

    const ratingDistribution = [0, 0, 0, 0, 0];
    let totalRating = 0;

    safeComments.forEach(comment => {
      totalRating += comment.rating;
      ratingDistribution[comment.rating - 1]++;
    });

    return {
      total: safeComments.length,
      averageRating: (totalRating / safeComments.length).toFixed(1),
      ratingDistribution: ratingDistribution
    };
  },

  buildDisplayedComments(comments, showAllComments, displayCommentCount) {
    const safeComments = Array.isArray(comments) ? comments : [];
    if (showAllComments) {
      return safeComments;
    }

    const safeCount = Number.isFinite(displayCommentCount) ? displayCommentCount : 0;
    return safeComments.slice(0, Math.max(0, safeCount));
  },

  /**
   * 切换显示所有评论
   */
  toggleShowAllComments() {
    const showAllComments = !this.data.showAllComments;
    this.setData({
      showAllComments,
      displayedComments: this.buildDisplayedComments(
        this.data.comments,
        showAllComments,
        this.data.displayCommentCount
      )
    });
  },

  /**
   * 跳转到写评论页面
   */
  writeComment() {
    const { spot } = this.data;
    wx.navigateTo({
      url: `/pages/write-comment/write-comment?spotId=${spot.id}&spotName=${spot.name}`
    });
  },

  /**
   * 处理评论点赞
   * @param {Object} e - 事件对象
   */
  handleLike(e) {
    const { commentId } = e.currentTarget.dataset;
    const { comments } = this.data;

    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1
        };
      }
      return comment;
    });

    this.setData({
      comments: updatedComments,
      displayedComments: this.buildDisplayedComments(
        updatedComments,
        this.data.showAllComments,
        this.data.displayCommentCount
      )
    });

    wx.showToast({
      title: updatedComments.find(c => c.id === commentId).isLiked ? '已点赞' : '已取消点赞',
      icon: 'none',
      duration: 1000
    });
  },

  /**
   * 处理评论回复
   * @param {Object} e - 事件对象
   */
  handleReply(e) {
    const { comment } = e.currentTarget.dataset;

    wx.showModal({
      title: '回复评论',
      content: `回复 ${comment.userName} 的评论`,
      editable: true,
      placeholderText: '请输入回复内容...',
      success: (res) => {
        if (res.confirm && res.content) {
          this.addReply(comment.id, res.content);
        }
      }
    });
  },

  /**
   * 添加回复到评论
   * @param {string} commentId - 评论ID
   * @param {string} content - 回复内容
   */
  addReply(commentId, content) {
    const { comments } = this.data;

    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const newReply = {
          id: `reply_${Date.now()}`,
          userId: 'current_user',
          userName: '我',
          content: content,
          timeAgo: '刚刚'
        };

        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      return comment;
    });

    this.setData({
      comments: updatedComments,
      displayedComments: this.buildDisplayedComments(
        updatedComments,
        this.data.showAllComments,
        this.data.displayCommentCount
      )
    });

    wx.showToast({
      title: '回复成功',
      icon: 'success'
    });
  },

  /**
   * 查看用户资料
   * @param {Object} e - 事件对象
   */
  viewProfile(e) {
    const { userId, userName } = e.currentTarget.dataset;

    wx.showModal({
      title: '用户信息',
      content: `用户名：${userName}\n用户ID：${userId}`,
      showCancel: false
    });
  },

  /**
   * 处理详情页评论内容输入
   */
  onCommentContentInput(e) {
    this.setData({ newCommentContent: e.detail.value });
  },

  /**
   * 选择详情页评论评分
   */
  selectCommentRating(e) {
    const rating = parseInt(e.currentTarget.dataset.rating) || 5;
    this.setData({ newCommentRating: rating });
  },

  /**
   * 发送详情页评论
   */
  async submitDetailComment() {
    const { newCommentContent, newCommentRating, spot } = this.data;
    const spotId = spot && spot.id;
    const globalUserInfo = (getApp().globalData && getApp().globalData.userInfo) || null;
    const cachedUserInfo = wx.getStorageSync('userInfo') || {};
    const personId =
      (globalUserInfo && (globalUserInfo._id || globalUserInfo._openid || globalUserInfo.openid)) ||
      cachedUserInfo._id ||
      cachedUserInfo._openid ||
      cachedUserInfo.openid ||
      '';

    if (!newCommentContent.trim() || newCommentContent.trim().length < 5) {
      wx.showToast({ title: '请输入至少5个字符的评论', icon: 'none' });
      return;
    }

    if (!personId) {
      wx.showToast({ title: '请先登录后再评论', icon: 'none' });
      return;
    }

    this.setData({ submittingComment: true });
    wx.showLoading({ title: '发送评论中...' });
    try {
      const commentData = {
        common: newCommentContent.trim(),
        spot_id: parseInt(spotId),
        person: personId
      };
      commentData.rating = newCommentRating;
      const res = await CommentApi.addComment(commentData);
      wx.hideLoading();
      if (res.success) {
        wx.showToast({ title: '评论发送成功', icon: 'success' });
        // 重置输入
        this.setData({ newCommentContent: '', newCommentRating: 5 });
        // 刷新评论列表
        this.loadComments(spotId);
      } else {
        wx.showToast({ title: res.message || '评论发送失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('发送评论失败:', error);
      wx.showToast({ title: '评论发送异常', icon: 'none' });
    } finally {
      this.setData({ submittingComment: false });
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
