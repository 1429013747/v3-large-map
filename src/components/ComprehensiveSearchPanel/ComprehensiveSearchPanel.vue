<template>
  <a-drawer
    v-model:open="visible"
    title="综合检索"
    placement="right"
    getContainer=".ui-container"
    :width="1200"
    :closable="true"
    :mask="false"
    rootClassName="layer-box"
    class="layer-control-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>
    <div class="comprehensive-search-content">
      <!-- 数据总量统计 -->
      <div class="data-summary">
        <div class="summary-title-section">
          <h3 class="summary-title">
            <img src="@/assets/imgs/title-icon.png" alt="数据总量" />
            数据总量
          </h3>
          <div class="summary-number-cards">
            <div
              v-for="(digit, index) in totalDataCountDigits"
              :key="index"
              class="number-card"
            >
              {{ digit }}
            </div>
          </div>
        </div>
        <div class="summary-cards">
          <div
            v-for="card in summaryCards"
            :key="card.key"
            class="summary-card"
          >
            <div class="card-icon">
              <img :src="getIconPath(card.icon)" :alt="card.name" />
            </div>
            <div class="card-content">
              <div class="card-name">{{ card.name }}</div>
              <div class="card-number">{{ card.count }}</div>
            </div>
          </div>
        </div>
      </div>
      <!-- 搜索功能区域 -->
      <div class="search-content">
        <div class="search-bar">
          <a-input
            v-model:value="searchKeyword"
            placeholder="请输入内容"
            class="search-input"
            size="large"
            allowClear
            @pressEnter="handleSearch"
          >
            <template #suffix>
              <SearchOutlined @click="handleSearch" />
            </template>
          </a-input>

          <a-select
            v-model:value="selectedArea"
            placeholder="全部区域"
            class="area-select"
            size="large"
            allowClear
            @change="handleAreaChange"
          >
            <a-select-option value="宁波市">宁波市</a-select-option>
            <a-select-option value="台州市">台州市</a-select-option>
            <a-select-option value="温州市">温州市</a-select-option>
          </a-select>

          <a-select
            v-model:value="selectedDimension"
            placeholder="全部维度"
            class="dimension-select"
            size="large"
            allowClear
            @change="handleDimensionChange"
          >
            <a-select-option value="人员">人员</a-select-option>
            <a-select-option value="船舶">船舶</a-select-option>
            <a-select-option value="车辆">车辆</a-select-option>
            <a-select-option value="案件">案件</a-select-option>
          </a-select>
        </div>
      </div>
      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 左侧详情面板 -->
        <div class="left-panels">
          <div
            v-for="panel in leftPanels"
            :key="panel.type"
            class="detail-panel"
          >
            <div class="panel-header">
              <img :src="getIconPath(panel.icon)" alt="地点" />
              {{ panel.title }}
            </div>
            <div class="panel-content">
              <div
                v-for="item in panel.items"
                :key="item.key"
                class="panel-item"
              >
                <span class="item-label">{{ item.label }}:</span>
                <span class="item-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧人员详情面板 -->
        <div class="right-panel">
          <div class="person-detail-panel">
            <div class="person-header">
              <span class="person-title">
                <span class="person-title-icon">▶</span>
                <span>人员</span>
              </span>
            </div>
            <div class="person-header-content">
              <span class="person-name">张某某</span>
              <div class="person-tags">
                <a-button type="primary" danger size="small" class="tag-btn">
                  涉私人员
                </a-button>
                <a-button type="primary" danger size="small" class="tag-btn">
                  涉私人员
                </a-button>
              </div>
            </div>

            <div class="person-content">
              <div class="person-avatar">
                <img src="@/assets/imgs/vactor.png" alt="人员头像" />
              </div>

              <div class="person-info">
                <div class="info-item">
                  <span class="info-label">国籍:</span>
                  <span class="info-value">中国</span>
                </div>
                <div class="info-item">
                  <span class="info-label">性别:</span>
                  <span class="info-value">男</span>
                </div>
                <div class="info-item">
                  <span class="info-label">户籍地址:</span>
                  <span class="info-value">XX省XX市XXXXXX</span>
                </div>
                <div class="info-item">
                  <span class="info-label">证件号码:</span>
                  <span class="info-value">33011019890101</span>
                </div>
                <div class="info-item">
                  <span class="info-label">现居住地址:</span>
                  <span class="info-value">XX省XX市XXXXXX</span>
                </div>
                <div class="info-item">
                  <span class="info-label">出生日期:</span>
                  <span class="info-value">1989-01-01</span>
                </div>
                <div class="info-item">
                  <span class="info-label">关联车辆:</span>
                  <span class="info-value">浙J88990</span>
                </div>
                <div class="info-item">
                  <span class="info-label">手机号:</span>
                  <span class="info-value">176******76</span>
                </div>
                <div class="info-item">
                  <span class="info-label">关联船舶:</span>
                  <span class="info-value">浙渔XX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  CloseOutlined,
  SearchOutlined,
  DownOutlined,
} from "@ant-design/icons-vue";
import { getIconPath } from "@/utils/utilstools.js";
// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:open"]);
// 响应式数据
const visible = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const searchKeyword = ref("");
const selectedArea = ref();
const selectedDimension = ref();
const totalDataCount = ref(1240);

