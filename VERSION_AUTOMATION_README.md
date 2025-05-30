# 🤖 版本管理自动化系统

## 🎯 系统概述

本项目已配置完整的版本管理自动化系统，支持一键发布版本并自动更新所有相关文件。

## 🚀 快速使用

### 发布新版本
```bash
# 方式1: 使用发布脚本（推荐）
node scripts/release.js 1.0.4

# 方式2: 手动创建标签
git tag v1.0.4
git push origin v1.0.4
```

### 自动执行的操作
当推送版本标签时，GitHub Actions会自动：
1. ✅ 更新 `miniprogram/config/version.js` 中的版本号
2. ✅ 更新 `README.md` 中的版本徽章
3. ✅ 提交更改到主分支
4. ✅ 创建GitHub Release

## 📁 核心文件

| 文件 | 作用 |
|------|------|
| `miniprogram/config/version.js` | 版本配置中心 |
| `.github/workflows/update-version.yml` | GitHub Actions工作流 |
| `scripts/release.js` | 本地版本发布脚本 |
| `scripts/update-readme-version.js` | README版本同步脚本 |
| `scripts/test-version-system.js` | 系统测试脚本 |

## 🔧 系统测试

```bash
# 测试整个系统
node scripts/test-version-system.js

# 单独更新README版本
npm run update-version
```

## 📝 当前版本
- **应用版本**: v1.0.3
- **系统状态**: ✅ 所有组件正常工作

## 🔗 相关文档
- [版本管理自动化指南](docs/版本管理自动化指南.md)
- [版本发布完整示例](docs/版本发布完整示例.md)

---
*此系统由Tourism_Management开发团队构建 © 2025*
