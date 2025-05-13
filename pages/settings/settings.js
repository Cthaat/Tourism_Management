/**
 * @fileoverview 旅游管理微信小程序设置页面逻辑
 * @description 此文件包含设置页面的数据结构和交互逻辑，实现了深色模式切换、主题颜色设置、
 *              语言选择、通知设置、缓存管理等功能
 * @version 1.0.0
 * @date 2025-05-13
 * @author Tourism_Management开发团队
 * 
 * @功能列表
 * - 通知设置（推送、声音、振动）
 * - 偏好设置（语言、主题颜色、深色模式）
 * - 数据与存储管理（自动清理、缓存清除）
 * - 其他功能（意见反馈、关于我们、版本信息）
 */

// 获取应用实例，用于访问全局状态和方法
const app = getApp();

/**
 * 设置页面对象
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 设置项数组，包含所有设置分组和具体设置项
    settings: [
      {
        id: 'notification',      // 设置分组ID：通知设置
        name: '通知设置',        // 设置分组名称
        items: [                 // 该分组下的具体设置项
          { id: 'push', name: '推送通知', type: 'switch', value: true },  // 推送通知开关
          { id: 'sound', name: '通知声音', type: 'switch', value: true }, // 通知声音开关
          { id: 'vibrate', name: '振动', type: 'switch', value: true }    // 振动开关
        ]
      }, {
        id: 'preference',       // 设置分组ID：偏好设置
        name: '偏好设置',       // 设置分组名称
        items: [                // 该分组下的具体设置项
          { id: 'language', name: '语言', type: 'select', value: '简体中文', options: ['简体中文', '繁体中文', 'English'] }, // 语言选择器
          { id: 'theme', name: '主题', type: 'select', value: '默认绿', options: ['默认绿', '天空蓝', '中国红'] },          // 主题选择器
          { id: 'darkMode', name: '深色模式', type: 'switch', value: false }                                              // 深色模式开关
        ]
      },
      {
        id: 'data',             // 设置分组ID：数据与存储
        name: '数据与存储',     // 设置分组名称
        items: [                // 该分组下的具体设置项
          { id: 'autoClean', name: '自动清理缓存', type: 'switch', value: false },  // 自动清理缓存开关
          { id: 'cache', name: '清除缓存', type: 'button', value: '0.00MB' }        // 清除缓存按钮
        ]
      },
      {
        id: 'about',            // 设置分组ID：其他
        name: '其他',           // 设置分组名称
        items: [                // 该分组下的具体设置项
          { id: 'feedback', name: '意见反馈', type: 'link', path: '/pages/feedback/feedback' },  // 意见反馈链接
          { id: 'about', name: '关于我们', type: 'link', path: '/pages/about/about' },           // 关于我们链接
          { id: 'version', name: '当前版本', type: 'text', value: 'v1.0.0' }                    // 版本信息文本
        ]
      }],
    isDarkMode: false,         // 深色模式状态变量，用于控制UI显示
    colorTheme: '默认绿',      // 颜色主题状态变量，用于控制主题颜色
    // 主题选项数组，用于管理主题选择状态
    themes: [
      { id: 'default', name: '默认绿', checked: true },   // 默认主题（绿色）
      { id: 'blue', name: '天空蓝', checked: false },     // 蓝色主题
      { id: 'red', name: '中国红', checked: false }       // 红色主题
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   * 初始化设置状态，获取缓存大小，设置主题监听
   */
  onLoad() {
    // 从全局状态获取当前深色模式和颜色主题状态
    const darkMode = app.globalData.darkMode;
    const colorTheme = app.globalData.colorTheme;

    // 设置初始状态
    this.setData({
      'settings[1].items[2].value': darkMode,    // 更新深色模式开关状态
      'settings[1].items[1].value': colorTheme,  // 更新主题颜色选择器状态
      isDarkMode: darkMode,                      // 更新页面深色模式状态
      colorTheme: colorTheme                     // 更新页面主题颜色状态
    });

    // 初始化缓存大小显示
    this.getCacheSize();

    // 监听全局主题变化事件
    app.watchThemeChange((darkMode, colorTheme) => {
      this.setData({
        isDarkMode: darkMode,                     // 更新深色模式状态
        'settings[1].items[2].value': darkMode,   // 更新深色模式开关值
        colorTheme: colorTheme,                   // 更新主题颜色状态
        'settings[1].items[1].value': colorTheme  // 更新主题颜色选择器值
      });

      // 更新主题选中状态
      this.updateThemeSelection(colorTheme);
    });

    // 初始化时更新主题选中状态
    this.updateThemeSelection(app.globalData.colorTheme);
  },
  /**
   * 生命周期函数--监听页面显示
   * 每次页面显示时更新主题状态，确保与全局状态一致
   */
  onShow() {
    // 每次页面显示时从全局状态更新深色模式和颜色主题状态
    this.setData({
      isDarkMode: app.globalData.darkMode,                    // 更新页面深色模式状态
      'settings[1].items[2].value': app.globalData.darkMode,  // 更新深色模式开关值
      colorTheme: app.globalData.colorTheme,                  // 更新页面主题颜色状态
      'settings[1].items[1].value': app.globalData.colorTheme // 更新主题颜色选择器值
    });

    // 更新主题选中状态
    this.updateThemeSelection(app.globalData.colorTheme);

    // 确保导航栏样式与当前主题一致
    app.updateNavBarStyle();
  },

  /**
   * 更新主题选中状态
   * @param {string} colorTheme 当前选中的主题名称
   */
  updateThemeSelection(colorTheme) {
    // 遍历主题数组，更新选中状态
    const themes = this.data.themes.map(theme => {
      return {
        ...theme,
        checked: theme.name === colorTheme // 设置当前主题为选中状态
      };
    });
    this.setData({ themes });
  },
  /**
   * 切换开关设置处理函数
   * @param {Object} e 事件对象
   */
  switchChange(e) {
    // 获取设置项的索引位置
    const { settingindex, itemindex } = e.currentTarget.dataset;
    // 构建设置值的路径
    const settingPath = `settings[${settingindex}].items[${itemindex}].value`;
    // 获取开关的新状态
    const newValue = e.detail.value;

    // 特殊处理深色模式切换
    if (settingindex === 1 && itemindex === 2) {
      // 调用应用实例方法切换全局深色模式状态
      const isDarkMode = app.toggleDarkMode();

      // 更新本地状态
      this.setData({
        [settingPath]: isDarkMode,  // 更新深色模式开关值
        isDarkMode: isDarkMode      // 更新页面深色模式状态
      });
    } else {
      // 处理其他开关设置
      this.setData({
        [settingPath]: newValue     // 更新对应设置项的值
      });
    }

    // 显示设置已保存的提示
    // 注意：在实际应用中，这里会保存设置到本地存储
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1000
    });
  },
  /**
   * 打开选择器处理函数
   * @param {Object} e 事件对象
   */
  openPicker(e) {
    // 获取设置项的索引位置
    const { settingindex, itemindex } = e.currentTarget.dataset;
    // 获取当前设置项
    const item = this.data.settings[settingindex].items[itemindex];

    // 显示操作菜单，用于选择
    wx.showActionSheet({
      itemList: item.options,  // 选项列表
      success: (res) => {
        // 构建设置值的路径
        const settingPath = `settings[${settingindex}].items[${itemindex}].value`;
        // 获取选中的值
        const selectedValue = item.options[res.tapIndex];

        // 特殊处理主题颜色切换
        if (settingindex === 1 && itemindex === 1) {
          // 调用应用实例方法切换全局主题颜色
          const newColorTheme = app.changeColorTheme(selectedValue);

          // 更新本地状态
          this.setData({
            [settingPath]: newColorTheme,   // 更新主题颜色选择器值
            colorTheme: newColorTheme       // 更新页面主题颜色状态
          });

          // 更新主题选中状态
          this.updateThemeSelection(newColorTheme);
        } else {
          // 处理其他选择器设置
          this.setData({
            [settingPath]: selectedValue     // 更新对应设置项的值
          });
        }

        // 显示设置已保存的提示
        wx.showToast({
          title: '设置已保存',
          icon: 'success',
          duration: 1000
        });
      }
    });
  },
  /**
   * 计算缓存大小
   * 获取并显示当前应用缓存占用的空间
   */
  getCacheSize() {
    // 注意：在实际应用中，这里会调用相关API计算缓存大小
    // 这里简单模拟一个随机值用于演示
    const cacheSize = (Math.random() * 5).toFixed(2) + 'MB';

    // 更新缓存大小显示
    this.setData({
      'settings[2].items[1].value': cacheSize
    });
  },

  /**
   * 清理缓存处理函数
   * 清除应用的缓存数据
   */
  clearCache() {
    // 显示确认对话框
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          // 显示清理中的加载提示
          wx.showLoading({
            title: '清理中...',
          });

          // 模拟清理过程（实际应用中会调用缓存清理API）
          setTimeout(() => {
            // 隐藏加载提示
            wx.hideLoading();

            // 更新缓存大小显示为0
            this.setData({
              'settings[2].items[1].value': '0.00MB'
            });

            // 显示清理完成提示
            wx.showToast({
              title: '清理完成',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },
  /**
   * 页面导航处理函数
   * 跳转到指定的页面路径
   * @param {Object} e 事件对象
   */
  navigate(e) {
    // 获取目标页面路径
    const { path } = e.currentTarget.dataset;

    // 跳转到目标页面
    wx.navigateTo({
      url: path
    });
  }
});