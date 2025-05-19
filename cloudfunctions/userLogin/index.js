// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 初始化cloudbase SDK
const app = cloudbase.init({
  env: cloud.DYNAMIC_CURRENT_ENV, // 使用当前云环境
});

// 账号密码登录逻辑
async function loginWithAccount(models, data = {}) {
  // 安全地获取账号密码，避免undefined错误
  const account = data.account || '';
  const password = data.password || '';

  if (!account) {
    throw new Error('缺少账号信息');
  }

  // 首先只根据账号查询用户
  try {
    const { data: accountData } = await models.users.list({
      filter: {
        where: {
          account: {
            $eq: account
          }
        }
      },
      getCount: true
    });

    // 如果没有找到账号，创建新用户
    if (!accountData || !accountData.records || accountData.records.length === 0) {
      console.log('账号不存在，准备创建新用户');

      // 创建新用户
      const createResult = await models.users.create({
        data: {
          account: account,
          password: password,
          nickname: '新用户',
          avatar_url: '',
          phone: '13800000000', // 设置一个默认电话号码格式
          color_theme: '默认绿',
          theme_setting: 'light',
          created_at: Date.now(),
          updated_at: Date.now(),
          last_login_time: Date.now()
        }
      });

      console.log('创建新用户结果:', createResult);

      // 安全检查创建结果
      if (!createResult || !createResult.id) {
        throw new Error('创建用户失败');
      }

      // 获取新创建的用户
      const { data: newUserData } = await models.users.get({
        filter: {
          where: {
            _id: {
              $eq: createResult.id
            }
          }
        }
      });

      return {
        success: true,
        userInfo: newUserData,
        isNewUser: true
      };
    }

    // 账号存在，检查密码是否匹配
    const userRecord = accountData.records[0] || {};
    if (!userRecord.password || userRecord.password !== password) {
      throw new Error('密码错误');
    }

    // 更新登录时间
    await models.users.update({
      data: {
        last_login_time: Date.now(),
        updated_at: Date.now()
      },
      filter: {
        where: {
          account: {
            $eq: account
          }
        }
      }
    });

    console.log('登录成功:', userRecord);
    // 返回登录成功的用户信息

    return {
      success: true,
      userInfo: userRecord,
      isNewUser: false
    };
  } catch (error) {
    console.error('账号登录处理错误:', error);
    throw error; // 向上传递错误
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext() || {};
    const openid = wxContext.OPENID || '';

    console.log('event', event);

    // 安全地访问属性，避免undefined错误
    const eventData = event.data || {};
    const eventAction = event.action || '';
    console.log('event.action', eventAction);
    console.log('event.data', eventData);
    console.log('openid', openid);

    // 获取数据模型
    const models = app.models;
    console.log('models', models);

    // 专门处理获取用户资料的请求
    if (eventAction === 'getProfile') {
      console.log('处理获取用户资料请求');
      const userIdentifier = event.userIdentifier || {};
      console.log('接收到的用户标识:', userIdentifier); try {
        // 构建查询条件，支持多种标识，按照优先级排序
        const whereConditions = [];

        // 首先添加 _id 条件（最高优先级）
        if (userIdentifier._id) {
          whereConditions.push({
            _id: {
              $eq: userIdentifier._id
            }
          });
        }

        // 其次添加账号条件（第二优先级）
        if (userIdentifier.account) {
          whereConditions.push({
            account: {
              $eq: userIdentifier.account
            }
          });
        }

        // 最后添加 openid 条件（最低优先级）
        if (openid) {
          whereConditions.push({
            _openid: {
              $eq: openid
            }
          });
        }

        // 如果提供了其他 openid，添加这个条件
        if (userIdentifier._openid && userIdentifier._openid !== openid) {
          whereConditions.push({
            _openid: {
              $eq: userIdentifier._openid
            }
          });
        }

        // 如果没有任何有效条件，返回错误
        if (whereConditions.length === 0) {
          console.error('获取用户资料失败: 无有效的查询条件');
          return {
            success: false,
            message: '无法确定要查询的用户'
          };
        }

        console.log('查询条件:', whereConditions);        // 记录查询优先级
        console.log('查询优先级：1._id > 2.account > 3._openid');

        // 尝试查询所有可能的用户
        const allUserResults = [];

        // 依次尝试每个条件
        for (const condition of whereConditions) {
          try {
            console.log('尝试查询条件:', JSON.stringify(condition));
            const { data } = await models.users.list({
              filter: {
                where: condition
              },
              getCount: true
            });

            if (data && data.records && data.records.length > 0) {
              allUserResults.push(...data.records);
            }
          } catch (err) {
            console.warn('查询条件执行错误:', err, condition);
            // 继续尝试下一个条件
          }
        }

        // 去重
        const uniqueUsers = {};
        allUserResults.forEach(user => {
          if (user._id) {
            uniqueUsers[user._id] = user;
          }
        });

        const finalUsers = Object.values(uniqueUsers);
        console.log('查询到的用户:', finalUsers.length, finalUsers);

        if (finalUsers.length > 0) {          // 找到一个或多个用户，按优先级返回
          // 日志输出所有找到的用户，以便调试
          console.log('找到的所有用户:', finalUsers);

          // 按照 _id、account、_openid 的优先级排序
          // 首先尝试按照 userIdentifier._id 查找
          if (userIdentifier._id) {
            const userById = finalUsers.find(user => user._id === userIdentifier._id);
            if (userById) {
              console.log('通过 _id 找到用户:', userById);
              return {
                success: true,
                userInfo: userById,
                foundUsers: finalUsers.length,
                foundBy: '_id'
              };
            }
          }

          // 然后尝试按照 userIdentifier.account 查找
          if (userIdentifier.account) {
            const userByAccount = finalUsers.find(user => user.account === userIdentifier.account);
            if (userByAccount) {
              console.log('通过 account 找到用户:', userByAccount);
              return {
                success: true,
                userInfo: userByAccount,
                foundUsers: finalUsers.length,
                foundBy: 'account'
              };
            }
          }

          // 最后返回第一个用户(通常是通过 openid 找到的)
          console.log('未找到精确匹配，返回第一个用户:', finalUsers[0]);
          return {
            success: true,
            userInfo: finalUsers[0],
            foundUsers: finalUsers.length,
            foundBy: 'default'
          };
        } else {
          // 未找到用户
          return {
            success: false,
            message: '未找到用户资料'
          };
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        return {
          success: false,
          message: '获取用户资料失败: ' + (error.message || error.toString())
        };
      }
    }

    // 检查是否是账号密码登录请求
    if (eventAction === 'login' && eventData.account && eventData.password) {
      console.log('账号密码登录请求:', eventData);
      try {
        // 账号密码登录逻辑
        return await loginWithAccount(models, eventData);
      } catch (error) {
        console.error('账号密码登录失败:', error);
        return {
          success: false,
          message: error.message || '登录失败，请稍后重试'
        };
      }
    }

    // 其他微信登录逻辑 (确保安全处理)
    if (!openid) {
      console.error('微信登录失败: 无有效的openid');
      return {
        success: false,
        message: '无法获取用户身份信息'
      };
    }

    try {
      // 查询用户信息 - 根据openid查询
      const { data } = await models.users.list({
        filter: {
          where: {
            _openid: {
              $eq: openid
            }
          }
        },
        getCount: true
      });

      console.log('查询结果:', data);

      // 如果没有查到用户信息，创建新用户
      if (!data || !data.records || data.records.length === 0) {
        console.log('未找到用户，准备创建新用户');

        // 创建新用户
        const createResult = await models.users.create({
          data: {
            _openid: openid,
            account: openid, // 使用openid作为账号
            password: '123456', // 初始默认密码
            nickname: '微信用户',
            avatar_url: '',
            phone: '13800000000', // 设置一个默认电话号码格式
            color_theme: '默认绿',
            theme_setting: 'light',
            created_at: Date.now(), // 使用时间戳
            updated_at: Date.now(), // 使用时间戳
            last_login_time: Date.now() // 使用时间戳
          }
        });

        console.log('创建新用户结果:', createResult);

        // 安全检查创建结果
        if (!createResult || !createResult.id) {
          throw new Error('创建用户失败');
        }

        // 获取新创建的用户
        const { data: newUserData } = await models.users.get({
          filter: {
            where: {
              _id: {
                $eq: createResult.id
              }
            }
          }
        });

        return {
          success: true,
          openid: openid,
          appid: wxContext.APPID || '',
          unionid: wxContext.UNIONID || '',
          userInfo: newUserData,
          isNewUser: true
        };
      } else {
        // 更新登录时间
        await models.users.update({
          data: {
            last_login_time: Date.now(),
            updated_at: Date.now()
          },
          filter: {
            where: {
              _openid: {
                $eq: openid
              }
            }
          }
        });

        // 返回查询结果
        return {
          success: true,
          openid: openid,
          appid: wxContext.APPID || '',
          unionid: wxContext.UNIONID || '',
          userInfo: data.records[0],
          isNewUser: false
        };
      }
    } catch (error) {
      console.error('数据库操作失败:', error);
      return {
        success: false,
        openid: openid,
        appid: wxContext.APPID || '',
        unionid: wxContext.UNIONID || '',
        error: error.message || error.toString()
      };
    }
  } catch (globalError) {
    // 全局错误处理
    console.error('云函数全局错误:', globalError);
    return {
      success: false,
      message: '云函数执行异常: ' + (globalError.message || globalError.toString())
    };
  }
}