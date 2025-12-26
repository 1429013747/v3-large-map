import { reactive, ref } from 'vue';
import { Feature } from 'ol';
import { LineString, Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Overlay from 'ol/Overlay';

/**
 * 地图轨迹管理Hook
 * @param {object} map - OpenLayers地图实例
 * @returns {object} 轨迹管理方法和状态
 */
export function useMapTracks(map) {
  // 轨迹数据
  const trackLayer = ref(null);
  const trackSource = ref(null);
  const trackFeatureList = ref([]);
  const speedValue = ref(null);

  // 动画轨迹数据
  const animationTrackLayer = ref(null);
  const animationTrackSource = ref(null);
  const animationFeatureList = ref([]);

  // 多个轨迹的动画状态管理
  const animationStates = reactive({});
  const animationFeatures = reactive({});
  const animationTimers = reactive({});
  const animationCarFeatures = reactive({}); // 动画小车标记

  // 轨迹删除按钮 overlay 管理
  const trackDeleteOverlays = reactive({}); // 存储每个轨迹的删除按钮 overlay
  // 起点和终点 overlay 管理
  const trackPointOverlays = reactive({}); // 存储每个轨迹的起点和终点 overlay
  let globalPointerMoveHandler = null; // 全局鼠标移动事件处理器

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
   * 平滑轨迹坐标点，使转弯更圆润
   * @param {Array} coordinates - 坐标点数组 [[x, y], [x, y], ...]
   * @param {number} smoothness - 平滑度，控制插值点数量，默认5
   * @returns {object} { smoothed: 平滑后的坐标点数组, originalIndices: 原始点在平滑后数组中的索引映射 }
   */
  const smoothCoordinates = (coordinates, smoothness = 5) => {
    if (!coordinates || coordinates.length < 2) {
      return { smoothed: coordinates, originalIndices: coordinates.map((_, i) => i) };
    }

    // 如果只有2个点，直接返回
    if (coordinates.length === 2) {
      return { smoothed: coordinates, originalIndices: [0, 1] };
    }

    const smoothed = [];
    const originalIndices = []; // 记录原始点在平滑后数组中的索引

    // 添加第一个点
    smoothed.push(coordinates[0]);
    originalIndices.push(0);

    // 对每两个相邻点之间进行平滑插值
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p0 = i > 0 ? coordinates[i - 1] : coordinates[i];
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      const p3 = i < coordinates.length - 2 ? coordinates[i + 2] : coordinates[i + 1];

      // 使用 Catmull-Rom 样条曲线进行插值
      for (let j = 1; j <= smoothness; j++) {
        const t = j / (smoothness + 1);
        const t2 = t * t;
        const t3 = t2 * t;

        // Catmull-Rom 样条曲线公式
        const x = 0.5 * (
          (2 * p1[0]) +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
        );

        const y = 0.5 * (
          (2 * p1[1]) +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
        );

        smoothed.push([x, y]);
      }

      // 添加当前段的终点（下一个原始点）
      smoothed.push(coordinates[i + 1]);
      originalIndices.push(smoothed.length - 1);
    }

    return { smoothed, originalIndices };
  };

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
      type: 'track-route',
      zIndex: 200 // 轨迹在标记点上方
    });

    // 初始化动画轨迹图层
    animationTrackSource.value = new VectorSource();
    animationTrackLayer.value = new VectorLayer({
      source: animationTrackSource.value,
      title: 'track-route',
      type: 'track-route',
      zIndex: 300 // 动画轨迹在主轨迹上方，提高层级确保小车显示在最上层
    });

    map.addLayer(trackLayer.value);
    map.addLayer(animationTrackLayer.value);
    console.log('轨迹图层初始化完成');
  };

  /**
   * 生成轨迹路线
   * @param {Array} coordinates - 坐标点数组 [[lng, lat], [lng, lat], ...]
   * @param {object} options - 轨迹选项
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
      animation = true, // 是否启用动画
      animationDuration = 1000, // 动画持续时间
      trackIcon,
      id, // 轨迹ID
      type = 'track-route', // 轨迹类型
      style = {
        // 轨迹样式
        stroke: '#00ffff',
        strokeWidth: 3,
        // 设置实线
        lineDash: [],
        lineCap: 'round',
        lineJoin: 'round'
      }
    } = options;
    // 转换为地图坐标 WGS84
    const originalMapCoordinates = coordinates.map((coord) => fromLonLat(coord.latLon));
    // 平滑轨迹坐标，使转弯更圆润
    const { smoothed: mapCoordinates, originalIndices } = smoothCoordinates(originalMapCoordinates, 5);
    // 创建轨迹线 - 先显示完整轨迹
    const lineString = new LineString(mapCoordinates);
    const trackFeature = new Feature({
      geometry: lineString,
      type: type,
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

    // 为轨迹添加删除按钮功能
    const trackId = trackFeature.get('trackId');
    setupTrackDeleteButton(trackFeature, trackId, mapCoordinates);

    // 先添加中间点标记（如果启用）
    if (showMidpoint) {
      // 添加中间点标记，使用平滑后的坐标
      coordinates.forEach((coord, index) => {
        // 找到原始坐标在平滑后坐标中的位置
        const smoothedIndex = originalIndices[index];
        const smoothedCoord = mapCoordinates[smoothedIndex];
        const params = {
          coord,
          coordinates,
          trackId: trackFeature.get('trackId'),
          smoothedCoord, // 传递平滑后的坐标
        };
        onMidpointPoint(params, style);
      });
    }

    // 最后添加起点和终点标记，确保显示在最上层
    if (showStart) {
      // 起点
      onStartPoint(mapCoordinates, trackFeature.get('trackId'), showStart, coordinates);
    }
    if (showEnd) {
      // 终点
      onEndPoint(mapCoordinates, trackFeature.get('trackId'), showEnd, coordinates);
    }

    // 如果启用动画，开始轨迹动画
    if (animation) {
      const params = {
        trackFeature,
        mapCoordinates,
        animationDuration,
        coordinates,
        trackId: trackFeature.get('trackId'),
        showMidpoint,
        trackIcon
      };
      await startTrackRouteAnimation(params);
    }

    console.log('轨迹路线生成成功，坐标点数量:', coordinates.length);
    return trackFeature;
  };

  /**
   * 开始轨迹路线动画
   * @param {Feature} trackFeature - 轨迹要素
   * @param {Array} mapCoordinates - 地图坐标数组
   * @param {number} animationDuration - 动画持续时间
   * @param {Array} coordinates - 坐标点数组
   * @param {string} trackId - 轨迹ID
   * @returns {Promise} 动画状态
   */
  const startTrackRouteAnimation = (params) => {
    const { trackFeature, mapCoordinates, animationDuration, coordinates, trackId, trackIcon } =
      params;
    return new Promise((resolve, reject) => {
      if (!trackFeature || mapCoordinates.length < 2) return;

      // 停止该轨迹的现有动画（如果存在）
      // stopTrackAnimationById(trackId);

      // 创建动画轨迹要素
      const animationFeature = new Feature({
        geometry: new LineString([]),
        type: 'track-animation',
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

      if (trackIcon) {
        // 创建小车标记
        const carFeature = new Feature({
          geometry: new Point(mapCoordinates[0]),
          type: 'track-car',
          trackId: trackId,
        });

        // 设置小车图标样式
        const carStyle = new Style({
          zIndex: 999999, // 设置小车样式层级，确保显示在最上层
          image: new Icon({
            src: '/src/assets/imgs/car.png',
            scale: 0.8,
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            rotation: 0 // 初始旋转角度
          })
        });
        carFeature.setStyle(carStyle);
        animationTrackSource.value.addFeature(carFeature);
        animationCarFeatures[trackId] = carFeature;
      }

      // 为该轨迹创建独立的动画状态
      animationStates[trackId] = {
        isPlaying: true,
        isPaused: false,
        currentIndex: 0,
        total: coordinates.length
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
          if (animationCarFeatures[trackId]) {
            animationTrackSource.value.removeFeature(animationCarFeatures[trackId]);
            delete animationCarFeatures[trackId];
          }
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
        };

        // 创建部分轨迹 - 在动画图层中显示
        const partialCoordinates = mapCoordinates.slice(0, state.currentIndex + 1);
        const partialLineString = new LineString(partialCoordinates);
        animationFeature.setGeometry(partialLineString);

        // 更新小车位置
        if (animationCarFeatures[trackId] && trackIcon) {
          const currentCoord = mapCoordinates[state.currentIndex];
          const carPoint = new Point(currentCoord);
          animationCarFeatures[trackId].setGeometry(carPoint);

          // 计算小车旋转角度（根据当前点和下一个点的方向）
          if (state.currentIndex < mapCoordinates.length - 1) {
            // 更新小车样式
            const carStyle = new Style({
              zIndex: 999999, // 设置小车样式层级，确保显示在最上层
              image: new Icon({
                src: '/src/assets/imgs/markIcons/icon10.png',
                scale: 0.8,
                anchor: [0.5, 0.5],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
              })
            });
            animationCarFeatures[trackId].setStyle(carStyle);
          }
        }

        state.currentIndex++;
        animationStates[trackId].speed = coordinates[state.currentIndex]?.speed;
        animationTimers[trackId] = setTimeout(animate, speedValue.value || stepDuration);
      };

      animate();
    });
  };

  // 起点标记
  const onStartPoint = (mapCoordinates, trackId = null, showStart, coordinates = []) => {
    if (!map) return;

    const startCoord = mapCoordinates[0];
    // 获取位置名称，优先使用坐标数据中的名称，否则使用默认文本
    const locationName = (typeof showStart === 'string' ? showStart : '');

    // 创建起点标记容器
    const startContainer = document.createElement('div');
    startContainer.className = 'track-start-point';
    startContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0;
      pointer-events: none;
    `;

    // 创建蓝色"始"按钮
    const startButton = document.createElement('div');
    startButton.className = 'track-start-button';
    startButton.textContent = '始';
    startButton.style.cssText = locationName
      ? `
      width: 32px;
      height: 32px;
      background-color: #1890ff;
      color: #ffffff;
      border-radius: 4px 0 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    `
      : `
      width: 32px;
      height: 32px;
      background-color: #1890ff;
      color: #ffffff;
      border-radius:50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    `

    // 创建位置名称文本框
    const nameBox = document.createElement('div');
    nameBox.className = 'track-start-name';
    nameBox.textContent = locationName;
    nameBox.title = locationName;
    nameBox.style.cssText = `
      background-color: #ffffff;
      color: #000000;
      padding: 0px 12px;
      border-radius: 0 4px 4px 0;
      font-size: 14px;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
      height: 32px;
      line-height: 32px;
      pointer-events: auto;
      cursor: pointer;
    `;

    // 组装元素
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
    `;
    wrapper.appendChild(startButton);
    locationName && wrapper.appendChild(nameBox);

    // 创建蓝色圆形标记（放在文本框下方）
    const marker = document.createElement('div');
    marker.className = 'track-start-marker';
    marker.style.cssText = `
      width: 8px;
      height: 8px;
      background-color: #1890ff;
      border-radius: 50%;
      position: absolute;
      left: 50%;
      top: 100%;
      transform: translateX(-50%);
      margin-top: 4px;
    `;
    nameBox.appendChild(marker);

    startContainer.appendChild(wrapper);

    // 创建 overlay
    const startOverlay = new Overlay({
      element: startContainer,
      positioning: 'bottom-center',
      offset: [0, -12],
      stopEvent: false
    });

    // 设置位置
    startOverlay.setPosition(startCoord);
    map.addOverlay(startOverlay);

    // 保存 overlay 引用
    if (!trackPointOverlays[trackId]) {
      trackPointOverlays[trackId] = {};
    }
    trackPointOverlays[trackId].start = startOverlay;

    // 同时创建一个圆形标记点用于定位
    const startPoint = new Point(startCoord);
    const startFeature = new Feature({
      geometry: startPoint,
      type: 'track-point',
      pointType: 'start',
      trackId: trackId
    });
    const startStyle = new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({ color: '#1890ff' }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 1
        })
      })
    });
    startFeature.setStyle(startStyle);

    // 添加到动画图层，确保显示在最上层
    if (animationTrackSource.value) {
      animationTrackSource.value.addFeature(startFeature);
    } else {
      trackSource.value.addFeature(startFeature);
    }
  };
  // 中间点标记
  const onMidpointPoint = (params, style) => {
    const { coord, coordinates, trackId = null, smoothedCoord } = params;
    // 如果提供了平滑后的坐标，使用平滑后的坐标；否则使用原始坐标
    const pointCoord = smoothedCoord || fromLonLat(coord.latLon);
    const point = new Point(pointCoord);
    const feature = new Feature({
      geometry: point,
      type: 'track-point',
      pointType: 'midpoint',
      trackId: trackId
    });
    const middleStyles = [];
    if (coord.text) {
      middleStyles.push(
        new Style({
          image: new Circle({
            radius: 3,
            fill: new Fill({ color: style.stroke })
          }),
          text: new Text({
            text: coord.text,
            font: 'bold 10px Arial',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#000000', width: 3 }),
            offsetY: -10,
            textAlign: 'center',
            textBaseline: 'middle',
            padding: [2, 4, 2, 4]
          })
        })
      );
    }
    if (coord.tips) {
      middleStyles.push(
        new Style({
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
            text: coord.tips,
            font: 'bold 12px Arial',
            fill: new Fill({ color: '#000000' }),
            offsetY: -62,
            textAlign: 'center',
            textBaseline: 'middle',
            padding: [2, 0, 2, 0]
          })
        })
      );
    }
    feature.setStyle(middleStyles);
    feature.set('originalStyle', middleStyles);
    //  trackSource.value.addFeature(feature);
    // 将中间点文字添加到动画图层，确保显示在轨迹线之上
    animationTrackSource.value.addFeature(feature);
  };
  // 终点标记
  const onEndPoint = (mapCoordinates, trackId = null, showEnd, coordinates = []) => {
    if (!map) return;

    const endCoord = mapCoordinates[mapCoordinates.length - 1];
    // 获取位置名称，优先使用坐标数据中的名称，否则使用默认文本
    const locationName = (typeof showEnd === 'string' ? showEnd : '');

    // 创建终点标记容器
    const endContainer = document.createElement('div');
    endContainer.className = 'track-end-point';
    endContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0;
      pointer-events: none;
    `;

    // 创建蓝色"终"按钮
    const endButton = document.createElement('div');
    endButton.className = 'track-end-button';
    endButton.textContent = '终';
    endButton.style.cssText = locationName
      ? `
      width: 32px;
      height: 32px;
      background-color: #ff7a00;
      color: #ffffff;
      border-radius: 4px 0 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    `
      : `
      width: 32px;
      height: 32px;
      background-color: #ff7a00;
      color: #ffffff;
      border-radius:50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
    `;

    // 创建位置名称文本框
    const nameBox = document.createElement('div');
    nameBox.className = 'track-end-name';
    nameBox.textContent = locationName;
    nameBox.title = locationName;
    nameBox.style.cssText = `
      background-color: #ffffff;
      color: #000000;
      padding: 0px 12px;
      border-radius: 0 4px 4px 0;
      font-size: 14px;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
      height: 32px;
      line-height: 32px;
      pointer-events: auto;
      cursor: pointer;
    `;

    // 组装元素
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
    `;
    wrapper.appendChild(endButton);
    locationName && wrapper.appendChild(nameBox);

    // 创建蓝色圆形标记（放在文本框下方）
    const marker = document.createElement('div');
    marker.className = 'track-end-marker';
    marker.style.cssText = `
      width: 8px;
      height: 8px;
      background-color: #ff7a00;
      border-radius: 50%;
      position: absolute;
      left: 50%;
      top: 100%;
      transform: translateX(-50%);
      margin-top: 4px;
    `;
    nameBox.appendChild(marker);

    endContainer.appendChild(wrapper);

    // 创建 overlay
    const endOverlay = new Overlay({
      element: endContainer,
      positioning: 'bottom-center',
      offset: [0, -12],
      stopEvent: false
    });

    // 设置位置
    endOverlay.setPosition(endCoord);
    map.addOverlay(endOverlay);

    // 保存 overlay 引用
    if (!trackPointOverlays[trackId]) {
      trackPointOverlays[trackId] = {};
    }
    trackPointOverlays[trackId].end = endOverlay;

    // 同时创建一个圆形标记点用于定位
    const endPoint = new Point(endCoord);
    const endFeature = new Feature({
      geometry: endPoint,
      type: 'track-point',
      pointType: 'end',
      trackId: trackId
    });
    const endStyle = new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({ color: '#ff7a00' }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 1
        })
      })
    });
    endFeature.setStyle(endStyle);

    // 添加到动画图层，确保显示在最上层
    if (animationTrackSource.value) {
      animationTrackSource.value.addFeature(endFeature);
    } else {
      trackSource.value.addFeature(endFeature);
    }
  };

  /**
   * 为轨迹设置删除按钮功能
   * @param {Feature} trackFeature - 轨迹要素
   * @param {string} trackId - 轨迹ID
   * @param {Array} mapCoordinates - 地图坐标数组
   */
  const setupTrackDeleteButton = (trackFeature, trackId, mapCoordinates) => {
    if (!map || !trackLayer.value) return;

    // 创建删除按钮元素
    const deleteButtonElement = document.createElement('div');
    deleteButtonElement.className = 'track-delete-button';
    deleteButtonElement.innerHTML = '×';
    deleteButtonElement.style.cssText = `
      position: absolute;
      width: 24px;
      height: 24px;
      background-color: #ff4d4f;
      color: #fff;
      border-radius: 50%;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      line-height: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      transition: all 0.2s;
      user-select: none;
    `;
    deleteButtonElement.addEventListener('mouseenter', () => {
      deleteButtonElement.style.backgroundColor = '#ff7875';
      deleteButtonElement.style.transform = 'scale(1.1)';
    });
    deleteButtonElement.addEventListener('mouseleave', () => {
      deleteButtonElement.style.backgroundColor = '#ff4d4f';
      deleteButtonElement.style.transform = 'scale(1)';
    });
    deleteButtonElement.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTrackRoute(trackId);
    });

    // 获取轨迹起点坐标（第一个坐标点）
    const startCoordinate = mapCoordinates[0];

    // 创建 overlay，固定在起点位置
    const deleteOverlay = new Overlay({
      element: deleteButtonElement,
      positioning: 'center-center',
      stopEvent: false,
      offset: [-10, -10]
    });
    map.addOverlay(deleteOverlay);
    trackDeleteOverlays[trackId] = {
      overlay: deleteOverlay,
      startCoordinate: startCoordinate
    };

    // 初始隐藏删除按钮
    deleteOverlay.setPosition(undefined);

    // 设置全局鼠标移动事件处理器（只添加一次）
    if (!globalPointerMoveHandler) {
      globalPointerMoveHandler = (event) => {
        const pixel = event.pixel;
        let hoveredTrackId = null;

        // 检查鼠标是否在任何轨迹上
        map.forEachFeatureAtPixel(pixel, (feature) => {
          if (feature.get('type') === 'track-route') {
            const featureTrackId = feature.get('trackId');
            if (trackDeleteOverlays[featureTrackId]) {
              hoveredTrackId = featureTrackId;
            }
            return true; // 找到第一个匹配的轨迹就返回
          }
          return false;
        }, {
          layerFilter: (layer) => {
            return layer === trackLayer.value;
          },
          hitTolerance: 5 // 增加点击容差，使鼠标更容易触发
        });

        // 显示当前悬停的轨迹的删除按钮（固定在起点），隐藏其他的
        Object.keys(trackDeleteOverlays).forEach((tid) => {
          const deleteButtonData = trackDeleteOverlays[tid];
          const overlay = deleteButtonData.overlay;
          const element = overlay.getElement();
          if (tid === hoveredTrackId) {
            // 显示在起点位置
            overlay.setPosition(deleteButtonData.startCoordinate);
            element.style.display = 'flex';
          } else {
            overlay.setPosition(undefined);
            element.style.display = 'none';
          }
        });
      };

      // 在地图上添加全局鼠标移动事件监听
      map.on('pointermove', globalPointerMoveHandler);
    }
  };

  /**
   * 展示指定轨迹路线
   * @param {string} trackId - 轨迹ID
   * @param {boolean} visible - 是否可见
   */
  const showTrackRoute = (trackId, visible) => {
    if (!trackSource.value) return;
    // 处理主轨迹图层中的要素
    const features = trackSource.value.getFeatures();

    // 查找主轨迹线（通过id匹配）
    const trackFeatures = features.filter((feature) => feature.getProperties().trackId === trackId);

    trackFeatures.forEach((feature) => {
      if (visible) {
        // 显示轨迹 - 恢复原始样式
        const originalStyle = feature.get('originalStyle');
        if (originalStyle) {
          feature.setStyle(originalStyle);
        }
      } else {
        // 隐藏轨迹 - 设置透明样式
        feature.setStyle(
          new Style({
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
          })
        );
      }
    });

    // 处理动画轨迹图层中的要素（包括中间点和动画轨迹）
    if (animationTrackSource.value) {
      const animationFeatures = animationTrackSource.value.getFeatures();
      const animationTrackFeatures = animationFeatures.filter((feature) => {
        const properties = feature.getProperties();
        return properties.trackId === trackId;
      });

      animationTrackFeatures.forEach((feature) => {
        if (visible) {
          // 显示动画要素 - 恢复原始样式
          const originalStyle = feature.get('originalStyle');
          if (originalStyle) {
            feature.setStyle(originalStyle);
          }
        } else {
          // 隐藏动画要素 - 设置透明样式
          const properties = feature.getProperties();
          if (properties.type === 'track-animation') {
            // 动画轨迹线
            feature.setStyle(
              new Style({
                stroke: new Stroke({ color: 'transparent', width: 0 })
              })
            );
          } else if (properties.type === 'track-point') {
            // 轨迹点（中间点）
            feature.setStyle(
              new Style({
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
              })
            );
          }
        }
      });
    }

    console.log(`轨迹 ${trackId} 可见性设置为: ${visible}`);
  };

  /**
   * 获取轨迹的当前可见状态
   * @param {string} trackId - 轨迹ID
   * @returns {boolean} 是否可见
   */
  const getTrackVisibility = (trackId) => {
    if (!trackSource.value) return;
    const features = trackSource.value.getFeatures();
    const trackFeature = features.find((feature) => feature.getProperties().trackId === trackId);

    if (trackFeature) {
      const currentStyle = trackFeature.getStyle();
      const stroke = currentStyle.getStroke();
      // 如果颜色是透明的或者宽度为0，则认为不可见
      return stroke && stroke.getColor() !== 'transparent' && stroke.getWidth() > 0;
    }

    return false;
  };

  /**
   * 切换指定轨迹的显示状态
   * @param {string} trackId - 轨迹ID
   * @returns {boolean} 新的可见状态
   */
  const toggleTrackRoute = (trackId) => {
    if (!trackId) return;
    const currentVisibility = getTrackVisibility(trackId);
    showTrackRoute(trackId, !currentVisibility);
    return !currentVisibility;
  };

  /**
   * 移除指定轨迹路线
   * @param {string} trackId - 轨迹ID
   */
  const removeTrackRoute = (trackId) => {
    if (!trackSource.value) return;
    return new Promise((resolve, reject) => {
      // 先停止该轨迹的动画
      stopTrackAnimationById(trackId);

      const features = trackSource.value.getFeatures();

      // 移除轨迹路线
      const trackFeature = features.find((feature) => feature.getProperties().trackId === trackId);

      // 移除删除按钮 overlay（在移除 feature 之前）
      if (trackDeleteOverlays[trackId]) {
        const deleteButtonData = trackDeleteOverlays[trackId];
        // 移除 overlay
        map.removeOverlay(deleteButtonData.overlay);
        delete trackDeleteOverlays[trackId];
      }

      // 移除起点和终点 overlay
      if (trackPointOverlays[trackId]) {
        if (trackPointOverlays[trackId].start) {
          map.removeOverlay(trackPointOverlays[trackId].start);
        }
        if (trackPointOverlays[trackId].end) {
          map.removeOverlay(trackPointOverlays[trackId].end);
        }
        delete trackPointOverlays[trackId];
      }

      if (trackFeature) {
        trackSource.value.removeFeature(trackFeature);
      }
      trackFeatureList.value = trackFeatureList.value.filter((val) => val !== trackFeature);

      // 移除与当前轨迹相关的轨迹点（起点、终点、中间点）
      const trackPoints = features.filter((feature) => {
        const properties = feature.getProperties();
        return properties.type === 'track-point' && properties.trackId === trackId;
      });

      trackPoints.forEach((point) => {
        trackSource.value.removeFeature(point);
      });

      // 移除动画图层中的相关要素（包括中间点文字和小车标记）
      const animationFeatures = animationTrackSource.value.getFeatures();
      animationFeatures.forEach((feature) => {
        if (feature.getProperties().trackId === trackId) {
          animationTrackSource.value.removeFeature(feature);
        }
      });

      // 移除小车标记
      if (animationCarFeatures[trackId]) {
        animationTrackSource.value.removeFeature(animationCarFeatures[trackId]);
        delete animationCarFeatures[trackId];
      }

      // 清理动画要素列表
      animationFeatureList.value = animationFeatureList.value.filter(
        (feature) => feature.getProperties().trackId !== trackId
      );

      resolve(trackId);
    });
  };

  /**
   * 清除所有轨迹路线
   */
  const clearTrackRoutes = () => {
    if (!trackSource.value) return;

    // 停止所有动画
    stopTrackAnimation();

    // 清除主轨迹图层
    const features = trackSource.value.getFeatures();
    features.forEach((feature) => {
      if (
        feature.get('type') === 'track-route' ||
        feature.get('type') === 'track-point'
        // ||
        // feature.get('type') === 'key-route'
      ) {
        trackSource.value.removeFeature(feature);
      }
    });
    trackFeatureList.value = [];

    // 清除所有删除按钮 overlay
    Object.keys(trackDeleteOverlays).forEach((trackId) => {
      const deleteButtonData = trackDeleteOverlays[trackId];
      if (deleteButtonData && deleteButtonData.overlay && map) {
        map.removeOverlay(deleteButtonData.overlay);
      }
    });
    Object.keys(trackDeleteOverlays).forEach((key) => delete trackDeleteOverlays[key]);

    // 清除所有起点和终点 overlay
    Object.keys(trackPointOverlays).forEach((trackId) => {
      const pointOverlays = trackPointOverlays[trackId];
      if (pointOverlays && map) {
        if (pointOverlays.start) {
          map.removeOverlay(pointOverlays.start);
        }
        if (pointOverlays.end) {
          map.removeOverlay(pointOverlays.end);
        }
      }
    });
    Object.keys(trackPointOverlays).forEach((key) => delete trackPointOverlays[key]);

    // 清除动画轨迹图层
    if (animationTrackSource.value) {
      const animationFeatures = animationTrackSource.value.getFeatures();
      animationFeatures.forEach((feature) => {
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

    // 清除所有删除按钮 overlay
    Object.keys(trackDeleteOverlays).forEach((trackId) => {
      const deleteButtonData = trackDeleteOverlays[trackId];
      if (deleteButtonData && deleteButtonData.overlay && map) {
        map.removeOverlay(deleteButtonData.overlay);
      }
    });
    Object.keys(trackDeleteOverlays).forEach((key) => delete trackDeleteOverlays[key]);

    // 清除所有起点和终点 overlay
    Object.keys(trackPointOverlays).forEach((trackId) => {
      const pointOverlays = trackPointOverlays[trackId];
      if (pointOverlays && map) {
        if (pointOverlays.start) {
          map.removeOverlay(pointOverlays.start);
        }
        if (pointOverlays.end) {
          map.removeOverlay(pointOverlays.end);
        }
      }
    });
    Object.keys(trackPointOverlays).forEach((key) => delete trackPointOverlays[key]);

    // 移除全局事件监听器
    if (globalPointerMoveHandler && map) {
      map.un('pointermove', globalPointerMoveHandler);
      globalPointerMoveHandler = null;
    }

    // 清理所有状态
    trackLayer.value = null;
    trackSource.value = null;
    animationTrackLayer.value = null;
    animationTrackSource.value = null;
    trackFeatureList.value = [];
    animationFeatureList.value = [];

    // 清理动画状态
    Object.keys(animationStates).forEach((key) => delete animationStates[key]);
    Object.keys(animationFeatures).forEach((key) => delete animationFeatures[key]);
    Object.keys(animationCarFeatures).forEach((key) => {
      if (animationTrackSource.value) {
        animationTrackSource.value.removeFeature(animationCarFeatures[key]);
      }
      delete animationCarFeatures[key];
    });
    Object.keys(animationTimers).forEach((key) => {
      clearTimeout(animationTimers[key]);
      delete animationTimers[key];
    });
  };

  /**
   * 检查轨迹ID是否唯一
   * @param {string} id - 轨迹ID
   * @returns {boolean} 是否唯一
   */
  const isTrackIdUnique = (id) => {
    return !trackSource.value
      .getFeatures()
      .some((feature) => feature.getProperties().trackId === id);
  };
  /**
   * 生成唯一的轨迹ID
   * @param {string} prefix - ID前缀
   * @returns {string} 唯一的ID
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
   * @param {string} trackId - 轨迹ID
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

    // 移除小车标记
    if (animationCarFeatures[trackId]) {
      animationTrackSource.value.removeFeature(animationCarFeatures[trackId]);
      delete animationCarFeatures[trackId];
    }

    // 清理该轨迹的动画状态
    delete animationStates[trackId];
    console.log(`轨迹 ${trackId} 的动画已停止`);
  };

  /**
   * 暂停指定轨迹的动画
   * @param {string} trackId - 轨迹ID
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
   * @param {string} trackId - 轨迹ID
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
    Object.keys(animationStates).forEach((trackId) => {
      pauseTrackAnimationById(trackId);
    });
  };

  /**
   * 恢复所有轨迹动画
   */
  const resumeTrackAnimation = () => {
    Object.keys(animationStates).forEach((trackId) => {
      resumeTrackAnimationById(trackId);
    });
  };

  /**
   * 停止所有轨迹动画
   */
  const stopTrackAnimation = () => {
    Object.keys(animationStates).forEach((trackId) => {
      stopTrackAnimationById(trackId);
    });
  };

  /**
   * 切换指定轨迹的动画播放状态
   * @param {string} trackId - 轨迹ID
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
      const anyPaused = Object.values(animationStates).some((state) => state.isPaused);
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
   * 设置速度值
   * @param {number} speed - 速度值
   */
  const setSpeedValue = (speed) => {
    speedValue.value = speed;
  };

  /**
   * 获取当前正在运行的动画信息
   * @returns {object} 动画信息
   */
  const getActiveAnimations = () => {
    const activeAnimations = {};
    Object.keys(animationStates).forEach((trackId) => {
      const state = animationStates[trackId];
      activeAnimations[trackId] = {
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        currentIndex: state.currentIndex,
        total: state.total,
        speed: state.speed,
        color: '#62e884'
      };
    });
    return activeAnimations;
  };

  /**
   * 获取动画统计信息
   * @returns {object} 统计信息
   */
  const getAnimationStats = () => {
    const totalAnimations = Object.keys(animationStates).length;
    const playingAnimations = Object.values(animationStates).filter(
      (state) => state.isPlaying && !state.isPaused
    ).length;
    const pausedAnimations = Object.values(animationStates).filter(
      (state) => state.isPlaying && state.isPaused
    ).length;

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
    animationCarFeatures,
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
    setSpeedValue,
    // 销毁
    destroy
  };
}
