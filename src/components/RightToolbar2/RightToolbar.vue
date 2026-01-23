<!--
 * 右侧工具栏组件
 * @author: guoqiancheng
 * @since: 2025-09-27
-->
<script setup>
import { useDefaultConfigStore } from "@/stores/defaultConfig";
import { onMounted, ref } from "vue";
// 定义emit事件
const emit = defineEmits([
  "layer-control",
  "legend-display",
  "ship-events",
  "comprehensive-search",
  "track-query",
  "gang-vehicle-query",
  "tide-query",
  "measure-distance",
  "measure-area",
  "plotting",
  "clear",
  "locate",
  "zoom-in",
  "zoom-out",
  "toggle"
]);
const defaultConfigStore = useDefaultConfigStore();
const loginUser = computed(() => defaultConfigStore.getLoginUser);
// 当前激活的工具
const activeTool = ref(null);

// 工具栏显示状态
const isVisible = ref(true);

// 是否展开
const isExpanded = ref(false);

// 工具栏项目配置
const toolbarItems = ref([
  {
    id: "layer-control",
    label: "控制图层",
    icon: "layers",
    emit: "layer-control"
  },
  {
    id: "legend-display",
    label: "图例展示",
    icon: "legend",
    emit: "legend-display"
  },
  {
    id: "ship-events",
    label: "船舶事件",
    icon: "ship",
    handler: "handleShipEvents",
    emit: "ship-events"
  },
  {
    id: "comprehensive-search",
    label: "综合检索",
    icon: "search-comprehensive",
    emit: "comprehensive-search"
  },
  {
    id: "track-query",
    label: "轨迹查询",
    icon: "track-search",
    emit: "track-query"
  },
  {
    id: "gang-vehicle-query",
    label: "团伙车辆查询",
    icon: "group-car",
    emit: "gang-vehicle-query"
  },
  {
    id: "tide-query",
    label: "潮汐查询",
    icon: "tide-search",
    emit: "tide-query"
  }
]);

// 事件处理函数

function handleToolbarItemClick(item) {
  console.log("工具栏项目被点击:", item);
  // 切换激活状态
  activeTool.value = item.id;
  // 可以触发对应面板的显示
  emit(item.emit);
}

function handleMeasureDistance() {
  console.log("测距");
  emit("measure-distance");
}

function handleMeasureArea() {
  console.log("测面");
  emit("measure-area");
}

function handlePlotting() {
  console.log("标绘");
  emit("plotting");
}

function handleClear() {
  console.log("清空");
  emit("clear");
}

function handleLocate() {
  console.log("定位");
  // 可以定位到当前位置或指定位置
  emit("locate");
}

function handleZoomIn() {
  console.log("放大");
  emit("zoom-in");
}

function handleZoomOut() {
  console.log("缩小");
  emit("zoom-out");
}

function handleToggleExpand() {
  isExpanded.value = !isExpanded.value;
}

function handleToggle() {
  isVisible.value = !isVisible.value;
  console.log("工具栏显示状态:", isVisible.value ? "显示" : "隐藏");
}

onMounted(async () => {});
</script>

