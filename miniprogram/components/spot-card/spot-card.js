/**
 * ================================================================
 * 文件名: spot-card.js
 * 描述: 旅游景点卡片组件的逻辑实现
 * 版本: 1.0.0
 * 创建日期: 2025-05-13
 * 作者: Tourism_Management开发团队
 * 
 * 功能说明:
 * - 定义景点卡片组件的数据和行为
 * - 处理卡片点击事件，跳转到详情页
 * - 支持深色模式和多种颜色主题
 * - 处理收藏功能和交互动画
 * ================================================================
 */

// components/spot-card/spot-card.js
Component({
  /**
   * 组件的属性列表 - 定义可从父组件接收的属性
   */
  properties: {
    // 景点数据对象，包含名称、位置、价格等信息
    spot: {
      type: Object,
      value: {}  // 默认为空对象
    },
    // 是否启用深色模式 - 控制组件的暗色主题
    isDarkMode: {
      type: Boolean,
      value: false  // 默认为浅色模式
    },    // 主题颜色，支持"默认绿"、"天空蓝"、"中国红"
    colorTheme: {
      type: String,
      value: '默认绿'  // 默认使用绿色主题
    }
  },

  /**
   * 组件的初始数据 - 定义组件内部使用的数据
   */
  data: {
    // 组件内部状态数据
    isAnimating: false,  // 控制动画状态
    themeColors: {       // 主题色映射表
      '默认绿': '#1aad19',
      '天空蓝': '#1296db',
      '中国红': '#e54d42'
    }
  },

  /**
   * 组件的方法列表 - 定义组件的行为和事件处理函数
   */
  methods: {    /**
     * 点击卡片跳转到详情页
     * 获取景点ID并导航到景点详情页面
     */
    goToDetail() {
      // 添加触感反馈
      wx.vibrateShort({
        type: 'light'  // 轻微振动提供触觉反馈
      });

      // 兼容不同的ID字段名（云函数使用_id，模拟数据使用id）
      const spot = this.properties.spot;
      const id = spot._id || spot.id;  // 优先使用_id，后备使用id

      if (!id) {
        console.error('景点ID为空，无法跳转到详情页', spot);
        wx.showToast({
          title: '景点信息错误',
          icon: 'none'
        });
        return;
      }

      console.log('spot-card组件跳转到详情页，ID:', id);
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`  // 跳转到景点详情页并传递ID参数
      });
    }
  }
})