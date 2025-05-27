# 图片管理API使用指南

## 概述

我们为图片上传和数据库操作功能提供了三个层次的API：

1. **ImageUploadApi** - 基础图片上传API（云存储）
2. **ImageDatabaseApi** - 图片数据库操作API
3. **ImageManagerApi** - 综合图片管理API（推荐使用）

## 快速开始

### 1. 导入API模块

```javascript
// 在页面或组件中导入
const ImageManagerApi = require('../../server/ImageManagerApi')
const ImageDatabaseApi = require('../../server/ImageDatabaseApi')
const ImageUploadApi = require('../../server/ImageUploadApi')
```

### 2. 完整上传流程（推荐）

```javascript
// 完整的图片上传+数据库保存
async function uploadImages() {
  try {
    const images = [
      { tempFilePath: 'temp_path_1.jpg' },
      { tempFilePath: 'temp_path_2.jpg' }
    ]
    
    const spotId = 1001 // 景点ID
    
    const result = await ImageManagerApi.uploadSpotImagesComplete(images, spotId, {
      folderName: 'spots',           // 云存储文件夹
      autoSaveToDatabase: true,      // 自动保存到数据库
      showProgress: true,            // 显示进度提示
      concurrent: false              // 是否并发处理
    })
    
    console.log('上传结果:', result)
    
    if (result.success) {
      console.log('成功上传图片数:', result.data.overall.successfulUploads)
      console.log('成功保存记录数:', result.data.overall.successfulRecords)
    }
    
  } catch (error) {
    console.error('上传失败:', error)
  }
}
```

### 3. 单张图片快速上传

```javascript
async function uploadSingleImage(imageData, spotId) {
  try {
    const result = await ImageManagerApi.uploadSingleImage(imageData, spotId)
    
    if (result.success) {
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    }
  } catch (error) {
    wx.showToast({
      title: error.message,
      icon: 'none'
    })
  }
}
```

## API详细说明

### ImageManagerApi（综合管理）

#### uploadSpotImagesComplete()
完整的图片上传流程，包含云存储上传和数据库记录保存。

**参数：**
- `images` (Array): 图片列表
- `spotId` (Number): 景点ID（必需）
- `options` (Object): 配置选项
  - `folderName` (String): 存储文件夹名称，默认'spots'
  - `autoSaveToDatabase` (Boolean): 是否自动保存到数据库，默认true
  - `showProgress` (Boolean): 是否显示进度，默认true
  - `concurrent` (Boolean): 是否并发处理，默认false

**返回值：**
```javascript
{
  success: true,
  data: {
    spotId: 1001,
    upload: {
      results: [...],      // 上传结果详情
      summary: {           // 上传摘要
        total: 2,
        uploadSuccess: 2,
        uploadFailed: 0
      }
    },
    database: {
      results: [...],      // 数据库保存结果
      summary: {           // 数据库摘要
        total: 2,
        success: 2,
        failed: 0
      }
    },
    overall: {
      totalImages: 2,
      successfulUploads: 2,
      successfulRecords: 2,
      completeSuccess: true
    }
  },
  message: "成功上传 2 张图片，2 条记录已保存"
}
```

#### getSpotImagesComplete()
获取景点的所有图片记录。

```javascript
const images = await ImageManagerApi.getSpotImagesComplete(spotId, {
  generateTempUrl: true  // 是否生成临时访问链接
})
```

#### deleteImageComplete()
删除图片（云存储文件+数据库记录）。

```javascript
await ImageManagerApi.deleteImageComplete(fileID, recordId)
```

### ImageDatabaseApi（数据库操作）

#### saveImageRecord()
保存单张图片记录到数据库。

```javascript
const result = await ImageDatabaseApi.saveImageRecord(imageUrl, spotId)
```

#### batchSaveImageRecords()
批量保存图片记录。

```javascript
const imageList = [
  { imageUrl: 'url1', spotId: 1001 },
  { imageUrl: 'url2', spotId: 1001 }
]

const result = await ImageDatabaseApi.batchSaveImageRecords(imageList, {
  concurrent: true,      // 并发处理
  maxConcurrent: 3       // 最大并发数
})
```

#### getSpotImages()
查询景点图片记录。

```javascript
const images = await ImageDatabaseApi.getSpotImages(spotId)
```

### ImageUploadApi（基础上传）

#### uploadSpotImages()
仅上传图片到云存储（不包含数据库操作）。

```javascript
const result = await ImageUploadApi.uploadSpotImages(images, spotId, 'spots')
```

## 实际使用示例

### 在add-spot页面中使用

```javascript
// pages/add-spot/add-spot.js
const ImageManagerApi = require('../../server/ImageManagerApi')

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
      
      this.setData({
        selectedImages: res.tempFiles
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
      const result = await ImageManagerApi.uploadSpotImagesComplete(
        selectedImages, 
        spotId,
        {
          folderName: 'spots',
          autoSaveToDatabase: true,
          showProgress: true
        }
      )

      if (result.success) {
        // 清空已上传的图片
        this.setData({ selectedImages: [] })
        
        // 刷新图片列表
        this.loadSpotImages()
      }
    } catch (error) {
      console.error('上传失败:', error)
    }
  },

  // 加载景点图片
  async loadSpotImages() {
    const { spotId } = this.data
    
    if (!spotId) return

    try {
      const images = await ImageManagerApi.getSpotImagesComplete(spotId, {
        generateTempUrl: true
      })
      
      this.setData({ spotImages: images })
    } catch (error) {
      console.error('加载图片失败:', error)
    }
  }
})
```

### 错误处理

```javascript
try {
  const result = await ImageManagerApi.uploadSpotImagesComplete(images, spotId)
  // 处理成功结果
} catch (error) {
  // 错误处理
  if (error.message.includes('景点ID')) {
    wx.showToast({ title: '请先选择景点', icon: 'none' })
  } else if (error.message.includes('图片')) {
    wx.showToast({ title: '图片处理失败', icon: 'none' })
  } else {
    wx.showToast({ title: '操作失败，请重试', icon: 'none' })
  }
}
```

## 测试功能

### 测试API连接

```javascript
// 测试所有功能是否正常
const testResult = await ImageManagerApi.testComplete()
console.log('测试结果:', testResult)

// 单独测试数据库连接
const dbTest = await ImageDatabaseApi.testConnection()
console.log('数据库测试:', dbTest)
```

## 注意事项

1. **景点ID必需**: 所有涉及数据库操作的功能都需要提供有效的景点ID
2. **权限配置**: 确保云开发数据库权限配置正确
3. **文件大小**: 注意图片文件大小限制
4. **并发处理**: 大量图片上传时建议使用并发模式提高效率
5. **错误处理**: 始终包含适当的错误处理逻辑

## 云函数支持的操作

当前uploadPicture云函数支持以下操作：

- `saveImageRecord`: 保存图片记录到数据库 ✅
- `deleteImage`: 删除云存储文件 ✅  
- `test`: 测试功能 ✅
- `getSpotImages`: 查询景点图片（待实现）
- `deleteImageRecord`: 删除数据库记录（待实现）
- `updateImageRecord`: 更新图片记录（待实现）

如需扩展更多功能，请相应更新云函数代码。