// 将总数据量拆分为单个数字
const totalDataCountDigits = computed(() => {
  return totalDataCount.value.toString().split("");
});

// 统计卡片数据
const summaryCards = ref([
  { key: "personnel", name: "人员库", count: 92, icon: "vactor-p" },
  { key: "ship", name: "船舶库", count: 89, icon: "boat-line" },
  { key: "vehicle", name: "车辆库", count: 119, icon: "tank" },
  { key: "risk", name: "风险点库", count: 119, icon: "warn-bg" },
  { key: "case", name: "案件库", count: 67, icon: "bage" },
  { key: "clue", name: "线索库", count: 11, icon: "line-bg" },
  { key: "project", name: "项目库", count: 189, icon: "pos-bg" },
  { key: "warning", name: "预警库", count: 189, icon: "imp-bg" },
]);

// 左侧详情面板数据
const leftPanels = ref([
  {
    type: "location",
    title: "地点",
    icon: "position",
    items: [{ key: "location", label: "地点", value: "XX地点" }],
  },
  {
    type: "person",
    title: "人员",
    icon: "icon-user",
    items: [
      { key: "name", label: "姓名", value: "张三" },
      { key: "id", label: "证件号码", value: "33011019890718" },
      { key: "phone", label: "手机号", value: "13766766889" },
      { key: "address", label: "户籍地", value: "安徽省合肥市" },
    ],
  },
  {
    type: "case",
    title: "案件",
    icon: "bage-icon",
    items: [
      { key: "caseName", label: "案件名称", value: "张三" },
      { key: "caseNumber", label: "案件编号", value: "XS20250001" },
      { key: "caseContent", label: "案件内容", value: "发生冻品走私案件" },
    ],
  },
  {
    type: "items",
    title: "物品",
    icon: "file-icon",
    items: [
      { key: "itemType", label: "物品类型", value: "冻品" },
      { key: "involvedCase", label: "涉及案件", value: "某某某走私案" },
      { key: "caseNumber", label: "案件编号", value: "XS2025001" },
      { key: "personnel", label: "涉案人员", value: "张三" },
    ],
  },
  {
    type: "ship",
    title: "船舶",
    icon: "boat-icon",
    items: [
      { key: "shipNumber", label: "船舶编号", value: "浙象渔001" },
      { key: "shipType", label: "船舶类型", value: "渔船" },
      { key: "owner", label: "船主", value: "某某某" },
      { key: "crew", label: "船员", value: "某某某、某某东" },
    ],
  },
]);

// 方法
const handleClose = () => {
  visible.value = false;
};

const handleSearch = () => {
  console.log("搜索:", searchKeyword.value);
};

const handleAreaChange = (value) => {
  selectedArea.value = value;
  console.log("选择区域:", value);
};

const handleDimensionChange = (value) => {
  selectedDimension.value = value;
  console.log("选择维度:", value);
};
</script>

