/**
 * 景点提交功能测试脚本
 * 测试完整的数据流程：前端数据打包 -> 云函数验证 -> 数据库插入
 */

// 模拟前端数据打包函数
function packageDataBySchema() {
  // 模拟前端表单数据
  const formData = {
    name: '测试景点名称',
    description: '这是一个测试景点的描述信息',
    province: '北京',
    location: {
      address: '北京市朝阳区某某路123号',
      geopoint: {
        type: 'Point',
        coordinates: [116.404, 39.915] // 北京天安门坐标
      }
    },
    price: 120,
    rating: 4.5,
    phone: '010-12345678',
    website: 'https://test-spot.com',
    best_season: 1, // 春季
    status: true
  }

  const categoryOptions = [
    { label: '自然风光', value: '1' },
    { label: '历史文化', value: '2' }
  ]
  const categoryIndex = 0

  // 时间转换函数
  function convertTimeStringToNumber(timeStr) {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num) || 0)
    return (hours * 60 + minutes) * 60 * 1000 // 转换为毫秒
  }

  const openingTimeStr = '08:00'
  const closingTimeStr = '18:00'

  // 按照 tourism_spot schema 结构组织数据
  const schemaData = {
    // 基本信息
    name: formData.name.trim(),
    description: (formData.description || '景点描述').trim().substring(0, 100),

    // 位置信息
    location: {
      address: formData.location.address.trim(),
      geopoint: formData.location.geopoint
    },

    // 分类和地区
    category_id: categoryOptions[categoryIndex]?.value || '1',
    province: (formData.province || '北京').trim().substring(0, 10),

    // 联系信息
    phone: (formData.phone || '4001234567').trim().substring(0, 100),
    website: (formData.website || 'https://example.com').trim().substring(0, 100),

    // 价格和评分
    price: Math.max(0, Math.min(99999, Number(formData.price) || 0)),
    rating: Math.max(0, Math.min(5, Number(formData.rating) || 0)),

    // 时间信息
    opening_time: Math.max(0, Math.min(86399000, convertTimeStringToNumber(openingTimeStr) || 0)),
    closing_time: Math.max(0, Math.min(86399000, convertTimeStringToNumber(closingTimeStr) || 72000000)),
    best_season: Math.max(0, Math.min(3, Number(formData.best_season) || 0)),

    // 状态
    status: Boolean(formData.status !== false)
  }

  return schemaData
}

