<template>
  <a-drawer
    v-model:open="visibleModal"
    title="团伙车辆查询"
    placement="right"
    getContainer=".ui-container"
    :width="1080"
    :closable="true"
    :mask="false"
    rootClassName="layer-box"
    class="layer-control-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>
    <div v-if="toggleView">
      <!-- 搜索和筛选区域 -->
      <div class="search-filter-section">
        <div class="filter-row">
          <div class="filter-input-group action-buttons">
            <a-button type="primary" class="query-btn" @click="handleAddQuery">
              添加查询单
            </a-button>
            <a-input
              v-model:value="licensePlateNumber"
              placeholder="请输入车牌号"
              class="license-plate-input"
              allowClear
              @pressEnter="handleQuery"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input>

            <a-select
              v-model:value="selectedPlateColor"
              placeholder="请选择车牌颜色"
              class="plate-color-select"
              allowClear
              @change="handlePlateColorChange"
            >
              <a-select-option value="蓝色">蓝色</a-select-option>
              <a-select-option value="黄色">黄色</a-select-option>
              <a-select-option value="绿色">绿色</a-select-option>
              <a-select-option value="白色">白色</a-select-option>
              <a-select-option value="黑色">黑色</a-select-option>
            </a-select>

            <a-select
              v-model:value="selectedTimeRange"
              placeholder="时间范围"
              class="time-range-select"
              allowClear
              @change="handleTimeRangeChange"
            >
              <a-select-option value="今天">今天</a-select-option>
              <a-select-option value="本周">本周</a-select-option>
              <a-select-option value="本月">本月</a-select-option>
            </a-select>
          </div>

          <div class="action-buttons">
            <a-button type="primary" class="query-btn" @click="handleQuery">
              查询
            </a-button>
            <a-button class="export-btn" @click="handleExport">
              导出
              <template #icon>
                <ExportOutlined />
              </template>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 团伙车辆查询列表 -->
      <div class="gang-vehicle-table">
        <a-table
          :columns="gangVehicleColumns"
          :data-source="gangVehicleData"
          :pagination="paginationConfig"
          size="small"
          class="gang-vehicle-table-content"
          :on-change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'operation'">
              <a-button
                type="link"
                size="small"
                class="detail-btn"
                @click="handleViewDetail(record)"
              >
                查看详情
              </a-button>
            </template>
          </template>
        </a-table>
      </div>
    </div>
    <div v-if="!toggleView">
      <!-- 团伙车辆详情表格 -->
      <div class="gang-detail-view">
        <div class="detail-header">
          <a-button
            type="link"
            size="small"
            class="back-btn"
            @click="handleBackToGangList"
          >
            <ArrowLeftOutlined />
            返回上级
          </a-button>
        </div>

        <a-table
          :columns="gangDetailColumns"
          :data-source="gangDetailData"
          :pagination="false"
          class="gang-detail-table"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button
                type="link"
                size="small"
                class="action-btn"
                @click="handleViewTrajectory(record)"
              >
                查看轨迹
              </a-button>
            </template>
          </template>
        </a-table>
      </div>
    </div>
    <!-- 添加查询单弹窗 -->
    <div
      v-if="searchVisible"
      title="团伙车辆查询"
      class="search-modal-container"
    >
      <div class="search-modal-content">
        <!-- 查询表格 -->
        <div class="query-table-container">
          <!-- 表格头部 -->
          <div class="table-header">
            <div class="header-cell">时间范围</div>
            <div class="header-cell">车牌号</div>
            <div class="header-cell">车牌颜色</div>
            <div class="header-cell">操作</div>
          </div>

          <!-- 输入行 1-4 -->
          <div
            class="input-row"
            v-for="(item, index) in inputRows"
            :key="`input-${index}`"
          >
            <div class="cell">
              <a-date-picker
                v-model:value="item.timeRange"
                placeholder="选择时间范围"
                class="time-picker"
                :bordered="false"
              />
            </div>
            <div class="cell">
              <a-input
                v-model:value="item.vehicleName"
                placeholder="请输入车牌号"
                class="vehicle-input"
                :bordered="false"
              />
            </div>
            <div class="cell">
              <a-select
                v-model:value="item.plateColor"
                placeholder="车牌颜色"
                class="color-select"
                :bordered="false"
              >
                <a-select-option value="蓝色">蓝色</a-select-option>
                <a-select-option value="黄色">黄色</a-select-option>
                <a-select-option value="绿色">绿色</a-select-option>
                <a-select-option value="白色">白色</a-select-option>
              </a-select>
            </div>
            <div class="cell operation-cell">
              <div class="action-buttons">
                <a-button
                  type="text"
                  size="small"
                  class="action-btn minus-btn"
                  @click="removeInputRow(index)"
                >
                  <span class="btn-icon">⊖</span>
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  class="action-btn plus-btn"
                  @click="addInputRow"
                >
                  <span class="btn-icon">⊕</span>
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="bottom-buttons">
          <a-button
            type="primary"
            class="query-btn"
            @click="handleAddVehicleQuery"
          >
            查询
          </a-button>
          <a-button class="cancel-btn" @click="handleCancel"> 取消 </a-button>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import {
  CloseOutlined,
  SearchOutlined,
  ExportOutlined,
} from "@ant-design/icons-vue";

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
const licensePlateNumber = ref("");
const selectedPlateColor = ref();
const selectedTimeRange = ref();
const searchVisible = ref(false);
const toggleView = ref(true);

