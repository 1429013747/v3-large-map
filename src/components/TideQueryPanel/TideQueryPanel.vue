<template>
  <a-drawer
    v-model:open="visibleModal"
    title="潮汐查询"
    placement="right"
    getContainer=".ui-container"
    :width="600"
    :closable="true"
    :mask="false"
    rootClassName="layer-box"
    class="layer-control-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>

    <!-- 搜索和筛选区域 -->
    <div class="search-filter-section">
      <div class="filter-row">
        <a-select
          v-model:value="selectedLocation"
          placeholder="位置选择"
          class="location-select"
          allowClear
          @change="handleLocationChange"
        >
          <a-select-option value="宁波港">宁波港</a-select-option>
          <a-select-option value="台州港">台州港</a-select-option>
          <a-select-option value="温州港">温州港</a-select-option>
          <a-select-option value="舟山港">舟山港</a-select-option>
        </a-select>

        <a-select
          v-model:value="selectedTimeRange"
          placeholder="时间范围"
          class="time-range-select"
          allowClear
          @change="handleTimeRangeChange"
        >
          <a-select-option value="今天">今天</a-select-option>
          <a-select-option value="明天">明天</a-select-option>
          <a-select-option value="本周">本周</a-select-option>
          <a-select-option value="本月">本月</a-select-option>
        </a-select>
      </div>

      <div class="action-buttons">
        <a-button type="primary" class="query-btn" @click="handleQuery">
          查询
        </a-button>
        <a-button class="reset-btn" @click="handleReset"> 重置 </a-button>
        <a-button class="export-btn" @click="handleExport">
          导出
          <template #icon>
            <ExportOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 潮汐图表区域 -->
    <div class="tide-chart-section">
      <div class="chart-container">
        <div
          ref="tideChartRef"
          class="tide-chart"
          style="width: 520px; height: 300px"
        ></div>
      </div>

      <!-- 潮汐信息 -->
      <div class="tide-info">
        <div class="tide-datum">潮高基准面: 在平均海面下309cm</div>
        <div class="tide-note">【注】潮汐表基准面采用的是理论深度基准面</div>
      </div>
    </div>

    <!-- 潮汐时间信息 -->
    <div class="tide-times-section">
      <div class="tide-times-panel">
        <div class="tide-time-item">
          <span class="time-label">退潮时间</span>
          <span class="time-value">02:07-08:21</span>
        </div>
        <div class="tide-time-item">
          <span class="time-label">涨潮时间</span>
          <span class="time-value">08:21-14:28</span>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { CloseOutlined, ExportOutlined } from "@ant-design/icons-vue";
import * as echarts from "echarts";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:open"]);

const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit("update:open", value);
  },
});

// 搜索和筛选数据
const selectedLocation = ref();
const selectedTimeRange = ref();

// 图表引用
const tideChartRef = ref(null);
let tideChart = null;

// 潮汐数据
const tideData = ref([
  { time: "00:00", height: 50 },
  { time: "02:00", height: 80 },
  { time: "04:00", height: 120 },
  { time: "06:00", height: 180 },
  { time: "08:00", height: 250 },
  { time: "09:00", height: 36 }, // 高亮点
  { time: "10:00", height: 320 },
  { time: "12:00", height: 380 },
  { time: "14:00", height: 350 },
  { time: "16:00", height: 280 },
  { time: "18:00", height: 200 },
  { time: "20:00", height: 150 },
  { time: "22:00", height: 100 },
]);

const handleClose = () => {
  emit("update:open", false);
};

const handleQuery = () => {
  console.log("查询潮汐数据", {
    location: selectedLocation.value,
    timeRange: selectedTimeRange.value,
  });
  initTideChart();
};

const handleReset = () => {
  selectedLocation.value = null;
  selectedTimeRange.value = null;
  initTideChart();
};

const handleExport = () => {
  console.log("导出潮汐数据");
};

const handleLocationChange = (value) => {
  selectedLocation.value = value;
  console.log("选择位置:", value);
};

const handleTimeRangeChange = (value) => {
  selectedTimeRange.value = value;
  console.log("选择时间范围:", value);
};

