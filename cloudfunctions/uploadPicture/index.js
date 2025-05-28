// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 初始化cloudbase SDK
const app = cloudbase.init({
  env: cloud.DYNAMIC_CURRENT_ENV, // 使用当前云环境
});

/**
 * 云函数入口函数
 * 支持图片相关的数据库操作和文件管理
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const { action } = event    // 获取数据模型
    const models = app.models
    console.log('models', models);

    switch (action) {
      case 'saveImageRecord':
        const { action: __, ...imageData } = event
        return await saveImageRecord(models, imageData, wxContext)
      case 'deleteImage':
        const { action: ___, ...deleteData } = event
        return await deleteImage(deleteData, wxContext)
      case 'getSpotImages':
        const { action: ____, ...getImagesData } = event
        return await getSpotImages(models, getImagesData, wxContext)
      case 'test':
        // 测试云函数连接
        return {
          success: true,
          message: '云函数连接正常',
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID,
          supportedActions: ['saveImageRecord', 'deleteImage', 'getSpotImages', 'test'],
          note: '图片数据库操作和文件管理功能'
        }
      default:
        throw new Error('未知的操作类型，支持的操作: saveImageRecord, deleteImage, getSpotImages, test')
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
 * 保存图片记录到数据库
 * @param {Object} models - 数据模型
 * @param {Object} data - 图片数据
 * @param {Object} wxContext - 微信上下文
 */
