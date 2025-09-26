import { ref, reactive, nextTick } from 'vue';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Style, Icon, Text, Circle, Fill, Stroke } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';

/**
 * 地图标记聚合管理Hook
 * @param {Object} map - OpenLayers地图实例
 * @returns {Object} 聚合管理方法和状态
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

    /**
     * 创建聚合样式
     * @param {Feature} feature - 要素
     * @param {Number} resolution - 分辨率
     * @returns {Style} 样式对象
     */
    const createClusterStyle = (feature, resolution) => {
        const features = feature.get('features');
        const size = features ? features.length : 1;

        if (size === 1) {
            // 单个标记样式
            const markerData = features[0].getProperties();
            return createSingleMarkerStyle(markerData);
        } else {
            // 聚合样式
            return createClusterMarkerStyle(size);
        }
    };

    /**
     * 创建单个标记样式
     * @param {Object} markerData - 标记数据
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
                    }),
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
     * @param {Number} size - 聚合数量
     * @returns {Style} 样式对象
     */
    const createClusterMarkerStyle = (size) => {
        const radius = Math.max(15, Math.min(30, 15 + size));
        const [startColor, endColor] = getClusterColor(size);

        // 使用自定义 renderer 绘制径向渐变圆
        const circleGradientStyle = new Style({
            zIndex: 0,
            renderer: (pixelCoordinates, state) => {
                const ctx = state.context;
                const pixelRatio = state.pixelRatio || 1;
                const [x, y] = pixelCoordinates;

                const r = radius * pixelRatio;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
                gradient.addColorStop(0, startColor);
                gradient.addColorStop(1, endColor);

                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        });

        // 文本样式与自定义渲染可叠加返回
        const textStyle = new Style({
            zIndex: 1,
            text: new Text({
                text: size.toString(),
                font: `${clusterConfig.clusterStyle.textSize}px ${clusterConfig.clusterStyle.textWeight}`,
                fill: new Fill({ color: clusterConfig.clusterStyle.textColor }),
            })
        });

        return [circleGradientStyle, textStyle];
    };

    /**
     * 根据聚合数量获取颜色
     * @param {Number} size - 聚合数量
     * @returns {String} 颜色值
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
     * @param {String} type - 图层类型
     * @param {Array} markers - 标记点数组
     * @param {Object} options - 选项
     * @returns {VectorLayer} 聚合图层
     */
    const createClusterLayer = (type, markers = [], options = {}) => {
        if (!map) {
            console.warn('地图实例未初始化');
            return null;
        }

        // 创建原始标记点源
        const source = new VectorSource({
            features: markers.map(marker => {
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
            minDistance: options.minDistance || clusterConfig.minDistance //最小聚合距离
        });

        // 创建聚合图层
        const clusterLayer = new VectorLayer({
            source: clusterSource,
            style: createClusterStyle,
            title: `${type}_cluster`,
            zIndex: 101
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
     * @param {String} type - 图层类型
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
        const features = markers.map(marker => {
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
     * @param {String} type - 图层类型
     * @param {Boolean} enabled - 是否启用
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
     * @param {String} type - 图层类型
     * @param {Number} distance - 聚合距离
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
     * @param {String} type - 图层类型
     * @returns {Object} 聚合信息
     */
    const getClusterInfo = (type) => {
        if (!clusterSources.value[type]) {
            return { totalFeatures: 0, clusters: 0 };
        }

        const source = clusterSources.value[type];
        const features = source.getFeatures();
        const clusters = features.filter(f => f.get('features') && f.get('features').length > 1);

        return {
            totalFeatures: source.getSource().getFeatures().length,
            clusters: clusters.length,
            clusterFeatures: clusters.length
        };
    };

    /**
     * 清除聚合图层
     * @param {String} type - 图层类型
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
        Object.keys(clusterLayers.value).forEach(type => {
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
