# 图片管理API使用指南

## 📋 概述

**ImageApi.js** 是旅游管理微信小程序的统一图片管理模块，提供完整的图片上传、存储、查询和删除功能。该模块整合了云存储上传和数据库记录保存，为景点轮播图管理提供一站式解决方案。

## 🚀 快速开始

### 1. 导入API模块

```javascript
const ImageApi = require('../../server/ImageApi.js')
```

### 2. 基本使用示例

```javascript
// 选择并上传景点图片
async function uploadSpotImages() {
  try {
    // 选择图片
    const res = await wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera']
    })
    
    // 上传图片
    const result = await ImageApi.uploadSpotImages(res.tempFiles, spotId, {
      folderName: 'spots',
      showProgress: true
    })
    
    if (result.success) {
      console.log('上传成功:', result.message)
    }
  } catch (error) {
    console.error('上传失败:', error.message)
  }
}
```

## 🔧 核心API方法

### 1. uploadSpotImages() - 景点图片上传

完整的图片上传流程，包含云存储上传和数据库记录保存。

```javascript
const result = await ImageApi.uploadSpotImages(images, spotId, options)
```

**参数说明：**
- `images` (Array): 图片列表，每个元素包含 `tempFilePath` 等信息
- `spotId` (String): 景点ID（必需）
- `options` (Object): 配置选项
  - `folderName` (String): 云存储文件夹名称，默认 'spots'
  - `showProgress` (Boolean): 是否显示上传进度，默认 true
  - `concurrent` (Boolean): 是否并发处理，默认 false

**返回值格式：**
```javascript
{
  success: true,
  data: {
    upload: {
      results: [...],      // 详细上传结果
      summary: {           // 上传摘要
        total: 3,
        uploadSuccess: 3,
        uploadFailed: 0,
        databaseSuccess: 3,
        databaseFailed: 0
      }
    }
  },
  message: "成功上传 3 张图片，3 条记录已保存到数据库"
}
```

### 2. getSpotImages() - 获取景点轮播图

获取指定景点的所有轮播图数据。

```javascript
const result = await ImageApi.getSpotImages(spotId, options)
```

**参数说明：**
- `spotId` (String): 景点ID（必需）
- `options` (Object): 查询选项（可选）

**返回值格式：**
```javascript
{
  success: true,
  images: [
    "cloud://xxx.jpg",
    "cloud://yyy.jpg"
  ],
  total: 2,
  spotId: "1001",
  message: "获取到2张轮播图"
}
```

### 3. deleteImage() - 删除图片

删除云存储中的图片文件。

```javascript
await ImageApi.deleteImage(fileID)
```

**参数说明：**
- `fileID` (String): 云存储文件ID（必需）

### 4. testConnection() - 测试连接

测试云函数和数据库连接是否正常。

```javascript
const result = await ImageApi.testConnection()
```

## 🔨 工具方法

### 1. getSpotImageUrls() - 简化版图片获取

仅返回图片URL数组，忽略其他信息。

```javascript
const imageUrls = await ImageApi.getSpotImageUrls(spotId)
// 返回: ["cloud://xxx.jpg", "cloud://yyy.jpg"]
```

### 2. getSpotMainImage() - 获取景点主图

获取景点轮播图的第一张作为主图。

```javascript
const mainImage = await ImageApi.getSpotMainImage(spotId, '默认图片.jpg')
```

### 3. hasSpotImages() - 检查是否有轮播图

检查景点是否已上传轮播图。

```javascript
const hasImages = await ImageApi.hasSpotImages(spotId)
// 返回: true 或 false
```

### 4. preloadSpotImages() - 批量预加载

适用于列表页面，批量预加载多个景点的轮播图。

```javascript
const spotImageMap = await ImageApi.preloadSpotImages(spotIds, {
  concurrent: true,
  maxConcurrent: 5
})
```

### 5. validateImageFile() - 图片文件验证

验证图片文件是否符合要求。

```javascript
const validation = ImageApi.validateImageFile(file)
if (!validation.valid) {
  console.error('文件验证失败:', validation.error)
}
```

## 💼 实际使用案例

### 案例1：景点发布页面图片上传

```javascript
// pages/add-spot/add-spot.js
const ImageApi = require('../../server/ImageApi.js')

Page({
  data: {
    selectedImages: [],
    spotId: null
  },

  // 选择图片
  async chooseImages() {
    try {
      const res = await wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      })
      
      // 验证选择的图片
      const validImages = []
      for (const image of res.tempFiles) {
        const validation = ImageApi.validateImageFile(image)
        if (validation.valid) {
          validImages.push(image)
        } else {
          wx.showToast({
            title: validation.error,
            icon: 'none'
          })
        }
      }
      
      this.setData({
        selectedImages: validImages
      })
    } catch (error) {
      console.error('选择图片失败:', error)
    }
  },

  // 上传图片
  async uploadImages() {
    const { selectedImages, spotId } = this.data
    
    if (!selectedImages.length) {
      wx.showToast({ title: '请先选择图片', icon: 'none' })
      return
    }
    
    if (!spotId) {
      wx.showToast({ title: '请先保存景点信息', icon: 'none' })
      return
    }

    try {
      const result = await ImageApi.uploadSpotImages(
        selectedImages, 
        spotId,
        {
          folderName: 'spots',
          showProgress: true
        }
      )

      if (result.success) {
        // 清空已上传的图片
        this.setData({ selectedImages: [] })
        
        // 刷新图片列表
        await this.loadSpotImages()
      }
    } catch (error) {
      console.error('上传失败:', error)
      wx.showToast({
        title: error.message,
        icon: 'none'
      })
    }
  },

  // 加载景点图片
  async loadSpotImages() {
    const { spotId } = this.data
    
    if (!spotId) return

    try {
      const result = await ImageApi.getSpotImages(spotId)
      
      this.setData({ 
        spotImages: result.images,
        imageCount: result.total
      })
    } catch (error) {
      console.error('加载图片失败:', error)
    }
  },

  // 删除图片
  async deleteImage(event) {
    const fileID = event.currentTarget.dataset.fileid
    
    try {
      await wx.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？'
      })
      
      await ImageApi.deleteImage(fileID)
      
      // 刷新图片列表
      await this.loadSpotImages()
    } catch (error) {
      if (error.errMsg !== 'showModal:fail cancel') {
        console.error('删除失败:', error)
      }
    }
  }
})
```

