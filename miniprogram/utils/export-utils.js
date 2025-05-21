/**
 * export-utils.js
 * 导出工具函数 - 提供增强型的日志导出功能
 * 版本: 1.0.0
 * 创建日期: 2025-05-20
 * 作者: Tourism_Management开发团队
 */

// 导入基础工具函数
const util = require('./util');

/**
 * 增强型日志导出功能
 * @param {Object} options 选项参数
 * @param {string} options.format 导出格式，支持 'txt', 'json', 'html'
 * @param {string} options.date 日志日期，格式为 'YYYYMMDD'
 * @param {string} options.level 日志级别，为null时导出所有级别
 * @param {string} options.keyword 搜索关键词，为null时不过滤
 * @returns {Promise<string>} 导出文件的路径
 */
const exportLogsEnhanced = function (options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // 设置默认选项
      const format = options.format || 'txt';
      const date = options.date;
      const level = options.level;
      const keyword = options.keyword;
      const maxLines = 5000; // 导出时增加行数限制

      // 获取日志内容
      const logContent = await util.getAppLogs(maxLines, {
        date: date,
        level: level,
        keyword: keyword
      });

      // 获取设备信息，用于日志头部说明
      const deviceInfo = await getDeviceInfo();

      // 根据格式生成导出文件内容
      let exportContent = '';
      const fileExtension = format;

      switch (format) {
        case 'json':
          exportContent = formatLogsAsJSON(logContent, deviceInfo, options);
          break;
        case 'html':
          exportContent = formatLogsAsHTML(logContent, deviceInfo, options);
          break;
        case 'txt':
        default:
          exportContent = formatLogsAsText(logContent, deviceInfo, options);
          break;
      }

      // 生成导出文件名
      const timestamp = new Date().getTime();
      const fileName = `logs_${date || 'all'}_${timestamp}.${fileExtension}`;

      // 获取临时文件路径
      const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      // 写入文件
      const fs = wx.getFileSystemManager();
      fs.writeFile({
        filePath: tempFilePath,
        data: exportContent,
        encoding: 'utf8',
        success: () => {
          resolve(tempFilePath);
        },
        fail: (err) => {
          console.error('写入导出文件失败:', err);
          reject(new Error('写入导出文件失败'));
        }
      });
    } catch (err) {
      console.error('导出日志失败:', err);
      reject(err);
    }
  });
};

/**
 * 获取设备信息
 * @returns {Promise<Object>} 设备信息对象
 */
const getDeviceInfo = function () {
  return new Promise((resolve, reject) => {
    try {
      const info = {
        timestamp: new Date().toISOString(),
        appVersion: 'v1.0.0', // 应该从配置中获取
        platform: '',
        system: '',
        SDKVersion: '',
        model: '',
        brand: ''
      };

      // 获取系统信息
      wx.getSystemInfo({
        success: (res) => {
          info.platform = res.platform;
          info.system = res.system;
          info.SDKVersion = res.SDKVersion;
          info.model = res.model;
          info.brand = res.brand;
          resolve(info);
        },
        fail: (err) => {
          console.error('获取系统信息失败:', err);
          resolve(info); // 即使失败也返回部分信息
        }
      });
    } catch (err) {
      console.error('获取设备信息失败:', err);
      resolve({
        timestamp: new Date().toISOString(),
        appVersion: 'v1.0.0',
        error: '获取设备信息失败'
      });
    }
  });
};

/**
 * 将日志格式化为纯文本
 * @param {string} logContent 原始日志内容
 * @param {Object} deviceInfo 设备信息
 * @param {Object} options 导出选项
 * @returns {string} 格式化后的文本
 */
const formatLogsAsText = function (logContent, deviceInfo, options) {
  // 构建头部信息
  const header = [
    '==================================================',
    '旅游推荐小程序日志导出',
    '==================================================',
    `导出时间: ${deviceInfo.timestamp}`,
    `应用版本: ${deviceInfo.appVersion}`,
    `系统信息: ${deviceInfo.platform} ${deviceInfo.system}`,
    `设备型号: ${deviceInfo.brand} ${deviceInfo.model}`,
    `小程序基础库版本: ${deviceInfo.SDKVersion}`,
    '==================================================',
    options.level ? `日志级别: ${options.level}` : '日志级别: 全部',
    options.date ? `日志日期: ${formatDisplayDate(options.date)}` : '日志日期: 全部',
    options.keyword ? `搜索关键词: ${options.keyword}` : '',
    '==================================================',
    '注意：此日志文件包含完整原始数据，未进行任何数据脱敏处理。',
    '==================================================\n\n'
  ].join('\n');

  // 返回头部信息和日志内容
  return header + logContent;
};

