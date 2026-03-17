<!--
 * @author: guoqiancheng
 * @since: 2025-09-09
-->
<script setup>
import {
  createPopupContentCar,
  createPopupContentRisk,
  createPopupContentShip,
  createPopupMenuShip,
} from "@/composables/createPopupContent.js";
import { useMapMarkers } from "@/composables/useMapMarkers.js";
import { useTrajectoryLayer } from "@/composables/useTrajectoryLayer.js";
import { useRadarScanAnimation } from "@/composables/useRadarScanAnimation.js";
import { getMarkerData } from "@/mock/data.js";
import { useDefaultConfigStore } from "@/stores/defaultConfig.js";
import { getIconPath, getIconPathMarkIcons } from "@/utils/utilstools.js";
import { fromLonLat, toLonLat } from "ol/proj";
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "vue";
import { Vue3SeamlessScroll } from "vue3-seamless-scroll";

const defaultConfigStore = useDefaultConfigStore();
// 地图配置
const mapCenter = reactive([121.92925185863172, 29.275393872226005]); // 宁波坐标
const displayCenter = ref(null);

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
const trackQueryPanelVisible = ref(false);
const tideQueryPanelVisible = ref(false);
const warningInfoVisible = ref(true);
const shipEventsPanelVisible = ref(false);
const modelCenterVisible = ref(false);
const keyVesselsPopupRef = ref(null);
const valueArea = ref([]);

const locationCorrectModalVisible = ref(false);
const locationConfirmModalVisible = ref(false);
const currentCorrectMarkerData = ref(null);
const currentCorrectMarkerId = ref(null);
const hasConfirmedLocationCorrect = ref(false); // 是否已经确认修改过位置

// 可疑车辆弹窗相关
const suspiciousVehiclePopupVisible = ref(false);
const selectedVehicleData = ref({});
const suspiciousVehiclePopupRef = ref(null);
const gangVehicleQueryPanelVisible = ref(false);

// 重点船舶弹窗相关
const keyVesselsPopupVisible = ref(false);
const selectedVesselData = ref({});

// 岸线管控弹窗相关
const CoastlinePopupVisible = ref(false);
const selectedCoastlineData = ref({});
const coastalControlPopupVisible = ref(false);
const coastalControlPopupRef = ref(null);

// 重点人员弹窗相关
const keyPersonnelPopupVisible = ref(false);

const MarkerIds = ref([]);
// 是否启用地图事件
const useMapEvents = ref(true);

const clickMarkerId = ref(null);
const isGeneratingMarker = ref(false);

const riskTyes = [
  "",
  "正常码头",
  "废弃码头",
  "冲滩点",
  "埠口",
  "岙口",
  "岸线",
  "其他",
];

// 标绘面板引用
const plotPanelRef = ref(null);
// 右侧工具栏引用
const rightToolbarRef = ref(null);

let mapMarkersConfig = {};
let heatmapConfig = {};
let trajectoryLayer = {};
let radarScanAnimation = {};
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
const options = ref([
  {
    value: "zhejiang",
    label: "Zhejiang",
    children: [
      {
        value: "hangzhou",
        label: "Hangzhou",
        children: [
          {
            value: "xihu",
            label: "West Lake",
          },
        ],
      },
    ],
  },
  {
    value: "jiangsu",
    label: "Jiangsu",
    children: [
      {
        value: "nanjing",
        label: "Nanjing",
        children: [
          {
            value: "zhonghuamen",
            label: "Zhong Hua Men",
          },
        ],
      },
    ],
  },
]);
// 当前图层
const currentLayer = ref("天地图卫星");

const mapConfig = ref({});

const list = Array.from({ length: 4 }, (_, i) => ({
  id: Date.now() + i + 1,
  name: `白岩码头风险点在${new Date().toLocaleString()}疑似出现走私预警`,
}));

// 切换地图图层
function switchLayer(layerType) {
  // 直接使用传入的 layerType，不要映射
  currentLayer.value = layerType;

  // 调用现有的图层切换逻辑
  if (mapViewer.value && mapViewer.value.switchLayer) {
    mapViewer.value.switchLayer(currentLayer.value);
  }

  console.log("切换到图层:", currentLayer.value);
}

// 地图准备就绪
async function onMapReady(mapInstance) {
  console.log("当前地图中心:", mapCenter);
  map.value = mapInstance; // 设置 map 变量
  mapMarkersConfig = useMapMarkers(map.value, {
 
  });
  radarScanAnimation = useRadarScanAnimation(map.value);
  // 使用类型图层
  useTypeLayer.value = true;
  // 初始化标记点
  mapMarkersConfig.initMarkerLayer(useTypeLayer.value);
  // 初始化轨迹图层
  trajectoryLayer = useTrajectoryLayer(map.value);
  trajectoryLayer.init(map.value, {
    hoverContent: null, // 使用默认的 TrajectoryPointPopup 组件
    enableTrajectoryPlayback: true,
    playbackOptions: {
      icon: new URL("@/assets/icons/trajectory-moving.svg", import.meta.url)
        .href,
      iconScale: 0.66,
      totalSteps: 1000,
      fixedSpeed: 1, // GPS 轨迹播放速度调快（3公里/秒）
      speedMultiplier: 1, // 1倍速播放
      autoPlay: true, // 关闭自动播放，手动指定播放 GPS 轨迹
    },
  });
  // 初始化热力图
  heatmapConfig = useMapHeatmap(map.value);

  // 模拟数据
  getMarkerData(
    mapMarkersConfig,
    useTypeLayer,
    heatmapConfig,
    warningDrawerVisible,
    initShowPanel,
    radarScanAnimation,
  );
}

// 计算风险点图标偏移量
function calculateRiskPointIconOffset(level) {
  switch (level) {
    case 1:
      return [36 * 8, 0];
    case 2:
      return [36 * 7, 0];
    case 3:
      return [36 * 6, 0];
  }
}

// 点击地图添加临时标记点
function addClickMarker(event) {
  clickMarkerId.value = mapMarkersConfig.addMarker(event.lonLat, {
    type: "icon",
    useTypeLayer: useTypeLayer.value,
    style: {
      icon: {
        src: getIconPathMarkIcons("temp_pos"),
        size: [24, 24],
        scale: 0.7,
        displacement: [-8, 12],
        anchor: [0, 0],
      },
    },
  });
}

