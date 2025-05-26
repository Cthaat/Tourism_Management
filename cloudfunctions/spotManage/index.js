// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 获取数据库引用
const db = cloud.database()
const spotsCollection = db.collection('tourism_spot')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, data } = event

  try {
    switch (action) {
      case 'add':
        return await addSpot(data, wxContext)
      case 'update':
        return await updateSpot(data, wxContext)
      case 'delete':
        return await deleteSpot(data, wxContext)
      case 'get':
        return await getSpot(data, wxContext)
      case 'list':
        return await getSpotList(data, wxContext)
      default:
        return {
          success: false,
          message: '不支持的操作类型'
        }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return {
      success: false,
      message: error.message || '服务器内部错误'
    }
  }
}

// 添加景点
async function addSpot(spotData, wxContext) {
  // 数据验证
  if (!spotData.name || !spotData.location) {
    return {
      success: false,
      message: '景点名称和位置为必填项'
    }
  }

  // 检查景点名称是否已存在
  const existingSpot = await spotsCollection
    .where({
      name: spotData.name
    })
    .get()

  if (existingSpot.data.length > 0) {
    return {
      success: false,
      message: '景点名称已存在'
    }
  }

  // 准备插入数据
  const insertData = {
    ...spotData,
    _openid: wxContext.OPENID,
    createBy: wxContext.OPENID,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  // 插入数据
  const result = await spotsCollection.add({
    data: insertData
  })

  return {
    success: true,
    data: {
      _id: result._id,
      ...insertData
    },
    message: '景点添加成功'
  }
}

// 更新景点
async function updateSpot(updateData, wxContext) {
  const { _id, ...data } = updateData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  // 添加更新时间
  data.updatedAt = Date.now()
  data.updateBy = wxContext.OPENID

  const result = await spotsCollection.doc(_id).update({
    data: data
  })

  return {
    success: true,
    data: result,
    message: '景点更新成功'
  }
}

// 删除景点
async function deleteSpot(deleteData, wxContext) {
  const { _id } = deleteData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  const result = await spotsCollection.doc(_id).remove()

  return {
    success: true,
    data: result,
    message: '景点删除成功'
  }
}

// 获取单个景点
async function getSpot(getData, wxContext) {
  const { _id } = getData

  if (!_id) {
    return {
      success: false,
      message: '景点ID不能为空'
    }
  }

  const result = await spotsCollection.doc(_id).get()

  return {
    success: true,
    data: result.data,
    message: '获取景点信息成功'
  }
}

// 获取景点列表
async function getSpotList(listData, wxContext) {
  const { page = 1, limit = 20, status } = listData

  let query = spotsCollection

  // 如果指定了状态筛选
  if (typeof status !== 'undefined') {
    query = query.where({
      status: status
    })
  }

  // 分页查询
  const result = await query
    .skip((page - 1) * limit)
    .limit(limit)
    .orderBy('createdAt', 'desc')
    .get()

  return {
    success: true,
    data: result.data,
    total: result.data.length,
    message: '获取景点列表成功'
  }
}