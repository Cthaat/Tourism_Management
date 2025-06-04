/**
 * @fileoverview 旅游管理小程序教程页面逻辑
 * @description 详细的功能教程和使用指南页面
 * @version 1.0.0
 * @date 2025-06-04
 * @author Tourism_Management开发团队
 * 
 * @功能列表
 * - 详细教程展示
 * - 常见问题解答
 * - 视频教程播放
 * - 主题适配支持
 * - 交互式引导
 */

// 获取应用实例，用于访问全局状态和方法
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 主题相关状态
    isDarkMode: false,
    colorTheme: 'default',

    // 快速开始步骤
    quickStartSteps: [
      {
        id: 1,
        step: '1',
        title: '注册登录',
        description: '使用手机号或微信账号快速注册登录，享受个性化服务'
      },
      {
        id: 2,
        step: '2',
        title: '设置偏好',
        description: '告诉我们您的旅行喜好，我们将为您推荐最合适的景点'
      },
      {
        id: 3,
        step: '3',
        title: '发现景点',
        description: '浏览附近景点或搜索目标城市，发现精彩的旅行目的地'
      },
      {
        id: 4,
        step: '4',
        title: '规划行程',
        description: '添加感兴趣的景点到行程，系统会自动为您优化路线'
      },
      {
        id: 5,
        step: '5',
        title: '开始旅程',
        description: '按照规划的路线开始您的旅程，记录美好时刻'
      }
    ],

    // 核心功能
    coreFeatures: [
      {
        id: 'discovery',
        icon: '🧭',
        name: '智能发现',
        description: '基于位置和偏好的智能推荐系统'
      },
      {
        id: 'planning',
        icon: '🗺️',
        name: '行程规划',
        description: '一键生成最优旅行路线'
      },
      {
        id: 'social',
        icon: '📸',
        name: '社交分享',
        description: '分享旅行故事和美好回忆'
      },
      {
        id: 'booking',
        icon: '🎫',
        name: '便捷预订',
        description: '门票、酒店、交通一站式预订'
      },
      {
        id: 'offline',
        icon: '📱',
        name: '离线地图',
        description: '无网络也能正常导航使用'
      },
      {
        id: 'ai',
        icon: '🤖',
        name: 'AI助手',
        description: '智能问答和个性化建议'
      }
    ],

    // 详细教程
    detailedTutorials: [
      {
        id: 'basic',
        icon: '📖',
        title: '基础操作指南',
        summary: '了解小程序的基本功能和操作方法',
        duration: '5分钟',
        content: '详细介绍小程序的基础功能...'
      },
      {
        id: 'search',
        icon: '🔍',
        title: '景点搜索技巧',
        summary: '掌握高效的景点搜索和筛选方法',
        duration: '3分钟',
        content: '学习如何快速找到心仪的景点...'
      },
      {
        id: 'planning',
        icon: '📅',
        title: '行程规划教程',
        summary: '学习如何制定完美的旅行计划',
        duration: '8分钟',
        content: '从选择景点到路线规划的完整指南...'
      },
      {
        id: 'sharing',
        icon: '📲',
        title: '分享功能使用',
        summary: '了解如何分享您的旅行体验',
        duration: '4分钟',
        content: '掌握照片分享和游记发布技巧...'
      },
      {
        id: 'settings',
        icon: '⚙️',
        title: '个性化设置',
        summary: '自定义您的专属小程序体验',
        duration: '6分钟',
        content: '学习主题切换、偏好设置等功能...'
      },
      {
        id: 'advanced',
        icon: '🎯',
        title: '高级功能详解',
        summary: '探索小程序的高级功能和技巧',
        duration: '10分钟',
        content: '深入了解AI推荐、数据同步等...'
      }
    ],

    // 常见问题
    faqList: [
      {
        id: 1,
        question: '如何添加景点到我的收藏？',
        answer: '在景点详情页点击右上角的心形图标即可收藏。您也可以在景点卡片上长按选择收藏选项。',
        expanded: false,
        animation: null
      },
      {
        id: 2,
        question: '行程规划是否支持多天安排？',
        answer: '是的，支持多天行程规划。您可以为每一天添加不同的景点，系统会自动优化每日路线并估算所需时间。',
        expanded: false,
        animation: null
      },
      {
        id: 3,
        question: '如何切换深色模式？',
        answer: '进入设置页面，在"个性化"选项中找到"深色模式"开关。您也可以设置为跟随系统自动切换。',
        expanded: false,
        animation: null
      },
      {
        id: 4,
        question: '景点信息如何保证准确性？',
        answer: '我们的景点信息来源于官方渠道和实时用户反馈。每条信息都经过人工审核，并定期更新维护。',
        expanded: false,
        animation: null
      },
      {
        id: 5,
        question: '是否支持离线使用？',
        answer: '部分功能支持离线使用，包括已下载的地图、收藏的景点信息等。建议在有网络时预先下载相关数据。',
        expanded: false,
        animation: null
      },
      {
        id: 6,
        question: '如何反馈问题或建议？',
        answer: '您可以通过设置页面的"意见反馈"功能提交问题或建议。我们会认真对待每一条反馈并及时回复。',
        expanded: false,
        animation: null
      }
    ],

    // 视频教程
    videoTutorials: [
      {
        id: 'intro',
        title: '小程序介绍',
        thumbnail: '/images/video-thumb-intro.png',
        duration: '2:30',
        url: ''
      },
      {
        id: 'search',
        title: '景点搜索',
        thumbnail: '/images/video-thumb-search.png',
        duration: '3:45',
        url: ''
      },
      {
        id: 'planning',
        title: '行程规划',
        thumbnail: '/images/video-thumb-planning.png',
        duration: '5:20',
        url: ''
      },
      {
        id: 'sharing',
        title: '分享功能',
        thumbnail: '/images/video-thumb-sharing.png',
        duration: '2:15',
        url: ''
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 监听主题变化，当全局主题改变时更新本页面主题
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,
        colorTheme: colorTheme
      });
    });

    // 初始化主题状态，从全局数据中获取当前的主题设置
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新主题状态，确保与全局设置保持一致
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  /**
   * 功能卡片点击事件
   */
  onFeatureTap(e) {
    const feature = e.currentTarget.dataset.feature;
    if (feature) {
      wx.showModal({
        title: feature.name,
        content: `${feature.description}\n\n这个功能可以帮助您：\n• 提升旅行体验\n• 节省时间和精力\n• 发现更多精彩内容`,
        showCancel: false,
        confirmText: '了解了',
        confirmColor: this.getThemeColor()
      });
    }
  },

  /**
   * 教程项目点击事件
   */
  onTutorialTap(e) {
    const tutorial = e.currentTarget.dataset.tutorial;
    if (tutorial) {
      wx.showModal({
        title: tutorial.title,
        content: `${tutorial.summary}\n\n预计阅读时间：${tutorial.duration}\n\n是否现在开始学习？`,
        showCancel: true,
        cancelText: '稍后再看',
        confirmText: '开始学习',
        confirmColor: this.getThemeColor(),
        success: (res) => {
          if (res.confirm) {
            // 这里可以跳转到具体的教程页面或显示详细内容
            wx.showToast({
              title: '正在加载教程...',
              icon: 'loading',
              duration: 1500
            });
          }
        }
      });
    }
  },

  /**
   * 常见问题点击事件
   */
  onFaqTap(e) {
    const index = e.currentTarget.dataset.index;
    const faqList = this.data.faqList;
    const currentItem = faqList[index];
    
    // 创建动画
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease'
    });

    // 切换展开状态
    currentItem.expanded = !currentItem.expanded;
    currentItem.animation = animation.export();

    // 更新数据
    this.setData({
      [`faqList[${index}]`]: currentItem
    });
  },

  /**
   * 视频点击事件
   */
  onVideoTap(e) {
    const video = e.currentTarget.dataset.video;
    if (video) {
      wx.showModal({
        title: video.title,
        content: `视频时长：${video.duration}\n\n即将播放教程视频，建议在WiFi环境下观看以节省流量。`,
        showCancel: true,
        cancelText: '取消',
        confirmText: '开始播放',
        confirmColor: this.getThemeColor(),
        success: (res) => {
          if (res.confirm) {
            // 这里可以集成视频播放功能
            wx.showToast({
              title: '正在加载视频...',
              icon: 'loading',
              duration: 2000
            });
          }
        }
      });
    }
  },

  /**
   * 联系我们点击事件
   */
  onContactTap(e) {
    const type = e.currentTarget.dataset.type;
    
    switch (type) {
      case 'feedback':
        wx.navigateTo({
          url: '/pages/feedback/feedback',
          success: () => {
            wx.showToast({
              title: '正在打开反馈页面',
              icon: 'loading',
              duration: 1500
            });
          }
        });
        break;
      case 'help':
        wx.navigateTo({
          url: '/pages/help/help',
          success: () => {
            wx.showToast({
              title: '正在打开帮助页面',
              icon: 'loading',
              duration: 1500
            });
          }
        });
        break;
      case 'service':
        wx.showModal({
          title: '客服中心',
          content: '客服时间：9:00-18:00\n客服电话：400-123-4567\n客服邮箱：service@tourism.com\n\n您也可以通过小程序内的意见反馈功能联系我们。',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: this.getThemeColor()
        });
        break;
    }
  },

  /**
   * 返回功能展示页面
   */
  onBackToShowcase() {
    wx.navigateBack({
      success: () => {
        wx.showToast({
          title: '返回功能展示',
          icon: 'success',
          duration: 1500
        });
      }
    });
  },

  /**
   * 开始体验按钮
   */
  onStartExperience() {
    wx.navigateTo({
      url: '/pages/login/login',
      success: () => {
        wx.showToast({
          title: '开始您的旅程！',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error('跳转登录页面失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },

  /**
   * 获取当前主题色
   */
  getThemeColor() {
    switch (this.data.colorTheme) {
      case '天空蓝':
        return '#1296db';
      case '中国红':
        return '#e54d42';
      case '默认绿':
      default:
        return '#1aad19';
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '旅游管理小程序使用教程',
      path: '/pages/tutorial/tutorial',
      imageUrl: '/images/share-tutorial.png'
    };
  }
});
