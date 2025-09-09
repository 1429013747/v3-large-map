# 通用面板样式使用指南

## 概述

`panel-common.scss` 提供了一套用于侧边面板和信息展示面板的通用样式。这些样式已经从风险点画像面板中抽离并标准化，可以在其他类似的面板组件中复用。

## 使用方法

### 1. 导入样式
```scss
@import '@/styles/panel-common.scss';
```

### 2. 基本面板结构
```vue
<template>
  <div class="your-panel-name common-panel">
    <!-- 面板头部 -->
    <div class="common-panel-header">
      <h3 class="panel-title">
        标题
      </h3>
      <button class="close-btn" @click="handleClose">
        ×
      </button>
    </div>

    <!-- 面板内容 -->
    <div class="common-panel-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="common-loading-container">
        <div class="common-loading-spinner" />
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="common-error-container">
        <div class="common-error-icon">
          ⚠️
        </div>
        <p>{{ error }}</p>
        <button class="common-retry-btn" @click="retry">
          重试
        </button>
      </div>

      <!-- 正常内容 -->
      <template v-else>
        <!-- 内容区块 -->
        <div class="common-section">
          <div class="section-header" @click="toggleSection('section1')">
            <svg><!-- 图标 --></svg>
            <h4>区块标题</h4>
            <svg class="expand-icon" :class="{ expanded: expandedSections.has('section1') }">
              <!-- 展开图标 -->
            </svg>
          </div>
          <div v-if="expandedSections.has('section1')" class="section-content">
            <!-- 区块内容 -->
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 已经全局引用了，不需要在引用了
// @import '@/styles/panel-common.scss';

.your-panel-name {
  // 面板特定的样式
  width: 486px;
  height: 100%;
}
</style>
```

## 可用样式类

### 面板基础样式
- `.common-panel` - 面板基础容器样式
- `.common-panel-header` - 面板头部样式
- `.common-panel-content` - 面板内容区域样式

### 状态样式
- `.common-loading-container` - 加载状态容器
- `.common-loading-spinner` - 加载动画
- `.common-error-container` - 错误状态容器
- `.common-error-icon` - 错误图标
- `.common-retry-btn` - 重试按钮

### 区块样式
- `.common-section` - 通用区块容器
- `.common-info-section` - 信息区块容器
- `.section-header` - 区块头部
- `.section-content` - 区块内容

### 布局样式
- `.common-info-two-columns` - 双列信息布局
- `.common-timeline` - 时间轴样式
- `.common-device-list` - 设备列表样式
- `.common-human-defense-info` - 人防措施样式
- `.common-record-content` - 记录内容样式
- `.common-video-content` - 视频内容样式

### 按钮样式
- `.common-btn` - 通用按钮
- `.common-btn.btn-small` - 小号按钮

## CSS变量

样式文件使用了CSS变量，可以根据需要自定义：

```css
:root {
  --panel-primary-color: #3FDAFF;
  --panel-bg-dark: #121C2B;
  --panel-text-primary: #ffffff;
  /* ... 更多变量 */
}
```

## 时间轴使用示例

```vue
<div class="common-timeline">
  <div class="timeline-item"
       v-for="item in timelineData"
       :key="item.id"
       :class="{ expanded: expandedItems.has(item.id) }">
    <div class="timeline-header" @click="toggleItem(item.id)">
      <div class="timeline-time">
        <svg><circle cx="6" cy="6" r="2" fill="currentColor"/></svg>
        {{ item.time }}
      </div>

      <div class="timeline-level" :class="item.levelClass">
        {{ item.level }}
      </div>

      <span class="expand-toggle">
 ▼
</span>

    </div>
    <div v-if="expandedItems.has(item.id)" class="timeline-content">
      <!-- 时间轴项目内容 -->
    </div>
  </div>
</div>
```

## 设备列表使用示例

```vue
<div class="common-device-list">
  <div class="device-item" v-for="device in devices" :key="device.id">
    <div class="device-header">
      <div class="device-info">
        <span class="device-id">{{ device.id }}</span>
        <span class="device-name">{{ device.name }}</span>
        <span class="device-status" :class="getStatusClass(device.status)">
          <svg><circle cx="4" cy="4" r="3" fill="currentColor"/></svg>
        </span>
      </div>

      <button class="device-action-btn"
              :class="device.action === 'control' ? 'control-btn' : 'view-btn'"
              @click="handleAction(device)"
>
        {{ device.action === 'control' ? '远程控制' : '视频查看' }}
      </button>

    </div>
    <div class="device-details">
      <div class="device-detail-item">
        <span class="device-label">设备类型:</span>
        <span class="device-value">{{ device.type }}</span>
      </div>
    </div>
  </div>
</div>
```

## 注意事项

1. 使用时需要确保已经正确导入样式文件
2. 面板容器需要同时应用 `common-panel` 和自定义类名
3. CSS变量允许灵活自定义主题色彩
4. 时间轴和设备列表需要相应的JavaScript逻辑配合使用
5. 样式已经包含响应式设计和动画效果

## 扩展

如果需要自定义某些样式，建议：
1. 优先使用CSS变量覆盖
2. 在组件的scoped样式中覆盖特定样式
3. 避免直接修改通用样式文件

## 已应用的组件

- `RiskPointProfilePanel.vue` - 风险点画像面板（已重构完成）

## 后续可应用的场景

- 其他侧边栏面板
- 弹窗内容面板
- 详情展示面板
- 数据展示面板
