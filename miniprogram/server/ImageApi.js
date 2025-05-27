/**
 * 统一图片上传API模块
 * 整合图片上传到云存储和数据库保存的完整功能
 * 替代之前的 ImageUploadApi、ImageDatabaseApi、ImageManagerApi
 * 作者: 高级中国全栈工程师
 * 创建时间: 2025年5月27日
 */

class ImageApi {

  /**
   * 完整的景点图片上传流程（上传+保存到数据库）
   * @param {Array} images - 图片列表，每个元素包含tempFilePath等信息
   * @param {string} spotId - 景点ID（必需）
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 完整操作结果
   */
  static async uploadSpotImages(images, spotId, options = {}) {
    return new Promise(async (resolve, reject) => {
      // 参数验证
      if (!images || !Array.isArray(images) || images.length === 0) {
        reject(new Error('请选择要上传的图片'))
        return
      }

      if (images.length > 9) {
        reject(new Error('最多只能上传9张图片'))
        return
      }

      if (!spotId) {
        reject(new Error('景点ID是必需的'))
        return
      }

      const {
        folderName = 'spots',
        showProgress = true,
        concurrent = false
      } = options

      console.log('=== ImageApi: 图片上传开始 ===')
      console.log('图片数量:', images.length)
      console.log('景点ID:', spotId)
      console.log('配置选项:', options)

      if (showProgress) {
        wx.showLoading({
          title: '正在上传图片...',
          mask: true
        })
      }

      try {
        // 第一阶段：上传图片到云存储
        console.log('=== 第一阶段：上传到云存储 ===')
        const uploadResults = await ImageApi._uploadFilesToCloud(images, spotId, folderName)

        const successCount = uploadResults.filter(result => result.success).length
        const failCount = uploadResults.length - successCount

        console.log(`云存储上传完成: ${successCount}/${images.length} 成功`)

        // 第二阶段：保存成功上传的图片记录到数据库
        let databaseResults = []
        if (successCount > 0) {
          console.log('=== 第二阶段：保存到数据库 ===')
          try {
            databaseResults = await ImageApi._saveImageRecordsToDatabase(uploadResults, spotId)
            console.log('数据库保存结果:', databaseResults)
          } catch (dbError) {
            console.error('数据库保存失败:', dbError)
            // 数据库保存失败不影响上传成功的状态，但会在结果中标记
          }
        }

        if (showProgress) {
          wx.hideLoading()
        }

        // 统计结果
        const dbSuccessCount = databaseResults.filter(r => r.success).length
        const dbFailCount = databaseResults.length - dbSuccessCount

        let message = `成功上传 ${successCount} 张图片`
        if (failCount > 0) {
          message += `，${failCount} 张失败`
        }
        if (successCount > 0) {
          message += `，${dbSuccessCount} 条记录已保存到数据库`
        }

        wx.showToast({
          title: message,
          icon: successCount > 0 ? 'success' : 'none',
          duration: 3000
        })

        resolve({
          success: true,
          data: {
            upload: {
              results: uploadResults,
              summary: {
                total: images.length,
                uploadSuccess: successCount,
                uploadFailed: failCount,
                databaseSuccess: dbSuccessCount,
                databaseFailed: dbFailCount
              }
            }
          },
          message: message
        })

      } catch (error) {
        if (showProgress) {
          wx.hideLoading()
        }

        console.error('图片上传失败:', error)
        wx.showToast({
          title: error.message || '图片上传失败',
          icon: 'none',
          duration: 3000
        })
        reject(error)
      }
    })
  }

  /**
   * 内部方法：上传文件到云存储
   * @param {Array} images - 图片列表
   * @param {string} spotId - 景点ID
   * @param {string} folderName - 文件夹名称
   * @returns {Promise<Array>} 上传结果数组
   */
  static async _uploadFilesToCloud(images, spotId, folderName) {
    const uploadResults = []
    const timestamp = Date.now()

    // 获取用户信息
    const userInfo = await ImageApi._getCurrentUserInfo()
    const userIdentifier = userInfo.openid ? userInfo.openid.substring(0, 8) : 'anonymous'

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      console.log(`=== 处理第${i + 1}张图片 ===`)

      try {
        // 验证图片数据
        const filePath = image.tempFilePath || image.path
        if (!filePath) {
          throw new Error(`第${i + 1}张图片缺少文件路径`)
        }

        // 获取文件扩展名
        const fileExtension = ImageApi._getFileExtension(filePath) || 'jpg'

        // 生成云存储文件路径
        const cloudPath = ImageApi._generateCloudPath(folderName, spotId, userIdentifier, timestamp, i, fileExtension)

        console.log(`第${i + 1}张图片云存储路径:`, cloudPath)

        // 直接上传到云存储
        const uploadResult = await new Promise((resolve, reject) => {
          wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: filePath,
            success: resolve,
            fail: reject
          })
        })

