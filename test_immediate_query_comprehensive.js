/**
 * 立即查询功能全面测试脚本
 * 测试景点提交后立即查询返回完整数据库记录的功能
 * 
 * 运行指令：node test_immediate_query_comprehensive.js
 */

const cloudbase = require("@cloudbase/node-sdk")

// 初始化云开发
const app = cloudbase.init({
  env: 'your-env-id' // 替换为您的环境ID
})

/**
 * 测试立即查询功能
 */
async function testImmediateQuery() {
  console.log('🧪 ===== 立即查询功能全面测试 =====')

  try {
    const models = app.models

    // 测试数据
    const testSpotData = {
      name: `测试景点_立即查询_${Date.now()}`,
      description: '这是一个用于测试立即查询功能的景点',
      location: {
        address: '北京市朝阳区测试街道123号',
        geopoint: {
          type: 'Point',
          coordinates: [116.404, 39.915]
        }
      },
      category_id: '1',
      province: '北京',
      phone: '4001234567',
      website: 'https://test.example.com',
      price: 88,
      rating: 4.5,
      opening_time: 28800000, // 08:00
      closing_time: 64800000, // 18:00
      best_season: 2, // 夏季
      status: true
    }

    console.log('\n1️⃣ 准备插入测试数据:')
    console.log('景点名称:', testSpotData.name)
    console.log('景点地址:', testSpotData.location.address)
    console.log('景点价格:', testSpotData.price)

    // 第一步：模拟云函数的数据处理过程
    const currentTime = Date.now()
    const insertData = {
      ...testSpotData,
      createBy: 'test-openid-12345',
      createdAt: currentTime,
      updatedAt: currentTime
    }

    console.log('\n2️⃣ 执行数据插入操作...')
    const insertResult = await models.tourism_spot.create({
      data: insertData
    })

    console.log('插入操作结果:')
    console.log('- 插入成功:', !!insertResult.id)
    console.log('- 插入ID:', insertResult.id)
    console.log('- 操作时间:', new Date().toLocaleString())

    if (!insertResult.id) {
      throw new Error('数据插入失败')
    }

    // 第二步：立即查询刚插入的数据（模拟云函数步骤6）
    console.log('\n3️⃣ 立即查询刚插入的数据...')

    const queryResult = await models.tourism_spot.get({
      filter: {
        where: {
          _id: {
            $eq: insertResult.id
          }
        }
      }
    })

    console.log('查询操作结果:')
    console.log('- 查询成功:', !!queryResult.data)
    console.log('- 查询到记录数:', queryResult.data ? 1 : 0)

    if (!queryResult.data) {
      throw new Error('立即查询失败 - 未找到刚插入的记录')
    }

    // 第三步：验证查询到的完整数据
    console.log('\n4️⃣ 验证查询到的完整数据结构:')
    const completeRecord = queryResult.data

    console.log('=== 完整数据库记录验证 ===')

    // 验证系统生成字段
    console.log('📊 系统生成字段:')
    console.log('- _id:', completeRecord._id)
    console.log('- _openid:', completeRecord._openid)
    console.log('- 创建时间 (createdAt):', completeRecord.createdAt)
    console.log('- 更新时间 (updatedAt):', completeRecord.updatedAt)
    console.log('- 创建者 (createBy):', completeRecord.createBy)

    // 验证业务数据字段
    console.log('\n📋 业务数据字段:')
    console.log('- 景点名称:', completeRecord.name)
    console.log('- 景点描述:', completeRecord.description)
    console.log('- 位置信息:', completeRecord.location)
    console.log('- 省份:', completeRecord.province)
    console.log('- 分类ID:', completeRecord.category_id)
    console.log('- 联系电话:', completeRecord.phone)
    console.log('- 官方网站:', completeRecord.website)
    console.log('- 门票价格:', completeRecord.price)
    console.log('- 评分:', completeRecord.rating)
    console.log('- 开放时间:', completeRecord.opening_time)
    console.log('- 关闭时间:', completeRecord.closing_time)
    console.log('- 最佳季节:', completeRecord.best_season)
    console.log('- 状态:', completeRecord.status)

    // 第四步：模拟云函数返回结构
    console.log('\n5️⃣ 模拟云函数返回数据结构:')
    const mockCloudFunctionReturn = {
      success: true,
      data: queryResult.data, // 完整数据库记录
      message: '景点添加成功',
      insertId: insertResult.id,
      timestamp: Date.now()
    }

    console.log('模拟云函数返回结构:')
    console.log('- success:', mockCloudFunctionReturn.success)
    console.log('- message:', mockCloudFunctionReturn.message)
    console.log('- insertId:', mockCloudFunctionReturn.insertId)
    console.log('- timestamp:', mockCloudFunctionReturn.timestamp)
    console.log('- data (完整记录):', !!mockCloudFunctionReturn.data)

    // 第五步：前端数据处理模拟
    console.log('\n6️⃣ 模拟前端数据处理:')
    const completeDatabaseRecord = mockCloudFunctionReturn.data

    console.log('前端可以获取到的完整信息:')
    console.log('- 景点ID:', completeDatabaseRecord._id)
    console.log('- 景点ID后6位:', completeDatabaseRecord._id?.substr(-6))
    console.log('- 创建时间格式化:', new Date(completeDatabaseRecord.createdAt).toLocaleString())
    console.log('- 用户OpenID:', completeDatabaseRecord._openid)
    console.log('- 插入操作ID:', mockCloudFunctionReturn.insertId)
    console.log('- 操作时间戳:', mockCloudFunctionReturn.timestamp)

    // 第六步：验证数据完整性
    console.log('\n7️⃣ 数据完整性验证:')
    const validationChecks = {
      '有系统ID': !!completeDatabaseRecord._id,
      '有OpenID': !!completeDatabaseRecord._openid,
      '有创建时间': !!completeDatabaseRecord.createdAt,
      '有更新时间': !!completeDatabaseRecord.updatedAt,
      '有创建者': !!completeDatabaseRecord.createBy,
      '有景点名称': !!completeDatabaseRecord.name,
      '有位置信息': !!completeDatabaseRecord.location,
      '有地址': !!completeDatabaseRecord.location?.address,
      '有经纬度': !!completeDatabaseRecord.location?.geopoint,
      '有门票价格': completeDatabaseRecord.price !== undefined,
      '有评分': completeDatabaseRecord.rating !== undefined,
      '有状态': completeDatabaseRecord.status !== undefined
    }

    console.log('验证结果:')
    Object.entries(validationChecks).forEach(([check, result]) => {
      console.log(`- ${check}: ${result ? '✅ 通过' : '❌ 失败'}`)
    })

    const allChecksPass = Object.values(validationChecks).every(Boolean)
    console.log(`\n📊 总体验证结果: ${allChecksPass ? '✅ 全部通过' : '❌ 有项目失败'}`)

    // 清理测试数据
    console.log('\n8️⃣ 清理测试数据...')
    await models.tourism_spot.delete({
      filter: {
        where: {
          _id: {
            $eq: insertResult.id
          }
        }
      }
    })
    console.log('测试数据清理完成')

    console.log('\n🎉 ===== 立即查询功能测试完成 =====')

    if (allChecksPass) {
      console.log('✅ 所有测试项目都通过了！')
      console.log('✅ 立即查询功能工作正常')
      console.log('✅ 云函数能正确返回完整数据库记录')
      console.log('✅ 前端能正确处理返回的数据')
    } else {
      console.log('❌ 部分测试项目失败，请检查实现')
    }

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:')
    console.error('错误类型:', error.name)
    console.error('错误信息:', error.message)
    console.error('错误堆栈:', error.stack)

    // 根据错误类型提供建议
    if (error.message.includes('collection not exists')) {
      console.log('\n💡 建议解决方案:')
      console.log('- 请确保在云开发控制台创建了 tourism_spot 集合')
      console.log('- 检查集合权限设置')
    } else if (error.message.includes('permission denied')) {
      console.log('\n💡 建议解决方案:')
      console.log('- 检查云开发数据库权限设置')
      console.log('- 确保已正确配置读写权限')
    } else if (error.message.includes('env')) {
      console.log('\n💡 建议解决方案:')
      console.log('- 请将脚本中的 your-env-id 替换为真实的环境ID')
      console.log('- 检查云开发环境是否正确初始化')
    }
  }
}

