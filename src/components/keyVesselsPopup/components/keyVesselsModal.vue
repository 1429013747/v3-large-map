<template>
  <div class="vehicle-detail-modal-container">
    <a-modal
      :open="visible"
      title="重点船舶"
      :width="1200"
      :centered="true"
      :mask-closable="false"
      getContainer=".vehicle-detail-modal-container"
      @cancel="handleCancel"
      :footer="null"
    >
      <template #closeIcon>
        <CloseOutlined style="color: #ffffff; font-size: 16px" />
      </template>

      <div class="vehicle-detail-content">
        <div class="basic-info-title">基本信息</div>
        <!-- 基本信息区域 -->
        <div class="basic-info-section">
          <div class="vehicle-header">
            <div class="vehicle-id">
              <span class="vehicle-number">{{ vesselData.vesselName }}</span>
              <a-button
                type="primary"
                size="small"
                class="set-key-btn"
                @click="handleSetKeyVessel"
              >
                设置重点船舶
              </a-button>
            </div>
          </div>

          <div class="vehicle-info-row">
            <div class="vehicle-image">
              <img :src="vesselData.image" :alt="vesselData.vesselName" />
            </div>

            <div class="vehicle-details">
              <div class="detail-item">
                <span class="label">ID号:</span>
                <span class="value">{{ vesselData.id }}</span>
              </div>
              <div class="detail-item">
                <span class="label">英文船名:</span>
                <span class="value">{{ vesselData.englishVesselName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">呼号:</span>
                <span class="value">{{ vesselData.callSign }}</span>
              </div>
              <div class="detail-item">
                <span class="label">经度:</span>
                <span class="value">{{ vesselData.coordinates[0] }}</span>
              </div>
              <div class="detail-item">
                <span class="label">航向:</span>
                <span class="value">{{ vesselData.heading }}</span>
              </div>
              <div class="detail-item">
                <span class="label">船长（米）:</span>
                <span class="value">{{ vesselData.length }}</span>
              </div>
              <div class="detail-item">
                <span class="label">目的地:</span>
                <span class="value">{{ vesselData.destination }}</span>
              </div>
              <div class="detail-item">
                <span class="label">信号来源:</span>
                <span class="value">{{ vesselData.signalSource }}</span>
              </div>
            </div>

            <div class="status-info">
              <div class="status-details">
                <div class="status-item">
                  <span class="label">MMSI:</span>
                  <span class="value">
                    {{ vesselData.mmsi }}
                  </span>
                </div>
                <div class="status-item">
                  <span class="label">船舶类型:</span>
                  <span class="value">{{ vesselData.vesselType }}</span>
                </div>
                <div class="status-item">
                  <span class="label">IMO:</span>
                  <span class="value">{{ vesselData.imo }}</span>
                </div>
                <div class="status-item">
                  <span class="label">纬度:</span>
                  <span class="value">{{ vesselData.coordinates[1] }}</span>
                </div>
                <div class="status-item">
                  <span class="label">速率:</span>
                  <span class="value">{{ vesselData.speed }}</span>
                </div>
                <div class="status-item">
                  <span class="label">船宽(米):</span>
                  <span class="value">{{ vesselData.width }}</span>
                </div>
                <div class="status-item">
                  <span class="label">预计到达时间:</span>
                  <span class="value">{{
                    vesselData.predictedArrivalTime
                  }}</span>
                </div>
              </div>
            </div>
            <div class="status-info">
              <div class="status-details">
                <div class="status-item">
                  <span class="label">中文船名:</span>
                  <span class="value">
                    {{ vesselData.vesselName }}
                  </span>
                </div>
                <div class="status-item">
                  <span class="label">航行状态:</span>
                  <span class="value">{{ vesselData.status }}</span>
                </div>
                <div class="status-item">
                  <span class="label">航船国籍:</span>
                  <span class="value">{{ vesselData.nationality }}</span>
                </div>
                <div class="status-item">
                  <span class="label">船首向:</span>
                  <span class="value">{{ vesselData.bowDirection }}</span>
                </div>
                <div class="status-item">
                  <span class="label">旋转角速度:</span>
                  <span class="value">{{ vesselData.rotationAngleSpeed }}</span>
                </div>
                <div class="status-item">
                  <span class="label">吃水深度（米）:</span>
                  <span class="value">{{ vesselData.draft }}</span>
                </div>
                <div class="status-item">
                  <span class="label">数据更新时间:</span>
                  <span class="value">{{ vesselData.lastUpdate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签页区域 -->
        <div class="tabs-section">
          <a-tabs v-model:activeKey="activeTab" class="detail-tabs">
            <a-tab-pane key="alerts" tab="船只档案">
              <div class="tab-content">
                <!-- 预警子区域 -->
                <a-collapse
                  v-model:activeKey="alertCollapseActive"
                  class="alert-collapse"
                >
                  <a-collapse-panel
                    key="1"
                    header="船只档案"
                    class="alert-panel"
                  >
                    <!-- <template #extra>
                      <span class="alert-count">本月4次</span>
                    </template> -->
                    <div></div>
                  </a-collapse-panel>
                </a-collapse>
              </div>
            </a-tab-pane>

            <a-tab-pane key="gang" tab="团伙车辆分析">
              <div class="tab-content">
                <!-- 团伙车辆列表 -->
                <div v-if="!showGangDetail" class="gang-list-view">
                  <a-table
                    :columns="gangTableColumns"
                    :data-source="gangTableData"
                    :pagination="false"
                    :scroll="{ y: 300 }"
                    class="gang-analysis-table"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'status'">
                        <span class="status-tag">{{ record.status }}</span>
                      </template>
                      <template v-if="column.key === 'action'">
                        <a-button
                          type="link"
                          size="small"
                          class="action-btn"
                          @click="handleViewGangDetail(record)"
                        >
                          查看详情
                        </a-button>
                      </template>
                    </template>
                  </a-table>
                </div>

                <!-- 团伙车辆详情表格 -->
                <div v-if="showGangDetail" class="gang-detail-view">
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
                    :scroll="{ y: 300 }"
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
            </a-tab-pane>

            <a-tab-pane key="elements" tab="关键要素分析">
              <div class="tab-content">
                <div class="key-elements-container">
                  <!-- 左侧要素列表 -->
                  <div class="elements-list">
                    <a-table
                      :columns="elementsTableColumns"
                      :data-source="elementsTableData"
                      :pagination="false"
                      :scroll="{ y: 340 }"
                      class="elements-table"
                      size="small"
                    >
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'element'">
                          <div class="element-type">
                            {{ record.element }}
                          </div>
                        </template>
                        <template v-if="column.key === 'action'">
                          <a-button
                            type="link"
                            size="small"
                            class="action-btn"
                            @click="handleViewElementDetail(record)"
                          >
                            查看详情
                          </a-button>
                        </template>
                      </template>
                    </a-table>
                  </div>

                  <!-- 右侧关系网络图 -->
                  <div class="relationship-diagram">
                    <vue3-tree-org
                      :data="treeData"
                      center
                      :toolBar="false"
                      :draggable="false"
                      :horizontal="false"
                      :collapsable="false"
                      :only-one-node="false"
                      :node-draggable="false"
                      :scalable="false"
                    >
                      <template #default="{ node }">
                        <div class="custom-node" :class="getNodeClass(node)">
                          <div class="node-icon">{{ getNodeIcon(node) }}</div>
                          <div class="node-text">{{ node.label }}</div>
                        </div>
                      </template>
                    </vue3-tree-org>
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { message } from "ant-design-vue";
import {
  CloseOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons-vue";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  vesselData: {},
});

// Emits
const emit = defineEmits(["update:visible", "setKeyVessel"]);

// 响应式数据
const activeTab = ref("alerts");
const alertCollapseActive = ref(["1"]);
const caseCollapseActive = ref(["1"]);
const showGangDetail = ref(false);

// 团伙车辆分析表格列配置
const gangTableColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 80,
    align: "center",
  },
  {
    title: "查询单",
    dataIndex: "queryOrder",
    key: "queryOrder",
    ellipsis: true,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    width: 150,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 100,
    align: "center",
  },
  {
    title: "操作",
    key: "action",
    width: 100,
    align: "center",
  },
];

// 团伙车辆分析表格数据
const gangTableData = ref([
  {
    key: "1",
    index: 1,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "查询中",
  },
  {
    key: "2",
    index: 2,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "3",
    index: 3,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "4",
    index: 4,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "5",
    index: 5,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "6",
    index: 6,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "7",
    index: 7,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "8",
    index: 8,
    queryOrder: "浙123456团伙车辆的查询单",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
]);

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

// 关键要素分析表格列配置
const elementsTableColumns = [
  {
    title: "要素",
    dataIndex: "element",
    key: "element",
    width: 100,
  },
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "操作",
    key: "action",
    width: 100,
    align: "center",
  },
];

// 关键要素分析表格数据
const elementsTableData = ref([
  {
    key: "1",
    element: "车辆",
    name: "浙J89900",
  },
  {
    key: "2",
    element: "车辆",
    name: "浙J33900",
  },
  {
    key: "3",
    element: "人员",
    name: "王某某",
  },
  {
    key: "4",
    element: "人员",
    name: "王某某",
  },
  {
    key: "5",
    element: "车辆",
    name: "浙J89966",
  },
  {
    key: "6",
    element: "船舶",
    name: "华盛778",
  },
  {
    key: "7",
    element: "船舶",
    name: "华盛009",
  },
]);

// 树形组织图数据
const treeData = ref({
  id: 1,
  label: "浙J89900",
  type: "vehicle",
  children: [
    {
      id: 2,
      pid: 1,
      label: "浙J89900",
      type: "vehicle",
      children: [],
    },
    {
      id: 2,
      pid: 1,
      label: "白岩码头走私冻品案件",
      type: "case",
      children: [],
    },
    {
      id: 2,
      pid: 1,
      label: "马某某",
      children: [
        {
          id: 2,
          pid: 1,
          label: "浙J83900",
          type: "vehicle",
          children: [],
        },
      ],
    },
    {
      id: 2,
      pid: 1,
      label: "王某某",
      type: "person",
      children: [
        {
          id: 2,
          pid: 1,
          label: "浙J82900",
          type: "vehicle",
          children: [],
        },
      ],
    },
  ],
});

// 获取节点图标
const getNodeIcon = (node) => {
  switch (node.$$data.type) {
    case "vehicle":
      return "🚛";
    case "person":
      return "👤";
    case "case":
      return "📄";
    default:
      return "📄";
  }
};

// 获取节点样式类
const getNodeClass = (node) => {
  const classes = [`${node.type}-node`];
  if (node.isRed) {
    classes.push("red");
  }
  return classes.join(" ");
};

// 节点点击事件
const handleNodeClick = (node) => {
  console.log("点击节点:", node);
  message.info(`点击了${node.label}`);
};

// 监听 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // 重置标签页状态
      activeTab.value = "alerts";
      alertCollapseActive.value = ["1"];
      caseCollapseActive.value = ["1"];
    }
  }
);

