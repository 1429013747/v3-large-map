<template>
  <div ref="chart" class="chart-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import * as echarts from "echarts";

const chart = ref(null);
const chartInstance = ref(null);
const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      dates: [],
      levels: [],
    }),
  },
});
// 示例数据 - 实际使用时可以通过props传入
const chartData = computed(() => props.chartData);

const initChart = () => {
  if (!chart.value) return;

  chartInstance.value = echarts.init(chart.value);

  const option = {
    tooltip: {
      show: true,
    },
    xAxis: {
      type: "category",
      data: chartData.value.dates,
      axisLabel: {
        color: "#ffffff",
      },
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.3)",
        },
      },
    },
    yAxis: {
      type: "value",
      // name: "风险等级",
      // min: 0,
      // max: 4,
      // interval: 1,

      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.3)",
        },
      },
      splitLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    series: [
      {
        data: chartData.value.levels,
        type: "line",
        smooth: true,
        lineStyle: {
          color: "#1987ff",
          width: 2,
        },
        itemStyle: {
          color: "#1987ff",
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgb(25, 135, 255,.3)",
            },
            {
              offset: 1,
              color: "rgba(0, 255, 255, 0)",
            },
          ]),
        },
        symbolSize: 8,
        symbol: "circle",
      },
    ],
    grid: {
      left: "10%",
      right: "0%",
      top: "10%",
      bottom: "10%",
      // containLabel: true,
    },
  };

  chartInstance.value.setOption(option);

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
};

const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  }
};

// 销毁图表实例
onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
  window.removeEventListener("resize", handleResize);
});

// 初始化图表
onMounted(() => {
  // 添加下一个tick的resize确保图表占满容器
  setTimeout(() => {
    initChart();
    if (chartInstance.value) {
      chartInstance.value.resize();
    }
  }, 0);
});

// 监听数据变化，重新渲染图表
watch(chartData, () => {
  if (chartInstance.value) {
    initChart();
  }
});

// 定义暴露给父组件的方法
defineExpose({
  updateChartData: (data) => {
    chartData.value = data;
  },
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: calc(100% - 50px);
  min-width: 0; /* 添加此行以确保flex容器中正确计算宽度 */
}
</style>
