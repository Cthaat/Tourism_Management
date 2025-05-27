/**
 * 谷歌地图API封装工具类 - ES5兼容版本
 * 提供地理编码、逆地理编码、地点搜索、距离计算、路线规划等功能
 * 作者：高级中国全栈工程师
 */

function GoogleMapsApi(apiKey) {
  this.apiKey = apiKey || 'AIzaSyC9cGQ8JXj_E9Q6eTmyCAcSkxJCZSCyU-U';
  this.baseUrl = 'https://maps.googleapis.com/maps/api';
  this.initialized = true; // 默认已初始化
}

/**
 * 初始化API密钥
 * @param {string} apiKey - 谷歌地图API密钥
 */
GoogleMapsApi.prototype.init = function (apiKey) {
  this.apiKey = apiKey;
  this.initialized = true;
};

/**
 * 检查API是否已初始化
 */
GoogleMapsApi.prototype.checkInitialized = function () {
  if (!this.initialized || !this.apiKey) {
    throw new Error('Google Maps API未初始化，请先调用init()方法设置API密钥');
  }
};

/**
 * 通用HTTP请求方法
 * @param {string} endpoint - API端点
 * @param {Object} params - 请求参数
 * @returns {Promise} 请求结果
 */
GoogleMapsApi.prototype.makeRequest = function (endpoint, params) {
  var self = this;
  params = params || {};
  self.checkInitialized();

  // 使用Object.assign代替展开运算符
  var queryParams = Object.assign({
    key: self.apiKey
  }, params);

  var queryString = Object.keys(queryParams)
    .map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(queryParams[key]);
    })
    .join('&');
  var fullUrl = self.baseUrl + endpoint + '?' + queryString;

  console.log('🌐 GoogleMapsApi 请求开始:');
  console.log('📍 端点:', endpoint);
  console.log('📋 参数:', params);
  console.log('🔗 完整URL:', fullUrl);
  console.log('⏰ 请求时间:', new Date().toLocaleString());

  return new Promise(function (resolve, reject) {
    wx.request({
      url: fullUrl,
      method: 'GET',
      success: function (res) {
        console.log('✅ GoogleMapsApi 响应成功:');
        console.log('📊 状态码:', res.statusCode);
        console.log('📦 响应数据:', res.data);
        console.log('⏰ 响应时间:', new Date().toLocaleString());

        if (res.statusCode === 200) {
          if (res.data.status === 'OK') {
            console.log('🎉 API调用成功，状态: OK');
            resolve(res.data);
          } else {
            console.error('❌ API状态错误:', res.data.status);
            console.error('📝 错误信息:', res.data.error_message || '未知错误');
            reject(new Error('API错误: ' + res.data.status + ' - ' + (res.data.error_message || '未知错误')));
          }
        } else {
          console.error('❌ HTTP状态码错误:', res.statusCode);
          reject(new Error('HTTP错误: ' + res.statusCode));
        }
      },
      fail: function (err) {
        console.error('❌ GoogleMapsApi 请求失败:');
        console.error('📝 错误信息:', err.errMsg);
        console.error('⏰ 失败时间:', new Date().toLocaleString());
        reject(new Error('网络请求失败: ' + err.errMsg));
      }
    });
  });
};

/**
 * 地理编码 - 将地址转换为坐标
 * @param {string} address - 地址字符串
 * @param {string} language - 语言代码，默认中文
 * @param {string} region - 区域代码，默认中国
 * @returns {Promise<Object>} 包含坐标和格式化地址的对象
 */
GoogleMapsApi.prototype.geocode = function (address, language, region) {
  var self = this;
  language = language || 'zh-CN';
  region = region || 'CN';

  var params = {
    address: address,
    language: language,
    region: region
  };

  return self.makeRequest('/geocode/json', params)
    .then(function (response) {
      if (response.results && response.results.length > 0) {
        var result = response.results[0];
        return {
          success: true,
          data: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            formattedAddress: result.formatted_address,
            addressComponents: result.address_components,
            placeId: result.place_id,
            types: result.types
          }
        };
      } else {
        return {
          success: false,
          error: '未找到匹配的地址',
          data: null
        };
      }
    })
    .catch(function (error) {
      return {
        success: false,
        error: '地理编码失败: ' + error.message,
        data: null
      };
    });
};

