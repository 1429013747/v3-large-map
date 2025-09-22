<script setup>
import { Col, Row } from "ant-design-vue";
import Plot from "ol-plot";
import { onMounted, reactive, ref, shallowRef, watch } from "vue";
import "ol-plot/dist/ol-plot.css";
import { Feature } from "ol";
import { Point, LineString, Polygon } from "ol/geom";
import { Style, Stroke, Fill, Text, Circle as CircleStyle } from "ol/style";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Draw } from "ol/interaction";
import { getLength, getArea } from "ol/sphere";

// 定义组件属性
const props = defineProps({
  map: Object,
  visible: {
    type: Boolean,
    default: false,
  },
});

// 定义事件
const emit = defineEmits([
  "close",
  "featureCreated",
  "featureSelected",
  "featureDeleted",
]);

// 标绘工具列表（参考原始 plot.vue）
const plotTools = [
  { id: "Point", name: "目标", alias: "Point", src: "Point" },
  {
    id: "AttackArrow",
    name: "进攻方向",
    alias: "AttackArrow",
    src: "AttackArrow",
  },
  {
    id: "AssaultDirection",
    name: "直箭头",
    alias: "AssaultDirection",
    src: "AssaultDirection",
  },
  { id: "FineArrow", name: "斜箭头", alias: "FineArrow", src: "FineArrow" },
  {
    id: "DoubleArrow",
    name: "双箭头",
    alias: "DoubleArrow",
    src: "DoubleArrow",
  },
  {
    id: "StraightArrow",
    name: "细直箭头",
    alias: "StraightArrow",
    src: "StraightArrow",
  },
  {
    id: "TailedAttackArrow",
    name: "燕尾曲箭头",
    alias: "TailedAttackArrow",
    src: "TailedAttackArrow",
  },
  {
    id: "SquadCombat",
    name: "曲箭头",
    alias: "SquadCombat",
    src: "SquadCombat",
  },
  { id: "RectAngle", name: "矩形", alias: "RectAngle", src: "RectAngle" },
  { id: "Circle", name: "圆形", alias: "Circle", src: "Circle" },
  { id: "Ellipse", name: "椭圆形", alias: "Ellipse", src: "Ellipse" },
  { id: "Polygon", name: "多边形", alias: "Polygon", src: "Polygon" },
  { id: "Sector", name: "扇形", alias: "Sector", src: "Sector" },
  { id: "Arc", name: "弓形", alias: "Arc", src: "Arc" },
  { id: "Polyline", name: "线", alias: "Polyline", src: "Polyline" },
  { id: "Curve", name: "曲线", alias: "Curve", src: "Curve" },
  // { id: 'TextArea', name: '气泡', alias: 'TextArea', src: 'TextArea' }
];

// 响应式状态
const plot = shallowRef();
const selectedTool = ref("");
const currentTextArea = shallowRef();
const hoveredTool = ref("");

// 测距和测面相关状态
const measureLayer = ref(null);
const measureSource = ref(null);
const drawInteraction = ref(null);
const isMeasuring = ref(false);
const measureType = ref(""); // 'distance' 或 'area'

// 样式状态
const styleState = reactive({
  backgroundColor: "#1989fa",
  borderColor: "#1989fa",
  borderWidth: 2,
  opacity: 0.6,
  textAreaBackgroundColor: "rgba(14, 23, 40, 0.9)",
  textAreaBorderColor: "rgba(25, 137, 250, 0.6)",
  textAreaColor: "#ffffff",
  textAreaFontSize: 14,
  textAreaBorderWidth: 1,
});

// 获取图片路径
function getImageUrl(toolName, isActive = false, isHover = false) {
  // 优先级：激活状态 > hover状态 > 默认状态
  const suffix = isActive || isHover ? "-hover" : "";
  try {
    // 使用 Vite 的动态导入来获取图片 URL
    return new URL(`../../assets/img/${toolName}${suffix}.png`, import.meta.url)
      .href;
  } catch (error) {
    console.warn(`图片加载失败: ${toolName}${suffix}.png`, error);
    // 返回默认占位符
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`;
  }
}

// 格式化长度
function formatLength(length, precision = 2) {
  if (length >= 1000) {
    return `${(length / 1000).toFixed(precision)} km`;
  } else {
    return `${length.toFixed(precision)} m`;
  }
}

// 格式化面积
function formatArea(area, precision = 2) {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(precision)} km²`;
  } else if (area >= 10000) {
    return `${(area / 10000).toFixed(precision)} 公顷`;
  } else {
    return `${area.toFixed(precision)} m²`;
  }
}

