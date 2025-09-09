# 深色表格主题使用说明

## 概述

`dark-table-theme.scss` 提供了一套完整的深色主题样式，特别适用于数据表格和弹窗界面，配色方案参考了现代化深色UI设计。

## 使用方法

### 1. 应用到 Modal 组件

```vue
<template>
  <Modal
    :open="visible"
    title="标题"
    wrap-class-name="dark-table-theme"
    @cancel="handleClose"
  >
    <!-- 内容 -->
  </Modal>
</template>
```

### 2. 应用到其他容器

```vue
<template>
  <div class="dark-table-theme">
    <!-- 表格或其他内容 -->
  </div>
</template>
```

### 3. Select 下拉菜单深色主题

```vue
<template>
  <Select
    v-model:value="value"
    popup-class-name="dark-dropdown"
    :options="options"
  />
</template>
```

### 4. DatePicker 日期选择器深色主题

```vue
<template>
  <div class="dark-table-theme">
    <!-- 基础日期选择器 -->
    <DatePicker
      v-model:value="date"
      placeholder="请选择日期"
    />

    <!-- 日期时间选择器 -->
    <DatePicker
      v-model:value="datetime"
      show-time
      placeholder="请选择日期时间"
    />

    <!-- 日期范围选择器 -->
    <RangePicker
      v-model:value="dateRange"
    />
  </div>
</template>
```

## 配色方案

基于 `rgba(15, 27, 47, 0.8)` 的半透明深蓝色主题：

| 颜色变量 | 值 | 说明 |
|---------|----|----|
| `--dark-bg-primary` | `rgba(15, 27, 47, 0.8)` | 主背景色（半透明深蓝） |
| `--dark-bg-secondary` | `rgba(25, 37, 57, 0.9)` | 次要背景色 |
| `--dark-bg-tertiary` | `rgba(35, 47, 67, 0.85)` | 第三级背景色 |
| `--dark-text-primary` | `#ffffff` | 主文字颜色 |
| `--dark-text-secondary` | `#b8c5d6` | 次要文字颜色 |
| `--dark-text-muted` | `#8b9bb3` | 弱化文字颜色 |
| `--dark-border` | `rgba(75, 85, 105, 0.6)` | 边框颜色（半透明） |
| `--dark-hover` | `rgba(45, 57, 77, 0.8)` | 悬停状态颜色 |
| `--dark-accent` | `#00d4ff` | 强调色（亮青色） |
| `--dark-accent-hover` | `#33ddff` | 强调色悬停状态 |
| `--dark-success` | `#52c41a` | 成功状态颜色 |
| `--dark-warning` | `#faad14` | 警告状态颜色 |
| `--dark-error` | `#ff4d4f` | 错误状态颜色 |

### 特殊效果

- **阴影效果**：使用轻量级 `box-shadow` 增强层次感
- **圆角设计**：统一使用 6px 圆角提升现代感
- **性能优化**：移除了 `backdrop-filter` 毛玻璃效果以确保流畅滚动

## 状态样式类

在使用状态显示时，可以直接使用以下CSS类：

```vue
<template>
  <span class="status-exception">异常</span>
  <span class="status-processing">处理中</span>
  <span class="status-resolved">已解决</span>
</template>
```

## 支持的组件

- Modal 弹窗
- Table 表格
- Form 表单
- Select 下拉选择器
- Input 输入框
- DatePicker 日期选择器
- Button 按钮
- Pagination 分页器

## CSS变量作用域

为了确保所有组件都能正确访问CSS变量，我们采用了以下策略：

1. **全局变量定义**：所有深色主题变量都定义在 `:root` 下，确保全局可访问
2. **脱离文档流的组件**：为下拉菜单等组件单独重新定义变量
3. **通用类**：提供 `.dark-theme-variables` 类用于其他需要深色主题的组件

## 性能优化

为了确保表格滚动的流畅性，本主题进行了以下性能优化：

1. **移除毛玻璃效果**：不使用 `backdrop-filter: blur()` 避免GPU性能消耗
2. **优化阴影效果**：使用轻量级的 `box-shadow` 替代复杂阴影
3. **精简过渡动画**：只对必要的属性添加 `transition` 效果
4. **减少重绘范围**：避免在表格行上使用复杂的视觉效果

## 注意事项

1. 确保在主样式文件中已导入 `dark-table-theme.scss`
2. Select 组件的下拉菜单需要单独设置 `popupClassName="dark-dropdown"`
3. 对于其他可能脱离文档流的组件（如Tooltip、Popover），可以添加 `dark-theme-variables` 类
4. 该主题使用了 `!important` 来确保样式优先级，请谨慎覆盖
5. 建议在深色背景的容器中使用此主题以获得最佳视觉效果
6. 如需更强的视觉效果可考虑添加毛玻璃效果，但可能影响性能

## 脱离文档流组件的处理

```vue
<!-- Select 下拉菜单 -->
<Select popupClassName="dark-dropdown" />

<!-- SuperTable 工具栏 Dropdown -->
<Dropdown overlay-class-name="dark-dropdown">
  <Button>工具菜单</Button>
</Dropdown>

<!-- SuperTable 工具栏 Tooltip -->
<Tooltip overlay-class-name="dark-tooltip" title="提示内容">
  <Button>悬停显示</Button>
</Tooltip>

<!-- 其他 Tooltip -->
<Tooltip overlay-class-name="dark-theme-variables" title="提示内容">
  <Button>悬停显示</Button>
</Tooltip>

<!-- Popover -->
<Popover overlay-class-name="dark-theme-variables" content="弹出内容">
  <Button>点击显示</Button>
</Popover>
```

## SuperTable 深色主题特性

SuperTable 组件在深色主题下包含以下特性：

### 工具栏样式
- 半透明深蓝色背景
- 工具按钮悬停效果
- 圆角设计与毛玻璃效果

### Alert 提示条
- 深色背景配色
- 青色强调色图标
- 链接悬停效果

### 表格整体布局
- 工具栏与表格无缝连接
- 统一的边框和圆角设计
- 层次化的背景色

**注意**：SuperTable 的下拉菜单和 Tooltip 需要手动添加对应的 CSS 类名：
- 下拉菜单：`overlay-class-name="dark-dropdown"`
- 提示框：`overlay-class-name="dark-tooltip"`

## 示例

参考 `src/views/home/components/ExceptionDeviceList.vue` 组件的完整实现示例。
