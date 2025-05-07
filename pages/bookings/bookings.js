// pages/bookings/bookings.js
const app = getApp()

Page({
  data: {
    bookings: [],
    isDarkMode: false,
    colorTheme: '默认绿',
    themeClass: 'theme-green'
  },

  onLoad() {
    this.loadBookings();

    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,
        colorTheme: colorTheme,
        themeClass: colorTheme === '默认绿' ? 'theme-green' :
          colorTheme === '天空蓝' ? 'theme-blue' :
            colorTheme === '中国红' ? 'theme-red' : 'theme-green'
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
    // 每次显示页面时重新加载预订数据，确保数据最新
    this.loadBookings();

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

  // 加载预订记录
  loadBookings() {
    const bookings = wx.getStorageSync('bookings') || []

    if (bookings.length > 0) {
      // Sort by creation time in descending order, newest first
      bookings.sort((a, b) => b.id - a.id)

      this.setData({
        bookings
      })
    } else {
      this.setData({
        bookings: []
      })
    }
  },

  // 标记预订为已使用
  useBooking(e) {
    const index = e.currentTarget.dataset.index
    let bookings = wx.getStorageSync('bookings') || []

    wx.showModal({
      title: '确认使用',
      content: '确定要将此预订标记为已使用吗？',
      success: (res) => {
        if (res.confirm) {
          // Update booking status
          bookings[index].status = '已使用'
          wx.setStorageSync('bookings', bookings)

          // Update page data
          this.loadBookings()

          wx.showToast({
            title: '已使用',
            icon: 'success'
          })
        }
      }
    })
  },

  // 取消预订
  cancelBooking(e) {
    const index = e.currentTarget.dataset.index
    let bookings = wx.getStorageSync('bookings') || []

    wx.showModal({
      title: '取消预订',
      content: '确定要取消此预订吗？',
      success: (res) => {
        if (res.confirm) {
          // Remove from list
          bookings.splice(index, 1)
          wx.setStorageSync('bookings', bookings)

          // Update page data
          this.loadBookings()

          wx.showToast({
            title: '已取消预订',
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