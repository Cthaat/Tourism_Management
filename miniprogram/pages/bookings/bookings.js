/**
 * @file pages/bookings/bookings.js
 * @description 旅游管理小程序预订管理页面的业务逻辑
 * @version 1.0.0
 * @date 2025-05-13
 * @author Tourism_Management开发团队
 * 
 * 功能说明:
 * - 加载和展示用户的所有预订记录
 * - 提供预订使用、取消功能
 * - 处理预订状态变更和数据更新
 * - 实现主题切换和深色模式适配
 * - 处理空数据状态和页面跳转
 */

// 获取全局应用实例
const app = getApp()

Page({
  /**
   * 页面初始数据 - 定义页面所需的状态变量
   */
  data: {
    bookings: [],                  // 预订记录数组 - 存储用户所有预订信息
    isDarkMode: false,             // 深色模式状态 - 控制页面暗色主题
    colorTheme: '默认绿',           // 当前颜色主题名称 - 与app全局主题保持同步
    themeClass: 'theme-green'      // 当前主题对应的CSS类名 - 控制页面主题色
  },

  /**
   * 生命周期函数 - 页面加载时触发
   */
  onLoad() {
    this.loadBookings();           // 加载预订数据

    // 监听主题变化 - 设置回调处理主题切换
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,      // 更新深色模式状态
        colorTheme: colorTheme,    // 更新主题名称
        themeClass: colorTheme === '默认绿' ? 'theme-green' :
          colorTheme === '天空蓝' ? 'theme-blue' :
            colorTheme === '中国红' ? 'theme-red' : 'theme-green' // 设置对应主题类名
      });

      // 设置页面主题 - 确保DOM已更新
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

    // 初始化主题状态 - 从全局获取当前主题设置
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
   */
  onShow() {
    // 每次显示页面时重新加载预订数据，确保数据最新
    this.loadBookings();

    // 更新主题状态 - 保持与全局设置同步
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme,
      themeClass: app.globalData.colorTheme === '默认绿' ? 'theme-green' :
        app.globalData.colorTheme === '天空蓝' ? 'theme-blue' :
          app.globalData.colorTheme === '中国红' ? 'theme-red' : 'theme-green'
    });

    // 确保导航栏颜色更新 - 调用全局方法更新导航样式
    app.updateNavBarStyle();

    // 手动更新页面的 data-theme 属性 - 保证CSS变量正确应用
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
                app.globalData.colorTheme === '中国红' ? 'theme-red' : 'theme-green'; res[0].node.setAttribute('data-theme', themeClass);
          }
        });
    });
  },

  /**
   * 加载预订记录 - 从本地存储获取用户预订数据
   */
  loadBookings() {
    const bookings = wx.getStorageSync('bookings') || [] // 从本地存储获取预订数据

    if (bookings.length > 0) {
      // 按创建时间降序排序，最新的排在前面
      bookings.sort((a, b) => b.id - a.id)

      this.setData({
        bookings // 更新页面数据
      })
    } else {
      this.setData({
        bookings: [] // 设置为空数组，触发空状态视图显示
      })
    }
  },

  /**
   * 标记预订为已使用 - 更新预订状态
   * @param {Object} e - 事件对象
   */
  useBooking(e) {
    const index = e.currentTarget.dataset.index // 获取点击的预订索引
    let bookings = wx.getStorageSync('bookings') || [] // 获取全部预订数据

    // 弹出确认对话框
    wx.showModal({
      title: '确认使用',
      content: '确定要将此预订标记为已使用吗？',
      success: (res) => {
        if (res.confirm) {
          // 更新预订状态
          bookings[index].status = '已使用'
          wx.setStorageSync('bookings', bookings) // 保存到本地存储

          // 更新页面数据
          this.loadBookings()

          // 显示成功提示
          wx.showToast({
            title: '已使用',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 取消预订 - 从预订列表中移除预订项
   * @param {Object} e - 事件对象
   */
  cancelBooking(e) {
    const index = e.currentTarget.dataset.index // 获取点击的预订索引
    let bookings = wx.getStorageSync('bookings') || [] // 获取全部预订数据

    // 弹出确认对话框
    wx.showModal({
      title: '取消预订',
      content: '确定要取消此预订吗？',
      success: (res) => {
        if (res.confirm) {
          // 从列表中移除
          bookings.splice(index, 1)
          wx.setStorageSync('bookings', bookings) // 保存到本地存储

          // 更新页面数据
          this.loadBookings()

          // 显示成功提示
          wx.showToast({
            title: '已取消预订',
            icon: 'success'
          })
        }
      }
    })
  },
  /**
   * 跳转到景点详情页 - 点击预订项查看景点详情
   * @param {Object} e - 事件对象
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id; // 获取景点ID
    const dataset = e.currentTarget.dataset;

    // 详细调试输出
    console.log('=== 预订页跳转到详情页调试信息 ===');
    console.log('调试时间:', new Date().toLocaleString());
    console.log('源页面: bookings.js');
    console.log('目标页面: detail.js');
    console.log('景点ID:', id);
    console.log('ID类型:', typeof id);
    console.log('完整dataset:', dataset);
    console.log('当前预订页状态:', {
      预订数量: this.data.bookings?.length || 0,
      是否为空: this.data.isEmpty,
      主题模式: this.data.isDarkMode ? '深色' : '浅色',
      颜色主题: this.data.colorTheme
    });

    // 查找当前预订景点的详细信息
    const booking = this.data.bookings?.find(booking => booking.spotId === id || booking.spotId === parseInt(id));
    if (booking) {
      console.log('预订详情:', {
        景点名称: booking.spotName,
        预订ID: booking.id,
        预订日期: booking.date,
        预订状态: booking.status,
        价格: booking.price,
        联系电话: booking.phone
      });
    } else {
      console.warn('⚠️ 未在预订列表中找到景点ID:', id);
      console.log('当前预订列表:', this.data.bookings?.map(b => ({ spotId: b.spotId, spotName: b.spotName })));
    }

    const targetUrl = `/pages/detail/detail?id=${id}`;
    console.log('跳转URL:', targetUrl);

    wx.navigateTo({
      url: targetUrl, // 带参数跳转到详情页
      success: () => {
        console.log('✅ 预订页->详情页跳转成功: ' + id);
        console.log('============================');
      },
      fail: (error) => {
        console.error('❌ 预订页->详情页跳转失败:', error);
        console.error('失败的URL:', targetUrl);
        console.log('============================');
      }
    });
  },

  /**
   * 返回首页 - 从空状态视图返回首页
   */
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index' // 切换到首页标签页
    })
  }
})