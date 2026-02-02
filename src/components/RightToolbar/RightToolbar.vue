<!--
 * 右侧工具栏组件
 * @author: guoqiancheng
 * @since: 2025-09-27
-->
<script setup>
import { ref, inject, onMounted, computed } from "vue";
import { useDefaultConfigStore } from "@/stores/defaultConfig";

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
  "toggle",
  "model-center",
]);
const defaultConfigStore = useDefaultConfigStore();
const loginUser = computed(() => defaultConfigStore.getLoginUser);
// 当前激活的工具
const activeTool = ref(null);

// 工具栏显示状态
const isVisible = ref(true);

// 弹出菜单显示状态
const isPopupVisible = ref(false);

// 工具栏项目配置
const toolbarItems = ref([
  {
    id: "layer-control",
    label: "控制图层",
    icon: "layers",
    emit: "layer-control",
    active: false,
  },
  {
    id: "legend-display",
    label: "图例展示",
    icon: "legend",
    emit: "legend-display",
    active: false,
  },
  {
    id: "ship-events",
    label: "船舶事件",
    icon: "ship",
    handler: "handleShipEvents",
    emit: "ship-events",
    active: false,
  },
  {
    id: "comprehensive-search",
    label: "综合检索",
    icon: "search-comprehensive",
    emit: "comprehensive-search",
    active: false,
  },
  {
    id: "track-query",
    label: "轨迹查询",
    icon: "track-search",
    emit: "track-query",
    active: false,
  },
  {
    id: "gang-vehicle-query",
    label: "团伙车辆查询",
    icon: "group-car",
    emit: "gang-vehicle-query",
    active: false,
  },
  {
    id: "tide-query",
    label: "潮汐查询",
    icon: "tide-search",
    emit: "tide-query",
    active: false,
  },
  {
    id: "model-center",
    label: "模型中心",
    icon: "model-center",
    emit: "model-center",
    active: false,
  },
]);

// 事件处理函数

function handleToolbarItemClick(item) {
  console.log("工具栏项目被点击:", item);
  if (!item.active) {
    toolbarItems.value.forEach((item) => {
      item.active = false;
    });
  }
  // 切换激活状态
  item.active = !item.active;
  // 可以触发对应面板的显示
  emit(item.emit);
}

function handleMeasureDistance() {
  console.log("测距");
  emit("measure-distance");
  handleClosePopup();
}

function handleMeasureArea() {
  console.log("测面");
  emit("measure-area");
  handleClosePopup();
}

function handlePlotting() {
  console.log("标绘");
  emit("plotting");
  handleClosePopup();
}

function handleClear() {
  console.log("清空");
  emit("clear");
  handleClosePopup();
}

function handleLocate() {
  console.log("定位");
  // 可以定位到当前位置或指定位置
  emit("locate");
  handleClosePopup();
}

function handleTogglePopup() {
  isPopupVisible.value = !isPopupVisible.value;
}

function handleClosePopup() {
  isPopupVisible.value = false;
}

function handleToggle() {
  isVisible.value = !isVisible.value;
  console.log("工具栏显示状态:", isVisible.value ? "显示" : "隐藏");
}

function onClose({ id }) {
  toolbarItems.value.forEach((item) => {
    if (item.id === id) {
      item.active = false;
    }
  });
}

onMounted(async () => {});

defineExpose({
  onClose,
});
</script>

