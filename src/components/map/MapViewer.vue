<template>
  <div ref="mapContainer" class="map-viewer"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useMap } from "@/composables/useMap";

const props = defineProps({
  // 地图中心点坐标 [经度, 纬度]
  center: {
    type: Array,
    default: () => [120.1551, 30.2741], // 杭州坐标
  },
  // 缩放级别
  zoom: {
    type: Number,
    default: 10,
  },
  // 地图高度
  height: {
    type: String,
    default: "100%",
  },
  // 地图宽度
  width: {
    type: String,
    default: "100%",
  },
});

const emit = defineEmits([
  "map-ready",
  "map-click",
  "map-move",
  "layer-change",
  "map-zoom",
]);

// 创建地图容器引用
const mapContainer = ref(null);

// 使用地图 Hook
const {
  map,
  isMapReady,
  currentLayer,
  clickedCoordinate,
  mapCenter,
  mapZoom,
  layerStates,
  activeLayers,
  initMap,
  switchLayer,
  getCurrentLayer,
  setCenter,
  setZoom,
  getView,
  getMap,
  destroyMap,
  search,
  layerManager,
} = useMap({
  center: props.center,
  zoom: props.zoom,
  containerId: null, // 不使用 containerId，直接使用 ref
  callbacks: {
    onMapReady: (mapInstance) => {
      emit("map-ready", mapInstance);
    },
    onMapClick: (event) => {
      emit("map-click", event);
    },
    onMapDoubleClick: (event) => {
      emit("map-double-click", event);
    },
    onMapMove: (event) => {
      emit("map-move", event);
    },
    onLayerChange: (layerName) => {
      emit("layer-change", layerName);
    },
  },
});

// 手动初始化地图
onMounted(async () => {
  await nextTick();
  // 延迟初始化，确保DOM完全渲染
  if (mapContainer.value) {
    initMap(mapContainer.value);
  }
});

// 监听 props 变化
watch(
  () => props.center,
  (newCenter) => {
    if (newCenter && map.value) {
      setCenter(newCenter);
    }
  },
  { immediate: true }
);

watch(
  () => props.zoom,
  (newZoom) => {
    if (newZoom && map.value) {
      setZoom(newZoom);
    }
  }
);

// 暴露方法给父组件
defineExpose({
  map,
  getMap,
  switchLayer,
  getCurrentLayer,
  setCenter,
  setZoom,
  getView,
  isMapReady,
  currentLayer,
  clickedCoordinate,
  mapCenter,
  mapZoom,
  search,
  layerStates,
  activeLayers,
  layerManager,
});
</script>

<style lang="scss" scoped>
.map-viewer {
  width: 100%;
  height: v-bind(height);
  width: v-bind(width);
  position: relative;
  background: var(--background-color);
  transition: background-color 0.3s ease;
  min-height: 400px; /* 确保最小高度 */

  // 地图控件通用样式
  :global(.ol-control) {
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  // 缩放控件样式
  :global(.ol-zoom) {
    top: 20px;
    left: 20px;
    right: auto;
    bottom: auto;

    button {
      background: #ffffff !important;
      border: 1px solid #d9d9d9 !important;
      color: #333333 !important;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        background: #f5f5f5 !important;
        border-color: #1890ff !important;
        color: #1890ff !important;
      }
    }
  }

  // 比例尺样式
  :global(.ol-scale-line) {
    bottom: 20px;
    left: 20px;
    right: auto;
    top: auto;
    border-radius: 6px;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #333333;
  }

  // 版权信息样式
  :global(.ol-attribution) {
    bottom: 20px;
    right: 20px;
    top: auto;
    left: auto;
    border-radius: 6px;
    font-size: 12px;
    max-width: 200px;
    background: rgba(255, 255, 255, 0.9);
    color: rgba(0, 0, 0, 0.6);
  }
}
</style>
