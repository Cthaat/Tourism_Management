// 全局用户资料功能测试页面
Page({
  data: {
    globalUserInfo: null,
    localUserInfo: null,
    testResults: []
  },

  onLoad() {
    console.log('测试页面加载');
    this.runTests();
  },

  onShow() {
    // 每次显示时重新测试
    this.runTests();
  },

  /**
   * 运行所有测试
   */
  runTests() {
    const results = [];
    
    // 测试1: 获取全局用户信息
    const globalTest = this.testGlobalUserInfo();
    results.push(globalTest);
    
    // 测试2: 获取本地用户信息
    const localTest = this.testLocalUserInfo();
    results.push(localTest);
    
    // 测试3: 比较全局和本地信息
    const compareTest = this.testCompareInfo();
    results.push(compareTest);
    
    // 更新页面数据
    this.setData({
      testResults: results,
      globalUserInfo: globalTest.data,
      localUserInfo: localTest.data
    });

    console.log('测试完成，结果:', results);
  },

  /**
   * 测试全局用户信息获取
   */
  testGlobalUserInfo() {
    try {
      const app = getApp();
      const userInfo = app.getUserInfo();
      
      return {
        name: '全局用户信息获取',
        success: !!userInfo,
        message: userInfo ? '成功获取全局用户信息' : '全局用户信息为空',
        data: userInfo,
        details: userInfo ? {
          hasNickName: !!userInfo.nickName,
          hasAvatar: !!userInfo.avatarUrl,
          hasId: !!userInfo._id,
          fieldCount: Object.keys(userInfo).length
        } : null
      };
    } catch (error) {
      return {
        name: '全局用户信息获取',
        success: false,
        message: '获取全局用户信息失败: ' + error.message,
        data: null,
        error: error
      };
    }
  },

  /**
   * 测试本地用户信息获取
   */
  testLocalUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      
      return {
        name: '本地用户信息获取',
        success: !!userInfo,
        message: userInfo ? '成功获取本地用户信息' : '本地用户信息为空',
        data: userInfo,
        details: userInfo ? {
          hasNickName: !!userInfo.nickName,
          hasAvatar: !!userInfo.avatarUrl,
          hasId: !!userInfo._id,
          fieldCount: Object.keys(userInfo).length
        } : null
      };
    } catch (error) {
      return {
        name: '本地用户信息获取',
        success: false,
        message: '获取本地用户信息失败: ' + error.message,
        data: null,
        error: error
      };
    }
  },

  /**
   * 测试全局和本地信息对比
   */
  testCompareInfo() {
    try {
      const app = getApp();
      const globalInfo = app.getUserInfo();
      const localInfo = wx.getStorageSync('userInfo');
      
      if (!globalInfo && !localInfo) {
        return {
          name: '信息对比',
          success: true,
          message: '全局和本地信息都为空，状态一致',
          data: null
        };
      }
      
      if (!globalInfo || !localInfo) {
        return {
          name: '信息对比',
          success: false,
          message: '全局和本地信息不一致（一个为空）',
          data: {
            globalExists: !!globalInfo,
            localExists: !!localInfo
          }
        };
      }
      
      // 比较关键字段
      const comparison = {
        nickNameMatch: globalInfo.nickName === localInfo.nickName,
        avatarMatch: globalInfo.avatarUrl === localInfo.avatarUrl,
        idMatch: globalInfo._id === localInfo._id
      };
      
      const allMatch = Object.values(comparison).every(match => match);
      
      return {
        name: '信息对比',
        success: allMatch,
        message: allMatch ? '全局和本地信息一致' : '全局和本地信息存在差异',
        data: comparison
      };
    } catch (error) {
      return {
        name: '信息对比',
        success: false,
        message: '信息对比失败: ' + error.message,
        data: null,
        error: error
      };
    }
  },

  /**
   * 手动刷新用户信息
   */
  async refreshUserInfo() {
    wx.showLoading({
      title: '刷新中...'
    });

    try {
      const app = getApp();
      const result = await app.refreshUserInfo();
      
      wx.hideLoading();
      
      if (result.success) {
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        });
        
        // 重新运行测试
        setTimeout(() => {
          this.runTests();
        }, 1000);
      } else {
        wx.showToast({
          title: '刷新失败: ' + result.message,
          icon: 'none',
          duration: 3000
        });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '刷新出错: ' + error.message,
        icon: 'none',
        duration: 3000
      });
    }
  },

  /**
   * 查看详细信息
   */
  showDetails(e) {
    const { type } = e.currentTarget.dataset;
    let content = '';
    
    if (type === 'global' && this.data.globalUserInfo) {
      content = JSON.stringify(this.data.globalUserInfo, null, 2);
    } else if (type === 'local' && this.data.localUserInfo) {
      content = JSON.stringify(this.data.localUserInfo, null, 2);
    } else {
      content = '无数据';
    }
    
    wx.showModal({
      title: type === 'global' ? '全局用户信息' : '本地用户信息',
      content: content,
      showCancel: false,
      confirmText: '关闭'
    });
  }
});
