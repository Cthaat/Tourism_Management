/**
 * 主题切换功能验证脚本
 * 用于验证多回调机制是否正常工作
 */

// 模拟微信小程序环境
const mockApp = {
  globalData: {
    darkMode: false,
    colorTheme: 'default'
  },

  // 实现多回调机制
  themeChangeCallbacks: [],

  watchThemeChange(callback) {
    if (!this.themeChangeCallbacks) {
      this.themeChangeCallbacks = [];
    }
    this.themeChangeCallbacks.push(callback);
    console.log(`注册回调 #${this.themeChangeCallbacks.length}`);

    return {
      darkMode: this.globalData.darkMode,
      colorTheme: this.globalData.colorTheme
    };
  },

  applyTheme() {
    console.log('=== 开始应用主题 ===');
    console.log('当前主题状态:', {
      darkMode: this.globalData.darkMode,
      colorTheme: this.globalData.colorTheme
    });
    console.log(`注册的回调数量: ${this.themeChangeCallbacks.length}`);

    if (this.themeChangeCallbacks && this.themeChangeCallbacks.length > 0) {
      this.themeChangeCallbacks.forEach((callback, index) => {
        try {
          console.log(`触发回调 #${index + 1}`);
          callback(this.globalData.darkMode, this.globalData.colorTheme);
        } catch (error) {
          console.error(`回调 #${index + 1} 执行失败:`, error);
        }
      });
    }
    console.log('=== 主题应用完成 ===\n');
  },

  toggleDarkMode() {
    this.globalData.darkMode = !this.globalData.darkMode;
    console.log(`深色模式切换为: ${this.globalData.darkMode ? '开启' : '关闭'}`);
    this.applyTheme();
    return this.globalData.darkMode;
  }
};

// 模拟多个页面注册回调
console.log('📱 开始测试多页面主题回调机制\n');

// 模拟 showcase 页面
mockApp.watchThemeChange((darkMode, colorTheme) => {
  console.log('📄 Showcase 页面收到主题变化:', { darkMode, colorTheme });
});

// 模拟 index 页面
mockApp.watchThemeChange((darkMode, colorTheme) => {
  console.log('🏠 Index 页面收到主题变化:', { darkMode, colorTheme });
});

// 模拟 profile 页面
mockApp.watchThemeChange((darkMode, colorTheme) => {
  console.log('👤 Profile 页面收到主题变化:', { darkMode, colorTheme });
});

// 模拟 settings 页面
mockApp.watchThemeChange((darkMode, colorTheme) => {
  console.log('⚙️ Settings 页面收到主题变化:', { darkMode, colorTheme });
});

// 测试主题切换
console.log('🔄 测试深色模式切换:\n');

console.log('1️⃣ 切换到深色模式:');
mockApp.toggleDarkMode();

console.log('2️⃣ 切换回浅色模式:');
mockApp.toggleDarkMode();

console.log('3️⃣ 再次切换到深色模式:');
mockApp.toggleDarkMode();

console.log('✅ 多回调机制测试完成！');
console.log('🎯 验证结果: 所有页面都应该收到了主题变化通知');
