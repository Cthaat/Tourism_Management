const app = getApp();
const utils = require('../../utils/util');
const exportUtils = require('../../utils/export-utils');

Page({
  data: {
    logs: [],
    filteredLogs: [],
    isLoading: false,
    searchQuery: '',
    activeFilter: 'ALL',
    isDarkMode: false,
    colorTheme: '默认绿',
    availableLogFiles: [],
    currentLogDate: '',
    displayCurrentDate: '未知日期',
    showDatePicker: false,
    filteredCount: 0,
    logStats: {
      ALL: 0,
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0
    }
  },

  onLoad(options) {
    this.maxLines = options.maxLines ? parseInt(options.maxLines, 10) : 2000;
    this.searchDebounceTimer = null;

    this.setData({
      isDarkMode: !!(app.globalData && app.globalData.darkMode),
      colorTheme: (app.globalData && app.globalData.colorTheme) || '默认绿'
    });

    wx.onThemeChange((result) => {
      this.setData({ isDarkMode: result.theme === 'dark' });
    });

    this.initLogViewer();
  },

  onShow() {
    this.setData({
      isDarkMode: !!(app.globalData && app.globalData.darkMode),
      colorTheme: (app.globalData && app.globalData.colorTheme) || '默认绿'
    });
  },

  onUnload() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  },

  async initLogViewer() {
    this.setData({ isLoading: true });
    try {
      await this.loadAvailableLogFiles();
      await this.loadLogs();
    } catch (error) {
      console.error('初始化日志查看器失败:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async loadAvailableLogFiles() {
    const files = await utils.getAvailableLogFiles();
    const safeFiles = Array.isArray(files) ? files : [];
    const today = this.formatDateYYYYMMDD(new Date());
    const defaultDate = safeFiles.length ? safeFiles[0].dateString : today;

    this.setData({
      availableLogFiles: safeFiles,
      currentLogDate: defaultDate,
      displayCurrentDate: this.formatDisplayDate(defaultDate)
    });
  },

  async loadLogs() {
    this.setData({ isLoading: true });
    try {
      const rawContent = await utils.getAppLogs(this.maxLines, {
        date: this.data.currentLogDate
      });

      const logs = this.parseLogContent(rawContent || '');
      const stats = this.calculateLogStats(logs);

      this.setData({
        logs: Array.isArray(logs) ? logs : [],
        logStats: stats
      });
      this.applyFilters();
    } catch (error) {
      console.error('加载日志失败:', error);
      this.setData({
        logs: [],
        filteredLogs: [],
        filteredCount: 0,
        logStats: {
          ALL: 0,
          DEBUG: 0,
          INFO: 0,
          WARN: 0,
          ERROR: 0
        }
      });

      wx.showToast({
        title: '加载日志失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  parseLogContent(content) {
    if (!content) return [];

    const lines = content.split('\n').filter(line => line !== '');
    const items = [];
    let currentLines = [];

    const flushCurrent = () => {
      if (!currentLines.length) return;

      const head = currentLines[0];
      const parsedHead = this.parseLogHeader(head);
      const remain = currentLines.slice(1).join('\n');
      const joinedMessage = remain ? `${parsedHead.message}\n${remain}` : parsedHead.message;

      items.push({
        rawTimestamp: parsedHead.rawTimestamp,
        timestamp: this.formatLocalTime(parsedHead.rawTimestamp),
        level: parsedHead.level,
        source: parsedHead.source,
        message: joinedMessage,
        originalMessage: joinedMessage,
        fullText: currentLines.join('\n'),
        levelClass: `${parsedHead.level.toLowerCase()}-log`
      });

      currentLines = [];
    };

    lines.forEach((line) => {
      if (this.isLogStart(line)) {
        flushCurrent();
        currentLines = [line];
      } else if (currentLines.length) {
        currentLines.push(line);
      } else {
        // 兜底：非标准首行也作为一条日志展示，避免内容丢失
        items.push({
          rawTimestamp: '',
          timestamp: '',
          level: 'INFO',
          source: 'raw',
          message: line,
          originalMessage: line,
          fullText: line,
          levelClass: 'info-log'
        });
      }
    });

    flushCurrent();

    return items.reverse();
  },

  isLogStart(line) {
    return /^\[[^\]]+\]\s+\[(DEBUG|INFO|WARN|ERROR)\]\s+\[.*?\]:/.test(line);
  },

  parseLogHeader(line) {
    const match = line.match(/^\[([^\]]+)\]\s+\[(DEBUG|INFO|WARN|ERROR)\]\s+\[(.*?)\]:\s?(.*)$/);
    if (match) {
      return {
        rawTimestamp: match[1],
        level: match[2],
        source: match[3],
        message: match[4] || ''
      };
    }

    return {
      rawTimestamp: '',
      level: 'INFO',
      source: 'raw',
      message: line
    };
  },

  calculateLogStats(logs) {
    const stats = {
      ALL: logs.length,
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0
    };

    logs.forEach((item) => {
      if (item.level && Object.prototype.hasOwnProperty.call(stats, item.level)) {
        stats[item.level] += 1;
      }
    });

    return stats;
  },

  onSearchInput(e) {
    const searchQuery = (e.detail.value || '').trim().toLowerCase();
    this.setData({ searchQuery });

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.applyFilters();
    }, 250);
  },

  filterByLevel(e) {
    const level = e.currentTarget.dataset.level;
    this.setData({ activeFilter: level || 'ALL' });
    this.applyFilters();
  },

  applyFilters() {
    const { logs, activeFilter, searchQuery } = this.data;

    let filtered = Array.isArray(logs) ? logs : [];

    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(item => item.level === activeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(item => {
        const text = `${item.timestamp} ${item.level} ${item.source} ${item.fullText}`.toLowerCase();
        return text.includes(searchQuery);
      });
    }

    this.setData({
      filteredLogs: filtered,
      filteredCount: filtered.length
    });
  },

  toggleDatePicker() {
    this.setData({ showDatePicker: !this.data.showDatePicker });
  },

  async selectLogDate(e) {
    const date = e.currentTarget.dataset.date;
    if (!date || date === this.data.currentLogDate) {
      this.setData({ showDatePicker: false });
      return;
    }

    this.setData({
      currentLogDate: date,
      displayCurrentDate: this.formatDisplayDate(date),
      showDatePicker: false
    });

    await this.loadLogs();
  },

  async refreshLogs() {
    await this.initLogViewer();
  },

  clearFilters() {
    this.setData({
      searchQuery: '',
      activeFilter: 'ALL'
    });
    this.applyFilters();
  },

  copyLogItem(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.filteredLogs[index];
    if (!item) return;

    wx.setClipboardData({
      data: item.message || item.fullText || '',
      success: () => {
        wx.showToast({
          title: '已复制该条消息',
          icon: 'success'
        });
      }
    });
  },

  copyFilteredLogs() {
    const filtered = this.data.filteredLogs;
    if (!filtered.length) {
      wx.showToast({ title: '暂无日志', icon: 'none' });
      return;
    }

    const text = filtered.map(item => item.fullText).join('\n');
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: `已复制${filtered.length}条`,
          icon: 'success'
        });
      }
    });
  },

  exportLogs() {
    wx.showActionSheet({
      itemList: ['文本格式 (.txt)', 'JSON格式 (.json)', '网页格式 (.html)'],
      success: (res) => {
        const formats = ['txt', 'json', 'html'];
        const format = formats[res.tapIndex];

        wx.showLoading({ title: '导出中...' });

        exportUtils.exportLogsEnhanced({
          format,
          date: this.data.currentLogDate,
          level: this.data.activeFilter === 'ALL' ? null : this.data.activeFilter,
          keyword: this.data.searchQuery || null
        }).then((filePath) => {
          wx.hideLoading();
          wx.showModal({
            title: '导出成功',
            content: '日志已导出，是否立即分享？',
            confirmText: '分享',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.shareFileMessage({
                  filePath,
                  fail: (err) => {
                    console.error('分享失败:', err);
                    wx.showToast({ title: '分享失败', icon: 'none' });
                  }
                });
              }
            }
          });
        }).catch((err) => {
          wx.hideLoading();
          console.error('导出失败:', err);
          wx.showToast({ title: '导出失败', icon: 'none' });
        });
      }
    });
  },

  onPullDownRefresh() {
    this.refreshLogs().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  formatDateYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  },

  formatDisplayDate(dateString) {
    if (!dateString || dateString.length !== 8) return '未知日期';

    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);

    return `${year}-${month}-${day}`;
  },

  formatLocalTime(raw) {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw || '';

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  }
});
