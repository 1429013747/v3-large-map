<template>
  <a-drawer
    v-model:open="visibleModal"
    title="重点船舶"
    placement="left"
    getContainer=".ui-container"
    :width="475"
    :closable="true"
    :mask="false"
    class="suspicious-vehicle-drawer"
  >
    <template #closeIcon>
      <img height="24px" src="@/assets/imgs/ship-icon.png" alt="" />
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
                {{ typeFilter || "船舶类型" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleTypeChange('危险品船')">
                    危险品船
                  </a-menu-item>
                  <a-menu-item @click="handleTypeChange('集装箱船')">
                    集装箱船
                  </a-menu-item>
                  <a-menu-item @click="handleTypeChange('客船')">
                    客船
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        <div class="filter-row-item2">
          <span class="search-label">船舶名称:</span>
          <a-input
            v-model:value="plateFilter"
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

    <!-- 分类标签和操作 -->
    <div class="category-section">
      <div class="category-tabs">
        <a-button
          :type="activeCategory === 'all' ? 'primary' : 'default'"
          size="small"
          @click="handleCategoryChange('all')"
          class="category-tab"
        >
          全部船舶
        </a-button>
        <a-button
          :type="activeCategory === 'key' ? 'primary' : 'default'"
          size="small"
          @click="handleCategoryChange('key')"
          class="category-tab"
        >
          重点船舶
        </a-button>
      </div>

      <!-- <a-button class="add-btn" size="small" @click="handleAddVessels">
        + 新增船舶
      </a-button> -->
    </div>

    <!-- 船舶列表 -->
    <div class="vehicle-list">
      <div
        v-for="(vessel, index) in filteredVessels"
        :key="vessel.id"
        class="vehicle-item"
        @click.stop="handleVesselsClick(vessel)"
      >
        <div class="vehicle-info">
          <div class="vehicle-basic">
            <span class="plate-number">船舶名称: {{ vessel.vesselName }}</span>
            <span class="vehicle-color">类型: {{ vessel.color }}</span>
          </div>
          <div v-if="vessel.isKey" class="key-badge">重点船舶</div>
        </div>

        <div class="vehicle-actions">
          <a-button
            v-if="vessel.isKey"
            type="link"
            @click.stop="handleCancelKeyVessels(vessel)"
            class="action-btn"
          >
            <StarFilled />
            取消重点
          </a-button>
          <a-button
            v-else
            type="link"
            @click.stop="handleSetKeyVessels(vessel)"
            class="action-btn"
          >
            <StarOutlined />
            设置重点
          </a-button>

          <a-button
            type="link"
            @click.stop="handleTrack(vessel)"
            class="action-btn"
          >
            <PlayCircleOutlined />
            轨迹
          </a-button>

          <a-button
            type="link"
            @click.stop="handleDetail(vessel)"
            class="action-btn"
          >
            <FileTextOutlined />
            详情
          </a-button>
        </div>
      </div>
    </div>
  </a-drawer>

  <!-- 车辆详情面板 -->

  <!-- 新增船舶弹窗 -->
  <AddVesselsModal
    v-model:open="addVesselsModalVisible"
    @submit="handleAddVesselsSubmit"
    @cancel="handleAddVesselsCancel"
  />

  <!-- 船舶详情弹窗 -->
  <VesselsDetailModal
    v-model:open="vesselsDetailModalVisible"
    :vessel-data="selectedVesselData"
    @set-key-vessel="setKeyVesselsFromDetail"
  />
  <a-modal
    v-model:open="vesselsVisible"
    centered
    :mask="false"
    width="340px"
    title="确定设置为重点船舶？"
    ok-text="确认"
    cancel-text="取消"
    getContainer=".ui-container"
    class="vehicle-detail-modal"
    :zIndex="99999"
  >
    <p class="info-text">
      标记成功后对其进行为布控，实时分析相关船舶特征行为。
    </p>
    <template #footer>
      <a-button type="primary" @click="onVesselsSubmit">确认</a-button>
      <a-button @click="onVesselsCancel">取消</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import AddVesselsModal from "./components/AddVesselsModal.vue";
import VesselsDetailModal from "./components/keyVesselsModal.vue";
import { getIconPath } from "@/utils/utilstools";
import {
  SearchOutlined,
  DownOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CloseOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons-vue";

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  vesselsData: {
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
  "vessels-click",
  "add-vessels",
  "cancel-key",
]);

// 响应式数据
const searchKeyword = ref("");
const typeFilter = ref("");
const areaFilter = ref("");
const plateFilter = ref("");
const activeCategory = ref("all");
const vesselsDetailDrawerVisible = ref(false);
const selectedVessel = ref(null);
const addVesselsModalVisible = ref(false);
const vesselsDetailModalVisible = ref(false);
const vesselsVisible = ref(false);
const selectedVesselData = ref(null);

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
  { value: "all", label: "全部船舶" },
  { value: "key", label: "重点船舶" },
];

// 船舶数据
const vessels = ref([
  {
    id: 1,
    vesselName: "浙渔1001",
    englishVesselName: "ZHUYU 1001",
    callSign: "ZHUYU 1001",
    heading: "120°",
    length: "100米",
    destination: "台州市仙居县",
    signalSource: "雷达数据",
    mmsi: "1234567890",
    imo: "1234567890",
    speed: "90km/h",
    width: "10米",
    predictedArrivalTime: "2025-01-15 10:30",
    color: "黄色",
    vesselType: "客船",
    rotationAngleSpeed: "10°/s",
    location: "台州市黄岩区",
    lastUpdate: "2025-01-15 10:30",
    status: "行驶中",
    isKey: true,
    bowDirection: "120°",
    draft: "10米",
    nationality: "中国",
    markerId: "ship-dynamic-1",
    category: "key",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "重点可疑船舶，多次出现在高风险区域",
  },
  {
    id: 2,
    vesselName: "浙渔1002",
    englishVesselName: "ZHUYU 1002",
    callSign: "ZHUYU 1002",
    heading: "120°",
    length: "100米",
    destination: "台州市仙居县",
    signalSource: "雷达数据",
    mmsi: "1234567890",
    imo: "1234567890",
    speed: "90km/h",
    width: "10米",
    predictedArrivalTime: "2025-01-15 10:30",
    color: "黄色",
    vesselType: "客船",
    rotationAngleSpeed: "10°/s",
    location: "台州市椒江区",
    lastUpdate: "2025-01-15 09:15:00",
    status: "停靠",
    bowDirection: "120°",
    draft: "10米",
    nationality: "中国",
    markerId: "ship-dynamic-2",
    isKey: true,
    category: "key",
    coordinates: [121.92238540355359, 29.327488946826932],
    description: "重点可疑船舶，涉及多起案件",
  },
  {
    id: 3,
    vesselName: "浙渔1003",
    englishVesselName: "ZHUYU 1003",
    callSign: "ZHUYU 1003",
    heading: "120°",
    length: "100米",
    destination: "台州市仙居县",
    signalSource: "雷达数据",
    mmsi: "1234567890",
    imo: "1234567890",
    speed: "90km/h",
    width: "10米",
    predictedArrivalTime: "2025-01-15 10:30",
    color: "黄色",
    vesselType: "客船",
    rotationAngleSpeed: "10°/s",
    location: "台州市路桥区",
    lastUpdate: "2025-01-15 08:45:00",
    bowDirection: "120°",
    draft: "10米",
    nationality: "中国",
    markerId: "ship-dynamic-3",
    status: "行驶中",
    isKey: true,
    category: "key",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "重点可疑船舶，需要重点关注",
  },
  {
    id: 4,
    vesselName: "浙渔1004",
    englishVesselName: "ZHUYU 1004",
    callSign: "ZHUYU 1004",
    heading: "120°",
    length: "100米",
    destination: "台州市仙居县",
    signalSource: "雷达数据",
    mmsi: "1234567890",
    imo: "1234567890",
    speed: "90km/h",
    width: "10米",
    predictedArrivalTime: "2025-01-15 10:30",
    color: "黄色",
    vesselType: "客船",
    rotationAngleSpeed: "10°/s",
    location: "台州市三门县",
    lastUpdate: "2025-01-15 07:20:00",
    bowDirection: "120°",
    draft: "10米",
    nationality: "中国",
    markerId: "ship-dynamic-4",
    status: "停靠",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "可疑船舶，需要进一步观察",
  },
  {
    id: 5,
    vesselName: "浙渔1005",
    englishVesselName: "ZHUYU 1005",
    callSign: "ZHUYU 1005",
    heading: "120°",
    length: "100米",
    destination: "台州市仙居县",
    signalSource: "雷达数据",
    mmsi: "1234567890",
    imo: "1234567890",
    speed: "90km/h",
    width: "10米",
    predictedArrivalTime: "2025-01-15 10:30",
    color: "黄色",
    vesselType: "客船",
    rotationAngleSpeed: "10°/s",
    location: "台州市温岭市",
    lastUpdate: "2025-01-15 06:30:00",
    bowDirection: "120°",
    draft: "10米",
    nationality: "中国",
    markerId: "ship-dynamic-5",
    status: "行驶中",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "可疑船舶，行为异常",
  },
  {
    id: 6,
    vesselName: "浙渔1006",
    englishVesselName: "ZHUYU 1006",
    callSign: "ZHUYU 1006",
    heading: "120°",
    length: "100米",
    destination: "台州市仙居县",
    signalSource: "雷达数据",
    mmsi: "123467890",
    imo: "123467890",
    speed: "90km/h",
    width: "10米",
    predictedArrivalTime: "2025-01-15 10:30",
    color: "黄色",
    vesselType: "客船",
    rotationAngleSpeed: "10°/s",
    location: "台州市玉环市",
    lastUpdate: "2025-01-15 05:15:00",
    bowDirection: "120°",
    draft: "10米",
    nationality: "中国",
    markerId: "ship-dynamic-6",
    status: "停靠",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "一般可疑船舶",
  },
  {
    id: 7,
    vesselName: "浙渔1007",
    englishVesselName: "ZHUYU 1007",
    callSign: "ZHUYU 1007",
    heading: "120°",
    length: "100米",
    destination: "台州市仙居县",
    signalSource: "雷达数据",
    mmsi: "1234567890",
    imo: "1234567890",
    speed: "90km/h",
    width: "10米",
    predictedArrivalTime: "2025-01-15 10:30",
    color: "黄色",
    vesselType: "客船",
    rotationAngleSpeed: "10°/s",
    location: "台州市仙居县",
    nationality: "中国",
    draft: "10米",
    bowDirection: "120°",
    markerId: "ship-dynamic-7",
    lastUpdate: "2025-01-15 04:00:00",
    status: "行驶中",
    isKey: false,
    category: "suspicious",
    coordinates: [121.68068618480358, 29.374172264358947],
    description: "可疑船舶，需要关注",
  },
]);

// 计算属性
const filteredVessels = computed(() => {
  let filtered = vessels.value;

  // 按分类筛选
  if (activeCategory.value !== "all") {
    filtered = filtered.filter(
      (vessels) => vessels.category === activeCategory.value
    );
  }

  // 按船舶类型筛选
  if (typeFilter.value) {
    filtered = filtered.filter((vessels) =>
      vessels.vesselType.includes(typeFilter.value)
    );
  }

  // 按区域筛选
  if (areaFilter.value) {
    filtered = filtered.filter((vessels) =>
      vessels.location.includes(areaFilter.value)
    );
  }

  // 按船舶名称筛选
  if (plateFilter.value) {
    filtered = filtered.filter((vessels) =>
      vessels.vesselName.includes(plateFilter.value)
    );
  }

  // 按关键词筛选
  if (searchKeyword.value) {
    filtered = filtered.filter(
      (vessels) =>
        vessels.vesselName.includes(searchKeyword.value) ||
        vessels.vesselType.includes(searchKeyword.value) ||
        vessels.location.includes(searchKeyword.value)
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
  typeFilter.value = "";
  areaFilter.value = "";
  plateFilter.value = "";
  activeCategory.value = "all";
};

const handleSearch = () => {
  console.log("搜索:", searchKeyword.value);
};

const handleTypeChange = (type) => {
  typeFilter.value = type;
};

const handleAreaChange = (area) => {
  areaFilter.value = area;
};

const handleCategoryChange = (category) => {
  activeCategory.value = category;
};

const handleVesselsClick = (vessel) => {
  emit("vessels-click", vessel);
};

const handleTrack = (vessel) => {
  emit("track-back", vessel);
};

const handleDetail = (vessel) => {
  selectedVessel.value = vessel;
  if (typeof vessel !== "object") {
    selectedVessel.value = vessels.value.find((el) => el.markerId === vessel);
  }
  selectedVesselData.value = {
    ...selectedVessel.value,
    // 添加详情弹窗需要的额外数据
    image: getIconPath("ship-test"),
    lastUpdateTime: vessel.lastUpdate || "2025-06-11 13:00:00",
    status: vessel.status || "航行中",
    speed: "90km/h",
    parkingLocation: "XXXXXOXX",
    direction: "45°",
    boatFile: {
      boatRankName: "重点船舶",
      boatCompanyName: "浙渔1001",
      boatManagerCompanyName: "浙渔1001",
      boatOperateCompanyName: "浙渔1001",
      DocCompanyName: "浙渔1001",
      boatSignCompanyName: "浙渔1001",
      technologyCompanyName: "浙渔1001",
      buildCompanyName: "浙渔1001",
      hostInfo: "浙渔1001",
      lastTime: "2025-06-11 13:00:00",
      mutualInsuranceAssociation: "浙渔1001",
      countryOfOrigin: "中国",
      managerCompanyOfOrigin: "中国",
      operateCompanyOfOrigin: "中国",
      DocCompanyOfOrigin: "中国",
      boatSignCompanyOfOrigin: "中国",
      technologyCompanyOfOrigin: "中国",
      buildCompanyOfOrigin: "中国",
      auxiliaryMachineInformation: "无",
    },
    historyAlerts: [
      { content: "重点船舶浙XXXX进入风险点", date: "2025-03-02" },
      { content: "重点船舶浙XXXX进入风险点", date: "2025-03-02" },
      { content: "重点船舶浙XXXX进入风险点", date: "2025-03-02" },
    ],
    historyCases: [
      { content: "白岩码头冻品走私案件", date: "2025-03-02" },
      { content: "白岩码头冻品走私案件", date: "2025-03-02" },
      { content: "白岩码头冻品走私案件", date: "2025-03-02" },
    ],
  };
  vesselsDetailModalVisible.value = true;
};

const handleDetailClose = () => {
  vesselsDetailDrawerVisible.value = false;
};

const handleAddVessels = () => {
  addVesselsModalVisible.value = true;
};

// 新增船舶表单提交
const handleAddVesselsSubmit = (formData) => {
  // 这里可以添加提交逻辑
  emit("add-vessels", formData);
  vessels.value.push(formData);
};

// 新增车辆表单取消
const handleAddVesselsCancel = () => {
  console.log("取消新增船舶");
};

const handleSetKeyVessels = (vessel) => {
  vesselsVisible.value = true;
  selectedVessel.value = vessel;
};

const handleCancelKeyVessels = (vessel) => {
  vessel.isKey = false;
  emit("cancel-key", vessel);
  console.log("取消重点:", vessel);
};

// 从详情弹窗设置重点船舶
const setKeyVesselsFromDetail = (vesselsData) => {
  const vessel = vessels.value.find((v) => v.id === vesselsData.id);
  // 如果已经设置为重点船舶，则取消重点
  if (selectedVesselData.value.isKey) {
    selectedVesselData.value.isKey = false;
    selectedVessel.value.isKey = false;
    return;
  }
  vesselsVisible.value = true;
  selectedVessel.value = vessel;
};

const onVesselsSubmit = () => {
  selectedVessel.value.isKey = true;
  vesselsVisible.value = false;
  // 设置为重点
  if (selectedVesselData.value) {
    selectedVesselData.value.isKey = true;
  }
};

const onVesselsCancel = () => {
  vesselsVisible.value = false;
};

defineExpose({
  handleVesselsClick,
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
        gap: 25px;
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
