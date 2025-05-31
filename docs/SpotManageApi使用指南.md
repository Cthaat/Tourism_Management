# SpotManageApi 使用指南

## 文档信息

- **版本**: 2.1.0 (完整功能版本)
- **更新日期**: 2025年5月31日
- **兼容性**: 支持 @cloudbase/node-sdk 数据模型

## 功能概述

SpotManageApi 是一个完整的景点管理API封装类，提供了景点的增删改查、搜索和连接测试功能。

## 快速开始

### 引入API

```javascript
// 在页面中引入API
const SpotManageApi = require('../../server/SpotManageApi')
```

### 基础用法

```javascript
// 添加景点
const addResult = await SpotManageApi.addSpot(spotData)

// 获取景点列表
const listResult = await SpotManageApi.getSpotList({ page: 1, limit: 20 })

// 搜索景点
const searchResult = await SpotManageApi.searchSpot({ keyword: '北京' })
```

## API 方法详解

### 1. addSpot(spotData) - 添加景点

**功能**: 添加新的景点到数据库

**参数**:
```javascript
{
  name: String,           // 景点名称（必填）
  description: String,    // 景点描述
  location: {             // 位置信息（必填）
    address: String,      // 详细地址
    geopoint: {           // 地理坐标
      type: 'Point',
      coordinates: [longitude, latitude]
    }
  },
  category_id: String,    // 分类ID
  province: String,       // 省份
  phone: String,          // 联系电话
  website: String,        // 官网地址
  price: Number,          // 门票价格
  rating: Number,         // 评分 (0-5)
  opening_time: Number,   // 开放时间
  closing_time: Number,   // 关闭时间
  best_season: Number,    // 最佳季节
  status: Boolean         // 状态
}
```

**返回值**:
```javascript
{
  success: Boolean,       // 操作是否成功
  data: Object,          // 返回的景点数据
  message: String        // 操作结果消息
}
```

**使用示例**:
```javascript
const spotData = {
  name: '天安门广场',
  description: '中华人民共和国的象征',
  location: {
    address: '北京市东城区天安门广场',
    geopoint: {
      type: 'Point',
      coordinates: [116.404, 39.915]
    }
  },
  category_id: '1',
  province: '北京',
  price: 0,
  rating: 4.8
}

const result = await SpotManageApi.addSpot(spotData)
if (result.success) {
  console.log('景点添加成功:', result.data)
} else {
  console.error('添加失败:', result.message)
}
```

### 2. updateSpot(spotData) - 更新景点

**功能**: 更新已存在的景点信息

**参数**: 包含 `_id` 字段的景点数据对象

**使用示例**:
```javascript
const updateData = {
  _id: 'spot-id-here',
  name: '更新后的景点名称',
  price: 50
}

const result = await SpotManageApi.updateSpot(updateData)
```

### 3. deleteSpot(spotId) - 删除景点

**功能**: 删除指定ID的景点

**参数**: `spotId` (String) - 景点ID

**使用示例**:
```javascript
const result = await SpotManageApi.deleteSpot('spot-id-here')
```

### 4. getSpot(spotId) - 获取单个景点

**功能**: 获取指定ID的景点详情

**参数**: `spotId` (String) - 景点ID

**使用示例**:
```javascript
const result = await SpotManageApi.getSpot('spot-id-here')
if (result.success) {
  const spotDetail = result.data
}
```

### 5. getSpotList(params) - 获取景点列表

**功能**: 分页获取景点列表

**参数**:
```javascript
{
  page: Number,          // 页码，默认1
  limit: Number,         // 每页数量，默认20
  status: Boolean        // 状态筛选，可选
}
```

**返回值**:
```javascript
{
  success: Boolean,
  data: Array,           // 景点列表
  total: Number,         // 总记录数
  message: String
}
```

**使用示例**:
```javascript
// 获取第一页的20条数据
const result = await SpotManageApi.getSpotList({
  page: 1,
  limit: 20,
  status: true  // 只获取启用状态的景点
})

if (result.success) {
  const spots = result.data
  const totalCount = result.total
}
```

### 6. searchSpot(searchParams) - 搜索景点 🆕

**功能**: 根据多种条件搜索景点

**参数**:
```javascript
{
  keyword: String,       // 关键词搜索（名称、地址）
  name: String,          // 景点名称精确匹配
  province: String,      // 省份精确匹配
  category_id: String,   // 分类ID精确匹配
  minPrice: Number,      // 最低价格
  maxPrice: Number,      // 最高价格
  minRating: Number,     // 最低评分
  maxRating: Number,     // 最高评分
  status: Boolean,       // 状态筛选
  page: Number,          // 页码，默认1
  limit: Number,         // 每页数量，默认20
  sortBy: String,        // 排序字段，默认'createdAt'
  sortOrder: String      // 排序顺序，默认'desc'
}
```

**返回值**:
```javascript
{
  success: Boolean,
  data: Array,           // 搜索结果
  total: Number,         // 总记录数
  page: Number,          // 当前页码
  limit: Number,         // 每页数量
  searchType: String,    // 搜索方式标识
  searchParams: Object,  // 实际使用的搜索参数
  message: String
}
```

**使用示例**:

