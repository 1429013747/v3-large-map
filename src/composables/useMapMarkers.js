import { ref, reactive, nextTick } from 'vue';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon, Text, Circle, Fill, Stroke } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Overlay } from 'ol';
import { createPopupContentCar, createPopupContentRisk } from './createPopupContent.js';

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
      anchor: [16, 32]
    },
    defaultStyle: {
      radius: 8,
      fill: '#ff4444',
      stroke: '#ffffff',
      strokeWidth: 2
    }
  });

  const {
    initTrackLayer,
    generateTrackRoute,
    startTrackRouteAnimation,
    clearTrackRoutes,
    trackBack: trackBackTracks,
    viewMore: viewMoreTracks,
    trackCorrect: trackCorrectTracks,
    viewMoreCorrect: viewMoreCorrectTracks
  } = useMapTracks(map);
  initTrackLayer();
  /**
   * 初始化标记点图层
   */
  const initMarkerLayer = () => {
    if (!map) return;

    markerSource.value = new VectorSource();
    markerLayer.value = new VectorLayer({
      source: markerSource.value,
      zIndex: 1000
    });

    map.addLayer(markerLayer.value);

    // 创建标记点弹窗 Overlay
    createMarkerPopupOverlay();

    // 添加标记点点击事件监听
    bindMarkerClickEvents();
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
   * 绑定标记点点击事件
   */
  const bindMarkerClickEvents = () => {
    if (!map || !markerLayer.value) return;

    // 监听标记点图层的点击事件
    map.on('click', (event) => {
      const features = map.getFeaturesAtPixel(event.pixel, {
        layerFilter: (layer) => layer === markerLayer.value
      });

      if (features.length > 0) {
        const feature = features[0];
        const markerId = feature.get('id');
        const markerData = feature.getProperties();

        // 触发标记点点击事件
        onMarkerClick({
          markerId,
          markerData,
          feature,
          coordinate: event.coordinate,
          lonLat: toLonLat(event.coordinate),
          pixel: event.pixel
        });
      }
    });
  };

  /**
   * 标记点点击事件处理
   * @param {Object} eventData - 点击事件数据
   */
  const onMarkerClick = (eventData) => {
    console.log('标记点被点击:', eventData);

    const { markerId, markerData, coordinate, lonLat } = eventData;

    // 显示弹窗
    showMarkerPopup([lonLat[0], lonLat[1]], {
      markerId,
      ...markerData,
      lonLat
    });

    // 调用外部设置的回调函数
    if (onMarkerClickCallback && typeof onMarkerClickCallback === 'function') {
      onMarkerClickCallback(eventData);
    }
  };

  /**
   * 设置标记点点击回调函数
   * @param {Function} callback - 回调函数
   */
  const setMarkerClickCallback = (callback) => {
    onMarkerClickCallback = callback;
  };
  /**
   * 轨迹回放
   * @param {String} markerId - 标记点ID
   */
  const trackBack = (markerId) => {
    console.log('轨迹回放:', markerId);

    // 先清除之前的轨迹
    clearTrackRoutes();

    // 示例坐标点
    const coordinates = [
      [121.72482419397187, 29.34646109911479],
      [121.82213515941295, 29.34065820190017],
      [121.8633338898817, 29.266409276796225]
    ];

    // 生成轨迹路线
    generateTrackRoute(coordinates, {
      showStartEnd: true,
      animation: true,
      style: {
        stroke: '#d65e37',
        strokeWidth: 3,
        lineDash: [],
        lineCap: 'round',
        lineJoin: 'round'
      }
    });
  };

  /**
   * 查看更多
   * @param {*} markerId 
   */
  const viewMore = (markerId) => {
    console.log('查看更多:', markerId);
  };

  /**
   * 轨迹纠正
   * @param {*} markerId 
   */
  const trackCorrect = (markerId) => {
    console.log('风险点轨迹纠正:', markerId);
  };
  /**
   * 查看更多
   * @param {*} markerId 
   */
  const viewMoreCorrect = (markerId) => {
    console.log('风险点查看更多:', markerId);
  };

  /**
   * 显示标记点弹窗
   * @param {Array} coordinates - 坐标 [经度, 纬度]
   * @param {Object} markerData - 标记点数据
   */
  const showMarkerPopup = (coordinates, markerData) => {
    if (!markerPopupOverlay.value || !markerPopupElement.value) return;

    if (markerData.popupType === "car") {
      markerPopupElement.value.innerHTML = createPopupContentCar(markerData, trackBack, viewMore);
    } else {
      markerPopupElement.value.innerHTML = createPopupContentRisk(markerData, trackCorrect, viewMoreCorrect);
    }

    // 设置弹窗位置
    const coordinate = fromLonLat(coordinates);
    markerPopupOverlay.value.setPosition(coordinate);

    // 显示弹窗
    markerPopupElement.value.style.display = 'block';
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
      strokeWidth = markerConfig.defaultStyle.strokeWidth
    } = options;

    const styles = [];

    // 图标样式
    if (icon) {

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
      // 圆形标记样式
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
    if (text) {
      styles.push(new Style({
        text: new Text({
          text: text.content || '',
          font: text.font || '14px Arial',
          fill: new Fill({ color: text.color || '#ffffff' }),
          stroke: new Stroke({
            color: text.strokeColor || '#000000',
            width: text.strokeWidth || 2
          }),
          offsetY: text.offsetY || -40,
          textAlign: text.align || 'center'
        })
      }));
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
    if (!map || !markerSource.value) {
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

    // 添加到图层
    markerSource.value.addFeature(feature);

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
   * 显示/隐藏标记点
   * @param {String} id - 标记点ID
   * @param {Boolean} visible - 是否显示
   */
  const toggleMarkerVisibility = (id, visible) => {
    const marker = markers.value.find(m => m.id === id);
    if (!marker) return;

    marker.visible = visible;
    marker.feature.setStyle(visible ? createMarkerStyle(marker.options.style) : null);
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
   * 根据类型清除标记点
   * @param {String} type - 标记点类型
   */
  const clearMarkersByType = (type) => {
    if (!markerSource.value) return;

    const markersToRemove = markers.value.filter(m => m.options.type === type);
    markersToRemove.forEach(marker => {
      markerSource.value.removeFeature(marker.feature);
    });

    markers.value = markers.value.filter(m => m.options.type !== type);
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
        radius: 6
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

  return {
    // 状态
    markers,
    markerLayer,
    markerSource,
    markerConfig,

    // 标记点方法
    initMarkerLayer,
    addMarker,
    removeMarker,
    updateMarker,
    toggleMarkerVisibility,
    clearMarkers,
    clearMarkersByType,
    getMarker,
    getAllMarkers,
    getMarkersByType,
    setMarkerConfig,
    addMarkers,
    enableClickToAdd,
    setMarkerClickCallback,
    showMarkerPopup,
    hideMarkerPopup,
    createMarkerStyle,

    // ID管理方法
    isMarkerIdUnique,
    generateUniqueMarkerId,

    // 轨迹生成方法
    generateTrackRoute,
    startTrackRouteAnimation,
    clearTrackRoutes,

    // 通用方法
    destroy
  };
}
