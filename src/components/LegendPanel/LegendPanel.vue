<template>
  <a-drawer
    v-model:open="visibleModal"
    title="图例展示"
    placement="right"
    getContainer=".ui-container"
    :width="460"
    :closable="true"
    :mask="false"
    rootClassName="layer-box"
    class="layer-control-drawer"
  >
    <template #closeIcon>
      <CloseOutlined @click="handleClose" />
    </template>

    <div class="legend-content">
      <!-- 设备/对象分类 -->
      <div class="legend-section">
        <!-- <h3 class="section-title">设备/对象</h3> -->
        <div class="legend-grid">
          <div
            v-for="item in equipmentItems"
            class="legend-item"
            :key="item.id"
          >
            <div class="legend-icon1">
              <img :src="getIconPathMarkIcons(item.icon)" :alt="item.name" />
            </div>
            <span class="legend-label">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- 风险等级分类 -->
      <div class="legend-section">
        <!-- <h3 class="section-title">风险等级</h3> -->
        <div class="legend-grid">
          <div
            v-for="item in riskLevelItems"
            :key="item.id"
            class="legend-item"
          >
            <div class="legend-icon1" :class="item.class">
              <img :src="getIconPathMarkIcons(item.icon)" :alt="item.name" />
            </div>
            <span class="legend-label">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- 聚合类型分类 -->
      <div class="legend-section">
        <!-- <h3 class="section-title">聚合类型</h3> -->
        <div class="legend-grid">
          <div
            v-for="item in aggregationItems"
            :key="item.id"
            class="legend-item"
          >
            <div class="legend-icon">
              <img :src="getIconPathMarkIcons(item.icon)" :alt="item.name" />
            </div>
            <span class="legend-label">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- 船舶状态分类 -->
      <div class="legend-section">
        <!-- <h3 class="section-title">船舶状态</h3> -->
        <div class="legend-grid">
          <div
            v-for="item in vesselStatusItems"
            :key="item.id"
            class="legend-item"
          >
            <div class="legend-icon2" :class="item.class">
              <img :src="getIconPathMarkIcons(item.icon)" :alt="item.name" />
            </div>
            <span class="legend-label">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, computed } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import { getIconPathMarkIcons } from "@/utils/utilstools.js";
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
const visibleModal = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit("update:open", value);
  },
});;

// 设备/对象数据
const equipmentItems = ref([
  { id: 1, name: "无人机", icon: "icon1" },
  { id: 2, name: "摄像头", icon: "icon2" },
  { id: 3, name: "雷达", icon: "icon3" },
  { id: 4, name: "限高杆", icon: "icon4" },
  { id: 5, name: "可疑车辆", icon: "icon10" },
  { id: 3, name: "无走私村", icon: "icon5" },
  { id: 6, name: "低风险", icon: "icon6" },
]);

// 风险等级数据
const riskLevelItems = ref([
  { id: 1, name: "高风险", icon: "icon7" },
  { id: 2, name: "中风险", icon: "icon8" },
  { id: 3, name: "低风险", icon: "icon9" },
]);

// 聚合类型数据
const aggregationItems = ref([
  { id: 1, name: "风险点聚合", icon: "icon11" },
  { id: 2, name: "案件聚合", icon: "icon12" },
  { id: 3, name: "摄像头聚合", icon: "icon13" },
  { id: 4, name: "雷达聚合", icon: "icon14" },
]);

// 船舶状态数据
const vesselStatusItems = ref([
  { id: 1, name: "船舶关注", icon: "icon15" },
  { id: 2, name: "航行且转向", icon: "icon16" },
  { id: 3, name: "航行", icon: "icon17" },
  { id: 4, name: "静止", icon: "icon18" },
  { id: 5, name: "AIS和雷达融合", icon: "icon19" },
  { id: 6, name: "雷达", icon: "icon20" },
  { id: 7, name: "AIS信号", icon: "icon21" },
]);

// 关闭抽屉
const handleClose = () => {
  emit("update:open", false);
};
</script>

<style lang="scss" scoped>
.legend-drawer {
  :deep(.ant-drawer-content) {
    background: linear-gradient(
      135deg,
      rgba(15, 25, 35, 0.95) 0%,
      rgba(25, 35, 45, 0.95) 100%
    );
    backdrop-filter: blur(10px);
    border-left: 1px solid rgba(0, 255, 255, 0.3);
  }

  :deep(.ant-drawer-header) {
    background: linear-gradient(
      90deg,
      rgba(0, 255, 255, 0.1) 0%,
      rgba(0, 255, 255, 0.05) 100%
    );
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);
    padding: 16px 24px;

    .ant-drawer-title {
      color: #00ffff;
      font-size: 16px;
      font-weight: 600;
    }
  }

  :deep(.ant-drawer-body) {
    padding: 0;
    background: transparent;
  }

  :deep(.ant-drawer-close) {
    color: #00ffff;

    &:hover {
      color: #ffffff;
      background: rgba(0, 255, 255, 0.1);
    }
  }
}

.legend-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0px;
  height: 100%;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 255, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 255, 255, 0.5);
    }
  }
}

.legend-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  color: #00ffff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 30px;
    height: 1px;
    background: linear-gradient(90deg, #00ffff, transparent);
  }
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding-top: 10px;
  gap: 12px;
}

.legend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.legend-icon {
  img {
    object-fit: contain;
  }
}
.legend-icon1 {
  img {
    height: 36px;
    object-fit: contain;
  }
}
.legend-icon2 {
  img {
    height: 40px;

    object-fit: fill;
  }
}
.legend-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
