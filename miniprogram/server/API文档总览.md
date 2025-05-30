# 旅游管理微信小程序API文档总览

## 📚 文档索引

本项目为旅游管理微信小程序提供了完整的后端API支持，包含评论管理、景点管理、用户系统、图片处理等核心功能模块。

---

## 🏗️ 核心API模块

### 1. 评论管理API (`CommentApi.js`)
**功能**: 景点评论的完整CRUD操作，支持评分、回复、审核等功能

**主要方法**:
- `addComment()` - 添加评论
- `updateComment()` - 更新评论  
- `deleteComment()` - 删除评论
- `getComment()` - 获取单条评论
- `listComments()` - 获取评论列表
- `listCommentsBySpot()` - 获取景点评论
- `testConnection()` - 测试连接

**文档链接**: 
- [📖 评论管理API使用指南](./评论管理API使用指南.md)
- [⚡ 评论功能快速集成指南](./评论功能快速集成指南.md)

---

### 2. 景点管理API (`SpotManageApi.js`)
**功能**: 景点信息的完整管理，包含基础信息、位置服务、状态管理等

**主要方法**:
- `addSpot()` - 添加景点
- `updateSpot()` - 更新景点信息
- `deleteSpot()` - 删除景点
- `getSpot()` - 获取景点详情
- `getSpotList()` - 获取景点列表
- `searchSpots()` - 搜索景点
- `getSpotsByLocation()` - 按位置查询景点

**文档链接**:
- [📖 景点管理API使用指南](./景点管理API使用指南.md)
- [⚡ 景点管理功能快速集成指南](./景点管理功能快速集成指南.md)

---

### 3. 用户登录API (`UserLoginApi.js`)
**功能**: 用户认证与登录管理，支持微信登录和本地fallback

**主要方法**:
- `login()` - 用户登录
- `getUserInfo()` - 获取用户信息
- `updateUserSession()` - 更新会话
- `logout()` - 用户登出
- `checkLoginStatus()` - 检查登录状态

**文档链接**:
- [📖 用户登录API使用指南](./用户登录API使用指南.md)

---

### 4. 用户资料API (`UserUpdate.js`)
**功能**: 用户资料管理，包含个人信息更新、头像上传等

**主要方法**:
- `updateUserProfile()` - 更新用户资料
- `uploadAvatar()` - 上传用户头像
- `getUserProfile()` - 获取用户资料
- `deleteUserData()` - 删除用户数据

**文档链接**:
- [📖 用户资料更新API使用指南](./用户资料更新API使用指南.md)

---

### 5. 图片管理API (`ImageApi.js`)
**功能**: 统一的图片上传、存储、查询和删除功能，专为景点轮播图设计

**主要方法**:
- `uploadSpotImages()` - 上传景点图片
- `getSpotImages()` - 获取景点轮播图
- `deleteImage()` - 删除图片
- `getSpotMainImage()` - 获取景点主图
- `preloadSpotImages()` - 批量预加载图片
- `validateImageFile()` - 图片文件验证

**文档链接**:
- [📖 图片管理API使用指南](./图片管理API使用指南.md)
- [⚡ 图片管理功能快速集成指南](./图片管理功能快速集成指南.md)

---

## 🔧 云函数支持

### 主要云函数

1. **commonManager** - 通用数据管理
   - 支持景点数据的CRUD操作
   - 评论数据管理
   - 统计查询功能

2. **uploadPicture** - 图片处理专用
   - 图片记录保存
   - 云存储文件删除
   - 景点图片查询

3. **userLogin** - 用户认证
   - 微信登录处理
   - 用户信息管理

4. **updateProfile** - 用户资料更新
   - 个人信息更新
   - 头像上传处理

---

## 📋 数据库集合

### 主要数据表

1. **spot_common** - 景点信息表
   - 基础信息: 名称、描述、位置
   - 扩展信息: 开放时间、门票价格
   - 状态管理: 审核状态、可见性

2. **comment_common** - 评论数据表
   - 评论内容和评分
   - 用户关联信息
   - 审核状态管理

3. **image_common** - 图片记录表
   - 图片URL和文件ID
   - 关联景点信息
   - 上传时间记录

4. **user_profiles** - 用户资料表
   - 基础信息和偏好设置
   - 头像和联系方式
   - 隐私设置

---

## 🚀 快速开始

### 1. 基础配置

```javascript
// 在app.js中初始化云开发
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id',  // 替换为你的云环境ID
        traceUser: true
      })
    }
  }
})
```

### 2. 导入API模块

```javascript
// 在页面中导入需要的API
const CommentApi = require('../../server/CommentApi.js')
const SpotManageApi = require('../../server/SpotManageApi.js')
const ImageApi = require('../../server/ImageApi.js')
const UserLoginApi = require('../../server/UserLoginApi.js')
```

### 3. 基本使用示例

```javascript
Page({
  async onLoad() {
    try {
      // 检查登录状态
      const isLoggedIn = await UserLoginApi.checkLoginStatus()
      
      if (!isLoggedIn) {
        // 执行登录
        await UserLoginApi.login()
      }
      
      // 加载景点列表
      const spots = await SpotManageApi.getSpotList()
      
      // 为每个景点加载主图
      for (const spot of spots) {
        spot.mainImage = await ImageApi.getSpotMainImage(spot.id)
      }
      
      this.setData({ spotList: spots })
    } catch (error) {
      console.error('初始化失败:', error)
    }
  }
})
```

---

## 🔍 使用建议

### 1. 开发流程建议

1. **阅读对应API的使用指南** - 了解完整功能和参数
2. **查看快速集成指南** - 获取完整的页面实现示例
3. **参考测试代码** - 了解最佳实践和错误处理
4. **进行功能测试** - 使用提供的测试方法验证集成

### 2. 错误处理模式

```javascript
try {
  const result = await SomeApi.someMethod(params)
  if (result.success) {
    // 处理成功结果
  } else {
    // 处理业务失败
    wx.showToast({ title: result.message, icon: 'none' })
  }
} catch (error) {
  // 处理异常错误
  console.error('操作失败:', error)
  wx.showToast({ title: '操作失败，请重试', icon: 'none' })
}
```

### 3. 性能优化建议

- **并发控制**: 大量数据操作时使用并发限制
- **缓存策略**: 合理缓存常用数据减少网络请求
- **懒加载**: 列表页面使用图片懒加载
- **数据分页**: 大量数据使用分页加载

---

## 📞 技术支持

### 常见问题

1. **云函数调用失败**
   - 检查云函数是否正确部署
   - 确认云环境ID配置正确
   - 查看网络连接状态

2. **数据库操作异常**
   - 确认数据库权限配置
   - 检查数据格式是否正确
   - 验证必需字段是否完整

3. **图片上传失败**
   - 检查文件大小和格式
   - 确认云存储权限设置
   - 验证网络连接稳定性

### 调试技巧

```javascript
// 启用详细日志
console.log('=== API调用开始 ===')
const result = await SomeApi.someMethod(params)
console.log('=== API调用结果 ===', result)

// 测试连接状态
const connectionTest = await SomeApi.testConnection()
console.log('连接测试:', connectionTest)
```

---

## 📝 更新日志

- **v2.0.0** (2025-05-27): 完成所有核心API模块，提供完整文档
- **v1.5.0** (2025-05-26): 添加图片管理功能，优化用户体验
- **v1.0.0** (2025-05-25): 初始版本，提供基础API功能

---

**项目作者**: 高级中国全栈工程师  
**文档更新**: 2025年5月27日  
**技术栈**: 微信小程序 + 云开发 + JavaScript

如需更详细的使用说明，请查看各个API的专门文档。
