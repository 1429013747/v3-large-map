<script setup>
import { CloseOutlined } from "@ant-design/icons-vue";
import { computed, ref } from "vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  mapMarkersConfig: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["update:open", "closed"]);

const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit("update:open", value);
  }
});

const searchVisible = ref(false);
const detailVisible = ref(false);
const detailData = ref({});
const trackIds = ref([]);

// 输入行数据
const inputRows = ref([
  {
    timeRange: null,
    vehicleName: "",
    plateColor: null
  },
  {
    timeRange: null,
    vehicleName: "",
    plateColor: null
  },
  {
    timeRange: null,
    vehicleName: "",
    plateColor: null
  }
]);

// 轨迹列表数据
const trackList = ref([
  {
    index: 1,
    subject: "浙A33390",
    timeRange: "2025/6/15 01:18-2025/6/15 01:18"
  },
  {
    index: 2,
    subject: "华盛2220",
    timeRange: "2025/6/15 01:18-2025/6/15 01:18"
  }
]);

// 轨迹查询表格列定义
const trackQueryColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 60,
    align: "center"
  },
  {
    title: "查询单",
    dataIndex: "queryName",
    key: "queryName",
    width: 200
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    width: 120
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 80,
    align: "center"
  },
  {
    title: "操作",
    key: "operation",
    width: 80,
    align: "center"
  }
];

// 轨迹查询数据
const trackQueryData = ref([
  {
    key: "1",
    index: 1,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    location: "桥镇",
    warning: "伪造信号预警!",
    createTime: "2025/6/15 1:18",
    status: "查询中"
  },
  {
    key: "2",
    index: 2,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    createTime: "2025/6/15 1:18",
    status: "已完成"
  },
  {
    key: "3",
    index: 3,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    createTime: "2025/6/15 1:18",
    status: "已完成"
  },
  {
    key: "4",
    index: 4,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    location: "涌泉镇",
    createTime: "2025/6/15 1:18",
    status: "已完成"
  },
  {
    key: "5",
    index: 5,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    createTime: "2025/6/15 1:18",
    status: "已完成"
  }
]);

