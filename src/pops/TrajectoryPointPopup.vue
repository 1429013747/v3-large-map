<script setup>
import dayjs from 'dayjs'

const props = defineProps({
  data: { type: Object, default: () => ({}) }
})

// 格式化时间
function formatTime(time) {
  console.log(time)
  if (!time) return '-'
  // 如果是数字时间戳
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
  // // 如果已经是格式化的字符串
  // return time
}

// 格式化坐标
function formatCoord(coord) {
  if (!coord) return '-'
  const num = Number(coord)
  return Number.isNaN(num) ? coord : num.toFixed(6)
}
</script>

<template>
  <div class="trajectory-point-popup">
    <div class="popup-header">
      <svg class="popup-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span class="popup-title">{{ data.vehicleNo || '轨迹点' }}</span>
    </div>
    <div class="popup-body">
      <div class="info-item">
        <span class="info-label">时间</span>
        <span class="info-value">{{ formatTime(data.pointTime) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">经度</span>
        <span class="info-value">{{ formatCoord(data.longitude) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">纬度</span>
        <span class="info-value">{{ formatCoord(data.latitude) }}</span>
      </div>
      <!-- 如果有速度信息 -->
      <div v-if="data.speed" class="info-item">
        <span class="info-label">速度</span>
        <span class="info-value highlight">{{ data.speed }} km/h</span>
      </div>
      <!-- 如果有方向信息 -->
      <div v-if="data.direction" class="info-item">
        <span class="info-label">方向</span>
        <span class="info-value">{{ data.direction }}°</span>
      </div>
    </div>
    <div class="popup-arrow" />
  </div>
</template>

<style scoped>
.trajectory-point-popup {
  position: relative;
  min-width: 220px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.15) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
}

.popup-icon {
  width: 18px;
  height: 18px;
  color: #00ffff;
  flex-shrink: 0;
}

.popup-title {
  font-size: 13px;
  font-weight: 600;
  color: #00ffff;
  letter-spacing: 0.5px;
}

.popup-body {
  padding: 8px 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.info-value {
  font-size: 12px;
  color: #fff;
  font-family: 'Monaco', 'Consolas', monospace;
}

.info-value.highlight {
  color: #00ffff;
  font-weight: 600;
}

.popup-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(0, 20, 40, 0.9);
}

.popup-arrow::before {
  content: '';
  position: absolute;
  top: -7px;
  left: -7px;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid rgba(0, 255, 255, 0.3);
  z-index: -1;
}
</style>
