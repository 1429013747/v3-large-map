import { computed, reactive, ref } from 'vue';
import VectorSource from 'ol/source/Vector';
import Heatmap from 'ol/layer/Heatmap';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';

/**
 * 多热力图 Hook（OpenLayers）
 * 依赖：传入现有的 map 实例（来自 useMap.getMap() 或 MapViewer 暴露的 map）
 *
 * 基本约定：
 * - 数据输入格式：[{ lon: number, lat: number, weight?: number }, ...]
 * - 或 GeoJSON FeatureCollection（Point）
 * - 支持多个热力图层同时管理
 */
export function useMapHeatmap(mapInstance) {
  const mapRef = ref(mapInstance || null);
  // 存储多个热力图层
  const heatmapLayers = reactive(new Map());

  const isReady = computed(() => !!mapRef.value);
  const layerCount = computed(() => heatmapLayers.size);

  /**
   * 创建新的热力图层
   * @param {string} type 图层类型
   * @param {object} options 图层配置
   * @returns {object} 图层对象
   */
  const createLayer = (type, options = {}) => {
    if (!mapRef.value) {
      console.warn('地图实例不存在，无法创建热力图层');
      return null;
    }

    if (heatmapLayers.has(type)) {
      console.warn(`热力图层 ${type} 已存在`);
      return heatmapLayers.get(type);
    }

    const {
      title = `热力图-${type}`,
      visible = false,
      zIndex = 1000,
      blur = 15,
      radius = 8,
      gradient = undefined,
      data = []
    } = options;

    const source = new VectorSource();
    const heatmapLayer = new Heatmap({
      source,
      visible,
      blur,
      radius,
      gradient
    });

    heatmapLayer.set('title', title);
    heatmapLayer.set('type', type);
    heatmapLayer.setZIndex(zIndex);

    mapRef.value.addLayer(heatmapLayer);

    const layerInfo = {
      type,
      title,
      layer: heatmapLayer,
      source,
      visible,
      blur,
      radius,
      gradient,
      zIndex,
      createdAt: new Date()
    };

    heatmapLayers.set(type, layerInfo);

    setLayerData(type, data);
    return layerInfo;
  };

  /**
   * 删除指定热力图层
   * @param {string} type 图层类型
   */
  const removeLayer = (type) => {
    if (!mapRef.value || !heatmapLayers.has(type)) return;

    const layerInfo = heatmapLayers.get(type);
    mapRef.value.removeLayer(layerInfo.layer);
    heatmapLayers.delete(type);
  };

  /**
   * 删除所有热力图层
   */
  const removeAllLayers = () => {
    if (!mapRef.value) return;

    heatmapLayers.forEach((layerInfo) => {
      mapRef.value.removeLayer(layerInfo.layer);
    });
    heatmapLayers.clear();
  };
  /**
   * 设置指定图层显示/隐藏
   * @param {string} type 图层类型
   * @param {boolean} visible 是否显示
   */
  const setLayerVisible = (type, visible) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) {
      console.warn(`热力图图层 ${type} 不存在`);
      return;
    }
    // 检查地图实例是否存在
    if (!mapRef.value) {
      console.warn('地图实例不存在，无法设置热力图可见性');
      return;
    }
    // 检查地图的渲染器是否准备好（通过检查地图容器的 canvas）
    try {
      const mapElement = mapRef.value.getTargetElement();
      if (!mapElement) {
        console.warn('地图容器元素不存在');
        return;
      }
      
      // 使用 try-catch 捕获可能的渲染错误
      layerInfo.layer.setVisible(visible);
      layerInfo.visible = visible;
    } catch (error) {
      console.error(`设置热力图 ${type} 可见性时出错:`, error);
      // 即使出错也更新状态，避免状态不一致
      layerInfo.visible = visible;
    }
  };

  /**
   * 切换指定图层显示状态
   * @param {string} type 图层类型
   */
  const toggleLayerVisible = (type) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) return;
    setLayerVisible(type, !layerInfo.visible);
  };

  /**
   * 设置指定图层范围半径
   * @param {string} type 图层类型
   * @param {number} radius
   */
  const setLayerRadius = (type, radius) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) return;
    layerInfo.layer.setRadius(radius);
    layerInfo.radius = radius;
  };

  /**
   * 设置指定图层范围模糊程度
   * @param {string} type 图层类型
   * @param {number} blur
   */
  const setLayerBlur = (type, blur) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) return;
    layerInfo.layer.setBlur(blur);
    layerInfo.blur = blur;
  };

  /**
   * 设置指定图层范围径向渐变
   * @param {string} type 图层类型
   * @param {Array} gradient 颜色数组
   */
  const setLayerGradient = (type, gradient) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) return;
    layerInfo.layer.setGradient(gradient);
    layerInfo.gradient = gradient;
  };

  /**
   * 清除指定图层数据
   * @param {string} type 图层类型
   */
  const clearLayer = (type) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) return;
    layerInfo.source.clear();
  };

  /**
   * 清除所有图层数据
   */
  const clearAllLayers = () => {
    heatmapLayers.forEach((layerInfo) => {
      layerInfo.source.clear();
    });
  };

  /**
   * 设置指定图层数据（数组点集）
   * @param {string} type 图层类型
   * @param {Array<{lon:number, lat:number, weight?:number}>} points
   */
  const setLayerData = (type, points = []) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) return;

    const features = points.map((p) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([p.lon, p.lat])),
        weight: typeof p.weight === 'number' ? p.weight : 1
      });
      return feature;
    });
    layerInfo.source.addFeatures(features);
  };

  /**
   * 设置指定图层 GeoJSON 数据（Point FeatureCollection）
   * @param {string} type 图层类型
   * @param {object} geojson FeatureCollection
   * @param {object} options { dataProjection?: string, featureProjection?: string, weightAttr?: string }
   */
  const setLayerGeoJSON = (type, geojson, options = {}) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo || !geojson) return;

    const {
      dataProjection = 'EPSG:4326',
      featureProjection = 'EPSG:3857',
      weightAttr = 'weight'
    } = options;

    const format = new GeoJSON();
    const features = format.readFeatures(geojson, {
      dataProjection,
      featureProjection
    });

    // 归一化权重字段为 weight
    features.forEach((f) => {
      if (weightAttr !== 'weight') {
        const w = f.get(weightAttr);
        if (typeof w === 'number') f.set('weight', w);
      }
      if (typeof f.get('weight') !== 'number') f.set('weight', 1);
    });

    layerInfo.source.addFeatures(features);
  };

  /**
   * 设置指定图层层级
   * @param {string} type 图层类型
   * @param {number} zIndex
   */
  const setLayerZIndex = (type, zIndex) => {
    const layerInfo = heatmapLayers.get(type);
    if (!layerInfo) return;
    layerInfo.layer.setZIndex(zIndex);
    layerInfo.zIndex = zIndex;
  };

  /**
   * 获取所有图层信息
   * @returns {Array} 图层信息数组
   */
  const getAllLayers = () => {
    return Array.from(heatmapLayers.values());
  };

  /**
   * 获取指定图层信息
   * @param {string} type 图层类型
   * @returns {object | null} 图层信息
   */
  const getLayer = (type) => {
    return heatmapLayers.get(type) || null;
  };

  /**
   * 检查图层是否存在
   * @param {string} type 图层类型
   * @returns {boolean}
   */
  const hasLayer = (type) => {
    return heatmapLayers.has(type);
  };

  /**
   * 替换地图实例（例如地图重建时）
   */
  const setMap = (map) => {
    if (mapRef.value === map) return;

    // 移除旧地图上的所有图层
    if (mapRef.value) {
      heatmapLayers.forEach((layerInfo) => {
        mapRef.value.removeLayer(layerInfo.layer);
      });
    }

    mapRef.value = map;

    // 重新挂载所有图层到新地图
    if (mapRef.value) {
      heatmapLayers.forEach((layerInfo) => {
        mapRef.value.addLayer(layerInfo.layer);
      });
    }
  };

  /**
   * 销毁所有热力图层
   */
  const destroy = () => {
    removeAllLayers();
    mapRef.value = null;
  };

  return {
    // 状态
    isReady,
    layerCount,
    heatmapLayers,

    // 图层管理
    createLayer,
    removeLayer,
    removeAllLayers,
    getAllLayers,
    getLayer,
    hasLayer,

    // 生命周期/挂载
    destroy,
    setMap,

    // 数据操作
    setLayerData,
    setLayerGeoJSON,
    clearLayer,
    clearAllLayers,

    // 外观控制
    setLayerVisible,
    toggleLayerVisible,
    setLayerRadius,
    setLayerBlur,
    setLayerGradient,
    setLayerZIndex
  };
}
