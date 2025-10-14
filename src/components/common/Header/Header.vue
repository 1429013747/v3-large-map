<template>
  <div class="header-container">
    <!-- 左侧区域 -->
    <div class="header-left">
      <!-- 返回按钮 -->
      <img src="@/assets/imgs/header-back.png" @click="handleReturn" />

      <!-- 分辨率选择 -->
      <!-- <div class="resolution-selector">
        <a-select
          v-model:value="selectedResolution"
          @change="handleResolutionChange"
          class="resolution-select"
          placeholder="选择分辨率"
          :options="resolutionOptions"
        />
      </div> -->
    </div>

    <!-- 中央标题区域 -->
    <p class="main-title">浙江省反走私智慧综合治理中心</p>

    <!-- 右侧区域 -->
    <div class="header-right">
      <!-- 日期和天气 -->
      <div class="date-weather">
        <div class="date-info">
          <span class="date">{{ currentDate }}</span>
          <span class="day">{{ currentDay }}</span>
        </div>
        <div class="weather-info">
          <span class="temperature">⛅ {{ temperature }}°C</span>
        </div>
      </div>

      <!-- 后台按钮 -->
      <a-button
        class="backend-btn"
        type="primary"
        ghost
        @click="handleBackend"
        :icon="h(DesktopOutlined)"
      >
        进入后台
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeftOutlined, DesktopOutlined } from "@ant-design/icons-vue";

const router = useRouter();

// 响应式数据
const selectedResolution = ref("1920x1080");
const temperature = ref(30);

// 分辨率选项
const resolutionOptions = [
  { value: "1920x1080", label: "1920x1080" },
  { value: "3840x2160", label: "3840x2160" },
];

// 计算属性 - 当前日期
const currentDate = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
});

// 计算属性 - 当前星期
const currentDay = computed(() => {
  const days = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  return days[new Date().getDay()];
});

// 方法
const handleReturn = () => {
  router.go(-1);
};

const handleResolutionChange = () => {
  console.log("分辨率切换为:", selectedResolution.value);
  // 这里可以添加分辨率切换的逻辑
};

const handleBackend = () => {
  console.log("进入后台");
  // 这里可以添加进入后台的逻辑
};

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
});
</script>

<style lang="scss" scoped>
.header-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: url("@/assets/imgs/header-bg.png") no-repeat center / 100% 100%;
  padding: 0 20px;
  z-index: 100;
  pointer-events: auto;
}

// 左侧区域
.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  img {
    width: 123px;
    height: 32px;
    cursor: pointer;
  }
}

// 返回按钮
.return-btn {
  :deep(.ant-btn) {
    background: rgba(15, 25, 35, 0.8) !important;
    border: 1px solid rgba(0, 255, 255, 0.4) !important;
    border-radius: 6px !important;
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    height: 36px !important;
    padding: 4px 16px !important;

    &:hover {
      background: rgba(0, 255, 255, 0.1) !important;
      border-color: rgba(0, 255, 255, 0.6) !important;
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.3) !important;
      color: #ffffff !important;
    }

    &:focus {
      background: rgba(0, 255, 255, 0.1) !important;
      border-color: rgba(0, 255, 255, 0.6) !important;
      box-shadow: 0 0 12px rgba(0, 255, 255, 0.3) !important;
      color: #ffffff !important;
    }
  }
}

// 分辨率选择器
.resolution-selector {
  display: flex;
  align-items: center;
  gap: 8px;

  .resolution-select {
    min-width: 150px;

    :deep(.ant-select-selector) {
      background: rgba(15, 25, 35, 0.8) !important;
      border: 1px solid rgba(0, 255, 255, 0.4) !important;
      border-radius: 6px !important;
      color: #ffffff !important;

      &:hover {
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 0 0 8px rgba(0, 255, 255, 0.2) !important;
      }
    }

    :deep(.ant-select-selection-item) {
      color: #ffffff !important;
    }

    :deep(.ant-select-arrow) {
      color: #ffffff !important;
    }

    &:focus-within {
      :deep(.ant-select-selector) {
        border-color: #00ffff !important;
        box-shadow: 0 0 12px rgba(0, 255, 255, 0.3) !important;
      }
    }
  }
}

// 中央标题区域
.header-center {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-title {
  margin: 0;
  font-family: YouSheBiaoTiHei, YouSheBiaoTiHei;
  font-weight: 600;
  font-size: 30px;
  color: #eff8fc;
  line-height: 29px;
  text-align: left;
  font-style: normal;
  text-transform: none;
  // 渐变字体
  background: linear-gradient(
    #ffffff 0%,
    #ffffff 26%,
    #e9f8ff 62%,
    #77baff 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
// 右侧区域
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: flex-end;

  // 后台按钮
  .backend-btn {
    box-shadow: inset 0px 0px 14px 0px #42a794;
    border-radius: 3px 3px 3px 3px;
    border: none;
    font-family: YouSheBiaoTiHei, YouSheBiaoTiHei;
    font-weight: bold;
    line-height: 15px;
    text-align: center;
    font-style: normal;
    padding: 2px 10px;
    text-transform: none;
    color: #0edfb8;
    margin-right: 110px;
    background: linear-gradient(0deg, #0edfb8 10%, #ffffff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    &:hover {
      color: #0edfb8 !important;
    }

    &:focus {
      color: #0edfb8 !important;
    }
  }
}

// 日期和天气信息
.date-weather {
  display: flex;
  align-items: center;
  gap: 16px;

  .date-info {
    display: flex;
    align-items: center;
    gap: 4px;
    .date {
      font-family: YouSheBiaoTiHei, YouSheBiaoTiHei;
      font-weight: 400;
      font-size: 16px;
      color: #ffffff;
      text-align: center;
    }

    .day {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      margin-top: 2px;
    }
  }

  .weather-info {
    display: flex;
    align-items: center;
    gap: 6px;

    .weather-icon {
      width: 20px;
      height: 20px;
      color: #ffaa00;
    }

    .temperature {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .header-container {
    padding: 0 15px;
  }

  .title-banner .main-title {
    font-size: 20px;
  }

  .decorative-line {
    margin: 0 10px;
  }
}

@media (max-width: 768px) {
  .header-container {
    height: 88px;
    padding: 0 10px;
  }

  .title-banner {
    padding: 8px 20px;

    .main-title {
      font-size: 16px;
    }
  }

  .return-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .resolution-selector .resolution-select {
    min-width: 120px;

    :deep(.ant-select-selector) {
      height: 28px !important;
      font-size: 12px !important;
    }
  }
}
</style>
