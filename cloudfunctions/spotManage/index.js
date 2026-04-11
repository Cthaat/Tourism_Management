// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

const FALLBACK_ENV_ID = 'cloud1-7gwgvcaxe59bbe99'
const UUID_ENV_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidEnv(value) {
  if (!value || typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized !== '' &&
    normalized !== 'undefined' &&
    normalized !== 'null' &&
    normalized !== 'none' &&
    normalized !== 'local' &&
    normalized !== 'dynamic_current_env' &&
    !UUID_ENV_PATTERN.test(normalized)
}

function resolveEnvId(wxContext) {
  const candidates = [
    process.env.TCB_ENV,
    process.env.WX_CLOUD_ENV,
    FALLBACK_ENV_ID,
    wxContext && wxContext.ENV,
    cloud.DYNAMIC_CURRENT_ENV
  ]

  for (const env of candidates) {
    if (isValidEnv(env)) {
      return env
    }
  }

  return FALLBACK_ENV_ID
}

function isLocalDebugEnv(wxContext) {
  const envValues = [
    wxContext && wxContext.ENV,
    process.env.TCB_ENV,
    process.env.WX_CLOUD_ENV,
    cloud.DYNAMIC_CURRENT_ENV
  ]

  return envValues.some((value) => String(value || '').trim().toLowerCase() === 'local')
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext() || {}
    const openid = wxContext.OPENID || ''
    const resolvedEnv = resolveEnvId(wxContext)
    const inLocalDebug = isLocalDebugEnv(wxContext)

    if (inLocalDebug) {
      cloud.init()
    } else {
      cloud.init({ env: resolvedEnv })
    }

    const app = cloudbase.init({ env: resolvedEnv })
    const db = app.database()

    console.log('=== spotManage 云函数被调用 ===')
    console.log('event', event)
    console.log('event.action', event.action)
    console.log('event.data', event.data)
    console.log('openid', openid)
    console.log('resolvedEnv', resolvedEnv)
    console.log('inLocalDebug', inLocalDebug)

    // 获取数据模型
    const models = app.models
    console.log('models', models)

    const { action, data } = event

    // add 操作前也做一次检查（安全起见），避免 models 结构变化导致 hangs
    await checkDatabaseCollection(models, db)

    switch (action) {
      case 'add':
        return await addSpot(models, db, data, wxContext)
      case 'update':
        return await updateSpot(models, db, data, wxContext)
      case 'delete':
        return await deleteSpot(models, db, data, wxContext)
      case 'get':
        return await getSpot(models, db, data, wxContext)
      case 'list':
        return await getSpotList(models, db, data, wxContext)
      case 'search':
        return await searchSpot(models, db, data, wxContext)
      case 'test':
        return await testConnection(models, db, wxContext)
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

// 检查数据库集合是否存在，如果不存在则自动创建
function getSpotModel(models, db) {
  if (models && models['tourism-spot']) {
    return models['tourism-spot']
  }
  if (db && typeof db.collection === 'function') {
    // 兼容 db.collection() 方式 - 创建一个包装对象提供与数据模型兼容的接口
    try {
      const collectionNames = ['tourism-spot']
      for (const name of collectionNames) {
        const collection = db.collection(name)
        if (collection) {
          // 创建包装对象，提供与数据模型兼容的方法
          return {
            // list 方法 - 兼容数据模型的 list 接口
            async list(options = {}) {
              const { pageSize = 20, pageNumber = 1, getCount = false } = options
              const query = collection.limit(pageSize).skip((pageNumber - 1) * pageSize)
              const result = await query.get()
              const data = result.data || []

              let response = {
                data: data,
                limit: pageSize,
                offset: (pageNumber - 1) * pageSize,
                total: data.length
              }

              if (getCount) {
                const countResult = await collection.count()
                response.total = countResult.total
              }

              return response
            },

            // create 方法 - 兼容数据模型的 create 接口
            async create(options) {
              const { data } = options
              const result = await collection.add({ data })
              return { id: result._id }
            },

            // update 方法 - 兼容数据模型的 update 接口
            async update(options) {
              const { filter, data } = options
              let query = collection
              if (filter && filter.where) {
                // 简单的 where 条件处理
                Object.keys(filter.where).forEach(key => {
                  const condition = filter.where[key]
                  if (condition && typeof condition === 'object' && condition.$eq !== undefined) {
                    query = query.where(key, '==', condition.$eq)
                  }
                })
              }
              const result = await query.update(data)
              return { updated: result.stats?.updated || 0 }
            },

            // delete 方法 - 兼容数据模型的 delete 接口
            async delete(options) {
              const { filter } = options
              let query = collection
              if (filter && filter.where) {
                // 简单的 where 条件处理
                Object.keys(filter.where).forEach(key => {
                  const condition = filter.where[key]
                  if (condition && typeof condition === 'object' && condition.$eq !== undefined) {
                    query = query.where(key, '==', condition.$eq)
                  }
                })
              }
              const result = await query.remove()
              return { deleted: result.stats?.removed || 0 }
            },

            // get 方法 - 兼容数据模型的 get 接口
            async get(options) {
              const { filter } = options
              let query = collection
              if (filter && filter.where) {
                Object.keys(filter.where).forEach(key => {
                  const condition = filter.where[key]
                  if (condition && typeof condition === 'object' && condition.$eq !== undefined) {
                    query = query.where(key, '==', condition.$eq)
                  }
                })
              }
              const result = await query.get()
              return { data: result.data && result.data[0] ? result.data[0] : null }
            }
          }
        }
      }
    } catch (err) {
      console.warn('db.collection 访问失败:', err.message)
    }
  }
  throw new Error('未找到可用的景点集合模型: tourism-spot')
}

async function checkDatabaseCollection(models, db) {
  try {
    console.log('检查 tourism-spot 集合是否存在...')
    const spotModel = getSpotModel(models, db)
    await spotModel.list({
      pageSize: 1,
      getCount: true
    })
    console.log('✅ 数据库集合检查通过')
  } catch (error) {
    console.error('数据库集合检查失败:', error)
    if (error.message && (error.message.includes('RESOURCE_NOT_FOUND') ||
      error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {

      console.warn('⚠️ tourism-spot 集合不存在，尝试自动创建...')

      // 尝试通过插入一条临时数据来创建集合
      try {
        const tempData = {
          name: '__temp_collection_init__',
          description: '临时数据用于初始化集合',
          location: {
            address: '初始化地址',
            geopoint: {
              type: 'Point',
              coordinates: [0, 0]
            }
          },
          province: '初始化省份',
          address: '初始化地址',
          phone: '00000000000',
          website: '',
          price: '0',
          rating: '0',
          opening_time: 0,
          closing_time: 0,
          best_season: 0,
          status: false,
          createBy: 'system',
          updateBy: 'system',
          _openid: 'system',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        const spotModel = getSpotModel(models, db)
        const createResult = await spotModel.create({
          data: tempData
        })

        console.log('✅ 集合创建成功，临时数据ID:', createResult.id)

        // 删除临时数据
        await spotModel.delete({
          filter: {
            where: {
              _id: {
                $eq: createResult.id
              }
            }
          }
        })

        console.log('✅ 临时数据已清理，集合初始化完成')
      } catch (createError) {
        console.error('❌ 自动创建集合失败:', createError)
        throw new Error('tourism-spot 集合不存在且无法自动创建，请在云开发控制台手动创建此集合')
      }
    } else {
      throw new Error(`数据库访问失败: ${error.message}`)
    }
  }
}

// 测试连接
async function testConnection(models, wxContext) {
  try {
    console.log('=== 测试云函数连接 ===')

    // 测试数据库连接
    const spotModel = getSpotModel(models, db)
    const testQuery = await spotModel.list({
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
async function addSpot(models, db, spotData, wxContext) {
  try {
    console.log('=== spotManage 添加景点开始 ===')
    console.log('接收数据:', JSON.stringify(spotData, null, 2))
    console.log('用户OpenID:', wxContext.OPENID)

    // 新增：自动检查并创建 tourism-spot 集合（如果不存在）
    const spotModel = getSpotModel(models, db)
    try {
      console.log('检查旅游景点集合是否存在...')
      await spotModel.list({
        pageSize: 1,
        getCount: true
      })
      console.log('✅ 景点集合已存在')
    } catch (collectionError) {
      if (collectionError.message && (collectionError.message.includes('RESOURCE_NOT_FOUND') || collectionError.message.includes('collection not exists') || collectionError.message.includes('集合不存在'))) {
        console.warn('⚠️ 景点集合不存在，尝试自动创建...')

        // 尝试通过插入一条临时数据来创建集合
        try {
          const tempData = {
            name: '__temp_collection_init__',
            description: '临时数据用于初始化集合',
            location: {
              address: '初始化地址',
              geopoint: {
                type: 'Point',
                coordinates: [0, 0]
              }
            },
            category_id: 1,
            province: '初始化省份',
            phone: '00000000000',
            website: '',
            price: 0,
            rating: 0,
            opening_time: 0,
            closing_time: 0,
            best_season: 0,
            status: false,
            createBy: wxContext.OPENID || 'system',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }

          const createResult = await spotModel.create({
            data: tempData
          })

          console.log('✅ 集合创建成功，临时数据ID:', createResult.id)

          // 删除临时数据
          await spotModel.delete({
            filter: {
              where: {
                _id: {
                  $eq: createResult.id
                }
              }
            }
          })

          console.log('✅ 临时数据已清理，集合初始化完成')
        } catch (createError) {
          console.error('❌ 自动创建集合失败:', createError)
          return {
            success: false,
            message: '数据库集合不存在且无法自动创建，请在云开发控制台手动创建 tourism-spot 集合'
          }
        }
      } else {
        console.error('❌ 检查集合存在性时出错:', collectionError)
        return {
          success: false,
          message: '数据库连接异常，请稍后重试'
        }
      }
    }

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
    const existingSpotQuery = await spotModel.list({
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

      // 位置信息 - address在两个位置都需要
      address: processedData.location.address.trim(),  // 顶层address字段（数据模型要求必填）
      location: {
        address: processedData.location.address.trim(),
        geopoint: processedData.location.geopoint
      },

      province: processedData.province,

      // 联系信息
      phone: processedData.phone,
      website: processedData.website,

      // 数值信息 - price和rating必须是字符串格式
      price: String(Number(processedData.price)),
      rating: String(Number(processedData.rating)),
      opening_time: Number(processedData.opening_time),
      closing_time: Number(processedData.closing_time),
      best_season: Number(processedData.best_season),

      // 状态
      status: Boolean(processedData.status),

      // 系统字段
      createBy: processedData.createBy || wxContext.OPENID,
      updateBy: processedData.updateBy || wxContext.OPENID,
      _openid: wxContext.OPENID,
      createdAt: currentTime,
      updatedAt: currentTime
    }

    console.log('即将插入数据:', JSON.stringify(insertData, null, 2))    // 5. 使用数据模型插入数据
    const result = await spotModel.create({
      data: insertData
    })

    console.log('数据插入成功:', result)
    console.log('result的所有字段:', Object.keys(result))
    console.log('result.id:', result.id)
    console.log('result.data:', result.data)
    console.log('result.data?.id:', result.data?.id)
    
    // 6. 立即查询刚创建的记录并返回完整数据
    try {
      // 从返回值中提取 ID - 可能是 result.id 或 result.data.id
      const createdId = result.id || result.data?.id || result.data?._id || result._id
      console.log('立即查询刚创建的景点数据...')
      console.log('提取的创建ID:', createdId)
      
      if (!createdId) {
        console.warn('⚠️ 创建成功但无法提取ID，使用插入数据直接返回')
        const currentTimestamp = Date.now()
        return {
          success: true,
          data: insertData,
          message: '景点添加成功（无法查询刚创建的记录）',
          insertId: undefined,
          timestamp: currentTimestamp,
          querySuccess: false
        }
      }

      const queryResult = await spotModel.get({
        filter: {
          where: {
            _id: {
              $eq: createdId
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
        insertId: createdId, // 插入操作返回的ID
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
          _id: createdId,
          ...insertData,
          // 添加系统生成的字段模拟
          _openid: wxContext.OPENID,
          createdAt: insertData.createdAt,
          updatedAt: insertData.updatedAt
        },
        message: '景点添加成功（即时查询失败，返回构造数据）',
        insertId: createdId,
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
      errorMessage = 'tourism-spot 集合不存在，请在云开发控制台创建此集合'
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
async function updateSpot(models, db, updateData, wxContext) {
  const { _id, ...data } = updateData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  try {
    // 添加更新时间
    if (typeof data.price !== 'undefined') {
      const normalizedPrice = Math.max(0, Math.min(99999, Number(data.price) || 0))
      data.price = String(normalizedPrice)
    }

    if (typeof data.rating !== 'undefined') {
      const normalizedRating = Math.max(0, Math.min(5, Number(data.rating) || 0))
      data.rating = String(normalizedRating)
    }

    data.updatedAt = Date.now()
    data.updateBy = data.updateBy || wxContext.OPENID
    data._openid = data._openid || wxContext.OPENID

    const spotModel = getSpotModel(models, db)
    const result = await spotModel.update({
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
async function deleteSpot(models, db, deleteData, wxContext) {
  const { _id } = deleteData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  try {
    const spotModel = getSpotModel(models, db)
    const result = await spotModel.delete({
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
async function getSpot(models, db, getData, wxContext) {
  const { _id } = getData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  try {
    const spotModel = getSpotModel(models, db)
    const result = await spotModel.get({
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
async function getSpotList(models, db, listData, wxContext) {
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
    const spotModel = getSpotModel(models, db)
    const result = await spotModel.list({
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

// 搜索景点 - 使用 @cloudbase/node-sdk 数据模型（兼容版本）
async function searchSpot(models, db, searchData, wxContext) {
  try {
    console.log('=== 景点搜索开始 ===')
    console.log('搜索参数:', JSON.stringify(searchData, null, 2))

    const {
      keyword = '',           // 关键词搜索（名称、地址）
      name = '',             // 景点名称
      address = '',          // 地址
      province = '',         // 省份
      minPrice = null,       // 最低价格
      maxPrice = null,       // 最高价格
      minRating = null,      // 最低评分
      maxRating = null,      // 最高评分
      status = null,         // 状态筛选
      page = 1,              // 页码
      limit = 20,            // 每页数量
      sortBy = 'createdAt',  // 排序字段
      sortOrder = 'desc'     // 排序顺序 (asc/desc)
    } = searchData

    // 因为 @cloudbase/node-sdk 对复杂查询支持有限，我们简化搜索逻辑
    let filter = {}
    let searchConditions = []

    // 关键词搜索的处理策略：优先按名称搜索，如果没有结果再搜索地址
    if (keyword && keyword.trim()) {
      const keywordTrim = keyword.trim()
      console.log('关键词搜索:', keywordTrim)

      // 使用简单的包含查询（如果支持的话）或者精确匹配
      // 先尝试名称包含搜索
      try {
        const spotModel = getSpotModel(models, db)
        const nameResult = await spotModel.list({
          filter: {
            where: {
              name: {
                $search: keywordTrim  // 尝试使用搜索操作符
              }
            }
          },
          offset: (page - 1) * limit,
          limit: limit,
          order: { [sortBy]: sortOrder },
          getCount: true
        })

        // 如果名称搜索有结果，直接返回
        if (nameResult.data && nameResult.data.records && nameResult.data.records.length > 0) {
          console.log('关键词名称搜索成功，返回结果')
          return {
            success: true,
            data: nameResult.data.records || [],
            total: nameResult.data.total || 0,
            page: Number(page),
            limit: Number(limit),
            searchType: 'keyword_name',
            searchParams: searchData,
            message: '景点搜索成功（名称匹配）'
          }
        }
      } catch (searchError) {
        console.log('$search 操作符不支持，回退到其他方案')
      }
    }

    // 构建基础查询条件（避免复杂的 $or 和 $regex）
    let whereConditions = {}

    // 精确匹配搜索
    if (name && name.trim()) {
      whereConditions.name = { $eq: name.trim() }
      console.log('添加名称精确匹配条件:', name.trim())
    }

    // 省份搜索
    if (province && province.trim()) {
      whereConditions.province = { $eq: province.trim() }
      console.log('添加省份搜索条件:', province.trim())
    }

    // 价格范围搜索
    if (minPrice !== null || maxPrice !== null) {
      const priceCondition = {}
      if (minPrice !== null && !isNaN(Number(minPrice))) {
        priceCondition.$gte = Number(minPrice)
      }
      if (maxPrice !== null && !isNaN(Number(maxPrice))) {
        priceCondition.$lte = Number(maxPrice)
      }
      if (Object.keys(priceCondition).length > 0) {
        whereConditions.price = priceCondition
        console.log('添加价格范围搜索条件:', priceCondition)
      }
    }

    // 评分范围搜索
    if (minRating !== null || maxRating !== null) {
      const ratingCondition = {}
      if (minRating !== null && !isNaN(Number(minRating))) {
        ratingCondition.$gte = Number(minRating)
      }
      if (maxRating !== null && !isNaN(Number(maxRating))) {
        ratingCondition.$lte = Number(maxRating)
      }
      if (Object.keys(ratingCondition).length > 0) {
        whereConditions.rating = ratingCondition
        console.log('添加评分范围搜索条件:', ratingCondition)
      }
    }

    // 状态搜索
    if (status !== null && typeof status === 'boolean') {
      whereConditions.status = { $eq: status }
      console.log('添加状态搜索条件:', status)
    }

    // 构建最终的查询过滤器
    if (Object.keys(whereConditions).length > 0) {
      filter.where = whereConditions
    }

    // 构建排序条件
    let orderCondition = {}
    const validSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'rating']
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'
    orderCondition[validSortBy] = validSortOrder

    console.log('最终查询过滤器:', JSON.stringify(filter, null, 2))
    console.log('排序条件:', orderCondition)

    // 执行分页查询
    const spotModel = getSpotModel(models, db)
    const result = await spotModel.list({
      filter: filter,
      offset: (page - 1) * limit,
      limit: limit,
      order: orderCondition,
      getCount: true
    })

    console.log('搜索结果:', {
      recordCount: result.data.records ? result.data.records.length : 0,
      total: result.data.total
    })

    // 如果有关键词但没有其他条件，且结果为空，尝试获取所有数据进行客户端过滤
    if (keyword && keyword.trim() && Object.keys(whereConditions).length === 0 &&
      (!result.data.records || result.data.records.length === 0)) {
      console.log('尝试获取所有数据进行客户端关键词过滤')

      try {
        const allDataResult = await spotModel.list({
          offset: 0,
          limit: 100, // 限制数量避免性能问题
          order: orderCondition,
          getCount: true
        })

        if (allDataResult.data && allDataResult.data.records) {
          const keywordLower = keyword.trim().toLowerCase()
          const filteredRecords = allDataResult.data.records.filter(record => {
            const nameMatch = record.name && record.name.toLowerCase().includes(keywordLower)
            const addressMatch = record.location && record.location.address &&
              record.location.address.toLowerCase().includes(keywordLower)
            return nameMatch || addressMatch
          })

          // 手动分页
          const startIndex = (page - 1) * limit
          const endIndex = startIndex + limit
          const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

          console.log('客户端过滤结果:', {
            totalFiltered: filteredRecords.length,
            currentPageCount: paginatedRecords.length
          })

          return {
            success: true,
            data: paginatedRecords,
            total: filteredRecords.length,
            page: Number(page),
            limit: Number(limit),
            searchType: 'client_filter',
            searchParams: searchData,
            message: '景点搜索成功（客户端过滤）'
          }
        }
      } catch (clientFilterError) {
        console.error('客户端过滤失败:', clientFilterError)
      }
    }

    return {
      success: true,
      data: result.data.records || [],
      total: result.data.total || 0,
      page: Number(page),
      limit: Number(limit),
      searchType: 'server_filter',
      searchParams: {
        keyword,
        name,
        address,
        province,
        minPrice,
        maxPrice,
        minRating,
        maxRating,
        status,
        sortBy: validSortBy,
        sortOrder: validSortOrder
      },
      message: '景点搜索成功'
    }

  } catch (error) {
    console.error('=== 景点搜索错误 ===')
    console.error('错误详情:', error)

    let errorMessage = '景点搜索失败'
    if (error.message && error.message.includes('permission denied')) {
      errorMessage = '没有数据库查询权限，请检查云开发权限设置'
    } else if (error.message && (error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {
      errorMessage = 'tourism-spot 集合不存在，请在云开发控制台创建此集合'
    } else if (error.message) {
      errorMessage = `景点搜索失败：${error.message}`
    }

    return {
      success: false,
      message: errorMessage,
      searchParams: searchData
    }
  }
}