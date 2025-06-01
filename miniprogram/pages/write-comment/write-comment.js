/**
 * @file pages/write-comment/write-comment.js
 * @description 写评论页面的业务逻辑
 * @version 1.0.0
 * @date 2025-05-30
 * @author Tourism_Management开发团队
 * 
 * 功能说明:
 * - 用户撰写景点评论
 * - 支持评分、文字内容和图片上传
 * - 处理评论提交和验证
 */

// 获取全局应用实例
const app = getApp()
const CommentApi = require('../../server/CommentApi.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    spotId: '',
    spotName: '',
    rating: 5,
    content: '',
    images: [],
    maxImages: 9,
    submitting: false,
    isDarkMode: false,
    colorTheme: '默认绿'
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { spotId, spotName } = options;

    this.setData({
      spotId: spotId || '',
      spotName: decodeURIComponent(spotName || ''),
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: `评价 ${decodeURIComponent(spotName || '')}`
    });

    // 更新导航栏样式以匹配主题
    this.updateNavigationBarStyle();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 确保每次页面显示时都更新主题
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 更新导航栏样式
    this.updateNavigationBarStyle();
  },

  /**
   * 更新导航栏样式以匹配当前主题
   */
  updateNavigationBarStyle() {
    const { isDarkMode, colorTheme } = this.data;
    let backgroundColor;

    // 根据颜色主题和深色模式设置不同的背景色
    if (isDarkMode) {
      backgroundColor = '#222222'; // 深色模式统一使用深灰色背景
    } else {
      // 根据颜色主题选择对应的背景色
      switch (colorTheme) {
        case '天空蓝':
          backgroundColor = '#1296db';
          break;
        case '中国红':
          backgroundColor = '#e54d42';
          break;
        case '默认绿':
        default:
          backgroundColor = '#1aad19';
          break;
      }
    }

    // 设置导航栏颜色
    wx.setNavigationBarColor({
      frontColor: '#ffffff',  // 统一使用白色文字，确保在所有背景下可读性
      backgroundColor: backgroundColor,
      animation: {
        duration: 0, // 移除动画，避免主题切换时的闪烁
        timingFunc: 'linear'
      }
    });
  },

  /**
   * 设置评分
   */
  setRating(e) {
    const rating = parseInt(e.currentTarget.dataset.rating);
    this.setData({ rating });

    // 轻震动反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  /**
   * 输入评论内容
   */
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  /**
   * 选择图片
   */
  chooseImages() {
    const remainingCount = this.data.maxImages - this.data.images.length;

    if (remainingCount <= 0) {
      wx.showToast({
        title: `最多只能上传${this.data.maxImages}张图片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remainingCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: [...this.data.images, ...tempFiles]
        });
      }
    });
  },

  /**
   * 删除图片
   */
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);

    this.setData({ images });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const current = e.currentTarget.dataset.src;

    wx.previewImage({
      current: current,
      urls: this.data.images
    });
  },

  /**
   * 提交评论
   */
  async submitComment() {
    const { rating, content, images, spotId } = this.data;

    // 验证评论内容
    if (!content.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    if (content.trim().length < 10) {
      wx.showToast({
        title: '评论内容至少10个字符',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    // 模拟提交过程
    wx.showLoading({
      title: '提交中...'
    });

    try {
      const commentData = {
        common: content.trim(),
        spot_id: parseInt(spotId),
        person: app.globalData.userInfo._openid || app.globalData.userInfo.openid || ''
      };
      const res = await CommentApi.addComment(commentData);

      wx.hideLoading();

      if (res.success) {
        wx.showToast({
          title: '评论发布成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.message || '评论发布失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交评论失败:', error);
      wx.showToast({
        title: '评论发布失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
  }
});