// 初始化测量图层
function initMeasureLayer() {
  if (!props.map) return;

  measureSource.value = new VectorSource();
  measureLayer.value = new VectorLayer({
    source: measureSource.value,
    title: '测量',
    zIndex: 1009, // 在标绘图层之下
  });

  props.map.addLayer(measureLayer.value);
}

// 创建测量样式
function createMeasureStyle() {
  return new Style({
    stroke: new Stroke({
      color: "#ff6b6b",
      width: 3,
      lineDash: [5, 5],
    }),
    fill: new Fill({
      color: "rgba(255, 107, 107, 0.1)",
    }),
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: "#ff6b6b" }),
      stroke: new Stroke({
        color: "#ffffff",
        width: 2,
      }),
    }),
  });
}

// 添加距离标签
function addDistanceLabel(coordinates, distance) {
  const feature = new Feature({
    geometry: new Point(coordinates[coordinates.length - 1]),
    type: "distance_label",
  });

  const textStyle = new Style({
    text: new Text({
      text: distance,
      font: "bold 14px Arial",
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({
        color: "#ff6b6b",
        width: 4,
      }),
      offsetY: -15,
      textAlign: "center",
      textBaseline: "middle",
    }),
  });

  feature.setStyle(textStyle);
  measureSource.value.addFeature(feature);
}

// 添加面积标签
function addAreaLabel(coordinates, area) {
  const feature = new Feature({
    geometry: new Point(coordinates),
    type: "area_label",
  });

  const textStyle = new Style({
    text: new Text({
      text: area,
      font: "bold 14px Arial",
      fill: new Fill({ color: "#ffffff" }),
      stroke: new Stroke({
        color: "#ff6b6b",
        width: 3,
      }),
      offsetY: -15,
      textAlign: "center",
      textBaseline: "middle",
    }),
  });

  feature.setStyle(textStyle);
  measureSource.value.addFeature(feature);
}

// 监听样式变化并应用到标绘要素
watch(
  () => styleState.borderWidth,
  (v) => {
    if (!plot.value || !plot.value.plotEdit.activePlot) return;
    plot.value.plotUtils.setBorderWidth(plot.value.plotEdit.activePlot, v);
  }
);

watch(
  () => styleState.opacity,
  (v) => {
    if (!plot.value) return;

    // 更新绘制图层的透明度（影响新绘制的要素）
    if (plot.value.plotDraw && plot.value.plotDraw.drawLayer) {
      plot.value.plotDraw.drawLayer.setOpacity(v);
    }

    // 更新当前激活要素的透明度
    if (plot.value.plotEdit && plot.value.plotEdit.activePlot) {
      plot.value.plotUtils.setOpacity(plot.value.plotEdit.activePlot, v);
    }
  }
);

watch(
  () => styleState.backgroundColor,
  (v) => {
    if (!plot.value || !plot.value.plotEdit.activePlot) return;
    plot.value.plotUtils.setBackgroundColor(plot.value.plotEdit.activePlot, v);
  }
);

watch(
  () => styleState.borderColor,
  (v) => {
    if (!plot.value || !plot.value.plotEdit.activePlot) return;
    plot.value.plotUtils.setBorderColor(plot.value.plotEdit.activePlot, v);
  }
);

// 文本区域样式监听
watch(
  () => styleState.textAreaBackgroundColor,
  (v) => {
    if (!currentTextArea.value || !v) return;
    currentTextArea.value.setStyle({ background: v });
  }
);

watch(
  () => styleState.textAreaBorderColor,
  (v) => {
    if (!currentTextArea.value || !v) return;
    currentTextArea.value.setStyle({
      border: `${styleState.textAreaBorderWidth}px solid ${v}`,
    });
  }
);

