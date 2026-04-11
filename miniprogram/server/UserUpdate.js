
/**
 * 用户资料更新相关API接口封装
 * 提供与用户资料更新、文件上传相关的云函数交互方法
 */

const normalizeUserInfo = (rawUserInfo = null) => {
  if (!rawUserInfo || typeof rawUserInfo !== 'object') {
    return {};
  }

  const source = (rawUserInfo.data && typeof rawUserInfo.data === 'object')
    ? { ...rawUserInfo.data, _id: rawUserInfo._id || rawUserInfo.data._id }
    : rawUserInfo;

  return {
    ...source,
    nickName: source.nickName || source.nickname || '',
    nickname: source.nickname || source.nickName || '',
    avatarUrl: source.avatarUrl || source.avatar_url || '',
    avatar_url: source.avatar_url || source.avatarUrl || ''
  };
};

const resolveImageDisplayUrl = async (fileID = '') => {
  if (!fileID || typeof fileID !== 'string' || !fileID.startsWith('cloud://')) {
    return fileID;
  }

  try {
    const result = await wx.cloud.getTempFileURL({
      fileList: [fileID]
    });

    const item = result && result.fileList && result.fileList[0];
    if (item && item.tempFileURL) {
      return item.tempFileURL;
    }
  } catch (error) {
    console.warn('头像临时链接转换失败，回退使用fileID:', error);
  }

  return fileID;
};

/**
 * 上传文件到云存储
 * @param {Object} params - 上传参数
 * @param {string} params.filePath - 本地文件路径
 * @param {string} params.cloudPath - 云端存储路径
 * @returns {Promise<Object>} 返回上传结果
 */
