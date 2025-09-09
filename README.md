# V3-Large 地图项目

这是一个基于Vue3和OpenLayers的地图应用项目，采用模块化架构设计，具有良好的扩展性。

## 项目特点

- **Vue3最佳实践**: 使用Composition API和hooks进行状态管理
- **模块化设计**: 地图功能和图层管理分离，便于维护和扩展
- **组件化开发**: 图层控制等功能独立封装为组件

## 技术栈

- Vue 3 + Composition API
- OpenLayers (地图库)
- SuperMap iClient (扩展功能)
- Sass (样式预处理)
- Vite (构建工具)

## 项目结构


```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览生产构建
npm run preview

# 运行ESLint
npm run lint

# 修复ESLint问题
npm run lint:fix
```

## 项目结构

```
├── public/             # 公共静态资源
├── src/
│   ├── assets/         # 项目资源
│   ├── components/     # 公共组件
│   ├── composables/    # 组合式函数
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia状态
│   ├── styles/         # 全局样式
│   ├── utils/          # 工具函数
│   ├── views/          # 页面组件
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── .env                # 环境变量
├── .env.production     # 生产环境变量
├── index.html          # HTML入口
└── vite.config.js      # Vite配置
```

## 代码规范

本项目使用ESLint进行代码规范检查，确保代码质量和一致性。
