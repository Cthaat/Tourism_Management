// 手动修改景点图片URL的示例代码
// 在微信小程序页面中使用

const SpotManageApi = require('../../server/SpotManageApi.js')
const ImageApi = require('../../server/ImageApi.js')

Page({
  data: {
    spotId: '', // 要修改的景点ID
    newImageUrls: [] // 新的图片URL数组
  },

  // 方法1：直接更新景点数据中的图片URL
  async updateSpotImagesDirectly() {
    try {
      wx.showLoading({ title: '更新中...' })

      const result = await SpotManageApi.updateSpot({
        _id: this.data.spotId,
        images: this.data.newImageUrls
      })

      wx.hideLoading()

      if (result.success) {
        wx.showToast({
          title: '图片URL更新成功',
          icon: 'success'
        })
        console.log('更新成功:', result.data)
      } else {
        wx.showToast({
          title: result.message || '更新失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('更新失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  // 方法2：替换现有图片（先删除旧图片，再添加新图片）
  async replaceSpotImages() {
    try {
      wx.showLoading({ title: '替换图片中...' })

      // 1. 获取当前景点的图片
      const currentImages = await ImageApi.getSpotImages(this.data.spotId)

      // 2. 删除所有现有图片
      if (currentImages.images && currentImages.images.length > 0) {
        for (const imageUrl of currentImages.images) {
          try {
            await ImageApi.deleteImage(imageUrl)
          } catch (deleteError) {
            console.warn('删除图片失败:', imageUrl, deleteError)
          }
        }
      }

      // 3. 更新景点数据为新图片URL
      const result = await SpotManageApi.updateSpot({
        _id: this.data.spotId,
        images: this.data.newImageUrls
      })

      wx.hideLoading()

      if (result.success) {
        wx.showToast({
          title: '图片替换成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.message || '替换失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('替换失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  // 方法3：添加新图片到现有图片列表
  async addImagesToSpot() {
    try {
      wx.showLoading({ title: '添加图片中...' })

      // 1. 获取当前景点的图片
      const currentImages = await ImageApi.getSpotImages(this.data.spotId)
      const existingImages = currentImages.images || []

      // 2. 合并新旧图片
      const allImages = [...existingImages, ...this.data.newImageUrls]

      // 3. 更新景点数据
      const result = await SpotManageApi.updateSpot({
        _id: this.data.spotId,
        images: allImages
      })

      wx.hideLoading()

      if (result.success) {
        wx.showToast({
          title: '图片添加成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.message || '添加失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('添加失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  // 设置景点ID
  onSpotIdInput(e) {
    this.setData({
      spotId: e.detail.value
    })
  },

  // 设置新的图片URL（示例：输入框方式）
  onImageUrlInput(e) {
    const urls = e.detail.value.split('\n').filter(url => url.trim())
    this.setData({
      newImageUrls: urls
    })
  }
})