const uploadFile = async (params = {}) => {
  try {
    if (!params.filePath) {
      return { success: false, message: '缺少本地文件路径' };
    }

    const { filePath, cloudPath } = params;
    const finalCloudPath = cloudPath || `user_uploads/${Date.now()}_${Math.random().toString(36).substr(2, 8)}${getFileExtension(filePath)}`;

    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: finalCloudPath,
      filePath: filePath
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
 * @returns {Promise<Object>} 返回处理结果
 */
const uploadAvatar = async (params = {}) => {
  try {
    if (!params.filePath) {
      return { success: false, message: '缺少本地文件路径' };
    }

    const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 8)}${getFileExtension(params.filePath)}`;
    const uploadResult = await uploadFile({
      filePath: params.filePath,
      cloudPath
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.message || '头像上传失败');
    }

    const localUserInfo = normalizeUserInfo(wx.getStorageSync('userInfo') || {});
    console.log('上传头像 - 本地用户信息:', JSON.stringify(localUserInfo));

    const userIdentifier = {
      _id: localUserInfo._id || null,
      account: localUserInfo.account || null,
      _openid: localUserInfo._openid || null,
      openid: localUserInfo.openid || localUserInfo._openid || null
    };

    console.log('用户标识信息:', JSON.stringify(userIdentifier));

    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'uploadFile',
        type: 'avatar',
        fileID: uploadResult.fileID,
        userIdentifier
      }
    });

    console.log('头像更新结果:', result);

    const response = result.result || {};
    const success = typeof response.success === 'boolean'
      ? response.success
      : !!(response.userInfo || response.data);
    const message = response.message || '头像更新操作完成';
    const userInfo = normalizeUserInfo(response.userInfo || response.data || {});

    if (Object.keys(userInfo).length > 0) {
      const avatarDisplayUrl = await resolveImageDisplayUrl(userInfo.avatar_url || userInfo.avatarUrl || uploadResult.fileID);
      const mergedUserInfo = {
        ...localUserInfo,
        ...userInfo,
        _id: localUserInfo._id || userInfo._id,
        account: localUserInfo.account || userInfo.account,
        _openid: localUserInfo._openid || userInfo._openid,
        avatarUrl: avatarDisplayUrl,
        avatar_url: userInfo.avatar_url || userInfo.avatarUrl || uploadResult.fileID
      };

      console.log('头像更新后的本地用户信息:', JSON.stringify(mergedUserInfo));
      wx.setStorageSync('userInfo', mergedUserInfo);

      return {
        success: !!success,
        message,
        userInfo: mergedUserInfo,
        fileID: uploadResult.fileID
      };
    }

    return {
      success: !!success,
      message,
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
 * @returns {Promise<Object>} 返回更新结果
 */
const updateUserProfile = async (data = {}) => {
  try {
    console.log('updateUserProfile 接收到的数据:', JSON.stringify(data));

    if (data.nickName && !data.nickname) {
      data.nickname = data.nickName;
    }
    if (data.nickname && !data.nickName) {
      data.nickName = data.nickname;
    }
    if (data.avatarUrl && !data.avatar_url) {
      data.avatar_url = data.avatarUrl;
    }

    const localUserInfo = normalizeUserInfo(wx.getStorageSync('userInfo') || {});
    console.log('更新用户资料 - 本地用户信息:', JSON.stringify(localUserInfo));

    const userIdentifier = {
      _id: localUserInfo._id || null,
      account: localUserInfo.account || null,
      _openid: localUserInfo._openid || null
    };

    console.log('用户标识信息:', JSON.stringify(userIdentifier));

    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'updateProfile',
        data,
        userIdentifier
      }
    });

    console.log('更新用户资料结果:', result);

    const response = result.result || {};
    const success = typeof response.success === 'boolean'
      ? response.success
      : !!(response.userInfo || response.data);
    const message = response.message || '用户资料更新操作完成';
    const userInfo = normalizeUserInfo(response.userInfo || response.data || {});

    if (success && Object.keys(userInfo).length > 0) {
      const mergedUserInfo = {
        ...localUserInfo,
        ...userInfo,
        _id: localUserInfo._id || userInfo._id,
        account: localUserInfo.account || userInfo.account,
        _openid: localUserInfo._openid || userInfo._openid,
        avatarUrl: userInfo.avatarUrl || userInfo.avatar_url || localUserInfo.avatarUrl,
        avatar_url: userInfo.avatar_url || userInfo.avatarUrl || localUserInfo.avatar_url,
        nickName: userInfo.nickName || userInfo.nickname || localUserInfo.nickName,
        nickname: userInfo.nickname || userInfo.nickName || localUserInfo.nickname
      };

      console.log('更新后的本地用户信息:', JSON.stringify(mergedUserInfo));
      wx.setStorageSync('userInfo', mergedUserInfo);
    }

    return {
      success: !!success,
      message,
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
 * @returns {Promise<Object>} 返回用户资料
 */
const getUserProfile = async (params = {}) => {
  try {
    const localUserInfo = normalizeUserInfo(wx.getStorageSync('userInfo') || {});

    const userIdentifier = {
      account: localUserInfo.account || params.account || null,
      _id: localUserInfo._id || params._id || null,
      _openid: localUserInfo._openid || null,
      openid: localUserInfo.openid || localUserInfo._openid || null
    };

    console.log('获取用户资料 - 用户标识:', JSON.stringify(userIdentifier));

    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'getProfile',
        userIdentifier
      }
    });

    console.log('获取用户资料结果:', result);

    const response = result.result || {};
    const success = typeof response.success === 'boolean'
      ? response.success
      : !!(response.userInfo || response.data);
    const message = response.message || '获取用户资料操作完成';
    const userInfo = normalizeUserInfo(response.userInfo || response.data || {});

    return {
      success: !!success,
      message,
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
 * 获取评论使用的用户资料
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 返回用户资料
 */
const getCommentUserProfile = async (params = {}) => {
  try {
    const userIdentifier = {
      account: params.account || null,
      _id: params._id || null,
      _openid: params._openid || params.openid || null,
      openid: params.openid || params._openid || null
      openid: params.openid || null
    };

    console.log('获取用户资料 - 用户标识:', JSON.stringify(userIdentifier));

    const result = await wx.cloud.callFunction({
      name: 'userUpdate',
      data: {
        action: 'getProfile',
        userIdentifier
      }
    });

    console.log('获取用户资料结果:', result);

    const response = result.result || {};
    const success = typeof response.success === 'boolean'
      ? response.success
      : !!(response.userInfo || response.data);
    const message = response.message || '获取用户资料操作完成';
    const userInfo = normalizeUserInfo(response.userInfo || response.data || {});

    return {
      success: !!success,
      message,
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

module.exports = {
  uploadFile,
  uploadAvatar,
  updateUserProfile,
  getCommentUserProfile,
  getUserProfile
};
