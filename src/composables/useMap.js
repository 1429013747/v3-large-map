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
            let extent = map.value.getView().calculateExtent(map.value.getSize());
            let xmin = extent[0];
            let ymin = extent[1];
            let xmax = extent[2];
            let ymax = extent[3];

            if (callbacks.onMapMove) {
                callbacks.onMapMove({
                    xmin,
                    ymin,
                    xmax,
                    ymax
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

    // 搜索功能 - 支持中文地址
    const search = async (keyword) => {
        if (!map.value || !keyword.trim()) return;

        try {
            // 调用地理编码API
            const coordinates = await geocodeAddressTianditu(keyword.trim());
            console.log("🚀 ~ search ~ coordinates:", coordinates)
            if (coordinates) {
                const view = map.value.getView();
                view.setCenter(fromLonLat(coordinates));
                view.setZoom(15); // 搜索后放大到15级
                console.log(`搜索成功: ${keyword} -> [${coordinates[0]}, ${coordinates[1]}]`);
            } else {
                console.warn(`未找到地址: ${keyword}`);
            }
        } catch (error) {
            console.error('搜索失败:', error);
        }
    };

    // 地理编码函数 - 使用真实的地理编码服务
    const geocodeAddress = async (address) => {
        // 方法1: 使用 Nominatim (OpenStreetMap) - 免费
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&accept-language=zh-CN,zh,en`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                console.log(`Nominatim搜索结果: ${result.display_name}`);
                return [parseFloat(result.lon), parseFloat(result.lat)];
            }

            return null;
        } catch (error) {
            console.error('Nominatim地理编码失败:', error);
            // 如果Nominatim失败，回退到本地数据
            return geocodeAddressLocal(address);
        }
    };

    // 高德地图地理编码（需要API Key）
    const geocodeAmap = async (address) => {
        try {
            const response = await fetch(
                `https://restapi.amap.com/v3/geocode/geo?key=${apiKey.value}&address=${encodeURIComponent(address)}&output=json`
            );

            const data = await response.json();

            if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
                const location = data.geocodes[0].location.split(',');
                return [parseFloat(location[0]), parseFloat(location[1])];
            }

            return null;
        } catch (error) {
            console.error('高德地图地理编码失败:', error);
            return null;
        }
    };
    // 高德地图地理编码（需要API Key）
    const geocodeAddressAmap = async (address) => {
        try {
            const response = await fetch(
                `https://restapi.amap.com/v3/geocode/geo?key=${apiKey.value}&address=${encodeURIComponent(address)}&output=json`
            );

            const data = await response.json();

            if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
                const location = data.geocodes[0].location.split(',');
                return [parseFloat(location[0]), parseFloat(location[1])];
            }

            return null;
        } catch (error) {
            console.error('高德地图地理编码失败:', error);
            return null;
        }
    };

    // 百度地图地理编码（需要API Key）
    const geocodeAddressBaidu = async (address) => {
        try {
            const response = await fetch(
                `https://api.map.baidu.com/geocoding/v2/?address=${encodeURIComponent(address)}&output=json&ak=${apiKey.value}`
            );

            const data = await response.json();

            if (data.status === 0 && data.result && data.result.location) {
                const { lng, lat } = data.result.location;
                return [lng, lat];
            }

            return null;
        } catch (error) {
            console.error('百度地图地理编码失败:', error);
            return null;
        }
    };

    // 天地图地理编码（需要API Key）
    const geocodeAddressTianditu = async (address) => {
        try {
            const response = await fetch(
                `https://api.tianditu.gov.cn/geocoder?postStr={"addr":"${encodeURIComponent(address)}","type":"1"}&tk=${apiKey.value}`
            );

            const data = await response.json();

            if (data.status === '0' && data.result && data.result.location) {
                const { lon, lat } = data.result.location;
                return [lon, lat];
            }

            return null;
        } catch (error) {
            console.error('天地图地理编码失败:', error);
            return null;
        }
    };

    // 本地地理编码数据（作为备用）
    const geocodeAddressLocal = (address) => {

        const mockGeocodingData = {
            // 浙江省内主要城市和地标
            '杭州': [120.1551, 30.2741],
            '杭州市': [120.1551, 30.2741],
            '西湖': [120.1394, 30.2305],
            '西湖区': [120.1394, 30.2305],
            '西湖风景名胜区': [120.1394, 30.2305],
            '杭州东站': [120.2102, 30.2906],
            '萧山机场': [120.4340, 30.2294],
            '萧山国际机场': [120.4340, 30.2294],
            '钱塘江': [120.2000, 30.2500],
            '钱塘江大桥': [120.1394, 30.2305],
            '雷峰塔': [120.1394, 30.2305],
            '断桥': [120.1394, 30.2305],
            '苏堤': [120.1394, 30.2305],
            '白堤': [120.1394, 30.2305],
            '三潭印月': [120.1394, 30.2305],
            '灵隐寺': [120.1000, 30.2400],
            '六和塔': [120.1000, 30.2000],
            '宋城': [120.1000, 30.2000],
            '千岛湖': [119.0000, 29.6000],
            '淳安': [119.0000, 29.6000],
            '建德': [119.3000, 29.5000],
            '桐庐': [119.6000, 29.8000],
            '富阳': [119.9000, 30.0000],
            '临安': [119.7000, 30.2000],
            '余杭': [120.3000, 30.4000],
            '萧山': [120.3000, 30.2000],
            '滨江': [120.2000, 30.2000],
            '拱墅': [120.1000, 30.3000],
            '上城': [120.2000, 30.2000],
            '下城': [120.2000, 30.3000],
            '江干': [120.2000, 30.3000],
            '下沙': [120.3000, 30.3000],
            '九堡': [120.3000, 30.3000],
            '彭埠': [120.2000, 30.3000],
            '笕桥': [120.2000, 30.3000],
            '丁桥': [120.2000, 30.3000],
            '半山': [120.2000, 30.3000],
            '康桥': [120.2000, 30.3000],
            '祥符': [120.1000, 30.3000],
            '三墩': [120.1000, 30.3000],
            '蒋村': [120.1000, 30.3000],
            '文新': [120.1000, 30.3000],
            '古荡': [120.1000, 30.3000],
            '翠苑': [120.1000, 30.3000],
            '西溪': [120.1000, 30.3000],
            '留下': [120.1000, 30.3000],
            '转塘': [120.1000, 30.2000],
            '双浦': [120.1000, 30.2000],
            '袁浦': [120.1000, 30.2000],
            '周浦': [120.1000, 30.2000],
            '龙坞': [120.1000, 30.2000],
            '之江': [120.1000, 30.2000],
            '长河': [120.2000, 30.2000],
            '浦沿': [120.2000, 30.2000],
            '西兴': [120.2000, 30.2000],
            '闻堰': [120.2000, 30.2000],
            '义桥': [120.2000, 30.2000],
            '临浦': [120.2000, 30.2000],
            '戴村': [120.2000, 30.2000],
            '河上': [120.2000, 30.2000],
            '楼塔': [120.2000, 30.2000],
            '进化': [120.2000, 30.2000],
            '所前': [120.2000, 30.2000],
            '衙前': [120.2000, 30.2000],
            '瓜沥': [120.2000, 30.2000],
            '益农': [120.2000, 30.2000],
            '党湾': [120.2000, 30.2000],
            '靖江': [120.2000, 30.2000],
            '南阳': [120.2000, 30.2000],
            '河庄': [120.2000, 30.2000],
            '义蓬': [120.2000, 30.2000],
            '新湾': [120.2000, 30.2000],
            '临江': [120.2000, 30.2000],
            '前进': [120.2000, 30.2000],
            '新街': [120.2000, 30.2000],
            '宁围': [120.2000, 30.2000],
            '北干': [120.2000, 30.2000],
            '城厢': [120.2000, 30.2000],
            '蜀山': [120.2000, 30.2000],
            '新塘': [120.2000, 30.2000],
            // 浙江省其他城市
            '宁波': [121.5440, 29.8683],
            '温州': [120.6994, 28.0006],
            '嘉兴': [120.7550, 30.7460],
            '湖州': [120.1033, 30.8703],
            '绍兴': [120.5820, 30.0513],
            '金华': [119.6476, 29.0790],
            '衢州': [118.8720, 28.9569],
            '舟山': [122.2072, 29.9853],
            '台州': [121.4200, 28.6564],
            '丽水': [119.9229, 28.4518],
            // 全国主要城市
            '北京': [116.4074, 39.9042],
            '上海': [121.4737, 31.2304],
            '广州': [113.2644, 23.1291],
            '深圳': [114.0579, 22.5431],
            '成都': [104.0668, 30.5728],
            '重庆': [106.5516, 29.5630],
            '西安': [108.9402, 34.3416],
            '武汉': [114.3054, 30.5928],
            '南京': [118.7969, 32.0603],
            '天津': [117.2008, 39.0842],
            '苏州': [120.5853, 31.2989],
            '无锡': [120.3119, 31.4912],
            '常州': [119.9465, 31.7720],
            '镇江': [119.4258, 32.1879],
            '扬州': [119.4126, 32.3932],
            '泰州': [119.9251, 32.4558],
            '南通': [120.8564, 32.0103],
            '盐城': [120.1394, 33.3776],
            '淮安': [119.0151, 33.6104],
            '宿迁': [118.2752, 33.9630],
            '徐州': [117.2008, 34.2044],
            '连云港': [119.1788, 34.6000],
            '济南': [117.0009, 36.6758],
            '青岛': [120.3826, 36.0671],
            '烟台': [121.3914, 37.5393],
            '威海': [122.1204, 37.5133],
            '潍坊': [119.1078, 36.7069],
            '淄博': [118.0549, 36.8131],
            '东营': [118.6748, 37.4342],
            '滨州': [117.9708, 37.3835],
            '德州': [116.3594, 37.4342],
            '聊城': [115.9801, 36.4560],
            '菏泽': [115.4697, 35.2465],
            '济宁': [116.5873, 35.4149],
            '泰安': [117.0889, 36.2019],
            '莱芜': [117.6777, 36.2144],
            '临沂': [118.3563, 35.1047],
            '日照': [119.5269, 35.4164],
            '枣庄': [117.3238, 34.8105],
            '合肥': [117.2272, 31.8206],
            '芜湖': [118.3765, 31.3263],
            '蚌埠': [117.3632, 32.9399],
            '淮南': [117.0183, 32.6475],
            '马鞍山': [118.5069, 31.6894],
            '淮北': [116.7983, 33.9717],
            '铜陵': [117.8166, 30.9294],
            '安庆': [117.0435, 30.5255],
            '黄山': [118.3173, 29.7092],
            '滁州': [118.3163, 32.3016],
            '阜阳': [115.8197, 32.8969],
            '宿州': [116.9841, 33.6339],
            '六安': [116.5078, 31.7529],
            '亳州': [115.7829, 33.8693],
            '池州': [117.4892, 30.6600],
            '宣城': [118.7588, 30.9457],
            '福州': [119.2965, 26.0745],
            '厦门': [118.1103, 24.4905],
            '莆田': [119.0078, 25.4541],
            '三明': [117.6390, 26.2650],
            '泉州': [118.6759, 24.8739],
            '漳州': [117.6762, 24.5170],
            '南平': [118.1779, 26.6415],
            '龙岩': [117.0179, 25.0916],
            '宁德': [119.5272, 26.6592],
            '南昌': [115.8922, 28.6765],
            '景德镇': [117.1784, 29.2685],
            '萍乡': [113.8546, 27.6229],
            '九江': [115.9928, 29.7120],
            '新余': [114.9308, 27.8108],
            '鹰潭': [117.0338, 28.2386],
            '赣州': [114.9403, 25.8311],
            '吉安': [114.9864, 27.1117],
            '宜春': [114.3911, 27.8043],
            '抚州': [116.3584, 27.9838],
            '上饶': [117.9712, 28.4444],
            '郑州': [113.6254, 34.7466],
            '开封': [114.3074, 34.7971],
            '洛阳': [112.4345, 34.6197],
            '平顶山': [113.1927, 33.7662],
            '安阳': [114.3526, 36.1034],
            '鹤壁': [114.2954, 35.7482],
            '新乡': [113.9268, 35.3030],
            '焦作': [113.2418, 35.2159],
            '濮阳': [115.0413, 35.7684],
            '许昌': [113.8261, 34.0229],
            '漯河': [114.0264, 33.5759],
            '三门峡': [111.1941, 34.7773],
            '南阳': [112.5283, 32.9908],
            '商丘': [115.6505, 34.4371],
            '信阳': [114.0750, 32.1268],
            '周口': [114.6496, 33.6204],
            '驻马店': [114.0247, 32.9802],
            '济源': [112.5900, 35.0900],
            '黄石': [115.0771, 30.2201],
            '十堰': [110.7879, 32.6470],
            '宜昌': [111.2865, 30.6919],
            '襄阳': [112.1441, 32.0424],
            '鄂州': [114.8906, 30.3915],
            '荆门': [112.2043, 31.0354],
            '孝感': [113.9259, 30.9246],
            '荆州': [112.2381, 30.3269],
            '黄冈': [114.8799, 30.4471],
            '咸宁': [114.3286, 29.8328],
            '随州': [113.3738, 31.7175],
            '恩施': [109.4867, 30.2831],
            '长沙': [112.9823, 28.1949],
            '株洲': [113.1517, 27.8351],
            '湘潭': [112.9441, 27.8297],
            '衡阳': [112.6077, 26.9004],
            '邵阳': [111.4692, 27.2378],
            '岳阳': [113.1329, 29.3703],
            '常德': [111.6913, 29.0402],
            '张家界': [110.4792, 29.1274],
            '益阳': [112.3551, 28.5701],
            '郴州': [113.0321, 25.7706],
            '永州': [111.6080, 26.4344],
            '怀化': [109.9782, 27.5501],
            '娄底': [111.9964, 27.7281],
            '湘西': [109.7397, 28.3143],
            '韶关': [113.5915, 24.8006],
            '珠海': [113.5538, 22.2559],
            '汕头': [116.6819, 23.3541],
            '佛山': [113.1224, 23.0288],
            '江门': [113.0819, 22.5787],
            '湛江': [110.3647, 21.2749],
            '茂名': [110.9192, 21.6598],
            '肇庆': [112.4405, 23.0458],
            '惠州': [114.4126, 23.0798],
            '梅州': [116.1176, 24.2991],
            '汕尾': [115.3752, 22.7862],
            '河源': [114.6978, 23.7463],
            '阳江': [111.9755, 21.8579],
            '清远': [113.0512, 23.6850],
            '东莞': [113.7463, 23.0223],
            '中山': [113.3928, 22.5167],
            '潮州': [116.6226, 23.6569],
            '揭阳': [116.3557, 23.5438],
            '云浮': [112.0445, 22.9298],
            '南宁': [108.3661, 22.8173],
            '柳州': [109.4286, 24.3261],
            '桂林': [110.2993, 25.2742],
            '梧州': [111.2791, 23.4851],
            '北海': [109.1201, 21.4733],
            '防城港': [108.3455, 21.6174],
            '钦州': [108.6541, 21.9668],
            '贵港': [109.5996, 23.0936],
            '玉林': [110.1649, 22.6314],
            '百色': [106.6163, 23.9022],
            '贺州': [111.5521, 24.4141],
            '河池': [108.0851, 24.6929],
            '来宾': [109.2298, 23.7338],
            '崇左': [107.3647, 22.4041],
            '海口': [110.3312, 20.0311],
            '三亚': [109.5083, 18.2479],
            '三沙': [112.3381, 16.8310],
            '儋州': [109.5768, 19.5175],
            '五指山': [109.5169, 18.7769],
            '琼海': [110.4647, 19.2460],
            '文昌': [110.7539, 19.6129],
            '万宁': [110.3888, 18.7962],
            '东方': [108.6538, 19.0952],
            '定安': [110.3589, 19.6812],
            '屯昌': [110.1028, 19.3629],
            '澄迈': [110.0068, 19.7371],
            '临高': [109.6877, 19.9083],
            '白沙': [109.4526, 19.2161],
            '昌江': [109.0533, 19.2989],
            '乐东': [109.1754, 18.7501],
            '陵水': [110.0372, 18.5050],
            '保亭': [109.7026, 18.6364],
            '琼中': [109.8384, 19.0356],
            '自贡': [104.7784, 29.3390],
            '攀枝花': [101.7186, 26.5824],
            '泸州': [105.4433, 28.8718],
            '德阳': [104.3987, 31.1269],
            '绵阳': [104.6791, 31.4675],
            '广元': [105.8298, 32.4337],
            '遂宁': [105.5929, 30.5328],
            '内江': [105.0584, 29.5802],
            '乐山': [103.7657, 29.5820],
            '南充': [106.1107, 30.8378],
            '眉山': [103.8317, 30.0483],
            '宜宾': [104.6109, 28.7602],
            '广安': [106.6334, 30.4564],
            '达州': [107.5023, 31.2096],
            '雅安': [103.0010, 29.9877],
            '巴中': [106.7537, 31.8588],
            '资阳': [104.6419, 30.1222],
            '贵阳': [106.7135, 26.5783],
            '六盘水': [104.8304, 26.5927],
            '遵义': [106.9080, 27.7066],
            '安顺': [105.9322, 26.2454],
            '毕节': [105.2850, 27.3017],
            '铜仁': [109.1911, 27.7183],
            '昆明': [102.8332, 24.8801],
            '曲靖': [103.7975, 25.5016],
            '玉溪': [102.5439, 24.3551],
            '保山': [99.1671, 25.1118],
            '昭通': [103.7172, 27.3382],
            '丽江': [100.2330, 26.8721],
            '普洱': [100.9722, 22.7773],
            '临沧': [100.0869, 23.8866],
            '拉萨': [91.1409, 29.6455],
            '日喀则': [88.8851, 29.2675],
            '昌都': [97.1782, 31.1406],
            '林芝': [94.3623, 29.6547],
            '山南': [91.7665, 29.2361],
            '那曲': [92.0602, 31.4760],
            '阿里': [80.1055, 32.5031],
            '铜川': [108.9792, 34.9089],
            '宝鸡': [107.1826, 34.3633],
            '咸阳': [108.7051, 34.3334],
            '渭南': [109.5029, 34.4994],
            '延安': [109.4896, 36.5854],
            '汉中': [107.0286, 33.0777],
            '榆林': [109.7412, 38.2902],
            '安康': [109.0293, 32.6903],
            '商洛': [109.9402, 33.8683],
            '兰州': [103.8236, 36.0581],
            '嘉峪关': [98.2773, 39.7735],
            '金昌': [102.1879, 38.5142],
            '白银': [104.1736, 36.5457],
            '天水': [105.7249, 34.5789],
            '武威': [102.6347, 37.9299],
            '张掖': [100.4550, 38.9329],
            '平凉': [106.6843, 35.5428],
            '酒泉': [98.5108, 39.7440],
            '庆阳': [107.8781, 35.7382],
            '定西': [104.6263, 35.5806],
            '陇南': [104.9294, 33.3886],
            '西宁': [101.7782, 36.6232],
            '海东': [102.1043, 36.5020],
            '海北': [100.9011, 36.9594],
            '黄南': [102.0190, 35.5177],
            '海南': [100.6195, 36.2804],
            '果洛': [100.2421, 34.4714],
            '玉树': [97.0082, 33.0040],
            '海西': [97.3708, 37.3747],
            '银川': [106.2782, 38.4872],
            '石嘴山': [106.3762, 39.0133],
            '吴忠': [106.1994, 37.9862],
            '固原': [106.2852, 36.0045],
            '中卫': [105.1969, 37.5002],
            '乌鲁木齐': [87.6177, 43.7928],
            '克拉玛依': [84.8739, 45.5886],
            '吐鲁番': [89.1841, 42.9476],
            '哈密': [93.4538, 42.8339],
            '昌吉': [87.3043, 44.0146],
            '博尔塔拉': [82.0748, 44.9033],
            '巴音郭楞': [86.1506, 41.7686],
            '阿克苏': [80.2651, 41.1707],
            '克孜勒苏': [76.1728, 39.7134],
            '喀什': [75.9938, 39.4677],
            '和田': [79.9253, 37.1107],
            '伊犁': [81.3176, 43.9219],
            '塔城': [82.9857, 46.7463],
            '阿勒泰': [88.1396, 47.8484],
            '香港': [114.1694, 22.3193],
            '澳门': [113.5491, 22.1987],
            '台北': [121.5654, 25.0330],
            '高雄': [120.3014, 22.6273],
            '台中': [120.6736, 24.1477],
            '台南': [120.1551, 23.1417],
            '新北': [121.4657, 25.0169],
            '桃园': [121.3009, 24.9936],
            '基隆': [121.7415, 25.1276],
            '新竹': [120.9686, 24.8066],
            '嘉义': [120.4419, 23.4798],
            '彰化': [120.4814, 24.0817],
            '南投': [120.9876, 23.9600],
            '云林': [120.4313, 23.7082],
            '屏东': [120.4881, 22.6714],
            '宜兰': [121.7500, 24.7500],
            '花莲': [121.3000, 23.9833],
            '台东': [121.1500, 22.7500],
            '澎湖': [119.5667, 23.5667],
            '金门': [118.3171, 24.4326],
            '连江': [119.5397, 26.1973]
        };

        // 精确匹配
        if (mockGeocodingData[address]) {
            return mockGeocodingData[address];
        }

        // 模糊匹配
        for (const [key, coords] of Object.entries(mockGeocodingData)) {
            if (key.includes(address) || address.includes(key)) {
                return coords;
            }
        }

        // 如果都没匹配到，返回null
        return null;
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
        search,

        // 图层管理
        layerManager
    };
}
