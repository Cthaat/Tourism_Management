// add-spot页面集成GoogleMapsApi的增强版示例
// 这个文件展示了如何在现有的add-spot页面中集成GoogleMapsApi工具类

const googleMapsApi = require('../../utils/GoogleMapsApi');

Page({
  data: {
    // 现有数据保持不变
    formData: {
      name: '',
      description: '',
      category: '',
      address: '',
      latitude: null,
      longitude: null,
      images: [],
      tags: [],
      openingHours: '',
      ticketPrice: '',
      contact: '',
      facilities: []
    },

    // 新增数据
    searchSuggestions: [],        // 地址搜索建议
    isSearching: false,           // 是否正在搜索
    nearbyAttractions: [],        // 附近景点
    showNearbyList: false,        // 是否显示附近景点列表
    currentLocationInfo: null     // 当前位置详细信息
  },

  onLoad(options) {
    // 初始化GoogleMapsApi（如果还未初始化）
    if (!googleMapsApi.initialized) {
      // 请替换为您的实际API密钥
      googleMapsApi.init('YOUR_GOOGLE_MAPS_API_KEY');
    }

    // 其他现有初始化代码...
  },

  /**
   * 地址输入时的自动补全功能
   */
  async onAddressInput(e) {
    const address = e.detail.value;
    this.setData({
      'formData.address': address,
      isSearching: address.length > 0
    });

    // 清除之前的搜索建议
    if (address.length <= 2) {
      this.setData({
        searchSuggestions: [],
        isSearching: false
      });
      return;
    }

    try {
      const result = await googleMapsApi.getPlaceAutocomplete(address, {
        language: 'zh-CN',
        components: 'country:cn',
        types: 'establishment|geocode'
      });

      if (result.success) {
        this.setData({
          searchSuggestions: result.data.predictions,
          isSearching: false
        });
      } else {
        this.setData({
          searchSuggestions: [],
          isSearching: false
        });
      }
    } catch (error) {
      console.error('地址自动补全失败:', error);
      this.setData({
        searchSuggestions: [],
        isSearching: false
      });

      wx.showToast({
        title: '搜索服务暂时不可用',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 选择搜索建议
   */
  async selectSuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion;

    wx.showLoading({ title: '获取位置信息...' });

    try {
      // 使用地理编码获取精确坐标
      const result = await googleMapsApi.geocode(suggestion.description);

      if (result.success) {
        const locationData = result.data;

        this.setData({
          'formData.address': locationData.formattedAddress,
          'formData.latitude': locationData.latitude,
          'formData.longitude': locationData.longitude,
          searchSuggestions: [],
          selectedLocation: {
            latitude: locationData.latitude,
            longitude: locationData.longitude
          },
          currentLocationInfo: locationData
        });

        // 更新地图中心并搜索附近景点
        this.updateMapCenter(locationData.latitude, locationData.longitude);
        this.searchNearbyAttractions(locationData.latitude, locationData.longitude);

        wx.showToast({
          title: '位置已更新',
          icon: 'success',
          duration: 1500
        });

      } else {
        wx.showToast({
          title: '无法获取位置信息',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('获取地址详情失败:', error);
      wx.showToast({
        title: '获取位置失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 增强版地图点击事件
   */
  async onMapTap(e) {
    const latitude = e.detail.latitude;
    const longitude = e.detail.longitude;

    wx.showLoading({ title: '获取地址信息...' });

    try {
      // 使用逆地理编码获取地址
      const result = await googleMapsApi.reverseGeocode(latitude, longitude);

      if (result.success) {
        this.setData({
          'formData.latitude': latitude,
          'formData.longitude': longitude,
          'formData.address': result.data.formattedAddress,
          selectedLocation: { latitude, longitude },
          currentLocationInfo: result.data
        });

        // 搜索附近景点
        this.searchNearbyAttractions(latitude, longitude);

        wx.showToast({
          title: '位置已选择',
          icon: 'success',
          duration: 1500
        });

      } else {
        // 即使逆地理编码失败，仍然保存坐标
        this.setData({
          'formData.latitude': latitude,
          'formData.longitude': longitude,
          selectedLocation: { latitude, longitude },
          'formData.address': `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });

        wx.showToast({
          title: '位置已选择（无法获取地址）',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('逆地理编码失败:', error);

      // 即使出错也保存坐标
      this.setData({
        'formData.latitude': latitude,
        'formData.longitude': longitude,
        selectedLocation: { latitude, longitude },
        'formData.address': `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });

      wx.showToast({
        title: '位置已选择',
        icon: 'success',
        duration: 1500
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 搜索附近的旅游景点
   */
  async searchNearbyAttractions(latitude, longitude) {
    try {
      const result = await googleMapsApi.nearbySearch(
        latitude,
        longitude,
        5000, // 5公里半径
        'tourist_attraction',
        '景点'
      );

      if (result.success && result.data.results.length > 0) {
        // 计算距离并排序
        const attractionsWithDistance = result.data.results.map(attraction => {
          const distance = googleMapsApi.calculateDistance(
            latitude, longitude,
            attraction.latitude, attraction.longitude
          );

          return {
            ...attraction,
            distance: distance,
            formattedDistance: googleMapsApi.formatDistance(distance * 1000)
          };
        }).sort((a, b) => a.distance - b.distance);

        this.setData({
          nearbyAttractions: attractionsWithDistance.slice(0, 10) // 只显示前10个
        });

        if (attractionsWithDistance.length > 0) {
          wx.showToast({
            title: `发现${attractionsWithDistance.length}个附近景点`,
            icon: 'none',
            duration: 2000
          });
        }
      } else {
        this.setData({ nearbyAttractions: [] });
      }
    } catch (error) {
      console.error('搜索附近景点失败:', error);
      this.setData({ nearbyAttractions: [] });
    }
  },

  /**
   * 显示/隐藏附近景点列表
   */
  toggleNearbyList() {
    this.setData({
      showNearbyList: !this.data.showNearbyList
    });
  },

  /**
   * 查看附近景点详情
   */
  async viewNearbyAttraction(e) {
    const attraction = e.currentTarget.dataset.attraction;

    try {
      // 如果有placeId，获取详细信息
      if (attraction.placeId) {
        wx.showLoading({ title: '加载详情...' });

        const result = await googleMapsApi.getPlaceDetails(attraction.placeId);

        if (result.success) {
          const details = result.data;

          // 显示详情弹窗
          wx.showModal({
            title: details.name || attraction.name,
            content: `地址: ${details.formatted_address || attraction.vicinity}\n评分: ${details.rating || '暂无评分'}\n距离: ${attraction.formattedDistance}`,
            showCancel: true,
            cancelText: '关闭',
            confirmText: '查看更多',
            success: (res) => {
              if (res.confirm) {
                // 可以跳转到详情页面或打开地图应用
                this.openInMap(attraction.latitude, attraction.longitude, attraction.name);
              }
            }
          });
        }
      } else {
        // 没有placeId时显示基本信息
        wx.showModal({
          title: attraction.name,
          content: `地址: ${attraction.vicinity}\n距离: ${attraction.formattedDistance}`,
          showCancel: false
        });
      }
    } catch (error) {
      console.error('获取景点详情失败:', error);
      wx.showToast({
        title: '无法获取详情',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 在地图应用中打开位置
   */
  openInMap(latitude, longitude, name) {
    wx.openLocation({
      latitude: latitude,
      longitude: longitude,
      name: name,
      address: name,
      scale: 15
    });
  },

  /**
   * 地址验证功能
   */
  async validateAddress() {
    const address = this.data.formData.address;

    if (!address) {
      wx.showToast({
        title: '请输入地址',
        icon: 'none',
        duration: 2000
      });
      return false;
    }

    wx.showLoading({ title: '验证地址...' });

    try {
      const result = await googleMapsApi.geocode(address);

      if (result.success) {
        // 地址验证成功，更新坐标
        this.setData({
          'formData.latitude': result.data.latitude,
          'formData.longitude': result.data.longitude,
          'formData.address': result.data.formattedAddress
        });

        wx.showToast({
          title: '地址验证成功',
          icon: 'success',
          duration: 1500
        });

        return true;
      } else {
        wx.showToast({
          title: '地址无效，请重新输入',
          icon: 'none',
          duration: 2000
        });
        return false;
      }
    } catch (error) {
      console.error('地址验证失败:', error);
      wx.showToast({
        title: '地址验证失败',
        icon: 'none',
        duration: 2000
      });
      return false;
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 增强版表单提交
   */
  async onSubmit() {
    // 首先验证地址
    if (this.data.formData.address && (!this.data.formData.latitude || !this.data.formData.longitude)) {
      const isValid = await this.validateAddress();
      if (!isValid) {
        return;
      }
    }

    // 执行原有的表单验证和提交逻辑
    if (!this.validateForm()) {
      return;
    }

    // 添加位置信息到表单数据
    const submitData = {
      ...this.data.formData,
      locationInfo: this.data.currentLocationInfo,
      nearbyAttractions: this.data.nearbyAttractions.slice(0, 5) // 保存前5个附近景点
    };

    // 调用原有的提交方法
    this.submitSpot(submitData);
  },

  /**
   * 清除位置信息
   */
  clearLocation() {
    this.setData({
      'formData.latitude': null,
      'formData.longitude': null,
      'formData.address': '',
      selectedLocation: null,
      currentLocationInfo: null,
      nearbyAttractions: [],
      searchSuggestions: []
    });

    wx.showToast({
      title: '位置信息已清除',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 更新地图中心（保留原有方法）
   */
  updateMapCenter(latitude, longitude) {
    // 原有的地图更新逻辑
    this.setData({
      selectedLocation: { latitude, longitude }
    });
  },

  // 保留所有原有的方法...
  validateForm() {
    // 原有的表单验证逻辑
    return true;
  },

  submitSpot(data) {
    // 原有的提交逻辑
    console.log('提交景点数据:', data);
  }
});
