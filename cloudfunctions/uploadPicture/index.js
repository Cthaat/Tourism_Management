// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const { action } = event

    switch (action) {
      case 'uploadImages':
        // 直接传递 event 作为 data，排除 action 字段
        const { action: _, ...uploadData } = event
        return await uploadImages(uploadData, wxContext)
      case 'deleteImage':
        const { action: __, ...deleteData } = event
        return await deleteImage(deleteData, wxContext)
      case 'test':
        // 测试云函数连接
        return {
          success: true,
          message: '云函数连接正常',
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID
        }
      default:
        throw new Error('未知的操作类型')
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return {
      success: false,
      error: error.message || '服务器内部错误'
    }
  }
}

/**
 * 上传图片到云存储
 * @param {Object} data - 上传数据
 * @param {Object} wxContext - 微信上下文
 */
async function uploadImages(data, wxContext) {
  const { images, spotId, folderName = 'spots' } = data
  const openid = wxContext.OPENID // 从微信上下文获取用户openid

  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error('没有提供要上传的图片')
  }

  if (images.length > 9) {
    throw new Error('最多只能上传9张图片')
  }

  // 添加调试信息
  console.log('=== 云函数 uploadImages 开始 ===')
  console.log('接收到的数据:', JSON.stringify(data, null, 2))
  console.log('图片数量:', images.length)
  console.log('用户openid:', openid)

  const uploadResults = []
  const timestamp = Date.now()

  // 为每张图片生成唯一的文件名
  for (let i = 0; i < images.length; i++) {
    const image = images[i]

    console.log(`=== 处理第${i + 1}张图片 ===`)
    console.log('图片数据:', JSON.stringify(image, null, 2))

    try {
      // 验证图片数据 - 兼容不同的字段名
      const filePath = image.tempFilePath || image.path
      if (!filePath) {
        throw new Error(`第${i + 1}张图片缺少文件路径 (tempFilePath 或 path)`)
      }

      console.log(`第${i + 1}张图片文件路径:`, filePath)

      // 获取文件扩展名
      const fileExtension = getFileExtension(filePath) || 'jpg'

      // 生成云存储文件路径
      const cloudPath = generateCloudPath(folderName, spotId, openid, timestamp, i, fileExtension)

      console.log(`第${i + 1}张图片云存储路径:`, cloudPath)

      // 上传到云存储
      const uploadResult = await cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
      })

      console.log(`第${i + 1}张图片上传结果:`, uploadResult)

      if (uploadResult.fileID) {
        // 获取图片的临时访问链接
        const tempUrlResult = await cloud.getTempFileURL({
          fileList: [uploadResult.fileID]
        })

        const imageInfo = {
          fileID: uploadResult.fileID,
          cloudPath: cloudPath,
          tempFileURL: tempUrlResult.fileList[0]?.tempFileURL || '',
          originalSize: image.size || 0,
          uploadTime: new Date().toISOString(),
          index: i
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

  // 统计上传结果
  const successCount = uploadResults.filter(result => result.fileID).length
  const failCount = uploadResults.length - successCount

  return {
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
  }
}

/**
 * 删除云存储中的图片
 * @param {Object} data - 删除数据
 * @param {Object} wxContext - 微信上下文
 */
async function deleteImage(data, wxContext) {
  const { fileID } = data

  if (!fileID) {
    throw new Error('没有提供要删除的文件ID')
  }

  try {
    const deleteResult = await cloud.deleteFile({
      fileList: [fileID]
    })

    if (deleteResult.fileList[0]?.status === 0) {
      return {
        success: true,
        message: '图片删除成功'
      }
    } else {
      throw new Error('图片删除失败')
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    throw new Error('图片删除失败: ' + error.message)
  }
}

/**
 * 生成云存储文件路径
 * @param {string} folderName - 文件夹名称
 * @param {string} spotId - 景点ID
 * @param {string} openid - 用户openid
 * @param {number} timestamp - 时间戳
 * @param {number} index - 图片索引
 * @param {string} extension - 文件扩展名
 */
function generateCloudPath(folderName, spotId, openid, timestamp, index, extension) {
  // 生成安全的文件名
  const safeSpotId = spotId ? spotId.replace(/[^a-zA-Z0-9-_]/g, '') : 'temp'
  const safeOpenid = openid.substring(0, 8) // 取openid前8位

  return `${folderName}/${safeSpotId}/${safeOpenid}_${timestamp}_${index}.${extension}`
}

/**
 * 获取文件扩展名
 * @param {string} filePath - 文件路径
 */
function getFileExtension(filePath) {
  if (!filePath) return 'jpg'

  const match = filePath.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : 'jpg'
}