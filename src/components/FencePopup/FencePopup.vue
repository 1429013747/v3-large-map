<script setup>
/**
 * 围栏弹框：在弹框内嵌的新地图上绘制电子围栏（面积）
 */
import { ref, shallowRef, watch, computed, nextTick } from 'vue';
import { Style, Stroke, Fill } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Draw } from 'ol/interaction';
import { getArea } from 'ol/sphere';
import { toLonLat } from 'ol/proj';
import { useMap } from '@/composables/useMap';

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:open', 'fenceCreated', 'fenceDeleted']);

// 弹框内地图容器
const fenceMapContainer = ref(null);
const {
  map,
  initMap,
  destroyMap: useMapDestroy,
  isMapReady
} = useMap({
  center: [121.93, 29.28],
  zoom: 8,
  callbacks: {}
});

// 围栏图层与数据源（地图就绪后在 onMapReady 里初始化）
const fenceSource = shallowRef(null);
const fenceLayer = shallowRef(null);
const drawInteraction = ref(null);
const isDrawing = ref(false);
// 用于让 fenceList 随 VectorSource 增删 feature 而更新（OL 不会触发 Vue 响应式）
const fenceSourceVersion = ref(0);
const fenceList = ref([]);

function createFenceStyle() {
  return new Style({
    stroke: new Stroke({
      color: '#00d4aa',
      width: 2,
      lineDash: [8, 4]
    }),
    fill: new Fill({
      color: 'rgba(0, 212, 170, 0.25)'
    })
  });
}

function generateFenceId() {
  return `fence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatArea(area, precision = 2) {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(precision)} km²`;
  } else if (area >= 10000) {
    return `${(area / 10000).toFixed(precision)} 公顷`;
  } else {
    return `${area.toFixed(precision)} m²`;
  }
}

function getFenceList() {
  if (!fenceSource.value) return [];
  return fenceSource.value.getFeatures().map((f) => {
    const id = f.get('fenceId');
    const name = f.get('fenceName') || '围栏';
    const area = f.get('fenceArea');
    const coordinates = f.get('fenceCoordinates') || []; // 投影坐标 [x,y][]
    const lonLat = f.get('fenceLonLat') || []; // 经纬度 [经度,纬度][]
    return { id, name, area, coordinates, lonLat, feature: f };
  });
}

function initFenceLayer(mapInstance) {
  if (!mapInstance) return;
  const source = new VectorSource();
  source.on('addfeature', () => {
    // fenceSourceVersion.value++;
    fenceList.value = getFenceList();
  });
  source.on('removefeature', () => {
    // fenceSourceVersion.value++;
    fenceList.value = getFenceList();
  });
  fenceSource.value = source;
  fenceLayer.value = new VectorLayer({
    source: fenceSource.value,
    title: '围栏',
    zIndex: 1008,
    style: createFenceStyle()
  });
  mapInstance.addLayer(fenceLayer.value);
}

function startDrawFence() {
  const mapInstance = map.value;
  if (!mapInstance || !fenceSource.value) return;
  stopDrawFence();

  drawInteraction.value = new Draw({
    source: fenceSource.value,
    type: 'Polygon',
    style: createFenceStyle()
  });

  drawInteraction.value.on('drawend', (event) => {
    const feature = event.feature;
    const geometry = feature.getGeometry();
    const fenceId = generateFenceId();
    const area = getArea(geometry);
    const fenceName = `围栏${fenceList.value.length + 1}`;

    // 获取绘制的点位：多边形外环坐标（投影坐标 + 经纬度）
    const coordRing = geometry.getCoordinates()[0]; // 外环 [[x,y], ...]
    const coordinates = coordRing || [];
    const lonLatPoints = coordinates.map((coord) => toLonLat(coord)); // [经度, 纬度]

    feature.setProperties({
      fenceId,
      fenceName,
      fenceArea: formatArea(area, 2),
      isFence: true,
      fenceCoordinates: coordinates,
      fenceLonLat: lonLatPoints
    });
    feature.setStyle(createFenceStyle());
    stopDrawFence();
  });

  mapInstance.addInteraction(drawInteraction.value);
  isDrawing.value = true;
}

function stopDrawFence() {
  const mapInstance = map.value;
  if (drawInteraction.value && mapInstance) {
    mapInstance.removeInteraction(drawInteraction.value);
    drawInteraction.value = null;
  }
  isDrawing.value = false;
}

function deleteFenceById(fenceId) {
  if (!fenceSource.value) return false;
  const features = fenceSource.value.getFeatures();
  const feature = features.find((f) => f.get('fenceId') === fenceId);
  if (feature) {
    fenceSource.value.removeFeature(feature);
    emit('fenceDeleted', fenceId);
    return true;
  }
  return false;
}

function locateFence(feature) {
  const mapInstance = map.value;
  if (!mapInstance || !feature) return;
  const geom = feature.getGeometry();
  if (geom) {
    mapInstance.getView().fit(geom.getExtent(), {
      padding: [40, 40, 40, 40],
      maxZoom: 16
    });
  }
}

function updateFenceName(feature, newName, item) {
  if (feature && newName !== undefined && newName !== null) {
    item.name = String(newName).trim() || item.name;
    feature.set('fenceName', String(newName).trim() || feature.get('fenceName'));
  }
}

