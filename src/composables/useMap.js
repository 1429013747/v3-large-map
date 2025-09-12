import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
import { defaults as defaultControls } from "ol/control";
import { Attribution } from "ol/control";

/**
 * 地图 Hook
 * @param {Object} options 地图配置选项
 * @param {Array} options.center 地图中心点坐标 [经度, 纬度]
 * @param {Number} options.zoom 缩放级别
 * @param {Object} options.callbacks 回调函数
 */
export function useMap(options = {}) {
    const {
        center = [120.1551, 30.2741],
        zoom = 10,
        callbacks = {}
    } = options;

    // 响应式数据
    const map = ref(null);
    const mapContainer = ref(null);
    const isMapReady = ref(false);
    const currentLayer = ref("天地图");
    const clickedCoordinate = ref(null);
    const mapCenter = ref(center);
    const mapZoom = ref(zoom);
    const apiKey = ref("0a48cde9eb28189acac8149c3f047266");

    // 更新中心坐标
    const updateCenter = (newCenter) => {
        mapCenter.value = newCenter;
        console.log("中心坐标已更新:", newCenter);
    };


    // 图层配置 - 支持多图层叠加
    const layerConfigs = {
        CartoDB: {
            source: new XYZ({
                url: "https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                crossOrigin: "anonymous"
            }),
            title: "CartoDB",
            visible: false,
            opacity: 1.0,
            zIndex: 0,
            type: "base" // 基础图层
        },
        高德地图: {
            source: new XYZ({
                url: "https://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
                crossOrigin: "anonymous"
            }),
            title: "高德地图",
            visible: false,
            opacity: 1.0,
            zIndex: 0,
            type: "base" // 基础图层
        },
        天地图: {
            source: new XYZ({
                url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${apiKey.value}`,
                crossOrigin: "anonymous"
            }),
            title: "天地图",
            visible: false,
            opacity: 1.0,
            zIndex: 0,
            type: "base" // 基础图层
        },
        天地图卫星: {
            source: new XYZ({
                url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${apiKey.value}`,
                crossOrigin: "anonymous"
            }),
            title: "天地图卫星",
            visible: true,
            opacity: 1.0,
            zIndex: 0,
            type: "base" // 基础图层
        },
        高德卫星: {
            source: new XYZ({
                url: "https://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
                crossOrigin: "anonymous"
            }),
            title: "高德卫星",
            visible: false,
            opacity: 1.0,
            zIndex: 0,
            type: "base" // 基础图层
        },
        Google卫星: {
            source: new XYZ({
                url: "https://mt{0-3}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                crossOrigin: "anonymous"
            }),
            title: "Google卫星",
            visible: false,
            opacity: 1.0,
            zIndex: 0,
            type: "base" // 基础图层
        },
        本地备用: {
            source: new XYZ({
                url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                crossOrigin: "anonymous",
                subdomains: ['a', 'b', 'c']
            }),
            title: "本地备用",
            visible: false,
            opacity: 1.0,
            zIndex: 0,
            type: "base" // 基础图层
        }
    };

    // 图层状态管理
    const layerStates = ref({});
    const activeLayers = ref([]); // 当前激活的图层列表

    // 创建地图图层
    const createLayers = () => {
        const layers = [];
        Object.values(layerConfigs).forEach((config, index) => {
            const layer = new TileLayer({
                source: config.source,
                title: config.title,
                visible: config.visible,
                opacity: config.opacity,
                zIndex: config.zIndex || index
            });

            // 添加错误处理
            layer.getSource().on('tileloaderror', (event) => {
                console.warn(`图层 ${config.title} 瓦片加载失败:`, event);
                // 如果当前图层加载失败，尝试切换到备用图层
                if (config.visible && activeLayers.value.includes(config.title)) {
                    switchToFallbackLayer();
                }
            });

            // 初始化图层状态
            layerStates.value[config.title] = {
                visible: config.visible,
                opacity: config.opacity,
                zIndex: config.zIndex || index
            };

            // 如果图层可见，添加到激活列表
            if (config.visible) {
                if (!activeLayers.value.includes(config.title)) {
                    activeLayers.value.push(config.title);
                }
            }

            layers.push(layer);
        });
        return layers;
    };

    // 切换到备用图层
    const switchToFallbackLayer = () => {
        const fallbackLayers = ['CartoDB', 'Stamen', '高德地图', '天地图', '本地备用'];
        for (const layerName of fallbackLayers) {
            if (layerConfigs[layerName]) {
                console.log(`切换到备用图层: ${layerName}`);
                switchLayer(layerName);
                break;
            }
        }
    };

    // 创建地图控件
    const createControls = () => {
        return defaultControls({
            attribution: false,
            zoom: false,  // 禁用缩放控件
            rotate: false
        }).extend([
            // 比例尺
            // new ScaleLine({
            //     units: "metric",
            //     bar: true,
            //     steps: 4,
            //     text: true,
            //     minWidth: 140
            // }),
            new Attribution({
                collapsible: false
            })
        ]);
    };

    // 初始化地图
    const initMap = (container) => {
        if (!container) {
            console.error("地图容器未找到");
            return;
        }

        try {
            // 确保使用最新的中心坐标
            const currentCenter = mapCenter.value || center;
            console.log("地图初始化 - 使用中心坐标:", currentCenter);

            // 创建地图视图
            const view = new View({
                center: fromLonLat(currentCenter),
                zoom: mapZoom.value,
                projection: "EPSG:3857"
            });

            // 创建图层
            const layers = createLayers();

            // 创建控件
            const controls = createControls();

            // 创建地图实例
            map.value = new Map({
                target: container,
                layers: layers,
                view: view,
                controls: controls
            });
            mapContainer.value = container;
            // 绑定事件
            bindMapEvents();

            isMapReady.value = true;
            console.log("地图初始化完成");

            // 触发回调
            if (callbacks.onMapReady) {
                callbacks.onMapReady(map.value);
            }
        } catch (error) {
            console.error("地图初始化失败:", error);
            if (callbacks.onMapError) {
                callbacks.onMapError(error);
            }
        }
    };

    // 绑定地图事件
    const bindMapEvents = () => {
        if (!map.value) return;

        // 地图点击事件
        map.value.on("click", (event) => {
            const coordinate = event.coordinate;
            // 将 Web Mercator 坐标转换为经纬度
            const lonLat = toLonLat(coordinate);
            clickedCoordinate.value = lonLat;

            if (callbacks.onMapClick) {
                callbacks.onMapClick({
                    coordinate: coordinate,
                    lonLat: lonLat,
                    pixel: event.pixel
                });
            }
        });

        // 地图移动事件
        map.value.on("moveend", () => {
            const scope = map.value.getView().calculateExtent(map.value.getSize()); // 获取地图范围
            const center = map.value.getView().getCenter(); // 获取地图中心
            const zoom = map.value.getView().getZoom(); // 获取地图缩放级别

            if (callbacks.onMapMove) {
                callbacks.onMapMove({
                    scope,
                    zoom,
                    center
                });
            }
        });

        // 地图加载完成事件
        map.value.on("loadend", () => {
            console.log("地图加载完成");
            if (callbacks.onMapLoadEnd) {
                callbacks.onMapLoadEnd();
            }
        });

        // 地图渲染完成事件
        map.value.on("rendercomplete", () => {
            console.log("地图渲染完成");
            if (callbacks.onMapRenderComplete) {
                callbacks.onMapRenderComplete();
            }
        });

        // 地图错误事件
        map.value.on("error", (error) => {
            console.error("地图错误:", error);
            if (callbacks.onMapError) {
                callbacks.onMapError(error);
            }
        });
    };


    // 切换图层 - 支持叠加模式
    const switchLayer = (layerName) => {
        if (!map.value) return;

        const layers = map.value.getLayers().getArray();
        const targetLayer = layers.find(layer => layer.get("title") === layerName);

        if (!targetLayer) {
            console.warn(`图层 ${layerName} 不存在`);
            return;
        }
        // 切换模式：隐藏所有其他图层，只显示当前图层
        layers.forEach((layer) => {
            const isTarget = layer.get("title") === layerName;
            const layerZIndex = layer.getZIndex();

            // 只处理基础图层（zIndex < 1000），不影响标记点等特殊图层
            if (layerZIndex < 1000) {
                layer.setVisible(isTarget);
                layer.setZIndex(isTarget ? 1 : -1);
            }
        });

        // 更新所有图层状态
        Object.keys(layerStates.value).forEach(key => {
            layerStates.value[key].visible = key === layerName;
        });

        // 更新激活图层列表
        activeLayers.value = [layerName];
        currentLayer.value = layerName;

        // 调试：检查标记点图层状态
        const markerLayers = layers.filter(layer => layer.getZIndex() >= 1000);
        console.log('标记点图层状态:', markerLayers.map(layer => ({
            title: layer.get('title') || '未命名',
            visible: layer.getVisible(),
            zIndex: layer.getZIndex()
        })));

        if (callbacks.onLayerChange) {
            callbacks.onLayerChange(layerName,);
        }
    };

    // 获取当前图层
    const getCurrentLayer = () => {
        if (!map.value) return null;
        const layers = map.value.getLayers().getArray();
        return layers.find((layer) => layer.getVisible());
    };

    // 图层管理功能
    const layerManager = {
        // 显示图层
        showLayer: (layerName) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            const targetLayer = layers.find(layer => layer.get("title") === layerName);
            if (targetLayer) {
                targetLayer.setVisible(true);
                layerStates.value[layerName].visible = true;
                if (!activeLayers.value.includes(layerName)) {
                    activeLayers.value.push(layerName);
                }
            }
        },

        // 隐藏图层
        hideLayer: (layerName) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            const targetLayer = layers.find(layer => layer.get("title") === layerName);
            if (targetLayer) {
                targetLayer.setVisible(false);
                layerStates.value[layerName].visible = false;
                const index = activeLayers.value.indexOf(layerName);
                if (index > -1) {
                    activeLayers.value.splice(index, 1);
                }
            }
        },

        // 设置图层透明度
        setLayerOpacity: (layerName, opacity) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            const targetLayer = layers.find(layer => layer.get("title") === layerName);
            if (targetLayer) {
                targetLayer.setOpacity(opacity);
                layerStates.value[layerName].opacity = opacity;
            }
        },

        // 设置图层层级
        setLayerZIndex: (layerName, zIndex) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            const targetLayer = layers.find(layer => layer.get("title") === layerName);
            if (targetLayer) {
                targetLayer.setZIndex(zIndex);
                layerStates.value[layerName].zIndex = zIndex;
            }
        },

        // 获取所有图层状态
        getAllLayerStates: () => {
            return layerStates.value;
        },

        // 获取激活的图层列表
        getActiveLayers: () => {
            return activeLayers.value;
        },

        // 重置所有图层（只显示一个基础图层）
        resetToSingleLayer: (layerName) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            layers.forEach((layer) => {
                const isTarget = layer.get("title") === layerName;
                const layerZIndex = layer.getZIndex();

                // 只处理基础图层（zIndex < 1000），不影响标记点等特殊图层
                if (layerZIndex < 1000) {
                    layer.setVisible(isTarget);
                    layerStates.value[layer.get("title")].visible = isTarget;
                }
            });
            activeLayers.value = [layerName];
            currentLayer.value = layerName;
        }
    };

    // 设置地图中心
    const setCenter = (center) => {
        if (!map.value) return;
        const view = map.value.getView();
        view.setCenter(fromLonLat(center));
        mapCenter.value = center;
    };

    // 设置缩放级别
    const setZoom = (zoom) => {
        if (!map.value) return;
        const view = map.value.getView();
        view.setZoom(zoom);
        mapZoom.value = zoom;
    };

    // 获取地图视图
    const getView = () => {
        return map.value ? map.value.getView() : null;
    };

    // 获取地图实例
    const getMap = () => {
        return map.value;
    };

    // 销毁地图
    const destroyMap = () => {
        if (map.value) {
            map.value.setTarget(null);
            map.value = null;
            isMapReady.value = false;
        }
    };

    // 生命周期
    onMounted(() => {
    });

    onUnmounted(() => {
        destroyMap();
    });

    // 返回响应式数据和方法
    return {
        // 响应式数据
        map,
        mapContainer,
        isMapReady,
        currentLayer,
        clickedCoordinate,
        mapCenter,
        mapZoom,
        layerStates,
        activeLayers,

        // 方法
        initMap,
        switchLayer,
        getCurrentLayer,
        setCenter,
        setZoom,
        getView,
        getMap,
        destroyMap,

        // 图层管理
        layerManager
    };
}
