import { ref, computed } from 'vue';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import WebGLPoints from 'ol/layer/WebGLPoints';

const DEFAULT_STYLE = {
  'circle-radius': 8,
  'circle-fill-color': '#33AAFF',
  'circle-stroke-color': '#ffffff',
  'circle-stroke-width': 2,
  'circle-opacity': 0.9
};

/**
 * 基于 WebGLPoints 的地图点位管理 Hook（支持多图层）
 * 适用于大量点位的渲染，性能优于普通 Vector 图层
 *
 * 注意：移除图层或销毁前必须调用 destroy()，否则 WebGL 上下文无法释放
 *
 * @param {import('ol/Map').default} map - OpenLayers 地图实例
 * @param {Object} [options] - 可选配置
 * @param {Object} [options.defaultStyle] - 默认 WebGL 样式（circle / icon / shape）
 * @param {number} [options.zIndex] - 默认图层 zIndex
 * @param {string} [options.defaultLayerKey] - 默认图层标识（单图层用法时的 key）
 * @returns {Object} 点位管理方法与状态
 */
export function useWebGLPoints(map, options = {}) {
  const {
    defaultStyle = { ...DEFAULT_STYLE },
    zIndex: defaultZIndex = 100,
    defaultLayerKey = 'default'
  } = options;

  /** @type {import('vue').Ref<Record<string, { source: import('ol/source/Vector').default, layer: import('ol/layer/WebGLPoints').default, pointsMap: Map<string, import('ol/Feature').default> }>>} */
  const layers = ref({});

  /** 当前默认操作的目标图层 key（initLayer / 无 layerKey 的 addPoint 等） */
  const currentDefaultKey = ref(defaultLayerKey);

  /** 兼容单图层：当前默认图层的 source，便于旧用法 pointsSource.value */
  const pointsSource = computed(() => {
    const layerInfo = layers.value[currentDefaultKey.value];
    return layerInfo ? layerInfo.source : null;
  });

  /** 兼容单图层：当前默认图层的 layer */
  const pointsLayer = computed(() => {
    const layerInfo = layers.value[currentDefaultKey.value];
    return layerInfo ? layerInfo.layer : null;
  });

  /** 兼容单图层：当前默认图层的 pointsMap */
  const pointsMap = computed(() => {
    const layerInfo = layers.value[currentDefaultKey.value];
    return layerInfo ? layerInfo.pointsMap : new Map();
  });

  /**
   * 解析 layerKey：未传则用默认 key
   * @param {String} [layerKey]
   * @returns {String}
   */
  const resolveLayerKey = (layerKey) => {
    return layerKey ?? currentDefaultKey.value;
  };

  /**
   * 获取图层信息，不存在则返回 undefined
   * @param {String} key
   */
  const getLayer = (key) => {
    return layers.value[key];
  };

  /**
   * 获取所有图层 key 列表
   * @returns {String[]}
   */
  const getLayerKeys = () => {
    return Object.keys(layers.value);
  };

  /**
   * 创建/注册一个 WebGLPoints 图层
   * @param {String} layerKey - 图层唯一标识，如 'risk-points'、'case-points'
   * @param {Object} [layerOptions] - 图层配置
   * @param {Object} [layerOptions.style] - WebGL 样式，符合 ol/style/webgl 的 WebGLStyle
   * @param {number} [layerOptions.zIndex] - 图层 zIndex
   * @param {String} [layerOptions.title] - 图层标题（存到 layer 的 properties，便于图例等）
   * @returns {boolean} 是否创建成功
   */
  const createLayer = (layerKey, layerOptions = {}) => {
    if (!map) {
      console.warn('[useWebGLPoints] 地图实例不存在');
      return false;
    }
    if (layers.value[layerKey]) {
      console.warn('[useWebGLPoints] 图层已存在:', layerKey);
      return false;
    }

    const { style = defaultStyle, zIndex = defaultZIndex, title = layerKey } = layerOptions;

    const source = new VectorSource();
    const layer = new WebGLPoints({
      source,
      style: { ...style },
      zIndex,
      className: `ol-layer-webgl-points-${layerKey}`,
      properties: { layerKey, title }
    });

    map.addLayer(layer);
    layers.value = {
      ...layers.value,
      [layerKey]: {
        source,
        layer,
        pointsMap: new Map()
      }
    };
    return true;
  };

  /**
   * 初始化 WebGLPoints 图层（单图层用法，创建默认 key 的图层）
   * @param {Object} [style] - 覆盖默认样式，符合 ol/style/webgl 的 WebGLStyle
   * @param {String} [layerKey] - 指定图层 key，不传则用 defaultLayerKey
   * @returns {boolean} 是否初始化成功
   */
  const initLayer = (style, layerKey) => {
    const key = layerKey ?? currentDefaultKey.value;
    const ok = createLayer(key, { style });
    if (ok) currentDefaultKey.value = key;
    return ok;
  };

  /**
   * 添加单个点位
   * @param {String | [number, number]} layerKeyOrCoordinates - 图层 key，或直接传 [经度, 纬度]（使用默认图层）
   * @param {[number, number] | Object} coordinatesOrData - [经度, 纬度] 或 附加属性 data
   * @param {Object} [data] - 附加到 feature 上的属性
   * @param {String} [id] - 点位 id，不传则自动生成
   * @returns {String|null} 点位 id，失败返回 null
   */
  const addPoint = (layerKeyOrCoordinates, coordinatesOrData = {}, data = {}, id) => {
    let layerKey;
    let coordinates;
    let pointData;
    let pointId;

    if (Array.isArray(layerKeyOrCoordinates)) {
      layerKey = currentDefaultKey.value;
      coordinates = layerKeyOrCoordinates;
      pointData =
        coordinatesOrData &&
        typeof coordinatesOrData === 'object' &&
        !Array.isArray(coordinatesOrData)
          ? coordinatesOrData
          : {};
      pointId = data?.id ?? (typeof data === 'string' ? data : undefined);
    } else {
      layerKey = layerKeyOrCoordinates;
      coordinates = coordinatesOrData;
      pointData = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
      pointId = id;
    }

    const info = getLayer(resolveLayerKey(layerKey));
    if (!info) {
      console.warn('[useWebGLPoints] 图层不存在，请先 createLayer 或 initLayer:', layerKey);
      return null;
    }

    const [lng, lat] = coordinates;
    if (lng == null || lat == null || Number.isNaN(lng) || Number.isNaN(lat)) {
      console.warn('[useWebGLPoints] 无效坐标:', coordinates);
      return null;
    }

    const finalId =
      pointId ?? `webgl-point-${layerKey}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const geometry = new Point(fromLonLat([lng, lat]));
    const feature = new Feature({
      geometry,
      id: finalId,
      ...pointData
    });
    feature.setId(finalId);
    info.source.addFeature(feature);
    info.pointsMap.set(finalId, feature);
    return finalId;
  };

  /**
   * 批量添加点位
   * @param {String | Array} layerKeyOrPoints - 图层 key，或直接传点位数组（使用默认图层）
   * @param {Array<[number, number] | { coordinates: [number, number], data?: Object, id?: string }>} [points] - 坐标数组或 { coordinates, data?, id? } 数组
   * @returns {String[]} 成功添加的点位 id 列表
   */
  const addPoints = (layerKeyOrPoints, points) => {
    let layerKey;
    let list;
    if (Array.isArray(layerKeyOrPoints)) {
      layerKey = currentDefaultKey.value;
      list = layerKeyOrPoints;
    } else {
      layerKey = resolveLayerKey(layerKeyOrPoints);
      list = points ?? [];
    }

    const info = getLayer(layerKey);
    if (!info || !Array.isArray(list) || list.length === 0) {
      return [];
    }

    const ids = [];
    const features = [];
    for (const item of list) {
      const coords = Array.isArray(item) ? item : item?.coordinates;
      const data = Array.isArray(item) ? {} : (item?.data ?? {});
      const id = Array.isArray(item) ? undefined : item?.id;
      if (!coords || coords.length < 2) continue;
      const [lng, lat] = coords;
      if (lng == null || lat == null || Number.isNaN(lng) || Number.isNaN(lat)) continue;

      const pointId =
        id ?? `webgl-point-${layerKey}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const geometry = new Point(fromLonLat([lng, lat]));
      const feature = new Feature({
        geometry,
        id: pointId,
        ...data
      });
      feature.setId(pointId);
      features.push(feature);
      ids.push(pointId);
    }
    info.source.addFeatures(features);
    features.forEach((f) => info.pointsMap.set(f.getId(), f));
    return ids;
  };

  /**
   * 按 id 移除点位
   * @param {String} [layerKey] - 图层 key，不传则从默认图层删
   * @param {String} id - 点位 id
   * @returns {boolean} 是否移除成功
   */
  const removePoint = (layerKey, id) => {
    let key;
    let pointId;
    if (typeof layerKey === 'string' && typeof id === 'string') {
      key = layerKey;
      pointId = id;
    } else {
      key = currentDefaultKey.value;
      pointId = layerKey;
    }
    const info = getLayer(resolveLayerKey(key));
    if (!info) return false;
    const feature = info.pointsMap.get(pointId);
    if (!feature) return false;
    info.source.removeFeature(feature);
    info.pointsMap.delete(pointId);
    return true;
  };

  /**
   * 清空指定图层或默认图层的所有点位
   * @param {String} [layerKey] - 图层 key，不传则清空默认图层
   */
  const clearPoints = (layerKey) => {
    const key = resolveLayerKey(layerKey);
    const info = getLayer(key);
    if (info) {
      info.source.clear();
      info.pointsMap.clear();
    }
  };

  /**
   * 设置图层可见性
   * @param {String | boolean} layerKeyOrVisible - 图层 key，或直接传 boolean（控制默认图层）
   * @param {boolean} [visible] - 是否可见
   */
  const setVisible = (layerKeyOrVisible, visible) => {
    if (typeof layerKeyOrVisible === 'boolean') {
      const layer = pointsLayer.value;
      if (layer) layer.setVisible(layerKeyOrVisible);
      return;
    }
    const info = getLayer(resolveLayerKey(layerKeyOrVisible));
    if (info) info.layer.setVisible(visible !== false);
  };

  /**
   * 更新某图层的样式变量（用于动态样式）
   * @param {String} [layerKey] - 图层 key，不传则更新默认图层
   * @param {Object<string, number>} variables - 变量名 -> 数值
   */
  const updateStyleVariables = (layerKey, variables) => {
    let key;
    let vars;
    if (typeof layerKey === 'object' && layerKey !== null && variables === undefined) {
      key = currentDefaultKey.value;
      vars = layerKey;
    } else {
      key = resolveLayerKey(layerKey);
      vars = variables;
    }
    const info = getLayer(key);
    if (info?.layer && typeof info.layer.updateStyleVariables === 'function') {
      info.layer.updateStyleVariables(vars);
    }
  };

  /**
   * 获取指定图层或默认图层的点位数量
   * @param {String} [layerKey]
   * @returns {number}
   */
  const getPointsCount = (layerKey) => {
    const info = getLayer(resolveLayerKey(layerKey));
    return info ? info.source.getFeatures().length : 0;
  };

  /**
   * 根据 id 获取 feature（先查默认图层，再查其它图层）
   * @param {String} id - 点位 id
   * @param {String} [layerKey] - 指定图层 key，不传则遍历所有图层查找
   * @returns {import('ol/Feature').default<import('ol/geom/Point').default>|undefined}
   */
  const getPointFeature = (id, layerKey) => {
    if (layerKey) {
      const info = getLayer(layerKey);
      return info?.pointsMap.get(id);
    }
    for (const info of Object.values(layers.value)) {
      const f = info.pointsMap.get(id);
      if (f) return f;
    }
    return undefined;
  };

  /**
   * 移除并销毁指定图层
   * @param {String} layerKey
   */
  const removeLayer = (layerKey) => {
    const key = resolveLayerKey(layerKey);
    const info = layers.value[key];
    if (!info || !map) return;
    map.removeLayer(info.layer);
    if (typeof info.layer.dispose === 'function') {
      info.layer.dispose();
    }
    const next = { ...layers.value };
    delete next[key];
    layers.value = next;
    if (currentDefaultKey.value === key) {
      const keys = Object.keys(next);
      currentDefaultKey.value = keys.length ? keys[0] : defaultLayerKey;
    }
  };

  /**
   * 设置当前默认操作的图层 key（影响无 layerKey 的 addPoint/addPoints/clearPoints 等）
   * @param {String} key
   */
  const setDefaultLayer = (key) => {
    if (layers.value[key]) currentDefaultKey.value = key;
  };

  /**
   * 销毁所有图层并释放 WebGL 资源（从地图移除前必须调用）
   */
  const destroy = () => {
    if (!map) return;
    getLayerKeys().forEach((key) => removeLayer(key));
    currentDefaultKey.value = defaultLayerKey;
  };

  return {
    layers,
    pointsSource,
    pointsLayer,
    pointsMap,
    getLayer,
    getLayerKeys,
    createLayer,
    initLayer,
    addPoint,
    addPoints,
    removePoint,
    clearPoints,
    setVisible,
    updateStyleVariables,
    getPointsCount,
    getPointFeature,
    removeLayer,
    setDefaultLayer,
    destroy
  };
}

// // 创建多个图层
// createLayer('risk-points', {
//   style: { 'circle-radius': 10, 'circle-fill-color': '#ff4444' },
//   zIndex: 110,
//   title: '风险点'
// });
// createLayer('case-points', {
//   style: { 'circle-radius': 8, 'circle-fill-color': '#33AAFF' },
//   zIndex: 105,
//   title: '案件点'
// });
// // 往不同图层加数据
// addPoints('risk-points', [[120.1, 30.2], [120.2, 30.3]]);
// addPoints('case-points', [[120.3, 30.4]]);
// // 图层控制：显隐
// setVisible('risk-points', false);  // 隐藏风险点
// setVisible('case-points', true);
// // 查图层列表与数量
// getLayerKeys();                    // ['risk-points', 'case-points']
// getPointsCount('risk-points');     // 2
// getPointsCount('case-points');     // 1
// // 清空 / 移除某一图层
// clearPoints('risk-points');
// removeLayer('case-points');        // 移除并 dispose
// // 切换默认操作图层（影响不传 layerKey 的 addPoint/addPoints/clearPoints）
// setDefaultLayer('risk-points');
// // 销毁所有图层（必须调用）
// destroy();