/**
 * 将日志格式化为JSON
 * @param {string} logContent 原始日志内容
 * @param {Object} deviceInfo 设备信息
 * @param {Object} options 导出选项
 * @returns {string} 格式化后的JSON字符串
 */
const formatLogsAsJSON = function (logContent, deviceInfo, options) {
  // 解析日志内容为结构化数据
  const logLines = logContent.split('\n').filter(line => line.trim() !== '');
  const logEntries = [];

  let currentEntry = null;

  for (const line of logLines) {
    // 尝试匹配日志头部模式: [timestamp] [LEVEL] [source]: message
    const match = line.match(/\[(.*?)\] \[(DEBUG|INFO|WARN|ERROR)\] \[(.*?)\]: (.*)/);

    if (match) {
      // 如果匹配成功，创建新的日志条目
      if (currentEntry) {
        logEntries.push(currentEntry);
      }

      // 存储完整的原始消息内容，确保不丢失任何数据
      currentEntry = {
        timestamp: match[1],
        level: match[2],
        source: match[3],
        message: match[4],
        rawMessage: line,  // 保存完整的原始日志行
        details: [],
        rawDetails: []     // 保存完整的原始详情行
      };

      // 尝试解析消息中的JSON数据
      try {
        // 检测消息是否包含JSON结构（例如用户数据）
        const jsonStartIndex = match[4].indexOf('{');
        if (jsonStartIndex >= 0) {
          const jsonEndIndex = match[4].lastIndexOf('}');
          if (jsonEndIndex > jsonStartIndex) {
            const jsonStr = match[4].substring(jsonStartIndex, jsonEndIndex + 1);
            try {
              // 解析JSON结构并添加到条目中
              const jsonData = JSON.parse(jsonStr);
              currentEntry.jsonData = jsonData;
            } catch (jsonError) {
              // 如果解析失败，保留为原始文本
            }
          }
        }
      } catch (parseError) {
        // 解析失败，忽略错误继续处理
      }
    } else if (currentEntry) {
      // 如果不匹配，但有当前条目，则作为详细信息添加到当前条目
      currentEntry.details.push(line);
      currentEntry.rawDetails.push(line);

      // 尝试解析可能的JSON字符串
      try {
        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          try {
            const jsonData = JSON.parse(line.trim());
            // 如果成功解析为JSON，添加到解析后的数据中
            if (!currentEntry.parsedDetails) {
              currentEntry.parsedDetails = [];
            }
            currentEntry.parsedDetails.push(jsonData);
          } catch (e) {
            // 解析失败，忽略
          }
        }
      } catch (parseError) {
        // 解析失败，忽略错误继续处理
      }
    }
  }

  // 添加最后一个条目
  if (currentEntry) {
    logEntries.push(currentEntry);
  }

  // 构建完整的导出数据结构
  const exportData = {
    metadata: {
      exportTime: deviceInfo.timestamp,
      appVersion: deviceInfo.appVersion,
      system: `${deviceInfo.platform} ${deviceInfo.system}`,
      device: `${deviceInfo.brand} ${deviceInfo.model}`,
      SDKVersion: deviceInfo.SDKVersion,
      filter: {
        level: options.level || 'ALL',
        date: options.date ? formatDisplayDate(options.date) : 'ALL',
        keyword: options.keyword || null
      },
      note: "此日志文件包含完整原始数据，未进行任何数据脱敏处理"
    },
    logs: logEntries,
    rawContent: logContent // 保存完整的原始日志内容
  };

  // 返回格式化的JSON，使用2个空格缩进
  return JSON.stringify(exportData, null, 2);
};

/**
 * 将日志格式化为HTML
 * @param {string} logContent 原始日志内容
 * @param {Object} deviceInfo 设备信息
 * @param {Object} options 导出选项
 * @returns {string} 格式化后的HTML字符串
 */
