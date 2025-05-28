// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 初始化cloudbase SDK
const app = cloudbase.init({
  env: cloud.DYNAMIC_CURRENT_ENV, // 使用当前云环境
});

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext() || {}
    const openid = wxContext.OPENID || ''

    console.log('=== spotManage 云函数被调用 ===')
    console.log('event', event)
    console.log('event.action', event.action)
    console.log('event.data', event.data)
    console.log('openid', openid)

    // 获取数据模型
    const models = app.models
    console.log('models', models)

    const { action, data } = event

    // 先检查数据库集合是否存在
    await checkDatabaseCollection(models)

    switch (action) {
      case 'add':
        return await addSpot(models, data, wxContext)
      case 'update':
        return await updateSpot(models, data, wxContext)
      case 'delete':
        return await deleteSpot(models, data, wxContext)
      case 'get':
        return await getSpot(models, data, wxContext)
      case 'list':
        return await getSpotList(models, data, wxContext)
      case 'test':
        return await testConnection(models, wxContext)
      default:
        return {
          success: false,
          message: `不支持的操作类型: ${action}`
        }
    }
  } catch (error) {
    console.error('=== 云函数执行错误 ===')
    console.error('错误信息:', error.message)
    console.error('错误堆栈:', error.stack)
    console.error('错误对象:', error)

    return {
      success: false,
      message: error.message || '服务器内部错误',
      errorCode: error.code || 'UNKNOWN_ERROR'
    }
  }
}

