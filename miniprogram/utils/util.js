const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 获取应用日志内容
 * @param {number} maxLines 最大行数，默认为1000
 * @param {Object} options 可选参数：level（日志级别）, keyword（搜索关键词）, date（日志日期，格式YYYYMMDD）
 * @returns {Promise<string>} 日志内容
 */
const getAppLogs = function (maxLines = 1000, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // 获取日志记录器的单例实例
      const { logger } = require('./logger');

      // 如果没有指定日期，使用今天的日期
      const targetDate = options.date ? options.date : formatDateYYYYMMDD(new Date());
      const targetLevel = options.level ? options.level.toUpperCase() : null;
      const keyword = options.keyword ? options.keyword.toLowerCase() : null;

      // 首先检查内存中的日志
      if (logger && logger.logs && logger.logs.length > 0) {
        // 从内存中获取日志
        let memoryLogs = logger.getAllLogs();

        // 应用日志级别过滤
        if (targetLevel) {
          memoryLogs = memoryLogs.filter(log => log.includes(`[${targetLevel}]`));
        }

        // 应用关键词搜索
        if (keyword) {
          memoryLogs = memoryLogs.filter(log => log.toLowerCase().includes(keyword));
        }

        // 限制行数
        const limitedLogs = memoryLogs.length > maxLines ?
          memoryLogs.slice(memoryLogs.length - maxLines) : memoryLogs;

        if (limitedLogs.length > 0) {
          return resolve(limitedLogs.join('\n'));
        }
      }

      // 如果内存中没有找到符合条件的日志，尝试从文件读取
      const fs = wx.getFileSystemManager();

      // 检查USER_DATA_PATH是否有效
      const userDataPath = wx.env.USER_DATA_PATH;
      if (!userDataPath || typeof userDataPath !== 'string' || userDataPath.startsWith('http://usr/')) {
        return resolve('当前在开发环境中，仅显示内存中的日志');
      }

      // 获取目标日志文件路径
      const year = targetDate.substring(0, 4);
      const month = targetDate.substring(4, 6);
      const day = targetDate.substring(6, 8);

      const logPath = `${userDataPath}/logs/app-${targetDate}.log`;

      // 检查日志文件是否存在
      try {
        fs.accessSync(logPath);

        // 读取日志文件
        fs.readFile({
          filePath: logPath,
          encoding: 'utf8',
          success: (res) => {
            // 将文件内容拆分为行数组
            let lines = res.data.split('\n');

            // 应用日志级别过滤
            if (targetLevel) {
              lines = lines.filter(line => line.includes(`[${targetLevel}]`));
            }

            // 应用关键词搜索
            if (keyword) {
              lines = lines.filter(line => line.toLowerCase().includes(keyword));
            }

            // 限制行数
            const limitedLines = lines.length > maxLines ?
              lines.slice(lines.length - maxLines) : lines;

            resolve(limitedLines.join('\n'));
          },
          fail: (err) => {
            console.error('读取日志文件失败:', err);
            // 如果文件读取失败但内存中有日志，则返回内存中的日志
            if (logger && logger.logs && logger.logs.length > 0) {
              let memoryLogs = logger.getAllLogs();

              // 应用日志级别过滤
              if (targetLevel) {
                memoryLogs = memoryLogs.filter(log => log.includes(`[${targetLevel}]`));
              }

              // 应用关键词搜索
              if (keyword) {
                memoryLogs = memoryLogs.filter(log => log.toLowerCase().includes(keyword));
              }

              return resolve('【仅内存日志】\n' + memoryLogs.join('\n'));
            }
            reject(err);
          }
        });
      } catch (e) {
        // 日志文件不存在，但如果内存中有日志，则返回内存中的日志
        if (logger && logger.logs && logger.logs.length > 0) {
          let memoryLogs = logger.getAllLogs();

          // 应用日志级别过滤
          if (targetLevel) {
            memoryLogs = memoryLogs.filter(log => log.includes(`[${targetLevel}]`));
          }

          // 应用关键词搜索
          if (keyword) {
            memoryLogs = memoryLogs.filter(log => log.toLowerCase().includes(keyword));
          }

          return resolve('【仅内存日志】\n' + memoryLogs.join('\n'));
        }
        reject(new Error('日志文件不存在且内存中无日志'));
      }
    } catch (err) {
      console.error('获取日志过程中发生错误:', err);
      reject(err);
    }
  });
};

/**
 * 格式化日期为YYYYMMDD格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
const formatDateYYYYMMDD = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * 导出日志到用户可以分享的临时文件
 * @returns {Promise<string>} 临时文件路径
 */
