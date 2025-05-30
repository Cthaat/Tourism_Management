# 用户登录API使用指南

## 概述
UserLoginApi.js 是旅游管理微信小程序的用户登录认证模块，提供了完整的用户登录、退出、状态管理和本地缓存功能。该API支持云函数登录和本地备选登录，确保在各种网络环境下都能正常工作。

## 功能特性
- ✅ 微信用户登录
- ✅ 本地登录状态管理
- ✅ 用户信息缓存
- ✅ 自动状态检查
- ✅ 云函数失败时的本地备选登录
- ✅ 详细的错误处理和日志记录
- ✅ 用户资料获取和更新

## API列表

### 1. 用户登录 (userLogin)
处理用户登录逻辑，支持云函数登录和本地备选登录

**方法签名:**
```javascript
userLogin(params)
```

**参数说明:**
```javascript
{
  action: 'login',                     // 动作类型，默认为'login'
  data: {                             // 登录数据
    account: 'user123',               // 用户账号 (可选)
    password: 'password123'           // 用户密码 (可选)
  },
  wxUserInfo: {                       // 微信用户信息 (推荐提供)
    nickName: '用户昵称',
    avatarUrl: 'https://wx.qlogo.cn/...',
    gender: 1,                        // 性别 0未知 1男 2女
    country: '中国',
    province: '广东',
    city: '深圳',
    language: 'zh_CN'
  }
}
```

**返回结果:**
```javascript
{
  success: true,
  data: {
    userInfo: {
      _id: "user_123456",
      openid: "ox1x1x1x1x1x1x1x1x1",
      nickname: "用户昵称",
      avatar_url: "https://wx.qlogo.cn/...",
      gender: 1,
      country: "中国",
      province: "广东", 
      city: "深圳",
      account: "user123",
      created_at: "2025-01-24T10:30:00.000Z",
      updated_at: "2025-01-24T10:30:00.000Z",
      last_login_time: "2025-01-24T10:30:00.000Z"
    },
    isNewUser: false,
    isLocalLogin: false               // 是否为本地登录
  },
  message: "登录成功"
}
```

**使用示例:**
```javascript
// 在页面中引入API
const UserLoginApi = require('../../server/UserLoginApi')

// 微信登录
async function wxLogin() {
  try {
    // 1. 获取微信登录code
    const loginRes = await wx.login()
    
    // 2. 获取用户信息
    const userInfoRes = await wx.getUserProfile({
      desc: '用于完善用户信息'
    })
    
    // 3. 调用登录API
    const result = await UserLoginApi.userLogin({
      action: 'login',
      data: {
        code: loginRes.code
      },
      wxUserInfo: userInfoRes.userInfo
    })
    
    if (result.success) {
      // 4. 更新登录状态
      UserLoginApi.updateLoginStatus(result.data.userInfo)
      
      wx.showToast({
        title: result.message,
        icon: 'success'
      })
      
      // 5. 跳转到主页
      wx.switchTab({
        url: '/pages/index/index'
      })
    } else {
      wx.showModal({
        title: '登录失败',
        content: result.message,
        showCancel: false
      })
    }
  } catch (error) {
    console.error('登录过程出错:', error)
    wx.showToast({
      title: '登录异常',
      icon: 'error'
    })
  }
}
```

### 2. 更新登录状态 (updateLoginStatus)
登录成功后更新本地存储

**方法签名:**
```javascript
updateLoginStatus(userInfo)
```

**参数说明:**
- `userInfo` (Object): 用户信息对象

**使用示例:**
```javascript
const success = UserLoginApi.updateLoginStatus(userInfo)
if (success) {
  console.log('登录状态更新成功')
}
```

### 3. 退出登录 (logout)
清除本地存储的用户信息和登录状态

**方法签名:**
```javascript
logout()
```

**返回结果:**
```javascript
{
  success: true,
  message: "已退出登录"
}
```

**使用示例:**
```javascript
function handleLogout() {
  wx.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        const result = UserLoginApi.logout()
        wx.showToast({
          title: result.message,
          icon: 'success'
        })
        
        // 跳转到登录页
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    }
  })
}
```

### 4. 检查登录状态 (checkLoginStatus)
检查当前用户的登录状态

**方法签名:**
```javascript
checkLoginStatus()
```

**返回结果:**
```javascript
{
  isLoggedIn: true,
  userInfo: {
    _id: "user_123456",
    nickname: "用户昵称",
    // ...其他用户信息
  }
}
```

**使用示例:**
```javascript
// 在app.js中检查登录状态
App({
  onLaunch() {
    this.checkLoginStatus()
  },
  
  checkLoginStatus() {
    const status = UserLoginApi.checkLoginStatus()
    
    if (status.isLoggedIn) {
      console.log('用户已登录:', status.userInfo.nickname)
      this.globalData.userInfo = status.userInfo
    } else {
      console.log('用户未登录')
      // 可以跳转到登录页
    }
  }
})
```

### 5. 获取用户资料 (fetchUserProfile)
获取用户的最新资料信息

**方法签名:**
```javascript
fetchUserProfile(params)
```

