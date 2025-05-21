/**
 * @fileoverview 旅游管理微信小程序日志查看器页面逻辑
 * @version 1.0.0
 * @date 2025-05-20
 * @author Tourism_Management开发团队
 * 
 * @功能列表
 * - 查看应用日志
 * - 按日志级别过滤
 * - 搜索日志内容
 * - 分享日志文件
 */

// 获取应用实例
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */  data: {
    logs: [],          // 日志数据数组
    filteredLogs: [],  // 过滤后的日志
    isLoading: true,   // 加载状态
    searchQuery: '',   // 搜索关键词
    activeFilter: 'ALL', // 当前激活的过滤器: ALL, DEBUG, INFO, WARN, ERROR
    isDarkMode: false, // 深色模式状态
    colorTheme: '默认绿', // 主题颜色
    availableLogFiles: [], // 可用的日志文件列表
    currentLogDate: '', // 当前查看的日志日期（YYYYMMDD格式）
    showDatePicker: false // 是否显示日期选择器
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取传入的最大行数参数，默认为1000
    const maxLines = options.maxLines ? parseInt(options.maxLines) : 1000;

    // 从全局状态获取深色模式和主题颜色
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });

    // 先获取可用的日志文件
    this.loadAvailableLogFiles().then(() => {
      // 然后加载最新的日志数据
      this.loadLogs(maxLines);
    }).catch(err => {
      console.error('加载日志文件列表失败:', err);
      // 即使加载失败，也尝试加载当天的日志
      this.loadLogs(maxLines);
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 从全局状态更新深色模式和主题颜色
    this.setData({
      isDarkMode: app.globalData.darkMode,
      colorTheme: app.globalData.colorTheme
    });
  },
  /**
   * 加载可用的日志文件列表
   * @returns {Promise} 加载完成的Promise
   */
  loadAvailableLogFiles() {
    // 导入工具函数
    const utils = require('../../utils/util');

    return new Promise((resolve, reject) => {
      utils.getAvailableLogFiles()
        .then(logFiles => {
          // 保存日志文件列表
          this.setData({ availableLogFiles: logFiles });

          // 如果有日志文件，默认选择最新的日志文件
          if (logFiles.length > 0) {
            this.setData({ currentLogDate: logFiles[0].dateString });
          } else {
            // 没有日志文件，使用当前日期
            const today = new Date();
            this.setData({
              currentLogDate: utils.formatDateYYYYMMDD(today)
            });
          }

          resolve();
        })
        .catch(err => {
          console.error('获取日志文件列表失败:', err);

          // 出错时使用当前日期
          const today = new Date();
          this.setData({
            currentLogDate: utils.formatDateYYYYMMDD(today),
            availableLogFiles: []
          });

          reject(err);
        });
    });
  },

  /**
   * 加载日志数据
   * @param {number} maxLines 最大行数
   */
  loadLogs(maxLines = 1000) {
    // 显示加载状态
    this.setData({ isLoading: true });

    // 导入工具函数
    const utils = require('../../utils/util');

    // 获取当前筛选条件
    const level = this.data.activeFilter === 'ALL' ? null : this.data.activeFilter;
    const keyword = this.data.searchQuery || null;

    // 获取日志内容
    utils.getAppLogs(maxLines, {
      date: this.data.currentLogDate,
      level: level,
      keyword: keyword
    })
      .then(logContent => {
        if (!logContent) {
          // 没有日志内容
          this.setData({
            logs: [],
            filteredLogs: [],
            isLoading: false
          });
          return;
        }        // 智能解析日志，处理多行JSON
        const parsedLogs = this.intelligentParseLogContent(logContent);

        // 更新页面数据
        this.setData({
          logs: parsedLogs,
          filteredLogs: parsedLogs,
          isLoading: false
        });
      })
      .catch(err => {
        console.error('加载日志失败:', err);

        // 显示错误提示
        wx.showToast({
          title: '加载日志失败',
          icon: 'none',
          duration: 2000
        });

        // 更新页面状态
        this.setData({
          logs: [],
          filteredLogs: [],
          isLoading: false
        });
      });
  },

  /**
   * 解析日志行，提取日志级别、时间戳和内容
   * @param {string} logLine 日志行文本
   * @returns {Object} 解析后的日志对象
   */ /**
     if (startPos !== -1 && endPos !== -1 && startPos < endPos) {
       jsonText = jsonText.substring(startPos, endPos + 1);
       jsonText = this.cleanJsonString(jsonText);
       
       // 再次尝试解析
       const jsonObj = JSON.parse(jsonText);
       
       // 创建格式化的JSON字符串
       const formattedJson = this.formatJsonForDisplay(jsonObj);
       
       // 更新日志对象
       headerLog.message = formattedJson;
       headerLog.isJsonObject = true;
       headerLog.jsonParseSuccess = true;
       targetArray.push(headerLog);
       
       return true;
     }
   } catch (e2) {
     console.log('二次尝试解析JSON失败:', e2.message);
   }
   
   // 解析失败，作为普通文本添加
   headerLog.message = jsonLines.join('\n');
   headerLog.isJsonObject = false;
   headerLog.jsonParseSuccess = false;
   targetArray.push(headerLog);
   
   return false;
 }
},
 
/**
* 智能解析日志内容，将连续的JSON对象处理为单一日志条目
* @param {string} logContent 原始日志内容
* @returns {Array} 解析后的日志数组
*/
  intelligentParseLogContent(logContent) {
    // 如果日志内容为空，返回空数组
    if (!logContent) return [];

    // 将日志内容按行分割
    const lines = logContent.split('\n').filter(line => line.trim() !== '');

    // 解析后的日志数组
    const parsedLogs = [];

    // 预处理：合并常见的用户信息和登录状态等JSON对象
    // 这个预处理步骤针对特定格式的JSON对象进行识别和合并
    const preprocessedLines = this.preprocessJsonObjects(lines);

    // 输出处理的行数，方便调试
    console.log(`预处理后的行数: ${preprocessedLines.length}`);

    // 用于Json对象处理的状态变量
    let isCollectingJson = false;           // 是否正在收集JSON
    let jsonHeaderLog = null;               // JSON头部的日志对象
    let collectingJsonLines = [];           // 收集的JSON行
    let jsonBracketCount = {                // JSON括号计数（用于嵌套结构）
      curly: 0,    // {} 括号计数
      square: 0,   // [] 括号计数
      total: 0     // 总计数
    };
    let jsonStartPattern = null;            // JSON开始的模式
    let lastLogEntry = null;                // 上一条日志条目
    let errorCount = 0;                     // 错误计数，用于避免死循环

    // 处理每一行
    for (let i = 0; i < preprocessedLines.length; i++) {
      const line = preprocessedLines[i];
      const trimmedLine = line.trim();

      // 跳过空行
      if (!trimmedLine) continue;

      // 检测JSON对象的开始（更全面的检测）
      if (!isCollectingJson) {
        // 检查是否是完整的JSON对象行（独立的单行JSON对象）
        if (this.isCompleteJsonObject(trimmedLine)) {
          try {
            // 解析为完整的JSON对象行
            const logEntry = this.parseLogLine(line);
            // 尝试将消息部分格式化为JSON
            const jsonObj = JSON.parse(this.cleanJsonString(logEntry.message));
            logEntry.message = this.formatJsonForDisplay(jsonObj);
            logEntry.isJsonObject = true;

            parsedLogs.push(logEntry);
            lastLogEntry = logEntry;
            continue;
          } catch (e) {
            console.log(`完整JSON对象解析失败: ${e.message}`);
            // 解析失败，继续尝试其他方法
          }
        }

        // 扩展的JSON对象开始模式
        const jsonStartPatterns = [
          // 1. 用户信息类: "用户信息: {"、"用户资料: {"等
          { pattern: /用户(信息|数据|资料|详情|profile|info)[:：]\s*{/i, type: 'object' },
          // 2. 登录状态类: "登录状态: {"、"登录结果: {"等
          { pattern: /(登录|注册|认证)(状态|结果|response|返回)[:：]\s*{/i, type: 'object' },
          // 3. API响应类: "API响应: {"、"请求结果: {"等
          { pattern: /(api|请求|接口|云函数)(响应|结果|返回|数据)[:：]\s*{/i, type: 'object' },
          // 4. 配置数据类: "配置: {"、"设置: {"等
          { pattern: /(配置|设置|config|options)[:：]\s*{/i, type: 'object' },
          // 5. 错误信息类
          { pattern: /(错误|异常|报错|警告)(信息|详情|数据)[:：]\s*{/i, type: 'object' },
          // 6. 列表数据类
          { pattern: /(列表|数组|集合|清单)(数据|信息|详情)[:：]\s*\[/i, type: 'array' },
          // 7. 通用对象: { 或者 {" 开头，但要避免误判普通文本
          { pattern: /^\s*({|\{"|\{'|{\s*")/, type: 'object' },
          // 8. 通用数组: [ 或者 [" 开头，但要避免误判普通文本
          { pattern: /^\s*(\[|\["|\['|\[\s*")/, type: 'array' },
          // 9. 冒号加{: 如 "data: {"
          { pattern: /[:：]\s*{/, type: 'object' },
          // 10. 冒号加[: 如 "items: ["
          { pattern: /[:：]\s*\[/, type: 'array' },
          // 11. 等于号加{或[: 如 "data = {"
          { pattern: /=\s*[{\[]/, type: 'mixed' }
        ];

        // 检查是否匹配任何JSON开始模式
        let patternMatched = false;
        for (const pattern of jsonStartPatterns) {
          if (pattern.pattern.test(trimmedLine)) {
            isCollectingJson = true;
            jsonStartPattern = pattern;
            jsonHeaderLog = this.parseLogLine(line);
            collectingJsonLines = [];

            // 提取JSON部分（去除前缀说明文字）
            const jsonPart = this.extractJsonPart(trimmedLine, pattern);

            // 更新括号计数
            const bracketCounts = this.countJsonBrackets(jsonPart);
            jsonBracketCount.curly = bracketCounts.curly;
            jsonBracketCount.square = bracketCounts.square;
            jsonBracketCount.total = bracketCounts.total;

            // 如果JSON部分不为空，添加到收集器
            if (jsonPart) {
              collectingJsonLines.push(jsonPart);
            }

            patternMatched = true;
            break;
          }
        }

        // 如果没有开始收集JSON，则作为普通日志处理
        if (!patternMatched) {
          const logEntry = this.parseLogLine(line);
          parsedLogs.push(logEntry);
          lastLogEntry = logEntry;
        }

        continue;
      }

      // 已经在收集JSON过程中

      // 检查当前行是否是一个新的日志条目的开始（带有时间戳和级别的完整日志行）
      if (this.isNewLogEntry(line)) {
        // 如果括号计数为0，说明JSON已经结束，但我们没有正确处理
        if (jsonBracketCount.total === 0) {
          // 尝试解析已收集的内容
          this.tryFinalizeJsonCollection(collectingJsonLines, jsonHeaderLog, parsedLogs);

          // 重置JSON收集状态
          isCollectingJson = false;
          jsonHeaderLog = null;
          collectingJsonLines = [];
          jsonBracketCount = { curly: 0, square: 0, total: 0 };
          jsonStartPattern = null;

          // 处理这个新的日志条目
          const logEntry = this.parseLogLine(line);
          parsedLogs.push(logEntry);
          lastLogEntry = logEntry;
          continue;
        }
        // 如果括号计数不为0，但遇到了新的日志条目，说明JSON没有正确结束
        // 在这种情况下，我们也可以选择结束当前JSON的收集
        else if (errorCount > 5) { // 连续错误超过5次，强制结束收集以避免无限循环
          console.log(`强制结束JSON收集，当前括号计数: ${JSON.stringify(jsonBracketCount)}`);
          this.tryFinalizeJsonCollection(collectingJsonLines, jsonHeaderLog, parsedLogs);

          // 重置状态
          isCollectingJson = false;
          jsonHeaderLog = null;
          collectingJsonLines = [];
          jsonBracketCount = { curly: 0, square: 0, total: 0 };
          jsonStartPattern = null;
          errorCount = 0;

          // 处理这个新的日志条目
          const logEntry = this.parseLogLine(line);
          parsedLogs.push(logEntry);
          lastLogEntry = logEntry;
          continue;
        }

        // 否则增加错误计数，将当前行继续作为JSON的一部分处理
        errorCount++;
      }

      // 计算当前行的括号数量变化
      const lineBrackets = this.countJsonBrackets(trimmedLine);
      jsonBracketCount.curly += lineBrackets.curly;
      jsonBracketCount.square += lineBrackets.square;
      jsonBracketCount.total += lineBrackets.total;

      // 添加当前行到JSON收集器
      collectingJsonLines.push(trimmedLine);

      // 检查是否JSON已结束（括号计数平衡）
      if (jsonBracketCount.total === 0 &&
        ((jsonStartPattern.type === 'object' && jsonBracketCount.curly === 0) ||
          (jsonStartPattern.type === 'array' && jsonBracketCount.square === 0) ||
          (jsonStartPattern.type === 'mixed'))) {
        // 尝试解析和处理已收集的JSON
        this.tryFinalizeJsonCollection(collectingJsonLines, jsonHeaderLog, parsedLogs);

        // 重置JSON收集状态
        isCollectingJson = false;
        jsonHeaderLog = null;
        collectingJsonLines = [];
        jsonBracketCount = { curly: 0, square: 0, total: 0 };
        jsonStartPattern = null;
        errorCount = 0;
      }
    }    // 处理未完成的JSON收集（如果有）
    if (isCollectingJson && jsonHeaderLog) {
      console.log(`处理未完成的JSON收集，行数: ${collectingJsonLines.length}`);

      // 尝试从不完整的数据中构建有效的JSON
      this.tryFinalizeJsonCollection(collectingJsonLines, jsonHeaderLog, parsedLogs);
    }

    // 进行一次后处理，合并可能被错误分割的相关JSON行
    return this.postProcessJsonEntries(parsedLogs);
  },

  /**
   * 预处理JSON对象，合并明显属于同一个对象的多行
   * @param {Array} lines 原始日志行数组
   * @returns {Array} 处理后的行数组
   */
  preprocessJsonObjects(lines) {
    const result = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检测用户信息、登录状态等常见模式的开始
      if (/(用户信息|登录状态|请求结果)[:：]\s*{/.test(trimmedLine) && !trimmedLine.includes('}')) {
        // 找到了一个可能的多行JSON对象的开始
        const mergedLines = [line];
        let bracketCount = (trimmedLine.match(/{/g) || []).length - (trimmedLine.match(/}/g) || []).length;

        // 继续读取直到括号闭合
        let j = i + 1;
        while (j < lines.length && bracketCount > 0) {
          const nextLine = lines[j];
          const nextTrimmed = nextLine.trim();

          // 更新括号计数
          bracketCount += (nextTrimmed.match(/{/g) || []).length;
          bracketCount -= (nextTrimmed.match(/}/g) || []).length;

          // 只有当这一行不是一个新的独立日志行时才合并
          if (!this.isNewLogEntry(nextLine)) {
            mergedLines.push(nextLine);
            j++;
          } else {
            break;
          }
        }

        // 如果成功合并了多行，将它们作为一个整体添加
        if (mergedLines.length > 1) {
          result.push(mergedLines.join(' '));
          i = j;
          continue;
        }
      }

      // 默认情况下，保持原样
      result.push(line);
      i++;
    }

    return result;
  },

  /**
   * 判断是否是新的日志条目（通过检查时间戳和级别标记）
   * @param {string} line 日志行
   * @returns {boolean} 是否是新日志条目的开始
   */
  isNewLogEntry(line) {
    // 匹配标准日志行格式: [timestamp] [LEVEL] [source]:
    return /^\[[\d\-T:.Z]+\]\s+\[(DEBUG|INFO|WARN|ERROR)\]\s+\[.*?\]:/.test(line);
  },

  /**
   * 提取JSON部分（去除前缀说明文字）
   * @param {string} line 日志行
   * @param {object} pattern 匹配模式对象
   * @returns {string} 提取的JSON部分
   */
  extractJsonPart(line, pattern) {
    if (pattern.type === 'object') {
      // 处理对象类型
      const objectStart = line.indexOf('{');
      if (objectStart !== -1) {
        return line.substring(objectStart);
      }
    } else if (pattern.type === 'array') {
      // 处理数组类型
      const arrayStart = line.indexOf('[');
      if (arrayStart !== -1) {
        return line.substring(arrayStart);
      }
    }

    // 默认返回去除冒号前缀的内容
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      return line.substring(colonIndex + 1).trim();
    }

    return line;
  },  /**
   * 清理JSON字符串，修复常见的解析问题
   * @param {string} jsonStr JSON字符串
   * @returns {string} 清理后的JSON字符串
   */
  cleanJsonString(jsonStr) {
    try {
      // 原始的JSON串，用于对比
      const originalJsonStr = jsonStr;

      // 0. 日志调试 - 处理前的字符串
      if (jsonStr.length > 500) {
        console.log(`处理长JSON: ${jsonStr.substring(0, 30)}...${jsonStr.substring(jsonStr.length - 30)}`);
      }
      // 0.1 新增: 检测日志格式并提取实际的JSON部分
      const logFormatRegex = /^\[[\d\-T:.Z]+\]\s+\[(DEBUG|INFO|WARN|ERROR)\]\s+\[.*?\]:\s*(.*)/;
      let actualJsonStr = jsonStr;
      let prefix = '';

      const logMatch = jsonStr.match(logFormatRegex);
      if (logMatch) {
        // 这是一个日志格式的字符串，提取出后面的JSON部分
        prefix = jsonStr.substring(0, jsonStr.indexOf(logMatch[2]));
        actualJsonStr = logMatch[2];

        // 处理带有说明文字的JSON数据,例如 "TabBar列表: [...]"
        const labelledJsonRegex = /^(.*?):\s*(\{|\[)/;
        const labelledJsonMatch = actualJsonStr.match(labelledJsonRegex);
        if (labelledJsonMatch) {
          const subPrefix = labelledJsonMatch[1] + ': ';
          prefix += subPrefix;
          actualJsonStr = actualJsonStr.substring(subPrefix.length);
        }

        // 确保实际处理的字符串是有效的JSON开始
        if (!actualJsonStr.trim().startsWith('{') && !actualJsonStr.trim().startsWith('[')) {
          // 尝试查找字符串中的JSON对象或数组起始位置
          const objStartPos = actualJsonStr.indexOf('{');
          const arrStartPos = actualJsonStr.indexOf('[');

          if (objStartPos !== -1 || arrStartPos !== -1) {
            const jsonStartPos = Math.min(
              objStartPos !== -1 ? objStartPos : Infinity,
              arrStartPos !== -1 ? arrStartPos : Infinity
            );

            if (jsonStartPos !== Infinity) {
              prefix += actualJsonStr.substring(0, jsonStartPos);
              actualJsonStr = actualJsonStr.substring(jsonStartPos);
            }
          }
        }
      }      // 设置处理对象为实际JSON部分
      jsonStr = actualJsonStr;

      // 检查是否是单个对象但末尾有逗号
      if (jsonStr.trim().startsWith('{') && jsonStr.trim().endsWith(',')) {
        jsonStr = jsonStr.trim().slice(0, -1);
      }

      // 1. 修复尾部多余的逗号，更详细的模式，这个需要放在属性名引号处理前面
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
      // 1.1 处理末尾的单独逗号（没有后续括号的情况）
      jsonStr = jsonStr.replace(/,\s*$/g, '');

      // 2. 确保所有属性名都有引号 - 更严格的匹配
      jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_\-\.\+]+)(\s*:)/g, '$1"$2"$3');

      // 2.1 处理可能被漏掉的属性名（行首的）
      jsonStr = jsonStr.replace(/^(\s*)([a-zA-Z0-9_\-\.\+]+)(\s*:)/g, '$1"$2"$3');

      // 3. 处理值为正负数的特殊情况
      // 3.1 处理键值对中的+号（JSON不允许）
      jsonStr = jsonStr.replace(/:\s*\+(\d+)/g, ': $1');

      // 3.2 处理科学计数法中的问题
      jsonStr = jsonStr.replace(/([0-9])(\s*[eE]\s*)([+-]?)(\s*)([0-9])/g, '$1e$3$5');

      // 4. 处理不完整的键值对（如 "key": ,）
      jsonStr = jsonStr.replace(/"([^"]+)"(\s*):(\s*),/g, '"$1": null,');

      // 5. 处理空对象和空数组的格式，确保格式正确
      jsonStr = jsonStr.replace(/{\s*}/g, '{}');
      jsonStr = jsonStr.replace(/\[\s*\]/g, '[]');

      // 6. 处理布尔值和null值，确保它们小写
      jsonStr = jsonStr.replace(/:\s*TRUE\b/gi, ': true');
      jsonStr = jsonStr.replace(/:\s*FALSE\b/gi, ': false');
      jsonStr = jsonStr.replace(/:\s*NULL\b/gi, ': null');

      // 7. 处理字符串中的转义问题
      let fixed = '';
      let inString = false;
      let escaping = false;

      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        if (escaping) {
          // 处理转义字符
          // 确保反斜杠后面的引号被正确处理
          if (char === "'" || char === '"' || char === '\\' ||
            char === 'n' || char === 'r' || char === 't' ||
            char === 'b' || char === 'f') {
            fixed += char;
          } else {
            // 对于其他字符，需要添加额外的转义
            fixed += '\\' + char;
          }
          escaping = false;
        } else if (char === '\\') {
          fixed += char;
          escaping = true;
        } else if (char === '"') {
          inString = !inString;
          fixed += char;
        } else if (char === "'" && !inString) {
          // 处理JSON外的单引号，换成双引号
          fixed += '"';
        } else {
          fixed += char;
        }
      }

      // 将前缀和修复后的JSON组合起来
      const finalStr = prefix ? prefix + fixed : fixed;      // 8. 如果是日志格式，通常不需要整体作为JSON解析，但我们可以尝试提取其中的JSON部分
      if (logMatch) {
        // 检查提取的JSON部分是否真的是有效的JSON
        if (fixed.startsWith('{') || fixed.startsWith('[')) {
          try {
            JSON.parse(fixed);
            // 如果JSON部分有效，返回完整的修复后字符串
            return finalStr;
          } catch (e) {
            // 如果JSON部分无效，记录错误但仍返回完整字符串
            console.log(`日志中的JSON部分解析失败: ${e.message}, 但仍将返回修复后的字符串`);
            return finalStr;
          }
        } else {
          // 如果不是以JSON对象/数组开头，直接返回修复后的字符串
          return finalStr;
        }
      }

      // 如果不是日志格式,则尝试解析一次,验证修复是否有效
      try {
        JSON.parse(fixed);
        // 如果成功解析，返回修复后的JSON
        return finalStr;
      } catch (e) {
        // 检查错误是否在日期时间戳的方括号处
        if (e.message.includes('position') && fixed.indexOf('[20') === 0) {
          // 可能是将时间戳的方括号误认为JSON数组，返回原始字符串
          console.log('可能将时间戳误认为JSON数组，返回原始修复后字符串');
          return finalStr;
        }

        // 如果仍然解析失败，记录更详细的错误信息
        console.error(`JSON清理后仍然失败: ${e.message}`, {
          原始: originalJsonStr,
          清理后: fixed,
          错误位置: e.message.match(/position (\d+)/)?.[1]
        });

        // 如果错误信息包含位置，尝试显示错误附近的内容
        const errorPos = e.message.match(/position (\d+)/);
        if (errorPos && errorPos[1]) {
          const pos = parseInt(errorPos[1]);
          const start = Math.max(0, pos - 10);
          const end = Math.min(fixed.length, pos + 10);
          console.error(`错误附近内容: ${fixed.substring(start, pos)}[此处]${fixed.substring(pos, end)}`);
        }

        // 返回处理后的字符串，即使它可能无效
        return finalStr;
      }
    } catch (e) {
      console.error("清理JSON字符串时出错:", e);
      return jsonStr; // 返回原始字符串
    }
  },

  /**
   * 检查字符串是否是完整的JSON对象（单行）
   * @param {string} line 日志行
   * @returns {boolean} 是否是完整JSON对象
   */
  isCompleteJsonObject(line) {
    // 检查是否是{...}或[...]格式
    if ((line.startsWith('{') && line.endsWith('}')) ||
      (line.startsWith('[') && line.endsWith(']'))) {
      try {
        JSON.parse(line);
        return true;
      } catch (e) {
        // 解析失败，不是有效的JSON
        return false;
      }
    }
    return false;
  },
  /**
   * 对解析后的日志条目进行后处理，合并相关的JSON条目
   * @param {Array} logs 解析后的日志数组
   * @returns {Array} 处理后的日志数组
   */
  postProcessJsonEntries(logs) {
    // 如果日志少于2条，不需要处理
    if (!logs || logs.length < 2) {
      return logs;
    }

    try {
      const result = [];
      let currentItem = null;
      let isPreviousItemJson = false;
      let collectedJsonLines = [];
      let isCollectingMultilineJson = false;

      // 遍历所有日志条目
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        // 如果当前条目是未完成的JSON（比如开始部分），标记开始收集模式
        if (log.isJsonObject && this.containsUnclosedJsonStart(log.message)) {
          isCollectingMultilineJson = true;
          collectedJsonLines = [log.message];
          currentItem = log;
          isPreviousItemJson = true;
          continue;
        }

        // 处理多行JSON的情况
        if (isCollectingMultilineJson) {
          // 如果当前行没有时间戳和级别，可能是JSON对象的一部分
          if (!log.timestamp && !log.level && this.isPartOfJsonObject(log.message)) {
            collectedJsonLines.push(log.message);
            continue;
          }

          // 如果遇到了新的完整日志行，尝试合并之前收集的JSON内容
          if (log.timestamp && log.level) {
            // 尝试构造一个完整的JSON对象
            const jsonObj = this.tryConstructJsonFromLines(collectedJsonLines);

            if (jsonObj) {
              // 成功构造JSON，更新之前的日志项
              currentItem.message = this.formatJsonForDisplay(jsonObj);
              currentItem.isJsonObject = true;
              result.push(currentItem);
            } else {
              // 无法构造完整JSON，保留原始条目
              result.push(currentItem);
              // 添加收集到但未处理的行
              for (let j = 1; j < collectedJsonLines.length; j++) {
                result.push({
                  timestamp: '',
                  level: '',
                  source: '',
                  message: collectedJsonLines[j],
                  isJsonObject: false,
                  fullText: collectedJsonLines[j],
                  levelClass: 'continue-log'
                });
              }
            }

            // 重置收集状态
            isCollectingMultilineJson = false;
            collectedJsonLines = [];
            currentItem = log;
            isPreviousItemJson = log.isJsonObject;
            result.push(log);
          }
        } else {
          // 普通模式 - 不是多行JSON收集
          if (!log.timestamp && !log.level && isPreviousItemJson) {
            // 可能是上一个JSON对象的延续，但我们没有检测到未闭合的JSON
            // 这种情况一般不做特殊处理，直接添加
            result.push(log);
          } else {
            result.push(log);
            currentItem = log;
            isPreviousItemJson = log.isJsonObject;
          }
        }
      }

      // 处理文件末尾可能未完成的JSON收集
      if (isCollectingMultilineJson && collectedJsonLines.length > 0) {
        const jsonObj = this.tryConstructJsonFromLines(collectedJsonLines);

        if (jsonObj) {
          // 成功构造JSON，更新之前的日志项
          currentItem.message = this.formatJsonForDisplay(jsonObj);
          currentItem.isJsonObject = true;
          // 如果currentItem不在result中，添加它
          if (result.indexOf(currentItem) === -1) {
            result.push(currentItem);
          }
        } else {
          // 无法构造完整JSON，保留原始条目
          if (result.indexOf(currentItem) === -1) {
            result.push(currentItem);
          }
          // 添加收集到但未处理的行
          for (let j = 1; j < collectedJsonLines.length; j++) {
            result.push({
              timestamp: '',
              level: '',
              source: '',
              message: collectedJsonLines[j],
              isJsonObject: false,
              fullText: collectedJsonLines[j],
              levelClass: 'continue-log'
            });
          }
        }
      }

      return result;
    } catch (e) {
      console.error('后处理JSON条目时出错:', e);
      // 出错时返回原始数组
      return logs;
    }
  },
  /**
   * 格式化JSON对象用于显示，确保在微信小程序环境中正确换行和缩进
   * @param {Object|Array} jsonObj JSON对象或数组
   * @returns {string} 格式化后的字符串，适合在微信小程序中显示
   */
  formatJsonForDisplay(jsonObj) {
    if (!jsonObj) return '';

    // 使用JSON.stringify生成基本的格式化字符串
    const jsonStr = JSON.stringify(jsonObj, null, 2);

    // 无需进一步处理，标准JSON.stringify已提供良好的格式
    // 日志查看器使用<pre>标签显示，会保留所有空白和缩进
    return jsonStr;
  },
  /**
   * 统计字符串中JSON括号的差值，考虑字符串内的括号
   * @param {string} text 要检查的文本
   * @returns {Object} 括号差值统计，包括{}和[]的单独统计
   */
  countJsonBrackets(text) {
    let count = {
      curly: 0,    // {} 括号计数
      square: 0,    // [] 括号计数
      total: 0     // 总计数
    };

    let inString = false;  // 是否在字符串内
    let escaping = false;  // 是否正在转义

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // 处理字符串转义
      if (escaping) {
        escaping = false;
        continue;
      }

      if (char === '\\') {
        escaping = true;
        continue;
      }

      // 处理字符串内容
      if (char === '"') {
        inString = !inString;
        continue;
      }

      // 只有不在字符串内时，才统计括号
      if (!inString) {
        if (char === '{') {
          count.curly++;
          count.total++;
        } else if (char === '}') {
          count.curly--;
          count.total--;
        } else if (char === '[') {
          count.square++;
          count.total++;
        } else if (char === ']') {
          count.square--;
          count.total--;
        }
      }
    }

    return count;
  },

  /**
   * 检查字符串是否包含未闭合的JSON开始符号
   * @param {string} text 要检查的文本
   * @returns {boolean} 是否包含未闭合的JSON
   */
  containsUnclosedJsonStart(text) {
    // 先检查是否包含完整日志头部，如果是，提取消息部分
    const logHeaderRegex = /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[(DEBUG|INFO|WARN|ERROR)\] \[.*?\]: /;
    const messagePart = text.split(logHeaderRegex)[1] || text;

    // 检查是否包含JSON相关符号
    const hasJsonSymbols = /[{}\[\]]/.test(messagePart);

    // 如果没有JSON符号，直接返回false
    if (!hasJsonSymbols) {
      return false;
    }

    // 检查括号是否平衡
    const counts = this.countJsonBrackets(messagePart);

    // 如果任何一种括号不平衡，或者总计数不为0，说明有未闭合的JSON
    return counts.curly !== 0 || counts.square !== 0 || counts.total !== 0;
  },
  /**
   * 检测是否为对象/数组的一部分（比如一个键值对）
   * @param {string} line 当前行文本
   * @returns {boolean} 是否是对象/数组的部分
   */
  isPartOfJsonObject(line) {
    // 去除前后空格
    const trimmed = line.trim();

    // 检查空行
    if (!trimmed) return false;

    // 检查是否是键值对格式（"key": value 或 key: value）
    if (/^"[\w\s\-\.]+"\s*:/.test(trimmed) || /^[\w\-\.]+\s*:/.test(trimmed)) {
      return true;
    }

    // 检查是否是对象/数组的结束符
    if (/^[}\]],?$/.test(trimmed)) {
      return true;
    }

    // 检查是否是对象/数组的开始符
    if (/^[{\[]$/.test(trimmed)) {
      return true;
    }

    // 检查是否是数组元素
    if (trimmed.startsWith('"') && trimmed.endsWith('",') ||
      trimmed.startsWith('{') && trimmed.endsWith('},') ||
      trimmed.startsWith('[') && trimmed.endsWith('],')) {
      return true;
    }

    // 检查常见JSON值格式
    if (/^(true|false|null|\d+|\d+\.\d+),?$/.test(trimmed)) {
      return true;
    }

    // 检查是否包含JSON结构的标志
    if (trimmed.includes('{') || trimmed.includes('}') ||
      trimmed.includes('[') || trimmed.includes(']') ||
      trimmed.includes('":"') || trimmed.includes('": ')) {
      return true;
    }

    return false;
  },  /**
   * 尝试从多行文本构造JSON对象
   * @param {Array<string>} lines JSON对象的各行文本
   * @returns {Object|null} 解析出的JSON对象，解析失败返回null
   */
  tryConstructJsonFromLines(lines) {
    try {
      // 合并行并清理常见问题
      let jsonText = lines.join(' ').trim();

      // 尝试找出JSON的实际开始和结束位置
      let startPos = jsonText.indexOf('{');
      let endPos = jsonText.lastIndexOf('}');

      // 检查是否是数组
      if (startPos === -1 || startPos > jsonText.indexOf('[')) {
        startPos = jsonText.indexOf('[');
        endPos = jsonText.lastIndexOf(']');
      }

      // 如果找到了有效的JSON边界
      if (startPos !== -1 && endPos !== -1 && startPos < endPos) {
        // 提取可能的JSON部分
        jsonText = jsonText.substring(startPos, endPos + 1);
      }

      // 使用增强版的清理函数
      jsonText = this.cleanJsonString(jsonText);

      // 尝试解析
      const jsonObj = JSON.parse(jsonText);
      return jsonObj;
    } catch (e) {
      console.error('构造JSON失败:', e);

      // 尝试更积极的修复方法
      try {
        // 判断是否有带冒号前缀的描述
        const colonIndex = lines[0].indexOf(':');
        if (colonIndex !== -1) {
          // 只保留冒号后面的部分
          let jsonText = lines[0].substring(colonIndex + 1);
          for (let i = 1; i < lines.length; i++) {
            jsonText += ' ' + lines[i];
          }

          jsonText = jsonText.trim();
          // 查找JSON对象的实际开始和结束位置
          const startPos = jsonText.indexOf('{');
          const endPos = jsonText.lastIndexOf('}');

          if (startPos !== -1 && endPos !== -1 && startPos < endPos) {
            // 提取JSON部分并清理
            jsonText = jsonText.substring(startPos, endPos + 1);
            jsonText = this.cleanJsonString(jsonText);

            // 再次尝试解析
            const jsonObj = JSON.parse(jsonText);
            return jsonObj;
          }
        }
      } catch (e2) {
        console.error('二次尝试构造JSON失败:', e2);
      }

      return null;
    }
  },  /**
   * 尝试从一段文本中提取完整的JSON对象
   * @param {string} text 可能包含JSON的文本
   * @returns {Object|null} 提取的JSON对象或null
   */
  tryExtractJsonParts(text) {
    try {
      // 0. 记录原始文本，用于调试
      const originalText = text;

      // 1. 先尝试找到冒号前缀的JSON，如 "用户信息: {JSON}" 格式
      const prefixedJsonPatterns = [
        /([\u4e00-\u9fa5a-zA-Z0-9_\-\s]+)[:：]\s*({[\s\S]*})/,  // 对象格式
        /([\u4e00-\u9fa5a-zA-Z0-9_\-\s]+)[:：]\s*(\[[\s\S]*\])/ // 数组格式
      ];

      for (const pattern of prefixedJsonPatterns) {
        const prefixMatch = text.match(pattern);
        if (prefixMatch && prefixMatch[2]) {
          try {
            // 提取JSON部分并清理
            let jsonPart = prefixMatch[2];
            jsonPart = this.cleanJsonString(jsonPart);

            const jsonObj = JSON.parse(jsonPart);
            return {
              prefix: prefixMatch[1].trim(),
              json: jsonObj,
              fullText: text,
              method: "前缀提取"
            };
          } catch (e) {
            console.log(`前缀提取JSON失败: ${e.message}`);
            // 继续尝试其他方法
          }
        }
      }

      // 2. 尝试在文本中查找第一个{和最后一个}之间的内容作为JSON对象
      let objStartPos = text.indexOf('{');
      let objEndPos = text.lastIndexOf('}');

      if (objStartPos !== -1 && objEndPos !== -1 && objStartPos < objEndPos) {
        try {
          let jsonText = text.substring(objStartPos, objEndPos + 1);
          jsonText = this.cleanJsonString(jsonText);

          const jsonObj = JSON.parse(jsonText);
          const prefix = text.substring(0, objStartPos).trim();

          return {
            prefix: prefix,
            json: jsonObj,
            fullText: text,
            method: "边界提取-对象"
          };
        } catch (e) {
          console.log(`边界提取JSON对象失败: ${e.message}`);
        }
      }

      // 3. 尝试在文本中查找第一个[和最后一个]之间的内容作为JSON数组
      let arrStartPos = text.indexOf('[');
      let arrEndPos = text.lastIndexOf(']');

      if (arrStartPos !== -1 && arrEndPos !== -1 && arrStartPos < arrEndPos) {
        try {
          let jsonText = text.substring(arrStartPos, arrEndPos + 1);
          jsonText = this.cleanJsonString(jsonText);

          const jsonObj = JSON.parse(jsonText);
          const prefix = text.substring(0, arrStartPos).trim();

          return {
            prefix: prefix,
            json: jsonObj,
            fullText: text,
            method: "边界提取-数组"
          };
        } catch (e) {
          console.log(`边界提取JSON数组失败: ${e.message}`);
        }
      }

      // 4. 尝试解析没有任何前缀的纯JSON文本
      if ((text.trim().startsWith('{') && text.trim().endsWith('}')) ||
        (text.trim().startsWith('[') && text.trim().endsWith(']'))) {
        try {
          const trimmed = text.trim();
          const jsonText = this.cleanJsonString(trimmed);
          const jsonObj = JSON.parse(jsonText);

          return {
            prefix: '',
            json: jsonObj,
            fullText: text,
            method: "纯JSON"
          };
        } catch (e) {
          console.log(`纯JSON解析失败: ${e.message}`);
        }
      }

      // 5. 尝试扫描并提取文本中可能存在的简单JSON结构
      const simplePatterns = [
        /({[^{}\[\]]*})/,  // 简单对象，不包含嵌套
        /(\[[^\[\]{}]*\])/ // 简单数组，不包含嵌套
      ];

      for (const pattern of simplePatterns) {
        const matches = text.match(pattern);
        if (matches && matches[1]) {
          try {
            const jsonText = this.cleanJsonString(matches[1]);
            const jsonObj = JSON.parse(jsonText);

            // 确定前缀
            const jsonStart = text.indexOf(matches[1]);
            const prefix = jsonStart > 0 ? text.substring(0, jsonStart).trim() : '';

            return {
              prefix: prefix,
              json: jsonObj,
              fullText: text,
              method: "简单模式提取"
            };
          } catch (e) {
            console.log(`简单模式提取失败: ${e.message}`);
          }
        }
      }

      // 没有找到有效的JSON
      return null;
    } catch (e) {
      console.error("提取JSON部分时发生错误:", e);
      return null;
    }
  },
  /**
   * 解析日志行，提取时间戳、级别、来源和消息内容
   * @param {string} logLine 日志行
   * @returns {Object} 解析后的日志对象
   */
  /**
     * 解析日志行，提取时间戳、级别、来源和消息内容
     * @param {string} logLine 日志行
     * @returns {Object} 解析后的日志对象
     */
  parseLogLine(logLine) {
    try {
      // 匹配格式: [timestamp] [LEVEL] [source]: message
      const levelMatch = logLine.match(/\[(.*?)\] \[(DEBUG|INFO|WARN|ERROR)\] \[(.*?)\]: (.*)/);

      if (levelMatch) {
        let message = levelMatch[4];
        let originalMessage = message;
        let isJsonObject = false;
        let jsonExtractMethod = '';

        // 0. 尝试使用通用的JSON提取函数 
        const jsonParts = this.tryExtractJsonParts(message);
        if (jsonParts && jsonParts.json) {
          isJsonObject = true;
          jsonExtractMethod = jsonParts.method || '通用提取';

          // 格式化并构建最终显示的消息
          if (jsonParts.prefix) {
            message = jsonParts.prefix + ': ' + this.formatJsonForDisplay(jsonParts.json);
          } else {
            message = this.formatJsonForDisplay(jsonParts.json);
          }
        }
        // 1. 如果通用提取失败，检测当前行是否是一个独立的JSON对象（完整的）
        else {
          const trimmedMsg = message.trim();
          if ((trimmedMsg.startsWith('{') && trimmedMsg.endsWith('}')) ||
            (trimmedMsg.startsWith('[') && trimmedMsg.endsWith(']'))) {
            try {
              // 先清理JSON字符串
              const cleanedJson = this.cleanJsonString(trimmedMsg);
              // 尝试解析为JSON对象
              const jsonObj = JSON.parse(cleanedJson);
              // 使用专用函数格式化JSON对象
              message = this.formatJsonForDisplay(jsonObj);
              isJsonObject = true;
              jsonExtractMethod = '直接解析';
            } catch (e) {
              console.log(`直接解析JSON失败: ${e.message}`);

              // 不是有效的JSON，检查是否包含对象前缀
              if (trimmedMsg.includes(': {') || trimmedMsg.includes(': [')) {
                const colonIndex = trimmedMsg.indexOf(':');
                if (colonIndex !== -1) {
                  const possibleJson = trimmedMsg.substring(colonIndex + 1).trim();
                  if ((possibleJson.startsWith('{') && possibleJson.endsWith('}')) ||
                    (possibleJson.startsWith('[') && possibleJson.endsWith(']'))) {
                    try {
                      const cleanedJson = this.cleanJsonString(possibleJson);
                      const jsonObj = JSON.parse(cleanedJson);
                      // 保留前缀，但格式化JSON部分
                      message = trimmedMsg.substring(0, colonIndex + 1) + ' ' +
                        this.formatJsonForDisplay(jsonObj);
                      isJsonObject = true;
                      jsonExtractMethod = '前缀分离';
                    } catch (e2) {
                      console.log(`前缀分离JSON失败: ${e2.message}`);
                      // 仍然不是有效的JSON，保持原样
                    }
                  }
                }
              }
            }
          }

          // 2. 如果上述方法都失败，检查是否包含常见的JSON对象描述模式
          if (!isJsonObject) {
            // 扩展的模式列表，覆盖更多的情况
            const jsonPatterns = [
              { regex: /用户(信息|数据|资料|详情|profile)[:：]\s*({.*})/i, type: 'object' },
              { regex: /(登录|注册|认证)(状态|结果|返回|数据)[:：]\s*({.*})/i, type: 'object' },
              { regex: /(请求|访问|查询)(结果|响应|数据|记录)[:：]\s*({.*})/i, type: 'object' },
              { regex: /(API|接口)(响应|返回|结果|数据)[:：]\s*({.*})/i, type: 'object' },
              { regex: /(错误|异常|报错|警告)(信息|详情|数据)[:：]\s*({.*})/i, type: 'object' },
              { regex: /(订单|产品|商品|用户)(列表|清单|数组)[:：]\s*(\[.*\])/i, type: 'array' },
              { regex: /(配置|设置|参数|选项)[:：]\s*({.*})/i, type: 'object' },
            ];

            for (const pattern of jsonPatterns) {
              const match = trimmedMsg.match(pattern.regex);
              if (match && (pattern.type === 'object' ? match[2] : match[3])) {
                const jsonPart = pattern.type === 'object' ? match[2] : match[3];
                try {
                  const cleanedJson = this.cleanJsonString(jsonPart);
                  const jsonObj = JSON.parse(cleanedJson);
                  const prefix = trimmedMsg.substring(0, trimmedMsg.indexOf(jsonPart));
                  message = prefix + this.formatJsonForDisplay(jsonObj);
                  isJsonObject = true;
                  jsonExtractMethod = '模式匹配';
                  break;
                } catch (e) {
                  console.log(`模式匹配JSON失败: ${e.message}`);
                  // 不是有效的JSON，继续下一个模式
                }
              }
            }
          }
        }

        // 3. 用于调试
        if (isJsonObject) {
          console.log(`成功提取JSON，方法: ${jsonExtractMethod}`);
        }

        return {
          timestamp: levelMatch[1],
          level: levelMatch[2],
          source: levelMatch[3],
          message: message,
          originalMessage: originalMessage,
          isJsonObject: isJsonObject,
          jsonExtractMethod: jsonExtractMethod,
          fullText: logLine,
          // 为不同级别设置不同样式类
          levelClass: levelMatch[2].toLowerCase() + '-log'
        };
      } else {
        // 检查是否是包含JSON的非标准格式日志行
        // 先尝试通用的JSON提取函数
        const jsonParts = this.tryExtractJsonParts(logLine);
        if (jsonParts && jsonParts.json) {
          // 是有效的JSON对象
          let displayMessage;
          if (jsonParts.prefix) {
            displayMessage = jsonParts.prefix + ': ' + this.formatJsonForDisplay(jsonParts.json);
          } else {
            displayMessage = this.formatJsonForDisplay(jsonParts.json);
          }

          return {
            timestamp: '',
            level: 'INFO',
            source: '',
            message: displayMessage,
            originalMessage: logLine,
            isJsonObject: true,
            jsonExtractMethod: jsonParts.method || '非标准行-通用提取',
            fullText: logLine,
            levelClass: 'info-log'
          };
        }

        // 如果通用提取失败，尝试简单的边界检测
        const jsonStart = logLine.indexOf('{');
        const jsonEnd = logLine.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
          const possibleJson = logLine.substring(jsonStart, jsonEnd + 1);
          try {
            // 清理并解析JSON
            const cleanedJson = this.cleanJsonString(possibleJson);
            const jsonObj = JSON.parse(cleanedJson);

            // 是有效的JSON对象
            const prefix = logLine.substring(0, jsonStart).trim();
            const message = prefix ? prefix + ' ' + this.formatJsonForDisplay(jsonObj)
              : this.formatJsonForDisplay(jsonObj);

            return {
              timestamp: '',
              level: 'INFO',
              source: '',
              message: message,
              originalMessage: logLine,
              isJsonObject: true,
              jsonExtractMethod: '非标准行-边界提取',
              fullText: logLine,
              levelClass: 'info-log'
            };
          } catch (e) {
            console.log(`非标准行边界提取JSON失败: ${e.message}`);
            // 不是有效的JSON
          }
        }

        // 不是标准格式，保持原样
        return {
          timestamp: '',
          level: '',
          source: '',
          message: logLine,
          originalMessage: logLine,
          isJsonObject: false,
          fullText: logLine,
          levelClass: 'continue-log'
        };
      }
    } catch (error) {
      console.error('解析日志行时出错:', error, logLine);
      return {
        timestamp: '',
        level: 'ERROR',
        source: 'parser',
        message: `解析错误: ${error.message}`,
        originalMessage: logLine,
        isJsonObject: false,
        fullText: logLine,
        levelClass: 'error-log'
      };
    }
  },

  /**
   * 搜索框输入事件处理
   * @param {Object} e 事件对象
   */
  onSearchInput(e) {
    const searchQuery = e.detail.value.toLowerCase().trim();
    this.setData({ searchQuery });
    this.applyFilters();
  },

  /**
   * 按日志级别过滤
   * @param {Object} e 事件对象
   */
  filterByLevel(e) {
    const level = e.currentTarget.dataset.level;
    this.setData({ activeFilter: level });
    this.applyFilters();
  },  /**
   * 应用过滤器和搜索
   */
  applyFilters() {
    const { logs, activeFilter, searchQuery } = this.data;

    // 根据级别和搜索词过滤日志
    let filtered = logs;

    // 应用级别过滤
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(log => log.level === activeFilter);
    }

    // 应用搜索过滤 - 使用fullText或originalMessage（如果存在）进行搜索
    if (searchQuery) {
      filtered = filtered.filter(log => {
        // 确保考虑原始消息内容，因为格式化后的JSON可能包含额外的空格和换行
        const searchText = log.originalMessage
          ? log.fullText.replace(log.message, log.originalMessage).toLowerCase()
          : log.fullText.toLowerCase();

        return searchText.includes(searchQuery);
      });
    }

    // 更新过滤后的日志
    this.setData({ filteredLogs: filtered });
  },

  /**
   * 切换日期选择器显示状态
   */
  toggleDatePicker() {
    this.setData({
      showDatePicker: !this.data.showDatePicker
    });
  },

  /**
   * 选择日志日期
   * @param {Object} e 事件对象
   */
  selectLogDate(e) {
    const dateString = e.currentTarget.dataset.date;

    // 更新当前日期并隐藏日期选择器
    this.setData({
      currentLogDate: dateString,
      showDatePicker: false
    });

    // 重新加载选定日期的日志
    this.loadLogs();

    console.info(`切换到日期 ${dateString} 的日志`, 'log-viewer.js');
  },
  /**
   * 导出日志
   */
  exportLogs() {
    // 导入增强版工具函数
    const exportUtils = require('../../utils/export-utils');

    // 提示选择导出格式
    wx.showActionSheet({
      itemList: ['文本格式 (.txt)', 'JSON格式 (.json)', '网页格式 (.html)'],
      success: (res) => {
        // 根据选择的格式导出
        const formats = ['txt', 'json', 'html'];
        const selectedFormat = formats[res.tapIndex];

        // 显示加载中提示
        wx.showLoading({
          title: '准备导出日志...',
        });

        // 导出日志到文件
        exportUtils.exportLogsEnhanced({
          format: selectedFormat,
          date: this.data.currentLogDate,
          level: this.data.activeFilter === 'ALL' ? null : this.data.activeFilter
        }).then(filePath => {
          // 隐藏加载提示
          wx.hideLoading();

          // 显示导出成功提示
          wx.showToast({
            title: '日志导出成功',
            icon: 'success',
            duration: 2000
          });

          // 弹出保存/分享选项
          wx.showModal({
            title: '日志已导出',
            content: `日志已导出为${selectedFormat.toUpperCase()}格式，是否分享？`,
            confirmText: '分享',
            cancelText: '关闭',
            success: (res) => {
              if (res.confirm) {
                // 分享文件
                wx.shareFileMessage({
                  filePath: filePath,
                  success: () => {
                    console.info(`${selectedFormat}格式日志文件已分享`, 'log-viewer.js');
                  },
                  fail: (err) => {
                    console.error('分享日志文件失败:', err);
                    wx.showToast({
                      title: '分享失败',
                      icon: 'none'
                    });
                  }
                });
              }
            }
          });
        }).catch(err => {
          // 隐藏加载提示
          wx.hideLoading();

          // 显示错误提示
          wx.showModal({
            title: '导出日志失败',
            content: err.message || '导出日志时发生错误',
            confirmText: '确定',
            showCancel: false
          });

          console.error('导出日志失败:', err);
        });
      }
    });
  },  /**
   * 刷新日志
   */
  refreshLogs() {
    // 刷新日志文件列表
    this.loadAvailableLogFiles().then(() => {
      // 然后刷新日志内容
      this.loadLogs();
    }).catch(() => {
      // 即使获取文件列表失败，也尝试刷新日志
      this.loadLogs();
    });
  },

  /**
   * 清除搜索和过滤
   */
  clearFilters() {
    this.setData({
      searchQuery: '',
      activeFilter: 'ALL'
    });
    this.loadLogs(); // 重新加载日志，应用新的筛选条件
  },

  /**
   * 下拉刷新处理函数
   */
  onPullDownRefresh() {
    this.refreshLogs();

    // 完成刷新
    wx.stopPullDownRefresh();
  },

  /**
   * 格式化日期显示
   * @param {string} dateString YYYYMMDD格式的日期字符串
   * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
   */
  formatDisplayDate(dateString) {
    if (!dateString || dateString.length !== 8) return '未知日期';

    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    return `${year}-${month}-${day}`;
  },
  /**
   * 尝试完成JSON集合的解析和处理
   * @param {Array} jsonLines 收集到的JSON行
   * @param {Object} headerLog 日志头部对象
   * @param {Array} targetArray 要添加结果的数组
   * @returns {boolean} 是否成功处理
   */
  tryFinalizeJsonCollection(jsonLines, headerLog, targetArray) {
    if (!jsonLines.length || !headerLog) return false;

    try {
      // 合并并清理JSON文本
      let jsonStr = jsonLines.join(' ');
      // 检查是否是日志格式
      const isLogFormat = /^\[[\d\-T:.Z]+\]\s+\[(DEBUG|INFO|WARN|ERROR)\]/.test(jsonStr);

      // 清理JSON文本
      let cleanedJsonStr = this.cleanJsonString(jsonStr);

      let jsonObj;

      if (isLogFormat) {
        // 对于日志格式,尝试使用更高级的方法提取JSON部分
        const extractResult = this.extractJsonParts(cleanedJsonStr);

        if (extractResult.success && extractResult.jsonStr) {
          try {
            jsonObj = JSON.parse(extractResult.jsonStr);
            // 使用提取的格式重建格式化日志字符串
            const formattedJson = this.formatJsonForDisplay(jsonObj);
            cleanedJsonStr = extractResult.prefix + formattedJson + extractResult.suffix;
          } catch (e) {
            console.log('从日志中提取的JSON解析失败:', e.message);
          }
        }

        // 如果上面的方法失败,尝试使用正则表达式提取
        if (!jsonObj) {
          const logFormatRegex = /^\[[\d\-T:.Z]+\]\s+\[(DEBUG|INFO|WARN|ERROR)\]\s+\[.*?\]:\s*(.*)/;
          const logMatch = cleanedJsonStr.match(logFormatRegex);

          if (logMatch && logMatch[2]) {
            // 提取冒号后面的JSON部分
            let jsonPart = logMatch[2];
            // 查找实际JSON对象或数组的起始位置
            const jsonStartIdx = Math.min(
              jsonPart.indexOf('{') !== -1 ? jsonPart.indexOf('{') : Infinity,
              jsonPart.indexOf('[') !== -1 ? jsonPart.indexOf('[') : Infinity
            );

            if (jsonStartIdx !== Infinity) {
              // 提取有效的JSON部分
              const potentialJson = jsonPart.substring(jsonStartIdx);
              try {
                jsonObj = JSON.parse(potentialJson);
              } catch (parseError) {
                // 如果解析失败,尝试查找最后一个完整的对象或数组
                const objEndPos = potentialJson.lastIndexOf('}');
                const arrEndPos = potentialJson.lastIndexOf(']');
                const endPos = Math.max(objEndPos, arrEndPos);

                if (endPos > 0) {
                  // 尝试解析确保完整的对象或数组
                  try {
                    jsonObj = JSON.parse(potentialJson.substring(0, endPos + 1));
                  } catch (e) {
                    // 仍然失败,继续进行下一步处理
                  }
                }
              }
            }
          }
        }
      }      // 如果前面没有成功解析，检查是否是TabBar项目格式
      if (!jsonObj) {
        // 尝试修复单个TabBar项目
        const fixedTabBarItem = this.fixSingleTabBarItem(jsonStr);
        if (fixedTabBarItem) {
          try {
            jsonObj = JSON.parse(fixedTabBarItem);
            console.log('成功修复TabBar项目格式');
          } catch (e) {
            console.log('TabBar项目修复后仍解析失败:', e.message);
          }
        }
      }

      // 最后尝试标准方式解析
      if (!jsonObj) {
        try {
          jsonObj = JSON.parse(jsonStr);
        } catch (e) {
          // 如果仍然解析失败,让下面的错误处理逻辑继续
          throw e;
        }
      }

      // 创建格式化的JSON字符串
      const formattedJson = this.formatJsonForDisplay(jsonObj);

      // 更新日志对象
      headerLog.message = formattedJson;
      headerLog.isJsonObject = true;
      headerLog.jsonParseSuccess = true;
      targetArray.push(headerLog);

      return true;
    } catch (e) {
      console.error('JSON解析失败:', e);

      // 尝试更积极的JSON修复方法
      try {
        // 检查是否在开头有可能的对象/数组标记
        let jsonText = jsonLines.join(' ');

        // 尝试找到JSON的实际开始和结束位置
        const objStartPos = jsonText.indexOf('{');
        const objEndPos = jsonText.lastIndexOf('}');
        const arrStartPos = jsonText.indexOf('[');
        const arrEndPos = jsonText.lastIndexOf(']');

        // 确定使用对象还是数组格式
        let startPos, endPos;
        if (objStartPos !== -1 && objEndPos !== -1 &&
          (arrStartPos === -1 || objStartPos < arrStartPos)) {
          // 对象格式
          startPos = objStartPos;
          endPos = objEndPos;
        } else if (arrStartPos !== -1 && arrEndPos !== -1) {
          // 数组格式
          startPos = arrStartPos;
          endPos = arrEndPos;
        } else {
          // 无法确定格式，解析失败
          headerLog.message = jsonLines.join('\n');
          targetArray.push(headerLog);
          return false;
        }

        // 提取可能的JSON部分
        if (startPos !== -1 && endPos !== -1 && startPos < endPos) {
          jsonText = jsonText.substring(startPos, endPos + 1);
          jsonText = this.cleanJsonString(jsonText);

          // 再次尝试解析
          const jsonObj = JSON.parse(jsonText);

          // 创建格式化的JSON字符串
          const formattedJson = this.formatJsonForDisplay(jsonObj);

          // 更新日志对象
          headerLog.message = formattedJson;
          headerLog.isJsonObject = true;
          headerLog.jsonParseSuccess = true;
          targetArray.push(headerLog);

          return true;
        }
      } catch (e2) {
        console.log('二次尝试解析JSON失败:', e2.message);
      }

      // 解析失败，作为普通文本添加
      headerLog.message = jsonLines.join('\n');
      headerLog.isJsonObject = false;
      headerLog.jsonParseSuccess = false;
      targetArray.push(headerLog);

      return false;
    }
  },

  /**
   * 修复单个TabBar项目的JSON格式
   * 处理形如 { "pagePath": "/pages/index/index", ... }, 这种末尾带逗号的对象
   * @param {string} jsonStr 可能的TabBar项目字符串
   * @returns {string|null} 修复后的JSON字符串，如果不是TabBar项目则返回null
   */
  fixSingleTabBarItem(jsonStr) {
    if (!jsonStr) return null;

    // 判断是否是TabBar项目格式（包含特定字段）
    const isTabBarItem = /{\s*"pagePath"/.test(jsonStr) &&
      /"text"/.test(jsonStr) &&
      /"iconPath"/.test(jsonStr);

    if (!isTabBarItem) return null;

    // 去掉末尾的逗号，使其成为有效的JSON对象
    let fixed = jsonStr.trim();
    if (fixed.endsWith(',')) {
      fixed = fixed.substring(0, fixed.length - 1);
    }

    // 验证是否是有效的JSON
    try {
      const obj = JSON.parse(fixed);
      return fixed;
    } catch (e) {
      return null;
    }
  },

  /**
   * 从字符串中提取JSON对象或数组部分
   * @param {string} str 待提取的字符串
   * @returns {Object} 包含提取结果的对象 {jsonStr, prefix, suffix}
   */
  extractJsonParts(str) {
    const result = {
      jsonStr: '',   // 提取出的JSON字符串
      prefix: '',    // JSON前面的文本
      suffix: '',    // JSON后面的文本
      success: false // 是否成功提取
    };

    if (!str || typeof str !== 'string') {
      return result;
    }

    // 首先检查是否是TabBar项目格式
    const fixedTabBarItem = this.fixSingleTabBarItem(str.trim());
    if (fixedTabBarItem) {
      try {
        JSON.parse(fixedTabBarItem); // 验证是有效的JSON
        result.jsonStr = fixedTabBarItem;
        result.success = true;
        return result;
      } catch (e) {
        console.log('TabBar项目格式验证失败:', e.message);
        // 继续尝试后续方法
      }
    }

    // 查找JSON对象或数组的开始和结束位置
    let objectStart = -1, objectEnd = -1;
    let arrayStart = -1, arrayEnd = -1;
    let bracketsCount = 0;
    let braceCount = 0;
    let inString = false;
    let escaping = false;

    // 首先查找有效的起始位置
    objectStart = str.indexOf('{');
    arrayStart = str.indexOf('[');

    // 确定使用哪种类型的JSON
    let startPos = -1;
    let isObject = false;

    if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
      startPos = objectStart;
      isObject = true;
    } else if (arrayStart !== -1) {
      startPos = arrayStart;
      isObject = false;
    }

    // 如果找不到开始标记，直接返回
    if (startPos === -1) {
      return result;
    }

    // 记录前缀
    result.prefix = str.substring(0, startPos);

    // 从开始位置扫描，找到匹配的结束符号
    for (let i = startPos; i < str.length; i++) {
      const char = str[i];

      if (escaping) {
        escaping = false;
        continue;
      }

      if (char === '\\') {
        escaping = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        // 如果是对象且括号已经配对，记录结束位置
        if (isObject && braceCount === 0 && i > startPos) {
          objectEnd = i;
          break;
        }
      } else if (char === '[') {
        bracketsCount++;
      } else if (char === ']') {
        bracketsCount--;
        // 如果是数组且方括号已经配对，记录结束位置
        if (!isObject && bracketsCount === 0 && i > startPos) {
          arrayEnd = i;
          break;
        }
      }
    }

    // 确定结束位置
    let endPos = -1;
    if (isObject && objectEnd !== -1) {
      endPos = objectEnd;
    } else if (!isObject && arrayEnd !== -1) {
      endPos = arrayEnd;
    }

    // 如果找到了完整的JSON部分
    if (endPos !== -1) {
      result.jsonStr = str.substring(startPos, endPos + 1);
      result.suffix = str.substring(endPos + 1);

      // 尝试解析提取的JSON，确保有效
      try {
        JSON.parse(result.jsonStr);
        result.success = true;
      } catch (e) {
        console.log(`提取的JSON无效: ${e.message}`);

        // 尝试特殊处理TabBar项目
        const fixedTabBarItem = this.fixSingleTabBarItem(result.jsonStr);
        if (fixedTabBarItem) {
          try {
            JSON.parse(fixedTabBarItem);
            result.jsonStr = fixedTabBarItem;
            result.success = true;
            console.log('成功修复特殊TabBar项目JSON');
          } catch (e2) {
            // 仍然失败，保留原内容
          }
        }
      }
    }

    return result;
  },
});
