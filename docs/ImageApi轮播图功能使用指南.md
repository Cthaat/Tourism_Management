# ImageApi 轮播图功能使用指南

## 📋 功能概述

`ImageApi.js` 已经添加了完整的轮播图获取功能，支持多种使用场景：

- 获取景点完整轮播图数据
- 获取景点图片URL数组（简化版）
- 批量预加载轮播图（优化列表页面）
- 获取景点主图
- 检查景点是否有轮播图

## 🚀 核心方法

### 1. getSpotImages() - 获取完整轮播图数据

```javascript
// 获取景点轮播图（推荐使用）
const result = await ImageApi.getSpotImages(spotId)

console.log(result)
// 返回格式：
{
  success: true,           // 是否成功
  images: [               // 图片URL数组
    "cloud://xxx/image1.jpg",
    "cloud://xxx/image2.jpg"
  ],
  total: 2,               // 图片总数
  spotId: "景点ID",        // 景点ID
  message: "获取到2张轮播图" // 状态消息
}
```

### 2. getSpotImageUrls() - 获取图片URL数组（简化版）

```javascript
// 只获取图片URL数组
const imageUrls = await ImageApi.getSpotImageUrls(spotId)

console.log(imageUrls)
// 返回: ["cloud://xxx/image1.jpg", "cloud://xxx/image2.jpg"]
```

### 3. getSpotMainImage() - 获取主图

```javascript
// 获取景点主图（第一张轮播图）
const mainImage = await ImageApi.getSpotMainImage(spotId, '默认图片URL')

console.log(mainImage) 
// 返回: "cloud://xxx/image1.jpg" 或默认图片URL
```

### 4. hasSpotImages() - 检查是否有轮播图

```javascript
// 检查景点是否有轮播图
const hasImages = await ImageApi.hasSpotImages(spotId)

console.log(hasImages) // 返回: true/false
```

### 5. preloadSpotImages() - 批量预加载（优化列表页面）

```javascript
// 批量获取多个景点的轮播图
const spotIds = ['spot1', 'spot2', 'spot3']
const allImages = await ImageApi.preloadSpotImages(spotIds, {
  concurrent: true,      // 并发获取
  maxConcurrent: 5      // 最大并发数
})

console.log(allImages)
// 返回格式：
{
  'spot1': {
    success: true,
    images: [...],
    total: 3
  },
  'spot2': {
    success: true,
    images: [...],
    total: 2
  }
}
```

## 💡 实际使用场景

### 场景1：景点详情页轮播图

```javascript
// pages/detail/detail.js
Page({
  data: {
    carouselImages: [],
    hasImages: false
  },

  async loadSpotImages() {
    const spotId = this.data.spotInfo._id
    
    try {
      wx.showLoading({ title: '加载轮播图...' })
      
      const result = await ImageApi.getSpotImages(spotId)
      
      if (result.success && result.images.length > 0) {
        this.setData({
          carouselImages: result.images,
          hasImages: true
        })
        
        console.log(`成功加载 ${result.total} 张轮播图`)
      } else {
        console.log('该景点暂无轮播图')
        this.setData({
          carouselImages: [],
          hasImages: false
        })
      }
    } catch (error) {
      console.error('加载轮播图失败:', error)
      wx.showToast({
        title: '加载轮播图失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
})
```

### 场景2：首页景点列表主图显示

```javascript
// pages/index/index.js
Page({
  data: {
    tourismSpots: []
  },

  async loadSpotsWithImages() {
    try {
      // 1. 先获取景点列表
      const spotsResult = await SpotManageApi.getSpotList({
        status: true,
        limit: 20
      })
      
      if (spotsResult.success) {
        const spots = spotsResult.data
        
        // 2. 为每个景点获取主图
        for (let spot of spots) {
          spot.mainImage = await ImageApi.getSpotMainImage(
            spot._id, 
            '/images/default-spot.png'
          )
        }
        
        this.setData({
          tourismSpots: spots
        })
      }
    } catch (error) {
      console.error('加载景点列表失败:', error)
    }
  },

  // 优化版本：批量预加载
  async loadSpotsWithImagesOptimized() {
    try {
      // 1. 先获取景点列表
      const spotsResult = await SpotManageApi.getSpotList({
        status: true,
        limit: 20
      })
      
      if (spotsResult.success) {
        const spots = spotsResult.data
        const spotIds = spots.map(spot => spot._id)
        
        // 2. 批量预加载所有景点的轮播图
        const allImages = await ImageApi.preloadSpotImages(spotIds, {
          concurrent: true,
          maxConcurrent: 5
        })
        
        // 3. 为每个景点设置主图
        spots.forEach(spot => {
          const imageData = allImages[spot._id]
          spot.mainImage = (imageData && imageData.images.length > 0) 
            ? imageData.images[0] 
            : '/images/default-spot.png'
          spot.imageCount = imageData ? imageData.total : 0
        })
        
        this.setData({
          tourismSpots: spots
        })
      }
    } catch (error) {
      console.error('加载景点列表失败:', error)
    }
  }
})
```

