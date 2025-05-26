// 快速验证 spotManage 云函数是否正常工作
// 在小程序开发工具的控制台中运行此代码

console.log('=== spotManage 云函数快速验证 ===');

// 验证步骤1: 测试云函数连接
async function testCloudFunction() {
  try {
    console.log('🔍 步骤1: 测试云函数连接...');

    const testResult = await wx.cloud.callFunction({
      name: 'spotManage',
      data: {
        action: 'test'
      }
    });

    console.log('✅ 云函数连接测试结果:', testResult);

    if (testResult.result.success) {
      console.log('✅ 云函数连接正常');
      return true;
    } else {
      console.error('❌ 云函数连接失败:', testResult.result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 云函数调用失败:', error);
    return false;
  }
}

// 验证步骤2: 测试添加景点功能
async function testAddSpot() {
  try {
    console.log('🔍 步骤2: 测试添加景点功能...');

    const testSpotData = {
      name: `测试景点_${Date.now()}`, // 使用时间戳避免重复
      description: "这是一个测试景点",
      location: {
        address: "北京市测试区测试街道1号",
        geopoint: {
          type: "Point",
          coordinates: [116.404, 39.915]
        }
      },
      category_id: "1",
      province: "北京",
      phone: "13800138000",
      website: "https://test.com",
      price: 50,
      rating: 4.5,
      opening_time: 28800000,
      closing_time: 64800000,
      best_season: 1,
      status: true
    };

    const addResult = await wx.cloud.callFunction({
      name: 'spotManage',
      data: {
        action: 'add',
        data: testSpotData
      }
    });

    console.log('✅ 添加景点测试结果:', addResult);

    if (addResult.result.success) {
      console.log('✅ 添加景点功能正常');
      return addResult.result.data._id; // 返回新创建的景点ID
    } else {
      console.error('❌ 添加景点失败:', addResult.result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 添加景点调用失败:', error);
    return null;
  }
}

// 验证步骤3: 测试查询景点列表
async function testGetSpotList() {
  try {
    console.log('🔍 步骤3: 测试查询景点列表...');

    const listResult = await wx.cloud.callFunction({
      name: 'spotManage',
      data: {
        action: 'list',
        data: {
          page: 1,
          limit: 5
        }
      }
    });

    console.log('✅ 查询景点列表结果:', listResult);

    if (listResult.result.success) {
      console.log('✅ 查询景点列表功能正常');
      console.log(`📊 当前共有 ${listResult.result.total} 个景点`);
      return true;
    } else {
      console.error('❌ 查询景点列表失败:', listResult.result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 查询景点列表调用失败:', error);
    return false;
  }
}

// 验证步骤4: 测试删除测试数据
async function testDeleteSpot(spotId) {
  if (!spotId) {
    console.log('⏭️ 跳过删除测试 (没有测试数据ID)');
    return true;
  }

  try {
    console.log('🔍 步骤4: 清理测试数据...');

    const deleteResult = await wx.cloud.callFunction({
      name: 'spotManage',
      data: {
        action: 'delete',
        data: {
          _id: spotId
        }
      }
    });

    console.log('✅ 删除测试数据结果:', deleteResult);

    if (deleteResult.result.success) {
      console.log('✅ 删除功能正常，测试数据已清理');
      return true;
    } else {
      console.error('❌ 删除测试数据失败:', deleteResult.result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 删除测试数据调用失败:', error);
    return false;
  }
}

// 主验证流程
async function runFullValidation() {
  console.log('🚀 开始完整验证流程...');

  const results = {
    connection: false,
    add: false,
    list: false,
    delete: false
  };

  let testSpotId = null;

  // 1. 测试连接
  results.connection = await testCloudFunction();

  // 2. 测试添加 (只有连接成功才继续)
  if (results.connection) {
    testSpotId = await testAddSpot();
    results.add = !!testSpotId;
  }

  // 3. 测试列表查询
  if (results.connection) {
    results.list = await testGetSpotList();
  }

  // 4. 清理测试数据
  if (testSpotId) {
    results.delete = await testDeleteSpot(testSpotId);
  }

  // 输出验证总结
  console.log('\n=== 验证结果总结 ===');
  console.log(`云函数连接: ${results.connection ? '✅ 正常' : '❌ 失败'}`);
  console.log(`添加功能: ${results.add ? '✅ 正常' : '❌ 失败'}`);
  console.log(`查询功能: ${results.list ? '✅ 正常' : '❌ 失败'}`);
  console.log(`删除功能: ${results.delete ? '✅ 正常' : '❌ 失败'}`);

  const successCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n📊 验证通过率: ${successCount}/${totalCount} (${(successCount / totalCount * 100).toFixed(1)}%)`);

  if (successCount === totalCount) {
    console.log('🎉 所有功能验证通过！spotManage 云函数工作正常！');
  } else {
    console.log('⚠️ 部分功能验证失败，请检查云函数配置和数据库权限。');
  }

  return results;
}

// 执行验证
console.log('请在小程序开发工具的控制台中运行以下命令:');
console.log('runFullValidation()');

// 导出函数供控制台调用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCloudFunction,
    testAddSpot,
    testGetSpotList,
    testDeleteSpot,
    runFullValidation
  };
}

// 如果在小程序环境中，直接挂载到全局
if (typeof wx !== 'undefined') {
  wx.spotManageTest = {
    testCloudFunction,
    testAddSpot,
    testGetSpotList,
    testDeleteSpot,
    runFullValidation
  };

  console.log('✅ 验证函数已挂载到 wx.spotManageTest');
  console.log('使用方法: wx.spotManageTest.runFullValidation()');
}
