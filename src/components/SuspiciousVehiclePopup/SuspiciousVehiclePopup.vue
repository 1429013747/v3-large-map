<script setup>
import { getIconPath } from "@/utils/utilstools";
import {
  CloseOutlined,
  DownOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons-vue";
import { computed, defineOptions, ref } from "vue";
import AddVehicleModal from "./components/AddVehicleModal.vue";
import VehicleDetailModal from "./components/VehicleDetailModal.vue";

defineOptions({
  inheritAttrs: false,
});
// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: true,
  },
  vehicleData: {
    type: Object,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits([
  "update:open",
  "track-back",
  "create-warning",
  "warning-click",
  "vehicle-click",
  "add-vehicle",
  "cancel-key",
]);

// 响应式数据
const searchKeyword = ref("");
const typeFilter = ref("");
const areaFilter = ref("");
const plateFilter = ref("");
const activeCategory = ref("all");
const detailDrawerVisible = ref(false);
const selectedVehicle = ref(null);
const addVehicleModalVisible = ref(false);
const vehicleDetailModalVisible = ref(false);
const vehicleVisible = ref(false);
const selectedVehicleData = ref(null);

const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit("update:open", value);
  },
});
// 分类选项
const categories = [
  { value: "all", label: "全部车辆" },
  { value: "key", label: "重点车辆" },
];

// 车辆数据
const vehicles = ref([
  {
    id: 1,
    plateNumber: "浙J55566",
    color: "黄色",
    vehicleType: "高栏货车",
    location: "台州市黄岩区",
    lastUpdate: "2025-01-15 10:30",
    status: "行驶中",
    isKey: true,
    markerId: "random-car-1",
    category: "key",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "重点可疑车辆，多次出现在高风险区域",
  },
  {
    id: 2,
    plateNumber: "浙J55566",
    color: "黄色",
    vehicleType: "高栏货车",
    location: "台州市椒江区",
    lastUpdate: "2025-01-15 09:15:00",
    status: "停靠",
    markerId: "random-car-2",
    isKey: true,
    category: "key",
    coordinates: [121.92238540355359, 29.327488946826932],
    description: "重点可疑车辆，涉及多起案件",
  },
  {
    id: 3,
    plateNumber: "浙J55566",
    color: "黄色",
    vehicleType: "高栏货车",
    location: "台州市路桥区",
    lastUpdate: "2025-01-15 08:45:00",
    markerId: "random-car-1",
    status: "行驶中",
    isKey: true,
    category: "key",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "重点可疑车辆，需要重点关注",
  },
  {
    id: 4,
    plateNumber: "浙J55566",
    color: "黄色",
    vehicleType: "高栏货车",
    location: "台州市三门县",
    lastUpdate: "2025-01-15 07:20:00",
    markerId: "random-car-1",
    status: "停靠",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "可疑车辆，需要进一步观察",
  },
  {
    id: 5,
    plateNumber: "浙J55566",
    color: "黄色",
    vehicleType: "高栏货车",
    location: "台州市温岭市",
    lastUpdate: "2025-01-15 06:30:00",
    markerId: "random-car-1",
    status: "行驶中",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "可疑车辆，行为异常",
  },
  {
    id: 6,
    plateNumber: "浙J55566",
    color: "黄色",
    vehicleType: "高栏货车",
    location: "台州市玉环市",
    lastUpdate: "2025-01-15 05:15:00",
    markerId: "random-car-1",
    status: "停靠",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "一般可疑车辆",
  },
  {
    id: 7,
    plateNumber: "浙J55566",
    color: "黄色",
    vehicleType: "高栏货车",
    location: "台州市仙居县",
    markerId: "random-car-1",
    lastUpdate: "2025-01-15 04:00:00",
    status: "行驶中",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "可疑车辆，需要关注",
  },
]);

// 计算属性
const filteredVehicles = computed(() => {
  let filtered = vehicles.value;

  // 按分类筛选
  if (activeCategory.value !== "all") {
    filtered = filtered.filter(
      (vehicle) => vehicle.category === activeCategory.value
    );
  }

  // 按车辆类型筛选
  if (typeFilter.value) {
    filtered = filtered.filter((vehicle) =>
      vehicle.vehicleType.includes(typeFilter.value)
    );
  }

  // 按区域筛选
  if (areaFilter.value) {
    filtered = filtered.filter((vehicle) =>
      vehicle.location.includes(areaFilter.value)
    );
  }

  // 按车牌号筛选
  if (plateFilter.value) {
    filtered = filtered.filter((vehicle) =>
      vehicle.plateNumber.includes(plateFilter.value)
    );
  }

  // 按关键词筛选
  if (searchKeyword.value) {
    filtered = filtered.filter(
      (vehicle) =>
        vehicle.plateNumber.includes(searchKeyword.value) ||
        vehicle.vehicleType.includes(searchKeyword.value) ||
        vehicle.location.includes(searchKeyword.value)
    );
  }

  return filtered;
});

