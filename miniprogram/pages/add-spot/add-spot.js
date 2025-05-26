/**
 * 文件名: add-spot.js
 * 描述: 添加景点页面逻辑文件
 * 版本: 1.0.0
 * 创建日期: 2025-05-25
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 新增景点信息录入
 * - 表单验证和数据提交
 * - 地理位置选择
 * - 深色模式支持
 */

// 获取应用实例
const app = getApp()
// 导入景点管理API
const SpotManageApi = require('../../server/SpotManageApi.js')
// 导入谷歌地图API工具类
const GoogleMapsApi = require('../../utils/GoogleMapsApi.js')

// 初始化谷歌地图API实例
const googleMapsApi = new GoogleMapsApi()
googleMapsApi.init('AIzaSyC9cGQ8JXj_E9Q6eTmyCAcSkxJCZSCyU-U')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 表单数据
    formData: {
      name: '',                    // 景点名称
      description: '景点描述',      // 景点描述（默认值）
      province: '北京',            // 省份（默认值）
      category_id: '1',           // 分类ID（默认值）
      location: {                 // 景点位置
        address: '',              // 地址
        geopoint: null           // 经纬度
      },
      price: 0,                   // 门票价格（默认值）
      rating: 0,                  // 评分（默认值）
      opening_time: 0,            // 开放时间（默认值）
      closing_time: 0,            // 关闭时间（默认值）
      best_season: 0,             // 最佳旅游季节（默认值）
      phone: '4001234567',        // 联系电话（默认值）
      website: 'https://ys.mihoyo.com/', // 官方网站（默认值）
      status: true                // 状态（默认值：正常）
    },

    // 分类选项
    categoryOptions: [
      { label: '自然风光', value: '1' },
      { label: '历史文化', value: '2' },
      { label: '主题公园', value: '3' },
      { label: '城市观光', value: '4' },
      { label: '休闲度假', value: '5' }
    ],
    categoryIndex: 0,            // 当前选择的分类索引

    // 季节选项
    seasonOptions: ['春季', '夏季', '秋季', '冬季'],

    // 时间显示字符串
    openingTimeStr: '08:00',     // 开放时间显示
    closingTimeStr: '18:00',     // 关闭时间显示

    // 页面状态
    submitting: false,           // 提交状态
    isDarkMode: false,          // 深色模式
    colorTheme: '默认绿',        // 主题颜色    // 地图数据
    mapData: {
      latitude: 39.9075,         // 默认纬度（北京天安门）
      longitude: 116.39723,      // 默认经度（北京天安门）
      scale: 13,                 // 地图缩放级别
      markers: []                // 地图标记点
    },

    // 地址搜索建议
    addressSuggestions: []       // 地址搜索建议列表
  },  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initPageSettings()
    this.initDefaultTimes()
    this.initMapLocation()
    // 初始化主题设置（包括导航栏）
    this.updateThemeSettings()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.updateThemeSettings()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 清除搜索定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  },

  /**
   * 初始化页面设置
   */
  initPageSettings() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '添加景点'
    })
  },

  /**
   * 初始化默认时间
   */
  initDefaultTimes() {
    // 设置默认开放时间为08:00（28800000毫秒）
    this.setData({
      'formData.opening_time': 28800000,
      openingTimeStr: '08:00'
    })

    // 设置默认关闭时间为18:00（64800000毫秒）
    this.setData({
      'formData.closing_time': 64800000,
      closingTimeStr: '18:00'
    })
  },  /**
   * 更新主题设置
   */
  updateThemeSettings() {
    const globalData = app.globalData || {}
    const isDarkMode = globalData.darkMode || false
    const colorTheme = globalData.colorTheme || '默认绿'

    this.setData({
      isDarkMode: isDarkMode,
      colorTheme: colorTheme
    })

    // 使用全局的导航栏样式更新方法，确保与其他页面保持一致
    if (typeof app.updateNavBarStyle === 'function') {
      app.updateNavBarStyle()
    }
  },
  /**
   * 设置导航栏样式
   * @param {boolean} isDarkMode 是否为深色模式
   * @param {string} colorTheme 主题颜色
   */
  setNavigationBarStyle(isDarkMode, colorTheme) {
    let backgroundColor;

    // 根据颜色主题和深色模式设置不同的背景色（与全局App.js保持一致）
    if (isDarkMode) {
      backgroundColor = '#222222'; // 深色模式统一使用深灰色背景
    } else {
      // 根据颜色主题选择对应的背景色
      switch (colorTheme) {
        case '天空蓝':
          backgroundColor = '#1296db';
          break;
        case '中国红':
          backgroundColor = '#e54d42';
          break;
        case '默认绿':
        default:
          backgroundColor = '#1aad19';
          break;
      }
    }

    // 设置导航栏颜色
    wx.setNavigationBarColor({
      frontColor: '#ffffff',  // 统一使用白色文字，确保在所有背景下可读性
      backgroundColor: backgroundColor,
      animation: {
        duration: 0, // 移除动画，避免主题切换时的闪烁
        timingFunc: 'linear'
      },
      success: () => {
        console.log('导航栏颜色设置成功')
      },
      fail: (err) => {
        console.error('导航栏颜色设置失败:', err)
      }
    })
  },

  /**
   * 输入框内容变化处理
   */
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail

    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 位置信息变化处理
   */
  onLocationChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail

    this.setData({
      [`formData.location.${field}`]: value
    })
  },

  /**
   * 选择地理位置
   */
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        console.log('选择位置成功:', res)
        this.setData({
          'formData.location': {
            address: res.address,
            geopoint: {
              type: 'Point',
              coordinates: [res.longitude, res.latitude]
            }
          }
        })
      },
      fail: (err) => {
        console.error('选择位置失败:', err)
        if (err.errMsg.includes('authorize')) {
          wx.showModal({
            title: '位置权限',
            content: '需要获取您的位置权限，请在设置中开启',
            showCancel: false
          })
        }
      }
    })
  },

  /**
   * 分类选择变化
   */
  onCategoryChange(e) {
    const index = parseInt(e.detail.value)
    const category = this.data.categoryOptions[index]

    this.setData({
      categoryIndex: index,
      'formData.category_id': category.value
    })
  },

  /**
   * 评分变化处理
   */
  onRatingChange(e) {
    this.setData({
      'formData.rating': parseFloat(e.detail.value)
    })
  },

  /**
   * 开放时间变化
   */
  onOpeningTimeChange(e) {
    const timeStr = e.detail.value
    const timeMs = this.timeStringToMilliseconds(timeStr)

    this.setData({
      openingTimeStr: timeStr,
      'formData.opening_time': timeMs
    })
  },

  /**
   * 关闭时间变化
   */
  onClosingTimeChange(e) {
    const timeStr = e.detail.value
    const timeMs = this.timeStringToMilliseconds(timeStr)

    this.setData({
      closingTimeStr: timeStr,
      'formData.closing_time': timeMs
    })
  },

  /**
   * 最佳季节变化
   */
  onSeasonChange(e) {
    this.setData({
      'formData.best_season': parseInt(e.detail.value)
    })
  },

  /**
   * 状态开关变化
   */
  onStatusChange(e) {
    this.setData({
      'formData.status': e.detail.value
    })
  },

  /**
   * 时间字符串转毫秒数
   */
  timeStringToMilliseconds(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return (hours * 60 + minutes) * 60 * 1000
  },

  /**
   * 毫秒数转时间字符串
   */
  millisecondsToTimeString(ms) {
    const totalMinutes = Math.floor(ms / (60 * 1000))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  },
  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data

    // 使用API中的验证方法
    const validation = SpotManageApi.validateSpotData(formData)

    if (!validation.isValid) {
      wx.showToast({
        title: validation.errors[0],
        icon: 'none',
        duration: 3000
      })
      return false
    }

    return true
  },  /**
   * 处理提交按钮点击事件（阻止默认提交）
   */
  handleSubmitClick(e) {
    // 阻止默认事件
    if (e && e.preventDefault) {
      e.preventDefault()
    }

    console.log('=== 阻止默认提交事件，开始打包数据 ===')

    // 按照数据库schema字段打包数据
    const schemaData = this.packageDataBySchema()

    console.log('=== 按照数据库Schema打包的JSON数据 ===')
    console.log(JSON.stringify(schemaData, null, 2))
    console.log('=======================================')

    // 可选：如果还想执行原来的提交逻辑，取消下面的注释
    // this.submitForm()
  },

  /**
   * 按照数据库schema字段打包数据
   */
  packageDataBySchema() {
    const { formData, categoryIndex, categoryOptions } = this.data

    // 获取当前时间戳
    const currentTime = Date.now()

    // 按照schema结构组织数据
    const schemaData = {
      // 基本信息字段
      name: formData.name || '景点',
      description: formData.description || '景点描述',
      category_id: categoryOptions[categoryIndex]?.value || '1',
      province: formData.province || '北京',

      // 位置信息字段
      location: {
        address: formData.location?.address || '',
        geopoint: formData.location?.geopoint || {
          type: 'Point',
          coordinates: [0, 0]
        }
      },

      // 价格与评分字段
      price: Number(formData.price) || 0,
      rating: Number(formData.rating) || 0,

      // 时间信息字段
      opening_time: this.convertTimeStringToNumber(this.data.openingTimeStr) || 0,
      closing_time: this.convertTimeStringToNumber(this.data.closingTimeStr) || 0,
      best_season: Number(formData.best_season) || 0,

      // 联系信息字段
      phone: formData.phone || '4001234567',
      website: formData.website || 'https://ys.mihoyo.com/',

      // 状态字段
      status: Boolean(formData.status),

      // 系统字段
      createdAt: currentTime,
      updatedAt: currentTime,
      createBy: app.globalData.userInfo?.nickName || '匿名用户',
      updateBy: app.globalData.userInfo?.nickName || '匿名用户',
      owner: app.globalData.userInfo?.openid || '',
      _mainDep: '',
      _openid: app.globalData.userInfo?.openid || ''
    }

    return schemaData
  },

  /**
   * 将时间字符串转换为毫秒数
   * @param {string} timeStr - 时间字符串 (HH:mm)
   * @returns {number} - 毫秒数
   */
  convertTimeStringToNumber(timeStr) {
    if (!timeStr) return 0

    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num) || 0)
    return (hours * 60 + minutes) * 60 * 1000 // 转换为毫秒
  },

  /**
   * 提交表单
   */
  submitForm() {
    console.log('=== 开始提交表单 ===')
    console.log('当前表单数据:', this.data.formData)
    console.log('地图数据:', this.data.mapData)
    console.log('地址建议:', this.data.addressSuggestions)
    console.log('分类选项:', this.data.categoryOptions)
    console.log('选中的分类索引:', this.data.categoryIndex)
    console.log('季节选项:', this.data.seasonOptions)
    console.log('开放时间:', this.data.openingTimeStr)
    console.log('关闭时间:', this.data.closingTimeStr)
    console.log('提交状态:', this.data.submitting)
    console.log('========================')

    if (this.data.submitting) return

    if (!this.validateForm()) return

    this.setData({ submitting: true })

    // 提交到服务器
    this.submitToServer()
  },/**
   * 提交到服务器
   */
  async submitToServer() {
    const { formData } = this.data

    // 构造提交数据
    const submitData = {
      ...formData,
      // 添加创建时间
      createdAt: Date.now(),
      // 添加系统字段
      createBy: app.globalData.userInfo?.nickName || '匿名用户'
    }

    console.log('=== 最终提交到服务器的数据 ===')
    console.log('完整提交数据:', JSON.stringify(submitData, null, 2))
    console.log('数据字段详情:')
    console.log('- 景点名称:', submitData.name)
    console.log('- 景点描述:', submitData.description)
    console.log('- 省份:', submitData.province)
    console.log('- 分类ID:', submitData.categoryId)
    console.log('- 位置信息:', submitData.location)
    console.log('- 门票价格:', submitData.price)
    console.log('- 评分:', submitData.rating)
    console.log('- 开放时间:', submitData.opening_hours)
    console.log('- 最佳季节:', submitData.best_season)
    console.log('- 联系电话:', submitData.phone)
    console.log('- 官方网站:', submitData.website)
    console.log('- 景点状态:', submitData.status)
    console.log('- 创建时间:', new Date(submitData.createdAt).toLocaleString())
    console.log('- 创建人:', submitData.createBy)
    console.log('============================')

    try {
      // 调用景点管理API
      const result = await SpotManageApi.addSpot(submitData)

      if (result.success) {
        this.handleSubmitSuccess()
      } else {
        this.handleSubmitError(result.message)
      }
    } catch (error) {
      console.error('=== 提交过程发生错误 ===')
      console.error('错误对象:', error)
      console.error('错误信息:', error.message)
      console.error('错误堆栈:', error.stack)
      console.error('========================')
      this.handleSubmitError('网络请求失败，请检查网络连接')
    }
  },
  /**
   * 处理提交成功
   */
  handleSubmitSuccess() {
    console.log('=== 提交成功处理 ===')
    console.log('重置提交状态...')
    this.setData({ submitting: false })

    console.log('显示成功提示...')
    wx.showToast({
      title: '景点添加成功',
      icon: 'success',
      duration: 2000
    })

    console.log('准备返回上一页...')
    // 延迟返回上一页
    setTimeout(() => {
      console.log('执行页面返回操作')
      wx.navigateBack()
    }, 2000)
  },  /**
   * 处理提交失败
   */
  handleSubmitError(errorMessage) {
    console.log('=== 提交失败处理 ===')
    console.error('错误信息:', errorMessage)
    console.log('重置提交状态...')
    this.setData({ submitting: false })

    console.log('显示错误提示:', errorMessage)
    wx.showToast({
      title: errorMessage || '提交失败，请重试',
      icon: 'none',
      duration: 3000
    })
    console.log('=====================')
  },

  // ==================== 地图相关方法 ====================
  /**
   * 地图点击事件
   */
  onMapTap(e) {
    const { latitude, longitude } = e.detail
    console.log('地图点击位置:', latitude, longitude)

    // 更新地图中心点（使用默认标记）
    this.setData({
      'mapData.latitude': latitude,
      'mapData.longitude': longitude,
      'mapData.markers': [{
        id: 1,
        latitude: latitude,
        longitude: longitude,
        width: 32,
        height: 32,
        // 不使用自定义图标，使用地图默认标记
        callout: {
          content: '选择的位置',
          color: '#333333',
          fontSize: 12,
          borderRadius: 4,
          bgColor: '#ffffff',
          padding: 4,
          display: 'ALWAYS'
        }
      }]
    })

    // 调用逆地理编码获取地址信息
    this.reverseGeocode(latitude, longitude)
  },

  /**
   * 地图区域变化事件
   */
  onMapRegionChange(e) {
    if (e.type === 'end') {
      const { latitude, longitude } = e.detail
      console.log('地图区域变化:', latitude, longitude)

      // 更新地图数据
      this.setData({
        'mapData.latitude': latitude,
        'mapData.longitude': longitude
      })
    }
  },

  /**
   * 地图标记点击事件
   */
  onMarkerTap(e) {
    const { markerId } = e.detail
    console.log('点击标记:', markerId)

    wx.showToast({
      title: '已选择此位置',
      icon: 'success',
      duration: 1500
    })
  },

  /**
   * 确认地图位置
   */
  confirmMapLocation() {
    const { latitude, longitude } = this.data.mapData

    if (!latitude || !longitude) {
      wx.showToast({
        title: '请先选择位置',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 调用逆地理编码获取详细地址
    this.reverseGeocode(latitude, longitude, true)
  },
  /**
   * 获取当前位置（已移除功能）
   */
  getCurrentLocation() {
    wx.showToast({
      title: '已移除定位功能',
      icon: 'none',
      duration: 2000
    })
  },  /**
   * 逆地理编码 - 根据经纬度获取地址
   */
  async reverseGeocode(latitude, longitude, updateForm = false) {
    wx.showLoading({
      title: '获取地址中...'
    })

    try {
      // 使用真实的谷歌地图逆地理编码API
      const result = await googleMapsApi.reverseGeocode(latitude, longitude)

      if (result.success) {
        const addressData = result.data
        console.log('逆地理编码结果:', addressData)

        if (updateForm) {
          // 更新表单数据
          this.setData({
            'formData.location': {
              address: addressData.formattedAddress,
              geopoint: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            },
            // 从谷歌地图结果中提取省份信息
            'formData.province': this.extractProvinceFromComponents(addressData.addressComponents) || this.data.formData.province
          })

          wx.showToast({
            title: '位置已确认',
            icon: 'success',
            duration: 1500
          })
        }

      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('逆地理编码失败:', error)

      if (updateForm) {
        // 即使获取地址失败，也保存坐标信息
        this.setData({
          'formData.location': {
            address: `纬度: ${latitude.toFixed(6)}, 经度: ${longitude.toFixed(6)}`,
            geopoint: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          }
        })

        wx.showToast({
          title: '位置已保存（地址获取失败）',
          icon: 'none',
          duration: 2000
        })
      }
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 初始化地图中心位置（使用默认位置）
   */
  initMapLocation: function () {
    // 直接使用默认位置（北京天安门），不获取当前位置
    console.log('使用默认地图位置：北京天安门')
    // 地图数据已经在 data 中初始化了，这里不需要额外操作
  },
  // ==================== 地址搜索功能 ====================
  /**
   * 搜索地址建议
   */
  searchAddressSuggestions: function (keyword) {
    var self = this;

    console.log('🔍 [add-spot.js] 开始搜索地址建议:');
    console.log('📝 [add-spot.js] 关键词:', keyword);
    console.log('⏰ [add-spot.js] 搜索时间:', new Date().toLocaleString());

    // 使用谷歌地图自动补全API获取地址建议
    googleMapsApi.autocomplete(keyword, 'zh-CN', 'CN')
      .then(function (result) {
        console.log('📥 [add-spot.js] 收到搜索结果:');
        console.log('✅ [add-spot.js] 成功状态:', result.success);
        console.log('🔢 [add-spot.js] 结果数量:', result.data ? result.data.length : 0);
        console.log('📋 [add-spot.js] 完整结果:', result);

        if (result.success && result.data.length > 0) {
          console.log('🎯 [add-spot.js] 搜索成功，更新UI');
          console.log('📊 [add-spot.js] 将显示的建议:', result.data.slice(0, 5));

          // 存储搜索建议到页面数据中
          self.setData({
            addressSuggestions: result.data.slice(0, 5) // 只显示前5个建议
          });

          console.log('✅ [add-spot.js] UI更新完成，当前建议数量:', self.data.addressSuggestions.length);
        } else {
          console.log('⚠️ [add-spot.js] 未找到建议，清空列表');
          // 没有找到建议时清空列表
          self.setData({
            addressSuggestions: []
          });
        }
      })
      .catch(function (error) {
        console.error('❌ [add-spot.js] 地址搜索失败:');
        console.error('📝 [add-spot.js] 错误详情:', error);
        self.setData({
          addressSuggestions: []
        });
      });
  },
  /**
   * 根据地址进行地理编码
   */
  geocodeAddress: function (address) {
    var self = this;

    if (!address || address.length < 2) {
      wx.showToast({
        title: '请输入有效地址',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showLoading({
      title: '定位地址中...'
    });

    // 使用真实的谷歌地图地理编码API
    googleMapsApi.geocode(address)
      .then(function (result) {
        if (result.success) {
          var data = result.data;
          var latitude = data.latitude;
          var longitude = data.longitude;
          var formattedAddress = data.formattedAddress;
          var addressComponents = data.addressComponents;

          // 更新地图位置和标记
          self.setData({
            'mapData.latitude': latitude,
            'mapData.longitude': longitude,
            'mapData.markers': [{
              id: 3,
              latitude: latitude,
              longitude: longitude,
              width: 32,
              height: 32,
              // 使用地图默认标记
              callout: {
                content: '搜索位置',
                color: '#333333',
                fontSize: 12,
                borderRadius: 4,
                bgColor: '#fff7e6',
                padding: 4,
                display: 'ALWAYS'
              }
            }],
            'formData.location': {
              address: formattedAddress,
              geopoint: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            },
            // 更新省份信息
            'formData.province': self.extractProvinceFromComponents(addressComponents) || self.data.formData.province
          });

          wx.showToast({
            title: '地址定位成功',
            icon: 'success',
            duration: 1500
          });

          console.log('地理编码结果:', result.data);
        } else {
          wx.showToast({
            title: result.message || '地址定位失败',
            icon: 'none',
            duration: 2000
          });
        }
      })
      .catch(function (error) {
        console.error('地理编码失败:', error);
        wx.showToast({
          title: '定位失败，请重试',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(function () {
        wx.hideLoading();
      });
  },
  /**
   * 地址输入框失去焦点时的处理
   */
  onAddressBlur: function (e) {
    var value = e.detail.value;
    if (value && value !== this.data.formData.location.address) {
      // 如果地址有变化，尝试进行地理编码
      this.geocodeAddress(value);
    }
  },
  /**
   * 从谷歌地图地址组件中提取省份信息
   */
  extractProvinceFromComponents: function (addressComponents) {
    if (!addressComponents || !Array.isArray(addressComponents)) {
      return null;
    }

    // 查找省级行政区
    for (var i = 0; i < addressComponents.length; i++) {
      var component = addressComponents[i];
      var types = component.types || [];
      if (types.indexOf('administrative_area_level_1') !== -1) {
        return component.long_name;
      }
    }

    return null;
  },
  /**
   * 附近地点搜索功能
   */
  searchNearbyPlaces: function () {
    var self = this;
    var mapData = self.data.mapData;
    var latitude = mapData.latitude;
    var longitude = mapData.longitude;

    if (!latitude || !longitude) {
      wx.showToast({
        title: '请先选择位置',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showLoading({
      title: '搜索附近地点...'
    });

    // 使用谷歌地图附近搜索API
    googleMapsApi.nearbySearch(
      latitude,
      longitude,
      5000, // 5公里范围
      'tourist_attraction', // 搜索旅游景点
      'zh-CN'
    )
      .then(function (result) {
        if (result.success && result.data.length > 0) {
          console.log('附近地点:', result.data);

          // 在地图上显示附近的地点
          var nearbyMarkers = result.data.slice(0, 5).map(function (place, index) {
            return {
              id: 100 + index,
              latitude: place.latitude,
              longitude: place.longitude,
              width: 24,
              height: 24,
              callout: {
                content: place.name,
                color: '#666666',
                fontSize: 10,
                borderRadius: 3,
                bgColor: '#e8f5e8',
                padding: 3,
                display: 'BYCLICK'
              }
            };
          });

          // 保留当前选择的位置标记
          var currentMarkers = self.data.mapData.markers;
          self.setData({
            'mapData.markers': currentMarkers.concat(nearbyMarkers)
          });

          wx.showToast({
            title: '找到' + result.data.length + '个附近地点',
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: '附近暂无相关地点',
            icon: 'none',
            duration: 2000
          });
        }
      })
      .catch(function (error) {
        console.error('附近搜索失败:', error);
        wx.showToast({
          title: '搜索失败，请重试',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(function () {
        wx.hideLoading();
      });
  },
  /**
   * 选择地址建议
   */
  selectAddressSuggestion: function (e) {
    var self = this;
    var suggestion = e.currentTarget.dataset.suggestion;

    if (!suggestion) return;

    // 清空建议列表
    self.setData({
      addressSuggestions: []
    });

    // 使用选择的地址进行地理编码
    var address = suggestion.description;
    self.setData({
      'formData.location.address': address
    });

    self.geocodeAddress(address);
  },  /**
   * 优化后的地址输入处理（添加防抖）
   */
  onAddressInput: function (e) {
    var self = this;
    var value = e.detail.value;

    console.log('📝 [add-spot.js] 地址输入触发:');
    console.log('💬 [add-spot.js] 输入内容:', value);
    console.log('📏 [add-spot.js] 输入长度:', value.length);

    // 更新地址输入框的值
    self.setData({
      'formData.location.address': value
    });

    // 清除之前的定时器
    if (self.searchTimer) {
      console.log('⏰ [add-spot.js] 清除之前的搜索定时器');
      clearTimeout(self.searchTimer);
    }

    // 如果输入长度大于2，设置防抖搜索
    if (value && value.length >= 2) {
      console.log('🔍 [add-spot.js] 设置防抖搜索，500ms后执行');
      self.searchTimer = setTimeout(function () {
        console.log('⚡ [add-spot.js] 防抖时间到，开始执行搜索');
        self.searchAddressSuggestions(value);
      }, 500); // 500ms防抖
    } else {
      console.log('🧹 [add-spot.js] 输入长度不足，清空建议列表');
      // 清空建议列表
      self.setData({
        addressSuggestions: []
      });
    }
  },/**
   * 隐藏地址建议（点击其他地方时）
   */
  hideAddressSuggestions: function () {
    this.setData({
      addressSuggestions: []
    });
  },
  /**
   * 阻止事件冒泡
   */
  stopPropagation: function (e) {
    // 阻止事件冒泡，防止触发hideAddressSuggestions
  },
})
