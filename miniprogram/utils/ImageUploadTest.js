/**
 * 图片上传功能测试验证脚本
 * 用于验证当前的图片上传架构是否正常工作
 * 作者: 高级中国全栈工程师
 * 创建时间: 2024年
 */

// 测试用例：模拟图片选择和上传
function testImageUpload() {
  console.log('=== 图片上传功能测试开始 ===')

  // 模拟选择图片
  wx.chooseImage({
    count: 2, // 选择2张图片进行测试
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: async function (res) {
      console.log('图片选择成功:', res)

      try {
        // 调用我们的图片上传API
        const uploadResult = await ImageUploadApi.uploadSpotImages(res.tempFiles, 'test_spot_' + Date.now(), 'test')

        console.log('=== 图片上传测试结果 ===')
        console.log('上传成功:', uploadResult.success)
        console.log('结果数据:', uploadResult.data)
        console.log('消息:', uploadResult.message)

        if (uploadResult.success) {
          wx.showToast({
            title: '图片上传测试成功！',
            icon: 'success',
            duration: 3000
          })
        } else {
          wx.showToast({
            title: '图片上传测试失败',
            icon: 'none',
            duration: 3000
          })
        }

      } catch (error) {
        console.error('图片上传测试失败:', error)
        wx.showToast({
          title: error.message || '图片上传测试失败',
          icon: 'none',
          duration: 3000
        })
      }
    },
    fail: function (error) {
      console.error('图片选择失败:', error)
      wx.showToast({
        title: '图片选择失败',
        icon: 'none',
        duration: 2000
      })
    }
  })
}

// 测试云函数连接
function testCloudFunction() {
  console.log('=== 测试云函数连接 ===')

  wx.cloud.callFunction({
    name: 'uploadPicture',
    data: {
      action: 'test'
    },
    success: (res) => {
      console.log('云函数测试成功:', res.result)
      wx.showToast({
        title: '云函数连接正常',
        icon: 'success',
        duration: 2000
      })
    },
    fail: (error) => {
      console.error('云函数测试失败:', error)
      wx.showToast({
        title: '云函数连接失败',
        icon: 'none',
        duration: 3000
      })
    }
  })
}

// 导出测试函数，可以在页面中调用
module.exports = {
  testImageUpload,
  testCloudFunction
}
