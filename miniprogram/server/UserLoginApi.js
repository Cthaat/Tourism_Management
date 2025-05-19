/**
 * 用户登录API接口封装
 * 提供与用户登录/注册相关的云函数交互方法集合
 * 创建日期: 2025-05-18
 * 作者: Tourism_Management开发团队
 */

/**
 * 用户登录接口
 * @param {Object} params - 登录参数
 * @param {string} params.action - 动作类型，默认为'login'
 * @param {Object} params.data - 登录数据
 * @param {string} params.data.account - 用户账号
 * @param {string} params.data.password - 用户密码
 * @param {Object} [params.wxUserInfo] - 微信用户信息(可选)
 * @returns {Promise} 返回登录结果
 */
const userLogin = async (params = {}) => {
  try {
    console.log('准备调用登录云函数，参数:', params);

    // 检查是否传入了微信用户信息，如果传入则可以在需要时使用本地登录
    const wxUserInfo = params.wxUserInfo;

    // 尝试调用云函数
    try {
      // 调用云函数
      const result = await wx.cloud.callFunction({
        name: 'userLogin',
        data: params
      });

      console.log('云函数返回原始结果:', result);

      // 处理返回结果
      // 由于云函数直接返回的是结果对象，不需要额外解构
      const response = result.result || {};

      // 判断是否成功返回用户信息
      if (response.userInfo) {
        // 格式化返回数据以保持统一的API返回格式
        return {
          success: true,
          data: response,
          message: '登录成功'
        };
      } else if (response.error) {
        // 云函数返回错误，但有微信用户信息，使用本地登录
        if (wxUserInfo) {
          console.warn('云函数返回错误，回退到本地登录:', response.error);
          return useLocalLogin(wxUserInfo);
        }

        return {
          success: false,
          message: response.error || '登录失败，请稍后重试',
        };
      } else {
        // 没有返回用户信息，但有微信用户信息，使用本地登录
        if (wxUserInfo) {
          console.warn('云函数未返回用户信息，回退到本地登录');
          return useLocalLogin(wxUserInfo);
        }

        return {
          success: false,
          message: '登录失败，未获取到用户信息',
          data: response
        };
      }
    } catch (cloudError) {
      // 云函数调用失败，如果有微信用户信息，使用本地登录
      console.error('云函数调用失败:', cloudError);
      console.warn('错误原因可能是数据库集合不存在，需要在云开发控制台创建"users"集合');

      if (wxUserInfo) {
        console.warn('使用本地登录方式作为备选');
        return useLocalLogin(wxUserInfo);
      }

      throw cloudError; // 如果没有微信用户信息，继续抛出错误
    }
  } catch (error) {
    console.error('登录接口调用失败:', error);

    // 提取错误中的关键信息
    let errorMsg = error.message || error.toString();
    let friendlyMsg = '登录接口调用异常';

    // 针对特定错误提供友好提示
    if (errorMsg.includes('database collection not exists')) {
      friendlyMsg = '数据库集合不存在，请在云开发控制台创建"users"集合';
    }

    return {
      success: false,
      message: friendlyMsg,
      error: errorMsg
    };
  }
};

/**
 * 更新用户登录状态
 * 登录成功后更新本地存储
 * @param {Object} userInfo - 用户信息
 */
const updateLoginStatus = (userInfo) => {
  if (userInfo && (userInfo._id || userInfo.openid)) {
    // 存储用户信息到本地缓存
    wx.setStorageSync('userInfo', userInfo);
    // 设置登录状态
    wx.setStorageSync('isLoggedIn', true);

    // 记录登录时间
    const loginTime = new Date().getTime();
    wx.setStorageSync('loginTime', loginTime);

    console.log('已更新登录状态，用户信息:', userInfo);
    return true;
  }

  console.warn('更新登录状态失败，无效的用户信息:', userInfo);
  return false;
};

/**
 * 退出登录
 * 清除本地存储的用户信息和登录状态
 */
const logout = () => {
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('isLoggedIn');
  return { success: true, message: '已退出登录' };
};

/**
 * 检查登录状态
 * @returns {Object} 登录状态信息
 */
const checkLoginStatus = () => {
  const isLoggedIn = wx.getStorageSync('isLoggedIn') || false;
  const userInfo = wx.getStorageSync('userInfo') || null;

  return {
    isLoggedIn,
    userInfo
  };
};

/**
 * 获取用户最新资料
 * 调用云函数获取用户的最新资料
 * @returns {Promise} 返回用户资料获取结果
 */