// 关闭弹窗
const handleCancel = () => {
  emit("update:visible", false);
};

// 设置重点船舶
const handleSetKeyVessel = () => {
  emit("setKeyVessel", props.vesselData);
};

// 查看团伙车辆详情
const handleViewGangDetail = (record) => {
  console.log("查看团伙船舶详情:", record);
  showGangDetail.value = true;
};

// 返回团伙船舶列表
const handleBackToGangList = () => {
  showGangDetail.value = false;
};

// 查看轨迹
const handleViewTrajectory = (record) => {
  console.log("查看轨迹:", record);
};

// 查看要素详情
const handleViewElementDetail = (record) => {
  console.log("查看要素详情:", record);
  message.info(`查看${record.element} ${record.name} 的详情`);
};
</script>

<style lang="scss" scoped>
.vehicle-detail-modal-container {
  :deep(.ant-modal-content) {
    background: rgba(18, 28, 43, 0.95);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    padding: 0px;
  }

  :deep(.ant-modal-header) {
    padding: 10px;
    background: transparent;
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);

    .ant-modal-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
    }
  }

  :deep(.ant-modal-body) {
    padding: 20px;
    background: transparent;
  }

  .basic-info-title {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 10px;
  }
  :deep(.ant-table-cell):before {
    display: none;
  }
  :deep(.ant-table-cell-scrollbar) {
    box-shadow: none;
  }
}

