# 用户资料更新API使用指南

## 概述
UserUpdate.js 是旅游管理微信小程序的用户资料管理模块，提供了用户资料更新、头像上传、文件上传等功能。该API与云函数配合，实现了完整的用户信息管理系统。

## 功能特性
- ✅ 用户资料更新
- ✅ 头像上传和更新
- ✅ 文件上传到云存储
- ✅ 用户资料获取
- ✅ 本地存储同步
- ✅ 字段名兼容处理
- ✅ 详细的错误处理和日志记录

## API列表

### 1. 上传文件 (uploadFile)
将本地文件上传到云存储

**方法签名:**
```javascript
uploadFile(params)
```

**参数说明:**
```javascript
{
  filePath: "/temp/wx123456.jpg",       // 本地文件路径 (必填)
  cloudPath: "user_files/avatar.jpg"   // 云端存储路径 (可选)
}
```

**返回结果:**
```javascript
{
  success: true,
  message: "文件上传成功",
  fileID: "cloud://tourism-management.123456/user_files/avatar.jpg"
}
```

**使用示例:**
```javascript
// 在页面中引入API
const UserUpdate = require('../../server/UserUpdate')

// 选择并上传文件
async function uploadUserFile() {
  try {
    // 1. 选择文件
    const chooseResult = await wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera']
    })
    
    // 2. 上传文件
    const uploadResult = await UserUpdate.uploadFile({
      filePath: chooseResult.tempFilePaths[0],
      cloudPath: `user_files/${Date.now()}.jpg`
    })
    
    if (uploadResult.success) {
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
      console.log('文件ID:', uploadResult.fileID)
    } else {
      wx.showToast({
        title: uploadResult.message,
        icon: 'error'
      })
    }
  } catch (error) {
    console.error('文件上传失败:', error)
  }
}
```

### 2. 上传头像 (uploadAvatar)
专门用于上传和更新用户头像

**方法签名:**
```javascript
uploadAvatar(params)
```

**参数说明:**
```javascript
{
  filePath: "/temp/wx123456.jpg"        // 本地头像文件路径 (必填)
}
```

**返回结果:**
```javascript
{
  success: true,
  message: "头像更新操作完成",
  userInfo: {
    _id: "user_123456",
    nickname: "用户昵称",
    avatar_url: "cloud://tourism-management.123456/avatars/1642857890123.jpg",
    avatarUrl: "cloud://tourism-management.123456/avatars/1642857890123.jpg",
    // ...其他用户信息
  },
  fileID: "cloud://tourism-management.123456/avatars/1642857890123.jpg"
}
```

**使用示例:**
```javascript
// 选择并上传头像
async function updateUserAvatar() {
  try {
    // 1. 选择头像
    const chooseResult = await wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'] // 压缩图片
    })
    
    // 显示上传进度
    wx.showLoading({
      title: '上传头像中...'
    })
    
    // 2. 上传头像
    const result = await UserUpdate.uploadAvatar({
      filePath: chooseResult.tempFilePaths[0]
    })
    
    wx.hideLoading()
    
    if (result.success) {
      // 3. 更新页面显示
      this.setData({
        'userInfo.avatarUrl': result.userInfo.avatarUrl
      })
      
      wx.showToast({
        title: '头像更新成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: result.message,
        icon: 'error'
      })
    }
  } catch (error) {
    wx.hideLoading()
    console.error('头像上传失败:', error)
    wx.showToast({
      title: '头像上传失败',
      icon: 'error'
    })
  }
}
```

### 3. 更新用户资料 (updateUserProfile)
更新用户的个人资料信息

**方法签名:**
```javascript
updateUserProfile(data)
```

**参数说明:**
```javascript
{
  nickname: "新昵称",                   // 用户昵称
  nickName: "新昵称",                   // 微信昵称格式（会自动同步）
  avatar_url: "cloud://xxx/avatar.jpg", // 头像URL
  avatarUrl: "cloud://xxx/avatar.jpg",  // 前端头像格式（会自动同步）
  gender: 1,                           // 性别 0未知 1男 2女
  birthday: "1990-01-01",              // 生日
  phone: "13800138000",                // 手机号
  email: "user@example.com",           // 邮箱
  location: "广东省深圳市",             // 位置
  signature: "这是我的个性签名",         // 个性签名
  interests: ["旅游", "摄影", "美食"],   // 兴趣爱好
  occupation: "软件工程师",             // 职业
  company: "某科技公司"                 // 公司
}
```

