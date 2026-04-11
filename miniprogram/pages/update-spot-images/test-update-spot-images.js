// 测试手动修改景点图片URL的功能
// 在微信小程序开发者工具的控制台中运行

const SpotManageApi = require('../../server/SpotManageApi.js')
const ImageApi = require('../../server/ImageApi.js')

// 测试数据
const testSpotId = 'test_spot_001'
const testImageUrls = [
  'cloud://test-env.746f-tourism-management/spots/test_spot_001/image1.jpg',
  'cloud://test-env.746f-tourism-management/spots/test_spot_001/image2.jpg'
]

async function testUpdateSpotImages() {
  console.log('=== 开始测试手动修改景点图片URL ===')

  try {
    // 测试1：直接更新图片URL
    console.log('测试1：直接更新图片URL')
    const updateResult = await SpotManageApi.updateSpot({
      _id: testSpotId,
      images: testImageUrls
    })

    if (updateResult.success) {
      console.log('✅ 直接更新成功:', updateResult.message)
    } else {
      console.log('❌ 直接更新失败:', updateResult.message)
    }

    // 测试2：获取更新后的图片
    console.log('测试2：获取更新后的图片')
    const getResult = await ImageApi.getSpotImages(testSpotId)

    if (getResult.success) {
      console.log('✅ 获取图片成功:', getResult.images)
    } else {
      console.log('❌ 获取图片失败:', getResult.message)
    }

    // 测试3：验证图片URL格式
    console.log('测试3：验证图片URL格式')
    const isValidUrls = testImageUrls.every(url =>
      url.startsWith('cloud://') && url.includes('/spots/')
    )

    if (isValidUrls) {
      console.log('✅ 图片URL格式正确')
    } else {
      console.log('❌ 图片URL格式错误')
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }

  console.log('=== 测试完成 ===')
}

// 导出测试函数
module.exports = {
  testUpdateSpotImages
}

// 在控制台中调用：
// const test = require('./test-update-spot-images.js')
// test.testUpdateSpotImages()