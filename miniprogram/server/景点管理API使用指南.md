# 景点管理API使用指南

## 概述
SpotManageApi.js 是旅游管理微信小程序的景点管理API接口，提供了完整的景点CRUD操作和数据验证功能。该API支持@cloudbase/node-sdk架构，为景点信息管理提供了完善的解决方案。

## 功能特性
- ✅ 完整的景点CRUD操作
- ✅ 高级搜索功能（关键词、分类、价格、评分等）
- ✅ 分页查询支持
- ✅ 云函数连接测试
- ✅ 数据验证和错误处理
- ✅ URL格式验证
- ✅ 统一的响应格式
- ✅ 详细的日志记录
- ✅ 兼容@cloudbase/node-sdk
- ✅ 多种搜索方式和回退机制

## API列表

### 1. 添加景点 (addSpot)
为系统添加新的景点信息

**方法签名:**
```javascript
SpotManageApi.addSpot(spotData)
```

**参数说明:**
```javascript
{
  name: "黄山风景区",                    // 景点名称 (必填)
  location: {                          // 位置信息 (必填)
    address: "安徽省黄山市黄山风景区",      // 地址
    geopoint: {                        // 地理坐标
      latitude: 30.134,
      longitude: 118.156
    }
  },
  description: "中国著名的风景名胜区...",   // 景点描述
  price: 190,                          // 门票价格 (数字)
  rating: 4.8,                         // 评分 (0-5)
  opening_time: "06:00",               // 开放时间
  closing_time: "18:00",               // 关闭时间
  contact_phone: "0559-5561111",       // 联系电话
  website: "http://www.huangshan.com.cn", // 官方网站
  images: ["cloud://xxx", "cloud://yyy"], // 图片列表
  tags: ["自然风光", "世界遗产", "名山"],   // 标签
  facilities: ["停车场", "餐厅", "导游服务"], // 设施
  status: true                         // 状态 (默认true)
}
```

**返回结果:**
```javascript
{
  success: true,
  data: {
    _id: "spot_123456",
    name: "黄山风景区",
    // ...其他景点信息
    create_time: "2025-01-24T10:30:00.000Z",
    update_time: "2025-01-24T10:30:00.000Z"
  },
  message: "景点添加成功"
}
```

**使用示例:**
```javascript
// 在页面中引入API
const SpotManageApi = require('../../server/SpotManageApi')

// 添加景点
const spotData = {
  name: "黄山风景区",
  location: {
    address: "安徽省黄山市黄山风景区",
    geopoint: {
      latitude: 30.134,
      longitude: 118.156
    }
  },
  description: "黄山是中国著名的风景名胜区，以奇松、怪石、云海、温泉著称。",
  price: 190,
  rating: 4.8,
  opening_time: "06:00",
  closing_time: "18:00",
  contact_phone: "0559-5561111",
  website: "http://www.huangshan.com.cn",
  images: ["cloud://xxx", "cloud://yyy"],
  tags: ["自然风光", "世界遗产", "名山"],
  facilities: ["停车场", "餐厅", "导游服务"]
}

try {
  const result = await SpotManageApi.addSpot(spotData)
  if (result.success) {
    wx.showToast({
      title: result.message,
      icon: 'success'
    })
    console.log('新增景点ID:', result.data._id)
  } else {
    wx.showToast({
      title: result.message,
      icon: 'error'
    })
  }
} catch (error) {
  console.error('添加景点失败:', error)
}
```

### 2. 更新景点 (updateSpot)
更新现有景点的信息

**方法签名:**
```javascript
SpotManageApi.updateSpot(spotData)
```

**参数说明:**
```javascript
{
  _id: "spot_123456",                  // 景点ID (必填)
  name: "黄山风景区（更新版）",          // 更新后的景点名称
  price: 200,                          // 更新后的价格
  // ...其他需要更新的字段
}
```

**使用示例:**
```javascript
const updateData = {
  _id: "spot_123456",
  name: "黄山风景区（更新版）",
  price: 200,
  description: "更新后的景点描述..."
}

const result = await SpotManageApi.updateSpot(updateData)
if (result.success) {
  wx.showToast({
    title: '景点更新成功',
    icon: 'success'
  })
}
```

### 3. 删除景点 (deleteSpot)
删除指定的景点

**方法签名:**
```javascript
SpotManageApi.deleteSpot(spotId)
```

**参数说明:**
- `spotId` (String): 景点ID

