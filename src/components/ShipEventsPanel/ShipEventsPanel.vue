<template>
  <a-drawer
    v-model:open="visibleModal"
    title="船舶关注事件"
    placement="right"
    getContainer=".ui-container"
    :width="580"
    :closable="true"
    :mask="false"
    rootClassName="layer-box"
    class="layer-control-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>
    <div class="search-section">
      <div class="filter-row">
        <div class="filter-row-item">
          <div class="filter-row-item-dropdown">
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                {{ timeFilter || "时间" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleTimeChange('今天')">
                    今天
                  </a-menu-item>
                  <a-menu-item @click="handleTimeChange('本周')">
                    本周
                  </a-menu-item>
                  <a-menu-item @click="handleTimeChange('本月')">
                    本月
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <div class="filter-row-item-dropdown">
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                {{ locale || "位置" }}
                <DownOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleLocationChange('位置1')">
                    位置1
                  </a-menu-item>
                  <a-menu-item @click="handleLocationChange('位置2')">
                    位置2
                  </a-menu-item>
                  <a-menu-item @click="handleLocationChange('位置3')">
                    位置3
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
        <div class="filter-row-item2">
          MMSI:
          <a-input
            v-model:value="mmsiFilter"
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
          <a-dropdown>
            <a-button class="export-btn" size="small">
              导出全部
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="excel">导出Excel</a-menu-item>
                <a-menu-item key="pdf">导出PDF</a-menu-item>
                <a-menu-item key="csv">导出CSV</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
    <!-- 船舶关注事件列表 -->
    <div class="ship-events-table">
      <a-table
        :columns="shipEventColumns"
        :data-source="shipEventData"
        :pagination="false"
        size="small"
        class="ship-events-table-content"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operation'">
            <a-button type="link" size="small" class="detail-btn">
              详情
            </a-button>
          </template>
        </template>
      </a-table>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, computed } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["update:open"]);
const timeFilter = ref("");
const locationFilter = ref("");
const mmsiFilter = ref("");

const visibleModal = computed(() => props.open);

// 船舶事件表格列定义
const shipEventColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 60,
    align: "center",
  },
  {
    title: "船舶名称",
    dataIndex: "shipName",
    key: "shipName",
    width: 120,
  },
  {
    title: "船舶MMSI",
    dataIndex: "mmsi",
    key: "mmsi",
    width: 120,
  },
  {
    title: "事件类型",
    dataIndex: "eventType",
    key: "eventType",
    width: 120,
  },
  {
    title: "操作",
    key: "operation",
    width: 80,
    align: "center",
  },
];

// 船舶事件数据
const shipEventData = ref([
  {
    key: "1",
    index: 1,
    shipName: "huanyuan123",
    mmsi: "T2889389",
    eventType: "搭靠事件",
  },
  {
    key: "2",
    index: 2,
    shipName: "huanyuan123",
    mmsi: "T2889389",
    eventType: "搭靠事件",
  },
  {
    key: "3",
    index: 3,
    shipName: "huanyuan123",
    mmsi: "T2889389",
    eventType: "搭靠事件",
  },
  {
    key: "4",
    index: 4,
    shipName: "huanyuan123",
    mmsi: "T2889389",
    eventType: "搭靠事件",
  },
  {
    key: "5",
    index: 5,
    shipName: "huanyuan123",
    mmsi: "T2889389",
    eventType: "搭靠事件",
  },
  {
    key: "6",
    index: 6,
    shipName: "huanyuan123",
    mmsi: "T2889389",
    eventType: "搭靠事件",
  },
]);
const handleClose = () => {
  emit("update:open", false);
};
const handleTimeChange = (time) => {
  console.log("时间", time);
  timeFilter.value = time;
};
const handleLocationChange = (location) => {
  console.log("位置", location);
  locationFilter.value = location;
};

const handleQuery = () => {
  console.log("查询");
};
const handleReset = () => {
  timeFilter.value = "";
  locationFilter.value = "";
  mmsiFilter.value = "";
};
</script>

<style lang="scss" scoped>
.search-section {
  margin-bottom: 20px;
  background: transparent !important;

  .search-input {
    margin-bottom: 12px;

    &:hover {
      border-color: #00ffff;
      box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
    }

    &:focus {
      border-color: #00ffff;
      box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
    }
    :deep(.ant-input) {
      background: rgba(18, 28, 43, 0.1);
      border: none;
      color: #ffffff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    :deep(.ant-input-prefix) {
      color: rgba(255, 255, 255, 0.6);
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
      :deep(.ant-input) {
        font-size: 12px;
        height: 28px;
        border-radius: 0;
        background: rgba(18, 28, 43, 0.1);
      }
      .export-btn {
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
      background: transparent;
      border-radius: 0;
      padding: 0 16px;
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
      padding: 0 16px;
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

// 船舶事件表格样式
.ship-events-table {
  height: 750px;
  overflow: auto;
  :deep(.ship-events-table-content) {
    .ant-table-content {
      overflow: auto;
    }
    .ant-table {
      background: transparent;

      .ant-table-thead > tr > th {
        background: rgba(0, 255, 255, 0.1);
        border-bottom: none;
        color: #00ffff;
        font-weight: 600;
        font-size: 14px;
        padding: 8px 12px;
      }

      .ant-table-tbody > tr > td {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        padding: 8px 12px;
      }
    }
  }
  :deep(.ant-table-cell)::before {
    display: none;
  }

  .detail-btn {
    color: #00ffff;
    padding: 0;
    height: auto;
    font-size: 12px;

    &:hover {
      color: #ffffff;
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
</style>