### 案例2：景点列表页面图片显示

```javascript
// pages/spot-list/spot-list.js
const ImageApi = require('../../server/ImageApi.js')

Page({
  data: {
    spotList: []
  },

  async loadSpotList() {
    try {
      // 假设从其他API获取景点列表
      const spots = await SpotApi.getSpotList()
      
      // 批量预加载轮播图
      const spotIds = spots.map(spot => spot.id)
      const imageMap = await ImageApi.preloadSpotImages(spotIds, {
        concurrent: true,
        maxConcurrent: 5
      })
      
      // 为每个景点添加主图
      const spotsWithImages = spots.map(spot => ({
        ...spot,
        mainImage: imageMap[spot.id]?.images?.[0] || '/images/default-spot.jpg',
        imageCount: imageMap[spot.id]?.total || 0
      }))
      
      this.setData({ spotList: spotsWithImages })
    } catch (error) {
      console.error('加载景点列表失败:', error)
    }
  }
})
```

### 案例3：景点详情页面轮播图

```javascript
// pages/spot-detail/spot-detail.js
const ImageApi = require('../../server/ImageApi.js')

Page({
  data: {
    spotId: null,
    swiperImages: []
  },

  onLoad(options) {
    this.setData({ spotId: options.id })
    this.loadSpotImages()
  },

  async loadSpotImages() {
    const { spotId } = this.data
    
    try {
      const result = await ImageApi.getSpotImages(spotId)
      
      // 检查是否有轮播图
      if (result.total > 0) {
        this.setData({ 
          swiperImages: result.images,
          hasImages: true
        })
      } else {
        // 使用默认图片
        this.setData({ 
          swiperImages: ['/images/default-spot.jpg'],
          hasImages: false
        })
      }
    } catch (error) {
      console.error('加载轮播图失败:', error)
      // 出错时使用默认图片
      this.setData({ 
        swiperImages: ['/images/default-spot.jpg'],
        hasImages: false
      })
    }
  }
})
```

## ⚠️ 重要注意事项

### 1. 数据验证要求
- **景点ID必需**: 所有操作都需要提供有效的景点ID
- **图片格式限制**: 仅支持JPG、PNG、GIF、WebP格式
- **文件大小限制**: 单张图片不能超过10MB
- **数量限制**: 单次最多上传9张图片

### 2. 错误处理最佳实践

```javascript
try {
  const result = await ImageApi.uploadSpotImages(images, spotId)
  // 成功处理
} catch (error) {
  // 分类处理不同类型的错误
  if (error.message.includes('景点ID')) {
    wx.showToast({ title: '请先选择景点', icon: 'none' })
  } else if (error.message.includes('图片')) {
    wx.showToast({ title: '图片处理失败，请重新选择', icon: 'none' })
  } else if (error.message.includes('网络')) {
    wx.showToast({ title: '网络连接失败，请检查网络', icon: 'none' })
  } else {
    wx.showToast({ title: '操作失败，请重试', icon: 'none' })
  }
}
```

### 3. 性能优化建议

```javascript
// 对于列表页面，使用主图而不是完整轮播图
const mainImage = await ImageApi.getSpotMainImage(spotId, defaultImage)

// 对于大量数据，启用并发加载
const imageMap = await ImageApi.preloadSpotImages(spotIds, {
  concurrent: true,
  maxConcurrent: 5
})

// 检查是否有图片再决定是否加载
const hasImages = await ImageApi.hasSpotImages(spotId)
if (hasImages) {
  const images = await ImageApi.getSpotImages(spotId)
}
```

### 4. 云函数依赖

ImageApi 依赖以下云函数：
- **uploadPicture**: 处理图片记录的保存、查询、删除等数据库操作
- **userLogin**: 获取用户信息用于文件路径生成

确保这些云函数已正确部署和配置。

## 🔍 测试和调试

### 测试连接状态

```javascript
// 测试API连接
const testResult = await ImageApi.testConnection()
console.log('连接测试结果:', testResult)

// 测试完整上传流程
async function testUploadFlow() {
  try {
    // 使用测试图片
    const testImages = [{
      tempFilePath: '/test/path/image.jpg',
      size: 1024000
    }]
    
    const result = await ImageApi.uploadSpotImages(testImages, 'test-spot')
    console.log('测试上传结果:', result)
  } catch (error) {
    console.error('测试失败:', error)
  }
}
```

### 开发调试模式

在开发过程中，可以启用详细日志：

```javascript
// 在API调用前设置调试模式
console.log('=== 开始图片上传调试 ===')
const result = await ImageApi.uploadSpotImages(images, spotId, {
  showProgress: true
})
console.log('=== 上传完成 ===', result)
```

---

**文档版本**: v2.0.0  
**最后更新**: 2025年5月27日  
**作者**: 高级中国全栈工程师
