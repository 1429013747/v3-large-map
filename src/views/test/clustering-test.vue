<template>
  <div class="clustering-test">
    <div class="test-header">
      <h2>地图标记聚合功能测试</h2>
      <div class="test-controls">
        <button @click="addRandomMarkers" :disabled="isAdding">添加随机标记点</button>
        <button @click="toggleClustering" class="cluster-btn">
          {{ clusterEnabled ? '禁用聚合' : '启用聚合' }}
        </button>
        <button @click="clearAllMarkers">清空标记点</button>
      </div>
    </div>
    
    <div class="map-container">
      <MapViewer
        ref="mapViewer"
        :center="mapCenter"
        :zoom="mapZoom"
        height="600px"
        @map-ready="onMapReady"
        @map-click="onMapClick"
      />
    </div>
    
    <div class="test-info">
      <div class="info-item">
        <span>总标记点数：</span>
        <span class="value">{{ totalMarkers }}</span>
      </div>
      <div class="info-item">
        <span>聚合状态：</span>
        <span class="value" :class="{ enabled: clusterEnabled }">
          {{ clusterEnabled ? '已启用' : '已禁用' }}
        </span>
      </div>
      <div class="info-item" v-if="clusterInfo">
        <span>聚合数量：</span>
        <span class="value">{{ clusterInfo.clusters }}</span>
      </div>
      <div class="info-item" v-if="clusterInfo">
        <span>压缩比：</span>
        <span class="value">{{ compressionRatio }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import MapViewer from '@/components/map/MapViewer.vue';
import { useMapMarkers } from '@/composables/useMapMarkers.js';
import { generateRandomCoordinates } from '@/utils/coordinateGenerator.js';

// 地图配置
const mapCenter = [120.1551, 30.2741]; // 杭州坐标
const mapZoom = ref(10);

// 组件引用
const mapViewer = ref(null);
const map = ref(null);
const mapMarkersConfig = ref(null);

// 状态
const clusterEnabled = ref(false);
const isAdding = ref(false);
const totalMarkers = ref(0);
const clusterInfo = ref(null);

// 计算属性
const compressionRatio = computed(() => {
  if (!clusterInfo.value || totalMarkers.value === 0) return 0;
  return Math.round((1 - clusterInfo.value.clusters / totalMarkers.value) * 100);
});

// 地图准备就绪
const onMapReady = (mapInstance) => {
  console.log('地图准备就绪');
  map.value = mapInstance;
  mapMarkersConfig.value = useMapMarkers(mapInstance);
  mapMarkersConfig.value.initMarkerLayer(true);
  
  // 添加一些初始标记点
  addRandomMarkers();
};

// 地图点击事件
const onMapClick = (event) => {
  console.log('地图点击:', event);
};

// 添加随机标记点
const addRandomMarkers = async () => {
  if (isAdding.value) return;
  
  isAdding.value = true;
  
  try {
    // 生成随机坐标
    const coords = generateRandomCoordinates(
      30.2741, 120.1551, 20, 20 // 20公里范围内生成20个点
    );
    
    // 添加标记点
    coords.forEach((coord, index) => {
      mapMarkersConfig.value.addMarker([coord.lng, coord.lat], {
        type: 'test',
        useTypeLayer: true,
        style: {
          icon: {
            src: '/src/assets/imgs/markIcons/icon1.png',
            size: [24, 24],
            anchor: [0.5, 1],
            scale: 1
          }
        },
        data: {
          title: `测试标记点 ${totalMarkers.value + index + 1}`,
          popupType: 'test'
        }
      });
    });
    
    // 更新统计信息
    updateStats();
    
  } catch (error) {
    console.error('添加标记点失败:', error);
  } finally {
    isAdding.value = false;
  }
};

// 切换聚合状态
const toggleClustering = () => {
  if (!mapMarkersConfig.value) return;
  
  if (clusterEnabled.value) {
    // 禁用聚合
    mapMarkersConfig.value.disableClustering('test');
    clusterEnabled.value = false;
  } else {
    // 启用聚合
    mapMarkersConfig.value.enableClustering('test', {
      distance: 40,
      minDistance: 20
    });
    clusterEnabled.value = true;
  }
  
  // 更新统计信息
  updateStats();
};

// 清空所有标记点
const clearAllMarkers = () => {
  if (!mapMarkersConfig.value) return;
  
  mapMarkersConfig.value.clearMarkersByType('test');
  totalMarkers.value = 0;
  clusterInfo.value = null;
  clusterEnabled.value = false;
};

// 更新统计信息
const updateStats = () => {
  if (!mapMarkersConfig.value) return;
  
  const markers = mapMarkersConfig.value.getMarkersByType('test');
  totalMarkers.value = markers.length;
  
  if (clusterEnabled.value) {
    clusterInfo.value = mapMarkersConfig.value.getClusterInfoForType('test');
  } else {
    clusterInfo.value = null;
  }
};

onMounted(() => {
  console.log('聚合测试页面已挂载');
});
</script>

<style lang="scss" scoped>
.clustering-test {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;

  .test-header {
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    h2 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 24px;
    }

    .test-controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      button {
        padding: 8px 16px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        background: white;
        color: #333;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;

        &:hover:not(:disabled) {
          border-color: #1890ff;
          color: #1890ff;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &.cluster-btn {
          background: #1890ff;
          color: white;
          border-color: #1890ff;

          &:hover {
            background: #40a9ff;
            border-color: #40a9ff;
          }
        }
      }
    }
  }

  .map-container {
    flex: 1;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .test-info {
    background: white;
    padding: 16px 20px;
    border-radius: 8px;
    margin-top: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 24px;
    flex-wrap: wrap;

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      .value {
        font-weight: 600;
        color: #333;

        &.enabled {
          color: #52c41a;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .clustering-test {
    padding: 10px;

    .test-header {
      padding: 16px;

      h2 {
        font-size: 20px;
      }

      .test-controls {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }

    .test-info {
      flex-direction: column;
      gap: 12px;
    }
  }
}
</style>