const exportLogs = async function () {
  try {
    // 获取日志内容
    const logContent = await getAppLogs(10000); // 设置较大的行数限制

    // 检查USER_DATA_PATH是否有效
    const userDataPath = wx.env.USER_DATA_PATH;
    if (!userDataPath || typeof userDataPath !== 'string' || userDataPath.startsWith('http://usr/')) {
      throw new Error('无法获取有效的用户数据路径，无法导出日志文件');
    }

    // 创建临时文件
    const tempFilePath = `${userDataPath}/exported_log_${Date.now()}.txt`;
    const fs = wx.getFileSystemManager();

    // 添加设备信息和时间戳到日志顶部
    const deviceInfo = wx.getSystemInfoSync();
    const headerInfo =
      `==== 日志导出时间: ${new Date().toISOString()} ====\n` +
      `==== 系统信息: ${deviceInfo.brand} ${deviceInfo.model} ${deviceInfo.system} ====\n` +
      `==== 微信版本: ${deviceInfo.version} / 基础库: ${deviceInfo.SDKVersion} ====\n\n`;

    fs.writeFileSync(
      tempFilePath,
      headerInfo + logContent,
      'utf8'
    );

    console.info('日志已导出到临时文件', 'util.js');
    return tempFilePath;
  } catch (err) {
    console.error('导出日志失败:', err);
    throw err;
  }
};

/**
 * 获取可用的日志文件列表
 * @returns {Promise<Array>} 日志文件信息数组，包含日期、文件路径等信息
 */
const getAvailableLogFiles = function () {
  return new Promise((resolve, reject) => {
    try {
      // 检查USER_DATA_PATH是否有效
      const userDataPath = wx.env.USER_DATA_PATH;
      if (!userDataPath || typeof userDataPath !== 'string' || userDataPath.startsWith('http://usr/')) {
        resolve([]);
        return;
      }

      const logDir = `${userDataPath}/logs`;
      const fs = wx.getFileSystemManager();

      // 检查日志目录是否存在
      try {
        fs.accessSync(logDir);
      } catch (e) {
        // 日志目录不存在
        resolve([]);
        return;
      }

      // 列出所有日志文件
      fs.readdir({
        dirPath: logDir,
        success: (res) => {
          const logFiles = [];
          const fileList = res.files.filter(file => file.startsWith('app-') && file.endsWith('.log'));

          // 处理每个文件
          fileList.forEach(file => {
            // 从文件名提取日期，格式为app-YYYYMMDD.log
            const dateStr = file.substring(4, 12);
            if (dateStr && dateStr.length === 8) {
              const year = parseInt(dateStr.substring(0, 4));
              const month = parseInt(dateStr.substring(4, 6)) - 1; // 月份是0-11
              const day = parseInt(dateStr.substring(6, 8));

              const fileDate = new Date(year, month, day);

              logFiles.push({
                filename: file,
                dateString: dateStr,
                date: fileDate,
                path: `${logDir}/${file}`,
                displayDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              });
            }
          });

          // 按日期排序，最新的在前面
          logFiles.sort((a, b) => b.date - a.date);

          resolve(logFiles);
        },
        fail: (err) => {
          console.error('读取日志目录失败:', err);
          reject(err);
        }
      });
    } catch (err) {
      console.error('获取日志文件列表失败:', err);
      reject(err);
    }
  });
};

/**
 * 清理旧的日志文件
 * @param {number} daysToKeep 要保留的天数，默认为7天
 * @returns {Promise<number>} 删除的文件数量
 */
const cleanupOldLogs = function (daysToKeep = 7) {
  return new Promise((resolve, reject) => {
    try {
      const fs = wx.getFileSystemManager();
      const logDir = `${wx.env.USER_DATA_PATH}/logs`;

      // 检查日志目录是否存在
      try {
        fs.accessSync(logDir);
      } catch (e) {
        // 日志目录不存在，无需清理
        resolve(0);
        return;
      }

      // 列出所有日志文件
      fs.readdir({
        dirPath: logDir,
        success: (res) => {
          const fileList = res.files.filter(file => file.startsWith('app-') && file.endsWith('.log'));
          const now = new Date();
          let deletedCount = 0;

          // 计算要保留的最早日期
          const cutoffDate = new Date(now);
          cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

          // 处理每个文件
          fileList.forEach(file => {
            // 从文件名提取日期，格式为app-YYYYMMDD.log
            const dateStr = file.substring(4, 12);
            if (dateStr && dateStr.length === 8) {
              const year = parseInt(dateStr.substring(0, 4));
              const month = parseInt(dateStr.substring(4, 6)) - 1; // 月份是0-11
              const day = parseInt(dateStr.substring(6, 8));

              const fileDate = new Date(year, month, day);

              // 如果文件日期早于截止日期，则删除
              if (fileDate < cutoffDate) {
                try {
                  fs.unlinkSync(`${logDir}/${file}`);
                  deletedCount++;
                } catch (deleteErr) {
                  console.warn(`无法删除日志文件 ${file}:`, deleteErr);
                }
              }
            }
          });

          console.info(`已清理 ${deletedCount} 个旧日志文件`, 'util.js');
          resolve(deletedCount);
        },
        fail: (err) => {
          console.error('读取日志目录失败:', err);
          reject(err);
        }
      });
    } catch (err) {
      console.error('清理旧日志过程中发生错误:', err);
      reject(err);
    }
  });
};

module.exports = {
  formatTime,
  formatNumber,
  formatDateYYYYMMDD,
  getAppLogs,
  exportLogs,
  cleanupOldLogs,
  getAvailableLogFiles
}
