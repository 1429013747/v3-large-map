import { reactive, ref } from 'vue';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import { Polygon as OlPolygon, Point } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

import { useMapTracks } from '@/composables/useMapTracks.js';
import { useMapClustering } from '@/composables/useMapClustering.js';
import { getIconPathMarkIcons } from '@/utils/utilstools.js';

/**
 * 地图标记点管理Hook
 * @param {object} map - OpenLayers地图实例
 * @returns {object} 标记点管理方法和状态
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
  const overlayList = ref([]);
  const markerPopupOverlay = ref(null);
  const markerPopupElement = ref(null);

  // 多边形 相关
  const customPolygonSource = ref(null);
  const customPolygonLayer = ref(null);

  // 扇形 相关
  const markerIdCounter = ref(null);
  const markerSectors = ref(null);

  // 点击事件回调
  const onMarkerClickCallback = null;

  // 标记点配置
  const markerConfig = reactive({
    defaultIcon: {
      src: getIconPathMarkIcons('icon1'),
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

  // 轨迹管理
  const {
    initTrackLayer,
    generateTrackRoute,
    startTrackRouteAnimation,
    clearTrackRoutes,
    removeTrackRoute,
    trackFeatureList,
    stopTrackAnimationById,
    pauseTrackAnimationById,
    resumeTrackAnimationById,
    pauseTrackAnimation,
    resumeTrackAnimation,
    showTrackRoute,
    getTrackVisibility,
    toggleTrackRoute,
    destroy: trackDestroy,
    setSpeedValue,
    getActiveAnimations
  } = useMapTracks(map);
  // 初始化轨迹图层
  initTrackLayer();

  // 聚合功能
  const {
    clusterLayers,
    clusterSources,
    clusterEnabled,
    clusterConfig,
    createClusterLayer,
    updateClusterLayer,
    toggleCluster,
    setClusterDistance,
    getClusterInfo,
    clearClusterLayer,
    clearAllClusterLayers,
    destroy: destroyClustering
  } = useMapClustering(map);
  /**
   * 初始化标记点图层
   */
  const initMarkerLayer = (useTypeLayer) => {
    if (!map) return;

    // 创建标记点弹窗 Overlay
    createMarkerPopupOverlay();
    // 初始化自定义多边形图层（用于编程方式绘制面）
    customPolygonSource.value = new VectorSource();
    customPolygonLayer.value = new VectorLayer({
      source: customPolygonSource.value,
      zIndex: 103,
      type: 'electronic-fence',
      title: 'electronic-fence'
    });
    map.addLayer(customPolygonLayer.value);
    // 初始化扇形图层
    markerIdCounter.value = new VectorSource();
    markerSectors.value = new VectorLayer({
      source: markerIdCounter.value,
      zIndex: 100,
      type: 'optical-radar',
      title: 'optical-radar'
    });
    map.addLayer(markerSectors.value);

    if (!useTypeLayer) {
      markerSource.value = new VectorSource();
      markerLayer.value = new VectorLayer({
        source: markerSource.value,
        title: '标记点',
        zIndex: 110
      });
      map.addLayer(markerLayer.value);
    }
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
      positioning: 'bottom-center'
    });

    map.addOverlay(markerPopupOverlay.value);
  };

  /**
   * 创建多个overlay直接展示到地图上
   * @param {Array} positions - 位置数组 [[lng, lat], [lng, lat], ...]
   * @param {Function} contentFunction - overlay内容生成函数
   * @returns {Array} 创建的overlay ID列表
   */
  const createMultipleMarkers = (positions, contentFunction) => {
    if (!Array.isArray(positions) || positions.length === 0) {
      console.warn('位置数组为空');
      return [];
    }

    const createdOverlays = [];

    positions.forEach((position, index) => {
      const [lng, lat] = position;
      const id = generateUniqueMarkerId('overlay');

      // 创建overlay元素
      const overlayElement = document.createElement('div');
      overlayElement.className = 'map-overlay';
      overlayElement.style.display = 'block';

      // 生成内容
      if (contentFunction && typeof contentFunction === 'function') {
        overlayElement.innerHTML = contentFunction(position);
      } else {
        overlayElement.innerHTML = `
            <div class="warn-overlay" onclick="window.disPlayWarnDetail&&window.disPlayWarnDetail(event)">
              <div class="warn-header">
                <span class="warn-time">${new Date().toLocaleString()}</span>
                <div class="close" onclick="window.closeWarnMarker&&window.closeWarnMarker(event)">×</div>
              </div>
              <div class="warn-content">
                <h4>华盛123</h4>
                <p class="warn-message">伪造信号、套牌预警!</p>
              </div>
              <div class="tip-animation">
              </div>
            </div>
          `;
      }

      // 创建overlay
      const overlay = new Overlay({
        element: overlayElement,
        title: 'warn-overlay',
        type: 'warn-overlay',
        id: id,
        stopEvent: true,
        offset: [0, 20],
        positioning: 'bottom-left',
        // position: fromLonLat([lng, lat]),
        // autoPan: false,

      });
      overlayList.value.push(overlay);
      // 设置位置并添加到地图
      overlay.setPosition(fromLonLat([lng, lat]));
      map.addOverlay(overlay);

      createdOverlays.push(overlay);
    });

    return createdOverlays;
  };

  /**
   * 清除所有Overlay
   */
  const clearOverlaysByType = () => {
    if (!map) return;
    overlayList.value.forEach((overlay) => {
      if (overlay.options.title) map.removeOverlay(overlay);
    });
    overlayList.value = [];
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
   * 创建标记点样式
   * @param {object} options - 样式选项
   * @returns {Style} OpenLayers样式对象
   */
  const createMarkerStyle = (options = {}) => {
    const { icon, text } = options;
    const styles = [];

    // 图标样式
    if (icon) {
      // 添加图标外边框
      const iconSize = icon.size || [30, 30];
      const iconAnchor = icon.anchor ?? [0.5, 0.5];
      const borderSize = icon.borderSize || 20;
      const borderColor = icon.borderColor || '#ffcc00';
      const borderWidth = icon.borderWidth || 2;
      const displacement = icon.displacement || [14, -14];
      const rotation = icon.rotation || 0;
      const rotationOrigin = icon.rotationOrigin || 'center';
      const iconScale = icon.scale || 1;
      const iconOffset = icon.offset || [0, 0];
      const iconSrc = icon.src || getIconPathMarkIcons('icon1');
      const showBorder = icon.showBorder || false; // 默认不显示边框，除非明确设置为true

      // 外边框样式 - 根据showBorder决定是否显示
      if (showBorder) {
        // styles.push(new Style({
        //   image: new RegularShape({
        //     radius: borderSize,
        //     points: 4, // 4个点构成正方形
        //     angle: Math.PI / 4, // 旋转45度使其看起来是正方形而不是菱形
        //     fill: new Fill({ color: 'transparent' }),
        //     rotation: icon.rotation || 0, // 应用旋转（单位：弧度）
        //     rotationOrigin: icon.rotationOrigin, // 随视图旋转
        //     stroke: new Stroke({
        //       color: borderColor,
        //       width: borderWidth,
        //       lineDash: [20, 11] // 虚线效果
        //     }),
        //     displacement: displacement // 使用 displacement 属性偏移
        //   })
        // }));
        styles.push(
          new Style({
            image: new Icon({
              src: new URL('/src/assets/imgs/line.png', import.meta.url).href,
              size: [46, 46],
              anchor: [0.5, 0.5],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              rotation: icon.rotation || 0, // 应用旋转（单位：弧度）
              rotationOrigin: icon.rotationOrigin, // 随视图旋转
              scale: 1,
              offset: [0, 0], // 支持精灵图偏移
              displacement: icon.isRadar ? [2, -1] : displacement
            })
          })
        );
      }

      // 图标样式
      styles.push(
        new Style({
          image: new Icon({
            src: iconSrc,
            size: iconSize,
            anchor: iconAnchor,
            anchorXUnits: 'fraction', // 锚点位置（背景中心对齐文本）
            anchorYUnits: 'fraction', // 锚点位置（背景中心对齐文本）
            scale: iconScale,
            offset: iconOffset, // 支持精灵图偏移
            rotation: rotation || 0, // 弧度
            rotationOrigin: rotationOrigin
          })
        })
      );
    } else {
      const borderSize = options.borderSize || 8 * 2.5;
      const borderColor = options.borderColor || '#ffa502';
      const colorFill = options.colorFill || '#ffff00';
      const borderWidth = options.borderWidth || 2;
      const borderStroke = options.borderStroke || '#00ff00';
      const showBorder = options.showBorder || false; // 默认不显示边框，除非明确设置为true
      const displacement = options.displacement || [9, -9];
      const lineDash = options.lineDash || [0, 0];
      const radius = options.radius || 4;
      // 外边框样式 - 根据showBorder决定是否显示
      if (showBorder) {
        // styles.push(new Style({
        //   image: new RegularShape({
        //     radius: borderSize,
        //     points: 4, // 4个点构成正方形
        //     angle: Math.PI / 4, // 旋转45度使其看起来是正方形而不是菱形
        //     fill: new Fill({ color: 'transparent' }),
        //     stroke: new Stroke({
        //       color: borderColor,
        //       width: borderWidth,
        //       lineDash: lineDash // 虚线效果
        //     }),
        //     displacement: displacement // 使用 displacement 属性偏移
        //   })
        // }));

        styles.push(
          new Style({
            image: new Icon({
              src: new URL('/src/assets/imgs/line.png', import.meta.url).href,
              size: [46, 46],
              anchor: [0.5, 0.5],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              rotation: icon.rotation || 0, // 应用旋转（单位：弧度）
              rotationOrigin: icon.rotationOrigin, // 随视图旋转
              scale: 1,
              offset: [0, 0], // 支持精灵图偏移
              displacement: icon.isRadar ? [2, -1] : displacement
            })
          })
        );
      }
      // 淡绿色圆点
      styles.push(
        new Style({
          image: new Circle({
            radius: radius,
            fill: new Fill({ color: colorFill }),
            stroke: new Stroke({ color: borderStroke, width: borderWidth, lineDash: lineDash })
          })
        })
      );
    }

    // 文本样式
    if (text && text.content && text.showBackground) {
      // 文本内容
      styles.push(
        new Style({
          text: new Text({
            text: text.content || '',
            font: text.font || '14px Arial',
            fill: new Fill({ color: text.color || '#ffffff' }),
            offsetX: text.offsetX || 10,
            offsetY: text.offsetY || -17,
            textAlign: text.align || 'center',
            padding: [6, 12, 3, 12],
            // 加背景色
            backgroundFill: new Fill({ color: text.bgColor || '#ffffff' }),
            backgroundPadding: [12, 12, 12, 12],
            backgroundRadius: 5,
            backgroundStroke: new Stroke({ color: text.bgStroke || '#000000', width: 1 })
          })
        })
      );

      // 添加背景图片
      // styles.push(new Style({
      //   image: new Icon({
      //     src: text.bgImage || '/src/assets/imgs/qb.png',
      //     size: text.bgSize || [100, 50], // 背景图片尺寸
      //     anchor: [0.5, 0.5], // 锚点位置（背景中心对齐文本）
      //     anchorXUnits: 'fraction',
      //     anchorYUnits: 'fraction',
      //     displacement: text.displacement || [18, 9], // 位置偏移
      //     scale: text.bgScale || 1, // 缩放比例
      //     opacity: text.bgOpacity || 1 // 透明度
      //   })
      // }));
    }

    return styles.length === 1 ? styles[0] : styles;
  };
  // 样式缓存
  const styleCache = new WeakMap();

  // 批量添加队列
  const batchQueue = [];
  const BATCH_SIZE = 1000; // 每批处理1000个标记点
  let batchTimeout = null;

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
   * 添加标记点 - 优化版本，支持批量处理
   * @param {Array} coordinates - 坐标 [经度, 纬度]
   * @param {object} options - 标记点选项
   * @param {boolean} useBatch - 是否使用批量处理
   * @returns {string} 标记点ID
   */
  const addMarker = (coordinates, options = {}, useBatch = false) => {
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

    // 使用缓存的样式或创建新样式
    const styleKey = getStyleKey(options.style);
    let style = styleCache.get(styleKey);
    if (!style) {
      style = createMarkerStyle(options.style);
      styleCache.set(styleKey, style);
    }

    // 保存到状态
    const marker = {
      id,
      coordinates,
      feature,
      options,
      visible: options.visible !== undefined ? options.visible : true
    };

    // 根据 visible 属性设置样式
    if (marker.visible) {
      feature.setStyle(style);
    } else {
      feature.setStyle(createInvisibleStyle());
    }

    markers.value.push(marker);
    if (useBatch) {
      // 添加到批量队列
      batchQueue.push(marker);

      // 如果队列达到批量大小，立即处理
      if (batchQueue.length >= BATCH_SIZE) {
        processBatchQueue();
      } else {
        // 延迟处理，等待更多标记点
        if (batchTimeout) {
          clearTimeout(batchTimeout);
        }
        batchTimeout = setTimeout(processBatchQueue, 16); // 约60fps
      }
    } else {
      // 立即添加到图层
      addMarkerToLayer(marker, options);
    }

    return id;
  };

  /**
   * 生成样式缓存键
   * @param {object} styleOptions - 样式选项
   * @returns {string} 缓存键
   */
  const getStyleKey = (styleOptions) => {
    if (!styleOptions) return {};
    return styleOptions;
  };

  /**
   * 处理批量队列
   */
  const processBatchQueue = () => {
    if (batchQueue.length === 0) return;

    const features = [];
    const markersToAdd = [];

    // 按类型分组
    const markersByType = {};
    const defaultMarkers = [];

    batchQueue.forEach((marker) => {
      if (marker.options.type && marker.options.useTypeLayer) {
        if (!markersByType[marker.options.type]) {
          markersByType[marker.options.type] = [];
        }
        markersByType[marker.options.type].push(marker);
      } else {
        defaultMarkers.push(marker);
      }
    });

    // 批量添加到默认图层
    if (defaultMarkers.length > 0) {
      // 根据 visible 属性设置样式
      defaultMarkers.forEach((m) => {
        if (!m.visible) {
          m.feature.setStyle(createInvisibleStyle());
        }
      });
      const defaultFeatures = defaultMarkers.map((m) => m.feature);
      markerSource.value.addFeatures(defaultFeatures);
      markers.value.push(...defaultMarkers);
    }

    // 批量添加到类型图层
    Object.keys(markersByType).forEach((type) => {
      const typeMarkers = markersByType[type];
      // 根据 visible 属性设置样式
      typeMarkers.forEach((m) => {
        if (!m.visible) {
          m.feature.setStyle(createInvisibleStyle());
        }
      });
      const typeFeatures = typeMarkers.map((m) => m.feature);

      if (!markerSourcesByType.value[type]) {
        createMarkerLayerByType(type);
      }

      if (markerSourcesByType.value[type]) {
        markerSourcesByType.value[type].addFeatures(typeFeatures);
        markers.value.push(...typeMarkers);
      }
    });

    // 清空队列
    batchQueue.length = 0;

    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
  };

  /**
   * 添加标记点到图层
   * @param {object} marker - 标记点对象
   * @param {object} options - 选项
   */
  const addMarkerToLayer = (marker, options) => {
    // 如果 marker 不可见，确保使用透明样式
    if (!marker.visible) {
      marker.feature.setStyle(createInvisibleStyle());
    }

    if (options.type && options.useTypeLayer) {
      addMarkerToTypeLayer(options.type, marker.feature);
    } else {
      markerSource.value.addFeature(marker.feature);
    }
  };

  /**
   * 移除标记点
   * @param {string} id - 标记点ID
   */
  const removeMarker = (id) => {
    const markerIndex = markers.value.findIndex((m) => m.id === id);
    if (markerIndex === -1) return;

    const marker = markers.value[markerIndex];
    // 如果标记点有类型且使用类型图层，从对应的类型图层中删除
    if (marker.options.type && marker.options.useTypeLayer) {
      removeMarkerFromTypeLayer(marker.options.type, marker.feature);
    } else if (markerSource.value) {
      // 否则从默认图层中删除
      markerSource.value.removeFeature(marker.feature);
    }

    markers.value.splice(markerIndex, 1);
  };

  /**
   * 更新标记点
   * @param {string} id - 标记点ID
   * @param {object} updates - 更新内容
   */
  const updateMarker = (id, updates = {}) => {
    const marker = markers.value.find((m) => m.id === id);
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
      Object.keys(updates.data).forEach((key) => {
        marker.feature.set(key, updates.data[key]);
      });
    }
  };

  /**
   * 显示/隐藏标记点边框
   * @param {string} id - 标记点ID
   * @param {boolean} show - 是否显示边框
   */
  const toggleMarkerBorder = (id, show = true) => {
    markers.value.forEach((marker) => {
      if (marker.id == id) {
        // 更新样式配置
        if (marker.options.style.icon) {
          marker.options.style.icon.showBorder = show;
        } else {
          marker.options.style.showBorder = show;
        }
        // 重新创建样式
        const newStyle = createMarkerStyle(marker.options.style);
        marker.feature.setStyle(newStyle);
      }
    });
  };

  /**
   * 显示/隐藏标记点
   * @param {string} id - 标记点ID
   * @param {boolean} visible - 是否显示
   */
  const toggleMarkerVisibility = (id, visible) => {
    const marker = markers.value.find((m) => m.id === id);
    if (!marker) return;

    marker.visible = visible;
    // 设置样式 visible false 时，使用完全透明的样式
    marker.feature.setStyle(
      visible ? createMarkerStyle(marker.options.style) : createInvisibleStyle()
    );
  };

  /**
   * 显示/隐藏标记点 - 优化版本，支持大量数据
   * @param {string} type - 标记点类型
   * @param {boolean} visible - 是否显示
   */
  const toggleMarkerVisibilityList = (type, visible, isDelete = false) => {
    const markerlist = markers.value.filter((m) => m.options.type === type);
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
      markerlist.forEach((marker) => {
        marker.visible = visible;
        marker.feature.setStyle(
          visible ? createMarkerStyle(marker.options.style) : createInvisibleStyle()
        );
      });
    }
  };

  /**
   * 批量切换标记点可见性 - 使用 requestAnimationFrame 分批处理
   * @param {Array} markerlist - 标记点列表
   * @param {boolean} visible - 是否显示
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
        marker.feature.setStyle(
          visible ? createMarkerStyle(marker.options.style) : createInvisibleStyle()
        );
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
   * @param {string} type - 标记点类型
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
   * @param {string} type - 标记点类型
   * @param {boolean} visible - 是否显示
   */
  const toggleMarkerVisibilityByLayer = (type, visible) => {
    const layers = getAllLayers();
    const targetLayers = layers.filter((layer, index) => layer.get('type') === type);

    // 如果图层存在，控制图层可见性
    if (targetLayers.length > 0) {
      targetLayers.forEach((layer) => {
        layer.setVisible(visible);
      });
    }

    // 更新标记点的可见性状态和样式（无论图层是否存在都要更新）
    const markerlist = markers.value.filter((m) => m.options.type === type);

    if (markerlist.length === 0) {
      // 如果没有找到对应类型的标记点，尝试使用 toggleMarkerVisibilityList
      // 这样可以处理没有使用类型图层的情况
      return;
    }

    // 如果数据量很大，使用批量更新
    if (markerlist.length > 1000) {
      batchToggleMarkerVisibility(markerlist, visible);
    } else {
      // 数据量较小时，直接更新
      markerlist.forEach((marker) => {
        marker.visible = visible;
        // 更新样式：根据 visible 状态设置正常样式或透明样式
        marker.feature.setStyle(
          visible ? createMarkerStyle(marker.options.style) : createInvisibleStyle()
        );
      });
    }
  };

  /**
   * 创建按类型分组的标记点图层
   * @param {string} type - 标记点类型
   */
  const createMarkerLayerByType = (type) => {
    if (markerLayersByType.value[type]) {
      return markerLayersByType.value[type];
    }

    markerSource.value = new VectorSource();
    markerLayer.value = new VectorLayer({
      source: markerSource.value,
      zIndex: 110 + Object.keys(markerLayersByType.value).length, // 确保在基础图层之上，避免被图层切换影响
      title: type,
      visible: true
    });

    // 为图层添加类型标识，用于点击事件识别
    markerLayer.value.set('type', type);

    markerSourcesByType.value[type] = markerSource.value;
    markerLayersByType.value[type] = markerLayer.value;

    // 将图层添加到地图
    const mapInstance = map?.value || map;
    if (mapInstance) {
      mapInstance.addLayer(markerLayer.value);
    }

    return markerLayer.value;
  };

  /**
   * 将标记点添加到指定类型的图层
   * @param {string} type - 标记点类型
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
   * @param {string} type - 标记点类型
   * @param {Feature} feature - 标记点要素
   */
  const removeMarkerFromTypeLayer = (type, feature) => {
    if (markerSourcesByType.value[type]) {
      markerSourcesByType.value[type].removeFeature(feature);
    }
  };

  /**
   * 清除指定类型的所有标记点
   * @param {string} type - 标记点类型
   */
  const clearMarkersByType = (type) => {
    if (markerSourcesByType.value[type]) {
      markerSourcesByType.value[type].clear();
      // 从主标记点数组中移除
      markers.value = markers.value.filter((m) => m.options.type !== type);
    }
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
   * @param {string} id - 标记点ID
   * @param {boolean} visible - 是否显示
   */
  const toggleMarkerTextVisibility = (id, visible) => {
    const marker = markers.value.find((m) => m.id === id);
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
   * @param {string} type - 标记点类型
   * @param {boolean} visible - 是否显示
   */
  const toggleMarkerTextVisibilityByType = (type, visible) => {
    const markerlist = markers.value.filter((m) => m.options.type === type);
    if (markerlist.length === 0) return;

    markerlist.forEach((marker) => {
      if (marker.options.style.text && marker.visible) {
        marker.options.style.text.showBackground = visible;
        const newStyle = createMarkerStyle(marker.options.style);
        marker.feature.setStyle(newStyle);
      }
    });
  };

  /**
   * 切换船舶标记样式（图标 vs 小绿点）
   * @param {string} type - 标记点类型
   * @param {boolean} useSimpleStyle - 是否使用简单样式（小绿点）
   */
  const toggleShipMarkerStyle = (type, useSimpleStyle, style) => {
    return new Promise((resolve, reject) => {
      markers.value.forEach((marker, index) => {
        if (marker.options.type === type) {
          const prevStyle = marker.options.style || {};
          const prevText = prevStyle.text || prevStyle.prevtext;
          const prevIcon = prevStyle.icon || prevStyle.previcon;

          if (useSimpleStyle) {
            // 使用小绿点样式，仅替换形状相关配置，保留文本配置
            marker.options.style = {
              ...prevIcon,
              icon: null,
              radius: 3,
              colorFill: '#00ff00',
              borderStroke: '#00ff00',
              lineDash: [2, 2],
              strokeWidth: 1,
              displacement: [0, 0],
              prevtext: prevText,
              previcon: prevIcon
            };
          } else {
            marker.options.style = {
              icon: prevIcon,
              text: prevText
            };
          }
          const newStyle = createMarkerStyle(marker.options.style);
          marker.feature.setStyle(newStyle);
        }
      });
      resolve();
    });
  };

  /**
   * 清除所有标记点
   */
  const clearMarkers = () => {
    return new Promise((resolve, reject) => {
      // 清除默认标记点图层
      if (markerSource.value) {
        markerSource.value.clear();
      }
      // 清除扇形图层
      if (markerIdCounter.value) {
        markerIdCounter.value.clear();
      }

      // 清除所有类型图层的标记点
      Object.keys(markerSourcesByType.value).forEach((type) => {
        if (markerSourcesByType.value[type]) {
          markerSourcesByType.value[type].clear();
        }
      });

      // 清空标记点数组
      markers.value = [];
      resolve();
    });
  };

  /**
   * 获取标记点
   * @param {string} id - 标记点ID
   * @returns {object | null} 标记点对象
   */
  const getMarker = (id) => {
    return markers.value.find((m) => m.id === id) || null;
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
   * @param {string} type - 标记点类型
   * @returns {Array} 标记点数组
   */
  const getMarkersByType = (type) => {
    return markers.value.filter((m) => m.options.type === type);
  };

  /**
   * 设置标记点配置
   * @param {object} config - 配置对象
   */
  const setMarkerConfig = (config) => {
    Object.assign(markerConfig, config);
  };

  /**
   * 设置标记点坐标
   * @param {string} id - 标记点ID
   * @param {Array} coordinates - 坐标
   */
  const setMarkerCoordinates = (id, coordinates) => {
    const [lng, lat] = coordinates;
    const marker = markers.value.find((m) => m.id === id);
    if (!marker) return;
    marker.feature.setGeometry(new Point(fromLonLat([lng, lat])));
  };

  /**
   * 批量添加标记点 - 高性能版本
   * @param {Array} markerList - 标记点列表
   * @param {object} batchOptions - 批量选项
   */
  const addMarkers = async (markerList, batchOptions = {}) => {
    const {
      useBatch = true,
      batchSize = BATCH_SIZE,
      onProgress = null,
      onComplete = null,
      isEnableCluster = false
    } = batchOptions;
    if (!useBatch || markerList.length < 100) {
      // 小数据量直接添加
      markerList.forEach(({ coordinates, options = {} }) => {
        addMarker(coordinates, options, false);
      });
      if (isEnableCluster) {
        // 启用指定类型的聚合
        Object.keys(markerSourcesByType.value).forEach((el) => {
          enableClustering(el, {
            distance: 40, // 聚合距离
            minDistance: 20 // 最小聚合距离
          });
          toggleClustering(el, true);
        });
      }
      onComplete && onComplete();
      return;
    }

    const params = {
      markerList,
      batchSize,
      onProgress,
      onComplete,
      isEnableCluster
    };
    // 大数据量使用分批处理
    await addMarkersBatch(params);
  };

  /**
   * 分批添加大量标记点
   * @param {Array} markerList - 标记点列表
   * @param {number} batchSize - 每批大小
   * @param {Function} onProgress - 进度回调
   * @param {Function} onComplete - 完成回调
   */
  const addMarkersBatch = (params) => {
    const { markerList, batchSize, onProgress, onComplete, isEnableCluster } = params;
    return new Promise((resolve, reject) => {
      let currentIndex = 0;
      const total = markerList.length;
      let processed = 0;

      const processBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, total);
        const batch = markerList.slice(currentIndex, endIndex);

        // 创建要素数组和标记点数组
        const features = [];
        const markersToAdd = [];
        batch.forEach(({ coordinates, options = {} }) => {
          const id = options.id || generateUniqueMarkerId();
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

          // 使用缓存的样式
          const styleKey = getStyleKey(options.style);
          let style = styleCache.get(styleKey);
          if (!style) {
            style = createMarkerStyle(options.style);
            styleCache.set(styleKey, style);
          }

          // 确定 visible 属性
          const visible = options.visible !== undefined ? options.visible : true;

          // 根据 visible 属性设置样式
          if (visible) {
            feature.setStyle(style);
          } else {
            feature.setStyle(createInvisibleStyle());
          }

          features.push(feature);
          const marker = {
            id,
            coordinates,
            feature,
            options,
            visible: visible
          };
          markersToAdd.push(marker);
          markers.value.push(marker);
        });

        // 按类型分组
        const markersByType = {};
        const defaultMarkers = [];

        markersToAdd.forEach((marker) => {
          if (marker.options.type && marker.options.useTypeLayer) {
            if (!markersByType[marker.options.type]) {
              markersByType[marker.options.type] = [];
            }
            markersByType[marker.options.type].push(marker);
          } else {
            defaultMarkers.push(marker);
          }
        });

        // 批量添加到默认图层
        if (defaultMarkers.length > 0) {
          const defaultFeatures = defaultMarkers.map((m) => m.feature);
          markerSource.value.addFeatures(defaultFeatures);
          markers.value.push(...defaultMarkers);
        }

        // 批量添加到类型图层
        Object.keys(markersByType).forEach((type) => {
          const typeMarkers = markersByType[type];
          const typeFeatures = typeMarkers.map((m) => m.feature);

          if (!markerSourcesByType.value[type]) {
            createMarkerLayerByType(type);
          }
          if (markerSourcesByType.value[type]) {
            markerSourcesByType.value[type].addFeatures(typeFeatures);
            markers.value.push(...typeMarkers);
          }
        });

        processed += batch.length;
        currentIndex = endIndex;

        // 报告进度
        if (onProgress) {
          onProgress({
            processed,
            total,
            percentage: Math.round((processed / total) * 100)
          });
        }

        // 如果还有数据需要处理，继续下一批
        if (currentIndex < total) {
          requestAnimationFrame(processBatch);
        } else {
          if (isEnableCluster) {
            // 启用指定类型的聚合
            Object.keys(markerSourcesByType.value).forEach((el) => {
              enableClustering(el, {
                distance: 40, // 聚合距离
                minDistance: 20 // 最小聚合距离
              });
              toggleClustering(el, true);
            });
          }
          // 所有数据处理完成
          if (onComplete) {
            onComplete({
              processed,
              total,
              percentage: 100
            });
            resolve({
              processed,
              total,
              percentage: 100
            });
          }
        }
      };

      processBatch();
    });
  };

  /**
   * 监听地图点击事件添加标记点
   * @param {boolean} enabled - 是否启用
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
   * @param {object} event - 点击事件
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
        borderWidth: 2 // 外边框宽度
      },
      data: {
        clickTime: new Date().toISOString()
      }
    });
  };

  /**
   * 检查标记点ID是否唯一
   * @param {string} id - 标记点ID
   * @returns {boolean} 是否唯一
   */
  const isMarkerIdUnique = (id) => {
    return !markers.value.some((marker) => marker.id === id);
  };

  /**
   * 生成唯一的标记点ID
   * @param {string} prefix - ID前缀
   * @returns {string} 唯一的ID
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

  // 存储已加载的标记点ID，用于避免重复加载
  const loadedMarkers = new Set();

  /**
   * 生成标记点唯一标识
   * @param {object} marker - 标记点对象
   * @returns {string} 标记点唯一标识
   */
  const getMarkerKey = (marker) => {
    return marker.options?.id || `${marker.coordinates[0]}_${marker.coordinates[1]}`;
  };

  /**
   * 虚拟化渲染 - 只渲染当前视口内的标记点
   * @param {Array} markerList - 标记点列表
   * @param {object} options - 选项
   */
  const addMarkersVirtualized = (markerList, options = {}) => {
    const {
      viewportBuffer = 0.1, // 视口缓冲区（度）
      onViewportChange = null,
      maxVisibleMarkers = 10000, // 最大可见标记点数
      enableCleanup = true // 是否启用清理不在视口内的标记点
    } = options;

    // 获取当前视口范围
    const getViewportBounds = () => {
      const view = map.getView();
      const extent = view.calculateExtent();
      const [minX, minY, maxX, maxY] = extent;
      const [minLng, minLat] = toLonLat([minX, minY]);
      const [maxLng, maxLat] = toLonLat([maxX, maxY]);

      return {
        minLng: minLng - viewportBuffer,
        minLat: minLat - viewportBuffer,
        maxLng: maxLng + viewportBuffer,
        maxLat: maxLat + viewportBuffer
      };
    };

    // 过滤视口内的标记点
    const filterMarkersInViewport = (markers, bounds) => {
      return markers.filter(({ coordinates, id }) => {
        const [lng, lat] = coordinates;
        return (
          lng >= bounds.minLng &&
          lng <= bounds.maxLng &&
          lat >= bounds.minLat &&
          lat <= bounds.maxLat
        );
      });
    };

    // 添加标记点到地图
    const addMarkersToMap = (markersToAdd) => {
      if (markersToAdd.length === 0) return;

      // 过滤出未加载的标记点
      const newMarkers = markersToAdd.filter((marker) => {
        const key = getMarkerKey(marker);
        return !loadedMarkers.has(key);
      });

      if (newMarkers.length === 0) {
        console.log('所有标记点都已加载，跳过重复加载');
        return;
      }

      console.log(
        `准备加载 ${newMarkers.length} 个新标记点，跳过 ${markersToAdd.length - newMarkers.length} 个已加载的标记点`
      );

      // 批量添加新标记点
      addMarkers(newMarkers, {
        useBatch: true,
        batchSize: 1000,
        onComplete: () => {
          // 将新加载的标记点ID添加到Set中
          newMarkers.forEach((marker) => {
            const key = getMarkerKey(marker);
            loadedMarkers.add(key);
          });
          console.log(
            `虚拟化渲染完成，新增渲染了 ${newMarkers.length} 个标记点，总计已加载 ${loadedMarkers.size} 个标记点`
          );
        }
      });
    };

    // 清理不在视口内的标记点
    const cleanupMarkersOutsideViewport = (currentVisibleKeys) => {
      if (!enableCleanup) return;

      const markersToRemove = [];

      // 找出需要移除的标记点
      markers.value.forEach((marker) => {
        const key = getMarkerKey(marker);
        if (loadedMarkers.has(key) && !currentVisibleKeys.has(key)) {
          markersToRemove.push(marker);
        }
      });

      // 移除标记点
      markersToRemove.forEach((marker) => {
        const key = getMarkerKey(marker);
        removeMarker(marker.id);
        loadedMarkers.delete(key);
      });

      if (markersToRemove.length > 0) {
        console.log(`清理了 ${markersToRemove.length} 个不在视口内的标记点`);
      }
    };

    // 初始渲染
    const initialBounds = getViewportBounds();
    const visibleMarkers = filterMarkersInViewport(markerList, initialBounds);
    console.log('🚀 ~ addMarkersVirtualized ~ visibleMarkers:', visibleMarkers);

    // 限制可见标记点数量
    const markersToRender = visibleMarkers.slice(0, maxVisibleMarkers);

    // 添加标记点到地图
    addMarkersToMap(markersToRender);

    // 监听视口变化
    if (onViewportChange) {
      map.getView().on('change', () => {
        const newBounds = getViewportBounds();
        const newVisibleMarkers = filterMarkersInViewport(markerList, newBounds);
        const newMarkersToRender = newVisibleMarkers.slice(0, maxVisibleMarkers);

        // 创建当前可见标记点的键集合
        const currentVisibleKeys = new Set(newMarkersToRender.map(getMarkerKey));

        // 添加新的标记点
        addMarkersToMap(newMarkersToRender);

        // 清理不在视口内的标记点
        cleanupMarkersOutsideViewport(currentVisibleKeys);

        onViewportChange({
          bounds: newBounds,
          visibleCount: newVisibleMarkers.length,
          renderedCount: newMarkersToRender.length,
          loadedCount: loadedMarkers.size
        });
      });
    }
  };

  /**
   * 在地图上绘制带填充色的多边形
   * @param {Array<[number, number]>|Array<Array<[number, number]>>|Array<Array<Array<[number, number]>>>} lonLatCoordinates - 多边形经纬度坐标
   * @param {object} [options]
   * @param {string} [options.fillColor] - 填充色，支持 rgba/hex，默认含0.5透明度
   * @param {string} [options.strokeColor] - 边框颜色
   * @param {number} [options.strokeWidth] - 边框宽度
   * @returns {Feature|undefined} 返回创建的要素
   */
  const drawFilledPolygon = (
    lonLatCoordinates,
    { fillColor = '#1989fa80', strokeColor = '#1989fa', strokeWidth = 2 } = {}
  ) => {
    if (!map) return;
    if (!Array.isArray(lonLatCoordinates) || lonLatCoordinates.length < 1) {
      console.warn('多边形坐标不能为空');
      return;
    }

    // 自动处理多层嵌套的坐标数组
    const extractCoordinates = (arr) => {
      // 如果是坐标对 [lng, lat]，直接返回
      if (arr.length === 2 && typeof arr[0] === 'number') {
        return arr;
      }

      // 如果是坐标环，返回
      if (Array.isArray(arr[0]) && arr[0].length === 2) {
        return arr;
      }

      // 递归处理
      return extractCoordinates(arr[0]);
    };

    const coords = extractCoordinates(lonLatCoordinates);

    // 确保是二维数组格式
    const ringsLonLat = Array.isArray(coords[0]) ? [coords] : [[coords]];

    // 处理每个环，确保它们都是闭合的
    const closedRingsLonLat = ringsLonLat.map(ring => {
      // 闭合坐标环：若首尾不一致则自动闭合
      const needClose = ring.length < 1 ||
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1];

      return needClose ? [...ring, ring[0]] : ring;
    });

    // 转换为投影坐标
    const rings3857 = closedRingsLonLat.map(ring =>
      ring.map(lngLat => fromLonLat(lngLat))
    );

    const polygon = new OlPolygon(rings3857);
    const feature = new Feature({ geometry: polygon });

    feature.setStyle(
      new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth })
      })
    );

    customPolygonSource.value.addFeature(feature);
    return feature;
  };
  /**
   * 在地图上绘制带填充色的多边形
   * @param {Array<[number, number]>|Array<Array<[number, number]>>|Array<Array<Array<[number, number]>>>} lonLatCoordinates - 多边形经纬度坐标
   * @param {object} [options]
   * @param {string} [options.fillColor] - 填充色，支持 rgba/hex，默认含0.5透明度
   * @param {string} [options.strokeColor] - 边框颜色
   * @param {number} [options.strokeWidth] - 边框宽度
   * @returns {Feature|undefined} 返回创建的要素
   */
  const drawFilledPolygonCustom = (
    lonLatCoordinates,
    { fillColor = '#1989fa80', strokeColor = '#1989fa', strokeWidth = 2, type = 'electronic-fence-custom' } = {}
  ) => {
    if (!map) return;
    if (!Array.isArray(lonLatCoordinates) || lonLatCoordinates.length < 1) {
      console.warn('多边形坐标不能为空');
      return;
    }

    const polygonSource = new VectorSource();
    const polygonLayer = new VectorLayer({
      source: polygonSource,
      zIndex: 104,
      type: type,
      title: type
    });
    map.addLayer(polygonLayer);

    // 自动处理多层嵌套的坐标数组
    const extractCoordinates = (arr) => {
      // 如果是坐标对 [lng, lat]，直接返回
      if (arr.length === 2 && typeof arr[0] === 'number') {
        return arr;
      }

      // 如果是坐标环，返回
      if (Array.isArray(arr[0]) && arr[0].length === 2) {
        return arr;
      }

      // 递归处理
      return extractCoordinates(arr[0]);
    };

    const coords = extractCoordinates(lonLatCoordinates);

    // 确保是二维数组格式
    const ringsLonLat = Array.isArray(coords[0]) ? [coords] : [[coords]];

    // 处理每个环，确保它们都是闭合的
    const closedRingsLonLat = ringsLonLat.map(ring => {
      // 闭合坐标环：若首尾不一致则自动闭合
      const needClose = ring.length < 1 ||
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1];

      return needClose ? [...ring, ring[0]] : ring;
    });

    // 转换为投影坐标
    const rings3857 = closedRingsLonLat.map(ring =>
      ring.map(lngLat => fromLonLat(lngLat))
    );

    const polygon = new OlPolygon(rings3857);
    const feature = new Feature({ geometry: polygon });

    feature.setStyle(
      new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth })
      })
    );

    polygonSource.addFeature(feature);
    return polygonSource;
  };

  /**
   * 在地图上绘制扇形
   * @param {Array<number>} center - 扇形中心点坐标 [经度, 纬度]
   * @param {object} [options]
   * @param {number} [options.radius] - 扇形半径(米)
   * @param {number} [options.startAngle] - 起始角度(度)
   * @param {number} [options.endAngle] - 结束角度(度)
   * @param {number} [options.segments] - 扇形边缘线段分割数
   * @param {string} [options.fillColor] - 填充色，支持 rgba/hex，默认含0.5透明度
   * @param {string} [options.strokeColor] - 边框颜色
   * @param {number} [options.strokeWidth] - 边框宽度
   * @returns {Feature|undefined} 返回创建的要素
   */
  const drawSector = (
    center,
    {
      radius = 1000,
      startAngle = 0,
      endAngle = 90,
      segments = 32,
      fillColor = '#1989fa80',
      strokeColor = '#1989fa',
      strokeWidth = 2,
      id = null,
      visible = false
    } = {}
  ) => {
    if (!map) return;
    if (!Array.isArray(center) || center.length < 2) {
      console.warn('中心点坐标必须包含经度和纬度');
      return;
    }

    // 角度转换为弧度
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // 确保起始角度小于结束角度
    let deltaRad = endRad - startRad;
    if (deltaRad <= 0) deltaRad += 2 * Math.PI;

    // 计算扇形顶点坐标
    const vertices = [];
    vertices.push(center); // 中心点

    // 计算圆弧上的点
    const angularStep = deltaRad / segments;
    for (let i = 0; i <= segments; i++) {
      const angle = startRad + i * angularStep;
      // 计算该角度下的地球表面上的点
      const dx = radius * Math.sin(angle);
      const dy = radius * Math.cos(angle);

      // 将米转换为经纬度差值（近似）
      const dLon = dx / (111320 * Math.cos((center[1] * Math.PI) / 180));
      const dLat = dy / 111320;

      vertices.push([center[0] + dLon, center[1] + dLat]);
    }

    // 转换为投影坐标
    const ring3857 = vertices.map((lngLat) => fromLonLat(lngLat));

    const polygon = new OlPolygon([ring3857]);
    const feature = new Feature({ geometry: polygon, id: id });

    feature.setStyle(
      new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth, lineDash: [5, 5] }),
        visible: visible,
      })
    );
    // console.log("🚀 ~ drawSector ~ center:", feature);
    markerIdCounter.value.addFeature(feature);
    return feature;
  };

  /**
   * 清理已加载标记点记录
   */
  const clearLoadedMarkers = () => {
    loadedMarkers.clear();
  };

  /**
   * 获取已加载标记点数量
   * @returns {number} 已加载标记点数量
   */
  const getLoadedMarkersCount = () => {
    return loadedMarkers.size;
  };

  /**
   * 检查标记点是否已加载
   * @param {string | object} markerIdOrMarker - 标记点ID或标记点对象
   * @returns {boolean} 是否已加载
   */
  const isMarkerLoaded = (markerIdOrMarker) => {
    const key =
      typeof markerIdOrMarker === 'string' ? markerIdOrMarker : getMarkerKey(markerIdOrMarker);
    return loadedMarkers.has(key);
  };

  /**
   * 强制处理批量队列
   */
  const flushBatchQueue = () => {
    if (batchQueue.length > 0) {
      processBatchQueue();
    }
  };

  /**
   * 启用聚合功能
   * @param {string} type - 标记点类型
   * @param {object} options - 聚合选项
   */
  const enableClustering = (type, options = {}) => {
    const typeMarkers = getMarkersByType(type);
    if (typeMarkers.length === 0) {
      console.warn(`类型 ${type} 的标记点不存在`);
      return;
    }

    // 准备聚合数据
    const clusterData = typeMarkers.map((marker) => ({
      coordinates: marker.coordinates,
      data: {
        ...marker.options.data,
        style: marker.options.style
      }
    }));

    // 创建聚合图层
    createClusterLayer(type, clusterData, {
      distance: options.distance || 40, // 聚合
      minDistance: options.minDistance || 20
    });

    // 隐藏原始图层
    if (markerLayersByType.value[type]) {
      markerLayersByType.value[type].setVisible(false);
    }

    clusterEnabled.value = true;
    console.log(`已启用 ${type} 类型的聚合功能`);
  };

  /**
   * 禁用聚合功能
   * @param {string} type - 标记点类型
   */
  const disableClustering = (type) => {
    // 清除聚合图层
    clearClusterLayer(type);

    // 显示原始图层
    if (markerLayersByType.value[type]) {
      markerLayersByType.value[type].setVisible(true);
    }

    console.log(`已禁用 ${type} 类型的聚合功能`);
  };

  /**
   * 切换聚合功能
   * @param {string} type - 标记点类型
   * @param {boolean} enabled - 是否启用
   */
  const toggleClustering = (type, enabled) => {
    if (enabled) {
      enableClustering(type);
    } else {
      disableClustering(type);
    }
  };

  /**
   * 更新聚合图层
   * @param {string} type - 标记点类型
   */
  const refreshClusterLayer = (type) => {
    const typeMarkers = getMarkersByType(type);
    const clusterData = typeMarkers.map((marker) => ({
      coordinates: marker.coordinates,
      data: {
        ...marker.options.data,
        style: marker.options.style
      }
    }));

    updateClusterLayer(type, clusterData);
  };

  /**
   * 设置聚合距离
   * @param {string} type - 标记点类型
   * @param {number} distance - 聚合距离
   */
  const setClusterDistanceForType = (type, distance) => {
    setClusterDistance(type, distance);
  };

  /**
   * 获取聚合信息
   * @param {string} type - 标记点类型
   * @returns {object} 聚合信息
   */
  const getClusterInfoForType = (type) => {
    return getClusterInfo(type);
  };

  /**
   * 添加指定图层到地图
   * @param {string} type 图层类型
   * @param {object} layer 图层对象
   */
  const addLayerToMap = (config) => {
    if (!map) return;
    const layer = new TileLayer({
      source: config.source,
      title: config.title,
      type: config.type,
      visible: config.visible,
      opacity: config.opacity,
      zIndex: config.zIndex
    });
    map.addLayer(layer);
  };

  /**
   * 添加一个半透明淡蓝色图层，但排除指定的GeoJSON区域
   * @param {Array} geoJsonCoordinates - GeoJSON格式的四维坐标数组
   * @param {object} options - 配置选项
   * @param {string} options.excludeColor - 排除区域的颜色，默认为透明
   * @param {string} options.overlayColor - 覆盖区域的颜色，默认为半透明淡蓝色
   * @param {string} options.borderColor - 边框颜色，默认为深蓝色
   * @param {number} options.borderWidth - 边框宽度，默认为2
   * @returns {Feature} 创建的要素
   */
  const addExcludedAreaLayer = (geoJsonCoordinates, options = {}) => {
    if (!map) {
      console.warn('地图未初始化');
      return null;
    }

    const {
      excludeColor = 'transparent',
      overlayColor = 'rgb(25, 135, 255,.4)', // 半透明淡蓝色
      borderColor = '#fff', // 白色边框
      borderWidth = 4,
      zIndex = 103
    } = options;

    // 创建一个覆盖整个地图的大矩形
    const mapExtent = map.getView().getProjection().getExtent();
    const expandedExtent = [
      mapExtent[0] - (mapExtent[2] - mapExtent[0]) * 0.5,
      mapExtent[1] - (mapExtent[3] - mapExtent[1]) * 0.5,
      mapExtent[2] + (mapExtent[2] - mapExtent[0]) * 0.5,
      mapExtent[3] + (mapExtent[3] - mapExtent[1]) * 0.5
    ];

    // 创建外部矩形环（顺时针）
    const outerRing = [
      [expandedExtent[0], expandedExtent[1]],
      [expandedExtent[2], expandedExtent[1]],
      [expandedExtent[2], expandedExtent[3]],
      [expandedExtent[0], expandedExtent[3]],
      [expandedExtent[0], expandedExtent[1]]
    ];

    // 处理GeoJSON坐标，确保正确的格式
    let excludedRings = [];
    if (Array.isArray(geoJsonCoordinates)) {
      if (geoJsonCoordinates.length > 0) {
        // 检查是否是嵌套数组（GeoJSON格式）
        if (Array.isArray(geoJsonCoordinates[0])) {
          if (Array.isArray(geoJsonCoordinates[0][0])) {
            // 三维数组 [[[x,y], [x,y], ...]]
            excludedRings = geoJsonCoordinates;
          } else {
            // 二维数组 [[x,y], [x,y], ...]
            excludedRings = [geoJsonCoordinates];
          }
        } else {
          console.warn('坐标格式不正确');
          return null;
        }
      }
    } else {
      console.warn('坐标必须是一个数组');
      return null;
    }

    // 确保排除区域是逆时针方向（作为孔洞）
    const orientedRings = excludedRings.map(ringArray => {
      // 如果是最内层数组是坐标点
      const ring = Array.isArray(ringArray[0]) && Array.isArray(ringArray[0][0]) ? ringArray[0] : ringArray;

      // 转换为投影坐标
      const projectedRing = ring.map(coord => {
        if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          // 如果是经纬度坐标（通常在-180到180和-90到90范围内），转换为投影坐标
          if (Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90) {
            return fromLonLat([coord[0], coord[1]]);
          }
          // 否则假设已经是投影坐标
          return [coord[0], coord[1]];
        }
        return coord;
      });

      // 检查是否需要反转方向以确保是孔洞（逆时针）
      let area = 0;
      for (let i = 0; i < projectedRing.length - 1; i++) {
        area += (projectedRing[i][0] * projectedRing[i + 1][1] - projectedRing[i + 1][0] * projectedRing[i][1]);
      }
      area += (projectedRing[projectedRing.length - 1][0] * projectedRing[0][1] - projectedRing[0][0] * projectedRing[projectedRing.length - 1][1]);

      // 如果是顺时针，反转数组以变成逆时针
      if (area > 0) {
        return projectedRing.slice().reverse();
      }
      return projectedRing;
    });

    // 构造带孔的多边形坐标
    const polygonCoords = [outerRing, ...orientedRings];

    // 创建多边形
    const polygon = new OlPolygon(polygonCoords);
    const feature = new Feature({
      geometry: polygon,
    });

    // 设置带阴影效果的样式
    feature.setStyle(new Style({
      fill: new Fill({
        color: overlayColor
      }),
      stroke: new Stroke({
        color: borderColor,
        width: borderWidth,
        // 添加阴影效果
        lineCap: 'round',
        lineJoin: 'round'
      })
    }));

    // 添加一个额外的阴影样式
    const shadowStyle = new Style({
      stroke: new Stroke({
        color: 'hsla(0, 0%, 100%, 0.5)', // 半透明黑色阴影
        width: borderWidth + 10, // 稍宽一些以形成阴影效果
        lineCap: 'round',
        lineJoin: 'round'
      })
    });

    // 应用双重样式（阴影在下，主边框在上）
    feature.setStyle([shadowStyle, feature.getStyle()]);

    // 设置图层的zIndex
    if (customPolygonLayer.value) {
      customPolygonLayer.value.setZIndex(zIndex);
      // 为边界图层设置独特的类型
      customPolygonLayer.value.set('type', 'district-boundary');
    }
    // 添加到自定义图层
    customPolygonSource.value.addFeature(feature);

    return feature;
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

    // 清理类型图层
    Object.values(markerLayersByType.value).forEach((layer) => {
      if (map && layer) {
        map.removeLayer(layer);
      }
    });

    // 清理聚合图层
    destroyClustering();

    clearLoadedMarkers(); // 清理已加载标记点记录
    batchQueue.length = 0;
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }

    markers.value = [];
    trackFeatureList.value = [];
    markerLayer.value = null;
    markerSource.value = null;
    markerLayersByType.value = {};
    markerSourcesByType.value = {};
  };

  /**
   * 获取地图边界
   * @returns {object} 地图边界
   */
  const getMapBounds = () => {
    if (!map) return;
    const view = map.getView().calculateExtent(map.getSize());
    const [minX, minY, maxX, maxY] = view;
    const [minLng, minLat] = toLonLat([minX, minY]);
    const [maxLng, maxLat] = toLonLat([maxX, maxY]);
    return {
      minLng: minLng,
      minLat: minLat,
      maxLng: maxLng,
      maxLat: maxLat
    };
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
    markers,
    markerLayer,
    markerSource,
    markerLayersByType,
    markerSourcesByType,
    markerConfig,
    markerPopupOverlay,
    markerPopupElement,
    // 聚合相关状态
    clusterLayers,
    clusterSources,
    clusterEnabled,
    clusterConfig,
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
    setMarkerCoordinates,
    createMultipleMarkers,
    clearOverlaysByType,
    drawFilledPolygon,
    drawFilledPolygonCustom,
    drawSector,
    addLayerToMap,
    addExcludedAreaLayer,

    // 性能优化方法
    batchToggleMarkerVisibility,
    createMarkerLayerByType,
    addMarkerToTypeLayer,
    removeMarkerFromTypeLayer,
    createMarkerStyle,
    // 新增：高性能批量处理方法
    addMarkersBatch,
    addMarkersVirtualized,
    flushBatchQueue,
    // 虚拟化渲染相关方法
    clearLoadedMarkers,
    getLoadedMarkersCount,
    isMarkerLoaded,
    // 文本和气泡控制方法
    toggleMarkerTextVisibility,
    toggleMarkerTextVisibilityByType,
    toggleShipMarkerStyle,
    // ID管理方法
    isMarkerIdUnique,
    generateUniqueMarkerId,
    // 图层方法
    getAllLayers,
    getCustomLayers,
    // 聚合方法
    enableClustering,
    disableClustering,
    toggleClustering,
    refreshClusterLayer,
    setClusterDistanceForType,
    getClusterInfoForType,
    // 动画飞行到指定位置
    flyTo,
    zoomIn,
    zoomOut,
    getMapBounds,

    // 轨迹
    trackFeatureList,
    setSpeedValue,
    getActiveAnimations,
    // 轨迹生成方法
    generateTrackRoute,
    startTrackRouteAnimation,
    clearTrackRoutes,
    showTrackRoute,
    getTrackVisibility, // 获取轨迹可见状态
    toggleTrackRoute, // 切换轨迹显示状态
    removeTrackRoute,
    stopTrackAnimationById, // 停止轨迹动画
    pauseTrackAnimationById, // 暂停轨迹动画
    resumeTrackAnimationById, // 恢复轨迹动画
    pauseTrackAnimation, // 暂停所有轨迹动画
    resumeTrackAnimation, // 恢复所有轨迹动画
    // 通用方法
    destroy,
    trackDestroy,
    destroyClustering,
  };
}
