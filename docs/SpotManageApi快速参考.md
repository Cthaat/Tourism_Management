# SpotManageApi 快速参考

## 📚 方法速查表

| 方法 | 功能 | 参数 | 返回值 |
|------|------|------|--------|
| `addSpot(spotData)` | 添加景点 | 景点数据对象 | `{success, data, message}` |
| `updateSpot(spotData)` | 更新景点 | 包含_id的数据对象 | `{success, data, message}` |
| `deleteSpot(spotId)` | 删除景点 | 景点ID字符串 | `{success, data, message}` |
| `getSpot(spotId)` | 获取单个景点 | 景点ID字符串 | `{success, data, message}` |
| `getSpotList(params)` | 获取景点列表 | 分页参数对象 | `{success, data, total, message}` |
| `searchSpot(searchParams)` 🆕 | 搜索景点 | 搜索条件对象 | `{success, data, total, page, limit, searchType, message}` |
| `testConnection()` 🆕 | 测试连接 | 无 | `{success, data, message}` |
| `validateSpotData(spotData)` | 验证数据 | 景点数据对象 | `{isValid, errors}` |

## 🔍 搜索功能快速参考

### 搜索参数

```javascript
{
  // 基础搜索
  keyword: String,      // 关键词（名称+地址）
  name: String,         // 名称精确匹配
  province: String,     // 省份精确匹配
  category_id: String,  // 分类精确匹配
  
  // 范围搜索
  minPrice: Number,     // 最低价格
  maxPrice: Number,     // 最高价格
  minRating: Number,    // 最低评分
  maxRating: Number,    // 最高评分
  status: Boolean,      // 状态筛选
  
  // 分页排序
  page: Number,         // 页码（默认1）
  limit: Number,        // 每页数量（默认20）
  sortBy: String,       // 排序字段（默认'createdAt'）
  sortOrder: String     // 排序顺序（默认'desc'）
}
```

### 搜索方式标识

- `keyword_name`: 服务端名称搜索
- `client_filter`: 客户端过滤搜索
- `server_filter`: 服务端条件搜索

## 💡 常用代码片段

### 1. 基础CRUD操作

```javascript
// 引入API
const SpotManageApi = require('../../server/SpotManageApi')

// 添加景点
const addSpot = async (spotData) => {
  const result = await SpotManageApi.addSpot(spotData)
  if (result.success) {
    wx.showToast({ title: '添加成功', icon: 'success' })
    return result.data
  } else {
    wx.showToast({ title: result.message, icon: 'error' })
    return null
  }
}

// 获取列表
const getSpotList = async (page = 1) => {
  const result = await SpotManageApi.getSpotList({ page, limit: 20 })
  return result.success ? result.data : []
}

// 搜索景点
const searchSpots = async (keyword) => {
  const result = await SpotManageApi.searchSpot({ keyword })
  console.log('搜索方式:', result.searchType)
  return result.success ? result.data : []
}
```

### 2. 数据验证

```javascript
const submitSpot = async (spotData) => {
  // 验证数据
  const validation = SpotManageApi.validateSpotData(spotData)
  if (!validation.isValid) {
    wx.showModal({
      title: '数据验证失败',
      content: validation.errors.join('\n')
    })
    return
  }
  
  // 提交数据
  const result = await SpotManageApi.addSpot(spotData)
  // 处理结果...
}
```

### 3. 错误处理

```javascript
const handleApiCall = async (apiCall) => {
  try {
    const result = await apiCall()
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    wx.showToast({
      title: error.message || '操作失败',
      icon: 'error'
    })
    console.error('API调用失败:', error)
    return null
  }
}
```

### 4. 分页加载

```javascript
Page({
  data: {
    spotList: [],
    currentPage: 1,
    hasMore: true
  },
  
  async loadSpotList(reset = false) {
    if (reset) {
      this.setData({ currentPage: 1, spotList: [] })
    }
    
    const result = await SpotManageApi.getSpotList({
      page: this.data.currentPage,
      limit: 20
    })
    
    if (result.success) {
      const newList = reset ? result.data : [...this.data.spotList, ...result.data]
      this.setData({
        spotList: newList,
        currentPage: this.data.currentPage + 1,
        hasMore: result.data.length === 20
      })
    }
  }
})
```

### 5. 搜索功能集成

```javascript
Page({
  data: {
    searchKeyword: '',
    searchResults: [],
    searchLoading: false
  },
  
  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.debounceSearch()
  },
  
  // 防抖搜索
  debounceSearch() {
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.performSearch()
    }, 500)
  },
  
  // 执行搜索
  async performSearch() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      this.setData({ searchResults: [] })
      return
    }
    
    this.setData({ searchLoading: true })
    
    const result = await SpotManageApi.searchSpot({
      keyword,
      page: 1,
      limit: 20,
      status: true
    })
    
    this.setData({
      searchResults: result.success ? result.data : [],
      searchLoading: false
    })
    
    console.log('搜索方式:', result.searchType)
  }
})
```

## 🎯 最佳实践

### 1. 性能优化
- 使用精确匹配条件优于关键词搜索
- 合理设置分页大小（建议10-20条）
- 对频繁访问的数据进行缓存

### 2. 用户体验
- 添加加载状态提示
- 实现防抖搜索避免频繁请求
- 提供清晰的错误提示信息

### 3. 数据安全
- 提交前进行客户端数据验证
- 处理所有可能的错误情况
- 记录关键操作日志

### 4. 兼容性
- 所有方法都返回统一的数据格式
- 向后兼容原有数据结构
- 支持渐进式功能升级

## 🔧 调试技巧

### 1. 连接测试
```javascript
// 检查云函数连接状态
const checkConnection = async () => {
  const result = await SpotManageApi.testConnection()
  console.log('连接状态:', result)
}
```

### 2. 搜索调试
```javascript
// 查看搜索方式和参数
const debugSearch = async (params) => {
  const result = await SpotManageApi.searchSpot(params)
  console.log('搜索参数:', result.searchParams)
  console.log('搜索方式:', result.searchType)
  console.log('结果数量:', result.data.length)
}
```

### 3. 数据验证调试
```javascript
// 检查数据验证结果
const debugValidation = (spotData) => {
  const validation = SpotManageApi.validateSpotData(spotData)
  console.log('验证结果:', validation.isValid)
  if (!validation.isValid) {
    console.log('验证错误:', validation.errors)
  }
}
```

## 📋 更新检查清单

使用新版本API时，请检查：
- [ ] 引入路径是否正确
- [ ] 云函数是否已部署最新版本
- [ ] 数据库集合权限是否正确设置
- [ ] 新增搜索功能是否按预期工作
- [ ] 错误处理是否完善
- [ ] 是否有兼容性问题

---

**版本**: 2.1.0 | **更新**: 2025-05-31 | **兼容**: @cloudbase/node-sdk
