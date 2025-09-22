<template>
  <a-drawer
    v-model:open="visibleModal"
    title="预警中心"
    placement="left"
    getContainer=".ui-container"
    :width="430"
    :closable="true"
    :mask="false"
    class="warning-drawer"
  >
    <template #closeIcon>
      <img
        height="24px"
        style="margin-top: -6px"
        src="@/assets/imgs/warn.png"
        alt=""
      />
    </template>
    <template #extra>
      <CloseOutlined @click="handleClose" />
    </template>
    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <!-- <a-input
        v-model:value="searchKeyword"
        placeholder="请输入关键词"
        class="search-input"
        @pressEnter="handleSearch"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input> -->

      <div class="filter-row">
        <div class="filter-row-item">
          <div class="filter-row-item-dropdown">
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                {{ timeFilter || "时间" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleTimeChange('今天')">
                    今天
                  </a-menu-item>
                  <a-menu-item @click="handleTimeChange('本周')">
                    本周
                  </a-menu-item>
                  <a-menu-item @click="handleTimeChange('本月')">
                    本月
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <div class="filter-row-item-dropdown">
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                {{ statusFilter || "状态" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleStatusChange('待处置')">
                    待处置
                  </a-menu-item>
                  <a-menu-item @click="handleStatusChange('已送达')">
                    已送达
                  </a-menu-item>
                  <a-menu-item @click="handleStatusChange('已处理')">
                    已处理
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        <div class="filter-row-item2">
          <a-input
            v-model:value="locationFilter"
            placeholder="位置"
            style="width: 120px; flex: 0.65"
          />

          <a-button
            type="primary"
            style="flex: 0.1725"
            size="small"
            @click="handleQuery"
            class="query-btn"
          >
            查询
          </a-button>
          <a-button
            @click="handleReset"
            style="flex: 0.1725"
            class="reset-btn"
            size="small"
          >
            重置
          </a-button>
        </div>
      </div>
    </div>

    <!-- 分类标签和导出 -->
    <div class="category-section">
      <div class="category-tabs">
        <a-button
          v-for="category in categories"
          :key="category.value"
          :type="activeCategory === category.value ? 'primary' : 'default'"
          size="small"
          @click="handleCategoryChange(category.value)"
          class="category-tab"
        >
          {{ category.label }}
        </a-button>
      </div>

      <a-dropdown>
        <a-button class="export-btn" size="small">
          导出全部
          <DownOutlined />
        </a-button>
        <template #overlay>
          <a-menu>
            <a-menu-item key="excel">导出Excel</a-menu-item>
            <a-menu-item key="pdf">导出PDF</a-menu-item>
            <a-menu-item key="csv">导出CSV</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <!-- 预警列表 -->
    <div class="warning-list">
      <div
        v-for="(warning, index) in filteredWarnings"
        :key="warning.id"
        class="warning-item"
        @click="handleWarningClick(warning)"
      >
        <div class="warning-header">
          <div class="warning-time">预警时间: {{ warning.createTime }}</div>
          <a-tag :color="getStatusColor(warning.status)" class="status-tag">
            {{ getStatusText(warning.status) }}
          </a-tag>
        </div>

        <div class="warning-type">{{ warning.type }}</div>
        <div class="warning-location-actions">
          <div class="warning-location">
            <EnvironmentOutlined />
            {{ warning.location }}
          </div>

          <div class="warning-actions">
            <a-button
              type="link"
              size="small"
              @click.stop="handleTrack(warning)"
              class="action-btn"
            >
              <PlayCircleOutlined style="" />
              <span style="margin-left: 0px">轨迹</span>
            </a-button>
            <a-button
              type="link"
              size="small"
              @click.stop="handleDetail(warning)"
              class="action-btn"
            >
              <EyeOutlined />
              <span style="margin-left: 0px">详情</span>
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>

  <!-- 预警详情面板 -->
  <WarningDetailPanel
    v-model:visible="detailDrawerVisible"
    :warning-data="selectedWarning"
    @close="handleDetailClose"
  />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import WarningDetailPanel from "./components/WarningDetailPanel/WarningDetailPanel.vue";
import {
  SearchOutlined,
  DownOutlined,
  EnvironmentOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CloseOutlined,
} from "@ant-design/icons-vue";

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([
  "update:open",
  "warning-click",
  "track-click",
  "detail-click",
]);

// 响应式数据
const statusFilter = ref("");
const locationFilter = ref("");
const timeFilter = ref("");
const activeCategory = ref("all");
const detailDrawerVisible = ref(false);
const selectedWarning = ref(null);

const visibleModal = computed(() => props.open);
// 分类选项
const categories = [
  { value: "all", label: "全部预警" },
  { value: "ship", label: "船舶预警" },
  { value: "vehicle", label: "车辆预警" },
];

// 预警数据
const warnings = ref([
  {
    id: 1,
    type: "团伙车辆聚集",
    location: "台州市黄岩区",
    time: "本周",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.4, 28.6],
    description: "发现多辆可疑车辆在指定区域聚集，疑似进行非法活动",
    // 详情数据
    shipName: "华盛123",
    warningType: "一般多AIS",
    riskPoint: "白岩码头",
    suspiciousVehicle: "可疑车辆",
    warningTime: "2025.06.12 21:00:09",
    reason: "浙普渔87392 2025.06.12 21:00:09在高风险点白岩码头停靠",
    notifier: "王五",
    notificationTime: "2025.06.12 21:00:09",
    notificationMethod: "浙征钉、站内信",
    deliveryTime: "2025.06.12 21:00",
    deliverySystem: "--",
    deliveryArea: "宁波象山县",
  },
  {
    id: 2,
    type: "团伙车辆聚集",
    location: "台州市三门县",
    time: "本周",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.5, 29.1],
    description: "三门县发现可疑车辆聚集，需要立即核实",
  },
  {
    id: 3,
    type: "一船多AIS",
    location: "台州市三门县",
    time: "本周",
    createTime: "2025-09-01 10:00:00",
    status: "已送达",
    category: "ship",
    coordinates: [121.5, 29.1],
    description: "检测到同一船只使用多个AIS设备，存在异常行为",
  },
  {
    id: 4,
    type: "一船多AIS",
    location: "台州市三门县",
    time: "今天",
    createTime: "2025-09-01 10:00:00",
    status: "已送达",
    category: "ship",
    coordinates: [121.5, 29.1],
    description: "再次检测到AIS设备异常，已发送预警通知",
  },
  {
    id: 5,
    type: "涉台异常船舶",
    location: "台州市椒江区",
    time: "今天",
    createTime: "2025-09-01 10:00:00",
    status: "已处理",
    category: "ship",
    coordinates: [121.4, 28.6],
    description: "发现与台湾相关的异常船舶活动，已处理完毕",
  },
  {
    id: 6,
    type: "可疑人员聚集",
    location: "台州市路桥区",
    time: "本月",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.4, 28.6],
    description: "路桥区发现可疑人员聚集，疑似进行非法交易",
  },
  {
    id: 7,
    type: "可疑人员聚集",
    location: "台州市路桥区",
    time: "本月",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.4, 28.6],
    description: "路桥区发现可疑人员聚集，疑似进行非法交易",
  },
  {
    id: 8,
    type: "可疑人员聚集",
    location: "台州市路桥区",
    time: "本月",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.4, 28.6],
    description: "路桥区发现可疑人员聚集，疑似进行非法交易",
  },
  {
    id: 9,
    type: "可疑人员聚集",
    location: "台州市路桥区",
    time: "本月",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.4, 28.6],
    description: "路桥区发现可疑人员聚集，疑似进行非法交易",
  },
  {
    id: 10,
    type: "可疑人员聚集",
    location: "台州市路桥区",
    time: "本月",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.4, 28.6],
    description: "路桥区发现可疑人员聚集，疑似进行非法交易",
  },
  {
    id: 11,
    type: "可疑人员聚集",
    location: "台州市路桥区",
    time: "本月",
    createTime: "2025-09-01 10:00:00",
    status: "待处置",
    category: "vehicle",
    coordinates: [121.4, 28.6],
    description: "路桥区发现可疑人员聚集，疑似进行非法交易",
  },
]);

