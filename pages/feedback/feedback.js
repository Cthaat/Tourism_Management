// pages/feedback/feedback.js
const app = getApp();

Page({
  data: {
    feedbackContent: '',
    contactInfo: '',
    feedbackTypes: [
      { id: 1, name: '功能建议', checked: true },
      { id: 2, name: '页面优化', checked: false },
      { id: 3, name: '内容问题', checked: false },
      { id: 4, name: '其他', checked: false }
    ],
    selectedType: '功能建议',
    contentCount: 0,
    maxContentLength: 200,
    submitDisabled: true,
    isDarkMode: false, // 添加深色模式状态
    colorTheme: '默认绿' // 添加颜色主题变量
  },

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

  onShow() {
    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 确保导航栏颜色更新
    app.updateNavBarStyle();
  },

  // 处理反馈内容输入
  handleContentInput(e) {
    const content = e.detail.value;
    const contentCount = content.length;

    this.setData({
      feedbackContent: content,
      contentCount,
      submitDisabled: contentCount === 0
    });
  },

  // 处理联系方式输入
  handleContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  // 选择反馈类型
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

  // 提交反馈
  submitFeedback() {
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