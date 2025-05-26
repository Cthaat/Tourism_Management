# GoogleMapsApi 工具类使用说明

## 概述
这是一个完整的谷歌地图API封装工具类，专为微信小程序环境设计，提供了地理编码、地点搜索、距离计算、路线规划等核心功能。

## 功能特性

### 🗺️ 核心功能
- ✅ 地理编码（地址转坐标）
- ✅ 逆地理编码（坐标转地址）
- ✅ 地点搜索
- ✅ 附近地点搜索
- ✅ 地点详情获取
- ✅ 距离和时间计算
- ✅ 路线规划
- ✅ 时区信息获取
- ✅ 海拔信息获取
- ✅ 地点自动补全
- ✅ 直线距离计算（本地计算）

### 🎯  辅助功能
- ✅ 格式化距离显示
- ✅ 格式化时间显示
- ✅ 完整的错误处理
- ✅ 中文本地化支持

## 快速开始

### 1. 引入工具类
```javascript
const googleMapsApi = require('../../utils/GoogleMapsApi');
```

### 2. 初始化API密钥
```javascript
// 在app.js中初始化
App({
  onLaunch() {
    // 替换为您的谷歌地图API密钥
    googleMapsApi.init('YOUR_GOOGLE_MAPS_API_KEY');
  }
})
```

## 详细用法示例

### 🏠 地理编码 - 将地址转换为坐标
```javascript
// 在页面中使用
Page({
  async searchAddress() {
    try {
      const result = await googleMapsApi.geocode('北京市天安门广场');
      
      if (result.success) {
        console.log('坐标信息:', result.data);
        // result.data 包含：
        // - latitude: 纬度
        // - longitude: 经度  
        // - formattedAddress: 格式化地址
        // - addressComponents: 地址组件
        // - placeId: 地点ID
        
        this.setData({
          latitude: result.data.latitude,
          longitude: result.data.longitude,
          address: result.data.formattedAddress
        });
      } else {
        wx.showToast({
          title: result.error,
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('地理编码失败:', error);
    }
  }
})
```

### 📍 逆地理编码 - 将坐标转换为地址
```javascript
Page({
  async getAddressFromCoordinates() {
    try {
      const result = await googleMapsApi.reverseGeocode(39.9042, 116.4074);
      
      if (result.success) {
        console.log('地址信息:', result.data.formattedAddress);
        
        this.setData({
          currentAddress: result.data.formattedAddress
        });
      }
    } catch (error) {
      console.error('逆地理编码失败:', error);
    }
  }
})
```

### 🔍 地点搜索
```javascript
Page({
  async searchPlaces() {
    try {
      const result = await googleMapsApi.searchPlaces('北京餐厅', {
        latitude: 39.9042,
        longitude: 116.4074,
        radius: 5000,
        type: 'restaurant'
      });
      
      if (result.success) {
        this.setData({
          searchResults: result.data.results
        });
      }
    } catch (error) {
      console.error('地点搜索失败:', error);
    }
  }
})
```

### 🌐 附近搜索
```javascript
Page({
  async searchNearby() {
    try {
      const result = await googleMapsApi.nearbySearch(
        39.9042,    // 纬度
        116.4074,   // 经度
        1000,       // 搜索半径（米）
        'tourist_attraction', // 地点类型
        '景点'       // 关键词
      );
      
      if (result.success) {
        this.setData({
          nearbyPlaces: result.data.results
        });
      }
    } catch (error) {
      console.error('附近搜索失败:', error);
    }
  }
})
```

### 📏 计算距离和时间
```javascript
Page({
  async calculateDistance() {
    try {
      const origins = [{ lat: 39.9042, lng: 116.4074 }]; // 天安门
      const destinations = [{ lat: 40.0583, lng: 116.2833 }]; // 颐和园
      
      const result = await googleMapsApi.getDistanceMatrix(
        origins,
        destinations,
        'driving',  // 交通方式：driving, walking, bicycling, transit
        'zh-CN',    // 语言
        'metric'    // 单位系统
      );
      
      if (result.success) {
        const element = result.data.rows[0].elements[0];
        console.log('距离:', element.distance.text);
        console.log('时间:', element.duration.text);
        
        this.setData({
          distance: element.distance.text,
          duration: element.duration.text
        });
      }
    } catch (error) {
      console.error('距离计算失败:', error);
    }
  }
})
```

### 🛣️ 路线规划
```javascript
Page({
  async getDirections() {
    try {
      const origin = { lat: 39.9042, lng: 116.4074 };      // 起点
      const destination = { lat: 40.0583, lng: 116.2833 }; // 终点
      
      const result = await googleMapsApi.getDirections(
        origin,
        destination,
        'driving',  // 交通方式
        [],         // 途经点（可选）
        'zh-CN'     // 语言
      );
      
      if (result.success) {
        const route = result.data.routes[0];
        console.log('路线概述:', route.summary);
        console.log('路线详情:', route.legs);
        
        this.setData({
          routeInfo: route
        });
      }
    } catch (error) {
      console.error('路线规划失败:', error);
    }
  }
})
```

### 📝 地点自动补全
```javascript
Page({
  data: {
    searchInput: '',
    suggestions: []
  },
  
  async onSearchInput(e) {
    const input = e.detail.value;
    this.setData({ searchInput: input });
    
    if (input.length > 2) {
      try {
        const result = await googleMapsApi.getPlaceAutocomplete(input, {
          language: 'zh-CN',
          components: 'country:cn'
        });
        
        if (result.success) {
          this.setData({
            suggestions: result.data.predictions
          });
        }
      } catch (error) {
        console.error('自动补全失败:', error);
      }
    }
  }
})
```