// 计算属性
const filteredWarnings = computed(() => {
  let filtered = warnings.value;

  // 按分类筛选
  if (activeCategory.value !== "all") {
    filtered = filtered.filter(
      (warning) => warning.category === activeCategory.value
    );
  }

  // 按状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(
      (warning) => warning.status === statusFilter.value
    );
  }

  // 按位置筛选
  if (locationFilter.value) {
    filtered = filtered.filter((warning) =>
      warning.location.includes(locationFilter.value)
    );
  }
  if (timeFilter.value) {
    filtered = filtered.filter((warning) =>
      warning.time.includes(timeFilter.value)
    );
  }

  return filtered;
});

const totalWarnings = computed(() => filteredWarnings.value.length);

const handleTimeChange = (time) => {
  timeFilter.value = time;
};

const handleStatusChange = (status) => {
  statusFilter.value = status;
};
// 方法
const getStatusColor = (status) => {
  const colorMap = {
    待处置: "orange",
    已送达: "green",
    已处理: "blue",
  };
  return colorMap[status] || "default";
};

const getStatusText = (status) => {
  return status;
};

const handleClose = () => {
  emit("update:open", false);
};

const handleQuery = () => {
  handleReset();
};

const handleReset = () => {
  timeFilter.value = "";
  statusFilter.value = "";
  locationFilter.value = "";
  activeCategory.value = "all";
};

