/**
 * 谷歌地图API封装工具类 - ES5兼容版本
 * 提供地理编码、逆地理编码、地点搜索、距离计算、路线规划等功能
 * 作者：高级中国全栈工程师
 */

function GoogleMapsApi(apiKey) {
  this.apiKey = apiKey || ''; // 代理服务器会自动添加API密钥
  this.baseUrl = 'https://googlemap.edge2.xyz'; // 使用本地代理服务器
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
    var requestTimer = null;
    var requestCompleted = false;

    // 设置5秒超时
    requestTimer = setTimeout(function () {
      if (!requestCompleted) {
        requestCompleted = true;
        console.warn('⏰ GoogleMapsApi 请求超时，尝试使用备用服务');
        reject(new Error('REQUEST_TIMEOUT'));
      }
    }, 5000);

    wx.request({
      url: fullUrl,
      method: 'GET',
      timeout: 5000, // 微信小程序请求超时设置
      success: function (res) {
        if (requestCompleted) return;
        requestCompleted = true;
        clearTimeout(requestTimer);

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
        if (requestCompleted) return;
        requestCompleted = true;
        clearTimeout(requestTimer);

        console.error('❌ GoogleMapsApi 请求失败:');
        console.error('📝 错误信息:', err.errMsg);
        console.error('⏰ 失败时间:', new Date().toLocaleString());

        // 区分不同类型的网络错误
        if (err.errMsg && err.errMsg.includes('timeout')) {
          reject(new Error('REQUEST_TIMEOUT'));
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          reject(new Error('NETWORK_ERROR'));
        } else {
          reject(new Error('网络请求失败: ' + err.errMsg));
        }
      }
    });
  });
};

/**
 * 地理编码 - 将地址转换为坐标（带备用服务）
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
          source: 'google',
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
      console.warn('🔄 Google Maps API失败，尝试使用备用服务:', error.message);

      // 如果是超时或网络错误，使用备用地理编码服务
      if (error.message === 'REQUEST_TIMEOUT' || error.message === 'NETWORK_ERROR') {
        return self.fallbackGeocode(address);
      }

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
          source: 'google',
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
      console.warn('🔄 Google Maps API失败，尝试使用备用服务:', error.message);

      // 如果是超时或网络错误，使用备用地址搜索服务
      if (error.message === 'REQUEST_TIMEOUT' || error.message === 'NETWORK_ERROR') {
        return self.fallbackAutocomplete(input);
      }

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

/**
 * 备用地理编码服务（使用本地数据库或国内API）
 * @param {string} address - 地址字符串
 * @returns {Promise<Object>} 地理编码结果
 */