function handleClose() {
  emit("update:open", false);
}

function handleQuery() {
  console.log("查询:", searchKeyword.value);
}

function handleReset() {
  searchKeyword.value = "";
  typeFilter.value = "";
  areaFilter.value = "";
  plateFilter.value = "";
  activeCategory.value = "all";
}

function handleSearch() {
  console.log("搜索:", searchKeyword.value);
}

function handleTypeChange(type) {
  typeFilter.value = type;
}

function handleAreaChange(area) {
  areaFilter.value = area;
}

function handleCategoryChange(category) {
  activeCategory.value = category;
}

function handleVehicleClick(vehicle) {
  emit("vehicle-click", vehicle);
}

function handleTrack(vehicle) {
  emit("track-back", vehicle);
}

function handleDetail(vehicle) {
  selectedVehicle.value = vehicle;
  selectedVehicleData.value = {
    ...vehicle,
    // 添加详情弹窗需要的额外数据
    image: getIconPath("truck2"),
    lastUpdateTime: vehicle.lastUpdate || "2025-06-11 13:00:00",
    status: vehicle.status || "行驶中",
    speed: "90km/h",
    parkingLocation: "XXXXXOXX",
    direction: "45°",
    historyAlerts: [
      { content: "重点车辆浙XXXX进入风险点", date: "2025-03-02" },
      { content: "重点车辆浙XXXX进入风险点", date: "2025-03-02" },
      { content: "重点车辆浙XXXX进入风险点", date: "2025-03-02" },
      { content: "重点车辆浙XXXX进入风险点", date: "2025-03-02" },
    ],
    historyCases: [
      { content: "白岩码头冻品走私案件", date: "2025-03-02" },
      { content: "白岩码头冻品走私案件", date: "2025-03-02" },
      { content: "白岩码头冻品走私案件", date: "2025-03-02" },
      { content: "白岩码头冻品走私案件", date: "2025-03-02" },
    ],
  };
  vehicleDetailModalVisible.value = true;
}

function handleDetailClose() {
  detailDrawerVisible.value = false;
}

function handleAddVehicle() {
  addVehicleModalVisible.value = true;
}

// 新增车辆表单提交
function handleAddVehicleSubmit(formData) {
  // 这里可以添加提交逻辑
  emit("add-vehicle", formData);
  vehicles.value.push(formData);
}

function handleSetKey(vehicle) {
  vehicleVisible.value = true;
  selectedVehicle.value = vehicle;
}

function handleCancelKey(vehicle) {
  vehicle.isKey = false;
  emit("cancel-key", vehicle);
  console.log("取消重点:", vehicle);
}

// 从详情弹窗设置重点车辆
function handleSetKeyVehicleFromDetail(vehicleData) {
  const vehicle = vehicles.value.find((el) => el.id === vehicleData.id);
  if (vehicle) {
    // 如果已经设置为重点车辆，则取消重点
    if (selectedVehicleData.value.isKey) {
      selectedVehicleData.value.isKey = false;
      selectedVehicle.value.isKey = false;
      return;
    }
    vehicleVisible.value = true;
    console.log("从详情弹窗设置重点:", vehicle);
  }
}

function onVehicleSubmit() {
  selectedVehicle.value.isKey = true;
  vehicleVisible.value = false;
  // 设置为重点
  if (selectedVehicleData.value) {
    selectedVehicleData.value.isKey = true;
  }
}

function onVehicleCancel() {
  vehicleVisible.value = false;
}

defineExpose({
  handleVehicleClick,
  handleDetail,
});
</script>