// 地图点击事件
function onMapClick(event) {
  console.log("地图点击事件", event);
  if (!useMapEvents.value) {
    return;
  }
  if (clickMarkerId.value) {
    mapMarkersConfig.removeMarker(clickMarkerId.value);
    clickMarkerId.value = null;
  }

  clickedCoordinate.value = event.lonLat;

  // 检查是否在位置纠偏模式下
  if (currentCorrectMarkerId.value && !hasConfirmedLocationCorrect.value) {
    // 位置纠偏模式：添加临时标记点并显示确认框（只有在未确认修改的情况下才弹出）
    addClickMarker(event);
    locationConfirmModalVisible.value = true;
    return; // 位置纠偏模式下不处理其他逻辑
  }

  clickedCoordinate.value = event.lonLat;
  const features = map.value.getFeaturesAtPixel(event.pixel, {
    layerFilter: (layer) => {
      if (useTypeLayer.value) {
        // 检查是否是类型图层
        const layerType = layer.get("type");
        const instance = mapMarkersConfig.markerLayersByType.value[layerType];
        if (layerType && instance === layer) {
          return true;
        }
        // 备用方案：检查是否在类型图层列表中
        return Object.values(
          mapMarkersConfig.markerLayersByType.value,
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

    if (clickMarkerId.value) {
      mapMarkersConfig.removeMarker(clickMarkerId.value);
      clickMarkerId.value = null;
    }
    if (MarkerIds.value.length < 2) {
      MarkerIds.value.push(markerId);
    }
    if (MarkerIds.value.length >= 2) {
      mapMarkersConfig.toggleMarkerBorder(MarkerIds.value[0], false);
      MarkerIds.value.shift();
    }
    mapMarkersConfig.toggleMarkerBorder(MarkerIds.value[0], true);
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
}

// 地图双击事件
function onMapDoubleClick(event) {
  console.log("地图双击事件", event);
  if (!useMapEvents.value) {
    return;
  }
  const features = map.value.getFeaturesAtPixel(event.pixel, {
    layerFilter: (layer) => {
      if (useTypeLayer.value) {
        // 检查是否是类型图层
        const layerType = layer.get("type");
        const instance = mapMarkersConfig.markerLayersByType.value[layerType];
        if (layerType && instance === layer) {
          return true;
        }
        // 备用方案：检查是否在类型图层列表中
        return Object.values(
          mapMarkersConfig.markerLayersByType.value,
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
}

// 地图右击事件
function onMapRightClick(event) {
  if (!useMapEvents.value) {
    return;
  }
  const features = map.value.getFeaturesAtPixel(event.pixel, {
    layerFilter: (layer) => {
      if (useTypeLayer.value) {
        // 检查是否是类型图层
        const layerType = layer.get("type");
        const instance = mapMarkersConfig.markerLayersByType.value[layerType];
        if (layerType && instance === layer) {
          return true;
        }
        // 备用方案：检查是否在类型图层列表中
        return Object.values(
          mapMarkersConfig.markerLayersByType.value,
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
    console.log("🚀 ~ onMapRightClick ~ markerData:", markerData);
    if (markerData.popupType !== "ship") {
      return;
    }
    // 触发标记点点击事件
    onMarkerClick({
      flat: true,
      markerId,
      markerData,
      feature,
      coordinate: event.coordinate,
      lonLat: toLonLat(event.coordinate),
      pixel: event.pixel,
    });
  }
}

// 地图移动事件
function onMapMove(event) {
  console.log("地图移动事件", event);
  const center = `${event.center[0].toFixed(4)}, ${event.center[1].toFixed(4)}`;
  displayCenter.value = center;
  mapZoom.value = event.zoom;
}

/**
 * 轨迹回放
 * @param {string} markerId - 标记点ID
 */
async function trackBack(markerId) {
  console.log("轨迹回放:", markerId);
  if (trajectoryLayer) {
    trajectoryLayer.clear();
  }
  // 示例坐标点
  const coordinates = [
    {
      id: markerId, // 使用 id 控制显示/隐藏
      name: "markerId1",
      startPoint: "markerId1" + " " + "起点标签", // 起点标签
      endPoint: "markerId1" + " " + "终点标签", // 终点标签
      data: Array.from({ length: 320 }, (_, idx) => ({
        id: `${markerId}-${idx}`,
        fromAmap: false, // true就这个点不绘制了
        longitude: String(121.72482419397187 + idx * 0.001),
        latitude: String(29.34646109911479 + idx * 0.001),
        pointTime: new Date().toISOString(),
        vehicleNo: "markerId1",
      })),
    },
  ];
  trajectoryLayer.updateData(coordinates, {
    renderTrackPoints: true, // 渲染轨迹点
    // 轨迹点标签：传入函数自定义渲染内容，返回 null 则不显示
    // trackPointLabel: (data) => {
    //   // 例如：显示时间
    //   return dayjs(data.pointTime).format('YYYY-MM-DD HH:mm:ss')
    //   // 或者返回 null 不显示某些点的标签
    //   // return data.speed > 60 ? `${data.speed}km/h` : null
    // }
  });
}

/**
 * 查看更多船舶
 * @param {*} markerId
 */
function viewMoreShip(markerId) {
  console.log("查看更多船舶:", markerId);
  initShowPanel();
  keyVesselsPopupVisible.value = true;
  nextTick(() => {
    keyVesselsPopupRef.value.handleDetail(markerId);
  });
}
/**
 * 设置重点船舶
 * @param {*} markerId
 */
function setKeyShip(markerId) {
  console.log("设置重点船舶:", markerId);
}
/**
 * 船舶查询
 * @param {*} markerId
 */
function shipQuery(markerId) {
  console.log("船舶查询:", markerId);
}
/**
 * 查看可疑车辆更多
 * @param {*} markerId
 */
function viewMore(markerId) {
  console.log("查看可疑车辆更多:", markerId);
  initShowPanel();
  suspiciousVehiclePopupVisible.value = true;
  // activeBottomMenu.value = 3;
  nextTick(() => {
    suspiciousVehiclePopupRef.value.handleDetail(markerId);
  });
}

/**
 * 轨迹纠正
 * @param {*} markerId
 */
function trackCorrect(markerId) {
  console.log("风险点轨迹纠正:", markerId);
  const markerData = mapMarkersConfig.getMarker(markerId);
  currentCorrectMarkerData.value = markerData;
  currentCorrectMarkerId.value = markerId;
  // 重置确认标志，允许新的位置纠偏流程
  hasConfirmedLocationCorrect.value = true;
  locationCorrectModalVisible.value = true;
}

/**
 * 开始位置纠偏模式 - 点击位置纠偏提示框的确定后进入
 */
function handleLocationCorrectStart() {
  // 关闭提示框
  locationCorrectModalVisible.value = false;

  // 重置确认标志，允许弹出第二个弹框
  hasConfirmedLocationCorrect.value = false;

  // 进入位置纠偏模式，设置自定义光标
  isGeneratingMarker.value = true;
  // 创建缩放后的光标图标，热点位置在下方中间
  const iconUrl = new URL(
    "@/assets/imgs/markIcons/set-point.png",
    import.meta.url,
  ).href;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function () {
    // 缩放比例：0.7（缩小到70%）
    const scale = 0.7;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    // 绘制缩放后的图片
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    // 热点位置：下方中间 (宽度的一半, 高度)
    const hotspotX = scaledWidth / 2;
    const hotspotY = scaledHeight;

    // 转换为data URL并设置光标
    const dataUrl = canvas.toDataURL("image/png");
    const customCursor = `url("${dataUrl}") ${hotspotX} ${hotspotY}, pointer`;
    document.body.style.cursor = customCursor;
  };
  img.src = iconUrl;
}

/**
 * 确认位置纠偏
 */
function handleLocationCorrectConfirm() {
  if (currentCorrectMarkerId.value && clickedCoordinate.value) {
    mapMarkersConfig.setMarkerCoordinates(
      currentCorrectMarkerId.value,
      clickedCoordinate.value,
    );
    isGeneratingMarker.value = false;
    mapMarkersConfig.removeMarker(clickMarkerId.value);
    // 恢复默认光标
    document.body.style.cursor = "";

    // 标记已确认修改，之后不能再弹出第二个弹框
    hasConfirmedLocationCorrect.value = true;

    // 关闭确认弹窗
    locationConfirmModalVisible.value = false;
    locationCorrectModalVisible.value = false;
    currentCorrectMarkerData.value = null;
    currentCorrectMarkerId.value = null;
    clickedCoordinate.value = null;
  }
}

/**
 * 取消位置修改确认
 */
function handleLocationConfirmCancel() {
  locationConfirmModalVisible.value = false;
  // 移除临时标记点
  if (clickMarkerId.value) {
    mapMarkersConfig.removeMarker(clickMarkerId.value);
    clickMarkerId.value = null;
  }
  clickedCoordinate.value = null;
}

/**
 * 取消位置纠偏
 */
function handleLocationCorrectCancel() {
  locationCorrectModalVisible.value = false;
  locationConfirmModalVisible.value = false;
  isGeneratingMarker.value = false;
  // 重置确认标志
  hasConfirmedLocationCorrect.value = false;
  // 恢复默认光标
  document.body.style.cursor = "";
  // 清理临时标记点
  if (clickMarkerId.value) {
    mapMarkersConfig.removeMarker(clickMarkerId.value);
    clickMarkerId.value = null;
  }
  currentCorrectMarkerData.value = null;
  currentCorrectMarkerId.value = null;
  clickedCoordinate.value = null;
}
/**
 * 查看更多
 * @param {*} markerId
 */
function viewMoreCorrect(markerId) {
  initShowPanel();
  console.log("风险点查看更多:", markerId);
  warningDrawerVisible.value = true;
}

function deayModal(markerId) {
  mapMarkersConfig.toggleMarkerBorder(markerId, false);
  mapMarkersConfig.removeMarker(clickMarkerId.value);
  isGeneratingMarker.value = false;
  hasConfirmedLocationCorrect.value = true;
  currentCorrectMarkerData.value = null;
  currentCorrectMarkerId.value = null;
  clickedCoordinate.value = null;
  document.body.style.cursor = "";
  document.querySelector(".marker-popup-container").style.display = "none";
}
/**
 * 关闭风险点弹窗
 * @param {*} markerId
 */
function cancelCorrect(markerId) {
  console.log("风险点关闭弹窗:", markerId);
  deayModal(markerId);
}
/**
 * 关闭可疑车辆点弹窗
 * @param {*} markerId
 */
function cancelTrack(markerId) {
  console.log("可疑车辆关闭弹窗:", markerId);
  deayModal(markerId);
}
/**
 * 关闭可疑车辆点弹窗
 * @param {*} markerId
 */
function cancelShip(markerId) {
  console.log("可疑车辆关闭弹窗:", markerId);
  deayModal(markerId);
}
/**
 * 根据类型显示标记点弹窗
 * @param {Array} coordinates - 坐标 [经度, 纬度]
 * @param {object} markerData - 标记点数据
 */
function showMarkerPopup(coordinates, markerData) {
  if (
    !mapMarkersConfig.markerPopupOverlay.value ||
    !mapMarkersConfig.markerPopupElement.value
  ) {
    return;
  }
  // 根据类型创建弹窗内容
  if (markerData.popupType === "car") {
    mapMarkersConfig.markerPopupElement.value.innerHTML = createPopupContentCar(
      markerData,
      trackBack,
      viewMore,
      cancelTrack,
    );
  } else if (markerData.popupType === "ship") {
    if (markerData.flat) {
      mapMarkersConfig.markerPopupElement.value.innerHTML = createPopupMenuShip(
        markerData,
        setKeyShip,
        viewMoreShip,
        shipQuery,
      );
    } else {
      mapMarkersConfig.markerPopupElement.value.innerHTML =
        createPopupContentShip(
          markerData,
          setKeyShip,
          viewMoreShip,
          shipQuery,
          cancelShip,
        );
    }
  } else {
    if (markerData.popupType === "optical-radar") return;
    mapMarkersConfig.markerPopupElement.value.innerHTML =
      createPopupContentRisk(
        markerData,
        trackCorrect,
        viewMoreCorrect,
        cancelCorrect,
      );
  }

  // 设置弹窗位置
  const coordinate = fromLonLat(coordinates);
  mapMarkersConfig.markerPopupOverlay.value.setPosition(coordinate);

  // 显示弹窗
  mapMarkersConfig.markerPopupElement.value.style.display = "block";
}
/**
 * 标记点点击事件处理
 * @param {object} eventData - 点击事件数据
 */
function onMarkerClick(eventData) {
  console.log("标记点被点击:", eventData);

  const { markerId, markerData, coordinate, lonLat, flat } = eventData;

  // 显示弹窗
  showMarkerPopup([lonLat[0], lonLat[1]], {
    flat,
    markerId,
    ...markerData,
    lonLat,
  });
}

// 图层切换事件
function onLayerChange(layerName) {
  currentLayer.value = layerName;
}

// 手动切换图层
function handleLayerChange() {
  if (mapViewer.value && mapViewer.value.switchLayer) {
    mapViewer.value.switchLayer(currentLayer.value);
  }
}

const displayZoom = computed(() => {
  return mapZoom.value || "未获取";
});

const displayClicked = computed(() => {
  return clickedCoordinate.value
    ? `${clickedCoordinate.value[0].toFixed(
        4,
      )}, ${clickedCoordinate.value[1].toFixed(4)}`
    : "未点击";
});

function handleSearch() {
  if (!mapViewer.value || !searchKeyword.value.trim()) return;
  mapMarkersConfig.flyTo([121.72875137035045, 29.358613535256325], 10);
}

// 预警相关方法
function handleWarningClick() {
  initShowPanel();
  warningDrawerVisible.value = true;
}

function handleWarningItemClick(warning) {
  console.log("点击预警项", warning);
}

function handleTrackClick(warning) {
  console.log("列表查看轨迹", warning);
  if (warning.coordinates) {
    if (trajectoryLayer) {
      trajectoryLayer.clear();
    }
    // 示例坐标点
    const coordinates = [
      {
        id: warning.markerId, // 使用 id 控制显示/隐藏
        name: "markerId1",
        startPoint: "markerId1" + " " + "起点标签", // 起点标签
        endPoint: "markerId1" + " " + "终点标签", // 终点标签
        data: Array.from({ length: 320 }, (_, idx) => ({
          id: `${warning.markerId}-${idx}`,
          fromAmap: false, // true就这个点不绘制了
          longitude: String(121.72482419397187 + idx * 0.001),
          latitude: String(29.34646109911479 + idx * 0.001),
          pointTime: new Date().toISOString(),
          vehicleNo: "markerId1",
        })),
      },
    ];
    trajectoryLayer.updateData(coordinates, {
      renderTrackPoints: true, // 渲染轨迹点
      // 轨迹点标签：传入函数自定义渲染内容，返回 null 则不显示
      // trackPointLabel: (data) => {
      //   // 例如：显示时间
      //   return dayjs(data.pointTime).format('YYYY-MM-DD HH:mm:ss')
      //   // 或者返回 null 不显示某些点的标签
      //   // return data.speed > 60 ? `${data.speed}km/h` : null
      // }
    });
  }
}

function handleDetailClick(warning) {
  console.log("查看详情", warning);
  // 这里可以添加详情查看逻辑
}
function getwarning(warning) {
  console.log("预警追溯", warning);
  warningDrawerVisible.value = false;
  // 这里可以添加详情查看逻辑
  if (trajectoryLayer) {
    trajectoryLayer.clear();
  }
  // 示例坐标点
  const coordinates = [
    {
      id: warning.markerId, // 使用 id 控制显示/隐藏
      name: "markerId1",
      startPoint: "markerId1" + " " + "起点标签", // 起点标签
      endPoint: "markerId1" + " " + "终点标签", // 终点标签
      data: Array.from({ length: 320 }, (_, idx) => ({
        id: `${warning.markerId}-${idx}`,
        fromAmap: false, // true就这个点不绘制了
        longitude: String(121.72482419397187 + idx * 0.001),
        latitude: String(29.34646109911479 + idx * 0.001),
        pointTime: new Date().toISOString(),
        vehicleNo: "markerId1",
      })),
    },
  ];
  trajectoryLayer.updateData(coordinates, {
    renderTrackPoints: true, // 渲染轨迹点
    // 轨迹点标签：传入函数自定义渲染内容，返回 null 则不显示
    // trackPointLabel: (data) => {
    //   // 例如：显示时间
    //   return dayjs(data.pointTime).format('YYYY-MM-DD HH:mm:ss')
    //   // 或者返回 null 不显示某些点的标签
    //   // return data.speed > 60 ? `${data.speed}km/h` : null
    // }
  });
}

// 可疑车辆相关事件处理
function handleVehicleTrackBack(vehicleData) {
  console.log("车辆轨迹回放", vehicleData);
  // 这里可以添加轨迹回放逻辑
  if (vehicleData.coordinates) {
    // mapMarkersConfig.flyTo(vehicleData.coordinates, 15);
    if (trajectoryLayer) {
      trajectoryLayer.clear();
    }
    // 示例坐标点
    const coordinates = [
      {
        id: vehicleData.markerId, // 使用 id 控制显示/隐藏
        name: "markerId1",
        startPoint: "markerId1" + " " + "起点标签", // 起点标签
        endPoint: "markerId1" + " " + "终点标签", // 终点标签
        data: Array.from({ length: 320 }, (_, idx) => ({
          id: `${vehicleData.markerId}-${idx}`,
          fromAmap: false, // true就这个点不绘制了
          longitude: String(121.72482419397187 + idx * 0.001),
          latitude: String(29.34646109911479 + idx * 0.001),
          pointTime: new Date().toISOString(),
          vehicleNo: "markerId1",
        })),
      },
    ];
    trajectoryLayer.updateData(coordinates, {
      renderTrackPoints: true, // 渲染轨迹点
      // 轨迹点标签：传入函数自定义渲染内容，返回 null 则不显示
      // trackPointLabel: (data) => {
      //   // 例如：显示时间
      //   return dayjs(data.pointTime).format('YYYY-MM-DD HH:mm:ss')
      //   // 或者返回 null 不显示某些点的标签
      //   // return data.speed > 60 ? `${data.speed}km/h` : null
      // }
    });
  }
}

function handleVehicleCreateWarning(vehicleData) {
  console.log("为车辆创建预警", vehicleData);
  // 这里可以添加创建预警的逻辑
  // 可以打开预警创建面板或直接创建预警
}

function handleVehicleWarningClick(warning) {
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
}

// 监听可疑车辆弹窗关闭
watch(
  () => suspiciousVehiclePopupVisible.value,
  (newVal) => {
    if (!newVal) {
      mapMarkersConfig.toggleMarkerBorder(MarkerIds.value[0], false);
      MarkerIds.value = [];
    }
  },
);

function handleAddVehicle(formData) {
  console.log("新增可疑车辆数据:", formData);
  // 这里可以添加新增车辆的逻辑
  // 可以调用API保存数据，或者在地图上添加新的标记点
  if (formData) {
    // 处理表单数据

    console.log("处理新增车辆数据:", formData);
  }
}

function handleCancelKey(vehicle) {
  console.log("取消重点车辆", vehicle);
  // 这里可以添加取消重点车辆的逻辑
  // 可以调用API更新车辆状态
}
function handleAddVessel(formData) {
  console.log("新增重点船舶数据:", formData);
  // 这里可以添加新增重点船舶的逻辑
}

function handleCancelKeyVessel(vessel) {
  console.log("取消重点船舶", vessel);
  // 这里可以添加取消重点船舶的逻辑
  // 可以调用API更新船舶状态
}

function handleVesselTrackBack(vesselData) {
  console.log("船舶轨迹回放", vesselData);
  // 这里可以添加船舶轨迹回放的逻辑
  if (trajectoryLayer) {
    trajectoryLayer.clear();
  }
  // 示例坐标点
  const coordinates = [
    {
      id: vesselData.markerId, // 使用 id 控制显示/隐藏
      name: "markerId1",
      startPoint: "markerId1" + " " + "起点标签", // 起点标签
      endPoint: "markerId1" + " " + "终点标签", // 终点标签
      data: Array.from({ length: 320 }, (_, idx) => ({
        id: `${vesselData.markerId}-${idx}`,
        fromAmap: false, // true就这个点不绘制了
        longitude: String(121.72482419397187 + idx * 0.001),
        latitude: String(29.34646109911479 + idx * 0.001),
        pointTime: new Date().toISOString(),
        vehicleNo: "markerId1",
      })),
    },
  ];
  trajectoryLayer.updateData(coordinates, {
    renderTrackPoints: true, // 渲染轨迹点
    // 轨迹点标签：传入函数自定义渲染内容，返回 null 则不显示
    // trackPointLabel: (data) => {
    //   // 例如：显示时间
    //   return dayjs(data.pointTime).format('YYYY-MM-DD HH:mm:ss')
    //   // 或者返回 null 不显示某些点的标签
    //   // return data.speed > 60 ? `${data.speed}km/h` : null
    // }
  });
}

function handleVesselCreateWarning(vesselData) {
  console.log("为船舶创建预警", vesselData);
  // 这里可以添加为船舶创建预警的逻辑
}

function handleVesselWarningClick(warning) {
  console.log("点击船舶相关预警", warning);
  // 这里可以添加点击船舶相关预警的逻辑
}

function handleCoastlineCreateWarning(coastlineData) {
  console.log("为岸线管控创建预警", coastlineData);
  // 这里可以添加为岸线管控创建预警的逻辑
}

function handleWarningClose() {
  warningInfoVisible.value = false;
}

// 显示面板初始化
function showViewPanel(panel) {
  shipEventsPanelVisible.value = false;
  layerControlVisible.value = false;
  legendPanelVisible.value = false;
  comprehensiveSearchVisible.value = false;
  trackQueryPanelVisible.value = false;
  gangVehicleQueryPanelVisible.value = false;
  tideQueryPanelVisible.value = false;
  modelCenterVisible.value = false;
}

// 工具栏事件处理函数
function handleToolbarLayerControl() {
  console.log("工具栏：控制图层");
  !layerControlVisible.value && showViewPanel();
  layerControlVisible.value = !layerControlVisible.value;
}

function handleToolbarLegendDisplay() {
  console.log("工具栏：图例展示");
  // 可以显示图例面板
  !legendPanelVisible.value && showViewPanel();
  legendPanelVisible.value = !legendPanelVisible.value;
}

function handleToolbarShipEvents() {
  console.log("工具栏：船舶事件");
  // 可以显示船舶事件面板
  !shipEventsPanelVisible.value && showViewPanel();
  shipEventsPanelVisible.value = !shipEventsPanelVisible.value;
}

function handleToolbarComprehensiveSearch() {
  console.log("工具栏：综合检索");
  !comprehensiveSearchVisible.value && showViewPanel();
  comprehensiveSearchVisible.value = !comprehensiveSearchVisible.value;
}

function handleToolbarTrackQuery() {
  console.log("工具栏：轨迹查询");
  !trackQueryPanelVisible.value && showViewPanel();
  trackQueryPanelVisible.value = !trackQueryPanelVisible.value;
}

function handleToolbarGangVehicleQuery() {
  console.log("工具栏：团伙车辆查询");
  !gangVehicleQueryPanelVisible.value && showViewPanel();
  gangVehicleQueryPanelVisible.value = !gangVehicleQueryPanelVisible.value;
}

function handleToolbarTideQuery() {
  console.log("工具栏：潮汐查询");
  !tideQueryPanelVisible.value && showViewPanel();
  tideQueryPanelVisible.value = !tideQueryPanelVisible.value;
}
function handleToolbarModelCenter() {
  console.log("工具栏：模型中心");
  !modelCenterVisible.value && showViewPanel();
  modelCenterVisible.value = !modelCenterVisible.value;
}

function handleKeyPersonnelClose() {
  console.log("重点人员弹框关闭");
  keyPersonnelPopupVisible.value = false;
}

function handleToolbarMeasureDistance() {
  console.log("工具栏：测距");
  // 关闭标绘面板
  plottingPanelVisible.value = false;
  // 启动测距功能
  if (plotPanelRef.value && plotPanelRef.value.startMeasureDistance) {
    plotPanelRef.value.startMeasureDistance();
  }
}

function handleToolbarMeasureArea() {
  console.log("工具栏：测面");
  // 关闭标绘面板
  plottingPanelVisible.value = false;
  // 启动测面功能
  if (plotPanelRef.value && plotPanelRef.value.startMeasureArea) {
    plotPanelRef.value.startMeasureArea();
  }
}

function handleToolbarPlotting() {
  console.log("工具栏：标绘");
  // 停止测量功能
  if (plotPanelRef.value && plotPanelRef.value.stopMeasure) {
    plotPanelRef.value.stopMeasure();
  }
  // 切换标绘面板显示状态
  plottingPanelVisible.value = !plottingPanelVisible.value;
}

function handleToolbarClear() {
  console.log("工具栏：清空按钮被点击");
  // 清空所有内容
  if (plotPanelRef.value && plotPanelRef.value.clearAll) {
    plotPanelRef.value.clearAll();
  } else {
    console.log("PlotPanel 引用不存在或 clearAll 方法不存在");
  }
  // 关闭标绘面板
  plottingPanelVisible.value = false;
}

function handleToolbarLocate() {
  console.log("工具栏：定位");
  // 可以定位到当前位置或指定位置
  mapMarkersConfig.flyTo([121.92925185863172, 29.275393872226005], 10);
}

function handleToolbarZoomIn() {
  console.log("工具栏：放大");
  mapMarkersConfig.zoomIn();
}

function handleToolbarZoomOut() {
  console.log("工具栏：缩小");
  mapMarkersConfig.zoomOut();
}

// 标绘面板事件处理
function closePlottingPanel() {
  plottingPanelVisible.value = false;
}

function handleFeatureCreated(feature) {
  console.log("标绘要素已创建:", feature);
  // PlotPanel 使用 ol-plot 库，不需要我们手动处理
}

function handleFeatureSelected(feature) {
  console.log("标绘要素已选中:", feature);
  // PlotPanel 使用 ol-plot 库，不需要我们手动处理
}

function handleFeatureDeleted(feature) {
  console.log("标绘要素已删除:", feature);
  // PlotPanel 使用 ol-plot 库，不需要我们手动处理
}

// 图层数据
const layers = ref([
  { id: 1, name: "风险点", visible: true, type: "risk-point" },
  { id: 2, name: "交通要道", visible: false, type: "key-route" },
  { id: 3, name: "工作站", visible: false, type: "work-station" },
  { id: 4, name: "无走私村", visible: false, type: "no-smuggling" },
  { id: 5, name: "船舶动态", visible: true, type: "ship" },
  { id: 6, name: "车辆动态", visible: true, type: "car" },
  { id: 7, name: "电子围栏", visible: false, type: "electronic-fence" },
  { id: 8, name: "案件", visible: false, type: "case" },
]);

// 感知设备
const sensingDevices = ref([
  { id: 9, name: "光电雷达覆盖区域", visible: true, type: "optical-radar" },
  { id: 10, name: "智能限高杆", visible: false, type: "height-bar" },
  {
    id: 11,
    name: "视频感知设备",
    visible: false,
    type: "video-sensing",
  },
]);

// 热力图数据
const heatmaps = ref([
  { id: 12, name: "风险点热力图", visible: false, type: "risk-hot" },
  { id: 13, name: "综合案件热力图", visible: false, type: "case-hot" },
  { id: 14, name: "涉冻品案件热力图", visible: false, type: "ice-hot" },
  { id: 15, name: "涉成品油案件热力图", visible: false, type: "oil-hot" },
  {
    id: 16,
    name: "车辆运行热力图",
    visible: false,
    type: "vehicle-heatmap",
  },
  {
    id: 17,
    name: "船舶运行热力图",
    visible: false,
    type: "ship-heatmap",
  },
]);

const allMarkerListConfigs = {
  风险点: "risk-point",
  电子围栏: "electronic-fence",
  智能限高杆: "height-bar",
  视频感知设备: "video-sensing",
  风险点热力图: "risk-hot",
  船舶动态: "ship",
  无走私村: "no-smuggling",
  光电雷达覆盖区域: "optical-radar",
  船舶运行热力图: "ship-heatmap",
  车辆动态: "car",
  交通要道: "key-route",
  车辆运行热力图: "vehicle-heatmap",
  案件: "case",
  工作站: "work-station",
  综合案件热力图: "case-hot",
  涉冻品案件热力图: "ice-hot",
  涉成品油案件热力图: "oil-hot",
};
// 控制图层面板事件处理
function handleLayerToggle(layer) {
  console.log("图层切换:", layer);
  // 这里可以添加实际的图层显示/隐藏逻辑
  const heatmap = heatmaps.value.find((heatmap) => heatmap.type === layer.type);
  if (heatmap && heatmap.visible) {
    // 只切换当前点击的热力图层，不影响其他图层
    heatmaps.value.forEach((val) => {
      val.visible = val.type === layer.type;
      heatmapConfig.setLayerVisible(val.type, val.visible);
    });
  } else {
    mapMarkersConfig.toggleMarkerVisibilityByLayer(layer.type, layer.visible);
    if (layer.type === "optical-radar") {
      radarScanAnimation.toggleAllRadarVisibility(layer.visible);
    }
  }
}

// 初始化显示面板(关闭所有面板)
function initShowPanel() {
  suspiciousVehiclePopupVisible.value = false;
  keyPersonnelPopupVisible.value = false;
  keyVesselsPopupVisible.value = false;
  warningDrawerVisible.value = false;
  coastalControlPopupVisible.value = false;
  CoastlinePopupVisible.value = false;
}

function handleBottomMenuClick(index) {
  initShowPanel();
  Object.values(allMarkerListConfigs).forEach((type) => {
    mapMarkersConfig.toggleMarkerVisibilityByLayer(type, false);
  });
  // 更新激活状态
  activeBottomMenu.value = index;
  if (index === 0) {
    CoastlinePopupVisible.value = true;
    console.log("岸线管控");
    const defaultVisibleLayers = {
      风险点: "risk-point",
      电子围栏: "electronic-fence",
      智能限高杆: "height-bar",
      视频感知设备: "video-sensing",
      风险点热力图: "risk-hot",
      工作站: "work-station",
      无走私村: "no-smuggling",
      案件: "case",
    };
    handleDefaultVisibleLayers(Object.keys(defaultVisibleLayers));
    Object.values(defaultVisibleLayers).forEach((type) => {
      mapMarkersConfig.toggleMarkerVisibilityByLayer(type, true);
    });
  } else if (index === 1) {
    console.log("重点船舶");
    const defaultVisibleLayers = {
      船舶动态: "ship",
      风险点: "risk-point",
      电子围栏: "electronic-fence",
      光电雷达覆盖区域: "optical-radar",
      智能限高杆: "height-bar",
      视频感知设备: "video-sensing",
      船舶运行热力图: "ship-heatmap",
    };
    keyVesselsPopupVisible.value = true;
    handleDefaultVisibleLayers(Object.keys(defaultVisibleLayers));
    // 更新图层
    Object.values(defaultVisibleLayers).forEach((type) => {
      mapMarkersConfig.toggleMarkerVisibilityByLayer(type, true);
    });
  } else if (index === 2) {
    console.log("重点人员");
    const defaultVisibleLayers = {
      工作站: "work-station",
      无走私村: "no-smuggling",
      案件: "case",
    };
    keyPersonnelPopupVisible.value = true;
    handleDefaultVisibleLayers(Object.keys(defaultVisibleLayers));
    // 更新图层
    Object.values(defaultVisibleLayers).forEach((type) => {
      mapMarkersConfig.toggleMarkerVisibilityByLayer(type, true);
    });
  } else if (index === 3) {
    console.log("可疑车辆");
    const defaultVisibleLayers = {
      车辆动态: "car",
      风险点: "risk-point",
      电子围栏: "electronic-fence",
      交通要道: "key-route",
      智能限高杆: "height-bar",
      视频感知设备: "video-sensing",
      车辆运行热力图: "vehicle-heatmap",
    };
    suspiciousVehiclePopupVisible.value = true;
    handleDefaultVisibleLayers(Object.keys(defaultVisibleLayers));
    // 更新图层
    Object.values(defaultVisibleLayers).forEach((type) => {
      mapMarkersConfig.toggleMarkerVisibilityByLayer(type, true);
    });
  }
}

function handleDefaultVisibleLayers(defaultVisibleLayers) {
  [...layers.value, ...sensingDevices.value, ...heatmaps.value].forEach(
    (val) => (val.visible = false),
  );
  [...layers.value, ...sensingDevices.value, ...heatmaps.value].forEach(
    (val) => defaultVisibleLayers.includes(val.name) && (val.visible = true),
  );
}

function setInitialVisible() {
  // window.location.reload();
}

// 获取路由跳转前缓存配置状态
const coastlineStatus = computed(() => defaultConfigStore.getCoastlineStatus);
function setCoastlineStatus(status) {
  CoastlinePopupVisible.value = coastlineStatus.value.coastlinePopupVisible;
  activeBottomMenu.value = coastlineStatus.value.activeBottomMenu;
}

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

onMounted(async () => {
  await nextTick();
  const layersData = [
    ...layers.value,
    ...sensingDevices.value,
    ...heatmaps.value,
  ];
  layersData.forEach((layer) => {
    mapMarkersConfig.toggleMarkerVisibilityByLayer(layer.type, layer.visible);
  });

  // 还原跳转前页面状态
  if (coastlineStatus.value) {
    setCoastlineStatus();
    nextTick(() => {
      defaultConfigStore.setCoastlinePopupVisible(null);
      console.log("还原跳转前状态", coastlineStatus.value);
    });
  }

  console.log("coastlineStatus", coastlineStatus.value);
});
onUnmounted(() => {
  mapMarkersConfig.trackDestroy();
  mapMarkersConfig.destroy();
  mapMarkersConfig.destroyClustering();
  radarScanAnimation.destroy();
});
</script>

<template>
  <div class="container">
    <MapLayout :show-map="true" :enable-scale="true" title="智能地图">
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
          @map-right-click="onMapRightClick"
        />
      </template>
      <template #default>
        <div class="main-container">
          <!-- 顶部搜索 -->
          <!-- <div class="search-container">
            <a-cascader v-model:value="valueArea" :options="options" placeholder="请选择区域" allow-clear />
            <a-input v-model:value="searchKeyword" placeholder="请输入关键词" allow-clear @press-enter="handleSearch">
              <template #suffix>
                <SearchOutlined @click="handleSearch" />
              </template>
            </a-input>
          </div> -->
          <!-- 顶部预警 -->
          <div
            v-if="warningInfoVisible"
            class="warning-container"
            @click="handleWarningClick"
          >
            <div class="warning-title">
              <div class="warning-title-num">
                6
              </div>
              <img src="@/assets/imgs/text.png" alt="">
            </div>
            <div class="warning-content">
              <Vue3SeamlessScroll
                :list="list"
                direction="up"
                :hover="true"
                :step="0.35"
                :delay="2000"
              >
                <template #default="{ data }">
                  <div class="warning-content-item">
                    {{ data.name }}
                  </div>
                </template>
              </Vue3SeamlessScroll>
            </div>

            <!-- <div class="warning-close" @click.stop="handleWarningClose">
              <CloseOutlined style="font-size: 14px; color: #fff" />
            </div> -->
          </div>
          <!-- 左侧预警抽屉 -->
          <WarningDrawer
            v-model:open="warningDrawerVisible"
            @warning-click="handleWarningItemClick"
            @track-click="handleTrackClick"
            @detail-click="handleDetailClick"
            @getwarning="getwarning"
          />
          <!-- 右侧工具栏 -->
          <RightToolbar
            ref="rightToolbarRef"
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
            @model-center="handleToolbarModelCenter"
          />

          <!-- 应急标绘面板 -->
          <PlotPanel
            ref="plotPanelRef"
            :map="map"
            :visible="plottingPanelVisible"
            @close="closePlottingPanel"
            @feature-created="handleFeatureCreated"
            @feature-selected="handleFeatureSelected"
            @feature-deleted="handleFeatureDeleted"
          />
          <!-- 控制图层面板 -->
          <LayerControlPanel
            v-model:open="layerControlVisible"
            :layers="layers"
            :sensing-devices="sensingDevices"
            :heatmaps="heatmaps"
            @layer-toggle="handleLayerToggle"
            @closed="rightToolbarRef?.onClose({ id: 'layer-control' })"
          />

          <!-- 图例面板 -->
          <LegendPanel
            v-model:open="legendPanelVisible"
            @closed="rightToolbarRef?.onClose({ id: 'legend-display' })"
          />
          <!-- 综合检索面板 -->
          <ComprehensiveSearchPanel
            v-model:open="comprehensiveSearchVisible"
            @closed="rightToolbarRef?.onClose({ id: 'comprehensive-search' })"
          />

          <!-- 船舶事件面板 -->
          <ShipEventsPanel
            v-model:open="shipEventsPanelVisible"
            @closed="rightToolbarRef?.onClose({ id: 'ship-events' })"
          />

          <!-- 轨迹查询面板 -->
          <TrackQueryPanel
            v-model:open="trackQueryPanelVisible"
            :map-markers-config="mapMarkersConfig"
            @closed="rightToolbarRef?.onClose({ id: 'track-query' })"
          />

          <!-- 团伙车辆查询面板 -->
          <GangVehicleQueryPanel v-model:open="gangVehicleQueryPanelVisible" />

          <!-- 潮汐查询面板 -->
          <TideQueryPanel
            v-model:open="tideQueryPanelVisible"
            @closed="rightToolbarRef?.onClose({ id: 'tide-query' })"
          />

          <!-- 模型中心面板 -->
          <ModelCenterPanel
            v-model:open="modelCenterVisible"
            @closed="rightToolbarRef?.onClose({ id: 'model-center' })"
          />

          <!-- 可疑车辆弹窗 -->
          <SuspiciousVehiclePopup
            ref="suspiciousVehiclePopupRef"
            v-model:open="suspiciousVehiclePopupVisible"
            :vehicle-data="selectedVehicleData"
            @track-back="handleVehicleTrackBack"
            @create-warning="handleVehicleCreateWarning"
            @vehicle-click="handleVehicleWarningClick"
            @add-vehicle="handleAddVehicle"
            @cancel-key="handleCancelKey"
          />
          <!-- 岸线管控弹窗 -->
          <CoastlinePopup
            ref="keyVesselsPopupRef"
            v-model:open="CoastlinePopupVisible"
            :coastline-data="selectedCoastlineData"
          />
          <!-- 应急标绘面板 -->
          <PlotPanel
            ref="plotPanelRef"
            :map="map"
            :visible="plottingPanelVisible"
            @close="closePlottingPanel"
            @feature-created="handleFeatureCreated"
            @feature-selected="handleFeatureSelected"
            @feature-deleted="handleFeatureDeleted"
          />
          <!-- 重点船舶弹窗 -->
          <KeyVesselsPopup
            ref="keyVesselsPopupRef"
            v-model:open="keyVesselsPopupVisible"
            :vessels-data="selectedVesselData"
            @track-back="handleVesselTrackBack"
            @create-warning="handleVesselCreateWarning"
            @vessels-click="handleVesselWarningClick"
            @add-vessels="handleAddVessel"
            @cancel-key="handleCancelKeyVessel"
          />

          <!-- 重点人员弹窗 -->
          <KeyPersonnelPopup
            v-model:open="keyPersonnelPopupVisible"
            @close="handleKeyPersonnelClose"
          />

          <!-- 底部菜单 -->
          <div class="bottom-menu">
            <div class="bottom-menu-box">
              <!-- 滑动指示器 -->
              <div
                v-show="activeBottomMenu !== -1"
                class="slider-indicator"
                :style="getSliderIndicatorStyle"
              />
              <div
                v-for="(item, index) in bottomMenu"
                :key="item.name"
                class="bottom-menu-item"
                :class="{ active: index === activeBottomMenu }"
                @click="handleBottomMenuClick(index)"
              >
                <img :src="getIconPath(item.icon)" :alt="`${item.name}图标`">
                {{ item.name }}
              </div>
            </div>
          </div>
          <!-- 底部统计信息栏 -->
          <div class="bottom-statistics-bar">
            <div class="statistics-left">
              <div class="stat-item">
                <span class="stat-label">图层 :</span>
                <span class="stat-value">{{ statistics.layerCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">预警数量 :</span>
                <span class="stat-value">{{ statistics.warningCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">重点船舶 :</span>
                <span class="stat-value">{{ statistics.keyVessels }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">在航 :</span>
                <span class="stat-value">{{ statistics.underway }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">停泊 :</span>
                <span class="stat-value">{{ statistics.anchored }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">可疑车辆 :</span>
                <span class="stat-value">{{
                  statistics.suspiciousVehicles
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">实时境内车辆 :</span>
                <span class="stat-value">{{
                  statistics.realtimeVehicles
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">昨日累计车辆 :</span>
                <span class="stat-value">{{
                  statistics.yesterdayVehicles
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">电子围栏 :</span>
                <span class="stat-value">{{
                  statistics.electronicFences
                }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">重点人员 :</span>
                <span class="stat-value">{{ statistics.keyPersonnel }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">风险点 :</span>
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
                  class="layer-select"
                  @change="handleLayerChange"
                >
                  <option value="天地图">
                    天地图
                  </option>
                  <option value="天地图卫星">
                    天地图卫星
                  </option>
                  <option value="高德地图">
                    高德地图
                  </option>
                  <option value="高德卫星">
                    高德卫星
                  </option>
                  <option value="CartoDB">
                    CartoDB
                  </option>
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

    <!-- 位置纠偏提示对话框 -->
    <a-modal
      v-model:open="locationCorrectModalVisible"
      :title="null"
      :footer="null"
      :mask="false"
      centered
      width="440px"
      get-container=".ui-container"
      class="location-correct-modal"
      :z-index="99999"
    >
      <div class="location-correct-content">
        <div class="location-correct-title">
          位置纠偏提示
        </div>
        <div class="location-correct-body" />
        <div class="location-correct-footer">
          <div class="warning-text">
            <div>
              <img
                src="@/assets/imgs/markIcons/set-point.png"
                alt="位置纠偏提示"
              >
            </div>
            <span>请在地图处重新标注位置</span>
          </div>
          <a-button
            type="primary"
            class="confirm-btn"
            @click="handleLocationCorrectStart"
          >
            确定
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 位置修改确认对话框 -->
    <a-modal
      v-model:open="locationConfirmModalVisible"
      :title="null"
      :footer="null"
      :mask="false"
      centered
      width="400px"
      get-container=".ui-container"
      class="location-confirm-modal"
      :z-index="99999"
    >
      <div class="location-confirm-content">
        <div class="location-confirm-title">
          确认修改位置
        </div>
        <div class="location-confirm-body">
          <div class="confirm-text">
            是否确认将标记点位置修改到当前点击位置？
          </div>
        </div>
        <div class="location-confirm-footer">
          <a-button class="cancel-btn" @click="handleLocationConfirmCancel">
            重新标注
          </a-button>
          <a-button
            type="primary"
            class="confirm-btn"
            @click="handleLocationCorrectConfirm"
          >
            确定
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
@use "./index.scss" as *;
</style>
