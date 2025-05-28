# Google Maps API 密码认证使用指南

## 📋 API 基本信息

- **名称**: Google Maps API 代理服务器
- **版本**: 1.0.0
- **描述**: 为微信小程序提供Google Maps API代理服务
- **基础URL**: `https://googlemap.edge2.xyz`
- **访问密码**: `123456..a`

## 🔐 密码认证

### 认证要求
所有API端点都需要提供正确的密码才能访问（除了健康检查端点）。

### 支持的认证方法

1. **查询参数方式** ⭐ （当前使用）
   ```
   ?password=123456..a
   ```

2. **请求头方式**
   ```
   X-API-Password: 123456..a
   ```

3. **Bearer Token方式**
   ```
   Authorization: Bearer 123456..a
   ```

4. **请求体方式**
   ```json
   {"password": "123456..a"}
   ```

## 🌐 支持的API端点

### 地理编码相关
- `GET /geocode/json` - 地理编码（地址转坐标）
- `POST /geocode/json` - 地理编码（支持请求体）

### 地点搜索相关
- `GET /place/autocomplete/json` - 地址自动完成
- `POST /place/autocomplete/json` - 地址自动完成（支持请求体）
- `GET /place/details/json` - 地点详情
- `POST /place/details/json` - 地点详情（支持请求体）
- `GET /place/nearbysearch/json` - 附近搜索
- `POST /place/nearbysearch/json` - 附近搜索（支持请求体）
- `GET /place/textsearch/json` - 文本搜索
- `POST /place/textsearch/json` - 文本搜索（支持请求体）

### 距离和路线相关
- `GET /distancematrix/json` - 距离矩阵
- `POST /distancematrix/json` - 距离矩阵（支持请求体）
- `GET /directions/json` - 路线规划
- `POST /directions/json` - 路线规划（支持请求体）

### 系统状态相关
- `GET /health` - 健康检查（无需密码）
- `GET /api-status` - API状态检查（无需密码）

## 📱 微信小程序集成

### 使用方式

您的微信小程序已经集成了密码认证功能，使用方法如下：

```javascript
// 1. 创建API实例
const googleMapsApi = new GoogleMapsApi('your-api-key');

// 2. 调用地理编码
googleMapsApi.geocode('北京天安门', 'zh-CN', 'CN')
  .then(result => {
    if (result.success) {
      console.log('坐标:', result.data.latitude, result.data.longitude);
      console.log('格式化地址:', result.data.formattedAddress);
    }
  })
  .catch(error => {
    console.error('地理编码失败:', error);
  });

// 3. 调用地点搜索
googleMapsApi.searchPlaces('北京餐厅', '39.9042,116.4074', 5000, 'zh-CN')
  .then(result => {
    if (result.success) {
      console.log('搜索结果:', result.data.places);
    }
  })
  .catch(error => {
    console.error('地点搜索失败:', error);
  });
```

### 自动密码认证

所有API调用都会自动添加密码参数，您无需手动处理认证逻辑。

## 🔧 请求示例

### 地理编码示例
```
GET https://googlemap.edge2.xyz/geocode/json?address=北京天安门&language=zh-CN&password=123456..a
```

### 地点搜索示例
```
GET https://googlemap.edge2.xyz/place/textsearch/json?query=北京餐厅&location=39.9042,116.4074&radius=5000&language=zh-CN&password=123456..a
```

### 路线规划示例
```
GET https://googlemap.edge2.xyz/directions/json?origin=北京天安门&destination=北京故宫&mode=walking&language=zh-CN&password=123456..a
```

## 📊 API参数说明

### 地理编码参数
- `address` (必需) - 要地理编码的地址
- `language` (可选) - 返回结果的语言，默认 zh-CN
- `region` (可选) - 区域代码，默认 CN
- `password` (必需) - API访问密码

### 地点搜索参数
- `query` (必需) - 搜索查询文本
- `location` (可选) - 搜索中心点坐标
- `radius` (可选) - 搜索半径（米）
- `language` (可选) - 返回结果的语言
- `password` (必需) - API访问密码

### 路线规划参数
- `origin` (必需) - 起点
- `destination` (必需) - 终点
- `mode` (可选) - 出行方式：driving, walking, bicycling, transit
- `language` (可选) - 返回结果的语言
- `password` (必需) - API访问密码

## ⚠️ 重要提醒

1. **密码安全**: 请妥善保管API访问密码 `123456..a`
2. **请求频率**: 注意控制API请求频率，避免过于频繁的调用
3. **错误处理**: 务必在代码中添加适当的错误处理逻辑
4. **网络超时**: API调用设置了5秒超时，超时后会自动重试备用服务

## 🔍 调试技巧

### 查看请求日志
在微信小程序开发者工具的控制台中，您可以看到详细的请求日志：

```
🌐 GoogleMapsApi 请求开始:
📍 端点: /geocode/json
📋 参数: {address: "北京天安门", language: "zh-CN"}
🔗 完整URL: https://googlemap.edge2.xyz/geocode/json?key=your-key&password=123456..a&address=北京天安门&language=zh-CN
⏰ 请求时间: 2024/5/27 下午7:08:02
```

### 常见错误处理

1. **密码错误**: 确认密码为 `123456..a`
2. **网络超时**: 检查网络连接状态
3. **API配额**: 检查Google Maps API配额使用情况

## 📞 技术支持

如遇问题，请检查：
1. 网络连接状态
2. API密码是否正确
3. 请求参数是否完整
4. 微信小程序网络权限配置

---

**最后更新**: 2025年5月27日  
**作者**: 高级中国全栈工程师