watch(
  () => styleState.textAreaColor,
  (v) => {
    if (!currentTextArea.value || !v) return;
    currentTextArea.value.setStyle({ color: v });
  }
);

watch(
  () => styleState.textAreaFontSize,
  (v) => {
    if (!currentTextArea.value || !v) return;
    currentTextArea.value.setStyle({ fontSize: `${v}px` });
  }
);

watch(
  () => styleState.textAreaBorderWidth,
  (v) => {
    if (!currentTextArea.value || !v) return;
    currentTextArea.value.setStyle({
      border: `${v}px solid ${styleState.textAreaBorderColor}`,
    });
  }
);

// 开始测距
function startMeasureDistance() {
  if (!props.map || !measureSource.value) return;

  // 停止其他测量
  stopMeasure();

  // 创建线绘制交互
  drawInteraction.value = new Draw({
    source: measureSource.value,
    type: "LineString",
    style: createMeasureStyle(),
  });

  // 添加绘制完成事件
  drawInteraction.value.on("drawend", (event) => {
    const feature = event.feature;
    const geometry = feature.getGeometry();

    // 计算距离
    const length = getLength(geometry);
    const formattedLength = formatLength(length, 2);

    // 设置feature的样式
    feature.setStyle(
      new Style({
        stroke: new Stroke({
          color: "#3789c2",
          width: 4,
          lineDash: [0, 0],
        }),
      })
    );

    // 添加距离标签
    const coordinates = geometry.getCoordinates();
    addDistanceLabel(coordinates, formattedLength);

    // 停止测量
    stopMeasure();
  });

  props.map.addInteraction(drawInteraction.value);
  measureType.value = "distance";
  isMeasuring.value = true;

  console.log("开始测距");
}

// 开始测面
function startMeasureArea() {
  if (!props.map || !measureSource.value) return;

  // 停止其他测量
  stopMeasure();

  // 创建多边形绘制交互
  drawInteraction.value = new Draw({
    source: measureSource.value,
    type: "Polygon",
    style: createMeasureStyle(),
  });

  // 添加绘制完成事件
  drawInteraction.value.on("drawend", (event) => {
    const feature = event.feature;
    const geometry = feature.getGeometry();

    // 计算面积
    const area = getArea(geometry);
    const formattedArea = formatArea(area, 2);

    // 添加面积标签
    const coordinates = geometry.getInteriorPoint().getCoordinates();
    addAreaLabel(coordinates, formattedArea);

    // 停止测量
    stopMeasure();
  });

  props.map.addInteraction(drawInteraction.value);
  measureType.value = "area";
  isMeasuring.value = true;

  console.log("开始测面");
}

// 停止测量
function stopMeasure() {
  if (drawInteraction.value) {
    props.map.removeInteraction(drawInteraction.value);
    drawInteraction.value = null;
  }

  measureType.value = "";
  isMeasuring.value = false;
}

// 清空测量
function clearMeasure() {
  // 停止正在进行的测量
  stopMeasure();

  // 清空测量数据源
  if (measureSource.value) {
    measureSource.value.clear();
  } else {
    console.log("测量数据源不存在");
  }
}

// 切换选中工具
function selectTool(tool) {
  selectedTool.value = tool.alias;
  if (tool.alias) {
    // 停止测量
    stopMeasure();
    plot.value.plotEdit.deactivate();
    plot.value.plotDraw.activate(tool.alias);
  } else {
    console.warn("不存在的标绘类型！");
  }
}

// 激活面板（当选中要素时）
function activePanel(feature) {
  if (feature && feature.getGeometry && feature.getGeometry()) {
    const type = feature.getGeometry().getPlotType();
    if (type) {
      selectedTool.value = type;
    }
    // 刷新样式
    refreshStyle(plot.value.plotUtils.getStyleCode(feature));
  }
}

