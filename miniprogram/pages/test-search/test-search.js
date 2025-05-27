Page({
  data: {
    testInput: '',
    testResults: []
  },

  onLoad: function () {
    console.log('🧪 [test-search] 测试页面加载完成');
  },

  onTestInput: function (e) {
    const value = e.detail.value;
    console.log('🧪 [test-search] 测试输入:', value);

    this.setData({
      testInput: value
    });

    // 直接调用Google Maps API测试
    if (value && value.length > 1) {
      this.testGoogleMapsApi(value);
    }
  },

  testGoogleMapsApi: function (keyword) {
    console.log('🧪 [test-search] 开始测试Google Maps API');
    console.log('🧪 [test-search] 测试关键词:', keyword);

    const GoogleMapsApi = require('../../utils/GoogleMapsApi.js');

    GoogleMapsApi.autocomplete(keyword)
      .then(result => {
        console.log('🧪 [test-search] API测试结果:', result);

        if (result.success && result.data) {
          this.setData({
            testResults: result.data
          });
          console.log('🧪 [test-search] 测试成功，结果数量:', result.data.length);
        } else {
          console.log('🧪 [test-search] 测试失败:', result);
          this.setData({
            testResults: []
          });
        }
      })
      .catch(error => {
        console.error('🧪 [test-search] API测试错误:', error);
        this.setData({
          testResults: []
        });
      });
  }
});
