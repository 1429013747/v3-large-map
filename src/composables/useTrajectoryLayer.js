import * as turf from '@turf/turf'
import { Feature } from 'ol'
import { LineString, Point } from 'ol/geom'
import { Vector as VectorLayer } from 'ol/layer'
import Overlay from 'ol/Overlay'
import { fromLonLat } from 'ol/proj'
import { Vector as VectorSource } from 'ol/source'
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style'
import { createApp, h, ref } from 'vue'
import endIcon from '@/assets/icons/end.svg?url'
import startIcon from '@/assets/icons/start.svg?url'
import TrajectoryPointPopup from '@/pops/TrajectoryPointPopup.vue'

/**
 * 轨迹图层 Hooks - 懒加载版本
 *
 * 特性：
 * - 懒加载：只在显示时才绘制
 * - 多轨迹支持
 * - 起点/终点/轨迹点标记
 * - 简洁美观的轨迹线样式（外发光 + 内虚线）
 * - 可选的轨迹回放功能（动画移动 + 留痕）
 * - 动态更新数据
 * - 自定义 hover 内容（支持函数返回 HTML 或 Vue 组件）
 * - 支持通过 id 控制单条轨迹的显示/隐藏
 *
 * 样式说明：
 * - 轨迹线：双层样式（外发光6px + 内虚线3px [15, 8]）
 * - 留痕动画：半透明红色 (rgba(236, 4, 4, 0.7), width: 3)
 * - 图层层级：留痕(1008) < 轨迹线和图标(1009)
 *
 * 数据格式：
 * [{
 *   id: string,           // 轨迹唯一标识（用于控制显示/隐藏）
 *   name: '轨迹名称',
 *   data: [{
 *     id: string,
 *     longitude: string,
 *     latitude: string,
 *     pointTime: string,
 *     ...其他字段
 *   }]
 * }]
 *
 * 初始化选项：
 * gjTrajectoryLayer.updateData(trajectoryData, {
 *renderTrackPoints: true,
  // 轨迹点标签函数
  trackPointLabel: (data) => dayjs(data.pointTime).format('HH:mm'),
  // 最小显示缩放级别（默认 15，放大到该级别才显示标签）
  trackPointLabelMinZoom: 15
})
 * {
 *   hoverContent: Function | Component | null
 *     - Function: (data) => '<div>...</div>' 返回 HTML 字符串
 *     - Component: Vue 组件（可以是动态 import）
 *     - null: 不显示 hover（默认使用 TrajectoryPointPopup）
 *   onPointClick: Function | null
 *     - Function: ({ data, coordinate, pixel }) => void 点击回调
 *     - null: 不处理点击事件
 *   enableTrajectoryPlayback: Boolean (默认 false)
 *     - 是否开启轨迹回放功能
 *     - 开启后会绘制移动图标并支持动画播放
 *   playbackOptions: Object (可选)
 *     - icon: string - 移动图标路径（默认: '/src/assets/car.png'）
 *     - iconScale: number - 图标缩放（默认: 1.2）
 *     - fixedSpeed: number - 固定速度（公里/秒，默认: 0.05，即50m/s≈180km/h）
 *     - speedMultiplier: number - 速度倍率（默认: 1，2表示2倍速）
 *     - autoPlay: boolean - 是否自动播放（默认: false）
 * }
 *
 * 使用示例：
 * // 1. 基础用法（静态轨迹）
 * init(map, {
 *   hoverContent: TrajectoryPointPopup
 * })
 *
 * // 2. 开启轨迹回放功能
 * init(map, {
 *   enableTrajectoryPlayback: true,
 *   playbackOptions: {
 *     icon: '/src/assets/car.png',
 *     iconScale: 1.2,
 *     fixedSpeed: 0.08,     // 固定速度 80m/s ≈ 288km/h
 *     speedMultiplier: 1.5, // 1.5倍速播放
 *     autoPlay: true        // 加载后自动播放
 *   }
 * })
 *
 * // 3. 手动控制播放（开始 / 暂停 / 继续 / 速度）
 * const trajectoryLayer = useTrajectoryLayer()
 * trajectoryLayer.init(map, { enableTrajectoryPlayback: true })
 * trajectoryLayer.updateData(data)
 * trajectoryLayer.startAnimation(0)   // 开始：从第一条轨迹播放
 * trajectoryLayer.pauseAnimation()  // 暂停（保留进度）
 * trajectoryLayer.resumeAnimation() // 继续播放
 * trajectoryLayer.stopAnimation()   // 停止（不保留进度）
 * trajectoryLayer.setPlaybackSpeed(2) // 播放速度：2 倍速（可播放中修改）
 * trajectoryLayer.resetAnimation()  // 重置到起点
 *
 * // 4. 通过 id 控制单条轨迹显示/隐藏
 * trajectoryLayer.showById('track-001')
 * trajectoryLayer.hideById('track-001')
 * trajectoryLayer.toggleById('track-001')
 */
