# 旅行计划功能集成测试指南

## 测试概述
本指南用于验证旅行计划功能在个人中心页面的完整集成是否正常工作。

## 完成的功能

### 1. Profile.js 数据属性添加 ✅
- ✅ 添加了 `planCount: 0` 数据属性
- ✅ 支持旅行计划数量徽标显示

### 2. UpdateCounters 函数更新 ✅
```javascript
updateCounters() {
  const favorites = wx.getStorageSync('favorites') || [];
  const bookings = wx.getStorageSync('bookings') || [];
  const travelPlans = wx.getStorageSync('travelPlans') || [];

  this.setData({
    favoriteCount: favorites.length,
    bookingCount: bookings.length,
    planCount: travelPlans.length  // ✅ 新增旅行计划数量
  });
}
```

### 3. NavigateToPage 函数优化 ✅
- ✅ 修复了重复URL条目问题
- ✅ 添加了专门的旅行计划导航处理
```javascript
} else if (url === '/pages/travel-plan/travel-plan') {
  // 旅行计划
  wx.navigateTo({ url });
}
```

### 4. Profile.wxml 菜单项配置 ✅
- ✅ 旅行计划菜单项已存在
- ✅ 包含planCount徽标显示
- ✅ 正确的点击事件绑定

### 5. 旅行计划页面完整性 ✅
- ✅ travel-plan.js - 完整的业务逻辑
- ✅ travel-plan.wxml - 完整的页面布局
- ✅ travel-plan.wxss - 完整的样式文件
- ✅ app.json中正确注册

## 测试步骤

### 手动测试流程

1. **打开微信开发者工具**
   - 导入项目：`c:\Code\Tourism_Management`
   - 确认项目正常编译无错误

2. **测试个人中心页面**
   - 导航到个人中心页面（底部TabBar第3个图标）
   - 检查是否显示"旅行计划"菜单项
   - 验证旅行计划图标为 🗺️

3. **测试planCount显示**
   - 在控制台执行：`wx.setStorageSync('travelPlans', [{id: 1, title: 'test'}])`
   - 刷新个人中心页面
   - 检查旅行计划菜单项右上角是否显示数字徽标"1"

4. **测试导航功能**
   - 点击"旅行计划"菜单项
   - 验证是否正确跳转到旅行计划页面
   - 检查页面是否正常显示，包含"我的旅行计划"标题

5. **测试旅行计划页面功能**
   - 检查页面布局是否完整
   - 点击"新建计划"按钮
   - 验证功能是否正常工作

## 预期结果

### ✅ 成功指标
1. 个人中心页面正常显示旅行计划菜单项
2. planCount徽标正确显示旅行计划数量
3. 点击菜单项能正确导航到旅行计划页面
4. 旅行计划页面正常显示和运行
5. 没有编译错误或运行时错误

### ❌ 失败情况及解决方案
1. **菜单项不显示** - 检查profile.wxml文件
2. **徽标不显示** - 检查planCount数据绑定
3. **导航失败** - 检查navigateToPage函数
4. **页面空白** - 检查travel-plan页面文件完整性
5. **编译错误** - 检查代码语法和文件路径

## 代码完整性检查

### Profile.js 关键部分
```javascript
// ✅ 数据属性
data: {
  planCount: 0,  // 旅行计划数量
  // ...其他属性
}

// ✅ 更新计数器
updateCounters() {
  const travelPlans = wx.getStorageSync('travelPlans') || [];
  this.setData({
    planCount: travelPlans.length
  });
}

// ✅ 导航处理
navigateToPage(e) {
  const url = e.currentTarget.dataset.url;
  if (url === '/pages/travel-plan/travel-plan') {
    wx.navigateTo({ url });
  }
  // ...其他处理
}
```

## 总结
旅行计划功能已成功集成到个人中心页面，包括：
- ✅ 数据层：planCount属性和updateCounters函数
- ✅ 视图层：菜单项和徽标显示
- ✅ 交互层：导航功能
- ✅ 页面层：完整的旅行计划页面

所有核心功能已实现，可以进行手动测试验证。