// 检查数据库集合是否存在
async function checkDatabaseCollection(models) {
  try {
    console.log('检查 tourism_spot 集合是否存在...')
    // 使用 models.tourism_spot.list() 来检查集合是否存在
    await models.tourism_spot.list({
      limit: 1
    })
    console.log('数据库集合检查通过')
  } catch (error) {
    console.error('数据库集合检查失败:', error)
    if (error.message && (error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {
      throw new Error('tourism_spot 集合不存在，请在云开发控制台创建此集合')
    }
    throw new Error(`数据库访问失败: ${error.message}`)
  }
}

// 测试连接
async function testConnection(models, wxContext) {
  try {
    console.log('=== 测试云函数连接 ===')

    // 测试数据库连接
    const testQuery = await models.tourism_spot.list({
      limit: 1
    })

    return {
      success: true,
      message: '云函数连接正常',
      data: {
        openid: wxContext.OPENID,
        timestamp: Date.now(),
        dbConnected: true,
        collectionExists: true,
        existingRecords: testQuery.data.records ? testQuery.data.records.length : 0
      }
    }
  } catch (error) {
    console.error('测试连接失败:', error)
    return {
      success: false,
      message: `连接测试失败: ${error.message}`,
      data: {
        openid: wxContext.OPENID,
        timestamp: Date.now(),
        dbConnected: false,
        error: error.message
      }
    }
  }
}

// 数据验证函数 - 适配微信云开发
function validateSpotData(spotData) {
  const errors = []

  // 基础必需字段验证
  if (!spotData.name || typeof spotData.name !== 'string' || spotData.name.trim() === '') {
    errors.push('景点名称不能为空')
  }

  if (!spotData.location || typeof spotData.location !== 'object') {
    errors.push('位置信息不能为空')
  } else if (!spotData.location.address || spotData.location.address.trim() === '') {
    errors.push('详细地址不能为空')
  }

  // 简化的经纬度验证
  if (spotData.location && spotData.location.geopoint) {
    const geopoint = spotData.location.geopoint
    if (!geopoint.coordinates || !Array.isArray(geopoint.coordinates) || geopoint.coordinates.length !== 2) {
      errors.push('经纬度坐标格式不正确')
    }
  }

  // 数值范围验证
  if (spotData.price !== undefined) {
    const price = Number(spotData.price)
    if (isNaN(price) || price < 0) {
      errors.push('门票价格必须是非负数')
    }
  }

  if (spotData.rating !== undefined) {
    const rating = Number(spotData.rating)
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push('评分必须是0-5之间的数字')
    }
  }

  return errors
}

// 设置默认值 - 微信云开发版本
function setDefaultValues(spotData) {
  const defaultData = { ...spotData }

  // 基础默认值
  if (!defaultData.description) defaultData.description = '景点描述'
  if (!defaultData.category_id) defaultData.category_id = '1'
  if (!defaultData.province) defaultData.province = '北京'
  if (!defaultData.phone) defaultData.phone = '4001234567'
  if (!defaultData.website) defaultData.website = 'https://example.com'

  // 数值默认值
  if (defaultData.price === undefined) defaultData.price = 0
  if (defaultData.rating === undefined) defaultData.rating = 0
  if (defaultData.opening_time === undefined) defaultData.opening_time = 0
  if (defaultData.closing_time === undefined) defaultData.closing_time = 72000000
  if (defaultData.best_season === undefined) defaultData.best_season = 0
  if (defaultData.status === undefined) defaultData.status = true

  // 确保经纬度有默认值
  if (defaultData.location && !defaultData.location.geopoint) {
    defaultData.location.geopoint = {
      type: 'Point',
      coordinates: [116.404, 39.915] // 北京天安门
    }
  }

  return defaultData
}

// 添加景点 - 使用 @cloudbase/node-sdk 数据模型
async function addSpot(models, spotData, wxContext) {
  try {
    console.log('=== spotManage 添加景点开始 ===')
    console.log('接收数据:', JSON.stringify(spotData, null, 2))
    console.log('用户OpenID:', wxContext.OPENID)

    // 1. 设置默认值
    const processedData = setDefaultValues(spotData)
    console.log('处理后数据:', JSON.stringify(processedData, null, 2))

    // 2. 数据验证
    const validationErrors = validateSpotData(processedData)
    if (validationErrors.length > 0) {
      console.error('数据验证失败:', validationErrors)
      return {
        success: false,
        message: `数据验证失败: ${validationErrors.join('; ')}`
      }
    }

    // 3. 检查景点名称是否已存在
    const existingSpotQuery = await models.tourism_spot.list({
      filter: {
        where: {
          name: {
            $eq: processedData.name.trim()
          }
        }
      },
      getCount: true
    })

    if (existingSpotQuery.data && existingSpotQuery.data.records && existingSpotQuery.data.records.length > 0) {
      console.log('景点名称已存在:', processedData.name)
      return {
        success: false,
        message: `景点名称"${processedData.name}"已存在，请使用其他名称`
      }
    }

    // 4. 准备插入数据 - 符合数据模型规范
    const currentTime = Date.now()
    const insertData = {
      // 基本信息
      name: processedData.name.trim(),
      description: processedData.description.trim(),

      // 位置信息
      location: {
        address: processedData.location.address.trim(),
        geopoint: processedData.location.geopoint
      },

      // 分类信息
      category_id: processedData.category_id,
      province: processedData.province,

      // 联系信息
      phone: processedData.phone,
      website: processedData.website,

      // 数值信息
      price: Number(processedData.price),
      rating: Number(processedData.rating),
      opening_time: Number(processedData.opening_time),
      closing_time: Number(processedData.closing_time),
      best_season: Number(processedData.best_season),

      // 状态
      status: Boolean(processedData.status),

      // 系统字段
      createBy: wxContext.OPENID,
      createdAt: currentTime,
      updatedAt: currentTime
    }

    console.log('即将插入数据:', JSON.stringify(insertData, null, 2))    // 5. 使用数据模型插入数据
    const result = await models.tourism_spot.create({
      data: insertData
    })

    console.log('数据插入成功:', result)    // 6. 立即查询刚创建的记录并返回完整数据
    try {
      console.log('立即查询刚创建的景点数据...')
      console.log('查询ID:', result.id)

      const queryResult = await models.tourism_spot.get({
        filter: {
          where: {
            _id: {
              $eq: result.id
            }
          }
        }
      })

      console.log('查询结果结构:', queryResult)
      console.log('查询到的完整景点数据:', queryResult.data)

      // 确保我们返回的是实际的数据库记录
      const completeDatabaseRecord = queryResult.data || queryResult
      const currentTimestamp = Date.now()

      console.log('准备返回的完整数据库记录:', completeDatabaseRecord)

      return {
        success: true,
        data: completeDatabaseRecord, // 返回数据库中的完整记录
        message: '景点添加成功',
        insertId: result.id, // 插入操作返回的ID
        timestamp: currentTimestamp, // 当前时间戳
        querySuccess: true // 标记即时查询成功
      }
    } catch (queryError) {
      console.error('查询刚创建的景点数据失败:', queryError)
      const currentTimestamp = Date.now()

      // 如果查询失败，仍然返回成功状态，但使用原始插入数据
      return {
        success: true,
        data: {
          _id: result.id,
          ...insertData,
          // 添加系统生成的字段模拟
          _openid: wxContext.OPENID,
          createdAt: insertData.createdAt,
          updatedAt: insertData.updatedAt
        },
        message: '景点添加成功（即时查询失败，返回构造数据）',
        insertId: result.id,
        timestamp: currentTimestamp,
        querySuccess: false, // 标记即时查询失败
        queryError: queryError.message
      }
    }

  } catch (error) {
    console.error('=== 添加景点错误 ===')
    console.error('错误详情:', error)

    // 针对常见的云开发错误提供友好提示
    let errorMessage = '添加景点失败'
    if (error.message && error.message.includes('permission denied')) {
      errorMessage = '没有数据库操作权限，请检查云开发权限设置'
    } else if (error.message && (error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {
      errorMessage = 'tourism_spot 集合不存在，请在云开发控制台创建此集合'
    } else if (error.message) {
      errorMessage = `添加景点失败：${error.message}`
    }

    return {
      success: false,
      message: errorMessage
    }
  }
}

// 更新景点 - 使用 @cloudbase/node-sdk 数据模型
async function updateSpot(models, updateData, wxContext) {
  const { _id, ...data } = updateData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  try {
    // 添加更新时间
    data.updatedAt = Date.now()
    data.updateBy = wxContext.OPENID

    const result = await models.tourism_spot.update({
      data: data,
      filter: {
        where: {
          _id: {
            $eq: _id
          }
        }
      }
    })

    return {
      success: true,
      data: result,
      message: '景点更新成功'
    }
  } catch (error) {
    console.error('更新景点失败:', error)
    return {
      success: false,
      message: `更新景点失败: ${error.message || '未知错误'}`
    }
  }
}

// 删除景点 - 使用 @cloudbase/node-sdk 数据模型
async function deleteSpot(models, deleteData, wxContext) {
  const { _id } = deleteData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  try {
    const result = await models.tourism_spot.delete({
      filter: {
        where: {
          _id: {
            $eq: _id
          }
        }
      }
    })

    return {
      success: true,
      data: result,
      message: '景点删除成功'
    }
  } catch (error) {
    console.error('删除景点失败:', error)
    return {
      success: false,
      message: `删除景点失败: ${error.message || '未知错误'}`
    }
  }
}

// 获取单个景点 - 使用 @cloudbase/node-sdk 数据模型
async function getSpot(models, getData, wxContext) {
  const { _id } = getData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  try {
    const result = await models.tourism_spot.get({
      filter: {
        where: {
          _id: {
            $eq: _id
          }
        }
      }
    })

    return {
      success: true,
      data: result.data,
      message: '获取景点信息成功'
    }
  } catch (error) {
    console.error('获取景点失败:', error)
    return {
      success: false,
      message: `获取景点失败: ${error.message || '未知错误'}`
    }
  }
}

// 获取景点列表 - 使用 @cloudbase/node-sdk 数据模型
async function getSpotList(models, listData, wxContext) {
  const { page = 1, limit = 20, status } = listData

  try {
    let filter = {}

    // 如果指定了状态筛选
    if (typeof status !== 'undefined') {
      filter.where = {
        status: {
          $eq: status
        }
      }
    }    // 分页查询
    const result = await models.tourism_spot.list({
      filter: filter,
      offset: (page - 1) * limit,
      limit: limit,
      order: {
        createdAt: 'desc'
      },
      getCount: true
    })

    return {
      success: true,
      data: result.data.records,
      total: result.data.total,
      page: page,
      limit: limit,
      message: '获取景点列表成功'
    }
  } catch (error) {
    console.error('获取景点列表失败:', error)
    return {
      success: false,
      message: `获取景点列表失败: ${error.message || '未知错误'}`
    }
  }
}