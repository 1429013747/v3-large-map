<script setup>
import autoScale from "@/utils/autoScale.js";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ThemeSwitch from "@/components/common/ThemeSwitch/ThemeSwitch.vue";

// 定义props
const props = defineProps({
  // 是否显示地图
  showMap: {
    type: Boolean,
    default: true,
  },
  // 是否启用UI缩放
  enableScale: {
    type: Boolean,
    default: true,
  },
  // 页面标题（可选，会覆盖路由meta中的title）
  title: {
    type: String,
    default: "",
  },
});

const route = useRoute();
const router = useRouter();

// 获取页面标题
const pageTitle = computed(() => {
  if (props.title) {
    return props.title;
  }

  // 根据路由路径返回默认标题
  const titleMap = {
    "/smart-map": "智慧云图分析平台",
  };

  return titleMap[route.path] || route.meta?.title || "浙江省反走私合防控平台";
});

// UI容器引用
const uiContainer = ref(null);

// 页面初始化
onMounted(async () => {
  if (props.enableScale && uiContainer.value) {
    // 初始化自适应缩放 - 只对UI容器进行缩放
    autoScale.init({
      dw: 1920,
      dh: 1080,
      el: ".ui-container",
      resize: true,
      ignore: [
        {
          el: ".ant-tooltip",
        },
        {
          el: ".ant-select-dropdown",
        },
        {
          el: ".element-selected-popup",
        },
        {
          el: ".element-hover-popup",
        },
        {
          el: ".ant-picker-dropdown",
        },
        // {
        //   el:'.ol-overlay-container'
        // },
        {
          el: ".common-popup-selected-container",
        },
        {
          el: ".common-popup-hover-container",
        },
        {
          el: ".ant-dropdown-menu",
        },
      ],
      //   transition: 0.3,
      //   delay: 300,
      //   limit: 0.1,
      cssMode: "scale",
      allowScroll: false,
    });
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (props.enableScale && uiContainer.value) {
    autoScale.off(uiContainer.value);
  }
});
</script>

<template>
  <div class="map-layout">
    <!-- 地图内容区域 - 全屏铺满，不受缩放影响 -->
    <div v-if="showMap" class="map-background">
      <slot name="map" />
    </div>

    <!-- 非地图页面背景 -->
    <div v-else class="page-background" />

    <!-- UI容器 - 受缩放影响 -->
    <div ref="uiContainer" class="ui-container">
      <!-- 页面内容区域 -->
      <main class="page-content">
        <slot />
      </main>

      <!-- 底部控制栏 -->
      <footer class="map-footer">
        <div class="control-tabs"></div>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--background-color);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  transition: background-color 0.3s ease;
}

// 深色主题背景渐变
:global(.dark) .map-layout {
  background: linear-gradient(135deg, #0a1929 0%, #1e3a5f 50%, #2c5f8a 100%);
}

// 浅色主题背景渐变
:global(.light) .map-layout {
  background: linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 50%, #bae7ff 100%);
}

// 地图背景区域 - 全屏不受缩放影响
.map-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

// 非地图页面背景
.page-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--background-color);
  z-index: 1;
  transition: background-color 0.3s ease;
}

// 深色主题页面背景
:global(.dark) .page-background {
  background: linear-gradient(135deg, #0a1929 0%, #1e3a5f 50%, #2c5f8a 100%);
}

// 浅色主题页面背景
:global(.light) .page-background {
  background: linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 50%, #bae7ff 100%);
}

// UI容器 - 受缩放影响
.ui-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
  color: #ffffff;

  > * {
    pointer-events: auto;
  }
}

// 主题切换按钮容器
.theme-switch-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: auto;
}

// 页面内容区域
.page-content {
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0px;
  z-index: 10;
  pointer-events: none;

  /* 子元素恢复交互 */
  > * {
    pointer-events: auto;
  }
}

// 底部控制栏
.map-footer {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: auto;

  .control-tabs {
    display: flex;
    align-items: center;
    gap: 0;
    width: 1043px;
    height: 67px;
    // background: rgba(15, 25, 35, 0.9);
    // border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 50px;
    padding: 0;
    // backdrop-filter: blur(10px);
    // box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transition: background-image 0.3s ease;

    // 各个tab的背景图片
    &.bg-tab1 {
      background-image: url("@/assets/tab1-bg.png");
    }

    &.bg-tab2 {
      background-image: url("@/assets/tab2-bg.png");
    }

    &.bg-tab3 {
      background-image: url("@/assets/tab3-bg.png");
    }
  }

  .control-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 100%;
    background: transparent;
    border: none;
    color: #b3e5fc;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-flow: row;
    align-items: center;

    // 第一个和第三个tab平分剩余宽度 (1043-224)/2 = 409.5px
    &:nth-child(1),
    &:nth-child(3) {
      flex: 1;
    }

    &:nth-child(1) {
      padding-left: 20%;
    }

    &:nth-child(3) {
      padding-right: 20%;
    }
    // 中间tab固定宽度224px
    &:nth-child(2) {
      width: 224px;
      flex-shrink: 0;
    }

    svg {
      margin-top: 4px;
    }
    .tab-icon {
      width: 24px;
      height: 24px;
      margin-bottom: 2px;
      transition: all 0.3s ease;
    }

    // 只对非active的图标应用currentColor，让active图标保持原本的渐变效果
    &:not(.active) .tab-icon {
      :deep(path) {
        fill: currentColor !important;
        stroke: currentColor !important;
        transition: fill 0.3s ease, stroke 0.3s ease;
      }

      :deep(g) {
        fill: currentColor !important;
        stroke: currentColor !important;
        transition: fill 0.3s ease, stroke 0.3s ease;
      }

      // 对非active图标隐藏渐变效果，使用纯色
      :deep(defs) {
        display: none;
      }
    }

    &:hover {
      color: #00ffff;
    }

    &.active {
      // 为选中状态的文字设置渐变效果
      span {
        background: linear-gradient(180deg, #ffffff 16.67%, #01eaff 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
      }

      // 选中状态的图标已经使用active版本的SVG，不需要额外样式处理
    }
  }
}
</style>
