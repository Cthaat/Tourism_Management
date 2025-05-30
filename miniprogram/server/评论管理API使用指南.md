# 评论管理API使用指南

## 📋 文件说明

**文件名:** CommentApi.js  
**版本:** 1.0.0  
**创建日期:** 2025-05-30  
**作者:** Tourism_Management开发团队  

## 🎯 功能概述

CommentApi.js 是评论管理的API接口封装文件，提供了完整的评论CRUD操作功能，包括：
- ✅ 添加评论
- ✅ 更新评论  
- ✅ 删除评论
- ✅ 获取单个评论
- ✅ 获取评论列表（分页）
- ✅ 根据景点ID获取评论列表
- ✅ 测试云函数连接
- ✅ 数据验证和格式化

## 📊 数据库字段说明

| 字段名称 | 字段标识 | 数据类型 | 是否必填 | 是否唯一 | 说明 |
|---------|---------|---------|----------|----------|------|
| 评论 | common | 文本/单行文本 | 是 | 否 | 评论内容，最多500字符 |
| 景点ID | spot_id | 数字 | 是 | 否 | 关联的景点ID |
| 评论者OPEN_ID | person | 文本/单行文本 | 是 | 否 | 评论者的微信OpenID |

## 🚀 使用方法

### 1. 引入API文件

```javascript
// 在页面文件中引入
const CommentApi = require('../../server/CommentApi.js')
```

### 2. 添加评论

```javascript
// 添加评论示例
const addComment = async () => {
  const commentData = {
    common: '这个景点真的很不错！',
    spot_id: 1,
    person: 'user_openid_123'
  }

  const result = await CommentApi.addComment(commentData)
  
  if (result.success) {
    console.log('评论添加成功:', result.data)
    wx.showToast({
      title: '评论发布成功',
      icon: 'success'
    })
  } else {
    console.error('评论添加失败:', result.message)
    wx.showToast({
      title: result.message,
      icon: 'error'
    })
  }
}
```

### 3. 获取景点评论列表

```javascript
// 获取景点的所有评论
const loadSpotComments = async (spotId) => {
  const result = await CommentApi.getCommentsBySpot({
    spot_id: spotId,
    page: 1,
    limit: 10
  })

  if (result.success) {
    // 格式化评论数据用于显示
    const formattedComments = CommentApi.formatCommentsForDisplay(result.data)
    
    this.setData({
      comments: formattedComments,
      total: result.total
    })
  } else {
    console.error('获取评论失败:', result.message)
  }
}
```

### 4. 更新评论

```javascript
// 更新评论内容
const updateComment = async (commentId, newContent) => {
  const updateData = {
    _id: commentId,
    common: newContent
  }

  const result = await CommentApi.updateComment(updateData)
  
  if (result.success) {
    wx.showToast({
      title: '评论更新成功',
      icon: 'success'
    })
    // 重新加载评论列表
    loadSpotComments(this.data.currentSpotId)
  } else {
    wx.showToast({
      title: result.message,
      icon: 'error'
    })
  }
}
```

### 5. 删除评论

```javascript
// 删除评论
const deleteComment = async (commentId) => {
  const result = await CommentApi.deleteComment(commentId)
  
  if (result.success) {
    wx.showToast({
      title: '评论删除成功',
      icon: 'success'
    })
    // 重新加载评论列表
    loadSpotComments(this.data.currentSpotId)
  } else {
    wx.showToast({
      title: result.message,
      icon: 'error'
    })
  }
}
```

### 6. 获取评论列表（分页）

```javascript
// 获取所有评论（分页）
const loadAllComments = async (page = 1) => {
  const result = await CommentApi.getCommentList({
    page: page,
    limit: 20
  })

  if (result.success) {
    this.setData({
      comments: result.data,
      total: result.total,
      currentPage: result.page
    })
  }
}
```

### 7. 测试连接

```javascript
// 测试云函数连接
const testConnection = async () => {
  const result = await CommentApi.testConnection()
  
  console.log('连接测试结果:', result)
  
  if (result.success) {
    console.log('云函数连接正常')
  } else {
    console.error('云函数连接失败:', result.message)
  }
}
```