GoogleMapsApi.prototype.fallbackGeocode = function (address) {
  var self = this;

  return new Promise(function (resolve, reject) {
    console.log('🔄 使用备用地理编码服务，地址:', address);

    // 中国主要城市和景点的预设坐标数据
    var locationDatabase = {
      '北京': { lat: 39.9042, lng: 116.4074, address: '北京市' },
      '上海': { lat: 31.2304, lng: 121.4737, address: '上海市' },
      '广州': { lat: 23.1291, lng: 113.2644, address: '广州市' },
      '深圳': { lat: 22.5431, lng: 114.0579, address: '深圳市' },
      '杭州': { lat: 30.2741, lng: 120.1551, address: '杭州市' },
      '南京': { lat: 32.0603, lng: 118.7969, address: '南京市' },
      '天津': { lat: 39.3434, lng: 117.3616, address: '天津市' },
      '成都': { lat: 30.5728, lng: 104.0668, address: '成都市' },
      '重庆': { lat: 29.5647, lng: 106.5507, address: '重庆市' },
      '武汉': { lat: 30.5928, lng: 114.3055, address: '武汉市' },
      '西安': { lat: 34.3416, lng: 108.9398, address: '西安市' },
      '苏州': { lat: 31.2989, lng: 120.5853, address: '苏州市' },
      '长沙': { lat: 28.2282, lng: 112.9388, address: '长沙市' },
      '青岛': { lat: 36.0986, lng: 120.3719, address: '青岛市' },
      '大连': { lat: 38.9140, lng: 121.6147, address: '大连市' },
      '厦门': { lat: 24.4798, lng: 118.0894, address: '厦门市' },
      '宁波': { lat: 29.8683, lng: 121.5440, address: '宁波市' },
      '济南': { lat: 36.6512, lng: 117.1201, address: '济南市' },
      '哈尔滨': { lat: 45.8038, lng: 126.5349, address: '哈尔滨市' },
      '沈阳': { lat: 41.8057, lng: 123.4315, address: '沈阳市' },
      '长春': { lat: 43.8171, lng: 125.3235, address: '长春市' },
      '石家庄': { lat: 38.0428, lng: 114.5149, address: '石家庄市' },
      '郑州': { lat: 34.7466, lng: 113.6254, address: '郑州市' },
      '太原': { lat: 37.8706, lng: 112.5489, address: '太原市' },
      '昆明': { lat: 25.0389, lng: 102.7183, address: '昆明市' },
      '南宁': { lat: 22.8170, lng: 108.3669, address: '南宁市' },
      '南昌': { lat: 28.6820, lng: 115.8581, address: '南昌市' },
      '合肥': { lat: 31.8206, lng: 117.2272, address: '合肥市' },
      '乌鲁木齐': { lat: 43.8256, lng: 87.6168, address: '乌鲁木齐市' },
      '拉萨': { lat: 29.6625, lng: 91.1110, address: '拉萨市' },
      '银川': { lat: 38.5026, lng: 106.2309, address: '银川市' },
      '呼和浩特': { lat: 40.8414, lng: 111.7519, address: '呼和浩特市' },
      '贵阳': { lat: 26.6470, lng: 106.6302, address: '贵阳市' },
      '海口': { lat: 20.0458, lng: 110.3417, address: '海口市' },
      '三亚': { lat: 18.2577, lng: 109.5122, address: '三亚市' },
      '兰州': { lat: 36.0611, lng: 103.8343, address: '兰州市' },
      '西宁': { lat: 36.6171, lng: 101.7782, address: '西宁市' },

      // 著名景点
      '天安门': { lat: 39.9055, lng: 116.3976, address: '北京市东城区天安门广场' },
      '故宫': { lat: 39.9163, lng: 116.3972, address: '北京市东城区景山前街4号' },
      '长城': { lat: 40.4319, lng: 116.5704, address: '北京市延庆区八达岭长城' },
      '天坛': { lat: 39.8836, lng: 116.4067, address: '北京市东城区天坛内东里7号' },
      '颐和园': { lat: 39.9999, lng: 116.2758, address: '北京市海淀区新建宫门路19号' },
      '外滩': { lat: 31.2397, lng: 121.4900, address: '上海市黄浦区中山东一路' },
      '东方明珠': { lat: 31.2397, lng: 121.4995, address: '上海市浦东新区世纪大道1号' },
      '西湖': { lat: 30.2549, lng: 120.1552, address: '浙江省杭州市西湖区龙井路1号' },
      '兵马俑': { lat: 34.3848, lng: 109.2734, address: '陕西省西安市临潼区秦始皇帝陵博物院' },
      '泰山': { lat: 36.2542, lng: 117.1014, address: '山东省泰安市泰山区红门路' },
      '黄山': { lat: 30.1394, lng: 118.1674, address: '安徽省黄山市黄山区' },
      '张家界': { lat: 29.1248, lng: 110.4792, address: '湖南省张家界市武陵源区' },
      '九寨沟': { lat: 33.2544, lng: 103.9170, address: '四川省阿坝藏族羌族自治州九寨沟县' },
      '丽江古城': { lat: 26.8721, lng: 100.2240, address: '云南省丽江市古城区' }
    };

    // 模糊匹配地址
    var matchedLocation = null;
    var normalizedAddress = address.replace(/市|省|区|县|镇|街道|路|号/g, '');

    for (var key in locationDatabase) {
      if (normalizedAddress.includes(key) || key.includes(normalizedAddress)) {
        matchedLocation = locationDatabase[key];
        matchedLocation.searchKey = key;
        break;
      }
    }

    if (matchedLocation) {
      // 模拟网络延迟
      setTimeout(function () {
        console.log('🎯 备用地理编码找到匹配:', matchedLocation.searchKey);
        resolve({
          success: true,
          source: 'fallback-database',
          data: {
            latitude: matchedLocation.lat,
            longitude: matchedLocation.lng,
            formattedAddress: matchedLocation.address,
            addressComponents: [],
            placeId: 'fallback_' + matchedLocation.searchKey,
            types: ['establishment']
          }
        });
      }, 200);
    } else {
      // 如果本地数据库没有匹配，返回默认位置（北京天安门）
      console.warn('⚠️ 备用地理编码未找到匹配，使用默认位置');
      setTimeout(function () {
        resolve({
          success: true,
          source: 'fallback-default',
          data: {
            latitude: 39.9055,
            longitude: 116.3976,
            formattedAddress: '北京市东城区天安门广场（默认位置）',
            addressComponents: [],
            placeId: 'default_beijing',
            types: ['establishment']
          }
        });
      }, 200);
    }
  });
};

