/**
 * 文件名: CommentApi.js
 * 描述: 评论管理API接口封装
 * 版本: 1.0.0 (支持 @cloudbase/node-sdk)
 * 创建日期: 2025-05-30
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 封装评论相关的云函数调用
 * - 提供统一的API接口
 * - 错误处理和数据格式化
 * - 兼容 @cloudbase/node-sdk 的 commonManager 云函数
 * 
 * 数据库字段说明:
 * - common: 评论内容 (文本，必填)
 * - spot_id: 景点ID (数字，必填)
 * - person: 评论者OPEN_ID (文本，必填)
 */

/**
 * 评论管理API类
 */
class CommentApi {

  /**
   * 添加评论
   * @param {Object} commentData 评论数据
   * @param {string} commentData.common 评论内容
   * @param {number} commentData.spot_id 景点ID
   * @param {string} commentData.person 评论者OPEN_ID
   * @returns {Promise} 返回添加结果
   */
  static async addComment(commentData) {
    try {
      console.log('调用添加评论API:', commentData)

      // 数据验证
      const validationResult = this.validateCommentData(commentData)
      if (!validationResult.valid) {
        return {
          success: false,
          message: validationResult.message
        }
      }

      const res = await wx.cloud.callFunction({
        name: 'commonManager',
        data: {
          action: 'add',
          data: commentData
        }
      })

      console.log('添加评论API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message || '评论添加成功'
        }
      } else {
        return {
          success: false,
          message: res.result ? res.result.message : '添加评论失败'
        }
      }
    } catch (error) {
      console.error('添加评论API调用失败:', error)
      return {
        success: false,
        message: `添加评论失败: ${error.message || '网络错误'}`
      }
    }
  }

  /**
   * 更新评论
   * @param {Object} updateData 更新数据
   * @param {string} updateData._id 评论ID
   * @param {string} updateData.common 评论内容
   * @returns {Promise} 返回更新结果
   */
  static async updateComment(updateData) {
    try {
      console.log('调用更新评论API:', updateData)

      if (!updateData._id) {
        return {
          success: false,
          message: '评论ID不能为空'
        }
      }

      const res = await wx.cloud.callFunction({
        name: 'commonManager',
        data: {
          action: 'update',
          data: updateData
        }
      })

      console.log('更新评论API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message || '评论更新成功'
        }
      } else {
        return {
          success: false,
          message: res.result ? res.result.message : '更新评论失败'
        }
      }
    } catch (error) {
      console.error('更新评论API调用失败:', error)
      return {
        success: false,
        message: `更新评论失败: ${error.message || '网络错误'}`
      }
    }
  }

  /**
   * 删除评论
   * @param {string} commentId 评论ID
   * @returns {Promise} 返回删除结果
   */
  static async deleteComment(commentId) {
    try {
      console.log('调用删除评论API:', commentId)

      if (!commentId) {
        return {
          success: false,
          message: '评论ID不能为空'
        }
      }

      const res = await wx.cloud.callFunction({
        name: 'commonManager',
        data: {
          action: 'delete',
          data: { _id: commentId }
        }
      })

      console.log('删除评论API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message || '评论删除成功'
        }
      } else {
        return {
          success: false,
          message: res.result ? res.result.message : '删除评论失败'
        }
      }
    } catch (error) {
      console.error('删除评论API调用失败:', error)
      return {
        success: false,
        message: `删除评论失败: ${error.message || '网络错误'}`
      }
    }
  }

  /**
   * 获取单个评论
   * @param {string} commentId 评论ID
   * @returns {Promise} 返回评论详情
   */
  static async getComment(commentId) {
    try {
      console.log('调用获取评论API:', commentId)

      if (!commentId) {
        return {
          success: false,
          message: '评论ID不能为空'
        }
      }

      const res = await wx.cloud.callFunction({
        name: 'commonManager',
        data: {
          action: 'get',
          data: { _id: commentId }
        }
      })

      console.log('获取评论API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message || '获取评论成功'
        }
      } else {
        return {
          success: false,
          message: res.result ? res.result.message : '获取评论失败'
        }
      }
    } catch (error) {
      console.error('获取评论API调用失败:', error)
      return {
        success: false,
        message: `获取评论失败: ${error.message || '网络错误'}`
      }
    }
  }

  /**
   * 获取评论列表
   * @param {Object} options 查询选项
   * @param {number} options.page 页码 (默认: 1)
   * @param {number} options.limit 每页数量 (默认: 20)
   * @returns {Promise} 返回评论列表
   */
  static async getCommentList(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 20
      }

      console.log('调用获取评论列表API:', params)

      const res = await wx.cloud.callFunction({
        name: 'commonManager',
        data: {
          action: 'list',
          data: params
        }
      })

      console.log('获取评论列表API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          total: res.result.total,
          page: res.result.page,
          limit: res.result.limit,
          message: res.result.message || '获取评论列表成功'
        }
      } else {
        return {
          success: false,
          message: res.result ? res.result.message : '获取评论列表失败',
          data: [],
          total: 0
        }
      }
    } catch (error) {
      console.error('获取评论列表API调用失败:', error)
      return {
        success: false,
        message: `获取评论列表失败: ${error.message || '网络错误'}`,
        data: [],
        total: 0
      }
    }
  }

  /**
   * 根据景点ID获取评论列表
   * @param {Object} options 查询选项
   * @param {number} options.spot_id 景点ID (必填)
   * @param {number} options.page 页码 (默认: 1)
   * @param {number} options.limit 每页数量 (默认: 20)
   * @returns {Promise} 返回景点评论列表
   */
  static async getCommentsBySpot(options = {}) {
    try {
      if (!options.spot_id) {
        return {
          success: false,
          message: '景点ID不能为空',
          data: [],
          total: 0
        }
      }

      const params = {
        spot_id: options.spot_id,
        page: options.page || 1,
        limit: options.limit || 20
      }

      console.log('调用根据景点获取评论列表API:', params)

      const res = await wx.cloud.callFunction({
        name: 'commonManager',
        data: {
          action: 'listBySpot',
          data: params
        }
      })

      console.log('根据景点获取评论列表API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          total: res.result.total,
          page: res.result.page,
          limit: res.result.limit,
          spot_id: res.result.spot_id,
          message: res.result.message || '获取景点评论列表成功'
        }
      } else {
        return {
          success: false,
          message: res.result ? res.result.message : '获取景点评论列表失败',
          data: [],
          total: 0
        }
      }
    } catch (error) {
      console.error('根据景点获取评论列表API调用失败:', error)
      return {
        success: false,
        message: `获取景点评论列表失败: ${error.message || '网络错误'}`,
        data: [],
        total: 0
      }
    }
  }

  /**
   * 测试云函数连接
   * @returns {Promise} 返回测试结果
   */
  static async testConnection() {
    try {
      console.log('调用测试连接API')

      const res = await wx.cloud.callFunction({
        name: 'commonManager',
        data: {
          action: 'test',
          data: {}
        }
      })

      console.log('测试连接API响应:', res)

      if (res.result && res.result.success) {
        return {
          success: true,
          data: res.result.data,
          message: res.result.message || '连接测试成功'
        }
      } else {
        return {
          success: false,
          message: res.result ? res.result.message : '连接测试失败'
        }
      }
    } catch (error) {
      console.error('测试连接API调用失败:', error)
      return {
        success: false,
        message: `连接测试失败: ${error.message || '网络错误'}`
      }
    }
  }

  /**
   * 数据验证函数
   * @param {Object} commentData 评论数据
   * @returns {Object} 验证结果
   */
  static validateCommentData(commentData) {
    const errors = []

    // 评论内容验证
    if (!commentData.common || typeof commentData.common !== 'string' || commentData.common.trim() === '') {
      errors.push('评论内容不能为空')
    } else if (commentData.common.length > 500) {
      errors.push('评论内容不能超过500个字符')
    }

    // 景点ID验证
    if (!commentData.spot_id || typeof commentData.spot_id !== 'number') {
      errors.push('景点ID不能为空且必须为数字')
    }

    // 评论者验证
    if (!commentData.person || typeof commentData.person !== 'string' || commentData.person.trim() === '') {
      errors.push('评论者OPEN_ID不能为空')
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join('; ') : '数据验证通过'
    }
  }

  /**
   * 格式化评论数据用于显示
   * @param {Object} comment 评论数据
   * @returns {Object} 格式化后的评论数据
   */
  static formatCommentForDisplay(comment) {
    if (!comment) return null

    return {
      id: comment._id,
      content: comment.common,
      spotId: comment.spot_id,
      author: comment.person,
      userId: comment.person,
      userName: comment.person || '匿名用户',
      userAvatar: comment.userAvatar || '/images/default-avatar.png',
      rating: typeof comment.rating === 'number' ? comment.rating : 5,
      timeAgo: this.formatTime(comment.createdAt),
      likeCount: comment.likeCount || 0,
      helpfulCount: comment.helpfulCount || 0,
      images: comment.images || [],
      replies: comment.replies || []
    }
  }

  /**
   * 批量格式化评论列表
   * @param {Array} comments 评论数组
   * @returns {Array} 格式化后的评论数组
   */
  static formatCommentsForDisplay(comments) {
    if (!Array.isArray(comments)) return []

    return comments.map(comment => this.formatCommentForDisplay(comment))
  }

  /**
   * 时间格式化工具
   * @param {number} timestamp 时间戳
   * @returns {string} 格式化后的时间字符串
   */
  static formatTime(timestamp) {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 计算时间差
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < 30 * day) {
      return `${Math.floor(diff / day)}天前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    }
  }
}

// 导出API类
module.exports = CommentApi
