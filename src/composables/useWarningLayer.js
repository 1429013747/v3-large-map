import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import Overlay from 'ol/Overlay'
import VectorSource from 'ol/source/Vector'
import { Style } from 'ol/style'
import { ref } from 'vue'

// 默认预警卡片背景图路径（模块级常量）
const DEFAULT_BG_IMAGE_PATH = new URL('../../assets/map-warning-bg.png', import.meta.url).href

// 模块级共享背景图（只加载一次）
let sharedBgImage = null
let sharedBgLoaded = false
let sharedBgInit = false

function ensureSharedBgImage(path) {
  if (typeof Image === 'undefined')
    return

  const bgPath = path || DEFAULT_BG_IMAGE_PATH
  if (!bgPath)
    return

  // 已经初始化过就不再重复创建
  if (sharedBgInit)
    return

  sharedBgInit = true
  sharedBgImage = new Image()
  sharedBgImage.src = bgPath
  sharedBgImage.onload = () => {
    sharedBgLoaded = true
  }
}

// 模块加载时就预加载一次默认背景图
ensureSharedBgImage()

/**
 * 预警图层（使用 Overlay 实现）
 *
 * 在地图上显示预警标记，包含：
 * - 预警信息卡片（232×168px，使用背景图片 + DOM 文本）
 */
