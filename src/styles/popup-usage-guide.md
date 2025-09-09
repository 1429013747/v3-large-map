# 通用弹框样式使用指南

本指南介绍如何使用项目中统一的弹框样式系统，所有弹框样式都定义在 `src/styles/key-vessels.scss` 文件中。

## 📁 文件结构

```
src/styles/
├── key-vessels.scss      # 主要样式文件（包含通用弹框样式）
└── popup-usage-guide.md  # 本使用指南
```

## 🎨 样式系统概览

### 1. CSS 变量配置

可以通过修改 CSS 变量来自定义弹框的主题色彩：

```scss
:root {
  --popup-primary-color: #00FFFF;        // 主色调
  --popup-bg-gradient: linear-gradient(135deg, rgba(18, 28, 43, 0.95), rgba(26, 91, 146, 0.85));
  --popup-border-radius: 8px;            // 圆角大小
  --popup-text-color: #ffffff;           // 文字颜色
  --popup-border-color: rgba(0, 255, 255, 0.4);  // 边框颜色
  --popup-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); // 阴影效果
}
```

### 2. 基础弹框类

#### `.popup-base` - 通用弹框基础样式
包含背景、圆角、文字颜色等基础样式，适用于所有类型的弹框。

## 🏗️ 弹框组件结构

### 悬停弹框 (Hover Popup)

```vue
<template>
  <div class="custom-hover-popup">
    <div class="popup-content">
      <div class="item-header">
        <div class="item-name">项目名称</div>
        <div class="item-status status-tag">状态</div>
      </div>
      <div class="item-details">
        <div class="detail-item">
          <span class="detail-label">标签:</span>
          <span class="detail-value">值</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 选中弹框 (Selected Popup)

```vue
<template>
  <div class="custom-selected-popup">
    <div class="selected-popup-content">
      <div class="selected-item-header">
        <div class="selected-item-name">项目名称</div>
        <div class="selected-item-status status-tag">状态</div>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="selected-item-details">
        <div class="detail-item">
          <span class="detail-label">标签:</span>
          <span class="detail-value">值</span>
        </div>
      </div>
      <div class="action-area">
        <button class="action-btn success-btn" @click="handleSuccess">
          <span class="btn-icon">✓</span>
          <span class="btn-text">确认</span>
        </button>
      </div>
    </div>
  </div>
</template>
```

### Overlay 容器样式

为 OpenLayers 的 Overlay 容器应用基础样式：

```scss
.custom-hover-popup {
  @extend .popup-base;
  border: 1px solid var(--popup-border-color);
  box-shadow: var(--popup-shadow);
  padding: 16px;
  pointer-events: none;
  animation: keyVesselPopupFadeIn 0.3s ease-out;
}

.custom-selected-popup {
  @extend .popup-base;
  border: 2px solid rgba(0, 255, 255, 0.6);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  padding: 20px;
  pointer-events: auto;
  animation: keyVesselSelectedPopupFadeIn 0.4s ease-out;
}
```

## 🎯 组件类名说明

### 通用组件类
| 类名 | 用途 | 示例 |
|------|------|------|
| `.detail-item` | 键值对显示 | 船舶ID: 12345 |
| `.detail-label` | 键名样式 | "船舶ID:" |
| `.detail-value` | 值样式 | "12345" |
| `.status-tag` | 状态标签 | 正常/警告/异常 |
| `.close-btn` | 关闭按钮 | × |

### 操作按钮类
| 类名 | 用途 | 颜色 |
|------|------|------|
| `.action-btn` | 基础按钮样式 | 透明背景 |
| `.success-btn` | 成功类型按钮 | 绿色 |
| `.danger-btn` | 危险类型按钮 | 红色 |
| `.warning-btn` | 警告类型按钮 | 橙色 |
| `.info-btn` | 信息类型按钮 | 蓝色 |

## 📋 使用示例

### 1. 创建船舶弹框

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  vesselData: Object,
  popupType: String // 'hover' | 'selected'
})

const emit = defineEmits(['close', 'action'])
</script>

<template>
  <div class="vessel-popup" :class="{ 'selected-popup': popupType === 'selected' }">
    <div v-if="popupType === 'hover'" class="popup-content">
      <div class="vessel-header">
        <div class="vessel-name">{{ vesselData.name }}</div>
        <div class="vessel-status status-tag">{{ vesselData.status }}</div>
      </div>
      <div class="vessel-details">
        <div class="detail-item">
          <span class="detail-label">MMSI:</span>
          <span class="detail-value">{{ vesselData.mmsi }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="popupType === 'selected'" class="selected-popup-content">
      <div class="selected-vessel-header">
        <div class="selected-vessel-name">{{ vesselData.name }}</div>
        <div class="selected-vessel-status status-tag">{{ vesselData.status }}</div>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>
      <div class="action-area">
        <button class="action-btn success-btn" @click="emit('action', 'confirm')">
          <span class="btn-icon">✓</span>
          <span class="btn-text">确认</span>
        </button>
      </div>
    </div>
  </div>
</template>
```

### 2. 自定义主题色

如果需要为特定模块使用不同的主题色：

```scss
.risk-point-popup {
  --popup-primary-color: #ff6b6b;
  --popup-border-color: rgba(255, 107, 107, 0.4);
  @extend .popup-base;
}

.tech-defense-popup {
  --popup-primary-color: #2ed573;
  --popup-border-color: rgba(46, 213, 115, 0.4);
  @extend .popup-base;
}
```

## 🔧 自定义扩展

### 添加新的按钮类型

在 `key-vessels.scss` 的 `.action-area .action-btn` 部分添加：

```scss
// 自定义按钮类型
&.custom-btn {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
  border: 1px solid rgba(your-color, 0.5);

  &:hover {
    background: linear-gradient(135deg, #darker-color-1, #darker-color-2);
    box-shadow: 0 4px 12px rgba(your-color, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}
```

### 添加新的动画效果

```scss
@keyframes customPopupAnimation {
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.custom-animated-popup {
  animation: customPopupAnimation 0.5s ease-out;
}
```

## 📱 响应式支持

弹框样式已包含响应式设计，在小屏幕设备上会自动调整：

```scss
@media (max-width: 768px) {
  .popup-base {
    max-width: 90vw;
    font-size: 12px;
  }
}
```

## ✅ 最佳实践

1. **保持结构一致**: 使用标准的 HTML 结构和类名
2. **合理使用动画**: 不要过度使用动画效果
3. **适当的 z-index**: 确保弹框显示在正确的层级 (建议使用 9999)
4. **事件处理**: 正确设置 `pointer-events` 属性
5. **测试兼容性**: 在不同屏幕尺寸下测试弹框显示效果

## 🚀 快速开始

1. 在你的组件中引入样式：
```javascript
import '@/styles/key-vessels.scss'
```

2. 使用标准的弹框结构和类名

3. 根据需要自定义 CSS 变量

4. 享受统一的弹框体验！

---

如有问题或建议，请联系前端团队或查看项目文档。