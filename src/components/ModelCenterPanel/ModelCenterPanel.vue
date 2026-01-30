<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { CloseOutlined, RightOutlined } from '@ant-design/icons-vue';
import { message } from "ant-design-vue";
import * as echarts from 'echarts';
import dayjs from 'dayjs';

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:open', 'closed']);

// 模型类型：provincial-省级模型, personal-个性模型
const modelType = ref('provincial');
const activeTab = ref('all');
const tabList = ref([
  {
    label: '全部模型',
    value: 'all'
  },
  {
    label: '船舶模型',
    value: 'ship'
  },
  {
    label: '车辆模型',
    value: 'car'
  },
  {
    label: '其他模型',
    value: 'other'
  }
]);
const modelText = ref('根据全省走私风险点和海岸线分布，判断车辆进入和停留海岸线时长，当车辆进入风险点符合预警设置条件时，产生海岸线预警。');

// 功能列表
const featureList = ref([
  { code: '1', label: '伪造信号', value: 'fake-signal', type: 'ship-model', text: 'AIS信号的接收是伴随着设备主动发送，并于基站被动接收，伪造信号，则是通过更改设备发送的信息参数，如经纬度等，利用计算机等信号发送设备，在AIS的通信频段发出对应格式的信息，达到发出伪造信号的目的；同时，其需要建设在正常基站接收到，才能被采集到，因为其最终目的是让人在查询AIS信号轨迹时能看到伪造的“正常轨迹”，故将伪造信号的设备置于基站的范围内，方可保证发出的信号可以被基站接受。通过基站的信号覆盖距离推算，和接收到的动态信息中所包含的经纬度，进行空间判断；对于单个基站而言，其信号接收的范围大致在数十海里到近百海里，但如果接收的信号经纬度，距离基站的距离在数百甚至上千海里，已经远远超过基站接受信号的能力，则列为信号伪造高风险对象。' },
  { code: '2', label: '套牌', value: 'license-plate', type: 'ship-model', text: '同一艘船不可能同时出现在两个不同位置，只有可能是因为身份被套用导致的；而大范围的移动如果有信号中断，也需要满足船舶基本的运动规律。' },
  { code: '3', label: '变装', value: 'plainclothes', type: 'ship-model', text: '走私船舶会通过修改AIS信息，或者更换AIS设备等方式，人为变更船舶身份，其主要手段是在关闭原有AIS设备后，新使用另一个设备，或者修改AIS信息后重启开启，出现一艘船舶信号之后，在时空可达到前提下，出现另一个新信号或者恢复信号的船舶；当这种时空关系合理时，认为存在变装嫌疑。' },
  { code: '4', label: '一码多船&一船多码', value: 'one-code-multiple', type: 'ship-model', text: '当船上同时开启多套AIS设备时，一定会存在多条在位置、航速、航向上长期高度类似的轨迹，通过大数据持续跟踪线型高度一致轨迹，判断识别高概率一船多AIS事件。' },
  { code: '5', label: '台湾风险船告警', value: 'taiwan-risk', type: 'ship-model', text: '正常的商业船舶，必然遵循贸易原则，即从a港出发，抵达b港，方向性明确；但是如果商船频繁在同一港口开出和返回，并且间隔时间极长，不符合船舶商业运作的基本逻辑，意味着存在其他目的；如果期间还伴有长时间意义不明的停留、海上徘徊，则风险极高；很有可能属于在海上等待时机，伺机进行违法犯罪活动。台湾地区由于其独特的地理位置，及与大陆之间的紧密联系，创造出了合适的国内外走私的跳板与条件，也滋生了一批高风险的船舶。' },
  { code: '8', label: '多车聚集', value: 'multiple-vehicles', type: 'car-model', text: '划定设置沿海风险点、船厂等重点区域，通过自行设置聚集围栏，设置聚集车辆数、聚集距离、停车时长等参数。当车辆聚集符合条件时，产生预警记录。' },
  { code: '9', label: '进入岸线重点区域', value: 'shoreline-area', type: 'car-model', text: '根据全省走私风险点和海岸线分布，判断车辆进入和停留海岸线时长，当车辆进入风险点符合预警设置条件时，产生海岸线预警。' },
  // { label: '团伙车辆识别', value: 'gang-vehicles', type: 'car-model' }
]);

const frequencyData = JSON.parse(JSON.stringify(featureList.value));
const activeFeature = ref('shoreline-area');

