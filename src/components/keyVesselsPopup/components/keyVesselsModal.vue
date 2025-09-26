<template>
  <div class="vehicle-detail-modal-container">
    <a-modal
      :open="open"
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
            <a-tab-pane key="boatFile" tab="船只档案">
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
                    <div class="boat-file-container">
                      <div>
                        <p>
                          <span class="label">船籍社名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.boatRankName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶所有公司名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.boatCompanyName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶管理公司名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.boatManagerCompanyName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶经营公司名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.boatOperateCompanyName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">DOC公司名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.DocCompanyName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶注册公司名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.boatSignCompanyName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶技术公司名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.technologyCompanyName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">建造公司名称：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.buildCompanyName
                          }}</span>
                        </p>
                        <p>
                          <span class="label">主机信息：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.hostInfo
                          }}</span>
                        </p>
                        <p>
                          <span class="label">数据更新时间：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.lastTime
                          }}</span>
                        </p>
                      </div>
                      <div>
                        <p>
                          <span class="label">船东互保协会：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.mutualInsuranceAssociation
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶所有公司所属国籍：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.countryOfOrigin
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶管理公司所属国籍：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.managerCompanyOfOrigin
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶经营公司所属国籍：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.operateCompanyOfOrigin
                          }}</span>
                        </p>
                        <p>
                          <span class="label">DOC公司所属国家：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.DocCompanyOfOrigin
                          }}</span>
                        </p>
                        <p>
                          <span class="label">船舶注册公司所属国家：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.boatSignCompanyOfOrigin
                          }}</span>
                        </p>
                        <p>
                          <span class="label">技术管理公司所属国家：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.technologyCompanyOfOrigin
                          }}</span>
                        </p>
                        <p>
                          <span class="label">建造公司所属国家：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.buildCompanyOfOrigin
                          }}</span>
                        </p>
                        <p>
                          <span class="label">辅助信息：</span>
                          <span class="value-item">{{
                            vesselData.boatFile.auxiliaryMachineInformation
                          }}</span>
                        </p>
                      </div>
                    </div>
                  </a-collapse-panel>
                </a-collapse>
              </div>
            </a-tab-pane>

            <a-tab-pane key="gang" tab="历史预警内容">
              <div class="tab-content">
                <!-- 预警子区域 -->
                <a-collapse
                  v-model:activeKey="alertCollapseActive"
                  class="alert-collapse"
                >
                  <a-collapse-panel key="1" header="预警" class="alert-panel">
                    <template #extra>
                      <span class="alert-count">本月4次</span>
                    </template>
                    <div class="alert-list">
                      <div
                        class="alert-item"
                        v-for="(alert, index) in vesselData.historyAlerts"
                        :key="index"
                      >
                        <div class="alert-item-content">
                          <div class="alert-item-text">{{ alert.content }}</div>
                          <div class="alert-item-date">{{ alert.date }}</div>
                        </div>
                      </div>
                    </div>
                  </a-collapse-panel>
                </a-collapse>

                <!-- 历史案件关联子区域 -->
                <a-collapse
                  v-model:activeKey="caseCollapseActive"
                  class="case-collapse"
                >
                  <a-collapse-panel
                    key="1"
                    header="历史案件关联"
                    class="case-panel"
                  >
                    <template #extra>
                      <span class="case-count">本月4次</span>
                    </template>
                    <div class="case-list">
                      <div
                        class="case-item"
                        v-for="(caseItem, index) in vesselData.historyCases"
                        :key="index"
                      >
                        <div class="case-item-content">
                          <div class="case-item-text">
                            {{ caseItem.content }}
                          </div>
                          <div class="case-item-date">{{ caseItem.date }}</div>
                        </div>
                      </div>
                    </div>
                  </a-collapse-panel>
                </a-collapse>
              </div>
            </a-tab-pane>
            <a-tab-pane key="voyage" tab="航舶航次查询">
              <div class="tab-content2">
                <p style="margin: 10px 0 40px 0">
                  <span class="icon">▶</span>
                  <span>当前航次：</span>
                </p>
                <div class="voyage-content">
                  <div class="voyage-item">
                    <p>黄华</p>
                    <p class="voyage-item-date">2025-03-02 12:00:00</p>
                  </div>
                  <div class="voyage-line">
                    <span class="voyage-status">在途</span>
                    <div class="voyage-line-item"></div>
                  </div>
                  <div class="voyage-item">
                    <p>宁波</p>
                    <p class="voyage-item-date">2025-03-02 18:00:00</p>
                  </div>
                  <div class="voyage-info">
                    <p>当前所在位置：象山港至温州海域</p>
                    <p>已航行：200海里</p>
                    <p>速度：10节</p>
                  </div>
                </div>
                <p style="margin: 20px 0 20px 0">
                  <span class="icon">▶</span>
                  <span>航次查询：</span>
                </p>
                <div class="voyage-query">
                  <!-- 港口查询界面 -->
                  <div class="port-query-container">
                    <!-- 查询控制区域 -->
                    <div class="query-controls">
                      <div class="time-input-section">
                        <span class="time-label">时间段：</span>
                        <a-range-picker
                          v-model:value="timeRange"
                          class="time-range-picker"
                          :bordered="false"
                        />
                      </div>
                      <div class="action-buttons">
                        <a-button
                          type="primary"
                          class="query-btn2"
                          @click="handlePortQuery"
                        >
                          查询
                        </a-button>
                        <a-button class="reset-btn" @click="handleReset">
                          重置
                        </a-button>
                        <a-button class="export-btn" @click="handleExport">
                          <UploadOutlined />
                          导出
                        </a-button>
                      </div>
                    </div>

                    <!-- 港口信息表格 -->
                    <div class="port-table-container">
                      <div class="table-header">
                        <div class="header-cell">序号</div>
                        <div class="header-cell">港口中文</div>
                        <div class="header-cell">港口英文</div>
                        <div class="header-cell">国家或地区</div>
                        <div class="header-cell">到港时间</div>
                        <div class="header-cell">靠泊时间</div>
                        <div class="header-cell">离港时间</div>
                      </div>

                      <div class="table-body">
                        <div
                          class="data-row"
                          v-for="(item, index) in portData"
                          :key="`port-${index}`"
                        >
                          <div class="cell">{{ item.index }}</div>
                          <div class="cell">{{ item.chineseName }}</div>
                          <div class="cell">{{ item.englishName }}</div>
                          <div class="cell">{{ item.country }}</div>
                          <div class="cell">{{ item.arrivalTime }}</div>
                          <div class="cell">{{ item.berthingTime }}</div>
                          <div class="cell">{{ item.departureTime }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="voyageEvent" tab="航舶事件管理">
              <div class="elements-list">
                <a-table
                  :columns="vesselsTableColumns"
                  :data-source="vesselsTableData"
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
                        @click="handleViewTrack(record)"
                      >
                        查看轨迹
                      </a-button>
                    </template>
                  </template>
                </a-table>
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
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons-vue";

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  vesselData: {},
});

