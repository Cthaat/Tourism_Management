/**
 * 图片上传API模块
 * 提供景点图片上传、删除等功能的前端包装
 * 作者: 高级中国全栈工程师
 * 创建时间: 2024年
 */

class ImageUploadApi {
  /**
   * 上传景点图片到云存储
   * @param {Array} images - 图片列表，每个元素包含tempFilePath等信息
   * @param {string} spotId - 景点ID（可选，用于组织文件夹结构）
   * @param {string} folderName - 存储文件夹名称（默认：'spots'）
   * @returns {Promise<Object>} 上传结果
   */
  static async uploadSpotImages(images, spotId = null, folderName = 'spots') {
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

      // 显示上传进度
      wx.showLoading({
        title: '正在上传图片...',
        mask: true
      })

      // 添加调试信息
      console.log('=== ImageUploadApi 调试信息 ===')
      console.log('准备上传的图片数量:', images.length)
      console.log('图片数据结构:', images.map((img, index) => ({
        index: index,
        tempFilePath: img.tempFilePath || img.path,
        size: img.size,
        type: img.type || 'unknown'
      })))
      console.log('spotId:', spotId)
      console.log('folderName:', folderName)

      try {
        // 直接在小程序端上传文件到云存储
        const uploadResults = await ImageUploadApi.uploadFilesToCloud(images, spotId, folderName)

        wx.hideLoading()

        console.log('=== 所有图片上传完成 ===')
        console.log('上传结果:', uploadResults)

        const successCount = uploadResults.filter(result => result.success).length
        const failCount = uploadResults.length - successCount

        wx.showToast({
          title: `成功上传 ${successCount} 张图片${failCount > 0 ? `，${failCount} 张失败` : ''}`,
          icon: successCount > 0 ? 'success' : 'none',
          duration: 2000
        })

        resolve({
          success: true,
          data: {
            uploadResults,
            summary: {
              total: images.length,
              success: successCount,
              failed: failCount
            }
          },
          message: `成功上传 ${successCount} 张图片${failCount > 0 ? `，${failCount} 张失败` : ''}`
        })

      } catch (error) {
        wx.hideLoading()
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
   * 直接上传文件到云存储（小程序端）
   * @param {Array} images - 图片列表
   * @param {string} spotId - 景点ID
   * @param {string} folderName - 文件夹名称
   * @returns {Promise<Array>} 上传结果数组
   */
  static async uploadFilesToCloud(images, spotId, folderName) {
    const uploadResults = []
    const timestamp = Date.now()

    // 获取用户信息
    const userInfo = await ImageUploadApi.getCurrentUserInfo()
    const userIdentifier = userInfo.openid ? userInfo.openid.substring(0, 8) : 'anonymous'

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      console.log(`=== 处理第${i + 1}张图片 ===`)
      console.log('图片数据:', image)

      try {
        // 验证图片数据
        const filePath = image.tempFilePath || image.path
        if (!filePath) {
          throw new Error(`第${i + 1}张图片缺少文件路径`)
        }

        // 获取文件扩展名
        const fileExtension = ImageUploadApi.getFileExtension(filePath) || 'jpg'

        // 生成云存储文件路径
        const cloudPath = ImageUploadApi.generateCloudPath(folderName, spotId, userIdentifier, timestamp, i, fileExtension)

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
   * 获取当前用户信息
   * @returns {Promise<Object>} 用户信息
   */
  static async getCurrentUserInfo() {
    try {
      // 先尝试获取已登录的用户信息
      const loginRes = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'login',
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
  static generateCloudPath(folderName, spotId, userIdentifier, timestamp, index, extension) {
    // 生成安全的文件名
    const safeSpotId = spotId ? spotId.replace(/[^a-zA-Z0-9-_]/g, '') : 'temp'

    return `${folderName}/${safeSpotId}/${userIdentifier}_${timestamp}_${index}.${extension}`
  }

  /**
   * 获取文件扩展名
   * @param {string} filePath - 文件路径
   * @returns {string} 文件扩展名
   */
  static getFileExtension(filePath) {
    if (!filePath) return 'jpg'
    const match = filePath.match(/\.([^.]+)$/)
    return match ? match[1].toLowerCase() : 'jpg'
  }

  /**
   * 删除云存储中的图片
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
          data: {
            fileID: fileID
          }
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
          const errorMsg = ImageUploadApi.parseCloudFunctionError(error)
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
    const fileExtension = ImageUploadApi.getFileExtension(file.path || file.tempFilePath)
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
   * 解析云函数错误信息
   * @param {Object} error - 错误对象
   * @returns {string} 用户友好的错误信息
   */
  static parseCloudFunctionError(error) {
    if (error.errMsg) {
      // 云函数网络错误
      if (error.errMsg.includes('timeout')) {
        return '网络超时，请重试'
      }
      if (error.errMsg.includes('fail')) {
        return '网络连接失败，请检查网络'
      }
    }

    // 通用错误
    return error.message || '操作失败，请重试'
  }

  /**
   * 压缩图片（使用Canvas）
   * @param {string} tempFilePath - 临时文件路径
   * @param {number} quality - 压缩质量 (0-1)
   * @returns {Promise<Object>} 压缩后的图片信息
   */
  static async compressImage(tempFilePath, quality = 0.8) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: tempFilePath,
        success: (imageInfo) => {
          const canvas = wx.createCanvasContext('imageCanvas')

          // 计算压缩后的尺寸
          let { width, height } = imageInfo
          const maxSize = 1200 // 最大尺寸

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width
              width = maxSize
            } else {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          // 绘制到Canvas
          canvas.drawImage(tempFilePath, 0, 0, width, height)
          canvas.draw(false, () => {
            // 导出压缩后的图片
            wx.canvasToTempFilePath({
              canvasId: 'imageCanvas',
              quality: quality,
              success: (res) => {
                resolve({
                  tempFilePath: res.tempFilePath,
                  width: width,
                  height: height
                })
              },
              fail: (error) => {
                console.log('图片压缩失败，使用原图:', error)
                resolve({
                  tempFilePath: tempFilePath,
                  width: imageInfo.width,
                  height: imageInfo.height
                })
              }
            })
          })
        },
        fail: (error) => {
          console.error('获取图片信息失败:', error)
          reject(new Error('图片处理失败'))
        }
      })
    })
  }

  /**
   * 生成图片预览数据
   * @param {Array} uploadResults - 上传结果列表
   * @returns {Array} 预览数据列表
   */
  static generatePreviewData(uploadResults) {
    if (!uploadResults || !Array.isArray(uploadResults)) {
      return []
    }

    return uploadResults
      .filter(result => result.fileID && result.tempFileURL)
      .map((result, index) => ({
        id: result.fileID,
        url: result.tempFileURL,
        cloudPath: result.cloudPath,
        uploadTime: result.uploadTime,
        originalSize: result.originalSize,
        index: index
      }))
  }
}

module.exports = ImageUploadApi