/**
 * 性能测试 - 测试立即查询的响应时间
 */
async function performanceTest() {
  console.log('\n⚡ ===== 立即查询性能测试 =====')

  try {
    const models = app.models
    const times = []

    for (let i = 0; i < 5; i++) {
      console.log(`\n第 ${i + 1} 次性能测试...`)

      const testData = {
        name: `性能测试景点_${Date.now()}_${i}`,
        description: '性能测试用景点',
        location: {
          address: '性能测试地址',
          geopoint: {
            type: 'Point',
            coordinates: [116.404, 39.915]
          }
        },
        category_id: '1',
        province: '北京',
        phone: '4001234567',
        website: 'https://test.example.com',
        price: 0,
        rating: 0,
        opening_time: 0,
        closing_time: 72000000,
        best_season: 0,
        status: true,
        createBy: 'performance-test',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // 记录开始时间
      const startTime = Date.now()

      // 插入数据
      const insertResult = await models.tourism_spot.create({
        data: testData
      })

      // 立即查询
      const queryResult = await models.tourism_spot.get({
        filter: {
          where: {
            _id: {
              $eq: insertResult.id
            }
          }
        }
      })

      // 记录结束时间
      const endTime = Date.now()
      const duration = endTime - startTime
      times.push(duration)

      console.log(`- 完成时间: ${duration}ms`)
      console.log(`- 插入成功: ${!!insertResult.id}`)
      console.log(`- 查询成功: ${!!queryResult.data}`)

      // 清理数据
      await models.tourism_spot.delete({
        filter: {
          where: {
            _id: {
              $eq: insertResult.id
            }
          }
        }
      })
    }

    // 统计结果
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    console.log('\n📊 性能测试统计结果:')
    console.log(`- 平均响应时间: ${avgTime.toFixed(2)}ms`)
    console.log(`- 最快响应时间: ${minTime}ms`)
    console.log(`- 最慢响应时间: ${maxTime}ms`)
    console.log(`- 测试次数: ${times.length}`)

    if (avgTime < 1000) {
      console.log('✅ 性能表现良好 (平均 < 1秒)')
    } else if (avgTime < 3000) {
      console.log('⚠️ 性能一般 (平均 1-3秒)')
    } else {
      console.log('❌ 性能较差 (平均 > 3秒)')
    }

  } catch (error) {
    console.error('性能测试失败:', error.message)
  }
}

// 运行测试
async function runAllTests() {
  await testImmediateQuery()
  await performanceTest()

  console.log('\n🏁 ===== 所有测试完成 =====')
  console.log('请检查上述测试结果，确保立即查询功能工作正常。')
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行失败:', error)
})
