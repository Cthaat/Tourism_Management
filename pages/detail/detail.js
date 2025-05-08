// pages/detail/detail.js
const app = getApp()

Page({
  data: {
    spot: null,
    isFavorite: false,
    isDarkMode: false,
    colorTheme: '默认绿' // 添加颜色主题变量
  },

  onLoad(options) {
    const { id } = options;
    // 根据ID获取景点信息
    const spot = app.globalData.tourismSpots.find(item => item.id === parseInt(id));

    if (spot) {
      // 从缓存中获取收藏状态
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.includes(parseInt(id));

      this.setData({
        spot,
        isFavorite
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: spot.name
      });
    } else {
      wx.showToast({
        title: '未找到景点信息',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }

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
  },

  onShow() {
    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  // 切换收藏状态
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

  // 获取路线
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

  // 打开Wikipedia
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

  // 购买门票
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

  // 复制地址
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

  // 拨打电话
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

  // 返回上一页
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

  // 预订
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