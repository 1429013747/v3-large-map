import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
import { defaults as defaultControls } from "ol/control";
import { defaults as defaultInteractions } from 'ol/interaction';
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
    // 公交线路 天地图
    // http://api.tianditu.gov.cn/transit?type=busline&postStr={"startposition":"116.427562,39.939677","endposition":"116.349329,39.939132","linetype":"1"}&tk=0a48cde9eb28189acac8149c3f047266

    // 响应式数据
    const map = ref(null);
    const mapContainer = ref(null);
    const isMapReady = ref(false);
    const mapCenter = ref(center);
    const mapZoom = ref(zoom);
    const apiKey = ref("cff1fa4f29d5375c9d6290bd249ce077");
    // const apiKey = ref("0a48cde9eb28189acac8149c3f047266");
    // 更新中心坐标
    const updateCenter = (newCenter) => {
        mapCenter.value = newCenter;
        console.log("中心坐标已更新:", newCenter);
    };

    let countIndex = 0;
    let timer = null;
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
                controls: controls,
                interactions: defaultInteractions({
                    doubleClickZoom: false,   //屏蔽双击放大事件
                })
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
        map.value.on("singleclick", (event) => {

            const coordinate = event.coordinate;
            // 将 Web Mercator 坐标转换为经纬度
            const lonLat = toLonLat(coordinate);

            if (callbacks.onMapClick) {
                callbacks.onMapClick({
                    coordinate: coordinate,
                    lonLat: lonLat,
                    pixel: event.pixel,
                    event: event
                });
            }
        });
        // 地图双击事件
        map.value.on("dblclick", (event) => {

            const coordinate = event.coordinate;
            // 将 Web Mercator 坐标转换为经纬度
            const lonLat = toLonLat(coordinate);

            if (callbacks.onMapDoubleClick) {
                callbacks.onMapDoubleClick({
                    coordinate: coordinate,
                    lonLat: lonLat,
                    pixel: event.pixel,
                    event: event
                });
            }
        });

        // 地图移动事件
        map.value.on("moveend", () => {
            const scope = map.value.getView().calculateExtent(map.value.getSize()); // 获取地图范围
            const center = map.value.getView().getCenter(); // 获取地图中心
            // 将 Web Mercator 坐标转换为经纬度
            const lonLat = toLonLat(center);
            const zoom = map.value.getView().getZoom(); // 获取地图缩放级别

            if (callbacks.onMapMove) {
                callbacks.onMapMove({
                    scope,
                    zoom,
                    center: lonLat,
                });
            }
        });
        // 监听鼠标右击事件
        map.value.on('contextmenu', function (event) {
            // 阻止默认的右键菜单弹出
            event.originalEvent.preventDefault();
            // 阻止事件冒泡
            event.originalEvent.stopPropagation();

            const coordinate = event.coordinate;
            // 将 Web Mercator 坐标转换为经纬度
            const lonLat = toLonLat(coordinate);
            if (callbacks.onMapRightClick) {
                callbacks.onMapRightClick({
                    coordinate: coordinate,
                    lonLat: lonLat,
                    pixel: event.pixel,
                    event: event
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

            // 添加加载完成事件
            layer.getSource().on('tileloadend', (event) => {
                countIndex = 0;
            });

            // 添加错误处理
            layer.getSource().on('tileloaderror', (event) => {
                // console.warn(`图层 ${config.title} 瓦片加载失败:`, event);
                // 如果当前图层加载失败，尝试切换到备用图层
                if (config.visible) {
                    console.log("🚀 ~ createLayers ~ timer:", timer)
                    if (timer) return;
                    timer = setTimeout(() => {
                        switchToFallbackLayer();
                        timer = null;
                    }, 200);
                }
            });
            layers.push(layer);
        });
        return layers;
    };

    // 切换到备用图层
    const switchToFallbackLayer = () => {
        const fallbackLayers = ['高德卫星', '天地图', 'CartoDB', '高德地图'];
        if (countIndex >= fallbackLayers.length) {
            console.log('所有备用图层都已切换过');
            return;
        }
        const layerName = fallbackLayers[countIndex];
        console.log(`切换到备用图层: ${layerName} index: ${countIndex}`);
        switchLayer(layerName);
        countIndex++;
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
            if (layerZIndex < 100) {
                layer.setVisible(isTarget);
                layer.setZIndex(isTarget ? 1 : -1);
            }
        });

        // 调试：检查标记点图层状态
        // const markerLayers = layers.filter(layer => layer.getZIndex() >= 1000);
        // console.log('标记点图层状态:', markerLayers.map(layer => ({
        //     title: layer.get('title') || '未命名',
        //     visible: layer.getVisible(),
        //     zIndex: layer.getZIndex()
        // })));

        if (callbacks.onLayerChange) {
            callbacks.onLayerChange(layerName);
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
            }
        },

        // 隐藏图层
        hideLayer: (layerName) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            const targetLayer = layers.find(layer => layer.get("title") === layerName);
            if (targetLayer) {
                targetLayer.setVisible(false);
            }
        },

        // 设置图层透明度
        setLayerOpacity: (layerName, opacity) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            const targetLayer = layers.find(layer => layer.get("title") === layerName);
            if (targetLayer) {
                targetLayer.setOpacity(opacity);
            }
        },

        // 设置图层层级
        setLayerZIndex: (layerName, zIndex) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            const targetLayer = layers.find(layer => layer.get("title") === layerName);
            if (targetLayer) {
                targetLayer.setZIndex(zIndex);
            }
        },

        // 重置所有图层（只显示一个基础图层）
        resetToSingleLayer: (layerName) => {
            if (!map.value) return;
            const layers = map.value.getLayers().getArray();
            layers.forEach((layer) => {
                const isTarget = layer.get("title") === layerName;
                const layerZIndex = layer.getZIndex();
                // 只处理基础图层（zIndex < 1000），不影响标记点等特殊图层
                if (layerZIndex < 100) {
                    layer.setVisible(isTarget);
                }
            });
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
        mapCenter,
        mapZoom,

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
