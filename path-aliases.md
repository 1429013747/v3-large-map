# 路径别名配置说明

本项目已配置了路径别名，方便在代码中快速引用文件。

## 配置的文件

- `jsconfig.json` - JavaScript/TypeScript 路径别名配置
- `tsconfig.json` - TypeScript 类型支持配置
- `.vscode/settings.json` - VSCode IDE 配置
- `vite.config.js` - Vite 构建工具配置

## 可用的路径别名

| 别名 | 实际路径 | 说明 |
|------|----------|------|
| `@/*` | `src/*` | 项目根目录 |
| `~/*` | `src/assets/*` | 静态资源目录 |
| `@/components/*` | `src/components/*` | 组件目录 |
| `@/views/*` | `src/views/*` | 页面目录 |
| `@/layouts/*` | `src/layouts/*` | 布局组件目录 |
| `@/stores/*` | `src/stores/*` | 状态管理目录 |
| `@/utils/*` | `src/utils/*` | 工具函数目录 |
| `@/api/*` | `src/api/*` | API 接口目录 |
| `@/styles/*` | `src/styles/*` | 样式文件目录 |
| `@/composables/*` | `src/composables/*` | 组合式函数目录 |
| `@/assets/*` | `src/assets/*` | 静态资源目录 |
| `@/router/*` | `src/router/*` | 路由配置目录 |

## 使用示例

### 导入组件
```javascript
// 之前
import MapLayout from '../../../layouts/MapLayout.vue'

// 现在
import MapLayout from '@/layouts/MapLayout.vue'
```

### 导入工具函数
```javascript
// 之前
import { formatDate } from '../../../utils/formatDate.js'

// 现在
import { formatDate } from '@/utils/formatDate.js'
```

### 导入样式
```javascript
// 之前
import '@/styles/global.scss'

// 现在
import '@/styles/global.scss'
```

### 导入静态资源
```javascript
// 之前
import logo from '../../../assets/logo.png'

// 现在
import logo from '@/assets/logo.png'
// 或者
import logo from '~/logo.png'
```

## IDE 支持

配置完成后，IDE 应该能够：

1. **自动补全** - 输入 `@/` 时会显示可用的路径
2. **跳转定义** - Ctrl+Click 可以跳转到文件
3. **重构支持** - 重命名文件时会自动更新引用
4. **类型检查** - TypeScript 会正确识别路径别名

## 注意事项

1. 确保 IDE 已安装 Vue 相关插件
2. 重启 IDE 以应用新配置
3. 路径别名区分大小写
4. 建议使用 `@/` 作为主要别名，`~/` 仅用于静态资源

## 故障排除

如果路径别名不工作：

1. 检查 `jsconfig.json` 或 `tsconfig.json` 是否正确
2. 重启 IDE
3. 检查文件路径是否正确
4. 确保没有语法错误