        console.log(`第${i + 1}张图片上传结果:`, uploadResult)

        if (uploadResult.fileID) {
          // 获取图片的临时访问链接
          const tempUrlResult = await new Promise((resolve, reject) => {
            wx.cloud.getTempFileURL({
              fileList: [uploadResult.fileID],
              success: resolve,
              fail: reject
            })
          })

          const imageInfo = {
            fileID: uploadResult.fileID,
            cloudPath: cloudPath,
            tempFileURL: tempUrlResult.fileList[0]?.tempFileURL || '',
            originalSize: image.size || 0,
            uploadTime: new Date().toISOString(),
            index: i,
            success: true
          }

          uploadResults.push(imageInfo)
          console.log(`图片 ${i + 1} 上传成功:`, imageInfo)
        } else {
          throw new Error(`图片 ${i + 1} 上传失败`)
        }

      } catch (error) {
        console.error(`图片 ${i + 1} 处理失败:`, error)
        uploadResults.push({
          error: error.message,
          index: i,
          success: false
        })
      }
    }

    return uploadResults
  }

  /**
   * 内部方法：保存图片记录到数据库
   * @param {Array} uploadResults - 上传结果列表
   * @param {string} spotId - 景点ID
   * @returns {Promise<Array>} 数据库保存结果列表
   */
  static async _saveImageRecordsToDatabase(uploadResults, spotId) {
    if (!uploadResults || !Array.isArray(uploadResults) || uploadResults.length === 0) {
      return []
    }

    console.log('=== 开始批量保存图片记录到数据库 ===')

    const databaseResults = []
    const successfulUploads = uploadResults.filter(result => result.success && result.tempFileURL)

    for (let i = 0; i < successfulUploads.length; i++) {
      const upload = successfulUploads[i]
      console.log(`保存第${i + 1}张图片记录...`)

      try {
        const dbResult = await ImageApi._saveImageRecord(upload.tempFileURL, spotId)
        databaseResults.push({
          success: true,
          data: dbResult.data,
          imageUrl: upload.tempFileURL,
          fileID: upload.fileID,
          index: i
        })
        console.log(`第${i + 1}张图片记录保存成功`)
      } catch (error) {
        console.error(`第${i + 1}张图片记录保存失败:`, error)
        databaseResults.push({
          success: false,
          error: error.message,
          imageUrl: upload.tempFileURL,
          fileID: upload.fileID,
          index: i
        })
      }
    }

    console.log('=== 批量保存完成 ===')
    console.log('总计:', databaseResults.length)
    console.log('成功:', databaseResults.filter(r => r.success).length)
    console.log('失败:', databaseResults.filter(r => !r.success).length)

    return databaseResults
  }

  /**
   * 内部方法：保存单张图片记录到数据库
   * @param {string} imageUrl - 图片URL
   * @param {string} spotId - 景点ID
   * @returns {Promise<Object>} 保存结果
   */
  static async _saveImageRecord(imageUrl, spotId) {
    return new Promise((resolve, reject) => {
      console.log('=== 调用云函数保存图片记录 ===')
      console.log('图片URL:', imageUrl)
      console.log('景点ID:', spotId)

      wx.cloud.callFunction({
        name: 'uploadPicture',
        data: {
          action: 'saveImageRecord',
          image_url: imageUrl,
          spot_id: spotId
        },
        success: res => {
          console.log('云函数调用成功:', res)
          if (res.result && res.result.success) {
            resolve(res.result)
          } else {
            reject(new Error(res.result?.message || '保存图片记录失败'))
          }
        },
        fail: err => {
          console.error('云函数调用失败:', err)
          reject(new Error(err.errMsg || '云函数调用失败'))
        }
      })
    })
  }

  /**
   * 删除图片（云存储和数据库记录）
   * @param {string} fileID - 要删除的文件ID
   * @returns {Promise<Object>} 删除结果
   */
  static async deleteImage(fileID) {
    return new Promise((resolve, reject) => {
      if (!fileID) {
        reject(new Error('文件ID不能为空'))
        return
      }

      wx.showLoading({
        title: '正在删除图片...',
        mask: true
      })

      wx.cloud.callFunction({
        name: 'uploadPicture',
        data: {
          action: 'deleteImage',
          fileID: fileID
        },
        success: (res) => {
          wx.hideLoading()

          if (res.result && res.result.success) {
            wx.showToast({
              title: '图片删除成功',
              icon: 'success',
              duration: 1500
            })

            resolve({
              success: true,
              message: '图片删除成功'
            })
          } else {
            const errorMsg = res.result?.error || '图片删除失败'
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 3000
            })

            reject(new Error(errorMsg))
          }
        },
        fail: (error) => {
          wx.hideLoading()
          const errorMsg = ImageApi._parseCloudFunctionError(error)
          console.error('删除图片失败:', error)

          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })

          reject(new Error(errorMsg))
        }
      })
    })
  }

  /**
   * 查询景点的图片记录
   * @param {string} spotId - 景点ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 图片记录列表
   */
  static async getSpotImages(spotId, options = {}) {
    return new Promise((resolve, reject) => {
      if (!spotId) {
        reject(new Error('景点ID不能为空'))
        return
      }

      console.log('=== ImageApi: 查询景点图片 ===')
      console.log('景点ID:', spotId)

      wx.cloud.callFunction({
        name: 'uploadPicture',
        data: {
          action: 'getSpotImages',
          spot_id: spotId,
          ...options
        },
        success: res => {
          console.log('查询结果:', res)
          if (res.result && res.result.success) {
            resolve(res.result.data || [])
          } else {
            resolve([]) // 查询失败时返回空数组而不是错误
          }
        },
        fail: err => {
          console.error('查询失败:', err)
          reject(new Error(err.errMsg || '查询图片记录失败'))
        }
      })
    })
  }

  /**
   * 测试数据库连接
   * @returns {Promise<Object>} 测试结果
   */
  static async testConnection() {
    return new Promise((resolve, reject) => {
      console.log('=== ImageApi: 测试连接 ===')

      wx.cloud.callFunction({
        name: 'uploadPicture',
        data: {
          action: 'test'
        },
        success: res => {
          console.log('测试结果:', res)
          resolve(res.result || { success: true, message: '连接测试成功' })
        },
        fail: err => {
          console.error('测试失败:', err)
          reject(new Error(err.errMsg || '数据库连接测试失败'))
        }
      })
    })
  }

  // =========================
  // 内部工具方法
  // =========================

  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} 用户信息
   */
  static async _getCurrentUserInfo() {
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'userLogin',
          success: resolve,
          fail: reject
        })
      })

      return {
        openid: loginRes.result?.openid || 'anonymous'
      }
    } catch (error) {
      console.warn('获取用户信息失败，使用匿名标识:', error)
      return {
        openid: 'anonymous'
      }
    }
  }

  /**
   * 生成云存储文件路径
   * @param {string} folderName - 文件夹名称
   * @param {string} spotId - 景点ID
   * @param {string} userIdentifier - 用户标识
   * @param {number} timestamp - 时间戳
   * @param {number} index - 图片索引
   * @param {string} extension - 文件扩展名
   * @returns {string} 云存储文件路径
   */
  static _generateCloudPath(folderName, spotId, userIdentifier, timestamp, index, extension) {
    const safeSpotId = spotId ? spotId.replace(/[^a-zA-Z0-9-_]/g, '') : 'temp'
    return `${folderName}/${safeSpotId}/${userIdentifier}_${timestamp}_${index}.${extension}`
  }

  /**
   * 获取文件扩展名
   * @param {string} filePath - 文件路径
   * @returns {string} 文件扩展名
   */
  static _getFileExtension(filePath) {
    if (!filePath) return 'jpg'
    const match = filePath.match(/\.([^.]+)$/)
    return match ? match[1].toLowerCase() : 'jpg'
  }

  /**
   * 解析云函数错误信息
   * @param {Object} error - 错误对象
   * @returns {string} 用户友好的错误信息
   */
  static _parseCloudFunctionError(error) {
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        return '网络超时，请重试'
      }
      if (error.errMsg.includes('fail')) {
        return '网络连接失败，请检查网络'
      }
    }
    return error.message || '操作失败，请重试'
  }

  /**
   * 验证图片文件
   * @param {Object} file - 图片文件信息
   * @returns {Object} 验证结果
   */
  static validateImageFile(file) {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']

    // 检查文件大小
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '图片文件不能超过10MB'
      }
    }

    // 检查文件类型
    const fileExtension = ImageApi._getFileExtension(file.path || file.tempFilePath)
    if (!allowedTypes.includes(fileExtension.toLowerCase())) {
      return {
        valid: false,
        error: '只支持JPG、PNG、GIF、WebP格式的图片'
      }
    }

    return {
      valid: true
    }
  }

  /**
   * 批量获取图片临时访问链接
   * @param {Array} fileIDs - 文件ID列表
   * @returns {Promise<Array>} 临时链接列表
   */
  static async getTempFileURLs(fileIDs) {
    return new Promise((resolve, reject) => {
      if (!fileIDs || !Array.isArray(fileIDs) || fileIDs.length === 0) {
        resolve([])
        return
      }

      wx.cloud.getTempFileURL({
        fileList: fileIDs,
        success: (res) => {
          if (res.fileList && res.fileList.length > 0) {
            resolve(res.fileList)
          } else {
            resolve([])
          }
        },
        fail: (error) => {
          console.error('获取临时链接失败:', error)
          reject(new Error('获取图片链接失败'))
        }
      })
    })
  }
}

module.exports = ImageApi