<style lang="scss" scoped>
.comprehensive-search-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-header {
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);

  .search-input-group {
    display: flex;
    align-items: center;
    gap: 16px;
    .search-input {
      flex: 1;
      max-width: 400px;
    }

    .search-filters {
      display: flex;
      gap: 12px;

      .ant-dropdown-link {
        color: #ffffff;
        font-size: 14px;
        padding: 8px 16px;
        background: rgba(0, 255, 255, 0.1);
        border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(0, 255, 255, 0.2);
          border-color: rgba(0, 255, 255, 0.5);
        }
      }
    }
  }
}

.data-summary {
  display: flex;
  align-items: center;
  padding: 20px 0;
  gap: 40px;

  .summary-title-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .summary-title {
    display: flex;
    align-items: center;
    gap: 28px;
    color: #6bccf6;
    font-size: 28px;
    font-weight: 600;
    margin: 0;
  }

  .summary-number-cards {
    display: flex;
    gap: 8px;

    .number-card {
      width: 50px;
      height: 60px;
      background: linear-gradient(
        180deg,
        rgba(0, 255, 255, 0.1) 0%,
        rgba(0, 255, 255, 0.05) 100%
      );
      border: 1px solid rgba(0, 255, 255, 0.3);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 48px;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        border-color: rgba(0, 255, 255, 0.5);
      }
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    width: 100%;

    .summary-card {
      background: linear-gradient(145deg, rgba(50, 162, 207, 0.4), transparent);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 12px;

      .card-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          object-fit: fill;
        }
      }

      .card-content {
        flex: 1;

        .card-number {
          color: #fff;
          font-size: 24px;
          font-weight: bold;
          line-height: 1;
        }

        .card-name {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin-top: 4px;
        }
      }
    }
  }
}

// 搜索功能区域样式
.search-content {
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);

  .search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    border-radius: 8px;
    padding: 12px 16px;

    .search-input {
      flex: 0.2;

      :deep(.ant-input) {
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 14px;

        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        &:focus {
          box-shadow: none;
        }
      }

      :deep(.ant-input-suffix) {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .area-select,
    .dimension-select {
      flex: 0.2;

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

        .ant-select-selection-search-input {
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
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px 0;
  overflow: hidden;
}

.left-panels {
  flex: 0.4;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;

  .detail-panel {
    background: rgba(18, 28, 43, 0.6);
    box-shadow: inset 0 0 18px 10px rgba(15, 78, 97, 0.9);
    border-radius: 8px;
    padding: 16px;
    margin-right: 4px;

    .panel-header {
      color: #00ffff;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
      }
    }

    .panel-content {
      margin-left: 24px;
      .panel-item {
        display: flex;
        margin-bottom: 8px;
        font-size: 14px;

        &:last-child {
          margin-bottom: 0;
        }

        .item-label {
          font-weight: 500;
          min-width: 80px;
          flex-shrink: 0;
        }

        .item-value {
          color: rgba(255, 255, 255, 0.9);
          flex: 1;
        }
      }
    }
  }
}

.right-panel {
  width: 400px;
  flex-shrink: 0;
  flex: 0.7;

  .person-detail-panel {
    border-radius: 8px;
    padding: 20px;
    height: 100%;

    .person-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;

      .person-title {
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
        .person-title-icon {
          color: #00ffff;
          font-size: 10px;
          font-weight: 600;
        }
      }
    }

    .person-header-content {
      display: flex;
      align-items: center;
      gap: 28px;
      margin-bottom: 40px;
      .person-name {
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
      }

      .person-tags {
        display: flex;
        gap: 8px;

        .tag-btn {
          font-size: 12px;
          height: 24px;
          padding: 0 8px;
        }
      }
    }

    .person-content {
      display: flex;
      gap: 16px;

      .person-avatar {
        width: 280px;
        height: 200px;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;
        }
      }

      .person-info {
        flex: 1;

        .info-item {
          display: flex;
          margin-bottom: 8px;
          color: #d4d0d0;

          &:last-child {
            margin-bottom: 0;
          }

          .info-label {
            font-weight: 500;
            font-size: 14px;
            min-width: 80px;
            flex-shrink: 0;
          }

          .info-value {
            flex: 1;
          }
        }
      }
    }
  }
}

// 滚动条样式
.left-panels::-webkit-scrollbar {
  width: 4px;
}

.left-panels::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.left-panels::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 2px;

  &:hover {
    background: rgba(0, 255, 255, 0.5);
  }
}
</style>