/**
 * 逆地理编码 - 将坐标转换为地址
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @param {string} language - 语言代码，默认中文
 * @returns {Promise<Object>} 包含地址信息的对象
 */
GoogleMapsApi.prototype.reverseGeocode = function (latitude, longitude, language) {
  var self = this;
  language = language || 'zh-CN';

  var params = {
    latlng: latitude + ',' + longitude,
    language: language
  };

  return self.makeRequest('/geocode/json', params)
    .then(function (response) {
      if (response.results && response.results.length > 0) {
        var result = response.results[0];
        return {
          success: true,
          data: {
            formattedAddress: result.formatted_address,
            addressComponents: result.address_components,
            placeId: result.place_id,
            types: result.types
          }
        };
      } else {
        return {
          success: false,
          error: '未找到地址信息',
          data: null
        };
      }
    })
    .catch(function (error) {
      return {
        success: false,
        error: '逆地理编码失败: ' + error.message,
        data: null
      };
    });
};

/**
 * 地址自动完成搜索
 * @param {string} input - 搜索输入
 * @param {string} language - 语言代码
 * @param {string} region - 区域代码
 * @returns {Promise<Object>} 搜索建议列表
 */
GoogleMapsApi.prototype.autocomplete = function (input, language, region) {
  var self = this;
  language = language || 'zh-CN';
  region = region || 'CN';

  console.log('🔍 开始地址自动补全搜索:');
  console.log('📝 搜索关键词:', input);
  console.log('🌐 语言:', language);
  console.log('🗺️ 区域:', region);

  var params = {
    input: input,
    language: language,
    region: region,
    types: 'geocode'
  };

  return self.makeRequest('/place/autocomplete/json', params)
    .then(function (response) {
      console.log('📥 自动补全API响应:');
      console.log('🔢 预测结果数量:', response.predictions ? response.predictions.length : 0);
      console.log('📋 原始响应:', response);

      if (response.predictions && response.predictions.length > 0) {
        var processedData = response.predictions.map(function (prediction) {
          console.log('🏷️ 处理预测结果:', prediction.description);
          return {
            description: prediction.description,
            place_id: prediction.place_id, // 修复：使用place_id而不是placeId
            types: prediction.types || [], // 添加types字段
            mainText: prediction.structured_formatting ? prediction.structured_formatting.main_text : prediction.description,
            secondaryText: prediction.structured_formatting ? prediction.structured_formatting.secondary_text : ''
          };
        });

        console.log('✅ 自动补全搜索成功，返回', processedData.length, '个结果');
        console.log('📊 处理后的数据:', processedData);

        return {
          success: true,
          data: processedData
        };
      } else {
        console.log('⚠️ 自动补全搜索未找到结果');
        return {
          success: false,
          error: '未找到搜索建议',
          data: []
        };
      }
    })
    .catch(function (error) {
      console.error('❌ 自动补全搜索失败:');
      console.error('📝 错误详情:', error);
      return {
        success: false,
        error: '自动完成搜索失败: ' + error.message,
        data: []
      };
    });
};

/**
 * 根据Place ID获取详细信息
 * @param {string} placeId - 地点ID
 * @param {string} language - 语言代码
 * @returns {Promise<Object>} 地点详细信息
 */
GoogleMapsApi.prototype.getPlaceDetails = function (placeId, language) {
  var self = this;
  language = language || 'zh-CN';

  var params = {
    place_id: placeId,
    language: language,
    fields: 'name,formatted_address,geometry,rating,reviews,place_id,types'
  };

  return self.makeRequest('/place/details/json', params)
    .then(function (response) {
      if (response.result) {
        var result = response.result;
        return {
          success: true,
          data: {
            name: result.name,
            formattedAddress: result.formatted_address,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            rating: result.rating,
            placeId: result.place_id,
            types: result.types,
            reviews: result.reviews || []
          }
        };
      } else {
        return {
          success: false,
          error: '未找到地点详情',
          data: null
        };
      }
    })
    .catch(function (error) {
      return {
        success: false,
        error: '获取地点详情失败: ' + error.message,
        data: null
      };
    });
};

