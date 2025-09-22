<!--
 * @author: guoqiancheng
 * @since: 2025-09-09
-->
<template>
  <div class="container">
    <MapLayout :showMap="true" :enableScale="true" title="智能地图">
      <template #map>
        <MapViewer
          ref="mapViewer"
          :center="mapCenter"
          :zoom="mapZoom"
          height="100%"
          @map-ready="onMapReady"
          @map-click="onMapClick"
          @map-double-click="onMapDoubleClick"
          @map-move="onMapMove"
          @layer-change="onLayerChange"
        />
      </template>
      <template #default>
        <div class="main-container">
          <!-- 顶部搜索 -->
          <div class="search-container">
            <a-input
              v-model:value="searchKeyword"
              @pressEnter="handleSearch"
              placeholder="请输入关键词"
            >
              <template #suffix>
                <SearchOutlined @click="handleSearch" />
              </template>
            </a-input>
          </div>
          <!-- 顶部预警 -->
          <div
            class="warning-container"
            v-if="warningInfoVisible"
            @click="handleWarningClick"
          >
            <div class="warning-title">
              <div class="warning-title-num">6</div>
              <img src="@/assets/imgs/text.png" alt="" />
            </div>
            <div class="warning-content">
              白岩码头风险点在2025.06.20 21:00疑似出现走私预警
            </div>
            <div class="warning-close" @click.stop="handleWarningClose">
              <CloseOutlined style="font-size: 14px; color: #fff" />
            </div>
          </div>
          <!-- 左侧预警抽屉 -->
          <WarningDrawer
            v-model:open="warningDrawerVisible"
            @warning-click="handleWarningItemClick"
            @track-click="handleTrackClick"
            @detail-click="handleDetailClick"
          />
          <!-- 右侧工具栏 -->
          <RightToolbar
            @layer-control="handleToolbarLayerControl"
            @legend-display="handleToolbarLegendDisplay"
            @ship-events="handleToolbarShipEvents"
            @comprehensive-search="handleToolbarComprehensiveSearch"
            @track-query="handleToolbarTrackQuery"
            @gang-vehicle-query="handleToolbarGangVehicleQuery"
            @tide-query="handleToolbarTideQuery"
            @measure-distance="handleToolbarMeasureDistance"
            @measure-area="handleToolbarMeasureArea"
            @plotting="handleToolbarPlotting"
            @clear="handleToolbarClear"
            @locate="handleToolbarLocate"
            @zoom-in="handleToolbarZoomIn"
            @zoom-out="handleToolbarZoomOut"
          />

          <!-- 控制图层面板 -->
          <LayerControlPanel
            v-model:open="layerControlVisible"
            @layer-toggle="handleLayerToggle"
            :layers="layers"
            :sensingDevices="sensingDevices"
            :heatmaps="heatmaps"
          />

          <!-- 图例面板 -->
          <LegendPanel v-model:open="legendPanelVisible" />
          <!-- 综合检索面板 -->
          <ComprehensiveSearchPanel v-model:open="comprehensiveSearchVisible" />

          <!-- 船舶事件面板 -->
          <ShipEventsPanel v-model:open="shipEventsPanelVisible" />

          <!-- 轨迹查询面板 -->
          <TrackQueryPanel v-model:open="trackQueryPanelVisible" />

          <!-- 团伙车辆查询面板 -->
          <GangVehicleQueryPanel v-model:open="gangVehicleQueryPanelVisible" />

          <!-- 潮汐查询面板 -->
          <TideQueryPanel v-model:visible="tideQueryPanelVisible" />

          <!-- 可疑车辆弹窗 -->
          <SuspiciousVehiclePopup
            ref="suspiciousVehiclePopupRef"
            v-model:visible="suspiciousVehiclePopupVisible"
            :vehicleData="selectedVehicleData"
            @track-back="handleVehicleTrackBack"
            @view-more="handleVehicleViewMore"
            @create-warning="handleVehicleCreateWarning"
            @vehicle-click="handleVehicleWarningClick"
            @add-vehicle="handleAddVehicle"
            @set-key="handleSetKey"
            @cancel-key="handleCancelKey"
          />

          <!-- 重点船舶弹窗 -->
          <KeyVesselsPopup
            ref="keyVesselsPopupRef"
            v-model:visible="keyVesselsPopupVisible"
            :vesselsData="selectedVesselData"
            @track-back="handleVesselTrackBack"
            @view-more="handleVesselViewMore"
            @create-warning="handleVesselCreateWarning"
            @vessels-click="handleVesselWarningClick"
            @add-vessels="handleAddVessel"
            @set-key="handleSetKeyVessel"
            @cancel-key="handleCancelKeyVessel"
          />

          <!-- 重点人员弹窗 -->
          <KeyPersonnelPopup
            v-model:visible="keyPersonnelPopupVisible"
            @close="handleKeyPersonnelClose"
          />

          <!-- 应急标绘面板 -->
          <PlotPanel
            ref="plotPanelRef"
            :map="map"
            :visible="plottingPanelVisible"
            @close="closePlottingPanel"
            @featureCreated="handleFeatureCreated"
            @featureSelected="handleFeatureSelected"
            @featureDeleted="handleFeatureDeleted"
          />
          <!-- 底部菜单 -->
          <div class="bottom-menu">
            <div class="bottom-menu-box">
              <!-- 滑动指示器 -->
              <div
                class="slider-indicator"
                v-show="activeBottomMenu !== -1"
                :style="getSliderIndicatorStyle"
              ></div>
              <div
                class="bottom-menu-item"
                v-for="(item, index) in bottomMenu"
                :key="item.name"
                :class="{ active: index === activeBottomMenu }"
                @click="handleBottomMenuClick(index)"
              >
                <img :src="getIconPath(item.icon)" :alt="`${item.name}图标`" />
                {{ item.name }}
              </div>
            </div>
          </div>
          <!-- 底部统计信息栏 -->
          <div class="bottom-statistics-bar">
            <div class="statistics-left">
              <div class="stat-item">
                <span class="stat-label">图层</span>
                <span class="stat-value">{{ statistics.layerCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">预警数量</span>
                <span class="stat-value">{{ statistics.warningCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">重点船舶</span>
                <span class="stat-value">{{ statistics.keyVessels }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">在航</span>
                <span class="stat-value">{{ statistics.underway }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">停泊</span>
                <span class="stat-value">{{ statistics.anchored }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">可疑车辆</span>
                <span class="stat-value">{{
                  statistics.suspiciousVehicles
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">实时境内车辆</span>
                <span class="stat-value">{{
                  statistics.realtimeVehicles
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">昨日累计车辆</span>
                <span class="stat-value">{{
                  statistics.yesterdayVehicles
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">电子围栏</span>
                <span class="stat-value">{{
                  statistics.electronicFences
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">重点人员</span>
                <span class="stat-value">{{ statistics.keyPersonnel }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">风险点</span>
                <span class="stat-value">{{ statistics.riskPoints }}</span>
              </div>
            </div>

            <!-- 右侧地图图层切换 -->
            <div class="statistics-right">
              <div
                class="map-layer-buttons"
                :class="{ 'slide-right': currentLayer === '天地图卫星' }"
              >
                <div
                  class="layer-btn"
                  :class="{ active: currentLayer === '天地图' }"
                  @click="switchLayer('天地图')"
                >
                  行政地图
                </div>
                <div
                  class="layer-btn"
                  :class="{ active: currentLayer === '天地图卫星' }"
                  @click="switchLayer('天地图卫星')"
                >
                  卫星图
                </div>
              </div>
            </div>
          </div>
          <!-- 地图控制面板 -->
          <div class="map-controls" @click="setInitialVisible">
            <div class="control-panel">
              <h3>地图控制</h3>
              <!-- 图层切换 -->
              <div class="control-group">
                <label>底图图层：</label>
                <select
                  v-model="currentLayer"
                  @change="handleLayerChange"
                  class="layer-select"
                >
                  <option value="天地图">天地图</option>
                  <option value="天地图卫星">天地图卫星</option>
                  <option value="高德地图">高德地图</option>
                  <option value="高德卫星">高德卫星</option>
                  <option value="CartoDB">CartoDB</option>
                </select>
              </div>

              <div class="control-group">
                <label>中心坐标：</label>
                <span>{{ displayCenter }}</span>
              </div>
              <div class="control-group">
                <label>缩放级别：</label>
                <span>{{ displayZoom }}</span>
              </div>
              <div class="control-group">
                <label>点击坐标：</label>
                <span>{{ displayClicked }}</span>
              </div>

              <div class="control-group">
                <label>当前图层：</label>
                <span class="layer-status">{{ currentLayer }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </MapLayout>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
} from "vue";
import MapLayout from "@/layouts/MapLayout.vue";
import MapViewer from "@/components/map/MapViewer.vue";
import WarningDrawer from "@/components/WarningDrawer/WarningDrawer.vue";
import RightToolbar from "@/components/RightToolbar/RightToolbar.vue";
import LegendPanel from "@/components/LegendPanel/LegendPanel.vue";
import PlotPanel from "@/components/PlottingPanel/PlotPanel.vue";
import LayerControlPanel from "@/components/LayerControlPanel/LayerControlPanel.vue";
import ComprehensiveSearchPanel from "@/components/ComprehensiveSearchPanel/ComprehensiveSearchPanel.vue";
import ShipEventsPanel from "@/components/ShipEventsPanel/ShipEventsPanel.vue";
import TrackQueryPanel from "@/components/TrackQueryPanel/TrackQueryPanel.vue";
import GangVehicleQueryPanel from "@/components/GangVehicleQueryPanel/GangVehicleQueryPanel.vue";
import TideQueryPanel from "@/components/TideQueryPanel/TideQueryPanel.vue";
import SuspiciousVehiclePopup from "@/components/SuspiciousVehiclePopup/SuspiciousVehiclePopup.vue";
import KeyVesselsPopup from "@/components/keyVesselsPopup/keyVesselsPopup.vue";
import KeyPersonnelPopup from "@/components/KeyPersonnelPopup/KeyPersonnelPopup.vue";
import { useMapMarkers } from "@/composables/useMapMarkers.js";
import { generateRandomCoordinates } from "@/utils/coordinateGenerator.js";
import { getIconPath, getIconPathMarkIcons } from "@/utils/utilstools.js";
import {
  createPopupContentCar,
  createPopupContentRisk,
  createPopupContentShip,
} from "@/composables/createPopupContent.js";
import "@/styles/marker-popup.scss";
import "@/styles/bottom-statistics.scss";
import "@/styles/layer-control.scss";
import "@/styles/ship-popup.scss";
import { useDefaultConfigStore } from "@/stores/defaultConfig.js";
import { toLonLat, fromLonLat } from "ol/proj";

const defaultConfigStore = useDefaultConfigStore();
// 地图配置
const mapCenter = reactive([121.92925185863172, 29.275393872226005]); // 宁波坐标

// 统计数据
const statistics = reactive({
  layerCount: 10,
  warningCount: 140,
  keyVessels: 130,
  underway: 30,
  anchored: 10,
  suspiciousVehicles: 240,
  realtimeVehicles: 240,
  yesterdayVehicles: 291,
  electronicFences: 291,
  keyPersonnel: 160,
  riskPoints: 1560,
});
const mapZoom = ref(10);
const mapLayerButtons = ref(null);
// 调试信息
const clickedCoordinate = ref(null);
const mapViewer = ref(null);
const searchKeyword = ref("");
const warningDrawerVisible = ref(false);
const activeBottomMenu = ref(-1);
const plottingPanelVisible = ref(false);
const layerControlVisible = ref(false);
const legendPanelVisible = ref(false);
const comprehensiveSearchVisible = ref(false);
const shipEventsPanelVisible = ref(false);
const trackQueryPanelVisible = ref(false);
const gangVehicleQueryPanelVisible = ref(false);
const tideQueryPanelVisible = ref(false);
const warningInfoVisible = ref(true);
const suspiciousVehiclePopupRef = ref(null);
const keyVesselsPopupRef = ref(null);

// 可疑车辆弹窗相关
const suspiciousVehiclePopupVisible = ref(false);
const selectedVehicleData = ref({});

// 重点船舶弹窗相关
const keyVesselsPopupVisible = ref(false);
const selectedVesselData = ref({});

// 重点人员弹窗相关
const keyPersonnelPopupVisible = ref(false);

const MarkerIds = ref([]);

// 标绘面板引用
const plotPanelRef = ref(null);

let mapMarkersConfig = {};
const map = ref(null);

// 是否使用类型图层
const useTypeLayer = ref(false);

// 底部菜单
const bottomMenu = ref([
  {
    name: "岸线管控",
    icon: "pos",
  },
  {
    name: "重点船舶",
    icon: "boat",
  },
  {
    name: "重点人员",
    icon: "peo",
  },
  {
    name: "可疑车辆",
    icon: "bus",
  },
]);

// 当前图层
const currentLayer = ref("天地图卫星");

const mapConfig = ref({});

// 切换地图图层
const switchLayer = (layerType) => {
  // 直接使用传入的 layerType，不要映射
  currentLayer.value = layerType;

  // 调用现有的图层切换逻辑
  if (mapViewer.value && mapViewer.value.switchLayer) {
    mapViewer.value.switchLayer(currentLayer.value);
  }

  console.log("切换到图层:", currentLayer.value);
};

// 地图准备就绪
const onMapReady = (mapInstance) => {
  console.log("当前地图中心:", mapCenter.value);
  map.value = mapInstance; // 设置 map 变量
  mapMarkersConfig = useMapMarkers(mapInstance);

  useTypeLayer.value = true;
  // 初始化标记点
  mapMarkersConfig.initMarkerLayer(useTypeLayer.value);

  // 模拟数据
  getMarkerData();
};

// 地图点击事件
const onMapClick = (event) => {
  console.log("地图点击事件", event);
  clickedCoordinate.value = event.lonLat;
  const features = map.value.getFeaturesAtPixel(event.pixel, {
    layerFilter: (layer) => {
      if (useTypeLayer.value) {
        // 检查是否是类型图层
        const layerType = layer.get("type");
        if (
          layerType &&
          mapMarkersConfig.markerLayersByType.value[layerType] === layer
        ) {
          return true;
        }
        // 备用方案：检查是否在类型图层列表中
        return Object.values(
          mapMarkersConfig.markerLayersByType.value
        ).includes(layer);
      } else {
        // 检查是否是默认标记点图层
        return mapMarkersConfig.markerLayer.value === layer;
      }
    },
  });
  console.log("🚀 ~ onMapClick ~ features:", features);

  if (features.length > 0) {
    const feature = features[0];
    const markerId = feature.get("id");
    const markerData = feature.getProperties();

    // 触发标记点点击事件
    onMarkerClick({
      markerId,
      markerData,
      feature,
      coordinate: event.coordinate,
      lonLat: toLonLat(event.coordinate),
      pixel: event.pixel,
    });
  }
};

// 地图双击事件
const onMapDoubleClick = (event) => {
  console.log("地图双击事件", event);
  const features = map.value.getFeaturesAtPixel(event.pixel, {
    layerFilter: (layer) => {
      if (useTypeLayer.value) {
        // 检查是否是类型图层
        const layerType = layer.get("type");
        if (
          layerType &&
          mapMarkersConfig.markerLayersByType.value[layerType] === layer
        ) {
          return true;
        }
        // 备用方案：检查是否在类型图层列表中
        return Object.values(
          mapMarkersConfig.markerLayersByType.value
        ).includes(layer);
      } else {
        // 检查是否是默认标记点图层
        return mapMarkersConfig.markerLayer.value === layer;
      }
    },
  });
  if (features.length > 0) {
    const feature = features[0];
    const markerId = feature.get("id");
    const markerData = feature.getProperties();
    console.log("🚀 ~ onMapDoubleClick ~ markerData:", markerData);
    if (markerData.popupType === "car") {
      suspiciousVehiclePopupRef.value.handleDetail(markerData);
    }
  }
};

/**
 * 轨迹回放
 * @param {String} markerId - 标记点ID
 */
const trackBack = (markerId) => {
  console.log("轨迹回放:", markerId);
  console.log(mapMarkersConfig.tracks.value);
  mapMarkersConfig.toggleMarkerVisibilityByLayer("轨迹", true);
  // 先清除之前的轨迹
  mapMarkersConfig.clearTrackRoutes();

  // 示例坐标点
  const coordinates = [
    [121.72482419397187, 29.34646109911479],
    [121.77201003734264, 29.34544660015939],
    [121.82213515941295, 29.34065820190017],
    [121.7919227570692, 29.2915641536963],
    [121.83106155101451, 29.278388561873953],
    [121.8633338898817, 29.266409276796225],
  ];

  // 生成轨迹路线
  mapMarkersConfig.generateTrackRoute(coordinates, {
    showStartEnd: true,
    animation: true,
    animationDuration: 2000,
    midpointText: "中间点1",
    style: {
      stroke: "#d65e37",
      strokeWidth: 3,
      lineDash: [],
      lineCap: "round",
      lineJoin: "round",
    },
  });
};

/**
 * 查看更多船舶
 * @param {*} markerId
 */
const viewMoreShip = (markerId) => {
  console.log("查看更多船舶:", markerId);
};
/**
 * 设置重点船舶
 * @param {*} markerId
 */
const setKeyShip = (markerId) => {
  console.log("设置重点船舶:", markerId);
};
/**
 * 船舶查询
 * @param {*} markerId
 */
const shipQuery = (markerId) => {
  console.log("船舶查询:", markerId);
};
/**
 * 查看更多
 * @param {*} markerId
 */
const viewMore = (markerId) => {
  console.log("查看更多:", markerId);
  suspiciousVehiclePopupVisible.value = true;
  // activeBottomMenu.value = 3;
  nextTick(() => {
    suspiciousVehiclePopupRef.value.handleDetail(markerId);
  });
};

/**
 * 轨迹纠正
 * @param {*} markerId
 */
const trackCorrect = (markerId) => {
  console.log("风险点轨迹纠正:", markerId);
};
/**
 * 查看更多
 * @param {*} markerId
 */
const viewMoreCorrect = (markerId) => {
  console.log("风险点查看更多:", markerId);
};
/**
 * 根据类型显示标记点弹窗
 * @param {Array} coordinates - 坐标 [经度, 纬度]
 * @param {Object} markerData - 标记点数据
 */
const showMarkerPopup = (coordinates, markerData) => {
  if (
    !mapMarkersConfig.markerPopupOverlay.value ||
    !mapMarkersConfig.markerPopupElement.value
  )
    return;
  // 根据类型创建弹窗内容
  if (markerData.popupType === "car") {
    mapMarkersConfig.markerPopupElement.value.innerHTML = createPopupContentCar(
      markerData,
      trackBack,
      viewMore
    );
  } else if (markerData.popupType === "ship") {
    mapMarkersConfig.markerPopupElement.value.innerHTML =
      createPopupContentShip(markerData, setKeyShip, viewMoreShip, shipQuery);
  } else {
    mapMarkersConfig.markerPopupElement.value.innerHTML =
      createPopupContentRisk(markerData, trackCorrect, viewMoreCorrect);
  }

  // 设置弹窗位置
  const coordinate = fromLonLat(coordinates);
  mapMarkersConfig.markerPopupOverlay.value.setPosition(coordinate);

  // 显示弹窗
  mapMarkersConfig.markerPopupElement.value.style.display = "block";
};
/**
 * 标记点点击事件处理
 * @param {Object} eventData - 点击事件数据
 */
const onMarkerClick = (eventData) => {
  console.log("标记点被点击:", eventData);

  const { markerId, markerData, coordinate, lonLat } = eventData;

  // 显示弹窗
  showMarkerPopup([lonLat[0], lonLat[1]], {
    markerId,
    ...markerData,
    lonLat,
  });
};

// 地图移动事件
const onMapMove = (event) => {
  console.log("地图移动事件", event);
  mapCenter.value = event.center;
  mapZoom.value = event.zoom;
  // 11.5以下隐藏
  const typeList = ["car", "ship", "icon"];
  typeList.forEach((type) => {
    if (mapZoom.value < 11.5) {
      mapMarkersConfig.toggleMarkerTextVisibilityByType(type, false);
    } else {
      mapMarkersConfig.toggleMarkerTextVisibilityByType(type, true);
    }
  });
};

// 图层切换事件
const onLayerChange = (layerName) => {
  currentLayer.value = layerName;
};

// 手动切换图层
const handleLayerChange = () => {
  if (mapViewer.value && mapViewer.value.switchLayer) {
    mapViewer.value.switchLayer(currentLayer.value);
  }
};

// 计算属性
const displayCenter = computed(() => {
  return mapCenter.value
    ? `${mapCenter.value[0].toFixed(4)}, ${mapCenter.value[1].toFixed(4)}`
    : "未获取";
});

const displayZoom = computed(() => {
  return mapZoom.value || "未获取";
});

const displayClicked = computed(() => {
  return clickedCoordinate.value
    ? `${clickedCoordinate.value[0].toFixed(
        4
      )}, ${clickedCoordinate.value[1].toFixed(4)}`
    : "未点击";
});

const handleSearch = () => {
  if (!mapViewer.value || !searchKeyword.value.trim()) return;
  mapMarkersConfig.flyTo([121.72875137035045, 29.358613535256325], 10);
};

// 预警相关方法
const handleWarningClick = () => {
  warningDrawerVisible.value = true;
};

const handleWarningItemClick = (warning) => {
  console.log("点击预警项", warning);
};

const handleTrackClick = (warning) => {
  console.log("查看轨迹", warning);
  if (mapViewer.value && warning.coordinates) {
    mapViewer.value.setCenter(warning.coordinates);
    mapViewer.value.setZoom(15);
  }
};

const handleDetailClick = (warning) => {
  console.log("查看详情", warning);
  // 这里可以添加详情查看逻辑
};

// 可疑车辆相关事件处理
const handleVehicleTrackBack = (vehicleData) => {
  console.log("车辆轨迹回放", vehicleData);
  // 这里可以添加轨迹回放逻辑
  if (mapViewer.value && vehicleData.coordinates) {
    mapViewer.value.setCenter(vehicleData.coordinates);
    mapViewer.value.setZoom(15);
  }
};

const handleVehicleViewMore = (vehicleData) => {
  console.log("查看车辆更多信息", vehicleData);
  // 这里可以添加查看更多信息的逻辑
};

const handleVehicleCreateWarning = (vehicleData) => {
  console.log("为车辆创建预警", vehicleData);
  // 这里可以添加创建预警的逻辑
  // 可以打开预警创建面板或直接创建预警
};

const handleVehicleWarningClick = (warning) => {
  console.log("点击车辆相关预警", warning);
  if (mapViewer.value && warning.coordinates) {
    mapMarkersConfig.flyTo(warning.coordinates, 10, 500);
    if (MarkerIds.value.length < 2) {
      MarkerIds.value.push(warning.markerId);
    }
    if (MarkerIds.value.length >= 2) {
      mapMarkersConfig.toggleMarkerBorder(MarkerIds.value[0], false);
      MarkerIds.value.shift();
    }
    mapMarkersConfig.toggleMarkerBorder(MarkerIds.value[0], true);
  }
};

// 监听可疑车辆弹窗关闭
watch(
  () => suspiciousVehiclePopupVisible.value,
  (newVal) => {
    if (!newVal) {
      mapMarkersConfig.toggleMarkerBorder(MarkerIds.value[0], false);
      MarkerIds.value = [];
    }
  }
);

const handleAddVehicle = (formData) => {
  console.log("新增可疑车辆数据:", formData);
  // 这里可以添加新增车辆的逻辑
  // 可以调用API保存数据，或者在地图上添加新的标记点
  if (formData) {
    // 处理表单数据

    console.log("处理新增车辆数据:", formData);
  }
};

const handleSetKey = (vehicle) => {
  console.log("设置重点车辆", vehicle);
  // 这里可以添加设置重点车辆的逻辑
  // 可以调用API更新车辆状态
};

const handleCancelKey = (vehicle) => {
  console.log("取消重点车辆", vehicle);
  // 这里可以添加取消重点车辆的逻辑
  // 可以调用API更新车辆状态
};

const handleAddVessel = (formData) => {
  console.log("新增重点船舶数据:", formData);
  // 这里可以添加新增重点船舶的逻辑
  // 可以调用API保存数据，或者在地图上添加新的标记点
};

const handleSetKeyVessel = (vessel) => {
  console.log("设置重点船舶", vessel);
  // 这里可以添加设置重点船舶的逻辑
  // 可以调用API更新船舶状态
};

const handleCancelKeyVessel = (vessel) => {
  console.log("取消重点船舶", vessel);
  // 这里可以添加取消重点船舶的逻辑
  // 可以调用API更新船舶状态
};

const handleVesselTrackBack = (vesselData) => {
  console.log("船舶轨迹回放", vesselData);
  // 这里可以添加船舶轨迹回放的逻辑
};

const handleVesselViewMore = (vesselData) => {
  console.log("查看船舶更多信息", vesselData);
  // 这里可以添加查看船舶更多信息的逻辑
};

const handleVesselCreateWarning = (vesselData) => {
  console.log("为船舶创建预警", vesselData);
  // 这里可以添加为船舶创建预警的逻辑
};

const handleVesselWarningClick = (warning) => {
  console.log("点击船舶相关预警", warning);
  // 这里可以添加点击船舶相关预警的逻辑
};

const handleWarningClose = () => {
  warningInfoVisible.value = false;
};

// 显示面板初始化
const showViewPanel = (panel) => {
  shipEventsPanelVisible.value = false;
  layerControlVisible.value = false;
  legendPanelVisible.value = false;
  comprehensiveSearchVisible.value = false;
  trackQueryPanelVisible.value = false;
  gangVehicleQueryPanelVisible.value = false;
  tideQueryPanelVisible.value = false;
};

// 工具栏事件处理函数
const handleToolbarLayerControl = () => {
  console.log("工具栏：控制图层");
  showViewPanel();
  layerControlVisible.value = true;
};

const handleToolbarLegendDisplay = () => {
  console.log("工具栏：图例展示");
  // 可以显示图例面板
  showViewPanel();
  legendPanelVisible.value = true;
};

const handleToolbarShipEvents = () => {
  console.log("工具栏：船舶事件");
  // 可以显示船舶事件面板
  showViewPanel();
  shipEventsPanelVisible.value = true;
};

const handleToolbarComprehensiveSearch = () => {
  console.log("工具栏：综合检索");
  showViewPanel();
  comprehensiveSearchVisible.value = true;
};

const handleToolbarTrackQuery = () => {
  console.log("工具栏：轨迹查询");
  showViewPanel();
  trackQueryPanelVisible.value = true;
};

const handleToolbarGangVehicleQuery = () => {
  console.log("工具栏：团伙车辆查询");
  showViewPanel();
  gangVehicleQueryPanelVisible.value = true;
};

const handleToolbarTideQuery = () => {
  console.log("工具栏：潮汐查询");
  showViewPanel();
  tideQueryPanelVisible.value = true;
};

const handleKeyPersonnelClose = () => {
  console.log("重点人员弹框关闭");
  keyPersonnelPopupVisible.value = false;
};

const handleToolbarMeasureDistance = () => {
  console.log("工具栏：测距");
  // 关闭标绘面板
  plottingPanelVisible.value = false;
  // 启动测距功能
  if (plotPanelRef.value && plotPanelRef.value.startMeasureDistance) {
    plotPanelRef.value.startMeasureDistance();
  }
};

const handleToolbarMeasureArea = () => {
  console.log("工具栏：测面");
  // 关闭标绘面板
  plottingPanelVisible.value = false;
  // 启动测面功能
  if (plotPanelRef.value && plotPanelRef.value.startMeasureArea) {
    plotPanelRef.value.startMeasureArea();
  }
};

const handleToolbarPlotting = () => {
  console.log("工具栏：标绘");
  // 停止测量功能
  if (plotPanelRef.value && plotPanelRef.value.stopMeasure) {
    plotPanelRef.value.stopMeasure();
  }
  // 切换标绘面板显示状态
  plottingPanelVisible.value = !plottingPanelVisible.value;
};

const handleToolbarClear = () => {
  console.log("工具栏：清空按钮被点击");
  // 清空所有内容
  if (plotPanelRef.value && plotPanelRef.value.clearAll) {
    console.log("调用 PlotPanel 的 clearAll 方法");
    plotPanelRef.value.clearAll();
  } else {
    console.log("PlotPanel 引用不存在或 clearAll 方法不存在");
  }
  // 关闭标绘面板
  plottingPanelVisible.value = false;
};

const handleToolbarLocate = () => {
  console.log("工具栏：定位");
  // 可以定位到当前位置或指定位置
};

const handleToolbarZoomIn = () => {
  console.log("工具栏：放大");
  mapMarkersConfig.zoomIn();
};

const handleToolbarZoomOut = () => {
  console.log("工具栏：缩小");
  mapMarkersConfig.zoomOut();
};

// 标绘面板事件处理
const closePlottingPanel = () => {
  plottingPanelVisible.value = false;
};

const handleFeatureCreated = (feature) => {
  console.log("标绘要素已创建:", feature);
  // PlotPanel 使用 ol-plot 库，不需要我们手动处理
};

const handleFeatureSelected = (feature) => {
  console.log("标绘要素已选中:", feature);
  // PlotPanel 使用 ol-plot 库，不需要我们手动处理
};

const handleFeatureDeleted = (feature) => {
  console.log("标绘要素已删除:", feature);
  // PlotPanel 使用 ol-plot 库，不需要我们手动处理
};

// 图层数据
const layers = ref([
  { id: 1, name: "风险点", visible: true, type: "random-marker-7" },
  { id: 2, name: "交通要道", visible: false, type: "main" },
  { id: 3, name: "工作站", visible: false, type: "main" },
  { id: 4, name: "无走私村", visible: false, type: "main" },
  { id: 5, name: "船舶动态", visible: true, type: "main" },
  { id: 6, name: "车辆动态", visible: true, type: "car" },
  { id: 7, name: "电子围栏", visible: false, type: "main" },
  { id: 8, name: "案件", visible: false, type: "main" },
]);

// 感知设备
const sensingDevices = ref([
  { id: 9, name: "光电雷达覆盖区域", visible: false, type: "main" },
  { id: 10, name: "智能限高杆", visible: false, type: "main" },
  { id: 11, name: "视频感知设备", visible: false, type: "main" },
]);

// 热力图数据
const heatmaps = ref([
  { id: 12, name: "风险点热力图", visible: false, type: "heatmap" },
  { id: 13, name: "综合案件热力图", visible: false, type: "heatmap" },
  { id: 14, name: "涉冻品案件热力图", visible: false, type: "heatmap" },
  { id: 15, name: "涉成品油案件热力图", visible: false, type: "heatmap" },
  { id: 16, name: "车辆运行热力图", visible: false, type: "heatmap" },
  { id: 17, name: "船舶运行热力图", visible: false, type: "heatmap" },
]);

// 控制图层面板事件处理
const handleLayerToggle = (layer) => {
  console.log("图层切换:", layer);
  // 这里可以添加实际的图层显示/隐藏逻辑
  mapMarkersConfig.toggleMarkerVisibilityList(layer.type, layer.visible);
};

// 初始化显示面板(关闭所有面板)
const initShowPanel = () => {
  suspiciousVehiclePopupVisible.value = false;
  keyPersonnelPopupVisible.value = false;
  keyVesselsPopupVisible.value = false;
};

const handleBottomMenuClick = (index) => {
  initShowPanel();
  // 更新激活状态
  activeBottomMenu.value = index;
  if (index === 0) {
    console.log("岸线管控");
  } else if (index === 1) {
    console.log("重点船舶");
    const defaultVisibleLayers = {
      船舶: "ship",
      风险点: "icon",
      电子围栏: "electronic-fence",
      光电雷达覆盖区域: "optical-radar",
      智能限高杆: "smart-height-bar",
      视频感知设备: "video-sensing-device",
      船舶运行热力图: "ship-running-heatmap",
    };
    keyVesselsPopupVisible.value = true;
    handleDefaultVisibleLayers(Object.keys(defaultVisibleLayers));
    // 更新图层
    Object.values(defaultVisibleLayers).forEach((type) => {
      mapMarkersConfig.toggleMarkerVisibilityList(type, true);
    });
    mapMarkersConfig.toggleMarkerVisibilityList("icon", true);
    mapMarkersConfig.toggleMarkerVisibilityList("ship", true);
    mapMarkersConfig.toggleMarkerVisibilityList("car", false);
    mapMarkersConfig.toggleMarkerVisibilityByLayer("轨迹", true);
  } else if (index === 2) {
    console.log("重点人员");
    const defaultVisibleLayers = {
      站图标: "station",
      无走私村图标: "no-smuggling-village",
      案件: "case",
    };
    keyPersonnelPopupVisible.value = true;
    handleDefaultVisibleLayers(Object.keys(defaultVisibleLayers));
    // 更新图层
    Object.values(defaultVisibleLayers).forEach((type) => {
      mapMarkersConfig.toggleMarkerVisibilityList(type, true);
    });
    mapMarkersConfig.toggleMarkerVisibilityList("icon", false);
    mapMarkersConfig.toggleMarkerVisibilityList("ship", false);
    mapMarkersConfig.toggleMarkerVisibilityList("car", false);
    mapMarkersConfig.toggleMarkerVisibilityByLayer("轨迹", true);
  } else if (index === 3) {
    console.log("可疑车辆");
    const defaultVisibleLayers = {
      车辆动态: "car",
      风险点: "icon",
      电子围栏: "electronic-fence",
      交通要道: "traffic-road",
      智能限高杆: "smart-height-bar",
      视频感知设备: "video-sensing-device",
      车辆运行热力图: "vehicle-running-heatmap",
    };
    suspiciousVehiclePopupVisible.value = true;
    handleDefaultVisibleLayers(Object.keys(defaultVisibleLayers));
    // 更新图层
    Object.values(defaultVisibleLayers).forEach((type) => {
      mapMarkersConfig.toggleMarkerVisibilityList(type, true);
    });
    mapMarkersConfig.toggleMarkerVisibilityList("icon", false);
    mapMarkersConfig.toggleMarkerVisibilityList("ship", false);
    mapMarkersConfig.toggleMarkerVisibilityList("car", true);
    mapMarkersConfig.toggleMarkerVisibilityByLayer("轨迹", false);
  }
};

const handleDefaultVisibleLayers = (defaultVisibleLayers) => {
  layers.value.forEach(
    (val) => defaultVisibleLayers.includes(val.name) && (val.visible = true)
  );
  sensingDevices.value.forEach(
    (val) => defaultVisibleLayers.includes(val.name) && (val.visible = true)
  );
  heatmaps.value.forEach(
    (val) => defaultVisibleLayers.includes(val.name) && (val.visible = true)
  );
};

const getMarkerData = () => {
  // 生成随机坐标点（50公里内）
  const randomCoords = generateRandomCoordinates(
    29.330254208488313,
    121.69077697750392,
    50,
    15
  );

  // 添加随机分布的标记点 风险点
  randomCoords.forEach((coord, index) => {
    mapMarkersConfig.addMarker([coord.lng, coord.lat], {
      id: `random-marker-${index}`,
      type: "icon",
      useTypeLayer: useTypeLayer.value,
      style: {
        icon: {
          src: getIconPath("allIcon"),
          size: [18, 18],
          anchor: [0, 0],
          scale: 1,
          displacement: [9, -9],
          offset: [18 * (index % 10), 0], // 使用不同的精灵图位置
          borderSize: 25, // 外边框大小
          borderColor: "#ffa502", // 外边框颜色
          borderWidth: 2, // 外边框宽度
          showBorder: false, // 初始隐藏边框
        },
      },
      data: {
        popupType: "icon",
        title: `可疑车辆 ${index + 1}`,
        description: `距离中心 ${coord.distance.toFixed(1)} 公里`,
        distance: coord.distance,
        cardId: `123456789${index}`,
        type: "高栏货车",
        状态: "行驶中",
        shipName: `浙J${String(35470 + index).padStart(5, "0")}`,
        vehicleType: "高栏货车",
        status: "driving",
        tag: "涉私车辆",
        riskLevel: "high",
        lastUpdate: new Date().toLocaleString(),
      },
    });
  });
  // 生成随机坐标点（50公里内） 可疑车辆
  const carCoords = generateRandomCoordinates(
    29.330254208488313,
    121.69077697750392,
    50,
    6
  );
  carCoords.forEach((coord, index) => {
    mapMarkersConfig.addMarker([coord.lng, coord.lat], {
      id: `random-car-${index}`,
      type: "car",
      useTypeLayer: useTypeLayer.value,
      style: {
        icon: {
          src: getIconPathMarkIcons("icon10"),
          size: [30, 30],
          anchor: [0, 0],
          scale: 1,
          displacement: [14, -14], // 偏移量
          borderSize: 30, // 外边框大小
          borderColor: "#ffa502", // 外边框颜色
          borderWidth: 2, // 外边框宽度
          showBorder: false, // 初始隐藏边框
        },
        text: {
          content: "可疑车辆",
          color: "#000000",
          offsetX: 10,
          offsetY: -17,
          bgImage: "/src/assets/imgs/qb.png", // 背景图片路径
          bgSize: [100, 50], // 背景图片尺寸
          displacement: [18, 9], // 汽包位置偏移
          bgScale: 0.7, // 缩放比例
          bgOpacity: 0.9, // 透明度
          font: "10px Arial",
          showBackground: true,
        },
      },
      data: {
        popupType: "car",
        title: `可疑车辆`,
        description: `距离中心 0 公里`,
        distance: 0,
        cardId: `123456789`,
        type: "高栏货车",
        状态: "行驶中",
        shipName: `浙J35470`,
        vehicleType: "高栏货车",
        status: "driving",
        tag: "涉私车辆",
        riskLevel: "high",
        lastUpdate: new Date().toLocaleString(),
      },
    });
  });

  // 生成随机坐标点（50公里内） 船舶动态
  const shipDynamicCoords = generateRandomCoordinates(
    29.22087519433525,
    122.23688904613172,
    30,
    16
  );
  shipDynamicCoords.forEach((coord, index) => {
    mapMarkersConfig.addMarker([coord.lng, coord.lat], {
      id: `random-ship-dynamic-${index}`,
      type: "ship",
      useTypeLayer: useTypeLayer.value,
      style: {
        icon: {
          src: getIconPathMarkIcons("icon16"),
          size: [30, 30],
          anchor: [0, 0],
          scale: 1,
          displacement: [14, -14], // 偏移量
          borderSize: 30, // 外边框大小
          borderColor: "#ffa502", // 外边框颜色
          borderWidth: 2, // 外边框宽度
          showBorder: false, // 初始隐藏边框
        },
        text: {
          content: "华盛167",
          color: "#000000",
          offsetX: 10,
          offsetY: -17,
          bgImage: "/src/assets/imgs/qb.png", // 背景图片路径
          bgSize: [100, 50], // 背景图片尺寸
          displacement: [18, 9], // 汽包位置偏移
          bgScale: 0.7, // 缩放比例
          bgOpacity: 0.9, // 透明度
          font: "10px Arial",
          showBackground: true,
        },
      },
      data: {
        popupType: "ship",
        title: `船舶动态`,
        description: `距离中心 0 公里`,
        distance: 0,
        cardId: `123456789`,
      },
    });
  });

  const trackLines = [
    [
      [121.4582, 29.3395],
      [121.4033, 29.3658],
      [121.3593, 29.4089],
      [121.2893, 29.4077],
      [121.2138, 29.4208],
    ],
    [
      [121.4582, 29.3395],
      [121.3854, 29.3359],
      [121.2879, 29.3526],
      [121.2206, 29.3155],
    ],
    [
      [121.4582, 29.3395],
      [121.4239, 29.276],
      [121.336, 29.2988],
      [121.2302, 29.2257],
    ],
  ];

  trackLines.forEach((line) => {
    // 生成轨迹路线
    mapMarkersConfig.generateTrackRoute(line, {
      showStartEnd: false,
      animation: false,
      midpointText: "中间点1",
      style: {
        stroke: "#d65e37",
        strokeWidth: 3,
        lineDash: [],
        lineCap: "round",
        lineJoin: "round",
      },
    });
  });

  // 添加带文本的标记点
  // const locationMarker = addMarker([120.31783498535157, 30.37189672436138], {
  //   id: "location-marker",
  //   type: "location",
  //   style: {
  //     color: "#00ffff",
  //     radius: 6,
  //     text: {
  //       content: "白岩码头",
  //       color: "#ffffff",
  //       offsetY: -20,
  //     },
  //   },
  //   });
};

const setInitialVisible = () => {
  // window.location.reload();
};

// 获取滑动指示器样式
const getSliderIndicatorStyle = computed(() => {
  // 响应式位置计算
  const baseWidth = 135; // 指示器宽度
  const spacing = 145.5; // 菜单项间距
  const startOffset = 29; // 起始偏移

  if (
    activeBottomMenu.value >= 0 &&
    activeBottomMenu.value < bottomMenu.value.length
  ) {
    const x = startOffset + activeBottomMenu.value * spacing;
    let y = -1;
    if (activeBottomMenu.value === 1 || activeBottomMenu.value === 2) {
      y = -10;
    }
    return {
      transform: `translate(${x}px, ${y}px)`,
      opacity: 1,
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      width: `${baseWidth}px`,
    };
  }

  return {
    opacity: 0,
    transition: "all 0.3s ease",
    width: `${baseWidth}px`,
  };
});
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  .main-container {
    pointer-events: none;
    position: relative;
    height: 100%;
    .search-container {
      width: 400px;
      height: 40px;
      position: absolute;
      top: 40px;
      left: 16%;
      z-index: 9;
      pointer-events: auto;
      background: rgba(18, 28, 43, 0.8);
      :deep(.ant-input-affix-wrapper) {
        height: 100%;
        // .ant-input {
        //   background: rgba(18, 28, 43, 0.8);
        //   border: none;
        //   border-radius: 4px;
        //   color: #ffffff;
        // }
        // input::-webkit-input-placeholder {
        //   /* Chrome, Safari */
        //   color: #dedada;
        // }
      }
    }
    .warning-container {
      display: flex;
      align-items: center;
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);

      z-index: 100;
      pointer-events: auto;
      .warning-title {
        background: url("@/assets/imgs/border-bg.png") no-repeat center / 100%
          100%;
        width: 140px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px 30px;
        cursor: pointer;
        position: relative;
        .warning-title-num {
          position: absolute;
          top: -5px;
          left: -5px;
          color: #ff552d;
          font-size: 12px;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          background: #ff552d;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      .warning-content {
        color: #ff552d;
        height: 40px;
        cursor: pointer;
        padding: 10px 30px;
        background: url("@/assets/imgs/warning.png") no-repeat center / 100%
          100%;
      }
      .warning-close {
        display: none;
        position: absolute;
        top: -10px;
        right: -6px;
        width: 20px;
        height: 20px;
        margin: auto;
        text-align: center;
        cursor: pointer;
        background-color: rgba(225, 225, 225, 0.6);
        border-radius: 50%;
        &:hover {
          background-color: #cccccc;
        }
      }
      &:hover {
        .warning-close {
          display: block !important;
        }
      }
    }
  }
  .map-controls {
    position: absolute;
    bottom: 90px;
    left: 20px;
    z-index: 100;
    pointer-events: auto;
    .control-panel {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      min-width: 250px;

      h3 {
        margin: 0 0 16px 0;
        color: #333333;
        font-size: 16px;
        font-weight: 600;
      }

      .control-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;

        &:last-child {
          margin-bottom: 0;
        }

        label {
          color: #666666;
          font-weight: 500;
        }

        span {
          color: #333333;
          font-weight: 400;
          font-family: "Courier New", monospace;
        }

        .layer-status {
          color: #1890ff;
          font-weight: 600;
          background: rgba(24, 144, 255, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      }

      .layer-select {
        background: #ffffff;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        padding: 4px 8px;
        color: #333333;
        font-size: 14px;
        min-width: 120px;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        option {
          background: #ffffff;
          color: #333333;
        }
      }
    }
  }
  .bottom-menu {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    pointer-events: auto;
    cursor: pointer;
    background: url("@/assets/imgs/footer-bg.png") no-repeat center / 100% 100%;
    width: 1143px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;

    .bottom-menu-box {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 55%;
      padding: 0 20px;
      margin-top: 20px;

      // 滑动指示器
      .slider-indicator {
        position: absolute;
        top: 0;
        left: 0;
        transform: translate(28px, -1px);
        width: 135px;
        height: 45px;
        background: url("@/assets/imgs/menu-bg.png") no-repeat center / 100%
          100%;
      }

      .bottom-menu-item {
        position: relative;
        z-index: 2;
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        padding: 12px 20px;
        letter-spacing: 2px;
        border-radius: 8px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        justify-content: center;

        img {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        &:hover {
          img {
            transform: scale(1.1);
          }
        }

        &.active {
          font-weight: 700;

          img {
            transform: scale(1.1);
            filter: brightness(1.2);
          }
        }

        &.clicked {
          transform: scale(0.95);
          transition: transform 0.1s ease;
        }
      }

      .bottom-menu-item:nth-child(3) {
        margin-top: -20px;
      }
      .bottom-menu-item:nth-child(4) {
        margin-top: -20px;
      }
    }
  }
}
</style>