// 刷新样式
function refreshStyle(style) {
  if (style) {
    if (style.fill) {
      // 保持透明度为当前设置的0.6，不被样式覆盖
      // styleState.opacity = style.fill.opacity || styleState.opacity
      styleState.backgroundColor =
        style.fill.fillColor || styleState.backgroundColor;
    }
    if (style.stroke) {
      styleState.borderWidth =
        style.stroke.strokeWidth || styleState.borderWidth;
      styleState.borderColor =
        style.stroke.strokeColor || styleState.borderColor;
    }
  }
}

// 刷新文本区域样式
function refreshTextArea(overlay) {
  if (overlay) {
    const _style = overlay.getStyle();
    if (_style) {
      if (_style.fontSize) {
        styleState.textAreaFontSize = Number.parseInt(_style.fontSize, 10);
      }
      if (_style.color) {
        styleState.textAreaColor = _style.color;
      }
      // 处理边框样式
      if (_style.border) {
        const borderParts = _style.border.split(" ");
        borderParts.every((item) => {
          if (item.includes("px")) {
            styleState.textAreaBorderWidth = Number.parseInt(item, 10);
            return false;
          }
          return true;
        });
        // 提取边框颜色
        const rgbMatch = _style.border.match(/rgb\([^)]+\)/);
        if (rgbMatch) {
          styleState.textAreaBorderColor = rgbMatch[0];
        }
      }
      if (_style.background) {
        const bgMatch = _style.background.match(/rgb\([^)]+\)/);
        if (bgMatch) {
          styleState.textAreaBackgroundColor = bgMatch[0];
        }
      }
    }
  }
}

// 绘制结束回调
function onDrawEnd({ feature }) {
  if (feature) {
    plot.value.plotEdit.activate(feature);
    console.log(plot.value.plotEdit, "plot.value.plotEdit");
    // 立即设置透明度
    setTimeout(() => {
      if (plot.value && plot.value.plotEdit.activePlot) {
        plot.value.plotUtils.setOpacity(
          plot.value.plotEdit.activePlot,
          styleState.opacity
        );
      }
    }, 100);
    activePanel(feature);
    emit("featureCreated", feature);
  }
}

// 激活文本区域编辑
function activeTextArea({ overlay }) {
  currentTextArea.value = overlay;
  selectedTool.value = "TextArea";
  refreshTextArea(overlay);
  plot.value.plotEdit.deactivate();
}

// 地图点击处理
function handleClick(event) {
  if (!props.map) return;
  const feature = props.map.forEachFeatureAtPixel(event.pixel, (f) => f);
  if (feature && feature.get("isPlot") && !plot.value.plotDraw.isDrawing()) {
    plot.value.plotEdit.activate(feature);
    // 设置透明度
    setTimeout(() => {
      if (plot.value && plot.value.plotEdit.activePlot) {
        plot.value.plotUtils.setOpacity(
          plot.value.plotEdit.activePlot,
          styleState.opacity
        );
      }
    }, 50);
    activePanel(feature);
    emit("featureSelected", feature);
  } else {
    plot.value.plotEdit.deactivate();
  }
  currentTextArea.value = null;
}

