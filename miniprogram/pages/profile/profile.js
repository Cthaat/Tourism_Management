/**
 * 文件名: profile.js
 * 描述: 旅游管理微信小程序个人中心页面逻辑文件
 * 版本: 1.1.0
 * 创建日期: 2025-05-13
 * 更新日期: 2025-05-18
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 用户信息管理（头像上传、昵称修改）
 * - 云端用户登录和注销功能（支持微信登录）
 * - 用户资料云端同步与更新
 * - 我的收藏和预订记录展示
 * - 菜单导航（关于我们、意见反馈、设置）
 * - 主题模式切换（深色/浅色）支持
 * - 页面滚动TabBar自动隐藏/显示
 */

// 获取应用实例对象
const app = getApp()
// 导入API接口
const userLoginApi = require('../../server/UserLoginApi.js')
const userUpdateApi = require('../../server/UserUpdate.js')
// 导入深色模式修复工具
const darkModeFix = require('./fix-dark-mode.js')
// 设置默认头像URL，当用户未设置头像时使用
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

/**
 * 个人中心页面对象
 * 应用深色模式修复工具
 */
Page(darkModeFix.applyFix({
  /**
   * 页面的初始数据
   */  data: {
    userInfo: {                       // 用户信息对象
      avatarUrl: defaultAvatarUrl,    // 用户头像URL
      nickName: '',                   // 用户昵称
    },
    defaultAvatarUrl,                 // 默认头像URL常量
    hasUserInfo: false,               // 是否已获取用户信息标志
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),       // 检测getUserProfile接口可用性
    canIUseChooseAvatar: wx.canIUse('button.open-type.chooseAvatar'), // 检测头像选择接口可用性
    favoriteCount: 0,                 // 收藏景点数量
    bookingCount: 0,                  // 预订记录数量
    scrollTop: 0,                     // 当前页面滚动位置
    lastScrollTop: 0,                 // 上次滚动位置，用于计算滚动方向
    isDarkMode: false,                // 深色模式状态标志
    colorTheme: '默认绿',              // 当前应用的颜色主题名称
    loginLoading: false,              // 登录加载状态，防止重复点击
    isEditingNickname: false,         // 是否正在编辑昵称状态
    tempNickName: '',                 // 临时昵称存储变量
    account: '',                      // 登录账号
    password: '',                     // 登录密码
  },  /**
   * 生命周期函数--监听页面加载
   * 初始化用户信息和主题设置
   */  onLoad() {
    // 检查登录状态
    const loginStatus = userLoginApi.checkLoginStatus();
    console.log('登录状态:', loginStatus);

    if (loginStatus.isLoggedIn && loginStatus.userInfo) {
      // 已登录，使用云端用户信息
      this.setData({
        userInfo: loginStatus.userInfo,
        hasUserInfo: true
      });
    } else {
      // 尝试获取本地用户信息（临时使用）
      const userInfo = wx.getStorageSync('userInfo');
      console.log('本地用户信息:', userInfo);
      if (userInfo) {
        this.setData({
          userInfo,
          hasUserInfo: true
        });
      }
    }    // 检查基础库版本 - 使用新的推荐API
    let sdkVersion = '';
    try {
      // 使用官方推荐的新API
      const appBaseInfo = wx.getAppBaseInfo();
      sdkVersion = appBaseInfo.SDKVersion;
      console.log('基础库版本:', sdkVersion);
    } catch (e) {
      // 兼容处理：如果新API不可用，回退到旧API
      try {
        const systemInfo = wx.getSystemInfoSync();
        sdkVersion = systemInfo.SDKVersion;
        console.log('基础库版本 (兼容模式):', sdkVersion);
      } catch (err) {
        console.error('获取基础库版本失败:', err);
      }
    }

    // 检查是否支持chooseAvatar
    const canIUseAvatar = wx.canIUse('button.open-type.chooseAvatar');
    console.log('支持chooseAvatar:', canIUseAvatar); this.setData({
      sdkVersion: sdkVersion,
      canIUseChooseAvatar: canIUseAvatar,
      tempNickName: '' // 添加临时昵称变量
    });// 自动获取用户资料
    this.fetchUserProfile();    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      console.log('主题变化:', darkMode ? '深色模式' : '浅色模式', colorTheme);

      // 确保深色模式立即生效
      wx.nextTick(() => {
        this.setData({
          isDarkMode: darkMode,
          colorTheme: colorTheme
        });

        // 强制应用深色模式样式
        this.fixDarkMode(darkMode);

        // 多重保障：延迟执行多次样式修复，确保UI渲染完成后也能应用样式
        const fixTimes = [50, 200, 500];
        fixTimes.forEach(delay => {
          setTimeout(() => {
            this.fixDarkMode(darkMode);
            this.setData({ _forceUpdate: Date.now() });
          }, delay);
        });
      });
    });    // 初始化主题状态
    const isDarkMode = app.globalData.darkMode || false;
    const colorTheme = app.globalData.colorTheme || '默认绿';
    console.log('初始化主题:', isDarkMode ? '深色模式' : '浅色模式', colorTheme);

    // 立即设置主题状态并应用修复
    this.setData({
      isDarkMode: isDarkMode,
      colorTheme: colorTheme
    }, () => {
      // 在数据更新后立即应用修复
      if (typeof this.fixDarkMode === 'function') {
        // 使用多个定时器确保样式在各种情况下都能生效
        [0, 100, 300].forEach(delay => {
          setTimeout(() => this.fixDarkMode(isDarkMode), delay);
        });
      }
    });

    this.setData({
      isDarkMode: isDarkMode,
      colorTheme: colorTheme
    });
  },
  /**
   * 生命周期函数--监听页面显示
   * 更新收藏和预订数据，同步主题状态
   */  onShow() {
    // 每次页面显示时检查登录状态
    const loginStatus = userLoginApi.checkLoginStatus();
    console.log('页面显示时检查登录状态:', loginStatus);

    // 如果本地登录状态与页面状态不一致，更新页面状态
    if (loginStatus.isLoggedIn && !this.data.hasUserInfo) {
      this.setData({
        userInfo: loginStatus.userInfo,
        hasUserInfo: true
      });
    } else if (!loginStatus.isLoggedIn && this.data.hasUserInfo) {
      this.setData({
        userInfo: {
          avatarUrl: defaultAvatarUrl,
          nickName: '',
        },
        hasUserInfo: false
      });
    }

    // 每次页面显示时更新收藏和预订数据
    this.updateCounters();

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar();
      // 强制更新TabBar状态
      tabBar.setData({
        selected: 2,
        preventTransition: false,
        isDarkMode: app.globalData.darkMode,
        selectedColor: app.globalData.darkMode ? "#ffffff" : tabBar._getThemeColor(app.globalData.colorTheme || '默认绿')
      });
      console.log('个人中心TabBar已更新，选中索引: 2');
    }    // 更新主题状态
    const isDarkMode = app.globalData.darkMode || false;
    const colorTheme = app.globalData.colorTheme || '默认绿';
    console.log('onShow中更新主题:', isDarkMode ? '深色模式' : '浅色模式', colorTheme);

    this.setData({
      isDarkMode: isDarkMode,
      colorTheme: colorTheme
    });

    // 应用深色模式修复
    this.fixDarkMode();

    // 确保导航栏颜色更新
    if (typeof app.updateNavBarStyle === 'function') {
      app.updateNavBarStyle();
    }
  },

  /**
   * 同步主题设置到数据库
   * 在用户更改主题时将新的设置保存到云端
   * @param {Boolean} isDarkMode - 是否为深色模式
   * @param {String} colorTheme - 颜色主题名称
   */
  async syncThemeSettings(isDarkMode, colorTheme) {
    try {
      console.log('正在同步主题设置到数据库...', isDarkMode ? '深色模式' : '浅色模式', colorTheme);

      // 检查登录状态，未登录则不同步
      const loginStatus = userLoginApi.checkLoginStatus();
      if (!loginStatus.isLoggedIn) {
        console.log('用户未登录，跳过主题设置同步');
        return;
      }

      // 准备更新参数
      const themeData = {
        theme_setting: isDarkMode ? 'dark' : 'light',
        color_theme: colorTheme || '默认绿'
      };

      // 调用用户更新API
      const updateResult = await userUpdateApi.updateUserProfile(themeData);

      if (updateResult.success) {
        console.log('主题设置已成功同步到数据库');

        // 更新本地用户信息
        const userInfo = wx.getStorageSync('userInfo') || {};
        userInfo.theme_setting = themeData.theme_setting;
        userInfo.color_theme = themeData.color_theme;
        wx.setStorageSync('userInfo', userInfo);
        userLoginApi.updateLoginStatus(userInfo);
      } else {
        console.warn('主题设置同步失败:', updateResult.message);
      }
    } catch (error) {
      console.error('同步主题设置时发生错误:', error);
    }
  },

  /**
   * 更新收藏和预订数量计数器
   * 从本地存储获取数据并更新到页面
   */
  updateCounters() {
    const favorites = wx.getStorageSync('favorites') || [];
    const bookings = wx.getStorageSync('bookings') || [];

    this.setData({
      favoriteCount: favorites.length,
      bookingCount: bookings.length
    });
  },  /**
   * 获取用户信息并登录
   * 使用微信官方API获取用户资料，然后调用云函数登录
   */
  getUserProfile() {
    // 添加防抖，避免短时间内多次调用
    if (this.data.loginLoading) {
      return;
    }

    // 设置加载状态
    this.setData({
      loginLoading: true
    });

    // 不使用全局loading，改为在卡片内显示状态
    // wx.showLoading({
    //   title: '登录中...',
    //   mask: true
    // });

    // 直接使用微信的getUserProfile API
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        const wxUserInfo = res.userInfo;
        console.log('获取到的用户资料:', wxUserInfo);

        // 调用云函数登录
        this.cloudLogin(wxUserInfo);
      },
      fail: (err) => {
        console.error('获取用户资料失败:', err);
        this.setData({
          loginLoading: false
        });

        // 判断错误类型并给出友好提示
        if (err.errMsg === 'getUserProfile:fail auth deny') {
          wx.showToast({
            title: '您已取消授权登录',
            icon: 'none',
            duration: 2000
          });
        } else if (err.errMsg.includes('system error')) {
          wx.showToast({
            title: '系统错误，请稍后再试',
            icon: 'none',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },  /**
   * 调用云函数登录
   * 使用云函数进行微信用户登录认证
   * @param {Object} wxUserInfo - 微信用户资料
   */
  async cloudLogin(wxUserInfo) {
    try {
      // 准备登录参数
      const loginParams = {
        action: 'login',
        wxUserInfo, // 传入微信用户信息
        data: {
          account: `wx_${new Date().getTime()}`, // 使用时间戳生成唯一账号
          password: '123456', // 默认密码
          loginType: 'weixin', // 标识为微信登录
          wxUserInfo // 传入微信获取的用户资料
        }
      };

      // 调用云函数登录
      console.log('正在调用微信登录API...');
      const loginResult = await userLoginApi.userLogin(loginParams);
      console.log('微信登录结果:', loginResult);

      // 设置登录状态结束
      this.setData({
        loginLoading: false
      });

      // 根据登录结果处理
      if (loginResult.success) {
        // 登录成功
        const userInfo = loginResult.data.userInfo || wxUserInfo;

        // 更新本地登录状态
        userLoginApi.updateLoginStatus(userInfo);

        // 更新页面数据
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });

        // 显示欢迎提示
        wx.showToast({
          title: '欢迎回来，' + userInfo.nickName,
          icon: 'success',
          duration: 2000
        });

        // 登录成功后立即更新收藏和预订数据
        this.updateCounters();

        // 如果是新用户，可以提示引导
        if (loginResult.data.isNewUser) {
          setTimeout(() => {
            wx.showModal({
              title: '欢迎加入',
              content: '感谢您注册使用旅游管理小程序，是否立即完善个人资料？',
              confirmText: '去设置',
              cancelText: '稍后',
              success: (res) => {
                if (res.confirm) {
                  // 跳转到设置页面
                  wx.navigateTo({
                    url: '/pages/settings/settings'
                  });
                }
              }
            });
          }, 1500);
        }
      } else {
        // 登录失败，使用本地临时用户信息
        console.error('微信登录失败，使用本地临时信息:', loginResult.message);
        wx.setStorageSync('userInfo', wxUserInfo);

        this.setData({
          userInfo: wxUserInfo,
          hasUserInfo: true
        });

        // 如果错误信息包含数据库集合不存在，显示特殊提示
        if (loginResult.message &&
          (loginResult.message.includes('数据库集合不存在') ||
            loginResult.error?.includes('database collection not exists'))) {
          this.showCloudDbTip();
        } else {
          wx.showToast({
            title: loginResult.message || '登录异常，已使用本地信息',
            icon: 'none',
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('微信登录过程发生错误:', error);

      // 恢复未登录状态
      this.setData({
        loginLoading: false
      });

      // 错误发生时使用本地临时存储
      if (wxUserInfo) {
        wx.setStorageSync('userInfo', wxUserInfo);
        this.setData({
          userInfo: wxUserInfo,
          hasUserInfo: true
        });

        // 检查是否是数据库集合不存在的错误
        const errorMsg = error.message || error.toString();
        if (errorMsg.includes('database collection not exists') ||
          errorMsg.includes('数据库集合不存在')) {
          this.showCloudDbTip();
        } else {
          wx.showModal({
            title: '登录提示',
            content: '微信登录失败，是否使用本地模式继续？',
            confirmText: '使用本地',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                // 已经在前面设置了hasUserInfo为true，这里不需要额外操作
                wx.showToast({
                  title: '已切换至本地模式',
                  icon: 'none',
                  duration: 2000
                });
              } else {
                // 用户取消，恢复未登录状态
                this.setData({
                  userInfo: {
                    avatarUrl: defaultAvatarUrl,
                    nickName: '',
                  },
                  hasUserInfo: false
                });
                wx.removeStorageSync('userInfo');
              }
            }
          });
        }
      } else {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    }
  },
  /**
   * 提示用户需要创建云数据库集合
   * 显示数据库配置错误的提示信息
   */
  showCloudDbTip() {
    wx.showModal({
      title: '云开发配置提示',
      content: '请在云开发控制台创建"users"集合，或使用本地模式继续操作',
      confirmText: '我知道了',
      showCancel: false,
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认了云开发配置提示');
        }
      }
    });
  },
  /**
   * 选择头像事件处理（新版微信API）
   * 使用微信提供的chooseAvatar开放能力获取用户头像
   * @param {Object} e - 事件对象，包含头像信息
   */  async onChooseAvatar(e) {
    console.log('头像选择回调', e);
    // 检查是否存在avatarUrl，如果不存在可能是用户取消了
    if (e.detail && e.detail.avatarUrl) {
      const { avatarUrl } = e.detail;
      const userInfo = this.data.userInfo;

      // 先在本地更新头像
      userInfo.avatarUrl = avatarUrl;

      // 显示加载状态
      wx.showLoading({
        title: '正在更新头像...',
        mask: true
      });

      try {
        // 调用云函数上传头像
        const uploadResult = await userUpdateApi.uploadAvatar({
          filePath: avatarUrl
        });

        console.log('头像上传结果:', uploadResult);

        if (uploadResult.success) {
          // 更新本地用户信息
          userInfo.avatar_url = uploadResult.fileID || avatarUrl;

          // 如果返回了完整的用户信息，则使用服务器返回的数据
          if (uploadResult.userInfo) {
            // 保留UI显示所需的字段
            const serverUserInfo = uploadResult.userInfo;
            serverUserInfo.avatarUrl = serverUserInfo.avatarUrl || serverUserInfo.avatar_url || avatarUrl;
            serverUserInfo.nickName = serverUserInfo.nickName || serverUserInfo.nickname || userInfo.nickName;

            // 更新到本地存储
            wx.setStorageSync('userInfo', serverUserInfo);
            userLoginApi.updateLoginStatus(serverUserInfo);

            // 更新页面显示
            this.setData({
              userInfo: serverUserInfo,
              hasUserInfo: serverUserInfo.nickName && serverUserInfo.nickName !== '微信用户' && serverUserInfo.avatarUrl,
            });
          } else {
            // 没有返回完整用户信息，只更新本地数据
            wx.setStorageSync('userInfo', userInfo);

            // 更新页面显示
            this.setData({
              userInfo,
              hasUserInfo: userInfo.nickName && userInfo.nickName !== '微信用户' && avatarUrl,
            });
          }

          wx.showToast({
            title: '头像上传成功',
            icon: 'success',
            duration: 2000
          });
        } else {
          // 上传失败，仅更新本地显示
          console.warn('头像上传到云端失败，仅使用本地路径:', uploadResult.message);

          wx.setStorageSync('userInfo', userInfo);

          this.setData({
            userInfo,
            hasUserInfo: userInfo.nickName && userInfo.nickName !== '微信用户' && avatarUrl,
          });

          wx.showToast({
            title: '头像已更新(本地)',
            icon: 'success',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('头像上传过程发生错误:', error);
        // 出错时只在本地更新
        wx.setStorageSync('userInfo', userInfo);

        this.setData({
          userInfo,
          hasUserInfo: userInfo.nickName && userInfo.nickName !== '微信用户' && avatarUrl,
        });

        wx.showToast({
          title: '头像已更新(本地)',
          icon: 'success',
          duration: 2000
        });
      } finally {
        wx.hideLoading();
      }
    } else {
      console.log('用户取消了头像选择');
      // 可以不做任何处理，或者显示提示
    }
  },  /**
   * 进入编辑昵称状态
   * 设置编辑状态并初始化临时昵称
   */
  editNickname() {
    this.setData({
      isEditingNickname: true,
      tempNickName: this.data.userInfo.nickName !== '微信用户' ? this.data.userInfo.nickName : ''
    });
  },

  /**
   * 昵称输入事件处理
   * 实时更新临时昵称变量
   * @param {Object} e - 输入事件对象
   */
  onInputNickname(e) {
    this.setData({
      tempNickName: e.detail.value
    });
  },
  /**
   * 保存昵称
   * 验证并保存用户输入的昵称
   * @param {Object} e - 确认事件对象
   */  async saveNickname(e) {
    const nickName = e.detail.value || this.data.tempNickName;

    // 检查昵称是否为空
    if (!nickName || nickName.trim() === '') {
      // 如果输入为空，退出编辑模式但不保存
      this.setData({
        isEditingNickname: false
      });
      return;
    }

    // 获取当前登录状态，后续用于恢复
    const loginStatus = userLoginApi.checkLoginStatus();

    // 先获取完整的当前用户信息(创建深拷贝避免引用问题)
    const currentUserInfo = JSON.parse(JSON.stringify(this.data.userInfo || {}));
    const originalUserInfo = JSON.parse(JSON.stringify(currentUserInfo)); // 备份原始信息
    const trimmedNickName = nickName.trim();

    // 更新本地用户信息
    currentUserInfo.nickName = trimmedNickName;
    currentUserInfo.nickname = trimmedNickName; // 同时更新两种命名方式

    // 先将用户退出编辑模式，提升用户体验
    this.setData({
      isEditingNickname: false,
      userInfo: currentUserInfo,
      hasUserInfo: currentUserInfo.nickName && currentUserInfo.avatarUrl && currentUserInfo.avatarUrl !== defaultAvatarUrl
    });

    // 先在本地更新用户信息，确保不会丢失登录态
    if (loginStatus.isLoggedIn) {
      // 重要：保留原始关键标识字段
      const localStorageUserInfo = wx.getStorageSync('userInfo') || {};
      localStorageUserInfo.nickName = trimmedNickName;
      localStorageUserInfo.nickname = trimmedNickName;

      // 确保关键ID字段不丢失
      currentUserInfo._id = currentUserInfo._id || localStorageUserInfo._id;
      currentUserInfo._openid = currentUserInfo._openid || localStorageUserInfo._openid;
      currentUserInfo.account = currentUserInfo.account || localStorageUserInfo.account;

      // 更新本地存储
      wx.setStorageSync('userInfo', currentUserInfo);

      // 重要：维持登录状态
      userLoginApi.updateLoginStatus(currentUserInfo);
    }

    // 显示加载状态
    wx.showLoading({
      title: '正在同步昵称...',
      mask: true
    });

    try {
      // 调用云函数更新昵称
      const updateResult = await userUpdateApi.updateUserProfile({
        nickname: trimmedNickName
      });

      console.log('昵称更新结果:', updateResult);

      if (updateResult.success) {
        // 如果返回了完整的用户信息，则使用服务器返回的数据
        if (updateResult.userInfo) {
          // 创建合并后的用户信息，保留所有重要字段
          const serverUserInfo = {
            ...currentUserInfo,  // 保留当前信息
            ...updateResult.userInfo // 合并服务器返回的信息
          };

          // 确保UI需要的字段正确存在
          serverUserInfo.avatarUrl = serverUserInfo.avatarUrl || serverUserInfo.avatar_url || currentUserInfo.avatarUrl;
          serverUserInfo.nickName = serverUserInfo.nickName || serverUserInfo.nickname || trimmedNickName;

          // 确保关键标识字段不被覆盖为null或undefined
          serverUserInfo._id = serverUserInfo._id || currentUserInfo._id;
          serverUserInfo._openid = serverUserInfo._openid || currentUserInfo._openid;
          serverUserInfo.account = serverUserInfo.account || currentUserInfo.account;

          // 更新到本地存储
          wx.setStorageSync('userInfo', serverUserInfo);
          userLoginApi.updateLoginStatus(serverUserInfo);

          // 更新页面显示
          this.setData({
            userInfo: serverUserInfo,
            hasUserInfo: true
          });
        } else {
          // 没有返回完整用户信息，保证本地数据被正确保存
          wx.setStorageSync('userInfo', currentUserInfo);
          userLoginApi.updateLoginStatus(currentUserInfo);
        }

        wx.showToast({
          title: '昵称设置成功',
          icon: 'success',
          duration: 2000
        });
      } else {
        // 重要：即使更新失败，也要确保用户不会退出登录
        console.warn('昵称同步到云端失败:', updateResult.message);

        // 确保本地用户信息包含更新的昵称
        const localUserInfo = wx.getStorageSync('userInfo') || {};
        localUserInfo.nickName = trimmedNickName;
        localUserInfo.nickname = trimmedNickName;

        // 保存回本地并维持登录状态
        wx.setStorageSync('userInfo', localUserInfo);
        userLoginApi.updateLoginStatus(localUserInfo);

        wx.showToast({
          title: '昵称已更新(本地)',
          icon: 'success',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('昵称更新过程发生错误:', error);

      // 出错时也要确保用户不会退出登录
      const localUserInfo = wx.getStorageSync('userInfo') || {};
      localUserInfo.nickName = trimmedNickName;
      localUserInfo.nickname = trimmedNickName;

      // 确保关键ID字段不丢失
      localUserInfo._id = localUserInfo._id || originalUserInfo._id;
      localUserInfo._openid = localUserInfo._openid || originalUserInfo._openid;
      localUserInfo.account = localUserInfo.account || originalUserInfo.account;

      // 无论如何都保存本地更新并维持登录状态
      wx.setStorageSync('userInfo', localUserInfo);
      userLoginApi.updateLoginStatus(localUserInfo);

      // 确保页面显示保持一致
      this.setData({
        userInfo: localUserInfo,
        hasUserInfo: true
      });

      wx.showToast({
        title: '昵称已更新(本地)',
        icon: 'success',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },
  /**
   * 选择头像（旧版微信API的兼容处理）
   * 使用wx.chooseImage提供向下兼容的头像选择
   */
  chooseAvatarLegacy() {
    wx.showToast({
      title: '正在打开相册',
      icon: 'none',
      duration: 1000
    });

    wx.chooseImage({
      count: 1,                      // 最多选择1张图片
      sizeType: ['compressed'],      // 压缩图片类型
      sourceType: ['album', 'camera'], // 来源：相册和相机
      success: (res) => {
        // 获取图片临时路径
        const tempFilePath = res.tempFilePaths[0];

        // 更新用户头像
        const userInfo = this.data.userInfo;
        userInfo.avatarUrl = tempFilePath;

        this.setData({
          userInfo,
          hasUserInfo: userInfo.nickName && tempFilePath,
        });

        wx.setStorageSync('userInfo', userInfo);

        // 如果需要上传到服务器，可以在这里添加上传逻辑
        // wx.uploadFile({...})
      }
    });
  },
  /**
   * 页面导航处理
   * 根据点击的菜单项跳转到相应页面
   * @param {Object} e - 点击事件对象，包含目标URL
   */
  navigateToPage(e) {
    const url = e.currentTarget.dataset.url;

    // 跳转到相应页面
    if (url === '/pages/favorites/favorites') {
      // 我的收藏
      if (this.data.favoriteCount > 0) {
        wx.navigateTo({ url });
      } else {
        wx.showToast({
          title: '暂无收藏',
          icon: 'none'
        });
      }
    } else if (url === '/pages/bookings/bookings') {
      // 我的预订
      if (this.data.bookingCount > 0) {
        wx.navigateTo({ url });
      } else {
        wx.showToast({
          title: '暂无预订记录',
          icon: 'none'
        });
      }
    } else if (url === '/pages/about/about' ||
      url === '/pages/feedback/feedback' ||
      url === '/pages/settings/settings') {
      wx.navigateTo({ url });
    } else {
      // 其他未完成的页面
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  },  /**
   * 注销登录
   * 调用登出API，清除本地存储的用户信息并重置状态
   */
  logout() {
    wx.showModal({
      title: '确认注销',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 显示加载提示
          wx.showLoading({
            title: '正在注销...',
            mask: true
          });

          // 使用登出API
          const logoutResult = userLoginApi.logout();
          console.log('注销结果:', logoutResult);

          // 隐藏加载提示
          wx.hideLoading();

          // 重置用户信息
          this.setData({
            userInfo: {
              avatarUrl: defaultAvatarUrl,
              nickName: '',
            },
            hasUserInfo: false,
            isEditingNickname: false
          });

          wx.showToast({
            title: logoutResult.message || '已注销登录',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },
  /**
   * 页面滚动事件处理
   * 禁用了自动隐藏TabBar功能，TabBar始终保持显示
   * @param {Object} e - 滚动事件对象
   */
  onPageScroll(e) {
    const scrollTop = e.scrollTop;

    // 获取tabBar实例并确保它始终可见
    const tabBar = this.getTabBar();
    if (tabBar) {
      // 始终保持TabBar可见
      tabBar.toggleVisible(true);
    }

    // 仍然记录滚动位置，以便将来需要时使用
    this.setData({ lastScrollTop: scrollTop });
  },  /**
   * 获取用户资料
   * 从云端获取最新用户资料
   */
  async fetchUserProfile() {
    // 检查登录状态
    const loginStatus = userLoginApi.checkLoginStatus();

    if (!loginStatus.isLoggedIn) {
      console.log('用户未登录，无法获取云端资料');
      return;
    }

    try {
      // 尝试从云端获取用户最新资料
      console.log('正在从云端获取用户资料...');

      // 显示加载提示（可选，如果加载过程较长）
      // wx.showLoading({ title: '获取资料中...', mask: false });

      // 获取当前用户信息
      const localUserInfo = wx.getStorageSync('userInfo') || {};
      let profileResult = null;
      let source = '';

      // 优先使用UserUpdate API，传递account参数
      if (userUpdateApi && userUpdateApi.getUserProfile) {
        console.log('UserUpdate模块可用，尝试获取用户资料...');
        try {
          profileResult = await userUpdateApi.getUserProfile({
            account: localUserInfo.account || loginStatus.userInfo.account
          });
          source = 'UserUpdate';
          console.log('使用UserUpdate API获取用户资料结果:', profileResult);
        } catch (updateApiError) {
          console.error('UserUpdate API获取资料失败，尝试备选方法:', updateApiError);
          // 如果失败，将fallback到UserLoginApi
          profileResult = await userLoginApi.fetchUserProfile();
          source = 'UserLogin';
          console.log('使用UserLogin API获取用户资料结果:', profileResult);
        }
      } else {
        // 如果UserUpdate模块不可用，使用UserLoginApi
        profileResult = await userLoginApi.fetchUserProfile();
        source = 'UserLogin';
        console.log('使用UserLogin API获取用户资料结果:', profileResult);
      }

      // wx.hideLoading(); // 隐藏加载提示

      // 如果成功获取到了用户资料
      if (profileResult.success && profileResult.userInfo) {
        // 确保云端返回的用户信息完整
        const userInfo = profileResult.userInfo;
        const completeUserInfo = {
          ...userInfo,
          // 确保关键字段存在，避免undefined错误
          nickname: userInfo.nickname || userInfo.nickName || '用户',
          nickName: userInfo.nickname || userInfo.nickName || '用户',
          avatarUrl: userInfo.avatarUrl || userInfo.avatar_url || defaultAvatarUrl,
          avatar_url: userInfo.avatarUrl || userInfo.avatar_url || defaultAvatarUrl
        };

        // 更新本地存储
        wx.setStorageSync('userInfo', completeUserInfo);

        // 更新页面数据
        this.setData({
          userInfo: completeUserInfo,
          hasUserInfo: true
        });

        console.log('用户资料已从云端更新，并完善了缺失字段');
      } else {
        // 如果有UserUpdate模块中的获取用户资料函数，则尝试使用它作为备选
        if (userUpdateApi && userUpdateApi.getUserProfile) {
          const backupResult = await userUpdateApi.getUserProfile();
          console.log('备选获取用户资料结果:', backupResult);

          // 如果成功获取到了用户资料
          if (backupResult.success && backupResult.userInfo) {
            // 更新本地存储
            wx.setStorageSync('userInfo', backupResult.userInfo);
            // 更新页面数据
            this.setData({
              userInfo: backupResult.userInfo,
              hasUserInfo: true
            });

            console.log('用户资料已从备选API更新');
          }
        }
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
      // wx.hideLoading(); // 隐藏加载提示
    }
  },

  /**
   * 监听账号输入
   * @param {Object} e - 输入事件对象
   */
  onAccountInput(e) {
    this.setData({
      account: e.detail.value
    });
  },

  /**
   * 监听密码输入
   * @param {Object} e - 输入事件对象
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  /**
   * 账号密码登录
   * 验证输入并调用API登录
   */
  accountLogin() {
    // 获取输入的账号和密码
    const { account, password } = this.data;

    // 简单的输入验证
    if (!account || account.trim() === '') {
      wx.showToast({
        title: '请输入账号',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!password || password.length < 6) {
      wx.showToast({
        title: '请输入至少6位的密码',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 防抖，避免短时间内多次调用
    if (this.data.loginLoading) {
      return;
    }

    // 设置加载状态
    this.setData({
      loginLoading: true
    });

    console.log('正在使用账号密码登录...');

    // 调用账号密码登录API
    this.apiAccountLogin(account, password);
  },

  /**
   * 调用API进行账号密码登录
   * @param {String} account - 用户账号
   * @param {String} password - 用户密码
   */
  async apiAccountLogin(account, password) {
    try {
      // 准备登录参数
      const loginParams = {
        action: 'login',
        data: {
          account: account,
          password: password,
          loginType: 'account' // 标识为账号密码登录
        }
      };

      console.log('正在调用云函数登录API...');

      // 调用云函数登录API
      const loginResult = await userLoginApi.userLogin(loginParams);
      console.log('账号登录结果:', loginResult);

      // 结束登录状态
      this.setData({
        loginLoading: false
      });      // 根据登录结果处理
      if (loginResult.success) {
        // 登录成功
        const userInfo = loginResult.data.userInfo;

        // 处理头像URL - 优先使用avatarUrl，如果没有则尝试使用avatar_url，最后使用默认头像
        if (!userInfo.avatarUrl && userInfo.avatar_url) {
          userInfo.avatarUrl = userInfo.avatar_url;
        } else if (!userInfo.avatarUrl) {
          userInfo.avatarUrl = defaultAvatarUrl;
        }

        // 处理昵称 - 优先使用nickName，如果没有则尝试使用nickname
        if (!userInfo.nickName && userInfo.nickname) {
          userInfo.nickName = userInfo.nickname;
        }

        // 确保返回的数据有color_theme和theme_setting字段，用于主题设置
        const colorTheme = userInfo.color_theme || '默认绿';
        const themeMode = userInfo.theme_setting || 'light';

        // 更新本地登录状态
        userLoginApi.updateLoginStatus(userInfo);

        // 更新页面数据
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
          colorTheme: colorTheme,
          isDarkMode: themeMode === 'dark',
          account: '', // 清空表单
          password: ''
        });

        // 显示欢迎提示
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        });

        // 登录成功后立即更新收藏和预订数据
        this.updateCounters();
      } else {
        // 登录失败，显示错误信息
        wx.showToast({
          title: loginResult.message || '账号或密码错误',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('账号登录过程发生错误:', error);

      // 恢复未登录状态
      this.setData({
        loginLoading: false
      });

      // 显示错误信息
      wx.showToast({
        title: '登录失败，请检查网络或稍后重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 显示注册提示
   * 向用户展示注册账号的信息
   */
  showRegisterTip() {
    wx.showModal({
      title: '注册账号',
      content: '请联系管理员创建账号，或使用微信快捷登录',
      confirmText: '我知道了',
      showCancel: false
    });
  },

  /**
   * 显示重置密码提示
   * 向用户展示找回密码的信息
   */
  showResetPwdTip() {
    wx.showModal({
      title: '找回密码',
      content: '如需重置密码，请联系系统管理员',
      confirmText: '我知道了',
      showCancel: false
    });
  },

  /**
   * 应用深色模式修复
   * 强制更新深色模式样式，解决渲染问题
   */
  fixDarkMode() {
    const currentDarkMode = this.data.isDarkMode;

    // 立即应用深色模式
    wx.nextTick(() => {
      // 使用setData触发页面重新渲染
      this.setData({
        _forceRender: Date.now()
      });

      // 200ms后再次检查，确保样式应用
      setTimeout(() => {
        // 确保主界面背景色正确应用
        if (currentDarkMode) {
          wx.createSelectorQuery()
            .select('.user-info-bg')
            .fields({ node: true }, res => {
              if (res && res.node) {
                res.node.style.backgroundColor = '#222222';
                res.node.style.backgroundImage = 'none';
              }
            })
            .exec();
        }
      }, 200);
    });
  },

  /**
   * 修复深色模式样式不生效问题
   * @param {Boolean} isDarkMode - 是否处于深色模式
   */
  fixDarkMode(isDarkMode = null) {
    // 如果未提供isDarkMode参数，使用当前状态
    if (isDarkMode === null) {
      isDarkMode = this.data.isDarkMode;
    }

    console.log('执行深色模式修复, 当前状态:', isDarkMode ? '深色模式' : '浅色模式');

    // 方法1：通过setData强制刷新页面状态
    this.setData({
      isDarkMode: isDarkMode
    });

    // 方法2：直接操作DOM元素
    if (wx.createSelectorQuery) {
      // 修复用户信息背景
      wx.createSelectorQuery().in(this)
        .selectAll('.user-info-bg')
        .fields({ node: true, size: true })
        .exec(res => {
          if (res && res[0] && res[0].length > 0) {
            res[0].forEach(item => {
              if (item.node) {
                if (isDarkMode) {
                  item.node.style.backgroundColor = '#222222';
                  item.node.style.backgroundImage = 'none';
                }
              }
            });
          }
        });

      // 给容器元素添加/移除dark-mode类
      wx.createSelectorQuery().in(this)
        .selectAll('.container, .user-info-section')
        .fields({ node: true })
        .exec(res => {
          if (res && res[0] && res[0].length > 0) {
            res[0].forEach(item => {
              if (item.node && item.node.classList) {
                if (isDarkMode) {
                  if (!item.node.classList.contains('dark-mode')) {
                    item.node.classList.add('dark-mode');
                  }
                  // 同时将深色状态加入dataset，增加CSS选择器的适配性
                  item.node.dataset.theme = 'dark';
                } else {
                  item.node.classList.remove('dark-mode');
                  item.node.dataset.theme = '';
                }
              }
            });
          }
        });
    }

    // 触发页面重绘
    this.triggerEvent('themeChanged', { isDarkMode });
  },
}))