export function useTrajectoryLayer() {
  let map = null
  let layer = null
  let lineAnimateLayer = null // 留痕图层
  let trackPointsLayer = null // 轨迹点图层
  let movingIconLayer = null // 移动图标图层（最高层级）
  let hoverOverlay = null
  let hoverApp = null
  let pointerMoveListener = null
  let clickListener = null
  let zoomChangeListener = null // 缩放监听
  let currentHoveredPointId = null // 跟踪当前悬停的点ID
  let renderTrackPoints = false // 是否渲染轨迹点（小圆点）
  let hoverConfig = null // hover 配置：可以是函数（返回 HTML 字符串）或组件（动态 import）
  let onPointClick = null // 点击回调函数
  let labelOverlays = [] // 起点/终点标签 Overlay 列表
  let trackPointLabelConfig = null // 轨迹点标签配置：函数 (data) => string | null
  let trackPointLabelMinZoom = 11 // 轨迹点标签最小显示缩放级别（放大到13级才显示）
  let customMarkers = [] // 自定义标注点配置
  let fixedZoom = null // 固定缩放级别（如果设置，则不根据轨迹长度动态计算）

  // 动画相关
  let enableTrajectoryPlayback = false // 是否开启轨迹回放功能（默认关闭）
  let playbackOptions = {} // 回放配置（速度、自动播放等）
  let onAnimationComplete = null // 轨迹播放完成回调 (trajectoryId) => void
  let animationFrameId = null // requestAnimationFrame id
  let animationStates = [] // 每条轨迹的动画状态
  let fixedSpeed = 0.75 // 固定速度（公里/秒），默认 0.05 km/s = 50 m/s = 180 km/h
  let speedMultiplier = 1 // 速度倍率（1为正常速度，2为2倍速）
  let currentAnimatingIndex = -1 // 当前正在播放动画的轨迹索引
  let autoPlay = false // 是否自动播放（绘制后立即播放）
  let animationStartTime = 0 // 动画开始时间

  const isVisible = ref(false)
  const trajectories = ref([])
  const isDrawn = ref(false)
  const hoverData = ref(null)
  const isAnimating = ref(false) // 是否正在播放动画
  const isPaused = ref(false) // 是否已暂停（可继续播放）
  const animationProgress = ref(0) // 动画进度 0-100
  const playbackSpeed = ref(1) // 播放速度倍率（1 为正常，2 为 2 倍速），供 UI 绑定

  // 暂停时保存的已播放时间（毫秒 * 速度倍率），用于恢复
  let pausedElapsed = null
  let isAllMode = false // true 表示上次是「全部轨迹」模式，恢复时用 animateAll

  // 颜色配置
  const COLORS = [
    {
      // 主青色（大屏主色调 #01eaff）
      core: 'rgba(1, 234, 255, 0.95)',
      glow: 'rgba(1, 234, 255, 0.2)',
      border: 'rgba(73, 246, 255, 0.7)'
    },
    {
      // 红色（#ff4757）
      core: 'rgba(255, 71, 87, 0.95)',
      glow: 'rgba(255, 71, 87, 0.2)',
      border: 'rgba(255, 130, 130, 0.7)'
    },
    {
      // 绿色（#2ed573）
      core: 'rgba(46, 213, 115, 0.95)',
      glow: 'rgba(46, 213, 115, 0.2)',
      border: 'rgba(100, 230, 160, 0.7)'
    },
    {
      // 橙色（#ffa022）
      core: 'rgba(255, 160, 34, 0.95)',
      glow: 'rgba(255, 160, 34, 0.2)',
      border: 'rgba(255, 200, 100, 0.7)'
    },
    {
      // 蓝色
      core: 'rgba(70, 150, 255, 0.95)',
      glow: 'rgba(70, 150, 255, 0.2)',
      border: 'rgba(135, 190, 255, 0.7)'
    },
    {
      // 紫色
      core: 'rgba(162, 155, 254, 0.95)',
      glow: 'rgba(162, 155, 254, 0.2)',
      border: 'rgba(196, 181, 253, 0.7)'
    },
    {
      // 粉红
      core: 'rgba(255, 107, 129, 0.95)',
      glow: 'rgba(255, 107, 129, 0.2)',
      border: 'rgba(255, 159, 170, 0.7)'
    }
  ]

  // 当前使用简化的双层样式：外发光6px + 内虚线3px [15, 8]

  /**
   * 线段插值（必须在 getRoute 之前定义）
   */
  const lineMore = (from, to, distance, splitLength) => {
    const step = Number.parseInt(distance / splitLength)
    const leftLength = distance - step * splitLength
    const rings = []
    const route = turf.lineString([from.geometry.coordinates, to.geometry.coordinates])

    for (let i = 1; i <= step; i++) {
      const nlength = i * splitLength
      const pnt = turf.along(route, nlength, { units: 'kilometers' })
      rings.push(pnt.geometry.coordinates)
    }

    if (leftLength > 0) {
      rings.push(to.geometry.coordinates)
    }

    return rings
  }

  /**
   * 获取插值后的路线（使用 turf.js）
   */
  const getRoute = (coords, total_step) => {
    const route = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    }

    const newcoords = []
    const total_lineLength = turf.length(route, { units: 'kilometers' })
    const per_stepLength = total_lineLength / total_step

    for (let i = 0; i < coords.length - 1; i++) {
      const from = turf.point(coords[i])
      const to = turf.point(coords[i + 1])
      const lDistance = turf.distance(from, to, { units: 'kilometers' })

      if (i === 0) {
        newcoords.push(coords[0])
      }

      if (lDistance > per_stepLength) {
        const rings = lineMore(from, to, lDistance, per_stepLength)
        newcoords.push(...rings)
      }
      else {
        newcoords.push(coords[i + 1])
      }
    }

    return newcoords
  }

  // 留痕基础配置（灰色核心，边框颜色根据轨迹动态设置）
  const PASSED_COLOR = {
    core: 'rgba(80, 100, 115, 0.95)'
  }

  // 灰色箭头 SVG
  const grayArrowSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
      <path d="M3 2 L7 5 L3 8" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `)}`

  // 创建留痕线样式（灰色核心 + 对应轨迹颜色的浅色边框）
  const createPassedLineStyle = (feature, resolution) => {
    // 获取该轨迹对应的颜色配置
    const colorConfig = feature.get('colorConfig')
    // 使用轨迹颜色的浅色作为边框，如果没有则使用默认灰色
    const borderColor = colorConfig?.border || 'rgba(100, 120, 135, 0.7)'

    const styles = [
      // 最外层：轨迹对应颜色的浅色边框
      new Style({
        stroke: new Stroke({
          color: borderColor,
          width: 10,
          lineCap: 'round',
          lineJoin: 'round'
        })
      }),
      // 中间层：灰色核心
      new Style({
        stroke: new Stroke({
          color: PASSED_COLOR.core,
          width: 7,
          lineCap: 'round',
          lineJoin: 'round'
        })
      })
    ]

    // 沿线绘制灰色箭头（高德风格：固定像素间距）
    if (feature && resolution) {
      const geometry = feature.getGeometry()
      if (geometry) {
        const totalLength = geometry.getLength()

        // 固定像素间距（与高德导航一致）
        const arrowSpacingPixels = 40
        const arrowSpacing = arrowSpacingPixels * resolution

        // 计算箭头数量
        const numArrows = Math.floor(totalLength / arrowSpacing)

        // 限制最大数量避免性能问题
        const maxArrows = Math.min(numArrows, 500)

        for (let i = 1; i <= maxArrows; i++) {
          const fraction = (i * arrowSpacing) / totalLength
          if (fraction > 1) break

          const coord = geometry.getCoordinateAt(fraction)
          const prevCoord = geometry.getCoordinateAt(Math.max(0, fraction - 0.01))

          const dx = coord[0] - prevCoord[0]
          const dy = coord[1] - prevCoord[1]
          const rotation = Math.atan2(dy, dx)

          styles.push(new Style({
            geometry: new Point(coord),
            image: new Icon({
              src: grayArrowSvg,
              scale: 0.8,
              rotation: -rotation,
              rotateWithView: true
            })
          }))
        }
      }
    }

    return styles
  }

  // 图层名称常量
  const LAYER_NAMES = {
    TRAJECTORY_LINE: 'trajectory-line-layer',
    TRAJECTORY_ANIMATE: 'trajectory-animate-layer',
    TRAJECTORY_POINTS: 'trajectory-points-layer',
    TRAJECTORY_MOVING: 'trajectory-moving-layer'
  }

  // 创建图层
  const createLayer = () => {
    if (layer)
      return

    // 主轨迹图层（轨迹线、起点、终点）
    layer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 1009,
      visible: false,
      properties: { name: LAYER_NAMES.TRAJECTORY_LINE }
    })

    // 留痕动画图层（灰色，在主轨迹图层上方覆盖）
    lineAnimateLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature, resolution) => createPassedLineStyle(feature, resolution),
      zIndex: 1010,
      visible: false,
      properties: { name: LAYER_NAMES.TRAJECTORY_ANIMATE }
    })

    // 轨迹点图层（在留痕上方）
    trackPointsLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 1011,
      visible: false,
      properties: { name: LAYER_NAMES.TRAJECTORY_POINTS }
    })

    // 移动图标图层（最高层级）
    movingIconLayer = new VectorLayer({
      source: new VectorSource(),
      zIndex: 1012,
      visible: false,
      properties: { name: LAYER_NAMES.TRAJECTORY_MOVING }
    })

    map.addLayer(layer)
    map.addLayer(lineAnimateLayer)
    map.addLayer(trackPointsLayer)
    map.addLayer(movingIconLayer)
  }

  // 创建 hover overlay（只创建一次，复用 Vue 实例）
  const createHoverOverlay = () => {
    if (hoverOverlay)
      return

    const hoverEl = document.createElement('div')
    hoverEl.className = 'common-popup-selected-container2'

    hoverOverlay = new Overlay({
      element: hoverEl,
      // offset: [0, -10], // 向上偏移，显示在点的上方
      positioning: 'bottom-center', // 底部居中对齐到点位
      stopEvent: false
    })

    map.addOverlay(hoverOverlay)

    // 创建 Vue 实例（只创建一次）
    // 根据 hoverConfig 类型决定渲染方式
    hoverApp = createApp({
      render: () => {
        if (!hoverData.value)
          return null

        // 如果 hoverConfig 是函数，返回 HTML 字符串
        if (typeof hoverConfig === 'function') {
          const htmlContent = hoverConfig(hoverData.value)
          return h('div', { innerHTML: htmlContent })
        }

        // 如果 hoverConfig 是组件（默认使用 TrajectoryPointPopup）
        const component = hoverConfig || TrajectoryPointPopup
        return h(component, { data: hoverData.value })
      }
    })
    hoverApp.mount(hoverEl)
  }

  // 防抖定时器
  let hoverDebounceTimer = null

  // 设置 hover 监听（添加防抖，使用图层 name 判断）
  const setupHoverListener = () => {
    if (pointerMoveListener)
      return

    pointerMoveListener = map.on('pointermove', (evt) => {
      if (!layer || !hoverConfig)
        return

      // 防抖：30ms 内只执行一次
      if (hoverDebounceTimer) {
        clearTimeout(hoverDebounceTimer)
      }

      hoverDebounceTimer = setTimeout(() => {
        const pixel = map.getEventPixel(evt.originalEvent)
        const feature = map.forEachFeatureAtPixel(pixel, (f, l) => {
          // 通过图层 name 判断是否是轨迹相关图层
          const layerName = l.get('name')
          const isTrajectoryLayer = layerName === LAYER_NAMES.TRAJECTORY_POINTS ||
            layerName === LAYER_NAMES.TRAJECTORY_LINE
          // 只检测有 pointData 的 feature
          if (isTrajectoryLayer && f.get('pointData')) {
            return f
          }
          return null
        }, { hitTolerance: 6 }) // 增加点击容差

        if (feature) {
          const pointData = feature.get('pointData')
          const pointId = pointData.id || `${pointData.longitude}_${pointData.latitude}`

          // 只在进入新的点时才更新弹框
          if (currentHoveredPointId !== pointId) {
            currentHoveredPointId = pointId
            hoverData.value = pointData

            // 将弹框固定在点的上方
            const coordinate = feature.getGeometry().getCoordinates()
            hoverOverlay.setPosition(coordinate)
          }

          map.getTargetElement().style.cursor = 'pointer'
        }
        else {
          // 离开所有点时清空
          if (currentHoveredPointId !== null) {
            currentHoveredPointId = null
            hoverData.value = null
            hoverOverlay.setPosition(undefined)
          }
          map.getTargetElement().style.cursor = ''
        }
      }, 30) // 30ms 防抖
    })
  }

  // 设置点击监听
  const setupClickListener = () => {
    if (clickListener)
      return

    clickListener = map.on('click', (evt) => {
      if (!layer)
        return

      const pixel = map.getEventPixel(evt.originalEvent)
      const feature = map.forEachFeatureAtPixel(pixel, (f, l) => {
        // 通过图层 name 判断
        const layerName = l.get('name')
        const isTrajectoryLayer = layerName === LAYER_NAMES.TRAJECTORY_POINTS ||
          layerName === LAYER_NAMES.TRAJECTORY_LINE
        if (isTrajectoryLayer && f.get('pointData')) {
          return f
        }
        return null
      }, { hitTolerance: 6 })

      if (feature && onPointClick) {
        const pointData = feature.get('pointData')
        const coordinate = feature.getGeometry().getCoordinates()
        onPointClick({
          data: pointData,
          coordinate,
          pixel
        })
      }
    })
  }

  // 箭头 SVG（白色 > 形状，类似高德导航）
  const arrowSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
      <path d="M3 2 L7 5 L3 8" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `)}`

  // 创建轨迹线样式（高德导航风格：外层边框 + 中间主色 + 内层箭头）
  const createLineStyle = (colorConfig, lineFeature, resolution) => {
    const { core, border } = colorConfig

    const styles = [
      // 最外层：浅色边框（发光效果）
      new Style({
        stroke: new Stroke({
          color: border,
          width: 10,
          lineCap: 'round',
          lineJoin: 'round'
        })
      }),
      // 中间层：主色
      new Style({
        stroke: new Stroke({
          color: core,
          width: 7,
          lineCap: 'round',
          lineJoin: 'round'
        })
      })
    ]

    // 沿线绘制箭头
    if (lineFeature && resolution) {
      const geometry = lineFeature.getGeometry()
      if (geometry) {
        const totalLength = geometry.getLength()

        // 固定像素间距
        const arrowSpacingPixels = 35
        const arrowSpacing = arrowSpacingPixels * resolution

        // 计算箭头数量
        const numArrows = Math.floor(totalLength / arrowSpacing)

        // 限制最大数量避免性能问题
        const maxArrows = Math.min(numArrows, 500)

        for (let i = 1; i <= maxArrows; i++) {
          const fraction = (i * arrowSpacing) / totalLength
          if (fraction > 1) break

          // 获取箭头位置的坐标
          const coord = geometry.getCoordinateAt(fraction)
          const prevCoord = geometry.getCoordinateAt(Math.max(0, fraction - 0.01))

          // 计算箭头角度
          const dx = coord[0] - prevCoord[0]
          const dy = coord[1] - prevCoord[1]
          const rotation = Math.atan2(dy, dx)

          // 添加箭头样式
          styles.push(new Style({
            geometry: new Point(coord),
            image: new Icon({
              src: arrowSvg,
              scale: 0.8,
              rotation: -rotation,
              rotateWithView: true
            })
          }))
        }
      }
    }

    return styles
  }

  // 创建带标签的起点/终点样式（只绘制小圆点，标签用 Overlay 显示）
  const createLabelStyle = (type, label) => {
    const isStart = type === 'start'
    const color = isStart ? '#52c41a' : '#ff4d4f' // 起点绿色，终点红色

    // 如果没有标签文字，显示图标
    if (!label) {
      return new Style({
        image: new Icon({
          src: isStart ? startIcon : endIcon,
          scale: 0.8,
          anchor: [0.5, 1]
        }),
        zIndex: 200
      })
    }

    // 有标签时，只绘制小圆点（标签用 Overlay 显示）
    return new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#ffffff', width: 2 })
      }),
      zIndex: 200
    })
  }

  // 创建标签 Overlay（使用 HTML/CSS，不用考虑分辨率）
  const createLabelOverlay = (coordinate, type, label, trajectoryId) => {
    if (!label) return null

    const isStart = type === 'start'
    const tagBgColor = isStart ? '#52c41a' : '#ff4d4f'
    const tagText = isStart ? '始' : '终'
    const displayLabel = label.length > 20 ? `${label.substring(0, 20)}...` : label

    // 创建 DOM 元素
    const el = document.createElement('div')
    el.className = 'trajectory-label-overlay'
    el.setAttribute('data-trajectory-id', trajectoryId)
    el.innerHTML = `
      <div class="trajectory-label" style="
        display: flex;
        align-items: stretch;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        overflow: hidden;
        white-space: nowrap;
        font-size: 12px;
        line-height: 1;
      ">
        <span class="trajectory-label-tag" style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          background: ${tagBgColor};
          color: #fff;
          font-weight: bold;
          padding: 4px 0;
        ">${tagText}</span>
        <span class="trajectory-label-text" style="
          display: flex;
          align-items: center;
          padding: 4px 8px;
          color: #333;
        ">${displayLabel}</span>
      </div>
      <div class="trajectory-label-arrow" style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid #fff;
        margin: 0 auto;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
      "></div>
    `

    const overlay = new Overlay({
      element: el,
      position: coordinate,
      positioning: 'bottom-center',
      zIndex: 300,
      offset: [0, -8], // 向上偏移，不遮挡圆点
      stopEvent: false
    })

    map.addOverlay(overlay)
    labelOverlays.push({ overlay, trajectoryId, type })
    console.log('创建 label overlay, 当前 labelOverlays 长度:', labelOverlays.length)

    return overlay
  }

  // 创建自定义标注点 Overlay（用于变装前后等特殊标注）
  const createCustomMarkerOverlay = (coordinate, label, bgColor, markerId) => {
    if (!label) return null

    // 处理换行：将 \n 转换为 <br>
    const displayLabel = label.replace(/\n/g, '<br>')

    // 创建 DOM 元素
    const el = document.createElement('div')
    el.className = 'custom-marker-overlay'
    el.setAttribute('data-marker-id', markerId)
    el.style.zIndex = '9999' // 确保 DOM 层级最高
    el.innerHTML = `
      <div class="custom-marker-label" style="
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        background: ${bgColor};
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        color: #fff;
        line-height: 1.4;
        text-align: center;
      ">${displayLabel}</div>
      <div class="custom-marker-arrow" style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid ${bgColor};
        margin: 0 auto;
      "></div>
    `

    const overlay = new Overlay({
      element: el,
      position: coordinate,
      positioning: 'bottom-center',
      offset: [0, -12], // 向上偏移
      stopEvent: false
    })

    map.addOverlay(overlay)
    labelOverlays.push({ overlay, markerId, type: 'custom' })

    return overlay
  }

  // 清除所有标签 Overlay
  const clearLabelOverlays = () => {
    console.log('clearLabelOverlays 被调用, labelOverlays 长度:', labelOverlays.length)

    // 方案1: 通过 labelOverlays 数组移除
    if (map) {
      labelOverlays.forEach(({ overlay }) => {
        try {
          console.log('正在移除 overlay:', overlay)
          // 先移除 DOM 元素
          const element = overlay.getElement()
          if (element && element.parentNode) {
            element.parentNode.removeChild(element)
          }
          // 再从地图移除 overlay
          map.removeOverlay(overlay)
        } catch (e) {
          console.warn('移除 overlay 失败:', e)
        }
      })
    }
    labelOverlays = []

    // 方案2: 备用 - 直接通过 DOM 查找并移除所有 trajectory-label-overlay 元素
    const allLabelElements = document.querySelectorAll('.trajectory-label-overlay')
    console.log('通过 DOM 查找到的 trajectory-label-overlay 元素数量:', allLabelElements.length)
    allLabelElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    })

    console.log('清除完成')
  }

  // 通过轨迹 ID 显示/隐藏标签
  const toggleLabelOverlaysByTrajectoryId = (trajectoryId, visible) => {
    labelOverlays.forEach(({ overlay, trajectoryId: id }) => {
      if (id === trajectoryId) {
        overlay.getElement().style.display = visible ? '' : 'none'
      }
    })
  }

  // 轨迹点标签 Feature 列表（用于缩放控制）
  let trackPointLabelFeatures = []

  // 创建轨迹点标签的 Canvas 图片
  const createLabelCanvas = (labelText) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // 逻辑尺寸
    const fontSize = 10
    const font = `500 ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`
    ctx.font = font
    const textWidth = ctx.measureText(labelText).width

    const paddingX = 6
    const paddingY = 3
    const width = textWidth + paddingX * 2
    const height = fontSize + paddingY * 2
    const radius = 2
    const arrowHeight = 4
    const arrowWidth = 6
    const totalHeight = height + arrowHeight

    // 物理尺寸 = 逻辑尺寸 * dpr
    canvas.width = width * dpr
    canvas.height = totalHeight * dpr
    ctx.scale(dpr, dpr)

    // 绘制圆角矩形背景（带底部箭头）
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.lineTo(width - radius, 0)
    ctx.arcTo(width, 0, width, radius, radius)
    ctx.lineTo(width, height - radius)
    ctx.arcTo(width, height, width - radius, height, radius)
    ctx.lineTo(width / 2 + arrowWidth / 2, height)
    ctx.lineTo(width / 2, totalHeight)
    ctx.lineTo(width / 2 - arrowWidth / 2, height)
    ctx.lineTo(radius, height)
    ctx.arcTo(0, height, 0, height - radius, radius)
    ctx.lineTo(0, radius)
    ctx.arcTo(0, 0, radius, 0, radius)
    ctx.closePath()

    // 深色半透明背景
    ctx.fillStyle = 'rgba(0, 20, 40, 0.85)'
    ctx.fill()

    // 青色边框
    ctx.strokeStyle = 'rgba(1, 234, 255, 0.7)'
    ctx.lineWidth = 1
    ctx.stroke()

    // 青色文字
    ctx.font = font
    ctx.fillStyle = 'rgba(1, 234, 255, 1)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labelText, width / 2, height / 2)

    // 返回逻辑尺寸，OpenLayers 会根据 canvas 实际尺寸正确渲染
    return { canvas, width, totalHeight }
  }

  // 创建轨迹点标签样式
  const createTrackPointLabelStyle = (labelText) => {
    const { canvas, width, totalHeight } = createLabelCanvas(labelText)

    return new Style({
      image: new Icon({
        img: canvas,
        imgSize: [canvas.width, canvas.height], // 使用物理尺寸
        scale: 1 / (window.devicePixelRatio || 1), // 缩放回逻辑尺寸
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction'
      }),
      zIndex: 150
    })
  }

  // 创建轨迹点标签 Feature（使用 Canvas 渲染，性能更好）
  const createTrackPointLabelFeature = (coordinate, labelText, pointData, trajectoryId) => {
    if (!labelText) return null

    // 创建一个点 Feature 用于显示标签
    const labelFeature = new Feature({
      geometry: new Point(coordinate)
    })

    const labelStyle = createTrackPointLabelStyle(labelText)
    labelFeature.setStyle(labelStyle)
    labelFeature.set('originalLabelStyle', labelStyle)
    labelFeature.set('trajectoryId', trajectoryId)
    labelFeature.set('pointId', pointData.id)
    labelFeature.set('isTrackPointLabel', true)

    // 添加到轨迹点图层
    trackPointsLayer.getSource().addFeature(labelFeature)
    trackPointLabelFeatures.push({ feature: labelFeature, trajectoryId })

    return labelFeature
  }

  // 清除所有轨迹点标签 Feature
  const clearTrackPointLabelFeatures = () => {
    trackPointLabelFeatures.forEach(({ feature }) => {
      if (trackPointsLayer && trackPointsLayer.getSource()) {
        trackPointsLayer.getSource().removeFeature(feature)
      }
    })
    trackPointLabelFeatures = []
  }

  // 通过轨迹 ID 显示/隐藏轨迹点标签
  const toggleTrackPointLabelsByTrajectoryId = (trajectoryId, visible) => {
    trackPointLabelFeatures.forEach(({ feature, trajectoryId: id }) => {
      if (id === trajectoryId) {
        if (visible) {
          feature.setStyle(feature.get('originalLabelStyle'))
        } else {
          feature.setStyle(null)
        }
      }
    })
  }

  // 根据缩放级别更新轨迹点标签显示状态
  const updateTrackPointLabelsVisibility = () => {
    if (!map || trackPointLabelFeatures.length === 0) return

    const zoom = map.getView().getZoom()
    const shouldShow = zoom >= trackPointLabelMinZoom

    trackPointLabelFeatures.forEach(({ feature }) => {
      if (shouldShow) {
        feature.setStyle(feature.get('originalLabelStyle'))
      } else {
        feature.setStyle(null)
      }
    })
  }

  // 设置缩放监听，控制轨迹点标签显示
  const setupZoomListener = () => {
    if (zoomChangeListener) return

    zoomChangeListener = map.getView().on('change:resolution', () => {
      updateTrackPointLabelsVisibility()
    })
  }

  // 创建点样式（起点和终点使用 SVG 图标，轨迹点使用小圆点）
  const createPointStyle = (colorConfig, type = 'normal', label = '') => {
    if (type === 'start' || type === 'end') {
      return createLabelStyle(type, label)
    }

    // 轨迹点：简洁小圆点样式（与轨迹线协调）
    const { core } = colorConfig
    return new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.9)' }),
        stroke: new Stroke({
          color: core || 'rgba(100, 120, 140, 0.8)',
          width: 2
        })
      }),
      zIndex: 100
    })
  }

  /**
   * 停止动画（完全停止，不保留进度；若需暂停后继续请用 pauseAnimation + resumeAnimation）
   */
  const stopAnimation = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    isAnimating.value = false
    isPaused.value = false
    pausedElapsed = null
  }

  /**
   * 暂停动画（保留当前进度，可调用 resumeAnimation 继续）
   */
  const pauseAnimation = () => {
    if (!isAnimating.value) return
    pausedElapsed = (performance.now() - animationStartTime) * speedMultiplier
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    isAnimating.value = false
    isPaused.value = true
  }

  /**
   * 根据轨迹 ID 暂停指定轨迹的播放
   * @param {string} id - 轨迹 ID
   * @returns {boolean} 是否成功暂停
   */
  const pauseAnimationById = (id) => {
    // 只要正在播放就暂停
    if (!isAnimating.value) {
      console.warn('当前没有正在播放的动画')
      return false
    }

    // 暂停当前播放
    pauseAnimation()
    return true
  }

  /**
   * 从暂停处继续播放
   */
  const resumeAnimation = () => {
    if (!isPaused.value || pausedElapsed == null) return
    if (!animationStates.length) return
    // 使 elapsed 从 pausedElapsed 继续：elapsed = pausedElapsed + (timestamp - now) * speedMultiplier
    animationStartTime = performance.now() - pausedElapsed / speedMultiplier
    isAnimating.value = true
    isPaused.value = false
    pausedElapsed = null
    if (isAllMode) {
      animationFrameId = requestAnimationFrame(animateAll)
    } else {
      animationFrameId = requestAnimationFrame(animate)
    }
  }

  /**
   * 根据轨迹 ID 恢复指定轨迹的播放
   * @param {string} id - 轨迹 ID
   * @returns {boolean} 是否成功恢复
   */
  const resumeAnimationById = (id) => {
    if (!animationStates.length) {
      console.warn('没有可恢复的轨迹')
      return false
    }

    // 找到该轨迹的索引
    const index = animationStates.findIndex(s => s.trajectoryId === id)
    if (index === -1) {
      console.warn('未找到指定轨迹:', id)
      return false
    }

    // 如果当前处于暂停状态且有暂停进度，直接恢复播放
    if (isPaused.value && pausedElapsed != null) {
      resumeAnimation()
      return true
    }

    // 如果没有暂停，从头开始播放
    return startAnimationById(id)
  }

  /**
   * 设置播放速度倍率（如 1 正常，2 两倍速），播放中也可修改，不跳进度
   * @param {number} speed - 速度倍率，建议 0.25 ~ 4
   */
  const setPlaybackSpeed = (speed) => {
    const s = Number(speed)
    if (!Number.isFinite(s) || s <= 0) return

    const now = performance.now()
    // 播放中切换倍速时，保持当前有效已播放时间，避免进度跳变
    if (isAnimating.value) {
      const currentElapsed = (now - animationStartTime) * speedMultiplier
      animationStartTime = now - currentElapsed / s
    }

    speedMultiplier = s
    playbackSpeed.value = s
  }

  /**
   * 更新动画轨迹线
   */
  const updateAnimatedLine = (state, coordsArray) => {
    if (!lineAnimateLayer.getVisible()) {
      lineAnimateLayer.setVisible(true)
    }

    if (!state.animatedLineFeature) {
      // 首次创建轨迹线
      state.animatedLineFeature = new Feature({
        geometry: new LineString(coordsArray)
      })
      state.animatedLineFeature.set('trajectoryId', state.trajectoryId)
      state.animatedLineFeature.set('colorConfig', state.color) // 保存颜色配置用于留痕边框
      lineAnimateLayer.getSource().addFeature(state.animatedLineFeature)
    }
    else {
      // 更新已有轨迹线的坐标
      state.animatedLineFeature.getGeometry().setCoordinates(coordsArray)
    }
  }

  /**
   * 动画逻辑 - 基于固定速度的动画播放
   */
  const animate = (timestamp) => {
    if (currentAnimatingIndex < 0 || currentAnimatingIndex >= animationStates.length) {
      stopAnimation()
      return
    }

    const state = animationStates[currentAnimatingIndex]

    // 计算已用时间（考虑速度倍率）
    const elapsed = (timestamp - animationStartTime) * speedMultiplier

    // 计算进度（0-1），使用该轨迹独立的动画时长
    const progress = Math.min(elapsed / state.duration, 1)

    // 更新进度显示
    animationProgress.value = Math.round(progress * 100)

    if (progress < 1) {
      // 根据进度计算当前应该在哪个插值点，并限制在有效范围内
      const lastIdx = Math.max(0, state.newRoute.length - 1)
      const currentIndex = Math.min(Math.floor(progress * lastIdx), lastIdx)

      if (currentIndex !== state.lastIndex) {
        // 只在索引改变时更新位置
        const currentCoord = state.newRoute[currentIndex]
        const nextCoord = state.newRoute[Math.min(currentIndex + 1, lastIdx)]
        if (currentCoord == null || nextCoord == null) {
          state.lastIndex = currentIndex
          animationFrameId = requestAnimationFrame(animate)
          return
        }

        // 计算角度
        const angle = -Math.atan2(nextCoord[1] - currentCoord[1], nextCoord[0] - currentCoord[0])

        // 更新动画轨迹（只传递到当前点的所有坐标）
        updateAnimatedLine(state, state.newRoute.slice(0, currentIndex + 1))

        // 更新点的位置和角度
        state.pointFeature.getGeometry().setCoordinates(currentCoord)
        state.pointFeature.getStyle().getImage().setRotation(angle)

        state.lastIndex = currentIndex
      }

      animationFrameId = requestAnimationFrame(animate)
    }
    else {
      // 动画结束，确保到达终点
      const endCoord = state.newRoute[state.newRoute.length - 1]
      state.pointFeature.getGeometry().setCoordinates(endCoord)
      updateAnimatedLine(state, state.newRoute)

      const completedId = state.trajectoryId
      stopAnimation()
      try { onAnimationComplete?.(completedId) } catch (e) { console.warn(e) }
    }
  }

  /**
   * 同时播放所有轨迹动画
   */
  const animateAll = (timestamp) => {
    if (!animationStates.length) {
      stopAnimation()
      return
    }

    let allCompleted = true

    animationStates.forEach((state) => {
      if (state.completed) return

      // 计算已用时间（考虑速度倍率）
      const elapsed = (timestamp - animationStartTime) * speedMultiplier

      // 计算进度（0-1），使用该轨迹独立的动画时长
      const progress = Math.min(elapsed / state.duration, 1)

      if (progress < 1) {
        allCompleted = false

        // 根据进度计算当前应该在哪个插值点，并限制在有效范围内
        const lastIdx = Math.max(0, state.newRoute.length - 1)
        const currentIndex = Math.min(Math.floor(progress * lastIdx), lastIdx)

        if (currentIndex !== state.lastIndex) {
          // 只在索引改变时更新位置
          const currentCoord = state.newRoute[currentIndex]
          const nextIndex = Math.min(currentIndex + 1, lastIdx)
          const nextCoord = state.newRoute[nextIndex]
          if (currentCoord == null || nextCoord == null) {
            state.lastIndex = currentIndex
            return
          }

          // 计算角度
          const angle = -Math.atan2(nextCoord[1] - currentCoord[1], nextCoord[0] - currentCoord[0])

          // 更新动画轨迹（只传递到当前点的所有坐标）
          updateAnimatedLineForState(state, state.newRoute.slice(0, currentIndex + 1))

          // 更新点的位置和角度
          state.pointFeature.getGeometry().setCoordinates(currentCoord)
          state.pointFeature.getStyle().getImage().setRotation(angle)

          state.lastIndex = currentIndex
        }
      } else {
        // 该轨迹动画结束，通知本条轨迹完成（便于列表图标对应更新）
        if (!state.completed) {
          const endCoord = state.newRoute[state.newRoute.length - 1]
          state.pointFeature.getGeometry().setCoordinates(endCoord)
          updateAnimatedLineForState(state, state.newRoute)
          state.completed = true
          try { onAnimationComplete?.(state.trajectoryId) } catch (e) { console.warn(e) }
        }
      }
    })

    // 更新总进度（取最大进度）
    const maxProgress = Math.max(...animationStates.map(s => {
      const elapsed = (timestamp - animationStartTime) * speedMultiplier
      return Math.min(elapsed / s.duration, 1)
    }))
    animationProgress.value = Math.round(maxProgress * 100)

    if (!allCompleted) {
      animationFrameId = requestAnimationFrame(animateAll)
    } else {
      stopAnimation()
      try { onAnimationComplete?.(null) } catch (e) { console.warn(e) }
    }
  }

  /**
   * 为单个状态更新动画轨迹线
   */
  const updateAnimatedLineForState = (state, coordsArray) => {
    if (!lineAnimateLayer.getVisible()) {
      lineAnimateLayer.setVisible(true)
    }

    if (!state.animatedLineFeature) {
      // 首次创建轨迹线
      state.animatedLineFeature = new Feature({
        geometry: new LineString(coordsArray)
      })
      state.animatedLineFeature.set('trajectoryId', state.trajectoryId)
      state.animatedLineFeature.set('colorConfig', state.color) // 保存颜色配置用于留痕边框
      lineAnimateLayer.getSource().addFeature(state.animatedLineFeature)
    } else {
      // 更新已有轨迹线的坐标
      state.animatedLineFeature.getGeometry().setCoordinates(coordsArray)
    }
  }

  /**
   * 开始播放所有轨迹动画
   */
  const startAllAnimations = () => {
    if (!animationStates.length) {
      console.warn('没有可播放的轨迹')
      return
    }

    // 如果已经在播放，先停止
    if (isAnimating.value) {
      stopAnimation()
    }

    isAllMode = true
    isPaused.value = false
    pausedElapsed = null

    // 重置所有状态
    lineAnimateLayer.getSource().clear()
    animationStates.forEach((state) => {
      state.lastIndex = -1
      state.animatedLineFeature = null
      state.completed = false
      // 重置点的位置
      state.pointFeature.getGeometry().setCoordinates(state.originalCoords[0])
      state.pointFeature.getStyle().getImage().setRotation(0)
    })

    isAnimating.value = true
    animationProgress.value = 0
    animationStartTime = performance.now()

    animationFrameId = requestAnimationFrame(animateAll)
  }

  /**
   * 开始播放动画（播放指定索引的轨迹，默认播放第一条）
   */
  const startAnimation = (trajectoryIndex = 0) => {
    if (!animationStates.length || trajectoryIndex >= animationStates.length) {
      console.warn('没有可播放的轨迹')
      return
    }

    // 如果已经在播放，先停止
    if (isAnimating.value) {
      stopAnimation()
    }

    isAllMode = false
    isPaused.value = false
    pausedElapsed = null

    currentAnimatingIndex = trajectoryIndex
    const state = animationStates[currentAnimatingIndex]

    // 重置状态
    state.lastIndex = -1
    state.animatedLineFeature = null
    lineAnimateLayer.getSource().clear()

    // 重置点的位置
    state.pointFeature.getGeometry().setCoordinates(state.originalCoords[0])
    state.pointFeature.getStyle().getImage().setRotation(0)

    isAnimating.value = true
    animationProgress.value = 0
    animationStartTime = performance.now()

    animationFrameId = requestAnimationFrame(animate)
  }

  /**
   * 重置动画
   */
  const resetAnimation = () => {
    stopAnimation()

    if (currentAnimatingIndex >= 0 && currentAnimatingIndex < animationStates.length) {
      const state = animationStates[currentAnimatingIndex]
      state.lastIndex = -1
      state.animatedLineFeature = null

      // 清除动画轨迹
      lineAnimateLayer.getSource().clear()
      lineAnimateLayer.setVisible(false)

      // 重置点的位置
      if (state.pointFeature) {
        state.pointFeature.getGeometry().setCoordinates(state.originalCoords[0])
        state.pointFeature.getStyle().getImage().setRotation(0)
      }
    }

    animationProgress.value = 0
    animationStartTime = 0
    currentAnimatingIndex = -1
  }

  // 绘制轨迹
  const draw = () => {
    if (!layer || !trajectories.value.length)
      return

    const source = layer.getSource()
    source.clear()

    // 清除之前的标签 Overlay
    clearLabelOverlays()
    clearTrackPointLabelFeatures()

    // 重置动画相关状态
    stopAnimation()
    animationStates = []

    trajectories.value.forEach((trajectory, index) => {
      const { data, id: trajectoryId, name, startPoint, endPoint } = trajectory
      if (!data || data.length < 2)
        return

      const color = COLORS[index % COLORS.length]

      // 检查是否有 fromAmap 标记的点
      const amapPoints = data.filter(p => p.fromAmap === true)
      const hasAmapPoints = amapPoints.length > 0

      // 根据是否有 fromAmap 点来决定用哪些点绘制线
      let lineData = data
      let pointData = []

      if (hasAmapPoints) {
        // 如果有 fromAmap 点，用这些点绘制线，其他点作为轨迹点
        lineData = amapPoints
        pointData = data.filter(p => !p.fromAmap)
      }
      else {
        // 如果没有 fromAmap 点，保持原有逻辑：用所有点绘制线
        lineData = data
        pointData = renderTrackPoints ? data : []
      }

      // 获取起点终点标签（优先从 trajectory 获取，其次从第一个点的数据获取）
      const startLabel = startPoint || data[0]?.startPoint || ''
      const endLabel = endPoint || data[0]?.endPoint || ''

      // WGS84 坐标（用于 turf.js 计算距离）
      const coords = lineData.map(p => [Number(p.longitude), Number(p.latitude)])

      // 计算轨迹实际长度（公里）
      const trajectoryLine = turf.lineString(coords)
      const trajectoryLength = turf.length(trajectoryLine, { units: 'kilometers' })

      // 根据固定速度计算该轨迹的动画时长（毫秒）
      // duration = 长度 / 速度 * 1000（转为毫秒）
      const trajectoryDuration = (trajectoryLength / fixedSpeed) * 1000

      // 如果开启了轨迹回放功能，使用插值生成平滑路径
      // 根据该轨迹的动画时长和期望帧率（60fps）计算插值步数
      const targetSteps = Math.floor((trajectoryDuration / 1000) * 60) // 60fps
      const routeCoords = enableTrajectoryPlayback ? getRoute(coords, targetSteps) : coords

      // 转换为 EPSG:3857 坐标（用于 OpenLayers 渲染）
      const routeCoords3857 = routeCoords.map(c => fromLonLat(c))
      const coords3857 = coords.map(c => fromLonLat(c))

      // 添加完整轨迹线（高德导航风格）
      const lineFeature = new Feature({ geometry: new LineString(routeCoords3857) })
      lineFeature.set('colorConfig', color)
      lineFeature.set('trajectoryId', trajectoryId) // 添加轨迹 id
      // 使用 style function 以便根据分辨率动态计算箭头
      const lineStyle = (feature, resolution) => createLineStyle(color, feature, resolution)
      lineFeature.setStyle(lineStyle)
      lineFeature.set('originalStyle', lineStyle) // 保存原始样式
      source.addFeature(lineFeature)

      // 只有开启轨迹回放功能时才创建移动图标和动画状态
      if (enableTrajectoryPlayback) {
        // 创建移动点（车辆/船只图标）- 添加到独立的最高层图层
        const iconSrc = playbackOptions.icon || '/src/assets/car.png'
        const iconScale = playbackOptions.iconScale || 1

        const pointFeature = new Feature({ geometry: new Point(coords3857[0]) })
        const movingStyle = new Style({
          image: new Icon({
            src: iconSrc,
            scale: iconScale,
            rotateWithView: true,
            rotation: 0,
            anchor: [0.5, 0.5]
          })
        })
        pointFeature.setStyle(movingStyle)
        pointFeature.set('originalStyle', movingStyle)
        pointFeature.set('trajectoryId', trajectoryId) // 添加轨迹 id
        // 添加到移动图标图层（最高层级，不被灰色留痕覆盖）
        movingIconLayer.getSource().addFeature(pointFeature)

        // 保存动画状态（包含该轨迹独立的动画时长）
        animationStates.push({
          trajectoryId, // 添加轨迹 id
          originalCoords: coords3857,
          newRoute: routeCoords3857,
          pointFeature,
          animatedLineFeature: null,
          lastIndex: -1, // 上一次渲染的索引
          duration: trajectoryDuration, // 该轨迹的动画时长（毫秒）
          length: trajectoryLength, // 轨迹实际长度（公里）
          color
        })
      }

      // 添加轨迹点（小圆点），并附加数据用于 hover
      // 如果有 fromAmap 点，只绘制非 fromAmap 的点
      // 如果没有 fromAmap 点，根据 renderTrackPoints 配置决定是否绘制
      // 轨迹点添加到专门的图层，确保在留痕上方
      const trackPointsSource = trackPointsLayer.getSource()

      if (pointData.length > 0) {
        pointData.forEach((pointDataItem, pointIndex) => {
          const coord = fromLonLat([Number(pointDataItem.longitude), Number(pointDataItem.latitude)])
          const pointFeature = new Feature({ geometry: new Point(coord) })
          const pointStyle = createPointStyle(color, 'normal')
          pointFeature.setStyle(pointStyle)
          pointFeature.set('originalStyle', pointStyle)
          pointFeature.set('pointData', pointDataItem) // 附加数据
          pointFeature.set('trajectoryId', trajectoryId) // 添加轨迹 id
          trackPointsSource.addFeature(pointFeature)

          // 如果配置了轨迹点标签函数，为每个点创建标签 Feature（Canvas 渲染，性能好，无需采样）
          if (trackPointLabelConfig && typeof trackPointLabelConfig === 'function') {
            const labelText = trackPointLabelConfig(pointDataItem, pointIndex, pointData)
            if (labelText) {
              createTrackPointLabelFeature(coord, labelText, pointDataItem, trajectoryId)
            }
          }
        })
      }

      // 确定起点和终点的坐标
      // 如果有 fromAmap 点，使用 pointData（非 fromAmap 的数据）的第一个和最后一个点
      // 如果没有 fromAmap 点，使用 coords3857（线数据）的第一个和最后一个点
      let startCoord, endCoord
      if (hasAmapPoints && pointData.length > 0) {
        startCoord = fromLonLat([Number(pointData[0].longitude), Number(pointData[0].latitude)])
        endCoord = fromLonLat([Number(pointData[pointData.length - 1].longitude), Number(pointData[pointData.length - 1].latitude)])
      }
      else {
        startCoord = coords3857[0]
        endCoord = coords3857[coords3857.length - 1]
      }

      // 添加起点（使用小圆点，添加到轨迹点图层）
      const startFeature = new Feature({ geometry: new Point(startCoord) })
      const startStyle = createPointStyle(color, 'start', startLabel)
      startFeature.setStyle(startStyle)
      startFeature.set('originalStyle', startStyle)
      startFeature.set('trajectoryId', trajectoryId) // 添加轨迹 id
      trackPointsSource.addFeature(startFeature)

      // 添加终点（使用小圆点，添加到轨迹点图层）
      const endFeature = new Feature({ geometry: new Point(endCoord) })
      const endStyle = createPointStyle(color, 'end', endLabel)
      endFeature.setStyle(endStyle)
      endFeature.set('originalStyle', endStyle)
      endFeature.set('trajectoryId', trajectoryId) // 添加轨迹 id
      trackPointsSource.addFeature(endFeature)

      // 如果有标签，创建 Overlay 显示（使用 HTML/CSS，清晰不模糊）
      if (startLabel) {
        createLabelOverlay(startCoord, 'start', startLabel, trajectoryId)
      }
      if (endLabel) {
        createLabelOverlay(endCoord, 'end', endLabel, trajectoryId)
      }
    })

    isDrawn.value = true

    // 绘制自定义标注点
    if (customMarkers && customMarkers.length > 0) {
      const trackPointsSource = trackPointsLayer.getSource()

      customMarkers.forEach((marker, index) => {
        const { longitude, latitude, label, type = 'info', color: markerColor } = marker
        if (!longitude || !latitude) return

        const coord = fromLonLat([Number(longitude), Number(latitude)])

        // 根据类型设置颜色
        let bgColor = '#1890ff' // 默认蓝色
        const textColor = '#fff'
        if (type === 'warning' || type === 'off') {
          bgColor = '#ff4d4f' // 红色 - 变装前/警告
        } else if (type === 'success' || type === 'on') {
          bgColor = '#52c41a' // 绿色 - 变装后/成功
        } else if (type === 'info') {
          bgColor = '#1890ff' // 蓝色 - 信息
        } else if (markerColor) {
          bgColor = markerColor // 自定义颜色
        }

        // 创建标注点 Feature
        const markerFeature = new Feature({ geometry: new Point(coord) })
        const markerStyle = new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: bgColor }),
            stroke: new Stroke({ color: '#ffffff', width: 3 })
          }),
          zIndex: 500 // 高于起终点的 zIndex(200)
        })
        markerFeature.setStyle(markerStyle)
        markerFeature.set('originalStyle', markerStyle)
        markerFeature.set('customMarker', true)
        markerFeature.set('markerData', marker)
        trackPointsSource.addFeature(markerFeature)

        // 如果有标签，创建 Overlay 显示
        if (label) {
          createCustomMarkerOverlay(coord, label, bgColor, `custom-marker-${index}`)
        }
      })
    }

    // 自动适配视角到第一条轨迹
    if (trajectories.value.length > 0) {
      const firstTrajectory = trajectories.value[0]
      if (firstTrajectory?.data?.length >= 2) {
        const firstCoords = firstTrajectory.data.map(p => fromLonLat([Number(p.longitude), Number(p.latitude)]))
        const firstLineFeature = new Feature({ geometry: new LineString(firstCoords) })
        const extent = firstLineFeature.getGeometry().getExtent()
        if (extent.every(v => Number.isFinite(v))) {
          // 如果设置了固定缩放级别，直接使用
          if (fixedZoom !== null) {
            map.getView().fit(extent, {
              padding: [100, 100, 100, 100],
              duration: 500,
              maxZoom: fixedZoom,
              minZoom: fixedZoom
            })
          } else {
            // 计算轨迹长度（公里）
            const wgs84Coords = firstTrajectory.data.map(p => [Number(p.longitude), Number(p.latitude)])
            const line = turf.lineString(wgs84Coords)
            const length = turf.length(line, { units: 'kilometers' })

            // 根据轨迹长度动态设置 maxZoom
            // 轨迹越短，maxZoom 越小，避免缩放太近
            let maxZoom = 17
            if (length < 0.5) {
              maxZoom = 18 // 小于500米
            } else if (length < 2) {
              maxZoom = 16 // 小于2公里
            } else if (length < 10) {
              maxZoom = 17 // 小于10公里
            }

            map.getView().fit(extent, {
              padding: [100, 100, 100, 100],
              duration: 500,
              maxZoom
            })
          }
        }
      }
    }

    // 如果开启了轨迹回放且配置了自动播放，则自动开始播放所有轨迹
    if (enableTrajectoryPlayback && autoPlay && animationStates.length > 0) {
      // 延迟启动，等待地图适配完成
      setTimeout(() => {
        startAllAnimations()
      }, 600)
    }

    // 如果有轨迹点标签，设置缩放监听并更新初始显示状态
    if (trackPointLabelFeatures.length > 0) {
      setupZoomListener()
      updateTrackPointLabelsVisibility()
    }
  }

  // 初始化
  const init = (mapInstance, options = {}) => {
    map = mapInstance

    // 设置 hover 配置
    // 可以是函数（返回 HTML 字符串）或组件（动态 import 或直接传入组件）
    // 不传入则使用默认的 TrajectoryPointPopup 组件
    hoverConfig = options.hoverContent || TrajectoryPointPopup

    // 设置点击回调
    onPointClick = options.onPointClick || null

    // 轨迹回放配置
    enableTrajectoryPlayback = !!options.enableTrajectoryPlayback
    if (enableTrajectoryPlayback && options.playbackOptions) {
      playbackOptions = {
        icon: options.playbackOptions.icon,
        iconScale: options.playbackOptions.iconScale,
        fixedSpeed: options.playbackOptions.fixedSpeed,
        speedMultiplier: options.playbackOptions.speedMultiplier,
        autoPlay: options.playbackOptions.autoPlay
      }
      onAnimationComplete = typeof options.playbackOptions.onAnimationComplete === 'function'
        ? options.playbackOptions.onAnimationComplete
        : null

      // 设置固定速度（公里/秒）
      if (playbackOptions.fixedSpeed) {
        fixedSpeed = playbackOptions.fixedSpeed
      }

      // 设置速度倍率
      if (playbackOptions.speedMultiplier) {
        speedMultiplier = playbackOptions.speedMultiplier
        playbackSpeed.value = speedMultiplier
      }

      // 设置自动播放
      autoPlay = !!playbackOptions.autoPlay
    }

    createLayer()

    // 只有配置了 hoverContent 才创建 hover overlay
    if (hoverConfig) {
      createHoverOverlay()
      setupHoverListener()
    }

    // 设置点击监听
    setupClickListener()
  }

  // 显示
  const show = () => {
    if (!layer)
      return

    isVisible.value = true

    // 懒加载：首次显示时才绘制
    if (!isDrawn.value && trajectories.value.length) {
      draw()
    }

    layer.setVisible(true)
    if (trackPointsLayer) {
      trackPointsLayer.setVisible(true)
    }
    if (movingIconLayer) {
      movingIconLayer.setVisible(true)
    }
  }

  // 更新数据（自动显示）
  const updateData = (data, options = {}) => {
    // 先清除旧的标签 Overlay（确保切换数据时清理干净）
    clearLabelOverlays()
    clearTrackPointLabelFeatures()

    // 清除图层数据
    if (layer) {
      layer.getSource().clear()
    }
    if (trackPointsLayer) {
      trackPointsLayer.getSource().clear()
    }
    if (lineAnimateLayer) {
      lineAnimateLayer.getSource().clear()
    }
    if (movingIconLayer) {
      movingIconLayer.getSource().clear()
    }

    // 停止动画
    stopAnimation()
    animationStates = []

    trajectories.value = data || []
    isDrawn.value = false

    // 是否渲染轨迹点小圆点，默认不渲染
    renderTrackPoints = !!options.renderTrackPoints

    // 轨迹点标签配置：函数 (data) => string | null
    // 默认不显示，传入函数时才显示
    if (Object.prototype.hasOwnProperty.call(options, 'trackPointLabel')) {
      trackPointLabelConfig = options.trackPointLabel
    }

    // 轨迹点标签最小显示缩放级别（默认 15）
    if (options.trackPointLabelMinZoom !== undefined) {
      trackPointLabelMinZoom = options.trackPointLabelMinZoom
    }

    // 自定义标注点配置
    // 格式: [{ longitude, latitude, label, type, color }]
    // type: 'warning' | 'info' | 'custom'
    if (options.customMarkers) {
      customMarkers = options.customMarkers
    } else {
      customMarkers = []
    }

    // 固定缩放级别配置
    // 如果设置，则视角适配时使用固定的 zoom 级别，不根据轨迹长度动态计算
    if (options.fixedZoom !== undefined) {
      fixedZoom = options.fixedZoom
    } else {
      fixedZoom = null
    }

    // 更新轨迹回放配置
    if (Object.prototype.hasOwnProperty.call(options, 'enableTrajectoryPlayback')) {
      enableTrajectoryPlayback = !!options.enableTrajectoryPlayback
    }

    if (options.playbackOptions) {
      playbackOptions = {
        ...playbackOptions,
        ...options.playbackOptions
      }

      // 更新固定速度
      if (playbackOptions.fixedSpeed) {
        fixedSpeed = playbackOptions.fixedSpeed
      }

      // 更新速度倍率
      if (playbackOptions.speedMultiplier) {
        speedMultiplier = playbackOptions.speedMultiplier
        playbackSpeed.value = speedMultiplier
      }

      // 更新自动播放
      if (Object.prototype.hasOwnProperty.call(playbackOptions, 'autoPlay')) {
        autoPlay = !!playbackOptions.autoPlay
      }
    }

    // 自动显示
    show()
  }

  // 隐藏
  const hide = () => {
    if (!layer)
      return

    isVisible.value = false
    layer.setVisible(false)
    if (trackPointsLayer) {
      trackPointsLayer.setVisible(false)
    }
    if (movingIconLayer) {
      movingIconLayer.setVisible(false)
    }

    // 隐藏时停止动画
    stopAnimation()
  }

  // 切换显示
  const toggle = () => {
    isVisible.value ? hide() : show()
  }

  // 清空
  const clear = () => {
    console.log('useTrajectoryLayer clear() 被调用')
    if (layer) {
      layer.getSource().clear()
      layer.setVisible(false)
    }
    if (lineAnimateLayer) {
      lineAnimateLayer.getSource().clear()
      lineAnimateLayer.setVisible(false)
    }
    if (trackPointsLayer) {
      trackPointsLayer.getSource().clear()
      trackPointsLayer.setVisible(false)
    }
    if (movingIconLayer) {
      movingIconLayer.getSource().clear()
      movingIconLayer.setVisible(false)
    }
    // 清除标签 Overlay
    console.log('准备调用 clearLabelOverlays')
    clearLabelOverlays()
    clearTrackPointLabelFeatures()

    // 清除自定义标注点配置
    customMarkers = []

    trajectories.value = []
    isDrawn.value = false
    isVisible.value = false
    currentHoveredPointId = null
    hoverData.value = null
    stopAnimation()
    animationStates = []
    currentAnimatingIndex = -1
    animationProgress.value = 0
    isPaused.value = false
    pausedElapsed = null
    if (hoverOverlay) {
      hoverOverlay.setPosition(undefined)
    }
  }

  // 销毁
  const destroy = () => {
    // 清理图层
    if (map && layer) {
      map.removeLayer(layer)
    }
    if (map && lineAnimateLayer) {
      map.removeLayer(lineAnimateLayer)
    }
    if (map && trackPointsLayer) {
      map.removeLayer(trackPointsLayer)
    }
    if (map && movingIconLayer) {
      map.removeLayer(movingIconLayer)
    }

    // 清理 hover overlay
    if (map && hoverOverlay) {
      map.removeOverlay(hoverOverlay)
    }

    // 清除标签 Overlay
    clearLabelOverlays()
    clearTrackPointLabelFeatures()

    // 清理 Vue 实例
    if (hoverApp) {
      hoverApp.unmount()
      hoverApp = null
    }

    // 清理监听器
    if (pointerMoveListener) {
      pointerMoveListener.remove()
      pointerMoveListener = null
    }

    if (clickListener) {
      clickListener.remove()
      clickListener = null
    }

    if (zoomChangeListener) {
      zoomChangeListener.remove()
      zoomChangeListener = null
    }

    layer = null
    lineAnimateLayer = null
    trackPointsLayer = null
    movingIconLayer = null
    map = null
    hoverOverlay = null
    currentHoveredPointId = null
    onPointClick = null
    trackPointLabelConfig = null
    trajectories.value = []
    isDrawn.value = false
    isVisible.value = false
    hoverData.value = null
    isAnimating.value = false
    stopAnimation()
    animationStates = []
    currentAnimatingIndex = -1
    animationProgress.value = 0
    isPaused.value = false
    pausedElapsed = null
  }

  // 通过 id 显示指定轨迹
  const showById = (id) => {
    if (!layer) return

    console.log('showById 被调用, id:', id)

    const sources = [layer.getSource(), trackPointsLayer?.getSource(), movingIconLayer?.getSource(), lineAnimateLayer?.getSource()]
    sources.forEach(source => {
      if (!source) return
      source.getFeatures().forEach(feature => {
        if (feature.get('trajectoryId') === id) {
          const originalStyle = feature.get('originalStyle')
          if (originalStyle) {
            feature.setStyle(originalStyle)
          }
          feature.set('isHidden', false)
        }
      })
    })

    // 同时显示标签 Overlay
    toggleLabelOverlaysByTrajectoryId(id, true)
    // 同时显示轨迹点标签
    toggleTrackPointLabelsByTrajectoryId(id, true)
  }

  // 通过 id 隐藏指定轨迹
  const hideById = (id) => {
    if (!layer) return

    console.log('hideById 被调用, id:', id)

    const sources = [layer.getSource(), trackPointsLayer?.getSource(), movingIconLayer?.getSource(), lineAnimateLayer?.getSource()]
    sources.forEach(source => {
      if (!source) return
      source.getFeatures().forEach(feature => {
        if (feature.get('trajectoryId') === id) {
          // 保存原始样式（如果还没保存的话）
          if (!feature.get('originalStyle')) {
            feature.set('originalStyle', feature.getStyle())
          }
          // 使用空样式数组来隐藏（比 null 更可靠）
          feature.setStyle(() => [])
          feature.set('isHidden', true)
        }
      })
    })

    // 同时隐藏标签 Overlay
    toggleLabelOverlaysByTrajectoryId(id, false)
    // 同时隐藏轨迹点标签
    toggleTrackPointLabelsByTrajectoryId(id, false)
  }

  // 通过 id 切换指定轨迹显示状态
  const toggleById = (id) => {
    if (!layer) return

    const source = layer.getSource()
    const feature = source.getFeatures().find(f => f.get('trajectoryId') === id)
    if (feature) {
      if (feature.get('isHidden')) {
        showById(id)
      } else {
        hideById(id)
      }
    }
  }

  // 通过 id 移除指定轨迹
  const removeById = (id) => {
    if (!layer) return

    const sources = [layer.getSource(), trackPointsLayer?.getSource(), movingIconLayer?.getSource(), lineAnimateLayer?.getSource()]
    sources.forEach(source => {
      if (!source) return
      const featuresToRemove = source.getFeatures().filter(f => f.get('trajectoryId') === id)
      featuresToRemove.forEach(f => source.removeFeature(f))
    })

    // 从 trajectories 中移除
    trajectories.value = trajectories.value.filter(t => t.id !== id)

    // 从动画状态中移除
    const stateIndex = animationStates.findIndex(s => s.trajectoryId === id)
    if (stateIndex > -1) {
      animationStates.splice(stateIndex, 1)
    }
  }

  // 获取所有轨迹 id 列表
  const getTrajectoryIds = () => {
    return trajectories.value.map(t => t.id).filter(Boolean)
  }

  /**
   * 根据轨迹 ID 播放单条轨迹动画
   * @param {string} id - 轨迹 ID
   */
  const startAnimationById = (id) => {
    if (!animationStates.length) {
      console.warn('没有可播放的轨迹')
      return false
    }

    // 找到该轨迹的索引
    const index = animationStates.findIndex(s => s.trajectoryId === id)
    if (index === -1) {
      console.warn('未找到指定轨迹:', id)
      return false
    }

    // 如果已经在播放，先停止
    if (isAnimating.value) {
      stopAnimation()
    }

    isAllMode = false
    isPaused.value = false
    pausedElapsed = null

    currentAnimatingIndex = index
    const state = animationStates[currentAnimatingIndex]

    // 重置状态
    state.lastIndex = -1
    state.animatedLineFeature = null
    lineAnimateLayer.getSource().clear()

    // 重置点的位置
    state.pointFeature.getGeometry().setCoordinates(state.originalCoords[0])
    state.pointFeature.getStyle().getImage().setRotation(0)

    isAnimating.value = true
    animationProgress.value = 0
    animationStartTime = performance.now()

    animationFrameId = requestAnimationFrame(animate)
    return true
  }

  /**
   * 获取当前正在播放的轨迹 ID
   */
  const getCurrentAnimatingId = () => {
    if (currentAnimatingIndex >= 0 && currentAnimatingIndex < animationStates.length) {
      return animationStates[currentAnimatingIndex].trajectoryId
    }
    return null
  }

  return {
    isVisible,
    isAnimating,
    isPaused,
    animationProgress,
    playbackSpeed,
    trajectories,
    init,
    updateData,
    show,
    hide,
    toggle,
    clear,
    destroy,
    startAnimation,
    startAllAnimations,
    startAnimationById,
    stopAnimation,
    pauseAnimation,
    pauseAnimationById,
    resumeAnimation,
    resumeAnimationById,
    resetAnimation,
    setPlaybackSpeed,
    showById,
    hideById,
    toggleById,
    removeById,
    getTrajectoryIds,
    getCurrentAnimatingId
  }
}
