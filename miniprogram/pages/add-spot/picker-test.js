Page({
  data: {
    // 测试用的基础数据
    categoryOptions: [
      { label: '自然风光', value: '1' },
      { label: '历史文化', value: '2' },
      { label: '主题公园', value: '3' },
      { label: '城市观光', value: '4' },
      { label: '休闲度假', value: '5' }
    ],
    categoryIndex: 0,

    seasonOptions: ['春季', '夏季', '秋季', '冬季'],

    formData: {
      best_season: 0,
      rating: 2.5,
      status: true
    },

    openingTimeStr: '08:00',
    closingTimeStr: '18:00'
  },

  onLoad() {
    console.log('🧪 测试页面加载')
    console.log('分类选项:', this.data.categoryOptions)
    console.log('当前分类索引:', this.data.categoryIndex)
  },

  // 分类选择器测试
  onCategoryChange(e) {
    console.log('🏷️ 分类选择触发')
    console.log('事件详情:', e.detail)

    const index = parseInt(e.detail.value)
    const category = this.data.categoryOptions[index]

    this.setData({
      categoryIndex: index
    })

    console.log('选择的分类:', category.label)

    wx.showToast({
      title: `选择了: ${category.label}`,
      icon: 'success'
    })
  },

  // 时间选择器测试
  onOpeningTimeChange(e) {
    console.log('🕗 开放时间选择触发')
    console.log('事件详情:', e.detail)

    const timeStr = e.detail.value
    this.setData({
      openingTimeStr: timeStr
    })

    console.log('选择的时间:', timeStr)

    wx.showToast({
      title: `开放时间: ${timeStr}`,
      icon: 'success'
    })
  },

  // 季节选择器测试
  onSeasonChange(e) {
    console.log('🍂 季节选择触发')
    console.log('事件详情:', e.detail)

    const seasonIndex = parseInt(e.detail.value)
    this.setData({
      'formData.best_season': seasonIndex
    })

    console.log('选择的季节:', this.data.seasonOptions[seasonIndex])

    wx.showToast({
      title: `季节: ${this.data.seasonOptions[seasonIndex]}`,
      icon: 'success'
    })
  },

  // 评分滑块测试
  onRatingChange(e) {
    console.log('⭐ 评分变化触发')
    console.log('事件详情:', e.detail)

    const rating = parseFloat(e.detail.value)
    this.setData({
      'formData.rating': rating
    })

    console.log('当前评分:', rating)
  },

  // 状态开关测试
  onStatusChange(e) {
    console.log('🔄 状态开关触发')
    console.log('事件详情:', e.detail)

    const status = e.detail.value
    this.setData({
      'formData.status': status
    })

    console.log('当前状态:', status)

    wx.showToast({
      title: status ? '已开启' : '已关闭',
      icon: 'success'
    })
  }
})
