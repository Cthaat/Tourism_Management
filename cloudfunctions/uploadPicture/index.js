// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

/**
 * 云函数入口函数
 * 注意：图片上传功能已移至前端直接调用 wx.cloud.uploadFile()
 * 本云函数现在只处理需要服务端权限的操作，如图片删除
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const { action } = event

    switch (action) {
      case 'deleteImage':
        const { action: __, ...deleteData } = event
        return await deleteImage(deleteData, wxContext)
      case 'test':
        // 测试云函数连接
        return {
          success: true,
          message: '云函数连接正常',
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID,
          supportedActions: ['deleteImage', 'test'],
          note: '图片上传功能已移至前端直接调用 wx.cloud.uploadFile()'
        }
      default:
        throw new Error('未知的操作类型，支持的操作: deleteImage, test')
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
 * 删除云存储中的图片
 * @param {Object} data - 删除数据
 * @param {Object} wxContext - 微信上下文
 */
async function deleteImage(data, wxContext) {
  const { fileID } = data

  if (!fileID) {
    throw new Error('没有提供要删除的文件ID')
  }

  console.log('=== 删除图片操作 ===')
  console.log('要删除的文件ID:', fileID)
  console.log('用户openid:', wxContext.OPENID)

  try {
    const deleteResult = await cloud.deleteFile({
      fileList: [fileID]
    })

    console.log('删除结果:', deleteResult)

    if (deleteResult.fileList[0]?.status === 0) {
      return {
        success: true,
        message: '图片删除成功',
        fileID: fileID
      }
    } else {
      const errorCode = deleteResult.fileList[0]?.status
      throw new Error(`图片删除失败，错误码: ${errorCode}`)
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    throw new Error('图片删除失败: ' + error.message)
  }
}