**参数说明:**
```javascript
{
  account: 'user123'                  // 可选，用户账号
}
```

**返回结果:**
```javascript
{
  success: true,
  userInfo: {
    _id: "user_123456",
    account: "user123",
    nickname: "用户昵称",
    avatar_url: "https://wx.qlogo.cn/...",
    // ...完整用户信息
  },
  message: "获取用户资料成功",
  isLocalUser: false,                 // 是否为本地用户
  isLocalFallback: false              // 是否使用本地备选
}
```

**使用示例:**
```javascript
// 获取用户最新资料
async function refreshUserProfile() {
  try {
    const result = await UserLoginApi.fetchUserProfile()
    
    if (result.success) {
      this.setData({
        userInfo: result.userInfo
      })
      
      if (result.isLocalFallback) {
        wx.showToast({
          title: '使用本地数据',
          icon: 'none'
        })
      }
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

### 6. 本地登录 (useLocalLogin)
云函数不可用时的备选登录方案

**方法签名:**
```javascript
useLocalLogin(wxUserInfo)
```

**参数说明:**
- `wxUserInfo` (Object): 微信用户信息

**使用示例:**
```javascript
// 通常由userLogin自动调用，也可以手动使用
const result = UserLoginApi.useLocalLogin(wxUserInfo)
if (result.success) {
  console.log('本地登录成功')
}
```

## 完整页面示例

### 登录页面 (login.js)
```javascript
const UserLoginApi = require('../../server/UserLoginApi')

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    hasUserInfo: false,
    userInfo: {},
    isLoading: false
  },

  onLoad() {
    // 检查登录状态
    this.checkExistingLogin()
  },

  // 检查现有登录状态
  checkExistingLogin() {
    const status = UserLoginApi.checkLoginStatus()
    if (status.isLoggedIn) {
      // 已登录，跳转到主页
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 微信登录
  async handleWxLogin() {
    if (this.data.isLoading) return
    
    this.setData({ isLoading: true })

    try {
      // 1. 检查登录权限
      const setting = await wx.getSetting()
      
      if (!setting.authSetting['scope.userInfo']) {
        // 未授权，引导用户授权
        wx.showModal({
          title: '授权提示',
          content: '需要获取您的用户信息来完成登录',
          confirmText: '去授权',
          success: (res) => {
            if (res.confirm) {
              this.getUserProfile()
            }
          }
        })
        return
      }

      // 2. 获取用户信息
      await this.getUserProfile()
    } catch (error) {
      console.error('登录过程出错:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 获取用户信息并登录
  async getUserProfile() {
    try {
      // 获取登录code
      const loginRes = await wx.login()
      
      // 获取用户信息
      const userInfoRes = await wx.getUserProfile({
        desc: '用于完善用户信息'
      })

      // 调用登录API
      const result = await UserLoginApi.userLogin({
        action: 'login',
        data: {
          code: loginRes.code
        },
        wxUserInfo: userInfoRes.userInfo
      })

      if (result.success) {
        // 更新登录状态
        UserLoginApi.updateLoginStatus(result.data.userInfo)
        
        wx.showToast({
          title: result.message,
          icon: 'success'
        })

        // 延迟跳转给用户看到成功提示
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showModal({
          title: '登录失败',
          content: result.message,
          showCancel: false
        })
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'error'
      })
    }
  },

  // 手机号登录（如果需要）
  async handlePhoneLogin(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({
        title: '取消授权',
        icon: 'none'
      })
      return
    }

    try {
      const result = await UserLoginApi.userLogin({
        action: 'phoneLogin',
        data: {
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        }
      })

      if (result.success) {
        UserLoginApi.updateLoginStatus(result.data.userInfo)
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    } catch (error) {
      wx.showToast({
        title: '手机号登录失败',
        icon: 'error'
      })
    }
  }
})
```

### 登录页面模板 (login.wxml)
```xml
<view class="container">
  <view class="login-header">
    <image src="/images/logo.png" class="logo" />
    <text class="app-name">旅游管理助手</text>
    <text class="slogan">发现美好，记录旅程</text>
  </view>

  <view class="login-content">
    <!-- 微信登录按钮 -->
    <button 
      class="login-btn wx-login-btn" 
      bindtap="handleWxLogin"
      loading="{{isLoading}}"
      disabled="{{isLoading}}"
    >
      <image src="/images/wx-icon.png" class="btn-icon" />
      微信快速登录
    </button>

    <!-- 手机号登录按钮（可选） -->
    <button 
      class="login-btn phone-login-btn" 
      open-type="getPhoneNumber"
      bindgetphonenumber="handlePhoneLogin"
    >
      <image src="/images/phone-icon.png" class="btn-icon" />
      手机号登录
    </button>

    <view class="login-tips">
      <text>登录即表示同意</text>
      <text class="link" bindtap="showPrivacy">《隐私政策》</text>
      <text>和</text>
      <text class="link" bindtap="showTerms">《服务条款》</text>
    </view>
  </view>
</view>
```

### 用户中心页面 (profile.js)
```javascript
const UserLoginApi = require('../../server/UserLoginApi')

Page({
  data: {
    userInfo: null,
    isLoading: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    // 每次显示时刷新用户信息
    this.refreshUserProfile()
  },

  // 加载用户信息
  loadUserInfo() {
    const status = UserLoginApi.checkLoginStatus()
    if (status.isLoggedIn) {
      this.setData({
        userInfo: status.userInfo
      })
    } else {
      // 未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  // 刷新用户资料
  async refreshUserProfile() {
    try {
      const result = await UserLoginApi.fetchUserProfile()
      if (result.success) {
        this.setData({
          userInfo: result.userInfo
        })
      }
    } catch (error) {
      console.error('刷新用户资料失败:', error)
    }
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const result = UserLoginApi.logout()
          wx.showToast({
            title: result.message,
            icon: 'success'
          })
          
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }, 1500)
        }
      }
    })
  },

  // 编辑资料
  editProfile() {
    wx.navigateTo({
      url: '/pages/editProfile/editProfile'
    })
  }
})
```

## 样式文件 (login.wxss)

```css
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  margin-bottom: 40rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.slogan {
  font-size: 28rpx;
  opacity: 0.8;
}

