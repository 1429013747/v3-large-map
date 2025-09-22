<template>
  <a-drawer
    v-model:open="visibleModal"
    title="轨迹查询"
    placement="right"
    getContainer=".ui-container"
    :width="1080"
    :closable="true"
    :mask="false"
    rootClassName="layer-box"
    class="layer-control-drawer"
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
        :columns="trackQueryColumns"
        :data-source="trackQueryData"
        :pagination="paginationConfig"
        size="small"
        class="track-query-table-content"
        :on-change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operation'">
            <a-button
              type="link"
              size="small"
              class="detail-btn"
              @click="handleViewDetail(record)"
            >
              查看详情
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

const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit("update:open", value);
  },
});;

// 轨迹查询表格列定义
const trackQueryColumns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 60,
    align: "center",
  },
  {
    title: "查询单",
    dataIndex: "queryName",
    key: "queryName",
    width: 200,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    width: 120,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 80,
    align: "center",
  },
  {
    title: "操作",
    key: "operation",
    width: 80,
    align: "center",
  },
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
    status: "查询中",
  },
  {
    key: "2",
    index: 2,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "3",
    index: 3,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "4",
    index: 4,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    location: "涌泉镇",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
  {
    key: "5",
    index: 5,
    queryName: "浙123456,华盛123,华盛345的轨迹查询",
    createTime: "2025/6/15 1:18",
    status: "已完成",
  },
]);

// 分页配置
const paginationConfig = {
  current: 1,
  pageSize: 10,
  total: trackQueryData.value.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共${total}条`,
  pageSizeOptions: ["10", "20", "30", "50"],
  size: "small",
};

const handleClose = () => {
  emit("update:open", false);
};

const handleAddQuery = () => {
  console.log("添加查询单");
  // 这里可以打开添加查询单的弹窗或跳转到相关页面
};

const handleViewDetail = (record) => {
  console.log("查看详情", record);
  // 这里可以打开详情弹窗或跳转到详情页面
};

const handleTableChange = (pagination, filters, sorter) => {
  console.log("分页、过滤和排序变化:", pagination, filters, sorter);
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  paginationConfig.total = trackQueryData.value.length;
};
</script>

<style lang="scss" scoped>
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

      .ant-table-thead > tr > th {
        background: rgba(0, 255, 255, 0.1);
        border-bottom: none;
        color: #fff;
        font-weight: 600;
        font-size: 14px;
        padding: 12px 16px;
      }

      .ant-table-tbody > tr > td {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        padding: 12px 16px;
        vertical-align: top;
      }

      .ant-table-tbody > tr:hover > td {
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
</style>
