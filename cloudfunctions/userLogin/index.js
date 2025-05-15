// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 初始化cloudbase SDK
const app = cloudbase.init({
  env: cloud.DYNAMIC_CURRENT_ENV, // 使用当前云环境
});

// 账号密码登录逻辑
async function loginWithAccount(models, data) {
  const { account, password } = data;
  const { data: userData } = await models.users.list({
    filter: {
      where: {
        account: {
          $eq: account
        },
        password: {
          $eq: password
        }
      }
    },
    getCount: true
  });

  if (userData.records.length === 0) {
    throw new Error('账号或密码错误');
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

  console.log('登录成功:', userData.records[0]);
  // 返回登录成功的用户信息

  return {
    success: true,
    userInfo: userData.records[0]
  };
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('event', event)
  console.log('event.data', event.data)
  console.log('event.data.account', event.data.account)
  console.log('wxContext', wxContext)

  // 获取数据模型
  const models = app.models;

  console.log('models', models)

  // 检查是否是账号密码登录请求
  if (event.action === 'login' && event.data && event.data.account && event.data.password) {
    console.log('账号密码登录请求:', event.data);
    try {
      // 账号密码登录逻辑
      return await loginWithAccount(models, event.data);
    } catch (error) {
      console.error('账号密码登录失败:', error);
      return {
        success: false,
        message: error.message || '登录失败，请稍后重试'
      };
    }
  }

  try {
    // 查询用户信息 - 根据openid查询
    const { data } = await models.users.list({
      filter: {
        where: {
          account: {
            $eq: wxContext.OPENID
          }
        }
      },
      getCount: true
    });

    console.log('查询结果:', data)

    // 如果没有查到用户信息，创建新用户
    if (data.records.length === 0) {
      console.log('未找到用户，准备创建新用户')

      // 创建新用户
      const createResult = await models.users.create({
        data: {
          _openid: wxContext.OPENID,
          account: wxContext.OPENID, // 使用openid作为账号
          password: '123456', // 初始默认密码
          nickname: '新用户',
          avatar_url: '',
          phone: '13800000000', // 设置一个默认电话号码格式
          color_theme: '默认绿',
          theme_setting: 'light',
          created_at: Date.now(), // 使用时间戳
          updated_at: Date.now(), // 使用时间戳
          last_login_time: Date.now() // 使用时间戳
        }
      });

      console.log('创建新用户结果:', createResult)

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
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
        userInfo: newUserData,
        isNewUser: true
      }
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
              $eq: wxContext.OPENID
            }
          }
        }
      });

      // 返回查询结果
      return {
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
        userInfo: data.records[0],
        isNewUser: false
      }
    }
  } catch (error) {
    console.error('数据库操作失败:', error)
    return {
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      error: error.message || error.toString()
    }
  }
}