<template>
  <div class="right-toolbar-container">
    <!-- toggle按钮 -->
    <div
      class="toggle-btn"
      :class="{ collapsed: !isVisible }"
      @click="handleToggle"
    >
      <img src="@/assets/imgs/toggle-icon.png" alt="toggle">
    </div>
    <div class="right-toolbar" :class="{ collapsed: !isVisible }">
      <!-- 工具栏项目循环 -->
      <div class="toolbar-group">
        <div
          v-for="item in toolbarItems"
          :key="item.id"
          class="toolbar-item"
          :class="{ active: activeTool === item.id }"
          @click="handleToolbarItemClick(item)"
        >
          <div class="toolbar-icon" :class="`${item.icon}-icon`">
            <div v-if="item.nums > 0" class="badge">
              {{ item.nums }}
            </div>
          </div>
          <div class="toolbar-label">
            {{ item.label }}
          </div>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider" />
      <div class="toolbar-item-group">
        <div class="toolbar-item-group-inner" :class="{ expanded: isExpanded }">
          <!-- 测距 -->
          <div
            class="toolbar-item"
            style="width: 100%"
            @click="handleMeasureDistance"
          >
            <div class="toolbar-icon">
              <!-- <div class="measure-distance-icon"></div> -->
              <img src="@/assets/imgs/ruler-a.png" alt="measure">
            </div>
            <div class="toolbar-label">
              测距
            </div>
          </div>

          <!-- 测面 -->
          <div class="toolbar-item" @click="handleMeasureArea">
            <div class="toolbar-icon">
              <!-- <div class="measure-area-icon"></div> -->
              <img src="@/assets/imgs/area-a.png" alt="measure">
            </div>
            <div class="toolbar-label">
              测面
            </div>
          </div>

          <!-- 标绘 -->
          <div class="toolbar-item" @click="handlePlotting">
            <div class="toolbar-icon">
              <!-- <div class="plotting-icon"></div> -->
              <img src="@/assets/imgs/draw-mark-a.png" alt="measure">
            </div>
            <div class="toolbar-label">
              标绘
            </div>
          </div>

          <!-- 清空 -->
          <div class="toolbar-item" @click="handleClear">
            <div class="toolbar-icon">
              <!-- <div class="clear-icon"></div> -->
              <img src="@/assets/imgs/clear-a.png" alt="measure">
            </div>
            <div class="toolbar-label">
              清空
            </div>
          </div>

          <!-- 定位 -->
          <div class="toolbar-item active" @click="handleLocate">
            <div class="toolbar-icon">
              <!-- <div class="locate-icon"></div> -->
              <img src="@/assets/imgs/dw-a.png" alt="measure">
            </div>
            <div class="toolbar-label">
              定位
            </div>
          </div>
        </div>
        <div
          class="toolbar-item-group-inner-expand"
          :class="{ expanded: isExpanded }"
          @click="handleToggleExpand"
        >
          <img src="@/assets/imgs/toggle.png" alt="">
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider" />

      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <div class="zoom-btn" @click="handleZoomIn">
          <div class="zoom-plus">
            +
          </div>
        </div>
        <div class="zoom-btn" @click="handleZoomOut">
          <div class="zoom-minus">
            -
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.right-toolbar-container {
  position: fixed;
  right: 0px;
  bottom: 0px;
  width: 90px;
  height: 100%;
  z-index: 999;
  & * {
    user-select: none;
  }
  .toggle-btn {
    position: absolute;
    top: 50%;
    left: -21px;
    transform: translateY(-50%);
    cursor: pointer;
    z-index: 1001;
    pointer-events: auto;
    transition: all 0.3s ease;
    img {
      height: 100px;
      object-fit: cover;
    }
    &.collapsed {
      transform: translate(470%, -50%);
    }
  }
}
.right-toolbar {
  position: fixed;
  right: 0px;
  bottom: 0px;
  width: 90px;
  height: 100%;
  background: #131d2c;
  padding: 16px 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 5px;
  pointer-events: auto;
  transition: all 0.3s ease;

  &.collapsed {
    transform: translateX(100%);
  }

  .toolbar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 18px 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  .toolbar-item:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .toolbar-group {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 4px;
  }
  .toolbar-item-group {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    .toolbar-item-group-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: 6px;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;

      &.expanded {
        max-height: 500px;
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .toolbar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        width: 100%;
        opacity: 0;
        transform: translateY(150px);

        &:nth-child(1) {
          transition-delay: 0.1s;
        }
        &:nth-child(2) {
          transition-delay: 0.15s;
        }
        &:nth-child(3) {
          transition-delay: 0.2s;
        }
        &:nth-child(4) {
          transition-delay: 0.25s;
        }
        &:nth-child(5) {
          transition-delay: 0.3s;
        }
      }

      &.expanded .toolbar-item {
        opacity: 1;
        transform: translateY(0);
      }

      .toolbar-label {
        font-size: 12px;
        color: #0ccef1;
        text-align: center;
        line-height: 1.2;
        font-weight: 500;
      }
    }
    .toolbar-item-group-inner-expand {
      cursor: pointer;
      align-self: flex-end;
      padding: 8px;
      color: #0ccef1;
      font-size: 12px;
      transition: all 0.3s ease;
      border-radius: 4px;
      margin: 20px 0 -10px 0;
      img {
        object-fit: contain;
      }

      &:hover {
        background: rgba(12, 206, 241, 0.1);
        transform: scale(1.05);
      }

      &::after {
        content: "";
        display: inline-block;
        margin-left: 4px;
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #0ccef1;
        transition: transform 0.3s ease;
      }

      &.expanded::after {
        transform: rotate(180deg);
      }
    }
  }

  .toolbar-icon {
    position: relative;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
    img {
      height: 24px;
      object-fit: cover;
    }
  }

  .toolbar-label {
    font-size: 12px;
    color: #ffffff;
    text-align: center;
    line-height: 1.2;
    font-weight: 500;
  }

  .active .toolbar-label {
    color: #0ccef1;
  }

  /* 图标样式 */
  .layer-icon {
    width: 20px;
    height: 16px;
    background: #ffffff;
    border-radius: 2px;
    position: relative;
  }

  .layer-icon::before,
  .layer-icon::after {
    content: "";
    position: absolute;
    width: 20px;
    height: 2px;
    background: #1e3a8a;
    left: 0;
  }

  .layer-icon::before {
    top: 4px;
  }

  .layer-icon::after {
    top: 8px;
  }

  .legend-icon {
    width: 20px;
    height: 16px;
    background: #ffffff;
    border-radius: 2px;
    position: relative;
  }

  .legend-icon::before,
  .legend-icon::after {
    content: "";
    position: absolute;
    width: 2px;
    height: 12px;
    background: #1e3a8a;
    left: 6px;
    top: 2px;
  }

  .legend-icon::after {
    left: 12px;
  }

  .ship-icon {
    width: 20px;
    height: 16px;
    background: #ffffff;
    border-radius: 8px 8px 0 0;
    position: relative;
  }

  .ship-icon::before {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    background: #1e3a8a;
    border-radius: 50%;
    top: 2px;
    left: 8px;
  }

  .search-icon {
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    position: relative;
  }

  .search-icon::after {
    content: "";
    position: absolute;
    width: 6px;
    height: 2px;
    background: #ffffff;
    transform: rotate(45deg);
    right: -2px;
    bottom: -2px;
  }

  .track-icon {
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 4px;
    position: relative;
  }

  .track-icon::before,
  .track-icon::after {
    content: "";
    position: absolute;
    width: 3px;
    height: 3px;
    background: #ffffff;
    border-radius: 50%;
  }

  .track-icon::before {
    top: 2px;
    left: 2px;
  }

  .track-icon::after {
    bottom: 2px;
    right: 2px;
  }
  .vehicle-icon {
    width: 20px;
    height: 12px;
    background: #ffffff;
    border-radius: 2px;
    position: relative;
  }

  .vehicle-icon::before,
  .vehicle-icon::after {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    background: #1e3a8a;
    border-radius: 50%;
    top: 6px;
  }

  .vehicle-icon::before {
    left: 2px;
  }

  .vehicle-icon::after {
    right: 2px;
  }

  .tide-icon {
    width: 16px;
    height: 16px;
    background: #ffffff;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    position: relative;
  }

  .tide-icon::before {
    content: "";
    position: absolute;
    width: 12px;
    height: 12px;
    background: #1e3a8a;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    top: 2px;
    left: 2px;
  }

  .measure-distance-icon {
    width: 20px;
    height: 4px;
    background: #06b6d4;
    position: relative;
  }

  .measure-distance-icon::before {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    background: #06b6d4;
    border-radius: 50%;
    top: -2px;
    left: 0;
  }

  .measure-distance-icon::after {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    background: #06b6d4;
    border-radius: 50%;
    top: -2px;
    right: 0;
  }

  .measure-area-icon {
    width: 16px;
    height: 16px;
    border: 2px solid #06b6d4;
    border-radius: 4px;
    position: relative;
  }

  .measure-area-icon::before,
  .measure-area-icon::after {
    content: "";
    position: absolute;
    width: 3px;
    height: 3px;
    background: #06b6d4;
    border-radius: 50%;
  }

  .measure-area-icon::before {
    top: 2px;
    left: 2px;
  }

  .measure-area-icon::after {
    bottom: 2px;
    right: 2px;
  }

  .plotting-icon {
    width: 20px;
    height: 4px;
    background: #06b6d4;
    border-radius: 2px;
    position: relative;
  }

  .plotting-icon::before {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    background: #06b6d4;
    border-radius: 50%;
    top: -2px;
    right: 0;
  }

  .clear-icon {
    width: 16px;
    height: 16px;
    background: #06b6d4;
    border-radius: 12px;
    position: relative;
  }

  .clear-icon::before {
    content: "";
    position: absolute;
    width: 12px;
    height: 2px;
    background: #ffffff;
    top: 7px;
    left: 2px;
    transform: rotate(45deg);
  }

  .clear-icon::after {
    content: "";
    position: absolute;
    width: 12px;
    height: 2px;
    background: #ffffff;
    top: 7px;
    left: 2px;
    transform: rotate(-45deg);
  }

  .locate-icon {
    width: 16px;
    height: 16px;
    border: 2px solid #06b6d4;
    border-radius: 50%;
    position: relative;
  }

  .locate-icon::before {
    content: "";
    position: absolute;
    width: 6px;
    height: 6px;
    background: #06b6d4;
    border-radius: 50%;
    top: 3px;
    left: 3px;
  }

  .locate-icon::after {
    content: "";
    position: absolute;
    width: 2px;
    height: 2px;
    background: #06b6d4;
    border-radius: 50%;
    top: 5px;
    left: 5px;
  }

  /* 徽章样式 */
  .badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background: #ef4444;
    color: #ffffff;
    font-size: 12px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #1e3a8a;
  }

  /* 分割线 */
  .divider {
    border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
    padding: 8px 0;
    width: 100%;
  }

  /* 缩放控制 */
  .zoom-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 10px;
  }

  .zoom-btn {
    width: 26px;
    height: 26px;
    background: #ffffff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .zoom-plus,
  .zoom-minus {
    font-size: 26px;
    font-weight: bold;
    color: #1e3a8a;
    line-height: 24px;
    user-select: none;
  }

  .zoom-plus {
    font-size: 24px;
  }
  // 新增：工具栏项目图标样式
  .layers-icon,
  .legend-icon,
  .ship-icon,
  .search-comprehensive-icon,
  .track-search-icon,
  .group-car-icon,
  .tide-search-icon {
    width: 20px;
    height: 20px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  // 控制图层图标
  .layers-icon {
    background: url("@/assets/imgs/layers.png") no-repeat center center;
  }
  .toolbar-item.active .layers-icon {
    background: url("@/assets/imgs/layers-a.png") no-repeat center center;
  }

  // 图例展示图标
  .legend-icon {
    background: url("@/assets/imgs/legend.png") no-repeat center center;
  }
  .toolbar-item.active .legend-icon {
    background: url("@/assets/imgs/legend-a.png") no-repeat center center;
  }

  // 船舶事件图标
  .ship-icon {
    background: url("@/assets/imgs/ship.png") no-repeat center center;
  }
  .toolbar-item.active .ship-icon {
    background: url("@/assets/imgs/ship-a.png") no-repeat center center;
  }

  // 综合检索图标
  .search-comprehensive-icon {
    background: url("@/assets/imgs/search-comprehensive.png") no-repeat center
      center;
  }
  .toolbar-item.active .search-comprehensive-icon {
    background: url("@/assets/imgs/search-comprehensive-a.png") no-repeat center
      center;
  }

  // 轨迹查询图标
  .track-search-icon {
    background: url("@/assets/imgs/track-search.png") no-repeat center center;
  }
  .toolbar-item.active .track-search-icon {
    background: url("@/assets/imgs/track-search-a.png") no-repeat center center;
  }

  // 团伙车辆查询图标
  .group-car-icon {
    background: url("@/assets/imgs/group-car.png") no-repeat center center;
  }
  .toolbar-item.active .group-car-icon {
    background: url("@/assets/imgs/group-car-a.png") no-repeat center center;
  }

  // 潮汐查询图标
  .tide-search-icon {
    background: url("@/assets/imgs/tide-search.png") no-repeat center center;
  }
  .toolbar-item.active .tide-search-icon {
    background: url("@/assets/imgs/tide-search-a.png") no-repeat center center;
  }
}
</style>
