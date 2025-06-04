/**
 * @fileoverview 旅游管理小程序登录页面逻辑
 * @description 实现用户登录、注册、微信登录等功能
 * @author Tourism_Management开发团队
 * @date 2025-06-04
 */

// 引入登录API
const UserLoginApi = require('../../server/UserLoginApi');

// 默认头像URL
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面状态
    loginMode: 'login', // 'login' | 'register'
    isLoading: false,
    isRegistering: false,
    
    // 主题设置
    isDarkMode: false,
    colorTheme: '默认绿',
    
    // 登录表单数据
    loginForm: {
      phone: '',
      password: ''
    },
    
    // 注册表单数据
    registerForm: {
      phone: '',
      verifyCode: '',
      password: '',
      confirmPassword: ''
    },
    
    // 表单状态
    showPassword: false,
    showRegPassword: false,
    showConfirmPassword: false,
    rememberMe: false,
    agreeTerms: false,
    
    // 验证码相关
    canSendCode: false,
    countdown: 0,
    
    // 表单验证状态
    canSubmit: false,
    canRegister: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('登录页面加载');
    
    // 检查是否已经登录
    this.checkExistingLogin();
    
    // 初始化主题设置
    this.initTheme();
    
    // 从本地存储恢复"记住登录"状态
    const rememberMe = wx.getStorageSync('rememberMe') || false;
    if (rememberMe) {
      const savedPhone = wx.getStorageSync('savedPhone') || '';
      this.setData({
        rememberMe: true,
        'loginForm.phone': savedPhone
      });
    }
    
    // 初始化表单验证
    this.validateLoginForm();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkExistingLogin();
  },

  /**
   * 检查现有登录状态
   */
  checkExistingLogin() {
    const loginStatus = UserLoginApi.checkLoginStatus();
    console.log('检查登录状态:', loginStatus);
    
    if (loginStatus.isLoggedIn) {
      // 已登录，跳转到首页
      console.log('用户已登录，跳转到首页');
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 初始化主题设置
   */
  initTheme() {
    try {
      // 从本地存储获取主题设置
      const savedTheme = wx.getStorageSync('colorTheme') || '默认绿';
      const savedThemeMode = wx.getStorageSync('themeMode') || 'light';
      
      this.setData({
        colorTheme: savedTheme,
        isDarkMode: savedThemeMode === 'dark'
      });
    } catch (error) {
      console.error('初始化主题设置失败:', error);
    }
  },

  /**
   * 切换登录/注册选项卡
   */
  switchTab(e) {
    const mode = e.currentTarget.dataset.mode;
    console.log('切换到:', mode);
    
    this.setData({
      loginMode: mode
    });
    
    // 重新验证表单
    if (mode === 'login') {
      this.validateLoginForm();
    } else {
      this.validateRegisterForm();
    }
  },

  /**
   * 手机号输入处理 - 登录表单
   */
  onPhoneInput(e) {
    const phone = e.detail.value;
    this.setData({
      'loginForm.phone': phone
    });
    this.validateLoginForm();
  },

  /**
   * 密码输入处理 - 登录表单
   */
  onPasswordInput(e) {
    const password = e.detail.value;
    this.setData({
      'loginForm.password': password
    });
    this.validateLoginForm();
  },

  /**
   * 手机号输入处理 - 注册表单
   */
  onRegPhoneInput(e) {
    const phone = e.detail.value;
    this.setData({
      'registerForm.phone': phone,
      canSendCode: this.isValidPhone(phone)
    });
    this.validateRegisterForm();
  },

  /**
   * 验证码输入处理
   */
  onVerifyCodeInput(e) {
    const verifyCode = e.detail.value;
    this.setData({
      'registerForm.verifyCode': verifyCode
    });
    this.validateRegisterForm();
  },

  /**
   * 密码输入处理 - 注册表单
   */
  onRegPasswordInput(e) {
    const password = e.detail.value;
    this.setData({
      'registerForm.password': password
    });
    this.validateRegisterForm();
  },

  /**
   * 确认密码输入处理
   */
  onConfirmPasswordInput(e) {
    const confirmPassword = e.detail.value;
    this.setData({
      'registerForm.confirmPassword': confirmPassword
    });
    this.validateRegisterForm();
  },

  /**
   * 切换密码显示状态 - 登录
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  /**
   * 切换密码显示状态 - 注册
   */
  toggleRegPassword() {
    this.setData({
      showRegPassword: !this.data.showRegPassword
    });
  },

  /**
   * 切换确认密码显示状态
   */
  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    });
  },

  /**
   * 切换记住登录状态
   */
  toggleRemember() {
    const rememberMe = !this.data.rememberMe;
    this.setData({
      rememberMe: rememberMe
    });
    
    // 保存到本地存储
    wx.setStorageSync('rememberMe', rememberMe);
    
    if (rememberMe) {
      // 保存当前手机号
      wx.setStorageSync('savedPhone', this.data.loginForm.phone);
    } else {
      // 清除保存的手机号
      wx.removeStorageSync('savedPhone');
    }
  },

  /**
   * 切换同意条款状态
   */
  toggleAgree() {
    this.setData({
      agreeTerms: !this.data.agreeTerms
    });
    this.validateRegisterForm();
  },

  /**
   * 发送验证码
   */
  async onSendCode() {
    if (!this.data.canSendCode || this.data.countdown > 0) {
      return;
    }

    const phone = this.data.registerForm.phone;
    if (!this.isValidPhone(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    try {
      // 模拟发送验证码
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });

      // 开始倒计时
      this.startCountdown();
      
      // 这里应该调用发送验证码的API
      console.log('发送验证码到:', phone);
      
    } catch (error) {
      console.error('发送验证码失败:', error);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 开始倒计时
   */
  startCountdown() {
    let countdown = 60;
    this.setData({
      countdown: countdown,
      canSendCode: false
    });

    const timer = setInterval(() => {
      countdown--;
      this.setData({
        countdown: countdown
      });

      if (countdown <= 0) {
        clearInterval(timer);
        this.setData({
          canSendCode: this.isValidPhone(this.data.registerForm.phone)
        });
      }
    }, 1000);
  },

  /**
   * 手机号登录
   */
  async onLogin() {
    if (!this.data.canSubmit || this.data.isLoading) {
      return;
    }

    const { phone, password } = this.data.loginForm;

    // 表单验证
    if (!this.isValidPhone(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (!password || password.length < 6) {
      wx.showToast({
        title: '密码至少6位字符',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isLoading: true
    });

    try {
      console.log('开始手机号登录...');
      
      // 调用登录API
      const loginResult = await UserLoginApi.userLogin({
        action: 'login',
        data: {
          account: phone, // 使用手机号作为账号
          password: password,
          loginType: 'phone'
        }
      });

      console.log('手机号登录结果:', loginResult);

      if (loginResult.success) {
        // 登录成功
        const userInfo = loginResult.data.userInfo;
        
        // 更新登录状态
        UserLoginApi.updateLoginStatus(userInfo);
        
        // 保存记住登录状态
        if (this.data.rememberMe) {
          wx.setStorageSync('savedPhone', phone);
        }

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);

      } else {
        // 登录失败
        wx.showModal({
          title: '登录失败',
          content: loginResult.message || '手机号或密码错误',
          showCancel: false
        });
      }

    } catch (error) {
      console.error('登录过程出错:', error);
      wx.showToast({
        title: '登录异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({
        isLoading: false
      });
    }
  },

  /**
   * 用户注册
   */
  async onRegister() {
    if (!this.data.canRegister || this.data.isRegistering) {
      return;
    }

    const { phone, verifyCode, password, confirmPassword } = this.data.registerForm;

    // 表单验证
    if (!this.isValidPhone(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (!verifyCode || verifyCode.length !== 6) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      });
      return;
    }

    if (!password || password.length < 6) {
      wx.showToast({
        title: '密码至少6位字符',
        icon: 'none'
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    if (!this.data.agreeTerms) {
      wx.showToast({
        title: '请同意用户协议',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isRegistering: true
    });

    try {
      console.log('开始用户注册...');
      
      // 这里应该先验证验证码，然后调用注册API
      // 现在模拟注册成功，直接创建账号并登录
      const registerResult = await UserLoginApi.userLogin({
        action: 'login',
        data: {
          account: phone, // 使用手机号作为账号
          password: password,
          loginType: 'register', // 标识为注册登录
          isNewUser: true
        }
      });

      console.log('注册结果:', registerResult);

      if (registerResult.success) {
        // 注册成功，自动登录
        const userInfo = registerResult.data.userInfo;
        
        // 更新登录状态
        UserLoginApi.updateLoginStatus(userInfo);

        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);

      } else {
        // 注册失败
        wx.showModal({
          title: '注册失败',
          content: registerResult.message || '注册过程出现错误',
          showCancel: false
        });
      }

    } catch (error) {
      console.error('注册过程出错:', error);
      wx.showToast({
        title: '注册异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({
        isRegistering: false
      });
    }
  },

  /**
   * 微信登录
   */
  async onWechatLogin() {
    if (this.data.isLoading) {
      return;
    }

    this.setData({
      isLoading: true
    });

    try {
      console.log('开始微信登录...');
      
      // 获取用户授权
      const setting = await wx.getSetting();
      
      if (!setting.authSetting['scope.userInfo']) {
        // 引导用户授权
        wx.showModal({
          title: '授权提示',
          content: '需要获取您的用户信息来完成登录',
          confirmText: '去授权',
          success: (res) => {
            if (res.confirm) {
              this.getUserProfile();
            } else {
              this.setData({ isLoading: false });
            }
          }
        });
        return;
      }

      // 获取用户信息
      await this.getUserProfile();

    } catch (error) {
      console.error('微信登录过程出错:', error);
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
      this.setData({
        isLoading: false
      });
    }
  },

  /**
   * 获取用户信息并登录
   */
  async getUserProfile() {
    try {
      // 获取登录code
      const loginRes = await wx.login();
      
      // 获取用户信息
      const userInfoRes = await wx.getUserProfile({
        desc: '用于完善用户信息'
      });

      console.log('获取到的用户信息:', userInfoRes.userInfo);

      // 调用登录API
      const result = await UserLoginApi.userLogin({
        action: 'login',
        data: {
          code: loginRes.code,
          loginType: 'wechat'
        },
        wxUserInfo: userInfoRes.userInfo
      });

      if (result.success) {
        // 更新登录状态
        UserLoginApi.updateLoginStatus(result.data.userInfo);
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 延迟跳转
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      } else {
        wx.showModal({
          title: '登录失败',
          content: result.message,
          showCancel: false
        });
      }

    } catch (error) {
      console.error('获取用户信息失败:', error);
      
      if (error.errMsg === 'getUserProfile:fail auth deny') {
        wx.showToast({
          title: '您已取消授权',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    } finally {
      this.setData({
        isLoading: false
      });
    }
  },

  /**
   * 游客模式
   */
  onGuestMode() {
    wx.showModal({
      title: '游客模式',
      content: '在游客模式下，部分功能可能受限。建议您注册登录以获得完整体验。',
      confirmText: '继续',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 创建游客用户信息
          const guestUserInfo = {
            _id: `guest_${new Date().getTime()}`,
            nickName: '游客用户',
            avatarUrl: defaultAvatarUrl,
            isGuest: true,
            created_at: new Date().getTime()
          };

          // 设置游客登录状态
          UserLoginApi.updateLoginStatus(guestUserInfo);
          
          wx.showToast({
            title: '已进入游客模式',
            icon: 'success'
          });

          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 忘记密码
   */
  onForgotPassword() {
    wx.showModal({
      title: '找回密码',
      content: '请联系客服协助找回密码，或使用微信登录',
      showCancel: false
    });
  },

  /**
   * 查看用户协议
   */
  onViewTerms() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议的内容...',
      showCancel: false
    });
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策的内容...',
      showCancel: false
    });
  },

  /**
   * 验证登录表单
   */
  validateLoginForm() {
    const { phone, password } = this.data.loginForm;
    const canSubmit = this.isValidPhone(phone) && password && password.length >= 6;
    
    this.setData({
      canSubmit: canSubmit
    });
  },

  /**
   * 验证注册表单
   */
  validateRegisterForm() {
    const { phone, verifyCode, password, confirmPassword } = this.data.registerForm;
    const canRegister = 
      this.isValidPhone(phone) && 
      verifyCode && verifyCode.length === 6 &&
      password && password.length >= 6 &&
      password === confirmPassword &&
      this.data.agreeTerms;
    
    this.setData({
      canRegister: canRegister
    });
  },

  /**
   * 验证手机号格式
   */
  isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 登录页面不需要处理上拉触底
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '旅游管理小程序',
      path: '/pages/login/login'
    };
  }
});
