/**
 * 测试 insertId 和 timestamp 字段修复
 * 验证即时查询功能是否正确返回这些字段
 */

const cloud = require('wx-server-sdk')

// 模拟微信小程序环境
global.wx = {
  cloud: cloud
}

// 初始化云环境
cloud.init({
  env: 'tourism-management-8g0b1edp96efbc3f' // 你的环境ID
})

async function testInsertIdTimestampFix() {
  console.log('=== 开始测试 insertId 和 timestamp 字段修复 ===')

  try {
    // 准备测试数据
    const testSpotData = {
      name: `测试景点_insertId_timestamp_${Date.now()}`,
      description: '这是一个用于测试 insertId 和 timestamp 字段的景点',
      location: {
        address: '北京市朝阳区测试地址',
        geopoint: {
          type: 'Point',
          coordinates: [116.404, 39.915]
        }
      },
      category_id: '1',
      province: '北京',
      phone: '010-12345678',
      website: 'https://test.example.com',
      price: 50,
      rating: 4.5,
      opening_time: 28800000, // 08:00
      closing_time: 64800000, // 18:00
      best_season: 1,
      status: true
    }

    console.log('测试数据:', JSON.stringify(testSpotData, null, 2))

    // 调用云函数
    console.log('调用 spotManage 云函数...')
    const result = await cloud.callFunction({
      name: 'spotManage',
      data: {
        action: 'add',
        data: testSpotData
      }
    })

    console.log('=== 云函数调用结果 ===')
    console.log('完整结果:', JSON.stringify(result, null, 2))

    if (result.result && result.result.success) {
      const { data, message, insertId, timestamp, querySuccess } = result.result

      console.log('\n=== 关键字段检查 ===')
      console.log('success:', result.result.success)
      console.log('message:', message)
      console.log('insertId:', insertId, '- 类型:', typeof insertId)
      console.log('timestamp:', timestamp, '- 类型:', typeof timestamp)
      console.log('querySuccess:', querySuccess)

      console.log('\n=== 数据库记录检查 ===')
      console.log('data._id:', data._id, '- 类型:', typeof data._id)
      console.log('data._openid:', data._openid, '- 类型:', typeof data._openid)
      console.log('data.createdAt:', data.createdAt, '- 类型:', typeof data.createdAt)
      console.log('data.updatedAt:', data.updatedAt, '- 类型:', typeof data.updatedAt)
      console.log('data.createBy:', data.createBy, '- 类型:', typeof data.createBy)

      // 检查时间戳格式
      if (data.createdAt) {
        console.log('createdAt 时间:', new Date(data.createdAt).toLocaleString())
      }
      if (data.updatedAt) {
        console.log('updatedAt 时间:', new Date(data.updatedAt).toLocaleString())
      }
      if (timestamp) {
        console.log('timestamp 时间:', new Date(timestamp).toLocaleString())
      }

      // 验证关键字段
      const validations = {
        'insertId 存在且非空': insertId && insertId !== 'undefined',
        'timestamp 存在且非空': timestamp && timestamp !== 'undefined',
        'insertId 与 data._id 一致': insertId === data._id,
        'data._id 存在': data._id && data._id !== 'undefined',
        'data._openid 存在': data._openid && data._openid !== 'undefined',
        'data.createdAt 存在': data.createdAt && data.createdAt !== 'undefined',
        'querySuccess 为 true': querySuccess === true
      }

      console.log('\n=== 验证结果 ===')
      let allPassed = true
      for (const [check, passed] of Object.entries(validations)) {
        console.log(`${passed ? '✅' : '❌'} ${check}`)
        if (!passed) allPassed = false
      }

      if (allPassed) {
        console.log('\n🎉 所有验证通过！insertId 和 timestamp 字段修复成功！')
      } else {
        console.log('\n❌ 部分验证失败，需要进一步检查')
      }

      // 返回测试结果
      return {
        success: allPassed,
        details: {
          insertId,
          timestamp,
          dataId: data._id,
          dataOpenid: data._openid,
          dataCreatedAt: data.createdAt,
          querySuccess,
          validations
        }
      }

    } else {
      console.error('云函数调用失败:', result.result)
      throw new Error(result.result?.message || '云函数调用失败')
    }

  } catch (error) {
    console.error('=== 测试失败 ===')
    console.error('错误信息:', error.message)
    console.error('错误详情:', error)

    return {
      success: false,
      error: error.message,
      details: error
    }
  }
}

// 执行测试
if (require.main === module) {
  testInsertIdTimestampFix()
    .then(result => {
      console.log('\n=== 最终测试结果 ===')
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('测试执行出错:', error)
      process.exit(1)
    })
}

module.exports = { testInsertIdTimestampFix }