// 初始化标绘工具
function initPlot() {
  if (!plot.value && props.map) {
    // 初始化测量图层
    initMeasureLayer();

    /* eslint new-cap: 0 */
    plot.value = new Plot(props.map, {
      zIndex: 1009,
      zoomToExtent: true, // 自动缩放
    });
    // 设置样式
    const plotStyle = new Plot.StyleFactory({
      fill: {
        fillColor: styleState.backgroundColor,
      },
      stroke: {
        strokeColor: styleState.borderColor,
        strokeWidth: styleState.borderWidth,
      },
      image: {
        type: "icon",
        image: {
          imageAnchor: [0.5, 0.5],
          imageAnchorXUnits: "fraction",
          imageAnchorYUnits: "fraction",
          imageOpacity: 0.75,
          imageSrc:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpmODA3ZDlmZS1mOTRhLTRmZDktOWYwYS05ZTk3NjdkYTUxMjUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDM3RkNGQUJDOEUyMTFFNkIwMDFGOUI0RDhFQUI4NEYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDM3RkNGQUFDOEUyMTFFNkIwMDFGOUI0RDhFQUI4NEYiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ZDc5MmU0ODgtMzAxNC1kNDRiLWI4OWEtYmIxMzNhYWIyYjI1IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjU1YWEwNTQ3LTlmMGQtNDllYS1hOGI4LTRkZWRhMmU1OGRiMSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PoW3u00AAAMESURBVHja7FdLaFNBFJ2Z1/eapCnUam0V6cYWEdd+FkUK4kIRF4pLxeJOV4IbpaDQgoiCK9d+loIIKi4V3CmuRJCCImpRW2ur5NP83oznJE1IXmZqEsVuvBA67717z5k5987cqTTGiLUwJdbI1oy4q/7h4INFp+PmHm/7csmczIVmbyE0I6ERG/jek2Ih8OTbmCefxbvkrc+Z8I0L4/Hhfjuxg3BrqqgvA/CoTSFOABPib89SXpzrDeS9Xl+dh/+7jqUeiKvjX7Lhq1TBHGsxLYq+iHmN2NMdEa+PqYvflvVtFH2i3fwhJobYG/0xNdUWMWf7PacvYSj/pIAWc3oSWGdaIh5KqNGFnL72t6oXWFeJuWpV09JFcx1SxW0gXH7SlyKBn68qYhS1EdmiYZwwdtnjKWBieMi54i1JbxsADthIsW3EYEKJvm4lApDKlYlwzHf85jkSkwEmsZ3E2ZI5YZNfVvJeW6XN+I0+Dg+1gm2XGntx3BaVrJOWhr0qxjYFkFmI53MFgS1UI6cvpG3CiGI3ECNfIzZi5rR+EpM7k2V5afuHAzH1Il3OcdXXRhzFbpA11GKdjTioW+2uQb9GSuOY7+olt1kUO5pPa480v3HopLE2EHtK/LQ5cctU7eVcUeBwqT1zzHc23wj2D2eOIdNMSZuBaBD3adBdkZD5m0ZOdw/5bBBlUlRs/dZxVf2Mkxit7Qmqb8xyqKBoTC3XJHo6W2gCL2C1LmJiO6VGP70DaG3L4cKyLgO7jN/oY+wnXkhsJzF7aI8vH1qrEojzWS2W8lrk8cDZ8ccx3/Fb6JgXMB9F+3PTWY3tcTZbCvdhAUnbytMr53LL1StFmpjpYrh6d5pNh+83xtUpm+TtGjGIRcyW+vHXrL6LJn6hwy1aE4gYxGrrBoL9eQWH/gSkyrR9OCCGscTo6M7Fqw+k2oGmcJ+V2YK0IX0Zw9iWr7cO2T/gzxHcIobRjSZwvR3H9XYUFdwHopIn5bzviU+83vpK3IT/x2q3WnWS//+F+Vf2S4ABAMe7cI4Rhe5DAAAAAElFTkSuQmCC",
        },
      },
    });

    plot.value.plotDraw.drawLayer.setStyle(plotStyle.style);
    plot.value.plotDraw.on("drawEnd", onDrawEnd);
    plot.value.on("activeTextArea", activeTextArea);
    plot.value.on("deactivateTextArea", activeTextArea);

    // 立即设置绘制图层的默认透明度
    setTimeout(() => {
      // 设置绘制图层本身的透明度
      const drawLayer = plot.value.plotDraw.drawLayer;
      if (drawLayer) {
        drawLayer.setOpacity(styleState.opacity);
      }

      // 为所有现有要素设置透明度
      const source = plot.value.plotDraw.drawLayer.getSource();
      source.getFeatures().forEach((feature) => {
        if (feature.get("isPlot")) {
          plot.value.plotEdit.activate(feature);
          plot.value.plotUtils.setOpacity(feature, styleState.opacity);
          plot.value.plotEdit.deactivate();
        }
      });
    }, 200);

    // 移除之前的地图点击监听，添加新的
    props.map.un("click", handleClick);
    props.map.on("click", handleClick);

    console.log("标绘工具已初始化");
  }
}

// 关闭面板
function closePanel() {
  // 停用所有标绘功能
  if (plot.value) {
    plot.value.plotEdit.deactivate();
    plot.value.plotDraw.deactivate();
  }
  selectedTool.value = "";
  emit("close");
}