**使用示例:**
```javascript
const result = await SpotManageApi.deleteSpot("spot_123456")
if (result.success) {
  wx.showToast({
    title: '景点删除成功',
    icon: 'success'
  })
}
```

### 4. 获取景点详情 (getSpot)
获取指定景点的详细信息

**方法签名:**
```javascript
SpotManageApi.getSpot(spotId)
```

**返回结果:**
```javascript
{
  success: true,
  data: {
    _id: "spot_123456",
    name: "黄山风景区",
    location: {
      address: "安徽省黄山市黄山风景区",
      geopoint: {
        latitude: 30.134,
        longitude: 118.156
      }
    },
    description: "黄山是中国著名的风景名胜区...",
    price: 190,
    rating: 4.8,
    opening_time: "06:00",
    closing_time: "18:00",
    contact_phone: "0559-5561111",
    website: "http://www.huangshan.com.cn",
    images: ["cloud://xxx", "cloud://yyy"],
    tags: ["自然风光", "世界遗产", "名山"],
    facilities: ["停车场", "餐厅", "导游服务"],
    status: true,
    create_time: "2025-01-24T10:30:00.000Z",
    update_time: "2025-01-24T10:30:00.000Z"
  },
  message: "获取景点详情成功"
}
```

**使用示例:**
```javascript
const result = await SpotManageApi.getSpot("spot_123456")
if (result.success) {
  this.setData({
    spotDetail: result.data
  })
}
```

### 5. 获取景点列表 (getSpotList)
分页获取景点列表

**方法签名:**
```javascript
SpotManageApi.getSpotList(params)
```

**参数说明:**
```javascript
{
  page: 1,          // 页码 (默认1)
  limit: 10,        // 每页数量 (默认10)
  status: true,     // 状态筛选 (可选)
  keyword: "黄山",   // 关键词搜索 (可选)
  minPrice: 0,      // 最低价格 (可选)
  maxPrice: 1000,   // 最高价格 (可选)
  minRating: 4.0    // 最低评分 (可选)
}
```

**返回结果:**
```javascript
{
  success: true,
  data: [
    {
      _id: "spot_123456",
      name: "黄山风景区",
      location: {
        address: "安徽省黄山市黄山风景区"
      },
      price: 190,
      rating: 4.8,
      images: ["cloud://xxx"],
      // ...其他字段
    }
    // ...更多景点
  ],
  total: 25,
  message: "获取景点列表成功"
}
```

**使用示例:**
```javascript
// 获取第一页数据
const result = await SpotManageApi.getSpotList({
  page: 1,
  limit: 10,
  status: true
})

if (result.success) {
  this.setData({
    spotList: result.data,
    total: result.total
  })
}

// 搜索景点
const searchResult = await SpotManageApi.getSpotList({
  page: 1,
  limit: 10,
  keyword: "黄山",
  minRating: 4.0
})
```

### 6. 数据验证 (validateSpotData)
验证景点数据格式是否正确

**方法签名:**
```javascript
SpotManageApi.validateSpotData(spotData)
```

**返回结果:**
```javascript
{
  isValid: false,
  errors: [
    "景点名称不能为空",
    "景点位置不能为空",
    "评分必须在0-5分之间"
  ]
}
```

**使用示例:**
```javascript
const validation = SpotManageApi.validateSpotData(spotData)
if (!validation.isValid) {
  wx.showModal({
    title: '数据验证失败',
    content: validation.errors.join('\n'),
    showCancel: false
  })
  return
}

// 验证通过，继续提交
const result = await SpotManageApi.addSpot(spotData)
```

## 数据结构说明

### 景点数据模型
```javascript
{
  _id: String,              // 系统生成的唯一ID
  name: String,             // 景点名称 (必填)
  location: {               // 位置信息 (必填)
    address: String,        // 详细地址
    geopoint: {            // 地理坐标
      latitude: Number,     // 纬度
      longitude: Number     // 经度
    }
  },
  description: String,      // 景点描述
  price: Number,           // 门票价格
  rating: Number,          // 评分 (0-5)
  opening_time: String,    // 开放时间 "HH:MM"
  closing_time: String,    // 关闭时间 "HH:MM"
  contact_phone: String,   // 联系电话
  website: String,         // 官方网站
  images: Array,           // 图片数组
  tags: Array,             // 标签数组
  facilities: Array,       // 设施数组
  status: Boolean,         // 状态 (true=启用, false=禁用)
  create_time: Date,       // 创建时间
  update_time: Date        // 更新时间
}
```

## 错误处理