### 📐 本地距离计算
```javascript
Page({
  calculateLocalDistance() {
    // 使用Haversine公式计算两点间直线距离
    const distance = googleMapsApi.calculateDistance(
      39.9042, 116.4074,  // 天安门坐标
      40.0583, 116.2833   // 颐和园坐标
    );
    
    console.log('直线距离:', distance, '公里');
    
    // 格式化显示
    const formattedDistance = googleMapsApi.formatDistance(distance * 1000);
    console.log('格式化距离:', formattedDistance);
  }
})
```

## 在添加景点页面中的集成示例

### 修改add-spot.js页面
```javascript
// pages/add-spot/add-spot.js
const googleMapsApi = require('../../utils/GoogleMapsApi');

Page({
  data: {
    // ...现有数据
    searchSuggestions: [],
    isSearching: false
  },

  onLoad() {
    // 确保API已初始化
    if (!googleMapsApi.initialized) {
      googleMapsApi.init('YOUR_API_KEY_HERE');
    }
  },

  // 地址搜索输入
  async onAddressInput(e) {
    const address = e.detail.value;
    this.setData({ 'formData.address': address });
    
    if (address.length > 2) {
      this.setData({ isSearching: true });
      
      try {
        const result = await googleMapsApi.getPlaceAutocomplete(address, {
          language: 'zh-CN',
          components: 'country:cn'
        });
        
        if (result.success) {
          this.setData({
            searchSuggestions: result.data.predictions,
            isSearching: false
          });
        }
      } catch (error) {
        console.error('地址搜索失败:', error);
        this.setData({ isSearching: false });
      }
    } else {
      this.setData({ searchSuggestions: [] });
    }
  },

  // 选择搜索建议
  async selectSuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    
    try {
      // 使用地理编码获取精确坐标
      const result = await googleMapsApi.geocode(suggestion.description);
      
      if (result.success) {
        this.setData({
          'formData.address': result.data.formattedAddress,
          'formData.latitude': result.data.latitude,
          'formData.longitude': result.data.longitude,
          searchSuggestions: []
        });
        
        // 更新地图中心
        this.updateMapCenter(result.data.latitude, result.data.longitude);
      }
    } catch (error) {
      console.error('获取地址详情失败:', error);
    }
  },

  // 地图点击事件（现有方法的增强版）
  async onMapTap(e) {
    const latitude = e.detail.latitude;
    const longitude = e.detail.longitude;
    
    // 使用逆地理编码获取地址
    try {
      const result = await googleMapsApi.reverseGeocode(latitude, longitude);
      
      if (result.success) {
        this.setData({
          'formData.latitude': latitude,
          'formData.longitude': longitude,
          'formData.address': result.data.formattedAddress,
          selectedLocation: { latitude, longitude }
        });
      } else {
        // 如果逆地理编码失败，仍然保存坐标
        this.setData({
          'formData.latitude': latitude,
          'formData.longitude': longitude,
          selectedLocation: { latitude, longitude }
        });
      }
    } catch (error) {
      console.error('逆地理编码失败:', error);
      // 即使出错也保存坐标
      this.setData({
        'formData.latitude': latitude,
        'formData.longitude': longitude,
        selectedLocation: { latitude, longitude }
      });
    }
  }
});
```

## 错误处理最佳实践

```javascript
// 统一错误处理
async function handleGoogleMapsRequest(requestFunc, fallbackMessage = '操作失败') {
  try {
    const result = await requestFunc();
    
    if (result.success) {
      return result.data;
    } else {
      wx.showToast({
        title: result.error || fallbackMessage,
        icon: 'none',
        duration: 2000
      });
      return null;
    }
  } catch (error) {
    console.error('Google Maps API错误:', error);
    wx.showToast({
      title: '网络请求失败，请检查网络连接',
      icon: 'none',
      duration: 2000
    });
    return null;
  }
}

// 使用示例
Page({
  async searchLocation() {
    const result = await handleGoogleMapsRequest(
      () => googleMapsApi.geocode(this.data.searchQuery),
      '地址搜索失败'
    );
    
    if (result) {
      // 处理成功结果
      this.setData({
        latitude: result.latitude,
        longitude: result.longitude
      });
    }
  }
});
```

## 注意事项

### 🔑 API密钥管理
- 请确保您的谷歌地图API密钥有足够的配额
- 建议在服务器端代理API请求以保护密钥
- 为API密钥设置适当的使用限制

### 🌐 网络环境
- 确保小程序有访问谷歌服务的网络权限
- 在中国大陆地区可能需要使用代理服务

### 💰 费用控制
- 谷歌地图API按使用量计费
- 建议实现合理的缓存机制
- 监控API使用量避免超出预算

### 🎯 性能优化
- 对频繁的搜索请求实现防抖处理
- 缓存常用的地理编码结果
- 合理设置搜索半径避免过大的结果集

## 常见问题解决

### Q: API初始化失败
```javascript
// 检查API密钥是否正确设置
if (!googleMapsApi.initialized) {
  console.error('Google Maps API未初始化');
  googleMapsApi.init('YOUR_API_KEY');
}
```

### Q: 网络请求超时
```javascript
// 在请求时添加超时处理
try {
  const result = await Promise.race([
    googleMapsApi.geocode(address),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('请求超时')), 10000)
    )
  ]);
} catch (error) {
  console.error('请求超时或失败:', error);
}
```

### Q: 坐标系转换
```javascript
// 如果需要在不同坐标系间转换，可以添加转换方法
// 注意：谷歌地图使用WGS84坐标系
```

这个GoogleMapsApi工具类为您的旅游管理小程序提供了完整的地图服务支持。您可以根据具体需求选择使用相应的功能模块。
