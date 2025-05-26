/**
 * 文件名: MapIconUtils.js
 * 描述: 地图图标工具类
 * 版本: 1.0.0
 * 创建日期: 2025-05-25
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 地图标记图标生成
 * - 简化版图标（不使用Base64）
 * - 不同类型的地图标记
 */

class MapIconUtils {
  /**
   * 获取位置标记图标（绿色）
   * 使用小程序内置图标或简单路径
   */
  static getLocationMarkerIcon() {
    // 使用简单的图标路径，不需要Base64编码
    return '/images/location-marker.png'  // 可以替换为实际的图标文件
  }

  /**
   * 获取景点标记图标（蓝色）
   */
  static getSpotMarkerIcon() {
    return '/images/spot-marker.png'  // 可以替换为实际的图标文件
  }

  /**
   * 获取用户位置图标（红色）
   */
  static getUserLocationIcon() {
    return '/images/user-location.png'  // 可以替换为实际的图标文件
  }

  /**
   * 获取搜索结果图标（橙色）
   */
  static getSearchResultIcon() {
    return '/images/search-result.png'  // 可以替换为实际的图标文件
  }

  /**
   * 获取中心点标记图标
   */
  static getCenterMarkerIcon() {
    return '/images/center-marker.png'  // 可以替换为实际的图标文件
  }

  /**
   * 根据类型获取对应图标
   * @param {string} type 图标类型 
   * @returns {string} 图标路径或使用默认图标
   */
  static getIconByType(type) {
    // 直接返回空字符串，使用地图默认标记
    // 这样可以避免图标文件不存在的问题
    return ''
  }
}

module.exports = MapIconUtils