### 常见错误类型
1. **数据验证错误**: 必填字段缺失或格式不正确
2. **网络错误**: 网络连接问题或云函数调用失败
3. **权限错误**: 用户无操作权限
4. **数据不存在**: 查询的景点ID不存在

### 错误处理示例
```javascript
try {
  const result = await SpotManageApi.addSpot(spotData)
  if (result.success) {
    // 成功处理
    console.log('操作成功:', result.message)
  } else {
    // 业务错误处理
    wx.showModal({
      title: '操作失败',
      content: result.message,
      showCancel: false
    })
  }
} catch (error) {
  // 系统错误处理
  console.error('系统错误:', error)
  wx.showToast({
    title: '网络异常，请重试',
    icon: 'error'
  })
}
```

### 6. 搜索景点 (searchSpot)
搜索符合条件的景点信息，支持多种搜索条件和回退机制

**方法签名:**
```javascript
SpotManageApi.searchSpot(searchParams)
```

**参数说明:**
```javascript
{
  keyword: "黄山",                     // 关键词搜索（名称、地址）
  name: "黄山风景区",                   // 景点名称精确匹配
  province: "安徽省",                  // 省份精确匹配
  category_id: "natural_scenery",      // 分类ID精确匹配
  minPrice: 50,                       // 最低价格
  maxPrice: 200,                      // 最高价格
  minRating: 4.0,                     // 最低评分
  maxRating: 5.0,                     // 最高评分
  status: true,                       // 状态筛选
  page: 1,                           // 页码，默认1
  limit: 20,                         // 每页数量，默认20
  sortBy: "rating",                  // 排序字段，默认'createdAt'
  sortOrder: "desc"                  // 排序顺序，默认'desc'
}
```

**返回结果:**
```javascript
{
  success: true,
  data: [
    {
      _id: "spot_123456",
      name: "黄山风景区",
      location: { ... },
      rating: 4.8,
      price: 190,
      // ...其他景点信息
    }
  ],
  total: 15,                         // 总记录数
  page: 1,                          // 当前页码
  limit: 20,                        // 每页数量
  searchType: "keyword_name",        // 搜索方式标识
  searchParams: { ... },            // 实际搜索参数
  message: "搜索成功"
}
```

**使用示例:**
```javascript
// 关键词搜索
const searchResult = await SpotManageApi.searchSpot({
  keyword: "黄山",
  page: 1,
  limit: 10
})

// 多条件筛选搜索
const filterResult = await SpotManageApi.searchSpot({
  province: "安徽省",
  minPrice: 100,
  maxPrice: 300,
  minRating: 4.0,
  sortBy: "rating",
  sortOrder: "desc"
})

// 处理搜索结果
if (searchResult.success) {
  console.log('搜索类型:', searchResult.searchType)
  console.log('找到景点数量:', searchResult.total)
  
  this.setData({
    spotList: searchResult.data,
    total: searchResult.total,
    hasMore: searchResult.page * searchResult.limit < searchResult.total
  })
} else {
  wx.showToast({
    title: searchResult.message,
    icon: 'none'
  })
}
```

### 7. 测试云函数连接 (testConnection)
测试云函数连接状态，用于调试和健康检查

**方法签名:**
```javascript
SpotManageApi.testConnection()
```

**返回结果:**
```javascript
{
  success: true,
  data: {
    status: "healthy",
    timestamp: "2025-05-31T12:00:00.000Z",
    version: "2.1.0",
    sdk: "@cloudbase/node-sdk"
  },
  message: "云函数连接正常"
}
```

**使用示例:**
```javascript
// 测试连接
const connectionTest = await SpotManageApi.testConnection()

if (connectionTest.success) {
  console.log('云函数状态正常')
  console.log('服务版本:', connectionTest.data.version)
} else {
  console.error('云函数连接异常:', connectionTest.message)
  // 可以显示错误提示或使用备用方案
}

// 在应用启动时检测连接
Page({
  async onLoad() {
    // 先测试连接
    const isConnected = await SpotManageApi.testConnection()
    if (!isConnected.success) {
      wx.showModal({
        title: '连接异常',
        content: '服务连接异常，部分功能可能无法使用',
        showCancel: false
      })
    }
    
    // 继续加载数据
    this.loadSpotList()
  }
})
```

## 搜索功能兼容性说明

### 搜索方式自动选择
系统会根据SDK能力自动选择最优搜索方式：

1. **关键词+名称搜索** (`keyword_name`)
   - 当同时提供keyword和name时
   - 使用名称精确匹配作为主要条件

