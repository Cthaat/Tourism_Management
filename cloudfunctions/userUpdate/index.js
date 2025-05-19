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

    if (userIdentifier.account) {
      // 优先使用account查询
      whereCondition = {
        account: {
          $eq: userIdentifier.account
        }
      };
    } else if (userIdentifier._id) {
      // 其次使用_id查询
      whereCondition = {
        _id: {
          $eq: userIdentifier._id
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
  }  // 执行更新操作
  // 将条件转换为文档要求的格式
  let andCondition = [];
  if (whereCondition.account) {
    andCondition.push({
      account: {
        $eq: whereCondition.account.$eq
      }
    });
  } else if (whereCondition._id) {
    andCondition.push({
      _id: {
        $eq: whereCondition._id.$eq
      }
    });
  } else if (whereCondition._openid) {
    andCondition.push({
      _openid: {
        $eq: whereCondition._openid.$eq
      }
    });
  }

  const updateResult = await models.users.update({
    data: updateData,
    filter: {
      where: {
        $and: andCondition
      }
    },
    envType: "prod" // 或者使用"pre"如果是测试环境
  });

  console.log('更新结果:', updateResult);

  // 验证更新结果
  if (!updateResult || updateResult.data.Count === 0) {
    throw new Error('用户资料更新失败');
  }  // 获取更新后的用户信息
  // 重用之前构建的查询条件
  const userResult = await models.users.get({
    filter: {
      where: {
        $and: andCondition
      }
    }
  });

  console.log('获取更新后的用户信息:', userResult.data);

  return {
    success: true,
    message: '用户资料更新成功',
    userInfo: userResult.data
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
  // 使用已定义的models常量
  const models = app.models;

  try {
    // 处理文件上传
    if (eventAction === 'uploadFile' && fileID) {
      // 文件已经上传到临时路径，这里处理永久保存
      console.log('处理文件ID:', fileID);      // 更新用户头像
      if (eventType === 'avatar') {
        // 获取用户标识信息
        const userIdentifier = event.userIdentifier || {};
        return await updateUserProfile(models, {
          avatar_url: fileID
        }, wxContext.OPENID, userIdentifier);
      }

      // 返回文件ID供前端使用
      return {
        success: true,
        message: '文件上传成功',
        fileID: fileID
      };
    }    // 处理用户资料更新
    else if (eventAction === 'updateProfile' && Object.keys(eventData).length > 0) {
      console.log('更新用户资料:', eventData);
      // 获取用户标识信息
      const userIdentifier = event.userIdentifier || {};
      return await updateUserProfile(models, eventData, wxContext.OPENID, userIdentifier);
    }    // 查询用户信息
    else if (eventAction === 'getProfile') {
      console.log('查询用户资料');

      // 获取查询条件
      const userIdentifier = event.userIdentifier || {};
      let whereCondition = null;

      // 优先使用account字段查询
      if (userIdentifier.account) {
        whereCondition = {
          account: {
            $eq: userIdentifier.account
          }
        };
      } else if (userIdentifier._id) {
        whereCondition = {
          _id: {
            $eq: userIdentifier._id
          }
        };
      } else {
        // 兼容旧版，使用openid查询
        whereCondition = {
          _openid: {
            $eq: wxContext.OPENID
          }
        };
      } console.log('查询用户资料使用条件:', whereCondition);

      // 将条件转换为文档要求的格式
      let profileAndCondition = [];
      if (whereCondition.account) {
        profileAndCondition.push({
          account: {
            $eq: whereCondition.account.$eq
          }
        });
      } else if (whereCondition._id) {
        profileAndCondition.push({
          _id: {
            $eq: whereCondition._id.$eq
          }
        });
      } else if (whereCondition._openid) {
        profileAndCondition.push({
          _openid: {
            $eq: whereCondition._openid.$eq
          }
        });
      }

      const userProfileResult = await models.users.get({
        filter: {
          where: {
            $and: profileAndCondition
          }
        }
      });

      if (!userProfileResult.data || userProfileResult.data.length === 0) {
        return {
          success: false,
          message: '未找到用户信息'
        };
      } return {
        success: true,
        userInfo: userProfileResult.data[0],
        message: '获取用户资料成功'
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