### 场景3：景点卡片组件

```javascript
// components/spot-card/spot-card.js
Component({
  properties: {
    spot: {
      type: Object,
      value: {}
    }
  },

  data: {
    spotImage: '',
    imageLoaded: false,
    hasMultipleImages: false
  },

  lifetimes: {
    async attached() {
      await this.loadSpotImage()
    }
  },

  methods: {
    async loadSpotImage() {
      const spotId = this.data.spot._id || this.data.spot.id
      if (!spotId) return

      try {
        // 获取景点轮播图信息
        const result = await ImageApi.getSpotImages(spotId)
        
        if (result.success && result.images.length > 0) {
          this.setData({
            spotImage: result.images[0],  // 使用第一张图作为卡片图
            imageLoaded: true,
            hasMultipleImages: result.total > 1  // 是否有多张图片
          })
        } else {
          // 使用默认图片
          this.setData({
            spotImage: '/images/default-spot.png',
            imageLoaded: true,
            hasMultipleImages: false
          })
        }
      } catch (error) {
        console.error('加载景点图片失败:', error)
        this.setData({
          spotImage: '/images/default-spot.png',
          imageLoaded: true,
          hasMultipleImages: false
        })
      }
    }
  }
})
```

## 🔧 WXML 模板示例

### 轮播图组件

```xml
<!-- 景点详情页轮播图 -->
<view class="carousel-container" wx:if="{{hasImages}}">
  <swiper 
    class="spot-carousel" 
    indicator-dots="{{true}}" 
    autoplay="{{true}}" 
    interval="{{3000}}"
    duration="{{500}}"
    circular="{{true}}">
    <swiper-item wx:for="{{carouselImages}}" wx:key="{{index}}">
      <image 
        class="carousel-image" 
        src="{{item}}" 
        mode="aspectFill"
        lazy-load="{{true}}"
        show-menu-by-longpress="{{true}}">
      </image>
    </swiper-item>
  </swiper>
  
  <view class="image-count">{{carouselImages.length}}张图片</view>
</view>

<!-- 无图片时的占位符 -->
<view class="no-images-placeholder" wx:else>
  <image src="/images/no-image.png" class="placeholder-image"></image>
  <text class="placeholder-text">暂无图片</text>
</view>
```

### 景点卡片图片

```xml
<!-- spot-card 组件模板 -->
<view class="spot-card">
  <view class="image-container">
    <image 
      class="spot-image {{imageLoaded ? 'loaded' : 'loading'}}" 
      src="{{spotImage}}" 
      mode="aspectFill"
      lazy-load="{{true}}"
      bindload="onImageLoad"
      binderror="onImageError">
    </image>
    
    <!-- 多图标识 -->
    <view class="multi-image-badge" wx:if="{{hasMultipleImages}}">
      <text class="iconfont icon-images"></text>
    </view>
    
    <!-- 加载中状态 -->
    <view class="image-loading" wx:if="{{!imageLoaded}}">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
  
  <!-- 景点信息 -->
  <view class="spot-info">
    <!-- 其他景点信息 -->
  </view>
</view>
```

## 📊 性能优化建议

1. **列表页面优化**：使用 `preloadSpotImages()` 批量预加载
2. **懒加载**：在 WXML 中使用 `lazy-load="{{true}}"`
3. **缓存机制**：考虑在 app.js 中添加图片缓存
4. **错误处理**：总是提供默认图片和错误处理
5. **并发控制**：批量加载时限制并发数量

## 🛠️ 故障排除

### 常见问题

1. **获取不到图片**
   - 检查景点ID是否正确
   - 确认云函数部署成功
   - 查看控制台日志

2. **加载速度慢**
   - 使用批量预加载
   - 检查网络连接
   - 优化图片大小

3. **图片显示异常**
   - 检查图片URL格式
   - 确认临时链接未过期
   - 使用默认图片兜底

### 调试技巧

```javascript
// 开启详细日志
console.log('=== 图片加载调试信息 ===')
const result = await ImageApi.getSpotImages(spotId)
console.log('景点ID:', spotId)
console.log('返回结果:', result)
console.log('图片数量:', result.images.length)
console.log('图片URLs:', result.images)
```

## 📝 总结

更新后的 `ImageApi.js` 提供了完整的轮播图解决方案：

- ✅ 获取景点轮播图数据
- ✅ 简化的URL数组获取
- ✅ 批量预加载优化
- ✅ 主图获取
- ✅ 图片存在检查
- ✅ 完善的错误处理
- ✅ 兼容旧方法

所有方法都支持异步调用，具有良好的错误处理机制，可以在各种场景下使用。