// 删除选中的标绘要素
function deleteSelected() {
  if (plot.value && plot.value.plotEdit.activePlot) {
    const feature = plot.value.plotEdit.activePlot;
    plot.value.plotEdit.deactivate();
    // 从图层中移除要素
    const plotLayer = plot.value.plotDraw.drawLayer;
    plotLayer.getSource().removeFeature(feature);
    emit("featureDeleted", feature);
    console.log("已删除选中的标绘要素");
  } else {
    console.log("请先选择要删除的标绘要素");
  }
}

// 清空所有标绘
function clearAll() {
  console.log("开始清空所有内容...");

  if (plot.value) {
    plot.value.plotEdit.deactivate();
    plot.value.plotDraw.deactivate();
    const plotLayer = plot.value.plotDraw.drawLayer;
    const plotFeatureCount = plotLayer.getSource().getFeatures().length;
    plotLayer.getSource().clear();
    selectedTool.value = "";
  }

  // 清空测量内容
  clearMeasure();

  console.log("所有内容清空完成");
}

// 监听地图变化，初始化标绘工具
watch(
  () => props.map,
  (newMap) => {
    if (newMap && !plot.value) {
      initPlot();
    }
  },
  { immediate: true }
);

// 暴露方法给父组件
defineExpose({
  deleteSelected,
  clearAll,
  startMeasureDistance,
  startMeasureArea,
  stopMeasure,
  clearMeasure,
  deactivate: () => {
    if (plot.value) {
      plot.value.plotEdit.deactivate();
      plot.value.plotDraw.deactivate();
    }
    stopMeasure();
    selectedTool.value = "";
  },
});

// onMounted(() => {
//   if (props.map) {
//     initPlot();
//   }
// });
</script>

<template>
  <div v-if="visible" class="plot-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <span class="panel-title">应急标绘</span>
      <button class="close-btn" @click="closePanel">×</button>
    </div>

    <!-- 工具列表 -->
    <div class="panel-content">
      <Row :gutter="[8, 8]" class="tools-grid">
        <Col
          v-for="(tool, index) in plotTools"
          :key="index"
          :xs="8"
          :sm="8"
          :md="8"
          :lg="8"
          :xl="8"
          :xxl="8"
        >
          <div
            class="plot-tool"
            :class="{ active: selectedTool === tool.alias }"
            @click="selectTool(tool)"
            @mouseenter="hoveredTool = tool.alias"
            @mouseleave="hoveredTool = ''"
          >
            <div class="tool-icon">
              <img
                :src="
                  getImageUrl(
                    tool.src,
                    selectedTool === tool.alias,
                    hoveredTool === tool.alias
                  )
                "
                :alt="tool.name"
              />
            </div>
            <span class="tool-name">{{ tool.name }}</span>
          </div>
        </Col>
      </Row>

      <!-- 样式控制 (仅在选中非文本、非点工具时显示) -->
      <div
        v-if="
          selectedTool &&
          selectedTool !== 'TextArea' &&
          selectedTool !== 'Point'
        "
        class="style-controls"
      >
        <div class="control-group">
          <label>填充色:</label>
          <input
            v-model="styleState.backgroundColor"
            type="color"
            class="color-input"
          />
        </div>
        <div class="control-group">
          <label>边框色:</label>
          <input
            v-model="styleState.borderColor"
            type="color"
            class="color-input"
          />
        </div>
        <div class="control-group">
          <label>线宽:</label>
          <input
            v-model="styleState.borderWidth"
            type="range"
            min="1"
            max="10"
            class="range-input"
          />
          <span class="value-display">{{ styleState.borderWidth }}</span>
        </div>
        <div class="control-group">
          <label>透明度:</label>
          <input
            v-model="styleState.opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="range-input"
          />
          <span class="value-display">{{ styleState.opacity }}</span>
        </div>
      </div>

      <!-- 文本样式控制 (仅在选中文本工具时显示) -->
      <div v-else-if="selectedTool === 'TextArea'" class="style-controls">
        <div class="control-group">
          <label>背景色:</label>
          <input
            v-model="styleState.textAreaBackgroundColor"
            type="color"
            class="color-input"
          />
        </div>
        <div class="control-group">
          <label>文字色:</label>
          <input
            v-model="styleState.textAreaColor"
            type="color"
            class="color-input"
          />
        </div>
        <div class="control-group">
          <label>字体大小:</label>
          <input
            v-model="styleState.textAreaFontSize"
            type="number"
            min="8"
            max="32"
            class="number-input"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn delete-btn" @click="deleteSelected">
          删除选中
        </button>
        <button class="action-btn clear-btn" @click="clearAll">清空全部</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plot-panel {
  position: fixed;
  right: 120px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: auto;
  width: 320px;
  max-height: 85vh;
  background: rgba(15, 27, 47, 0.8);
  border: 1px solid #01eaff;
  border-radius: 6px;
  box-shadow: 0 0 15px rgba(1, 234, 255, 0.3), 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow: hidden;
  /* backdrop-filter: blur(10px); */
  animation: slideInFromRight 0.3s ease-out;
}

