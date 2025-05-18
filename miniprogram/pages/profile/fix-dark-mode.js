/**
 * 文件名: fix-dark-mode.js
 * 描述: 用于修复页面深色模式在某些情况下不生效的问题
 * 创建日期: 2025-05-18
 * 
 * 该文件通过注入到页面加载过程中，强制确保深色模式样式正确应用
 * 特别是针对背景渐变等问题进行修复
 */

module.exports = {
  /**
   * 应用深色模式修复
   * @param {Object} page - 页面实例
   */
  applyFix: function (page) {
    // 缓存原始的生命周期方法
    const originalOnShow = page.onShow;
    const originalOnReady = page.onReady;
    const originalOnLoad = page.onLoad;

    // 重写onLoad方法，确保初始化时设置正确的深色模式状态
    page.onLoad = function (options) {
      // 调用原始onLoad
      if (originalOnLoad) {
        originalOnLoad.call(this, options);
      }

      // 获取应用实例
      const app = getApp();

      // 确保深色模式状态同步
      if (app && app.globalData) {
        const darkMode = app.globalData.darkMode || false;
        if (this.data.isDarkMode !== darkMode) {
          this.setData({ isDarkMode: darkMode });
        }
      }
    };

    // 重写onReady方法，页面首次渲染完成后立即应用深色模式修复
    page.onReady = function () {
      // 调用原始onReady
      if (originalOnReady) {
        originalOnReady.call(this);
      }

      // 获取应用实例
      const app = getApp();

      // 应用修复，使用递增时间间隔确保样式渐进渗透
      if (app && app.globalData) {
        const darkMode = app.globalData.darkMode || false;

        // 在不同时间点应用修复，以应对不同渲染时机
        [0, 50, 200, 500, 1000].forEach(delay => {
          setTimeout(() => {
            this._applyDarkModeStyles(darkMode);
          }, delay);
        });
      }
    };

    // 重写onShow方法，添加深色模式修复逻辑
    page.onShow = function () {
      // 调用原始onShow
      if (originalOnShow) {
        originalOnShow.call(this);
      }

      // 获取应用实例
      const app = getApp();

      // 确保深色模式状态与全局状态一致
      if (app && app.globalData && this.data.isDarkMode !== app.globalData.darkMode) {
        const darkMode = app.globalData.darkMode;

        // 更新数据
        this.setData({ isDarkMode: darkMode });

        // 检查是否有fixDarkMode方法，如果有则调用
        if (typeof this.fixDarkMode === 'function') {
          this.fixDarkMode(darkMode);
        } else {
          // 否则使用内置方法
          this._applyDarkModeStyles(darkMode);
        }
      }
    };

    // 添加内部工具方法，用于直接操作DOM应用深色模式样式
    page._applyDarkModeStyles = function (darkMode) {
      console.log('应用深色模式样式修复:', darkMode ? '深色' : '浅色');

      // 如果页面有自己的fixDarkMode方法，优先使用
      if (typeof this.fixDarkMode === 'function') {
        this.fixDarkMode(darkMode);
        return;
      }

      // 否则使用通用DOM操作方法
      if (wx.createSelectorQuery) {
        const query = wx.createSelectorQuery().in(this);

        // 修复用户信息背景
        query.selectAll('.user-info-bg, .user-info-section')
          .fields({ node: true, size: true })
          .exec(res => {
            if (res && res[0]) {
              res[0].forEach(item => {
                if (item && item.node) {
                  if (darkMode) {
                    // 深色模式样式
                    item.node.style.backgroundColor = '#222222';
                    item.node.style.backgroundImage = 'none';
                    // 添加dark-mode类
                    if (item.node.classList && !item.node.classList.contains('dark-mode')) {
                      item.node.classList.add('dark-mode');
                    }
                    // 设置数据属性
                    item.node.dataset.theme = 'dark';
                  } else {
                    // 浅色模式还原
                    if (item.node.classList) {
                      item.node.classList.remove('dark-mode');
                    }
                    item.node.dataset.theme = '';
                  }
                }
              });
            }
          });

        // 递归遍历所有子元素，确保深色模式类传递
        this._applyDarkModeToChildren(darkMode);
      }
    };

    // 递归处理子元素
    page._applyDarkModeToChildren = function (darkMode) {
      if (!wx.createSelectorQuery) return;

      wx.createSelectorQuery().in(this)
        .selectAll('.container *')
        .fields({ node: true })
        .exec(res => {
          if (res && res[0]) {
            res[0].forEach(item => {
              if (item && item.node && item.node.classList) {
                if (darkMode) {
                  if (!item.node.classList.contains('dark-mode')) {
                    item.node.classList.add('dark-mode');
                  }
                  item.node.dataset.theme = 'dark';
                } else {
                  item.node.classList.remove('dark-mode');
                  item.node.dataset.theme = '';
                }
              }
            });
          }
        });
    };

    return page;
  }
};