const handleCategoryChange = (category) => {
  activeCategory.value = category;
};

const handleWarningClick = (warning) => {
  emit("warning-click", warning);
};

const handleTrack = (warning) => {
  emit("track-click", warning);
};

const handleDetail = (warning) => {
  selectedWarning.value = warning;
  detailDrawerVisible.value = true;
  emit("detail-click", warning);
};

const handleDetailClose = () => {
  detailDrawerVisible.value = false;
};
</script>

<style lang="scss" scoped>
.warning-drawer {
  .search-section {
    margin-bottom: 20px;

    .search-input {
      margin-bottom: 12px;

      &:hover {
        border-color: #00ffff;
        box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
      }

      &:focus {
        border-color: #00ffff;
        box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
      }
      :deep(.ant-input) {
        background: rgba(18, 28, 43, 0.8);
        border: none;
        color: #ffffff;

        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      }

      :deep(.ant-input-prefix) {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .filter-row {
      .filter-row-item {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        .filter-row-item-dropdown {
          flex: 1;
          :deep(.ant-dropdown-link) {
            color: #ffffff;
            font-size: 12px;
          }
        }
      }
      .filter-row-item2 {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-top: 16px;
        :deep(.ant-input) {
          font-size: 12px;
          height: 28px;
          border-radius: 0;
        }
      }
      :deep(.ant-select) {
        .ant-select-selector {
          background: rgba(18, 28, 43, 0.8);
          border: 1px solid rgba(163, 197, 217, 0.3);
          color: #ffffff;

          .ant-select-selection-placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          .ant-select-selection-item {
            color: #ffffff;
          }
        }

        &:hover .ant-select-selector {
          border-color: #00ffff;
        }

        &.ant-select-focused .ant-select-selector {
          border-color: #00ffff;
          box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
        }
      }

      :deep(.ant-input) {
        background: rgba(18, 28, 43, 0.8);
        border: 1px solid rgba(163, 197, 217, 0.3);
        color: #ffffff;

        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        &:focus {
          border-color: none;
          box-shadow: none;
        }
      }

      .query-btn {
        background: transparent;
        border-radius: 0;
        padding: 0 16px;
        height: 28px;
        border-color: #153e4b;
        color: #fff;
        font-size: 12px;

        &:hover {
          background: #1a4e5e;
          border-color: #1f5b6d;
        }
      }

      .reset-btn {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.17);
        border-radius: 0;
        padding: 0 16px;
        height: 28px;
        color: #ffffff;
        font-size: 12px;
        &:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.17);
        }
      }
    }
  }

  .category-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .category-tabs {
      display: flex;
      gap: 0px;

      .category-tab {
        background: transparent;
        border-color: rgba(255, 255, 255, 0.17);
        color: #ffffff;
        padding: 0 14px;
        height: 28px;
        border: none;
        font-size: 14px;
        box-shadow: inset 0 0 2px 1px #0d3e4f;

        &:hover {
          background: #153e4b;
          border-color: rgba(255, 255, 255, 0.17);
        }

        &.ant-btn-primary {
          border: none;
          box-shadow: inset 0 0 5px 5px #104b5f;
          color: #fff;

          &:hover {
            background: #153e4b;
            border-color: none;
            box-shadow: inset 0 0 5px 5px #104b5f;
          }
        }
      }
    }

    .export-btn {
      background: #103d4c;
      border-color: #103d4c;
      color: #ffffff;
      padding: 0 12px;
      height: 30px;
      font-size: 14px;

      &:hover {
        background: #144b5d;
        border-color: #144b5d;
      }
    }
  }

  .warning-list {
    flex: 1;
    overflow-y: auto;
    height: calc(100% - 135px);
    width: calc(100% + 6px);
    padding-right: 6px;

    .warning-item {
      background: rgba(18, 28, 43, 0.8);
      border: 1px solid rgba(0, 255, 255, 0.17);
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 255, 255, 0.1);
      }

      .warning-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        position: relative;

        .warning-time {
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
        }

        .status-tag {
          position: absolute;
          right: -24px;
          top: -16px;
          font-size: 11px;
          font-weight: 600;
          border: none;
          border-radius: 0 0 12px 12px;
        }
      }

      .warning-type {
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .warning-location-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .warning-location {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .warning-actions {
          display: flex;
          gap: 12px;

          .action-btn {
            color: #fff;
            padding: 0;
            height: auto;
            font-size: 10px;

            &:hover {
              color: #00e6e6;
            }

            .anticon {
              margin-right: 4px;
            }
          }
        }
      }
    }
    &::-webkit-scrollbar {
      width: 2px;
      background-color: #00ffff;
    }
    &::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
      border-radius: 1px;
      background-color: #f5f5f5;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 1px;
      -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
      background-color: #00ffff;
    }
  }
}
</style>