## 🔧 完整页面集成示例

```javascript
// pages/spot-detail/spot-detail.js
const CommentApi = require('../../server/CommentApi.js')

Page({
  data: {
    spotId: 0,
    comments: [],
    commentText: '',
    total: 0,
    loading: false
  },

  onLoad(options) {
    if (options.spotId) {
      this.setData({
        spotId: parseInt(options.spotId)
      })
      this.loadComments()
    }
  },

  // 加载评论列表
  async loadComments() {
    this.setData({ loading: true })
    
    const result = await CommentApi.getCommentsBySpot({
      spot_id: this.data.spotId,
      page: 1,
      limit: 20
    })

    if (result.success) {
      const formattedComments = CommentApi.formatCommentsForDisplay(result.data)
      this.setData({
        comments: formattedComments,
        total: result.total
      })
    } else {
      wx.showToast({
        title: result.message,
        icon: 'error'
      })
    }
    
    this.setData({ loading: false })
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    })
  },

  // 提交评论
  async submitComment() {
    if (!this.data.commentText.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'error'
      })
      return
    }

    const commentData = {
      common: this.data.commentText.trim(),
      spot_id: this.data.spotId,
      person: wx.getStorageSync('openid') || 'anonymous'
    }

    const result = await CommentApi.addComment(commentData)

    if (result.success) {
      wx.showToast({
        title: '评论发布成功',
        icon: 'success'
      })
      
      // 清空输入框并重新加载评论
      this.setData({ commentText: '' })
      this.loadComments()
    } else {
      wx.showToast({
        title: result.message,
        icon: 'error'
      })
    }
  },

  // 删除评论
  async deleteComment(e) {
    const commentId = e.currentTarget.dataset.id
    
    const result = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？'
    })

    if (result.confirm) {
      const deleteResult = await CommentApi.deleteComment(commentId)
      
      if (deleteResult.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        this.loadComments()
      } else {
        wx.showToast({
          title: deleteResult.message,
          icon: 'error'
        })
      }
    }
  }
})
```

## ⚡ API返回数据格式

### 成功响应格式
```javascript
{
  success: true,
  data: {}, // 具体数据
  message: '操作成功',
  // 列表查询额外字段
  total: 100,  // 总数量
  page: 1,     // 当前页码
  limit: 20    // 每页数量
}
```

### 失败响应格式
```javascript
{
  success: false,
  message: '错误信息描述',
  data: null
}
```

### 格式化后的评论数据
```javascript
{
  id: 'comment_id',           // 评论ID
  content: '评论内容',        // 评论内容
  spotId: 1,                  // 景点ID
  author: 'openid',           // 作者OpenID
  createTime: 1234567890,     // 创建时间戳
  updateTime: 1234567890,     // 更新时间戳
  createTimeText: '2小时前',   // 格式化创建时间
  updateTimeText: '1小时前'    // 格式化更新时间
}
```

## 🔍 数据验证规则

1. **评论内容 (common)**
   - 不能为空
   - 必须是字符串类型
   - 长度不能超过500个字符

2. **景点ID (spot_id)**
   - 不能为空
   - 必须是数字类型

3. **评论者 (person)**
   - 不能为空
   - 必须是字符串类型

## 🛠️ 错误处理

API会自动处理以下常见错误：
- 网络连接错误
- 云函数调用失败
- 数据验证失败
- 权限不足
- 数据库操作失败

所有错误都会返回统一格式的错误信息，便于前端处理。

## 📝 注意事项

1. **权限控制**: 确保用户已登录并获取到OpenID
2. **数据验证**: 在调用API前建议先进行基础数据验证
3. **错误处理**: 务必处理API调用的错误情况
4. **性能优化**: 合理使用分页功能，避免一次加载过多数据
5. **用户体验**: 在数据加载时显示loading状态

## 🔄 版本更新日志

### v1.0.0 (2025-05-30)
- ✅ 初始版本发布
- ✅ 实现完整的评论CRUD功能
- ✅ 添加数据验证和格式化
- ✅ 支持分页查询
- ✅ 支持按景点筛选评论
- ✅ 完善错误处理机制
