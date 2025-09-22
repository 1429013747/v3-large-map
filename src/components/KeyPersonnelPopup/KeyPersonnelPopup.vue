<template>
  <a-drawer
    v-model:open="visibleModal"
    title="重点人员"
    placement="left"
    getContainer=".ui-container"
    :width="430"
    :closable="true"
    :mask="false"
    class="key-personnel-drawer"
  >
    <template #closeIcon>
      <img
        height="24px"
        style="margin-top: -6px"
        src="@/assets/imgs/key-p.png"
        alt=""
      />
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
                {{ selectedGender || "性别" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleGenderChange('')">
                    全部
                  </a-menu-item>
                  <a-menu-item @click="handleGenderChange('男')">
                    男
                  </a-menu-item>
                  <a-menu-item @click="handleGenderChange('女')">
                    女
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <div class="filter-row-item-dropdown">
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                {{ selectedArea || "地区" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleAreaChange('')">
                    全部
                  </a-menu-item>
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
        </div>
        <div class="filter-row-item2">
          <span class="search-label">姓名:</span>
          <a-input
            v-model:value="nameFilter"
            placeholder=""
            style="width: 120px; flex: 0.65"
          />

          <a-button
            type="primary"
            style="flex: 0.1725"
            @click="handleQuery"
            class="query-btn"
          >
            查询
          </a-button>
          <a-button @click="handleReset" style="flex: 0.1725" class="reset-btn">
            重置
          </a-button>
        </div>
      </div>
    </div>

    <!-- 新增按钮 -->
    <div class="add-section">
      <a-button class="add-btn" size="small" @click="handleAddPersonnel">
        + 新增重点人员
      </a-button>
    </div>

    <!-- 人员列表 -->
    <div class="personnel-list">
      <div
        v-for="(personnel, index) in filteredPersonnel"
        :key="personnel.id"
        class="personnel-item"
        @click.stop="handlePersonnelClick(personnel)"
      >
        <div class="personnel-info">
          <div class="personnel-basic">
            <span class="personnel-name"
              >{{ personnel.name }} / {{ personnel.gender }}</span
            >
            <div class="personnel-area">地区: {{ personnel.area }}</div>
          </div>
          <div class="personnel-status">
            <a-tag class="status-tag">
              {{ personnel.status }}
            </a-tag>
          </div>
        </div>

        <div class="personnel-actions">
          <a-button
            type="link"
            @click.stop="handleDetail(personnel)"
            class="action-btn"
          >
            <FileTextOutlined />
            详情
          </a-button>
        </div>
      </div>
    </div>
  </a-drawer>

  <!-- 新增重点人员弹窗 -->
  <AddPersonnelModal
    v-model:visible="addPersonnelModalVisible"
    @submit="handleAddPersonnelSubmit"
    @cancel="handleAddPersonnelCancel"
  />

  <!-- 人员详情弹窗 -->
  <PersonnelDetailModal
    v-model:visible="personnelDetailModalVisible"
    :personnel-data="selectedPersonnelData"
  />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  CloseOutlined,
  FileTextOutlined,
  DownOutlined,
} from "@ant-design/icons-vue";
import AddPersonnelModal from "./components/AddPersonnelModal.vue";
import PersonnelDetailModal from "./components/PersonnelDetailModal.vue";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:visible", "close"]);

// 响应式数据
const selectedGender = ref("");
const selectedArea = ref("");
const nameFilter = ref("");
const addPersonnelModalVisible = ref(false);
const personnelDetailModalVisible = ref(false);
const selectedPersonnelData = ref(null);

const visibleModal = computed(() => props.visible);
// 重点人员数据
const personnelList = ref([
  {
    id: 1,
    name: "张某某",
    gender: "男",
    area: "台州市",
    status: "前科人员",
    phone: "138****1234",
    idCard: "330225****1234",
    vehicleType: "身份证",
    address: "台州市黄岩区某某街道",
    nationality: "中国",
    riskLevel: "高",
    lastUpdate: "2024-01-15",
  },
  {
    id: 2,
    name: "风张某某",
    gender: "男",
    area: "温岭市",
    status: "失业人员",
    phone: "139****5678",
    idCard: "330225****5678",
    vehicleType: "身份证",
    address: "温岭市某某镇",
    nationality: "中国",
    riskLevel: "中",
    lastUpdate: "2024-01-14",
  },
  {
    id: 3,
    name: "李某某",
    gender: "女",
    area: "黄岩区",
    status: "非本地",
    phone: "137****9012",
    idCard: "330225****9012",
    vehicleType: "身份证",
    address: "黄岩区某某乡",
    nationality: "中国",
    riskLevel: "低",
    lastUpdate: "2024-01-13",
  },
  {
    id: 4,
    name: "王某某",
    gender: "男",
    area: "台州市",
    status: "前科人员",
    phone: "136****3456",
    idCard: "330225****3456",
    vehicleType: "身份证",
    address: "台州市某某区",
    nationality: "中国",
    riskLevel: "高",
    lastUpdate: "2024-01-12",
  },
  {
    id: 5,
    name: "陈某某",
    gender: "女",
    area: "温岭市",
    status: "前科人员",
    phone: "135****7890",
    idCard: "330225****7890",
    vehicleType: "身份证",
    address: "温岭市某某街道",
    nationality: "中国",
    riskLevel: "中",
    lastUpdate: "2024-01-11",
  },
  {
    id: 6,
    name: "刘某某",
    gender: "男",
    area: "黄岩区",
    status: "前科人员",
    phone: "134****2345",
    idCard: "330225****2345",
    vehicleType: "身份证",
    address: "黄岩区某某镇",
    nationality: "中国",
    riskLevel: "高",
    lastUpdate: "2024-01-10",
  },
  {
    id: 7,
    name: "赵某某",
    gender: "女",
    area: "台州市",
    status: "前科人员",
    phone: "133****6789",
    idCard: "330225****6789",
    vehicleType: "身份证",
    address: "台州市某某县",
    nationality: "中国",
    riskLevel: "中",
    lastUpdate: "2024-01-09",
  },
]);

// 计算属性 - 筛选后的人员列表
const filteredPersonnel = computed(() => {
  let filtered = personnelList.value;

  // 按性别筛选
  if (selectedGender.value) {
    filtered = filtered.filter(
      (personnel) => personnel.gender === selectedGender.value
    );
  }

  // 按地区筛选
  if (selectedArea.value) {
    filtered = filtered.filter(
      (personnel) => personnel.area === selectedArea.value
    );
  }

  // 按姓名筛选
  if (nameFilter.value) {
    filtered = filtered.filter((personnel) =>
      personnel.name.includes(nameFilter.value)
    );
  }

  return filtered;
});

// 方法
const handleClose = () => {
  emit("update:visible", false);
};

const handleGenderChange = (gender) => {
  selectedGender.value = gender;
};

const handleAreaChange = (area) => {
  selectedArea.value = area;
};

const handleQuery = () => {
  // 查询逻辑已在计算属性中处理
  console.log("查询重点人员", {
    gender: selectedGender.value,
    area: selectedArea.value,
    name: nameFilter.value,
  });
};

const handleReset = () => {
  selectedGender.value = "";
  selectedArea.value = "";
  nameFilter.value = "";
};

const handleAddPersonnel = () => {
  addPersonnelModalVisible.value = true;
};

const handleAddPersonnelSubmit = (personnelData) => {
  // 添加新人员到列表
  const newPersonnel = {
    id: Date.now(),
    ...personnelData,
    lastUpdate: new Date().toISOString().split("T")[0],
  };
  personnelList.value.unshift(newPersonnel);
  addPersonnelModalVisible.value = false;
};

const handleAddPersonnelCancel = () => {
  addPersonnelModalVisible.value = false;
};

const handlePersonnelClick = (personnel) => {
  console.log("点击人员:", personnel);
};

const handleDetail = (personnel) => {
  selectedPersonnelData.value = personnel;
  personnelDetailModalVisible.value = true;
};


</script>

<style lang="scss" scoped>
.key-personnel-drawer {
  :deep(.ant-drawer-header) {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    border-bottom: 1px solid #374151;

    .ant-drawer-title {
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
    }
  }

  :deep(.ant-drawer-body) {
    background: #1f2937;
    padding: 16px;
    height: 100%;
    overflow-y: auto;
  }
}

.search-section {
  margin-bottom: 16px;

  .filter-row {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .filter-row-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      .filter-row-item-dropdown {
        flex: 1;
        .ant-dropdown-link {
          border-radius: 6px;
          color: #ffffff;
          text-decoration: none;
          transition: all 0.3s;
          font-size: 12px;
        }
      }
    }

    .filter-row-item2 {
      display: flex;
      align-items: center;
      gap: 8px;
      :deep(.ant-input) {
        height: 28px;
        border-radius: 0;
        background: rgba(18, 28, 43, 0.8);
        border: 1px solid rgba(163, 197, 217, 0.3);
        color: #ffffff;
        &:hover {
          box-shadow: none !important;
        }
        &:focus {
          box-shadow: none !important;
        }
      }
      .search-label {
        color: #ffffff;
        font-size: 14px;
        white-space: nowrap;
      }

      .query-btn {
        background: #1a4e5e;
        border-radius: 0;
        padding: 0 28px;
        height: 28px;
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
        padding: 0 28px;
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
}

.add-section {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;

  .add-btn {
    background: transparent;
    border: none;
    color: #05bbcf;
    letter-spacing: 1px;
    &:hover {
      background: #1a4e5e;
    }
  }
}

.personnel-list {
  height: calc(100% - 135px);
  overflow-y: auto;
  width: calc(100% + 6px);
  padding-right: 6px;
  .personnel-item {
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

    .personnel-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .personnel-basic {
        flex: 1;

        .personnel-name {
          display: block;
          color: #fff;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .personnel-area {
          color: #fff;
          font-size: 12px;
          padding-top: 10px;
        }
      }

      .personnel-status {
        .status-tag {
          margin: 0;
          font-size: 12px;
          border: 1px solid #10abbe;
          color: #fff;
          min-width: 70px;
          text-align: center;
        }
      }
    }

    .personnel-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;

      .action-btn {
        color: #fff;
        padding: 0;
        height: auto;
        font-size: 12px;
        &:hover {
          color: #05bbcf;
        }
      }
    }
  }
}

// 深色主题样式覆盖
:deep(.ant-dropdown-menu) {
  background: #374151;
  border: 1px solid #4b5563;

  .ant-dropdown-menu-item {
    color: #ffffff;

    &:hover {
      background: #4b5563;
    }
  }
}

:deep(.ant-input) {
  background: #374151;
  border-color: #4b5563;
  color: #ffffff;

  &:focus,
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  &::placeholder {
    color: #9ca3af;
  }
}
</style>
