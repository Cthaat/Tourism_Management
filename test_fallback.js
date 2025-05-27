/**
 * 测试备用服务功能
 * 验证在Google Maps API超时的情况下，备用服务能否正常工作
 */

// 模拟微信小程序环境
global.wx = {
  request: function (options) {
    // 模拟网络超时
    setTimeout(function () {
      options.fail({
        errMsg: 'request:fail timeout'
      });
    }, 100);
  }
};

// 导入GoogleMapsApi
const GoogleMapsApi = require('./miniprogram/utils/GoogleMapsApi.js');

// 创建API实例
const googleMapsApi = new GoogleMapsApi();
googleMapsApi.init('AIzaSyC9cGQ8JXj_E9Q6eTmyCAcSkxJCZSCyU-U');

console.log('🧪 开始测试Google Maps API备用服务功能');
console.log('==================================================');

// 测试地址自动完成功能
async function testAutocomplete() {
  console.log('\n📍 测试1: 地址自动完成功能');
  console.log('搜索关键词: "南昌"');

  try {
    const result = await googleMapsApi.autocomplete('南昌', 'zh-CN', 'CN');

    console.log('✅ 测试结果:');
    console.log('成功状态:', result.success);
    console.log('数据源:', result.source);
    console.log('结果数量:', result.data ? result.data.length : 0);

    if (result.data && result.data.length > 0) {
      console.log('地址建议:');
      result.data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.description}`);
        console.log(`     主要文本: ${item.mainText}`);
        console.log(`     次要文本: ${item.secondaryText}`);
      });
    }

    return result;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return null;
  }
}

// 测试地理编码功能
async function testGeocode() {
  console.log('\n🗺️ 测试2: 地理编码功能');
  console.log('地址: "南昌市"');

  try {
    const result = await googleMapsApi.geocode('南昌市');

    console.log('✅ 测试结果:');
    console.log('成功状态:', result.success);
    console.log('数据源:', result.source);

    if (result.data) {
      console.log('地理信息:');
      console.log(`  纬度: ${result.data.latitude}`);
      console.log(`  经度: ${result.data.longitude}`);
      console.log(`  格式化地址: ${result.data.formattedAddress}`);
    }

    return result;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return null;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行测试...\n');

  const test1Result = await testAutocomplete();
  const test2Result = await testGeocode();

  console.log('\n==================================================');
  console.log('📊 测试总结:');
  console.log(`测试1 (地址自动完成): ${test1Result && test1Result.success ? '✅ 通过' : '❌ 失败'}`);
  console.log(`测试2 (地理编码): ${test2Result && test2Result.success ? '✅ 通过' : '❌ 失败'}`);

  if (test1Result && test1Result.success && test2Result && test2Result.success) {
    console.log('\n🎉 所有测试通过！备用服务工作正常。');
    console.log('💡 在真机环境中，当Google Maps API超时时，系统会自动使用备用服务。');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查代码实现。');
  }
}

// 启动测试
runAllTests();
