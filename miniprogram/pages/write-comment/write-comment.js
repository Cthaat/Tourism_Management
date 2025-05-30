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
  submitComment() {
    const { rating, content, images, spotId, spotName } = this.data;

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

    setTimeout(() => {
      wx.hideLoading();

      // 构建评论数据
      const newComment = {
        id: `comment_${Date.now()}`,
        userId: 'current_user',
        userName: '我',
        userAvatar: '/images/default-avatar.png',
        rating: rating,
        content: content.trim(),
        timeAgo: '刚刚',
        likeCount: 0,
        helpfulCount: 0,
        isLiked: false,
        images: images,
        replies: []
      };

      // 保存到本地存储（实际项目中应保存到云数据库）
      const commentKey = `comments_${spotId}`;
      const existingComments = wx.getStorageSync(commentKey) || [];
      existingComments.unshift(newComment);
      wx.setStorageSync(commentKey, existingComments);

      wx.showToast({
        title: '评论发布成功',
        icon: 'success'
      });

      this.setData({ submitting: false });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    }, 2000);
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