<template>
  <a-drawer
    v-model:open="visibleModal"
    title="可疑车辆"
    placement="left"
    get-container=".ui-container"
    :width="475"
    :closable="true"
    :mask="false"
    class="suspicious-vehicle-drawer"
  >
    <template #closeIcon>
      <img height="24px" src="@/assets/imgs/truck.png" alt="">
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
                {{ typeFilter || "车辆类型" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleTypeChange('高栏货车')">
                    高栏货车
                  </a-menu-item>
                  <a-menu-item @click="handleTypeChange('厢式货车')">
                    厢式货车
                  </a-menu-item>
                  <a-menu-item @click="handleTypeChange('面包车')">
                    面包车
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        <div class="filter-row-item2">
          <span class="search-label">车牌号:</span>
          <a-input
            v-model:value="plateFilter"
            placeholder=""
            style="width: 120px; flex: 0.65"
          />

          <a-button
            type="primary"
            style="flex: 0.1725"
            size="small"
            class="query-btn"
            @click="handleQuery"
          >
            查询
          </a-button>
          <a-button
            style="flex: 0.1725"
            class="reset-btn"
            size="small"
            @click="handleReset"
          >
            重置
          </a-button>
        </div>
      </div>
    </div>

    <!-- 分类标签和操作 -->
    <div class="category-section">
      <div class="category-tabs">
        <a-button
          :type="activeCategory === 'all' ? 'primary' : 'default'"
          size="small"
          class="category-tab"
          @click="handleCategoryChange('all')"
        >
          全部车辆
        </a-button>
        <a-button
          :type="activeCategory === 'key' ? 'primary' : 'default'"
          size="small"
          class="category-tab"
          @click="handleCategoryChange('key')"
        >
          重点可疑车辆
        </a-button>
      </div>

      <a-button class="add-btn" size="small" @click="handleAddVehicle">
        + 新增可疑车辆
      </a-button>
    </div>

    <!-- 车辆列表 -->
    <div class="vehicle-list">
      <div
        v-for="vehicle in filteredVehicles"
        :key="vehicle.id"
        class="vehicle-item"
        @click.stop="handleVehicleClick(vehicle)"
      >
        <div class="vehicle-info">
          <div class="vehicle-basic">
            <span class="plate-number">车牌号: {{ vehicle.plateNumber }}</span>
            <span class="vehicle-color">车牌颜色: {{ vehicle.color }}</span>
          </div>
          <div v-if="vehicle.isKey" class="key-badge">
            重点可疑车辆
          </div>
        </div>

        <div class="vehicle-actions">
          <a-button
            v-if="vehicle.isKey"
            type="link"
            class="action-btn"
            @click.stop="handleCancelKey(vehicle)"
          >
            <StarFilled />
            取消重点
          </a-button>
          <a-button
            v-else
            type="link"
            class="action-btn"
            @click.stop="handleSetKey(vehicle)"
          >
            <StarOutlined />
            设置重点
          </a-button>

          <a-button
            type="link"
            class="action-btn"
            @click.stop="handleTrack(vehicle)"
          >
            <PlayCircleOutlined />
            轨迹
          </a-button>

          <a-button
            type="link"
            class="action-btn"
            @click.stop="handleDetail(vehicle)"
          >
            <FileTextOutlined />
            详情
          </a-button>
        </div>
      </div>
    </div>
  </a-drawer>

  <!-- 车辆详情面板 -->

  <!-- 新增可疑车辆弹窗 -->
  <AddVehicleModal
    v-model:open="addVehicleModalVisible"
    @submit="handleAddVehicleSubmit"
  />

  <!-- 车辆详情弹窗 -->
  <VehicleDetailModal
    v-model:open="vehicleDetailModalVisible"
    :vehicle-data="selectedVehicleData"
    @set-key-vehicle="handleSetKeyVehicleFromDetail"
  />
  <a-modal
    v-model:open="vehicleVisible"
    centered
    :mask="false"
    width="340px"
    title="确定设置为重点可疑车辆？"
    ok-text="确认"
    cancel-text="取消"
    get-container=".ui-container"
    class="vehicle-detail-modal"
    :z-index="99999"
  >
    <p class="info-text">
      标记成功后对其进行为布控，实时分析相关车辆特征行为。
    </p>
    <template #footer>
      <a-button type="primary" @click="onVehicleSubmit">
        确认
      </a-button>
      <a-button @click="onVehicleCancel">
        取消
      </a-button>
    </template>
  </a-modal>
</template>

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
        gap: 15px;
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
      background: transparent;
      border: none;
      color: #00e5ff;
      letter-spacing: 1px;
      &:hover {
        background: #1a4e5e;
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
        height: 28px;
        .vehicle-basic {
          display: flex;
          align-items: center;
          gap: 14px;

          .plate-number,
          .vehicle-color {
            color: #ffffff;
            font-size: 14px;
          }
        }
      }

      .vehicle-actions {
        margin-top: 14px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;

        .action-btn {
          color: #fff;
          padding: 0;
          font-size: 12px;
          display: flex;
          align-items: center;

          &:hover {
            color: #00e6e6;
          }

          .anticon {
            margin-right: -5px;
            font-size: 12px;
          }
        }
      }
      .key-badge {
        background: #ffa502;
        color: #ffffff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
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