// Emits
const emit = defineEmits(["update:open", "setKeyVessel"]);

// 响应式数据
const activeTab = ref("boatFile");
const alertCollapseActive = ref(["1"]);
const caseCollapseActive = ref(["1"]);

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
// 关键要素分析表格列配置
const vesselsTableColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 80,
    align: "center",
    customRender: ({ text, record, index }) => {
      return index + 1;
    },
  },
  {
    title: "事件类型",
    dataIndex: "eventType",
    key: "eventType",
    ellipsis: true,
    align: "center",
  },
  {
    title: "事件时间",
    dataIndex: "eventTime",
    key: "eventTime",
    ellipsis: true,
    align: "center",
  },
  {
    title: "操作",
    key: "action",
    width: 600,
  },
];

// 关键要素分析表格数据
const vesselsTableData = ref([
  {
    key: "1",
    eventType: "搭靠",
    eventTime: "2025/09/23 10:00",
  },
  {
    key: "2",
    eventType: "搭靠",
    eventTime: "2025/09/23 10:00",
  },
  {
    key: "3",
    eventType: "搭靠",
    eventTime: "2025/09/23 10:00",
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

// 港口查询相关数据
const timeRange = ref(null);

// 航舶航次查询
const portData = ref([
  {
    index: 1,
    chineseName: "黄骅",
    englishName: "Huanghua",
    country: "中国",
    arrivalTime: "2025/6/15 1:18",
    berthingTime: "2025/6/16 8:42",
    departureTime: "2025/6/16 8:42",
  },
]);

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
  () => props.open,
  (newVal) => {
    if (newVal) {
      // 重置标签页状态
      activeTab.value = "boatFile";
      alertCollapseActive.value = ["1"];
      caseCollapseActive.value = ["1"];
    }
  }
);

// 关闭弹窗
const handleCancel = () => {
  emit("update:open", false);
};

// 设置重点船舶
const handleSetKeyVessel = () => {
  emit("setKeyVessel", props.vesselData);
};
//  查看轨迹
const handleViewTrack = (record) => {
  console.log("查看轨迹:", record);
};

// 查看要素详情
const handleViewElementDetail = (record) => {
  console.log("查看要素详情:", record);
  message.info(`查看${record.element} ${record.name} 的详情`);
};

// 港口查询相关方法
const handlePortQuery = () => {
  console.log("执行港口查询", timeRange.value);
  // 这里可以添加查询逻辑
  message.success("查询成功");
};

const handleReset = () => {
  timeRange.value = null;
  console.log("重置查询条件");
};

const handleExport = () => {
  console.log("导出港口数据");
  message.success("导出成功");
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
}
</style>
