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
    return new Promise((resolve, reject) => {
      // 参数验证
      if (!images || !Array.isArray(images) || images.length === 0) {
        reject(new Error('请选择要上传的图片'))
        return
      }

      if (images.length > 9) {
        reject(new Error('最多只能上传9张图片'))
        return
      }      // 显示上传进度
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
      console.log('folderName:', folderName)      // 调用云函数
      console.log('=== 开始调用云函数 uploadPicture ===')
      console.log('调用参数:', {
        action: 'uploadImages',
        images: images,
        spotId: spotId,
        folderName: folderName
      })

      wx.cloud.callFunction({
        name: 'uploadPicture',
        data: {
          action: 'uploadImages',
          images: images,
          spotId: spotId,
          folderName: folderName
        },
        success: (res) => {
          console.log('=== 云函数调用成功 ===')
          console.log('返回结果:', res)

          wx.hideLoading()

          if (res.result && res.result.success) {
            const { data, message } = res.result
            console.log('图片上传成功:', data)

            wx.showToast({
              title: message || '图片上传成功',
              icon: 'success',
              duration: 2000
            })

            resolve({
              success: true,
              data: data,
              message: message
            })
          } else {
            console.log('=== 云函数返回失败结果 ===')
            console.log('失败详情:', res.result)
            const errorMsg = res.result?.error || '图片上传失败'
            console.error('图片上传失败:', errorMsg)

            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 3000
            })

            reject(new Error(errorMsg))
          }
        },
        fail: (error) => {
          console.log('=== 云函数调用失败 ===')
          console.error('调用失败详情:', error)

          wx.hideLoading()
          const errorMsg = this.parseCloudFunctionError(error)
          console.error('云函数调用失败:', error)

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
          const errorMsg = this.parseCloudFunctionError(error)
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
    const fileExtension = this.getFileExtension(file.path || file.tempFilePath)
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
   * 获取文件扩展名
   * @param {string} filePath - 文件路径
   * @returns {string} 扩展名
   */
  static getFileExtension(filePath) {
    if (!filePath) return ''

    const match = filePath.match(/\.([^.]+)$/)
    return match ? match[1] : ''
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
