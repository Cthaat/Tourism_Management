/**
 * 云函数快速诊断工具
 * 在微信开发者工具控制台中运行此代码进行测试
 */

// 测试云函数连接
async function testCloudFunction() {
  console.log('🔧 开始云函数连接测试...')

  try {
    const result = await wx.cloud.callFunction({
      name: 'uploadPicture',
      data: {
        action: 'test',
        test: true
      }
    })

    console.log('✅ 云函数连接成功:', result)
    return { success: true, result }
  } catch (error) {
    console.error('❌ 云函数连接失败:', error)
    return { success: false, error }
  }
}

// 测试图片上传功能（需要先选择图片）
async function testImageUpload() {
  console.log('🖼️ 开始图片上传测试...')

  try {
    // 选择图片
    const chooseResult = await new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: resolve,
        fail: reject
      })
    })

    console.log('图片选择成功:', chooseResult)

    // 测试上传
    const uploadResult = await wx.cloud.callFunction({
      name: 'uploadPicture',
      data: {
        action: 'uploadImages',
        images: chooseResult.tempFilePaths.map((path, index) => ({
          tempFilePath: path,
          size: 1000000, // 假设大小
          type: 'image/jpeg'
        })),
        spotId: `test_spot_${Date.now()}`,
        folderName: 'test'
      }
    })

    console.log('✅ 图片上传测试成功:', uploadResult)
    return { success: true, result: uploadResult }

  } catch (error) {
    console.error('❌ 图片上传测试失败:', error)
    return { success: false, error }
  }
}

// 检查云开发环境
function checkCloudEnvironment() {
  console.log('☁️ 检查云开发环境...')

  try {
    const envId = wx.cloud.envId
    console.log('云开发环境ID:', envId)

    if (!envId) {
      console.error('❌ 云开发环境未初始化')
      return false
    }

    console.log('✅ 云开发环境正常')
    return true
  } catch (error) {
    console.error('❌ 云开发环境检查失败:', error)
    return false
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始完整诊断测试...')

  // 1. 检查云开发环境
  const envOK = checkCloudEnvironment()
  if (!envOK) {
    console.log('⚠️ 请先初始化云开发环境')
    return
  }

  // 2. 测试云函数连接
  const connectionResult = await testCloudFunction()
  if (!connectionResult.success) {
    console.log('⚠️ 云函数连接失败，请检查部署状态')
    return
  }

  // 3. 测试图片上传（可选）
  console.log('📝 图片上传测试需要手动触发 testImageUpload()')

  console.log('🎉 基础诊断完成！')
  console.log('使用说明:')
  console.log('- 运行 testCloudFunction() 测试云函数连接')
  console.log('- 运行 testImageUpload() 测试图片上传功能')
  console.log('- 运行 checkCloudEnvironment() 检查云开发环境')
}

// 导出函数到全局作用域（在控制台中使用）
if (typeof window !== 'undefined') {
  window.testCloudFunction = testCloudFunction
  window.testImageUpload = testImageUpload
  window.checkCloudEnvironment = checkCloudEnvironment
  window.runAllTests = runAllTests
}

// 使用说明
console.log(`
🔧 云函数诊断工具使用指南:

1. 基础测试 (复制到控制台运行):
   runAllTests()

2. 单独测试:
   - testCloudFunction()        // 测试云函数连接
   - testImageUpload()          // 测试图片上传
   - checkCloudEnvironment()    // 检查云开发环境

3. 如果测试失败:
   - 检查云函数是否正确部署
   - 确认云开发环境是否初始化
   - 查看控制台详细错误信息
`)

// 如果在模块环境中，导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCloudFunction,
    testImageUpload,
    checkCloudEnvironment,
    runAllTests
  }
}
