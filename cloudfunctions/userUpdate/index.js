// 云函数入口文件
const cloud = require('wx-server-sdk');
const cloudbase = require("@cloudbase/node-sdk");

// 使用当前云环境配置
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 记录初始化信息
console.log('Cloud SDK初始化环境:', cloud.DYNAMIC_CURRENT_ENV);

// 初始化cloudbase SDK
let app;
try {
  app = cloudbase.init({
    env: cloud.DYNAMIC_CURRENT_ENV, // 动态环境ID
    secretId: process.env.SECRETID, // 这些可能在生产环境中已配置
    secretKey: process.env.SECRETKEY
  });
  console.log('Cloudbase SDK初始化成功');
} catch (error) {
  console.error('Cloudbase SDK初始化失败:', error);
  // 尝试使用备用方式初始化
  try {
    app = cloudbase.init({
      env: process.env.TCB_ENV || cloud.DYNAMIC_CURRENT_ENV
    });
    console.log('通过备用方式初始化Cloudbase成功');
  } catch (backupError) {
    console.error('备用初始化也失败:', backupError);
    // 继续执行，让具体操作时再处理错误
  }
}

/**
 * 更新用户资料（包括头像等信息）
 * @param {Object} models - cloudbase模型
 * @param {Object} data - 更新数据
 * @param {string} openid - 当前请求的openid
 * @param {Object} userIdentifier - 用户标识信息
 */
