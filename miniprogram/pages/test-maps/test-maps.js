// 测试页面，用于验证GoogleMapsApi ES5版本的功能
const GoogleMapsApi = require('../../utils/GoogleMapsApi.js');

const googleMapsApi = new GoogleMapsApi();
googleMapsApi.init('AIzaSyC9cGQ8JXj_E9Q6eTmyCAcSkxJCZSCyU-U');

Page({
  data: {
    testResults: []
  },

  onLoad: function () {
    console.log('测试页面加载完成');
    this.runTests();
  },

  runTests: function () {
    var self = this;
    console.log('开始运行GoogleMapsApi ES5兼容性测试...');

    // 测试1: 地理编码
    googleMapsApi.geocode('北京天安门', 'zh-CN', 'CN')
      .then(function (result) {
        console.log('地理编码测试结果:', result);
        self.addTestResult('地理编码', result.success ? '成功' : '失败', result);

        if (result.success) {
          // 测试2: 逆地理编码
          return googleMapsApi.reverseGeocode(result.data.latitude, result.data.longitude, 'zh-CN');
        }
      })
      .then(function (result) {
        if (result) {
          console.log('逆地理编码测试结果:', result);
          self.addTestResult('逆地理编码', result.success ? '成功' : '失败', result);
        }
      })
      .catch(function (error) {
        console.error('测试失败:', error);
        self.addTestResult('测试异常', '失败', { error: error.message });
      });

    // 测试3: 自动完成
    googleMapsApi.autocomplete('北京', 'zh-CN', 'CN')
      .then(function (result) {
        console.log('自动完成测试结果:', result);
        self.addTestResult('自动完成', result.success ? '成功' : '失败', result);
      })
      .catch(function (error) {
        console.error('自动完成测试失败:', error);
        self.addTestResult('自动完成', '失败', { error: error.message });
      });
  },

  addTestResult: function (testName, status, data) {
    var results = this.data.testResults;
    results.push({
      name: testName,
      status: status,
      timestamp: new Date().toLocaleTimeString(),
      data: JSON.stringify(data, null, 2)
    });
    this.setData({
      testResults: results
    });
  }
});