<template>
  <div class="right-toolbar-container">
    <!-- toggle按钮 -->
    <!-- <div class="toggle-btn" :class="{ collapsed: !isVisible }" @click="handleToggle">
      <img src="@/assets/imgs/toggle-icon.png" alt="toggle" />
    </div> -->
    <div class="right-toolbar" :class="{ collapsed: !isVisible }">
      <!-- 工具栏项目循环 -->
      <div class="toolbar-group">
        <div
          v-for="item in toolbarItems"
          :key="item.id"
          class="toolbar-item"
          :class="{ active: item.active }"
          @click="handleToolbarItemClick(item)"
        >
          <div class="toolbar-icon-container">
            <div class="toolbar-icon" :class="`${item.icon}-icon`">
              <div v-if="item.nums > 0" class="badge">
                {{ item.nums > 99 ? "99+" : item.nums }}
              </div>
            </div>
          </div>
          <div class="toolbar-label">
            {{ item.label }}
          </div>
        </div>
      </div>

      <!-- 分割线 -->
      <!-- <div class="divider"></div> -->
      <!-- 工具栏触发按钮 -->
      <div class="toolbar-trigger" @click.stop="handleTogglePopup">
        <div class="toolbar-icon-container">
          <div class="toolbar-icon">
            <img
              v-if="isPopupVisible"
              src="@/assets/imgs/ruler-a.png"
              alt="toolbar"
            >
            <img v-else src="@/assets/imgs/ruler.png" alt="toolbar">
          </div>
        </div>
        <div class="toolbar-label" :class="{ active: isPopupVisible }">
          工具栏
        </div>
      </div>

      <!-- 弹出菜单 -->
      <Teleport to="body">
        <div
          v-if="isPopupVisible"
          class="popup-overlay"
          @click="handleClosePopup"
        >
          <div class="popup-menu" @click.stop>
            <!-- 测距 -->
            <div class="popup-menu-item" @click="handleMeasureDistance">
              <div class="popup-menu-icon">
                <img src="@/assets/imgs/rule.png" alt="measure">
              </div>
              <div class="popup-menu-label">
                测距
              </div>
            </div>

            <!-- 测面 -->
            <div class="popup-menu-item" @click="handleMeasureArea">
              <div class="popup-menu-icon">
                <img src="@/assets/imgs/rectangle.png" alt="measure">
              </div>
              <div class="popup-menu-label">
                测面
              </div>
            </div>

            <!-- 标绘 -->
            <div class="popup-menu-item" @click="handlePlotting">
              <div class="popup-menu-icon">
                <img src="@/assets/imgs/draw-mark2.png" alt="measure">
              </div>
              <div class="popup-menu-label">
                标绘
              </div>
            </div>

            <!-- 清空 -->
            <div class="popup-menu-item" @click="handleClear">
              <div class="popup-menu-icon">
                <img src="@/assets/imgs/clear2.png" alt="measure">
              </div>
              <div class="popup-menu-label">
                清空
              </div>
            </div>

            <!-- 定位 -->
            <div class="popup-menu-item active" @click="handleLocate">
              <div class="popup-menu-icon">
                <img src="@/assets/imgs/los.png" alt="measure">
              </div>
              <div class="popup-menu-label">
                定位
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.right-toolbar-container {
  position: fixed;
  right: 0px;
  bottom: 0px;
  width: 90px;
  // height: 100%;
  z-index: 9999;

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
  right: 5px;
  bottom: 10%;
  width: 90px;
  padding: 16px 8px;
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
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }

  .toolbar-group {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 4px;
  }

  .toolbar-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    width: 100%;
  }

  .toolbar-icon-container {
    width: 60px;
    height: 60px;
    background: url("@/assets/imgs/menu2-bg.png") no-repeat center center;
    display: flex;
    align-items: center;
    justify-content: center;

    .toolbar-icon {
      position: relative;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;

      img {
        height: 30px;
        object-fit: cover;
      }
    }
  }

  .toolbar-label {
    font-size: 14px;
    color: #ffffff;
    text-align: center;
    max-width: 80px;
    line-height: 1.2;
    font-weight: 500;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    margin: 4px 0;
    &.active {
      color: #0ccef1;
    }
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

  // 模型中心图标
  .model-center-icon {
    background: url("@/assets/imgs/modal.png") no-repeat center center;
  }

  .toolbar-item.active .model-center-icon {
    background: url("@/assets/imgs/modal-a.png") no-repeat center center;
  }
}

// 弹出菜单样式
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.popup-menu {
  position: fixed;
  right: 90px;
  bottom: 10%;
  transform: translateY(-50%);
  background: rgba(32, 47, 66, 0.9);
  border: 1px solid rgba(12, 206, 241, 0.3);
  border-radius: 8px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10001;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

.popup-menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  position: relative;

  &:hover {
    background: rgba(12, 206, 241, 0.15);
  }
}

.popup-menu-icon {
  position: relative;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;

  img {
    height: 20px;
    object-fit: cover;
  }
}

.popup-menu-label {
  font-size: 12px;
  color: #ffffff;
  text-align: center;
  line-height: 1.2;
  font-weight: 500;
}
</style>
