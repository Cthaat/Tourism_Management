/**
 * @fileoverview 旅游管理小程序 - 用户反馈页面
 * @description 此文件实现了用户反馈功能，包括反馈类型选择、反馈内容填写、联系方式提供等功能
 * @author 旅游管理系统开发团队
 * @version 1.0.0
 * @date 2025-05-13
 * 
 * 功能列表：
 * 1. 反馈类型选择（功能建议、页面优化、内容问题、其他）
 * 2. 反馈内容填写（限制 200 字）
 * 3. 可选联系方式提供
 * 4. 支持深色模式和多种颜色主题
 */

// 获取应用实例
const app = getApp();

/**
 * 用户反馈页面
 */
Page({
  /**
   * 页面的初始数据
   */  data: {
    feedbackContent: '',           // 用户输入的反馈内容
    contactInfo: '',               // 用户输入的联系方式
    feedbackTypes: [               // 反馈类型选项列表
      { id: 1, name: '功能建议', checked: true },
      { id: 2, name: '页面优化', checked: false },
      { id: 3, name: '内容问题', checked: false },
      { id: 4, name: '其他', checked: false }
    ],
    selectedType: '功能建议',      // 当前选中的反馈类型
    contentCount: 0,               // 当前反馈内容字数统计
    maxContentLength: 200,         // 反馈内容最大允许字数
    submitDisabled: true,          // 提交按钮是否禁用状态
    isDarkMode: false,             // 深色模式状态标志
    colorTheme: '默认绿'           // 当前应用的颜色主题名称
  },
  /**
   * 生命周期函数--监听页面加载
   * 初始化主题设置并监听主题变化
   */
  onLoad() {
    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,
        colorTheme: colorTheme
      });
    });

    // 初始化主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
  },

  /**
   * 生命周期函数--监听页面显示
   * 更新主题状态并确保导航栏样式正确
   */
  onShow() {
    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },
  /**
   * 处理反馈内容输入事件
   * 更新反馈内容、字数统计以及提交按钮状态
   * @param {Object} e - 输入事件对象
   */
  handleContentInput(e) {
    const content = e.detail.value;
    const contentCount = content.length;

    this.setData({
      feedbackContent: content,
      contentCount,
      submitDisabled: contentCount === 0
    });
  },

  /**
   * 处理联系方式输入事件
   * 更新联系方式信息
   * @param {Object} e - 输入事件对象
   */
  handleContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  /**
   * 处理反馈类型变更事件
   * 更新选中的反馈类型及对应状态
   * @param {Object} e - 变更事件对象
   */
  handleTypeChange(e) {
    const selectedTypeId = parseInt(e.detail.value);
    const feedbackTypes = this.data.feedbackTypes.map(type => {
      return {
        ...type,
        checked: type.id === selectedTypeId
      };
    });

    const selectedType = this.data.feedbackTypes.find(
      type => type.id === selectedTypeId
    ).name;

    this.setData({
      feedbackTypes,
      selectedType
    });
  },
  /**
   * 提交反馈信息
   * 验证输入内容，并模拟提交反馈到服务器
   * 提交成功后返回上一页面
   */
  submitFeedback() {
    // 验证反馈内容是否为空
    if (!this.data.feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    // 在真实应用中，这里会将数据发送到服务器
    wx.showLoading({
      title: '提交中...'
    });

    // 模拟网络请求
    setTimeout(() => {
      wx.hideLoading();

      wx.showToast({
        title: '感谢您的反馈！',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }, 1500);
  }
})