// 分页配置
const paginationConfig = {
  current: 1,
  pageSize: 10,
  total: trackQueryData.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共${total}条`,
  pageSizeOptions: ["10", "20", "30", "50"],
  size: "small"
};

function handleClose() {
  emit("update:open", false);
  emit("closed");
}

function handleAddQuery() {
  console.log("添加查询单");
  searchVisible.value = true;
}

function handleViewDetail(record) {
  console.log("查看详情", record);
  // 这里可以打开详情弹窗或跳转到详情页面
  handleQuery();
}

function handleTableChange(pagination, filters, sorter) {
  console.log("分页、过滤和排序变化:", pagination, filters, sorter);
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  paginationConfig.total = trackQueryData.value.length;
}

// 添加输入行
function addInputRow() {
  inputRows.value.push({
    timeRange: null,
    vehicleName: "",
    plateColor: null
  });
}

// 删除输入行
function removeInputRow(index) {
  if (inputRows.value.length > 1) {
    inputRows.value.splice(index, 1);
  }
}

function handleDetailOk() {
  detailVisible.value = false;
}

// 播放全部
function handlePlayAll() {
  console.log("播放全部轨迹");
  // 这里可以添加播放全部轨迹的逻辑
}

// 显示与隐藏轨迹
function handleViewTrack(item) {
  console.log("查看轨迹详情", item);

  trackIds.value.forEach((trackId) => {
    props.mapMarkersConfig.toggleTrackRoute(trackId);
  });
}

// 播放单个轨迹
async function handlePlayTrack(item) {
  console.log("播放轨迹", item);
  // 这里可以添加播放单个轨迹的逻辑
  if (trackIds.value.length > 0) {
    trackIds.value.forEach(async (trackId) => {
      await props.mapMarkersConfig.removeTrackRoute(trackId);
    });
  }
  const pos = [
    {
      latLon: [122.3578, 29.2329],
      text: "2025.06.15 01:18"
    },
    {
      latLon: [122.4846, 29.179],
      text: "2025.06.15 01:18",
      tips: "伪造信号!"
    },
    {
      latLon: [122.4204, 29.106],
      text: "2025.06.15 01:18"
    },
    {
      latLon: [122.2666, 29.0695],
      text: "2025.06.15 01:18"
    }
  ];

  // 生成轨迹路线
  const trackFeature = await props.mapMarkersConfig.generateTrackRoute(pos, {
    showStart: true,
    showEnd: true,
    showMidpoint: false,
    showTips: true,
    animation: true,
    animationDuration: 600,
    style: {
      stroke: "#d65e37",
      strokeWidth: 3,
      lineDash: [],
      lineCap: "round",
      lineJoin: "round"
    }
  });
  trackIds.value.push(trackFeature.get("trackId"));
}

// 查询按钮
function handleQuery() {
  console.log("执行查询", inputRows.value);
  searchVisible.value = false;
  visibleModal.value = false;
  // 这里可以添加查询逻辑
  detailVisible.value = true;
}

// 取消按钮
function handleCancel() {
  searchVisible.value = false;
  // 重置输入数据
  inputRows.value = [
    {
      timeRange: null,
      vehicleName: "",
      plateColor: null
    },
    {
      timeRange: null,
      vehicleName: "",
      plateColor: null
    },
    {
      timeRange: null,
      vehicleName: "",
      plateColor: null
    }
  ];
}
</script>

<template>
  <a-drawer
    v-model:open="visibleModal" title="轨迹查询" placement="right" get-container=".ui-container" :width="1080"
    :closable="true" :mask="false" root-class-name="layer-box" class="layer-control-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>

    <!-- 添加查询按钮 -->
    <div class="add-query-section">
      <a-button type="primary" class="add-query-btn" @click="handleAddQuery">
        添加查询单
      </a-button>
    </div>

    <!-- 轨迹查询列表 -->
    <div class="track-query-table">
      <a-table
        :columns="trackQueryColumns" :data-source="trackQueryData" :pagination="paginationConfig" size="small"
        class="track-query-table-content" :on-change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operation'">
            <a-button type="link" size="small" class="detail-btn" @click="handleViewDetail(record)">
              查看详情
            </a-button>
          </template>
        </template>
      </a-table>
    </div>
    <!-- 添加查询单弹窗 -->
    <div v-if="searchVisible" title="轨迹查询" class="search-modal-container">
      <div class="search-modal-content">
        <!-- 查询表格 -->
        <div class="query-table-container">
          <!-- 表格头部 -->
          <div class="table-header">
            <div class="header-cell">
              时间范围
            </div>
            <div class="header-cell">
              车牌号/船舶名称
            </div>
            <div class="header-cell">
              车牌颜色
            </div>
            <div class="header-cell">
              操作
            </div>
          </div>

          <!-- 输入行 1-4 -->
          <div v-for="(item, index) in inputRows" :key="`input-${index}`" class="input-row">
            <div class="cell">
              <a-date-picker
                v-model:value="item.timeRange" placeholder="选择时间范围" class="time-picker"
                :bordered="false"
              />
            </div>
            <div class="cell">
              <a-input
                v-model:value="item.vehicleName" placeholder="请输入车牌号或船舶名称" class="vehicle-input"
                :bordered="false"
              />
            </div>
            <div class="cell">
              <a-select v-model:value="item.plateColor" placeholder="车牌颜色" class="color-select" :bordered="false">
                <a-select-option value="蓝色">
                  蓝色
                </a-select-option>
                <a-select-option value="黄色">
                  黄色
                </a-select-option>
                <a-select-option value="绿色">
                  绿色
                </a-select-option>
                <a-select-option value="白色">
                  白色
                </a-select-option>
              </a-select>
            </div>
            <div class="cell operation-cell">
              <div class="action-buttons">
                <a-button type="text" size="small" class="action-btn minus-btn" @click="removeInputRow(index)">
                  <span class="btn-icon">⊖</span>
                </a-button>
                <a-button type="text" size="small" class="action-btn plus-btn" @click="addInputRow">
                  <span class="btn-icon">⊕</span>
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="bottom-buttons">
          <a-button type="primary" class="query-btn" @click="handleQuery">
            查询
          </a-button>
          <a-button class="cancel-btn" @click="handleCancel">
            取消
          </a-button>
        </div>
      </div>
    </div>
  </a-drawer>
  <a-modal
    v-model:open="detailVisible" title="轨迹列表" class="modal-container _track-list-modal" :footer="false"
    :mask="false" get-container=".ui-container" :width="800" @ok="handleDetailOk"
  >
    <div class="track-list-content">
      <!-- 播放全部按钮 -->
      <div class="play-all-section">
        <a-button type="text" class="play-all-btn" @click="handlePlayAll">
          <span class="play-icon">▶</span>
          播放全部
        </a-button>
      </div>

      <!-- 轨迹列表表格 -->
      <div class="track-list-container">
        <!-- 表格头部 -->
        <div class="table-header">
          <div class="header-cell">
            序号
          </div>
          <div class="header-cell">
            主体
          </div>
          <div class="header-cell">
            查询时间范围
          </div>
          <div class="header-cell">
            操作
          </div>
        </div>

        <!-- 轨迹数据行 -->
        <div v-for="(item, index) in trackList" :key="`track-${index}`" class="track-row">
          <div class="cell">
            {{ item.index }}
          </div>
          <div class="cell">
            {{ item.subject }}
          </div>
          <div class="cell">
            {{ item.timeRange }}
          </div>
          <div class="cell operation-cell">
            <div class="action-buttons">
              <a-button type="text" size="small" class="action-btn view-btn" @click="handleViewTrack(item)">
                <span class="btn-icon">👁</span>
              </a-button>
              <a-button type="text" size="small" class="action-btn play-btn" @click="handlePlayTrack(item)">
                <span class="btn-icon" style="padding-left: 2px">▶</span>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.layer-control-drawer {
  position: relative;
}

.add-query-section {
  margin-bottom: 20px;

  .add-query-btn {
    background: transparent;
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: #02cfe4;
    font-size: 14px;
    height: 36px;
    padding: 0 24px;
    border-radius: 6px;
  }
}

// 轨迹查询表格样式
.track-query-table {
  height: 750px;
  overflow: auto;

  :deep(.track-query-table-content) {
    .ant-table-content {
      overflow: auto;
    }

    .ant-table {
      background: transparent;
      height: 650px;
      overflow-y: auto;

      .ant-table-thead>tr>th {
        background: rgba(0, 255, 255, 0.1);
        border-bottom: none;
        color: #fff;
        font-weight: 600;
        font-size: 14px;
        padding: 12px 16px;
      }

      .ant-table-tbody>tr>td {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        padding: 12px 16px;
        vertical-align: top;
      }

      .ant-table-tbody>tr:hover>td {
        background: rgba(0, 255, 255, 0.1);
      }
    }
  }

  :deep(.ant-table-cell)::before {
    display: none;
  }

  .query-name-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .query-text {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      line-height: 1.4;
    }
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

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
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

// 轨迹列表模态框样式
.track-list-content {
  .play-all-section {
    margin-bottom: 20px;

    .play-all-btn {
      color: #00ffff;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      height: auto;

      .play-icon {
        margin-right: 8px;
        font-size: 12px;
      }

      &:hover {
        color: #00e6e6;
      }
    }
  }

  .track-list-container {
    border-radius: 6px;
    overflow: hidden;

    .table-header {
      display: flex;
      background: rgba(0, 255, 255, 0.1);

      .header-cell {
        flex: 1;
        padding: 12px 16px;
        color: #fff;
        font-weight: 600;
        font-size: 14px;
        text-align: center;

        &:last-child {
          border-right: none;
        }

        &:first-child {
          flex: 0.3;
        }

        &:nth-child(2) {
          flex: 0.3;
        }

        &:nth-child(4) {
          flex: 0.4;
        }
      }
    }

    .track-row {
      display: flex;

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
        justify-content: center;

        &:last-child {
          border-right: none;
        }

        &:first-child {
          flex: 0.3;
        }

        &:nth-child(2) {
          flex: 0.3;
        }

        &:nth-child(4) {
          flex: 0.4;
        }

        &.operation-cell {
          justify-content: center;

          .action-buttons {
            display: flex;
            gap: 12px;

            .action-btn {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: rgba(0, 255, 255, 0.1);
              border: 1px solid rgba(0, 255, 255, 0.3);
              color: #00ffff;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;

              .btn-icon {
                font-size: 12px;
              }

              &:hover {
                background: rgba(0, 255, 255, 0.2);
                border-color: #00ffff;
              }
            }
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
._track-list-modal {
  margin: 0;
}

.ant-modal-wrap {
  pointer-events: none;
  z-index: 9999;
}
</style>