// 模型开关
const modelEnabled = ref(true);
const timeLineActice = ref('进入岸线重点区域');

// 规则配置（TimePicker 期望的是 dayjs 对象，而不是格式化后的字符串）
const ruleConfig = ref({
  startTime: dayjs().startOf('day'),
  endTime: dayjs().endOf('day'),
  durationMin: 12,
  durationMax: 12,
  maxDuration: 12,
  shuttleBeforeTime: 0.5,
  trackRatio: 0.8
});

// 预警趋势
const trendTab = ref('month');
const timeLineCode = ref('9');
const chartData = ref([]);
const trendChartRef = ref(null);
let trendChart = null;

// 高频预警模型
const frequencyModels = ref([
  { label: '伪造信号', value: 1200, color: 'orange', type: 'ship-model' },
  { label: '套牌', value: 900, color: 'yellow', type: 'ship-model' },
  { label: '一码多船/一船多码', value: 800, color: 'blue', type: 'ship-model' },
  { label: '台湾风险船告警', value: 700, color: 'blue', type: 'ship-model' },
  { label: '多车聚集', value: 600, color: 'blue', type: 'car-model' },
  { label: '进入岸线重点区域', value: 500, color: 'blue', type: 'car-model' },
  // { label: '团伙车辆识别', value: 400, color: 'blue', type: 'car-model' }
]);

// 预警次数列表
const warningCountList = ref([
  { name: '浙乐渔休0120', count: 5250 },
  { name: '浙乐浪休0120', count: 4120 },
  { name: '浙乐渔休0120', count: 3006 },
  { name: '浙乐浪休0120', count: 2000 },
  { name: '浙乐渔体0120', count: 1895 }
]);

// 初始化预警趋势图表
async function initTrendChart() {
  await nextTick();
  if (!trendChartRef.value) return;

  // 销毁现有图表
  if (trendChart) {
    trendChart.dispose();
  }

  // 创建新图表
  trendChart = echarts.init(trendChartRef.value);

  const dataX = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07'];
  const dataY = [100, 200, 300, 400, 500, 600, 700];

  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '7%',
      right: '0%',
      top: '10%',
      bottom: '0%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dataX,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '预警次数',
      nameTextStyle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
          type: 'dashed'
        }
      },
      // max: 400,
      // interval: 100
    },
    series: [
      {
        name: '预警次数',
        type: 'line',
        data: dataY,
        smooth: true,
        lineStyle: {
          color: '#00ffff',
          width: 2
        },
        itemStyle: {
          color: '#00ffff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(0, 255, 255, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(0, 255, 255, 0.05)'
              }
            ]
          }
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#00ffff',
      borderWidth: 1,
      textStyle: {
        color: '#ffffff'
      }
    }
  };

  trendChart.setOption(option);

  // 响应式调整
  window.addEventListener('resize', () => {
    if (trendChart) {
      trendChart.resize();
    }
  });
}

function handleClose() {
  emit('closed', 'model-center');
}

const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit('update:open', value);
    emit('closed', 'model-center');
  }
});

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        getStatisticsByTimeData();
      });
    } else {
      if (trendChart) {
        trendChart.dispose();
        trendChart = null;
      }
      emit('closed', 'model-center');
    }
  }
);

watch(trendTab, (val) => {
  getStatisticsByTimeData();
});

function handleTabChange(e) {
  if (e.target.value === 'ship') {
    featureList.value = frequencyData.filter((item) => item.type === 'ship-model');
  } else if (e.target.value === 'car') {
    featureList.value = frequencyData.filter((item) => item.type === 'car-model');
  } else if (e.target.value === 'all') {
    featureList.value = frequencyData;
  } else {
    featureList.value = []
  }
}

function changeTimeLineActice(feature) {
  timeLineActice.value = feature.label;
  timeLineCode.value = feature.code;
  activeFeature.value = feature.value;
  modelText.value = feature.text;
  getStatisticsByTimeData();
}
function handleSave() {
  const params = {
    ...ruleConfig.value,
    startTime: ruleConfig.value.startTime?.format('HH:mm:ss'),
    endTime: ruleConfig.value.endTime?.format('HH:mm:ss'),
  }
  let isError = false;
  Object.keys(params).forEach(key => {
    if (!params[key]) {
      message.error(`${key}不能为空`);
      isError = true;
    }
  });
}

function getStatisticsByTimeData() {
  initTrendChart();
}
</script>