**返回结果:**
```javascript
{
  success: true,
  message: "用户资料更新操作完成",
  userInfo: {
    _id: "user_123456",
    nickname: "新昵称",
    nickName: "新昵称",
    avatar_url: "cloud://xxx/avatar.jpg",
    avatarUrl: "cloud://xxx/avatar.jpg",
    gender: 1,
    birthday: "1990-01-01",
    phone: "13800138000",
    email: "user@example.com",
    location: "广东省深圳市",
    signature: "这是我的个性签名",
    interests: ["旅游", "摄影", "美食"],
    occupation: "软件工程师",
    company: "某科技公司",
    updated_at: "2025-01-24T10:30:00.000Z"
  }
}
```

**使用示例:**
```javascript
// 更新用户资料
async function saveUserProfile() {
  const formData = this.data.formData
  
  // 数据验证
  if (!formData.nickname || !formData.nickname.trim()) {
    wx.showToast({
      title: '请输入昵称',
      icon: 'error'
    })
    return
  }
  
  wx.showLoading({
    title: '保存中...'
  })
  
  try {
    const result = await UserUpdate.updateUserProfile(formData)
    
    wx.hideLoading()
    
    if (result.success) {
      // 更新页面数据
      this.setData({
        userInfo: result.userInfo
      })
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: result.message,
        icon: 'error'
      })
    }
  } catch (error) {
    wx.hideLoading()
    console.error('保存失败:', error)
    wx.showToast({
      title: '保存失败',
      icon: 'error'
    })
  }
}
```

### 4. 获取用户资料 (getUserProfile)
获取用户的详细资料信息

**方法签名:**
```javascript
getUserProfile(params)
```

**参数说明:**
```javascript
{
  account: "user123",                   // 用户账号 (可选)
  _id: "user_123456"                   // 用户ID (可选)
}
```

**返回结果:**
```javascript
{
  success: true,
  message: "获取用户资料操作完成",
  userInfo: {
    _id: "user_123456",
    account: "user123",
    nickname: "用户昵称",
    avatar_url: "cloud://xxx/avatar.jpg",
    gender: 1,
    birthday: "1990-01-01",
    phone: "13800138000",
    email: "user@example.com",
    location: "广东省深圳市",
    signature: "这是我的个性签名",
    interests: ["旅游", "摄影", "美食"],
    occupation: "软件工程师",
    company: "某科技公司",
    created_at: "2025-01-20T10:30:00.000Z",
    updated_at: "2025-01-24T10:30:00.000Z",
    last_login_time: "2025-01-24T08:30:00.000Z"
  }
}
```

**使用示例:**
```javascript
// 获取用户资料
async function loadUserProfile() {
  try {
    const result = await UserUpdate.getUserProfile()
    
    if (result.success) {
      this.setData({
        userInfo: result.userInfo,
        formData: {
          nickname: result.userInfo.nickname || '',
          gender: result.userInfo.gender || 0,
          birthday: result.userInfo.birthday || '',
          phone: result.userInfo.phone || '',
          email: result.userInfo.email || '',
          location: result.userInfo.location || '',
          signature: result.userInfo.signature || '',
          occupation: result.userInfo.occupation || '',
          company: result.userInfo.company || ''
        }
      })
    } else {
      wx.showToast({
        title: result.message,
        icon: 'error'
      })
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
  }
}
```

## 完整页面示例

