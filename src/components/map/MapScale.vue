<script setup>
import { get as getProjection } from 'ol/proj';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  map: {
    type: Object,
    default: null
  }
});

const scaleText = ref('');

function updateScale() {
  if (!props.map) return;

  const view = props.map.getView();
  if (!view) return;

  const resolution = view.getResolution();
  const projection = view.getProjection();

  if (!resolution || !projection) return;

  // 获取地图容器宽度（像素）
  const mapSize = props.map.getSize();
  if (!mapSize) return;

  const width = mapSize[0];

  // 计算屏幕中心点对应的实际距离（米）
  const projectionObj = getProjection(projection);
  let metersPerUnit = 1;
  if (projectionObj) {
    const mpu = projectionObj.getMetersPerUnit();
    if (mpu) {
      metersPerUnit = mpu;
    }
  }

  // 计算屏幕宽度对应的实际距离（米）
  const meters = resolution * width * metersPerUnit;

  // 选择合适的单位和数值
  let value = meters;
  let unit = 'm';

  if (meters >= 1000) {
    value = meters / 1000;
    unit = 'km';
  }

  // 格式化显示 - 选择最接近的整数或一位小数
  let displayValue;
  if (unit === 'km') {
    if (value >= 100) {
      displayValue = Math.round(value);
    }
    else if (value >= 10) {
      displayValue = Math.round(value);
    }
    else if (value >= 1) {
      displayValue = Math.round(value * 10) / 10;
    }
    else {
      displayValue = Math.round(value * 100) / 100;
    }
  }
  else {
    if (value >= 100) {
      displayValue = Math.round(value / 10) * 10;
    }
    else if (value >= 10) {
      displayValue = Math.round(value);
    }
    else if (value >= 1) {
      displayValue = Math.round(value * 10) / 10;
    }
    else {
      displayValue = Math.round(value * 100) / 100;
    }
  }

  scaleText.value = `${displayValue} ${unit}`;
}

let moveEndListener = null;

watch(
  () => props.map,
  (newMap) => {
    if (moveEndListener) {
      moveEndListener = null;
    }

    if (newMap) {
      updateScale();
      // 监听地图移动和缩放事件
      moveEndListener = newMap.on(['moveend', 'change:resolution'], updateScale);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.map) {
    updateScale();
  }
});

onUnmounted(() => {
  if (moveEndListener) {
    moveEndListener = null;
  }
});
</script>

<template>
  <div v-if="scaleText" class="map-scale">
    <div class="scale-content">
      {{ scaleText }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-scale {
  position: absolute;
  bottom: 5.6%;
  right: 0%;
  z-index: 1000;
  pointer-events: none;

  .scale-content {
    background: rgba(18, 28, 43, 0.8);
    border-bottom: 1px solid #fff;
    border-left: 1px solid #fff;
    border-right: 1px solid #fff;
    padding: 6px 10px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    min-width: 60px;
    text-align: center;
  }
}
</style>
