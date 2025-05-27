/**
 * 文件名: GeocodingService.js
 * 描述: 地理编码服务
 * 版本: 1.0.0
 * 创建日期: 2025-05-25
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 正向地理编码（地址转坐标）
 * - 逆向地理编码（坐标转地址）
 * - 地理位置搜索
 */

class GeocodingService {
  /**
   * 逆向地理编码 - 根据经纬度获取地址信息
   * @param {number} latitude 纬度
   * @param {number} longitude 经度
   * @returns {Promise<Object>} 地址信息
   */
  static async reverseGeocode(latitude, longitude) {
    try {
      // 模拟逆地理编码结果
      // 在实际项目中，这里应该调用真实的地理编码API
      // 比如腾讯地图API、百度地图API或高德地图API
      
      const mockAddresses = [
        {
          address: '北京市朝阳区建国门外大街1号',
          province: '北京',
          city: '北京市',
          district: '朝阳区',
          street: '建国门外大街',
          streetNumber: '1号'
        },
        {
          address: '上海市浦东新区陆家嘴环路1000号',
          province: '上海',
          city: '上海市',
          district: '浦东新区',
          street: '陆家嘴环路',
          streetNumber: '1000号'
        },
        {
          address: '广州市天河区珠江新城花城大道85号',
          province: '广东',
          city: '广州市',
          district: '天河区',
          street: '花城大道',
          streetNumber: '85号'
        },
        {
          address: '深圳市南山区深南大道9988号',
          province: '广东',
          city: '深圳市',
          district: '南山区',
          street: '深南大道',
          streetNumber: '9988号'
        },
        {
          address: '杭州市西湖区文三路399号',
          province: '浙江',
          city: '杭州市',
          district: '西湖区',
          street: '文三路',
          streetNumber: '399号'
        }
      ]
      
      // 根据经纬度范围返回不同的模拟地址
      let addressIndex = 0
      if (latitude >= 31 && latitude <= 32 && longitude >= 121 && longitude <= 122) {
        addressIndex = 1 // 上海区域
      } else if (latitude >= 22 && latitude <= 24 && longitude >= 113 && longitude <= 115) {
        addressIndex = Math.random() > 0.5 ? 2 : 3 // 广州或深圳区域
      } else if (latitude >= 30 && latitude <= 31 && longitude >= 119 && longitude <= 121) {
        addressIndex = 4 // 杭州区域
      }
      
      const selectedAddress = mockAddresses[addressIndex]
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return {
        success: true,
        data: {
          ...selectedAddress,
          latitude,
          longitude,
          formattedAddress: selectedAddress.address
        }
      }
      
    } catch (error) {
      console.error('逆地理编码失败:', error)
      return {
        success: false,
        message: '获取地址信息失败',
        error: error
      }
    }
  }
  
  /**
   * 正向地理编码 - 根据地址获取经纬度
   * @param {string} address 地址
   * @returns {Promise<Object>} 坐标信息
   */
  static async geocode(address) {
    try {
      // 模拟正向地理编码结果
      const mockCoordinates = {
        '北京': { latitude: 39.9042, longitude: 116.4074 },
        '上海': { latitude: 31.2304, longitude: 121.4737 },
        '广州': { latitude: 23.1291, longitude: 113.2644 },
        '深圳': { latitude: 22.5431, longitude: 114.0579 },
        '杭州': { latitude: 30.2741, longitude: 120.1551 },
        '西安': { latitude: 34.3416, longitude: 108.9398 },
        '成都': { latitude: 30.5728, longitude: 104.0668 },
        '武汉': { latitude: 30.5928, longitude: 114.3055 }
      }
      
      // 查找匹配的城市
      let coordinates = null
      for (const [city, coords] of Object.entries(mockCoordinates)) {
        if (address.includes(city)) {
          coordinates = coords
          break
        }
      }
      
      // 如果没有找到匹配的城市，返回默认坐标（北京）
      if (!coordinates) {
        coordinates = mockCoordinates['北京']
      }
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        data: {
          ...coordinates,
          address: address,
          confidence: 0.8
        }
      }
      
    } catch (error) {
      console.error('正向地理编码失败:', error)
      return {
        success: false,
        message: '获取坐标信息失败',
        error: error
      }
    }
  }
  
  /**
   * 地址搜索建议
   * @param {string} keyword 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   */
  static async searchAddress(keyword) {
    try {
      const mockSuggestions = [
        { address: '北京市朝阳区建国门外大街', latitude: 39.9042, longitude: 116.4074 },
        { address: '上海市浦东新区陆家嘴环路', latitude: 31.2304, longitude: 121.4737 },
        { address: '广州市天河区珠江新城花城大道', latitude: 23.1291, longitude: 113.2644 },
        { address: '深圳市南山区深南大道', latitude: 22.5431, longitude: 114.0579 },
        { address: '杭州市西湖区文三路', latitude: 30.2741, longitude: 120.1551 }
      ]
      
      // 过滤匹配的建议
      const filtered = mockSuggestions.filter(item => 
        item.address.toLowerCase().includes(keyword.toLowerCase())
      )
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 200))
      
      return {
        success: true,
        data: filtered.slice(0, 5) // 最多返回5个建议
      }
      
    } catch (error) {
      console.error('地址搜索失败:', error)
      return {
        success: false,
        message: '搜索失败',
        error: error
      }
    }
  }
  
  /**
   * 计算两点间距离（单位：米）
   * @param {number} lat1 第一个点的纬度
   * @param {number} lng1 第一个点的经度
   * @param {number} lat2 第二个点的纬度
   * @param {number} lng2 第二个点的经度
   * @returns {number} 距离（米）
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const radLat1 = lat1 * Math.PI / 180.0
    const radLat2 = lat2 * Math.PI / 180.0
    const a = radLat1 - radLat2
    const b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
    
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
    s = s * 6378.137
    s = Math.round(s * 10000) / 10000
    
    return s * 1000 // 转换为米
  }
}

module.exports = GeocodingService
