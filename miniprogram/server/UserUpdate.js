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
    }    // 获取当前用户信息，用于传递标识
    const localUserInfo = wx.getStorageSync('userInfo') || {};

    // 输出本地用户信息，用于调试
    console.log('上传头像 - 本地用户信息:', JSON.stringify(localUserInfo));

    const userIdentifier = {
      _id: localUserInfo._id || null,        // 优先使用 _id
      account: localUserInfo.account || null, // 其次使用 account
      _openid: localUserInfo._openid || null  // 最后使用 _openid
    };

    console.log('用户标识信息:', JSON.stringify(userIdentifier));

    // 2. 调用云函数更新用户头像
    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'uploadFile',
        type: 'avatar',
        fileID: uploadResult.fileID,
        userIdentifier // 传递用户标识信息
      }
    });

    console.log('头像更新结果:', result); const { success, message, userInfo } = result.result || {};

    // 如果获取到了用户信息，确保avatarUrl字段存在
    if (userInfo) {
      userInfo.avatarUrl = userInfo.avatar_url || uploadResult.fileID;

      // 更新本地存储的用户信息
      const updatedUserInfo = {
        ...localUserInfo,
        ...userInfo,
        // 保留原始的 _id, account, _openid (避免被覆盖)
        _id: localUserInfo._id || userInfo._id,
        account: localUserInfo.account || userInfo.account,
        _openid: localUserInfo._openid || userInfo._openid,
        avatarUrl: userInfo.avatarUrl,
      };

      console.log('头像更新后的本地用户信息:', JSON.stringify(updatedUserInfo));
      wx.setStorageSync('userInfo', updatedUserInfo);
    }

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
    // 如果传入的数据包含昵称，但没有nickname字段（服务器使用），则添加
    if (data.nickName && !data.nickname) {
      data.nickname = data.nickName;
    }

    // 如果传入的数据包含头像，但没有avatar_url字段（服务器使用），则添加
    if (data.avatarUrl && !data.avatar_url) {
      data.avatar_url = data.avatarUrl;
    }

    // 获取当前用户信息，用于传递标识
    const localUserInfo = wx.getStorageSync('userInfo') || {};

    // 输出本地用户信息，用于调试
    console.log('更新用户资料 - 本地用户信息:', JSON.stringify(localUserInfo));

    const userIdentifier = {
      _id: localUserInfo._id || null,        // 优先使用 _id
      account: localUserInfo.account || null, // 其次使用 account
      _openid: localUserInfo._openid || null  // 最后使用 _openid
    };

    console.log('用户标识信息:', JSON.stringify(userIdentifier));

    // 调用云函数
    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'updateProfile',
        data,
        userIdentifier // 传递用户标识信息
      }
    });

    console.log('更新用户资料结果:', result);

    const { success, message, userInfo } = result.result || {};      // 如果成功更新并返回了用户信息，确保前端需要的字段存在
    if (success && userInfo) {
      // 确保前端需要的字段
      if (!userInfo.avatarUrl && userInfo.avatar_url) {
        userInfo.avatarUrl = userInfo.avatar_url;
      }

      if (!userInfo.nickName && userInfo.nickname) {
        userInfo.nickName = userInfo.nickname;
      }

      // 更新本地存储
      const localUserInfo = wx.getStorageSync('userInfo') || {};

      // 保留关键标识符信息
      const updatedUserInfo = {
        ...localUserInfo,
        ...userInfo,
        // 保留原始的 _id, account, _openid (避免被覆盖)
        _id: localUserInfo._id || userInfo._id,
        account: localUserInfo.account || userInfo.account,
        _openid: localUserInfo._openid || userInfo._openid,
        // 确保前端UI显示字段始终存在
        avatarUrl: userInfo.avatarUrl || userInfo.avatar_url || localUserInfo.avatarUrl,
        nickName: userInfo.nickName || userInfo.nickname || localUserInfo.nickName
      };

      console.log('更新后的本地用户信息:', JSON.stringify(updatedUserInfo));
      wx.setStorageSync('userInfo', updatedUserInfo);
    }

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
 * @param {Object} params - 查询参数 
 * @returns {Promise} 返回用户资料
 */
const getUserProfile = async (params = {}) => {
  try {
    // 获取当前用户信息，用于传递标识
    const localUserInfo = wx.getStorageSync('userInfo') || {};

    // 构建用户标识，优先使用account
    const userIdentifier = {
      account: localUserInfo.account || params.account || null, // 优先使用account
      _id: localUserInfo._id || params._id || null,             // 其次使用_id
      _openid: localUserInfo._openid || null                    // 最后使用_openid
    };

    console.log('获取用户资料 - 用户标识:', JSON.stringify(userIdentifier));

    // 调用云函数
    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'getProfile',
        userIdentifier: userIdentifier // 传递用户标识信息
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