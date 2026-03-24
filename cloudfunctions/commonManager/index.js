// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

const FALLBACK_ENV_ID = 'cloud1-7gwgvcaxe59bbe99'
const UUID_ENV_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// 过滤掉本地调试里常见的无效环境值
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

function isInvalidEnvError(error) {
  const message = (error && error.message) ? String(error.message) : ''
  const code = (error && error.code) ? String(error.code) : ''
  return message.includes('Env invalid') || message.includes('INVALID_ENV') || code.includes('INVALID_ENV')
}

function isCollectionNotFoundError(error) {
  const message = (error && error.message) ? String(error.message) : ''
  const code = (error && error.code) ? String(error.code) : ''
  return message.includes('RESOURCE_NOT_FOUND') ||
    message.includes('Requested resource not found') ||
    message.includes('数据源=spot_common不存在') ||
    message.includes('collection not exists') ||
    message.includes('集合不存在') ||
    code.includes('RESOURCE_NOT_FOUND')
}

function normalizeWhereCondition(where = {}) {
  const normalized = {}
  const source = where.$and && Array.isArray(where.$and)
    ? Object.assign({}, ...where.$and)
    : where

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && '$eq' in value) {
      normalized[key] = value.$eq
    } else {
      normalized[key] = value
    }
  }

  return normalized
}

function createNativeModels() {
  const db = cloud.database()

  return {
    spot_common: {
      async list(params = {}) {
        const {
          filter,
          offset = 0,
          limit = 20,
          order,
          getCount = false
        } = params

        let query = db.collection('spot_common')
        if (filter && filter.where) {
          query = query.where(normalizeWhereCondition(filter.where))
        }

        if (order && typeof order === 'object') {
          const [orderField, orderDirection] = Object.entries(order)[0] || []
          if (orderField && orderDirection) {
            query = query.orderBy(orderField, String(orderDirection).toLowerCase() === 'asc' ? 'asc' : 'desc')
          }
        }

        try {
          let total = 0
          if (getCount) {
            const countResult = await query.count()
            total = countResult.total || 0
          }

          const dataResult = await query.skip(offset).limit(limit).get()
          return {
            data: {
              records: dataResult.data || [],
              total
            }
          }
        } catch (error) {
          if (isCollectionNotFoundError(error)) {
            return {
              data: {
                records: [],
                total: 0
              }
            }
          }
          throw error
        }
      },

      async create(params = {}) {
        const addResult = await db.collection('spot_common').add({
          data: params.data || {}
        })
        return {
          id: addResult._id
        }
      },

      async get(params = {}) {
        try {
          let query = db.collection('spot_common')
          if (params.filter && params.filter.where) {
            query = query.where(normalizeWhereCondition(params.filter.where))
          }
          const result = await query.limit(1).get()
          return {
            data: (result.data && result.data[0]) || null
          }
        } catch (error) {
          if (isCollectionNotFoundError(error)) {
            return { data: null }
          }
          throw error
        }
      },

      async update(params = {}) {
        let query = db.collection('spot_common')
        if (params.filter && params.filter.where) {
          query = query.where(normalizeWhereCondition(params.filter.where))
        }
        const result = await query.update({
          data: params.data || {}
        })
        return {
          matched: result.stats ? result.stats.updated : 0,
          modified: result.stats ? result.stats.updated : 0
        }
      },

      async delete(params = {}) {
        let query = db.collection('spot_common')
        if (params.filter && params.filter.where) {
          query = query.where(normalizeWhereCondition(params.filter.where))
        }
        const result = await query.remove()
        return {
          deleted: result.stats ? result.stats.removed : 0
        }
      }
    }
  }
}