.login-content {
  padding: 80rpx 60rpx 120rpx;
  background: white;
  border-radius: 40rpx 40rpx 0 0;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  font-size: 32rpx;
  margin-bottom: 30rpx;
  border: none;
}

.wx-login-btn {
  background: #07c160;
  color: white;
}

.phone-login-btn {
  background: #007aff;
  color: white;
}

.btn-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
}

.login-tips {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-top: 40rpx;
}

.link {
  color: #007aff;
}
```

## 错误处理

### 常见错误类型
1. **数据库集合不存在**: 需要在云开发控制台创建相应集合
2. **网络连接问题**: 网络超时或连接失败
3. **云函数部署问题**: 云函数未正确部署或配置
4. **用户授权问题**: 用户拒绝授权或权限不足

### 错误处理示例
```javascript
try {
  const result = await UserLoginApi.userLogin(loginParams)
  if (result.success) {
    // 成功处理
  } else {
    // 根据错误码处理
    switch (result.code) {
      case 'DB_COLLECTION_NOT_EXISTS':
        wx.showModal({
          title: '系统配置错误',
          content: '数据库配置异常，请联系管理员',
          showCancel: false
        })
        break
      case 'NETWORK_ERROR':
        wx.showToast({
          title: '网络连接失败',
          icon: 'error'
        })
        break
      default:
        wx.showModal({
          title: '登录失败',
          content: result.message,
          showCancel: false
        })
    }
  }
} catch (error) {
  console.error('登录异常:', error)
}
```

## 最佳实践

### 1. 登录状态检查
```javascript
// 在app.js中全局检查
App({
  onLaunch() {
    this.checkLoginOnLaunch()
  },
  
  checkLoginOnLaunch() {
    const status = UserLoginApi.checkLoginStatus()
    if (status.isLoggedIn) {
      this.globalData.userInfo = status.userInfo
      // 可以在这里刷新用户资料
      this.refreshUserProfile()
    }
  },
  
  async refreshUserProfile() {
    try {
      const result = await UserLoginApi.fetchUserProfile()
      if (result.success) {
        this.globalData.userInfo = result.userInfo
      }
    } catch (error) {
      console.log('后台刷新用户资料失败:', error)
    }
  }
})
```

### 2. 页面登录检查
```javascript
// 在需要登录的页面中
Page({
  onLoad() {
    this.checkLoginRequired()
  },
  
  checkLoginRequired() {
    const status = UserLoginApi.checkLoginStatus()
    if (!status.isLoggedIn) {
      wx.showModal({
        title: '请先登录',
        content: '此功能需要登录后使用',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
    }
  }
})
```

### 3. 自动登录过期检查
```javascript
// 检查登录是否过期（可选）
function checkLoginExpiry() {
  const loginTime = wx.getStorageSync('loginTime')
  const currentTime = new Date().getTime()
  const expireTime = 7 * 24 * 60 * 60 * 1000 // 7天过期
  
  if (loginTime && (currentTime - loginTime > expireTime)) {
    // 登录过期，清除状态
    UserLoginApi.logout()
    wx.showToast({
      title: '登录已过期',
      icon: 'none'
    })
    return false
  }
  return true
}
```

## 云函数配置

确保在 `cloudfunctions/userLogin/index.js` 中配置了正确的处理逻辑：

```javascript
// 云函数应支持以下action
const actions = {
  login: '用户登录',
  getProfile: '获取用户资料',
  phoneLogin: '手机号登录'
}
```

## 注意事项

1. **隐私合规**: 确保获取用户信息符合微信小程序隐私规范
2. **数据安全**: 敏感信息要加密传输和存储
3. **用户体验**: 提供清晰的登录引导和错误提示
4. **网络兼容**: 处理好网络异常情况，提供本地备选方案
5. **权限管理**: 合理控制功能访问权限

---

**开发团队**: Tourism_Management开发团队  
**文档版本**: v2.0.0  
**最后更新**: 2025-01-24
