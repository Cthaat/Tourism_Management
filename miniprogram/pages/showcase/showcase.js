/**
 * @fileoverview 旅游管理微信小程序功能展示页面逻辑
 * @description 此文件包含功能展示页面的数据结构和交互逻辑，展示小程序的核心功能和特色
 * @version 1.0.0
 * @date 2025-06-04
 * @author Tourism_Management开发团队
 * 
 * @功能列表
 * - 功能卡片展示
 * - 统计数据动画
 * - 主题适配支持
 * - 页面交互反馈
 */

// 引入版本配置
const versionConfig = require('../../config/version.js');

// 获取应用实例，用于访问全局状态和方法
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */  data: {
    // 主题相关状态
    isDarkMode: false,
    colorTheme: 'default',

    // 页面标题
    pageTitle: '功能展示',

    // 应用统计数据
    statistics: [
      {
        id: 'spots',
        label: '景点数量',
        value: 0,
        target: 1200,
        icon: '🏞️',
        suffix: '+'
      },
      {
        id: 'users',
        label: '用户数量',
        value: 0,
        target: 50000,
        icon: '👥',
        suffix: '+'
      },
      {
        id: 'reviews',
        label: '用户评价',
        value: 0,
        target: 15000,
        icon: '⭐',
        suffix: '+'
      },
      {
        id: 'cities',
        label: '覆盖城市',
        value: 0,
        target: 280,
        icon: '🌆',
        suffix: '+'
      }
    ],

    // 核心功能展示
    coreFeatures: [
      {
        id: 'discovery',
        title: '智能发现',
        subtitle: '个性化推荐',
        description: '基于您的兴趣和位置，智能推荐最适合的旅游景点',
        icon: '🧭',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        features: ['智能推荐算法', '地理位置服务', '个人偏好学习']
      },
      {
        id: 'planning',
        title: '行程规划',
        subtitle: '一站式服务',
        description: '从景点选择到路线规划，打造完美的旅行体验',
        icon: '🗺️',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        features: ['路线规划', '时间优化', '预算管理']
      },
      {
        id: 'social',
        title: '社交分享',
        subtitle: '记录美好',
        description: '分享您的旅行故事，与其他旅行者交流心得',
        icon: '📸',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        features: ['图片分享', '游记发布', '社区互动']
      },
      {
        id: 'booking',
        title: '便捷预订',
        subtitle: '一键搞定',
        description: '集成预订系统，轻松预订门票、酒店和交通',
        icon: '🎫',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        features: ['在线预订', '实时确认', '电子票据']
      }
    ],

    // 技术特色
    techHighlights: [
      {
        id: 'theme',
        title: '智能主题',
        description: '支持深色模式和多种主题色，为您提供个性化的视觉体验',
        icon: '🎨',
        color: '#9c88ff'
      },
      {
        id: 'performance',
        title: '极速体验',
        description: '优化的性能和流畅的动画，确保最佳的用户体验',
        icon: '⚡',
        color: '#ffa726'
      },
      {
        id: 'security',
        title: '数据安全',
        description: '采用最新的安全技术，保护您的个人信息和隐私',
        icon: '🛡️',
        color: '#66bb6a'
      },
      {
        id: 'ai',
        title: '智能推荐',
        description: '智能推荐技术驱动，提供更智能的推荐和服务',
        icon: '🤖',
        color: '#29b6f6'
      }
    ],

    // 用户好评
    testimonials: [
      {
        id: 1,
        name: '张小明',
        avatar: '👨‍💼',
        rating: 5,
        comment: '界面设计很棒，功能也很实用，特别是主题切换功能让我爱不释手！',
        location: '北京'
      },
      {
        id: 2,
        name: '李美丽',
        avatar: '👩‍🎨',
        rating: 5,
        comment: '推荐算法很准确，总能找到我喜欢的景点，深色模式也很护眼。',
        location: '上海'
      },
      {
        id: 3,
        name: '王同学',
        avatar: '🧑‍🎓',
        rating: 5,
        comment: '作为学生党很喜欢这个应用，可以找到很多免费或优惠的景点。',
        location: '广州'
      }
    ],

    // 动画状态
    animationState: {
      statisticsAnimated: false,
      featuresVisible: false,
      testimonialsVisible: false
    },
    version: versionConfig.getVersionText(), // 版本信息
  },  /**
   * 生命周期函数--监听页面加载
   */  onLoad() {
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
  },/**
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

    // 启动动画序列
    this.startAnimationSequence();
  },

  /**
   * 启动页面动画序列
   */
  startAnimationSequence() {
    // 统计数据动画
    setTimeout(() => {
      this.animateStatistics();
    }, 300);

    // 功能卡片显示动画
    setTimeout(() => {
      this.setData({
        'animationState.featuresVisible': true
      });
    }, 800);

    // 用户评价显示动画
    setTimeout(() => {
      this.setData({
        'animationState.testimonialsVisible': true
      });
    }, 1200);
  },

  /**
   * 统计数据数字滚动动画
   */
  animateStatistics() {
    if (this.data.animationState.statisticsAnimated) return;

    this.setData({
      'animationState.statisticsAnimated': true
    });

    const statistics = this.data.statistics;
    const duration = 2000; // 动画持续时间
    const steps = 60; // 动画步数
    const interval = duration / steps;

    statistics.forEach((stat, index) => {
      const increment = stat.target / steps;
      let currentValue = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        currentValue = Math.min(currentValue + increment, stat.target);

        this.setData({
          [`statistics[${index}].value`]: Math.floor(currentValue)
        });

        if (step >= steps) {
          clearInterval(timer);
          this.setData({
            [`statistics[${index}].value`]: stat.target
          });
        }
      }, interval);
    });
  },

  /**
   * 功能卡片点击事件
   */
  onFeatureCardTap(e) {
    const featureId = e.currentTarget.dataset.id;
    const feature = this.data.coreFeatures.find(f => f.id === featureId);

    if (feature) {
      wx.showModal({
        title: feature.title,
        content: `${feature.description}\n\n核心特性：\n• ${feature.features.join('\n• ')}`,
        showCancel: false,
        confirmText: '了解了',
        confirmColor: this.getThemeColor()
      });
    }
  },

  /**
   * 技术特色点击事件
   */
  onTechHighlightTap(e) {
    const techId = e.currentTarget.dataset.id;
    const tech = this.data.techHighlights.find(t => t.id === techId);

    if (tech) {
      wx.showToast({
        title: tech.title,
        icon: 'none',
        duration: 1500
      });
    }
  },

  /**
   * 统计卡片点击事件
   */
  onStatCardTap(e) {
    const stat = e.currentTarget.dataset.stat;
    if (stat) {
      wx.showToast({
        title: `${stat.label}: ${stat.value}${stat.suffix}`,
        icon: 'none',
        duration: 2000
      });
    }
  },  /**
   * 开始旅程按钮点击事件 - 跳转到登录页面
   */
  onStartJourney() {
    // 首先检查用户是否已经登录
    const loginStatus = require('../../server/UserLoginApi').checkLoginStatus();

    if (loginStatus.isLoggedIn) {
      // 已登录，直接跳转到首页
      wx.switchTab({
        url: '/pages/index/index',
        success: () => {
          wx.showToast({
            title: '欢迎回来！',
            icon: 'success',
            duration: 1500
          });
        }
      });
      return;
    }

    // 未登录，跳转到登录页面
    wx.navigateTo({
      url: '/pages/login/login',
      success: () => {
        wx.showToast({
          title: '请先登录体验！',
          icon: 'none',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error('跳转登录页面失败:', err);
        // 如果navigateTo失败，尝试使用redirectTo
        wx.redirectTo({
          url: '/pages/login/login',
          fail: (err2) => {
            console.error('重定向登录页面也失败:', err2);
            wx.showToast({
              title: '页面跳转失败，请稍后重试',
              icon: 'error',
              duration: 2000
            });
          }
        });
      }
    });
  },

  /**
   * 了解更多按钮点击事件 - 跳转到教程页面
   */
  onLearnMore() {
    wx.navigateTo({
      url: '/pages/tutorial/tutorial',
      success: () => {
        wx.showToast({
          title: '正在加载详细教程',
          icon: 'loading',
          duration: 1500
        });
      },
      fail: (err) => {
        console.error('跳转教程页面失败:', err);
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
   * 生成星级评分
   */
  generateStars(rating) {
    return '⭐'.repeat(rating);
  },

  /**
   * 页面滚动事件
   */
  onPageScroll(e) {
    // 可以在这里添加滚动相关的动画效果
    const scrollTop = e.scrollTop;

    // 根据滚动位置触发不同的动画效果
    if (scrollTop > 200 && !this.data.animationState.featuresVisible) {
      this.setData({
        'animationState.featuresVisible': true
      });
    }
  },  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '旅游管理小程序 - 发现更多精彩',
      path: '/pages/showcase/showcase',
      imageUrl: '/images/share-showcase.png'
    };
  },
});
