import { onUnmounted, ref } from 'vue';
import { fromLonLat } from 'ol/proj';
import { unByKey } from 'ol/Observable';

/**
 * 雷达扫描动画 Hook
 * 使用 OpenLayers postrender 事件实现高性能 Canvas 动画
 * 
 * - 半径以米为单位，自动换算为像素，缩放效果与地图一致
 * - 默认半径 1km
 * 
 * @param {object} map - OpenLayers 地图实例
 * @returns {object} 雷达动画管理方法
 */
export function useRadarScanAnimation(map) {
  // 存储所有雷达动画配置
  const radarAnimations = ref(new Map());
  // 存储事件监听器 key
  const listenerKeys = ref([]);
  // 动画开始时间
  const startTime = Date.now();
  // 当前 hover 的雷达 ID
  const hoveredRadarId = ref(null);
  // 鼠标位置
  let mousePosition = null;
  // 动画循环 ID
  let animationFrameId = null;

  // 默认半径：1km
  const DEFAULT_RADIUS_METERS = 1000;

  /**
   * 根据地图分辨率将米转换为像素
   * @param {number} meters - 米
   * @param {number} resolution - 地图分辨率（米/像素，EPSG:3857）
   * @returns {number} 像素
   */
  const metersToPixels = (meters, resolution) => {
    if (!resolution || resolution <= 0) return 0;
    return meters / resolution;
  };

  /**
   * 添加雷达扫描动画
   * @param {string} id - 雷达唯一标识
   * @param {Array} coordinates - 雷达中心坐标 [经度, 纬度]
   * @param {object} options - 动画配置
   */
  const addRadarAnimation = (id, coordinates, options = {}) => {
    const {
      // 半径，单位：米，默认 1km
      radius = DEFAULT_RADIUS_METERS,
      color = '#00ffcc',
      scanSpeed = 2500,
      fadeLength = 0.35,
      ringCount = 4,
      ringColor = 'rgba(0, 255, 204, 0.15)',
      visible = true,
      // hover 状态下的半径增量（米）
      hoverRadiusAdd = 500,
      hoverColor = '#00ffff',
      // 涟漪是否实心填充，默认 false（只有描边）
      solidRipple = true,
      // 涟漪周期（毫秒）
      rippleDuration = 2000,
      // 涟漪数量
      rippleCount = 3
    } = options;

    radarAnimations.value.set(id, {
      id,
      coordinates,
      projectedCoords: fromLonLat(coordinates),
      // 存储米
      radiusMeters: radius,
      hoverRadiusMeters: radius + hoverRadiusAdd,
      color,
      scanSpeed,
      fadeLength,
      ringCount,
      ringColor,
      visible,
      hoverColor,
      solidRipple,
      rippleDuration,
      rippleCount,
      // 动画过渡状态（米）
      currentRadiusMeters: radius,
      targetRadiusMeters: radius,
      pulsePhase: Math.random() * Math.PI * 2
    });

    if (radarAnimations.value.size === 1) {
      // 延迟启动，确保图层已创建
      setTimeout(() => {
        startAnimationLoop();
      }, 100);
      bindMouseEvents();
    }
  };

  /**
   * 批量添加雷达动画
   */
  const addRadarAnimations = (radarList) => {
    radarList.forEach(({ id, coordinates, options }) => {
      addRadarAnimation(id, coordinates, options);
    });
  };

  /**
   * 绑定鼠标事件（用于 hover 检测）
   */
  const bindMouseEvents = () => {
    if (!map) return;

    const viewport = map.getViewport();
    viewport.addEventListener('mousemove', handleMouseMove);
    viewport.addEventListener('mouseleave', handleMouseLeave);
  };

  /**
   * 解绑鼠标事件
   */
  const unbindMouseEvents = () => {
    if (!map) return;

    const viewport = map.getViewport();
    viewport.removeEventListener('mousemove', handleMouseMove);
    viewport.removeEventListener('mouseleave', handleMouseLeave);
  };

  /**
   * 鼠标移动处理
   */
  const handleMouseMove = (event) => {
    const rect = map.getViewport().getBoundingClientRect();
    mousePosition = [event.clientX - rect.left, event.clientY - rect.top];

    // 获取当前分辨率用于计算像素半径
    const view = map.getView();
    const resolution = view.getResolution();

    // 检测是否 hover 在某个雷达上
    let foundHover = null;
    radarAnimations.value.forEach((radar) => {
      if (!radar.visible) return;

      const pixel = map.getPixelFromCoordinate(radar.projectedCoords);
      if (!pixel) return;

      // 将米转换为像素
      const radiusPixels = metersToPixels(radar.currentRadiusMeters, resolution);

      const distance = Math.sqrt(
        (mousePosition[0] - pixel[0]) ** 2 +
        (mousePosition[1] - pixel[1]) ** 2
      );

      if (distance <= radiusPixels) {
        foundHover = radar.id;
      }
    });

    if (hoveredRadarId.value !== foundHover) {
      // 重置之前 hover 的雷达
      if (hoveredRadarId.value) {
        const prevRadar = radarAnimations.value.get(hoveredRadarId.value);
        if (prevRadar) {
          prevRadar.targetRadiusMeters = prevRadar.radiusMeters;
        }
      }

      // 设置新的 hover 雷达
      hoveredRadarId.value = foundHover;
      if (foundHover) {
        const radar = radarAnimations.value.get(foundHover);
        if (radar) {
          radar.targetRadiusMeters = radar.hoverRadiusMeters;
        }
      }
    }
  };

  /**
   * 鼠标离开处理
   */
  const handleMouseLeave = () => {
    mousePosition = null;
    if (hoveredRadarId.value) {
      const radar = radarAnimations.value.get(hoveredRadarId.value);
      if (radar) {
        radar.targetRadiusMeters = radar.radiusMeters;
      }
      hoveredRadarId.value = null;
    }
  };

  /**
   * 绘制科技感雷达扫描效果
   */
  const drawRadarScan = (ctx, radar, pixelCoords, elapsed, pixelRatio, resolution) => {
    if (!radar.visible) return;

    const [x, y] = pixelCoords;
    const isHovered = radar.id === hoveredRadarId.value;

    // 验证坐标是否为有限值
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    // 验证 pixelRatio 和 resolution 是否为有限值
    if (!Number.isFinite(pixelRatio) || !Number.isFinite(resolution) || resolution <= 0) return;

    // 平滑过渡半径（米）
    const radiusDiff = radar.targetRadiusMeters - radar.currentRadiusMeters;
    radar.currentRadiusMeters += radiusDiff * 0.1;

    const { color, hoverColor, scanSpeed, fadeLength, solidRipple, rippleDuration, rippleCount } = radar;
    const activeColor = isHovered ? hoverColor : color;

    // 将米转换为像素，再乘以 pixelRatio
    const scaledRadius = metersToPixels(radar.currentRadiusMeters, resolution) * pixelRatio;

    // 如果半径太小或不是有限值，不绘制
    if (!Number.isFinite(scaledRadius) || scaledRadius < 5) return;

    // 计算扫描角度
    const angle = ((elapsed % scanSpeed) / scanSpeed) * Math.PI * 2;

    // 涟漪进度
    const rippleProgress = (elapsed % rippleDuration) / rippleDuration;

    ctx.save();

    // 解析颜色
    const rgbMatch = activeColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    let r = 0;
    let g = 255;
    let b = 204;
    if (rgbMatch) {
      r = Number.parseInt(rgbMatch[1], 16);
      g = Number.parseInt(rgbMatch[2], 16);
      b = Number.parseInt(rgbMatch[3], 16);
    }

    // 1. 底层大范围辉光
    const baseGlow = ctx.createRadialGradient(x, y, 0, x, y, scaledRadius * 1.2);
    baseGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.15 : 0.08})`);
    baseGlow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.06 : 0.03})`);
    baseGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = baseGlow;
    ctx.beginPath();
    ctx.arc(x, y, scaledRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. 固定外圈
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.5 : 0.3})`;
    ctx.lineWidth = (isHovered ? 2 : 1.5) * pixelRatio;
    ctx.beginPath();
    ctx.arc(x, y, scaledRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 2.5 沿外圈的流光弧线（两条，慢速旋转）
    const flowAngle = (elapsed / 6000) * Math.PI * 2; // 6秒转一圈
    const arcLength = Math.PI * 0.3; // 弧线长度约 54 度

    for (let i = 0; i < 2; i++) {
      const startAngle = flowAngle + (i * Math.PI); // 两条相隔 180 度
      const endAngle = startAngle + arcLength;

      // 流光渐变效果
      const gradient = ctx.createConicGradient(startAngle, x, y);
      const arcRatio = arcLength / (Math.PI * 2);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      gradient.addColorStop(arcRatio * 0.3, `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.8 : 0.5})`);
      gradient.addColorStop(arcRatio * 0.7, `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.9 : 0.6})`);
      gradient.addColorStop(arcRatio, `rgba(${r}, ${g}, ${b}, 0)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = (isHovered ? 3 : 2) * pixelRatio;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y, scaledRadius, startAngle, endAngle);
      ctx.stroke();
    }

    // 3. 涟漪效果（从中心向外扩散）
    for (let i = 0; i < rippleCount; i++) {
      const rippleOffset = i / rippleCount;
      const currentProgress = (rippleProgress + rippleOffset) % 1;

      // 涟漪半径从 0.3 扩散到外圈
      const rippleRadius = (0.3 + 0.7 * currentProgress) * scaledRadius;
      // 透明度：开始时较亮，扩散到边缘时消失
      const rippleAlpha = (1 - currentProgress) * (isHovered ? 0.5 : 0.35);

      if (rippleAlpha > 0.02 && Number.isFinite(rippleRadius) && rippleRadius > 0) {
        if (solidRipple) {
          // 实心涟漪：径向渐变填充
          const rippleGradient = ctx.createRadialGradient(x, y, rippleRadius * 0.3, x, y, rippleRadius);
          rippleGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${rippleAlpha * 0.5})`);
          rippleGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${rippleAlpha * 0.25})`);
          rippleGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${rippleAlpha * 0.1})`);
          ctx.fillStyle = rippleGradient;
          ctx.beginPath();
          ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
          ctx.fill();

          // 涟漪边缘描边
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rippleAlpha * 0.8})`;
          ctx.lineWidth = 1.5 * pixelRatio;
          ctx.stroke();
        } else {
          // 空心涟漪
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${rippleAlpha})`;
          ctx.lineWidth = (isHovered ? 1.5 : 1) * pixelRatio;
          ctx.beginPath();
          ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 4. 扫描扇形（渐变尾迹 - 在扫描线后方）
    // conicGradient 从 angle 开始顺时针渐变，所以尾迹应该在 angle 之前（逆时针方向）
    // 通过设置渐变起点在扫描线位置，然后让透明部分在前方，有色部分在后方
    const sweepGradient = ctx.createConicGradient(angle - Math.PI / 2, x, y);
    // 0 是扫描线位置，渐变向顺时针方向（前方）是透明的
    // 1 - fadeLength 到 1 是尾迹（后方）
    sweepGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    sweepGradient.addColorStop(1 - fadeLength, `rgba(${r}, ${g}, ${b}, 0)`);
    sweepGradient.addColorStop(1 - fadeLength * 0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
    sweepGradient.addColorStop(1 - fadeLength * 0.2, `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.35 : 0.25})`);
    sweepGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.6 : 0.45})`);

    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, scaledRadius * 0.98, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // 5. 扫描线（发光效果）
    const lineEndX = x + Math.cos(angle - Math.PI / 2) * scaledRadius * 0.98;
    const lineEndY = y + Math.sin(angle - Math.PI / 2) * scaledRadius * 0.98;

    // 扫描线光晕
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.lineWidth = 6 * pixelRatio;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.stroke();

    // 扫描线主体（渐变）
    const lineGradient = ctx.createLinearGradient(x, y, lineEndX, lineEndY);
    lineGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
    lineGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.7)`);
    lineGradient.addColorStop(1, `rgba(255, 255, 255, 0.95)`);

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = (isHovered ? 2.5 : 2) * pixelRatio;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = (isHovered ? 15 : 10) * pixelRatio;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 6. 刻度线（增加科技感）
    const tickCount = 12;
    const tickLength = scaledRadius * 0.08;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.5 : 0.3})`;
    ctx.lineWidth = 1 * pixelRatio;

    for (let i = 0; i < tickCount; i++) {
      const tickAngle = (i / tickCount) * Math.PI * 2;
      const innerRadius = scaledRadius * 0.92;
      const outerRadius = scaledRadius - tickLength * (i % 3 === 0 ? 0.3 : 0.6);

      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(tickAngle) * innerRadius,
        y + Math.sin(tickAngle) * innerRadius
      );
      ctx.lineTo(
        x + Math.cos(tickAngle) * outerRadius,
        y + Math.sin(tickAngle) * outerRadius
      );
      ctx.stroke();
    }

    // 7. 中心点（多层发光）
    // 外层光晕
    const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, 15 * pixelRatio);
    outerGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.8 : 0.6})`);
    outerGlow.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.2)`);
    outerGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, 15 * pixelRatio, 0, Math.PI * 2);
    ctx.fill();

    // 中心圆环
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${isHovered ? 0.8 : 0.6})`;
    ctx.lineWidth = 1.5 * pixelRatio;
    ctx.beginPath();
    ctx.arc(x, y, 5 * pixelRatio, 0, Math.PI * 2);
    ctx.stroke();

    // 中心亮点
    ctx.fillStyle = `rgba(255, 255, 255, 0.95)`;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 8 * pixelRatio;
    ctx.beginPath();
    ctx.arc(x, y, (isHovered ? 3 : 2.5) * pixelRatio, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  /**
   * postrender 事件处理函数
   */
  const handlePostRender = (event) => {
    if (radarAnimations.value.size === 0) return;
    if (!map) return;

    const elapsed = Date.now() - startTime;
    const ctx = event.context;
    const frameState = event.frameState;
    if (!frameState) return;

    const pixelRatio = frameState.pixelRatio || 1;

    // 获取当前地图分辨率（米/像素）
    const view = map.getView();
    if (!view) return;

    const resolution = view.getResolution();
    if (!Number.isFinite(resolution) || resolution <= 0) return;

    radarAnimations.value.forEach((radar) => {
      if (!radar.visible) return;
      if (!radar.projectedCoords) return;

      const pixel = map.getPixelFromCoordinate(radar.projectedCoords);
      if (!pixel || !Number.isFinite(pixel[0]) || !Number.isFinite(pixel[1])) return;

      const pixelCoords = [pixel[0] * pixelRatio, pixel[1] * pixelRatio];
      drawRadarScan(ctx, radar, pixelCoords, elapsed, pixelRatio, resolution);
    });
  };

  /**
   * 启动动画循环
   */
  const startAnimationLoop = () => {
    if (!map) return;

    // 如果已经有监听器，不再重复添加
    if (listenerKeys.value.length > 0) return;

    // 尝试找到 optical-radar 类型的图层
    const layers = map.getLayers().getArray();
    let targetLayer = layers.find(layer => layer.get('type') === 'optical-radar');

    // 如果找不到，尝试找第一个有 source 的图层
    if (!targetLayer) {
      targetLayer = layers.find(layer => {
        try {
          return layer.getSource && layer.getSource();
        } catch (e) {
          return false;
        }
      });
    }

    // 优先绑定到图层，如果找不到图层则绑定到地图
    if (targetLayer) {
      const key = targetLayer.on('postrender', handlePostRender);
      listenerKeys.value.push(key);
    } else {
      // 直接绑定到地图上，确保动画能够显示
      const key = map.on('postrender', handlePostRender);
      listenerKeys.value.push(key);
    }

    // 启动动画循环，持续触发地图渲染
    const animate = () => {
      if (radarAnimations.value.size > 0 && map) {
        map.render();
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
  };

  /**
   * 停止动画循环
   */
  const stopAnimationLoop = () => {
    // 取消动画帧
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // 移除事件监听器
    listenerKeys.value.forEach((key) => {
      unByKey(key);
    });
    listenerKeys.value = [];
  };

  /**
   * 移除雷达动画
   */
  const removeRadarAnimation = (id) => {
    radarAnimations.value.delete(id);

    if (radarAnimations.value.size === 0) {
      stopAnimationLoop();
      unbindMouseEvents();
    }
  };

  /**
   * 切换单个雷达动画可见性
   */
  const toggleRadarVisibility = (id, visible) => {
    const radar = radarAnimations.value.get(id);
    if (radar) {
      radar.visible = visible;
    }
  };

  /**
   * 批量切换雷达动画可见性
   */
  const toggleAllRadarVisibility = (visible) => {
    radarAnimations.value.forEach((radar) => {
      radar.visible = visible;
    });
  };

  /**
   * 更新雷达配置
   */
  const updateRadarAnimation = (id, options) => {
    const radar = radarAnimations.value.get(id);
    if (radar) {
      Object.assign(radar, options);
      if (options.coordinates) {
        radar.projectedCoords = fromLonLat(options.coordinates);
      }
      // 如果更新了半径，重新设置
      if (options.radius) {
        radar.radiusMeters = options.radius;
        radar.currentRadiusMeters = options.radius;
        radar.targetRadiusMeters = options.radius;
      }
    }
  };

  /**
   * 清除所有雷达动画
   */
  const clearRadarAnimations = () => {
    radarAnimations.value.clear();
    stopAnimationLoop();
    unbindMouseEvents();
  };

  /**
   * 获取所有雷达动画
   */
  const getRadarAnimations = () => {
    return radarAnimations.value;
  };

  /**
   * 获取当前 hover 的雷达 ID
   */
  const getHoveredRadarId = () => {
    return hoveredRadarId.value;
  };

  /**
   * 销毁
   */
  const destroy = () => {
    clearRadarAnimations();
  };

  onUnmounted(() => {
    destroy();
  });

  return {
    radarAnimations,
    hoveredRadarId,
    addRadarAnimation,
    addRadarAnimations,
    removeRadarAnimation,
    toggleRadarVisibility,
    toggleAllRadarVisibility,
    updateRadarAnimation,
    clearRadarAnimations,
    getRadarAnimations,
    getHoveredRadarId,
    destroy
  };
}
