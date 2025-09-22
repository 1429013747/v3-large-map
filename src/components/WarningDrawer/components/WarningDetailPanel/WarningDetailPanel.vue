<template>
  <!-- 遮罩层 -->
  <div v-if="visible">
    <!-- 详情面板 -->
    <div class="panel-content">
      <!-- 头部 -->
      <div class="panel-header">
        <div class="header-left">
          <h2 class="panel-title">预警详情</h2>
        </div>
        <div class="header-right">
          <CloseOutlined @click="handleClose" />
        </div>
      </div>

      <!-- 可滚动内容区域 -->
      <div class="panel-body">
        <!-- 预警原因区域 -->
        <div class="warning-cause-section">
          <h3 class="section-title">预警原因</h3>
          <div class="cause-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">预警类型：</span>
                <span class="value">{{
                  warningData?.warningType || "一般多AIS"
                }}</span>
              </div>

              <div class="info-item">
                <span class="label">处理状态：</span>
                <span class="value">{{ warningData?.status || "待处置" }}</span>
              </div>
              <div class="info-item">
                <span class="label">预警位置：</span>
                <span class="value">{{
                  warningData?.location || "台州市温岭市白岩码头"
                }}</span>
              </div>
              <div class="info-item">
                <span class="label">预警时间：</span>
                <span class="value">{{
                  warningData?.warningTime || "2025.06.12 21:00:09"
                }}</span>
              </div>
              <div class="info-item">
                <span class="label">关联风险点：</span>
                <span class="risk-point">{{
                  warningData?.riskPoint || "白岩码头"
                }}</span>
              </div>

              <div class="reason-text">
                <span class="label">预警原因：</span>
                <span class="value">{{
                  warningData?.reason ||
                  "浙普渔87392 2025.06.12 21:00:09在高风险点白岩码头停靠"
                }}</span>
              </div>
            </div>
          </div>

          <!-- 地图区域 -->
          <div class="map-container">
            <div class="map-wrapper">
              <MapViewer
                ref="detailMapViewer"
                :center="mapCenter"
                :zoom="mapZoom"
                height="200px"
                width="40%"
                :show-controls="false"
                @map-ready="onMapReady"
              />
              <div class="map-overlay">
                <button class="trace-btn">预警追溯</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 预警提醒区域 -->
        <div class="warning-reminder-section">
          <h3 class="section-title">预警提醒</h3>

          <div class="reminder-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">通知人：</span>
                <span class="value">{{ warningData?.notifier || "王五" }}</span>
              </div>

              <div class="info-item">
                <span class="label">通知时间：</span>
                <span class="value">{{
                  warningData?.notificationTime || "2025.06.12 21:00:09"
                }}</span>
              </div>

              <div class="info-item">
                <span class="label">通知途径：</span>
                <span class="value">{{
                  warningData?.notificationMethod || "浙征钉、站内信"
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 预警送达区域 -->
        <div class="warning-delivery-section">
          <h3 class="section-title">预警送达</h3>

          <div class="delivery-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">送达时间：</span>
                <span class="value">{{
                  warningData?.deliveryTime || "2025.06.12 21:00"
                }}</span>
              </div>

              <div class="info-item">
                <span class="label">送达系统：</span>
                <span class="value">{{
                  warningData?.deliverySystem || "--"
                }}</span>
              </div>

              <div class="info-item">
                <span class="label">送达地区：</span>
                <span class="value">{{
                  warningData?.deliveryArea || "宁波象山县"
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import MapViewer from "@/components/map/MapViewer.vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import { useMapMarkers } from "@/composables/useMapMarkers.js";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  warningData: {
    type: Object,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits(["update:visible", "close"]);

// 响应式数据
const detailMapViewer = ref(null);
const mapCenter = ref([121.81731411020978, 29.37908163477394]); // 台州市温岭市坐标
const mapZoom = ref(10);

// 方法
const getStatusClass = (status) => {
  const classMap = {
    待处置: "status-pending",
    已送达: "status-delivered",
    已处理: "status-processed",
  };
  return classMap[status] || "status-delivered";
};

const getStatusText = (status) => {
  return status || "已送达";
};

const handleClose = () => {
  emit("update:visible", false);
  emit("close");
};

const onMapReady = (map) => {
  console.log("详情地图已加载完成", map);
  const { addMarker, initMarkerLayer, trackBack } = useMapMarkers(map);
  initMarkerLayer();
  // 可以在这里添加预警点的标记
  if (detailMapViewer.value) {
    // 添加带文本的标记点
    trackBack();
  }
};

// 监听warningData变化，更新地图中心
watch(
  () => props.warningData,
  (newData) => {
    if (newData && newData.coordinates) {
      mapCenter.value = newData.coordinates;
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.panel-content {
  position: absolute;
  z-index: 1000;
  top: 42%;
  left: 50%;
  width: 1600px;
  background: linear-gradient(
    135deg,
    rgba(18, 28, 43, 0.8) 0%,
    rgba(18, 28, 43, 0.8) 100%
  );
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%) scale(0.8);
  transition: all 0.3s ease;
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  flex-direction: column;

  .panel-open & {
    transform: translate(-50%, -50%) scale(1);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  background: rgba(0, 255, 255, 0.05);

  .header-left {
    .panel-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .detail-time {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #00ffff;
        color: #00ffff;
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px 24px;
}

.section-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  background: linear-gradient(
    90deg,
    rgba(17, 44, 61, 0.9) 0%,
    transparent 100%
  );
}

.warning-cause-section,
.warning-reminder-section,
.warning-delivery-section {
  margin: 24px 0;
  flex-shrink: 0;

  .cause-info,
  .reminder-info,
  .delivery-info {
    background: rgba(18, 28, 43, 0.4);
    padding: 20px;

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 16px;
      margin-bottom: 16px;

      .info-item {
        display: flex;
        gap: 8px;

        .label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          min-width: 80px;
          flex-shrink: 0;
        }

        .value {
          color: #ffffff;
          font-size: 16px;
          max-width: 300px;
          word-break: break-all;
        }

        .risk-point {
          color: #00ffff;
          font-size: 14px;
          font-weight: 600;
          background: rgba(0, 255, 255, 0.1);
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid rgba(0, 255, 255, 0.3);
          height: fit-content;
        }

        .suspicious-btn {
          background: rgba(255, 170, 0, 0.2);
          border: 1px solid #ffaa00;
          color: #ffaa00;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 170, 0, 0.3);
          }
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;

          &.status-pending {
            background: rgba(255, 170, 0, 0.2);
            color: #ffaa00;
            border: 1px solid #ffaa00;
          }

          &.status-delivered {
            background: rgba(0, 170, 0, 0.2);
            color: #00aa00;
            border: 1px solid #00aa00;
          }

          &.status-processed {
            background: rgba(0, 170, 255, 0.2);
            color: #00aaff;
            border: 1px solid #00aaff;
          }
        }
      }
    }

    .reason-text {
      display: flex;
      gap: 8px;

      .label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
      }

      .value {
        color: #ffffff;
        font-size: 16px;
        line-height: 1.5;
        max-width: 300px;
        word-break: break-all;
      }
    }
  }
}

.map-container {
  margin-top: 16px;

  .map-wrapper {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    gap: 10px;
    .map-overlay {
      align-self: flex-end;
      .trace-btn {
        box-shadow: inset 0 0 7px 0 rgba(0, 255, 255, 0.5);
        background: rgba(20, 31, 51, 0.5);
        border: 1px solid rgba(0, 255, 255, 0.5);
        color: #fff;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(27, 41, 67, 0.7);
          border: 1px solid rgba(0, 255, 255, 0.6);
        }
      }
    }
  }
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-200px, 0);
  }
  to {
    opacity: 1;
    transform: translate(100px, 0);
  }
}

// 滚动条样式
.panel-body {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 255, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 255, 255, 0.5);
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .panel-content {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .panel-content {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
