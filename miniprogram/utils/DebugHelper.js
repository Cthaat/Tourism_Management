// 图片上传调试工具
// 在 add-spot.js 中临时添加此调试代码，用于排查问题

/**
 * 图片上传调试辅助工具
 * 使用方法：在需要调试的地方调用 DebugHelper.log() 或其他方法
 */
const DebugHelper = {
  // 启用调试模式
  enabled: true,

  /**
   * 输出调试日志
   */
  log(message, data = null) {
    if (!this.enabled) return;

    console.log(`[图片上传调试] ${message}`);
    if (data) {
      console.log('详细数据:', data);
    }
  },

  /**
   * 输出错误日志
   */
  error(message, error = null) {
    console.error(`[图片上传错误] ${message}`);
    if (error) {
      console.error('错误详情:', error);
    }
  },

  /**
   * 检查图片数据结构
   */
  checkImageData(images) {
    this.log('检查图片数据结构', {
      图片数量: images.length,
      数据样例: images[0] || '无图片',
      完整数据: images
    });

    images.forEach((img, index) => {
      this.log(`图片 ${index + 1} 检查`, {
        tempFilePath: img.tempFilePath ? '✓' : '✗',
        size: img.size || '未知',
        type: img.type || '未知',
        完整对象: img
      });
    });
  },

  /**
   * 检查表单数据
   */
  checkFormData(formData) {
    this.log('检查表单数据', {
      name: formData.name || '未填写',
      description: formData.description || '未填写',
      address: formData.address || '未填写',
      website: formData.website || '未填写',
      图片数量: formData.images ? formData.images.length : 0,
      完整表单: formData
    });
  },

  /**
   * 检查云函数调用参数
   */
  checkCloudCallParams(params) {
    this.log('云函数调用参数检查', {
      操作类型: params.action,
      文件数量: params.files ? params.files.length : 0,
      spotId: params.spotId,
      完整参数: params
    });
  },

  /**
   * 检查云函数返回结果
   */
  checkCloudResult(result) {
    this.log('云函数返回结果检查', {
      成功状态: result.success ? '✓' : '✗',
      错误信息: result.error || '无',
      上传成功数量: result.successCount || 0,
      失败数量: result.failedCount || 0,
      文件URLs: result.fileUrls || [],
      完整结果: result
    });
  },

  /**
   * 性能计时器
   */
  timer: {},

  startTimer(name) {
    this.timer[name] = Date.now();
    this.log(`⏱️ 开始计时: ${name}`);
  },

  endTimer(name) {
    if (this.timer[name]) {
      const duration = Date.now() - this.timer[name];
      this.log(`⏱️ 计时结束: ${name} - ${duration}ms`);
      delete this.timer[name];
      return duration;
    }
  },

  /**
   * 网络状态检查
   */
  checkNetwork() {
    wx.getNetworkType({
      success: (res) => {
        this.log('网络状态检查', {
          网络类型: res.networkType,
          是否连接: res.networkType !== 'none' ? '✓' : '✗'
        });
      },
      fail: (error) => {
        this.error('网络状态检查失败', error);
      }
    });
  },
  /**
   * 云函数状态检查
   */
  async checkCloudFunction() {
    try {
      this.log('开始检查云函数状态...');

      // 测试连接
      const result = await wx.cloud.callFunction({
        name: 'uploadPicture',
        data: {
          action: 'test',
          test: true
        }
      });

      this.log('云函数状态检查完成', {
        调用成功: '✓',
        返回结果: result.result,
        openid: result.result?.openid || '未获取到'
      });

      // 检查云开发环境
      const envId = wx.cloud.envId;
      this.log('云开发环境检查', {
        环境ID: envId || '未设置',
        状态: envId ? '✓' : '✗'
      });

      return true;
    } catch (error) {
      this.error('云函数状态检查失败', error);

      // 提供具体的错误分析
      if (error.errMsg) {
        if (error.errMsg.includes('cloud function') && error.errMsg.includes('not found')) {
          this.log('建议: 云函数可能未部署，请在开发者工具中部署 uploadPicture 函数');
        } else if (error.errMsg.includes('timeout')) {
          this.log('建议: 网络超时，请检查网络连接');
        } else if (error.errMsg.includes('permission')) {
          this.log('建议: 权限问题，请检查云开发权限配置');
        }
      }

      return false;
    }
  },

  /**
   * 完整的系统检查
   */
  async systemCheck() {
    this.log('🔧 开始系统完整检查...');

    // 检查网络
    this.checkNetwork();

    // 检查云函数
    const cloudOK = await this.checkCloudFunction();

    // 检查本地存储
    try {
      wx.setStorageSync('test_key', 'test_value');
      const testValue = wx.getStorageSync('test_key');
      this.log('本地存储检查', {
        状态: testValue === 'test_value' ? '✓' : '✗'
      });
      wx.removeStorageSync('test_key');
    } catch (error) {
      this.error('本地存储检查失败', error);
    }

    this.log('🔧 系统检查完成', {
      云函数: cloudOK ? '✓' : '✗',
      建议: cloudOK ? '系统正常，可以进行图片上传测试' : '请检查云函数部署状态'
    });
  }
};

// 导出调试工具
module.exports = DebugHelper;

/**
 * 使用示例：
 * 
 * // 在 handleSubmitClick 方法开始处添加：
 * DebugHelper.systemCheck();
 * 
 * // 在图片数据检查处添加：
 * DebugHelper.checkImageData(this.data.images);
 * 
 * // 在云函数调用前添加：
 * DebugHelper.checkCloudCallParams(callParams);
 * 
 * // 在云函数调用后添加：
 * DebugHelper.checkCloudResult(uploadResult);
 * 
 * // 计时示例：
 * DebugHelper.startTimer('图片上传');
 * // ... 上传过程 ...
 * DebugHelper.endTimer('图片上传');
 */
