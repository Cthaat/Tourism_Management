/**
 * @file pages/favorites/favorites.js
 * @description 旅游管理小程序收藏页面的业务逻辑
 * @version 1.0.0
 * @date 2025-05-13
 * @author Tourism_Management开发团队
 * 
 * 功能说明:
 * - 管理用户收藏的旅游景点
 * - 提供收藏景点的展示、删除功能
 * - 支持多主题色和深色模式适配
 * - 实现与其他页面的导航交互
 * - 处理本地存储的收藏数据
 * 
 * 主要功能模块:
 * - 收藏数据加载与管理
 * - 主题切换与样式适配
 * - 用户操作响应与处理
 * - 页面导航与跳转
 * 
 * 数据依赖:
 * - 全局数据：app.globalData.tourismSpots, app.globalData.darkMode, app.globalData.colorTheme
 * - 本地存储：favorites
 * 
 * 页面交互:
 * - 取消收藏景点
 * - 查看景点详情
 * - 返回首页
 */

// 获取全局应用实例
const app = getApp()

/**
 * 收藏页面配置
 * Page 对象定义了页面的初始数据、生命周期函数和自定义方法
 */
Page({
  /**
   * 页面初始数据 - 定义页面所需的状态变量
   * @property {Array} favoriteSpots - 收藏的景点数据数组
   * @property {boolean} isDarkMode - 深色模式状态标志
   * @property {string} colorTheme - 当前颜色主题名称
   */
  data: {
    favoriteSpots: [],      // 收藏的景点数据数组
    isDarkMode: false,      // 深色模式状态
    colorTheme: '默认绿'     // 当前颜色主题名称
  },
  /**
   * 生命周期函数 - 页面加载时触发
   * 初始化数据、设置主题样式、监听主题变化
   */
  onLoad() {
    // 加载收藏的景点数据
    this.loadFavorites();

    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,
        colorTheme: colorTheme
      });

      // 设置页面主题
      wx.nextTick(() => {
        wx.createSelectorQuery()
          .selectAll('.container')
          .fields({ dataset: true })
          .exec((res) => {
            if (res[0] && res[0].length > 0) {
              this.setData({
                themeClass: colorTheme === '默认绿' ? 'theme-green' :
                  colorTheme === '天空蓝' ? 'theme-blue' :
                    colorTheme === '中国红' ? 'theme-red' : 'theme-green'
              });
            }
          });
      });
    });

    // 初始化主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme,
      themeClass: app.globalData.colorTheme === '默认绿' ? 'theme-green' :
        app.globalData.colorTheme === '天空蓝' ? 'theme-blue' :
          app.globalData.colorTheme === '中国红' ? 'theme-red' : 'theme-green'
    });
  },
  /**
   * 生命周期函数 - 页面显示时触发
   * 重新加载数据、更新主题状态、刷新页面属性
   */
  onShow() {
    // 每次显示页面时重新加载收藏数据，确保数据最新
    this.loadFavorites();

    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme,
      themeClass: app.globalData.colorTheme === '默认绿' ? 'theme-green' :
        app.globalData.colorTheme === '天空蓝' ? 'theme-blue' :
          app.globalData.colorTheme === '中国红' ? 'theme-red' : 'theme-green'
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();

    // 手动更新页面的 data-theme 属性
    wx.nextTick(() => {
      wx.createSelectorQuery()
        .select('page')
        .fields({
          node: true,
          properties: []
        })
        .exec((res) => {
          if (res && res[0] && res[0].node) {
            const themeClass = app.globalData.colorTheme === '默认绿' ? 'theme-green' :
              app.globalData.colorTheme === '天空蓝' ? 'theme-blue' :
                app.globalData.colorTheme === '中国红' ? 'theme-red' : 'theme-green';
            res[0].node.setAttribute('data-theme', themeClass);
          }
        });
    });
  },
  /**
   * 加载收藏景点数据
   * 从本地存储获取收藏数据并与全局景点数据匹配
   * @returns {void}
   */
  loadFavorites() {
    // 从缓存获取收藏的景点ID列表
    const favorites = wx.getStorageSync('favorites') || []

    if (favorites.length > 0) {
      // 获取全局景点数据
      const tourismSpots = app.globalData.tourismSpots || []

      // 筛选出收藏的景点
      const favoriteSpots = tourismSpots.filter(spot => favorites.includes(spot.id))

      this.setData({
        favoriteSpots
      })
    } else {
      this.setData({
        favoriteSpots: []
      })
    }
  },
  /**
   * 移除景点收藏
   * 从收藏列表中删除选中的景点并更新本地存储
   * @param {Object} e - 事件对象，包含景点ID信息
   */
  removeFavorite(e) {
    // 获取要移除的景点ID
    const id = e.currentTarget.dataset.id
    // 从本地存储获取收藏列表
    let favorites = wx.getStorageSync('favorites') || []

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该景点吗？',
      success: (res) => {
        if (res.confirm) {
          // 从收藏列表中移除景点 ID
          favorites = favorites.filter(item => item !== id)
          wx.setStorageSync('favorites', favorites)

          // 更新页面数据
          this.loadFavorites()

          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          })
        }
      }
    })
  },
  /**
   * 跳转到景点详情页
   * 导航到指定景点的详情页面
   * @param {Object} e - 事件对象，包含景点ID信息
   */
  goToDetail(e) {
    // 获取景点ID
    const id = e.currentTarget.dataset.id
    // 使用导航API跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },
  /**
   * 返回首页
   * 切换到首页标签页
   */
  goToHome() {
    // 使用switchTab切换到首页Tab
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})