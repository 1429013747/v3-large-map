<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  mapMarkers: {
    type: Object,
    default: () => ({})
  },
  availableLayers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:open', 'cluster-toggle', 'distance-change']);

// 聚合控制状态
const clusterEnabled = ref(false);
const clusterDistance = ref(40);
const minClusterDistance = ref(20);

// 计算属性
const totalMarkers = computed(() => {
  return props.availableLayers.reduce((total, layer) => total + layer.count, 0);
});

const totalClusters = computed(() => {
  return props.availableLayers.reduce((total, layer) => {
    if (layer.clusterEnabled && props.mapMarkers.getClusterInfoForType) {
      const info = props.mapMarkers.getClusterInfoForType(layer.type);
      return total + (info.clusters || 0);
    }
    return total;
  }, 0);
});

const compressionRatio = computed(() => {
  if (totalMarkers.value === 0) return 0;
  return Math.round((1 - totalClusters.value / totalMarkers.value) * 100);
});

// 事件处理
function closePanel() {
  emit('update:open', false);
}

function handleClusterToggle(enabled) {
  emit('cluster-toggle', { enabled, type: 'all' });
}

function handleDistanceChange(distance) {
  emit('distance-change', { distance, type: 'all' });
}

function handleMinDistanceChange(distance) {
  emit('distance-change', { distance, type: 'min', minDistance: distance });
}

function handleLayerClusterToggle(layerType, enabled) {
  emit('cluster-toggle', { enabled, type: layerType });
}

// 监听聚合状态变化
watch(() => props.mapMarkers.clusterEnabled, (newVal) => {
  clusterEnabled.value = newVal;
}, { immediate: true });

// 监听聚合距离变化
watch(() => props.mapMarkers.clusterConfig?.distance, (newVal) => {
  if (newVal) {
    clusterDistance.value = newVal;
  }
}, { immediate: true });

onMounted(() => {
  // 初始化聚合状态
  if (props.mapMarkers.clusterEnabled) {
    clusterEnabled.value = props.mapMarkers.clusterEnabled.value;
  }
});
</script>

<template>
  <div v-if="open" class="cluster-control-panel">
    <div class="panel-header">
      <h3>聚合控制</h3>
      <button class="close-btn" @click="closePanel">
        ×
      </button>
    </div>

    <div class="panel-content">
      <!-- 聚合开关 -->
      <div class="control-group">
        <label class="control-label">启用聚合</label>
        <a-switch
          v-model:checked="clusterEnabled"
          @change="handleClusterToggle"
        />
      </div>

      <!-- 聚合距离控制 -->
      <div class="control-group">
        <label class="control-label">聚合距离</label>
        <a-slider
          v-model:value="clusterDistance"
          :min="10"
          :max="100"
          :step="5"
          @change="handleDistanceChange"
        />
        <span class="distance-value">{{ clusterDistance }}px</span>
      </div>

      <!-- 最小聚合距离控制 -->
      <div class="control-group">
        <label class="control-label">最小聚合距离</label>
        <a-slider
          v-model:value="minClusterDistance"
          :min="5"
          :max="50"
          :step="5"
          @change="handleMinDistanceChange"
        />
        <span class="distance-value">{{ minClusterDistance }}px</span>
      </div>

      <!-- 图层聚合控制 -->
      <div class="control-group">
        <label class="control-label">图层聚合</label>
        <div class="layer-controls">
          <div
            v-for="layer in availableLayers"
            :key="layer.type"
            class="layer-item"
          >
            <a-checkbox
              v-model:checked="layer.clusterEnabled"
              @change="handleLayerClusterToggle(layer.type, $event)"
            >
              {{ layer.name }}
            </a-checkbox>
            <span class="marker-count">({{ layer.count }})</span>
          </div>
        </div>
      </div>

      <!-- 聚合信息 -->
      <div class="control-group">
        <label class="control-label">聚合信息</label>
        <div class="cluster-info">
          <div class="info-item">
            <span class="info-label">总标记点:</span>
            <span class="info-value">{{ totalMarkers }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">聚合数量:</span>
            <span class="info-value">{{ totalClusters }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">压缩比:</span>
            <span class="info-value">{{ compressionRatio }}%</span>
          </div>
        </div>
      </div>

      <!-- 聚合样式预览 -->
      <div class="control-group">
        <label class="control-label">聚合样式</label>
        <div class="style-preview">
          <div class="preview-item">
            <div class="preview-circle small" />
            <span>1-5个</span>
          </div>
          <div class="preview-item">
            <div class="preview-circle medium" />
            <span>6-10个</span>
          </div>
          <div class="preview-item">
            <div class="preview-circle large" />
            <span>11-20个</span>
          </div>
          <div class="preview-item">
            <div class="preview-circle xlarge" />
            <span>20+个</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cluster-control-panel {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 1000;
  pointer-events: auto;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
      }
    }
  }

  .panel-content {
    padding: 20px;
    max-height: 500px;
    overflow-y: auto;

    .control-group {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .control-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .distance-value {
        margin-left: 8px;
        font-size: 12px;
        color: #666;
        font-weight: 500;
      }

      .layer-controls {
        .layer-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);

          &:last-child {
            border-bottom: none;
          }

          .marker-count {
            font-size: 12px;
            color: #999;
          }
        }
      }

      .cluster-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;

          .info-label {
            font-size: 12px;
            color: #666;
          }

          .info-value {
            font-size: 12px;
            font-weight: 600;
            color: #333;
          }
        }
      }

      .style-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .preview-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;

          .preview-circle {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

            &.small {
              background: #52c41a;
            }

            &.medium {
              background: #faad14;
            }

            &.large {
              background: #fa8c16;
            }

            &.xlarge {
              background: #f5222d;
            }
          }

          span {
            font-size: 10px;
            color: #666;
          }
        }
      }
    }
  }
}

// 滚动条样式
.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
