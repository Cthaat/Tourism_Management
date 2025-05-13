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
  },
  /**
   * 生命周期函数 - 页面加载时触发
   * 初始化页面数据，设置主题和收藏状态
   * @param {Object} options - 页面参数对象，包含id等路由参数
   */
  onLoad(options) {
    const { id } = options;  // 获取路由参数中的景点ID

    // 根据ID从全局数据中查找景点信息
    const spot = app.globalData.tourismSpots.find(item => item.id === parseInt(id));

    if (spot) {
      // 从本地存储获取收藏状态
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.includes(parseInt(id));

      // 更新页面数据
      this.setData({
        spot,                // 设置景点数据
        isFavorite           // 设置收藏状态
      });

      // 设置导航栏标题为景点名称
      wx.setNavigationBarTitle({
        title: spot.name
      });
    } else {
      // 未找到景点信息时的错误处理
      wx.showToast({
        title: '未找到景点信息',
        icon: 'none',       // 使用无图标样式
        duration: 1500      // 显示1.5秒
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();  // 返回上一页面
      }, 1500);
    }    // 监听主题变化
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

    if (isFavorite) {
      // 取消收藏
      favorites = favorites.filter(id => id !== spot.id);
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      });
    } else {
      // 添加收藏
      favorites.push(spot.id);
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
    const address = this.data.spot.address || (this.data.spot.location + '景区');
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
              price: spot.price,
              date: new Date().toISOString().split('T')[0],
              status: '待使用'
            };
            bookings.push(booking);
            wx.setStorageSync('bookings', bookings);
          }, 1500);
        }
      }
    });
  },

  // 分享
  onShareAppMessage() {
    const { spot } = this.data;
    return {
      title: `推荐给你一个好地方：${spot.name}`,
      path: `/pages/detail/detail?id=${spot.id}`,
      imageUrl: spot.image
    };
  }
})