.plot-panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(1, 234, 255, 0.05) 0%,
    rgba(1, 234, 255, 0.02) 50%,
    rgba(1, 234, 255, 0.05) 100%
  );
  pointer-events: none;
  z-index: -1;
  border-radius: 6px;
}

/* 指向工具菜单的箭头 */
.plot-panel::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid #01eaff;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  transform: translateY(-50%);
  filter: drop-shadow(0 0 6px rgba(1, 234, 255, 0.6));
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: linear-gradient(
    135deg,
    rgba(1, 234, 255, 0.15),
    rgba(1, 234, 255, 0.08)
  );
  border-bottom: 1px solid rgba(1, 234, 255, 0.4);
  position: relative;
  border-radius: 6px 6px 0 0;
}

.panel-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(1, 234, 255, 0.8) 50%,
    transparent 100%
  );
}

.panel-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(1, 234, 255, 0.5);
  letter-spacing: 0.5px;
}

.close-btn {
  background: linear-gradient(
    135deg,
    rgba(255, 0, 0, 0.2),
    rgba(200, 0, 0, 0.1)
  );
  border: 1px solid rgba(255, 100, 100, 0.3);
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 0 5px rgba(255, 0, 0, 0.2);
}

.close-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 0, 0, 0.4),
    rgba(200, 0, 0, 0.2)
  );
  border-color: rgba(255, 0, 0, 0.6);
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.4);
  transform: scale(1.05);
}

.panel-content {
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.tools-grid {
  margin-bottom: 12px;
  max-width: 100%;
  box-sizing: border-box;
}

.plot-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: rgba(15, 27, 47, 0.6);
  border: 1px solid rgba(1, 234, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  width: 100%;
  min-height: 54px;
  box-sizing: border-box;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(1, 234, 255, 0.1);
}

.plot-tool::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(1, 234, 255, 0.05) 0%,
    transparent 50%,
    rgba(1, 234, 255, 0.05) 100%
  );
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.plot-tool:hover {
  background: rgba(15, 27, 47, 0.8);
  border-color: rgba(1, 234, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 15px rgba(1, 234, 255, 0.3),
    inset 0 1px 0 rgba(1, 234, 255, 0.2);
}

.plot-tool:hover::before {
  opacity: 1;
}

.plot-tool.active {
  background: rgba(1, 234, 255, 0.2);
  border-color: rgba(1, 234, 255, 0.8);
  box-shadow: 0 0 20px rgba(1, 234, 255, 0.5), 0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(1, 234, 255, 0.3);
  transform: scale(1.02);
}

.plot-tool.active::before {
  opacity: 1;
}

.tool-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 3px rgba(1, 234, 255, 0.3));
}

.tool-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: all 0.3s ease;
}

.tool-name {
  font-size: 11px;
  color: #ffffff;
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-shadow: 0 0 3px rgba(1, 234, 255, 0.3);
  font-weight: 500;
}

