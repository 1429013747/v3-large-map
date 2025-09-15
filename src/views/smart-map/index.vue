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
          <div class="warning-container" @click="handleWarningClick">
            <div class="warning-title">
              <div class="warning-title-num">6</div>
              <img src="@/assets/imgs/text.png" alt="" />
            </div>
            <div class="warning-content">
              白岩码头风险点在2025.06.20 21:00疑似出现走私预警
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
            @layer-click="handleLayerClick"
          />

          <!-- 图例面板 -->
          <LegendPanel v-model:open="legendPanelVisible" />

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
                :tabindex="0"
                :aria-label="`切换到${item.name}`"
                :role="'tab'"
                :aria-selected="index === activeBottomMenu"
                @click="handleBottomMenuClick(index)"
                @keydown.enter="handleBottomMenuClick(index)"
                @keydown.space.prevent="handleBottomMenuClick(index)"
              >
                <img :src="getIcon(item.icon)" :alt="`${item.name}图标`" />
                {{ item.name }}
              </div>
            </div>
          </div>
          <!-- 底部统计信息栏 -->
          <div class="bottom-statistics-bar">
            <!-- 左侧统计数据 -->
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
          <div class="map-controls">
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
                  <option value="CartoDB">CartoDB</option>
                  <option value="高德地图">高德地图</option>
                  <option value="天地图">天地图</option>
                  <option value="天地图卫星">天地图卫星</option>
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
} from "vue";
import MapLayout from "@/layouts/MapLayout.vue";
import MapViewer from "@/components/map/MapViewer.vue";
import WarningDrawer from "@/components/WarningDrawer/WarningDrawer.vue";
import RightToolbar from "@/components/RightToolbar/RightToolbar.vue";
import LegendPanel from "@/components/LegendPanel/LegendPanel.vue";
import PlotPanel from "@/components/PlottingPanel/PlotPanel.vue";
import LayerControlPanel from "@/components/LayerControlPanel/LayerControlPanel.vue";
import { useMapMarkers } from "@/composables/useMapMarkers.js";
import { generateRandomCoordinates } from "@/utils/coordinateGenerator.js";
import "@/styles/marker-popup.scss";
import "@/styles/bottom-statistics.scss";
import "@/styles/layer-control.scss";

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
const activeBottomMenu = ref(0);
const plottingPanelVisible = ref(false);
const layerControlVisible = ref(false);
const legendPanelVisible = ref(false);

// 标绘面板引用
const plotPanelRef = ref(null);

let mapMarkersConfig = {};
const map = ref(null);

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

const getIcon = (icon) => {
  return new URL(`../../assets/imgs/${icon}.png`, import.meta.url).href;
};

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
  const {
    initMarkerLayer,
    addMarker,
    clearMarkers,
    getMarker,
    hideMarkerPopup,
    setCenter,
    setZoom,
    flyTo,
    zoomIn,
    zoomOut,
  } = useMapMarkers(mapInstance);

  mapMarkersConfig = {
    initMarkerLayer,
    addMarker,
    clearMarkers,
    getMarker,
    hideMarkerPopup,
    setCenter,
    setZoom,
    flyTo,
    zoomIn,
    zoomOut,
  };

  // 初始化标记点
  initMarkerLayer();

  // 生成随机坐标点（50公里内）
  const randomCoords = generateRandomCoordinates(
    29.330254208488313,
    121.69077697750392,
    50,
    15
  );

  // 添加随机分布的标记点
  randomCoords.forEach((coord, index) => {
    addMarker([coord.lng, coord.lat], {
      id: `random-marker-${index}`,
      type: "icon",
      style: {
        icon: {
          src: new URL("@/assets/imgs/allIcon.png", import.meta.url).href,
          size: [18, 18],
          anchor: [0, 0],
          scale: 1,
          offset: [18 * (index % 10), 0], // 使用不同的精灵图位置
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
  addMarker([121.68068618480358, 29.374172264358947], {
    id: `random-car-1`,
    type: "car",
    style: {
      icon: {
        src: new URL("@/assets/imgs/markIcons/icon10.png", import.meta.url)
          .href,
        size: [27, 27],
        anchor: [0, 0],
        scale: 1,
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

// 地图点击事件
const onMapClick = (event) => {
  console.log("地图点击事件", event);
  clickedCoordinate.value = event.lonLat;
  // 隐藏标记点弹窗
  // if (markerPopup) {
  //   markerPopup();
  // }
};

// 地图移动事件
const onMapMove = (event) => {
  console.log("地图移动事件", event);
  mapCenter.value = event.center;
  mapZoom.value = event.zoom;
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
  console.log("🚀 ~ handleSearch ~ searchKeyword.value:", searchKeyword.value);
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

// 工具栏事件处理函数
const handleToolbarLayerControl = () => {
  console.log("工具栏：控制图层");
  layerControlVisible.value = true;
};

const handleToolbarLegendDisplay = () => {
  console.log("工具栏：图例展示");
  // 可以显示图例面板
  legendPanelVisible.value = true;
};

const handleToolbarShipEvents = () => {
  console.log("工具栏：船舶事件");
  // 可以显示船舶事件面板
};

const handleToolbarComprehensiveSearch = () => {
  console.log("工具栏：综合检索");
  // 可以显示综合检索面板
};

const handleToolbarTrackQuery = () => {
  console.log("工具栏：轨迹查询");
  // 可以显示轨迹查询面板
};

const handleToolbarGangVehicleQuery = () => {
  console.log("工具栏：团伙车辆查询");
  // 可以显示团伙车辆查询面板
};

const handleToolbarTideQuery = () => {
  console.log("工具栏：潮汐查询");
  // 可以显示潮汐查询面板
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

// 控制图层面板事件处理
const handleLayerToggle = (layer) => {
  console.log("图层切换:", layer);
  // 这里可以添加实际的图层显示/隐藏逻辑
  // 例如：更新地图图层的可见性
  if (mapViewer.value && mapViewer.value.toggleLayer) {
    mapViewer.value.toggleLayer(layer.id, layer.visible);
  }
};

const handleLayerClick = (layer) => {
  console.log("图层点击:", layer);
  // 这里可以添加图层选中逻辑
  // 例如：高亮显示该图层或显示图层详情
};

const handleBottomMenuClick = (index) => {
  // 防止重复点击
  if (activeBottomMenu.value === index) return;

  // 添加点击动画效果
  const menuItems = document.querySelectorAll(".bottom-menu-item");
  if (menuItems[index]) {
    menuItems[index].classList.add("clicked");
    setTimeout(() => {
      menuItems[index].classList.remove("clicked");
    }, 200);
  }

  // 更新激活状态
  activeBottomMenu.value = index;
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