const fetchUserProfile = async () => {
  try {
    // 检查登录状态
    const loginStatus = checkLoginStatus();

    if (!loginStatus.isLoggedIn) {
      return {
        success: false,
        message: '用户未登录，无法获取用户资料'
      };
    }

    // 检查用户信息是否有isLocalLogin标记，如果是本地登录用户则直接返回本地信息
    const userInfo = loginStatus.userInfo;
    if (userInfo && (userInfo._id?.startsWith('local_') || userInfo.isLocalLogin)) {
      console.log('检测到本地登录用户，跳过云端资料获取');
      return {
        success: true,
        userInfo: userInfo,
        message: '获取本地用户资料成功',
        isLocalUser: true
      };
    }

    try {      // 确定当前用户的标识信息
      const userIdentifier = {
        _id: userInfo._id || null,           // 优先使用 _id
        account: userInfo.account || null,    // 其次使用 account
        _openid: userInfo._openid || null     // 最后使用 _openid
      };

      // 记录详细的用户标识信息，用于调试
      console.log('获取用户资料 - 详细标识信息:', JSON.stringify(userIdentifier));

      console.log('当前用户标识信息:', userIdentifier);

      // 尝试调用云函数获取用户资料
      const result = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          action: 'getProfile',
          userIdentifier // 传递用户标识信息以便云函数能找到正确的用户
        }
      });

      console.log('云函数获取用户资料结果:', result);

      const response = result.result || {};

      // 判断是否成功获取用户信息
      if (response.userInfo) {
        // 更新本地存储的用户信息
        updateLoginStatus(response.userInfo);

        return {
          success: true,
          userInfo: response.userInfo,
          message: '获取用户资料成功'
        };
      } else {
        // 云函数没有返回用户信息，但有本地信息
        if (userInfo) {
          console.warn('云函数未返回用户信息，使用本地信息');
          return {
            success: true,
            userInfo: userInfo,
            message: '使用本地缓存的用户信息',
            isLocalFallback: true
          };
        }

        return {
          success: false,
          message: response.error || '获取用户资料失败',
          data: response
        };
      }
    } catch (cloudError) {
      console.error('云函数获取用户资料失败:', cloudError);

      // 如果云函数调用失败但有本地缓存，使用本地缓存
      if (userInfo) {
        console.warn('云函数调用失败，使用本地用户信息');
        return {
          success: true,
          userInfo: userInfo,
          message: '云端获取失败，使用本地信息',
          isLocalFallback: true
        };
      }

      throw cloudError; // 如果没有本地信息，继续抛出错误
    }
  } catch (error) {
    console.error('获取用户资料失败:', error);

    // 提取错误中的关键信息并提供友好提示
    let errorMsg = error.message || error.toString();
    let friendlyMsg = '获取用户资料出错';

    if (errorMsg.includes('database collection not exists')) {
      friendlyMsg = '数据库集合不存在，请在云开发控制台创建必要的集合';
    }

    return {
      success: false,
      message: friendlyMsg,
      error: errorMsg
    };
  }
};

/**
 * 本地登录功能 - 当云函数调用失败时的备选方案
 * @param {Object} wxUserInfo - 微信用户信息
 * @returns {Object} 登录结果
 */
const useLocalLogin = (wxUserInfo) => {
  if (!wxUserInfo) {
    return {
      success: false,
      message: '没有可用的用户信息',
    };
  }

  // 使用微信用户信息构建一个本地用户对象
  const localUserInfo = {
    _id: `local_${new Date().getTime()}`,
    openid: wxUserInfo.openId || `local_${new Date().getTime()}`,
    nickname: wxUserInfo.nickName,
    avatar_url: wxUserInfo.avatarUrl,
    gender: wxUserInfo.gender,
    country: wxUserInfo.country,
    province: wxUserInfo.province,
    city: wxUserInfo.city,
    language: wxUserInfo.language,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime(),
    last_login_time: new Date().getTime()
  };

  // 模拟云函数返回结果
  return {
    success: true,
    message: '本地登录成功（云函数不可用）',
    data: {
      userInfo: localUserInfo,
      isNewUser: true,
      isLocalLogin: true // 标记这是一个本地登录
    }
  };
};

// 导出API接口
module.exports = {
  userLogin,
  updateLoginStatus,
  logout,
  checkLoginStatus,
  fetchUserProfile,
  useLocalLogin
};