const formatLogsAsHTML = function (logContent, deviceInfo, options) {
  // 解析日志内容
  const logLines = logContent.split('\n').filter(line => line.trim() !== '');

  // 生成日志HTML
  let logsHtml = '';
  let inDetailBlock = false;

  for (const line of logLines) {
    // 尝试匹配日志头部
    const match = line.match(/\[(.*?)\] \[(DEBUG|INFO|WARN|ERROR)\] \[(.*?)\]: (.*)/);

    if (match) {
      // 如果之前在详情块内，关闭它
      if (inDetailBlock) {
        logsHtml += '</pre></div>\n';
        inDetailBlock = false;
      }

      // 日志级别对应的CSS类
      const levelClass = match[2].toLowerCase();

      // 创建新的日志条目
      logsHtml += `
        <div class="log-entry ${levelClass}">
          <div class="log-header">
            <span class="timestamp">${match[1]}</span>
            <span class="level ${levelClass}">${match[2]}</span>
            <span class="source">${match[3]}</span>
          </div>
          <div class="message">${escapeHtml(match[4])}</div>
      `;

      // 开始详情块
      logsHtml += '<div class="details"><pre>';
      inDetailBlock = true;
    } else if (inDetailBlock) {
      // 添加到当前详情块
      logsHtml += escapeHtml(line) + '\n';
    }
  }

  // 关闭最后一个详情块（如果有）
  if (inDetailBlock) {
    logsHtml += '</pre></div></div>\n';
  }

  // HTML模板
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>旅游推荐小程序日志</title>
    <style>
      body {
        font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f9f9f9;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
      }
      .header {
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
        margin-bottom: 20px;
      }
      .header h1 {
        margin: 0 0 10px 0;
        color: #333;
      }
      .meta-info {
        background: #f5f5f5;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .meta-info p {
        margin: 5px 0;
      }
      .log-entry {
        margin-bottom: 15px;
        padding: 10px;
        border-radius: 4px;
        border-left: 5px solid #ddd;
        background: #f9f9f9;
      }
      .log-entry.debug {
        border-left-color: #9c73e4;
        background-color: #f8f5ff;
      }
      .log-entry.info {
        border-left-color: #28a745;
        background-color: #f1f9f1;
      }
      .log-entry.warn {
        border-left-color: #ffc107;
        background-color: #fffbf0;
      }
      .log-entry.error {
        border-left-color: #dc3545;
        background-color: #fff5f5;
      }
      .log-header {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 5px;
        font-size: 12px;
        color: #666;
      }
      .log-header span {
        margin-right: 15px;
      }
      .timestamp {
        font-family: monospace;
      }
      .level {
        font-weight: bold;
      }
      .level.debug { color: #9c73e4; }
      .level.info { color: #28a745; }
      .level.warn { color: #ffc107; }
      .level.error { color: #dc3545; }
      .source {
        font-style: italic;
      }
      .message {
        font-size: 14px;
        margin-bottom: 5px;
      }
      .details {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        margin-top: 5px;
        overflow: auto;
      }
      .details pre {
        margin: 0;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        color: #999;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>旅游推荐小程序日志</h1>
        <p>导出时间: ${deviceInfo.timestamp}</p>
      </div>
        <div class="meta-info">
        <p><strong>应用版本:</strong> ${deviceInfo.appVersion}</p>
        <p><strong>系统信息:</strong> ${deviceInfo.platform} ${deviceInfo.system}</p>
        <p><strong>设备型号:</strong> ${deviceInfo.brand} ${deviceInfo.model}</p>
        <p><strong>小程序基础库版本:</strong> ${deviceInfo.SDKVersion}</p>
        <p><strong>日志级别:</strong> ${options.level || '全部'}</p>
        <p><strong>日志日期:</strong> ${options.date ? formatDisplayDate(options.date) : '全部'}</p>
        ${options.keyword ? `<p><strong>搜索关键词:</strong> ${options.keyword}</p>` : ''}
        <p class="notice" style="color: #e74c3c; font-weight: bold;">注意：此日志文件包含完整原始数据，未进行任何数据脱敏处理。</p>
      </div>
      
      <div class="logs">
        ${logsHtml || '<p>没有符合条件的日志记录</p>'}
      </div>
      
      <div class="footer">
        <p>旅游推荐小程序 - 日志导出工具 - © 2025</p>
      </div>
    </div>
  </body>
  </html>
  `;

  return html;
};

/**
 * HTML转义，避免XSS风险
 * @param {string} text 原始文本
 * @returns {string} 转义后的安全HTML文本
 */
const escapeHtml = function (text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * 格式化YYYYMMDD格式的日期为YYYY-MM-DD格式
 * @param {string} dateString YYYYMMDD格式的日期字符串
 * @returns {string} 格式化后的日期字符串
 */
const formatDisplayDate = function (dateString) {
  if (!dateString || dateString.length !== 8) return '未知日期';

  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);

  return `${year}-${month}-${day}`;
};

/**
 * 添加日志导出提示（无脱敏）
 * 在导出日志文件时，添加相关提示说明
 * @param {string} message 原始消息
 * @returns {string} 带有提示的消息
 */
const addExportNotice = function (message) {
  return message + "\n\n注意：此日志文件包含完整原始数据，未进行任何数据脱敏处理。";
};

module.exports = {
  exportLogsEnhanced,
  formatLogsAsText,
  formatLogsAsJSON,
  formatLogsAsHTML
};