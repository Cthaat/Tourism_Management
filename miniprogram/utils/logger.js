/**
 * 日志管理工具
 * 增强console输出，将日志记录到文件并添加更多的上下文信息
 */

// 日志级别
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * 日志管理器类
 */
class Logger {
  constructor() {
    // 保存原始console对象的引用
    this._originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    // 日志文件相关配置
    this.currentLogFile = '';
    this.isLogging = false; // 防止递归调用
    this.logs = []; // 内存中的日志缓存
    this.maxLogCount = 1000; // 内存中最多保留的日志条数
    this.consoleOutput = true; // 是否同时输出到控制台
    this.fileLoggingEnabled = true; // 是否启用文件日志记录

    // 初始化日志存储
    this.initStorage();

    // 重写console方法
    this.overrideConsoleMethods();
  }
  /**
   * 初始化日志存储
   */
  initStorage() {
    try {
      const fs = wx.getFileSystemManager();
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      // 获取用户文件系统路径
      const userDataPath = wx.env.USER_DATA_PATH;

      // 日志目录路径
      const logDir = `${userDataPath}/logs`;

      // 检查USER_DATA_PATH是否有效
      if (!userDataPath || typeof userDataPath !== 'string' || userDataPath.startsWith('http://usr/')) {
        // 在开发工具上调试时可能会遇到此问题，降级使用内存模式
        this._originalConsole.warn('用户数据路径无效，将仅使用内存记录日志');
        this.currentLogFile = '';
        this.fileLoggingEnabled = false;
        return;
      }

      this.fileLoggingEnabled = true;

      // 确保日志目录存在
      try {
        fs.accessSync(logDir);
      } catch (e) {
        try {
          fs.mkdirSync(logDir, true);
          this._originalConsole.info('成功创建日志目录:', logDir);
        } catch (err) {
          this._originalConsole.error('创建日志目录失败:', err);
          this.fileLoggingEnabled = false;
          this.currentLogFile = '';
          return;
        }
      }

      // 设置当前日志文件路径，按日期生成
      this.currentLogFile = `${logDir}/app-${year}${month}${day}.log`;
      this._originalConsole.info('日志文件路径:', this.currentLogFile);
    } catch (error) {
      this._originalConsole.error('初始化日志存储失败:', error);
      this.fileLoggingEnabled = false;
      this.currentLogFile = '';
    }
  }

