// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudbase = require("@cloudbase/node-sdk")

const FALLBACK_ENV_ID = 'cloud1-7gwgvcaxe59bbe99'
const UUID_ENV_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidEnv(value) {
  if (!value || typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized !== '' &&
    normalized !== 'undefined' &&
    normalized !== 'null' &&
    normalized !== 'none' &&
    normalized !== 'local' &&
    normalized !== 'dynamic_current_env' &&
    !UUID_ENV_PATTERN.test(normalized)
}

function resolveEnvId(wxContext) {
  const candidates = [
    process.env.TCB_ENV,
    process.env.WX_CLOUD_ENV,
    wxContext && wxContext.ENV,
    cloud.DYNAMIC_CURRENT_ENV,
    FALLBACK_ENV_ID
  ]

  for (const env of candidates) {
    if (isValidEnv(env)) {
      return env
    }
  }

  return FALLBACK_ENV_ID
}

function isLocalDebugEnv(wxContext) {
  const envValues = [
    wxContext && wxContext.ENV,
    process.env.TCB_ENV,
    process.env.WX_CLOUD_ENV,
    cloud.DYNAMIC_CURRENT_ENV
  ]

  return envValues.some((value) => String(value || '').trim().toLowerCase() === 'local')
}

function extractSingleCondition(filter = {}) {
  const directWhere = filter?.where || {}
  const directKey = Object.keys(directWhere)[0]
  const directValue = directKey && directWhere[directKey] && directWhere[directKey].$eq

  if (directKey && typeof directValue !== 'undefined') {
    return {
      key: directKey,
      value: directValue
    }
  }
  const andConditions = filter?.where?.$and || []
  if (!Array.isArray(andConditions) || andConditions.length === 0) {
    return null
  }

  const condition = andConditions[0] || {}
  const key = Object.keys(condition)[0]
  const value = key && condition[key] && condition[key].$eq

  if (!key || typeof value === 'undefined') {
    return null
  }

  return {
    key,
    value
  }
}

function normalizeSingleUser(data) {
  if (Array.isArray(data)) {
    data = data[0] || null
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const source = (data.data && typeof data.data === 'object')
    ? {
      ...data.data,
      _id: data._id || data.data._id,
      _openid: data._openid || data.data._openid,
      openid: data.openid || data.data.openid,
      account: data.account || data.data.account
    }
    : data

  return {
    ...source,
    nickname: source.nickname || source.nickName || '',
    avatar_url: source.avatar_url || source.avatarUrl || '',
    nickName: source.nickName || source.nickname || '',
    avatarUrl: source.avatarUrl || source.avatar_url || '',
    _openid: source._openid || source.openid || '',
    openid: source.openid || source._openid || '',
    account: source.account || ''
  }
}

function createUsersApi(app) {
  const db = app && typeof app.database === 'function' ? app.database() : null
  const collection = db ? db.collection('users') : null
  if (!collection) {
    throw new Error('初始化用户数据源失败：无法访问 users 集合')
  }

  const readCollectionByCondition = async (params = {}) => {
    const condition = extractSingleCondition(params.filter || {})
    let query = collection

    if (condition) {
      query = collection.where({
        [condition.key]: condition.value
      })
    }
    return await query.get()
  }

  const listByCollection = async (params = {}) => {
    const result = await readCollectionByCondition(params)
    return {
      data: {
        records: result.data || [],
        total: result.data ? result.data.length : 0
      }
    }
  }

  const getByCollection = async (params = {}) => {
    const result = await readCollectionByCondition(params)
    return {
      data: normalizeSingleUser(result.data || [])
    }
  }

  const updateByCollection = async (params = {}) => {
    const condition = extractSingleCondition(params.filter || {})
    if (!condition) {
      throw new Error('更新用户失败：缺少有效的查询条件')
    }

    const result = await collection.where({
      [condition.key]: condition.value
    }).update(params.data || {})

    return {
      data: {
        Count: result.stats?.updated || result.updated || 0
      }
    }
  }

  const createByCollection = async (params = {}) => {
    const result = await collection.add(params.data || {})

    const createdId = result.id || result._id || (result.data && (result.data.id || result.data._id))

    return {
      id: createdId,
      data: {
        id: createdId,
        _id: createdId
      }
    }
  }

  const countByCollection = async () => {
    const result = await collection.count()
    return result.total || 0
  }

  return {
    source: 'collection-only',
    async list(params = {}) {
      return listByCollection(params)
    },
    async create(params = {}) {
      return createByCollection(params)
    },
    async get(params = {}) {
      return getByCollection(params)
    },
    async update(params = {}) {
      return updateByCollection(params)
    },
    async count() {
      return countByCollection()
    }
  }
}

// 账号密码登录逻辑
async function loginWithAccount(usersApi, data = {}, openid = '') {
  // 安全地获取账号密码，避免undefined错误
  const account = data.account || '';
  const password = data.password || '';

  if (!account) {
    throw new Error('缺少账号信息');
  }

  // 首先只根据账号查询用户
  try {
    const { data: accountData } = await usersApi.list({
      filter: {
        where: {
          account: {
            $eq: account
          }
        }
      },
      getCount: true
    });

    // 如果没有找到账号，先尝试兼容旧版 data.account 嵌套结构
    if (!accountData || !accountData.records || accountData.records.length === 0) {
      const { data: legacyAccountData } = await usersApi.list({
        filter: {
          where: {
            'data.account': {
              $eq: account
            }
          }
        },
        getCount: true
      })

      if (legacyAccountData && legacyAccountData.records && legacyAccountData.records.length > 0) {
        const legacyRecord = legacyAccountData.records[0]
        const legacyUser = normalizeSingleUser(legacyRecord)

        if (legacyUser && legacyUser._id) {
          const patchedLegacyUser = {
            account: legacyUser.account || account,
            password: legacyUser.password || password,
            nickname: legacyUser.nickname || legacyUser.nickName || '新用户',
            avatar_url: legacyUser.avatar_url || legacyUser.avatarUrl || '',
            nickName: legacyUser.nickName || legacyUser.nickname || '新用户',
            avatarUrl: legacyUser.avatarUrl || legacyUser.avatar_url || '',
            _openid: legacyUser._openid || openid || '',
            openid: legacyUser.openid || legacyUser._openid || openid || '',
            phone: legacyUser.phone || '13800000000',
            color_theme: legacyUser.color_theme || '天空蓝',
            theme_setting: legacyUser.theme_setting || 'dark',
            createBy: legacyUser.createBy || openid,
            updateBy: openid || legacyUser.updateBy,
            createdAt: legacyUser.createdAt || Date.now(),
            updatedAt: Date.now(),
            last_login_time: Date.now()
          }

          await usersApi.update({
            data: patchedLegacyUser,
            filter: {
              where: {
                _id: {
                  $eq: legacyUser._id
                }
              }
            }
          })

          const { data: migratedUserData } = await usersApi.get({
            filter: {
              where: {
                _id: {
                  $eq: legacyUser._id
                }
              }
            }
          })

          return {
            success: true,
            userInfo: normalizeSingleUser(migratedUserData) || {
              _id: legacyUser._id,
              ...patchedLegacyUser
            },
            isNewUser: false,
            migratedLegacyUser: true
          }
        }
      }

      // 兼容查询未命中时，创建新用户
      console.log('账号不存在，准备创建新用户');

      // 创建用户前的参数验证
      if (!account.trim()) {
        throw new Error('创建用户失败: 账号不能为空');
      }

      if (!password || password.length < 6) {
        throw new Error('创建用户失败: 密码不符合要求，至少需要6个字符');
      }

      // 记录创建用户的开始时间，用于性能分析
      const createStartTime = Date.now();

      // 创建新用户
      let createResult;
      try {
        createResult = await usersApi.create({
          data: {
            _openid: openid,
            openid: openid,
            account: account,
            password: password,
            nickname: '新用户',
            avatar_url: '',
            nickName: '新用户',
            avatarUrl: '',
            phone: '13800000000', // 设置一个默认电话号码格式
            color_theme: '天空蓝',
            theme_setting: 'dark',
            createBy: openid,
            updateBy: openid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            last_login_time: Date.now()
          }
        });

        console.log(`创建用户耗时: ${Date.now() - createStartTime}ms`);
        console.log('创建新用户结果:', createResult);
      } catch (createError) {
        console.error('创建用户数据库操作失败:', createError);
        // 对常见的数据库错误进行分类
        if (createError.message && createError.message.includes('permission denied')) {
          throw new Error('创建用户失败: 数据库操作权限不足，请检查数据库权限设置');
        } else if (createError.message && createError.message.includes('quota')) {
          throw new Error('创建用户失败: 云环境资源配额已满，请检查数据库配额');
        } else {
          throw new Error(`创建用户失败: 数据库操作异常 - ${createError.message || '未知错误'}`);
        }
      }

      // 安全检查创建结果
      if (!createResult) {
        console.error('创建用户完全失败，无返回结果');
        throw new Error('创建用户失败: 数据库操作无返回值');
      }

      // 获取新创建的用户
      const { data: newUserData } = await usersApi.get({
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
        userInfo: normalizeSingleUser(newUserData) || {
          _id: createResult.id,
          account,
          _openid: openid,
          nickname: '新用户',
          avatar_url: '',
          nickName: '新用户',
          avatarUrl: ''
        },
        isNewUser: true
      };
    }

    // 账号存在，检查密码是否匹配
    const userRecord = accountData.records[0] || {};
    if (!userRecord.password || userRecord.password !== password) {
      throw new Error('密码错误');
    }

    // 历史账号数据可能没有 _openid，登录时补写，保证后续按 openid 可查
    if (openid && !userRecord._openid) {
      await usersApi.update({
        data: {
          _openid: openid,
          openid: openid,
          updatedAt: Date.now()
        },
        filter: {
          where: {
            account: {
              $eq: account
            }
          }
        }
      })

      userRecord._openid = openid
      userRecord.openid = openid
    }

    // 更新登录时间
    await usersApi.update({
      data: {
        last_login_time: Date.now(),
        updatedAt: Date.now()
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
      userInfo: normalizeSingleUser(userRecord) || userRecord,
      isNewUser: false
    };
  } catch (error) {
    console.error('账号登录处理错误:', error);

    // 增强错误日志记录
    const errorInfo = {
      message: error.message || '未知错误',
      time: new Date().toISOString(),
      account: account || '未提供账号',
      // 不记录密码，避免安全问题
      operation: '账号密码登录',
      errorType: error.name || '未知错误类型',
      stack: error.stack || '无堆栈信息'
    };

    console.error('账号登录详细错误信息:', errorInfo);

    // 判断是否为数据库错误
    if (error.message && (
      error.message.includes('database') ||
      error.message.includes('collection') ||
      error.message.includes('表') ||
      error.message.includes('创建用户')
    )) {
      console.error('可能的数据库原因:',
        '1. 数据库集合不存在，请检查是否创建了users集合',
        '2. 当前用户无数据库操作权限',
        '3. 数据格式不符合集合要求',
        '4. 云环境配额已满'
      );
    }

    throw error; // 向上传递错误
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext() || {};
    const openid = wxContext.OPENID || '';
    const resolvedEnv = resolveEnvId(wxContext)
    const inLocalDebug = isLocalDebugEnv(wxContext)

    if (inLocalDebug) {
      cloud.init()
    } else {
      cloud.init({ env: resolvedEnv })
    }

    const app = cloudbase.init({ env: resolvedEnv })

    console.log('event', event);

    // 安全地访问属性，避免undefined错误
    const eventData = event.data || {};
    const eventAction = event.action || '';
    console.log('event.action', eventAction);
    console.log('event.data', eventData);
    console.log('openid', openid);
    console.log('resolvedEnv', resolvedEnv)
    console.log('inLocalDebug', inLocalDebug)

    // 获取数据模型
    const usersApi = createUsersApi(app);
    console.log('usersApi source', usersApi.source);

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
        console.log('查询优先级：1._id > 2.account > 3._openid');        // 尝试查询所有可能的用户
        const allUserResults = [];
        let queryErrors = [];

        // 依次尝试每个条件
        for (const condition of whereConditions) {
          try {
            console.log('尝试查询条件:', JSON.stringify(condition));
            // 记录查询开始时间，用于性能分析
            const queryStartTime = Date.now();

            const { data } = await usersApi.list({
              filter: {
                where: condition
              },
              getCount: true
            });

            const queryTime = Date.now() - queryStartTime;
            console.log(`查询耗时 ${queryTime}ms, 条件:`, JSON.stringify(condition));

            // 检查查询是否过慢（超过500ms）
            if (queryTime > 500) {
              console.warn(`查询性能警告: 查询耗时${queryTime}ms，可能需要优化索引`);
            }

            if (data && data.records && data.records.length > 0) {
              console.log(`查询成功，找到 ${data.records.length} 条记录`);
              allUserResults.push(...data.records);
            } else {
              console.log('查询条件未找到匹配记录:', JSON.stringify(condition));
            }
          } catch (err) {
            console.error('查询条件执行错误:', err, condition);
            // 记录更详细的错误信息，以便后续分析
            queryErrors.push({
              condition: JSON.stringify(condition),
              error: err.message || '未知错误',
              time: new Date().toISOString()
            });

            // 判断是否为关键错误
            if (err.message && (
              err.message.includes('collection not exists') ||
              err.message.includes('database') ||
              err.message.includes('permission denied'))) {
              console.error('严重数据库错误:', err.message);
            } else {
              console.warn('非严重查询错误:', err.message);
            }
            // 继续尝试下一个条件
          }
        }

        // 如果所有查询都失败，且至少有一个关键条件失败，提供更详细的错误信息
        if (queryErrors.length === whereConditions.length && whereConditions.length > 0) {
          console.error('所有查询条件均失败:', queryErrors);
          // 尝试检查数据库状态
          try {
            const collectionStatus = await usersApi.count();
            console.log('users集合记录总数:', collectionStatus);
          } catch (dbError) {
            console.error('检查数据库状态失败:', dbError.message);
            if (dbError.message && dbError.message.includes('collection not exists')) {
              throw new Error('获取用户失败: users集合不存在，请检查数据库配置');
            }
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
          // 未找到用户时，尝试按当前 openid 静默建档，避免 users 集合长期为空
          if (!openid) {
            return {
              success: false,
              message: '未找到用户资料'
            };
          }

          const createPayload = {
            _openid: openid,
            account: userIdentifier.account || openid,
            password: '123456',
            nickname: '微信用户',
            avatar_url: '',
            nickName: '微信用户',
            avatarUrl: '',
            phone: '13800000000',
            color_theme: '天空蓝',
            theme_setting: 'dark',
            createBy: openid,
            updateBy: openid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            last_login_time: Date.now()
          };

          const createResult = await usersApi.create({ data: createPayload });
          const createdId = createResult && (createResult.id || (createResult.data && (createResult.data.id || createResult.data._id)));

          if (!createdId) {
            return {
              success: false,
              message: '未找到用户资料，且自动建档失败'
            };
          }

          const { data: createdUser } = await usersApi.get({
            filter: {
              where: {
                _id: {
                  $eq: createdId
                }
              }
            }
          });

          return {
            success: true,
            userInfo: normalizeSingleUser(createdUser) || {
              _id: createdId,
              _openid: openid,
              account: createPayload.account,
              nickname: createPayload.nickname,
              avatar_url: createPayload.avatar_url,
              nickName: createPayload.nickName,
              avatarUrl: createPayload.avatarUrl
            },
            autoCreated: true,
            message: '未找到用户资料，已自动建档'
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
      console.log('账号密码登录请求:', eventData); try {
        // 账号密码登录逻辑
        return await loginWithAccount(usersApi, eventData, openid);
      } catch (error) {
        console.error('账号密码登录失败:', error);

        // 增强错误报告
        let errorReason = '系统繁忙，请稍后再试';
        let errorCode = 'GENERAL_ERROR';

        // 根据错误消息提供更友好的错误提示
        if (error.message) {
          if (error.message.includes('创建用户失败')) {
            errorReason = '新用户注册失败，请检查数据库配置';
            errorCode = 'USER_CREATION_FAILED';
          } else if (error.message.includes('密码错误')) {
            errorReason = '密码错误，请重新输入';
            errorCode = 'WRONG_PASSWORD';
          } else if (error.message.includes('database') || error.message.includes('collection')) {
            errorReason = '数据库访问异常，请联系管理员检查云开发配置';
            errorCode = 'DB_ERROR';
          }
        }

        // 记录详细失败原因到日志
        console.error(`登录失败(${errorCode}):`, {
          reason: errorReason,
          originalError: error.message,
          account: eventData.account,
          time: new Date().toISOString()
        });

        return {
          success: false,
          message: errorReason,
          errorCode: errorCode,
          errorDetail: error.message || '未知错误'
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
      const { data } = await usersApi.list({
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
        const createResult = await usersApi.create({
          data: {
            _openid: openid,
            account: openid, // 使用openid作为账号
            password: '123456', // 初始默认密码
            nickname: '微信用户',
            avatar_url: '',
            phone: '13800000000', // 设置一个默认电话号码格式
            color_theme: '天空蓝',
            theme_setting: 'dark',
            createdAt: Date.now(), // 使用时间戳
            updatedAt: Date.now(), // 使用时间戳
            last_login_time: Date.now() // 使用时间戳
          }
        });

        console.log('创建新用户结果:', createResult);

        // 安全检查创建结果
        if (!createResult || !createResult.id) {
          throw new Error('创建用户失败');
        }

        // 获取新创建的用户
        const { data: newUserData } = await usersApi.get({
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
          userInfo: normalizeSingleUser(newUserData) || {
            _id: createResult.id,
            _openid: openid,
            account: openid,
            nickname: '微信用户',
            avatar_url: '',
            nickName: '微信用户',
            avatarUrl: ''
          },
          isNewUser: true
        };
      } else {
        // 更新登录时间
        await usersApi.update({
          data: {
            last_login_time: Date.now(),
            updatedAt: Date.now()
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
      // 增强错误日志记录
      console.error('数据库操作失败:', error);

      // 记录更详细的错误信息
      let errorDetails = '未知错误';
      if (error instanceof Error) {
        errorDetails = {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code || 'UNKNOWN_ERROR'
        };
        console.error('详细错误信息:', errorDetails);
      }

      // 尝试获取数据库连接状态
      try {
        const dbStatus = app.database().serverStatus ? '连接正常' : '连接异常';
        console.log('数据库连接状态:', dbStatus);
      } catch (dbError) {
        console.error('检查数据库状态时出错:', dbError);
      }

      return {
        success: false,
        openid: openid,
        appid: wxContext.APPID || '',
        unionid: wxContext.UNIONID || '',
        error: error.message || error.toString(),
        errorDetails: errorDetails
      };
    }
  } catch (globalError) {
    // 全局错误处理
    console.error('云函数全局错误:', globalError);

    // 增强错误报告
    let errorReason = '系统繁忙，请稍后再试';
    let errorCode = 'GENERAL_ERROR';

    // 根据错误消息提供更友好的错误提示
    if (globalError.message) {
      if (globalError.message.includes('创建用户失败')) {
        errorReason = '新用户注册失败，请检查数据库配置';
        errorCode = 'USER_CREATION_FAILED';
      } else if (globalError.message.includes('密码错误')) {
        errorReason = '密码错误，请重新输入';
        errorCode = 'WRONG_PASSWORD';
      } else if (globalError.message.includes('数据库') || globalError.message.includes('collection')) {
        errorReason = '数据库访问异常，请联系管理员检查云开发配置';
        errorCode = 'DB_ERROR';
      } else if (globalError.message.includes('permission denied')) {
        errorReason = '数据库权限不足，请检查权限配置';
        errorCode = 'PERMISSION_ERROR';
      } else if (globalError.message.includes('quota')) {
        errorReason = '云环境资源配额已满，请升级配额或清理无用数据';
        errorCode = 'QUOTA_ERROR';
      }
    }

    // 记录扩展错误信息
    let errorInfo = {
      message: globalError.message || '未知错误',
      stack: globalError.stack || '无堆栈信息',
      time: new Date().toISOString(),
      type: globalError.name || '未知错误类型',
      errorCode: errorCode,
      friendlyMessage: errorReason
    };

    // 检查是否为数据库连接错误
    if (globalError.message && globalError.message.includes('database')) {
      console.error('可能是数据库连接错误，请检查云环境配置和数据库权限');
      errorInfo.possibleCause = '数据库连接或权限问题';

      // 数据库操作错误的问题排查指南
      console.error('数据库问题排查指南:',
        '1. 检查云环境ID是否正确',
        '2. 检查是否在云开发控制台创建了users集合',
        '3. 查看数据库权限是否配置为"所有用户可读写"或添加了相应API的权限',
        '4. 检查云函数和数据库是否在同一环境',
        '5. 检查云环境的数据库配额是否已满'
      );
    }

    // 记录详细环境信息以便调试
    try {
      const env = process.env.TCB_ENV || process.env.WX_CLOUD_ENV || cloud.DYNAMIC_CURRENT_ENV || '未知环境';
      console.log('当前云环境:', env);
      errorInfo.environment = env;

      // 尝试记录更多环境信息
      errorInfo.context = {
        time: new Date().toLocaleString('zh-CN'),
        runtime: process.version,
        env: env
      };
    } catch (envError) {
      console.error('获取环境信息失败:', envError);
    }

    console.error('完整错误信息:', errorInfo);

    // 对前端显示友好的错误消息
    return {
      success: false,
      message: errorReason,
      code: errorCode,
      errorDetails: errorInfo,
      debug: true // 标记为调试信息，方便前端判断是否显示详细错误
    };
  }
}