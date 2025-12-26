<script setup>
import { CloseOutlined } from "@ant-design/icons-vue";
import { computed, ref } from "vue";

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  layers: {
    type: Array,
    default: () => [],
  },
  sensingDevices: {
    type: Array,
    default: () => [],
  },
  heatmaps: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(["update:open", "layer-toggle", "layer-click"]);

// 响应式数据
const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit("update:open", value);
  },
});
const selectedLayerId = ref(null);

// 计算属性
const filteredLayers = computed(() => {
  return props.layers;
});
const sensingDevices = computed(() => {
  return props.sensingDevices;
});

const filteredHeatmaps = computed(() => {
  return props.heatmaps;
});

// 方法
function handleClose() {
  emit("update:open", false);
}

function handleLayerClick(layer) {
  selectedLayerId.value = layer.id;
}

function handleLayerToggle(layer) {
  emit("layer-toggle", layer);
}
</script>

<template>
  <a-drawer
    v-model:open="visibleModal"
    title="控制图层"
    placement="right"
    get-container=".ui-container"
    :width="380"
    :closable="true"
    :mask="false"
    root-class-name="layer-box"
    class="layer-control-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>

    <!-- 图层列表 -->
    <div class="layer-list">
      <!-- 主要图层 -->
      <div class="layer-section">
        <div
          v-for="layer in filteredLayers"
          :key="layer.id"
          class="layer-item"
          :class="{ active: selectedLayerId === layer.id }"
          @click="handleLayerClick(layer)"
        >
          <div class="layer-info">
            <span class="layer-name">{{ layer.name }}</span>
          </div>
          <div class="layer-toggle">
            <a-switch
              v-model:checked="layer.visible"
              size="small"
              @change="handleLayerToggle(layer)"
            />
          </div>
        </div>
      </div>
      <!-- 感知设备 -->
      <div class="sensing-device-section">
        <div class="section-title">
          感知设备
        </div>
        <div
          v-for="sensingDevice in sensingDevices"
          :key="sensingDevice.id"
          class="layer-item"
          :class="{ active: selectedLayerId === sensingDevice.id }"
          @click="handleLayerClick(sensingDevice)"
        >
          <div class="layer-info">
            <span class="layer-name">{{ sensingDevice.name }}</span>
          </div>
          <div class="layer-toggle">
            <a-switch
              v-model:checked="sensingDevice.visible"
              size="small"
              @change="handleLayerToggle(sensingDevice)"
            />
          </div>
        </div>
      </div>
      <!-- 热力图部分 -->
      <div class="heatmap-section">
        <div class="section-title">
          热力图
        </div>
        <div
          v-for="heatmap in filteredHeatmaps"
          :key="heatmap.id"
          class="layer-item"
          :class="{ active: selectedLayerId === heatmap.id }"
          @click="handleLayerClick(heatmap)"
        >
          <div class="layer-info">
            <span class="layer-name">{{ heatmap.name }}</span>
          </div>
          <div class="layer-toggle">
            <a-switch
              v-model:checked="heatmap.visible"
              size="small"
              @change="handleLayerToggle(heatmap)"
            />
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<style lang="scss" scoped>
.layer-control-drawer {
  .layer-list {
    .heatmap-section,
    .sensing-device-section {
      .section-title {
        background: linear-gradient(90deg, transparent 0%, #12303b 100%);
        padding: 6px;
        margin: 20px 0;
      }
    }

    .layer-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 10px 6px;
      transition: all 0.3s ease;
      border-bottom: 1px solid rgba(0, 255, 255, 0.1);
      position: relative;

      &:hover {
        background: rgba(0, 255, 255, 0.1);
      }

      &.active {
        background: rgba(0, 255, 255, 0.2);

        &::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #00ffff;
        }
      }

      .layer-info {
        flex: 1;

        .layer-name {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
        }
      }

      .layer-toggle {
        :deep(.ant-switch) {
          background: rgba(255, 255, 255, 0.7);

          &.ant-switch-checked {
            background: #00ffff;
          }
        }
      }
    }

    .divider {
      border: 1px solid rgba(0, 255, 255, 0.2);
    }
  }

  // 滚动条样式
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 255, 255, 0.1);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 255, 0.3);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 255, 0.5);
  }
}
</style>