async function updateUserProfile(models, data, openid, userIdentifier = {}) {  // 验证models是否有效
  if (!models) {
    console.error('数据模型对象不存在');
    // 尝试重新初始化数据模型
    try {
      console.log('尝试重新初始化数据模型');
      models = require('./models/index'); // 或者其他方式获取models
    } catch (modelError) {
      console.error('重新初始化数据模型失败:', modelError);
      // 继续使用fallback方式
    }

    // 如果仍然没有models，尝试直接从数据库获取users集合
    if (!models) {
      console.log('使用备用方式访问users集合');
      const db = app.database();
      // 创建一个fallback的models对象
      models = {
        users: {
          update: async (params) => {
            try {
              const collection = db.collection('users');
              const filter = params.filter?.where?.$and || [];

              // 构建查询条件
              let query = collection;
              if (filter.length > 0) {
                // 假设只使用第一个条件进行查询
                const condition = filter[0];
                const key = Object.keys(condition)[0];
                const value = condition[key].$eq;
                query = query.where(key, '==', value);
              }

              // 执行更新操作
              const result = await query.update(params.data);
              return { data: { Count: result.updated || 0 } };
            } catch (err) {
              console.error('Fallback更新失败:', err);
              throw err;
            }
          },
          get: async (params) => {
            try {
              const collection = db.collection('users');
              const filter = params.filter?.where?.$and || [];

              // 构建查询条件
              let query = collection;
              if (filter.length > 0) {
                // 假设只使用第一个条件进行查询
                const condition = filter[0];
                const key = Object.keys(condition)[0];
                const value = condition[key].$eq;
                query = query.where(key, '==', value);
              }

              // 执行查询操作
              const result = await query.get();
              return { data: result.data || [] };
            } catch (err) {
              console.error('Fallback查询失败:', err);
              throw err;
            }
          }
        }
      };
      console.log('已创建备用数据模型');
    }
  }

  if (!models.users) {
    console.error('数据模型无效，无法访问users集合');
    throw new Error('数据库连接失败，无法访问用户数据');
  }
  // 构建更新数据对象
  const updateData = {
    updated_at: Date.now()
  };

  // 遍历用户提交的数据进行更新
  if (data.nickname) {
    updateData.nickname = data.nickname;
    console.log('检测到nickname更新:', data.nickname);

    // 确保同时更新nickName字段
    updateData.nickName = data.nickname;
  } else if (data.nickName) {
    // 如果只提供了nickName字段，也同时更新nickname
    updateData.nickname = data.nickName;
    updateData.nickName = data.nickName;
    console.log('检测到nickName更新:', data.nickName);
  }

  if (data.avatar_url) {
    updateData.avatar_url = data.avatar_url;
    // 同时更新avatarUrl字段
    updateData.avatarUrl = data.avatar_url;
  } else if (data.avatarUrl) {
    updateData.avatar_url = data.avatarUrl;
    updateData.avatarUrl = data.avatarUrl;
  }

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
  try {
    const userResult = await models.users.get({
      filter: {
        where: {
          $and: andCondition
        }
      }
    });

    console.log('获取更新后的用户信息:', userResult.data);

    // 确保返回数据中的昵称字段同步
    if (userResult.data && userResult.data.length > 0) {
      const userData = userResult.data[0];

      // 同步昵称字段
      if (userData.nickname && !userData.nickName) {
        userData.nickName = userData.nickname;
      } else if (userData.nickName && !userData.nickname) {
        userData.nickname = userData.nickName;
      }

      // 同步头像字段
      if (userData.avatar_url && !userData.avatarUrl) {
        userData.avatarUrl = userData.avatar_url;
      } else if (userData.avatarUrl && !userData.avatar_url) {
        userData.avatar_url = userData.avatarUrl;
      }
    }

    return userResult;
  } catch (error) {
    console.error('获取更新后用户信息失败:', error);
    throw new Error('获取更新后用户信息失败: ' + error.message);
  }

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

  // 获取数据模型（优先使用app.models，如果不存在则使用自定义实现）
  let models;

  // 初始化数据库
  const db = cloud.database();
  const usersCollection = db.collection('users');

  try {
    // 尝试使用app.models（如果已经初始化）
    if (app && app.models && app.models.users) {
      console.log('使用app.models访问数据库');
      models = app.models;
    } else {
      // 如果app.models不可用，使用自定义模型适配器
      console.log('app.models不可用或未初始化，使用自定义数据库模型');
      models = {
        users: {
          update: async (params) => {
            console.log('使用自定义update方法:', params);
            // 将params的查询条件转换为cloud.database()的格式
            const filter = params.filter || {};
            const where = filter.where || {};
            const andConditions = where.$and || [];

            // 构建查询条件
            let dbQuery = usersCollection;

            if (andConditions.length > 0) {
              // 获取第一个条件（通常只有一个）
              const condition = andConditions[0];
              const key = Object.keys(condition)[0];
              if (key && condition[key] && condition[key].$eq) {
                dbQuery = usersCollection.where({
                  [key]: condition[key].$eq
                });
              }
            }

            // 执行更新
            try {
              const updateResult = await dbQuery.update({
                data: params.data
              });
              return { data: { Count: updateResult.stats.updated } };
            } catch (error) {
              console.error('更新用户数据出错:', error);
              throw error;
            }
          },
          get: async (params) => {
            console.log('使用自定义get方法:', params);
            // 将params的查询条件转换为cloud.database()的格式
            const filter = params.filter || {};
            const where = filter.where || {};
            const andConditions = where.$and || [];

            // 构建查询条件
            let dbQuery = usersCollection;

            if (andConditions.length > 0) {
              // 获取第一个条件（通常只有一个）
              const condition = andConditions[0];
              const key = Object.keys(condition)[0];
              if (key && condition[key] && condition[key].$eq) {
                dbQuery = usersCollection.where({
                  [key]: condition[key].$eq
                });
              }
            }

            // 执行查询
            try {
              const queryResult = await dbQuery.get();
              return { data: queryResult.data };
            } catch (error) {
              console.error('查询用户数据出错:', error);
              throw error;
            }
          }
        }
      };
    }

    // 进行简单测试，确保models可用
    if (!models || !models.users) {
      throw new Error('初始化数据模型失败：models.users 不可用');
    }
  } catch (initError) {
    console.error('初始化数据模型失败:', initError);
    throw new Error('初始化数据库连接失败: ' + (initError.message || '未知错误'));
  }
  try {
    // 处理文件上传
    if (eventAction === 'uploadFile' && fileID) {
      // 文件已经上传到临时路径，这里处理永久保存
      console.log('处理文件ID:', fileID);

      // 更新用户头像
      if (eventType === 'avatar') {
        try {
          // 获取用户标识信息
          const userIdentifier = event.userIdentifier || {};
          return await updateUserProfile(models, {
            avatar_url: fileID
          }, wxContext.OPENID, userIdentifier);
        } catch (avatarError) {
          console.error('更新头像失败:', avatarError);
          return {
            success: false,
            message: avatarError.message || '更新头像失败',
            fileID: fileID, // 返回文件ID，方便前端再次尝试
            openid: wxContext.OPENID
          };
        }
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

    // 增强错误日志记录
    const errorInfo = {
      message: error.message || '未知错误',
      time: new Date().toISOString(),
      action: eventAction,
      operation: '用户资料更新',
      errorType: error.name || '未知错误类型',
      stack: error.stack || '无堆栈信息'
    };

    console.error('详细错误信息:', errorInfo);

    // 判断是否为数据库错误
    if (error.message && (
      error.message.includes('database') ||
      error.message.includes('collection') ||
      error.message.includes('表') ||
      error.message.includes('models')
    )) {
      console.error('可能的数据库原因:',
        '1. 数据库集合不存在，请检查是否创建了users集合',
        '2. 当前用户无数据库操作权限',
        '3. 数据格式不符合集合要求',
        '4. 云环境配额已满'
      );
    }

    return {
      success: false,
      message: error.message || '操作失败，请稍后重试',
      openid: wxContext.OPENID
    };
  }
}