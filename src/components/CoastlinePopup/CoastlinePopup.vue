<template>
  <a-drawer
    v-model:open="visibleModal"
    title="岸线管控"
    placement="left"
    getContainer=".ui-container"
    :width="475"
    :closable="true"
    :mask="false"
    class="suspicious-vehicle-drawer"
  >
    <template #closeIcon>
      <img height="24px" src="@/assets/imgs/coast-icon.png" alt="" />
    </template>
    <template #extra>
      <CloseOutlined @click="handleClose" />
    </template>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <div class="filter-row">
        <div class="filter-row-item">
          <div class="filter-row-item-dropdown">
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                {{ areaFilter || "所属区域" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleAreaChange('台州市')">
                    台州市
                  </a-menu-item>
                  <a-menu-item @click="handleAreaChange('温岭市')">
                    温岭市
                  </a-menu-item>
                  <a-menu-item @click="handleAreaChange('黄岩区')">
                    黄岩区
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <div class="filter-row-item-dropdown">
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                {{ riskList[riskStatusFilter] || "风险等级" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    v-for="(item, index) in riskList"
                    @click="handleTypeChange(index + 1)"
                  >
                    {{ item }}
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        <div class="filter-row-item2">
          <span class="search-label">名称:</span>
          <a-input
            v-model:value="searchKeyword"
            placeholder=""
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

    <!-- 岸线管控列表 -->
    <div class="vehicle-list">
      <div
        v-for="(coastline, index) in filteredCoastlines"
        :key="coastline.id"
        class="vehicle-item"
      >
        <div class="vehicle-info">
          <div class="vehicle-basic">
            <span class="plate-number"> {{ coastline.content }}</span>
            <span class="vehicle-color"
              >类型: {{ getRiskStatus(coastline.riskStatus).text }}</span
            >
          </div>

          <div class="vehicle-actions">
            <div
              v-if="coastline.riskStatus"
              :class="getRiskStatus(coastline.riskStatus).class"
            >
              {{ getRiskStatus(coastline.riskStatus).text }}
            </div>
            <div @click.stop="handleDetail(coastline)" class="action-btn">
              <FileTextOutlined />
              <span>详情</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>

  <!-- 岸线管控详情弹窗 -->
  <CoastlineDetailModal
    v-model:open="coastlineDetailModalVisible"
    :coastline="selectedCoastlineData"
  />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import CoastlineDetailModal from "./components/CoastlineModal.vue";
import { getIconPath } from "@/utils/utilstools";
import {
  DownOutlined,
  FileTextOutlined,
  CloseOutlined,
} from "@ant-design/icons-vue";

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  coastlineData: {
    type: Object,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits([
  "update:open",
  "view-more",
]);

// 响应式数据
const searchKeyword = ref("");
const riskStatusFilter = ref("");
const areaFilter = ref("");
const selectedCoastline = ref(null);
const addCoastlineModalVisible = ref(false);
const coastlineDetailModalVisible = ref(false);
const selectedCoastlineData = ref(null);
const riskList = ["低风险", "中风险", "高风险"];

const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit("update:open", value);
  },
});
// 岸线管控数据
const coastlines = ref([
  {
    id: 1,
    deptName: "白岩村",
    content: "风险点xxxxx",
    title: "白岩码头",
    riskStatus: "1",
    location: "台州市",
    name: "张某某",
    locate: "温岭市白岩码头",
    coordinates: "114.2452345,38.53451234",
    type: "渔业码头",
    environment: "有居民社区或厂房，距离500米，夜间有灯光。",
    bargeConditions: "具备泊船停靠条件，可停靠船舶吨数100t以下。",
    trafficConditions: "上县道距离5KM以下，上高速距离KM以下。",
    workingConditions:
      "具备停放大型车辆的场地，10辆以上车辆；吊机作业空间、条件不满足。",
  },
  {
    id: 2,
    deptName: "白岩村",
    content: "风险点xxxxx",
    title: "白岩码头",
    riskStatus: "2",
    name: "张某某",
    location: "台州市",
    locate: "温岭市白岩码头",
    coordinates: "114.2452345,38.53451234",
    type: "渔业码头",
    environment: "有居民社区或厂房，距离500米，夜间有灯光。",
    bargeConditions: "具备泊船停靠条件，可停靠船舶吨数100t以下。",
    trafficConditions: "上县道距离5KM以下，上高速距离KM以下。",
    workingConditions:
      "具备停放大型车辆的场地，10辆以上车辆；吊机作业空间、条件不满足。",
  },
  {
    id: 3,
    deptName: "白岩村",
    content: "风险点xxxxx",
    riskStatus: "3",
    title: "白岩码头",
    location: "台州市",
    name: "张某某",
    locate: "温岭市白岩码头",
    coordinates: "114.2452345,38.53451234",
    type: "渔业码头",
    environment: "有居民社区或厂房，距离500米，夜间有灯光。",
    bargeConditions: "具备泊船停靠条件，可停靠船舶吨数100t以下。",
    trafficConditions: "上县道距离5KM以下，上高速距离KM以下。",
    workingConditions:
      "具备停放大型车辆的场地，10辆以上车辆；吊机作业空间、条件不满足。",
  },
  {
    id: 4,
    deptName: "白岩村",
    content: "风险点xxxxx",
    title: "白岩码头",
    location: "台州市",
    name: "张某某",
    locate: "温岭市白岩码头",
    coordinates: "114.2452345,38.53451234",
    type: "渔业码头",
    environment: "有居民社区或厂房，距离500米，夜间有灯光。",
    bargeConditions: "具备泊船停靠条件，可停靠船舶吨数100t以下。",
    trafficConditions: "上县道距离5KM以下，上高速距离KM以下。",
    workingConditions:
      "具备停放大型车辆的场地，10辆以上车辆；吊机作业空间、条件不满足。",
  },
]);

// 计算属性
const filteredCoastlines = computed(() => {
  let filtered = coastlines.value;

  // 按区域筛选
  if (areaFilter.value) {
    filtered = filtered.filter((coastlines) =>
      coastlines.location.includes(areaFilter.value)
    );
  }
  if (riskStatusFilter.value) {
    filtered = filtered.filter((coastlines) =>
      coastlines.riskStatus?.includes(riskStatusFilter.value)
    );
  }

  // 按关键词筛选
  if (searchKeyword.value) {
    filtered = filtered.filter(
      (coastlines) =>
        coastlines?.riskStatus.includes(searchKeyword.value) ||
        coastlines.location.includes(searchKeyword.value)
    );
  }

  return filtered;
});

const handleClose = () => {
  emit("update:open", false);
};

const handleQuery = () => {
  console.log("查询:", searchKeyword.value);
};

const handleReset = () => {
  searchKeyword.value = "";
  riskStatusFilter.value = "";
  areaFilter.value = "";
};

const handleSearch = () => {
  console.log("搜索:", searchKeyword.value);
};

const handleTypeChange = (type) => {
  riskStatusFilter.value = type;
};

const handleAreaChange = (area) => {
  areaFilter.value = area;
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

const handleDetail = (coastline) => {
  selectedCoastline.value = coastline;
  if (typeof coastline !== "object") {
    selectedCoastline.value = coastlines.value.find(
      (el) => el.markerId === coastline
    );
  }
  selectedCoastlineData.value = {
    ...selectedCoastline.value,
    // 添加详情弹窗需要的额外数据
    image: getIconPath("ttb"),
  };
  coastlineDetailModalVisible.value = true;
  emit("view-more", coastline);
};

defineExpose({
  handleDetail,
});
</script>

<style lang="scss" scoped>
.suspicious-vehicle-drawer {
  .search-section {
    margin-bottom: 20px;

    .search-input-row {
      margin-bottom: 16px;

      .search-input {
        width: 100%;

        :deep(.ant-input) {
          background: rgba(18, 28, 43, 0.8);
          border: 1px solid rgba(163, 197, 217, 0.3);
          color: #ffffff;
          font-size: 14px;
          height: 32px;

          &::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          &:focus {
            border-color: #00ffff;
            box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
          }
        }

        :deep(.ant-input-prefix) {
          color: rgba(255, 255, 255, 0.6);
        }
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

        .search-label {
          color: #ffffff;
          font-size: 12px;
          white-space: nowrap;
        }

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
        background: #1a4e5e;
        border-radius: 0;
        padding: 0 30px;
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
        padding: 0 30px;
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

    .add-btn {
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

  .vehicle-list {
    flex: 1;
    overflow-y: auto;
    height: calc(100% - 135px);
    width: calc(100% + 6px);
    padding-right: 6px;

    .vehicle-item {
      background: rgba(18, 28, 43, 0.8);
      border: 1px solid rgba(0, 255, 255, 0.17);
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;

      &:hover {
        background: rgba(16, 49, 65, 0.6);
        box-shadow: inset 0 0 20px 10px #0d5e6e;
      }

      .vehicle-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        .vehicle-basic {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .plate-number,
          .vehicle-color {
            color: #ffffff;
            font-size: 14px;
          }
        }
      }

      .vehicle-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: flex-end;
        gap: 10px;
        height: 100%;

        .action-btn {
          color: #fff;
          padding: 0;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;

          &:hover {
            color: #00e6e6;
          }

          .anticon {
            font-size: 12px;
          }
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
    // &::-webkit-scrollbar {
    //   width: 2px;
    //   background-color: #00ffff;
    // }
    // &::-webkit-scrollbar-track {
    //   -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    //   border-radius: 1px;
    //   background-color: #f5f5f5;
    // }
    // &::-webkit-scrollbar-thumb {
    //   border-radius: 1px;
    //   -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    //   background-color: #00ffff;
    // }
  }
}
</style>

<style lang="scss">
.vehicle-detail-modal {
  .info-text {
    font-size: 14px;
    color: #fff;
    font-weight: 400;
  }
  .ant-modal-content {
    background: rgba(23, 39, 40, 0.85);
    border: 1px solid #5ce4e4;
    border-radius: 0px;
    padding: 10px;
  }
  .ant-modal-close {
    color: #fff;
    font-size: 16px;
    font-weight: 400;
    &:hover {
      color: #fff;
    }
  }
  .ant-modal-header {
    padding: 10px;
    background: transparent;
    .ant-modal-title {
      color: #fff;
      font-size: 16px;
      font-weight: 400;
    }
  }
  .ant-modal-body {
    padding: 10px;
    background: transparent;
  }
  .ant-modal-footer {
    padding: 0px;
    margin-bottom: 10px;
    background: transparent;
    display: flex;
    justify-content: center;
    gap: 6px;
    .ant-btn {
      background: rgba(20, 75, 93, 0.1);
      padding: 5px 20px;
      border-color: #25565c;
      color: #ffffff;
      border-radius: 0px;
      height: 30px;
      font-size: 14px;
      &:hover {
        background: rgba(20, 75, 93, 0.5);
        border-color: #144b5d;
        color: #00ffff;
      }
    }
  }
}
</style>
