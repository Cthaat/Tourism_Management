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
 * @param {string} openid - 用户openid
 */
async function updateUserProfile(models, data, openid) {
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

  // 执行更新操作
  const updateResult = await models.users.update({
    data: updateData,
    filter: {
      where: {
        _openid: {
          $eq: openid
        }
      }
    }
  });

  // 验证更新结果
  if (!updateResult || updateResult.updated === 0) {
    throw new Error('用户资料更新失败');
  }

  // 获取更新后的用户信息
  const { data: userData } = await models.users.get({
    filter: {
      where: {
        _openid: {
          $eq: openid
        }
      }
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

  // 获取数据模型
  const models = app.models;

  try {
    // 处理文件上传
    if (event.action === 'uploadFile' && event.fileID) {
      // 文件已经上传到临时路径，这里处理永久保存
      console.log('处理文件ID:', event.fileID);

      // 更新用户头像
      if (event.type === 'avatar') {
        return await updateUserProfile(models, {
          avatar_url: event.fileID
        }, wxContext.OPENID);
      }

      // 返回文件ID供前端使用
      return {
        success: true,
        message: '文件上传成功',
        fileID: event.fileID
      };
    }
    // 处理用户资料更新
    else if (event.action === 'updateProfile' && event.data) {
      console.log('更新用户资料:', event.data);
      return await updateUserProfile(models, event.data, wxContext.OPENID);
    }
    // 查询用户信息
    else if (event.action === 'getProfile') {
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