<template>
  <a-drawer
    v-model:open="visibleModal" placement="right" title="模型中心" get-container=".ui-container" :width="1640"
    :mask="false" root-class-name="layer-box" class="layer-model-center-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>

    <div class="model-center-container">
      <!-- 顶部标题栏 -->
      <div class="header-section">
        <div class="header-left">
          <span class="model-type" :class="[{ active: modelType === 'provincial' }]" @click="modelType = 'provincial'">
            省级模型
          </span>
        </div>
        <div class="header-right">
          <span class="model-type" :class="[{ active: modelType === 'personal' }]" @click="modelType = 'personal'">
            个性模型
          </span>
        </div>
      </div>
      <div v-if="modelType === 'provincial'" class="content-section">
        <div class="left-section">
          <div>
            <a-radio-group v-model:value="activeTab" @change="handleTabChange">
              <a-radio-button v-for="item in tabList" :key="item.value" :value="item.value">
                {{ item.label }}
              </a-radio-button>
            </a-radio-group>
          </div>
          <div class="model-content">
            <div class="process">
              <a-timeline>
                <a-timeline-item
                  v-for="feature in featureList" :key="feature.value" class="feature-item"
                  :class="[{ active: activeFeature === feature.value }]" @click="changeTimeLineActice(feature)"
                >
                  <template #dot>
                    <div class="timeline-dot" :class="[{ active: activeFeature === feature.value }]" />
                  </template>
                  <span class="feature-text">{{ feature.label }}</span>
                </a-timeline-item>
              </a-timeline>
            </div>
            <div class="result">
              <!-- 上面部分 -->
              <div class="result-top">
                <!-- 整体标题栏 -->
                <div class="top-header">
                  <span class="main-title">模型概述</span>
                  <div class="switch-wrapper">
                    <span class="switch-label">模型开关</span>
                    <a-switch
                      v-model:checked="modelEnabled" class="model-switch" checked-children="开"
                      un-checked-children="关"
                    />
                  </div>
                </div>

                <!-- 内容区域 -->
                <div class="content-wrapper">
                  <!-- 模型概述 -->
                  <div class="model-overview-section">
                    <div class="model-description">
                      {{ modelText }}
                    </div>
                  </div>

                  <!-- 规则配置 -->
                  <div v-if="timeLineActice === '进入岸线重点区域'" class="rule-config-section">
                    <div class="section-header">
                      <span class="section-title">规则配置</span>
                    </div>
                    <div class="rule-form">
                      <div class="form-item">
                        <label>停靠时间(起始):</label>
                        <a-time-picker
                          v-model:value="ruleConfig.startTime" format="HH:mm:ss" placeholder="请选择时间"
                          class="rule-input"
                        />
                      </div>
                      <div class="form-item">
                        <label>停靠时间(结束):</label>
                        <a-time-picker
                          v-model:value="ruleConfig.endTime" format="HH:mm:ss" placeholder="请选择时间"
                          class="rule-input"
                        />
                      </div>
                      <div class="form-item">
                        <label>停靠最小时长:</label>
                        <a-input-number v-model:value="ruleConfig.durationMin" :min="0" class="rule-input">
                          <template #addonAfter>
                            <span class="unit">分钟</span>
                          </template>
                        </a-input-number>
                      </div>
                      <div class="form-item">
                        <label>停靠最大时长:</label>
                        <a-input-number v-model:value="ruleConfig.durationMax" :min="0" :max="60" class="rule-input">
                          <template #addonAfter>
                            <span class="unit">分钟</span>
                          </template>
                        </a-input-number>
                      </div>
                      <div class="form-item">
                        <label>接驳前多久时间:</label>
                        <a-input-number
                          v-model:value="ruleConfig.shuttleBeforeTime" :min="0.5" :max="60" :step="0.5"
                          class="rule-input"
                        >
                          <template #addonAfter>
                            <span class="unit">小时</span>
                          </template>
                        </a-input-number>
                      </div>
                      <div class="form-item">
                        <label>轨迹相似度:</label>
                        <a-input-number
                          v-model:value="ruleConfig.trackRatio" :min="0.5" :max="1" :step="0.1"
                          :precision="1" class="rule-input"
                        />
                      </div>
                      <div class="form-actions">
                        <a-button type="primary" class="edit-btn" @click="handleSave">
                          编辑
                        </a-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 下半部分 -->
                <div class="result-bottom">
                  <!-- 预警趋势 -->
                  <div class="warning-trend-section">
                    <div class="section-header">
                      <span class="section-title">预警趋势</span>
                      <div class="tabs">
                        <span class="tab-item" :class="[{ active: trendTab === 'month' }]" @click="trendTab = 'month'">
                          本月
                        </span>
                        <span class="tab-item" :class="[{ active: trendTab === 'year' }]" @click="trendTab = 'year'">
                          本年
                        </span>
                      </div>
                    </div>
                    <div ref="trendChartRef" class="trend-chart" style="width: 100%; height: 300px" />
                  </div>

                  <!-- 预警次数 -->
                  <div class="warning-count-section">
                    <div class="section-header">
                      <span class="section-title">预警次数</span>
                    </div>
                    <div class="warning-table">
                      <table>
                        <thead>
                          <tr>
                            <th>排行</th>
                            <th>指标名称</th>
                            <th style="text-align: right;">
                              预警次数
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, index) in warningCountList" :key="index" class="rank-row" :class="[
                              { 'rank-1': index === 0 },
                              { 'rank-2': index === 1 },
                              { 'rank-other': index >= 2 },
                            ]"
                          >
                            <td>
                              <div class="rank-badge">
                                {{ String(index + 1).padStart(2, '0') }}
                              </div>
                            </td>
                            <td>{{ item.name }}</td>
                            <td>{{ item.count }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="right-section">
          <div class="frequency-warning-panel">
            <div class="panel-title">
              高频预警模型
            </div>
            <div class="frequency-models">
              <div v-for="model in frequencyModels" :key="model.value" class="frequency-model-item">
                <div class="model-label">
                  <span>{{ model.label }}</span>
                  <span class="model-value">{{ model.value }}</span>
                </div>
                <a-slider
                  v-model:value="model.value" :min="0" :max="1500" :disabled="true" :step="10"
                  class="model-slider" :class="`slider-${model.color}`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="modelType === 'personal'" class="content-section" />
    </div>
  </a-drawer>
</template>

<style lang="scss" scoped>
.model-center-container {
  width: 1600px;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #ffffff;
}

// 顶部标题栏
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(2, 207, 228, 0.1);

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
  }

  .model-type {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 4px;
    transition: all 0.3s;
    text-align: center;
    flex: 1;

    &:hover {
      color: #02cfe4;
      background: rgba(2, 207, 228, 0.1);
    }

    &.active {
      color: #02cfe4;
      background: rgba(2, 207, 228, 0.1);
      border: 1px solid rgba(2, 207, 228, 0.3);
    }
  }
}