async function saveImageRecord(models, data, wxContext) {
  const { image_url, spot_id } = data

  console.log('=== 保存图片记录开始 ===')
  console.log('接收到的数据:', { image_url, spot_id })
  console.log('用户openid:', wxContext.OPENID)

  // 数据验证
  if (!image_url) {
    throw new Error('图片URL不能为空')
  }

  if (!spot_id) {
    throw new Error('景点ID不能为空')
  }

  // 验证spot_id是否为有效字符串
  if (typeof spot_id !== 'string' || spot_id.trim().length === 0) {
    throw new Error('景点ID必须是有效的字符串')
  }

  // 为了适配数据库schema中的id字段（数字类型），将字符串spot_id转换为数字
  // 使用简单的哈希算法将字符串转换为正整数
  function stringToNumber(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    // 确保返回正整数
    return Math.abs(hash);
  }

  const numericId = stringToNumber(spot_id)
  console.log(`字符串景点ID "${spot_id}" 转换为数字ID: ${numericId}`)

  try {
    // 检查数据库集合是否存在，如果不存在则自动创建
    try {
      await models.spot_images.list({
        limit: 1
      })
      console.log('spot_images集合检查通过')
    } catch (dbError) {
      console.error('spot_images集合检查失败:', dbError)
      if (dbError.message && (dbError.message.includes('collection not exists') ||
        dbError.message.includes('集合不存在') ||
        dbError.message.includes('ResourceNotFound'))) {
        console.log('spot_images集合不存在，尝试自动创建...')

        // 尝试通过插入一条测试记录来自动创建集合
        try {
          const testResult = await models.spot_images.create({
            data: {
              _test: true,
              created_at: Date.now()
            }
          })
          console.log('spot_images集合创建成功:', testResult)

          // 删除测试记录
          await models.spot_images.delete({
            filter: {
              where: {
                _id: {
                  $eq: testResult.id
                }
              }
            }
          })
          console.log('测试记录已删除，集合创建完成')
        } catch (createError) {
          console.error('自动创建spot_images集合失败:', createError)
          throw new Error('spot_images集合不存在且无法自动创建，请在云开发控制台手动创建此集合')
        }
      } else {
        throw new Error(`数据库访问失败: ${dbError.message || '未知错误'}`)
      }
    }

    // 准备插入数据
    const currentTime = Date.now()
    const insertData = {
      image_url: image_url, // 图片URL
      spot_id: spot_id, // 保存原始字符串ID用于查询和调试
      created_at: currentTime,
      updated_at: currentTime,
      _openid: wxContext.OPENID, // 创建者标识
    }

    console.log('即将插入的图片记录:', insertData)

    // 使用数据模型创建记录
    const result = await models.spot_images.create({
      data: insertData
    })

    console.log('图片记录创建成功:', result)

    // 立即查询刚创建的记录并返回完整数据
    try {
      console.log('立即查询刚创建的图片记录...')
      console.log('查询ID:', result._id)
      console.log('结果:', result)

      const queryResult = await models.spot_images.get({
        filter: {
          where: {
            _id: {
              $eq: result.id
            }
          }
        }
      })

      console.log('查询到的完整图片记录:', queryResult.data)

      return {
        success: true,
        data: queryResult.data || queryResult,
        message: '图片记录保存成功',
        insertId: result.id,
        timestamp: currentTime
      }
    } catch (queryError) {
      console.error('查询刚创建的图片记录失败:', queryError)

      // 如果查询失败，仍然返回成功状态，但使用构造的数据
      return {
        success: true,
        data: {
          _id: result.id,
          ...insertData
        },
        message: '图片记录保存成功（即时查询失败，返回构造数据）',
        insertId: result.id,
        timestamp: currentTime,
        querySuccess: false
      }
    }

  } catch (error) {
    console.error('=== 保存图片记录错误 ===')
    console.error('错误详情:', error)

    // 针对常见的云开发错误提供友好提示
    let errorMessage = '保存图片记录失败'
    if (error.message && error.message.includes('permission denied')) {
      errorMessage = '没有数据库操作权限，请检查云开发权限设置'
    } else if (error.message && error.message.includes('quota')) {
      errorMessage = '云环境资源配额已满，请检查数据库配额'
    } else if (error.message && (error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {
      errorMessage = 'spot_images集合不存在，请在云开发控制台创建此集合'
    } else if (error.message) {
      errorMessage = `保存图片记录失败：${error.message}`
    }

    return {
      success: false,
      message: errorMessage
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

/**
 * 获取景点轮播图
 * @param {Object} models - 数据模型
 * @param {Object} data - 查询数据
 * @param {Object} wxContext - 微信上下文
 */
async function getSpotImages(models, data, wxContext) {
  const { spot_id } = data

  console.log('=== 获取景点轮播图开始 ===')
  console.log('接收到的数据:', { spot_id })
  console.log('用户openid:', wxContext.OPENID)

  // 数据验证
  if (!spot_id) {
    throw new Error('景点ID不能为空')
  }

  // 验证spot_id是否为有效数字
  if (isNaN(spot_id)) {
    throw new Error('景点ID必须是有效的数字')
  }

  try {
    // 查询指定景点的所有图片
    const result = await models.spot_images.list({
      filter: {
        where: {
          spot_id: {
            $eq: spot_id
          }
        }
      },
      order: {
        created_at: 'desc'  // 按创建时间倒序排列，最新的图片在前面
      },
      limit: 50  // 限制最多返回50张图片
    })

    console.log('查询到的图片记录:', result.data)

    // 提取图片URL数组
    const imageUrls = result.data.records ?
      result.data.records.map(record => record.image_url).filter(url => url) :
      []

    console.log('提取的图片URL数组:', imageUrls)

    return {
      success: true,
      data: {
        spot_id: spot_id,
        images: imageUrls,
        total: imageUrls.length
      },
      message: `成功获取${imageUrls.length}张轮播图`,
      timestamp: Date.now()
    }

  } catch (error) {
    console.error('=== 获取景点轮播图错误 ===')
    console.error('错误详情:', error)

    // 针对常见的云开发错误提供友好提示
    let errorMessage = '获取景点轮播图失败'
    if (error.message && error.message.includes('permission denied')) {
      errorMessage = '没有数据库查询权限，请检查云开发权限设置'
    } else if (error.message && error.message.includes('quota')) {
      errorMessage = '云环境资源配额已满，请检查数据库配额'
    } else if (error.message && (error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {
      errorMessage = 'spot_images集合不存在，请在云开发控制台创建此集合'
    } else if (error.message) {
      errorMessage = `获取景点轮播图失败：${error.message}`
    }

    return {
      success: false,
      message: errorMessage,
      data: {
        spot_id: spot_id,
        images: [],
        total: 0
      }
    }
  }
}