### 编辑资料页面 (editProfile.js)
```javascript
const UserUpdate = require('../../server/UserUpdate')

Page({
  data: {
    userInfo: {},
    formData: {
      nickname: '',
      gender: 0,
      birthday: '',
      phone: '',
      email: '',
      location: '',
      signature: '',
      occupation: '',
      company: '',
      interests: []
    },
    genderOptions: [
      { value: 0, label: '保密' },
      { value: 1, label: '男' },
      { value: 2, label: '女' }
    ],
    interestOptions: [
      '旅游', '摄影', '美食', '运动', '音乐', 
      '电影', '读书', '游戏', '购物', '其他'
    ],
    isSubmitting: false
  },

  onLoad() {
    this.loadUserProfile()
  },

  // 加载用户资料
  async loadUserProfile() {
    try {
      const result = await UserUpdate.getUserProfile()
      
      if (result.success) {
        const userInfo = result.userInfo
        this.setData({
          userInfo: userInfo,
          formData: {
            nickname: userInfo.nickname || userInfo.nickName || '',
            gender: userInfo.gender || 0,
            birthday: userInfo.birthday || '',
            phone: userInfo.phone || '',
            email: userInfo.email || '',
            location: userInfo.location || '',
            signature: userInfo.signature || '',
            occupation: userInfo.occupation || '',
            company: userInfo.company || '',
            interests: userInfo.interests || []
          }
        })
      }
    } catch (error) {
      console.error('加载用户资料失败:', error)
    }
  },

  // 输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.birthday': e.detail.value
    })
  },

  // 性别选择
  onGenderChange(e) {
    this.setData({
      'formData.gender': parseInt(e.detail.value)
    })
  },

  // 兴趣选择
  onInterestChange(e) {
    const { value } = e.currentTarget.dataset
    const interests = this.data.formData.interests
    const index = interests.indexOf(value)
    
    if (index > -1) {
      interests.splice(index, 1)
    } else {
      interests.push(value)
    }
    
    this.setData({
      'formData.interests': interests
    })
  },

  // 更换头像
  async changeAvatar() {
    try {
      const chooseResult = await wx.chooseImage({
        count: 1,
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })
      
      wx.showLoading({
        title: '上传头像中...'
      })
      
      const result = await UserUpdate.uploadAvatar({
        filePath: chooseResult.tempFilePaths[0]
      })
      
      wx.hideLoading()
      
      if (result.success) {
        this.setData({
          'userInfo.avatarUrl': result.userInfo.avatarUrl
        })
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.message,
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('头像上传失败:', error)
    }
  },

  // 保存资料
  async saveProfile() {
    if (this.data.isSubmitting) return
    
    // 验证必填字段
    if (!this.data.formData.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'error'
      })
      return
    }
    
    // 验证邮箱格式
    if (this.data.formData.email && !this.validateEmail(this.data.formData.email)) {
      wx.showToast({
        title: '邮箱格式不正确',
        icon: 'error'
      })
      return
    }
    
    // 验证手机号格式
    if (this.data.formData.phone && !this.validatePhone(this.data.formData.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'error'
      })
      return
    }
    
    this.setData({ isSubmitting: true })
    
    wx.showLoading({
      title: '保存中...'
    })
    
    try {
      const result = await UserUpdate.updateUserProfile(this.data.formData)
      
      wx.hideLoading()
      
      if (result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.message,
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  // 验证邮箱格式
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  },

  // 验证手机号格式
  validatePhone(phone) {
    const re = /^1[3-9]\d{9}$/
    return re.test(phone)
  }
})
```

