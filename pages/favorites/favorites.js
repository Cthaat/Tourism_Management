// pages/favorites/favorites.js
const app = getApp()

Page({
  data: {
    favoriteSpots: [],
    isDarkMode: false,
    colorTheme: '默认绿'
  },

  onLoad() {
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

  // 加载收藏景点数据
  loadFavorites() {
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

  // 移除收藏
  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
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

  // 跳转到景点详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 返回首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})