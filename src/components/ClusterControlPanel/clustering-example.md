# 地图标记聚合功能使用指南

## 功能概述

地图标记聚合功能可以将相近的标记点合并显示，提高地图性能和用户体验。当标记点密度较高时，聚合功能可以：

- 减少地图上的标记点数量，提高渲染性能
- 提供更好的视觉层次，避免标记点重叠
- 支持动态聚合距离调整
- 支持按图层类型分别控制聚合

## 主要功能

### 1. 聚合控制面板

通过右侧工具栏的聚合控制按钮可以打开聚合控制面板，面板提供以下功能：

- **聚合开关**：全局启用/禁用聚合功能
- **聚合距离控制**：调整标记点聚合的距离阈值（10-100像素）
- **最小聚合距离**：设置最小聚合距离（5-50像素）
- **图层聚合控制**：分别控制不同类型图层的聚合状态
- **聚合信息显示**：显示总标记点数、聚合数量、压缩比等统计信息
- **聚合样式预览**：预览不同数量级别的聚合样式

### 2. 聚合样式

聚合标记点根据包含的标记点数量显示不同样式：

- **1-5个标记点**：绿色圆圈
- **6-10个标记点**：黄色圆圈
- **11-20个标记点**：橙色圆圈
- **20+个标记点**：红色圆圈

圆圈大小和颜色会根据标记点数量动态调整。

## 使用方法

### 1. 基本使用

```javascript
// 在组件中使用聚合功能
import { useMapMarkers } from '@/composables/useMapMarkers.js';

const mapMarkersConfig = useMapMarkers(mapInstance);

// 启用指定类型的聚合
mapMarkersConfig.enableClustering('car', {
  distance: 40,        // 聚合距离
  minDistance: 20      // 最小聚合距离
});

// 禁用聚合
mapMarkersConfig.disableClustering('car');

// 切换聚合状态
mapMarkersConfig.toggleClustering('car', true);
```

### 2. 聚合配置

```javascript
// 设置聚合距离
mapMarkersConfig.setClusterDistanceForType('car', 50);

// 获取聚合信息
const clusterInfo = mapMarkersConfig.getClusterInfoForType('car');
console.log('聚合信息:', clusterInfo);
// 输出: { totalFeatures: 100, clusters: 15, clusterFeatures: 15 }

// 刷新聚合图层
mapMarkersConfig.refreshClusterLayer('car');
```

### 3. 批量操作

```javascript
// 为多个图层启用聚合
const layerTypes = ['car', 'ship', 'risk-point'];
layerTypes.forEach(type => {
  mapMarkersConfig.enableClustering(type, {
    distance: 40,
    minDistance: 20
  });
});
```

## 配置选项

### 聚合配置对象

```javascript
const clusterConfig = {
  // 聚合样式配置
  clusterStyle: {
    radius: 20,           // 基础半径
    fill: '#1890ff',      // 填充颜色
    stroke: '#ffffff',    // 边框颜色
    strokeWidth: 2,       // 边框宽度
    textColor: '#ffffff', // 文字颜色
    textSize: 12,         // 文字大小
    textWeight: 'bold'    // 文字粗细
  },
  // 单个标记样式配置
  markerStyle: {
    radius: 8,
    fill: '#ff4444',
    stroke: '#ffffff',
    strokeWidth: 2
  },
  // 聚合距离配置
  distance: 40,           // 聚合距离（像素）
  minDistance: 20         // 最小聚合距离（像素）
};
```

## 性能优化建议

1. **合理设置聚合距离**：距离过小会导致聚合效果不明显，距离过大会影响用户体验
2. **按需启用聚合**：只在标记点密度较高时启用聚合功能
3. **分层聚合**：不同类型的标记点可以设置不同的聚合参数
4. **动态调整**：根据地图缩放级别动态调整聚合距离

## 注意事项

1. 聚合功能基于 `ol-ext` 库的 `Cluster` 源实现
2. 聚合后原始标记点图层会被隐藏
3. 聚合图层支持点击事件，可以获取聚合包含的原始标记点
4. 聚合样式会根据标记点数量自动调整
5. 建议在标记点数量超过100个时启用聚合功能

## 示例代码

```javascript
// 完整的使用示例
export default {
  setup() {
    const map = ref(null);
    const mapMarkersConfig = ref(null);
    
    const onMapReady = (mapInstance) => {
      map.value = mapInstance;
      mapMarkersConfig.value = useMapMarkers(mapInstance);
      
      // 添加一些标记点
      addSampleMarkers();
      
      // 启用聚合
      setTimeout(() => {
        mapMarkersConfig.value.enableClustering('car', {
          distance: 40,
          minDistance: 20
        });
      }, 1000);
    };
    
    const addSampleMarkers = () => {
      // 添加示例标记点
      for (let i = 0; i < 50; i++) {
        mapMarkersConfig.value.addMarker([
          120 + Math.random() * 0.1,
          30 + Math.random() * 0.1
        ], {
          type: 'car',
          useTypeLayer: true,
          style: {
            icon: {
              src: '/path/to/icon.png',
              size: [32, 32]
            }
          },
          data: {
            title: `车辆 ${i + 1}`,
            popupType: 'car'
          }
        });
      }
    };
    
    return {
      onMapReady
    };
  }
};
```

通过以上配置和使用方法，您可以在地图中实现高效的标记点聚合功能，提升用户体验和地图性能。