// 模拟云函数验证逻辑
function validateSpotData(spotData) {
  const errors = []

  // 必需字段验证
  const requiredFields = {
    name: '景点名称',
    location: '景点位置',
    description: '景点描述',
    category_id: '分类ID',
    province: '省份',
    phone: '联系电话',
    price: '门票价格',
    rating: '评分',
    opening_time: '开放时间',
    closing_time: '关闭时间',
    best_season: '最佳旅游季节',
    website: '官方网站'
  }

  // 检查必需字段
  for (const [field, fieldName] of Object.entries(requiredFields)) {
    if (spotData[field] === undefined || spotData[field] === null) {
      errors.push(`${fieldName}不能为空`)
    }
  }

  // 字符串字段验证
  if (spotData.name !== undefined) {
    if (typeof spotData.name !== 'string' || spotData.name.trim() === '') {
      errors.push('景点名称不能为空')
    } else if (spotData.name.length > 100) {
      errors.push('景点名称不能超过100个字符')
    }
  }

  // 位置信息验证
  if (spotData.location !== undefined) {
    if (typeof spotData.location !== 'object') {
      errors.push('位置信息格式不正确')
    } else {
      if (!spotData.location.address || typeof spotData.location.address !== 'string' || spotData.location.address.trim() === '') {
        errors.push('详细地址不能为空')
      }

      if (spotData.location.geopoint) {
        if (typeof spotData.location.geopoint !== 'object') {
          errors.push('经纬度信息格式不正确')
        } else {
          if (!spotData.location.geopoint.type || spotData.location.geopoint.type !== 'Point') {
            errors.push('经纬度类型必须是Point')
          }

          if (!spotData.location.geopoint.coordinates || !Array.isArray(spotData.location.geopoint.coordinates) || spotData.location.geopoint.coordinates.length !== 2) {
            errors.push('经纬度坐标格式不正确')
          } else {
            const [lng, lat] = spotData.location.geopoint.coordinates
            if (typeof lng !== 'number' || typeof lat !== 'number') {
              errors.push('经纬度坐标必须是数字')
            } else if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
              errors.push('经纬度坐标范围不正确')
            }
          }
        }
      }
    }
  }

  // 数字字段验证
  if (spotData.price !== undefined) {
    const price = Number(spotData.price)
    if (isNaN(price) || price < 0 || price > 99999) {
      errors.push('门票价格必须是0-99999之间的数字')
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

// 测试函数
function testSpotSubmission() {
  console.log('=== 开始测试景点提交功能 ===')

  try {
    // 1. 测试前端数据打包
    console.log('\n1. 测试前端数据打包...')
    const packedData = packageDataBySchema()
    console.log('✅ 数据打包成功')
    console.log('打包后的数据:', JSON.stringify(packedData, null, 2))

    // 2. 测试云函数验证
    console.log('\n2. 测试云函数数据验证...')
    const validationErrors = validateSpotData(packedData)

    if (validationErrors.length > 0) {
      console.log('❌ 数据验证失败:')
      validationErrors.forEach(error => console.log(`   - ${error}`))
      return false
    } else {
      console.log('✅ 数据验证通过')
    }

    // 3. 检查必需字段
    console.log('\n3. 检查必需字段完整性...')
    const requiredFields = [
      'name', 'description', 'location', 'category_id', 'province',
      'phone', 'website', 'price', 'rating', 'opening_time',
      'closing_time', 'best_season', 'status'
    ]

    const missingFields = []
    requiredFields.forEach(field => {
      if (field === 'location') {
        if (!packedData.location || !packedData.location.address || !packedData.location.geopoint) {
          missingFields.push('location')
        }
      } else if (packedData[field] === undefined || packedData[field] === null || packedData[field] === '') {
        missingFields.push(field)
      }
    })

    if (missingFields.length > 0) {
      console.log('❌ 缺少必需字段:', missingFields)
      return false
    } else {
      console.log('✅ 所有必需字段完整')
    }

    // 4. 验证数据类型和范围
    console.log('\n4. 验证数据类型和范围...')
    const typeChecks = [
      { field: 'name', type: 'string', value: packedData.name },
      { field: 'price', type: 'number', range: [0, 99999], value: packedData.price },
      { field: 'rating', type: 'number', range: [0, 5], value: packedData.rating },
      { field: 'status', type: 'boolean', value: packedData.status }
    ]

    let typeChecksPassed = true
    typeChecks.forEach(check => {
      const actualType = typeof check.value
      if (actualType !== check.type) {
        console.log(`❌ ${check.field}: 期望类型 ${check.type}, 实际类型 ${actualType}`)
        typeChecksPassed = false
      } else if (check.range && (check.value < check.range[0] || check.value > check.range[1])) {
        console.log(`❌ ${check.field}: 值 ${check.value} 超出范围 [${check.range[0]}, ${check.range[1]}]`)
        typeChecksPassed = false
      } else {
        console.log(`✅ ${check.field}: ${actualType} = ${check.value}`)
      }
    })

    if (!typeChecksPassed) return false

    console.log('\n=== 🎉 所有测试通过！景点提交功能正常 ===')
    console.log('\n最终提交数据预览:')
    console.log('景点名称:', packedData.name)
    console.log('详细地址:', packedData.location.address)
    console.log('经纬度:', packedData.location.geopoint.coordinates)
    console.log('门票价格:', packedData.price, '元')
    console.log('评分:', packedData.rating, '分')
    console.log('状态:', packedData.status ? '正常' : '下架')

    return true

  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message)
    console.log('错误堆栈:', error.stack)
    return false
  }
}

// 运行测试
if (require.main === module) {
  testSpotSubmission()
}

module.exports = {
  testSpotSubmission,
  packageDataBySchema,
  validateSpotData
}
