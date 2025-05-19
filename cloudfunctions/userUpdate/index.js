// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 初始化cloudbase SDK
const app = cloudbase.init({
  env: cloud.DYNAMIC_CURRENT_ENV, // 使用当前云环境
});

/**
 * 更新用户资料（包括头像等信息）
 * @param {Object} models - cloudbase模型
 * @param {Object} data - 更新数据
 * @param {string} openid - 当前请求的openid
 * @param {Object} userIdentifier - 用户标识信息
 */
async function updateUserProfile(models, data, openid, userIdentifier = {}) {
  // 构建更新数据对象
  const updateData = {
    updated_at: Date.now()
  };

  // 遍历用户提交的数据进行更新
  if (data.nickname) updateData.nickname = data.nickname;
  if (data.avatar_url) updateData.avatar_url = data.avatar_url;
  if (data.phone) updateData.phone = data.phone;
  if (data.color_theme) updateData.color_theme = data.color_theme;
  if (data.theme_setting) updateData.theme_setting = data.theme_setting;

  console.log('更新用户资料:', updateData);

  // 构建查询条件，支持多种标识
  let whereCondition = null;

  // 优先使用传入的标识信息
  if (userIdentifier) {
    console.log('使用传入的用户标识:', userIdentifier);

    if (userIdentifier._id) {
      // 如果有_id，优先使用_id查询
      whereCondition = {
        _id: {
          $eq: userIdentifier._id
        }
      };
    } else if (userIdentifier.account) {
      // 其次使用account查询
      whereCondition = {
        account: {
          $eq: userIdentifier.account
        }
      };
    } else if (userIdentifier._openid) {
      // 最后使用_openid查询
      whereCondition = {
        _openid: {
          $eq: userIdentifier._openid
        }
      };
    }
  }

  // 如果没有有效的查询条件，则使用当前请求的openid
  if (!whereCondition && openid) {
    whereCondition = {
      _openid: {
        $eq: openid
      }
    };
  }

  console.log('使用的查询条件:', whereCondition);

  if (!whereCondition) {
    throw new Error('无法确定要更新的用户');
  }

  // 执行更新操作
  const updateResult = await models.users.update({
    data: updateData,
    filter: {
      where: whereCondition
    }
  });

  console.log('更新结果:', updateResult);

  // 验证更新结果
  if (!updateResult || updateResult.updated === 0) {
    throw new Error('用户资料更新失败');
  }

  // 获取更新后的用户信息
  const { data: userData } = await models.users.get({
    filter: {
      where: whereCondition
    }
  });

  return {
    success: true,
    message: '用户资料更新成功',
    userInfo: userData
  };
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('userUpdate event:', event);

  // 安全地访问属性，避免undefined错误
  const eventAction = event.action || '';
  const eventData = event.data || {};
  const fileID = event.fileID || '';
  const eventType = event.type || '';

  // 获取数据模型
  const models = app.models;

  try {
    // 处理文件上传
    if (eventAction === 'uploadFile' && fileID) {
      // 文件已经上传到临时路径，这里处理永久保存
      console.log('处理文件ID:', fileID);

      // 更新用户头像
      if (eventType === 'avatar') {
        return await updateUserProfile(models, {
          avatar_url: fileID
        }, wxContext.OPENID);
      }

      // 返回文件ID供前端使用
      return {
        success: true,
        message: '文件上传成功',
        fileID: fileID
      };
    }
    // 处理用户资料更新
    else if (eventAction === 'updateProfile' && Object.keys(eventData).length > 0) {
      console.log('更新用户资料:', eventData);
      return await updateUserProfile(models, eventData, wxContext.OPENID);
    }
    // 查询用户信息
    else if (eventAction === 'getProfile') {
      console.log('查询用户资料');
      const { data } = await models.users.list({
        filter: {
          where: {
            _openid: {
              $eq: wxContext.OPENID
            }
          }
        }
      });

      if (data.records.length === 0) {
        return {
          success: false,
          message: '未找到用户信息'
        };
      }

      return {
        success: true,
        userInfo: data.records[0]
      };
    }
    // 其他未知操作
    else {
      return {
        success: false,
        message: '未知操作类型',
        event,
        openid: wxContext.OPENID
      };
    }
  } catch (error) {
    console.error('用户更新操作失败:', error);
    return {
      success: false,
      message: error.message || '操作失败，请稍后重试',
      openid: wxContext.OPENID
    };
  }
}