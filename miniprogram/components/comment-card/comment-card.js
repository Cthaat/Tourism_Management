/**
 * ================================================================
 * 文件名: comment-card.js
 * 描述: 评论卡片组件的逻辑实现
 * 版本: 1.0.0
 * 创建日期: 2025-05-30
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 展示用户评论信息和评分
 * - 支持深色模式和多种颜色主题
 * - 处理评论点赞和回复交互
 * - 显示用户头像、昵称和评论时间
 * ================================================================
 */

Component({
  /**
   * 组件的属性列表 - 定义可从父组件接收的属性
   */
  properties: {
    // 评论数据对象
    comment: {
      type: Object,
      value: {}
    },
    // 是否启用深色模式
    isDarkMode: {
      type: Boolean,
      value: false
    },
    // 当前颜色主题
    colorTheme: {
      type: String,
      value: '默认绿'
    }
  },

  /**
   * 组件的内部数据
   */
  data: {
    showFullContent: false, // 是否显示完整评论内容
    isLiked: false,        // 是否已点赞
    likeCount: 0           // 点赞数量
  },

  /**
   * 组件生命周期
   */
  attached() {
    // 初始化点赞状态和数量
    this.setData({
      isLiked: this.data.comment.isLiked || false,
      likeCount: this.data.comment.likeCount || 0
    });
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 切换评论内容展开/收起状态
     */
    toggleContent() {
      this.setData({
        showFullContent: !this.data.showFullContent
      });
    },

    /**
     * 处理点赞操作
     */
    handleLike() {
      const { isLiked, likeCount } = this.data;
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

      this.setData({
        isLiked: newIsLiked,
        likeCount: newLikeCount
      });

      // 轻震动反馈
      wx.vibrateShort({
        type: 'light'
      });

      // 触发父组件事件
      this.triggerEvent('like', {
        commentId: this.data.comment.id,
        isLiked: newIsLiked,
        likeCount: newLikeCount
      });
    },

    /**
     * 处理回复操作
     */
    handleReply() {
      // 触发父组件回复事件
      this.triggerEvent('reply', {
        comment: this.data.comment
      });
    },

    /**
     * 查看用户资料
     */
    viewProfile() {
      // 触发父组件查看用户资料事件
      this.triggerEvent('viewProfile', {
        userId: this.data.comment.userId
      });
    },

    /**
     * 预览评论图片
     */
    previewImage(e) {
      const { src } = e.currentTarget.dataset;
      const images = this.data.comment.images || [];

      wx.previewImage({
        current: src,
        urls: images
      });
    },

    /**
     * 格式化评论时间
     */
    formatTime(timestamp) {
      const now = new Date();
      const commentTime = new Date(timestamp);
      const diff = now - commentTime;
      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diff / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diff / (1000 * 60));

      if (diffDays > 0) {
        return `${diffDays}天前`;
      } else if (diffHours > 0) {
        return `${diffHours}小时前`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}分钟前`;
      } else {
        return '刚刚';
      }
    }
  },

  /**
   * 组件的观察器
   */
  observers: {
    'comment': function (comment) {
      if (comment) {
        this.setData({
          isLiked: comment.isLiked || false,
          likeCount: comment.likeCount || 0
        });
      }
    }
  }
});
