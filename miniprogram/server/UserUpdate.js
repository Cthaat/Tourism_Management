// filepath: c:\Code\Tourism_Management\miniprogram\server\UserUpdate.js

/**
 * 用户资料更新相关API接口封装
 * 提供与用户资料更新、文件上传相关的云函数交互方法
 */

/**
 * 上传文件到云存储
 * @param {Object} params - 上传参数
 * @param {string} params.filePath - 本地文件路径
 * @param {string} params.cloudPath - 云端存储路径
 * @returns {Promise} 返回上传结果
 */
const uploadFile = async (params = {}) => {
  try {
    // 参数检查
    if (!params.filePath) {
      return { success: false, message: '缺少本地文件路径' };
    }

    const { filePath, cloudPath } = params;

    // 生成云端文件路径（如果没有提供）
    const finalCloudPath = cloudPath || `user_uploads/${Date.now()}_${Math.random().toString(36).substr(2, 8)}${getFileExtension(filePath)}`;

    // 调用微信云函数API上传文件
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: finalCloudPath,
      filePath: filePath,
    });

    console.log('文件上传结果:', uploadResult);

    if (!uploadResult.fileID) {
      throw new Error('文件上传失败，未获取到fileID');
    }

    return {
      success: true,
      message: '文件上传成功',
      fileID: uploadResult.fileID
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    return {
      success: false,
      message: '文件上传失败',
      error: error.message || error
    };
  }
};

/**
 * 上传头像并更新用户资料
 * @param {Object} params - 上传参数
 * @param {string} params.filePath - 本地文件路径
 * @returns {Promise} 返回处理结果
 */
const uploadAvatar = async (params = {}) => {
  try {
    // 参数检查
    if (!params.filePath) {
      return { success: false, message: '缺少本地文件路径' };
    }

    // 1. 上传文件到云存储
    const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 8)}${getFileExtension(params.filePath)}`;
    const uploadResult = await uploadFile({
      filePath: params.filePath,
      cloudPath
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.message || '头像上传失败');
    }

    // 2. 调用云函数更新用户头像
    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'uploadFile',
        type: 'avatar',
        fileID: uploadResult.fileID,
      }
    });

    console.log('头像更新结果:', result);

    const { success, message, userInfo } = result.result || {};

    return {
      success: !!success,
      message: message || '头像更新操作完成',
      userInfo,
      fileID: uploadResult.fileID
    };
  } catch (error) {
    console.error('头像上传失败:', error);
    return {
      success: false,
      message: '头像上传失败',
      error: error.message || error
    };
  }
};

/**
 * 更新用户资料
 * @param {Object} data - 用户资料
 * @returns {Promise} 返回更新结果
 */
const updateUserProfile = async (data = {}) => {
  try {
    // 调用云函数
    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'updateProfile',
        data
      }
    });

    console.log('更新用户资料结果:', result);

    const { success, message, userInfo } = result.result || {};

    return {
      success: !!success,
      message: message || '用户资料更新操作完成',
      userInfo
    };
  } catch (error) {
    console.error('更新用户资料失败:', error);
    return {
      success: false,
      message: '更新用户资料失败',
      error: error.message || error
    };
  }
};

/**
 * 获取用户资料
 * @returns {Promise} 返回用户资料
 */
const getUserProfile = async () => {
  try {
    // 调用云函数
    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'getProfile'
      }
    });

    console.log('获取用户资料结果:', result);

    const { success, message, userInfo } = result.result || {};

    return {
      success: !!success,
      message: message || '获取用户资料操作完成',
      userInfo
    };
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return {
      success: false,
      message: '获取用户资料失败',
      error: error.message || error
    };
  }
};

/**
 * 获取文件扩展名
 * @param {string} filePath - 文件路径
 * @returns {string} 文件扩展名（带点）
 */
const getFileExtension = (filePath) => {
  if (!filePath) return '';
  const match = filePath.match(/\.([^.]+)$/);
  return match ? `.${match[1].toLowerCase()}` : '';
};

// 导出API接口
module.exports = {
  uploadFile,
  uploadAvatar,
  updateUserProfile,
  getUserProfile
};