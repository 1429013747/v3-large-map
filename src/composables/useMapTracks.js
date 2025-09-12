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
    const tracks = ref([]);
    const trackLayer = ref(null);
    const trackSource = ref(null);

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
            zIndex: 1001 // 轨迹在标记点上方
        });

        map.addLayer(trackLayer.value);
        console.log('轨迹图层初始化完成');
    };

    /**
     * 创建轨迹样式
     * @param {Object} options - 样式选项
     * @returns {Style} 轨迹样式
     */
    const createTrackStyle = (options = {}) => {
        const {
            stroke = trackConfig.defaultStyle.stroke,
            strokeWidth = trackConfig.defaultStyle.strokeWidth,
            lineDash = trackConfig.defaultStyle.lineDash,
            lineCap = trackConfig.defaultStyle.lineCap,
            lineJoin = trackConfig.defaultStyle.lineJoin
        } = options;

        return new Style({
            stroke: new Stroke({
                color: stroke,
                width: strokeWidth,
                lineDash: lineDash,
                lineCap: lineCap,
                lineJoin: lineJoin
            })
        });
    };

    /**
     * 生成随机轨迹点
     * @param {Array} startCoord - 起始坐标 [经度, 纬度]
     * @param {Number} pointCount - 轨迹点数量
     * @param {Number} radius - 随机半径（公里）
     * @returns {Array} 轨迹点坐标数组
     */
    const generateRandomTrackPoints = (startCoord, pointCount = 10, radius = 5) => {
        const [startLng, startLat] = startCoord;
        const points = [startCoord];

        for (let i = 1; i < pointCount; i++) {
            // 生成随机角度
            const angle = Math.random() * 2 * Math.PI;
            // 生成随机距离（0到radius公里）
            const distance = Math.random() * radius;

            // 将距离转换为经纬度偏移
            const latOffset = (distance / 111) * Math.cos(angle); // 1度纬度约111公里
            const lngOffset = (distance / (111 * Math.cos(startLat * Math.PI / 180))) * Math.sin(angle);

            const newLng = startLng + lngOffset;
            const newLat = startLat + latOffset;

            points.push([newLng, newLat]);
        }

        return points;
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
            style = {
                stroke: '#00ffff',
                strokeWidth: 3,
                // 设置实线
                lineDash: [],
                lineCap: 'round',
                lineJoin: 'round'
            }
        } = options;

        // 转换为地图坐标
        const mapCoordinates = coordinates.map(coord => fromLonLat(coord));

        // 创建轨迹线
        const lineString = new LineString(mapCoordinates);
        const trackFeature = new Feature({
            geometry: lineString,
            type: 'track_route'
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

        // 添加起点和终点标记
        if (showStartEnd) {
            // 起点
            const startPoint = new Point(mapCoordinates[0]);
            const startFeature = new Feature({
                geometry: startPoint,
                type: 'track_point',
                pointType: 'start',
                text: '起点'
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

            // 终点
            const endPoint = new Point(mapCoordinates[mapCoordinates.length - 1]);
            const endFeature = new Feature({
                geometry: endPoint,
                type: 'track_point',
                pointType: 'end',
                text: '终点'
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

        // 如果启用动画，开始轨迹动画
        if (animation) {
            startTrackRouteAnimation(trackFeature, mapCoordinates);
        }

        console.log('轨迹路线生成成功，坐标点数量:', coordinates.length);
        return trackFeature;
    };

    /**
     * 开始轨迹路线动画
     * @param {Feature} trackFeature - 轨迹要素
     * @param {Array} mapCoordinates - 地图坐标数组
     */
    const startTrackRouteAnimation = (trackFeature, mapCoordinates) => {
        if (!trackFeature || mapCoordinates.length < 2) return;

        let currentIndex = 0;
        const animationDuration = 2000; // 2秒
        const stepDuration = animationDuration / mapCoordinates.length;

        const animate = () => {
            if (currentIndex >= mapCoordinates.length) {
                // 动画结束
                return;
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

        console.log('已清除所有轨迹路线');
    };

    /**
     * 生成轨迹
     * @param {Array} coordinates - 轨迹点坐标数组 [[lng, lat], ...]
     * @param {Object} options - 轨迹选项
     * @returns {String} 轨迹ID
     */
    const generateTrack = (coordinates, options = {}) => {
        if (!map || !trackSource.value) {
            console.warn('地图或轨迹图层未初始化');
            return null;
        }

        if (!coordinates || coordinates.length < 2) {
            console.warn('轨迹点数量不足，至少需要2个点');
            return null;
        }

        const trackId = options.id || `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const {
            style = {},
            showStartEnd = true,
            animation = false,
            markerId = null
        } = options;

        // 转换为地图坐标
        const mapCoordinates = coordinates.map(coord => fromLonLat(coord));

        // 创建轨迹线
        const lineString = new LineString(mapCoordinates);
        const trackFeature = new Feature({
            geometry: lineString,
            trackId: trackId,
            type: 'track',
            markerId: markerId,
            ...options.data
        });

        // 设置轨迹样式
        const trackStyle = createTrackStyle({
            ...trackConfig.defaultStyle,
            ...style
        });
        trackFeature.setStyle(trackStyle);

        // 添加到轨迹图层
        trackSource.value.addFeature(trackFeature);

        // 添加起点和终点标记
        if (showStartEnd) {
            // 起点
            const startPoint = new Point(mapCoordinates[0]);
            const startFeature = new Feature({
                geometry: startPoint,
                trackPointId: `${trackId}_start`,
                type: 'track_point',
                trackId: trackId,
                pointType: 'start'
            });
            startFeature.setStyle(new Style({
                image: new Circle({
                    radius: trackConfig.startPointStyle.radius,
                    fill: new Fill({ color: trackConfig.startPointStyle.fill }),
                    stroke: new Stroke({
                        color: trackConfig.startPointStyle.stroke,
                        width: trackConfig.startPointStyle.strokeWidth
                    })
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

            // 终点
            const endPoint = new Point(mapCoordinates[mapCoordinates.length - 1]);
            const endFeature = new Feature({
                geometry: endPoint,
                trackPointId: `${trackId}_end`,
                type: 'track_point',
                trackId: trackId,
                pointType: 'end'
            });
            endFeature.setStyle(new Style({
                image: new Circle({
                    radius: trackConfig.endPointStyle.radius,
                    fill: new Fill({ color: trackConfig.endPointStyle.fill }),
                    stroke: new Stroke({
                        color: trackConfig.endPointStyle.stroke,
                        width: trackConfig.endPointStyle.strokeWidth
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

        // 保存轨迹数据
        const track = {
            id: trackId,
            markerId: markerId,
            coordinates: coordinates,
            feature: trackFeature,
            options,
            visible: true,
            animation
        };

        tracks.value.push(track);

        // 如果启用动画，开始轨迹动画
        if (animation) {
            startTrackAnimation(trackId);
        }

        console.log('轨迹生成成功:', {
            trackId,
            trackPoints: coordinates.length,
            markerId: markerId,
            hasStartEnd: showStartEnd,
            startPointId: showStartEnd ? `${trackId}_start` : null,
            endPointId: showStartEnd ? `${trackId}_end` : null
        });
        return trackId;
    };

    /**
     * 从标记点生成轨迹
     * @param {Object} marker - 标记点对象
     * @param {Object} options - 轨迹选项
     * @returns {String} 轨迹ID
     */
    const generateTrackFromMarker = (marker, options = {}) => {
        if (!marker || !marker.coordinates) {
            console.warn('标记点数据无效');
            return null;
        }

        const {
            pointCount = 10,
            radius = 5,
            ...trackOptions
        } = options;

        // 生成轨迹点
        const trackPoints = generateRandomTrackPoints(
            marker.coordinates,
            pointCount,
            radius
        );

        return generateTrack(trackPoints, {
            ...trackOptions,
            markerId: marker.id
        });
    };

    /**
     * 开始轨迹动画
     * @param {String} trackId - 轨迹ID
     */
    const startTrackAnimation = (trackId) => {
        const track = tracks.value.find(t => t.id === trackId);
        if (!track || !track.animation) return;

        const feature = track.feature;
        const geometry = feature.getGeometry();
        const coordinates = geometry.getCoordinates();

        if (coordinates.length < 2) return;

        let currentIndex = 0;
        const animationDuration = 2000; // 2秒
        const stepDuration = animationDuration / coordinates.length;

        const animate = () => {
            if (currentIndex >= coordinates.length) {
                // 动画结束，恢复原始样式
                feature.setStyle(createTrackStyle(track.options.style || {}));
                return;
            }

            // 创建部分轨迹
            const partialCoordinates = coordinates.slice(0, currentIndex + 1);
            const partialLineString = new LineString(partialCoordinates);
            feature.setGeometry(partialLineString);

            // 设置动画样式
            feature.setStyle(createTrackStyle({
                ...trackConfig.animationStyle,
                ...track.options.style
            }));

            currentIndex++;
            setTimeout(animate, stepDuration);
        };

        animate();
    };

    /**
     * 停止轨迹动画
     * @param {String} trackId - 轨迹ID
     */
    const stopTrackAnimation = (trackId) => {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.animation = false;
            // 恢复原始样式
            track.feature.setStyle(createTrackStyle(track.options.style || {}));
        }
    };

    /**
     * 获取轨迹
     * @param {String} trackId - 轨迹ID
     * @returns {Object|null} 轨迹对象
     */
    const getTrack = (trackId) => {
        return tracks.value.find(track => track.id === trackId) || null;
    };

    /**
     * 获取所有轨迹
     * @returns {Array} 轨迹数组
     */
    const getAllTracks = () => {
        return tracks.value;
    };

    /**
     * 根据标记点ID获取轨迹
     * @param {String} markerId - 标记点ID
     * @returns {Array} 轨迹数组
     */
    const getTracksByMarker = (markerId) => {
        return tracks.value.filter(track => track.markerId === markerId);
    };

    /**
     * 移除轨迹
     * @param {String} trackId - 轨迹ID
     */
    const removeTrack = (trackId) => {
        if (!trackSource.value) return;

        const trackIndex = tracks.value.findIndex(t => t.id === trackId);
        if (trackIndex === -1) return;

        const track = tracks.value[trackIndex];

        // 移除轨迹线
        trackSource.value.removeFeature(track.feature);

        // 移除起点和终点标记
        const features = trackSource.value.getFeatures();
        features.forEach(feature => {
            if (feature.get('trackId') === trackId && feature.get('type') === 'track_point') {
                trackSource.value.removeFeature(feature);
            }
        });

        tracks.value.splice(trackIndex, 1);
    };

    /**
     * 清除所有轨迹
     */
    const clearTracks = () => {
        if (trackSource.value) {
            trackSource.value.clear();
        }
        tracks.value = [];
    };

    /**
     * 根据标记点清除轨迹
     * @param {String} markerId - 标记点ID
     */
    const clearTracksByMarker = (markerId) => {
        const tracksToRemove = tracks.value.filter(track => track.markerId === markerId);
        tracksToRemove.forEach(track => removeTrack(track.id));
    };

    /**
     * 切换轨迹可见性
     * @param {String} trackId - 轨迹ID
     * @param {Boolean} visible - 是否可见
     */
    const toggleTrackVisibility = (trackId, visible) => {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.visible = visible;
            track.feature.setVisible(visible);

            // 同时控制起点和终点标记的可见性
            const features = trackSource.value.getFeatures();
            features.forEach(feature => {
                if (feature.get('trackId') === trackId && feature.get('type') === 'track_point') {
                    feature.setVisible(visible);
                }
            });
        }
    };

    /**
     * 更新轨迹样式
     * @param {String} trackId - 轨迹ID
     * @param {Object} style - 样式选项
     */
    const updateTrackStyle = (trackId, style) => {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.options.style = { ...track.options.style, ...style };
            track.feature.setStyle(createTrackStyle({
                ...trackConfig.defaultStyle,
                ...track.options.style
            }));
        }
    };

    /**
     * 设置轨迹配置
     * @param {Object} config - 轨迹配置
     */
    const setTrackConfig = (config) => {
        Object.assign(trackConfig, config);
    };

    /**
     * 获取轨迹标记点
     * @param {String} trackId - 轨迹ID
     * @returns {Array} 轨迹标记点数组
     */
    const getTrackPoints = (trackId) => {
        if (!trackSource.value) return [];

        const features = trackSource.value.getFeatures();
        return features.filter(feature =>
            feature.get('trackId') === trackId &&
            feature.get('type') === 'track_point'
        );
    };

    /**
     * 根据类型获取轨迹标记点
     * @param {String} trackId - 轨迹ID
     * @param {String} pointType - 标记点类型 ('start' | 'end')
     * @returns {Feature|null} 轨迹标记点
     */
    const getTrackPointByType = (trackId, pointType) => {
        if (!trackSource.value) return null;

        const features = trackSource.value.getFeatures();
        return features.find(feature =>
            feature.get('trackId') === trackId &&
            feature.get('type') === 'track_point' &&
            feature.get('pointType') === pointType
        ) || null;
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

        tracks.value = [];
        trackLayer.value = null;
        trackSource.value = null;
    };

    return {
        // 状态
        tracks,
        trackLayer,
        trackSource,
        trackConfig,

        // 初始化
        initTrackLayer,

        // 轨迹生成
        generateTrack,
        generateTrackFromMarker,
        generateRandomTrackPoints,
        generateTrackRoute,
        startTrackRouteAnimation,
        clearTrackRoutes,

        // 轨迹管理
        getTrack,
        getAllTracks,
        getTracksByMarker,
        removeTrack,
        clearTracks,
        clearTracksByMarker,
        toggleTrackVisibility,
        updateTrackStyle,
        setTrackConfig,

        // 轨迹标记点
        getTrackPoints,
        getTrackPointByType,

        // 动画控制
        startTrackAnimation,
        stopTrackAnimation,

        // 样式
        createTrackStyle,

        // 销毁
        destroy,

    };
}
