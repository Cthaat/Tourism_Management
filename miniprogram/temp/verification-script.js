/**
 * 景点数据加载功能验证脚本
 * 用于在微信开发者工具控制台中验证功能
 */

// 验证函数1: 检查app.js数据加载状态
function checkAppDataStatus() {
  const app = getApp();

  console.log('=== 景点数据加载状态检查 ===');
  console.log('景点数据总数:', app.globalData.tourismSpots?.length || 0);
  console.log('是否从云端加载:', app.globalData.spotsLoadedFromCloud);
  console.log('数据是否就绪:', app.globalData.spotsDataReady);
  console.log('加载时间:', app.globalData.spotsLoadTime);

  if (app.globalData.tourismSpots && app.globalData.tourismSpots.length > 0) {
    console.log('=== 第一个景点数据样例 ===');
    const firstSpot = app.globalData.tourismSpots[0];
    console.log('景点名称:', firstSpot.name);
    console.log('景点ID:', firstSpot._id || firstSpot.id);
    console.log('图片数量:', firstSpot.imageCount || 0);
    console.log('主图URL:', firstSpot.mainImage || '无');
    console.log('图片数组长度:', firstSpot.images?.length || 0);
  }

  return app.globalData.tourismSpots;
}

// 验证函数2: 检查图片数据集成情况
function checkImageIntegration() {
  const app = getApp();
  const spots = app.globalData.tourismSpots;

  if (!spots || spots.length === 0) {
    console.log('⚠️ 没有景点数据');
    return;
  }

  console.log('=== 图片数据集成检查 ===');

  spots.forEach((spot, index) => {
    console.log(`\n景点${index + 1}: ${spot.name || spot._id}`);
    console.log('  - 是否有images字段:', 'images' in spot);
    console.log('  - 是否有imageCount字段:', 'imageCount' in spot);
    console.log('  - 是否有mainImage字段:', 'mainImage' in spot);

    if ('images' in spot) {
      console.log('  - 图片数量:', spot.images?.length || 0);
      if (spot.images && spot.images.length > 0) {
        console.log('  - 第一张图片:', spot.images[0]);
      }
    }
  });
}

// 验证函数3: 模拟数据加载回调机制
function testDataLoadCallback() {
  const app = getApp();

  console.log('=== 数据加载回调机制测试 ===');

  if (app.globalData.spotsDataReady) {
    console.log('✅ 数据已准备就绪');
  } else {
    console.log('⏳ 数据未准备就绪，注册回调...');

    app.onSpotDataReady((spotData) => {
      console.log('✅ 收到数据加载完成回调，景点数量:', spotData?.length || 0);
    });
  }
}

// 验证函数4: 检查数据是否为云端数据还是备用数据
function checkDataSource() {
  const app = getApp();
  const spots = app.globalData.tourismSpots;

  console.log('=== 数据源检查 ===');

  if (!spots || spots.length === 0) {
    console.log('❌ 没有景点数据');
    return;
  }

  console.log('景点数量:', spots.length);

  // 备用数据的特征：6个景点，包含"西湖风景区"等
  const backupSpotNames = ['西湖风景区', '故宫博物院', '张家界国家森林公园', '兵马俑博物馆', '三亚亚龙湾', '九寨沟风景区'];
  const hasBackupSpots = spots.some(spot => backupSpotNames.includes(spot.name));

  // 云端数据的特征：包含_id字段，可能数量不同
  const hasCloudSpots = spots.some(spot => spot._id);

  if (spots.length === 6 && hasBackupSpots && !hasCloudSpots) {
    console.log('⚠️ 当前使用的是备用数据');
    console.log('原因可能是云端数据加载失败或数据赋值错误');
  } else if (hasCloudSpots) {
    console.log('✅ 当前使用的是云端数据');
    console.log('第一个景点ID:', spots[0]._id);
  } else {
    console.log('❓ 数据源不明确，需要进一步检查');
  }

  // 显示所有景点名称
  console.log('当前景点列表:');
  spots.forEach((spot, index) => {
    console.log(`  ${index + 1}. ${spot.name} (ID: ${spot._id || spot.id || '无'})`);
  });
}

// 验证函数5: 强制刷新数据进行测试
function testDataRefresh() {
  const app = getApp();

  console.log('=== 强制刷新数据测试 ===');

  if (typeof app.refreshSpotData === 'function') {
    console.log('开始刷新数据...');

    app.refreshSpotData().then(result => {
      console.log('刷新结果:', result);
      if (result.success) {
        console.log('✅ 数据刷新成功，景点数量:', result.count);
        // 重新检查数据
        checkDataSource();
        checkImageIntegration();
      } else {
        console.log('❌ 数据刷新失败:', result.error);
      }
    }).catch(error => {
      console.log('❌ 数据刷新异常:', error);
    });
  } else {
    console.log('❌ refreshSpotData方法不存在');
  }
}

// 主验证函数
function runFullVerification() {
  console.log('🚀 开始完整功能验证...\n');

  checkAppDataStatus();
  console.log('\n');

  checkDataSource();
  console.log('\n');

  checkImageIntegration();
  console.log('\n');

  testDataLoadCallback();
  console.log('\n');

  console.log('✅ 验证完成！');
  console.log('\n如需刷新数据测试，请运行: testDataRefresh()');
}

// 导出验证函数供控制台使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkAppDataStatus,
    checkImageIntegration,
    testDataLoadCallback,
    checkDataSource,
    testDataRefresh,
    runFullVerification
  };
}

// 在控制台中可直接运行的快速验证
console.log('📋 景点数据加载功能验证脚本已加载');
console.log('🔧 可用的验证函数:');
console.log('  - runFullVerification() // 运行完整验证');
console.log('  - checkAppDataStatus() // 检查数据状态');
console.log('  - checkDataSource() // 检查数据源');
console.log('  - checkImageIntegration() // 检查图片集成');
console.log('  - testDataRefresh() // 测试数据刷新');
console.log('\n🚀 运行 runFullVerification() 开始验证');