const inputRows = ref([
  {
    timeRange: null,
    vehicleName: "",
    plateColor: null,
  },
]);

// 团伙车辆查询表格列定义
const gangVehicleColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 60,
    align: "center",
  },
  {
    title: "查询单",
    dataIndex: "queryName",
    key: "queryName",
    width: 200,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    width: 120,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 80,
    align: "center",
  },
  {
    title: "操作",
    key: "operation",
    width: 80,
    align: "center",
  },
];

// 团伙车辆查询数据
const gangVehicleData = ref([
  {
    key: "1",
    index: 1,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "2",
    index: 2,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "3",
    index: 3,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "4",
    index: 4,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "5",
    index: 5,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "6",
    index: 6,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "7",
    index: 7,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "8",
    index: 8,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "9",
    index: 9,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "10",
    index: 10,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "11",
    index: 11,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "12",
    index: 12,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "13",
    index: 13,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "14",
    index: 14,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "15",
    index: 15,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "16",
    index: 16,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "17",
    index: 17,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "18",
    index: 18,
    queryName: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
]);

// 分页配置
const paginationConfig = {
  current: 1,
  pageSize: 10,
  total: gangVehicleData.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共${total}条`,
  pageSizeOptions: ["10", "20", "30", "50"],
  size: "small",
};
// 团伙车辆详情表格列配置
const gangDetailColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 80,
    align: "center",
  },
  {
    title: "车牌号",
    dataIndex: "plateNumber",
    key: "plateNumber",
    width: 120,
  },
  {
    title: "车牌颜色",
    dataIndex: "plateColor",
    key: "plateColor",
    width: 100,
  },
  {
    title: "车辆类型",
    dataIndex: "vehicleType",
    key: "vehicleType",
    width: 120,
  },
  {
    title: "轨迹相似度",
    dataIndex: "similarity",
    key: "similarity",
    width: 120,
    align: "center",
  },
  {
    title: "相似时间范围",
    dataIndex: "timeRange",
    key: "timeRange",
    width: 200,
  },
  {
    title: "操作",
    key: "action",
    width: 100,
    align: "center",
  },
];
// 团伙车辆详情表格数据
const gangDetailData = ref([
  {
    key: "1",
    index: 1,
    plateNumber: "浙XXXX",
    plateColor: "蓝色",
    vehicleType: "高栏货车",
    similarity: "90%",
    timeRange: "2025/6/15 1:18 - 2025/6/16 8:42",
  },
  {
    key: "2",
    index: 2,
    plateNumber: "浙XXXX",
    plateColor: "蓝色",
    vehicleType: "高栏货车",
    similarity: "90%",
    timeRange: "2025/6/15 1:18 - 2025/6/16 8:42",
  },
  {
    key: "3",
    index: 3,
    plateNumber: "浙XXXX",
    plateColor: "蓝色",
    vehicleType: "高栏货车",
    similarity: "90%",
    timeRange: "2025/6/15 1:18 - 2025/6/16 8:42",
  },
  {
    key: "4",
    index: 4,
    plateNumber: "浙XXXX",
    plateColor: "蓝色",
    vehicleType: "高栏货车",
    similarity: "90%",
    timeRange: "2025/6/15 1:18 - 2025/6/16 8:42",
  },
  {
    key: "5",
    index: 5,
    plateNumber: "浙XXXX",
    plateColor: "蓝色",
    vehicleType: "高栏货车",
    similarity: "90%",
    timeRange: "2025/6/15 1:18 - 2025/6/16 8:42",
  },
  {
    key: "6",
    index: 6,
    plateNumber: "浙XXXX",
    plateColor: "蓝色",
    vehicleType: "高栏货车",
    similarity: "90%",
    timeRange: "2025/6/15 1:18 - 2025/6/16 8:42",
  },
  {
    key: "7",
    index: 7,
    plateNumber: "浙XXXX",
    plateColor: "蓝色",
    vehicleType: "高栏货车",
    similarity: "90%",
    timeRange: "2025/6/15 1:18 - 2025/6/16 8:42",
  },
]);
const handleClose = () => {
  emit("update:open", false);
};

const handleAddQuery = () => {
  console.log("添加查询单");
  searchVisible.value = true;
};

// 查询按钮
const handleAddVehicleQuery = () => {
  console.log("执行查询", inputRows.value);
  // 这里可以添加查询逻辑
};

// 取消按钮
const handleCancel = () => {
  searchVisible.value = false;
  // 重置输入数据
  inputRows.value = [
    {
      timeRange: null,
      vehicleName: "",
      plateColor: null,
    },
  ];
};
// 添加输入行
const addInputRow = () => {
  if (inputRows.value.length < 3) {
    inputRows.value.push({
      timeRange: null,
      vehicleName: "",
      plateColor: null,
    });
  } else {
    message.error("最多添加3行");
  }
};

// 删除输入行
const removeInputRow = (index) => {
  if (inputRows.value.length > 1) {
    inputRows.value.splice(index, 1);
  }
};

const handleBackToGangList = () => {
  toggleView.value = true;
};

// 查看轨迹
const handleViewTrajectory = (record) => {
  console.log("查看轨迹:", record);
};

const handleQuery = () => {
  console.log("查询团伙车辆", {
    licensePlateNumber: licensePlateNumber.value,
    plateColor: selectedPlateColor.value,
    timeRange: selectedTimeRange.value,
  });
};

const handleExport = () => {
  console.log("导出数据");
};

const handlePlateColorChange = (value) => {
  selectedPlateColor.value = value;
  console.log("选择车牌颜色:", value);
};

const handleTimeRangeChange = (value) => {
  selectedTimeRange.value = value;
  console.log("选择时间范围:", value);
};

const handleViewDetail = (record) => {
  console.log("查看详情", record);
  toggleView.value = false;
};

const handleTableChange = (pagination, filters, sorter) => {
  console.log("分页、过滤和排序变化:", pagination, filters, sorter);
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  paginationConfig.total = gangVehicleData.value.length;
};
</script>

<style lang="scss" scoped>
// 搜索和筛选区域样式
.search-filter-section {
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    align-items: center;
    gap: 16px;

    .filter-input-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .license-plate-input {
        flex: 0.4;

        :deep(.ant-input) {
          background: rgba(18, 28, 43, 0.8);
          color: #ffffff;
          font-size: 14px;

          &::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }
          &:hover {
            border-color: #208697;
          }
          &:focus {
            border-color: #208697;
          }
        }
        :deep(.anticon-close-circle) {
          color: #d9d9d9;
        }
        :deep(.ant-input-prefix) {
          color: rgba(255, 255, 255, 0.8);
        }
      }

      .plate-color-select,
      .time-range-select {
        flex: 0.3;

        :deep(.ant-select-selector) {
          background: rgba(0, 255, 255, 0.1) !important;
          border: 1px solid rgba(0, 255, 255, 0.3) !important;
          border-radius: 6px !important;
          color: #ffffff !important;
          font-size: 14px !important;
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
      gap: 12px;

      .query-btn {
        background: transparent;
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #02cfe4;
        font-size: 14px;
        height: 34px;
        padding: 0 24px;
        border-radius: 6px;
      }

      .export-btn {
        background: transparent;
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #02cfe4;
        font-size: 14px;
        height: 34px;
        padding: 0 24px;
        border-radius: 6px;
      }
    }
  }
}

// 团伙车辆查询表格样式
.gang-vehicle-table {
  height: 750px;
  overflow: auto;

  :deep(.gang-vehicle-table-content) {
    .ant-table-content {
      overflow: auto;
    }

    .ant-table {
      background: transparent;
      height: 650px;
      overflow-y: auto;

      .ant-table-thead > tr > th {
        background: rgba(0, 255, 255, 0.1);
        border-bottom: none;
        color: #fff;
        font-weight: 600;
        font-size: 14px;
        padding: 12px 16px;
      }

      .ant-table-tbody > tr > td {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        padding: 12px 16px;
        vertical-align: top;
      }

      .ant-table-tbody > tr:hover > td {
        background: rgba(0, 255, 255, 0.1);
      }
    }
  }

  :deep(.ant-table-cell)::before {
    display: none;
  }

  .detail-btn {
    color: #02d9ee;
    padding: 0;
    height: auto;
    font-size: 14px;
  }

  // 分页样式
  :deep(.ant-pagination) {
    margin-top: 16px;

    .ant-pagination-total-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    }

    .ant-pagination-item {
      background: rgba(18, 28, 43, 0.6);
      border: 1px solid rgba(0, 255, 255, 0.3);

      a {
        color: rgba(255, 255, 255, 0.8);
      }

      &:hover {
        border-color: #00ffff;

        a {
          color: #00ffff;
        }
      }

      &.ant-pagination-item-active {
        background: rgba(0, 255, 255, 0.2);
        border-color: #00ffff;

        a {
          color: #00ffff;
        }
      }
    }

    .ant-pagination-prev,
    .ant-pagination-next {
      background: rgba(18, 28, 43, 0.6);
      border: 1px solid rgba(0, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.8);

      &:hover {
        border-color: #00ffff;
        color: #00ffff;
      }
    }

    .anticon {
      color: #00ffff;
    }

    .ant-pagination-options {
      .ant-select {
        .ant-select-selector {
          background: rgba(18, 28, 43, 0.6);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.8);
        }

        &:hover .ant-select-selector {
          border-color: #00ffff;
        }
      }

      .ant-pagination-options-quick-jumper {
        color: rgba(255, 255, 255, 0.8);

        input {
          background: rgba(18, 28, 43, 0.6);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.8);

          &:focus {
            border-color: #00ffff;
            box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
          }
        }
      }
    }
  }
}

// 团伙车辆详情表格样式
.gang-detail-view {
  .detail-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);

    .back-btn {
      color: #00ffff;
      padding: 0;
      height: auto;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;

      &:hover {
        color: #ffffff;
      }
    }
  }

  .gang-detail-table {
    :deep(.ant-table) {
      background: transparent;
      color: #ffffff;
    }

    :deep(.ant-table-thead > tr > th) {
      background: rgba(0, 255, 255, 0.1);
      color: #ffffff;
      border: none;
      font-weight: 600;
      padding: 12px 8px;
      &::before {
        display: none;
      }
    }

    :deep(.ant-table-tbody > tr > td) {
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      border: none !important;
      padding: 12px 8px;
    }

    :deep(.ant-table-tbody > tr:hover > td) {
      background: rgba(0, 255, 255, 0.05);
    }

    .action-btn {
      color: #00ffff;
      padding: 0;
      height: auto;
      font-size: 12px;

      &:hover {
        color: #ffffff;
      }
    }
  }
}

// 查询弹窗样式
.search-modal-container {
  position: absolute;
  top: 0%;
  left: 0%;
  background: rgba(18, 28, 43, 0);
  width: 100%;
  height: 100%;
  .search-modal-content {
    margin: auto;
    margin-top: 10%;
    background: rgba(18, 28, 43, 0.9);
    width: 90%;
    height: 70%;
    padding: 20px;
  }
  .search-modal-content {
    background: rgba(18, 28, 43, 0.95);
    border-radius: 8px;
    padding: 24px;

    .query-table-container {
      background: rgba(18, 28, 43, 0.8);
      border-radius: 6px;
      height: 500px;
      overflow-y: auto;

      .table-header {
        display: flex;
        background: rgba(0, 255, 255, 0.1);
        border-bottom: 1px solid rgba(0, 255, 255, 0.2);

        .header-cell {
          flex: 1;
          padding: 12px 16px;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          border-right: 1px solid rgba(0, 255, 255, 0.1);

          &:last-child {
            border-right: none;
          }
        }
      }

      .input-row,
      .record-row {
        display: flex;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        &:hover {
          background: rgba(0, 255, 255, 0.05);
        }

        .cell {
          flex: 1;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          display: flex;
          align-items: center;
          border-right: 1px solid rgba(255, 255, 255, 0.05);

          &:last-child {
            border-right: none;
          }

          .time-picker,
          .vehicle-input,
          .time-input,
          .color-select {
            width: 100%;
            background: transparent;
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: rgba(255, 255, 255, 0.9);

            &:focus,
            &:hover {
              border-color: #00ffff;
              box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.1);
            }

            &::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
          }

          &.operation-cell {
            justify-content: space-between;
            align-items: center;
            justify-content: center;
            .status-text {
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
            }

            .action-buttons {
              display: flex;
              gap: 18px;

              .action-btn {
                color: #00ffff;
                .btn-icon {
                  font-size: 22px;
                }
              }
            }

            .detail-link {
              color: #02d9ee;
              padding: 0;
              height: auto;
              font-size: 14px;

              &:hover {
                color: #00ffff;
              }
            }
          }
        }
      }
    }

    .bottom-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;

      .query-btn {
        background: #00ffff;
        border-color: #00ffff;
        color: #000;
        font-weight: 600;
        padding: 8px 32px;
        height: 40px;
        border-radius: 6px;

        &:hover {
          background: #00e6e6;
          border-color: #00e6e6;
        }
      }

      .cancel-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: rgba(255, 255, 255, 0.8);
        padding: 8px 32px;
        height: 40px;
        border-radius: 6px;

        &:hover {
          border-color: #00ffff;
          color: #00ffff;
        }
      }
    }
  }
}
</style>
