// components/spot-card/spot-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    spot: {
      type: Object,
      value: {}
    },
    isDarkMode: {
      type: Boolean,
      value: false
    },
    colorTheme: {
      type: String,
      value: '默认绿'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击卡片跳转到详情页
    goToDetail() {
      const id = this.properties.spot.id;
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    }
  }
})