import { reactive, ref } from 'vue';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Circle, Fill, Icon, Style, Text } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';

/**
 * 地图标记聚合管理Hook
 * @param {object} map - OpenLayers地图实例
 * @returns {object} 聚合管理方法和状态
 */
export function useMapClustering(map) {
  // 聚合相关状态
  const clusterLayers = ref({});
  const clusterSources = ref({});
  const clusterEnabled = ref(false);
  const clusterDistance = ref(40); // 聚合距离（像素）
  const clusterMinDistance = ref(20); // 最小聚合距离

  // 聚合配置
  const clusterConfig = reactive({
    // 聚合样式配置
    clusterStyle: {
      radius: 20,
      fill: '#1890ff',
      stroke: '#ffffff',
      strokeWidth: 2,
      textColor: '#ffffff',
      textSize: 14,
      textWeight: 'bold'
    },
    // 单个标记样式配置
    markerStyle: {
      radius: 8,
      fill: '#ffffff',
      stroke: '#ffffff',
      strokeWidth: 2
    },
    // 聚合距离配置
    distance: 40,
    minDistance: 20
  });

  // LRU 缓存（避免频繁 new Style，且限制内存增长）
  const createLRU = (maxSize) => {
    const map = new Map();
    return {
      get(key) {
        if (!map.has(key)) return undefined;
        const val = map.get(key);
        // 刷新为最近使用
        map.delete(key);
        map.set(key, val);
        return val;
      },
      set(key, val) {
        if (map.has(key)) map.delete(key);
        map.set(key, val);
        if (map.size > maxSize) {
          const oldestKey = map.keys().next().value;
          map.delete(oldestKey);
        }
      },
      clear() {
        map.clear();
      },
      size() {
        return map.size;
      },
    };
  };

  // 聚合样式缓存（避免频繁 new Style 导致缩放卡顿）
  // - 聚合圈：按 size 缓存（size 种类有限，给个小上限即可）
  // - 单点：按 styleKey 缓存（来自 markerData.style）
  const clusterStyleCache = createLRU(256); // key: size -> Style | Style[]
  const singleStyleCache = createLRU(5000); // key: string -> Style

  const getSingleStyleKey = (markerData) => {
    try {
      return JSON.stringify(markerData?.style || {});
    } catch (e) {
      return String(markerData?.id || Math.random());
    }
  };

  /**
   * 创建聚合样式
   * @param {Feature} feature - 要素
   * @param {number} resolution - 分辨率
   * @returns {Style} 样式对象
   */
  const createClusterStyle = (feature, resolution) => {
    const features = feature.get('features');
    const size = features ? features.length : 1;

    if (size === 1) {
      // 单个标记样式
      const markerData = features[0].getProperties();
      const key = getSingleStyleKey(markerData);
      const cached = singleStyleCache.get(key);
      if (cached) return cached;
      const style = createSingleMarkerStyle(markerData);
      singleStyleCache.set(key, style);
      return style;
    } else {
      // 聚合样式
      const cached = clusterStyleCache.get(size);
      if (cached) return cached;
      const style = createClusterMarkerStyle(size);
      clusterStyleCache.set(size, style);
      return style;
    }
  };

  /**
   * 创建单个标记样式
   * @param {object} markerData - 标记数据
   * @returns {Style} 样式对象
   */
  const createSingleMarkerStyle = (markerData) => {
    const { icon, color, radius } = markerData.style || {};

    if (icon) {
      return new Style({
        image: new Icon({
          src: icon.src,
          size: icon.size || [32, 32],
          anchor: icon.anchor || [0.5, 1],
          scale: icon.scale || 1
        })
      });
    } else {
      return new Style({
        image: new Circle({
          radius: radius || clusterConfig.markerStyle.radius,
          fill: new Fill({
            color: color || clusterConfig.markerStyle.fill
          })
          // stroke: new Stroke({
          //     color: clusterConfig.markerStyle.stroke,
          //     width: clusterConfig.markerStyle.strokeWidth
          // })
        })
      });
    }
  };

  /**
   * 创建聚合标记样式
   * @param {number} size - 聚合数量
   * @returns {Style} 样式对象
   */
  const createClusterMarkerStyle = (size) => {
    // 注意：自定义 renderer + 渐变在大量缩放/交互时非常吃 CPU
    // 这里改为 Circle 样式 + 文本，并通过上层 clusterStyleCache 复用
    const radius = Math.max(15, Math.min(30, 15 + size));
    const [startColor] = getClusterColor(size);

    const circleStyle = new Style({
      image: new Circle({
        radius,
        fill: new Fill({ color: startColor }),
      }),
      zIndex: 0,
    });

    const textStyle = new Style({
      text: new Text({
        text: size.toString(),
        font: `${clusterConfig.clusterStyle.textSize}px ${clusterConfig.clusterStyle.textWeight}`,
        fill: new Fill({ color: clusterConfig.clusterStyle.textColor }),
      }),
      zIndex: 1,
    });

    return [circleStyle, textStyle];
  };

  /**
   * 根据聚合数量获取颜色
   * @param {number} size - 聚合数量
   * @returns {string} 颜色值
   */
  const getClusterColor = (size) => {
    // 所有区间统一返回 [起色, 终色] 以用于径向渐变
    if (size <= 5) return ['rgba(82, 196, 26, 1)', 'rgba(82, 196, 26, 0.3)']; // 绿色渐变
    if (size <= 10) return ['rgba(250, 173, 20, 1)', 'rgba(250, 173, 20, 0.3)']; // 黄色渐变
    if (size <= 20) return ['rgba(250, 140, 22, 1)', 'rgba(250, 140, 22, 0.3)']; // 橙色渐变
    return ['rgba(245, 34, 45, 1)', 'rgba(245, 34, 45, 0.3)']; // 红色渐变
  };

  /**
   * 创建聚合图层
   * @param {string} type - 图层类型
   * @param {Array} markers - 标记点数组
   * @param {object} options - 选项
   * @returns {VectorLayer} 聚合图层
   */
  const createClusterLayer = (type, markers = [], options = {}) => {
    if (!map) {
      console.warn('地图实例未初始化');
      return null;
    }

    // 创建原始标记点源
    const source = new VectorSource({
      features: markers.map((marker) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat(marker.coordinates)),
          ...marker.data
        });
        feature.setStyle(createSingleMarkerStyle(marker.data));
        return feature;
      })
    });

    // 创建聚合源
    const clusterSource = new Cluster({
      source: source,
      distance: options.distance || clusterConfig.distance, // 聚合距离
      minDistance: options.minDistance || clusterConfig.minDistance // 最小聚合距离
    });

    // 创建聚合图层
    const clusterLayer = new VectorLayer({
      source: clusterSource,
      style: createClusterStyle,
      title: `${type}_cluster`,
      zIndex: 101,
      // 性能：聚合层使用 image 渲染，并且交互过程中不强制每帧重绘
      renderMode: 'image',
      updateWhileAnimating: false,
      updateWhileInteracting: false
    });

    // 保存引用
    clusterLayers.value[type] = clusterLayer;
    clusterSources.value[type] = clusterSource;

    // 添加到地图
    map.addLayer(clusterLayer);

    return clusterLayer;
  };

  /**
   * 更新聚合图层
   * @param {string} type - 图层类型
   * @param {Array} markers - 新的标记点数组
   */
  const updateClusterLayer = (type, markers) => {
    if (!clusterSources.value[type]) {
      console.warn(`聚合图层 ${type} 不存在`);
      return;
    }

    // 清除现有要素
    clusterSources.value[type].getSource().clear();

    // 添加新要素
    const features = markers.map((marker) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(marker.coordinates)),
        ...marker.data
      });
      feature.setStyle(createSingleMarkerStyle(marker.data));
      return feature;
    });

    clusterSources.value[type].getSource().addFeatures(features);
  };

  /**
   * 启用/禁用聚合
   * @param {string} type - 图层类型
   * @param {boolean} enabled - 是否启用
   */
  const toggleCluster = (type, enabled) => {
    if (!clusterLayers.value[type]) {
      console.warn(`聚合图层 ${type} 不存在`);
      return;
    }

    clusterLayers.value[type].setVisible(enabled);
  };

  /**
   * 设置聚合距离
   * @param {string} type - 图层类型
   * @param {number} distance - 聚合距离
   */
  const setClusterDistance = (type, distance) => {
    if (!clusterSources.value[type]) {
      console.warn(`聚合图层 ${type} 不存在`);
      return;
    }

    clusterSources.value[type].setDistance(distance);
    clusterConfig.distance = distance;
  };

  /**
   * 获取聚合信息
   * @param {string} type - 图层类型
   * @returns {object} 聚合信息
   */
  const getClusterInfo = (type) => {
    if (!clusterSources.value[type]) {
      return { totalFeatures: 0, clusters: 0 };
    }

    const source = clusterSources.value[type];
    const features = source.getFeatures();
    const clusters = features.filter((f) => f.get('features') && f.get('features').length > 1);

    return {
      totalFeatures: source.getSource().getFeatures().length,
      clusters: clusters.length,
      clusterFeatures: clusters.length
    };
  };

  /**
   * 清除聚合图层
   * @param {string} type - 图层类型
   */
  const clearClusterLayer = (type) => {
    if (clusterLayers.value[type]) {
      map.removeLayer(clusterLayers.value[type]);
      delete clusterLayers.value[type];
      delete clusterSources.value[type];
    }
  };

  /**
   * 清除所有聚合图层
   */
  const clearAllClusterLayers = () => {
    Object.keys(clusterLayers.value).forEach((type) => {
      clearClusterLayer(type);
    });
  };

  /**
   * 销毁聚合管理器
   */
  const destroy = () => {
    clearAllClusterLayers();
    clusterLayers.value = {};
    clusterSources.value = {};
  };

  return {
    // 状态
    clusterLayers,
    clusterSources,
    clusterEnabled,
    clusterConfig,

    // 方法
    createClusterLayer,
    updateClusterLayer,
    toggleCluster,
    setClusterDistance,
    getClusterInfo,
    clearClusterLayer,
    clearAllClusterLayers,
    destroy
  };
}
