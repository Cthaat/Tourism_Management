/**
 * 文件名: SpotManageApi.js
 * 描述: 景点管理API接口封装
 * 版本: 2.1.0 (完整功能版本)
 * 创建日期: 2025-05-25
 * 更新日期: 2025-05-31
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 封装景点相关的云函数调用
 * - 提供统一的API接口
 * - 错误处理和数据格式化
 * - 兼容 @cloudbase/node-sdk 重写的 spotManage 云函数
 * - 支持搜索功能和连接测试
 * 
 * 支持的操作:
 * - addSpot: 添加景点
 * - updateSpot: 更新景点
 * - deleteSpot: 删除景点
 * - getSpot: 获取单个景点
 * - getSpotList: 获取景点列表
 * - searchSpot: 搜索景点（NEW）
 * - testConnection: 测试云函数连接（NEW）
 * 
 * 兼容性:
 * - 完全兼容原有的 wx-server-sdk 接口
 * - 支持新的 @cloudbase/node-sdk 数据模型
 * - 前端调用方式无需修改
 * - 支持多种搜索方式和回退机制
 */

/**
 * 景点管理API类
 */
class SpotManageApi {

  /**
   * 添加景点
   * @param {Object} spotData 景点数据
   * @returns {Promise} 返回添加结果
   */
  static async addSpot(spotData) {
    try {
      console.log('调用添加景点API:', spotData)

      const res = await wx.cloud.callFunction({
        name: 'spotManage',
        data: {
          action: 'add',
          data: spotData
        }
      })

      console.log('添加景点API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message
        }
      } else {
        return {
          success: false,
          message: res.result?.message || '添加景点失败'
        }
      }
    } catch (error) {
      console.error('添加景点API错误:', error)
      return {
        success: false,
        message: error.message || '网络请求失败'
      }
    }
  }

  /**
   * 更新景点
   * @param {Object} spotData 景点数据（包含_id）
   * @returns {Promise} 返回更新结果
   */
  static async updateSpot(spotData) {
    try {
      console.log('调用更新景点API:', spotData)

      const res = await wx.cloud.callFunction({
        name: 'spotManage',
        data: {
          action: 'update',
          data: spotData
        }
      })

      console.log('更新景点API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message
        }
      } else {
        return {
          success: false,
          message: res.result?.message || '更新景点失败'
        }
      }
    } catch (error) {
      console.error('更新景点API错误:', error)
      return {
        success: false,
        message: error.message || '网络请求失败'
      }
    }
  }

  /**
   * 删除景点
   * @param {String} spotId 景点ID
   * @returns {Promise} 返回删除结果
   */
  static async deleteSpot(spotId) {
    try {
      console.log('调用删除景点API:', spotId)

      const res = await wx.cloud.callFunction({
        name: 'spotManage',
        data: {
          action: 'delete',
          data: { _id: spotId }
        }
      })

      console.log('删除景点API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message
        }
      } else {
        return {
          success: false,
          message: res.result?.message || '删除景点失败'
        }
      }
    } catch (error) {
      console.error('删除景点API错误:', error)
      return {
        success: false,
        message: error.message || '网络请求失败'
      }
    }
  }

  /**
   * 获取景点详情
   * @param {String} spotId 景点ID
   * @returns {Promise} 返回景点详情
   */
  static async getSpot(spotId) {
    try {
      console.log('调用获取景点API:', spotId)

      const res = await wx.cloud.callFunction({
        name: 'spotManage',
        data: {
          action: 'get',
          data: { _id: spotId }
        }
      })

      console.log('获取景点API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message
        }
      } else {
        return {
          success: false,
          message: res.result?.message || '获取景点失败'
        }
      }
    } catch (error) {
      console.error('获取景点API错误:', error)
      return {
        success: false,
        message: error.message || '网络请求失败'
      }
    }
  }

  /**
   * 获取景点列表
   * @param {Object} params 查询参数
   * @param {Number} params.page 页码
   * @param {Number} params.limit 每页数量
   * @param {Boolean} params.status 状态筛选
   * @returns {Promise} 返回景点列表
   */
  static async getSpotList(params = {}) {
    try {
      console.log('调用获取景点列表API:', params)

      const res = await wx.cloud.callFunction({
        name: 'spotManage',
        data: {
          action: 'list',
          data: params
        }
      })

      console.log('获取景点列表API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          total: res.result.total,
          message: res.result.message
        }
      } else {
        return {
          success: false,
          message: res.result?.message || '获取景点列表失败'
        }
      }
    } catch (error) {
      console.error('获取景点列表API错误:', error)
      return {
        success: false,
        message: error.message || '网络请求失败'
      }
    }
  }

  /**
   * 搜索景点
   * @param {Object} searchParams 搜索参数
   * @param {String} searchParams.keyword 关键词搜索（名称、地址）
   * @param {String} searchParams.name 景点名称精确匹配
   * @param {String} searchParams.province 省份精确匹配
   * @param {String} searchParams.category_id 分类ID精确匹配
   * @param {Number} searchParams.minPrice 最低价格
   * @param {Number} searchParams.maxPrice 最高价格
   * @param {Number} searchParams.minRating 最低评分
   * @param {Number} searchParams.maxRating 最高评分
   * @param {Boolean} searchParams.status 状态筛选
   * @param {Number} searchParams.page 页码，默认1
   * @param {Number} searchParams.limit 每页数量，默认20
   * @param {String} searchParams.sortBy 排序字段，默认'createdAt'
   * @param {String} searchParams.sortOrder 排序顺序，默认'desc'
   * @returns {Promise} 返回搜索结果
   */
  static async searchSpot(searchParams = {}) {
    try {
      console.log('调用搜索景点API:', searchParams)

      const res = await wx.cloud.callFunction({
        name: 'spotManage',
        data: {
          action: 'search',
          data: searchParams
        }
      })

      console.log('搜索景点API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          total: res.result.total,
          page: res.result.page,
          limit: res.result.limit,
          searchType: res.result.searchType, // 搜索方式标识
          searchParams: res.result.searchParams,
          message: res.result.message
        }
      } else {
        return {
          success: false,
          message: res.result?.message || '搜索景点失败'
        }
      }
    } catch (error) {
      console.error('搜索景点API错误:', error)
      return {
        success: false,
        message: error.message || '网络请求失败'
      }
    }
  }

  /**
   * 测试云函数连接
   * @returns {Promise} 返回连接测试结果
   */
  static async testConnection() {
    try {
      console.log('调用测试连接API')

      const res = await wx.cloud.callFunction({
        name: 'spotManage',
        data: {
          action: 'test'
        }
      })

      console.log('测试连接API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message
        }
      } else {
        return {
          success: false,
          message: res.result?.message || '连接测试失败'
        }
      }
    } catch (error) {
      console.error('测试连接API错误:', error)
      return {
        success: false,
        message: error.message || '网络请求失败'
      }
    }
  }

  /**
   * 验证景点数据
   * @param {Object} spotData 景点数据
   * @returns {Object} 验证结果
   */
  static validateSpotData(spotData) {
    const errors = []

    // 检查必填字段
    if (!spotData.name || !spotData.name.trim()) {
      errors.push('景点名称不能为空')
    }

    if (!spotData.location || !spotData.location.address || !spotData.location.address.trim()) {
      errors.push('景点位置不能为空')
    }

    if (!spotData.location || !spotData.location.geopoint) {
      errors.push('请选择具体地理位置')
    }

    // 检查数据格式
    if (spotData.rating < 0 || spotData.rating > 5) {
      errors.push('评分必须在0-5分之间')
    }

    if (spotData.price < 0) {
      errors.push('门票价格不能为负数')
    }

    if (spotData.opening_time >= spotData.closing_time) {
      errors.push('开放时间不能晚于或等于关闭时间')
    }

    if (spotData.website && !this.isValidUrl(spotData.website)) {
      errors.push('请输入正确的网站地址')
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }
  /**
   * 验证URL格式
   * @param {String} url URL字符串
   * @returns {Boolean} 是否为有效URL
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false
    }

    // 使用正则表达式验证URL格式（适配微信小程序环境）
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i

    // 更严格的HTTP/HTTPS URL验证
    const httpPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/

    return httpPattern.test(url) || urlPattern.test(url)
  }
}

module.exports = SpotManageApi