.content-section {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;

  .left-section {
    flex: 0.75;

    // 自定义 radio-group 样式
    :deep(.ant-radio-group) {
      width: 36%;
      display: flex;
      gap: 0;
      background: transparent;
      border-radius: 4px;
      overflow: hidden;
    }

    :deep(.ant-radio-button-wrapper) {
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      border-right: 1px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      padding: 2px 10px;
      text-align: center;
      transition: all 0.3s;
      position: relative;
      margin: 0;

      &:last-child {
        border-right: none;
      }

      &:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.12);
      }

      &::before {
        display: none;
      }

      &.ant-radio-button-wrapper-checked {
        background: rgba(2, 207, 228, 0.3);
        color: #ffffff;
        font-weight: 500;
        border-color: rgba(2, 207, 228, 0.3);
        box-shadow: none;
        z-index: 1;

        &:hover {
          background: rgba(2, 207, 228, 0.35);
          color: #ffffff;
        }
      }
    }
  }

  .model-content {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    justify-content: space-between;

    .process {
      flex: 0.18;
      padding: 20px;
      height: 100%;

      :deep(.ant-timeline) {
        margin: 0;
        padding: 0;
      }

      :deep(.ant-timeline-item-head) {
        background: none;
      }

      :deep(.ant-timeline-item) {
        padding-bottom: 20px;
        cursor: pointer;
        position: relative;

        &:last-child {
          padding-bottom: 0;

          .ant-timeline-item-tail {
            display: none;
          }
        }

        .ant-timeline-item-content {
          top: -6px;
          margin-left: 28px;
        }

        .ant-timeline-item-tail {
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          left: 5px;
          top: 12px;
        }
      }

      .feature-item {
        display: flex;
        align-items: center;
        transition: all 0.3s;

        .feature-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.3s;
        }

        .timeline-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgb(154, 154, 154);
          border: none;
          transition: all 0.3s;
          position: relative;
          z-index: 2;
          margin: 0;

          &.active {
            width: 6px;
            height: 6px;
            background: #02cfe4;
            box-shadow:
              0 0 10px rgba(2, 207, 228, 0.8),
              0 0 20px rgba(2, 207, 228, 0.4);
          }
        }

        &.active {
          .feature-text {
            color: #02cfe4;
            font-weight: 500;
          }

          :deep(.ant-timeline-item-tail) {
            border-left-color: rgba(2, 207, 228, 0.2);
          }
        }

        &:hover {
          .feature-text {
            color: rgba(2, 207, 228, 0.8);
          }

          .timeline-dot:not(.active) {
            background: rgba(255, 255, 255, 0.6);
            border-color: rgba(255, 255, 255, 0.4);
          }
        }
      }
    }

    .result {
      flex: 0.82;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .result-top {
        display: flex;
        flex-direction: column;
        gap: 0;
        flex: 1;
        background: rgba(164, 164, 164, 0.05);
        border-radius: 8px;
        padding: 20px;
      }

      .top-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(0, 255, 255, 0.2);

        .main-title {
          font-size: 20px;
          font-weight: 600;
        }

        .switch-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;

          .switch-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
          }

          .model-switch {
            :deep(.ant-switch-checked) {
              background-color: #02cfe4;
            }
          }
        }
      }

      .content-wrapper {
        display: flex;
        gap: 0;
        flex: 1;
      }

      .model-overview-section {
        flex: 1;
        padding-right: 20px;
        border-right: 1px solid rgba(0, 255, 255, 0.2);

        .model-description {
          font-size: 14px;
          height: 295px;
          line-height: 1.8;
          padding-right: 10px;
          overflow-y: auto;
          color: rgba(255, 255, 255, 0.8);
          text-align: justify;

          &::-webkit-scrollbar-track {
            background: transparent;
          }

          &::-webkit-scrollbar {
            width: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background-color: #5290bd;
          }
        }
      }

      .rule-config-section {
        flex: 1;
        padding-left: 20px;

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          .section-title {
            &::before {
              content: '';
              display: inline-block;
              width: 2px;
              height: 14px;
              background: #02cfe4;
              margin-right: 6px;
            }
          }
        }
      }

      .rule-config-section {
        .rule-form {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .form-item {
            display: flex;
            align-items: center;
            gap: 12px;

            label {
              min-width: 120px;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
              text-align: right;
            }

            .rule-input {
              flex: 1;

              :deep(.ant-input-number-input-wrap) {
                input {
                  color: #ffffff !important;
                }
              }

              :deep(.ant-input-number-group-addon) {
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-left: none;
              }
            }

            .unit {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
            }
          }

          .form-actions {
            display: flex;
            justify-content: center;
            margin-top: 8px;

            .edit-btn {
              background: transparent;
              border: 1px solid rgba(0, 255, 255, 0.3);
              color: #02cfe4;
              font-size: 14px;
              width: 42%;
              padding: 0 24px;
              height: 32px;
              border-radius: 4px;
              transition: all 0.3s;

              &:hover {
                background: rgba(0, 255, 255, 0.1);
                border-color: rgba(0, 255, 255, 0.5);
              }
            }
          }
        }
      }

      .result-bottom {
        display: flex;
        gap: 0;
        margin-top: 10px;

        .warning-trend-section {
          flex: 1;

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            padding-left: 8px;

            &::before {
              content: '';
              display: inline-block;
              width: 2px;
              height: 14px;
              background: #02cfe4;
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
            }

            .tabs {
              display: flex;
              gap: 16px;
              height: 30px;

              .tab-item {
                padding: 6px 16px;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                transition: all 0.3s;
                border-radius: 4px;

                &:hover {
                  color: #02cfe4;
                  background: rgba(2, 207, 228, 0.1);
                }

                &.active {
                  color: #02cfe4;
                  background: rgba(2, 207, 228, 0.2);
                  border-bottom: 2px solid #02cfe4;
                }
              }
            }
          }

          .trend-chart {
            margin-top: 16px;
          }
        }

        .warning-count-section {
          flex: 1;
          padding-left: 20px;

          .section-header {
            display: flex;
            align-items: center;

            &::before {
              content: '';
              display: inline-block;
              width: 2px;
              height: 14px;
              background: #02cfe4;
              margin-right: 6px;
            }
          }
        }

        .warning-count-section {
          .warning-table {
            margin-top: 16px;

            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0 8px;

              thead {
                tr {
                  th {
                    padding: 12px;
                    text-align: left;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    background: rgba(0, 255, 255, 0.05);
                  }
                }
              }

              tbody {
                tr {
                  position: relative;
                  border-radius: 8px;
                  overflow: hidden;
                  margin-bottom: 8px;

                  td {
                    padding: 11px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    border: none;
                    position: relative;
                    z-index: 1;

                    &:first-child {
                      width: 80px;
                    }

                    &:last-child {
                      text-align: right;
                      font-weight: 600;
                    }
                  }

                  .rank-badge {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #ffffff;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                  }

                  // 第1名 - 红棕色渐变
                  &.rank-1 {
                    background: linear-gradient(0deg, rgba(205, 92, 92, 0.6) 5%, transparent 40%);
                    box-shadow: 0 2px 8px rgba(205, 92, 92, 0.3);

                    .rank-badge {
                      background: linear-gradient(0deg, rgba(205, 92, 92, 0.6) 5%, transparent 60%);
                      box-shadow:
                        0 2px 10px rgba(205, 92, 92, 0.6),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }

                    td {
                      color: #ffd700;
                      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    }
                  }

                  // 第2名 - 黄金色渐变
                  &.rank-2 {
                    background: linear-gradient(0deg, rgba(255, 215, 0, 0.35) 5%, transparent 40%);
                    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);

                    .rank-badge {
                      background: linear-gradient(0deg,
                          rgba(255, 215, 0, 0.35) 5%,
                          transparent 60%);
                      box-shadow:
                        0 2px 10px rgba(255, 215, 0, 0.6),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3);
                    }

                    td {
                      color: #ffd700;
                      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    }
                  }

                  // 第3-5名 - 浅蓝色渐变
                  &.rank-other {
                    background: linear-gradient(0deg, rgba(2, 207, 228, 0.25) 5%, transparent 40%);
                    box-shadow: 0 2px 6px rgba(2, 207, 228, 0.2);

                    .rank-badge {
                      background: linear-gradient(0deg,
                          rgba(2, 207, 228, 0.25) 5%,
                          transparent 60%);
                      box-shadow:
                        0 2px 8px rgba(2, 207, 228, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }

                    td {
                      color: rgba(255, 255, 255, 0.95);
                    }
                  }

                  &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    transition: all 0.3s;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .right-section {
    flex: 0.25;
    display: flex;
    background: rgba(164, 164, 164, 0.05);
    border-radius: 8px;

    .frequency-warning-panel {
      width: 100%;
      background: url('@/assets/imgs/madel-bg.png') no-repeat bottom center / 100% 70%;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;

      .panel-title {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 20px;
        position: relative;
        z-index: 2;
      }

      .frequency-models {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        position: relative;
        z-index: 2;

        .frequency-model-item {
          .model-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);

            .model-value {
              color: #02cfe4;
              font-weight: 600;
              font-size: 16px;
            }
          }

          .model-slider {
            cursor: inherit !important;

            :deep(.ant-slider-rail) {
              background: rgba(255, 255, 255, 0.1);
              height: 6px;
            }

            :deep(.ant-slider-track) {
              height: 6px;
            }

            :deep(.ant-slider-rail) {
              background: rgba(255, 255, 255, 0.2) !important;
            }

            :deep(.ant-slider-handle) {
              cursor: pointer;
              width: 6px;
              height: 14px;
              border: none;
              border-radius: 4px;
              background: #ffffff;
              box-shadow: none;

              &::after,
              &::before {
                display: none;
              }
            }

            :deep(.ant-slider-handle:hover) {
              border-color: transparent;
              box-shadow: none;
            }

            :deep(.ant-slider-handle:focus) {
              border-color: transparent;
              box-shadow: none;
            }

            // 橙色滑块
            &.slider-orange {
              :deep(.ant-slider-track) {
                background: linear-gradient(90deg, #ff8c00 0%, #ffa500 100%);
              }
            }

            // 黄色滑块
            &.slider-yellow {
              :deep(.ant-slider-track) {
                background: linear-gradient(90deg, #ffd700 0%, #ffff00 100%);
              }
            }

            // 蓝色滑块
            &.slider-blue {
              :deep(.ant-slider-track) {
                background: linear-gradient(90deg, #02cfe4 0%, #00ffff 100%);
              }
            }
          }
        }
      }
    }
  }
}
</style>