```javascript
// 关键词搜索
const keywordSearch = await SpotManageApi.searchSpot({
  keyword: '北京',
  page: 1,
  limit: 10
})

// 组合条件搜索
const advancedSearch = await SpotManageApi.searchSpot({
  province: '北京',
  minPrice: 0,
  maxPrice: 100,
  minRating: 4.0,
  status: true,
  sortBy: 'rating',
  sortOrder: 'desc'
})

// 价格范围搜索
const priceSearch = await SpotManageApi.searchSpot({
  minPrice: 50,
  maxPrice: 200,
  sortBy: 'price',
  sortOrder: 'asc'
})
```

### 7. testConnection() - 测试连接 🆕

**功能**: 测试云函数连接状态

**参数**: 无

**返回值**:
```javascript
{
  success: Boolean,
  data: {
    openid: String,
    timestamp: Number,
    dbConnected: Boolean,
    collectionExists: Boolean,
    existingRecords: Number
  },
  message: String
}
```

**使用示例**:
```javascript
const testResult = await SpotManageApi.testConnection()
if (testResult.success) {
  console.log('连接正常:', testResult.data)
} else {
  console.error('连接失败:', testResult.message)
}
```

## 搜索功能详解

### 搜索方式

SpotManageApi 的搜索功能支持多种搜索方式，会根据返回的 `searchType` 字段标识：

- `keyword_name`: 服务端名称搜索成功
- `client_filter`: 客户端过滤搜索
- `server_filter`: 服务端条件搜索

### 推荐用法

1. **精确条件搜索**（性能最佳）:
```javascript
const result = await SpotManageApi.searchSpot({
  province: '北京',
  category_id: '1',
  status: true
})
```

2. **范围搜索**:
```javascript
const result = await SpotManageApi.searchSpot({
  minPrice: 100,
  maxPrice: 500,
  minRating: 4.0
})
```

3. **关键词搜索**（有回退机制）:
```javascript
const result = await SpotManageApi.searchSpot({
  keyword: '博物馆'
})
```

### 搜索结果处理

```javascript
const handleSearchResult = async (searchParams) => {
  const result = await SpotManageApi.searchSpot(searchParams)
  
  if (result.success) {
    console.log(`搜索方式: ${result.searchType}`)
    console.log(`找到 ${result.total} 条结果`)
    console.log(`当前第 ${result.page} 页，共 ${result.data.length} 条`)
    
    // 处理搜索结果
    result.data.forEach(spot => {
      console.log(`景点: ${spot.name}, 价格: ${spot.price}`)
    })
  } else {
    console.error('搜索失败:', result.message)
  }
}
```

## 数据验证

### validateSpotData(spotData) - 验证景点数据

**功能**: 在提交前验证景点数据的完整性和有效性

**使用示例**:
```javascript
const validation = SpotManageApi.validateSpotData(spotData)
if (validation.isValid) {
  // 数据有效，可以提交
  const result = await SpotManageApi.addSpot(spotData)
} else {
  // 显示验证错误
  validation.errors.forEach(error => {
    console.error('验证错误:', error)
  })
}
```

## 错误处理

所有API方法都返回统一的错误格式：

```javascript
{
  success: false,
  message: String  // 错误描述
}
```

### 常见错误类型

1. **网络请求失败**: `网络请求失败`
2. **权限错误**: `没有数据库操作权限，请检查云开发权限设置`
3. **集合不存在**: `tourism_spot 集合不存在，请在云开发控制台创建此集合`
4. **数据验证失败**: `数据验证失败: [具体错误信息]`
5. **景点不存在**: `景点ID不能为空` 或 `获取景点失败`

### 错误处理最佳实践

```javascript
const handleApiCall = async () => {
  try {
    const result = await SpotManageApi.addSpot(spotData)
    
    if (result.success) {
      // 成功处理
      wx.showToast({
        title: result.message,
        icon: 'success'
      })
    } else {
      // 业务错误处理
      wx.showToast({
        title: result.message,
        icon: 'error'
      })
    }
  } catch (error) {
    // 网络错误处理
    console.error('API调用异常:', error)
    wx.showToast({
      title: '网络异常，请重试',
      icon: 'error'
    })
  }
}
```

## 性能优化建议

1. **搜索优化**:
   - 优先使用精确匹配条件（province、category_id）
   - 合理设置分页参数
   - 组合多个条件缩小搜索范围

2. **缓存策略**:
   - 对景点列表进行本地缓存
   - 定期刷新缓存数据

3. **数据加载**:
   - 使用分页加载大量数据
   - 实现下拉刷新和上拉加载

## 兼容性说明

- ✅ 完全兼容原有的 wx-server-sdk 接口
- ✅ 支持新的 @cloudbase/node-sdk 数据模型  
- ✅ 前端调用方式无需修改
- ✅ 支持多种搜索方式和回退机制
- ✅ 向后兼容已有的景点数据结构

## 更新日志

### v2.1.0 (2025-05-31)
- ✨ 新增 `searchSpot()` 搜索功能
- ✨ 新增 `testConnection()` 连接测试功能
- 🔧 优化错误处理和日志记录
- 📚 完善API文档和使用示例

### v2.0.0 (2025-05-26)
- 🔄 适配 @cloudbase/node-sdk 数据模型
- 🔧 重构云函数调用逻辑
- 📝 更新文档和注释

### v1.0.0 (2025-05-25)
- 🎉 初始版本发布
- ✅ 基础CRUD功能实现