.style-controls {
  background: rgba(15, 27, 47, 0.6);
  border: 1px solid rgba(1, 234, 255, 0.2);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(1, 234, 255, 0.05);
  position: relative;
  box-sizing: border-box;
}

.style-controls::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 196, 255, 0.03) 0%,
    transparent 50%,
    rgba(0, 150, 255, 0.03) 100%
  );
  border-radius: 10px;
  pointer-events: none;
}

.control-group {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group label {
  color: #ffffff;
  font-size: 13px;
  min-width: 65px;
  text-shadow: 0 0 3px rgba(1, 234, 255, 0.3);
  font-weight: 500;
}

.color-input {
  width: 44px;
  height: 32px;
  border: 2px solid rgba(1, 234, 255, 0.4);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 5px rgba(1, 234, 255, 0.2);
}

.color-input:hover {
  border-color: rgba(1, 234, 255, 0.8);
  box-shadow: 0 0 10px rgba(1, 234, 255, 0.4);
}

.range-input {
  flex: 1;
  height: 6px;
  background: linear-gradient(
    135deg,
    rgba(0, 150, 255, 0.3),
    rgba(0, 100, 200, 0.2)
  );
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.range-input:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 150, 255, 0.5),
    rgba(0, 100, 200, 0.3)
  );
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: linear-gradient(
    135deg,
    rgba(0, 196, 255, 0.9),
    rgba(0, 150, 255, 0.7)
  );
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 196, 255, 0.4);
  transition: all 0.3s ease;
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(0, 196, 255, 0.6);
}

.number-input {
  width: 65px;
  padding: 6px 10px;
  background: linear-gradient(
    135deg,
    rgba(0, 150, 255, 0.12),
    rgba(0, 100, 200, 0.08)
  );
  border: 1px solid rgba(0, 196, 255, 0.3);
  border-radius: 6px;
  color: #ffffff;
  font-size: 13px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.number-input:focus {
  border-color: rgba(1, 234, 255, 0.6);
  box-shadow: 0 0 8px rgba(1, 234, 255, 0.3);
  outline: none;
}

.value-display {
  color: rgba(1, 234, 255, 0.9);
  font-size: 13px;
  min-width: 35px;
  text-align: right;
  text-shadow: 0 0 3px rgba(1, 234, 255, 0.5);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.action-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.delete-btn {
  background: linear-gradient(
    135deg,
    rgba(255, 0, 0, 0.8),
    rgba(200, 0, 0, 0.6)
  );
  border: 1px solid rgba(255, 100, 100, 0.4);
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
}

.delete-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 0, 0, 0.9),
    rgba(200, 0, 0, 0.7)
  );
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
  transform: translateY(-1px);
}

.clear-btn {
  background: linear-gradient(
    135deg,
    rgba(255, 140, 0, 0.8),
    rgba(255, 100, 0, 0.6)
  );
  border: 1px solid rgba(255, 180, 0, 0.4);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}

.clear-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 140, 0, 0.9),
    rgba(255, 100, 0, 0.7)
  );
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.5);
  transform: translateY(-1px);
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(15, 27, 47, 0.5);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: linear-gradient(
    135deg,
    rgba(1, 234, 255, 0.6),
    rgba(1, 234, 255, 0.4)
  );
  border-radius: 3px;
  box-shadow: 0 0 5px rgba(1, 234, 255, 0.3);
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    135deg,
    rgba(1, 234, 255, 0.8),
    rgba(1, 234, 255, 0.6)
  );
  box-shadow: 0 0 8px rgba(1, 234, 255, 0.5);
}

/* 从右侧滑入动画 */
@keyframes slideInFromRight {
  0% {
    opacity: 0;
    transform: translateY(-50%) translateX(100%);
  }
  100% {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .plot-panel {
    right: 100px;
    width: 300px;
  }

  .plot-tool {
    padding: 6px 3px;
    min-height: 50px;
  }
}

@media (max-width: 1200px) {
  .plot-panel {
    right: 80px;
    width: 280px;
  }

  .panel-content {
    padding: 10px;
  }

  .style-controls {
    padding: 10px;
  }

  .plot-tool {
    min-height: 48px;
  }
}
</style>
