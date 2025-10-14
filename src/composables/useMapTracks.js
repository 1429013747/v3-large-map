import { ref, reactive } from 'vue';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke, Text, Icon } from 'ol/style';
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
    const trackFeatureList = ref([]);

    // 动画轨迹数据
    const animationTrackLayer = ref(null);
    const animationTrackSource = ref(null);
    const animationFeatureList = ref([]);

    // 多个轨迹的动画状态管理
    const animationStates = reactive({});
    const animationFeatures = reactive({});
    const animationTimers = reactive({});

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

        // 初始化主轨迹图层
        trackSource.value = new VectorSource();
        trackLayer.value = new VectorLayer({
            source: trackSource.value,
            title: 'track-route',
            zIndex: 200 // 轨迹在标记点上方
        });

        // 初始化动画轨迹图层
        animationTrackSource.value = new VectorSource();
        animationTrackLayer.value = new VectorLayer({
            source: animationTrackSource.value,
            title: 'track-animation',
            zIndex: 201 // 动画轨迹在主轨迹上方
        });

        map.addLayer(trackLayer.value);
        map.addLayer(animationTrackLayer.value);
        console.log('轨迹图层初始化完成');
    };


    /**
     * 生成轨迹路线
     * @param {Array} coordinates - 坐标点数组 [[lng, lat], [lng, lat], ...]
     * @param {Object} options - 轨迹选项
     * @returns {Feature} 轨迹要素
     */
    const generateTrackRoute = async (coordinates, options = {}) => {
        if (!map || !trackSource.value) {
            console.warn('地图或轨迹图层未初始化');
            return null;
        }

        if (!coordinates || coordinates.length < 2) {
            console.warn('坐标点数量不足，至少需要2个点');
            return null;
        }

        const {
            showStart = true, // 是否显示起点
            showEnd = true, // 是否显示终点
            showMidpoint = false, // 是否显示中间点
            showTips = false, // 是否显示提示
            animation = true, // 是否启用动画
            animationDuration = 1000, // 动画持续时间
            id, // 轨迹ID
            style = { // 轨迹样式
                stroke: '#00ffff',
                strokeWidth: 3,
                // 设置实线
                lineDash: [],
                lineCap: 'round',
                lineJoin: 'round'
            }
        } = options;
        // 转换为地图坐标 WGS84
        const mapCoordinates = coordinates.map(coord => fromLonLat(coord.latLon));

        // 创建轨迹线 - 先显示完整轨迹
        const lineString = new LineString(mapCoordinates);
        const trackFeature = new Feature({
            geometry: lineString,
            type: 'track_route',
            trackId: id || generateUniqueTrackId()
        });

        // 设置轨迹样式 - 默认显示完整轨迹
        const trackStyle = new Style({
            stroke: new Stroke({
                color: style.stroke,
                width: style.strokeWidth,
                lineDash: style.lineDash,
                lineCap: style.lineCap,
                lineJoin: style.lineJoin
            })
        });

        trackFeature.setStyle(trackStyle);

        // 保存原始样式，用于后续显示/隐藏控制
        trackFeature.set('originalStyle', trackStyle);

        // 添加到轨迹图层
        trackSource.value.addFeature(trackFeature);
        trackFeatureList.value.push(trackFeature);

        // 添加起点和终点标记
        if (showStart) {
            // 起点
            onStartPoint(mapCoordinates, trackFeature.get('trackId'));
        }
        if (showMidpoint) {
            // 添加中间点标记
            coordinates.forEach((coord, index) => {
                const params = {
                    mapCoordinates,
                    currentIndex: index,
                    coordinates,
                    trackId: trackFeature.get('trackId'),
                    showTips
                }
                onMidpointPoint(params);
            });
        }
        if (showEnd) {
            // 终点
            onEndPoint(mapCoordinates, trackFeature.get('trackId'));
        }

        // 如果启用动画，开始轨迹动画
        if (animation) {
            const params = {
                trackFeature,
                mapCoordinates,
                animationDuration,
                coordinates,
                trackId: trackFeature.get('trackId'),
                showTips
            }
            await startTrackRouteAnimation(params);
        }

        console.log('轨迹路线生成成功，坐标点数量:', coordinates.length);
        return trackFeature;
    };

    /**
     * 开始轨迹路线动画
     * @param {Feature} trackFeature - 轨迹要素
     * @param {Array} mapCoordinates - 地图坐标数组
     * @param {Number} animationDuration - 动画持续时间
     * @param {Array} coordinates - 坐标点数组
     * @param {String} trackId - 轨迹ID
     * @returns {Promise} 动画状态
     */
    const startTrackRouteAnimation = (params) => {
        const { trackFeature, mapCoordinates, animationDuration, coordinates, trackId, showTips } = params;
        console.log("🚀 ~ startTrackRouteAnimation ~ trackFeature:", trackFeature)
        return new Promise((resolve, reject) => {
            if (!trackFeature || mapCoordinates.length < 2) return;

            // 停止该轨迹的现有动画（如果存在）
            stopTrackAnimationById(trackId);

            // 创建动画轨迹要素
            const animationFeature = new Feature({
                geometry: new LineString([]),
                type: 'track_animation',
                trackId: trackId
            });

            // 设置动画轨迹样式 - 使用动态颜色覆盖原轨迹
            const animationStyle = new Style({
                stroke: new Stroke({
                    color: '#62e884',
                    width: 4,
                    lineDash: [10, 5],
                    lineCap: 'round',
                    lineJoin: 'round'
                })
            });
            animationFeature.setStyle(animationStyle);
            animationFeature.set('originalStyle', animationStyle);

            // 添加到动画图层
            animationTrackSource.value.addFeature(animationFeature);
            animationFeatureList.value.push(animationFeature);

            // 为该轨迹创建独立的动画状态
            animationStates[trackId] = {
                isPlaying: true,
                isPaused: false,
                currentIndex: 0
            };
            animationFeatures[trackId] = animationFeature;

            const stepDuration = animationDuration;

            const animate = () => {
                const state = animationStates[trackId];
                if (!state) return;

                // 检查是否暂停
                if (state.isPaused) {
                    animationTimers[trackId] = setTimeout(animate, 100);
                    return;
                }

                // 检查是否停止
                if (!state.isPlaying || state.currentIndex >= mapCoordinates.length) {
                    // 清理该轨迹的动画状态
                    delete animationStates[trackId];
                    delete animationFeatures[trackId];
                    if (animationTimers[trackId]) {
                        clearTimeout(animationTimers[trackId]);
                        delete animationTimers[trackId];
                    }
                    resolve();
                    return;
                }
                const params = {
                    mapCoordinates,
                    currentIndex: state.currentIndex,
                    coordinates,
                    trackId,
                    showTips
                }
                // 添加中间点
                onMidpointPoint(params);

                // 创建部分轨迹 - 在动画图层中显示
                const partialCoordinates = mapCoordinates.slice(0, state.currentIndex + 1);
                const partialLineString = new LineString(partialCoordinates);
                animationFeature.setGeometry(partialLineString);

                state.currentIndex++;
                animationTimers[trackId] = setTimeout(animate, stepDuration);
            };

            animate();
        });
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
        const startStyle = new Style({
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
        });
        startFeature.setStyle(startStyle);
        startFeature.set('originalStyle', startStyle);
        trackSource.value.addFeature(startFeature);
    }
    //中间点标记
    const onMidpointPoint = (params) => {
        const { mapCoordinates, currentIndex, coordinates, trackId = null, showTips } = params;
        const point = new Point(mapCoordinates[currentIndex]);
        const feature = new Feature({
            geometry: point,
            type: 'track_point',
            pointType: 'midpoint',
            trackId: trackId,
        });
        const middleStyles = []
        middleStyles.push(new Style({
            image: new Circle({
                radius: 3,
                fill: new Fill({ color: '#d3603a' }),
            }),
            text: new Text({
                text: coordinates[currentIndex].text || '',
                font: 'bold 10px Arial',
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color: '#000000', width: 3 }),
                offsetY: -10,
                textAlign: 'center',
                textBaseline: 'middle',
                padding: [2, 4, 2, 4]
            })
        }));
        if (showTips && coordinates[currentIndex].tips) {
            middleStyles.push(new Style({
                image: new Icon({
                    src: '/src/assets/imgs/qb.png',
                    size: [100, 50], // 背景图片尺寸
                    anchor: [0.5, 0.5], // 锚点位置（背景中心对齐文本）
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    displacement: [9, 50], // 位置偏移
                    scale: 1, // 缩放比例
                    opacity: 1 // 透明度
                }),
                text: new Text({
                    text: coordinates[currentIndex].tips,
                    font: 'bold 12px Arial',
                    fill: new Fill({ color: '#000000' }),
                    offsetY: -62,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    padding: [2, 0, 2, 0]
                })

            }));
        }
        feature.setStyle(middleStyles);
        feature.set('originalStyle', middleStyles);
        //  trackSource.value.addFeature(feature);
        // 将中间点文字添加到动画图层，确保显示在轨迹线之上
        animationTrackSource.value.addFeature(feature);
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
        const endStyle = new Style({
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
        });
        endFeature.setStyle(endStyle);
        endFeature.set('originalStyle', endStyle);
        trackSource.value.addFeature(endFeature);
    }
    /**
     * 展示指定轨迹路线
     * @param {String} trackId - 轨迹ID
     * @param {Boolean} visible - 是否可见
     */
    const showTrackRoute = (trackId, visible) => {
        if (!trackSource.value) return;
        // 处理主轨迹图层中的要素
        const features = trackSource.value.getFeatures();

        // 查找主轨迹线（通过id匹配）
        const trackFeatures = features.filter(feature => feature.getProperties().trackId === trackId);

        trackFeatures.forEach(feature => {
            if (visible) {
                // 显示轨迹 - 恢复原始样式
                const originalStyle = feature.get('originalStyle');
                if (originalStyle) {
                    feature.setStyle(originalStyle);
                }
            } else {
                // 隐藏轨迹 - 设置透明样式
                feature.setStyle(new Style({
                    stroke: new Stroke({ color: 'transparent', width: 0 }),
                    image: new Circle({
                        radius: 0,
                        fill: new Fill({ color: 'transparent' }),
                        stroke: new Stroke({ color: 'transparent', width: 0 })
                    }),
                    text: new Text({
                        text: '',
                        font: '0px Arial',
                        fill: new Fill({ color: 'transparent' }),
                        stroke: new Stroke({ color: 'transparent', width: 0 })
                    })
                }));
            }
        });

        // 处理动画轨迹图层中的要素（包括中间点和动画轨迹）
        if (animationTrackSource.value) {
            const animationFeatures = animationTrackSource.value.getFeatures();
            const animationTrackFeatures = animationFeatures.filter(feature => {
                const properties = feature.getProperties();
                return properties.trackId === trackId;
            });

            animationTrackFeatures.forEach(feature => {
                if (visible) {
                    // 显示动画要素 - 恢复原始样式
                    const originalStyle = feature.get('originalStyle');
                    if (originalStyle) {
                        feature.setStyle(originalStyle);
                    }
                } else {
                    // 隐藏动画要素 - 设置透明样式
                    const properties = feature.getProperties();
                    if (properties.type === 'track_animation') {
                        // 动画轨迹线
                        feature.setStyle(new Style({
                            stroke: new Stroke({ color: 'transparent', width: 0 }),
                        }));
                    } else if (properties.type === 'track_point') {
                        // 轨迹点（中间点）
                        feature.setStyle(new Style({
                            image: new Circle({
                                radius: 0,
                                fill: new Fill({ color: 'transparent' }),
                                stroke: new Stroke({ color: 'transparent', width: 0 })
                            }),
                            text: new Text({
                                text: '',
                                font: '0px Arial',
                                fill: new Fill({ color: 'transparent' }),
                                stroke: new Stroke({ color: 'transparent', width: 0 })
                            })
                        }));
                    }
                }
            });
        }

        console.log(`轨迹 ${trackId} 可见性设置为: ${visible}`);
    }

    /**
     * 获取轨迹的当前可见状态
     * @param {String} trackId - 轨迹ID
     * @returns {Boolean} 是否可见
     */
    const getTrackVisibility = (trackId) => {
        if (!trackSource.value) return;
        const features = trackSource.value.getFeatures();
        const trackFeature = features.find(feature => feature.getProperties().trackId === trackId);

        if (trackFeature) {
            const currentStyle = trackFeature.getStyle();
            const stroke = currentStyle.getStroke();
            // 如果颜色是透明的或者宽度为0，则认为不可见
            return stroke && stroke.getColor() !== 'transparent' && stroke.getWidth() > 0;
        }

        return false;
    }

    /**
     * 切换指定轨迹的显示状态
     * @param {String} trackId - 轨迹ID
     * @returns {Boolean} 新的可见状态
     */
    const toggleTrackRoute = (trackId) => {
        if (!trackId) return;
        const currentVisibility = getTrackVisibility(trackId);
        showTrackRoute(trackId, !currentVisibility);
        return !currentVisibility;
    }

    /**
     * 移除指定轨迹路线
     * @param {String} trackId - 轨迹ID
     */
    const removeTrackRoute = (trackId) => {
        if (!trackSource.value) return;
        return new Promise((resolve, reject) => {
            // 先停止该轨迹的动画
            stopTrackAnimationById(trackId);

            const features = trackSource.value.getFeatures();

            // 移除轨迹路线
            const trackFeature = features.find(feature => feature.getProperties().trackId === trackId);
            if (trackFeature) {
                trackSource.value.removeFeature(trackFeature);
            }
            trackFeatureList.value = trackFeatureList.value.filter(val => val !== trackFeature)

            // 移除与当前轨迹相关的轨迹点（起点、终点、中间点）
            const trackPoints = features.filter(feature => {
                const properties = feature.getProperties();
                return properties.type === 'track_point' && properties.trackId === trackId;
            });

            trackPoints.forEach(point => {
                trackSource.value.removeFeature(point);
            });

            // 移除动画图层中的相关要素（包括中间点文字）
            const animationFeatures = animationTrackSource.value.getFeatures();
            animationFeatures.forEach(feature => {
                if (feature.getProperties().trackId === trackId) {
                    animationTrackSource.value.removeFeature(feature);
                }
            });

            // 清理动画要素列表
            animationFeatureList.value = animationFeatureList.value.filter(feature =>
                feature.getProperties().trackId !== trackId
            );
            resolve(trackId);
        });
    }

    /**
     * 清除所有轨迹路线
     */
    const clearTrackRoutes = () => {
        if (!trackSource.value) return;

        // 停止所有动画
        stopTrackAnimation();

        // 清除主轨迹图层
        const features = trackSource.value.getFeatures();
        features.forEach(feature => {
            if (feature.get('type') === 'track_route' || feature.get('type') === 'track_point') {
                trackSource.value.removeFeature(feature);
            }
        });
        trackFeatureList.value = [];

        // 清除动画轨迹图层
        if (animationTrackSource.value) {
            const animationFeatures = animationTrackSource.value.getFeatures();
            animationFeatures.forEach(feature => {
                animationTrackSource.value.removeFeature(feature);
            });
            animationFeatureList.value = [];
        }
    };

    /**
     * 销毁轨迹图层
     */
    const destroy = () => {
        // 停止所有动画
        stopTrackAnimation();

        if (map && trackLayer.value) {
            map.removeLayer(trackLayer.value);
        }

        if (map && animationTrackLayer.value) {
            map.removeLayer(animationTrackLayer.value);
        }

        if (trackSource.value) {
            trackSource.value.clear();
        }

        if (animationTrackSource.value) {
            animationTrackSource.value.clear();
        }

        // 清理所有状态
        trackLayer.value = null;
        trackSource.value = null;
        animationTrackLayer.value = null;
        animationTrackSource.value = null;
        trackFeatureList.value = [];
        animationFeatureList.value = [];

        // 清理动画状态
        Object.keys(animationStates).forEach(key => delete animationStates[key]);
        Object.keys(animationFeatures).forEach(key => delete animationFeatures[key]);
        Object.keys(animationTimers).forEach(key => {
            clearTimeout(animationTimers[key]);
            delete animationTimers[key];
        });
    };

    /**
     * 检查轨迹ID是否唯一
     * @param {String} id - 轨迹ID
     * @returns {Boolean} 是否唯一
     */
    const isTrackIdUnique = (id) => {
        return !trackSource.value.getFeatures().some(feature => feature.getProperties().trackId === id);
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

    /**
     * 停止指定轨迹的动画
     * @param {String} trackId - 轨迹ID
     */
    const stopTrackAnimationById = (trackId) => {
        if (animationTimers[trackId]) {
            clearTimeout(animationTimers[trackId]);
            delete animationTimers[trackId];
        }

        // 移除该轨迹的动画要素
        if (animationFeatures[trackId]) {
            animationTrackSource.value.removeFeature(animationFeatures[trackId]);
            const index = animationFeatureList.value.indexOf(animationFeatures[trackId]);
            if (index > -1) {
                animationFeatureList.value.splice(index, 1);
            }
            delete animationFeatures[trackId];
        }

        // 清理该轨迹的动画状态
        delete animationStates[trackId];
        console.log(`轨迹 ${trackId} 的动画已停止`);
    };

    /**
     * 暂停指定轨迹的动画
     * @param {String} trackId - 轨迹ID
     */
    const pauseTrackAnimationById = (trackId) => {
        const state = animationStates[trackId];
        if (state && state.isPlaying && !state.isPaused) {
            state.isPaused = true;
            console.log(`轨迹 ${trackId} 的动画已暂停`);
        }
    };

    /**
     * 恢复指定轨迹的动画
     * @param {String} trackId - 轨迹ID
     */
    const resumeTrackAnimationById = (trackId) => {
        const state = animationStates[trackId];
        if (state && state.isPlaying && state.isPaused) {
            state.isPaused = false;
            console.log(`轨迹 ${trackId} 的动画已恢复`);
        }
    };

    /**
     * 暂停所有轨迹动画
     */
    const pauseTrackAnimation = () => {
        Object.keys(animationStates).forEach(trackId => {
            pauseTrackAnimationById(trackId);
        });
    };

    /**
     * 恢复所有轨迹动画
     */
    const resumeTrackAnimation = () => {
        Object.keys(animationStates).forEach(trackId => {
            resumeTrackAnimationById(trackId);
        });
    };

    /**
     * 停止所有轨迹动画
     */
    const stopTrackAnimation = () => {
        Object.keys(animationStates).forEach(trackId => {
            stopTrackAnimationById(trackId);
        });
    };

    /**
     * 切换指定轨迹的动画播放状态
     * @param {String} trackId - 轨迹ID
     */
    const toggleTrackAnimationById = (trackId) => {
        const state = animationStates[trackId];
        if (state && state.isPlaying) {
            if (state.isPaused) {
                resumeTrackAnimationById(trackId);
            } else {
                pauseTrackAnimationById(trackId);
            }
        } else {
            console.log(`轨迹 ${trackId} 没有正在播放的动画`);
        }
    };

    /**
     * 切换所有轨迹动画播放状态
     */
    const toggleTrackAnimation = () => {
        const hasPlayingAnimations = Object.keys(animationStates).length > 0;
        if (hasPlayingAnimations) {
            const anyPaused = Object.values(animationStates).some(state => state.isPaused);
            if (anyPaused) {
                resumeTrackAnimation();
            } else {
                pauseTrackAnimation();
            }
        } else {
            console.log('没有正在播放的动画');
        }
    };

    /**
     * 获取当前正在运行的动画信息
     * @returns {Object} 动画信息
     */
    const getActiveAnimations = () => {
        const activeAnimations = {};
        Object.keys(animationStates).forEach(trackId => {
            const state = animationStates[trackId];
            activeAnimations[trackId] = {
                isPlaying: state.isPlaying,
                isPaused: state.isPaused,
                currentIndex: state.currentIndex,
                color: '#62e884'
            };
        });
        return activeAnimations;
    };

    /**
     * 获取动画统计信息
     * @returns {Object} 统计信息
     */
    const getAnimationStats = () => {
        const totalAnimations = Object.keys(animationStates).length;
        const playingAnimations = Object.values(animationStates).filter(state => state.isPlaying && !state.isPaused).length;
        const pausedAnimations = Object.values(animationStates).filter(state => state.isPlaying && state.isPaused).length;

        return {
            total: totalAnimations,
            playing: playingAnimations,
            paused: pausedAnimations,
            stopped: totalAnimations - playingAnimations - pausedAnimations
        };
    };

    return {
        // 状态
        trackLayer,
        trackSource,
        trackConfig,
        trackFeatureList,
        // 动画状态
        animationTrackLayer,
        animationTrackSource,
        animationFeatureList,
        animationStates,
        animationFeatures,
        animationTimers,
        // 初始化
        initTrackLayer,

        // 轨迹生成
        generateTrackRoute,
        startTrackRouteAnimation,
        clearTrackRoutes,
        showTrackRoute,
        getTrackVisibility,
        toggleTrackRoute,
        removeTrackRoute,
        // 动画控制 - 全局
        pauseTrackAnimation,
        resumeTrackAnimation,
        stopTrackAnimation,
        toggleTrackAnimation,
        // 动画控制 - 按轨迹ID
        pauseTrackAnimationById,
        resumeTrackAnimationById,
        stopTrackAnimationById,
        toggleTrackAnimationById,
        // 动画信息
        getActiveAnimations,
        getAnimationStats,
        // 销毁
        destroy,

    };
}