async function getModels(app) {
  const modelClient = app.models
  try {
    // 启动时先探测一次，若本地调试触发 INVALID_ENV 则切到原生数据库适配器
    await modelClient.spot_common.list({ limit: 1 })
    return modelClient
  } catch (error) {
    if (isInvalidEnvError(error) || isCollectionNotFoundError(error)) {
      console.warn('models SDK 不可用或集合不存在，切换到 cloud.database 适配器')
      return createNativeModels()
    }
    throw error
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext() || {}
    const openid = wxContext.OPENID || ''
    const resolvedEnv = resolveEnvId(wxContext)
    const inLocalDebug = isLocalDebugEnv(wxContext)

    if (inLocalDebug) {
      // 本地调试模式下不显式指定 env，交给开发者工具绑定环境处理
      cloud.init()
    } else {
      cloud.init({ env: resolvedEnv })
    }

    // 本地调试下直接使用原生数据库适配器，避免 models SDK 的环境校验
    const models = inLocalDebug
      ? createNativeModels()
      : await getModels(cloudbase.init({ env: resolvedEnv }))

    console.log('=== commonManager 云函数被调用 ===')
    console.log('event', event)
    console.log('event.action', event.action)
    console.log('event.data', event.data)
    console.log('openid', openid)
    console.log('resolvedEnv', resolvedEnv)
    console.log('inLocalDebug', inLocalDebug)

    console.log('models', models)

    const { action, data } = event

    // add/list/listBySpot/test 不做前置集合检查：
    // - add 允许首次写入触发集合初始化
    // - list/listBySpot/test 在集合不存在时会返回可控结果
    if (!['add', 'list', 'listBySpot', 'test'].includes(action)) {
      await checkDatabaseCollection(models)
    }

    switch (action) {
      case 'add':
        return await addComment(models, data, wxContext)
      case 'update':
        return await updateComment(models, data, wxContext)
      case 'delete':
        return await deleteComment(models, data, wxContext)
      case 'get':
        return await getComment(models, data, wxContext)
      case 'list':
        return await getCommentList(models, data, wxContext)
      case 'listBySpot':
        return await getCommentsBySpot(models, data, wxContext)
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
    console.log('检查 spot_common 集合是否存在...')
    // 使用 models.spot_common.list() 来检查集合是否存在
    await models.spot_common.list({
      limit: 1
    })
    console.log('数据库集合检查通过')
  } catch (error) {
    console.error('数据库集合检查失败:', error)
    if (error.message && (error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {
      throw new Error('spot_common 集合不存在，请在云开发控制台创建此集合')
    }
    throw new Error(`数据库访问失败: ${error.message}`)
  }
}

// 测试连接
async function testConnection(models, wxContext) {
  try {
    console.log('=== 测试云函数连接 ===')

    // 测试数据库连接
    const testQuery = await models.spot_common.list({
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
    if (isCollectionNotFoundError(error)) {
      return {
        success: true,
        message: '连接正常，spot_common 集合尚未创建',
        data: {
          openid: wxContext.OPENID,
          timestamp: Date.now(),
          dbConnected: true,
          collectionExists: false,
          existingRecords: 0
        }
      }
    }

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

// 数据验证函数 - 适配评论数据结构
function validateCommentData(commentData) {
  const errors = []

  // 基础必需字段验证
  if (!commentData.common || typeof commentData.common !== 'string' || commentData.common.trim() === '') {
    errors.push('评论内容不能为空')
  }

  if (!commentData.spot_id || typeof commentData.spot_id !== 'number') {
    errors.push('景点ID不能为空且必须为数字')
  }

  if (!commentData.person || typeof commentData.person !== 'string' || commentData.person.trim() === '') {
    errors.push('评论者OPEN_ID不能为空')
  }

  // 评论内容长度验证
  if (commentData.common && commentData.common.length > 500) {
    errors.push('评论内容不能超过500个字符')
  }

  return errors
}

// 设置默认值 - 评论数据版本
function setDefaultValues(commentData) {
  const defaultData = { ...commentData }

  // 确保必填字段有默认值
  if (!defaultData.common) defaultData.common = ''
  if (!defaultData.spot_id) defaultData.spot_id = 0
  if (!defaultData.person) defaultData.person = ''

  return defaultData
}

// 添加评论 - 使用 @cloudbase/node-sdk 数据模型
async function addComment(models, commentData, wxContext) {
  try {
    console.log('=== commonManager 添加评论开始 ===')
    console.log('接收数据:', JSON.stringify(commentData, null, 2))
    console.log('用户OpenID:', wxContext.OPENID)

    // 1. 设置默认值
    const processedData = setDefaultValues(commentData)
    console.log('处理后数据:', JSON.stringify(processedData, null, 2))

    // 2. 数据验证
    const validationErrors = validateCommentData(processedData)
    if (validationErrors.length > 0) {
      console.error('数据验证失败:', validationErrors)
      return {
        success: false,
        message: `数据验证失败: ${validationErrors.join('; ')}`
      }
    }

    // 3. 准备插入数据 - 符合数据模型规范
    const currentTime = Date.now()
    const insertData = {
      // 评论基本信息
      common: processedData.common.trim(),
      spot_id: Number(processedData.spot_id),
      person: processedData.person.trim(),

      // 系统字段
      createBy: wxContext.OPENID,
      createdAt: currentTime,
      updatedAt: currentTime
    }

    console.log('即将插入数据:', JSON.stringify(insertData, null, 2))

    // 4. 使用数据模型插入数据
    const result = await models.spot_common.create({
      data: insertData
    })

    console.log('数据插入成功:', result)

    // 5. 立即查询刚创建的记录并返回完整数据
    try {
      console.log('立即查询刚创建的评论数据...')
      console.log('查询ID:', result.id)

      const queryResult = await models.spot_common.get({
        filter: {
          where: {
            _id: {
              $eq: result.id
            }
          }
        }
      })

      console.log('查询结果结构:', queryResult)
      console.log('查询到的完整评论数据:', queryResult.data)

      // 确保我们返回的是实际的数据库记录
      const completeDatabaseRecord = queryResult.data || queryResult
      const currentTimestamp = Date.now()

      console.log('准备返回的完整数据库记录:', completeDatabaseRecord)

      return {
        success: true,
        data: completeDatabaseRecord, // 返回数据库中的完整记录
        message: '评论添加成功',
        insertId: result.id, // 插入操作返回的ID
        timestamp: currentTimestamp, // 当前时间戳
        querySuccess: true // 标记即时查询成功
      }
    } catch (queryError) {
      console.error('查询刚创建的评论数据失败:', queryError)
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
        message: '评论添加成功（即时查询失败，返回构造数据）',
        insertId: result.id,
        timestamp: currentTimestamp,
        querySuccess: false, // 标记即时查询失败
        queryError: queryError.message
      }
    }

  } catch (error) {
    console.error('=== 添加评论错误 ===')
    console.error('错误详情:', error)

    // 针对常见的云开发错误提供友好提示
    let errorMessage = '添加评论失败'
    if (error.message && error.message.includes('permission denied')) {
      errorMessage = '没有数据库操作权限，请检查云开发权限设置'
    } else if (error.message && (error.message.includes('collection not exists') ||
      error.message.includes('集合不存在'))) {
      errorMessage = 'spot_common 集合不存在，请在云开发控制台创建此集合'
    } else if (error.message) {
      errorMessage = `添加评论失败：${error.message}`
    }

    return {
      success: false,
      message: errorMessage
    }
  }
}

// 更新评论 - 使用 @cloudbase/node-sdk 数据模型
async function updateComment(models, updateData, wxContext) {
  const { _id, ...data } = updateData

  if (!_id) {
    return {
      success: false,
      message: '评论ID不能为空'
    }
  }

  try {
    // 数据验证
    const validationErrors = validateCommentData(data)
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `数据验证失败: ${validationErrors.join('; ')}`
      }
    }

    // 添加更新时间
    data.updatedAt = Date.now()
    data.updateBy = wxContext.OPENID

    const result = await models.spot_common.update({
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
      message: '评论更新成功'
    }
  } catch (error) {
    console.error('更新评论失败:', error)
    return {
      success: false,
      message: `更新评论失败: ${error.message || '未知错误'}`
    }
  }
}

// 删除评论 - 使用 @cloudbase/node-sdk 数据模型
async function deleteComment(models, deleteData, wxContext) {
  const { _id } = deleteData

  if (!_id) {
    return {
      success: false,
      message: '评论ID不能为空'
    }
  }

  try {
    const result = await models.spot_common.delete({
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
      message: '评论删除成功'
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    return {
      success: false,
      message: `删除评论失败: ${error.message || '未知错误'}`
    }
  }
}

// 获取单个评论 - 使用 @cloudbase/node-sdk 数据模型
async function getComment(models, getData, wxContext) {
  const { _id } = getData

  if (!_id) {
    return {
      success: false,
      message: '评论ID不能为空'
    }
  }

  try {
    const result = await models.spot_common.get({
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
      message: '获取评论信息成功'
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    return {
      success: false,
      message: `获取评论失败: ${error.message || '未知错误'}`
    }
  }
}

// 获取评论列表 - 使用 @cloudbase/node-sdk 数据模型
async function getCommentList(models, listData, wxContext) {
  const { page = 1, limit = 20 } = listData

  try {
    // 分页查询
    const result = await models.spot_common.list({
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
      message: '获取评论列表成功'
    }
  } catch (error) {
    if (isCollectionNotFoundError(error)) {
      return {
        success: true,
        data: [],
        total: 0,
        page: page,
        limit: limit,
        message: 'spot_common 集合不存在，返回空列表'
      }
    }

    console.error('获取评论列表失败:', error)
    return {
      success: false,
      message: `获取评论列表失败: ${error.message || '未知错误'}`
    }
  }
}

// 根据景点ID获取评论列表 - 使用 @cloudbase/node-sdk 数据模型
async function getCommentsBySpot(models, listData, wxContext) {
  const { spot_id, page = 1, limit = 20 } = listData

  if (!spot_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  try {
    const filter = {
      where: {
        spot_id: {
          $eq: Number(spot_id)
        }
      }
    }

    // 分页查询
    const result = await models.spot_common.list({
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
      spot_id: spot_id,
      message: '获取景点评论列表成功'
    }
  } catch (error) {
    if (isCollectionNotFoundError(error)) {
      return {
        success: true,
        data: [],
        total: 0,
        page: page,
        limit: limit,
        spot_id: spot_id,
        message: 'spot_common 集合不存在，返回空列表'
      }
    }

    console.error('获取景点评论列表失败:', error)
    return {
      success: false,
      message: `获取景点评论列表失败: ${error.message || '未知错误'}`
    }
  }
}