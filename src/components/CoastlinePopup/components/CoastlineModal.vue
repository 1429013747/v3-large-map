<template>
  <div class="vehicle-detail-modal-container">
    <a-modal
      :open="open"
      title="岸线管控"
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
              <span class="vehicle-number">{{ coastline.title }}</span>
              <div
                v-if="coastline.riskStatus"
                :class="getRiskStatus(coastline.riskStatus).class"
              >
                {{ getRiskStatus(coastline.riskStatus).text }}
              </div>
            </div>
          </div>

          <div class="vehicle-info-row">
            <div class="vehicle-image">
              <img :src="coastline.image" :alt="coastline.title" />
            </div>

            <div class="vehicle-details">
              <div class="detail-item">
                <span class="label">单位责任人:</span>
                <span class="value">{{ coastline.deptName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">责任人:</span>
                <span class="value">{{ coastline.name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">位置:</span>
                <span class="value">{{ coastline.locate }}</span>
              </div>
              <div class="detail-item">
                <span class="label">经纬度:</span>
                <span class="value">{{ coastline.coordinates }}</span>
              </div>
              <div class="detail-item">
                <span class="label more-d" @click="onMoreDetail">更多详情</span>
              </div>
            </div>
            <div class="status-info">
              <div class="status-details">
                <div class="status-item">
                  <span class="label">类型:</span>
                  <span class="value">{{ coastline.type }}</span>
                </div>
                <div class="status-item">
                  <span class="label">周边环境:</span>
                  <span class="value">{{ coastline.environment }}</span>
                </div>
                <div class="status-item">
                  <span class="label">驳船条件:</span>
                  <span class="value">{{ coastline.bargeConditions }}</span>
                </div>
                <div class="status-item">
                  <span class="label">交通条件:</span>
                  <span class="value">{{ coastline.trafficConditions }}</span>
                </div>
                <div class="status-item">
                  <span class="label">作业条件:</span>
                  <span class="value">{{ coastline.workingConditions }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签页区域 -->
        <div class="tabs-section">
          <a-tabs v-model:activeKey="activeTab" class="detail-tabs">
            <a-tab-pane key="device" tab="物联设备感知">
              <div class="device-perception-content">
                <div class="device-list">
                  <div
                    v-for="device in deviceList"
                    :key="device.id"
                    class="device-item"
                  >
                    <div class="device-info">
                      <div class="device-icon">
                        <div class="status-icon">
                          <span
                            v-if="device.status === 'online'"
                            class="wifi-icon"
                            >📶</span
                          >
                          <span
                            v-else-if="device.status === 'offline'"
                            class="wifi-off-icon"
                            >📶</span
                          >
                          <span
                            v-else-if="device.status === 'warning'"
                            class="warning-icon"
                            >⚠️</span
                          >
                        </div>
                        <div class="device-title">{{ device.name }}</div>
                      </div>
                      <div class="device-action">
                        <a-button
                          type="primary"
                          ghost
                          size="small"
                          class="action-button"
                          @click="handleDeviceAction(device)"
                        >
                          {{ device.actionText }}
                        </a-button>
                      </div>
                    </div>
                    <div class="device-tip">
                      <div class="device-type">{{ device.type }}</div>
                      <div class="device-location">
                        位置:{{ device.location }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="elements" tab="要素关联分析">
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
import { CloseOutlined } from "@ant-design/icons-vue";

const router = useRouter();

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  coastline: {},
});

// Emits
const emit = defineEmits(["update:open"]);

// 响应式数据
const activeTab = ref("device");

// 设备列表数据
const deviceList = ref([
  {
    id: 1,
    name: "0838_白岩码头_雷达",
    type: "雷达",
    location: "白岩码头",
    status: "online",
    actionText: "远程控制",
  },
  {
    id: 2,
    name: "0838_白岩码头_雷达",
    type: "雷达",
    location: "白岩码头",
    status: "offline",
    actionText: "实时视频预览",
  },
  {
    id: 3,
    name: "0838_白岩码头(热成像)",
    type: "热成像",
    location: "白岩码头",
    status: "warning",
    actionText: "远程控制",
  },
]);

// 要素分析表格列配置
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

// 要素分析表格数据
const elementsTableData = ref([
  {
    key: "1",
    element: "船舶",
    name: "浙J89900",
  },
  {
    key: "2",
    element: "船舶",
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
    element: "船舶",
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
  type: "vessel",
  children: [
    {
      id: 2,
      pid: 1,
      label: "浙J89900",
      type: "vessel",
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
      type: "person",
      children: [
        {
          id: 2,
          pid: 1,
          label: "浙J83900",
          type: "vessel",
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
          type: "vessel",
          children: [],
        },
      ],
    },
  ],
});

// 获取节点图标
const getNodeIcon = (node) => {
  switch (node.$$data.type) {
    case "vessel":
      return "🛥️";
    case "person":
      return "👤";
    case "case":
      return "📄";
    default:
      return "📄";
  }
};
const getRiskStatus = (type) => {
  return type == 1
    ? {
        class: "key-badge1",
        text: "低风险",
      }
    : type == 2
    ? {
        class: "key-badge2",
        text: "中风险",
      }
    : {
        class: "key-badge3",
        text: "高风险",
      };
};
// 获取节点样式类
const getNodeClass = (node) => {
  const classes = [`${node.type}-node`];
  if (node.isRed) {
    classes.push("red");
  }
  return classes.join(" ");
};

// 监听 visible 变化
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      // 重置标签页状态
      activeTab.value = "device";
    }
  }
);
//查看更多详情
const onMoreDetail = () => {
  router.push("/coast-line");
};
// 关闭弹窗
const handleCancel = () => {
  emit("update:open", false);
};

// 查看要素详情
const handleViewElementDetail = (record) => {
  console.log("查看要素详情:", record);
  message.info(`查看${record.element} ${record.name} 的详情`);
};

// 处理设备操作
const handleDeviceAction = (device) => {
  console.log("设备操作:", device);
  message.info(`执行${device.actionText}操作`);
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

        .key-badge1 {
          background: #006e69;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
        }
        .key-badge2 {
          background: #ffa502;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
        }
        .key-badge3 {
          background: #b4261e;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }

    .vehicle-info-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;

      .vehicle-image {
        width: 280px;
        height: 160px;

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
          .more-d {
            color: #0c7bc5;
            font-size: 14px;
            cursor: pointer;
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
              width: 155px;
              display: inline-block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
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
      .boat-file-container {
        width: 100%;
        display: flex;
        justify-content: space-between;
        color: #ffffff;
        font-size: 15px;
        div {
          display: flex;
          flex-direction: column;
          gap: 8px;
          p {
            margin-bottom: 0;
            display: flex;
            align-items: center;
            .label {
              color: #ffffff;
              width: 166px;
              display: inline-block;
              text-align: right;
            }
            .value-item {
              width: 240px;
              display: inline-block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
      :deep(.ant-collapse-item) {
        background: transparent;
        border: none;
        margin-bottom: 8px;
        width: 82%;
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
              font-size: 15px;
            }

            .alert-item-date,
            .case-item-date {
              color: rgba(255, 255, 255, 0.6);
              font-size: 15px;
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
        font-size: 14px;

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
          font-size: 14px;

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
        font-size: 14px;

        &:hover {
          color: #ffffff;
        }
      }
    }
    .tab-content2 {
      color: #ffffff;
      p {
        display: flex;
        align-items: center;
        font-size: 18px;
        .icon {
          font-size: 10px;
          color: #00ffff;
          margin-right: 6px;
        }
      }
      .voyage-content {
        display: flex;
        align-items: center;
        gap: 50px;
        padding: 0 50px;
        .voyage-line {
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 10px;
          margin-top: -100px;
          .voyage-status {
            font-size: 16px;
          }
          .voyage-line-item {
            width: 200px;
            height: 2px;
            background: #ffffff;
            position: relative;
          }
          // 短线前箭头
          .voyage-line-item::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 11px;
            height: 2px;
            background: #ffffff;
            transform: rotate(45deg);
            transform-origin: bottom right;
          }
          // 箭头
          .voyage-line-item::before {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 10px;
            height: 2px;
            background: #ffffff;
            transform: rotate(-45deg);
            transform-origin: bottom right;
          }
        }
        .voyage-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          .voyage-item-date {
            font-size: 15px;
          }
        }
        .voyage-info {
          margin-left: 60px;
          display: flex;
          flex-direction: column;
          margin-top: -20px;
          gap: 6px;
          P {
            font-size: 15px;
            margin-bottom: 0;
          }
        }
      }
    }
  }

  // 港口查询界面样式
  .voyage-query {
    .port-query-container {
      .query-controls {
        display: flex;
        align-items: center;
        padding: 16px;

        .time-input-section {
          display: flex;
          align-items: center;
          gap: 12px;

          .time-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            font-weight: 500;
          }

          .time-range-picker {
            width: 300px;
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
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-left: 20px;
          .query-btn2 {
            background: #263746;
            border-color: #026767;
            color: rgba(255, 255, 255, 0.8);
            border-radius: 0px;

            &:hover {
              border-color: #00ffff;
            }
          }

          .reset-btn {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: rgba(255, 255, 255, 0.8);

            border-radius: 0px;
            &:hover {
              border-color: #00ffff;
            }
          }

          .export-btn {
            background: #263746;
            border-color: #026767;
            color: rgba(255, 255, 255, 0.8);
            border-radius: 0px;
            display: flex;
            align-items: center;
            gap: 6px;

            &:hover {
              border-color: #00e6e6;
            }
          }
        }
      }
    }
  }
  .port-table-container {
    border-radius: 6px;
    overflow: hidden;

    .table-header {
      display: flex;
      background: rgba(0, 255, 255, 0.1);

      .header-cell {
        flex: 1;
        padding: 12px 8px;
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
      }
    }

    .table-body {
      .data-row {
        display: flex;

        &:hover {
          background: rgba(0, 255, 255, 0.05);
        }

        &:last-child {
          border-bottom: none;
        }

        .cell {
          flex: 1;
          padding: 12px 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:last-child {
            border-right: none;
          }

          &:first-child {
            flex: 0.3;
          }
        }
      }
    }
  }

  // 物联设备感知界面样式
  .device-perception-content {
    .device-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;

      .device-item {
        padding: 16px;
        background: rgba(38, 50, 69, 0.6);
        border: 1px solid rgba(0, 255, 255, 0.1);
        transition: all 0.3s ease;
        width: 40%;

        &:hover {
          background: rgba(38, 50, 69, 0.8);
          border-color: rgba(0, 255, 255, 0.3);
        }

        .device-icon {
          margin-right: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          .device-title {
            color: #ffffff;
            font-size: 16px;
            font-weight: 500;
            line-height: 1.4;
          }
        }

        .device-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .device-tip {
          display: flex;
          gap: 20px;

          .device-type {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
          }

          .device-location {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
          }
        }

        .device-action {
          margin-left: 16px;

          .action-button {
            background: transparent;
            border: 1px solid rgba(0, 255, 255, 0.5);
            color: #00ffff;
            border-radius: 4px;
            height: 32px;
            padding: 0 16px;
            font-size: 14px;
            transition: all 0.3s ease;

            &:hover {
              background: rgba(0, 255, 255, 0.1);
              border-color: #00ffff;
              color: #ffffff;
            }

            &:focus {
              background: rgba(0, 255, 255, 0.1);
              border-color: #00ffff;
              color: #ffffff;
            }
          }
        }
      }
    }
  }
}
</style>