/**
 * 搜索附近的地点
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @param {number} radius - 搜索半径（米）
 * @param {string} type - 地点类型
 * @param {string} language - 语言代码
 * @returns {Promise<Object>} 附近地点列表
 */
GoogleMapsApi.prototype.nearbySearch = function (latitude, longitude, radius, type, language) {
  var self = this;
  radius = radius || 1000;
  type = type || 'tourist_attraction';
  language = language || 'zh-CN';

  var params = {
    location: latitude + ',' + longitude,
    radius: radius,
    type: type,
    language: language
  };

  return self.makeRequest('/place/nearbysearch/json', params)
    .then(function (response) {
      if (response.results && response.results.length > 0) {
        return {
          success: true,
          data: response.results.map(function (place) {
            return {
              name: place.name,
              vicinity: place.vicinity,
              rating: place.rating,
              placeId: place.place_id,
              types: place.types,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              photoReference: place.photos && place.photos[0] ? place.photos[0].photo_reference : null
            };
          })
        };
      } else {
        return {
          success: false,
          error: '未找到附近地点',
          data: []
        };
      }
    })
    .catch(function (error) {
      return {
        success: false,
        error: '搜索附近地点失败: ' + error.message,
        data: []
      };
    });
};

/**
 * 文本搜索地点
 * @param {string} query - 搜索查询
 * @param {string} language - 语言代码
 * @param {string} region - 区域代码
 * @returns {Promise<Object>} 搜索结果列表
 */
GoogleMapsApi.prototype.textSearch = function (query, language, region) {
  var self = this;
  language = language || 'zh-CN';
  region = region || 'CN';

  var params = {
    query: query,
    language: language,
    region: region
  };

  return self.makeRequest('/place/textsearch/json', params)
    .then(function (response) {
      if (response.results && response.results.length > 0) {
        return {
          success: true,
          data: response.results.map(function (place) {
            return {
              name: place.name,
              formattedAddress: place.formatted_address,
              rating: place.rating,
              placeId: place.place_id,
              types: place.types,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            };
          })
        };
      } else {
        return {
          success: false,
          error: '未找到搜索结果',
          data: []
        };
      }
    })
    .catch(function (error) {
      return {
        success: false,
        error: '文本搜索失败: ' + error.message,
        data: []
      };
    });
};

/**
 * 计算两点之间的距离（使用Haversine公式）
 * @param {number} lat1 - 第一个点的纬度
 * @param {number} lng1 - 第一个点的经度
 * @param {number} lat2 - 第二个点的纬度
 * @param {number} lng2 - 第二个点的经度
 * @returns {number} 距离（千米）
 */
GoogleMapsApi.prototype.calculateDistance = function (lat1, lng1, lat2, lng2) {
  var R = 6371; // 地球半径（千米）
  var dLat = this.toRadians(lat2 - lat1);
  var dLng = this.toRadians(lng2 - lng1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * 将角度转换为弧度
 * @param {number} degrees - 角度值
 * @returns {number} 弧度值
 */
GoogleMapsApi.prototype.toRadians = function (degrees) {
  return degrees * (Math.PI / 180);
};

/**
 * 格式化距离显示
 * @param {number} meters - 距离（米）
 * @returns {string} 格式化的距离字符串
 */
GoogleMapsApi.prototype.formatDistance = function (meters) {
  if (meters < 1000) {
    return Math.round(meters) + 'm';
  } else {
    return (meters / 1000).toFixed(1) + 'km';
  }
};

/**
 * 格式化时间显示
 * @param {number} seconds - 时间（秒）
 * @returns {string} 格式化的时间字符串
 */
GoogleMapsApi.prototype.formatDuration = function (seconds) {
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return hours + '小时' + minutes + '分钟';
  } else {
    return minutes + '分钟';
  }
};

module.exports = GoogleMapsApi;