export function useWarningLayer(map, options = {}) {
  const {
    // 是否使用 DOM Overlay（默认 true）。false 时改用 Canvas Style renderer 自定义绘制。
    useOverlay = false,
    // 背景图片路径（使用 Vite 的资源处理方式）
    bgImagePath = DEFAULT_BG_IMAGE_PATH,
    // 从业务数据中取坐标 [lon, lat]
    getCoordinates = (item) => {
      if (item.coordinates)
        return item.coordinates
      const lon = item.lon ?? item.longitude
      const lat = item.lat ?? item.latitude
      return [lon, lat]
    },
    // 从业务数据中取时间
    getTime = item => item.warningTime || '-',
    // 从业务数据中取车牌号/标题
    getTitle = item => item.warningObject || '-',
    // 从业务数据中取预警内容
    getWarning = item => item.warningTitle || '-',
    // 点击回调：({ data, overlay }) => void
    onClick,
    // 是否启用缩放跟随（默认开启）
    enableZoomScale = true,
    // 基准缩放级别（在此级别下卡片为原始大小）
    baseZoomLevel = 14,
    // 最小缩放比例
    minScale = 0.2,
    // 最大缩放比例
    maxScale = 2
  } = options

  const visible = ref(false)
  const initialized = ref(false)

  // 存储所有 overlay 实例
  const overlays = []

  // Canvas 模式下的矢量图层/数据源
  let vectorSource = null
  let vectorLayer = null
  let mapClickHandler = null
  // Canvas 模式下的背景图：使用模块级单例，如果传入了自定义路径，这里也触发一次预加载
  ensureSharedBgImage(bgImagePath)

  // 缩放监听器
  let zoomChangeHandler = null
  // 当前缩放比例因子
  let currentZoomScale = 1

  // 预警卡片尺寸（与背景图片尺寸一致），整体缩放 0.7 倍
  const BASE_CARD_WIDTH = 232
  const BASE_CARD_HEIGHT = 188
  const CARD_SCALE = 0.7

  /**
   * 根据当前地图缩放级别计算缩放比例
   */
  function calculateZoomScale() {
    if (!enableZoomScale || !map)
      return 1

    const view = map.getView()
    if (!view)
      return 1

    const currentZoom = view.getZoom()
    if (!Number.isFinite(currentZoom))
      return 1

    // 根据缩放级别差值计算比例，每差一级缩放 15%
    const zoomDiff = currentZoom - baseZoomLevel
    let scale = 1 + zoomDiff * 0.15

    // 限制在最小和最大范围内
    scale = Math.max(minScale, Math.min(maxScale, scale))
    return scale
  }

  /**
   * 获取当前实际的卡片宽度（考虑缩放）
   */
  function getScaledCardWidth() {
    return BASE_CARD_WIDTH * CARD_SCALE * currentZoomScale
  }

  /**
   * 获取当前实际的卡片高度（考虑缩放）
   */
  function getScaledCardHeight() {
    return BASE_CARD_HEIGHT * CARD_SCALE * currentZoomScale
  }

  // 锚点：与 Overlay 实现保持一致，等价于 anchor: [0.25, 1]
  const ANCHOR_X = 0.15
  const ANCHOR_Y = 0.9

  // Canvas 模式下的卡片缓存：按 time/title/warning 组合做 key，避免每一帧重复绘制文本
  const canvasCardCache = new Map()

  function buildCardCacheKey(time, title, warning) {
    // 使用特殊分隔符，避免普通文本冲突
    return `${time || ''}__@@__${title || ''}__@@__${warning || ''}`
  }

  /**
   * 在离屏 canvas 上绘制一张完整的卡片，并缓存
   * 说明：
   * - 这里用基础尺寸 BASE_CARD_WIDTH/HEIGHT 绘制，真正渲染时再按比例缩放
   * - 这样可以避免在每一帧里 measureText + 多行排版，明显减轻 CPU 压力
   */
  function getOrCreateCardCanvas({ time, title, warning }) {
    const key = buildCardCacheKey(time, title, warning)
    if (canvasCardCache.has(key))
      return canvasCardCache.get(key)

    if (typeof document === 'undefined') {
      // SSR 场景兜底
      return null
    }

    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = BASE_CARD_WIDTH
    offscreenCanvas.height = BASE_CARD_HEIGHT

    const ctx = offscreenCanvas.getContext('2d')
    if (!ctx) {
      const stub = { canvas: offscreenCanvas, width: BASE_CARD_WIDTH, height: BASE_CARD_HEIGHT }
      canvasCardCache.set(key, stub)
      return stub
    }

    // 注意：这里不再考虑设备像素比，统一在基础尺寸上绘制，主画布上做缩放即可
    const layoutScale = 1
    const cardW = BASE_CARD_WIDTH
    const cardH = BASE_CARD_HEIGHT
    const left = 0
    const top = 0

    ctx.save()

    // 如果背景图已加载，直接绘制背景图片；否则退化为纯色面板
    if (sharedBgLoaded && sharedBgImage) {
      ctx.globalAlpha = 1
      ctx.drawImage(sharedBgImage, left, top, cardW, cardH)
    }
    else {
      // 背景阴影
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.beginPath()
      ctx.rect(left + 2, top + 4, cardW, cardH)
      ctx.fill()

      // 主面板：深色半透明，模仿现有卡片视觉
      ctx.fillStyle = 'rgba(16, 28, 54, 0.96)'
      ctx.beginPath()
      ctx.rect(left, top, cardW, cardH)
      ctx.fill()
    }

    // 文本样式
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'

    // 文本字号 & 行高（注意：这里基于基础尺寸，后续整体缩放）
    const timeFontSize = 14 * layoutScale
    const titleFontSize = 16 * layoutScale
    const warningFontSize = 16 * layoutScale

    // 时间
    if (time) {
      ctx.font = `${timeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      ctx.fillText(String(time), left + 60 * layoutScale, top + 8 * layoutScale)
    }

    // 标题（车牌/船名）
    if (title) {
      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      ctx.fillText(String(title), left + 80 * layoutScale, top + 46 * layoutScale)
    }

    // 预警内容（多行折行，最多 3 行）
    if (warning) {
      const text = String(warning)
      ctx.font = `bold ${warningFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
      const maxWidth = cardW - 80 * layoutScale
      const lineHeight = 18 * layoutScale
      const maxLines = 3

      let line = ''
      let lineIndex = 0
      for (let i = 0; i < text.length && lineIndex < maxLines; i++) {
        const ch = text[i]
        const testLine = line + ch
        const { width } = ctx.measureText(testLine)
        if (width > maxWidth && line) {
          ctx.fillText(line, left + 80 * layoutScale, top + 70 * layoutScale + lineIndex * lineHeight)
          line = ch
          lineIndex++
        }
        else {
          line = testLine
        }
      }
      if (line && lineIndex < maxLines)
        ctx.fillText(line, left + 80 * layoutScale, top + 70 * layoutScale + lineIndex * lineHeight)
    }

    ctx.restore()

    const cacheItem = { canvas: offscreenCanvas, width: cardW, height: cardH }
    canvasCardCache.set(key, cacheItem)
    return cacheItem
  }

  /**
   * 创建预警卡片 DOM 元素
   */
  function createWarningElement(data) {
    const time = getTime(data) || data.createTime || ''
    const title = getTitle(data) || data.warningTitle || ''
    const warning = getWarning(data) || data.warningObject || ''

    const container = document.createElement('div')
    container.className = 'map-warning-marker'

    // 使用当前缩放比例计算尺寸
    const scaledWidth = getScaledCardWidth()
    const scaledHeight = getScaledCardHeight()

    container.style.cssText = `
      width: ${scaledWidth}px;
      height: ${scaledHeight}px;
      background-image: url(${bgImagePath});
      background-size: 100% 100%;
      transform-origin: left bottom;
    `

    container.innerHTML
      = `<div class="my-overlay-real-content">
      ${time ? `<div class="map-warning-time">${time}</div>` : ''}
        ${title ? `<div class="map-warning-title">${title}</div>` : ''}
        ${warning ? `<div class="map-warning-content">${warning}</div>` : ''}
      </div>
    `

    return container
  }

  /**
   * 更新所有 Overlay 的缩放
   */
  function updateOverlayScale() {
    if (!useOverlay || overlays.length === 0)
      return

    const scaledWidth = getScaledCardWidth()
    const scaledHeight = getScaledCardHeight()

    overlays.forEach(({ overlay }) => {
      const el = overlay.getElement()
      if (el) {
        el.style.width = `${scaledWidth}px`
        el.style.height = `${scaledHeight}px`
      }
      // 更新 offset 以保持锚点一致
      overlay.setOffset([-scaledWidth * ANCHOR_X, 0])
    })
  }

  /**
   * 初始化缩放监听
   */
  function initZoomListener() {
    if (!enableZoomScale || !map || zoomChangeHandler)
      return

    const view = map.getView()
    if (!view)
      return

    // 初始化当前缩放比例
    currentZoomScale = calculateZoomScale()

    zoomChangeHandler = () => {
      const newScale = calculateZoomScale()
      if (Math.abs(newScale - currentZoomScale) > 0.01) {
        currentZoomScale = newScale

        if (useOverlay) {
          updateOverlayScale()
        }
        else if (vectorLayer) {
          // Canvas 模式：触发重绘
          vectorLayer.changed()
        }
      }
    }

    view.on('change:resolution', zoomChangeHandler)
  }

  /**
   * 移除缩放监听
   */
  function removeZoomListener() {
    if (!map || !zoomChangeHandler)
      return

    const view = map.getView()
    if (view) {
      view.un('change:resolution', zoomChangeHandler)
    }
    zoomChangeHandler = null
  }

  /**
   * Canvas 模式：初始化矢量图层 + 自定义 Style renderer
   */
  function initCanvasLayer() {
    if (!map)
      return
    if (vectorLayer)
      return

    vectorSource = new VectorSource()

    vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 520,
      style: (feature) => {
        const data = feature.get('data') || {}
        const time = getTime(data) || data.createTime || ''
        const title = getTitle(data) || data.warningTitle || ''
        const warning = getWarning(data) || data.warningObject || ''

        const style = new Style()

        style.setRenderer((pixelCoords, state) => {
          const ctx = state.context
          if (!ctx || !pixelCoords)
            return

          // 根据设备像素比 + 业务缩放（CARD_SCALE）+ 地图缩放比例做整体缩放
          const pixelRatio = state.pixelRatio || (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
          const layoutScale = CARD_SCALE * pixelRatio * currentZoomScale

          // Point 对应的像素坐标
          let x
          let y

          if (Array.isArray(pixelCoords[0])) {
            // 兼容多点情况，取第一个点
            x = pixelCoords[0][0]
            y = pixelCoords[0][1]
          }
          else {
            x = pixelCoords[0]
            y = pixelCoords[1]
          }

          // 让锚点与 Overlay 模式逻辑一致，这里在 Canvas 下整体按 layoutScale 缩放卡片尺寸
          const cardW = BASE_CARD_WIDTH * layoutScale
          const cardH = BASE_CARD_HEIGHT * layoutScale
          const left = x - cardW * ANCHOR_X
          const top = y - cardH * ANCHOR_Y

          // 先从缓存中取（或创建）一张离屏卡片，再按照当前缩放绘制
          const cached = getOrCreateCardCanvas({ time, title, warning })
          if (!cached || !cached.canvas)
            return

          ctx.save()
          ctx.globalAlpha = 1
          ctx.drawImage(cached.canvas, left, top, cardW, cardH)
          ctx.restore()
        })

        return style
      }
    })

    map.addLayer(vectorLayer)

    // Canvas 模式下的点击：自定义像素包围盒命中检测，覆盖整张卡片
    if (typeof onClick === 'function' && !mapClickHandler) {
      mapClickHandler = (evt) => {
        if (!vectorLayer || !vectorSource || !map)
          return

        // 图层不可见或当前业务认为不可见时，直接忽略点击
        if (!visible.value || !vectorLayer.getVisible())
          return

        const [px, py] = evt.pixel || []
        if (!Number.isFinite(px) || !Number.isFinite(py))
          return

        let hitFeature = null

        vectorSource.forEachFeature((feature) => {
          if (hitFeature)
            return
          const geom = feature.getGeometry()
          if (!geom)
            return

          const coord = geom.getCoordinates()
          const pixel = map.getPixelFromCoordinate(coord)
          if (!pixel)
            return

          const x = pixel[0]
          const y = pixel[1]

          // 使用当前缩放后的尺寸进行命中检测
          const cardW = getScaledCardWidth()
          const cardH = getScaledCardHeight()
          const left = x - cardW * ANCHOR_X
          const top = y - cardH * ANCHOR_Y
          const right = left + cardW
          const bottom = top + cardH

          if (px >= left && px <= right && py >= top && py <= bottom)
            hitFeature = feature
        })

        if (hitFeature) {
          const data = hitFeature.get('data')

          // 阻止事件继续向下传递到其他图层 / 全局 singleclick 逻辑
          if (typeof evt.stopPropagation === 'function')
            evt.stopPropagation()
          if (evt.originalEvent && typeof evt.originalEvent.stopPropagation === 'function')
            evt.originalEvent.stopPropagation()

          try {
            onClick({
              data,
              feature: hitFeature,
              layer: vectorLayer
            })
          }
          catch (err) {
            console.warn('useWarningLayer Canvas onClick error:', err)
          }
        }
      }

      map.on('singleclick', mapClickHandler)
    }
  }

  /**
   * 使用 Overlay 模式更新预警数据
   */
  function updateDataWithOverlay(list = []) {
    if (!map)
      return

    // 清除旧的 overlays
    clear()

    // 初始化缩放监听
    initZoomListener()

    // 初始化当前缩放比例
    currentZoomScale = calculateZoomScale()

    const arr = Array.isArray(list) ? list : []

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i] || {}
      const coords = getCoordinates(item)

      if (!Array.isArray(coords) || coords.length < 2)
        continue

      const [lon, lat] = coords
      if (!Number.isFinite(lon) || !Number.isFinite(lat))
        continue

      try {
        // 创建 DOM 元素
        const element = createWarningElement(item)

        // 使用当前缩放后的宽度计算 offset
        const scaledWidth = getScaledCardWidth()

        // 创建 Overlay
        // positioning: 'bottom-left' 表示元素的左下角对齐到地图坐标点
        // offset: [-scaledWidth * ANCHOR_X, 0] 等价于 anchor: [0.25, 1]
        const overlay = new Overlay({
          element,
          position: [lon, lat],
          className: 'my-overlay',
          positioning: 'bottom-left',
          offset: [-scaledWidth * ANCHOR_X, 0], // 负值向左偏移，实现 anchor [0.25, 1] 的效果
          stopEvent: true
        })

        // 添加点击事件
        element.addEventListener('click', (e) => {
          e.stopPropagation()
          e.preventDefault()

          console.log('🎯 点击预警标记:', item)

          if (typeof onClick === 'function') {
            try {
              onClick({
                data: item,
                overlay
              })
            }
            catch (err) {
              console.warn('onClick error:', err)
            }
          }
        })

        map.addOverlay(overlay)
        overlays.push({ overlay, data: item })
      }
      catch (err) {
        console.warn(`创建预警标记 ${i} 失败:`, err)
      }
    }

    if (overlays.length && !visible.value) {
      visible.value = true
    }
    else if (!overlays.length && visible.value) {
      visible.value = false
    }

    initialized.value = true
  }

  /**
   * 使用 Canvas Style renderer 模式更新预警数据
   */
  function updateDataWithCanvas(list = []) {
    if (!map)
      return

    initCanvasLayer()
    // 初始化缩放监听
    initZoomListener()
    // 初始化当前缩放比例
    currentZoomScale = calculateZoomScale()

    if (!vectorSource)
      return

    const arr = Array.isArray(list) ? list : []
    const features = []

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i] || {}
      const coords = getCoordinates(item)

      if (!Array.isArray(coords) || coords.length < 2)
        continue

      const [lon, lat] = coords
      if (!Number.isFinite(lon) || !Number.isFinite(lat))
        continue

      try {
        const point = new Point([lon, lat])
        const f = new Feature({
          geometry: point
        })
        f.set('data', item)
        features.push(f)
      }
      catch (err) {
        console.warn(`创建预警 Feature ${i} 失败:`, err)
      }
    }

    vectorSource.clear()
    if (features.length)
      vectorSource.addFeatures(features)

    visible.value = features.length > 0
    if (vectorLayer)
      vectorLayer.setVisible(visible.value)

    initialized.value = true
  }

  /**
   * 像素命中检测：判断给定像素位置是否命中了任意预警卡片
   * 仅在 Canvas 模式下使用
   * @param {number[]} pixel - [x, y] 地图像素坐标（evt.pixel）
   * @returns {boolean} 是否命中了当前预警图层中的任意一张卡片
   */
  function hitTestPixel(pixel) {
    if (useOverlay)
      return false
    if (!map || !vectorLayer || !vectorSource)
      return false
    if (!visible.value || !vectorLayer.getVisible())
      return false

    const [px, py] = pixel || []
    if (!Number.isFinite(px) || !Number.isFinite(py))
      return false

    let hit = false

    vectorSource.forEachFeature((feature) => {
      if (hit)
        return
      const geom = feature.getGeometry()
      if (!geom)
        return

      const coord = geom.getCoordinates()
      const cardPixel = map.getPixelFromCoordinate(coord)
      if (!cardPixel)
        return

      const x = cardPixel[0]
      const y = cardPixel[1]

      // 使用当前缩放后的尺寸进行命中检测
      const cardW = getScaledCardWidth()
      const cardH = getScaledCardHeight()
      const left = x - cardW * ANCHOR_X
      const top = y - cardH * ANCHOR_Y
      const right = left + cardW
      const bottom = top + cardH

      if (px >= left && px <= right && py >= top && py <= bottom)
        hit = true
    })

    return hit
  }

  // 当前筛选条件
  let currentFilter = null
  // 原始数据缓存（用于筛选）
  let allData = []

  /**
   * 设置筛选条件
   * @param {object} filter - 筛选配置 { field: 'warningLevel', values: ['1', '2'] }
   */
  function setFilter(filter) {
    currentFilter = filter
    applyFilter()
  }

  /**
   * 清除筛选条件
   */
  function clearFilter() {
    currentFilter = null
    applyFilter()
  }

  /**
   * 应用筛选条件
   */
  function applyFilter() {
    if (!currentFilter || !currentFilter.field || !currentFilter.values) {
      // 无筛选条件，显示所有数据
      if (useOverlay) {
        overlays.forEach(({ overlay }) => {
          const el = overlay.getElement()
          if (el)
            el.style.display = visible.value ? 'block' : 'none'
        })
      }
      else {
        // Canvas 模式：重新渲染所有数据
        if (allData.length > 0) {
          updateDataWithCanvas(allData)
        }
      }
      return
    }

    const { field, values } = currentFilter
    const valueSet = new Set(values)

    if (useOverlay) {
      // Overlay 模式：根据筛选条件显示/隐藏
      overlays.forEach(({ overlay, data }) => {
        const el = overlay.getElement()
        if (el) {
          const fieldValue = data[field]
          const shouldShow = valueSet.has(fieldValue)
          el.style.display = shouldShow && visible.value ? 'block' : 'none'
        }
      })
    }
    else {
      // Canvas 模式：筛选数据后重新渲染
      const filteredData = allData.filter(item => valueSet.has(item[field]))
      updateDataWithCanvas(filteredData)
    }
  }

  /**
   * 显示图层
   */
  function show() {
    visible.value = true

    if (useOverlay) {
      // 应用筛选条件后显示
      if (currentFilter && currentFilter.field && currentFilter.values) {
        const { field, values } = currentFilter
        const valueSet = new Set(values)
        overlays.forEach(({ overlay, data }) => {
          const el = overlay.getElement()
          if (el) {
            const fieldValue = data[field]
            const shouldShow = valueSet.has(fieldValue)
            el.style.display = shouldShow ? 'block' : 'none'
          }
        })
      }
      else {
        overlays.forEach(({ overlay }) => {
          const el = overlay.getElement()
          if (el)
            el.style.display = 'block'
        })
      }
    }
    else {
      if (vectorLayer)
        vectorLayer.setVisible(true)
    }
  }

  /**
   * 更新预警数据（根据配置选择 Overlay 或 Canvas 模式）
   */
  function updateData(list = []) {
    // 保存原始数据用于筛选
    allData = Array.isArray(list) ? [...list] : []
    if (useOverlay)
      updateDataWithOverlay(list)
    else
      updateDataWithCanvas(list)

    // 数据更新后应用筛选条件
    if (currentFilter) {
      applyFilter()
    }
  }

  /**
   * 隐藏图层
   */
  function hide() {
    if (useOverlay) {
      overlays.forEach(({ overlay }) => {
        const el = overlay.getElement()
        if (el)
          el.style.display = 'none'
      })
    }
    else {
      if (vectorLayer)
        vectorLayer.setVisible(false)
    }

    visible.value = false
  }

  /**
   * 清除所有标记
   */
  function clear() {
    if (useOverlay) {
      overlays.forEach(({ overlay }) => {
        map.removeOverlay(overlay)
      })
      overlays.length = 0
    }
    else {
      if (vectorSource)
        vectorSource.clear()
    }

    visible.value = false
  }

  /**
   * 销毁图层
   */
  function destroy() {
    clear()

    // 移除缩放监听
    removeZoomListener()

    if (!useOverlay) {
      if (map && vectorLayer)
        map.removeLayer(vectorLayer)
      if (vectorSource)
        vectorSource.clear()
      vectorLayer = null
      vectorSource = null

      if (map && mapClickHandler) {
        map.un('singleclick', mapClickHandler)
      }
      mapClickHandler = null
    }
  }

  // 备份数据（用于 focusSingle / restoreAll）
  let backupData = null

  /**
   * 聚焦显示单个预警项
   * @param {object} item - 单个预警数据（需要包含坐标信息）
   */
  function focusSingle(item) {
    if (!item) {
      return
    }

    // 只在第一次聚焦时备份数据，避免多次打开详情时覆盖原始备份
    if (!backupData) {
      backupData = [...allData]
    }

    // 映射单个数据的坐标
    const rawLon = item.riskFactorLongitude ?? item.longitude ?? item.lon ?? item.lng
    const rawLat = item.riskFactorLatitude ?? item.latitude ?? item.lat
    const lon = Number(rawLon)
    const lat = Number(rawLat)

    const mapped = {
      ...item,
      longitude: lon,
      latitude: lat,
      coordinates: Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : item.coordinates
    }

    // 更新为单个数据
    updateData([mapped])
    console.log('🎯 聚焦显示单个预警:', mapped)
  }

  /**
   * 恢复显示所有预警数据
   */
  function restoreAll() {
    if (backupData && backupData.length > 0) {
      updateData(backupData)
      console.log('🔄 恢复显示所有预警，共', backupData.length, '条')
      backupData = null
    }
  }

  return {
    visible,
    initialized,
    updateData,
    show,
    hide,
    clear,
    destroy,
    getOverlays: () => overlays,
    hitTestPixel,
    // 筛选功能
    setFilter,
    clearFilter,
    // 聚焦/恢复功能
    focusSingle,
    restoreAll
  }
}