/**
 * 备用地址自动完成搜索（使用本地数据库）
 * @param {string} input - 搜索输入
 * @returns {Promise<Object>} 搜索建议列表
 */
GoogleMapsApi.prototype.fallbackAutocomplete = function (input) {
  var self = this;

  return new Promise(function (resolve, reject) {
    console.log('🔄 使用备用地址搜索服务，关键词:', input);

    // 中国城市和地区的本地数据库
    var locationDatabase = [
      // 直辖市
      { name: '北京', fullName: '北京市', province: '北京', type: 'municipality' },
      { name: '上海', fullName: '上海市', province: '上海', type: 'municipality' },
      { name: '天津', fullName: '天津市', province: '天津', type: 'municipality' },
      { name: '重庆', fullName: '重庆市', province: '重庆', type: 'municipality' },

      // 省会城市
      { name: '广州', fullName: '广州市', province: '广东省', type: 'capital' },
      { name: '深圳', fullName: '深圳市', province: '广东省', type: 'city' },
      { name: '杭州', fullName: '杭州市', province: '浙江省', type: 'capital' },
      { name: '南京', fullName: '南京市', province: '江苏省', type: 'capital' },
      { name: '苏州', fullName: '苏州市', province: '江苏省', type: 'city' },
      { name: '成都', fullName: '成都市', province: '四川省', type: 'capital' },
      { name: '武汉', fullName: '武汉市', province: '湖北省', type: 'capital' },
      { name: '西安', fullName: '西安市', province: '陕西省', type: 'capital' },
      { name: '长沙', fullName: '长沙市', province: '湖南省', type: 'capital' },
      { name: '青岛', fullName: '青岛市', province: '山东省', type: 'city' },
      { name: '济南', fullName: '济南市', province: '山东省', type: 'capital' },
      { name: '大连', fullName: '大连市', province: '辽宁省', type: 'city' },
      { name: '沈阳', fullName: '沈阳市', province: '辽宁省', type: 'capital' },
      { name: '厦门', fullName: '厦门市', province: '福建省', type: 'city' },
      { name: '福州', fullName: '福州市', province: '福建省', type: 'capital' },
      { name: '宁波', fullName: '宁波市', province: '浙江省', type: 'city' },
      { name: '温州', fullName: '温州市', province: '浙江省', type: 'city' },
      { name: '哈尔滨', fullName: '哈尔滨市', province: '黑龙江省', type: 'capital' },
      { name: '长春', fullName: '长春市', province: '吉林省', type: 'capital' },
      { name: '石家庄', fullName: '石家庄市', province: '河北省', type: 'capital' },
      { name: '郑州', fullName: '郑州市', province: '河南省', type: 'capital' },
      { name: '太原', fullName: '太原市', province: '山西省', type: 'capital' },
      { name: '南昌', fullName: '南昌市', province: '江西省', type: 'capital' },
      { name: '合肥', fullName: '合肥市', province: '安徽省', type: 'capital' },
      { name: '昆明', fullName: '昆明市', province: '云南省', type: 'capital' },
      { name: '南宁', fullName: '南宁市', province: '广西壮族自治区', type: 'capital' },
      { name: '贵阳', fullName: '贵阳市', province: '贵州省', type: 'capital' },
      { name: '海口', fullName: '海口市', province: '海南省', type: 'capital' },
      { name: '三亚', fullName: '三亚市', province: '海南省', type: 'city' },
      { name: '兰州', fullName: '兰州市', province: '甘肃省', type: 'capital' },
      { name: '西宁', fullName: '西宁市', province: '青海省', type: 'capital' },
      { name: '银川', fullName: '银川市', province: '宁夏回族自治区', type: 'capital' },
      { name: '呼和浩特', fullName: '呼和浩特市', province: '内蒙古自治区', type: 'capital' },
      { name: '乌鲁木齐', fullName: '乌鲁木齐市', province: '新疆维吾尔自治区', type: 'capital' },
      { name: '拉萨', fullName: '拉萨市', province: '西藏自治区', type: 'capital' },

      // 著名景点和地标
      { name: '天安门', fullName: '北京市天安门广场', province: '北京', type: 'landmark' },
      { name: '故宫', fullName: '北京市故宫博物院', province: '北京', type: 'landmark' },
      { name: '长城', fullName: '万里长城', province: '北京', type: 'landmark' },
      { name: '天坛', fullName: '北京市天坛公园', province: '北京', type: 'landmark' },
      { name: '颐和园', fullName: '北京市颐和园', province: '北京', type: 'landmark' },
      { name: '外滩', fullName: '上海市外滩', province: '上海', type: 'landmark' },
      { name: '东方明珠', fullName: '上海市东方明珠电视塔', province: '上海', type: 'landmark' },
      { name: '西湖', fullName: '杭州市西湖风景名胜区', province: '浙江省', type: 'landmark' },
      { name: '兵马俑', fullName: '西安市秦始皇兵马俑博物馆', province: '陕西省', type: 'landmark' },
      { name: '泰山', fullName: '山东省泰安市泰山', province: '山东省', type: 'landmark' },
      { name: '黄山', fullName: '安徽省黄山市黄山', province: '安徽省', type: 'landmark' },
      { name: '张家界', fullName: '湖南省张家界市张家界国家森林公园', province: '湖南省', type: 'landmark' },
      { name: '九寨沟', fullName: '四川省阿坝州九寨沟', province: '四川省', type: 'landmark' },
      { name: '丽江', fullName: '云南省丽江市丽江古城', province: '云南省', type: 'landmark' }
    ];

    // 模糊匹配搜索
    var normalizedInput = input.toLowerCase().replace(/市|省|区|县|镇|街道|路|号/g, '');
    var matchedResults = [];

    // 搜索匹配的地点
    for (var i = 0; i < locationDatabase.length; i++) {
      var location = locationDatabase[i];
      if (location.name.toLowerCase().includes(normalizedInput) ||
        location.fullName.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(location.name.toLowerCase())) {

        var description = location.fullName;
        var mainText = location.name;
        var secondaryText = location.province;

        if (location.type === 'landmark') {
          secondaryText = location.province + ' · 景点';
        } else if (location.type === 'capital') {
          secondaryText = location.province + ' · 省会';
        } else if (location.type === 'municipality') {
          secondaryText = '直辖市';
        } else {
          secondaryText = location.province + ' · 城市';
        }

        matchedResults.push({
          description: description,
          place_id: 'fallback_' + location.name + '_' + Date.now() + '_' + i,
          types: ['establishment', 'point_of_interest'],
          mainText: mainText,
          secondaryText: secondaryText
        });
      }
    }

    // 如果没有匹配结果，提供一些通用建议
    if (matchedResults.length === 0) {
      var defaultSuggestions = [
        {
          description: '北京市',
          place_id: 'fallback_beijing_default',
          types: ['locality', 'political'],
          mainText: '北京',
          secondaryText: '首都 · 直辖市'
        },
        {
          description: '上海市',
          place_id: 'fallback_shanghai_default',
          types: ['locality', 'political'],
          mainText: '上海',
          secondaryText: '直辖市'
        },
        {
          description: '广州市',
          place_id: 'fallback_guangzhou_default',
          types: ['locality', 'political'],
          mainText: '广州',
          secondaryText: '广东省 · 省会'
        }
      ];

      matchedResults = defaultSuggestions;
    }

    // 限制结果数量
    matchedResults = matchedResults.slice(0, 5);

    console.log('🎯 备用搜索找到', matchedResults.length, '个匹配结果');

    // 模拟网络延迟
    setTimeout(function () {
      resolve({
        success: true,
        source: 'fallback-database',
        data: matchedResults
      });
    }, 300);
  });
};

module.exports = GoogleMapsApi;