<template>
  <a-drawer
    v-model:open="visible"
    title="控制图层"
    placement="right"
    getContainer=".ui-container"
    :width="380"
    :closable="true"
    :mask="false"
    rootClassName="layer-box"
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
          class="layer-item"
          v-for="layer in filteredLayers"
          :key="layer.id"
          @click="handleLayerClick(layer)"
          :class="{ active: selectedLayerId === layer.id }"
        >
          <div class="layer-info">
            <span class="layer-name">{{ layer.name }}</span>
          </div>
          <div class="layer-toggle">
            <a-switch
              v-model:checked="layer.visible"
              @change="handleLayerToggle(layer)"
              size="small"
            />
          </div>
        </div>
      </div>
      <!-- 感知设备 -->
      <div class="sensing-device-section">
        <div class="section-title">感知设备</div>
        <div
          class="layer-item"
          v-for="sensingDevice in sensingDevices"
          :key="sensingDevice.id"
          @click="handleLayerClick(sensingDevice)"
          :class="{ active: selectedLayerId === sensingDevice.id }"
        >
          <div class="layer-info">
            <span class="layer-name">{{ sensingDevice.name }}</span>
          </div>
          <div class="layer-toggle">
            <a-switch
              v-model:checked="sensingDevice.visible"
              @change="handleLayerToggle(sensingDevice)"
              size="small"
            />
          </div>
        </div>
      </div>
      <!-- 热力图部分 -->
      <div class="heatmap-section">
        <div class="section-title">热力图</div>
        <div
          class="layer-item"
          v-for="heatmap in filteredHeatmaps"
          :key="heatmap.id"
          @click="handleLayerClick(heatmap)"
          :class="{ active: selectedLayerId === heatmap.id }"
        >
          <div class="layer-info">
            <span class="layer-name">{{ heatmap.name }}</span>
          </div>
          <div class="layer-toggle">
            <a-switch
              v-model:checked="heatmap.visible"
              @change="handleLayerToggle(heatmap)"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons-vue";

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:open", "layer-toggle", "layer-click"]);

// 响应式数据
const visible = ref(props.open);
const searchKeyword = ref("");
const selectedLayerId = ref(null);

// 图层数据
const layers = ref([
  { id: 1, name: "风险点", visible: true, type: "main" },
  { id: 2, name: "交通要道", visible: false, type: "main" },
  { id: 3, name: "工作站", visible: true, type: "main" },
  { id: 4, name: "无走私村", visible: true, type: "main" },
  { id: 5, name: "船舶动态", visible: true, type: "main" },
  { id: 6, name: "车辆动态", visible: false, type: "main" },
  { id: 7, name: "电子围栏", visible: false, type: "main" },
  { id: 8, name: "案件", visible: false, type: "main" },
]);

// 感知设备
const sensingDevices = ref([
  { id: 1, name: "光电雷达覆盖区域", visible: true, type: "main" },
  { id: 2, name: "智能限高杆", visible: false, type: "main" },
  { id: 3, name: "视频感知设备", visible: true, type: "main" },
]);

// 热力图数据
const heatmaps = ref([
  { id: 101, name: "风险点热力图", visible: true, type: "heatmap" },
  { id: 102, name: "综合案件热力图", visible: false, type: "heatmap" },
  { id: 103, name: "涉冻品案件热力图", visible: true, type: "heatmap" },
  { id: 104, name: "涉成品油案件热力图", visible: false, type: "heatmap" },
  { id: 105, name: "车辆运行热力图", visible: false, type: "heatmap" },
  { id: 106, name: "船舶运行热力图", visible: false, type: "heatmap" },
]);

// 计算属性
const filteredLayers = computed(() => {
  if (!searchKeyword.value) return layers.value;
  return layers.value.filter((layer) =>
    layer.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

const filteredHeatmaps = computed(() => {
  if (!searchKeyword.value) return heatmaps.value;
  return heatmaps.value.filter((heatmap) =>
    heatmap.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 方法
const handleClose = () => {
  visible.value = false;
  emit("update:open", false);
};

const handleSearch = () => {
  // 搜索逻辑
  console.log("搜索:", searchKeyword.value);
};

const handleLayerClick = (layer) => {
  selectedLayerId.value = layer.id;
  emit("layer-click", layer);
};

const handleLayerToggle = (layer) => {
  emit("layer-toggle", layer);
};

// 监听props变化
watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal;
  }
);

watch(visible, (newVal) => {
  emit("update:open", newVal);
});
</script>

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