  /**
   * 格式化日志消息
   * @param {string} level 日志级别
   * @param {string} message 日志消息
   * @param {string} source 日志来源
   * @param {object} details 额外详情
   * @returns {string} 格式化后的日志字符串
   */  formatLogMessage(level, message, source, details = null) {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level}] [${source}]: ${message}`;

    if (details) {
      try {        // 处理对象类型的额外信息为美化格式
        const detailsStr = typeof details === 'object' ?
          JSON.stringify(details, null, 2) : String(details);
        formattedMessage += `\n详细信息: ${detailsStr}`;
      } catch (e) {
        formattedMessage += '\n无法序列化的详细信息';
      }
    }

    // 添加调用栈信息（仅对ERROR级别）
    if (level === LogLevel.ERROR) {
      try {
        throw new Error('用于获取堆栈');
      } catch (e) {
        // 从第3行开始，跳过当前函数和error方法
        const stackLines = e.stack.split('\n').slice(3);
        if (stackLines.length > 0) {
          formattedMessage += '\n调用栈:' + stackLines.join('\n');
        }
      }
    }

    return formattedMessage;
  }
  /**
   * 安全地写入日志到文件
   * @param {string} message 格式化后的日志消息
   */
  writeToFile(message) {
    // 如果文件日志功能被禁用或文件路径无效，则直接返回
    if (!this.fileLoggingEnabled || !this.currentLogFile) {
      return;
    }

    try {
      const fs = wx.getFileSystemManager();

      // 尝试追加到现有日志文件
      try {
        fs.appendFileSync(
          this.currentLogFile,
          message + '\n',
          'utf8'
        );
      } catch (appendErr) {
        // 如果文件不存在，创建新文件
        if (appendErr.errMsg && appendErr.errMsg.indexOf('no such file or directory') >= 0) {
          try {
            fs.writeFileSync(
              this.currentLogFile,
              message + '\n',
              'utf8'
            );
            this._originalConsole.info('创建了新的日志文件:', this.currentLogFile);
          } catch (writeErr) {
            this._originalConsole.error('创建日志文件失败:', writeErr);
            this.fileLoggingEnabled = false; // 禁用文件日志功能
          }
        } else {
          throw appendErr; // 其他错误，向上传递
        }
      }
    } catch (err) {
      // 直接使用原始console.error，避免递归
      this._originalConsole.error('写入日志文件失败:', err);

      // 如果主日志文件写入失败，尝试降级到备用路径
      try {
        const fs = wx.getFileSystemManager();
        const userPath = wx.env.USER_DATA_PATH;

        // 仅当USER_DATA_PATH有效时才尝试备用日志
        if (userPath && typeof userPath === 'string' && !userPath.startsWith('http://usr/')) {
          const backupFile = `${userPath}/app_log_backup.txt`;

          fs.appendFileSync(
            backupFile,
            message + '\n',
            'utf8'
          );
        }
      } catch (backupErr) {
        // 如果连备用都失败，禁用文件日志功能
        this._originalConsole.error('备用日志文件写入失败:', backupErr);
        this.fileLoggingEnabled = false;
      }
    }
  }

  /**
   * 添加一条日志
   * @param {string} level 日志级别
   * @param {string} message 日志消息
   * @param {string} source 日志来源
   * @param {object} details 额外详情
   */  log(level, message, source, details = null) {
    // 防止递归调用
    if (this.isLogging) {
      return;
    }

    this.isLogging = true;

    try {      // 安全检查，处理对象类型的消息为美化格式
      let safeMessage;
      if (typeof message === 'object' && message !== null) {
        try {
          // 美化格式序列化（2空格缩进）
          safeMessage = JSON.stringify(message, null, 2);
        } catch (e) {
          safeMessage = '[无法序列化的对象]';
        }
      } else {
        safeMessage = typeof message === 'string' ? message : String(message || '');
      }
      const safeSource = source || '未知来源';

      const formattedMessage = this.formatLogMessage(level, safeMessage, safeSource, details);

      // 将日志存入内存缓存（即使写文件失败也保留在内存中）
      this.logs.push(formattedMessage);
      if (this.logs.length > this.maxLogCount) {
        this.logs.shift();
      }

      // 使用原始控制台方法输出到控制台
      if (this.consoleOutput) {
        switch (level) {
          case LogLevel.ERROR:
            this._originalConsole.error(formattedMessage);
            break;
          case LogLevel.WARN:
            this._originalConsole.warn(formattedMessage);
            break;
          case LogLevel.INFO:
            this._originalConsole.info(formattedMessage);
            break;
          default:
            this._originalConsole.log(formattedMessage);
        }
      }

      // 写入日志文件（安全方式）- 放在最后执行
      this.writeToFile(formattedMessage);
    } catch (unexpectedError) {
      // 捕获所有可能的错误，确保不会崩溃
      this._originalConsole.error('日志记录过程中出现意外错误:', unexpectedError);
    } finally {
      this.isLogging = false;
    }
  }

  /**
   * 记录调试级别日志
   * @param {string} message 日志消息
   * @param {string} source 日志来源
   * @param {object} details 额外详情
   */
  debug(message, source, details = null) {
    this.log(LogLevel.DEBUG, message, source, details);
  }

  /**
   * 记录信息级别日志
   * @param {string} message 日志消息
   * @param {string} source 日志来源
   * @param {object} details 额外详情
   */
  info(message, source, details = null) {
    this.log(LogLevel.INFO, message, source, details);
  }

  /**
   * 记录警告级别日志
   * @param {string} message 日志消息
   * @param {string} source 日志来源
   * @param {object} details 额外详情
   */
  warn(message, source, details = null) {
    this.log(LogLevel.WARN, message, source, details);
  }

  /**
   * 记录错误级别日志
   * @param {string} message 日志消息
   * @param {string} source 日志来源
   * @param {object} details 额外详情
   */
  error(message, source, details = null) {
    this.log(LogLevel.ERROR, message, source, details);
  }

  /**
   * 获取当前调用栈中的调用者信息
   * @returns {string} 调用者信息（文件名和行号）
   */
  getCallerInfo() {
    try {
      throw new Error('获取堆栈');
    } catch (e) {
      // 从第3行开始，跳过当前函数和调用函数
      const stackLines = e.stack.split('\n');
      if (stackLines.length >= 4) { // 需要跳过多层调用
        const callerLine = stackLines[3]; // 这里可能需要根据环境调整索引

        // 尝试解析出文件名和行号
        const match = callerLine.match(/at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/) ||
          callerLine.match(/at\s+(.*?):(\d+):(\d+)/);

        if (match) {
          // 处理两种不同的调用栈格式
          if (match.length === 5) {
            // 格式: "at functionName (filename:line:column)"
            const functionName = match[1];
            const fileName = match[2].split('/').pop().split('\\').pop();
            return `${fileName}:${match[3]} (${functionName})`;
          } else {
            // 格式: "at filename:line:column"
            const fileName = match[1].split('/').pop().split('\\').pop();
            return `${fileName}:${match[2]}`;
          }
        }
      }

      return '未知来源';
    }
  }  /**
   * 重写console方法
   */
  overrideConsoleMethods() {
    const self = this;    // 处理参数，包括对象序列化为美化格式
    const processArgs = function (args) {
      // 如果没有参数，返回空字符串
      if (args.length === 0) return '';

      // 单个对象参数的特殊处理
      if (args.length === 1) {
        const arg = args[0];

        // 处理对象（非Error类型）
        if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
          try {
            // 使用JSON.stringify美化格式（2空格缩进）
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[无法序列化的对象]';
          }
        }

        // 处理字符串中包含的JSON对象模式
        if (typeof arg === 'string') {
          // 检查是否是"xxx: {...}"或"xxx: [...]"格式
          const jsonPrefixRegex = /^(.*?):\s*({.*}|\[.*\])$/s;
          const match = arg.match(jsonPrefixRegex);

          if (match && match[2]) {
            try {
              // 尝试解析JSON部分
              const prefix = match[1];
              const jsonPart = match[2];
              const jsonObj = JSON.parse(jsonPart);

              // 重新格式化为前缀 + 格式化的JSON
              return `${prefix}: ${JSON.stringify(jsonObj, null, 2)}`;
            } catch (e) {
              // 解析失败，返回原始字符串
              return arg;
            }
          }

          // 尝试检测完整的JSON字符串
          if ((arg.startsWith('{') && arg.endsWith('}')) ||
            (arg.startsWith('[') && arg.endsWith(']'))) {
            try {
              const jsonObj = JSON.parse(arg);
              return JSON.stringify(jsonObj, null, 2);
            } catch (e) {
              // 不是有效的JSON，返回原始字符串
              return arg;
            }
          }

          // 常规字符串，直接返回
          return arg;
        }

        // 其他类型(数字、布尔等)，转为字符串
        return String(arg);
      }

      // 处理多个参数的情况

      // 特殊情况：第一个参数是字符串，可能是描述，后面跟着一个对象
      if (typeof args[0] === 'string' && args.length === 2 &&
        typeof args[1] === 'object' && args[1] !== null && !(args[1] instanceof Error)) {
        try {
          // 尝试使用第一个参数作为前缀，第二个参数作为格式化的JSON
          return `${args[0]} ${JSON.stringify(args[1], null, 2)}`;
        } catch (e) {
          // 出错回退到标准处理
        }
      }

      // 标准处理：将每个参数转换为字符串并连接
      return args.map(arg => {
        if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
          try {
            // 美化格式保证多行显示正确
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[无法序列化的对象]';
          }
        }
        return String(arg);
      }).join(' ');
    };

    // 重写console.log
    console.log = function (...args) {
      const message = processArgs(args);
      const source = self.getCallerInfo();
      self.debug(message, source);
    };

    // 重写console.info
    console.info = function (...args) {
      const message = processArgs(args);
      const source = self.getCallerInfo();
      self.info(message, source);
    };

    // 重写console.warn
    console.warn = function (...args) {
      const message = processArgs(args);
      const source = self.getCallerInfo();
      self.warn(message, source);
    };

    // 重写console.error
    console.error = function (...args) {
      let message, details = null;

      // 特殊处理Error对象
      if (args.length === 1 && args[0] instanceof Error) {
        message = args[0].message;
        details = {
          stack: args[0].stack,
          name: args[0].name
        };
      } else if (args.length >= 2 && args[1] instanceof Error) {
        // 处理形如 console.error('错误:', error) 的情况
        message = args[0] + ' ' + args[1].message;
        details = {
          stack: args[1].stack,
          name: args[1].name
        };
      } else {
        message = processArgs(args);
      }

      const source = self.getCallerInfo();
      self.error(message, source, details);
    };

    // 重写console.debug
    console.debug = function (...args) {
      const message = processArgs(args);
      const source = self.getCallerInfo();
      self.debug(message, source);
    };
  }

  /**
   * 获取所有日志
   * @returns {Array} 日志数组
   */
  getAllLogs() {
    return [...this.logs];
  }

  /**
   * 清除内存中的日志（不会删除文件）
   */
  clearLogs() {
    this.logs = [];
  }
}

// 创建单例
const logger = new Logger();

module.exports = {
  logger,
  LogLevel
};
