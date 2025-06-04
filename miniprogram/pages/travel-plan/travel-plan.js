/**
 * @fileoverview 旅游管理小程序旅行计划页面逻辑
 * @description 实现用户旅行计划的创建、管理和分享功能
 * @author Tourism_Management开发团队
 * @date 2025-06-04
 */

// 获取应用实例对象
const app = getApp();

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

    // 计划列表
    planList: [],

    // 推荐目的地
    recommendedDestinations: [
      {
        id: 1,
        name: "北京",
        description: "历史文化名城",
        image: "/images/destinations/beijing.jpg",
        avgBudget: 800
      },
      {
        id: 2,
        name: "上海",
        description: "国际化大都市",
        image: "/images/destinations/shanghai.jpg",
        avgBudget: 1200
      },
      {
        id: 3,
        name: "杭州",
        description: "人间天堂",
        image: "/images/destinations/hangzhou.jpg",
        avgBudget: 600
      },
      {
        id: 4,
        name: "成都",
        description: "美食之都",
        image: "/images/destinations/chengdu.jpg",
        avgBudget: 500
      }
    ],

    // 创建计划弹窗
    showCreateModal: false,
    newPlan: {
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      budget: '',
      notes: ''
    },
    canCreate: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('旅行计划页面加载');

    // 初始化主题设置
    this.initTheme();

    // 监听主题变化
    app.watchThemeChange((darkMode, colorTheme) => {
      console.log('旅行计划页面主题变化:', darkMode ? '深色模式' : '浅色模式', colorTheme);

      // 立即更新主题状态
      this.setData({
        isDarkMode: darkMode,
        colorTheme: colorTheme
      });
    });

    // 加载旅行计划数据
    this.loadTravelPlans();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 更新主题状态
    const isDarkMode = app.globalData.darkMode || false;
    const colorTheme = app.globalData.colorTheme || '默认绿';
    console.log('onShow中更新旅行计划页面主题:', isDarkMode ? '深色模式' : '浅色模式', colorTheme);

    this.setData({
      isDarkMode: isDarkMode,
      colorTheme: colorTheme
    });

    // 确保导航栏颜色更新
    if (typeof app.updateNavBarStyle === 'function') {
      app.updateNavBarStyle();
    }

    // 刷新数据
    this.loadTravelPlans();
  },

  /**
   * 初始化主题设置
   */
  initTheme() {
    try {
      // 从全局数据获取主题设置
      const isDarkMode = app.globalData.darkMode || false;
      const colorTheme = app.globalData.colorTheme || '默认绿';

      console.log('初始化旅行计划页面主题:', isDarkMode ? '深色模式' : '浅色模式', colorTheme);

      this.setData({
        colorTheme: colorTheme,
        isDarkMode: isDarkMode
      });
    } catch (error) {
      console.error('初始化主题设置失败:', error);
      // 兜底处理
      this.setData({
        colorTheme: '默认绿',
        isDarkMode: false
      });
    }
  },

  /**
   * 加载旅行计划数据
   */
  async loadTravelPlans() {
    this.setData({ isLoading: true });

    try {
      // 模拟API调用，实际应该调用云函数获取用户的旅行计划
      const mockPlans = [
        {
          id: 1,
          title: "春节北京之旅",
          destination: "北京",
          startDate: "2025-01-25",
          endDate: "2025-01-30",
          budget: 3000,
          spotCount: 8,
          status: "ongoing",
          statusText: "进行中",
          progress: 65,
          notes: "计划游览故宫、长城等著名景点"
        },
        {
          id: 2,
          title: "江南水乡游",
          destination: "苏州、杭州",
          startDate: "2025-03-15",
          endDate: "2025-03-20",
          budget: 2500,
          spotCount: 6,
          status: "draft",
          statusText: "草稿",
          progress: 0,
          notes: "计划体验江南水乡风情"
        }
      ];

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.setData({
        planList: mockPlans,
        isLoading: false
      });

      console.log('旅行计划加载完成:', mockPlans);

    } catch (error) {
      console.error('加载旅行计划失败:', error);
      this.setData({ isLoading: false });

      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 创建计划
   */
  onCreatePlan() {
    console.log('点击创建计划');

    // 重置表单数据
    this.setData({
      showCreateModal: true,
      newPlan: {
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: '',
        notes: ''
      },
      canCreate: false
    });
  },

  /**
   * 关闭创建计划弹窗
   */
  onCloseCreateModal() {
    this.setData({
      showCreateModal: false
    });
  },

  /**
   * 计划标题输入
   */
  onTitleInput(e) {
    const title = e.detail.value;
    this.setData({
      'newPlan.title': title
    });
    this.validateForm();
  },

  /**
   * 目的地输入
   */
  onDestinationInput(e) {
    const destination = e.detail.value;
    this.setData({
      'newPlan.destination': destination
    });
    this.validateForm();
  },

  /**
   * 开始日期选择
   */
  onStartDateChange(e) {
    const startDate = e.detail.value;
    this.setData({
      'newPlan.startDate': startDate
    });
    this.validateForm();
  },

  /**
   * 结束日期选择
   */
  onEndDateChange(e) {
    const endDate = e.detail.value;
    this.setData({
      'newPlan.endDate': endDate
    });
    this.validateForm();
  },

  /**
   * 预算输入
   */
  onBudgetInput(e) {
    const budget = e.detail.value;
    this.setData({
      'newPlan.budget': budget
    });
  },

  /**
   * 备注输入
   */
  onNotesInput(e) {
    const notes = e.detail.value;
    this.setData({
      'newPlan.notes': notes
    });
  },

  /**
   * 验证表单
   */
  validateForm() {
    const { title, destination, startDate, endDate } = this.data.newPlan;
    const canCreate = title.trim() && destination.trim() && startDate && endDate;

    this.setData({ canCreate });
  },

  /**
   * 确认创建计划
   */
  async onConfirmCreate() {
    if (!this.data.canCreate) {
      return;
    }

    const { newPlan } = this.data;

    // 验证日期
    if (new Date(newPlan.startDate) >= new Date(newPlan.endDate)) {
      wx.showToast({
        title: '结束日期必须晚于开始日期',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '创建中...' });

      // 生成新计划对象
      const plan = {
        id: Date.now(), // 临时ID，实际应该由后端生成
        title: newPlan.title.trim(),
        destination: newPlan.destination.trim(),
        startDate: newPlan.startDate,
        endDate: newPlan.endDate,
        budget: newPlan.budget ? parseInt(newPlan.budget) : 0,
        notes: newPlan.notes.trim(),
        spotCount: 0,
        status: 'draft',
        statusText: '草稿',
        progress: 0,
        createTime: new Date().toISOString()
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 添加到列表
      const updatedPlanList = [plan, ...this.data.planList];

      this.setData({
        planList: updatedPlanList,
        showCreateModal: false
      });

      wx.hideLoading();
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });

      console.log('新建计划成功:', plan);

    } catch (error) {
      console.error('创建计划失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 查看计划详情
   */
  onViewPlan(e) {
    const plan = e.currentTarget.dataset.plan;
    console.log('查看计划详情:', plan);

    // TODO: 跳转到计划详情页面
    wx.showToast({
      title: '计划详情页面开发中',
      icon: 'none'
    });
  },

  /**
   * 编辑计划
   */
  onEditPlan(e) {
    e.stopPropagation();
    const plan = e.currentTarget.dataset.plan;
    console.log('编辑计划:', plan);

    // TODO: 打开编辑弹窗或跳转到编辑页面
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    });
  },

  /**
   * 分享计划
   */
  onSharePlan(e) {
    e.stopPropagation();
    const plan = e.currentTarget.dataset.plan;
    console.log('分享计划:', plan);

    wx.showActionSheet({
      itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        const actions = ['分享给朋友', '分享到朋友圈', '复制链接'];
        wx.showToast({
          title: `${actions[res.tapIndex]}功能开发中`,
          icon: 'none'
        });
      }
    });
  },

  /**
   * 删除计划
   */
  onDeletePlan(e) {
    e.stopPropagation();
    const plan = e.currentTarget.dataset.plan;

    wx.showModal({
      title: '删除计划',
      content: `确定要删除"${plan.title}"吗？此操作不可恢复。`,
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.deletePlan(plan.id);
        }
      }
    });
  },

  /**
   * 执行删除计划
   */
  async deletePlan(planId) {
    try {
      wx.showLoading({ title: '删除中...' });

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 从列表中移除
      const updatedPlanList = this.data.planList.filter(plan => plan.id !== planId);

      this.setData({ planList: updatedPlanList });

      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

    } catch (error) {
      console.error('删除计划失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 选择推荐目的地
   */
  onSelectDestination(e) {
    const destination = e.currentTarget.dataset.destination;
    console.log('选择推荐目的地:', destination);

    // 打开创建计划弹窗并预填目的地
    this.setData({
      showCreateModal: true,
      newPlan: {
        title: `${destination.name}之旅`,
        destination: destination.name,
        startDate: '',
        endDate: '',
        budget: destination.avgBudget.toString(),
        notes: `探索${destination.description}`
      }
    });

    this.validateForm();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('下拉刷新旅行计划');
    this.loadTravelPlans().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('上拉加载更多旅行计划');
    // TODO: 实现分页加载更多计划
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的旅行计划 - 旅游管理小程序',
      path: '/pages/travel-plan/travel-plan',
      imageUrl: '/images/share/travel-plan.jpg'
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '我的旅行计划 - 旅游管理小程序',
      imageUrl: '/images/share/travel-plan.jpg'
    };
  }
});
