import { ref, reactive } from 'vue';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

/**
 * 地图轨迹管理Hook
 * @param {Object} map - OpenLayers地图实例
 * @returns {Object} 轨迹管理方法和状态
 */
export function useMapTracks(map) {
    // 轨迹数据
    const trackLayer = ref(null);
    const trackSource = ref(null);
    const trackFeatureList = ref([])

    // 轨迹配置
    const trackConfig = reactive({
        defaultStyle: {
            stroke: '#00ffff',
            strokeWidth: 3,
            lineDash: [5, 10],
            lineCap: 'round',
            lineJoin: 'round'
        },
        animationStyle: {
            stroke: '#ff6b6b',
            strokeWidth: 4,
            lineDash: [10, 5],
            lineCap: 'round',
            lineJoin: 'round'
        },
        startPointStyle: {
            radius: 6,
            fill: '#00ff00',
            stroke: '#ffffff',
            strokeWidth: 2
        },
        endPointStyle: {
            radius: 6,
            fill: '#ff0000',
            stroke: '#ffffff',
            strokeWidth: 2
        }
    });

    /**
     * 初始化轨迹图层
     */
    const initTrackLayer = () => {
        if (!map) return;

        trackSource.value = new VectorSource();
        trackLayer.value = new VectorLayer({
            source: trackSource.value,
            title: '轨迹',
            zIndex: 200 // 轨迹在标记点上方
        });

        map.addLayer(trackLayer.value);
        console.log('轨迹图层初始化完成');
    };


    /**
     * 生成轨迹路线
     * @param {Array} coordinates - 坐标点数组 [[lng, lat], [lng, lat], ...]
     * @param {Object} options - 轨迹选项
     */
    const generateTrackRoute = (coordinates, options = {}) => {
        if (!map || !trackSource.value) {
            console.warn('地图或轨迹图层未初始化');
            return null;
        }

        if (!coordinates || coordinates.length < 2) {
            console.warn('坐标点数量不足，至少需要2个点');
            return null;
        }

        const {
            showStartEnd = true,
            animation = true,
            animationDuration = 1000,
            midpointText = '中间点',
            id,
            style = {
                stroke: '#00ffff',
                strokeWidth: 3,
                // 设置实线
                lineDash: [],
                lineCap: 'round',
                lineJoin: 'round'
            }
        } = options;

        // 转换为地图坐标 WGS84
        const mapCoordinates = coordinates.map(coord => fromLonLat(coord));

        // 创建轨迹线
        const lineString = new LineString(mapCoordinates);
        const trackFeature = new Feature({
            geometry: lineString,
            type: 'track_route',
            id: id || generateUniqueTrackId()
        });

        // 设置轨迹样式
        trackFeature.setStyle(new Style({
            stroke: new Stroke({
                color: style.stroke,
                width: style.strokeWidth,
                lineDash: style.lineDash,
                lineCap: style.lineCap,
                lineJoin: style.lineJoin
            })
        }));

        // 添加到轨迹图层
        trackSource.value.addFeature(trackFeature);
        trackFeatureList.value.push(trackSource.value)

        // 如果启用动画，开始轨迹动画
        if (animation) {
            startTrackRouteAnimation(trackFeature, mapCoordinates, animationDuration, midpointText, showStartEnd, trackFeature.get('id'));
        } else {
            // 添加起点和终点标记
            if (showStartEnd) {
                // 起点
                onStartPoint(mapCoordinates, trackFeature.get('id'));
                // 终点
                onEndPoint(mapCoordinates, trackFeature.get('id'));
            }
        }

        console.log('轨迹路线生成成功，坐标点数量:', coordinates.length);
        return trackFeature;
    };

    /**
     * 开始轨迹路线动画
     * @param {Feature} trackFeature - 轨迹要素
     * @param {Array} mapCoordinates - 地图坐标数组
     */
    const startTrackRouteAnimation = (trackFeature, mapCoordinates, animationDuration = 1000, midpointText, showStartEnd, trackId) => {
        if (!trackFeature || mapCoordinates.length < 2) return;

        let currentIndex = 0;
        const stepDuration = animationDuration / mapCoordinates.length;
        // 起点
        if (showStartEnd) {
            onStartPoint(mapCoordinates, trackId);
        }
        const animate = () => {
            if (currentIndex >= mapCoordinates.length) {
                if (showStartEnd) {
                    // 终点
                    onEndPoint(mapCoordinates, trackId);
                }
                // 动画结束
                return;
            }

            if (currentIndex && currentIndex % 2 === 0) {
                // 添加中间点
                onMidpointPoint(mapCoordinates, currentIndex, midpointText, trackId);
            }

            // 创建部分轨迹
            const partialCoordinates = mapCoordinates.slice(0, currentIndex + 1);
            const partialLineString = new LineString(partialCoordinates);
            trackFeature.setGeometry(partialLineString);

            currentIndex++;
            setTimeout(animate, stepDuration);
        };

        animate();
    };

    //起点标记
    const onStartPoint = (mapCoordinates, trackId = null) => {
        const startPoint = new Point(mapCoordinates[0]);
        const startFeature = new Feature({
            geometry: startPoint,
            type: 'track_point',
            pointType: 'start',
            text: '起点',
            trackId: trackId
        });
        startFeature.setStyle(new Style({
            image: new Circle({
                radius: 6,
                fill: new Fill({ color: '#00ff00' }),
                stroke: new Stroke({
                    color: '#ffffff',
                    width: 2
                }),
            }),
            text: new Text({
                text: '起点',
                font: 'bold 12px Arial',
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color: '#000000', width: 3 }),
                offsetY: -25,
                textAlign: 'center',
                textBaseline: 'middle',
                padding: [4, 8, 4, 8]
            })
        }));
        trackSource.value.addFeature(startFeature);
    }
    //中间点标记
    const onMidpointPoint = (mapCoordinates, currentIndex, midpointText, trackId = null) => {
        const point = new Point(mapCoordinates[currentIndex]);
        const feature = new Feature({
            geometry: point,
            type: 'track_point',
            trackId: trackId
        });
        feature.setStyle(new Style({
            image: new Circle({
                radius: 4,
                fill: new Fill({ color: '#d3603a' }),
            }),
            text: new Text({
                text: midpointText,
                font: 'bold 8px Arial',
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color: '#000000', width: 3 }),
                offsetY: -25,
            })
        }));
        trackSource.value.addFeature(feature);
    }
    //终点标记
    const onEndPoint = (mapCoordinates, trackId = null) => {
        const endPoint = new Point(mapCoordinates[mapCoordinates.length - 1]);
        const endFeature = new Feature({
            geometry: endPoint,
            type: 'track_point',
            pointType: 'end',
            text: '终点',
            trackId: trackId
        });
        endFeature.setStyle(new Style({
            image: new Circle({
                radius: 6,
                fill: new Fill({ color: '#ff0000' }),
                stroke: new Stroke({
                    color: '#ffffff',
                    width: 2
                })
            }),
            text: new Text({
                text: '终点',
                font: 'bold 12px Arial',
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color: '#000000', width: 3 }),
                offsetY: -25,
                textAlign: 'center',
                textBaseline: 'middle',
                padding: [4, 8, 4, 8]
            })
        }));
        trackSource.value.addFeature(endFeature);
    }
    /**
     * 展示指定轨迹路线
     * @param {String} trackId - 轨迹ID
     * @param {Boolean} visible - 是否可见
     */
    const showTrackRoute = (trackId, visible) => {
        const features = trackSource.value.getFeatures();
        const trackFeature = features.find(feature => feature.getProperties().id === trackId);
        if (trackFeature) {
            trackFeature.setVisible(visible);
        }
    }

    /**
     * 切换轨迹路线可见性
     * @param {Boolean} visible - 是否可见
     */
    const toggleTrackRouteVisibility = (visible) => {
        if (trackLayer.value) {
            trackLayer.value.setVisible(visible);
        }
    }

    /**
     * 移除指定轨迹路线
     * @param {String} trackId - 轨迹ID
     */
    const removeTrackRoute = (trackId) => {
        if (!trackSource.value) return;

        const features = trackSource.value.getFeatures();

        // 移除轨迹路线
        const trackFeature = features.find(feature => feature.getProperties().id === trackId);
        if (trackFeature) {
            trackSource.value.removeFeature(trackFeature);
        }

        // 移除与当前轨迹相关的轨迹点（起点、终点、中间点）
        const trackPoints = features.filter(feature => {
            const properties = feature.getProperties();
            return properties.type === 'track_point' && properties.trackId === trackId;
        });

        trackPoints.forEach(point => {
            trackSource.value.removeFeature(point);
        });

    }

    /**
     * 清除所有轨迹路线
     */
    const clearTrackRoutes = () => {
        if (!trackSource.value) return;

        const features = trackSource.value.getFeatures();
        features.forEach(feature => {
            if (feature.get('type') === 'track_route' || feature.get('type') === 'track_point') {
                trackSource.value.removeFeature(feature);
            }
        });
    };

    /**
     * 销毁轨迹图层
     */
    const destroy = () => {
        if (map && trackLayer.value) {
            map.removeLayer(trackLayer.value);
        }

        if (trackSource.value) {
            trackSource.value.clear();
        }

        trackLayer.value = null;
        trackSource.value = null;
    };

    /**
     * 检查轨迹ID是否唯一
     * @param {String} id - 轨迹ID
     * @returns {Boolean} 是否唯一
     */
    const isTrackIdUnique = (id) => {
        return !trackSource.value.getFeatures().some(feature => feature.getProperties().id === id);
    };
    /**
     * 生成唯一的轨迹ID
     * @param {String} prefix - ID前缀
     * @returns {String} 唯一的ID
     */
    const generateUniqueTrackId = (prefix = 'track') => {
        let id;
        let counter = 0;
        do {
            id = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            counter++;
        } while (!isTrackIdUnique(id) && counter < 100);

        if (counter >= 100) {
            console.warn('无法生成唯一的轨迹ID');
            return `${prefix}_${Date.now()}_fallback`;
        }

        return id;
    };

    return {
        // 状态
        trackLayer,
        trackSource,
        trackConfig,
        trackFeatureList,
        // 初始化
        initTrackLayer,

        // 轨迹生成
        generateTrackRoute,
        startTrackRouteAnimation,
        clearTrackRoutes,
        toggleTrackRouteVisibility,
        showTrackRoute,
        removeTrackRoute,
        // 销毁
        destroy,

    };
}