function saveFenceList() {
  console.log('🚀 ~ saveFenceList ~ fenceList.value:', fenceList.value);
}

function clearAllFences() {
  stopDrawFence();
  if (fenceSource.value) {
    fenceSource.value.clear();
    fenceList.value = [];
  }
}

function closeModal() {
  stopDrawFence();
  fenceSource.value = null;
  fenceLayer.value = null;
  useMapDestroy();
  emit('update:open', false);
}

// 弹框打开时初始化内嵌地图，关闭时销毁
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      const container = fenceMapContainer.value;
      if (container) {
        initMap(container);
      }
    } else {
      stopDrawFence();
      useMapDestroy();
      fenceSource.value = null;
      fenceLayer.value = null;
    }
  }
);

// 地图就绪后添加围栏图层并刷新尺寸
watch(
  isMapReady,
  (ready) => {
    if (ready && map.value) {
      initFenceLayer(map.value);
      nextTick(() => {
        map.value?.updateSize();
      });
    }
  },
  { immediate: true }
);

defineExpose({
  startDrawFence,
  stopDrawFence,
  deleteFenceById,
  clearAllFences,
  fenceList
});
</script>

<template>
  <a-modal
    :open="open"
    title="绘制电子围栏"
    :footer="null"
    width="100%"
    centered
    :mask-closable="false"
    class="modal-container fence-modal"
    get-container=".ui-container"
    :z-index="10001"
    @cancel="closeModal"
  >
    <div class="fence-modal-body">
      <div class="fence-map-wrap">
        <div ref="fenceMapContainer" class="fence-map-container" />
      </div>
      <div class="fence-side-wrap">
        <div class="fence-side">
          <div class="fence-actions">
            <button
              class="action-btn draw-btn"
              :class="{ active: isDrawing }"
              :disabled="!isMapReady"
              @click="startDrawFence"
            >
              {{ isDrawing ? '绘制中…' : '绘制围栏' }}
            </button>
            <button class="action-btn clear-btn" @click="clearAllFences">
              清空全部
            </button>
          </div>
          <div class="fence-list-header">
            <span>围栏列表</span>
            <span v-if="fenceList.length" class="count">共 {{ fenceList.length }} 个</span>
          </div>
          <div v-if="fenceList.length" class="fence-list">
            <div v-for="item in fenceList" :key="item.id" class="fence-item">
              <div class="fence-item-main">
                <input
                  v-model="item.name"
                  type="text"
                  class="fence-name-input"
                  placeholder="围栏名称"
                  @blur="updateFenceName(item.feature, item.name, item)"
                >
                <span class="fence-area">{{ item.area }}</span>
              </div>
              <div class="fence-item-actions">
                <button class="item-btn locate-btn" title="定位" @click="locateFence(item.feature)">
                  定位
                </button>
                <button class="item-btn delete-btn" title="删除" @click="deleteFenceById(item.id)">
                  删除
                </button>
              </div>
            </div>
          </div>
          <div v-else class="fence-empty">
            暂无围栏，点击「绘制围栏」在左侧地图框选区域
          </div>
        </div>
        <div class="fence-list-footer">
          <a-button @click="saveFenceList">
            保存
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.fence-modal-body {
  display: flex;
  gap: 16px;
  min-height: 820px;
}

.fence-map-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fence-map-container {
  width: 100%;
  height: 100%;
  background: #0a1628;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(0, 212, 170, 0.3);
}

.fence-map-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.fence-side-wrap {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.fence-list-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  :deep(.ant-btn) {
    background: rgba(0, 212, 170, 0.12);
    border-color: rgba(0, 212, 170, 0.8);
    border-radius: 6px;
    color: #00ffea;
  }
}

.fence-side {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fence-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(0, 212, 170, 0.4);
  background: rgba(0, 212, 170, 0.12);
  color: #00ffea;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.draw-btn:hover:not(:disabled),
.action-btn.draw-btn.active {
  background: rgba(0, 212, 170, 0.28);
  color: #00ffea;
  border-color: #00d4aa;
}

.action-btn.clear-btn {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.35);
  color: #ff0000;
}

.action-btn.clear-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ff0000;
}

.fence-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  color: rgb(197, 197, 197);
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 8px;
}

.fence-list-header .count {
  font-size: 12px;
  color: #0d9488;
}

.fence-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fence-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: 6px;
  gap: 8px;
}

.fence-item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fence-name-input {
  width: 100%;
  padding: 4px 8px;
  font-size: 13px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid #1a4a56;
  border-radius: 4px;
  outline: none;
}

.fence-name-input:focus {
  border-color: #00d4aa;
  box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.15);
}

.fence-name-input::placeholder {
  color: #bfbfbf;
}

.fence-area {
  font-size: 12px;
  color: #0d9488;
}

.fence-item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.item-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.item-btn.locate-btn {
  background: rgba(13, 148, 136, 0.12);
  color: #0d9488;
}

.item-btn.locate-btn:hover {
  background: rgba(13, 148, 136, 0.2);
  color: #0f766e;
}

.item-btn.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.item-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.18);
  color: #b91c1c;
}

.fence-empty {
  padding: 20px 8px;
  text-align: center;
  color: rgb(197, 197, 197);
  font-size: 13px;
  line-height: 1.5;
}
</style>
