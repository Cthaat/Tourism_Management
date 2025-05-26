# 添加景点功能说明

## 功能概述

新增的"添加景点"功能允许用户通过表单界面录入新的旅游景点信息，包含完整的景点数据字段和验证机制。

## 功能特性

### 📱 用户界面
- **表单分组**: 将表单字段按功能分为5个组：基本信息、位置信息、价格与评分、时间信息、联系信息、状态设置
- **深色模式支持**: 完全适配深色模式和浅色模式
- **主题色支持**: 支持天空蓝、中国红、默认绿三种主题颜色
- **响应式设计**: 适配不同屏幕尺寸的设备

### 🗺️ 地理位置选择
- **地址输入**: 支持手动输入详细地址
- **位置选择**: 通过微信提供的地图选择器获取精确经纬度
- **坐标显示**: 实时显示选择的经纬度坐标

### ⏰ 时间管理
- **开放时间**: 通过时间选择器设置景点开放时间
- **关闭时间**: 通过时间选择器设置景点关闭时间
- **时间验证**: 自动验证开放时间不能晚于关闭时间

### 📊 数据验证
- **必填字段检查**: 验证景点名称和位置等必填字段
- **数据格式验证**: 
  - 评分范围：0-5分
  - 价格范围：不能为负数
  - 网址格式：验证URL格式正确性
  - 时间逻辑：开放时间必须早于关闭时间

### 🌟 评分系统
- **滑块评分**: 使用滑块组件设置0-5分的评分
- **实时显示**: 实时显示当前选择的评分值
- **精度控制**: 支持0.1分精度的评分

## 数据字段说明

| 字段名称 | 字段标识 | 数据类型 | 是否必填 | 是否唯一 | 默认值 |
|---------|---------|---------|---------|---------|--------|
| 景点名称 | name | 文本 | 是 | 是 | "景点" |
| 景点描述 | description | 文本 | 否 | 否 | "景点描述" |
| 省份 | province | 文本 | 否 | 否 | "北京" |
| 分类ID | category_id | 文本 | 否 | 否 | "1" |
| 景点位置 | location | 地理位置 | 是 | 否 | 无 |
| 门票价格 | price | 数字 | 否 | 否 | 0 |
| 评分 | rating | 数字 | 否 | 否 | 0 |
| 开放时间 | opening_time | 时间 | 否 | 否 | 28800000(08:00) |
| 关闭时间 | closing_time | 时间 | 否 | 否 | 64800000(18:00) |
| 最佳旅游季节 | best_season | 数字 | 否 | 否 | 0(春季) |
| 联系电话 | phone | 文本 | 否 | 否 | "4001234567" |
| 官方网站 | website | 网址 | 否 | 否 | "https://ys.mihoyo.com/" |
| 状态 | status | 布尔值 | 否 | 否 | true(正常) |
| 景点ID | id | 自动编号 | 否 | 是 | 自动生成 |

## 页面访问路径

1. **从个人中心进入**: 
   - 打开微信小程序
   - 切换到"个人中心"标签页
   - 点击"添加景点"菜单项

2. **直接导航访问**:
   ```javascript
   wx.navigateTo({
     url: '/pages/add-spot/add-spot'
   })
   ```

## 云函数支持

### spotManage云函数
位置：`cloudfunctions/spotManage/index.js`

支持的操作：
- `add`: 添加景点
- `update`: 更新景点
- `delete`: 删除景点
- `get`: 获取单个景点
- `list`: 获取景点列表

### API封装
位置：`miniprogram/server/SpotManageApi.js`

提供的方法：
- `SpotManageApi.addSpot(spotData)`: 添加景点
- `SpotManageApi.updateSpot(spotData)`: 更新景点
- `SpotManageApi.deleteSpot(spotId)`: 删除景点
- `SpotManageApi.getSpot(spotId)`: 获取景点
- `SpotManageApi.getSpotList(params)`: 获取景点列表
- `SpotManageApi.validateSpotData(spotData)`: 验证景点数据

## 使用示例

### 添加景点示例
```javascript
const spotData = {
  name: "天安门广场",
  description: "中华人民共和国首都北京的城市广场",
  province: "北京",
  category_id: "4",
  location: {
    address: "北京市东城区天安门广场",
    geopoint: {
      type: "Point",
      coordinates: [116.397477, 39.909187]
    }
  },
  price: 0,
  rating: 4.8,
  opening_time: 18000000, // 05:00
  closing_time: 79200000, // 22:00
  best_season: 2, // 秋季
  phone: "010-12345678",
  website: "https://example.com",
  status: true
}

const result = await SpotManageApi.addSpot(spotData)
if (result.success) {
  console.log('添加成功:', result.data)
} else {
  console.error('添加失败:', result.message)
}
```

## 注意事项

1. **权限要求**: 需要用户授权位置信息权限才能使用地图选择功能
2. **网络连接**: 需要确保设备有良好的网络连接才能正常提交数据
3. **数据唯一性**: 景点名称必须唯一，系统会自动检查重复
4. **时间格式**: 时间以毫秒为单位存储，从00:00开始计算

## 文件结构

```
pages/add-spot/
├── add-spot.js                    # 页面逻辑文件
├── add-spot.wxml                  # 页面结构文件
├── add-spot.wxss                  # 页面样式文件
├── add-spot-wxa-auto-dark.wxss    # 深色模式样式文件
└── add-spot.json                  # 页面配置文件

server/
└── SpotManageApi.js               # API接口封装

cloudfunctions/spotManage/
├── index.js                       # 云函数主文件
├── config.json                    # 云函数配置
└── package.json                   # 依赖配置
```
