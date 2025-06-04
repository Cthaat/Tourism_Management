/**
 * @fileoverview 旅游管理小程序登录页面逻辑
 * @description 实现用户账户密码登录功能
 * @author Tourism_Management开发团队
 * @date 2025-06-04
 */

// 引入登录API
const UserLoginApi = require('../../server/UserLoginApi');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面状态
    isLoading: false,

    // 主题设置
    isDarkMode: false,
    colorTheme: '默认绿',

    // 登录表单数据
    loginForm: {
      account: '',
      password: ''
    },

    // 表单状态
    showPassword: false,
    rememberMe: false,

    // 表单验证状态
    canSubmit: false
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
      const savedAccount = wx.getStorageSync('savedAccount') || '';
      this.setData({
        rememberMe: true,
        'loginForm.account': savedAccount
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
   * 账号输入处理
   */
  onAccountInput(e) {
    const account = e.detail.value;
    this.setData({
      'loginForm.account': account
    });
    this.validateLoginForm();
  },

  /**
   * 密码输入处理
   */
  onPasswordInput(e) {
    const password = e.detail.value;
    this.setData({
      'loginForm.password': password
    });
    this.validateLoginForm();
  },

  /**
   * 切换密码显示状态
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
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
      // 保存当前账号
      wx.setStorageSync('savedAccount', this.data.loginForm.account);
    } else {
      // 清除保存的账号
      wx.removeStorageSync('savedAccount');
    }
  },

  /**
   * 账户密码登录
   */
  async onLogin() {
    if (!this.data.canSubmit || this.data.isLoading) {
      return;
    }

    const { account, password } = this.data.loginForm;

    // 表单验证
    if (!account || account.trim().length === 0) {
      wx.showToast({
        title: '请输入账号',
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
      console.log('开始账户密码登录...');

      // 调用登录API
      const loginResult = await UserLoginApi.userLogin({
        action: 'login',
        data: {
          account: account.trim(),
          password: password,
          loginType: 'account'
        }
      });

      console.log('登录结果:', loginResult);

      if (loginResult.success) {
        // 登录成功
        const userInfo = loginResult.data.userInfo;

        // 更新登录状态
        UserLoginApi.updateLoginStatus(userInfo);

        // 保存记住登录状态
        if (this.data.rememberMe) {
          wx.setStorageSync('savedAccount', account.trim());
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
          content: loginResult.message || '账号或密码错误',
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
   * 忘记密码
   */
  onForgotPassword() {
    wx.showModal({
      title: '找回密码',
      content: '请联系客服协助找回密码',
      showCancel: false
    });
  },

  /**
   * 验证登录表单
   */
  validateLoginForm() {
    const { account, password } = this.data.loginForm;
    const canSubmit = account && account.trim().length > 0 && password && password.length >= 6;

    this.setData({
      canSubmit: canSubmit
    });
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