.vehicle-detail-content {
  color: #ffffff;

  .basic-info-section {
    margin-bottom: 20px;

    .vehicle-header {
      margin-bottom: 20px;

      .vehicle-id {
        display: flex;
        align-items: center;
        gap: 12px;

        .vehicle-number {
          font-size: 16px;
        }

        .set-key-btn {
          background: transparent;
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 4px;
          height: 28px;
          font-size: 14px;
          padding: 0 12px;
          color: #ffffff;

          &:hover {
            background: transparent;
            border-color: rgba(0, 255, 255, 0.5);
            color: #00ffff;
          }
        }
      }
    }

    .vehicle-info-row {
      display: flex;
      gap: 20px;
      align-items: flex-start;

      .vehicle-image {
        width: 280px;
        height: 230px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .vehicle-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .label {
            color: rgba(255, 255, 255, 0.7);
          }

          .value {
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }

      .status-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .status-item {
            display: flex;
            align-items: center;
            gap: 8px;

            .label {
              color: rgba(255, 255, 255, 0.7);
            }

            .value {
              color: rgba(255, 255, 255, 0.7);
            }
          }
        }
      }
    }
  }
  :deep(.ant-tabs .ant-tabs-ink-bar) {
    background: #00ffff;
  }
  .tabs-section {
    padding: 10px 20px;
    background: rgba(38, 50, 69, 0.6);
    border-radius: 8px;
    height: 490px;
    overflow-y: auto;

    .detail-tabs {
      :deep(.ant-tabs-nav) {
        margin-bottom: 16px;

        .ant-tabs-tab {
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid transparent;

          &.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }

      :deep(.ant-tabs-content-holder) {
        background: transparent;
      }

      .tab-content {
        min-height: 200px;
      }
    }
    :deep(.ant-collapse) {
      background: transparent;
      border: none;
    }
    .alert-collapse,
    .case-collapse {
      :deep(.ant-collapse-item) {
        background: transparent;
        border: none;
        margin-bottom: 8px;
        width: 32%;
      }

      :deep(.ant-collapse-header) {
        background: transparent;
        color: #ffffff;
        border: none;
        padding: 12px 16px;
      }

      :deep(.ant-collapse-content) {
        background: transparent;
        border: none;
      }

      :deep(.ant-collapse-content-box) {
        padding: 0 16px 16px;
      }

      .alert-count,
      .case-count {
        color: #00ffff;
        font-size: 12px;
        background: rgba(0, 255, 255, 0.1);
        padding: 2px 8px;
        border-radius: 10px;
      }

      .alert-list,
      .case-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .alert-item,
        .case-item {
          background: transparent;
          padding: 2px 0px;

          .alert-item-content,
          .case-item-content {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .alert-item-text,
            .case-item-text {
              color: #ffffff;
              font-size: 13px;
            }

            .alert-item-date,
            .case-item-date {
              color: rgba(255, 255, 255, 0.6);
              font-size: 12px;
            }
          }
        }
      }
    }

    .empty-content {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      padding: 40px 0;
      font-size: 14px;
    }

    .gang-analysis-table {
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
      }

      :deep(.ant-table-tbody > tr > td) {
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
        border: none;
        padding: 12px 8px;
      }

      :deep(.ant-table-tbody > tr:hover > td) {
        background: rgba(0, 255, 255, 0.05);
      }

      .status-tag {
        border: none;
        border-radius: 4px;
        font-size: 12px;
        padding: 2px 8px;
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
        }

        :deep(.ant-table-tbody > tr > td) {
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border: none;
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

    .key-elements-container {
      display: flex;
      gap: 20px;
      height: 100%;

      .elements-list {
        flex: 0 0 500px;
        display: flex;
        flex-direction: column;

        .elements-table {
          flex: 1;
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
          }

          :deep(.ant-table-tbody > tr > td) {
            background: transparent;
            color: rgba(255, 255, 255, 0.8);
            border: none;
            padding: 12px 8px;
          }

          :deep(.ant-table-tbody > tr:hover > td) {
            background: rgba(0, 255, 255, 0.05);
          }

          .element-type {
            display: flex;
            align-items: center;
            gap: 8px;

            .vehicle-icon,
            .person-icon,
            .ship-icon,
            .case-icon {
              font-size: 16px;
            }
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

        .filter-options {
          display: flex;
          gap: 16px;
          padding: 8px 0;
          border-top: 1px solid rgba(0, 255, 255, 0.2);

          .filter-item {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.3s;

            &:hover {
              color: #00ffff;
              background: rgba(0, 255, 255, 0.1);
            }
          }
        }
      }

      .relationship-diagram {
        flex: 1;
        .zm-tree-org {
          background: transparent;
          .zoom-container {
            background: transparent !important;
          }
        }
        .custom-node {
          display: flex;
          align-items: center;
          flex-direction: column;
          padding: 10px;
          color: #bcbcbc;
          .node-icon {
            font-size: 30px;
          }
          .node-text {
            font-size: 13px;
            width: 70px;
          }
        }
      }
    }
  }
}
</style>