2. **客户端过滤** (`client_filter`)
   - 当使用不兼容的查询条件时
   - 先获取所有数据，然后在客户端过滤

3. **服务端过滤** (`server_filter`)
   - 当使用兼容的简单查询条件时
   - 直接在数据库层面过滤

### 性能优化建议

```javascript
// 1. 防抖搜索，避免频繁请求
let searchTimer = null
function debounceSearch(keyword) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const result = await SpotManageApi.searchSpot({ keyword })
    // 处理搜索结果
  }, 500)
}

// 2. 缓存搜索结果
const searchCache = new Map()
async function cachedSearch(params) {
  const cacheKey = JSON.stringify(params)
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)
  }
  
  const result = await SpotManageApi.searchSpot(params)
  if (result.success) {
    searchCache.set(cacheKey, result)
    // 5分钟后清除缓存
    setTimeout(() => searchCache.delete(cacheKey), 5 * 60 * 1000)
  }
  
  return result
}

// 3. 分页加载优化
async function loadMoreSpots() {
  const currentPage = this.data.currentPage + 1
  const result = await SpotManageApi.searchSpot({
    ...this.data.searchParams,
    page: currentPage
  })
  
  if (result.success) {
    this.setData({
      spotList: [...this.data.spotList, ...result.data],
      currentPage: currentPage,
      hasMore: currentPage * result.limit < result.total
    })
  }
}
```

## 最佳实践

### 1. 数据验证
```javascript
// 提交前先验证数据
const validation = SpotManageApi.validateSpotData(formData)
if (!validation.isValid) {
  wx.showModal({
    title: '请检查输入信息',
    content: validation.errors.join('\n')
  })
  return
}
```

### 2. 加载状态管理
```javascript
// 显示加载状态
wx.showLoading({
  title: '正在加载...'
})

try {
  const result = await SpotManageApi.getSpotList(params)
  // 处理结果
} finally {
  wx.hideLoading()
}
```

### 3. 分页加载
```javascript
// 分页加载景点列表
loadMoreSpots() {
  if (this.data.loading || !this.data.hasMore) return
  
  this.setData({ loading: true })
  
  const params = {
    page: this.data.currentPage + 1,
    limit: 10
  }
  
  SpotManageApi.getSpotList(params).then(result => {
    if (result.success) {
      this.setData({
        spotList: [...this.data.spotList, ...result.data],
        currentPage: params.page,
        hasMore: result.data.length === params.limit,
        loading: false
      })
    }
  })
}
```

### 4. 地理位置选择
```javascript
// 选择地理位置
chooseLocation() {
  wx.chooseLocation({
    success: (res) => {
      this.setData({
        'formData.location.address': res.address,
        'formData.location.geopoint': {
          latitude: res.latitude,
          longitude: res.longitude
        }
      })
    }
  })
}
```

## 云函数配置

确保在 `cloudfunctions/spotManage/index.js` 中正确配置了景点管理功能：

```javascript
// 云函数应支持以下action
const actions = {
  add: '添加景点',
  update: '更新景点', 
  delete: '删除景点',
  get: '获取景点详情',
  list: '获取景点列表',
  search: '搜索景点',        // 新增
  test: '测试连接'           // 新增
}
```

## 注意事项

1. **权限控制**: 确保用户有相应的操作权限
2. **数据完整性**: 添加和更新时要验证数据完整性
3. **性能优化**: 大量数据时使用分页加载
4. **缓存策略**: 对于不经常变动的数据可以考虑本地缓存
5. **图片处理**: 景点图片建议压缩后上传到云存储
6. **SEO优化**: 景点描述要详细且包含关键词

## 版本更新日志

### v2.1.0 (2025-05-31)
- ✅ 新增搜索功能，支持多种搜索条件
- ✅ 新增云函数连接测试功能
- ✅ 支持关键词、分类、价格、评分等多维度搜索
- ✅ 实现搜索方式自动选择和回退机制
- ✅ 添加搜索性能优化建议和缓存策略
- ✅ 兼容@cloudbase/node-sdk的查询限制

### v2.0.0 (2025-01-24)
- ✅ 支持@cloudbase/node-sdk架构
- ✅ 增加数据验证功能
- ✅ 优化错误处理机制
- ✅ 完善API文档和示例

### v1.0.0 (2025-01-20)
- ✅ 基础CRUD功能实现
- ✅ 基于wx-server-sdk

---

**开发团队**: Tourism_Management开发团队  
**文档版本**: v2.1.0  
**最后更新**: 2025-05-31