// 初始化潮汐图表
const initTideChart = async () => {
  await nextTick();
  if (!tideChartRef.value) return;

  // 销毁现有图表
  if (tideChart) {
    tideChart.dispose();
  }

  // 创建新图表
  tideChart = echarts.init(tideChartRef.value);

  const option = {
    backgroundColor: "transparent",
    grid: {
      left: "2%",
      right: "1%",
      top: "5%",
      bottom: "2%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: tideData.value.map((item) => item.time),
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.3)",
          width: 3,
        },
      },
      axisTick: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.5)",
          width: 3,
        },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 12,
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
          type: "dashed",
        },
      },
    },
    yAxis: {
      type: "value",
      name: "潮高",
      nameTextStyle: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 14,
      },
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.3)",
        },
      },
      axisTick: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.3)",
        },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 12,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
          type: "dashed",
        },
      },
      min: 0,
      max: 400,
      interval: 100,
    },
    series: [
      {
        name: "潮高",
        type: "line",
        data: tideData.value.map((item) => item.height),
        smooth: true,
        lineStyle: {
          color: "#00ffff",
          width: 2,
        },
        itemStyle: {
          color: "#00ffff",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, //左
            y: 0, //上
            x2: 0, //右
            y2: 1, //下
            colorStops: [
              {
                offset: 0,
                color: "rgba(0, 255, 255, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(0, 255, 255, 0.05)",
              },
            ],
          },
        },
        markPoint: {
          // data: [
          //   {
          //     coord: ["09:00", 36],
          //     symbol: "circle",
          //     symbolSize: 8,
          //     itemStyle: {
          //       color: "#ffffff",
          //       borderColor: "#00ffff",
          //       borderWidth: 2,
          //     },
          //     label: {
          //       show: true,
          //       position: "top",
          //       color: "#ffffff",
          //       backgroundColor: "rgba(0, 0, 0, 0.8)",
          //       padding: [4, 8],
          //       borderRadius: 4,
          //       formatter: "36",
          //     },
          //   },
          // ],
        },
        markLine: {
          // data: [
          //   {
          //     xAxis: "09:00",
          //     lineStyle: {
          //       color: "#ffffff",
          //       type: "dashed",
          //       width: 1,
          //     },
          //   },
          // ],
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderColor: "#00ffff",
      borderWidth: 1,
      textStyle: {
        color: "#ffffff",
      },
      formatter: function (params) {
        const data = params[0];
        return `时间: ${data.name}<br/>潮高: ${data.value}cm`;
      },
    },
  };

  tideChart.setOption(option);

  // 响应式调整
  window.addEventListener("resize", () => {
    if (tideChart) {
      tideChart.resize();
    }
  });
};

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      initTideChart();
    }
  }
);
</script>

<style lang="scss" scoped>
// 搜索和筛选区域样式
.search-filter-section {
  margin-bottom: 24px;

  .filter-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .location-select,
    .time-range-select {
      flex: 1;

      :deep(.ant-select-selector) {
        background: rgba(0, 255, 255, 0.1) !important;
        border: 1px solid rgba(0, 255, 255, 0.3) !important;
        border-radius: 6px !important;
        color: #ffffff !important;
        font-size: 14px !important;

        .ant-select-selection-placeholder {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .ant-select-selection-item {
          color: #ffffff !important;
        }
      }

      &:hover :deep(.ant-select-selector) {
        background: rgba(0, 255, 255, 0.2) !important;
        border-color: rgba(0, 255, 255, 0.5) !important;
      }

      &.ant-select-focused :deep(.ant-select-selector) {
        background: rgba(0, 255, 255, 0.2) !important;
        border-color: rgba(0, 255, 255, 0.5) !important;
        box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2) !important;
      }
    }
  }

  .action-buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;

    .query-btn {
      background: transparent;
      border: 1px solid rgba(0, 255, 255, 0.3);
      color: #02cfe4;
      font-size: 14px;
      height: 34px;
      padding: 0 30px;
      border-radius: 6px;

      &:hover {
        background: rgba(0, 255, 255, 0.1);
        border-color: rgba(0, 255, 255, 0.5);
      }
    }

    .reset-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      font-size: 14px;
      height: 34px;
      padding: 0 30px;
      border-radius: 6px;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }

    .export-btn {
      background: transparent;
      border: 1px solid rgba(0, 255, 255, 0.3);
      color: #02cfe4;
      font-size: 14px;
      height: 34px;
      padding: 0 30px;
      border-radius: 6px;

      &:hover {
        background: rgba(0, 255, 255, 0.1);
        border-color: rgba(0, 255, 255, 0.5);
      }
    }
  }
}

// 潮汐图表区域样式
.tide-chart-section {
  margin-bottom: 24px;

  .chart-container {
    background: transparent;
    // border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .tide-info {
    padding: 20px;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 1px;
    .tide-datum {
      font-size: 14px;
      margin-bottom: 18px;
    }

    .tide-note {
      font-size: 14px;
    }
  }
}

// 潮汐时间信息样式
.tide-times-section {
  .tide-times-panel {
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    gap: 40px;

    .tide-time-item {
      display: flex;
      gap: 18px;

      .time-label {
        color: #5ddde0;
        font-size: 16px;
      }

      .time-value {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
      }
    }
  }
}
</style>
