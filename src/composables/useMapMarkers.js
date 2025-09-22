import { ref, reactive, nextTick, watch } from 'vue';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon, Text, Circle, Fill, Stroke, RegularShape } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Overlay } from 'ol';

import { useMapTracks } from "@/composables/useMapTracks.js";

/**
 * 地图标记点管理Hook
 * @param {Object} map - OpenLayers地图实例
 * @returns {Object} 标记点管理方法和状态
 */
export function useMapMarkers(map) {
  // 标记点数据
  const markers = ref([]);
  const markerLayer = ref(null);
  const markerSource = ref(null);

  // 按类型分组的标记点图层 - 用于性能优化
  const markerLayersByType = ref({});
  const markerSourcesByType = ref({});

  // Overlay 相关
  const markerPopupOverlay = ref(null);
  const markerPopupElement = ref(null);

  // 点击事件回调
  let onMarkerClickCallback = null;

  // 标记点配置
  const markerConfig = reactive({
    defaultIcon: {
      src: '@/assets/imgs/markIcons/icon1.png',
      size: [32, 32],
      anchor: [16, 32],
      displacement: [9, -9]
    },
    defaultStyle: {
      radius: 8,
      fill: '#ff4444',
      stroke: '#ffffff',
      strokeWidth: 2,
      displacement: [9, -9]
    }
  });

  const {
    initTrackLayer,
    generateTrackRoute,
    startTrackRouteAnimation,
    clearTrackRoutes,
    viewMore: viewMoreTracks,
    viewMoreCorrect: viewMoreCorrectTracks,
    toggleTrackRouteVisibility,
    showTrackRoute,
    tracks
  } = useMapTracks(map);
  initTrackLayer();
  /**
   * 初始化标记点图层
   */
  const initMarkerLayer = (useTypeLayer) => {
    if (!map) return;
    if (!useTypeLayer) {
      markerSource.value = new VectorSource();
      markerLayer.value = new VectorLayer({
        source: markerSource.value,
        title: '标记点',
        zIndex: 100
      });

      map.addLayer(markerLayer.value);
    }
    // 创建标记点弹窗 Overlay
    createMarkerPopupOverlay();

  };

  /**
   * 创建标记点弹窗 Overlay
   */
  const createMarkerPopupOverlay = () => {
    if (!map) return;

    // 创建弹窗元素
    markerPopupElement.value = document.createElement('div');
    markerPopupElement.value.className = 'marker-popup-container';
    markerPopupElement.value.style.display = 'none';

    // 创建 Overlay
    markerPopupOverlay.value = new Overlay({
      element: markerPopupElement.value,
      stopEvent: true, // 阻止事件冒泡到地图
      offset: [0, -20], // 偏移量，使弹窗在标记点上方
      positioning: 'bottom-center',
    });

    map.addOverlay(markerPopupOverlay.value);
  };




  /**
   * 隐藏标记点弹窗
   */
  const hideMarkerPopup = () => {
    if (!markerPopupElement.value) return;
    markerPopupElement.value.style.display = 'none';
    if (markerPopupOverlay.value) {
      markerPopupOverlay.value.setPosition(undefined);
    }
  };

  /**
   * 获取状态文本
   * @param {String} status - 状态
   * @returns {String} 状态文本
   */
  const getStatusText = (status) => {
    const statusMap = {
      'suspicious': '可疑',
      'normal': '正常',
      'warning': '警告',
      'danger': '危险',
      'center': '中心点',
      'random': '随机点',
      'grid': '网格点',
      'circle': '圆形点'
    };
    return statusMap[status] || status || '未知';
  };

  /**
   * 创建标记点样式
   * @param {Object} options - 样式选项
   * @returns {Style} OpenLayers样式对象
   */
  const createMarkerStyle = (options = {}) => {
    const {
      icon,
      text,
      color = markerConfig.defaultStyle.fill,
      radius = markerConfig.defaultStyle.radius,
      strokeColor = markerConfig.defaultStyle.stroke,
      strokeWidth = markerConfig.defaultStyle.strokeWidth,
      displacement = markerConfig.defaultStyle.displacement
    } = options;

    const styles = [];

    // 图标样式
    if (icon) {
      // 添加图标外边框
      const iconSize = icon.size || markerConfig.defaultIcon.size;
      const iconAnchor = icon.anchor || markerConfig.defaultIcon.anchor;
      const borderSize = (icon.borderSize || 20);
      const borderColor = icon.borderColor || '#ffcc00';
      const borderWidth = icon.borderWidth || 2;
      const displacement = icon.displacement || [9, -9];
      const showBorder = icon.showBorder; // 默认显示边框，除非明确设置为false

      // 外边框样式 - 根据showBorder决定是否显示
      if (showBorder) {
        styles.push(new Style({
          image: new RegularShape({
            radius: borderSize,
            points: 4, // 4个点构成正方形
            angle: Math.PI / 4, // 旋转45度使其看起来是正方形而不是菱形
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({
              color: borderColor,
              width: borderWidth,
              lineDash: [5, 5] // 虚线效果
            }),
            displacement: displacement // 使用 displacement 属性偏移
          })
        }));
      }

      // 图标样式
      styles.push(new Style({
        image: new Icon({
          src: icon.src || markerConfig.defaultIcon.src,
          size: icon.size || markerConfig.defaultIcon.size,
          anchor: icon.anchor || markerConfig.defaultIcon.anchor,
          scale: icon.scale || 1,
          offset: icon.offset || [0, 0], // 支持精灵图偏移
        })
      }));
    } else {
      // 添加圆形外边框
      const borderSize = options.borderSize || radius * 2.5;
      const borderColor = options.borderColor || '#ffcc00';
      const borderWidth = options.borderWidth || 2;
      const showBorder = options.showBorder; // 默认显示边框，除非明确设置为false

      // 外边框样式 - 根据showBorder决定是否显示
      if (showBorder) {
        styles.push(new Style({
          image: new RegularShape({
            radius: borderSize,
            points: 4, // 4个点构成正方形
            angle: Math.PI / 4, // 旋转45度使其看起来是正方形而不是菱形
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({
              color: borderColor,
              width: borderWidth,
              lineDash: [5, 5] // 虚线效果
            }),
            displacement: displacement // 使用 displacement 属性偏移
          })
        }));
      }

      // 主圆形样式
      styles.push(new Style({
        image: new Circle({
          radius: radius,
          fill: new Fill({ color: color }),
          stroke: new Stroke({
            color: strokeColor,
            width: strokeWidth
          })
        })
      }));
    }

    // 文本样式
    if (text && text.showBackground != false) {
      // 文本内容
      styles.push(new Style({
        text: new Text({
          text: text.content || '',
          font: text.font || '14px Arial',
          fill: new Fill({ color: text.color || '#ffffff' }),
          offsetX: text.offsetX || 10,
          offsetY: text.offsetY || -10,
          textAlign: text.align || 'center',
        })
      }));


      // 添加背景图片
      if (text.bgImage) {
        styles.push(new Style({
          image: new Icon({
            src: text.bgImage || '/src/assets/imgs/qb.png',
            size: text.bgSize || [80, 30], // 背景图片尺寸
            anchor: [0.5, 0.5], // 锚点位置（背景中心对齐文本）
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            displacement: text.displacement || [18, 9], // 位置偏移
            scale: text.bgScale || 1, // 缩放比例
            opacity: text.bgOpacity || 1 // 透明度
          })
        }));
      }

    }

    return styles.length === 1 ? styles[0] : styles;
  };
  /**
   * 添加标记点
   * @param {Array} coordinates - 坐标 [经度, 纬度]
   * @param {Object} options - 标记点选项
   * @returns {String} 标记点ID
   */
  const addMarker = (coordinates, options = {}) => {
    if (!map) {
      console.warn('地图或标记点图层未初始化');
      return null;
    }

    const id = options.id || generateUniqueMarkerId('marker');
    const [lng, lat] = coordinates;

    // 创建几何点
    const point = new Point(fromLonLat([lng, lat]));

    // 创建要素
    const feature = new Feature({
      geometry: point,
      id: id,
      type: 'marker',
      ...options.data
    });

    // 设置样式
    const style = createMarkerStyle(options.style);
    feature.setStyle(style);

    // 添加到图层 - 支持按类型分组
    if (options.type && options.useTypeLayer) {
      // 使用按类型分组的图层
      addMarkerToTypeLayer(options.type, feature);
    } else {
      // 使用默认图层
      markerSource.value.addFeature(feature);
    }

    // 保存到状态
    const marker = {
      id,
      coordinates,
      feature,
      options,
      visible: true
    };

    markers.value.push(marker);

    return id;
  };

  /**
   * 移除标记点
   * @param {String} id - 标记点ID
   */
  const removeMarker = (id) => {
    if (!markerSource.value) return;

    const markerIndex = markers.value.findIndex(m => m.id === id);
    if (markerIndex === -1) return;

    const marker = markers.value[markerIndex];
    markerSource.value.removeFeature(marker.feature);
    markers.value.splice(markerIndex, 1);
  };

  /**
   * 更新标记点
   * @param {String} id - 标记点ID
   * @param {Object} updates - 更新内容
   */
  const updateMarker = (id, updates = {}) => {
    const marker = markers.value.find(m => m.id === id);
    if (!marker) return;

    // 更新坐标
    if (updates.coordinates) {
      const [lng, lat] = updates.coordinates;
      const point = new Point(fromLonLat([lng, lat]));
      marker.feature.setGeometry(point);
      marker.coordinates = updates.coordinates;
    }

    // 更新样式
    if (updates.style) {
      const style = createMarkerStyle(updates.style);
      marker.feature.setStyle(style);
      marker.options.style = { ...marker.options.style, ...updates.style };
    }

    // 更新数据
    if (updates.data) {
      marker.options.data = { ...marker.options.data, ...updates.data };
      Object.keys(updates.data).forEach(key => {
        marker.feature.set(key, updates.data[key]);
      });
    }
  };

  /**
   * 显示/隐藏标记点边框
   * @param {String} id - 标记点ID
   * @param {Boolean} show - 是否显示边框
   */
  const toggleMarkerBorder = (id, show = true) => {
    const marker = markers.value.find(m => m.id === id);
    if (!marker) return;
    // 更新样式配置
    if (marker.options.style.icon) {
      marker.options.style.icon.showBorder = show;
    } else {
      marker.options.style.showBorder = show;
    }
    // 重新创建样式
    const newStyle = createMarkerStyle(marker.options.style);
    marker.feature.setStyle(newStyle);
  };

  /**
   * 创建完全透明的样式（用于隐藏标记点）
   * @returns {Style} 透明样式对象
   */
  const createInvisibleStyle = () => {
    return new Style({
      image: new Circle({
        radius: 0, // 半径为0
        fill: new Fill({ color: 'transparent' }), // 透明填充
        stroke: new Stroke({ color: 'transparent', width: 0 }) // 透明边框
      })
    });
  };

  /**
   * 显示/隐藏标记点
   * @param {String} id - 标记点ID
   * @param {Boolean} visible - 是否显示
   */
  const toggleMarkerVisibility = (id, visible) => {
    const marker = markers.value.find(m => m.id === id);
    if (!marker) return;

    marker.visible = visible;
    // 设置样式 visible false 时，使用完全透明的样式
    marker.feature.setStyle(visible ? createMarkerStyle(marker.options.style) : createInvisibleStyle());
  };

  /**
 * 显示/隐藏标记点 - 优化版本，支持大量数据
 * @param {String} type - 标记点类型
 * @param {Boolean} visible - 是否显示
 */
  const toggleMarkerVisibilityList = (type, visible, isDelete = false) => {
    const markerlist = markers.value.filter(m => m.options.type === type);
    if (markerlist.length === 0) return;

    // 如果数据量很大，使用批量更新
    if (markerlist.length > 1000) {
      if (isDelete) {
        batchToggleMarkerDelete(markerlist, type);
      } else {
        batchToggleMarkerVisibility(markerlist, visible);
      }
    } else {
      // 数据量较小时，直接更新
      markerlist.forEach(marker => {
        marker.visible = visible;
        marker.feature.setStyle(visible ? createMarkerStyle(marker.options.style) : createInvisibleStyle());
      });
    }
  };

  /**
   * 批量切换标记点可见性 - 使用 requestAnimationFrame 分批处理
   * @param {Array} markerlist - 标记点列表
   * @param {Boolean} visible - 是否显示
   */
  const batchToggleMarkerVisibility = (markerlist, visible) => {
    const batchSize = 1000; // 每批处理1000个
    let currentIndex = 0;

    const processBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, markerlist.length);

      for (let i = currentIndex; i < endIndex; i++) {
        const marker = markerlist[i];
        marker.visible = visible;
        // 检测性能
        marker.feature.setStyle(visible ? createMarkerStyle(marker.options.style) : createInvisibleStyle());
      }

      currentIndex = endIndex;

      // 如果还有数据需要处理，继续下一批
      if (currentIndex < markerlist.length) {
        requestAnimationFrame(processBatch);
      }
    };

    processBatch();
  };

  /**
   * 批量删除标记点 - 使用 requestAnimationFrame 分批处理
   * @param {Array} markerlist - 标记点列表
   * @param {String} type - 标记点类型
   */
  const batchToggleMarkerDelete = (markerlist, type) => {
    const batchSize = 1000; // 每批处理1000个
    let currentIndex = 0;

    const processBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, markerlist.length);

      for (let i = currentIndex; i < endIndex; i++) {
        removeMarkerFromTypeLayer(type, markerlist[i].feature);
      }

      currentIndex = endIndex;

      // 如果还有数据需要处理，继续下一批
      if (currentIndex < markerlist.length) {
        requestAnimationFrame(processBatch);
      }
    };

    processBatch();
  };

  /**
   * 基于图层的标记点可见性切换
   * @param {String} type - 标记点类型
   * @param {Boolean} visible - 是否显示
   */
  const toggleMarkerVisibilityByLayer = (type, visible) => {
    const layers = getAllLayers();
    const targetLayer = layers.find(layer => layer.get("title") === type);
    if (!targetLayer) {
      console.warn(`类型 ${type} 的图层不存在`);
      return;
    }

    // 直接控制整个图层的可见性，而不是单个标记点
    targetLayer.setVisible(visible);

    // 更新标记点的可见性状态
    const markerlist = markers.value.filter(m => m.options.type === type);
    markerlist.forEach(marker => {
      marker.visible = visible;
    });
  };

  /**
   * 创建按类型分组的标记点图层
   * @param {String} type - 标记点类型
   */
  const createMarkerLayerByType = (type) => {
    if (markerLayersByType.value[type]) {
      return markerLayersByType.value[type];
    }

    const source = new VectorSource();
    const layer = new VectorLayer({
      source: source,
      zIndex: 100 + Object.keys(markerLayersByType.value).length, // 确保在基础图层之上，避免被图层切换影响
      title: type,
      visible: true
    });

    // 为图层添加类型标识，用于点击事件识别
    layer.set('type', type);

    markerSourcesByType.value[type] = source;
    markerLayersByType.value[type] = layer;

    // 将图层添加到地图
    const mapInstance = map?.value || map;
    if (mapInstance) {
      mapInstance.addLayer(layer);
    }

    return layer;
  };

  /**
   * 将标记点添加到指定类型的图层
   * @param {String} type - 标记点类型
   * @param {Feature} feature - 标记点要素
   */
  const addMarkerToTypeLayer = (type, feature) => {

    if (!markerSourcesByType.value[type]) {
      createMarkerLayerByType(type);
    }

    if (markerSourcesByType.value[type]) {
      markerSourcesByType.value[type].addFeature(feature);
    } else {
      console.error(`无法创建类型图层: ${type}`);
    }
  };

  /**
   * 从指定类型的图层移除标记点
   * @param {String} type - 标记点类型
   * @param {Feature} feature - 标记点要素
   */
  const removeMarkerFromTypeLayer = (type, feature) => {
    if (markerSourcesByType.value[type]) {
      markerSourcesByType.value[type].removeFeature(feature);
    }
  };

  /**
   * 清除指定类型的所有标记点
   * @param {String} type - 标记点类型
   */
  const clearMarkersByType = (type) => {
    if (markerSourcesByType.value[type]) {
      markerSourcesByType.value[type].clear();
    }
    // 从主标记点数组中移除
    markers.value = markers.value.filter(m => m.options.type !== type);
  };

  /**
   * 获取所有图层
   * @returns {Array} 图层数组
   */
  const getAllLayers = () => {
    return map.getLayers().getArray();
  };
  /**
   * 获取自定义图层
   * @returns {Array} 图层数组
   */
  const getCustomLayers = () => {
    return markerLayersByType.value;
  };

  /**
   * 显示/隐藏标记点的文本和气泡
   * @param {String} id - 标记点ID
   * @param {Boolean} visible - 是否显示
   */
  const toggleMarkerTextVisibility = (id, visible) => {
    const marker = markers.value.find(m => m.id === id);
    if (!marker) return;

    // 更新文本可见性
    if (marker.options.style.text) {
      marker.options.style.text.visible = visible;
    }

    // 重新创建样式
    const newStyle = createMarkerStyle(marker.options.style);
    marker.feature.setStyle(newStyle);
  };

  /**
   * 批量显示/隐藏文本和气泡
   * @param {String} type - 标记点类型
   * @param {Boolean} visible - 是否显示
   */
  const toggleMarkerTextVisibilityByType = (type, visible) => {
    const markerlist = markers.value.filter(m => m.options.type === type);
    if (markerlist.length === 0) return;

    markerlist.forEach(marker => {
      if (marker.options.style.text && marker.visible) {
        marker.options.style.text.showBackground = visible;
        const newStyle = createMarkerStyle(marker.options.style);
        marker.feature.setStyle(newStyle);
      }
    });
  };

  /**
   * 清除所有标记点
   */
  const clearMarkers = () => {
    if (!markerSource.value) return;

    markerSource.value.clear();
    markers.value = [];
  };

  /**
   * 获取标记点
   * @param {String} id - 标记点ID
   * @returns {Object|null} 标记点对象
   */
  const getMarker = (id) => {
    return markers.value.find(m => m.id === id) || null;
  };

  /**
   * 获取所有标记点
   * @returns {Array} 标记点数组
   */
  const getAllMarkers = () => {
    return [...markers.value];
  };

  /**
   * 根据类型获取标记点
   * @param {String} type - 标记点类型
   * @returns {Array} 标记点数组
   */
  const getMarkersByType = (type) => {
    return markers.value.filter(m => m.options.type === type);
  };

  /**
   * 设置标记点配置
   * @param {Object} config - 配置对象
   */
  const setMarkerConfig = (config) => {
    Object.assign(markerConfig, config);
  };

  /**
   * 批量添加标记点
   * @param {Array} markerList - 标记点列表
   */
  const addMarkers = (markerList) => {
    markerList.forEach(({ coordinates, options = {} }) => {
      addMarker(coordinates, options);
    });
  };

  /**
   * 监听地图点击事件添加标记点
   * @param {Boolean} enabled - 是否启用
   */
  const enableClickToAdd = (enabled = true) => {
    if (!map) return;

    if (enabled) {
      map.on('click', handleMapClick);
    } else {
      map.un('click', handleMapClick);
    }
  };

  /**
   * 地图点击事件处理
   * @param {Object} event - 点击事件
   */
  const handleMapClick = (event) => {
    const coordinates = event.coordinate;
    const [lng, lat] = toLonLat(coordinates);

    addMarker([lng, lat], {
      style: {
        color: '#00ffff',
        radius: 6,
        borderSize: 15, // 外边框大小
        borderColor: '#00ffff', // 外边框颜色
        borderWidth: 2, // 外边框宽度
      },
      data: {
        clickTime: new Date().toISOString()
      }
    });
  };



  /**
   * 检查标记点ID是否唯一
   * @param {String} id - 标记点ID
   * @returns {Boolean} 是否唯一
   */
  const isMarkerIdUnique = (id) => {
    return !markers.value.some(marker => marker.id === id);
  };

  /**
   * 生成唯一的标记点ID
   * @param {String} prefix - ID前缀
   * @returns {String} 唯一的ID
   */
  const generateUniqueMarkerId = (prefix = 'marker') => {
    let id;
    let counter = 0;
    do {
      id = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      counter++;
    } while (!isMarkerIdUnique(id) && counter < 100);

    if (counter >= 100) {
      console.warn('无法生成唯一的标记点ID');
      return `${prefix}_${Date.now()}_fallback`;
    }

    return id;
  };

  /**
   * 销毁标记点图层
   */
  const destroy = () => {
    if (map && markerLayer.value) {
      map.removeLayer(markerLayer.value);
    }

    if (markerSource.value) {
      markerSource.value.clear();
    }

    markers.value = [];
    markerLayer.value = null;
    markerSource.value = null;
  };

  // 动画飞行到指定位置
  const flyTo = (center, zoom, duration = 1000) => {
    if (!map) return;
    const view = map.getView();
    view.animate({
      center: fromLonLat(center),
      zoom: zoom,
      duration: duration
    });
  };

  /**
   * 放大
   */
  const zoomIn = () => {
    if (!map) return;
    const view = map.getView();
    const currentZoom = view.getZoom();
    view.animate({ zoom: currentZoom + 1, duration: 300 });
  };

  /**
   * 缩小
   */
  const zoomOut = () => {
    if (!map) return;
    const view = map.getView();
    const currentZoom = view.getZoom();
    view.animate({ zoom: currentZoom - 1, duration: 300 });
  };


  return {
    // 状态
    tracks,
    markers,
    markerLayer,
    markerSource,
    markerLayersByType,
    markerSourcesByType,
    markerConfig,
    markerPopupOverlay,
    markerPopupElement,
    // 标记点方法
    initMarkerLayer,
    addMarker,
    removeMarker,
    updateMarker,
    toggleMarkerVisibility,
    toggleMarkerVisibilityList,
    toggleMarkerVisibilityByLayer, // 新增：基于图层的优化方法
    toggleMarkerBorder,
    clearMarkers,
    clearMarkersByType,
    getMarker,
    getAllMarkers,
    getMarkersByType,
    setMarkerConfig,
    addMarkers,
    enableClickToAdd,
    hideMarkerPopup,
    // 性能优化方法
    batchToggleMarkerVisibility,
    createMarkerLayerByType,
    addMarkerToTypeLayer,
    removeMarkerFromTypeLayer,
    createMarkerStyle,
    // 文本和气泡控制方法
    toggleMarkerTextVisibility,
    toggleMarkerTextVisibilityByType,
    // ID管理方法
    isMarkerIdUnique,
    generateUniqueMarkerId,
    // 图层方法
    getAllLayers,
    getCustomLayers,

    // 动画飞行到指定位置
    flyTo,

    zoomIn,
    zoomOut,
    // 轨迹生成方法
    generateTrackRoute,
    startTrackRouteAnimation,
    clearTrackRoutes,
    toggleTrackRouteVisibility,
    showTrackRoute,

    // 通用方法
    destroy
  };
}
