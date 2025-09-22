# Location Store 使用指南

## 概述

Location Store 用于管理应用中的区域选择状态，支持数据持久化，所有组件都可以共享当前选择的区域信息。

## 使用方法

### 1. 在组件中直接使用 Store

```vue
<script setup>
import { useLocationStore } from '@/stores/location'

const locationStore = useLocationStore()

// 获取当前位置代码
console.log(locationStore.currentLocation) // '330225'

// 获取当前位置标签
console.log(locationStore.getCurrentLocationLabel()) // '象山县'

// 切换位置（通过code）
locationStore.setCurrentLocation('330225001')

// 切换位置（通过value）
locationStore.setCurrentLocationByValue('丹东街道')

// 获取当前位置详细信息
const currentInfo = locationStore.getCurrentLocationInfo()
console.log(currentInfo) // { label: '象山县', value: '象山县', code: '330225' }
</script>
```

### 2. 使用 Composable（推荐）

```vue
<script setup>
import { useLocationData } from '@/composables/useLocationData'

const {
  currentLocationName,
  currentLocationCode,
  currentLocationInfo,
  isMainLocation,
  onLocationChange,
  switchToLocation
} = useLocationData()

// 监听位置变化
onLocationChange((newLocationCode, oldLocationCode, newLocationInfo, oldLocationInfo) => {
  console.log('位置从', oldLocationInfo?.label, '切换到', newLocationInfo?.label)
  console.log('代码从', oldLocationCode, '切换到', newLocationCode)
  console.log('位置详情:', newLocationInfo)

  // 可以在这里处理位置变化后的逻辑
  // 比如刷新地图、更新数据等
})

// 程序化切换位置（通过code）
function handleSwitchLocation() {
  switchToLocation('330225200') // 东陈乡的代码
}

// 程序化切换位置（通过value）
function handleSwitchLocationByValue() {
  switchToLocationByValue('东陈乡')
}
</script>

<template>
  <div>
    <p>当前区域: {{ currentLocationName }}</p>
    <p>区域代码: {{ currentLocationCode }}</p>
    <p>是否为主区域: {{ isMainLocation }}</p>
    <button @click="handleSwitchLocation">
      切换到东陈乡
    </button>
  </div>
</template>
```

### 3. 在地图组件中响应位置变化

```vue
<script setup>
import { useLocationData } from '@/composables/useLocationData'

const { onLocationChange, currentLocationCode } = useLocationData()

// 监听位置变化并更新地图
onLocationChange((newLocationCode, oldLocationCode, newLocationInfo, oldLocationInfo) => {
  if (newLocationInfo) {
    // 根据新的区域代码更新地图视图
    updateMapView(newLocationCode)

    // 加载对应区域的数据
    loadLocationData(newLocationCode)
  }
})

function updateMapView(code) {
  // 更新地图中心点和缩放级别
  console.log('更新地图视图到区域:', code)
}

function loadLocationData(code) {
  // 加载对应区域的业务数据
  console.log('加载区域数据:', code)
}
</script>
```

## Store API

### 状态

- `currentLocation`: 当前选择的区域代码（code）
- `locations`: 所有可选区域的列表

### 方法

- `setCurrentLocation(code)`: 通过代码设置当前区域
- `setCurrentLocationByValue(value)`: 通过名称设置当前区域
- `getCurrentLocationInfo()`: 获取当前区域的详细信息
- `getCurrentLocationLabel()`: 获取当前区域的显示标签
- `getLocationByCode(code)`: 根据代码获取区域信息
- `getLocationByValue(value)`: 根据名称获取区域信息
- `resetLocation()`: 重置为默认区域

## 区域列表

| 名称 | 代码 |
|------|------|
| 象山县 | 330225 |
| 丹东街道 | 330225001 |
| 丹西街道 | 330225002 |
| 爵溪街道 | 330225003 |
| 东陈乡 | 330225200 |
| 鹤浦镇 | 330225100 |

## 数据持久化

Location Store 使用 `pinia-plugin-persistedstate` 插件自动将 `currentLocation` 保存到 localStorage，页面刷新后会自动恢复上次选择的区域。

## 最佳实践

1. **统一使用 composable**: 推荐使用 `useLocationData` composable 而不是直接使用 store，这样可以获得更好的类型提示和封装。

2. **监听位置变化**: 在需要响应位置变化的组件中使用 `onLocationChange` 来监听变化，而不是在多个地方重复监听。

3. **避免直接修改**: 不要直接修改 `currentLocation`，总是使用 `setCurrentLocation` 方法。

4. **错误处理**: 在切换位置时添加适当的错误处理和加载状态。