### 编辑资料页面模板 (editProfile.wxml)
```xml
<view class="container">
  <!-- 头像部分 -->
  <view class="avatar-section">
    <view class="avatar-wrapper" bindtap="changeAvatar">
      <image 
        src="{{userInfo.avatarUrl || '/images/default-avatar.png'}}" 
        class="avatar-image" 
        mode="aspectFill"
      />
      <view class="avatar-overlay">
        <text class="camera-icon">📷</text>
      </view>
    </view>
    <text class="avatar-tip">点击更换头像</text>
  </view>

  <!-- 表单部分 -->
  <view class="form-section">
    <!-- 昵称 -->
    <view class="form-item">
      <text class="label">昵称 *</text>
      <input 
        class="input" 
        value="{{formData.nickname}}" 
        placeholder="请输入昵称"
        data-field="nickname"
        bindinput="onInputChange"
        maxlength="20"
      />
    </view>

    <!-- 性别 -->
    <view class="form-item">
      <text class="label">性别</text>
      <picker 
        bindchange="onGenderChange" 
        value="{{formData.gender}}" 
        range="{{genderOptions}}"
        range-key="label"
      >
        <view class="picker">
          {{genderOptions[formData.gender].label}}
        </view>
      </picker>
    </view>

    <!-- 生日 -->
    <view class="form-item">
      <text class="label">生日</text>
      <picker 
        mode="date" 
        value="{{formData.birthday}}" 
        bindchange="onDateChange"
        end="{{today}}"
      >
        <view class="picker">
          {{formData.birthday || '请选择生日'}}
        </view>
      </picker>
    </view>

    <!-- 手机号 -->
    <view class="form-item">
      <text class="label">手机号</text>
      <input 
        class="input" 
        type="number"
        value="{{formData.phone}}" 
        placeholder="请输入手机号"
        data-field="phone"
        bindinput="onInputChange"
        maxlength="11"
      />
    </view>

    <!-- 邮箱 -->
    <view class="form-item">
      <text class="label">邮箱</text>
      <input 
        class="input" 
        value="{{formData.email}}" 
        placeholder="请输入邮箱"
        data-field="email"
        bindinput="onInputChange"
      />
    </view>

    <!-- 所在地 -->
    <view class="form-item">
      <text class="label">所在地</text>
      <input 
        class="input" 
        value="{{formData.location}}" 
        placeholder="请输入所在地"
        data-field="location"
        bindinput="onInputChange"
      />
    </view>

    <!-- 职业 -->
    <view class="form-item">
      <text class="label">职业</text>
      <input 
        class="input" 
        value="{{formData.occupation}}" 
        placeholder="请输入职业"
        data-field="occupation"
        bindinput="onInputChange"
      />
    </view>

    <!-- 公司 -->
    <view class="form-item">
      <text class="label">公司</text>
      <input 
        class="input" 
        value="{{formData.company}}" 
        placeholder="请输入公司"
        data-field="company"
        bindinput="onInputChange"
      />
    </view>

    <!-- 个性签名 -->
    <view class="form-item">
      <text class="label">个性签名</text>
      <textarea 
        class="textarea" 
        value="{{formData.signature}}" 
        placeholder="写点什么介绍一下自己吧..."
        data-field="signature"
        bindinput="onInputChange"
        maxlength="100"
        show-confirm-bar="{{false}}"
      />
    </view>

    <!-- 兴趣爱好 -->
    <view class="form-item">
      <text class="label">兴趣爱好</text>
      <view class="interests-grid">
        <view 
          wx:for="{{interestOptions}}" 
          wx:key="*this"
          class="interest-tag {{formData.interests.indexOf(item) > -1 ? 'active' : ''}}"
          data-value="{{item}}"
          bindtap="onInterestChange"
        >
          {{item}}
        </view>
      </view>
    </view>
  </view>

  <!-- 保存按钮 -->
  <view class="button-section">
    <button 
      class="save-btn"
      bindtap="saveProfile"
      loading="{{isSubmitting}}"
      disabled="{{isSubmitting}}"
    >
      保存资料
    </button>
  </view>
</view>
```

### 样式文件 (editProfile.wxss)
```css
.container {
  padding: 40rpx;
  background: #f8f8f8;
  min-height: 100vh;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  padding: 40rpx;
  background: white;
  border-radius: 20rpx;
}

.avatar-wrapper {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 20rpx;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid #e0e0e0;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50rpx;
  height: 50rpx;
  background: #007aff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid white;
}

.camera-icon {
  font-size: 24rpx;
  color: white;
}

.avatar-tip {
  font-size: 28rpx;
  color: #666;
}

.form-section {
  background: white;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 40rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  width: 140rpx;
  font-size: 32rpx;
  color: #333;
  margin-right: 20rpx;
}

.input, .picker {
  flex: 1;
  font-size: 32rpx;
  color: #333;
}

.picker {
  color: #999;
}

.textarea {
  flex: 1;
  min-height: 120rpx;
  font-size: 32rpx;
  color: #333;
}

.interests-grid {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.interest-tag {
  padding: 10rpx 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #f8f8f8;
  transition: all 0.3s;
}

.interest-tag.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

.button-section {
  padding: 0 40rpx;
}

.save-btn {
  width: 100%;
  height: 88rpx;
  background: #007aff;
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  border: none;
}

.save-btn[disabled] {
  background: #ccc;
}
```

## 数据验证工具

```javascript
// 在UserUpdate.js中添加验证工具函数
const ValidationUtils = {
  // 验证邮箱
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  },

  // 验证手机号
  validatePhone(phone) {
    const re = /^1[3-9]\d{9}$/
    return re.test(phone)
  },

  // 验证昵称
  validateNickname(nickname) {
    if (!nickname || !nickname.trim()) {
      return { valid: false, message: '昵称不能为空' }
    }
    if (nickname.length > 20) {
      return { valid: false, message: '昵称不能超过20个字符' }
    }
    return { valid: true }
  },

  // 验证个性签名
  validateSignature(signature) {
    if (signature && signature.length > 100) {
      return { valid: false, message: '个性签名不能超过100个字符' }
    }
    return { valid: true }
  },

  // 验证用户资料
  validateUserProfile(data) {
    const errors = []

    // 验证昵称
    const nicknameValidation = this.validateNickname(data.nickname)
    if (!nicknameValidation.valid) {
      errors.push(nicknameValidation.message)
    }

    // 验证邮箱
    if (data.email && !this.validateEmail(data.email)) {
      errors.push('邮箱格式不正确')
    }

    // 验证手机号
    if (data.phone && !this.validatePhone(data.phone)) {
      errors.push('手机号格式不正确')
    }

    // 验证个性签名
    const signatureValidation = this.validateSignature(data.signature)
    if (!signatureValidation.valid) {
      errors.push(signatureValidation.message)
    }

    return {
      valid: errors.length === 0,
      errors: errors
    }
  }
}

module.exports = {
  uploadFile,
  uploadAvatar,
  updateUserProfile,
  getUserProfile,
  ValidationUtils
}
```

## 错误处理

### 常见错误类型
1. **文件上传错误**: 文件大小超限、格式不支持
2. **网络错误**: 上传超时、连接失败
3. **数据验证错误**: 必填字段缺失、格式不正确
4. **权限错误**: 云存储权限问题

### 错误处理示例
```javascript
try {
  const result = await UserUpdate.updateUserProfile(profileData)
  if (result.success) {
    // 成功处理
  } else {
    // 错误处理
    wx.showModal({
      title: '更新失败',
      content: result.message,
      showCancel: false
    })
  }
} catch (error) {
  console.error('系统错误:', error)
  wx.showToast({
    title: '系统异常',
    icon: 'error'
  })
}
```

## 最佳实践

### 1. 图片压缩
```javascript
// 选择图片时启用压缩
wx.chooseImage({
  count: 1,
  sourceType: ['album', 'camera'],
  sizeType: ['compressed'], // 启用压缩
  success: (res) => {
    // 处理图片
  }
})
```

### 2. 上传进度显示
```javascript
async function uploadWithProgress(filePath) {
  const uploadTask = wx.cloud.uploadFile({
    cloudPath: `uploads/${Date.now()}.jpg`,
    filePath: filePath
  })

  uploadTask.onProgressUpdate((res) => {
    console.log('上传进度:', res.progress)
    // 更新进度条
  })

  return uploadTask
}
```

### 3. 数据同步
```javascript
// 确保本地和云端数据同步
function syncUserData(cloudUserInfo) {
  const localUserInfo = wx.getStorageSync('userInfo') || {}
  
  const mergedUserInfo = {
    ...localUserInfo,
    ...cloudUserInfo,
    // 保留关键标识
    _id: localUserInfo._id || cloudUserInfo._id,
    // 确保字段兼容
    avatarUrl: cloudUserInfo.avatar_url || cloudUserInfo.avatarUrl,
    nickName: cloudUserInfo.nickname || cloudUserInfo.nickName
  }
  
  wx.setStorageSync('userInfo', mergedUserInfo)
  return mergedUserInfo
}
```

## 云函数配置

确保在 `cloudfunctions/userUpdate/index.js` 中配置了正确的处理逻辑：

```javascript
// 云函数应支持以下action
const actions = {
  updateProfile: '更新用户资料',
  uploadFile: '上传文件',
  getProfile: '获取用户资料'
}
```

## 注意事项

1. **文件大小限制**: 小程序上传文件有大小限制，建议压缩后上传
2. **字段名兼容**: 注意前端和后端字段名的兼容性处理
3. **数据同步**: 确保本地存储与云端数据的一致性
4. **隐私保护**: 敏感信息要做好权限控制
5. **用户体验**: 提供清晰的操作反馈和进度提示

---

**开发团队**: Tourism_Management开发团队  
**文档版本**: v2.0.0  
**最后更新**: 2025-01-24
